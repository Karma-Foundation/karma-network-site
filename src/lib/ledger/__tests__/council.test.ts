/* The council's decision log and custody records (src/content). */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CUSTODY, custodyLine, custodyType, type Custody } from "../../../content/custody";
import {
  DECISIONS, carriedOut, decisionId, decisionJson, decisionProblems, findDecision, sortedDecisions, voteCount, type Decision,
} from "../../../content/decisions";

const base: Decision = {
  number: 1, date: "2026-12-14", decision: "A test decision", kind: "Normal",
  votes: { 1: "yes", 2: "yes", 3: "yes" }, result: "Passed", detail: "A short paragraph.",
  cost: null, carriedOutBy: 2, needsTransaction: true, transactions: [],
};
const TX = "af8b4f2c-2df3-49ee-9951-71ed2b0bb213";

describe("the decision log file", () => {
  it("has no problems", () => {
    expect(decisionProblems()).toEqual([]);
  });
  it("names no person", () => {
    expect(JSON.stringify(DECISIONS)).not.toMatch(/\b(Roy|Roei|Andrey)\b/);
  });
});

describe("decisions", () => {
  it("numbers as D-001", () => {
    expect(decisionId(1)).toBe("D-001");
    expect(decisionId(42)).toBe("D-042");
    expect(decisionId(1234)).toBe("D-1234");
  });
  it("counts the vote from the seats", () => {
    expect(voteCount(base)).toBe("3-0");
    expect(voteCount({ ...base, votes: { 1: "yes", 2: "yes", 3: "abstained" } })).toBe("2-0 with 1 abstaining");
    expect(voteCount({ ...base, votes: { 1: "yes", 2: "no", 3: "no" } })).toBe("1-2");
  });
  it("says Not yet, No transaction, or carried out", () => {
    expect(carriedOut(base)).toBe("Not yet");
    expect(carriedOut({ ...base, needsTransaction: false })).toBe("No transaction");
    expect(carriedOut({ ...base, transactions: [TX] })).toBe("Carried out");
  });
  it("sorts newest first", () => {
    const list = [base, { ...base, number: 2, date: "2026-12-21" }, { ...base, number: 3, date: "2026-12-21" }];
    expect(sortedDecisions(list).map((d) => d.number)).toEqual([3, 2, 1]);
  });
  it("finds a decision by D-001, d-1 or 1, and nothing else", () => {
    for (const q of ["D-001", "d-1", "1", " D-001 "]) expect(findDecision(q, [base])?.number).toBe(1);
    for (const q of ["D-002", "abc", "", "D-", "1.5"]) expect(findDecision(q, [base])).toBeNull();
  });
  it("catches a bad entry in plain words", () => {
    const bad = [base, { ...base, date: "14 Dec 2026", transactions: ["not-an-id"], cost: { usdc: "1,200" } }];
    const problems = decisionProblems(bad);
    expect(problems).toContain("D-001: number is used twice");
    expect(problems).toContain("D-001: date must be YYYY-MM-DD");
    expect(problems).toContain('D-001: "not-an-id" is not a transaction id');
    expect(problems).toContain("D-001: cost must be plain numbers");
  });
  it("serves seats, never names, in the API shape", () => {
    const j = decisionJson({ ...base, cost: { karma: "2500" }, transactions: [TX] });
    expect(j).toMatchObject({ number: "D-001", vote: "3-0", carried_out: "Carried out", carried_out_by: "Seat 2", cost: { usdc: null, karma: "2500" }, votes: { seat_1: "yes", seat_2: "yes", seat_3: "yes" }, transactions: [TX] });
  });
});

describe("custody", () => {
  const single: Custody = { type: "single-key", threshold: { required: 2, of: 3 }, signers: ["Signer 1", "Signer 2", "Signer 3"], liveSince: null };

  it("today both council wallets are held with a single key, and the page says so", () => {
    expect(Object.keys(CUSTODY).sort()).toEqual(["foundation", "tech_builders"]);
    for (const c of Object.values(CUSTODY)) {
      expect(custodyLine(c)).toBe("Held with a single key today. Planned: 2 of 3 signatures - Signer 1, Signer 2, Signer 3. Not live yet.");
      expect(custodyType(c)).toBe("Single key");
    }
  });
  it("reads as live once the record is switched to multisig with a date", () => {
    const live: Custody = { ...single, type: "multisig", liveSince: "2026-12-01" };
    expect(custodyLine(live)).toBe("2 of 3 signatures - Signer 1, Signer 2, Signer 3. Live since 1 Dec 2026.");
    expect(custodyType(live)).toBe("Multisig");
  });
  it("never claims a multisig without a valid live date", () => {
    for (const liveSince of [null, "", "soon", "2026-13-40"]) {
      expect(custodyLine({ ...single, type: "multisig", liveSince })).toContain("Held with a single key today.");
    }
  });
  it("names signers by number only", () => {
    expect(JSON.stringify(CUSTODY)).not.toMatch(/\b(Roy|Roei|Andrey)\b/);
    for (const c of Object.values(CUSTODY)) expect(c.signers).toEqual(["Signer 1", "Signer 2", "Signer 3"]);
  });
});

describe("page sources", () => {
  const root = join(__dirname, "../../..");
  const files = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    if (e.isDirectory()) return e.name === "__tests__" ? [] : files(p);
    return /\.(tsx?|css)$/.test(e.name) ? [p] : [];
  });
  it("carry no person's name, placeholders included", () => {
    const hits = files(root).filter((f) => /\b(Roy|Roei|Andrey)\b/.test(readFileSync(f, "utf8")));
    expect(hits).toEqual([]);
  });
  it("name the council's two wallets the way the ledger does", () => {
    const text = readFileSync(join(root, "components/CouncilRules.tsx"), "utf8");
    expect(text).toContain("the Foundation pool and the Tech Builders pool");
    expect(text).not.toMatch(/(?<!Tech )Builders pool/);
    expect(Object.keys(CUSTODY).sort()).toEqual(["foundation", "tech_builders"]);
  });
});
