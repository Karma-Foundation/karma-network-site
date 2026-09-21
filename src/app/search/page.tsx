import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { HoldersTable } from "@/components/ui";
import { getLedger } from "@/lib/ledger";

export const metadata: Metadata = { title: "Ledger" };
export const dynamic = "force-dynamic";

// A hit redirects, so the address bar ends on the result and a reload never re-runs the search.
export default async function Search({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const raw = (await searchParams).q;
  const q = (Array.isArray(raw) ? raw[0] : raw) ?? "";
  const ledger = getLedger();
  const r = await ledger.search(q.slice(0, 200));
  if (r.kind === "block") redirect(`/block/${r.n}`);
  if (r.kind === "address") redirect(`/address/${r.addr}`);
  if (r.kind === "tx") redirect(`/tx/${r.id}`);
  if (r.kind === "empty") {
    return (
      <div className="wrap page">
        <h1>Search</h1>
        <p className="body" style={{ marginTop: 12 }}>Enter an address, a block number or a transaction id.</p>
      </div>
    );
  }
  const { issued } = await ledger.supply();
  const n = r.addresses.length;
  return (
    <div className="wrap page">
      <h1>Search</h1>
      <p className="muted" style={{ margin: "8px 0 24px" }}>{n} result{n === 1 ? "" : "s"} for <span className="mono break">{r.q}</span></p>
      {n ? <div className="panel"><HoldersTable list={r.addresses} issued={issued} /></div> : <div className="empty">Nothing on the ledger matches.</div>}
    </div>
  );
}
