import Link from "next/link";
import { KD, ago, fmt, isoMs, pctDec, short, shortTx } from "@/lib/format";
import type { LiveTx, ParamChange } from "@/lib/ledger/live/data";

/** Shown wherever the ledger's public API has no endpoint for what the page is about. */
export function NotPublished({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="panel" style={{ borderStyle: "dashed", background: "transparent" }}>
      <div className="panel-h"><h3>{title}</h3><span className="tag amber">not published yet</span></div>
      <div className="panel-b body f14 list">{children}</div>
    </div>
  );
}

export function ShareBarsLive({ rows }: { rows: [string, string, string][] }) {
  return (
    <div className="list">
      {rows.map(([name, p, cls]) => (
        <div key={name} className="sharebar mono">
          <div className="n">{name}</div>
          <div>{p}%</div>
          <div className="bar"><i className={cls || undefined} style={{ width: `${Number(p) || 0}%` }} /></div>
        </div>
      ))}
    </div>
  );
}

export const shareRows = (p: Record<string, string>): [string, string, string][] => [
  ["Builders (Kreators + Stakers)", p.emission_builders_pct ?? "-", ""],
  ["Foundation", p.emission_foundation_pct ?? "-", "acc"],
  ["Tech Builders", p.emission_tech_builders_pct ?? "-", "acc"],
  ["Validators (Runners)", p.emission_validators_pct ?? "-", ""],
];

const TYPE_LABEL: Record<string, string> = { transfer: "Transfer", grant: "Grant", stake: "Stake", unstake: "Unstake" };
export const txTypeLabel = (t: string) => TYPE_LABEL[t] ?? t;
const UUID = /^[0-9a-f-]{36}$/;

export function LiveAddr({ a, labels = {}, full }: { a: string | null; labels?: Record<string, string>; full?: boolean }) {
  if (!a) return <span className="muted">protocol</span>;
  const label = labels[a];
  return (
    <>
      <Link className="mono" href={`/address/${a}`}>{full ? a : short(a)}</Link>
      {label && <> <span className="muted small">{label}</span></>}
    </>
  );
}

export function LiveTxTable({ list, labels = {}, hideAddress }: { list: LiveTx[]; labels?: Record<string, string>; hideAddress?: string }) {
  if (!list.length) return <div className="empty">No transactions.</div>;
  const To = ({ t }: { t: LiveTx }) =>
    t.receiver_address ? <LiveAddr a={t.receiver_address} labels={labels} /> : t.type === "stake" || t.type === "unstake" ? <span className="muted">a Kreator</span> : <span className="muted">-</span>;
  return (
    <div className="tw">
      <table>
        <thead><tr><th>Tx</th><th>Block</th><th>Time</th><th>Type</th><th>From</th><th>To</th><th className="right">Amount</th><th className="right">Fee</th></tr></thead>
        <tbody>
          {list.map((t) => (
            <tr key={`${t.type}-${t.id}`} className={hideAddress && (t.sender_address === hideAddress) ? "out" : undefined}>
              <td>{UUID.test(t.id) ? <Link className="mono" href={`/tx/${t.id}`}>{shortTx(t.id)}</Link> : <span className="mono muted">{t.id}</span>}</td>
              <td>{t.block_number ? <Link className="mono" href={`/block/${t.block_number}`}>{fmt(t.block_number)}</Link> : <span className="muted">-</span>}</td>
              <td className="mono muted">{ago(isoMs(t.created_at))}</td>
              <td>{txTypeLabel(t.type)}</td>
              <td><LiveAddr a={t.sender_address} labels={labels} /></td>
              <td><To t={t} /></td>
              <td className="right mono">{KD(t.amount)}</td>
              <td className="right mono">{t.fee_amount && t.fee_amount !== "0.000" ? KD(t.fee_amount) : "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function RankedTable({ list, labels, issued }: { list: { public_address: string; balance: string; staked: string; rank: number }[]; labels: Record<string, string>; issued: string }) {
  if (!list.length) return <div className="empty">No addresses on this page.</div>;
  return (
    <div className="tw">
      <table>
        <thead><tr><th>#</th><th>Address</th><th>Label</th><th className="right">Balance</th><th className="right">Staked</th><th className="right">of in wallets</th></tr></thead>
        <tbody>
          {list.map((a) => (
            <tr key={a.public_address}>
              <td className="muted">{a.rank}</td>
              <td><Link className="mono" href={`/address/${a.public_address}`}>{short(a.public_address)}</Link></td>
              <td>{labels[a.public_address] ? <span className="tag">{labels[a.public_address]}</span> : <span className="muted">-</span>}</td>
              <td className="right mono">{KD(a.balance)}</td>
              <td className="right mono">{a.staked !== "0.000" ? KD(a.staked) : "-"}</td>
              <td className="right mono">{pctDec(a.balance, issued, 2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ChangeTable({ list }: { list: ParamChange[] }) {
  if (!list.length) return <div className="empty">No changes recorded.</div>;
  return (
    <div className="tw">
      <table>
        <thead><tr><th>When</th><th>Parameter</th><th>Before</th><th>After</th><th>Actor</th></tr></thead>
        <tbody>
          {list.map((c, i) => (
            <tr key={`${c.timestamp}-${c.key}-${i}`}>
              <td className="mono muted">{new Date(isoMs(c.timestamp)).toISOString().slice(0, 16).replace("T", " ")} UTC</td>
              <td className="mono">{c.key}</td>
              <td className="mono muted">{c.before ?? "-"}</td>
              <td className="mono">{c.after ?? "-"}</td>
              <td className="mono muted">{c.actor}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SimplePager({ href, page, hasOlder, note }: { href: (p: number) => string; page: number; hasOlder: boolean; note: string }) {
  return (
    <div className="pager">
      <div>{note} · page {fmt(page)}</div>
      <div className="pb">
        {page > 1 && <Link className="chip" href={href(page - 1)}>Newer</Link>}
        {hasOlder && <Link className="chip" href={href(page + 1)}>Older</Link>}
      </div>
    </div>
  );
}
