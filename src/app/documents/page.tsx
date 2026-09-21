import type { Metadata } from "next";
import { DocCards } from "@/components/ui";

export const metadata: Metadata = { title: "Documents" };

export default function Documents() {
  return (
    <div className="wrap page">
      <div className="kicker">Documents</div>
      <h1>Read the source</h1>
      <p className="lede" style={{ margin: "16px 0 32px" }}>Everything on this site can be checked against the specification, the code and the ledger itself.</p>
      <DocCards />
      <div className="section" style={{ marginTop: 48 }}>
        <h2 style={{ marginBottom: 16 }}>Ledger API</h2>
        <div className="panel rows">
          <div className="k">Base</div><div className="mono">https://api.karmanetwork.org/v1</div>
          <div className="k">Endpoints</div><div className="mono" style={{ whiteSpace: "normal" }}>/blocks · /blocks/{"{n}"} · /tx/{"{id}"} · /addresses · /addresses/{"{addr}"} · /supply · /runners · /upgrades</div>
          <div className="k">Auth</div><div className="mono">none · read-only · rate limit 60 requests/minute</div>
          <div className="k">Export</div><div className="mono">any table on this site as CSV, any address history as CSV</div>
        </div>
      </div>
      <div className="section">
        <h2 style={{ marginBottom: 16 }}>Contact</h2>
        <div className="panel rows">
          <div className="k">Protocol questions</div><div className="mono">[EMAIL]</div>
          <div className="k">Security disclosure</div><div className="mono">[EMAIL] · PGP key [LINK]</div>
          <div className="k">Press</div><div className="mono">[EMAIL]</div>
        </div>
      </div>
    </div>
  );
}
