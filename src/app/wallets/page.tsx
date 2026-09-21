import type { Metadata } from "next";
import { HoldersTable, WalletCard } from "@/components/ui";
import { K, pct } from "@/lib/format";
import { getLedger } from "@/lib/ledger";
import { isLive } from "@/lib/ledger";
import { LiveWallets } from "@/live/Rules";

export const metadata: Metadata = { title: "Wallets" };
export const dynamic = "force-dynamic";

export default async function WalletsPage() {
  if (isLive()) return <LiveWallets />;
  const ledger = getLedger();
  const [supply, w] = await Promise.all([ledger.supply(), ledger.wallets()]);
  const f = w.foundation;
  const t = w.tech;
  const balance = f.address.balance + t.address.balance;
  const pending = [f.pending, t.pending].filter((p) => p !== null);
  return (
    <div className="wrap page">
      <div className="kicker">Wallets</div>
      <h1>Protocol-controlled wallets</h1>
      <p className="lede" style={{ margin: "16px 0 32px" }}>Two addresses receive issuance and are controlled by named signers. Both are ordinary multisig addresses on the ledger; nothing about them is special to the protocol beyond receiving a share.</p>
      <div className="grid2"><WalletCard w={f} /><WalletCard w={t} /></div>
      <div className="cards" style={{ marginTop: 20 }}>
        <div className="card"><div className="cardk">Combined balance</div><div className="big">{K(balance)}</div><div className="d">{pct(balance, supply.issued)} of issued</div></div>
        <div className="card"><div className="cardk">Combined outflow</div><div className="big">{K(f.address.sent + t.address.sent)}</div><div className="d">{f.outgoing + t.outgoing} outgoing transactions, all with public memos</div></div>
        <div className="card"><div className="cardk">Pending</div><div className="big amber">{pending.length}</div><div className="d">{pending.length ? pending.map((p) => `${K(p.amount)} · ${p.signed} signatures`).join("; ") : "none"}</div></div>
      </div>
      <div className="section" style={{ marginTop: 48 }}>
        <h2 style={{ marginBottom: 16 }}>Third-party wallets with a published label</h2>
        <div className="panel"><HoldersTable list={w.thirdParty} issued={supply.issued} /></div>
        <p className="muted f13" style={{ marginTop: 10 }}>Any address owner can publish a label by signing a message with the address key. Labels are never assigned by the network.</p>
      </div>
    </div>
  );
}
