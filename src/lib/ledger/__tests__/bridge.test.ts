import { describe, expect, it } from "vitest";
import { fromMilli, toMilli } from "../live/bridge";

describe("bridge balance arithmetic", () => {
  it("reads ledger decimals as thousandths and back", () => {
    expect(toMilli("116.032")).toBe(116032n);
    expect(toMilli("0.401")).toBe(401n);
    expect(toMilli("5")).toBe(5000n);
    expect(toMilli("12.5")).toBe(12500n);
    expect(fromMilli(115631n)).toBe("115.631");
    expect(fromMilli(0n)).toBe("0.000");
    expect(fromMilli(-7n)).toBe("-0.007");
  });
  it("refuses anything that is not a plain decimal", () => {
    expect(toMilli("1.0001")).toBeNull();
    expect(toMilli("1e3")).toBeNull();
    expect(toMilli("-1")).toBeNull();
    expect(toMilli(undefined)).toBeNull();
  });
  it("escrow minus fee reserve is what backs wKARMA", () => {
    const escrow = toMilli("116.032")!; const fee = toMilli("0.401")!;
    expect(fromMilli(escrow - fee)).toBe("115.631");
  });
});
