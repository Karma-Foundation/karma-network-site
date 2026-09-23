/*
 * Whitepaper figures. Hand-drawn inline SVG: the site loads no external scripts, so no diagram
 * library. Strokes and text use currentColor so both themes work; var(--accent) marks the one
 * element each figure is about.
 */

const F = { fontFamily: "var(--font-sans), Helvetica, Arial, sans-serif", fontSize: 12 } as const;
const M = { fontFamily: "var(--font-mono), Menlo, Consolas, monospace", fontSize: 11 } as const;

function Arrow({ id }: { id: string }) {
  return (
    <defs>
      <marker id={id} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M0 0L10 5L0 10z" fill="currentColor" />
      </marker>
    </defs>
  );
}

function Box({ x, y, w, h, label, sub, accent }: { x: number; y: number; w: number; h: number; label: string; sub?: string; accent?: boolean }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={3} fill={accent ? "var(--accent)" : "var(--panel)"} fillOpacity={accent ? 0.16 : 1} stroke={accent ? "var(--accent)" : "currentColor"} />
      <text x={x + w / 2} y={y + (sub ? h / 2 - 4 : h / 2 + 4)} textAnchor="middle" fill="currentColor" style={F} fontWeight={accent ? 600 : 400}>{label}</text>
      {sub && <text x={x + w / 2} y={y + h / 2 + 12} textAnchor="middle" fill="currentColor" style={M}>{sub}</text>}
    </g>
  );
}

export function Fig({ caption, label, children, viewBox }: { caption: string; label: string; children: React.ReactNode; viewBox: string }) {
  return (
    <figure className="wp-fig">
      <div className="tw">
        <svg viewBox={viewBox} role="img" aria-label={label} xmlns="http://www.w3.org/2000/svg">
          {children}
        </svg>
      </div>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

/** Figure 1: life of an action. */
export function LifecycleFig() {
  return (
    <Fig viewBox="0 0 870 230" label="An envelope passes admission, waits in the mempool, is built into a block by the proposer, re-derived by cosigners and finalized at quorum; validators replay it afterwards." caption="Figure 1. Life of an action. Every node between admission and finalization re-derives the same block from the same inputs; a cosigner signs only what it has recomputed.">
      <Arrow id="a1" />
      <Box x={10} y={40} w={130} h={44} label="Signed envelope" sub="user or system key" />
      <Box x={165} y={40} w={130} h={44} label="Admission" sub="signature, balances" />
      <Box x={320} y={40} w={130} h={44} label="Mempool" sub="30 min validity" />
      <Box x={475} y={40} w={130} h={44} label="Proposer" sub="canonical order" />
      <Box x={630} y={40} w={130} h={44} label="Cosigners" sub="re-derive, sign" />
      <Box x={785} y={40} w={75} h={44} label="Finalized" accent />
      <g stroke="currentColor" markerEnd="url(#a1)">
        <line x1={140} y1={62} x2={165} y2={62} />
        <line x1={295} y1={62} x2={320} y2={62} />
        <line x1={450} y1={62} x2={475} y2={62} />
        <line x1={605} y1={62} x2={630} y2={62} />
        <line x1={760} y1={62} x2={785} y2={62} />
        <line x1={230} y1={84} x2={230} y2={130} />
        <line x1={695} y1={84} x2={695} y2={130} />
        <line x1={822} y1={84} x2={822} y2={170} />
      </g>
      <text x={462} y={32} textAnchor="middle" fill="currentColor" style={M}>every 10 minutes</text>
      <Box x={165} y={130} w={130} h={36} label="Refused, with reason" />
      <Box x={600} y={130} w={190} h={36} label="No quorum in 180 s: rejected" sub="retried next slot" />
      <Box x={700} y={170} w={165} h={44} label="Independent validators" sub="replay from the public API" />
    </Fig>
  );
}

/** Figure 2: replay verification, leader vs observer. */
export function ReplayFig() {
  return (
    <Fig viewBox="0 0 720 300" label="Leader and observer each derive tx_set_hash and state_hash from the same public inputs; the observer compares and either cosigns or halts." caption="Figure 2. Replay verification. The observer never receives the leader's state, only its inputs, and must arrive at the same two hashes on its own.">
      <Arrow id="a2" />
      <g fill="none" stroke="currentColor" strokeDasharray="4 3">
        <rect x={20} y={30} width={200} height={240} rx={4} />
        <rect x={500} y={30} width={200} height={240} rx={4} />
      </g>
      <text x={120} y={52} textAnchor="middle" fill="currentColor" style={F} fontWeight={600}>Leader (shared DB)</text>
      <text x={600} y={52} textAnchor="middle" fill="currentColor" style={F} fontWeight={600}>Observer (own DB)</text>
      <Box x={40} y={70} w={160} h={34} label="Drain mempool, order" />
      <Box x={40} y={118} w={160} h={34} label="Execute under fingerprint" />
      <Box x={40} y={166} w={160} h={34} label="Rewards and supply check" />
      <Box x={40} y={214} w={160} h={40} label="tx_set_hash, state_hash" accent />
      <Box x={520} y={70} w={160} h={34} label="Fetch envelopes, insert" />
      <Box x={520} y={118} w={160} h={34} label="Execute under fingerprint" />
      <Box x={520} y={166} w={160} h={34} label="Rewards and supply check" />
      <Box x={520} y={214} w={160} h={40} label="tx_set_hash', state_hash'" accent />
      <line x1={220} y1={87} x2={500} y2={87} stroke="currentColor" markerEnd="url(#a2)" />
      <text x={360} y={80} textAnchor="middle" fill="currentColor" style={M}>public API: block N + envelope list</text>
      <line x1={500} y1={234} x2={220} y2={234} stroke="currentColor" strokeDasharray="5 3" markerEnd="url(#a2)" />
      <text x={360} y={226} textAnchor="middle" fill="currentColor" style={M}>equal: cosign block N</text>
      <text x={360} y={252} textAnchor="middle" fill="var(--red)" style={M}>differ: halt, report block N and which hash</text>
    </Fig>
  );
}

/** Figure 3: projected total supply under the floor schedule. */
export function SupplyFig() {
  // Year-end totals in millions (emitted + released pre-mine), 2026 to 2036, under the floor release schedule.
  const total = [11.4, 35.6, 68.2, 109.2, 158.1, 185.1, 206.2, 216.7, 227.2, 237.7, 248.2];
  const premine = [9.4, 25.4, 41.5, 57.5, 73.5, 80, 80, 80, 80, 80, 80];
  const x = (i: number) => 60 + i * 64;
  const y = (m: number) => 270 - (m / 250) * 240;
  const pts = (a: number[]) => a.map((m, i) => `${x(i)},${y(m).toFixed(1)}`).join(" ");
  return (
    <Fig viewBox="0 0 720 300" label="Projected total supply from 2026 to 2036 under the floor schedule, rising from 11 million to about 248 million, with the first halving near the end of 2030." caption="Figure 3. Projected total supply under the floor release schedule, with no growth acceleration. Year-end values: 11M (2026), 36M (2027), 68M (2028), 109M (2029), 158M (2030), 185M (2031), 206M (2032), then about 10.5M a year at the 200 per block tail. The dashed line is released pre-mine; the gap between the two lines is emission, of which 20 percent is the Foundation and Tech Builders emission share.">
      <g stroke="currentColor" strokeOpacity={0.5}>
        <line x1={60} y1={270} x2={700} y2={270} />
        <line x1={60} y1={30} x2={60} y2={270} />
      </g>
      <g stroke="currentColor" strokeOpacity={0.12}>
        {[50, 100, 150, 200, 250].map((m) => <line key={m} x1={60} y1={y(m)} x2={700} y2={y(m)} />)}
      </g>
      <g fill="currentColor" style={M} textAnchor="end">
        {[0, 50, 100, 150, 200, 250].map((m) => <text key={m} x={54} y={y(m) + 4}>{m === 0 ? "0" : `${m}M`}</text>)}
      </g>
      <g fill="currentColor" style={M} textAnchor="middle">
        {total.map((_, i) => <text key={i} x={x(i)} y={290}>{2026 + i}</text>)}
      </g>
      <path d={`M${pts(total)} L${x(10)},270 L60,270 Z`} fill="var(--accent)" fillOpacity={0.12} stroke="none" />
      <polyline points={pts(total)} fill="none" stroke="var(--accent)" strokeWidth={2.5} />
      <polyline points={pts(premine)} fill="none" stroke="currentColor" strokeWidth={1.5} strokeDasharray="5 3" />
      <line x1={375} y1={30} x2={375} y2={270} stroke="var(--red)" strokeDasharray="3 3" />
      <text x={380} y={44} fill="var(--red)" style={M}>first halving (84.1M emitted)</text>
      <text x={470} y={y(80) - 6} textAnchor="middle" fill="currentColor" style={M}>pre-mine released (80M by mid-2031)</text>
      <text x={640} y={26} textAnchor="end" fill="currentColor" style={F} fontWeight={600}>total supply</text>
    </Fig>
  );
}

/** Figure 4: where one block goes. */
export function SplitFig() {
  return (
    <Fig viewBox="0 0 720 250" label="One block's emission splits 73 percent to Kreators, 12 to the Foundation, 8 to Tech Builders and 7 to Validators; the Kreators pool splits 75 percent to transaction rewards and 25 to staking rewards." caption="Figure 4. Where one block goes, shown at the full era rate of 800. At today's 5 percent release the same shape applies to 40 Karma: 29.2 to Kreators, 4.8 to the Foundation, 3.2 to Tech Builders, 2.8 to Validators.">
      <Arrow id="a4" />
      <Box x={20} y={95} w={130} h={60} label="Block emission" sub="800 x release%" />
      <Box x={260} y={20} w={150} h={40} label="Kreators 73%" sub="584" accent />
      <Box x={260} y={80} w={150} h={40} label="Foundation 12%" sub="96" />
      <Box x={260} y={140} w={150} h={40} label="Tech Builders 8%" sub="64" />
      <Box x={260} y={200} w={150} h={40} label="Validators 7%" sub="56, accrues" />
      <g stroke="currentColor" markerEnd="url(#a4)">
        <line x1={150} y1={125} x2={260} y2={40} />
        <line x1={150} y1={125} x2={260} y2={100} />
        <line x1={150} y1={125} x2={260} y2={160} />
        <line x1={150} y1={125} x2={260} y2={220} />
      </g>
      <Box x={530} y={10} w={170} h={40} label="Transaction rewards 75%" sub="438 per block" />
      <Box x={530} y={60} w={170} h={40} label="Staking rewards 25%" sub="146 per block" />
      <g stroke="var(--accent)" markerEnd="url(#a4)">
        <line x1={410} y1={40} x2={530} y2={30} />
        <line x1={410} y1={40} x2={530} y2={80} />
      </g>
      <line x1={615} y1={50} x2={615} y2={60} stroke="var(--accent)" strokeDasharray="3 2" />
      <text x={700} y={114} textAnchor="end" fill="currentColor" style={M}>unused transaction budget flows to staking</text>
    </Fig>
  );
}

/** Figure 5: recognition lifecycle. */
function L({ x, y, t, anchor = "middle" }: { x: number; y: number; t: string; anchor?: "middle" | "start" | "end" }) {
  return <text x={x} y={y} textAnchor={anchor} fill="currentColor" style={M}>{t}</text>;
}

export function RecognitionFig() {
  return (
    <Fig viewBox="0 0 760 290" label="A profile moves from Submitted through Screened and In review to Recognized and Claimed; it can be Rejected at screening or review, Sunset if unclaimed for five years, or Revoked at any point after recognition." caption="Figure 5. Recognition lifecycle. Every transition is an envelope; the vote counts are protocol parameters.">
      <Arrow id="a5" />
      <Box x={10} y={60} w={110} h={40} label="Submitted" sub="1 Karma" />
      <Box x={170} y={60} w={110} h={40} label="Screened" sub="CAI screen" />
      <Box x={330} y={60} w={110} h={40} label="In review" sub="Core votes" />
      <Box x={490} y={60} w={110} h={40} label="Recognized" accent />
      <Box x={650} y={60} w={100} h={40} label="Claimed" accent />
      <Box x={250} y={190} w={110} h={36} label="Rejected" />
      <Box x={480} y={190} w={130} h={36} label="Sunset" sub="unclaimed 5 years" />
      <Box x={650} y={190} w={100} h={36} label="Revoked" />
      <g stroke="currentColor" markerEnd="url(#a5)" fill="none">
        <line x1={120} y1={80} x2={170} y2={80} />
        <line x1={280} y1={80} x2={330} y2={80} />
        <line x1={440} y1={80} x2={490} y2={80} />
        <line x1={600} y1={80} x2={650} y2={80} />
        <path d="M225 100 L225 150 Q225 165 240 175 L285 190" />
        <path d="M385 100 L385 150 Q385 165 370 175 L330 190" />
        <line x1={545} y1={100} x2={545} y2={190} />
        <line x1={700} y1={100} x2={700} y2={190} />
        <path d="M600 92 Q660 150 690 190" />
        <path d="M660 60 Q600 20 545 60" strokeDasharray="4 3" />
      </g>
      <L x={225} y={140} t="fails" anchor="end" />
      <L x={392} y={140} t="3 reject votes" anchor="start" />
      <L x={465} y={54} t="5 approve votes" />
      <L x={625} y={54} t="proves control" />
      <L x={600} y={30} t="unclaim (Foundation-signed)" />
      <L x={668} y={140} t="revoke" anchor="start" />
      <L x={538} y={150} t="never claimed" anchor="end" />
    </Fig>
  );
}

/** Figure 6: bridge flow as a sequence. */
const LANES = [
  { x: 80, t: "User" },
  { x: 280, t: "Karma ledger" },
  { x: 480, t: "Attestors (M of N)" },
  { x: 680, t: "EVM contract" },
] as const;

function Msg({ from, to, y, t, dashed }: { from: 0 | 1 | 2 | 3; to: 0 | 1 | 2 | 3; y: number; t: string; dashed?: boolean }) {
  return (
    <g>
      <line x1={LANES[from].x} y1={y} x2={LANES[to].x} y2={y} stroke="currentColor" strokeDasharray={dashed ? "5 3" : undefined} markerEnd="url(#a6)" />
      <text x={(LANES[from].x + LANES[to].x) / 2} y={y - 6} textAnchor="middle" fill="currentColor" style={M}>{t}</text>
    </g>
  );
}

export function BridgeFig() {
  const lanes = LANES;
  return (
    <Fig viewBox="0 0 760 330" label="Bridge sequence: the user locks Karma in escrow, attestors mint wrapped Karma on the EVM chain, the user later burns it, attestors sign a release and the ledger pays the recipient from escrow." caption="Figure 6. Bridge flow. The escrow wallet is the only place Karma waits; the attestor quorum is the only authority that can move it.">
      <Arrow id="a6" />
      {lanes.map((l) => (
        <g key={l.t}>
          <rect x={l.x - 60} y={10} width={120} height={30} rx={3} fill="var(--panel)" stroke="currentColor" />
          <text x={l.x} y={29} textAnchor="middle" fill="currentColor" style={F} fontWeight={600}>{l.t}</text>
          <line x1={l.x} y1={40} x2={l.x} y2={320} stroke="currentColor" strokeOpacity={0.35} strokeDasharray="3 3" />
        </g>
      ))}
      <Msg from={0} to={1} y={75} t="bridge_out (amount, recipient, deadline)" />
      <rect x={200} y={85} width={160} height={30} rx={3} fill="var(--accent)" fillOpacity={0.16} stroke="var(--accent)" />
      <text x={280} y={104} textAnchor="middle" fill="currentColor" style={M}>lock in escrow, 25 bps fee</text>
      <Msg from={2} to={3} y={145} t="attest the lock, mint wrapped" />
      <Msg from={3} to={0} y={180} t="wrapped Karma" dashed />
      <Msg from={0} to={3} y={215} t="burn wrapped" />
      <Msg from={2} to={1} y={250} t="bridge_in_release with M signatures" />
      <rect x={200} y={260} width={160} height={30} rx={3} fill="var(--accent)" fillOpacity={0.16} stroke="var(--accent)" />
      <text x={280} y={279} textAnchor="middle" fill="currentColor" style={M}>release from escrow</text>
      <text x={380} y={312} textAnchor="middle" fill="currentColor" style={M}>a lock past its deadline and unreleased is refunded on M attestor signatures</text>
    </Fig>
  );
}
