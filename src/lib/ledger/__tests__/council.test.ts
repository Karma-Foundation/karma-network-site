/* The council's decision log and custody records (src/content). */
import { describe, expect, it } from "vitest";
import { CUSTODY, custodyLine, custodyType, type Custody } from "../../../content/custody";
import {
  DECISIONS, carriedOut, decisionId, decisionJson, decisionProblems, findDecision, sortedDecisions, voteCount,
  type Decision, type FullDecision, type WithheldDecision,
} from "../../../content/decisions";
import { join } from "node:path";
import { REPO, personNames, placeholders, read, textFiles } from "./guards";

const base: FullDecision = {
  number: 1, date: "2026-12-14", decision: "A test decision", kind: "Normal",
  votes: { 1: "yes", 2: "yes", 3: "yes" }, result: "Passed", detail: "A short paragraph.",
  cost: null, carriedOutBy: 2, needsTransaction: true, transactions: [],
};
const TX = "af8b4f2c-2df3-49ee-9951-71ed2b0bb213";
const withheld: WithheldDecision = {
  number: 2, date: "2026-12-21", decision: "A withheld test decision", kind: "Normal",
  votes: { 1: "yes", 2: "yes", 3: "abstained" }, result: "Passed", detailWithheld: true,
};

describe("the decision log file", () => {
  it("has no problems", () => {
    expect(decisionProblems()).toEqual([]);
  });
  it("names no person", () => {
    expect(personNames(JSON.stringify(DECISIONS))).toEqual([]);
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
    const bad: Decision[] = [base, { ...base, date: "14 Dec 2026", transactions: ["not-an-id"], cost: "1,200" }];
    const problems = decisionProblems(bad);
    expect(problems).toContain("D-001: number is used twice");
    expect(problems).toContain("D-001: date must be YYYY-MM-DD");
    expect(problems).toContain('D-001: "not-an-id" is not a transaction id');
    expect(problems).toContain("D-001: cost must be a plain number in к, or null");
  });
  it("serves seats, never names, in the API shape", () => {
    const j = decisionJson({ ...base, cost: "2500", transactions: [TX] });
    expect(j).toMatchObject({ number: "D-001", vote: "3-0", detail_withheld: false, carried_out: "Carried out", carried_out_by: "Seat 2", cost_karma: "2500", votes: { seat_1: "yes", seat_2: "yes", seat_3: "yes" }, transactions: [TX] });
    expect(decisionJson(base)).toMatchObject({ cost_karma: null });
  });
  it("states cost in к only", () => {
    expect(JSON.stringify(decisionJson({ ...base, cost: "2500" }))).not.toMatch(/usd/i);
    expect(decisionProblems([{ ...base, cost: { karma: "2500" } } as unknown as Decision])).toContain("D-001: cost must be a plain number in к, or null");
  });
});

describe("a decision with the detail withheld", () => {
  it("is valid without the withheld fields", () => {
    expect(decisionProblems([base, withheld])).toEqual([]);
  });
  it("serves what its page shows plus the flag, and the withheld fields are absent", () => {
    const j = decisionJson(withheld);
    expect(j).toEqual({
      number: "D-002", date: "2026-12-21", decision: "A withheld test decision", kind: "Normal",
      vote: "2-0 with 1 abstaining", result: "Passed", votes: { seat_1: "yes", seat_2: "yes", seat_3: "abstained" },
      detail_withheld: true,
    });
    for (const k of ["detail", "cost", "cost_karma", "carried_out_by", "carried_out", "transactions"]) expect(j).not.toHaveProperty(k);
  });
  it("does not leak a withheld field even if one is written in the file by mistake", () => {
    const leaky = { ...withheld, detail: "secret", cost: "9", carriedOutBy: 1, needsTransaction: true, transactions: [TX] } as unknown as Decision;
    const out = JSON.stringify(decisionJson(leaky));
    expect(out).not.toContain("secret");
    expect(out).not.toContain(TX);
    expect(decisionProblems([leaky])).toEqual([
      'D-002: the detail is withheld, so remove "detail" from the file',
      'D-002: the detail is withheld, so remove "cost" from the file',
      'D-002: the detail is withheld, so remove "carriedOutBy" from the file',
      'D-002: the detail is withheld, so remove "needsTransaction" from the file',
      'D-002: the detail is withheld, so remove "transactions" from the file',
    ]);
  });
  it("shows a carried-out status in the list, Not yet unless stated", () => {
    expect(carriedOut(withheld)).toBe("Not yet");
    const done: WithheldDecision = { ...withheld, carriedOut: "Carried out" };
    const none: WithheldDecision = { ...withheld, carriedOut: "No transaction" };
    expect(carriedOut(done)).toBe("Carried out");
    expect(carriedOut(none)).toBe("No transaction");
  });
  it("counts votes and sorts like any other decision", () => {
    expect(voteCount(withheld)).toBe("2-0 with 1 abstaining");
    expect(sortedDecisions([base, withheld]).map((d) => d.number)).toEqual([2, 1]);
    expect(findDecision("D-002", [base, withheld])?.detailWithheld).toBe(true);
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
    expect(personNames(JSON.stringify(CUSTODY))).toEqual([]);
    for (const c of Object.values(CUSTODY)) expect(c.signers).toEqual(["Signer 1", "Signer 2", "Signer 3"]);
  });
});

describe("the repo is public", () => {
  it("names no person: page sources, tests, docs, the README and the brief", () => {
    const files = [...textFiles("src", { tests: true }), ...textFiles("docs"), ...textFiles("brief"), ...textFiles("README.md")];
    expect(files.length).toBeGreaterThan(60);
    const hits = files.filter((f) => personNames(read(f)).length);
    expect(hits).toEqual([]);
  });
  it("finds a name when there is one", () => {
    // Built from pieces so that the word itself is not in this file.
    expect(personNames(`[REASON - one line from ${"An" + "drey"}]`)).toHaveLength(1);
    expect(personNames("the tech lead, the founder, Person 1, Seat 2")).toEqual([]);
  });
});

describe("page sources", () => {
  it("show no bracketed placeholder", () => {
    const hits = textFiles("src").flatMap((f) => placeholders(read(f)).map((p) => `${f.split("/src/")[1]}: ${p}`));
    expect(hits).toEqual([]);
    expect(placeholders("Independent operators: [DATE]. Setup guide [LINK], [Operator entity]")).toEqual(["[DATE]", "[LINK]", "[Operator entity]"]);
  });
  it("say the council's wallets hold к only: no other currency in the council's text and records", () => {
    for (const f of ["components/CouncilRules.tsx", "content/decisions.ts", "content/custody.ts", "content/HOW-TO-ADD-A-DECISION.md", "app/decisions/page.tsx", "app/decisions/[number]/page.tsx"]) {
      expect(read(join(REPO, "src", f))).not.toMatch(/USD|cash/i);
    }
  });
  it("name the council's two wallets the way the ledger does", () => {
    const text = read(join(REPO, "src/components/CouncilRules.tsx"));
    expect(text).toContain("the Foundation pool and the Tech Builders pool");
    expect(text).not.toMatch(/(?<!Tech )Builders pool/);
    expect(Object.keys(CUSTODY).sort()).toEqual(["foundation", "tech_builders"]);
  });
});
