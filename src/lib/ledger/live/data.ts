import { asArray, get, getOrNull } from "./api";

/*
 * Typed readers over the public API. PRIVACY: nothing here may surface a person. The API is
 * already address-only, but three things it serves are still withheld from pages:
 *  - parameter DESCRIPTIONS (free text; some mention people by name),
 *  - envelope payloads beyond action and amount (profile ids, notes),
 *  - any actor id that is not a "system:" actor.
 */

export const ADDRESS_RE = /^[0-9a-f]{64}$/;
export const TX_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
export const MAX_SUPPLY = "800000000";
/** Halving schedule is code, not a parameter (protocol src/core/emission-schedule.ts). */
export const ERAS = [
  { upTo: 105_119, fullRate: 800 },
  { upTo: 210_239, fullRate: 400 },
  { upTo: null, fullRate: 200 },
] as const;
export const eraOf = (height: number) => ERAS.find((e) => e.upTo === null || height <= e.upTo)!;

export interface Overview {
  chain: { latest_block: { height: number; hash: string; sealed_at: string; signatures: number; signers_total: number }; block_interval_seconds: number };
  operators: { runners: { total: number; active: number; uptime_pct_3d: number }; validators: { total: number; active: number; blocks_archived: number } };
  wallets: { total: number; kreators: number };
  staking: { total_staked: number; active_stakes: number; operations_all_time: number };
  supply: { community_held: number; burned: number; total_supply: number };
  transactions: { all_time: number };
}
export interface SupplyIdentity {
  holds: boolean;
  total_emitted: string;
  total_allocation: string;
  total_in_wallets: string;
  total_burned: string;
  unreleased_pre_mine: string;
  left_side: string;
  right_side: string;
  discrepancy: string;
}
export interface LiveBlock {
  block_number: number;
  emission_amount: string;
  community_amount: string;
  foundation_amount: string;
  builders_amount: string;
  validators_amount: string;
  tx_reward_distributed: string;
  tx_reward_burned: string;
  staking_distributed: string;
  staking_burned: string;
  block_hash: string;
  prev_block_hash: string | null;
  created_at: string;
  intended_time: string | null;
  status: string;
  tx_set_hash: string | null;
  state_hash: string | null;
  proposer_id: string | null;
  signatures?: { signer_id: string; verified?: boolean }[] | null;
}
export interface LiveSignature { signer_id: string; public_key: string; signature: string; created_at: string }
export interface RewardCycle { cycle_type: string; total_pool: string; distributed_amount: string; burned_amount: string; profiles_count: number; activation_ratio: string }
export interface Envelope { id: string; action: string; amount: string | null; payload_hash: string; submitted_at: string }
export interface LiveTx { id: string; amount: string; fee_amount: string; fee_burned: string; created_at: string; type: string; sender_address: string | null; receiver_address: string | null }
export interface Param { key: string; value: string; data_type: string; category: string; updated_at: string }
export interface ParamChange { timestamp: string; key: string; before: string | null; after: string | null; actor: string }
export interface LiveRunner { name: string; endpoint: string | null; protocol_version: number | null; last_seen_at: string | null; stale: boolean; blocks_signed: number | null; last_signed_block: number | null; last_signed_at: string | null }

export const overview = () => get<Overview>("/network/overview", 30);
export const supplyIdentity = () => get<SupplyIdentity>("/supply", 120);

export async function blocks(limit: number, offset: number): Promise<LiveBlock[]> {
  return asArray<LiveBlock>(await get<unknown>(`/blocks?limit=${limit}&offset=${offset}`, 60));
}

export async function block(n: number) {
  const [b, rewards, env] = await Promise.all([
    getOrNull<{ block: LiveBlock; signatures: unknown }>(`/blocks/${n}`, 300),
    getOrNull<{ cycles: unknown }>(`/blocks/${n}/rewards`, 300).catch(() => null),
    getOrNull<{ envelopes: unknown }>(`/blocks/${n}/replay-envelopes`, 300).catch(() => null),
  ]);
  if (!b?.block) return null;
  const envelopes: Envelope[] = asArray<{ id: string; action: string; payload?: { amount?: unknown }; payload_hash: string; submitted_at: string }>(env?.envelopes).map((e) => ({
    id: String(e.id),
    action: String(e.action),
    amount: typeof e.payload?.amount === "string" ? e.payload.amount : null,
    payload_hash: String(e.payload_hash),
    submitted_at: String(e.submitted_at),
  }));
  return { block: b.block, signatures: asArray<LiveSignature>(b.signatures), cycles: asArray<RewardCycle>(rewards?.cycles), envelopes };
}

export async function transfers(limit: number, offset: number): Promise<LiveTx[]> {
  return asArray<LiveTx>(await get<unknown>(`/transactions?limit=${limit}&offset=${offset}`, 60));
}

/** The newest RECENT_WINDOW public transactions: the only way to find a tx or an address's activity today. */
export const RECENT_WINDOW = 500;
export async function recentTransfers(): Promise<LiveTx[]> {
  const pages = await Promise.all([0, 100, 200, 300, 400].map((o) => get<unknown>(`/transactions?limit=100&offset=${o}`, 120)));
  return pages.flatMap((p) => asArray<LiveTx>(p));
}

export async function mempoolTo(addr: string) {
  return asArray<{ sender_address: string | null; amount: string | null; submitted_at: string }>(await getOrNull<unknown>(`/mempool?to=${addr}`, 30));
}

export async function parameters(): Promise<Param[]> {
  return asArray<Param & { description?: string }>(await get<unknown>("/parameters", 300)).map((p) => ({
    key: String(p.key),
    value: safeValue(String(p.value), true) ?? WITHHELD,
    data_type: String(p.data_type),
    category: String(p.category),
    updated_at: String(p.updated_at),
  }));
}
export const paramMap = async (): Promise<Record<string, string>> => Object.fromEntries((await parameters()).map((p) => [p.key, p.value]));

/*
 * REDACTION. Free-text parameter values can carry identifiers, and the change log is not
 * guaranteed to filter them the way the parameter list does. So a value is shown only when
 * BOTH hold: its key is in the public /parameters list, and the value itself
 * is a plain number, boolean or hex id. Anything else is withheld. The key and the time of
 * the change stay visible: that a change happened is not personal data.
 */
export const WITHHELD = "[withheld]";
const SAFE_VALUE = /^(true|false|-?\d+(\.\d+)?|0x[0-9a-f]+)$/i;
export const safeValue = (v: string | null, keyIsPublic: boolean): string | null => (v === null ? null : keyIsPublic && SAFE_VALUE.test(v) ? v : WITHHELD);

export async function history(): Promise<ParamChange[]> {
  type Row = { timestamp: string; actor_id?: string; parameter_key: string; before_state?: { value?: unknown } | null; after_state?: { value?: unknown } | null };
  const val = (s: Row["before_state"]) => (s && s.value !== undefined && s.value !== null ? String(s.value) : null);
  const [rows, params] = await Promise.all([get<unknown>("/parameters/history?limit=200", 300), parameters()]);
  const publicKeys = new Set(params.map((p) => p.key));
  return asArray<Row>(rows).map((r) => {
    const key = String(r.parameter_key);
    const pub = publicKeys.has(key);
    return {
      timestamp: String(r.timestamp),
      key,
      before: safeValue(val(r.before_state), pub),
      after: safeValue(val(r.after_state), pub),
      actor: typeof r.actor_id === "string" && /^system:[a-z0-9_-]+$/.test(r.actor_id) ? r.actor_id : "operator",
    };
  });
}

export async function runners(): Promise<LiveRunner[]> {
  type A = { name: string; public_endpoint: string | null; last_seen_at: string | null; protocol_version: number | null; stale: boolean };
  type V = { signer_id: string; blocks_signed: number; last_signed_block: number; last_signed_at: string };
  const [a, v] = await Promise.all([get<unknown>("/runners/active", 30), get<unknown>("/validators", 60)]);
  const vs = new Map(asArray<V>(v).map((x) => [x.signer_id, x]));
  return asArray<A>(a)
    .map((r) => {
      const s = vs.get(r.name);
      let endpoint: string | null = null;
      try {
        endpoint = r.public_endpoint ? new URL(r.public_endpoint).host : null;
      } catch {}
      return { name: String(r.name), endpoint, protocol_version: r.protocol_version ?? null, last_seen_at: r.last_seen_at ?? null, stale: Boolean(r.stale), blocks_signed: s?.blocks_signed ?? null, last_signed_block: s?.last_signed_block ?? null, last_signed_at: s?.last_signed_at ?? null };
    })
    .sort((x, y) => x.name.localeCompare(y.name));
}

export const genesis = async () => (await getOrNull<{ block: LiveBlock }>("/blocks/0", 86_400))?.block ?? null;

/** Runner signatures only: the "protocol" row is the chain's own key, not a runner. */
export const runnerSigners = (sigs: { signer_id: string }[] | null | undefined): string[] =>
  [...new Set(asArray<{ signer_id: string }>(sigs).map((s) => s.signer_id).filter((id) => id !== "protocol"))].sort();
