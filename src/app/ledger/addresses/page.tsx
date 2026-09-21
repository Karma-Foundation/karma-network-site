import type { Metadata } from "next";
import { HoldersTable, LedgerTabs, Pager } from "@/components/ui";
import { getLedger } from "@/lib/ledger";
import { pageParam } from "@/lib/site";
import { isLive } from "@/lib/ledger";
import { LiveAddresses } from "@/live/Ledger";

export const metadata: Metadata = { title: "Ledger" };
export const dynamic = "force-dynamic";

export default async function Addresses({ searchParams }: { searchParams: Promise<{ p?: string | string[] }> }) {
  const page = pageParam((await searchParams).p);
  if (isLive()) return <LiveAddresses />;
  const ledger = getLedger();
  const [data, supply] = await Promise.all([ledger.addresses(page), ledger.supply()]);
  return (
    <div className="wrap page">
      <div className="kicker">Ledger</div>
      <h1>Addresses</h1>
      <LedgerTabs on="addr" />
      <div className="panel">
        {data.items.length ? <HoldersTable list={data.items} issued={supply.issued} /> : <div className="empty">No addresses on this page.</div>}
      </div>
      <Pager href={(p) => `/ledger/addresses?p=${p}`} page={page} total={data.total} per={data.per} shown={data.items.length} />
    </div>
  );
}
