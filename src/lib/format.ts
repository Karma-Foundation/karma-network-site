/* Formatting helpers, ported from the prototype. к is the Cyrillic small ka. */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const fmt = (n: number): string => Math.round(n).toLocaleString("en-US");
export const K = (n: number): string => `${fmt(n)} к`;
export const pct = (a: number, b: number, d = 2): string => `${((100 * a) / b).toFixed(d)}%`;
export const short = (a: string): string => (a.length > 13 ? `${a.slice(0, 8)}…${a.slice(-4)}` : a);
export const shortTx = (id: string): string => `${id.slice(0, 10)}…`;

export function dateStr(ms: number): string {
  const d = new Date(ms);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export function timeStr(ms: number): string {
  const d = new Date(ms);
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${dateStr(ms)} ${hh}:${mm} UTC`;
}

export function ago(ms: number, now: number = Date.now()): string {
  const s = Math.max(0, (now - ms) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86400)} d ago`;
}

/** Whole minutes from now until `ms`, never negative. */
export const minsUntil = (ms: number, now: number = Date.now()): number => Math.max(0, Math.ceil((ms - now) / 60000));

/* ---------- live-ledger helpers: amounts arrive as decimal STRINGS ("29.200") ---------- */

/** Groups a decimal string without ever parsing it to a float. "1169680.000" -> "1,169,680"; "29.200" -> "29.2". */
export function fmtDec(s: string | number | null | undefined): string {
  if (s === null || s === undefined || s === "") return "-";
  const str = typeof s === "number" ? String(s) : s.trim();
  const m = /^(-?)(\d+)(?:\.(\d+))?$/.exec(str);
  if (!m) return str;
  const frac = (m[3] ?? "").replace(/0+$/, "");
  return `${m[1]}${m[2].replace(/\B(?=(\d{3})+(?!\d))/g, ",")}${frac ? `.${frac}` : ""}`;
}
export const KD = (s: string | number | null | undefined): string => `${fmtDec(s)} к`;
/** Display-only ratio of two decimal strings. Never used for arithmetic that is shown as an amount. */
export const pctDec = (a: string | number, b: string | number, d = 2): string => {
  const x = Number(a), y = Number(b);
  return Number.isFinite(x) && Number.isFinite(y) && y !== 0 ? `${((100 * x) / y).toFixed(d)}%` : "-";
};
export const isoMs = (iso: string | null | undefined): number => (iso ? Date.parse(iso) : NaN);
