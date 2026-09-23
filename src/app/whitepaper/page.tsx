import type { Metadata } from "next";
import Link from "next/link";
import { Crumb } from "@/components/ui";
import { BridgeFig, LifecycleFig, RecognitionFig, ReplayFig, SplitFig, SupplyFig } from "./figures";

export const metadata: Metadata = {
  title: "Whitepaper",
  description: "Karma: a recognition ledger for the conscious economy. The protocol, its economics, its limits and the questions still open.",
};

const DRAFT = "0.1";
const AS_OF = { height: "16,559", date: "22 September 2026", pv: 52 };

const TOC: [string, string][] = [
  ["s1", "Summary"],
  ["s2", "The problem"],
  ["s3", "The Karma model"],
  ["s4", "Protocol architecture"],
  ["s5", "Consensus and verification"],
  ["s6", "Economics"],
  ["s7", "Recognition pipeline"],
  ["s8", "Identity and custody"],
  ["s9", "Bridge to Ethereum"],
  ["s10", "Governance"],
  ["s11", "Security and risk"],
  ["s12", "The network today"],
  ["s13", "Roadmap"],
  ["sA", "Appendix A: parameters"],
  ["sB", "Appendix B: actions"],
  ["sC", "Appendix C: glossary"],
];

function H2({ id, n, children }: { id: string; n: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="wp-h2">
      <span className="mono muted">{n}</span>
      {children}
    </h2>
  );
}

function Open({ children }: { children: React.ReactNode }) {
  return (
    <div className="wp-open" role="note">
      <span className="tag amber">Open point</span> {children}
    </div>
  );
}

function Formula({ children }: { children: string }) {
  return <pre className="wp-formula mono">{children}</pre>;
}

export default function Whitepaper() {
  return (
    <div className="wrap page wp">
      <Crumb items={[{ href: "/", label: "Home" }, { href: "/documents", label: "Documents" }, { label: "Whitepaper" }]} />
      <div className="kicker">Whitepaper · draft {DRAFT}</div>
      <h1 style={{ maxWidth: 820 }}>Karma: a recognition ledger for the conscious economy</h1>
      <p className="lede" style={{ margin: "16px 0 20px" }}>
        A permissioned, independently verifiable chain in which recognized creators earn the protocol&apos;s emission and their supporters earn alongside them.
      </p>
      <p className="muted mono f13" style={{ margin: "0 0 32px" }}>
        Draft {DRAFT} · 23 September 2026 · protocol version {AS_OF.pv} · figures as of block {AS_OF.height}
      </p>

      <div className="wp-grid">
        <nav className="wp-toc" aria-label="Contents">
          <div className="cardk">Contents</div>
          <ol>
            {TOC.map(([id, t], i) => (
              <li key={id}>
                <a href={`#${id}`}>
                  <span className="mono muted">{i < 13 ? String(i + 1).padStart(2, "0") : id.slice(1)}</span>
                  {t}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="prose wp-body">
          <div className="note" style={{ borderColor: "var(--line)", color: "var(--muted)" }}>
            This is a working draft for review. Boxes marked <span className="tag amber">Open point</span> are decisions the authors still need to settle or claims a reviewer would challenge. They are removed before publication.
          </div>

          <H2 id="s1" n="01">Summary</H2>
          <p className="wp-abstract">
            Karma is a ledger that pays people for being recognized by their community, not for the hashpower or capital they can bring. Artists, hosts, healers, venues and organizers in the conscious economy are admitted as <strong>Kreators</strong> through a review process. Once admitted, a Kreator earns a share of every block&apos;s emission in proportion to how broadly and how deeply the community stakes Karma behind them, and the stakers earn with them. The chain is run today by a small set of Foundation-operated block producers, but every block carries a transaction-set hash and a state hash that any third party can re-derive from public data, so correctness does not depend on trusting the operators.
          </p>
          <p>
            This paper describes the protocol as it runs on the production network at block {AS_OF.height} ({AS_OF.date}), the economic schedule the Foundation has adopted, and the parts of the design that are decided but not yet deployed. Where a mechanism is planned rather than live, the text says so. The intended readers are protocol researchers, investors, exchanges and partners; each section starts with the claim and follows with the mechanism.
          </p>
          <div className="stats n6 wp-stats">
            <div className="stat"><div className="l">Hard cap</div><div className="v">800M</div><div className="s">Karma, 0.001 smallest unit</div></div>
            <div className="stat"><div className="l">Block time</div><div className="v">10 min</div><div className="s">144 blocks per day</div></div>
            <div className="stat"><div className="l">To Kreators</div><div className="v">73%</div><div className="s">of every block</div></div>
            <div className="stat"><div className="l">Staking split</div><div className="v">50 / 50</div><div className="s">Kreator / stakers</div></div>
            <div className="stat"><div className="l">Pre-mine</div><div className="v">10%</div><div className="s">5-year linear vesting</div></div>
            <div className="stat"><div className="l">Genesis</div><div className="v">30 May</div><div className="s">2026, block 0</div></div>
          </div>

          <H2 id="s2" n="02">The problem</H2>
          <p>
            The conscious economy is large and almost entirely invisible to financial infrastructure. Festivals, retreat centres, ceremony hosts, breathwork and yoga teachers, independent musicians, studios and the volunteers around them create value that is recognized socially, through attendance, word of mouth and Instagram followings, but never recorded in a form that compounds. A host who has anchored a community for ten years has no balance sheet that says so.
          </p>
          <p>
            Two existing systems each capture half of the picture. Social platforms record recognition but keep it inside their own walls and monetize it through advertising. Blockchains record value transfer with strong integrity but reward capital and computation rather than contribution, and they have no notion of who a person is to a community.
          </p>
          <p>
            Karma sits between the two. It records recognition as a first-class, on-ledger fact (a profile is either recognized or it is not), turns that recognition into a claim on the protocol&apos;s emission, and lets the community shape the size of the claim by staking. Because staking is capped per person and the reward formula favours breadth of support over size of stake, the outcome reflects how many people stand behind a Kreator, not how rich one of them is.
          </p>

          <H2 id="s3" n="03">The Karma model</H2>
          <h3>Actors</h3>
          <div className="tw wp-table">
            <table>
              <thead><tr><th>Actor</th><th>Who</th><th>What they can do</th></tr></thead>
              <tbody>
                <tr><td><strong>Kreator</strong></td><td>A recognized creator profile: artist, host, venue, teacher. Called a Builder in the schema and code.</td><td>Receive stakes, earn staking and transaction rewards, spend from a builder wallet once the profile is claimed.</td></tr>
                <tr><td><strong>Holder</strong></td><td>Any registered user with a wallet.</td><td>Hold and transfer Karma, stake on Kreators, submit new profiles for recognition, invite others.</td></tr>
                <tr><td><strong>Staker</strong></td><td>A Holder with Karma staked on at least one Kreator.</td><td>Earn a pro-rata share of the network&apos;s staker rewards.</td></tr>
                <tr><td><strong>Core reviewers</strong></td><td>Community members appointed by the Foundation to vote on admissions.</td><td>Approve or reject submitted profiles; receive 1 Karma per successful in-favour vote.</td></tr>
                <tr><td><strong>Runners</strong></td><td>Block producers holding registered Ed25519 keys. Four today, all Foundation-operated.</td><td>Propose, cosign and finalize blocks.</td></tr>
                <tr><td><strong>Validators</strong></td><td>Independent, read-only replayers of the chain.</td><td>Re-derive every block from public data and attest or publish a discrepancy.</td></tr>
                <tr><td><strong>The Foundation</strong></td><td>The non-profit steward of the protocol.</td><td>Operate runners, sign administrative actions, tune parameters within published bounds, custody user keys in the current phase.</td></tr>
              </tbody>
            </table>
          </div>

          <h3>The core primitive: Recognition</h3>
          <p>
            Recognition is binary. A profile is submitted, screened, reviewed and either admitted or not. There is no score that a Kreator carries around and no ranking the protocol imposes. This is deliberate: a scored system invites gaming of the score, while a binary gate followed by community staking moves the question of &quot;how much&quot; to the people who actually know the Kreator.
          </p>
          <p>Recognition can be revoked. Revocation freezes the profile&apos;s rewards, returns every stake on it to the stakers through the normal cooldown, and does not claw back anything already earned.</p>

          <h3>The three flows of value</h3>
          <ol>
            <li><strong>Emission.</strong> Each block mints new Karma and splits it across four pools. The largest pool, 73 percent, is the Kreators&apos; pool.</li>
            <li><strong>Staking.</strong> Holders lock Karma behind a Kreator. Every block, the staking part of the Kreators&apos; pool is divided among recognized profiles by a weight that grows with the square root of the stake and the logarithm of the number of distinct stakers. Half of each profile&apos;s share goes to the Kreator, half to the stakers.</li>
            <li><strong>Transactions.</strong> Karma sent to a Kreator is a qualifying transaction. The transaction part of the Kreators&apos; pool is divided among Kreators in proportion to the qualifying volume they received, with a per-Kreator cap. Transfers carry a small fee of which half is burned.</li>
          </ol>

          <H2 id="s4" n="04">Protocol architecture</H2>
          <p>
            Karma is not a virtual machine. It is a fixed set of typed actions applied to a relational state, sealed into blocks every ten minutes, with two hashes per block that let anyone check both what was included and what the state became. The design goal was auditability first and decentralization of block production second, in that order, because a small network is better served by a chain a stranger can verify than by a chain many strangers can produce.
          </p>
          <h3>Envelopes</h3>
          <p>
            Every state change enters the system as an <strong>envelope</strong>: a JSON payload naming an action, its parameters and a millisecond timestamp, hashed with SHA-256 and signed with Ed25519 by the acting key. User actions (transfer, stake, unstake, submit a profile, claim a profile, register, event actions, bridge out) are signed by the user&apos;s key. Administrative actions (grants, parameter changes, admissions, unclaims, bridge releases) are signed by a registered system key, of which the Foundation key is one. Two actions, recognize and revoke, accept either signer while the legacy review interface is retired.
          </p>
          <p>
            Admission to the mempool is where most rules are enforced: signature, replay protection, balance and stake-cap checks, and, for administrative actions, the signer&apos;s allowed-action list. An envelope stays eligible for thirty minutes from its timestamp; after that it expires unincluded. Blocks include at most 1,000 envelopes in a canonical order (submission time, then payload hash), so any two honest nodes drain the same mempool into the same block.
          </p>
          <h3>Blocks</h3>
          <p>A block records the emission for its height, the amount that went to each pool, the rewards distributed and burned, the previous block&apos;s hash, and two commitments:</p>
          <ul>
            <li><strong>tx_set_hash</strong>: SHA-256 over the ordered payload hashes of every envelope the block included. It answers &quot;which actions happened&quot;.</li>
            <li><strong>state_hash</strong>: a commitment to the balances, stakes, profiles, pre-mine wallets and bridge state after the block. It answers &quot;what the world looks like now&quot;. Since protocol version 36 it is maintained incrementally by database triggers, so it costs the same for a million wallets as for a hundred.</li>
          </ul>
          <p>The block hash covers the economic fields, the previous hash and both commitments; runners sign the block hash. The state hash deliberately excludes the reward ledger tables, which lets those tables be partitioned, archived and reshaped without touching consensus.</p>
          <LifecycleFig />
          <h3>Era-aware execution</h3>
          <p>
            Protocol behaviour is controlled by around 130 parameters, of which 73 affect consensus. Each block stores a fingerprint of the consensus parameters in force when it was produced. A replayer reads the fingerprint, not the live configuration, so a block from June is re-executed under June&apos;s rules even if a rule changed in August. Code paths that a parameter switches off are never deleted, only gated by era, which is what makes replay from genesis possible after any number of upgrades. A change to a consensus parameter is itself an envelope included in a block, so the point at which a rule changed is on the ledger.
          </p>

          <H2 id="s5" n="05">Consensus and verification</H2>
          <p>Karma separates two questions that many chains fuse: who may write the next block, and who may check it. Writing is permissioned and small. Checking is open to anyone with the public API.</p>
          <h3>Block production</h3>
          <p>
            Runners hold registered keys and share write access to the canonical database. At each ten-minute boundary the proposer for height N is chosen round-robin from the runners seen in the last three minutes. If it does not propose within ten seconds, the next runner in line may; a further ten seconds later, the one after. Each cosigner independently drains the mempool, recomputes the block, and signs only if its hashes match the proposal. A block is finalized when the signature count reaches the quorum threshold, currently two of four, lowered automatically to the number of runners recently active so that a single offline runner cannot stall the chain. If no block is finalized for six consecutive slots the chain enters a degraded mode in which writes are refused and reads continue.
          </p>
          <p>
            The runner set today is four Foundation-operated nodes named foundation-1 to foundation-4. Two share the canonical database; two hold their own copies and cosign only after a full local replay. The fleet produced a block in every slot of the trailing three days at the time of writing. The current set is on the <Link href="/runners">runners page</Link>.
          </p>
          <h3>Independent verification</h3>
          <p>
            The strongest claim in this paper is that correctness is checkable without trust in the runners. An observer with its own empty database fetches each finalized block and its canonical envelope list from the public API, applies the envelopes locally under the block&apos;s recorded parameter fingerprint, distributes rewards, runs the supply invariant, and compares its own tx_set_hash and state_hash to the leader&apos;s. Any mismatch halts the observer and produces a typed report naming the block and which of the two hashes diverged. Two of the four production runners operate in exactly this mode and cosign from their own state, so a wrong block would fail to reach quorum rather than merely be reported afterwards.
          </p>
          <ReplayFig />
          <p>
            There is one thing a replayer cannot derive from envelopes alone: the emission amount, which is a function of height and the emission parameters. It is checked by the standalone validator command-line tool, which recomputes the schedule and the block hash and can co-sign against the public read-only API without any database.
          </p>
          <h3>Supply invariant</h3>
          <p>After every block, inside the same database transaction, the chain checks that</p>
          <Formula>{`total_emitted + pre_mine_allocation
  = sum(active + staked + cooldown balances) + total_burned + unreleased_pre_mine`}</Formula>
          <p>A failure rolls the block back and stops the worker. The invariant has held for every finalized block since genesis; the <Link href="/status">status page</Link> shows both sides of the equation and their difference, which is zero.</p>
          <Open>&quot;Permissioned block production plus open verification&quot; is the honest description of the current topology and it should stay that way in the paper. The 2025 consensus specification described five launch runners including three Founding Circle operators; production runs four Foundation nodes. The Founding Circle runners belong in the roadmap, not in the present tense.</Open>

          <H2 id="s6" n="06">Economics</H2>
          <h3>Supply</h3>
          <p>
            The hard cap is 800,000,000 Karma. Ten percent, 80,000,000, was allocated at genesis to two vesting wallets: 48,000,000 (6 percent) to the Foundation treasury and 32,000,000 (4 percent) to the Tech Builders who built the protocol. Both vest linearly over five years, released daily by the protocol itself, and unreleased balances are unspendable. The remaining 720,000,000 can only enter circulation through block emission.
          </p>
          <h3>Emission</h3>
          <p>Every block mints an amount determined by two factors: the <strong>era rate</strong> and the <strong>release percent</strong>.</p>
          <p>
            The era rate is 800 Karma per block in the first era, 400 in the second and 200 thereafter. Under the schedule the Foundation adopted on 23 September 2026 the eras are measured in Karma emitted rather than in blocks: the first era ends when 84,096,000 Karma have been emitted, the second after a further 42,048,000. Measuring by emission rather than by height keeps the halving points meaningful whatever the release percent does.
          </p>
          <p>
            The release percent throttles the era rate to match adoption. It has been 5 percent since block 12,833 (27 August 2026), so the chain currently mints 40 Karma per block. It rises by five points every quarter as a floor, reaching 100 percent after twenty quarters, and the Foundation may move it faster when the network&apos;s growth justifies it, according to the following rule evaluated once per quarter:
          </p>
          <Formula>{`growth_target  = 100 x min( 1, active_stakers / S*, karma_staked / K* )
release_next   = min( 100, max( floor_next, growth_target ) )
subject to     release_next - release_now <= 5  and  release_next >= release_now`}</Formula>
          <p>where S* and K* are published thresholds for active stakers and total Karma staked. The release percent never decreases and never jumps more than five points in a quarter, so the maximum emission path is always known in advance.</p>
          <Open>S* and K* are not yet set. The cumulative-emission halving is decided but not deployed; the code still halves at block heights 105,119 and 210,239 and must be changed through the testnet gate before this section is published.</Open>
          <p>Before block 12,833 the chain ran a fixed warm-up of 80 Karma per block from block 1. Those 12,832 blocks emitted 1,026,560 Karma and are part of history; nothing in the new schedule re-interprets them.</p>
          <h3>Projected supply</h3>
          <p>Under the floor schedule alone, with no growth acceleration, emission and total supply develop as follows. Total supply counts released pre-mine plus emission.</p>
          <SupplyFig />
          <Open>At the 200 per block tail the chain adds about 10.5 million Karma a year, so the 800 million cap is reached roughly fifty years after the second halving. A reviewer will ask whether the cap is meaningful. Options: state it as an absolute ceiling and let the curve speak; define a final era with a fixed end; or lower the cap.</Open>
          <h3>The four pools</h3>
          <p>Each block&apos;s emission is split by percentages that are parameters of the protocol and recorded in the block:</p>
          <SplitFig />
          <p>
            The Foundation and Tech Builders pools are paid to their wallets each block. The Validators pool accrues to a protocol wallet and is not yet distributed; its payout to runners and attesting validators is gated behind a parameter that remains off until the validator programme opens (section 13). Within the Kreators pool, any transaction-reward budget not earned in a block (because too few qualifying transactions occurred) is redirected to that block&apos;s staking rewards rather than burned, a change adopted at protocol version 47. Before it, the unused part burned, which is why 558,386 Karma, nearly half of everything emitted, has been burned to date.
          </p>
          <h3>Staking rewards</h3>
          <p>Each block, the staking budget is divided among recognized Kreators by weight:</p>
          <Formula>{`weight(k)  = sqrt( total_staked(k) ) x log2( unique_stakers(k) + 1 )
reward(k)  = budget x weight(k) / sum of all weights`}</Formula>
          <p>The square root makes the return on an extra Karma of stake fall as the stake grows; the logarithm rewards each additional distinct supporter. Together they mean that a Kreator with many small backers competes on equal terms with one who has a single large one:</p>
          <div className="tw wp-table">
            <table>
              <thead><tr><th>Kreator</th><th className="right">Staked</th><th className="right">Stakers</th><th className="right">sqrt</th><th className="right">log2(n+1)</th><th className="right">Weight</th><th className="right">Share of a 146 budget</th></tr></thead>
              <tbody>
                <tr><td>A, broad support</td><td className="right mono">10,000</td><td className="right mono">15</td><td className="right mono">100.0</td><td className="right mono">4.00</td><td className="right mono">400</td><td className="right mono">73.000</td></tr>
                <tr><td>B, one large backer</td><td className="right mono">40,000</td><td className="right mono">3</td><td className="right mono">200.0</td><td className="right mono">2.00</td><td className="right mono">400</td><td className="right mono">73.000</td></tr>
              </tbody>
            </table>
          </div>
          <p>
            B has four times the stake of A and earns the same. Each Kreator&apos;s reward is then split 50/50: half is credited to the Kreator, half goes to the network-wide staker pool, which is paid to every staker in proportion to their stake across all Kreators. Rewards accrue through a cumulative index rather than per-stake writes each block, and settle whenever a stake is touched, so the cost of a block does not grow with the number of stakers.
          </p>
          <h3>Staking rules</h3>
          <ul>
            <li>Minimum stake 10 Karma per action.</li>
            <li>A Holder may stake at most 50 percent of their total balance on any one Kreator. There is no cap on total stake or on the number of Kreators backed.</li>
            <li>Unstaking starts a seven-day cooldown during which the Karma earns nothing and counts for nothing; the Kreator&apos;s weight drops the moment the unstake is submitted. A stake can be moved to another Kreator without cooldown.</li>
            <li>Kreators may stake on themselves; the cap applies as to anyone else.</li>
          </ul>
          <h3>Transaction rewards and fees</h3>
          <p>
            A transfer to a Kreator is a qualifying transaction. Each block, the transaction budget is divided among Kreators in proportion to the qualifying volume received in the trailing window, with no Kreator taking more than 10 percent of the budget in one cycle and at most five qualifying transfers per sender to the same Kreator per day. Transfers carry a fee of 0.1 percent, charged on top of the amount so the recipient receives what was sent; half the fee is burned and half is credited to the recipient.
          </p>
          <Open>Both specifications described an activation ramp that scales rewards with the number of recognized profiles, network stake and daily transactions. The code has never applied it. The release percent now does that job explicitly and the ramp has been removed from the specifications. This paper describes only the release percent.</Open>

          <H2 id="s7" n="07">Recognition pipeline</H2>
          <p>A profile becomes a Kreator through four gates, each on the ledger.</p>
          <RecognitionFig />
          <ol>
            <li><strong>Submission.</strong> Any Holder may submit a public Instagram profile, paying 1 Karma to deter spam and subject to five submissions a day. If the profile is later recognized, the submitter receives a 5 Karma discovery reward.</li>
            <li><strong>Screening.</strong> The protocol fetches the public profile and runs the Culture Authenticity Index (CAI), an automated screen for whether the account is a real participant in the conscious economy rather than a brand, a bot or an unrelated account. The screen is a gate, not a score that persists.</li>
            <li><strong>Review.</strong> Core reviewers vote. Five in-favour votes admit the profile; three reject votes reject it; whichever threshold is reached first decides. Each in-favour voter on an admitted profile is paid 1 Karma from the Foundation pool. Admission creates the Kreator profile and a builder wallet that starts receiving rewards immediately, whether or not the person has ever heard of Karma.</li>
            <li><strong>Claiming.</strong> The owner proves control of the Instagram account by sending a per-wallet code by direct message; a second, Foundation-side approval completes the claim on-chain. From then on the owner can spend the builder wallet, edit the page and appoint spenders. A recognized profile that is never claimed sunsets after five years and its accumulated rewards return to the pool.</li>
          </ol>
          <p>Revocation, by the Foundation or by Core vote, freezes rewards, unstakes every backer through the normal cooldown, and claws nothing back. Unclaim reverses a claim without revoking recognition.</p>

          <H2 id="s8" n="08">Identity and custody</H2>
          <p>Karma&apos;s users are, for the most part, not crypto-native. The identity layer is built so that a festival host can receive rewards before they know the protocol exists, and so that switching to self-custody later is a configuration change rather than a migration.</p>
          <h3>Today</h3>
          <ul>
            <li><strong>Sign-in</strong> is through Telegram, whose signed initData authenticates the mini-app, or through Google, which issues a short-lived EdDSA session token (15 minutes, refreshed, absolute lifetime 14 days) with a fresh step-up required within 30 minutes of any action that moves Karma.</li>
            <li><strong>Every user has an Ed25519 keypair</strong> generated by the protocol and stored encrypted at rest. Actions are signed with that key on the user&apos;s behalf after authentication. This makes every state change on the ledger a signed envelope from day one, even though users do not hold keys.</li>
            <li><strong>Kreator builder wallets</strong> are separate wallets owned by the profile. After claiming, the owner and any spenders they appoint may sign from it.</li>
          </ul>
          <h3>The custody position, stated plainly</h3>
          <p>
            In the current phase the Foundation is the custodian. It holds the encrypted private keys and the key that decrypts them. A compromise of the API host together with that key would allow signing on users&apos; behalf, and, because signed envelopes are indistinguishable from legitimate ones, such a compromise might not be detected by the ledger itself. What the ledger does guarantee is that nothing can be moved without a signed, included, replayable envelope, so any misuse would be permanently visible and attributable after the fact. The bridge&apos;s freeze action and the append-only audit log exist for that case.
          </p>
          <h3>The path to self-custody</h3>
          <p>
            Every transaction endpoint already accepts an authentication type of either Telegram session or wallet key. The wallet-key path is implemented and returns &quot;not enabled&quot; while the parameter <span className="mono">third_party_wallets_enabled</span> is false. Turning it on lets a user submit envelopes signed by a key the protocol has never seen, at which point the Foundation holds nothing for that user. Nothing in the envelope format, the executor or the replay path changes.
          </p>

          <H2 id="s9" n="09">Bridge to Ethereum</H2>
          <p>Karma includes a native bridge to an EVM chain, implemented as six on-ledger actions and audited before activation. It is deployed but switched off (<span className="mono">bridge_enabled</span> is false) pending validation on the testnet.</p>
          <h3>Design</h3>
          <p>
            The bridge locks and releases; it never mints. Bridging out moves Karma into a single deterministic escrow wallet that has no key and cannot spend. Bridging in releases from that escrow. The supply invariant therefore never sees the bridge: escrowed Karma is still Karma in a wallet. One thousandth of a Karma, the native unit, corresponds to 10<sup>15</sup> wrapped units on the EVM side.
          </p>
          <p>
            Authority on the Karma side belongs to an <strong>attestor set</strong> recorded on the ledger. Every release, refund, freeze or unfreeze carries M-of-N attestor signatures inside its payload, over a domain-separated digest that binds direction, both chain identifiers, nonce, amount, recipient, sender, source event, fee and deadline. The Foundation key transports these envelopes but adds no authority to them; a release without valid attestations is rejected by every runner and every replayer.
          </p>
          <BridgeFig />
          <h3>Limits</h3>
          <div className="tw wp-table">
            <table>
              <thead><tr><th>Control</th><th className="right">Value</th><th>Purpose</th></tr></thead>
              <tbody>
                <tr><td>Per-lock maximum</td><td className="right mono">100,000</td><td>Bounds any single bad release</td></tr>
                <tr><td>Per-sender, trailing 144 blocks</td><td className="right mono">500,000</td><td>Bounds one compromised account</td></tr>
                <tr><td>Global, trailing 144 blocks</td><td className="right mono">5,000,000</td><td>Bounds total exposure per day</td></tr>
                <tr><td>Fee on bridge out</td><td className="right mono">25 bps</td><td>Charged to the sender, floored to a whole native unit</td></tr>
                <tr><td>Deadline window</td><td className="right mono">2 h to 7 d</td><td>Locks expire and become refundable</td></tr>
                <tr><td>Attestor quorum</td><td className="right mono">3 of N</td><td>Code floor of 2</td></tr>
                <tr><td>Unfreeze timelock</td><td className="right mono">144 blocks</td><td>A freeze cannot be lifted for 24 hours; unfreeze also needs a Foundation co-signature</td></tr>
              </tbody>
            </table>
          </div>
          <p>Inbound caps, a minimum outbound amount and a refund grace period were added by the audit remediation at protocol version 52 and default to disabled so that replay of historical blocks is unaffected; they are set before the bridge is switched on.</p>

          <H2 id="s10" n="10">Governance</H2>
          <p>Karma has no token-holder voting. In the current phase the Foundation governs, and this paper says so without decoration. What the protocol does is constrain how the Foundation governs:</p>
          <ul>
            <li><strong>Parameters, not code.</strong> Every economic and consensus tunable is a named parameter with a published minimum and maximum. The pool percentages, the staking split, the fee, the vote thresholds and roughly 130 others are readable by anyone from the public API together with their change history.</li>
            <li><strong>Changes are on the ledger.</strong> A consensus parameter can only change through a signed <span className="mono">config_update</span> envelope included in a block. Direct writes to consensus parameters are refused by the software. The height at which a rule changed is therefore a public fact that every replayer re-applies.</li>
            <li><strong>Some parameters are write-once.</strong> Activation heights and the chain identifier can be set exactly once and never moved.</li>
            <li><strong>Testnet gate.</strong> Any change touching consensus, state or the database must first run on an isolated testnet with its own independent replay verifier, be exercised by a real transaction in a real block, and be replayed cleanly, before it reaches production. This is an operating rule of the Foundation rather than a protocol enforcement, and it is documented as such.</li>
            <li><strong>Audit log.</strong> Every state change appends to an audit table that the software never updates or deletes.</li>
          </ul>
          <p>Grants from the Foundation pool are discretionary and signed by the Foundation key; each is an envelope in a block. The governance process as it stands is on the <Link href="/governance">governance page</Link>.</p>

          <H2 id="s11" n="11">Security and risk</H2>
          <h3>Threat model</h3>
          <div className="tw wp-table">
            <table>
              <thead><tr><th>Threat</th><th>What the protocol does</th><th>Residual risk</th></tr></thead>
              <tbody>
                <tr><td>Runner produces a wrong block</td><td>Cosigners and own-database observers re-derive; a mismatched block cannot reach quorum.</td><td>Collusion of a quorum of runners, all currently Foundation-operated.</td></tr>
                <tr><td>Operator edits the database directly</td><td>State hash diverges at the next block; independent replayers halt and report.</td><td>Detection, not prevention, on the shared database.</td></tr>
                <tr><td>API host and key-encryption key compromised</td><td>Every action still requires a signed envelope; audit trail is permanent.</td><td>Signing on users&apos; behalf; may be undetected until users notice.</td></tr>
                <tr><td>Sybil stakers to inflate a Kreator&apos;s weight</td><td>Log factor caps the benefit of extra identities; 10 Karma minimum; invites are limited and rewarded only five times.</td><td>Cheap identities remain a lever; monitored, not eliminated.</td></tr>
                <tr><td>Fake or bought recognition</td><td>Submission cost, automated screen, five-vote admission, three-vote rejection, revocation.</td><td>Reviewer collusion; mitigated by Foundation revocation.</td></tr>
                <tr><td>Bridge release forged</td><td>M-of-N attestor signatures in the payload, verified by every replayer; caps; freeze.</td><td>Attestor key compromise up to M keys.</td></tr>
                <tr><td>Dependence on Instagram</td><td>Identity proof and screening use public profile data only.</td><td>Policy or API changes could slow admissions and claims.</td></tr>
              </tbody>
            </table>
          </div>
          <h3>Regulatory</h3>
          <p>Karma is issued by protocol emission to recognized creators and their supporters, not sold. The bridge, once live, will make it tradable. The Foundation&apos;s position on classification, the jurisdictions it operates in and the rights attached to holding Karma need a paragraph here from counsel.</p>
          <Open>Section 11 needs counsel input on the regulatory paragraph and a decision on how much of the incident history (the observer halts of June and August 2026, both recovered without loss) to disclose. Recommendation: disclose them briefly in section 12 as evidence the verification layer works.</Open>

          <H2 id="s12" n="12">The network today</H2>
          <p>Figures from the public API at block {AS_OF.height}, {AS_OF.date}. Live values are on the <Link href="/status">status page</Link>.</p>
          <div className="stats n4 wp-stats">
            <div className="stat"><div className="l">Blocks</div><div className="v">16,559</div><div className="s">since 30 May 2026</div></div>
            <div className="stat"><div className="l">Emitted</div><div className="v">1.17M</div><div className="s">Karma</div></div>
            <div className="stat"><div className="l">Burned</div><div className="v">0.56M</div><div className="s">unused rewards, before PV47</div></div>
            <div className="stat"><div className="l">Kreators</div><div className="v">557</div><div className="s">recognized profiles</div></div>
            <div className="stat"><div className="l">Wallets</div><div className="v">929</div><div className="s">366 registered users</div></div>
            <div className="stat"><div className="l">Staked</div><div className="v">291,362</div><div className="s">in 8,324 stakes</div></div>
            <div className="stat"><div className="l">Runners</div><div className="v">4</div><div className="s">every slot, trailing 3 days</div></div>
            <div className="stat"><div className="l">Release</div><div className="v">5%</div><div className="s">40 Karma per block</div></div>
          </div>
          <p>
            Two honest qualifications. First, activity is early: 29 wallets transacted in the trailing 30 days, and 71 transfers moved 4,044 Karma. Second, most stakes on the network today were placed by the Foundation&apos;s bootstrap staker, which seeds 20 to 40 Karma on Kreators that have no backer so that every recognized profile earns from its first block. Both facts are visible on the ledger and neither is hidden by the figures above. The verification layer has already earned its keep: twice in 2026 an independent replayer halted on a block it could not reproduce, in both cases because of a configuration row missing on that replayer rather than a bad block, and in both cases the chain continued and the replayer caught up once the row was added.
          </p>

          <H2 id="s13" n="13">Roadmap</H2>
          <ol>
            <li><strong>Emission schedule.</strong> Deploy cumulative-emission halving; publish S* and K*; move the release percent on the quarterly cadence.</li>
            <li><strong>Founding Circle runners.</strong> Add block producers operated outside the Foundation, each on its own database, so quorum requires non-Foundation signatures.</li>
            <li><strong>Validator programme.</strong> Open attestation to anyone running the validator tool; switch on the Validators pool payout, distributed to attesting validators and runners with a reputation factor for incorrect reports.</li>
            <li><strong>Self-custody.</strong> Enable the wallet-key path; ship a key-export flow so existing users can take custody without a migration.</li>
            <li><strong>Bridge activation.</strong> Complete the testnet gate, set the inbound caps, switch the bridge on with the published limits.</li>
            <li><strong>Governance.</strong> Define which parameters move from Foundation control to a broader process once non-Foundation runners exist.</li>
          </ol>

          <H2 id="sA" n="A">Appendix A: parameters</H2>
          <p>Production values at block {AS_OF.height}. Consensus parameters are pinned per block and changed only by in-block envelopes. The live list is on the <Link href="/protocol">protocol page</Link>.</p>
          <div className="tw wp-table">
            <table>
              <thead><tr><th>Parameter</th><th className="right">Value</th><th>Bounds</th><th>Notes</th></tr></thead>
              <tbody>
                {([
                  ["Block interval", "600 s", "fixed", "Not a parameter; changing it would break hash verification"],
                  ["Era rates", "800 / 400 / 200", "fixed", "Karma per block per era"],
                  ["emission_release_pct", "5", "1 to 100", "Since block 12,833"],
                  ["emission_builders_pct", "73", "50 to 95", "Kreators pool"],
                  ["emission_foundation_pct", "12", "0 to 30", ""],
                  ["emission_tech_builders_pct", "8", "0 to 20", ""],
                  ["emission_validators_pct", "7", "0 to 15", "Computed as the remainder"],
                  ["builders_pool_tx_share", "75", "50 to 90", ""],
                  ["builders_pool_staking_share", "25", "10 to 50", ""],
                  ["staking_reward_split_profile", "50", "30 to 70", "Stakers receive the complement"],
                  ["min_stake_amount", "10", "1 to 100", ""],
                  ["max_stake_per_profile_pct", "50", "20 to 80", "Of the staker's total balance"],
                  ["unstaking_cooldown_days", "7", "1 to 30", ""],
                  ["transaction_fee_pct", "0.1", "0.1 to 2.5", "Charged on top"],
                  ["fee_burn_ratio", "50", "0 to 100", "Rest to the recipient"],
                  ["tx_reward_cap_pct", "10", "1 to 25", "Per Kreator per cycle"],
                  ["anti_fraud_max_same_sender_day", "5", "1 to 20", ""],
                  ["welcome_grant_amount", "50", "0 to 100", "On registration with an invite"],
                  ["invite_reward_amount / max", "20 / 5", "", "Per consumed invite, per inviter"],
                  ["discoverer_submission_cost", "1", "0 to 100", ""],
                  ["discoverer_recognition_reward", "5", "0 to 1000", ""],
                  ["kreator_admit_threshold / reject", "5 / 3", "1 to 50", "Core votes"],
                  ["kreator_admit_reward", "1", "", "Per in-favour voter"],
                  ["unclaimed_builder_sunset_seconds", "157,680,000", "", "Five years"],
                  ["quorum_threshold_signatures", "2", "1 to 50", "Reduced to active runners automatically"],
                  ["quorum_window_seconds", "180", "30 to 600", ""],
                  ["proposer_failover_step_seconds", "10", "1 to 120", ""],
                  ["degraded_threshold_blocks", "6", "2 to 500", ""],
                  ["max_transactions_per_block", "1,000", "100 to 100,000", ""],
                  ["mempool_validity_window_seconds", "1,800", "600 to 3,600", ""],
                  ["bridge_fee_bps", "25", "0 to 9,999", ""],
                  ["bridge_out_max_per_tx", "100,000", "", ""],
                  ["bridge_out_max_per_user_daily", "500,000", "", "Trailing 144 blocks"],
                  ["bridge_global_daily_cap", "5,000,000", "", "Trailing 144 blocks"],
                  ["bridge_signer_threshold_m", "3", "2 to 64", ""],
                  ["bridge_unfreeze_delay_blocks", "144", "", ""],
                  ["third_party_wallets_enabled", "false", "", "Wallet-key authentication"],
                  ["bridge_enabled", "false", "", ""],
                  ["runner_rewards_enabled", "false", "", "Validators pool payout"],
                ] as [string, string, string, string][]).map(([k, v, b, n]) => (
                  <tr key={k}><td className="mono">{k}</td><td className="right mono">{v}</td><td className="mono muted">{b || "-"}</td><td>{n}</td></tr>
                ))}
              </tbody>
            </table>
          </div>

          <H2 id="sB" n="B">Appendix B: on-ledger actions</H2>
          <div className="tw wp-table">
            <table>
              <thead><tr><th>Signer</th><th>Actions</th></tr></thead>
              <tbody>
                <tr><td>User key</td><td className="mono">transfer, stake, unstake, move_stake, submit_profile, claim_profile, register_user, create_event, update_event, go_live_event, end_event, join_event, leave_event, add_sink, remove_sink, bridge_out, builder_wallet_add_spender, builder_wallet_remove_spender</td></tr>
                <tr><td>System key</td><td className="mono">grant, config_update, role_change, user_deactivate, user_reactivate, claim_approval, user_delete_cascade, unclaim, kreator_admit, bridge_attestor_set, bridge_in_release, bridge_out_refund, bridge_freeze, bridge_unfreeze</td></tr>
                <tr><td>Either</td><td className="mono">recognize, revoke</td></tr>
              </tbody>
            </table>
          </div>
          <p>
            Envelope shape: <span className="mono">{"{ payload: { action, ...params, timestamp_ms }, signer, signature }"}</span>, where the signature is Ed25519 over the SHA-256 of the canonical payload. Events are a family of actions that let a host run a time-boxed gathering with its own Karma sinks; they move Karma through ordinary transfers and are omitted from the economics above.
          </p>

          <H2 id="sC" n="C">Appendix C: glossary</H2>
          <dl className="wp-gloss">
            <dt>Kreator</dt><dd>A recognized profile. &quot;Builder&quot; in the schema and code.</dd>
            <dt>Recognition</dt><dd>The binary on-ledger fact that a profile has been admitted.</dd>
            <dt>Envelope</dt><dd>A signed, hashed action payload; the only way state changes.</dd>
            <dt>Runner</dt><dd>A block producer with a registered key.</dd>
            <dt>Observer / validator</dt><dd>A node that re-derives blocks from public data and cosigns or reports; may hold its own database.</dd>
            <dt>tx_set_hash / state_hash</dt><dd>The two per-block commitments: what was included, and what the state became.</dd>
            <dt>Release percent</dt><dd>The throttle applied to the era rate; the protocol&apos;s adoption ramp.</dd>
            <dt>Era</dt><dd>A span of emission at one rate (800, 400, 200 per block), measured in Karma emitted.</dd>
            <dt>Builder wallet</dt><dd>The wallet owned by a Kreator profile, spendable after claiming.</dd>
            <dt>CAI</dt><dd>Culture Authenticity Index, the automated screen applied before review.</dd>
          </dl>
          <p className="muted mono f13" style={{ marginTop: 48 }}>End of draft {DRAFT}. Signed: The Karma Foundation.</p>
        </div>
      </div>
    </div>
  );
}
