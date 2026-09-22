import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyButton } from "@/components/CopyButton";
import { AddrLink, Crumb, Numbered, SignersTable, TxTable } from "@/components/ui";
import { K, fmt, pct, short } from "@/lib/format";
import { getLedger, type Tx } from "@/lib/ledger";
import { MAX_SUPPLY, blockTime } from "@/lib/ledger/rules";
import { pageParam } from "@/lib/site";
import { isLive } from "@/lib/ledger";
import { LiveAddress } from "@/live/Ledger";

export const metadata: Metadata = { title: "Ledger" };
export const dynamic = "force-dynamic";

export default async function AddressPage({ params, searchParams }: { params: Promise<{ addr: string }>; searchParams: Promise<{ p?: string | string[]; type?: string | string[] }> }) {
  const { addr } = await params;
  if (isLive()) {
    const sp = await searchParams;
    return <LiveAddress addr={addr} page={pageParam(sp.p)} type={Array.isArray(sp.type) ? sp.type[0] : sp.type} />;
  }
  const ledger = getLedger();
  const o = await ledger.address(addr);
  if (!o) notFound();
  const [supply, wallets, history] = await Promise.all([ledger.supply(), ledger.wallets(), ledger.txForAddress(addr)]);
  const w = wallets.foundation.address.addr === addr ? wallets.foundation : wallets.tech.address.addr === addr ? wallets.tech : null;
  const pending = w?.pending ?? null;
  const pendingLabels = pending ? await ledger.labels([pending.to]) : {};
  const H = supply.height;

  // Issuance credits collapse to one row per block; the two latest are shown, as in the prototype.
  const issuanceRows: Tx[] = w
    ? [0, 1].filter((d) => H - d >= 1).map((d) => ({ id: `issuance-${H - d}`, block: H - d, time: blockTime(H - d), from: "", to: addr, amount: w.perBlock, type: "Issuance", memo: d === 0 ? `Block reward, ${w.id === "foundation" ? "Foundation" : "Tech Builders"} share` : "Block reward" }))
    : [];
  const all = [...issuanceRows, ...history.items].sort((x, y) => y.block - x.block);
  const capped = history.total > history.items.length;

  return (
    <div className="wrap page">
      <Crumb items={[{ href: "/ledger/addresses", label: "Addresses" }, { label: o.label || short(addr) }]} />
      <div style={{ display: "flex", justifyContent: "space-between", gap: 24, flexWrap: "wrap", alignItems: "flex-start", marginBottom: 24 }}>
        <div className="col" style={{ gap: 10, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <h1 style={{ fontSize: 34 }}>{o.label || "Address"}</h1>
            {w && <span className="tag">protocol-controlled</span>}
            {o.tag && <span className={`tag${o.kind === "third" ? " gray" : ""}`}>{o.tag}</span>}
            {o.kind === "kreator" && <span className="tag gray">Kreator</span>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, maxWidth: "100%" }}>
            <div className="addrbox"><span>{addr}</span></div>
            <CopyButton value={addr} />
          </div>
          {w && <div className="body f14" style={{ maxWidth: 720 }}>{w.description}</div>}
          {o.kind === "third" && <div className="body f14" style={{ maxWidth: 720 }}>Holds к backing wKARMA on Ethereum. Operated by a third party; the network does not control this address.</div>}
        </div>
        <div className="btns"><Link className="btn" href="/documents">Export CSV</Link><Link className="btn" href="/documents">API</Link></div>
      </div>

      <div className={`stats ${w ? "n5" : "n4"}`}>
        <div className="stat"><div className="l">Balance</div><div className="v">{K(o.balance)}</div><div className="s">{pct(o.balance, supply.issued)} of issued · {pct(o.balance, MAX_SUPPLY, 3)} of max</div></div>
        <div className="stat"><div className="l">{w ? "Received from issuance" : "Received"}</div><div className="v">{K(o.received)}</div><div className="s">{w ? `${w.perBlock} к per block since block 1` : `first seen block ${fmt(o.first)}`}</div></div>
        <div className="stat"><div className="l">Sent</div><div className="v">{K(o.sent)}</div><div className="s">{o.received ? `${pct(o.sent, o.received, 1)} of received` : "-"}</div></div>
        <div className="stat"><div className="l">Transactions</div><div className="v">{fmt(history.total + (w ? H : 0))}</div><div className="s">{w ? "including one issuance credit per block" : "transfers and stakes"}</div></div>
        {w && (
          <div className="stat"><div className="l">Pending</div><div className="v amber">{pending ? 1 : 0}</div><div className="s">{pending ? `${K(pending.amount)} · ${pending.signed} signatures` : "none"}</div></div>
        )}
      </div>

      {w && (
        <div className="walletgrid">
          <div className="panel">
            <div className="panel-h"><h3>Signers</h3><span className="muted small">{w.signersNote}</span></div>
            <SignersTable list={w.signers} />
          </div>
          <div className="col" style={{ gap: 20 }}>
            <div className="panel">
              <div className="panel-h"><h3>Spending policy</h3></div>
              <div className="panel-b list body f14"><Numbered items={w.spendingPolicy} /></div>
            </div>
            {pending && (
              <div className="panel" style={{ background: "transparent" }}>
                <div className="panel-h"><h3>Pending</h3><span className="amber small">announced {pending.announced}</span></div>
                <div className="panel-b list">
                  <div className="kv"><span className="muted">Amount</span><span className="mono">{K(pending.amount)}</span></div>
                  <div className="kv"><span className="muted">To</span><span><AddrLink addr={pending.to} labels={pendingLabels} /></span></div>
                  <div className="kv"><span className="muted">Purpose</span><span style={{ textAlign: "right" }}>{pending.purpose}</span></div>
                  <div className="kv"><span className="muted">Signatures</span><span className="mono">{pending.signed} · {pending.signer}</span></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="section" style={{ marginTop: 40 }}>
        <div className="sec-head" style={{ marginBottom: 12, gap: 16 }}>
          <h2>Transactions</h2>
          <span className="muted f13">
            {w && "issuance credits collapse to one row per block · showing the latest 2"}
            {w && capped && " · "}
            {capped && `showing the latest ${fmt(history.items.length)} of ${fmt(history.total)} transactions`}
          </span>
        </div>
        <div className="panel"><TxTable list={all} /></div>
      </div>
    </div>
  );
}
