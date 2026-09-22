import Link from "next/link";
import { notFound } from "next/navigation";
import { Crumb } from "@/components/ui";
import { KD, ago, dateStr, fmt, isoMs, pctDec, timeStr } from "@/lib/format";
import { ERAS, MAX_SUPPLY, address, blocks, eraOf, history, overview, paramMap, parameters, protocolWallets, runners, supplyIdentity, type ParamChange } from "@/lib/ledger/live/data";
import { ChangeTable, NotPublished, ShareBarsLive, shareRows } from "./parts";

export async function LiveProtocol() {
  const [ov, sup, p, latest] = await Promise.all([overview(), supplyIdentity(), paramMap(), blocks(1, 0)]);
  const H = ov.chain.latest_block.height;
  const era = eraOf(H);
  const b = latest[0];
  const v = (k: string) => p[k] ?? "-";
  return (
    <div className="wrap page">
      <Crumb items={[{ href: "/", label: "Home" }, { label: "Protocol" }]} />
      <div className="kicker">Protocol rules</div>
      <h1>The rules</h1>
      <p className="lede" style={{ margin: "16px 0 32px" }}>What the protocol enforces, read from the ledger&apos;s own parameters at block {fmt(H)}. Where a number can change, it changes only by a logged config update.</p>

      <div className="two">
        <div><h3 style={{ marginBottom: 8 }}>Supply</h3><p className="body f14">Karma exists in two ways: a pre-mine allocation created at genesis and released over time, and block emission.</p></div>
        <div className="panel rows">
          <div className="k">Maximum supply</div><div className="mono">{KD(MAX_SUPPLY)}</div>
          <div className="k">Pre-mine allocation</div><div className="mono">{KD(sup.total_allocation)} ({pctDec(sup.total_allocation, MAX_SUPPLY, 0)} of max) · {KD(sup.unreleased_pre_mine)} not yet released</div>
          <div className="k">Emitted by blocks</div><div className="mono">{KD(sup.total_emitted)} ({pctDec(sup.total_emitted, MAX_SUPPLY, 3)} of max)</div>
          <div className="k">Burned to date</div><div className="mono">{KD(sup.total_burned)}</div>
          <div className="k">Block time</div><div className="mono">{ov.chain.block_interval_seconds / 60} minutes</div>
          <div className="k">Emission per block</div><div className="mono">{b ? KD(b.emission_amount) : "-"} now = era rate {era.fullRate} к × release {v("emission_release_pct")}% (in force from block {fmt(Number(v("emission_release_pct_activation_block")) || 0)})</div>
          <div className="k">Halving</div><div className="mono">{ERAS.map((e, i) => `${e.fullRate} к ${e.upTo ? `to block ${fmt(e.upTo)}` : "after"}${i < ERAS.length - 1 ? " · " : ""}`).join("")}</div>
        </div>
      </div>

      <div className="two" style={{ marginTop: 40 }}>
        <div><h3 style={{ marginBottom: 8 }}>Distribution</h3><p className="body f14">Each block&apos;s emission is split the same way every time.</p></div>
        <div className="panel rows">
          <div className="k">Shares</div><div><ShareBarsLive rows={shareRows(p)} /></div>
          <div className="k">Latest block</div><div className="mono">{b ? `${KD(b.community_amount)} Builders · ${KD(b.foundation_amount)} Foundation · ${KD(b.builders_amount)} Tech Builders · ${KD(b.validators_amount)} Validators` : "-"}</div>
          <div className="k">Inside the Builders pool</div><div className="mono">{v("builders_pool_staking_share")}% staking rewards, {v("builders_pool_tx_share")}% transaction rewards. Unused transaction budget redirected to staking: {v("redirect_unused_tx_reward_to_staking_enabled")}.</div>
          <div className="k">Runner rewards</div><div className="mono">paid to runners: {v("runner_rewards_enabled")}</div>
        </div>
      </div>

      <div className="two" style={{ marginTop: 40 }}>
        <div><h3 style={{ marginBottom: 8 }}>Staking</h3><p className="body f14">Rewards favour many independent stakers over one large one.</p></div>
        <div className="panel rows">
          <div className="k">Weight per Kreator</div><div className="mono">weight = √(total stake) × log₂(unique stakers + 1)</div>
          <div className="k">Split</div><div className="mono">{v("staking_reward_split_profile")}% to the Kreator, {v("staking_reward_split_staker")}% to stakers</div>
          <div className="k">Minimum stake</div><div className="mono">{KD(v("min_stake_amount"))}</div>
          <div className="k">Cap per Kreator</div><div className="mono">{v("max_stake_per_profile_pct")}% of a balance</div>
          <div className="k">Unstake</div><div className="mono">{v("unstaking_cooldown_days")}-day cooldown before unstaked Karma returns to the balance</div>
        </div>
      </div>

      <div className="two" style={{ marginTop: 40 }}>
        <div><h3 style={{ marginBottom: 8 }}>Transfers</h3></div>
        <div className="panel rows">
          <div className="k">Fee</div><div className="mono">{v("transaction_fee_pct")}% of the amount, charged on top: {v("fee_on_top_enabled")}</div>
          <div className="k">Fee burn</div><div className="mono">{v("fee_burn_ratio")}% of the fee is burned</div>
          <div className="k">Reward cap</div><div className="mono">{v("tx_reward_cap_pct")}% of the transaction reward pool per Kreator per cycle</div>
          <div className="k">Third-party wallets</div><div className="mono">enabled: {v("third_party_wallets_enabled")}</div>
          <div className="k">Bridge</div><div className="mono">enabled: {v("bridge_enabled")}</div>
        </div>
      </div>

      <div className="two" style={{ marginTop: 40 }}>
        <div><h3 style={{ marginBottom: 8 }}>Blocks and signatures</h3></div>
        <div className="panel rows">
          <div className="k">Signature scheme</div><div className="mono">ED25519</div>
          <div className="k">Address</div><div className="mono">64 hexadecimal characters</div>
          <div className="k">Finality</div><div className="mono">{v("quorum_threshold_signatures")} runner signatures within {v("quorum_window_seconds")} seconds</div>
          <div className="k">Block capacity</div><div className="mono">{fmt(Number(v("max_transactions_per_block")) || 0)} transactions</div>
          <div className="k">Supply check</div><div className="mono">after every block: emitted + pre-mine = in wallets + burned + unreleased. <Link href="/status">Current result.</Link></div>
        </div>
      </div>
      <p className="muted f13" style={{ marginTop: 24 }}><Link href="/governance">All {Object.keys(p).length} parameters and every change to them →</Link></p>
    </div>
  );
}

export async function LiveGovernance() {
  const [params, hist] = await Promise.all([parameters(), history()]);
  const cats = [...new Set(params.map((p) => p.category))].sort((a, b) => (a === "system" ? 1 : b === "system" ? -1 : a.localeCompare(b)));
  return (
    <div className="wrap page">
      <div className="kicker">Governance</div>
      <h1>How the rules change</h1>
      <p className="lede" style={{ margin: "16px 0 32px" }}>Every rule is a ledger parameter. A change is a config update included in a block and replayed by every runner; the ledger keeps the value before and after. This page is that record.</p>
      <div className="panel">
        <div className="panel-h"><h3>Change log</h3><span className="muted small">{hist.length} changes, newest first</span></div>
        <ChangeTable list={hist} />
      </div>
      <div className="section" style={{ marginTop: 32 }}>
        <NotPublished title="Who may change a parameter">
          <div>Every change so far is recorded under the actor <span className="mono">system:foundation</span>. The ledger does not publish who holds that key, how many signatures it needs, or any election or recall process. Signers, thresholds and terms: [DATE].</div>
        </NotPublished>
      </div>
      {cats.map((c) => (
        <div className="section" key={c}>
          <h2 style={{ marginBottom: 16, textTransform: "capitalize" }}>{c} parameters</h2>
          <div className="panel tw">
            <table>
              <thead><tr><th>Parameter</th><th>Value</th><th>Type</th><th>Last changed</th></tr></thead>
              <tbody>{params.filter((p) => p.category === c).map((p) => (
                <tr key={p.key}><td className="mono"><Link href={`/governance/${encodeURIComponent(p.key)}`}>{p.key}</Link></td><td className="mono">{p.value}</td><td className="mono muted">{p.data_type}</td><td className="mono muted">{dateStr(isoMs(p.updated_at))}</td></tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

export async function LiveParameter({ name }: { name: string }) {
  const key = decodeURIComponent(name);
  const [params, hist] = await Promise.all([parameters(), history()]);
  const p = params.find((x) => x.key === key);
  if (!p) notFound();
  return (
    <div className="wrap page">
      <Crumb items={[{ href: "/governance", label: "Governance" }, { label: <span className="mono">{p.key}</span> }]} />
      <h1 className="mono break" style={{ fontSize: 28, marginBottom: 24 }}>{p.key}</h1>
      <div className="panel rows">
        <div className="k">Value</div><div className="mono break">{p.value}</div>
        <div className="k">Type</div><div className="mono">{p.data_type}</div>
        <div className="k">Category</div><div className="mono">{p.category}</div>
        <div className="k">Last changed</div><div className="mono">{timeStr(isoMs(p.updated_at))}</div>
      </div>
      <div className="section" style={{ marginTop: 32 }}>
        <h2 style={{ marginBottom: 12 }}>Changes</h2>
        <div className="panel"><ChangeTable list={hist.filter((h) => h.key === key)} /></div>
      </div>
    </div>
  );
}

export async function LiveRunners() {
  const [rs, p] = await Promise.all([runners(), paramMap()]);
  return (
    <div className="wrap page">
      <div className="kicker">Runners</div>
      <h1>Who runs the protocol</h1>
      <p className="lede" style={{ margin: "16px 0 32px" }}>Runners propose blocks and co-sign each other&apos;s. A block is final once {p.quorum_threshold_signatures ?? "-"} runners have signed it.</p>
      <div className="panel tw">
        <table>
          <thead><tr><th>Runner</th><th>Public endpoint</th><th>Protocol version</th><th>Last seen</th><th className="right">Blocks signed</th><th className="right">Last signed block</th><th>Status</th></tr></thead>
          <tbody>{rs.map((r) => (
            <tr key={r.name}>
              <td className="mono">{r.name}</td>
              <td className="mono muted">{r.endpoint ?? "-"}</td>
              <td className="mono">{r.protocol_version ?? "-"}</td>
              <td className="mono muted">{r.last_seen_at ? ago(isoMs(r.last_seen_at)) : "-"}</td>
              <td className="right mono">{r.blocks_signed !== null ? fmt(r.blocks_signed) : "-"}</td>
              <td className="right mono">{r.last_signed_block !== null ? <Link href={`/block/${r.last_signed_block}`}>{fmt(r.last_signed_block)}</Link> : "-"}</td>
              <td>{r.stale ? <span className="amber f13">not seen for 3 minutes</span> : <span className="status-ok"><span className="dot" />seen</span>}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <div className="grid2" style={{ marginTop: 32 }}>
        <div className="panel">
          <div className="panel-h"><h3>Operators</h3></div>
          <div className="panel-b list body f14">
            <div>All runners are operated by the protocol team today. None is independent.</div>
            <div>Runner rewards are switched {p.runner_rewards_enabled === "true" ? "on" : "off"} on the ledger (parameter runner_rewards_enabled).</div>
            <div>Independent operators and how to become one: [DATE]. Setup guide [LINK]</div>
          </div>
        </div>
        <div className="panel">
          <div className="panel-h"><h3>What a runner cannot do</h3></div>
          <div className="panel-b list body f14">
            <div>Finalize a block alone: it needs the other runners&apos; signatures.</div>
            <div>Create Karma outside the emission rule: every runner re-derives each block and the supply identity is checked after every block.</div>
            <div>Change a parameter without a logged config update.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export async function LiveStatus() {
  const [ov, sup, rs] = await Promise.all([overview(), supplyIdentity(), runners()]);
  const lb = ov.chain.latest_block;
  const next = isoMs(lb.sealed_at) + ov.chain.block_interval_seconds * 1000;
  const stale = rs.filter((r) => r.stale);
  return (
    <div className="wrap page">
      <div className="kicker">Status</div>
      <h1>Network status</h1>
      <p className="lede" style={{ margin: "16px 0 32px" }}>Live view of the chain, as the ledger reports it.</p>
      <div className="stats n4">
        <div className="stat"><div className="l">Block height</div><div className="v">{fmt(lb.height)}</div><div className="s">sealed {ago(isoMs(lb.sealed_at))}</div></div>
        <div className="stat"><div className="l">Next block expected</div><div className="v">{timeStr(next).slice(-9)}</div><div className="s">{ov.chain.block_interval_seconds / 60}-minute target</div></div>
        <div className="stat"><div className="l">Latest block signed by</div><div className="v">{lb.signatures} of {lb.signers_total}</div><div className="s">{stale.length ? `${stale.map((r) => r.name).join(", ")} not seen for 3 minutes` : "all runners seen"}</div></div>
        <div className="stat"><div className="l">Runner uptime, 3 days</div><div className="v">{ov.operators.runners.uptime_pct_3d}%</div><div className="s">{ov.operators.runners.active} of {ov.operators.runners.total} active</div></div>
      </div>
      <div className="section" style={{ marginTop: 32 }}>
        <h2 style={{ marginBottom: 16 }}>Supply identity</h2>
        <div className="panel rows">
          <div className="k">Result</div><div className={sup.holds ? "green" : "red"}>{sup.holds ? "holds" : "DOES NOT HOLD"}</div>
          <div className="k">Created</div><div className="mono">{KD(sup.total_emitted)} emitted + {KD(sup.total_allocation)} pre-mine = {KD(sup.left_side)}</div>
          <div className="k">Accounted for</div><div className="mono">{KD(sup.total_in_wallets)} in wallets + {KD(sup.total_burned)} burned + {KD(sup.unreleased_pre_mine)} unreleased = {KD(sup.right_side)}</div>
          <div className="k">Discrepancy</div><div className="mono">{KD(sup.discrepancy)}</div>
        </div>
      </div>
      <div className="section">
        <NotPublished title="Incidents">
          <div>The ledger does not publish an incident log. Until one exists, outages are not listed here rather than reconstructed from memory.</div>
        </NotPublished>
      </div>
    </div>
  );
}

export async function LiveWallets() {
  const [p, sup, latest, pw] = await Promise.all([paramMap(), supplyIdentity(), blocks(1, 0), protocolWallets()]);
  const b = latest[0];
  const details = await Promise.all(pw.pools.map((x) => address(x.public_address, 1, 0)));
  const perBlock: Record<string, string | undefined> = { builders: b?.community_amount, foundation: b?.foundation_amount, tech_builders: b?.builders_amount, validators: b?.validators_amount };
  const sharePct: Record<string, string | undefined> = { builders: p.emission_builders_pct, foundation: p.emission_foundation_pct, tech_builders: p.emission_tech_builders_pct, validators: p.emission_validators_pct };
  return (
    <div className="wrap page">
      <div className="kicker">Wallets</div>
      <h1>Protocol-controlled wallets</h1>
      <p className="lede" style={{ margin: "16px 0 32px" }}>Four pool wallets receive a share of every block, and two of them also hold the pre-mine allocation, released daily on a five-year schedule. All figures are the ledger&apos;s own.</p>
      <div className="panel tw">
        <table>
          <thead><tr><th>Pool</th><th>Address</th><th className="right">Share</th><th className="right">Latest block</th><th className="right">Balance</th><th className="right">Staked</th><th className="right">Transactions</th></tr></thead>
          <tbody>{pw.pools.map((x, i) => (
            <tr key={x.name}>
              <td className="fw5">{x.label}</td>
              <td><Link className="mono" href={`/address/${x.public_address}`}>{x.public_address.slice(0, 8)}…{x.public_address.slice(-4)}</Link></td>
              <td className="right mono">{sharePct[x.name] ?? "-"}%</td>
              <td className="right mono">{perBlock[x.name] ? KD(perBlock[x.name]) : "-"}</td>
              <td className="right mono">{details[i] ? KD(details[i]!.balance) : "-"}</td>
              <td className="right mono">{details[i] && details[i]!.staked !== "0.000" ? KD(details[i]!.staked) : "-"}</td>
              <td className="right mono">{details[i] ? fmt(details[i]!.tx_count) : "-"}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <p className="muted f13" style={{ marginTop: 10 }}>The Builders share is paid out to Kreators and stakers every block rather than accumulating; its wallet is the pass-through.</p>

      <div className="section" style={{ marginTop: 40 }}>
        <h2 style={{ marginBottom: 12 }}>Pre-mine</h2>
        <p className="body f14" style={{ maxWidth: 720, margin: "0 0 16px" }}>{KD(sup.total_allocation)} was allocated at genesis and vests daily. {KD(sup.unreleased_pre_mine)} is still unreleased.</p>
        <div className="panel tw">
          <table>
            <thead><tr><th>Allocation</th><th>Address</th><th className="right">Total</th><th className="right">Released so far</th><th className="right">Per day</th><th>Vesting</th></tr></thead>
            <tbody>{pw.preMine.map((x) => (
              <tr key={x.name}>
                <td className="mono">{x.name}</td>
                <td><Link className="mono" href={`/address/${x.public_address}`}>{x.public_address.slice(0, 8)}…{x.public_address.slice(-4)}</Link>{pw.labels[x.public_address] && <> <span className="muted small">{pw.labels[x.public_address]}</span></>}</td>
                <td className="right mono">{KD(x.total_allocation)}</td>
                <td className="right mono">{KD(x.total_released)} ({pctDec(x.total_released, x.total_allocation, 1)})</td>
                <td className="right mono">{KD(x.daily_release)}</td>
                <td className="mono muted">{x.vesting_start ? dateStr(isoMs(x.vesting_start)) : "-"} to {x.vesting_end ? dateStr(isoMs(x.vesting_end)) : "-"}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>

      <div className="section">
        <NotPublished title="Signers and spending policy">
          <div>The ledger does not record who can sign for these wallets, how many signatures a transfer needs, or a spending policy. Every outgoing transaction is on each wallet&apos;s address page. Signers, thresholds and policy: [DATE].</div>
        </NotPublished>
      </div>
    </div>
  );
}

/* ---------- notices: one entry per day on which parameters changed ---------- */
export interface DayNotice { slug: string; date: number; changes: ParamChange[] }
export async function dayNotices(): Promise<DayNotice[]> {
  const byDay = new Map<string, ParamChange[]>();
  for (const c of await history()) {
    const day = new Date(isoMs(c.timestamp)).toISOString().slice(0, 10);
    byDay.set(day, [...(byDay.get(day) ?? []), c]);
  }
  return [...byDay.entries()].map(([slug, changes]) => ({ slug, date: Date.parse(`${slug}T00:00:00Z`), changes })).sort((a, b) => b.date - a.date);
}
const noticeTitle = (n: DayNotice) => (n.changes.length === 1 ? `Parameter changed: ${n.changes[0].key}` : `${n.changes.length} parameters changed`);

export async function LiveNotices() {
  const list = await dayNotices();
  return (
    <div className="wrap page">
      <div className="kicker">Notices</div>
      <h1>Protocol notices</h1>
      <p className="lede" style={{ margin: "16px 0 32px" }}>Protocol-level events only. Today the ledger publishes one kind: a change to a parameter. Each day with a change is one notice.</p>
      <div className="panel">
        {list.map((n) => (
          <div key={n.slug} className="notice-item">
            <div className="mono muted f13">{dateStr(n.date)}</div>
            <div>
              <div style={{ marginBottom: 6 }}><span className="tag green">Parameter change</span></div>
              <h3><Link href={`/notices/${n.slug}`}>{noticeTitle(n)}</Link></h3>
              <p className="sum mono">{n.changes.slice(0, 3).map((c) => `${c.key}: ${c.before ?? "-"} → ${c.after ?? "-"}`).join(" · ")}{n.changes.length > 3 ? " · ..." : ""}</p>
            </div>
          </div>
        ))}
        {!list.length && <div className="empty">No notices.</div>}
      </div>
      <p className="muted f13" style={{ marginTop: 12 }}>Software upgrades, incidents, elections and announced transfers are not published by the ledger and so are not listed.</p>
    </div>
  );
}

export async function LiveNotice({ slug }: { slug: string }) {
  const n = (await dayNotices()).find((x) => x.slug === slug);
  if (!n) notFound();
  return (
    <div className="wrap page">
      <Crumb items={[{ href: "/notices", label: "Notices" }, { label: dateStr(n.date) }]} />
      <div style={{ marginBottom: 10 }}><span className="tag green">Parameter change</span></div>
      <h1 style={{ fontSize: 34, maxWidth: 820 }}>{noticeTitle(n)}</h1>
      <p className="muted mono f13" style={{ margin: "12px 0 28px" }}>{dateStr(n.date)}</p>
      <div className="panel"><ChangeTable list={n.changes} /></div>
    </div>
  );
}
