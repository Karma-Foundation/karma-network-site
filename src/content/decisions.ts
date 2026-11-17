/*
 * The Karma Council decision log. This file IS the log: the site, the detail pages and
 * the JSON API (/api/v1/decisions) all read DECISIONS below. There is no admin screen.
 * How to add a decision: see HOW-TO-ADD-A-DECISION.md next to this file.
 *
 * This file is public, like the rest of the repo.
 *
 * Rules for every entry:
 * - No names of people, anywhere. Members are Seat 1, Seat 2, Seat 3.
 * - No company, legal entity, director or jurisdiction.
 * - For a withheld decision, do not write the detail in this file at all.
 * - `number` is the next whole number. It is never reused and never changed: the page
 *   address (/decisions/D-001) is built from it.
 */

export type DecisionKind = "Normal" | "Payment to a member" | "Protected" | "Seat" | "Signer";
export type SeatVote = "yes" | "no" | "abstained";
export type Seat = 1 | 2 | 3;

export type CarriedOut = "Not yet" | "No transaction" | "Carried out";

/** What every decision publishes, withheld or not. */
interface DecisionHead {
  /** 1 becomes D-001. */
  number: number;
  /** The day the vote closed, YYYY-MM-DD. */
  date: string;
  /** The title: one line, plain words. Published even when the detail is withheld. */
  decision: string;
  kind: DecisionKind;
  /** How each seat voted. The vote count and "abstaining" are worked out from this. */
  votes: Record<Seat, SeatVote>;
  result: "Passed" | "Not passed";
}

/** A decision published in full. */
export interface FullDecision extends DecisionHead {
  detailWithheld?: false;
  /** What was decided: a short paragraph. */
  detail: string;
  /** Cost in к, as a plain number without separators, or null for "None". */
  cost: string | null;
  /** The seat that carries it out, or null. Never a name. */
  carriedOutBy: Seat | null;
  /** true when the decision is carried out by a ledger transaction. false shows "No transaction". */
  needsTransaction: boolean;
  /** Transaction ids on this ledger, as shown on /tx/<id>. Empty with needsTransaction shows "Not yet". */
  transactions: string[];
}

/**
 * A decision published by title only. The detail, the cost, who carries it out and the
 * transactions are not written in this file at all: the file is public.
 */
export interface WithheldDecision extends DecisionHead {
  detailWithheld: true;
  /** What the list shows under "Carried out". Left out, it shows "Not yet". */
  carriedOut?: CarriedOut;
}

export type Decision = FullDecision | WithheldDecision;

/*
 * EXAMPLE ENTRY - copy it into DECISIONS, newest first or in any order (the site sorts).
 *
 *   {
 *     number: 1,
 *     date: "2026-12-14",
 *     decision: "Grant 2,500 к from the Foundation pool for runner hosting",
 *     kind: "Normal",
 *     votes: { 1: "yes", 2: "yes", 3: "yes" },
 *     result: "Passed",
 *     detail: "The council approved a grant of 2,500 к from the Foundation pool to pay three months of hosting for the fourth runner.",
 *     cost: "2500",              // in к, or null for "None"
 *     carriedOutBy: 2,
 *     needsTransaction: true,
 *     transactions: [],          // add the transaction id here once it is paid
 *   },
 *
 * EXAMPLE ENTRY, DETAIL WITHHELD - the title is published, nothing else about the content.
 * Do not write the detail, the cost, who carries it out or the transactions here at all.
 *
 *   {
 *     number: 2,
 *     date: "2026-12-21",
 *     decision: "Approve a grant from the Foundation pool",
 *     kind: "Normal",
 *     votes: { 1: "yes", 2: "yes", 3: "yes" },
 *     result: "Passed",
 *     detailWithheld: true,
 *     carriedOut: "Not yet",     // optional: "Not yet", "Carried out" or "No transaction"
 *   },
 */
export const DECISIONS: Decision[] = [];

/* ---------- derived values: nothing below needs editing when a decision is added ---------- */

const SEATS: Seat[] = [1, 2, 3];
const KINDS: DecisionKind[] = ["Normal", "Payment to a member", "Protected", "Seat", "Signer"];
const CARRIED: CarriedOut[] = ["Not yet", "No transaction", "Carried out"];
const TX_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
/** What a withheld decision does not publish. */
const WITHHELD_FIELDS = ["detail", "cost", "carriedOutBy", "needsTransaction", "transactions"] as const;

export const decisionId = (n: number): string => `D-${String(n).padStart(3, "0")}`;

/** "3-0", or "2-0 with 1 abstaining". Yes first, then no. */
export function voteCount(d: Decision): string {
  const count = (v: SeatVote) => SEATS.filter((s) => d.votes[s] === v).length;
  const abstained = count("abstained");
  return `${count("yes")}-${count("no")}${abstained ? ` with ${abstained} abstaining` : ""}`;
}

export function carriedOut(d: Decision): CarriedOut {
  if (d.detailWithheld) return d.carriedOut ?? "Not yet";
  return d.transactions.length ? "Carried out" : d.needsTransaction ? "Not yet" : "No transaction";
}

/** Newest first; the same day falls back to the higher number first. */
export const sortedDecisions = (list: Decision[] = DECISIONS): Decision[] =>
  [...list].sort((a, b) => (a.date === b.date ? b.number - a.number : a.date < b.date ? 1 : -1));

/** Accepts "D-001", "d-1" or "1". */
export function findDecision(raw: string, list: Decision[] = DECISIONS): Decision | null {
  const m = /^(?:d-)?(\d{1,6})$/i.exec(raw.trim());
  if (!m) return null;
  const n = Number(m[1]);
  return list.find((d) => d.number === n) ?? null;
}

/** Every problem in the file, in plain words. Empty when it is fine. The unit test runs this. */
export function decisionProblems(list: Decision[] = DECISIONS): string[] {
  const out: string[] = [];
  const seen = new Set<number>();
  for (const d of list) {
    const id = decisionId(d.number);
    if (!Number.isInteger(d.number) || d.number < 1) out.push(`${id}: number must be a whole number from 1`);
    if (seen.has(d.number)) out.push(`${id}: number is used twice`);
    seen.add(d.number);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d.date) || Number.isNaN(Date.parse(`${d.date}T00:00:00Z`))) out.push(`${id}: date must be YYYY-MM-DD`);
    if (!d.decision.trim() || /\n/.test(d.decision)) out.push(`${id}: decision must be one line`);
    if (!KINDS.includes(d.kind)) out.push(`${id}: unknown kind`);
    for (const s of SEATS) if (!["yes", "no", "abstained"].includes(d.votes[s])) out.push(`${id}: Seat ${s} has no vote`);
    if (/[—–]/.test(d.decision)) out.push(`${id}: use a single hyphen, not a long dash`);
    if (d.detailWithheld) {
      // The file is public: a withheld decision must not carry what it withholds.
      for (const k of WITHHELD_FIELDS) if (k in d) out.push(`${id}: the detail is withheld, so remove "${k}" from the file`);
      if (d.carriedOut !== undefined && !CARRIED.includes(d.carriedOut)) out.push(`${id}: carriedOut must be "Not yet", "Carried out" or "No transaction"`);
      continue;
    }
    if (typeof d.detail !== "string" || !d.detail.trim()) { out.push(`${id}: detail is empty`); continue; }
    if (d.carriedOutBy !== null && !SEATS.includes(d.carriedOutBy)) out.push(`${id}: carriedOutBy must be 1, 2, 3 or null`);
    for (const t of d.transactions) if (!TX_RE.test(t)) out.push(`${id}: "${t}" is not a transaction id`);
    if (d.cost !== null && (typeof d.cost !== "string" || !/^\d+(\.\d+)?$/.test(d.cost))) out.push(`${id}: cost must be a plain number in к, or null`);
    if (/[—–]/.test(d.detail)) out.push(`${id}: use a single hyphen, not a long dash`);
  }
  return out;
}

/**
 * The shape served by /api/v1/decisions. A withheld decision is served with what its page
 * shows and the flag; the withheld fields are absent, not empty.
 */
export function decisionJson(d: Decision) {
  const head = {
    number: decisionId(d.number),
    date: d.date,
    decision: d.decision,
    kind: d.kind,
    vote: voteCount(d),
    result: d.result,
    votes: { seat_1: d.votes[1], seat_2: d.votes[2], seat_3: d.votes[3] },
  };
  if (d.detailWithheld) return { ...head, detail_withheld: true as const };
  return {
    ...head,
    detail_withheld: false as const,
    carried_out: carriedOut(d),
    detail: d.detail,
    cost_karma: d.cost,
    carried_out_by: d.carriedOutBy ? `Seat ${d.carriedOutBy}` : null,
    transactions: d.transactions,
  };
}
