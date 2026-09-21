import type { Metadata } from "next";
import { SignersTable, UpgradeTable } from "@/components/ui";
import { getLedger } from "@/lib/ledger";
import { RECALL_REQUEST_PCT, SIGNER_TERM_MONTHS, UPGRADE_NOTICE_DAYS } from "@/lib/ledger/rules";

export const metadata: Metadata = { title: "Governance" };
export const revalidate = 600;

export default async function Governance() {
  const ledger = getLedger();
  const [upgrades, w] = await Promise.all([ledger.upgrades(), ledger.wallets()]);
  return (
    <div className="wrap page">
      <div className="kicker">Governance</div>
      <h1>How the rules change</h1>
      <p className="lede" style={{ margin: "16px 0 32px" }}>Changes are proposed in writing, versioned, signed by the Foundation wallet signers and adopted by runners. Signers are elected by holders and can be recalled. There is no token-weighted voting on rules.</p>
      <div className="two">
        <div className="panel" style={{ alignSelf: "start" }}>
          <div className="panel-h"><h3>Terms</h3></div>
          <div className="panel-b list">
            <div className="kv"><span className="muted">Signer term</span><span className="mono">{SIGNER_TERM_MONTHS} months</span></div>
            <div className="kv"><span className="muted">Recall</span><span className="mono">by holder vote</span></div>
            <div className="kv"><span className="muted">Next election</span><span className="mono">[DATE]</span></div>
            <div className="kv"><span className="muted">Upgrade notice</span><span className="mono">{UPGRADE_NOTICE_DAYS} days minimum</span></div>
            <div className="kv"><span className="muted">Adoption</span><span className="mono">all runners</span></div>
          </div>
        </div>
        <div className="panel">
          <div className="panel-h"><h3>Change log</h3><span className="muted small">every rule change since genesis</span></div>
          <UpgradeTable list={upgrades} />
        </div>
      </div>
      <div className="section" style={{ marginTop: 48 }}><h2 style={{ marginBottom: 16 }}>Foundation wallet signers</h2><div className="panel"><SignersTable list={w.foundation.signers} /></div></div>
      <div className="section"><h2 style={{ marginBottom: 16 }}>Tech Builders wallet signers</h2><div className="panel"><SignersTable list={w.tech.signers} /></div></div>
      <div className="section">
        <h2 style={{ marginBottom: 16 }}>Elections and recall</h2>
        <div className="panel rows">
          <div className="k">Who votes</div><div>Any address with a balance above 0 at the snapshot block. One address, one vote.</div>
          <div className="k">Nominations</div><div>Open to anyone. A nominee publishes name, affiliation and any financial relationship to existing signers.</div>
          <div className="k">Recall</div><div>A recall vote opens when {RECALL_REQUEST_PCT}% of holding addresses sign a request. Passes at a simple majority of votes cast.</div>
          <div className="k">Founder seats</div><div>Person 1 and Person 2 hold seats until the first election in January 2027. After that, founders stand like everyone else.</div>
        </div>
      </div>
    </div>
  );
}
