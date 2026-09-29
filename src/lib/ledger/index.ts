import { MockLedger } from "./mock";
import { RpcLedger } from "./rpc";
import type { LedgerSource } from "./source";

// One instance per process: the mock caches its generated chain and appends as height grows.
let instance: LedgerSource | null = null;

export function getLedger(): LedgerSource {
  if (!instance) instance = isLive() ? new RpcLedger() : new MockLedger();
  return instance;
}

/** Live is the default. The seeded simulation runs only when LEDGER_MODE is exactly "mock". */
export const isLive = (): boolean => process.env.LEDGER_MODE !== "mock";

/** Height for the nav pill. Never throws: a dead ledger must not take the whole layout down. */
export async function currentHeight(): Promise<number | null> {
  try {
    if (isLive()) return (await (await import("./live/data")).overview()).chain.latest_block.height;
    return (await getLedger().supply()).height;
  } catch {
    return null;
  }
}

/** The simulation banner is tied to the mode, not to a flag: dummy data can never show without it. */
export const showDummyBanner = (): boolean => !isLive();

export * from "./types";
export * from "./source";
