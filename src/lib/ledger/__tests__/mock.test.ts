import { describe, expect, it } from "vitest";
import { ADDRESS_RE, BLOCK_MS, GENESIS, PER_BLOCK, SHARES, TX_ID_RE } from "../rules";
import { FOUNDATION, FOUNDATION_SENT, MockLedger, TECH, TECH_SENT } from "../mock";
import { short } from "../../format";

const HEIGHTS = [1, 2, 5000, 36423, 40000];
const at = (h: number) => new MockLedger(() => GENESIS + (h - 1) * BLOCK_MS + 1234);

async function everyAddress(l: MockLedger) {
  const first = await l.addresses(1);
  const pages = Math.ceil(first.total / first.per);
  const all = [...first.items];
  for (let p = 2; p <= pages; p++) all.push(...(await l.addresses(p)).items);
  return all;
}

describe("MockLedger supply identity", () => {
  it.each(HEIGHTS.filter((h) => h >= 5000))("height %i: issued = height x 400, balances sum to issued", async (h) => {
    const l = at(h);
    const s = await l.supply();
    expect(s.height).toBe(h);
    expect(s.issued).toBe(h * PER_BLOCK);
    expect(s.issued).toBe(h * 400);
    const all = await everyAddress(l);
    expect(all.reduce((sum, a) => sum + a.balance, 0)).toBe(s.issued);
    expect(all.every((a) => a.balance > 0)).toBe(true);
  });

  it("Foundation balance = 48 x height - 183,376; Tech = 32 x height - 96,420", async () => {
    for (const h of [5000, 36423, 40000]) {
      const l = at(h);
      expect((await l.address(FOUNDATION))!.balance).toBe(48 * h - 183376);
      expect((await l.address(FOUNDATION))!.balance).toBe(SHARES.foundation * h - FOUNDATION_SENT);
      expect((await l.address(TECH))!.balance).toBe(SHARES.tech * h - TECH_SENT);
    }
  });

  it("per-block shares sum to the per-block issuance", () => {
    expect(SHARES.builders + SHARES.foundation + SHARES.tech + SHARES.validators).toBe(PER_BLOCK);
  });
});

describe("MockLedger determinism", () => {
  it("a block holds the same transactions whatever the height", async () => {
    const a = await at(36423).block(36000);
    const b = await at(40000).block(36000);
    expect(a!.txs).toEqual(b!.txs);
    expect(a!.hash).toBe(b!.hash);
  });

  it("every tx id resolves back to its own tx, and ids are unique", async () => {
    const l = at(36423);
    const seen = new Set<string>();
    const first = await l.transactions(1, "all");
    const pages = Math.ceil(first.total / first.per);
    expect(first.total).toBeGreaterThan(20000);
    for (let p = 1; p <= pages; p += 37) {
      for (const t of (await l.transactions(p, "all")).items) {
        expect(t.id).toMatch(TX_ID_RE);
        expect(seen.has(t.id)).toBe(false);
        seen.add(t.id);
        expect(await l.tx(t.id)).toEqual(t);
        expect(t.from).not.toBe(t.to);
      }
    }
  });

  it("transactions are newest first and filters partition the list", async () => {
    const l = at(36423);
    const page = await l.transactions(1, "all");
    for (let i = 1; i < page.items.length; i++) expect(page.items[i - 1].block).toBeGreaterThanOrEqual(page.items[i].block);
    let sum = 0;
    for (const type of ["Transfer", "Stake", "Unstake", "Signer change"] as const) sum += (await l.transactions(1, type)).total;
    expect(sum).toBe(page.total);
    expect((await l.transactions(1, "Signer change")).total).toBe(2);
  });

  it("curated outflows not yet reached by the chain do not exist", async () => {
    expect((await at(36423).block(36540))).toBeNull();
    const b = await at(36540).block(36540);
    expect(b!.txs[0].memo).toContain("Ambassador program Q3");
  });
});

describe("MockLedger shapes", () => {
  it("every address matches the one address pattern and shortens cleanly", async () => {
    const all = await everyAddress(at(36423));
    expect(all.length).toBe(1208);
    expect(new Set(all.map((a) => a.addr)).size).toBe(all.length);
    for (const a of all) {
      expect(a.addr).toMatch(ADDRESS_RE);
      expect(short(a.addr)).toHaveLength(13);
    }
    expect(all.map((a) => a.rank)).toEqual(all.map((_, i) => i + 1));
  });

  it("labels are only protocol wallets, the third party, or self-published", async () => {
    const all = await everyAddress(at(36423));
    const labels = new Set(all.map((a) => a.label).filter(Boolean));
    expect([...labels].sort()).toEqual(["Bridge vault (wKARMA backing)", "Foundation wallet", "Kreator (self-labelled)", "Runner (self-labelled)", "Tech Builders wallet"]);
  });

  it("search resolves a block, an address, a tx id and a tx prefix", async () => {
    const l = at(36423);
    expect(await l.search("36,000")).toEqual({ kind: "block", n: 36000 });
    expect(await l.search(FOUNDATION)).toEqual({ kind: "address", addr: FOUNDATION });
    const t = (await l.transactions(1, "all")).items[0];
    expect(await l.search(t.id)).toEqual({ kind: "tx", id: t.id });
    expect(await l.search(t.id.slice(0, 10).toUpperCase())).toEqual({ kind: "tx", id: t.id });
    const list = await l.search("bridge");
    expect(list.kind === "list" && list.addresses.length).toBe(1);
    expect(await l.search("   ")).toEqual({ kind: "empty" });
  });

  it("no person is named anywhere in the mock data", async () => {
    const l = at(36423);
    const w = await l.wallets();
    const dump = JSON.stringify([w, await l.runners(), await l.upgrades(), await l.notices(), await l.incidents(), (await l.transactions(1, "Transfer")).items]);
    expect(dump).not.toMatch(/\b(Roy|Roei|Andrey)\b/);
    expect(w.foundation.signers.slice(0, 2).map((s) => s.name)).toEqual(["Person 1", "Person 2"]);
  });

  it("eight notices, newest first, none with an em or en dash", async () => {
    const n = await at(36423).notices();
    expect(n).toHaveLength(8);
    for (let i = 1; i < n.length; i++) expect(n[i - 1].date).toBeGreaterThan(n[i].date);
    expect(JSON.stringify(n)).not.toMatch(/[—–]/);
    expect(new Set(n.map((x) => x.slug)).size).toBe(8);
  });
});
