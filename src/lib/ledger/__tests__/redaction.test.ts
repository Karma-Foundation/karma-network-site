import { describe, expect, it } from "vitest";
import { WITHHELD, safeValue } from "../live/data";
import { fmtDec } from "../../format";

describe("live value redaction", () => {
  it("shows plain numbers, booleans and hex ids of public keys", () => {
    for (const v of ["5", "0.1", "true", "false", "12833", "5000000.000", "0x4b41524d410001", "-1"]) expect(safeValue(v, true)).toBe(v);
  });
  it("withholds anything that could carry a person, even for a public key", () => {
    for (const v of ["547645366,490851443:Name", "123:Name", "a@b.c", "some text", "de644b65-44ba-441c-a848-96c1b4b705bc", "1,2"]) expect(safeValue(v, true)).toBe(WITHHELD);
  });
  it("withholds every value of a key the ledger does not list publicly", () => {
    expect(safeValue("5", false)).toBe(WITHHELD);
    expect(safeValue(null, false)).toBeNull();
  });
});

describe("fmtDec", () => {
  it("groups and trims decimal strings without floats", () => {
    expect(fmtDec("1169680.000")).toBe("1,169,680");
    expect(fmtDec("29.200")).toBe("29.2");
    expect(fmtDec("74958904.275")).toBe("74,958,904.275");
    expect(fmtDec("0.015")).toBe("0.015");
    expect(fmtDec("9007199254740993.001")).toBe("9,007,199,254,740,993.001");
    expect(fmtDec(null)).toBe("-");
  });
});
