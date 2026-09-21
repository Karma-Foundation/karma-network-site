import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Crumb, Numbered } from "@/components/ui";
import { dateStr, fmt } from "@/lib/format";
import { getLedger } from "@/lib/ledger";
import { blockTime } from "@/lib/ledger/rules";

export const metadata: Metadata = { title: "Governance" };
export const revalidate = 600;

export default async function UpgradePage({ params }: { params: Promise<{ version: string }> }) {
  const { version } = await params;
  const ledger = getLedger();
  const [upgrades, runners] = await Promise.all([ledger.upgrades(), ledger.runners()]);
  const u = upgrades.find((x) => x.v === decodeURIComponent(version));
  if (!u) notFound();
  return (
    <div className="wrap page">
      <Crumb items={[{ href: "/governance", label: "Governance" }, { label: u.v }]} />
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 8 }}>
        <h1 style={{ fontSize: 34 }}>{u.v}</h1>
        <span className={`tag ${u.status === "Active" ? "green" : "amber"}`}>{u.status}</span>
      </div>
      <p className="lede" style={{ margin: "0 0 24px" }}>{u.title}</p>
      <div className="panel rows">
        <div className="k">Proposed</div><div className="mono">{u.proposed}</div>
        <div className="k">Signatures</div><div className="mono">{u.signed}</div>
        <div className="k">Activated</div><div className="mono">{u.block ? `block ${fmt(u.block)} · ${dateStr(blockTime(u.block))}` : "not yet"}</div>
        {u.notice && (<><div className="k">Notice</div><div>{u.notice}</div></>)}
        <div className="k">Adopted by</div><div className="mono">{u.block ? runners.map((r) => r.id).join(", ") : "-"}</div>
      </div>
      <div className="section" style={{ marginTop: 32 }}>
        <h2 style={{ marginBottom: 12 }}>What changes</h2>
        <div className="panel panel-b list body"><Numbered items={u.text} /></div>
      </div>
      <p className="muted f13">Full text, diff against the previous version and the signed proposal document: [LINK]</p>
    </div>
  );
}
