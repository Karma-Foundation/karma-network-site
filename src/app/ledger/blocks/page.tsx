import type { Metadata } from "next";
import Link from "next/link";
import { LedgerTabs, Pager } from "@/components/ui";
import { K, ago, fmt } from "@/lib/format";
import { getLedger } from "@/lib/ledger";
import { SHARES } from "@/lib/ledger/rules";
import { pageParam } from "@/lib/site";

export const metadata: Metadata = { title: "Ledger" };
export const dynamic = "force-dynamic";

const DISTRIBUTION = `${SHARES.builders} builders · ${SHARES.foundation} foundation · ${SHARES.tech} tech · ${SHARES.validators} validators`;

export default async function Blocks({ searchParams }: { searchParams: Promise<{ p?: string | string[] }> }) {
  const page = pageParam((await searchParams).p);
  const data = await getLedger().blocks(page);
  return (
    <div className="wrap page">
      <div className="kicker">Ledger</div>
      <h1>Blocks</h1>
      <LedgerTabs on="blocks" />
      <div className="panel tw">
        {data.items.length ? (
          <table>
            <thead><tr><th>Block</th><th>Time</th><th>Runner</th><th className="right">Txs</th><th className="right">Issued</th><th>Distribution</th></tr></thead>
            <tbody>
              {data.items.map((b) => (
                <tr key={b.n}>
                  <td><Link className="mono" href={`/block/${b.n}`}>{fmt(b.n)}</Link></td>
                  <td className="mono muted">{ago(b.time)}</td>
                  <td><Link href="/runners">{b.runner.id}</Link></td>
                  <td className="right mono">{b.txCount}</td>
                  <td className="right mono">{K(b.issued)}</td>
                  <td className="mono muted small">{DISTRIBUTION}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty">No blocks on this page.</div>
        )}
      </div>
      <Pager href={(p) => `/ledger/blocks?p=${p}`} page={page} total={data.total} per={data.per} shown={data.items.length} />
    </div>
  );
}
