import type { Metadata } from "next";
import { UPTIME } from "@/components/ui";
import { ago, fmt, minsUntil } from "@/lib/format";
import { getLedger } from "@/lib/ledger";
import { BLOCK_MINUTES, blockTime } from "@/lib/ledger/rules";
import { isLive } from "@/lib/ledger";
import { LiveStatus } from "@/live/Rules";

export const metadata: Metadata = { title: "Status" };
export const dynamic = "force-dynamic";

export default async function Status() {
  if (isLive()) return <LiveStatus />;
  const ledger = getLedger();
  const [supply, runners, incidents] = await Promise.all([ledger.supply(), ledger.runners(), ledger.incidents()]);
  const H = supply.height;
  const inSync = runners.filter((r) => r.status === "in sync");
  const behind = runners.filter((r) => r.status !== "in sync");
  const nextMin = minsUntil(blockTime(H + 1));
  return (
    <div className="wrap page">
      <div className="kicker">Status</div>
      <h1>Network status</h1>
      <p className="lede" style={{ margin: "16px 0 32px" }}>Live view of the chain and the services this site depends on.</p>
      <div className="stats n4">
        <div className="stat"><div className="l">Block height</div><div className="v">{fmt(H)}</div><div className="s">{ago(supply.lastBlockTime)}</div></div>
        <div className="stat"><div className="l">Next block expected</div><div className="v">{nextMin} min</div><div className="s">{BLOCK_MINUTES}-minute target</div></div>
        <div className="stat"><div className="l">Runners in sync</div><div className="v">{inSync.length} of {runners.length}</div><div className="s">{behind.length ? behind.map((r) => `${r.id} one block behind`).join(", ") : "all in sync"}</div></div>
        <div className="stat"><div className="l">Uptime since genesis</div><div className="v">{UPTIME}</div><div className="s">{incidents.length} incident{incidents.length === 1 ? "" : "s"}</div></div>
      </div>
      <div className="section" style={{ marginTop: 32 }}>
        <h2 style={{ marginBottom: 16 }}>Services</h2>
        <div className="panel tw">
          <table>
            <thead><tr><th>Service</th><th>Status</th><th>Last checked</th></tr></thead>
            <tbody>
              {["Block production", "Ledger API", "This site"].map((s) => (
                <tr key={s}><td>{s}</td><td><span className="status-ok"><span className="dot" />operational</span></td><td className="mono muted">just now</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="section">
        <h2 style={{ marginBottom: 16 }}>Incidents</h2>
        <div className="panel tw">
          <table>
            <thead><tr><th>Date</th><th>What happened</th><th>Duration</th><th>Resolution</th></tr></thead>
            <tbody>
              {incidents.map((i) => (
                <tr key={i.date}><td className="mono muted">{i.date}</td><td className="wrap-ok">{i.what}</td><td className="mono">{i.duration}</td><td className="wrap-ok">{i.resolution}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
