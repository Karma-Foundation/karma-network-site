import type { Metadata } from "next";
import Link from "next/link";
import { Crumb, ShareBars } from "@/components/ui";
import { K, fmt, pct, short } from "@/lib/format";
import { getLedger } from "@/lib/ledger";
import {
  ADDRESS_FORMAT_TEXT,
  BLOCK_MINUTES,
  HALVING,
  KREATOR_SPLIT_PCT,
  MAX_SUPPLY,
  PER_BLOCK,
  PRE_MINE,
  SHARES,
  SIGNATURE_SCHEME,
  SPEC_VERSION,
  STAKER_SPLIT_PCT,
  UPGRADE_NOTICE_DAYS,
} from "@/lib/ledger/rules";
import { isLive } from "@/lib/ledger";
import { LiveProtocol } from "@/live/Rules";

export const metadata: Metadata = { title: "Protocol" };
export const dynamic = "force-dynamic";

export default async function Protocol() {
  if (isLive()) return <LiveProtocol />;
  const ledger = getLedger();
  const [supply, wallets] = await Promise.all([ledger.supply(), ledger.wallets()]);
  const nextHalving = HALVING - (supply.height % HALVING);
  const years = ((nextHalving * BLOCK_MINUTES) / 60 / 24 / 365).toFixed(1);
  const f = wallets.foundation;
  const t = wallets.tech;

  return (
    <div className="wrap page">
      <Crumb items={[{ href: "/", label: "Home" }, { label: "Protocol" }]} />
      <div className="kicker">Protocol specification {SPEC_VERSION}</div>
      <h1>The rules</h1>
      <p className="lede" style={{ margin: "16px 0 32px" }}>Everything the protocol enforces, in one page. Where a number can change, the page says how.</p>

      <div className="two">
        <div><h3 style={{ marginBottom: 8 }}>Supply</h3><p className="body f14">Issuance is the only way Karma comes into existence. Emitted per block, split by fixed shares.</p></div>
        <div className="panel rows">
          <div className="k">Maximum supply</div><div className="mono">{K(MAX_SUPPLY)}</div>
          <div className="k">Issued to date</div><div className="mono">{K(supply.issued)} ({pct(supply.issued, MAX_SUPPLY)})</div>
          <div className="k">Block time</div><div className="mono">{BLOCK_MINUTES} minutes · target, enforced by runner consensus</div>
          <div className="k">Issuance per block</div><div className="mono">{PER_BLOCK} к · current epoch</div>
          <div className="k">Halving</div><div className="mono">every {fmt(HALVING)} blocks · next in {fmt(nextHalving)} blocks (about {years} years)</div>
          <div className="k">Pre-mine</div><div className="mono">{PRE_MINE === 0 ? "none" : K(PRE_MINE)} · block 1 is the first issuance</div>
        </div>
      </div>

      <div className="two" style={{ marginTop: 40 }}>
        <div><h3 style={{ marginBottom: 8 }}>Distribution</h3><p className="body f14">Each block&apos;s {PER_BLOCK} к is split the same way every time. The two wallet shares go to multisig addresses whose signers are published.</p></div>
        <div className="panel rows">
          <div className="k">Shares</div><div><ShareBars /></div>
          <div className="k">Builders ({SHARES.builders} к/block)</div><div className="mono">Distributed to staked Kreators and their stakers by the reward rule below. Nothing accumulates in a wallet.</div>
          <div className="k">Foundation ({SHARES.foundation} к/block)</div><div className="mono">To <Link href={`/address/${f.address.addr}`}>{short(f.address.addr)}</Link>, multisig {f.threshold}.</div>
          <div className="k">Tech Builders ({SHARES.tech} к/block)</div><div className="mono">To <Link href={`/address/${t.address.addr}`}>{short(t.address.addr)}</Link>, multisig {t.threshold}.</div>
          <div className="k">Validators ({SHARES.validators} к/block)</div><div className="mono">To the runner that produced the block. <Link href="/runners">Runner list.</Link></div>
        </div>
      </div>

      <div className="two" style={{ marginTop: 40 }}>
        <div><h3 style={{ marginBottom: 8 }}>Builder reward rule</h3><p className="body f14">Rewards favour many independent stakers over one large one.</p></div>
        <div className="panel rows">
          <div className="k">Weight per Kreator</div><div className="mono">weight = √(total stake) × log₂(unique stakers + 1)</div>
          <div className="k">Share of Builders pool</div><div className="mono">weight ÷ sum of all weights, per block</div>
          <div className="k">Split</div><div className="mono">{KREATOR_SPLIT_PCT}% to the Kreator, {STAKER_SPLIT_PCT}% to stakers pro rata</div>
          <div className="k">Unique stakers</div><div className="mono">one address counts once (v1.3)</div>
          <div className="k">Unstake</div><div className="mono">immediate, no lock, no penalty</div>
        </div>
      </div>

      <div className="two" style={{ marginTop: 40 }}>
        <div><h3 style={{ marginBottom: 8 }}>Accounts and signatures</h3></div>
        <div className="panel rows">
          <div className="k">Signature scheme</div><div className="mono">{SIGNATURE_SCHEME}</div>
          <div className="k">Address</div><div className="mono">{ADDRESS_FORMAT_TEXT}</div>
          <div className="k">Freezing, reversal</div><div className="mono">not possible. No function in the protocol can freeze, seize or reassign a balance.</div>
          <div className="k">Multisig</div><div className="mono">native; threshold and signer set are on-ledger and public</div>
        </div>
      </div>

      <div className="two" style={{ marginTop: 40 }}>
        <div><h3 style={{ marginBottom: 8 }}>Changing the rules</h3></div>
        <div className="panel rows">
          <div className="k">Who</div><div className="mono">Foundation wallet signers propose and sign; all runners must adopt</div>
          <div className="k">Notice</div><div className="mono">{UPGRADE_NOTICE_DAYS} days minimum between first signature and activation</div>
          <div className="k">Record</div><div className="mono"><Link href="/governance">versioned change log</Link>, block number of activation, signature count</div>
        </div>
      </div>
    </div>
  );
}
