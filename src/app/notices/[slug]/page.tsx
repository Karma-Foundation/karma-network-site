import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Crumb } from "@/components/ui";
import { dateStr } from "@/lib/format";
import { getLedger } from "@/lib/ledger";
import { isLive } from "@/lib/ledger";
import { LiveNotice } from "@/live/Rules";

export const metadata: Metadata = { title: "Notices" };
export const dynamic = "force-dynamic";

export default async function NoticePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (isLive()) return <LiveNotice slug={slug} />;
  const n = (await getLedger().notices()).find((x) => x.slug === slug);
  if (!n) notFound();
  return (
    <div className="wrap page">
      <Crumb items={[{ href: "/notices", label: "Notices" }, { label: dateStr(n.date) }]} />
      <div style={{ marginBottom: 10 }}><span className={`tag ${n.kind === "Incident" || n.kind === "Upgrade proposed" || n.kind === "Transfer announced" ? "amber" : "green"}`}>{n.kind}</span></div>
      <h1 style={{ fontSize: 34, maxWidth: 820 }}>{n.title}</h1>
      <p className="muted mono f13" style={{ margin: "12px 0 28px" }}>{dateStr(n.date)}</p>
      <div className="prose">
        {n.body.map((p, i) => <p key={i}>{p}</p>)}
      </div>
      <div className="section" style={{ marginTop: 32 }}>
        <h2 style={{ marginBottom: 12, fontSize: 22 }}>On the record</h2>
        <div className="list">
          {n.links.map((l) => <Link key={l.href} href={l.href}>{l.label} →</Link>)}
        </div>
      </div>
    </div>
  );
}
