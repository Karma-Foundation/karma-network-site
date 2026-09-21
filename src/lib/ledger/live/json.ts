import { ADDRESS_RE, TX_ID_RE, block, blocks, history, mempoolTo, overview, recentTransfers, runners, supplyIdentity, RECENT_WINDOW } from "./data";

/** Thrown for routes the ledger's public API cannot back yet. Surfaces as HTTP 501. */
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
  async block(n: number) {
    return block(n);
  },
  async tx(id: string) {
    if (!TX_ID_RE.test(id)) return null;
    const t = (await recentTransfers()).find((x) => x.id === id);
    if (!t) throw new NotPublishedError(`the ledger has no tx-by-id endpoint; only the latest ${RECENT_WINDOW} public transactions are searchable and this id is not among them`);
    return t;
  },
  async addresses(): Promise<never> {
    throw new NotPublishedError("the ledger's public API has no address-ranking endpoint");
  },
  async address(addr: string) {
    const a = addr.toLowerCase();
    if (!ADDRESS_RE.test(a)) return null;
    const [recent, pending] = await Promise.all([recentTransfers(), mempoolTo(a)]);
    return { addr: a, balance: null, note: "the ledger's public API has no per-address endpoint; balance and full history are not published", pending, recentTransfers: recent.filter((t) => t.sender_address === a || t.receiver_address === a) };
  },
  runners,
  upgrades: history,
};
