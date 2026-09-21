/*
 * MockLedger - seeded, deterministic dummy chain, ported from brief/karmanetwork.html.
 *
 * Everything here is invented. No address, label, memo or event is taken from the live
 * chain, and no entry describes a person.
 *
 * Two deliberate differences from the prototype, both forced by moving from a page that
 * regenerates on every load to a server with permanent URLs:
 *
 * 1. Transactions are generated PER BLOCK from a seed of the block number, instead of 900
 *    transactions walked backwards from the current height. In the prototype every generated
 *    transaction drifted one block later each time the height advanced, so /tx/<id> and
 *    /block/<n> would have changed content every ten minutes. Here block n always holds the
 *    same transactions, the chain grows by appending, and a transaction id encodes its block
 *    so /tx/<id> resolves without an index of the whole chain. Density matches the prototype
 *    (about two transactions per three blocks).
 * 2. Balances are normalised so they sum to the issued supply exactly. The prototype floored
 *    each balance and lost up to ~1,200 к; the remainder is now handed out 1 к at a time.
 */

import {
  ADDRESS_LENGTH,
  FOUNDATION_THRESHOLD,
  LARGE_TRANSFER,
  LARGE_TRANSFER_WAIT_DAYS,
  MAX_SUPPLY,
  PER_BLOCK,
  SHARES,
  SHARE_PCT,
  SIGNER_TERM_MONTHS,
  TECH_THRESHOLD,
  TX_PREFIX_MIN,
  UPGRADE_NOTICE_DAYS,
  GENESIS,
  blockTime,
  heightAt,
  issuedAt,
  thresholdText,
} from "./rules";
import { K, dateStr, fmt } from "../format";
import {
  ADDRESSES_PER_PAGE,
  ADDRESS_TX_LIMIT,
  BLOCKS_PER_PAGE,
  TXS_PER_PAGE,
  type LedgerSource,
} from "./source";
import type {
  Address,
  AddressKind,
  Block,
  BlockDetail,
  Incident,
  Notice,
  Page,
  PendingTransfer,
  Runner,
  SearchResult,
  Signer,
  Supply,
  Tx,
  TxFilter,
  TxType,
  Upgrade,
  Wallets,
} from "./types";

/* ---------- deterministic rng (mulberry32, as in the prototype) ---------- */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const HEX = "0123456789abcdef";
function b58(r: () => number, n: number): string {
  let s = "";
  for (let i = 0; i < n; i++) s += B58[Math.floor(r() * B58.length)];
  return s;
}
function hex(r: () => number, n: number): string {
  let s = "";
  for (let i = 0; i < n; i++) s += HEX[Math.floor(r() * 16)];
  return s;
}

/* ---------- tx id <-> block ---------- */
// The first 8 hex chars of a tx id are the block number under a bijection on 32-bit ints
// (multiply by an odd constant, xor a mask). Looks random, decodes in O(1).
const ID_MUL = 0x9e3779b1;
const ID_XOR = 0x5bd1e995;
const ID_MUL_INV = (() => {
  let inv = ID_MUL; // Newton iteration for the inverse mod 2^32
  for (let i = 0; i < 5; i++) inv = Math.imul(inv, 2 - Math.imul(ID_MUL, inv));
  return inv >>> 0;
})();
const encodeBlock = (n: number): string =>
  ((Math.imul(n, ID_MUL) ^ ID_XOR) >>> 0).toString(16).padStart(8, "0");
const decodeBlock = (prefix8: string): number =>
  Math.imul((parseInt(prefix8, 16) ^ ID_XOR) | 0, ID_MUL_INV) >>> 0;
const txId = (block: number, idx: number): string =>
  encodeBlock(block) + hex(rng((Math.imul(block, 2654435761) + idx * 97 + 5000) >>> 0), 56);

/* ---------- runners ---------- */
const RUNNERS = [
  { id: "runner-1", op: "Andrey (protocol team)", city: "Frankfurt", since: 1, version: "v1.3.2", independent: false },
  { id: "runner-2", op: "[Independent operator]", city: "Berlin", since: 9120, version: "v1.3.2", independent: true },
  { id: "runner-3", op: "[Independent operator]", city: "Amsterdam", since: 14880, version: "v1.3.1", independent: true },
  { id: "runner-4", op: "[Independent operator]", city: "Tel Aviv", since: 24110, version: "v1.3.2", independent: true },
];
/** Index of the runner the prototype shows one block behind. */
const LAGGING_RUNNER = 2;

/* ---------- addresses ---------- */
export const FOUNDATION = "7fQm3AxV9nLkR2pD8sHwE4tYb6cJmZ1oNaQfUgXiKR9v";
export const TECH = "Bq2vL8TnH5kPwXr3JdZc9mYe7VfGaNtLsQ1uRi4oKz3wPe".slice(0, ADDRESS_LENGTH);
export const BRIDGE = "Hx9dN4VcTq2LmW8pRj5sYb3KeGa7nZfUd1oCiXtvHq7Ym".slice(0, ADDRESS_LENGTH);
export const FOUNDATION_SENT = 183_376;
export const TECH_SENT = 96_420;
const BRIDGE_BALANCE = 412_300;
const BRIDGE_SENT = 18_200;
const BRIDGE_FIRST = 24_990;
const USER_COUNT = 1205;
/** The prototype spread "first seen" over (height - 2000) at load; pinned so it never moves. */
const FIRST_SEEN_SPAN = 34_000;

interface UserSeed {
  addr: string;
  label: string;
  kind: AddressKind;
  weight: number;
  first: number;
  sentFrac: number;
}

// Height-invariant part of every generated address. Call order on rng(7) matches the
// prototype: all weights first, then (label roll, first seen, sent fraction) per address.
const USERS: UserSeed[] = (() => {
  const r = rng(7);
  const weights: number[] = [];
  for (let i = 1; i <= USER_COUNT; i++) weights.push(Math.pow(i, -0.85) * (0.75 + r() * 0.5));
  const out: UserSeed[] = [];
  for (let i = 0; i < USER_COUNT; i++) {
    const roll = r();
    let label = "";
    let kind: AddressKind = "user";
    if (i < 4 && roll < 0.9) {
      label = "Runner (self-labelled)";
      kind = "runner";
    } else if (roll < 0.22) {
      label = "Kreator (self-labelled)";
      kind = "kreator";
    }
    const first = 1 + Math.floor(Math.pow(r(), 1.6) * FIRST_SEEN_SPAN);
    const sentFrac = r() * 0.6;
    out.push({ addr: b58(rng(1000 + i), ADDRESS_LENGTH), label, kind, weight: weights[i], first, sentFrac });
  }
  return out;
})();
const WEIGHT_SUM = USERS.reduce((s, u) => s + u.weight, 0);
const TX_POOL = USERS.slice(0, 397);
const KREATORS = USERS.filter((u) => u.kind === "kreator").slice(0, 60);
const user = (i: number): string => USERS[i].addr;

interface Snapshot {
  height: number;
  list: Address[];
  byAddr: Map<string, Address>;
  holders: number;
}

function buildSnapshot(height: number): Snapshot {
  const issued = issuedAt(height);
  const fBal = SHARES.foundation * height - FOUNDATION_SENT;
  const tBal = SHARES.tech * height - TECH_SENT;
  const target = issued - fBal - tBal - BRIDGE_BALANCE;
  const list: Address[] = [
    { addr: FOUNDATION, label: "Foundation wallet", kind: "protocol", tag: `multisig ${thresholdText(FOUNDATION_THRESHOLD)}`, balance: fBal, first: 1, received: SHARES.foundation * height, sent: FOUNDATION_SENT, rank: 0 },
    { addr: TECH, label: "Tech Builders wallet", kind: "protocol", tag: `multisig ${thresholdText(TECH_THRESHOLD)}`, balance: tBal, first: 1, received: SHARES.tech * height, sent: TECH_SENT, rank: 0 },
    { addr: BRIDGE, label: "Bridge vault (wKARMA backing)", kind: "third", tag: "third party", balance: BRIDGE_BALANCE, first: BRIDGE_FIRST, received: BRIDGE_BALANCE + BRIDGE_SENT, sent: BRIDGE_SENT, rank: 0 },
  ];
  const balances = USERS.map((u) => Math.floor((u.weight / WEIGHT_SUM) * target));
  let remainder = target - balances.reduce((s, b) => s + b, 0);
  for (let i = 0; remainder > 0; i = (i + 1) % balances.length, remainder--) balances[i] += 1;
  USERS.forEach((u, i) => {
    const balance = balances[i];
    const sent = Math.floor(balance * u.sentFrac);
    list.push({ addr: u.addr, label: u.label, kind: u.kind, balance, first: u.first, received: balance + sent, sent, rank: 0 });
  });
  list.sort((a, b) => b.balance - a.balance);
  list.forEach((a, i) => (a.rank = i + 1));
  return { height, list, byAddr: new Map(list.map((a) => [a.addr, a])), holders: list.filter((a) => a.balance > 0).length };
}

/* ---------- curated outflows and signer events ---------- */
interface Curated {
  block: number;
  from: string;
  to: string;
  amount: number;
  memo: string;
  signed: string;
  type: TxType;
}
const CURATED: Curated[] = [
  { block: 37208, from: FOUNDATION, to: user(8), amount: 25000, memo: "Grant #8 - festival production, Kreator [name]", signed: "3 of 5", type: "Transfer" },
  { block: 36540, from: FOUNDATION, to: user(14), amount: 12400, memo: "Ambassador program Q3 - 6 recipients listed in memo", signed: "4 of 5", type: "Transfer" },
  { block: 34912, from: FOUNDATION, to: user(6), amount: 5000, memo: "Fraud response - refund to affected Kreator, case #3", signed: "3 of 5", type: "Transfer" },
  { block: 31980, from: FOUNDATION, to: user(11), amount: 18000, memo: "Grant #7 - Berlin scene, embassy setup", signed: "3 of 5", type: "Transfer" },
  { block: 29400, from: FOUNDATION, to: user(21), amount: 9600, memo: "Ambassador program Q2 - 5 recipients listed in memo", signed: "3 of 5", type: "Transfer" },
  { block: 26004, from: FOUNDATION, to: BRIDGE, amount: 60000, memo: "Liquidity seed to bridge vault - announced blk 24,990, 7-day wait observed", signed: "5 of 5", type: "Transfer" },
  { block: 22750, from: FOUNDATION, to: user(9), amount: 15000, memo: "Grant #4 - onboarding book production", signed: "3 of 5", type: "Transfer" },
  { block: 20100, from: FOUNDATION, to: user(17), amount: 8000, memo: "Grant #3 - Kreator directory verification work", signed: "3 of 5", type: "Transfer" },
  { block: 37010, from: TECH, to: user(5), amount: 14000, memo: "Work item #41 - staking cap implementation (v1.3)", signed: "2 of 3", type: "Transfer" },
  { block: 33200, from: TECH, to: user(5), amount: 12500, memo: "Work item #37 - ledger API v2", signed: "2 of 3", type: "Transfer" },
  { block: 30150, from: TECH, to: user(13), amount: 9800, memo: "Work item #33 - runner monitoring", signed: "3 of 3", type: "Transfer" },
  { block: 27600, from: TECH, to: user(5), amount: 16000, memo: "Work item #29 - wallet SDK", signed: "2 of 3", type: "Transfer" },
  { block: 18400, from: FOUNDATION, to: "", amount: 0, memo: "Upgrade v1.1 - threshold 2 of 2 → 3 of 5, two independent signers added", signed: "2 of 2", type: "Signer change" },
  { block: 24110, from: TECH, to: "", amount: 0, memo: "Upgrade v1.2 - threshold 2 of 2 → 2 of 3, independent runner operator added", signed: "2 of 2", type: "Signer change" },
];
const CURATED_BY_BLOCK = new Map<number, Curated[]>();
for (const c of CURATED) CURATED_BY_BLOCK.set(c.block, [...(CURATED_BY_BLOCK.get(c.block) ?? []), c]);

/* ---------- transactions, generated per block ---------- */
function generateBlockTxs(n: number): Tx[] {
  const time = blockTime(n);
  const out: Tx[] = [];
  const add = (t: Omit<Tx, "id" | "time" | "block">) => out.push({ ...t, id: txId(n, out.length), block: n, time });
  for (const c of CURATED_BY_BLOCK.get(n) ?? []) add({ from: c.from, to: c.to, amount: c.amount, memo: c.memo, type: c.type, signed: c.signed });
  if (n < 2) return out;
  const r = rng((Math.imul(n, 1000003) + 11) >>> 0);
  const c = r();
  const count = c < 0.5 ? 0 : c < 0.85 ? 1 : c < 0.98 ? 2 : 3;
  const pick = <T,>(list: T[]): T => list[Math.floor(r() * list.length)];
  for (let i = 0; i < count; i++) {
    const roll = r();
    if (roll < 0.45) {
      const k = pick(KREATORS);
      const from = pick(TX_POOL);
      add({ from: from.addr, to: k.addr, amount: Math.floor(50 + Math.pow(r(), 2.5) * 4000), memo: "", type: "Stake" });
    } else if (roll < 0.55) {
      const k = pick(KREATORS);
      const to = pick(TX_POOL);
      add({ from: k.addr, to: to.addr, amount: Math.floor(50 + Math.pow(r(), 2.5) * 2500), memo: "", type: "Unstake" });
    } else {
      const a1 = pick(TX_POOL);
      const a2 = pick(TX_POOL);
      if (a1 === a2) continue;
      add({ from: a1.addr, to: a2.addr, amount: Math.floor(10 + Math.pow(r(), 3) * 12000), memo: r() < 0.15 ? "ticket settlement" : "", type: "Transfer" });
    }
  }
  return out;
}

interface Chain {
  builtTo: number;
  /** Ascending by block. Pages read from the end. */
  all: Tx[];
  byType: Map<TxType, Tx[]>;
  byBlock: Map<number, Tx[]>;
  byAddr: Map<string, Tx[]>;
}

/* ---------- governance ---------- */
const SIGNERS_F: Signer[] = [
  { n: 1, name: "Roy", role: "Founder, Karma community", key: "Fk2n…9aQe", since: "genesis", ends: "Jan 2027" },
  { n: 2, name: "Andrey", role: "Protocol engineering", key: "Wd7b…3xLp", since: "genesis", ends: "Jan 2027" },
  { n: 3, name: "[Independent signer]", role: "[Name, affiliation, no financial relationship to founders]", key: "Qm4r…7vTn", since: "blk 18,400", ends: "May 2027" },
  { n: 4, name: "[Independent signer]", role: "[Name, affiliation, no financial relationship to founders]", key: "Zs9c…2kHb", since: "blk 18,400", ends: "May 2027" },
  { n: 5, name: "Seat open", role: "Community-elected. Nominations open until [DATE].", key: "-", since: "-", ends: "-", open: true },
];
const SIGNERS_T: Signer[] = [
  { n: 1, name: "Andrey", role: "Protocol engineering", key: "Wd7b…3xLp", since: "genesis", ends: "Jan 2027" },
  { n: 2, name: "Roy", role: "Founder, Karma community", key: "Fk2n…9aQe", since: "genesis", ends: "Jan 2027" },
  { n: 3, name: "[Independent runner operator]", role: "Operates runner-4", key: "Tn8v…5hRc", since: "blk 24,110", ends: "Jun 2027" },
];
const UPGRADES: Upgrade[] = [
  { v: "v1.4", block: null, title: "Reduce Foundation share to 10%; add Runner commitment to collective fund", signed: "0 of 5", status: "Proposed", proposed: "14 Sep 2026", notice: "14-day notice period starts on first signature", text: ["Foundation share of per-block issuance goes from 12% to 10%. The 2% moves to the Builders pool.", "Each Runner commits 20% of validator rewards to a collective fund for brand, awareness, grants and fraud response. The fund is a multisig outside the protocol; the protocol does not know about it.", "Requires 3 of 5 Foundation signatures and adoption by all 4 runners. No rule changes until both conditions are met."] },
  { v: "v1.3", block: 31200, title: "Staker cap: a single address counts once in unique_stakers", signed: "4 of 5", status: "Active", proposed: "2 Jul 2026", text: ["Closes the split-address exploit: the same key staking from several sub-addresses no longer inflates log₂(unique stakers + 1).", "No change to supply, block time or shares."] },
  { v: "v1.2", block: 24110, title: "Tech Builders wallet moved to 2-of-3 multisig; third signer added", signed: "3 of 5", status: "Active", proposed: "20 Jun 2026", text: ["Third signer: independent operator of runner-4.", "Spending policy published: payment only against listed work items."] },
  { v: "v1.1", block: 18400, title: "Foundation wallet moved from 2-of-2 to 3-of-5 multisig; two independent signers added", signed: "2 of 2", status: "Active", proposed: "2 May 2026", text: ["Two independent signers with no financial relationship to the founders.", "Transfers above 50,000 к wait 7 days after public announcement."] },
  { v: "v1.0", block: 1, title: "Genesis rules: 800M supply, 10-minute blocks, four-pool distribution", signed: "2 of 2", status: "Active", proposed: "12 Jan 2026", text: ["Maximum supply 800,000,000 к, fixed.", "Per-block issuance 400 к, halving every 210,240 blocks.", "Distribution: Builders 73%, Foundation 12%, Tech Builders 8%, Validators 7%."] },
];
const PENDING: PendingTransfer = { announced: "16 Sep 2026", amount: 40000, to: user(1), purpose: "Grant #9 - Berlin embassy", signed: "1 of 3", signer: "signer 2" };
const PENDING_ANNOUNCED_MS = Date.UTC(2026, 8, 16);
const V14_PROPOSED_MS = Date.UTC(2026, 8, 14);
const INCIDENT_MS = Date.UTC(2026, 3, 3);
const INCIDENTS: Incident[] = [
  { date: "3 Apr 2026", what: "runner-1 and runner-2 lost connectivity in the same data centre; block production paused.", duration: "4 h 10 min", resolution: "Runners moved to separate providers. Led to runner-3 and runner-4 being added." },
];

const versionAt = (n: number): string => {
  for (const u of UPGRADES) if (u.block !== null && n >= u.block) return u.v;
  return "v1.0";
};

/* ---------- notices: derived from the change log, the incident and the announced transfers ---------- */
function buildNotices(): Notice[] {
  const up = (v: string): Upgrade => UPGRADES.find((u) => u.v === v)!;
  const adopted = (v: string): Notice => {
    const u = up(v);
    const block = u.block!;
    return {
      slug: `${v.replace(".", "-")}-adopted`,
      date: blockTime(block),
      kind: "Upgrade adopted",
      title: `Upgrade ${v} adopted at block ${fmt(block)}`,
      body: [`${u.title}.`, ...u.text, `Proposed ${u.proposed}. Signed ${u.signed}. Active from block ${fmt(block)} on all runners.`],
      links: [{ href: `/governance/${v}`, label: `Upgrade ${v}` }, { href: `/block/${block}`, label: `Block ${fmt(block)}` }],
    };
  };
  const v11 = adopted("v1.1");
  v11.body.push("Seat 5 of the Foundation wallet is community-elected and open. Nominations open until [DATE].");
  const bridge = CURATED.find((c) => c.to === BRIDGE)!;
  const v14 = up("v1.4");
  const v10 = up("v1.0");
  const list: Notice[] = [
    {
      slug: "foundation-transfer-announced-grant-9",
      date: PENDING_ANNOUNCED_MS,
      kind: "Transfer announced",
      title: `Foundation wallet transfer announced: ${K(PENDING.amount)}`,
      body: [
        `Purpose: ${PENDING.purpose}.`,
        `Signatures so far: ${PENDING.signed} (${PENDING.signer}). The transfer executes when ${thresholdText(FOUNDATION_THRESHOLD)} signers have signed.`,
        `The amount is below ${K(LARGE_TRANSFER)}, so the ${LARGE_TRANSFER_WAIT_DAYS}-day wait does not apply. It is announced here because every Foundation wallet transfer is announced with amount, recipient and purpose before the first signature.`,
      ],
      links: [{ href: `/address/${FOUNDATION}`, label: "Foundation wallet" }, { href: `/address/${PENDING.to}`, label: "Recipient address" }],
    },
    {
      slug: "v1-4-proposed",
      date: V14_PROPOSED_MS,
      kind: "Upgrade proposed",
      title: "Upgrade v1.4 proposed",
      body: [`${v14.title}.`, ...v14.text, `Signatures: ${v14.signed}. The ${UPGRADE_NOTICE_DAYS}-day notice period starts on first signature.`],
      links: [{ href: "/governance/v1.4", label: "Upgrade v1.4" }],
    },
    adopted("v1.3"),
    {
      slug: "foundation-transfer-announced-bridge-vault",
      date: blockTime(BRIDGE_FIRST),
      kind: "Transfer announced",
      title: `Foundation wallet transfer above ${K(LARGE_TRANSFER)} announced: ${K(bridge.amount)}`,
      body: [
        `Purpose: liquidity seed to the bridge vault. Announced at block ${fmt(BRIDGE_FIRST)}.`,
        `The amount is above ${K(LARGE_TRANSFER)}, so signing waited ${LARGE_TRANSFER_WAIT_DAYS} days after this announcement.`,
        `Executed at block ${fmt(bridge.block)} on ${dateStr(blockTime(bridge.block))}, signed ${bridge.signed}.`,
      ],
      links: [{ href: `/address/${FOUNDATION}`, label: "Foundation wallet" }, { href: `/address/${BRIDGE}`, label: "Bridge vault" }, { href: `/block/${bridge.block}`, label: `Block ${fmt(bridge.block)}` }],
    },
    adopted("v1.2"),
    v11,
    {
      slug: "incident-block-production-paused",
      date: INCIDENT_MS,
      kind: "Incident",
      title: "Incident: block production paused for 4 h 10 min",
      body: [`What happened: ${INCIDENTS[0].what}`, `Duration: ${INCIDENTS[0].duration}.`, `Resolution: ${INCIDENTS[0].resolution}`],
      links: [{ href: "/status", label: "Network status" }, { href: "/runners", label: "Runners" }],
    },
    {
      slug: "genesis",
      date: GENESIS,
      kind: "Genesis",
      title: "Genesis: block 1 produced",
      body: [`${v10.title}.`, ...v10.text, `Signed ${v10.signed}.`],
      links: [{ href: "/governance/v1.0", label: "Upgrade v1.0" }, { href: "/block/1", label: "Block 1" }, { href: "/protocol", label: "The rules" }],
    },
  ];
  return list.sort((a, b) => b.date - a.date);
}

/* ---------- the source ---------- */
export class MockLedger implements LedgerSource {
  private snapshot: Snapshot | null = null;
  private chain: Chain = { builtTo: 0, all: [], byType: new Map(), byBlock: new Map(), byAddr: new Map() };
  private noticeList: Notice[] | null = null;

  constructor(private readonly now: () => number = Date.now) {}

  height(): number {
    return Math.max(1, heightAt(this.now()));
  }

  /** Balances depend on height; rebuilt once per block, not once per request. */
  private snap(): Snapshot {
    const h = this.height();
    if (!this.snapshot || this.snapshot.height !== h) this.snapshot = buildSnapshot(h);
    return this.snapshot;
  }

  /** Transactions never change once generated, so the chain only ever appends. */
  private txs(): Chain {
    const h = this.height();
    const c = this.chain;
    const index = (map: Map<string, Tx[]>, key: string, t: Tx) => {
      const list = map.get(key);
      if (list) list.push(t);
      else map.set(key, [t]);
    };
    for (let n = c.builtTo + 1; n <= h; n++) {
      const list = generateBlockTxs(n);
      if (!list.length) continue;
      c.byBlock.set(n, list);
      for (const t of list) {
        c.all.push(t);
        index(c.byType as Map<string, Tx[]>, t.type, t);
        if (t.from) index(c.byAddr, t.from, t);
        if (t.to && t.to !== t.from) index(c.byAddr, t.to, t);
      }
    }
    c.builtTo = Math.max(c.builtTo, h);
    return c;
  }

  private runnerFor(n: number, h: number): Runner {
    return this.runnerAt((n - 1) % RUNNERS.length, h);
  }
  private runnerAt(i: number, h: number): Runner {
    const r = RUNNERS[i];
    const behind = i === LAGGING_RUNNER;
    return { ...r, height: h - (behind ? 1 : 0), produced: Math.max(0, Math.floor((h - r.since) / RUNNERS.length)), status: behind ? "1 block behind" : "in sync" };
  }
  private blockOf(n: number, h: number): Block {
    return { n, time: blockTime(n), hash: hex(rng(n), 64), runner: this.runnerFor(n, h), txCount: this.txs().byBlock.get(n)?.length ?? 0, issued: PER_BLOCK, version: versionAt(n) };
  }

  async supply(): Promise<Supply> {
    const h = this.height();
    return { height: h, lastBlockTime: blockTime(h), issued: issuedAt(h), maxSupply: MAX_SUPPLY, perBlock: PER_BLOCK, holders: this.snap().holders, genesis: GENESIS };
  }

  async blocks(page: number): Promise<Page<Block>> {
    const h = this.height();
    const start = h - (page - 1) * BLOCKS_PER_PAGE;
    const items: Block[] = [];
    for (let n = start; n > Math.max(0, start - BLOCKS_PER_PAGE); n--) items.push(this.blockOf(n, h));
    return { items, page, per: BLOCKS_PER_PAGE, total: h };
  }

  async block(n: number): Promise<BlockDetail | null> {
    const h = this.height();
    if (!Number.isInteger(n) || n < 1 || n > h) return null;
    return { ...this.blockOf(n, h), txs: this.txs().byBlock.get(n) ?? [] };
  }

  async transactions(page: number, type: TxFilter): Promise<Page<Tx>> {
    const c = this.txs();
    const list = type === "all" ? c.all : (c.byType.get(type) ?? []);
    const end = list.length - (page - 1) * TXS_PER_PAGE;
    const items = end > 0 ? list.slice(Math.max(0, end - TXS_PER_PAGE), end).reverse() : [];
    return { items, page, per: TXS_PER_PAGE, total: list.length };
  }

  async tx(id: string): Promise<Tx | null> {
    if (!/^[0-9a-f]{8,64}$/.test(id)) return null;
    const n = decodeBlock(id.slice(0, 8));
    if (n < 1 || n > this.height()) return null;
    return (this.txs().byBlock.get(n) ?? []).find((t) => t.id.startsWith(id)) ?? null;
  }

  async addresses(page: number): Promise<Page<Address>> {
    const list = this.snap().list.filter((a) => a.balance > 0);
    return { items: list.slice((page - 1) * ADDRESSES_PER_PAGE, page * ADDRESSES_PER_PAGE), page, per: ADDRESSES_PER_PAGE, total: list.length };
  }

  async address(addr: string): Promise<Address | null> {
    return this.snap().byAddr.get(addr) ?? null;
  }

  async txForAddress(addr: string, limit: number = ADDRESS_TX_LIMIT): Promise<{ items: Tx[]; total: number }> {
    const list = this.txs().byAddr.get(addr) ?? [];
    return { items: list.slice(-limit).reverse(), total: list.length };
  }

  async labels(addrs: string[]): Promise<Record<string, string>> {
    const byAddr = this.snap().byAddr;
    const out: Record<string, string> = {};
    for (const a of addrs) {
      const label = byAddr.get(a)?.label;
      if (label) out[a] = label;
    }
    return out;
  }

  async wallets(): Promise<Wallets> {
    const s = this.snap();
    const h = this.height();
    const outgoing = (addr: string) => CURATED.filter((c) => c.from === addr && c.type === "Transfer" && c.block <= h).length;
    return {
      foundation: {
        id: "foundation",
        address: s.byAddr.get(FOUNDATION)!,
        sharePct: SHARE_PCT.foundation,
        perBlock: SHARES.foundation,
        threshold: thresholdText(FOUNDATION_THRESHOLD),
        signers: SIGNERS_F,
        signersNote: `${thresholdText(FOUNDATION_THRESHOLD)} required · terms ${SIGNER_TERM_MONTHS} months · recall by holder vote`,
        purpose: "brand, awareness, grants to Kreators, fraud response.",
        policy: `any transfer above ${K(LARGE_TRANSFER)} is announced ${LARGE_TRANSFER_WAIT_DAYS} days before signing.`,
        description: `Receives ${SHARE_PCT.foundation}% of every block's issuance. Funds brand, awareness, grants to Kreators and fraud response. Nothing leaves this wallet without ${FOUNDATION_THRESHOLD.required} of the ${FOUNDATION_THRESHOLD.of} signatures below.`,
        spendingPolicy: [
          "Any transfer is announced with amount, recipient and purpose before the first signature.",
          `Transfers above ${K(LARGE_TRANSFER)} wait ${LARGE_TRANSFER_WAIT_DAYS} days after announcement.`,
          "No transfer to a signer's own address or a related party.",
          "Every transaction carries a public memo. Recipients are named where they have consented.",
        ],
        pending: PENDING,
        outgoing: outgoing(FOUNDATION),
      },
      tech: {
        id: "tech",
        address: s.byAddr.get(TECH)!,
        sharePct: SHARE_PCT.tech,
        perBlock: SHARES.tech,
        threshold: thresholdText(TECH_THRESHOLD),
        signers: SIGNERS_T,
        signersNote: `${thresholdText(TECH_THRESHOLD)} required · terms ${SIGNER_TERM_MONTHS} months`,
        purpose: "pays people who build and maintain the protocol software.",
        policy: "paid against published work items; recipients listed per transaction.",
        description: `Receives ${SHARE_PCT.tech}% of every block's issuance. Pays people who build and maintain the protocol software, against published work items.`,
        spendingPolicy: ["Payment only against a work item listed in the public backlog.", "Recipient named in the memo.", "No payment to a signer without the other two signatures."],
        pending: null,
        outgoing: outgoing(TECH),
      },
      thirdParty: [s.byAddr.get(BRIDGE)!],
    };
  }

  async runners(): Promise<Runner[]> {
    const h = this.height();
    return RUNNERS.map((_, i) => this.runnerAt(i, h));
  }

  async upgrades(): Promise<Upgrade[]> {
    return UPGRADES;
  }

  async incidents(): Promise<Incident[]> {
    return INCIDENTS;
  }

  async notices(): Promise<Notice[]> {
    return (this.noticeList ??= buildNotices());
  }

  async search(raw: string): Promise<SearchResult> {
    const s = raw.trim();
    if (!s) return { kind: "empty" };
    if (/^\d[\d,]*$/.test(s)) return { kind: "block", n: Number(s.replace(/,/g, "")) };
    const snap = this.snap();
    if (snap.byAddr.has(s)) return { kind: "address", addr: s };
    const lower = s.toLowerCase();
    if (lower.length >= TX_PREFIX_MIN) {
      const t = await this.tx(lower);
      if (t) return { kind: "tx", id: t.id };
    }
    const addresses = snap.list.filter((a) => a.addr.toLowerCase().startsWith(lower) || (a.label && a.label.toLowerCase().includes(lower))).slice(0, 50);
    return { kind: "list", q: s, addresses };
  }
}
