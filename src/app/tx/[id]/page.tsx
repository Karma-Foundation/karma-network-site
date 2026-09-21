import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddrLink, Crumb } from "@/components/ui";
import { K, fmt, shortTx, timeStr } from "@/lib/format";
import { getLedger } from "@/lib/ledger";
import { TX_FEE, TX_ID_RE } from "@/lib/ledger/rules";

export const metadata: Metadata = { title: "Ledger" };
export const dynamic = "force-dynamic";

export default async function TxPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!TX_ID_RE.test(id)) notFound();
  const ledger = getLedger();
  const t = await ledger.tx(id);
  if (!t) notFound();
  const [supply, labels] = await Promise.all([ledger.supply(), ledger.labels([t.from, t.to].filter(Boolean))]);
  return (
    <div className="wrap page">
      <Crumb items={[{ href: "/ledger/transactions", label: "Transactions" }, { label: <span className="mono">{shortTx(id)}</span> }]} />
      <h1 style={{ marginBottom: 24 }}>Transaction</h1>
      <div className="panel rows">
        <div className="k">Id</div><div className="mono break">{id}</div>
        <div className="k">Status</div><div className="green">Confirmed · {fmt(supply.height - t.block + 1)} confirmations</div>
        <div className="k">Block</div><div><Link className="mono" href={`/block/${t.block}`}>{fmt(t.block)}</Link> <span className="muted mono">· {timeStr(t.time)}</span></div>
        <div className="k">Type</div><div>{t.type}</div>
        <div className="k">From</div><div className="break">{t.from ? <AddrLink addr={t.from} labels={labels} full /> : <span className="muted">protocol issuance</span>}</div>
        <div className="k">To</div><div className="break">{t.to ? <AddrLink addr={t.to} labels={labels} full /> : <span className="muted">-</span>}</div>
        <div className="k">Amount</div><div className="mono">{t.amount ? K(t.amount) : "-"}</div>
        <div className="k">Memo</div><div style={{ whiteSpace: "normal" }}>{t.memo || <span className="muted">none</span>}</div>
        {t.signed && (<><div className="k">Signatures</div><div className="mono">{t.signed}</div></>)}
        <div className="k">Fee</div><div className="mono">{K(TX_FEE)} · the protocol has no transaction fee</div>
      </div>
    </div>
  );
}
