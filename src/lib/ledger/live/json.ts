import { ADDRESS_RE, TX_ID_RE, address, addresses, block, blocks, history, isLiveTxType, mempoolTo, overview, protocolWallets, runners, supplyIdentity, txById } from "./data";

/** Thrown for routes the ledger's public API cannot back. Surfaces as HTTP 501. */
export class NotPublishedError extends Error {}

export const liveJson = {
  async supply() {
    const [ov, s] = await Promise.all([overview(), supplyIdentity()]);
    const lb = ov.chain.latest_block;
    return { height: lb.height, lastBlockTime: Date.parse(lb.sealed_at), maxSupply: "800000000.000", ...s };
  },
  async blocks(page: number) {
    const [items, ov] = await Promise.all([blocks(25, (page - 1) * 25), overview()]);
    return { items: items.map(({ signatures, ...b }) => ({ ...b, signers: (signatures ?? []).map((x) => x.signer_id) })), page, per: 25, total: ov.chain.latest_block.height + 1 };
  },
  block,
  async tx(id: string) {
    return TX_ID_RE.test(id) ? txById(id) : null;
  },
  async addresses(page: number) {
    const [items, pw, ov] = await Promise.all([addresses(50, (page - 1) * 50), protocolWallets(), overview()]);
    return { items: items.map((a) => ({ ...a, label: pw.labels[a.public_address] ?? null })), page, per: 50, total: ov.wallets.total };
  },
  async address(addr: string, type?: string) {
    const a = addr.toLowerCase();
    if (!ADDRESS_RE.test(a)) return null;
    const [d, pending, pw] = await Promise.all([address(a, 100, 0, isLiveTxType(type) ? type : undefined), mempoolTo(a), protocolWallets()]);
    return d ? { ...d, label: pw.labels[a] ?? null, pending } : null;
  },
  runners,
  upgrades: history,
  protocolWallets,
};
