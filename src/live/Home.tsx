import Link from "next/link";
import { DocCards } from "@/components/ui";
import { KD, ago, dateStr, fmt, fmtDec, isoMs, pctDec } from "@/lib/format";
import { MAX_SUPPLY, addresses, eraOf, genesis, history, overview, paramMap, protocolWallets, runners, supplyIdentity, blocks } from "@/lib/ledger/live/data";
import { ChangeTable, RankedTable, ShareBarsLive, shareRows } from "./parts";

export async function LiveHome() {
  const [ov, sup, p, rs, hist, gen, latest, top, pw] = await Promise.all([overview(), supplyIdentity(), paramMap(), runners(), history(), genesis(), blocks(1, 0), addresses(10, 0), protocolWallets()]);
  const sum = (xs: string[]) => xs.reduce((a, x) => a + Number(x), 0);
  const inWallets = Number(sup.total_in_wallets);
  const poolHeld = sum(top.filter((a) => pw.labels[a.public_address]).map((a) => a.balance));
  const top10 = sum(top.map((a) => a.balance));
  const lb = ov.chain.latest_block;
  const era = eraOf(lb.height);
  const perBlock = latest[0]?.emission_amount ?? null;
  const active = rs.filter((r) => !r.stale).length;
  return (
    <div className="wrap page">
      <div className="hero">
        <h1>A rule-based ledger that issues and distributes Karma.</h1>
        <p className="lede" style={{ margin: "24px 0" }}>Karma (к) is created by a fixed protocol, not by a company. Every rule, every change to the rules and every block is published here, read directly from the ledger. This site sells nothing.</p>
        <div className="btns">
          <Link className="btn primary" href="/protocol">Read the rules</Link>
          <Link className="btn" href="/ledger/blocks">Open the ledger</Link>
          <Link className="btn" href="/why">Why it exists</Link>
        </div>
      </div>
      <div className="section">
        <div className="stats">
          <div className="stat"><div className="l">Block height</div><div className="v">{fmt(lb.height)}</div><div className="s">last block {ago(isoMs(lb.sealed_at))}</div></div>
          <div className="stat"><div className="l">Emitted by blocks</div><div className="v">{KD(sup.total_emitted)}</div><div className="s">{pctDec(sup.total_emitted, MAX_SUPPLY, 3)} of max supply</div></div>
          <div className="stat"><div className="l">Max supply</div><div className="v">{KD(MAX_SUPPLY)}</div><div className="s">fixed</div></div>
          <div className="stat"><div className="l">Wallets</div><div className="v">{fmt(ov.wallets.total)}</div><div className="s">{fmt(ov.wallets.kreators)} are Kreator wallets</div></div>
          <div className="stat"><div className="l">Protocol runners</div><div className="v">{rs.length}</div><div className="s">{active} seen in the last 3 minutes</div></div>
          <div className="stat"><div className="l">Genesis</div><div className="v">{gen ? dateStr(isoMs(gen.created_at)) : "-"}</div><div className="s">block 0</div></div>
        </div>
      </div>

      <div className="section two">
        <div>
          <div className="kicker">01 - The rules</div>
          <h2>What the protocol does, and nothing else</h2>
          <p className="body">The protocol has one job: issue Karma on a fixed schedule and distribute it according to published rules. The numbers on the right are the ledger&apos;s own parameters, as of this block.</p>
          <p><Link href="/protocol">Full rules →</Link></p>
        </div>
        <div className="panel rows">
          <div className="k">Maximum supply</div><div className="mono">{KD(MAX_SUPPLY)}</div>
          <div className="k">Block time</div><div className="mono">{ov.chain.block_interval_seconds / 60} minutes</div>
          <div className="k">Issuance</div><div className="mono">{perBlock ? KD(perBlock) : "-"} per block now: the era rate of {era.fullRate} к, released at {p.emission_release_pct ?? "-"}%. The era rate halves after blocks 105,119 and 210,239.</div>
          <div className="k">Distribution per block</div><div><ShareBarsLive rows={shareRows(p)} /></div>
          <div className="k">Transfer fee</div><div className="mono">{p.transaction_fee_pct ?? "-"}% of the amount; {p.fee_burn_ratio ?? "-"}% of the fee is burned</div>
          <div className="k">Changing the rules</div><div className="mono">Parameters change only by an on-ledger config update that every runner replays. <Link href="/governance">Every change is logged.</Link></div>
        </div>
      </div>

      <div className="section">
        <div className="sec-intro">
          <div className="kicker">02 - The ledger</div>
          <h2>Where all Karma is</h2>
          <p className="body">The ledger checks one identity after every block: everything ever created equals everything held, burned or not yet released. These are the ledger&apos;s own figures.</p>
        </div>
        <div className="panel rows">
          <div className="k">Emitted by blocks</div><div className="mono">{KD(sup.total_emitted)}</div>
          <div className="k">Pre-mine allocation</div><div className="mono">{KD(sup.total_allocation)} · created at genesis, released on a vesting schedule</div>
          <div className="k">Held in wallets</div><div className="mono">{KD(sup.total_in_wallets)}</div>
          <div className="k">Burned</div><div className="mono">{KD(sup.total_burned)} · fees and unused reward budget</div>
          <div className="k">Pre-mine not yet released</div><div className="mono">{KD(sup.unreleased_pre_mine)}</div>
          <div className="k">Identity</div>
          <div className="mono">{fmtDec(sup.left_side)} = {fmtDec(sup.right_side)} · <span className={sup.holds ? "green" : "red"}>{sup.holds ? "holds" : "DOES NOT HOLD"}</span> · discrepancy {KD(sup.discrepancy)}</div>
        </div>
        <div className="cards" style={{ marginTop: 16 }}>
          <div className="card"><div className="cardk">Staked on Kreators</div><div className="big">{KD(ov.staking.total_staked)}</div><div className="d">{fmt(ov.staking.active_stakes)} active stakes</div></div>
          <div className="card"><div className="cardk">Pre-mine</div><div className="big">{KD(sup.total_allocation)}</div><div className="d">{pctDec(sup.total_allocation, MAX_SUPPLY, 0)} of max supply; {pctDec(sup.unreleased_pre_mine, sup.total_allocation, 1)} still unreleased</div></div>
          <div className="card"><div className="cardk">Transactions</div><div className="big">{fmt(ov.transactions.all_time)}</div><div className="d">all time</div></div>
        </div>
      </div>

      <div className="section">
        <div className="sec-head">
          <div style={{ maxWidth: 720 }}>
            <h2>Who holds Karma</h2>
            <p className="body">Every wallet on the ledger, ranked by balance. Protocol pool wallets are labelled. Everything else is a pseudonymous address.</p>
          </div>
          <Link href="/ledger/addresses" className="fw5" style={{ whiteSpace: "nowrap" }}>All {fmt(ov.wallets.total)} wallets →</Link>
        </div>
        <div className="panel"><RankedTable list={top.slice(0, 8)} labels={pw.labels} issued={sup.total_in_wallets} /></div>
        <div className="cards" style={{ marginTop: 16 }}>
          <div className="card"><div className="cardk">Protocol pool wallets</div><div className="big">{inWallets ? `${((100 * poolHeld) / inWallets).toFixed(1)}%` : "-"}</div><div className="d">of Karma in wallets, in the {pw.pools.length} pool wallets in the top 10</div></div>
          <div className="card"><div className="cardk">Top 10 wallets</div><div className="big">{inWallets ? `${((100 * top10) / inWallets).toFixed(1)}%` : "-"}</div><div className="d">of Karma in wallets</div></div>
          <div className="card"><div className="cardk">Kreator wallets</div><div className="big">{fmt(ov.wallets.kreators)}</div><div className="d">of {fmt(ov.wallets.total)} wallets</div></div>
        </div>
      </div>

      <div className="section">
        <div className="sec-intro">
          <div className="kicker">03 - Control</div>
          <h2>Who controls what</h2>
          <p className="body">Blocks are produced and co-signed by runners. A block is final when enough runners have signed it.</p>
        </div>
        <div className="grid2">
          <div className="card">
            <div className="t">Protocol runners</div>
            <div className="body f14">{rs.length} runners; the latest block carries {lb.signatures} of {lb.signers_total} signatures. A block needs {p.quorum_threshold_signatures ?? "-"} signatures to finalize. All runners are operated by the protocol team today. Independent operators: [DATE].</div>
            <Link href="/runners">Runner list →</Link>
          </div>
          <div className="card">
            <div className="t">Legal status</div>
            <div className="body f14">As of September 2026, no company owns or operates the protocol. Formation of a foundation entity is under evaluation; this line will be updated when it changes.</div>
          </div>
        </div>
        <div className="grid2" style={{ marginTop: 20 }}>
          {pw.pools.filter((x) => x.name === "foundation" || x.name === "tech_builders").map((x) => (
            <div className="card" key={x.name}>
              <div className="t">{x.label} pool</div>
              <div className="body f14">Receives {x.name === "foundation" ? p.emission_foundation_pct : p.emission_tech_builders_pct}% of every block. Balance, history and pre-mine vesting are on its address page. Who can sign for it: [DATE].</div>
              <Link href={`/address/${x.public_address}`} className="mono">{x.public_address.slice(0, 8)}…{x.public_address.slice(-4)} →</Link>
            </div>
          ))}
        </div>
      </div>

      <div className="section two">
        <div>
          <div className="kicker">04 - Governance</div>
          <h2>How the rules change</h2>
          <p className="body">Every rule is a ledger parameter. A change is a config update included in a block, and the ledger keeps the before and after values.</p>
          <p><Link href="/governance">All parameters and the full change log →</Link></p>
        </div>
        <div className="panel">
          <div className="panel-h"><h3>Latest changes</h3><span className="muted small">{hist.length} since {hist.length ? dateStr(isoMs(hist[hist.length - 1].timestamp)) : "-"}</span></div>
          <ChangeTable list={hist.slice(0, 6)} />
        </div>
      </div>

      <div className="section">
        <div className="sec-intro">
          <div className="kicker">05 - Built on the ledger</div>
          <h2>What Karma Network is not</h2>
          <p className="body">Products that use the ledger are built and operated by others. The network does not run, own, endorse or guarantee any of them. If one fails, the ledger does not.</p>
        </div>
        <div className="panel tw">
          <table>
            <thead><tr><th>Service</th><th>What it does</th><th>Operator</th><th>Relationship</th></tr></thead>
            <tbody>
              <tr><td className="fw5">Karma Terminal</td><td className="wrap-ok body">Wallet. Sends and stakes к.</td><td>[Operator entity]</td><td className="muted">[Relationship]</td></tr>
              <tr><td className="fw5">Anyone else</td><td className="wrap-ok body">Third-party wallets are not enabled on the ledger today (parameter third_party_wallets_enabled = {p.third_party_wallets_enabled ?? "-"}).</td><td className="muted">-</td><td className="muted">-</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="section two">
        <div>
          <div className="kicker">06 - Documents</div>
          <h2>Read the source</h2>
          <p className="body">Everything above can be checked against the ledger itself.</p>
        </div>
        <DocCards specTitle="Protocol rules" />
      </div>
    </div>
  );
}
