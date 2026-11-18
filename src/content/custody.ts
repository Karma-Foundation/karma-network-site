/*
 * Key custody of the council's two wallets. The ledger does not record signers or
 * thresholds, so this file is the record the wallets page reads. It must only ever say
 * what is live.
 *
 * THE DAY THE MULTISIG GOES LIVE, change the wallet's record below, and nothing else:
 *     type: "multisig",
 *     liveSince: "YYYY-MM-DD",
 * The wallets page then reads "2 of 3 signatures - Signer 1, Signer 2, Signer 3. Live since <date>."
 *
 * Signer N is the same person as Seat N on the governance page. No names here.
 */

import { dateStr } from "../lib/format";

export interface Custody {
  /** What is live today. */
  type: "single-key" | "multisig";
  /** Signatures needed, out of how many. Planned while type is "single-key". */
  threshold: { required: number; of: number };
  signers: string[];
  /** The day the multisig went live, YYYY-MM-DD. null while type is "single-key". */
  liveSince: string | null;
}

/** Keyed by the pool name the ledger uses in /protocol-wallets. */
export const CUSTODY: Record<string, Custody> = {
  foundation: {
    type: "single-key",
    threshold: { required: 2, of: 3 },
    signers: ["Signer 1", "Signer 2", "Signer 3"],
    liveSince: null,
  },
  // The council's second wallet, "Tech Builders pool" on the site and in the council text.
  // The ledger pool named "builders" is the Kreator pass-through: not a council wallet, no row here.
  tech_builders: {
    type: "single-key",
    threshold: { required: 2, of: 3 },
    signers: ["Signer 1", "Signer 2", "Signer 3"],
    liveSince: null,
  },
};

const signatures = (c: Custody) => `${c.threshold.required} of ${c.threshold.of} signatures - ${c.signers.join(", ")}`;

/** A multisig counts as live only with a valid date; anything else reads as a single key. */
export const multisigLive = (c: Custody): boolean =>
  c.type === "multisig" && c.liveSince !== null && /^\d{4}-\d{2}-\d{2}$/.test(c.liveSince) && !Number.isNaN(Date.parse(`${c.liveSince}T00:00:00Z`));

/** The one sentence the wallets page shows for a wallet. */
export function custodyLine(c: Custody): string {
  if (multisigLive(c)) return `${signatures(c)}. Live since ${dateStr(Date.parse(`${c.liveSince}T00:00:00Z`))}.`;
  return `Held with a single key today. Planned: ${signatures(c)}. Not live yet.`;
}

export const custodyType = (c: Custody): string => (multisigLive(c) ? "Multisig" : "Single key");
