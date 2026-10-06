import { describe, expect, it } from "vitest";
import { fromMilli, toMilli } from "../live/bridge";

describe("bridge balance arithmetic", () => {
  it("reads ledger decimals as thousandths and back", () => {
    expect(toMilli("116.032")).toBe(BigInt(116032));
    expect(toMilli("0.401")).toBe(BigInt(401));
    expect(toMilli("5")).toBe(BigInt(5000));
    expect(toMilli("12.5")).toBe(BigInt(12500));
    expect(fromMilli(BigInt(115631))).toBe("115.631");
    expect(fromMilli(BigInt(0))).toBe("0.000");
    expect(fromMilli(BigInt(-7))).toBe("-0.007");
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
