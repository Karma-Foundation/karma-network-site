import Link from "next/link";
import { KD, ago, fmt, isoMs, short, shortTx } from "@/lib/format";
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

const Addr = ({ a }: { a: string | null }) => (a ? <Link className="mono" href={`/address/${a}`}>{short(a)}</Link> : <span className="muted">protocol</span>);

export function LiveTxTable({ list }: { list: LiveTx[] }) {
  if (!list.length) return <div className="empty">No transactions.</div>;
  return (
    <div className="tw">
      <table>
        <thead><tr><th>Tx</th><th>Time</th><th>Type</th><th>From</th><th>To</th><th className="right">Amount</th><th className="right">Fee</th><th className="right">Fee burned</th></tr></thead>
        <tbody>
          {list.map((t) => (
            <tr key={t.id}>
              <td><Link className="mono" href={`/tx/${t.id}`}>{shortTx(t.id)}</Link></td>
              <td className="mono muted">{ago(isoMs(t.created_at))}</td>
              <td>{t.type === "grant" ? "Grant" : "Transfer"}</td>
              <td><Addr a={t.sender_address} /></td>
              <td><Addr a={t.receiver_address} /></td>
              <td className="right mono">{KD(t.amount)}</td>
              <td className="right mono">{KD(t.fee_amount)}</td>
              <td className="right mono">{KD(t.fee_burned)}</td>
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
