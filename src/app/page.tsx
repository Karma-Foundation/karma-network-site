import Link from "next/link";
import { DocCards, HoldersTable, RULE_TEXT, ShareBars, Stats, UpgradeTable, WalletCard } from "@/components/ui";
import { K, fmt, pct } from "@/lib/format";
import { getLedger } from "@/lib/ledger";
import { PRE_MINE } from "@/lib/ledger/rules";
import { isLive } from "@/lib/ledger";
import { LiveHome } from "@/live/Home";

export const dynamic = "force-dynamic";

export default async function Home() {
  if (isLive()) return <LiveHome />;
  const ledger = getLedger();
  const [supply, runners, first, wallets, upgrades] = await Promise.all([
    ledger.supply(),
    ledger.runners(),
    ledger.addresses(1),
    ledger.wallets(),
    ledger.upgrades(),
  ]);
  const issued = supply.issued;
  const top = first.items.slice(0, 8);
  const prot = wallets.foundation.address.balance + wallets.tech.address.balance;
  const top10 = first.items.slice(0, 10).reduce((s, a) => s + a.balance, 0);
  const independent = runners.filter((r) => r.independent).length;

  return (
    <div className="wrap page">
      <div className="hero">
        <h1>A rule-based ledger that issues and distributes Karma.</h1>
        <p className="lede" style={{ margin: "24px 0" }}>
          Karma (к) is created by a fixed protocol, not by a company. Every rule, every wallet the protocol controls, and every change to the rules is published here. This site sells nothing.
        </p>
        <div className="btns">
          <Link className="btn primary" href="/protocol">Read the rules</Link>
          <Link className="btn" href="/ledger/blocks">Open the ledger</Link>
          <Link className="btn" href="/why">Why it exists</Link>
        </div>
      </div>
      <div className="section"><Stats supply={supply} runners={runners} /></div>

      <div className="section two">
        <div>
          <div className="kicker">01 - The rules</div>
          <h2>What the protocol does, and nothing else</h2>
          <p className="body">The protocol has one job: issue Karma on a fixed schedule and distribute it according to published rules. It does not run a wallet, an exchange, or a marketplace.</p>
          <p><Link href="/protocol">Full rules →</Link></p>
        </div>
        <div className="panel rows">
          <div className="k">Maximum supply</div><div className="mono">{RULE_TEXT.maxSupply}</div>
          <div className="k">Block time</div><div className="mono">{RULE_TEXT.blockTime}</div>
          <div className="k">Issuance</div><div className="mono">{RULE_TEXT.issuance}</div>
          <div className="k">Distribution per block</div><div><ShareBars /></div>
          <div className="k">Changing the rules</div>
          <div className="mono">Only by a versioned protocol upgrade, signed by the required signers and adopted by runners. <Link href="/governance">Every change is logged.</Link></div>
        </div>
      </div>

      <div className="section">
        <div className="sec-head">
          <div style={{ maxWidth: 720 }}>
            <div className="kicker">02 - The ledger</div>
            <h2>Who holds Karma</h2>
            <p className="body">Every balance on the ledger, ranked. Protocol-controlled wallets are labelled. Everything else is a pseudonymous address; labels appear only where the owner has published one.</p>
          </div>
          <Link href="/ledger/addresses" className="fw5" style={{ whiteSpace: "nowrap" }}>All {fmt(supply.holders)} addresses →</Link>
        </div>
        <div className="panel"><HoldersTable list={top} issued={issued} /></div>
        <div className="cards" style={{ marginTop: 16 }}>
          <div className="card"><div className="cardk">Protocol-controlled</div><div className="big">{pct(prot, issued)}</div><div className="d">of issued supply, in two multisig wallets</div></div>
          <div className="card"><div className="cardk">Top 10 addresses</div><div className="big">{pct(top10, issued, 1)}</div><div className="d">of issued supply</div></div>
          <div className="card"><div className="cardk">Pre-mine</div><div className="big">{K(PRE_MINE)}</div><div className="d">no allocation existed before block 1</div></div>
        </div>
      </div>

      <div className="section">
        <div className="sec-intro">
          <div className="kicker">03 - Control</div>
          <h2>Who controls what</h2>
          <p className="body">Two wallets receive protocol issuance and are controlled by named signers. No single person can move funds from either. Signers, thresholds and spending policies are published and every outgoing transaction is on the ledger.</p>
        </div>
        <div className="grid2"><WalletCard w={wallets.foundation} /><WalletCard w={wallets.tech} /></div>
        <div className="grid2" style={{ marginTop: 20 }}>
          <div className="card">
            <div className="t">Protocol runners</div>
            <div className="body f14">{runners.length} nodes produce blocks and validate transactions. {independent} are run by operators unrelated to the founders. Any runner can be replaced; no runner can change the rules alone.</div>
            <Link href="/runners">Runner list and how to run one →</Link>
          </div>
          <div className="card">
            <div className="t">Legal status</div>
            <div className="body f14">As of September 2026, no company owns or operates the protocol. The two wallets above are multisignature addresses, not legal entities. Formation of a foundation entity is under evaluation; this line will be updated when it changes.</div>
          </div>
        </div>
      </div>

      <div className="section two">
        <div>
          <div className="kicker">04 - Governance</div>
          <h2>How the rules change</h2>
          <p className="body">Changes are proposed in writing, versioned, signed by the Foundation wallet signers and adopted by runners. Signers are elected by holders and can be recalled. There is no token-weighted voting on rules.</p>
          <p><Link href="/governance">Governance →</Link></p>
        </div>
        <div className="panel"><UpgradeTable list={upgrades} /></div>
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
              <tr><td className="fw5">Karma Terminal</td><td className="wrap-ok body">Wallet. Holds keys, sends and stakes к.</td><td>[Operator entity]</td><td className="muted">Independent</td></tr>
              <tr><td className="fw5">Karma Exchange</td><td className="wrap-ok body">Trades к against USDC via a bridge to Ethereum.</td><td>[Operator entity]</td><td className="muted">Independent</td></tr>
              <tr><td className="fw5">Anyone else</td><td className="wrap-ok body">The ledger is open. Any wallet or service can read and write to it under the same rules.</td><td className="muted">-</td><td className="muted">No permission needed</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="section two">
        <div>
          <div className="kicker">06 - Documents</div>
          <h2>Read the source</h2>
          <p className="body">Everything above can be checked against the specification, the code and the ledger itself.</p>
        </div>
        <DocCards />
      </div>
    </div>
  );
}
