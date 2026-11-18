import type { Metadata } from "next";
import { CouncilRules } from "@/components/CouncilRules";
import { UpgradeTable } from "@/components/ui";
import { getLedger, isLive } from "@/lib/ledger";
import { LiveParameterRecord } from "@/live/Rules";

export const metadata: Metadata = { title: "Governance" };
export const dynamic = "force-dynamic";

// The council's rules come first, word for word (src/components/CouncilRules.tsx).
// The ledger's own record of parameters and their changes stays below it, because
// /protocol, the home page and the notices link here for it.
export default async function Governance() {
  if (isLive()) {
    return (
      <div className="wrap page">
        <CouncilRules showParametersLink />
        <LiveParameterRecord />
      </div>
    );
  }
  const upgrades = await getLedger().upgrades();
  return (
    <div className="wrap page">
      <CouncilRules />
      <div className="section" style={{ marginTop: 56 }}>
        <div className="panel">
          <div className="panel-h"><h3>Change log</h3><span className="muted small">every rule change since genesis</span></div>
          <UpgradeTable list={upgrades} />
        </div>
      </div>
    </div>
  );
}
