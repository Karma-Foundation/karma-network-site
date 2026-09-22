import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyButton } from "@/components/CopyButton";
import { Crumb, LedgerTabs } from "@/components/ui";
import { KD, ago, dateStr, fmt, isoMs, pctDec, short, shortTx, timeStr } from "@/lib/format";
import { ADDRESS_RE, TX_ID_RE, address, addresses, block, blocks, isLiveTxType, mempoolTo, overview, protocolWallets, runnerSigners, supplyIdentity, transactions, txById, type LiveTxType } from "@/lib/ledger/live/data";
import { Tabs } from "@/components/ui";
import { LiveAddr, LiveTxTable, RankedTable, SimplePager, txTypeLabel } from "./parts";

const BLOCKS_PER_PAGE = 25;
const TXS_PER_PAGE = 40;

export async function LiveBlocks({ page }: { page: number }) {
  const [list, ov] = await Promise.all([blocks(BLOCKS_PER_PAGE, (page - 1) * BLOCKS_PER_PAGE), overview()]);
  const total = ov.chain.latest_block.height + 1;
  return (
    <div className="wrap page">
      <div className="kicker">Ledger</div>
      <h1>Blocks</h1>
      <LedgerTabs on="blocks" />
      <div className="panel tw">
        {list.length ? (
          <table>
            <thead><tr><th>Block</th><th>Time</th><th>Proposer</th><th>Signed by</th><th className="right">Emitted</th><th>Distribution</th><th>Status</th></tr></thead>
            <tbody>
              {list.map((b) => (
                <tr key={b.block_number}>
                  <td><Link className="mono" href={`/block/${b.block_number}`}>{fmt(b.block_number)}</Link></td>
                  <td className="mono muted">{ago(isoMs(b.created_at))}</td>
                  <td>{b.proposer_id ? <Link href="/runners">{b.proposer_id}</Link> : <span className="muted">-</span>}</td>
                  <td className="mono">{runnerSigners(b.signatures).length} runners</td>
                  <td className="right mono">{KD(b.emission_amount)}</td>
                  <td className="mono muted small">{KD(b.community_amount)} builders · {KD(b.foundation_amount)} foundation · {KD(b.builders_amount)} tech · {KD(b.validators_amount)} validators</td>
                  <td className={b.status === "finalized" ? "green" : "amber"}>{b.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty">No blocks on this page.</div>
        )}
      </div>
      <SimplePager href={(p) => `/ledger/blocks?p=${p}`} page={page} hasOlder={page * BLOCKS_PER_PAGE < total} note={`${fmt(total)} blocks, ${BLOCKS_PER_PAGE} per page`} />
    </div>
  );
}

const TYPE_TABS: { id: string; label: string }[] = [{ id: "all", label: "All" }, { id: "transfer", label: "Transfers" }, { id: "grant", label: "Grants" }, { id: "stake", label: "Stakes" }, { id: "unstake", label: "Unstakes" }];
const txHref = (type: string, p = 1) => {
  const q = new URLSearchParams();
  if (type !== "all") q.set("type", type);
  if (p > 1) q.set("p", String(p));
  const qs = q.toString();
  return `/ledger/transactions${qs ? `?${qs}` : ""}`;
};

export async function LiveTransactions({ page, type: rawType }: { page: number; type?: string }) {
  const type: LiveTxType | undefined = isLiveTxType(rawType) ? rawType : undefined;
  const [{ items, total }, pw] = await Promise.all([transactions(TXS_PER_PAGE, (page - 1) * TXS_PER_PAGE, type), protocolWallets()]);
  const pages = Math.max(1, Math.ceil(total / TXS_PER_PAGE));
  return (
    <div className="wrap page">
      <div className="kicker">Ledger</div>
      <h1>Transactions</h1>
      <LedgerTabs on="tx" />
      <div style={{ marginBottom: 12 }}><Tabs on={type ?? "all"} items={TYPE_TABS.map((t) => ({ id: t.id, href: txHref(t.id), label: t.label }))} /></div>
      <div className="panel"><LiveTxTable list={items} labels={pw.labels} /></div>
      <SimplePager href={(p) => txHref(type ?? "all", p)} page={page} hasOlder={page < pages} note={`${fmt(total)} ${type ? txTypeLabel(type).toLowerCase() + "s" : "transactions"}, ${TXS_PER_PAGE} per page`} />
      <p className="muted f13" style={{ marginTop: 10 }}>Addresses only. A stake or unstake goes to a Kreator, which the ledger does not publish as an address. Grants carry no block number.</p>
    </div>
  );
}

const ADDRS_PER_PAGE = 50;
export async function LiveAddresses({ page }: { page: number }) {
  const [list, pw, ov, sup] = await Promise.all([addresses(ADDRS_PER_PAGE, (page - 1) * ADDRS_PER_PAGE), protocolWallets(), overview(), supplyIdentity()]);
  const total = ov.wallets.total;
  return (
    <div className="wrap page">
      <div className="kicker">Ledger</div>
      <h1>Addresses</h1>
      <LedgerTabs on="addr" />
      <div className="panel"><RankedTable list={list} labels={pw.labels} issued={sup.total_in_wallets} /></div>
      <SimplePager href={(p) => `/ledger/addresses?p=${p}`} page={page} hasOlder={list.length === ADDRS_PER_PAGE && page * ADDRS_PER_PAGE < total + ADDRS_PER_PAGE} note={`${fmt(total)} wallets, ranked by balance, ${ADDRS_PER_PAGE} per page`} />
      <p className="muted f13" style={{ marginTop: 10 }}>Labels appear only on protocol pool wallets. Every other address is pseudonymous.</p>
    </div>
  );
}

const ADDR_TXS = 40;
export async function LiveAddress({ addr: raw, page, type: rawType }: { addr: string; page: number; type?: string }) {
  const addr = raw.toLowerCase();
  if (!ADDRESS_RE.test(addr)) notFound();
  const type: LiveTxType | undefined = isLiveTxType(rawType) ? rawType : undefined;
  const [d, pending, pw, sup] = await Promise.all([address(addr, ADDR_TXS, (page - 1) * ADDR_TXS, type), mempoolTo(addr), protocolWallets(), supplyIdentity()]);
  if (!d) notFound();
  const label = pw.labels[addr];
  const pools = pw.pools.filter((p) => p.public_address === addr);
  const pre = pw.preMine.filter((p) => p.public_address === addr);
  const unseen = d.tx_count === 0 && d.balance === "0.000" && !d.first_seen;
  const href = (p: number, t = type ?? "all") => {
    const q = new URLSearchParams();
    if (t !== "all") q.set("type", t);
    if (p > 1) q.set("p", String(p));
    const qs = q.toString();
    return `/address/${addr}${qs ? `?${qs}` : ""}`;
  };
  return (
    <div className="wrap page">
      <Crumb items={[{ href: "/ledger/addresses", label: "Addresses" }, { label: label ?? short(addr) }]} />
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <h1 style={{ fontSize: 34 }}>{label ?? "Address"}</h1>
        {pools.length > 0 && <span className="tag">protocol-controlled</span>}
        {pre.length > 0 && <span className="tag gray">pre-mine recipient</span>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, maxWidth: "100%", margin: "10px 0 24px" }}>
        <div className="addrbox"><span>{addr}</span></div>
        <CopyButton value={addr} />
      </div>
      {unseen && <div className="note" style={{ borderColor: "var(--muted)", color: "var(--muted)" }}>This address has never appeared on the ledger.</div>}
      {pools.map((p) => <p key={p.name} className="body f14" style={{ maxWidth: 720, margin: "0 0 16px" }}>Receives the {p.label} share of every block&apos;s emission. <Link href="/wallets">Protocol wallets →</Link></p>)}
      <div className="stats n4">
        <div className="stat"><div className="l">Balance</div><div className="v">{KD(d.balance)}</div><div className="s">{pctDec(d.balance, sup.total_in_wallets, 3)} of all Karma in wallets</div></div>
        <div className="stat"><div className="l">Staked</div><div className="v">{KD(d.staked)}</div><div className="s">on Kreators</div></div>
        <div className="stat"><div className="l">First seen</div><div className="v">{d.first_seen ? dateStr(isoMs(d.first_seen)) : "-"}</div><div className="s">{d.first_seen ? ago(isoMs(d.first_seen)) : "never"}</div></div>
        <div className="stat"><div className="l">Transactions</div><div className="v">{fmt(d.tx_count)}</div><div className="s">transfers, grants, stakes, unstakes</div></div>
      </div>
      {pre.length > 0 && (
        <div className="section" style={{ marginTop: 32 }}>
          <h2 style={{ marginBottom: 12 }}>Pre-mine allocation</h2>
          <div className="panel tw"><table>
            <thead><tr><th>Allocation</th><th className="right">Total</th><th className="right">Released so far</th><th className="right">Per day</th><th>Vesting</th></tr></thead>
            <tbody>{pre.map((p) => (
              <tr key={p.name}><td className="mono">{p.name}</td><td className="right mono">{KD(p.total_allocation)}</td><td className="right mono">{KD(p.total_released)} ({pctDec(p.total_released, p.total_allocation, 1)})</td><td className="right mono">{KD(p.daily_release)}</td><td className="mono muted">{p.vesting_start ? dateStr(isoMs(p.vesting_start)) : "-"} to {p.vesting_end ? dateStr(isoMs(p.vesting_end)) : "-"}</td></tr>
            ))}</tbody>
          </table></div>
        </div>
      )}
      {pending.length > 0 && (
        <div className="section" style={{ marginTop: 32 }}>
          <h2 style={{ marginBottom: 12 }}>Incoming, not yet in a block</h2>
          <div className="panel tw"><table>
            <thead><tr><th>Submitted</th><th>From</th><th className="right">Amount</th></tr></thead>
            <tbody>{pending.map((m, i) => (
              <tr key={i}><td className="mono muted">{ago(isoMs(m.submitted_at))}</td><td><LiveAddr a={m.sender_address} labels={pw.labels} /></td><td className="right mono">{KD(m.amount)}</td></tr>
            ))}</tbody>
          </table></div>
        </div>
      )}
      <div className="section" style={{ marginTop: 32 }}>
        <h2 style={{ marginBottom: 12 }}>Transactions</h2>
        <div style={{ marginBottom: 12 }}><Tabs on={type ?? "all"} items={TYPE_TABS.map((t) => ({ id: t.id, href: href(1, t.id), label: t.label }))} /></div>
        <div className="panel"><LiveTxTable list={d.transactions} labels={pw.labels} /></div>
        <SimplePager href={(p) => href(p)} page={page} hasOlder={d.transactions.length === ADDR_TXS} note={`${ADDR_TXS} per page`} />
      </div>
    </div>
  );
}

const Hash = ({ v }: { v: string | null | undefined }) => <div className="mono break">{v || "-"}</div>;

export async function LiveBlock({ n }: { n: number }) {
  const [d, ov] = await Promise.all([block(n), overview()]);
  if (!d) notFound();
  const b = d.block;
  const H = ov.chain.latest_block.height;
  const sigs = d.signatures.filter((s) => s.signer_id !== "protocol");
  return (
    <div className="wrap page">
      <Crumb items={[{ href: "/ledger/blocks", label: "Blocks" }, { label: fmt(n) }]} />
      <div className="sec-head" style={{ marginBottom: 24, gap: 16 }}>
        <h1>Block {fmt(n)}</h1>
        <div className="btns">
          {n > 0 && <Link className="chip" href={`/block/${n - 1}`}>← {fmt(n - 1)}</Link>}
          {n < H && <Link className="chip" href={`/block/${n + 1}`}>{fmt(n + 1)} →</Link>}
        </div>
      </div>
      <div className="panel rows">
        <div className="k">Sealed</div><div className="mono">{timeStr(isoMs(b.created_at))} · {ago(isoMs(b.created_at))}</div>
        <div className="k">Status</div><div className={b.status === "finalized" ? "green" : "amber"}>{b.status}</div>
        <div className="k">Proposer</div><div className="mono">{b.proposer_id ? <Link href="/runners">{b.proposer_id}</Link> : "-"}</div>
        <div className="k">Block hash</div><Hash v={b.block_hash} />
        <div className="k">Previous block hash</div><Hash v={b.prev_block_hash} />
        <div className="k">Transaction set hash</div><Hash v={b.tx_set_hash} />
        <div className="k">State hash</div><Hash v={b.state_hash} />
        <div className="k">Emitted</div><div className="mono">{KD(b.emission_amount)}</div>
        <div className="k">Distribution</div>
        <div className="mono" style={{ whiteSpace: "normal" }}>{KD(b.community_amount)} Builders pool · {KD(b.foundation_amount)} Foundation · {KD(b.builders_amount)} Tech Builders · {KD(b.validators_amount)} Validators</div>
        <div className="k">Rewards paid</div>
        <div className="mono" style={{ whiteSpace: "normal" }}>staking {KD(b.staking_distributed)} (burned {KD(b.staking_burned)}) · transaction {KD(b.tx_reward_distributed)} (burned {KD(b.tx_reward_burned)})</div>
      </div>

      <div className="section" style={{ marginTop: 40 }}>
        <h2 style={{ marginBottom: 12 }}>Signatures</h2>
        <div className="panel tw">
          {sigs.length ? (
            <table>
              <thead><tr><th>Runner</th><th>Public key</th><th>Signature</th><th>Signed</th></tr></thead>
              <tbody>{sigs.map((s) => (
                <tr key={s.signer_id}><td className="mono">{s.signer_id}</td><td className="mono muted small">{s.public_key}</td><td className="mono muted small">{s.signature.slice(0, 24)}…</td><td className="mono muted">{timeStr(isoMs(s.created_at))}</td></tr>
              ))}</tbody>
            </table>
          ) : <div className="empty">No runner signatures recorded.</div>}
        </div>
      </div>

      <div className="section">
        <h2 style={{ marginBottom: 12 }}>Actions in this block</h2>
        <div className="panel tw">
          {d.envelopes.length ? (
            <table>
              <thead><tr><th>Action</th><th className="right">Amount</th><th>Payload hash</th><th>Submitted</th></tr></thead>
              <tbody>{d.envelopes.map((e) => (
                <tr key={e.id}><td className="mono">{e.action}</td><td className="right mono">{e.amount ? KD(e.amount) : "-"}</td><td className="mono muted small">{e.payload_hash}</td><td className="mono muted">{timeStr(isoMs(e.submitted_at))}</td></tr>
              ))}</tbody>
            </table>
          ) : <div className="empty">No actions.</div>}
        </div>
        <p className="muted f13" style={{ marginTop: 10 }}>The ledger serves block contents redacted. This site shows the action, the amount and the payload hash, and nothing that points at a person.</p>
      </div>

      {d.cycles.length > 0 && (
        <div className="section">
          <h2 style={{ marginBottom: 12 }}>Reward cycles</h2>
          <div className="panel tw">
            <table>
              <thead><tr><th>Cycle</th><th className="right">Pool</th><th className="right">Distributed</th><th className="right">Burned</th><th className="right">Kreators paid</th></tr></thead>
              <tbody>{d.cycles.map((c, i) => (
                <tr key={i}><td>{c.cycle_type}</td><td className="right mono">{KD(c.total_pool)}</td><td className="right mono">{KD(c.distributed_amount)}</td><td className="right mono">{KD(c.burned_amount)}</td><td className="right mono">{fmt(c.profiles_count)}</td></tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export async function LiveTx({ id: raw }: { id: string }) {
  const id = raw.toLowerCase();
  if (!TX_ID_RE.test(id)) notFound();
  const [t, pw] = await Promise.all([txById(id), protocolWallets()]);
  if (!t) notFound();
  return (
    <div className="wrap page">
      <Crumb items={[{ href: "/ledger/transactions", label: "Transactions" }, { label: <span className="mono">{shortTx(id)}</span> }]} />
      <h1 style={{ marginBottom: 24 }}>{txTypeLabel(t.type)}</h1>
      <div className="panel rows">
        <div className="k">Id</div><div className="mono break">{t.id}</div>
        <div className="k">Block</div><div>{t.block_number ? <Link className="mono" href={`/block/${t.block_number}`}>{fmt(t.block_number)}</Link> : <span className="muted">not recorded for grants</span>}</div>
        <div className="k">Time</div><div className="mono">{timeStr(isoMs(t.created_at))} · {ago(isoMs(t.created_at))}</div>
        <div className="k">From</div><div className="break"><LiveAddr a={t.sender_address} labels={pw.labels} full /></div>
        <div className="k">To</div><div className="break">{t.receiver_address ? <LiveAddr a={t.receiver_address} labels={pw.labels} full /> : <span className="muted">-</span>}</div>
        <div className="k">Amount</div><div className="mono">{KD(t.amount)}</div>
        <div className="k">Fee</div><div className="mono">{KD(t.fee_amount)} · {KD(t.fee_burned)} burned</div>
      </div>
    </div>
  );
}
