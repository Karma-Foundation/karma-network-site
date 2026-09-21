/*
 * Every rule-bearing number on the site lives here and nowhere else.
 *
 * These are the PROTOTYPE's rules. Several differ from the live chain (pre-mine, fee,
 * per-block amount, genesis date, address format, multisig thresholds - see the README,
 * "What changes when mock becomes rpc"). Page copy reads these values instead of
 * repeating them, so the day the ledger goes live the swap is this one file.
 */

export const MAX_SUPPLY = 800_000_000;
export const GENESIS = Date.UTC(2026, 0, 12, 0, 0, 0);
export const BLOCK_MS = 600_000;
export const BLOCK_MINUTES = BLOCK_MS / 60_000;
export const PER_BLOCK = 400;
export const HALVING = 210_240;
export const HALVING_YEARS_TEXT = "about 4 years";

/** к per block, per pool. Sums to PER_BLOCK. */
export const SHARES = { builders: 292, foundation: 48, tech: 32, validators: 28 } as const;

/** The same split as percentages of PER_BLOCK. */
export const SHARE_PCT = {
  builders: (100 * SHARES.builders) / PER_BLOCK,
  foundation: (100 * SHARES.foundation) / PER_BLOCK,
  tech: (100 * SHARES.tech) / PER_BLOCK,
  validators: (100 * SHARES.validators) / PER_BLOCK,
} as const;

export const PRE_MINE = 0;
export const TX_FEE = 0;

/** Kreator / stakers split of a Kreator's share of the Builders pool. */
export const KREATOR_SPLIT_PCT = 50;
export const STAKER_SPLIT_PCT = 50;

export const SIGNATURE_SCHEME = "ED25519";
export const ADDRESS_LENGTH = 44;
export const ADDRESS_FORMAT_TEXT = `base58 of the public key, ${ADDRESS_LENGTH} characters`;
/**
 * The one place the address shape is defined. The live chain uses 64-char lowercase hex;
 * swap this (and ADDRESS_LENGTH / ADDRESS_FORMAT_TEXT) when RpcLedger lands.
 */
export const ADDRESS_RE = /^[1-9A-HJ-NP-Za-km-z]{44}$/;
/** Transaction ids: 64 lowercase hex. The live chain uses UUIDs. */
export const TX_ID_RE = /^[0-9a-f]{64}$/;
export const TX_PREFIX_MIN = 8;

export const FOUNDATION_THRESHOLD = { required: 3, of: 5 } as const;
export const TECH_THRESHOLD = { required: 2, of: 3 } as const;
export const LARGE_TRANSFER = 50_000;
export const LARGE_TRANSFER_WAIT_DAYS = 7;
export const UPGRADE_NOTICE_DAYS = 14;
export const SIGNER_TERM_MONTHS = 12;
export const RECALL_REQUEST_PCT = 5;

export const SPEC_VERSION = "v1.3";

/** Height is derived from the clock, so the mock chain advances on its own. */
export const heightAt = (now: number): number => Math.floor((now - GENESIS) / BLOCK_MS) + 1;
export const blockTime = (n: number): number => GENESIS + (n - 1) * BLOCK_MS;
export const issuedAt = (height: number): number => PER_BLOCK * height;

export const thresholdText = (t: { required: number; of: number }): string => `${t.required} of ${t.of}`;
