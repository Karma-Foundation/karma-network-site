export const BANNER_TEXT =
  "Simulation with generated dummy data. Numbers, addresses and dates are illustrative; bracketed text marks decisions still open.";

/** Parses ?p= into a page number clamped to [1, pages]. */
export function pageParam(raw: string | string[] | undefined): number {
  const n = Number(Array.isArray(raw) ? raw[0] : raw);
  return Number.isInteger(n) && n >= 1 && n <= 1_000_000 ? n : 1;
}

export const LIVE_BANNER_TEXT =
  "Live data, read from the Karma ledger through its public API. Where the ledger does not publish something yet, the page says so instead of estimating; bracketed text marks decisions still open.";
