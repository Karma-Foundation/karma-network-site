import type { Metadata } from "next";
import { LedgerTabs, Pager, Tabs, TxTable } from "@/components/ui";
import { TX_FILTERS, getLedger, type TxFilter } from "@/lib/ledger";
import { pageParam } from "@/lib/site";
import { isLive } from "@/lib/ledger";
import { LiveTransactions } from "@/live/Ledger";

export const metadata: Metadata = { title: "Ledger" };
export const dynamic = "force-dynamic";

const FILTER_LABELS: Record<TxFilter, string> = { all: "All", Transfer: "Transfers", Stake: "Stakes", Unstake: "Unstakes", "Signer change": "Signer changes" };
const hrefFor = (type: TxFilter, p = 1) => {
  const q = new URLSearchParams();
  if (type !== "all") q.set("type", type);
  if (p > 1) q.set("p", String(p));
  const s = q.toString();
  return `/ledger/transactions${s ? `?${s}` : ""}`;
};

export default async function Transactions({ searchParams }: { searchParams: Promise<{ p?: string | string[]; type?: string | string[] }> }) {
  const sp = await searchParams;
  const page = pageParam(sp.p);
  const rawType = Array.isArray(sp.type) ? sp.type[0] : sp.type;
  if (isLive()) return <LiveTransactions page={page} type={rawType} />;
  const type: TxFilter = (TX_FILTERS as readonly string[]).includes(rawType ?? "") ? (rawType as TxFilter) : "all";
  const data = await getLedger().transactions(page, type);
  const filters: TxFilter[] = ["all", ...TX_FILTERS];
  return (
    <div className="wrap page">
      <div className="kicker">Ledger</div>
      <h1>Transactions</h1>
      <LedgerTabs on="tx" />
      <div style={{ marginBottom: 12 }}>
        <Tabs on={type} items={filters.map((f) => ({ id: f, href: hrefFor(f), label: FILTER_LABELS[f] }))} />
      </div>
      <div className="panel"><TxTable list={data.items} /></div>
      <Pager href={(p) => hrefFor(type, p)} page={page} total={data.total} per={data.per} shown={data.items.length} />
    </div>
  );
}
