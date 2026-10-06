/*
 * The Ethereum bridge, for the balance check on the Status page: Karma locked in the bridge
 * escrow (from the ledger's public bridge state) against wKARMA in existence (the token's
 * totalSupply on Ethereum mainnet, read from public RPCs). The two must agree to the
 * thousandth: every wKARMA is backed by one Karma held in escrow, and the 0.3% fee stays on
 * Karma in a separate reserve. All arithmetic is in integer thousandths; no floats.
 */
import { get } from "./api";

export const WKARMA = "0xb8986009B556aA5e8607AdF241371b690EfE9C27";
export const ETHERSCAN_TOKEN = `https://etherscan.io/token/${WKARMA}`;
const RPCS = ["https://rpc.mevblocker.io", "https://eth.drpc.org", "https://ethereum-rpc.publicnode.com"];
const TOTAL_SUPPLY_SELECTOR = "0x18160ddd";
const WEI_PER_MILLI = 1_000_000_000_000_000n;

export interface BridgeState {
  escrow: { public_address: string; live_balance: string };
  fee_reserve: string;
  bridge_out_seq: string;
  frozen: boolean;
  threshold_m: number;
  active_attestors: unknown[];
}
export const bridgeState = () => get<BridgeState>("/bridge/state", true);

const DEC_RE = /^\d+(\.\d{0,3})?$/;
/** "116.032" -> 116032n. Null for anything that is not a plain decimal with at most three places. */
export function toMilli(s: string | null | undefined): bigint | null {
  if (typeof s !== "string" || !DEC_RE.test(s)) return null;
  const [whole, frac = ""] = s.split(".");
  return BigInt(whole) * 1000n + BigInt(frac.padEnd(3, "0"));
}
/** 116032n -> "116.032"; negatives keep their sign. */
export function fromMilli(m: bigint): string {
  const neg = m < 0n; const a = neg ? -m : m;
  return `${neg ? "-" : ""}${a / 1000n}.${String(a % 1000n).padStart(3, "0")}`;
}

let supplyCache: { at: number; value: Promise<bigint | null> } | null = null;
const SUPPLY_TTL_MS = 30_000;

/** wKARMA totalSupply in thousandths, or null when no public RPC answers (never throws). */
export function wkarmaSupplyMilli(): Promise<bigint | null> {
  const now = Date.now();
  if (supplyCache && now - supplyCache.at < SUPPLY_TTL_MS) return supplyCache.value;
  const value = (async () => {
    for (const url of RPCS) {
      try {
        const res = await fetch(url, {
          method: "POST", cache: "no-store", signal: AbortSignal.timeout(8_000),
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_call", params: [{ to: WKARMA, data: TOTAL_SUPPLY_SELECTOR }, "latest"] }),
        });
        const json = (await res.json()) as { result?: unknown };
        if (typeof json.result !== "string" || !/^0x[0-9a-fA-F]+$/.test(json.result)) continue;
        const wei = BigInt(json.result);
        // The token is only ever minted in whole thousandths; a remainder would itself be a finding.
        return wei % WEI_PER_MILLI === 0n ? wei / WEI_PER_MILLI : null;
      } catch { /* next RPC */ }
    }
    return null;
  })();
  supplyCache = { at: now, value };
  value.then((v) => { if (v === null && supplyCache?.value === value) supplyCache = null; });
  return value;
}

export interface BridgeBalance {
  escrowAddress: string;
  escrow: string;      // all Karma in the escrow wallet
  feeReserve: string;  // the part that is collected fees
  locked: string;      // escrow minus fees: what backs wKARMA
  wkarma: string | null; // wKARMA totalSupply, null when Ethereum could not be read
  difference: string | null;
  balanced: boolean | null;
  frozen: boolean;
  signers: { threshold: number; total: number };
}

export async function bridgeBalance(): Promise<BridgeBalance | null> {
  const [state, supply] = await Promise.all([bridgeState().catch(() => null), wkarmaSupplyMilli()]);
  if (!state) return null;
  const escrow = toMilli(state.escrow?.live_balance);
  const fee = toMilli(state.fee_reserve);
  if (escrow === null || fee === null) return null;
  const locked = escrow - fee;
  return {
    escrowAddress: String(state.escrow.public_address),
    escrow: fromMilli(escrow), feeReserve: fromMilli(fee), locked: fromMilli(locked),
    wkarma: supply === null ? null : fromMilli(supply),
    difference: supply === null ? null : fromMilli(locked - supply),
    balanced: supply === null ? null : locked === supply,
    frozen: Boolean(state.frozen),
    signers: { threshold: Number(state.threshold_m) || 0, total: Array.isArray(state.active_attestors) ? state.active_attestors.length : 0 },
  };
}
