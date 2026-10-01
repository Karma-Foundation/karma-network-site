/* Audit item 29: every page reads one ledger snapshot per block. */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TIP_TTL_MS, VOLATILE_TTL_MS, _resetSnapshotForTests, get, snapshotHeight } from "../live/api";

let height = 100;
const calls: string[] = [];

function respond(path: string) {
  calls.push(path);
  if (path.endsWith("/network/overview")) return { data: { chain: { latest_block: { height } } } };
  return { data: { path, height } };
}

beforeEach(() => {
  height = 100;
  calls.length = 0;
  _resetSnapshotForTests();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-01T12:00:00Z"));
  vi.stubGlobal("fetch", vi.fn(async (url: string) => new Response(JSON.stringify(respond(new URL(url).pathname + new URL(url).search)), { status: 200 })));
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const n = (p: string) => calls.filter((c) => c.endsWith(p)).length;

describe("ledger snapshot", () => {
  it("serves every read within one block from one fetch, at one height", async () => {
    const a = await get<{ height: number }>("/supply");
    const b = await get<{ height: number }>("/supply");
    expect(a).toEqual(b);
    expect(n("/supply")).toBe(1);
    expect(await snapshotHeight()).toBe(100);
  });

  it("does not re-check the tip inside TIP_TTL_MS, so pages rendered together agree", async () => {
    await get("/supply");
    height = 101;
    vi.advanceTimersByTime(TIP_TTL_MS - 1000);
    expect(await snapshotHeight()).toBe(100);
    expect(n("/network/overview")).toBe(1);
  });

  it("re-fetches everything once a new block is sealed, never serving the old block", async () => {
    await get("/supply");
    height = 101;
    vi.advanceTimersByTime(TIP_TTL_MS + 1000);
    const after = await get<{ height: number }>("/supply");
    expect(after.height).toBe(101);
    expect(n("/supply")).toBe(2);
    expect(await snapshotHeight()).toBe(101);
  });

  it("keeps a response for the whole block when the tip is unchanged, however long it is", async () => {
    await get("/supply");
    vi.advanceTimersByTime(9 * 60 * 1000);
    await get("/supply");
    expect(n("/supply")).toBe(1);
  });

  it("re-reads volatile endpoints after VOLATILE_TTL_MS even inside one block", async () => {
    await get("/runners/active", true);
    vi.advanceTimersByTime(VOLATILE_TTL_MS + 1000);
    await get("/runners/active", true);
    expect(n("/runners/active")).toBe(2);
  });

  it("does not keep a failed response", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      const p = new URL(url).pathname;
      if (p.endsWith("/supply")) return new Response("{}", { status: 502 });
      return new Response(JSON.stringify(respond(p)), { status: 200 });
    }));
    await expect(get("/supply")).rejects.toThrow();
    vi.stubGlobal("fetch", vi.fn(async (url: string) => new Response(JSON.stringify(respond(new URL(url).pathname)), { status: 200 })));
    await expect(get("/supply")).resolves.toMatchObject({ height: 100 });
  });
});
