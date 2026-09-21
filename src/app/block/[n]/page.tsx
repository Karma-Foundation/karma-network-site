import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Crumb, TxTable } from "@/components/ui";
import { K, ago, fmt, timeStr } from "@/lib/format";
import { getLedger } from "@/lib/ledger";
import { SHARES } from "@/lib/ledger/rules";

export const metadata: Metadata = { title: "Ledger" };
export const dynamic = "force-dynamic";

export default async function BlockPage({ params }: { params: Promise<{ n: string }> }) {
  const { n: raw } = await params;
  if (!/^\d{1,12}$/.test(raw)) notFound();
  const n = Number(raw);
  const ledger = getLedger();
  const [b, supply, wallets] = await Promise.all([ledger.block(n), ledger.supply(), ledger.wallets()]);
  if (!b) notFound();
  return (
    <div className="wrap page">
      <Crumb items={[{ href: "/ledger/blocks", label: "Blocks" }, { label: fmt(n) }]} />
      <div className="sec-head" style={{ marginBottom: 24, gap: 16 }}>
        <h1>Block {fmt(n)}</h1>
        <div className="btns">
          {n > 1 && <Link className="chip" href={`/block/${n - 1}`}>← {fmt(n - 1)}</Link>}
          {n < supply.height && <Link className="chip" href={`/block/${n + 1}`}>{fmt(n + 1)} →</Link>}
        </div>
      </div>
      <div className="panel rows">
        <div className="k">Time</div><div className="mono">{timeStr(b.time)} · {ago(b.time)}</div>
        <div className="k">Produced by</div><div className="mono"><Link href="/runners">{b.runner.id}</Link> · {b.runner.op}, {b.runner.city}</div>
        <div className="k">Hash</div><div className="mono break">{b.hash}</div>
        <div className="k">Transactions</div><div className="mono">{b.txs.length}</div>
        <div className="k">Issued</div><div className="mono">{K(b.issued)}</div>
        <div className="k">Distribution</div>
        <div className="mono" style={{ whiteSpace: "normal" }}>
          {SHARES.builders} к Builders pool (to staked Kreators and stakers) · {SHARES.foundation} к <Link href={`/address/${wallets.foundation.address.addr}`}>Foundation</Link> · {SHARES.tech} к <Link href={`/address/${wallets.tech.address.addr}`}>Tech Builders</Link> · {SHARES.validators} к {b.runner.id}
        </div>
        <div className="k">Protocol version</div><div className="mono">{b.version}</div>
      </div>
      <div className="section" style={{ marginTop: 40 }}>
        <h2 style={{ marginBottom: 12 }}>Transactions in this block</h2>
        <div className="panel"><TxTable list={b.txs} /></div>
      </div>
    </div>
  );
}
