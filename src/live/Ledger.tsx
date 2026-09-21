import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyButton } from "@/components/CopyButton";
import { Crumb, LedgerTabs } from "@/components/ui";
import { KD, ago, fmt, isoMs, short, shortTx, timeStr } from "@/lib/format";
import { ADDRESS_RE, RECENT_WINDOW, TX_ID_RE, block, blocks, mempoolTo, overview, recentTransfers, runnerSigners, transfers } from "@/lib/ledger/live/data";
import { LiveTxTable, NotPublished, SimplePager } from "./parts";

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

export async function LiveTransactions({ page }: { page: number }) {
  const list = await transfers(TXS_PER_PAGE, (page - 1) * TXS_PER_PAGE);
  return (
    <div className="wrap page">
      <div className="kicker">Ledger</div>
      <h1>Transactions</h1>
      <LedgerTabs on="tx" />
      <p className="muted f13" style={{ margin: "0 0 12px" }}>Transfers and grants, newest first, as the ledger publishes them: addresses only. Stakes, unstakes and rewards are not in this feed; stakes appear on the page of the block that included them.</p>
      <div className="panel"><LiveTxTable list={list} /></div>
      <SimplePager href={(p) => `/ledger/transactions?p=${p}`} page={page} hasOlder={list.length === TXS_PER_PAGE} note={`${TXS_PER_PAGE} per page`} />
    </div>
  );
}

export function LiveAddresses() {
  return (
    <div className="wrap page">
      <div className="kicker">Ledger</div>
      <h1>Addresses</h1>
      <LedgerTabs on="addr" />
      <NotPublished title="Ranked balances">
        <div>The ledger&apos;s public API has no endpoint that lists addresses or balances, so this page cannot be built from the ledger yet. Nothing is estimated in its place.</div>
        <div>What it needs: a public, address-only route returning address, balance and rank, paginated. No names, handles or profile data.</div>
        <div>An address you already know can still be opened: paste it into the search box. Its page shows what the ledger does publish about it.</div>
      </NotPublished>
    </div>
  );
}

export async function LiveAddress({ addr: raw }: { addr: string }) {
  const addr = raw.toLowerCase();
  if (!ADDRESS_RE.test(addr)) notFound();
  const [recent, pending] = await Promise.all([recentTransfers(), mempoolTo(addr)]);
  const mine = recent.filter((t) => t.sender_address === addr || t.receiver_address === addr);
  return (
    <div className="wrap page">
      <Crumb items={[{ href: "/ledger/addresses", label: "Addresses" }, { label: short(addr) }]} />
      <h1 style={{ fontSize: 34, marginBottom: 10 }}>Address</h1>
      <div style={{ display: "flex", alignItems: "center", gap: 8, maxWidth: "100%", marginBottom: 24 }}>
        <div className="addrbox"><span>{addr}</span></div>
        <CopyButton value={addr} />
      </div>
      <NotPublished title="Balance and full history">
        <div>The ledger&apos;s public API has no per-address endpoint: no balance, no stake total, no complete history. This page cannot confirm that the address exists. It shows only what can be found in the public feeds below.</div>
      </NotPublished>
      <div className="section" style={{ marginTop: 32 }}>
        <h2 style={{ marginBottom: 12 }}>Incoming, not yet in a block</h2>
        <div className="panel">
          {pending.length ? (
            <div className="tw"><table>
              <thead><tr><th>Submitted</th><th>From</th><th className="right">Amount</th></tr></thead>
              <tbody>{pending.map((m, i) => (
                <tr key={i}><td className="mono muted">{ago(isoMs(m.submitted_at))}</td><td>{m.sender_address ? <Link className="mono" href={`/address/${m.sender_address}`}>{short(m.sender_address)}</Link> : "-"}</td><td className="right mono">{KD(m.amount)}</td></tr>
              ))}</tbody>
            </table></div>
          ) : <div className="empty">Nothing waiting.</div>}
        </div>
      </div>
      <div className="section">
        <div className="sec-head" style={{ marginBottom: 12 }}><h2>Transfers</h2><span className="muted f13">found among the latest {fmt(Math.min(RECENT_WINDOW, recent.length))} public transactions only</span></div>
        <div className="panel"><LiveTxTable list={mine} /></div>
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
  const recent = await recentTransfers();
  const t = recent.find((x) => x.id === id);
  return (
    <div className="wrap page">
      <Crumb items={[{ href: "/ledger/transactions", label: "Transactions" }, { label: <span className="mono">{shortTx(id)}</span> }]} />
      <h1 style={{ marginBottom: 24 }}>Transaction</h1>
      {t ? (
        <div className="panel rows">
          <div className="k">Id</div><div className="mono break">{t.id}</div>
          <div className="k">Time</div><div className="mono">{timeStr(isoMs(t.created_at))} · {ago(isoMs(t.created_at))}</div>
          <div className="k">Type</div><div>{t.type === "grant" ? "Grant" : "Transfer"}</div>
          <div className="k">From</div><div className="break">{t.sender_address ? <Link className="mono" href={`/address/${t.sender_address}`}>{t.sender_address}</Link> : <span className="muted">protocol</span>}</div>
          <div className="k">To</div><div className="break">{t.receiver_address ? <Link className="mono" href={`/address/${t.receiver_address}`}>{t.receiver_address}</Link> : <span className="muted">-</span>}</div>
          <div className="k">Amount</div><div className="mono">{KD(t.amount)}</div>
          <div className="k">Fee</div><div className="mono">{KD(t.fee_amount)} · {KD(t.fee_burned)} burned</div>
        </div>
      ) : (
        <NotPublished title="Not in the recent feed">
          <div>The ledger&apos;s public API has no lookup by transaction id. This site can only search the latest {fmt(RECENT_WINDOW)} public transactions, and <span className="mono">{id}</span> is not among them. It may be older, or it may not exist.</div>
        </NotPublished>
      )}
    </div>
  );
}
