import { MockLedger } from "./mock";
import { RpcLedger } from "./rpc";
import type { LedgerSource } from "./source";

// One instance per process: the mock caches its generated chain and appends as height grows.
let instance: LedgerSource | null = null;

export function getLedger(): LedgerSource {
  if (!instance) instance = process.env.LEDGER_MODE === "rpc" ? new RpcLedger() : new MockLedger();
  return instance;
}

export const isLive = (): boolean => process.env.LEDGER_MODE === "rpc";

/** Height for the nav pill. Never throws: a dead ledger must not take the whole layout down. */
export async function currentHeight(): Promise<number | null> {
  try {
    if (isLive()) return (await (await import("./live/data")).overview()).chain.latest_block.height;
    return (await getLedger().supply()).height;
  } catch {
    return null;
  }
}

/** Fails safe: the banner shows unless the env var is exactly "false". */
export const showDummyBanner = (): boolean => process.env.SHOW_DUMMY_BANNER !== "false";

export * from "./types";
export * from "./source";
