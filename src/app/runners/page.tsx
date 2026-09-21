import type { Metadata } from "next";
import Link from "next/link";
import { fmt } from "@/lib/format";
import { getLedger } from "@/lib/ledger";

export const metadata: Metadata = { title: "Runners" };
export const revalidate = 60;

export default async function Runners() {
  const runners = await getLedger().runners();
  return (
    <div className="wrap page">
      <div className="kicker">Runners</div>
      <h1>Who runs the protocol</h1>
      <p className="lede" style={{ margin: "16px 0 32px" }}>Runners produce blocks and validate transactions. Each earns the validator share of the blocks it produces. Any runner can be replaced; no runner can change the rules alone.</p>
      <div className="panel tw">
        <table>
          <thead><tr><th>Runner</th><th>Operator</th><th>Location</th><th>Since</th><th>Version</th><th className="right">Height</th><th className="right">Blocks produced</th><th>Status</th></tr></thead>
          <tbody>
            {runners.map((r) => (
              <tr key={r.id}>
                <td className="mono">{r.id}</td>
                <td className="wrap-ok">{r.op}{r.independent && <> <span className="tag gray">independent</span></>}</td>
                <td>{r.city}</td>
                <td className="mono muted">blk {fmt(r.since)}</td>
                <td className="mono">{r.version}</td>
                <td className="right mono">{fmt(r.height)}</td>
                <td className="right mono">{fmt(r.produced)}</td>
                <td><span className="status-ok"><span className="dot" />{r.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid2" style={{ marginTop: 32 }}>
        <div className="panel">
          <div className="panel-h"><h3>Run a node</h3></div>
          <div className="panel-b list body f14">
            <div>Requirements: 2 vCPU, 4 GB RAM, 40 GB disk, a public IP.</div>
            <div>Install from the release tag, sync from genesis (about 20 minutes), announce your key.</div>
            <div>New runners are admitted by the existing runners at a simple majority. Removal follows the same rule.</div>
            <Link href="/documents">Setup guide [LINK]</Link>
          </div>
        </div>
        <div className="panel">
          <div className="panel-h"><h3>What a runner cannot do</h3></div>
          <div className="panel-b list body f14">
            <div>Create Karma outside the issuance rule.</div>
            <div>Freeze, seize or reassign a balance.</div>
            <div>Change the rules without a signed upgrade.</div>
            <div>Censor a valid transaction for more than one block: the next runner includes it.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
