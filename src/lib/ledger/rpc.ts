import type { LedgerSource } from "./source";

/**
 * RpcLedger - stub. Reads LEDGER_RPC_URL and throws until implemented.
 *
 * This is NOT a config flip. The live public API (chain.karmaterminal.com/api/v1/public)
 * has no address, address-ranking, tx-by-id or search endpoint, so addresses(), address(),
 * txForAddress(), tx() and search() cannot be backed until those routes exist in the
 * protocol repo. See the README, "Swapping mock for rpc".
 */
const notConfigured = (method: string) => (): never => {
  const url = process.env.LEDGER_RPC_URL;
  throw new Error(
    `RpcLedger.${method}: not configured. LEDGER_MODE=rpc is not implemented yet` +
      (url ? ` (LEDGER_RPC_URL=${url})` : " and LEDGER_RPC_URL is not set") +
      ". Use LEDGER_MODE=mock.",
  );
};

export class RpcLedger implements LedgerSource {
  supply = notConfigured("supply");
  blocks = notConfigured("blocks");
  block = notConfigured("block");
  transactions = notConfigured("transactions");
  tx = notConfigured("tx");
  addresses = notConfigured("addresses");
  address = notConfigured("address");
  txForAddress = notConfigured("txForAddress");
  labels = notConfigured("labels");
  wallets = notConfigured("wallets");
  runners = notConfigured("runners");
  upgrades = notConfigured("upgrades");
  incidents = notConfigured("incidents");
  notices = notConfigured("notices");
  search = notConfigured("search");
}
