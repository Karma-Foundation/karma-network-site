/*
 * The live ledger: the protocol's PUBLIC read-only API, the same surface a standalone
 * validator reads. No key, no session, no admin route is used, by design: this site is
 * public, so it may only show what the chain already serves to anyone.
 *
 * ONE SNAPSHOT PER BLOCK (audit item 29). Every page reads the ledger through this file,
 * and every response is keyed to the chain tip it was read at:
 *  - the tip (GET /network/overview) is re-read at most every TIP_TTL_MS, so every page
 *    rendered within that window sees the same block height;
 *  - any other response is reused only while the tip is unchanged, and re-fetched as soon
 *    as a new block is sealed. Nothing from an earlier block is ever served;
 *  - a handful of endpoints that move inside a block (runner heartbeats, the mempool) are
 *    additionally capped at VOLATILE_TTL_MS.
 * Next's own fetch cache is NOT used (cache: "no-store"): its stale-while-revalidate served
 * day-old balances after quiet periods, which is how one page showed a Foundation balance
 * a full pre-mine release behind another.
 *
 * Per request, the tip is pinned with React cache(), so the fan-out of one page render
 * cannot straddle two blocks.
 */
import { cache } from "react";

const DEFAULT_BASE = "https://chain.karmaterminal.com/api/v1/public";
export const ledgerBase = (): string => (process.env.LEDGER_RPC_URL || DEFAULT_BASE).replace(/\/+$/, "");

export const TIP_TTL_MS = 30_000;
export const VOLATILE_TTL_MS = 30_000;
const MAX_ENTRIES = 500;
const TIP_PATH = "/network/overview";

export class LedgerError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

/** One uncached GET. A non-2xx is an ERROR even when its body is valid JSON. */
async function fetchJson(path: string): Promise<{ data: unknown }> {
  const res = await fetch(ledgerBase() + path, {
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
    headers: { accept: "application/json" },
  });
  if (!res.ok) throw new LedgerError(`ledger ${path} answered ${res.status}`, res.status);
  const json: unknown = await res.json();
  if (!json || typeof json !== "object" || !("data" in json)) throw new LedgerError(`ledger ${path}: no data envelope`, 502);
  return json as { data: unknown };
}

type Tip = { height: number; at: number; overview: Promise<{ data: unknown }> };
let tip: Tip | null = null;
let tipLoading: Promise<Tip> | null = null;

function heightOf(json: { data: unknown }): number {
  const h = (json.data as { chain?: { latest_block?: { height?: unknown } } })?.chain?.latest_block?.height;
  if (typeof h !== "number" || !Number.isFinite(h)) throw new LedgerError("ledger /network/overview: no tip height", 502);
  return h;
}

/** The chain tip, shared by every request for TIP_TTL_MS. */
async function sharedTip(now: number = Date.now()): Promise<Tip> {
  if (tip && now - tip.at < TIP_TTL_MS) return tip;
  if (tipLoading) return tipLoading;
  tipLoading = (async () => {
    const overview = fetchJson(TIP_PATH);
    const height = heightOf(await overview);
    tip = { height, at: Date.now(), overview };
    return tip;
  })().finally(() => {
    tipLoading = null;
  });
  return tipLoading;
}

/** The tip pinned for the lifetime of one server render. */
const requestTip = cache(() => sharedTip());

/** The block height every figure on the current page is read at. */
export async function snapshotHeight(): Promise<number> {
  return (await requestTip()).height;
}

type Entry = { height: number; at: number; value: Promise<{ data: unknown }> };
const memo = new Map<string, Entry>();

function remember(path: string, entry: Entry) {
  memo.delete(path);
  memo.set(path, entry);
  while (memo.size > MAX_ENTRIES) {
    const oldest = memo.keys().next().value;
    if (oldest === undefined) break;
    memo.delete(oldest);
  }
}

/**
 * GET one endpoint as of the current snapshot. `volatile` endpoints change inside a block
 * and are re-read after VOLATILE_TTL_MS even when the tip has not moved.
 */
export async function getRaw<T extends { data: unknown }>(path: string, volatile = false): Promise<T> {
  const t = await requestTip();
  if (path === TIP_PATH) return (await t.overview) as T;
  const now = Date.now();
  const hit = memo.get(path);
  if (hit && hit.height === t.height && (!volatile || now - hit.at < VOLATILE_TTL_MS)) return (await hit.value) as T;
  const value = fetchJson(path);
  remember(path, { height: t.height, at: now, value });
  value.catch(() => {
    if (memo.get(path)?.value === value) memo.delete(path);
  });
  return (await value) as T;
}

export async function get<T>(path: string, volatile = false): Promise<T> {
  return (await getRaw<{ data: T }>(path, volatile)).data;
}

export async function getOrNull<T>(path: string, volatile = false): Promise<T | null> {
  try {
    return await get<T>(path, volatile);
  } catch (e) {
    if (e instanceof LedgerError && (e.status === 404 || e.status === 400)) return null;
    throw e;
  }
}

export const asArray = <T,>(x: unknown): T[] => (Array.isArray(x) ? (x as T[]) : []);

/** Test hook: forget the snapshot. */
export function _resetSnapshotForTests() {
  tip = null;
  tipLoading = null;
  memo.clear();
}
