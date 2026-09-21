export type AddressKind = "protocol" | "third" | "runner" | "kreator" | "user";
export type TxType = "Transfer" | "Stake" | "Unstake" | "Signer change" | "Issuance";
export const TX_FILTERS = ["Transfer", "Stake", "Unstake", "Signer change"] as const;
export type TxFilter = (typeof TX_FILTERS)[number] | "all";

export interface Supply {
  height: number;
  lastBlockTime: number;
  issued: number;
  maxSupply: number;
  perBlock: number;
  holders: number;
  genesis: number;
}

export interface Runner {
  id: string;
  op: string;
  city: string;
  since: number;
  version: string;
  independent: boolean;
  height: number;
  produced: number;
  status: string;
}

export interface Tx {
  id: string;
  block: number;
  time: number;
  /** Empty string: protocol issuance. */
  from: string;
  /** Empty string: no recipient (signer change). */
  to: string;
  amount: number;
  memo: string;
  type: TxType;
  signed?: string;
}

export interface Block {
  n: number;
  time: number;
  hash: string;
  runner: Runner;
  txCount: number;
  issued: number;
  version: string;
}

export interface BlockDetail extends Block {
  txs: Tx[];
}

/**
 * An address carries an address, balances and an optional PUBLISHED label. It never carries
 * a person: no name, handle, username, photo or bio. Labels exist only for protocol wallets
 * and for owners who published one themselves.
 */
export interface Address {
  addr: string;
  label: string;
  kind: AddressKind;
  tag?: string;
  balance: number;
  first: number;
  received: number;
  sent: number;
  rank: number;
}

export interface Signer {
  n: number;
  name: string;
  role: string;
  key: string;
  since: string;
  ends: string;
  open?: boolean;
}

export interface PendingTransfer {
  announced: string;
  amount: number;
  to: string;
  purpose: string;
  signed: string;
  signer: string;
}

export interface ProtocolWallet {
  id: "foundation" | "tech";
  address: Address;
  sharePct: number;
  perBlock: number;
  threshold: string;
  signers: Signer[];
  signersNote: string;
  purpose: string;
  policy: string;
  description: string;
  spendingPolicy: string[];
  pending: PendingTransfer | null;
  outgoing: number;
}

export interface Wallets {
  foundation: ProtocolWallet;
  tech: ProtocolWallet;
  thirdParty: Address[];
}

export interface Upgrade {
  v: string;
  block: number | null;
  title: string;
  signed: string;
  status: "Active" | "Proposed";
  proposed: string;
  notice?: string;
  text: string[];
}

export interface Incident {
  date: string;
  what: string;
  duration: string;
  resolution: string;
}

export type NoticeKind = "Upgrade proposed" | "Upgrade adopted" | "Incident" | "Transfer announced" | "Genesis";

export interface Notice {
  slug: string;
  date: number;
  kind: NoticeKind;
  title: string;
  body: string[];
  links: { href: string; label: string }[];
}

export interface Page<T> {
  items: T[];
  page: number;
  per: number;
  total: number;
}

export type SearchResult =
  | { kind: "block"; n: number }
  | { kind: "address"; addr: string }
  | { kind: "tx"; id: string }
  | { kind: "list"; q: string; addresses: Address[] }
  | { kind: "empty" };
