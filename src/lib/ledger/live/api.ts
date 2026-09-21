/*
 * The live ledger: the protocol's PUBLIC read-only API, the same surface a standalone
 * validator reads. No key, no session, no admin route is used, by design: this site is
 * public, so it may only show what the chain already serves to anyone.
 */

const DEFAULT_BASE = "https://chain.karmaterminal.com/api/v1/public";
export const ledgerBase = (): string => (process.env.LEDGER_RPC_URL || DEFAULT_BASE).replace(/\/+$/, "");

export class LedgerError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

/**
 * GET one endpoint. Every call has a floor of about 0.3-2 s, so responses are held in Next's
 * data cache; nothing on the chain changes faster than a block. A non-2xx is an ERROR even
 * when its body is valid JSON (a 401 body once flowed into .map and took a page down).
 */
export async function get<T>(path: string, revalidate = 60): Promise<T> {
  const res = await fetch(ledgerBase() + path, {
    next: { revalidate },
    signal: AbortSignal.timeout(15_000),
    headers: { accept: "application/json" },
  });
  if (!res.ok) throw new LedgerError(`ledger ${path} answered ${res.status}`, res.status);
  const json: unknown = await res.json();
  if (!json || typeof json !== "object" || !("data" in json)) throw new LedgerError(`ledger ${path}: no data envelope`, 502);
  return (json as { data: T }).data;
}

export async function getOrNull<T>(path: string, revalidate = 60): Promise<T | null> {
  try {
    return await get<T>(path, revalidate);
  } catch (e) {
    if (e instanceof LedgerError && (e.status === 404 || e.status === 400)) return null;
    throw e;
  }
}

export const asArray = <T,>(x: unknown): T[] => (Array.isArray(x) ? (x as T[]) : []);
