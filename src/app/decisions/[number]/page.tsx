import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { Crumb } from "@/components/ui";
import { carriedOut, decisionId, findDecision, voteCount, type Seat } from "@/content/decisions";
import { fmtDec } from "@/lib/format";

export const metadata: Metadata = { title: "Decision log" };

const SEATS: Seat[] = [1, 2, 3];

export default async function DecisionPage({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  const d = findDecision(decodeURIComponent(number));
  if (!d) notFound();
  const id = decisionId(d.number);
  // One stable address per decision: /decisions/D-001.
  if (number !== id) permanentRedirect(`/decisions/${id}`);
  const cost = d.cost ? [d.cost.usdc && `${fmtDec(d.cost.usdc)} USDC`, d.cost.karma && `${fmtDec(d.cost.karma)} к`].filter(Boolean).join(" · ") : "";
  return (
    <div className="wrap page">
      <Crumb items={[{ href: "/governance", label: "Governance" }, { href: "/decisions", label: "Decision log" }, { label: id }]} />
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 8 }}>
        <h1 className="mono" style={{ fontSize: 34 }}>{id}</h1>
        <span className={`tag ${d.result === "Passed" ? "green" : "amber"}`}>{d.result}</span>
      </div>
      <p className="lede" style={{ margin: "0 0 24px" }}>{d.decision}</p>
      <div className="panel rows">
        <div className="k">Date</div><div className="mono">{d.date}</div>
        <div className="k">Kind</div><div>{d.kind}</div>
        <div className="k">Vote</div><div className="mono">{voteCount(d)}</div>
        <div className="k">Result</div><div className={d.result === "Passed" ? "green" : "amber"}>{d.result}</div>
        <div className="k">What was decided</div><div style={{ whiteSpace: "normal" }}>{d.detail}</div>
        <div className="k">Cost</div><div className="mono">{cost || "None"}</div>
        <div className="k">Carried out by</div><div>{d.carriedOutBy ? `Seat ${d.carriedOutBy}` : <span className="muted">-</span>}</div>
        <div className="k">Carried out</div><div>{carriedOut(d)}</div>
      </div>

      <div className="section" style={{ marginTop: 32 }}>
        <h2 style={{ marginBottom: 12 }}>Votes by seat</h2>
        <div className="panel tw">
          <table>
            <thead><tr><th>Seat</th><th>Vote</th></tr></thead>
            <tbody>
              {SEATS.map((s) => (
                <tr key={s}><td>Seat {s}</td><td className="mono">{d.votes[s]}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="section">
        <h2 style={{ marginBottom: 12 }}>Linked transactions</h2>
        <div className="panel">
          {d.transactions.length ? (
            <div className="panel-b list">
              {d.transactions.map((t) => <Link key={t} className="mono break" href={`/tx/${t}`}>{t}</Link>)}
            </div>
          ) : (
            <div className="empty">{carriedOut(d)}</div>
          )}
        </div>
      </div>
    </div>
  );
}
