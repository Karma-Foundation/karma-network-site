import type { Metadata } from "next";
import Link from "next/link";
import { dateStr } from "@/lib/format";
import { getLedger } from "@/lib/ledger";
import { isLive } from "@/lib/ledger";
import { LiveNotices } from "@/live/Rules";

export const metadata: Metadata = { title: "Notices" };
export const dynamic = "force-dynamic";

export default async function Notices() {
  if (isLive()) return <LiveNotices />;
  const notices = await getLedger().notices();
  return (
    <div className="wrap page">
      <div className="kicker">Notices</div>
      <h1>Protocol notices</h1>
      <p className="lede" style={{ margin: "16px 0 32px" }}>Protocol-level events only: an upgrade proposed or adopted, an incident, an election, a wallet transfer announced before signing. Nothing else is posted here.</p>
      <div className="panel">
        {notices.map((n) => (
          <div key={n.slug} className="notice-item">
            <div className="mono muted f13">{dateStr(n.date)}</div>
            <div>
              <div style={{ marginBottom: 6 }}><span className={`tag ${n.kind === "Incident" || n.kind === "Upgrade proposed" || n.kind === "Transfer announced" ? "amber" : "green"}`}>{n.kind}</span></div>
              <h3><Link href={`/notices/${n.slug}`}>{n.title}</Link></h3>
              <p className="sum">{n.body[0]}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
