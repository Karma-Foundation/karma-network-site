import type { Metadata } from "next";
import Link from "next/link";
import { Crumb } from "@/components/ui";
import { carriedOut, decisionId, sortedDecisions, voteCount, type Decision } from "@/content/decisions";
import { shortTx } from "@/lib/format";

export const metadata: Metadata = { title: "Decision log" };

/**
 * Carried out: a link to each transaction on this site, or "Not yet", or "No transaction".
 * A withheld decision shows the status only, never a transaction.
 */
export function CarriedOutCell({ d }: { d: Decision }) {
  if (d.detailWithheld || !d.transactions.length) return <span className="muted">{carriedOut(d)}</span>;
  return (
    <>
      {d.transactions.map((t, i) => (
        <span key={t}>{i > 0 && ", "}<Link className="mono" href={`/tx/${t}`}>{shortTx(t)}</Link></span>
      ))}
    </>
  );
}

export default function Decisions() {
  const list = sortedDecisions();
  return (
    <div className="wrap page">
      <Crumb items={[{ href: "/governance", label: "Governance" }, { label: "Decision log" }]} />
      <div className="kicker">Governance</div>
      <h1>Decision log</h1>
      <p className="lede" style={{ margin: "16px 0 32px" }}>Every decision of the Karma Council, numbered and dated, newest first.</p>
      <div className="panel">
        {list.length ? (
          <div className="tw wp-table" style={{ margin: 0 }}>
            <table>
              <thead><tr><th>Number</th><th>Date</th><th>Decision</th><th>Kind</th><th>Vote</th><th>Result</th><th>Carried out</th></tr></thead>
              <tbody>
                {list.map((d) => (
                  <tr key={d.number}>
                    <td style={{ whiteSpace: "nowrap" }}><Link className="mono" href={`/decisions/${decisionId(d.number)}`}>{decisionId(d.number)}</Link></td>
                    <td className="mono muted" style={{ whiteSpace: "nowrap" }}>{d.date}</td>
                    <td>{d.decision}</td>
                    <td>{d.kind}</td>
                    <td className="mono" style={{ whiteSpace: "nowrap" }}>{voteCount(d)}</td>
                    <td className={d.result === "Passed" ? "green" : "amber"} style={{ whiteSpace: "nowrap" }}>{d.result}</td>
                    <td style={{ whiteSpace: "nowrap" }}><CarriedOutCell d={d} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty">No decisions yet. The council has not held its first meeting.</div>
        )}
      </div>
      <p className="muted f13" style={{ marginTop: 12 }}>How the council decides is on the <Link href="/governance">governance page</Link>.</p>
    </div>
  );
}
