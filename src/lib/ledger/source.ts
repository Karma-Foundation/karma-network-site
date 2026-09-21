import type {
  Address,
  Block,
  BlockDetail,
  Incident,
  Notice,
  Page,
  Runner,
  SearchResult,
  Supply,
  Tx,
  TxFilter,
  Upgrade,
  Wallets,
} from "./types";

/**
 * The only door between the site and a ledger. Pages and /api/v1 routes call this and
 * nothing else, so swapping MockLedger for RpcLedger is one env var plus one class.
 *
 * Every method is async because the real source is a network call with a floor of about
 * half a second; callers should fan out with Promise.all.
 *
 * Privacy contract: no method may return a person. Addresses carry only a published label.
 */
export interface LedgerSource {
  supply(): Promise<Supply>;
  blocks(page: number): Promise<Page<Block>>;
  block(n: number): Promise<BlockDetail | null>;
  transactions(page: number, type: TxFilter): Promise<Page<Tx>>;
  tx(id: string): Promise<Tx | null>;
  addresses(page: number): Promise<Page<Address>>;
  address(addr: string): Promise<Address | null>;
  /** Newest first. `total` is the full count; `items` is capped at `limit`. */
  txForAddress(addr: string, limit?: number): Promise<{ items: Tx[]; total: number }>;
  /** Published labels for a set of addresses (protocol wallets and self-published only). */
  labels(addrs: string[]): Promise<Record<string, string>>;
  wallets(): Promise<Wallets>;
  runners(): Promise<Runner[]>;
  upgrades(): Promise<Upgrade[]>;
  incidents(): Promise<Incident[]>;
  notices(): Promise<Notice[]>;
  search(q: string): Promise<SearchResult>;
}

export const BLOCKS_PER_PAGE = 25;
export const TXS_PER_PAGE = 40;
export const ADDRESSES_PER_PAGE = 50;
export const ADDRESS_TX_LIMIT = 50;
