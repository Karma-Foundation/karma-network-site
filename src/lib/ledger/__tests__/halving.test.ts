/* Audit item 7: the halving copy follows the ledger's parameters. */
import { describe, expect, it } from "vitest";
import { eraRateNow, halvingRule } from "../live/data";

const LIVE = { cumulative_halving_enabled: "true", cumulative_halving_threshold_1: "84096000", cumulative_halving_threshold_2: "126144000" };

describe("halvingRule", () => {
  it("is emission-based when the ledger says so, with the thresholds from the API", () => {
    expect(halvingRule(LIVE)).toEqual({ kind: "emitted", thresholds: ["84096000", "126144000"] });
  });
  it("is height-based when the flag is off or absent", () => {
    expect(halvingRule({ ...LIVE, cumulative_halving_enabled: "false" })).toEqual({ kind: "height" });
    expect(halvingRule({})).toEqual({ kind: "height" });
  });
  it("never invents thresholds", () => {
    expect(halvingRule({ cumulative_halving_enabled: "true" })).toEqual({ kind: "unknown" });
    expect(halvingRule({ ...LIVE, cumulative_halving_threshold_2: "[withheld]" })).toEqual({ kind: "unknown" });
  });
});

describe("eraRateNow", () => {
  const emitted = halvingRule(LIVE);
  it("follows Karma emitted under the emission rule", () => {
    expect(eraRateNow(emitted, 500_000, "1169680.000")).toBe(800);
    expect(eraRateNow(emitted, 1, "84096000")).toBe(400);
    expect(eraRateNow(emitted, 1, "126144000.001")).toBe(200);
  });
  it("follows block height under the height rule", () => {
    expect(eraRateNow({ kind: "height" }, 105_119, "0")).toBe(800);
    expect(eraRateNow({ kind: "height" }, 105_120, "0")).toBe(400);
  });
  it("gives no rate when the rule is unknown", () => {
    expect(eraRateNow({ kind: "unknown" }, 1, "1")).toBeNull();
  });
});
