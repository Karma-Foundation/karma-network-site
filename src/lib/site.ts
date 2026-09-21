export const BANNER_TEXT =
  "Simulation with generated dummy data. Numbers, addresses and dates are illustrative; bracketed text marks decisions still open.";

/** Parses ?p= into a page number clamped to [1, pages]. */
export function pageParam(raw: string | string[] | undefined): number {
  const n = Number(Array.isArray(raw) ? raw[0] : raw);
  return Number.isInteger(n) && n >= 1 && n <= 1_000_000 ? n : 1;
}
