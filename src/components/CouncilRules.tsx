import Link from "next/link";

/*
 * "How the Karma Council works" - the governance text, word for word as the council
 * adopted it. Do not reword. A change to these rules is a council decision that
 * includes Seat 1; change the text and LAST_UPDATED together.
 * No names, no company, no legal entity beyond what the text itself says.
 */
export const LAST_UPDATED = "17 November 2026";

function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="panel tw wp-table">
      <table>
        <thead><tr>{head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CouncilRules({ showParametersLink }: { showParametersLink?: boolean }) {
  return (
    <>
      <div className="kicker">Governance</div>
      <h1>How the Karma Council works</h1>
      <p className="muted mono f13" style={{ margin: "12px 0 16px" }}>Last updated: {LAST_UPDATED}</p>
      <p className="f14" style={{ margin: "0 0 32px", display: "flex", gap: 20, flexWrap: "wrap" }}>
        <Link href="/decisions" className="fw5">Decision log →</Link>
        {showParametersLink && <a href="#parameters">Ledger parameters and change log ↓</a>}
      </p>

      <div className="prose wp-body" style={{ maxWidth: 820 }}>
        <h2 style={{ marginTop: 0 }}>What the council is</h2>
        <p>The Karma Council is three people who decide how Karma&apos;s pools, funds and rules are used. It governs the Karma network until a foundation entity exists and takes over.</p>

        <h2>Starting small</h2>
        <p>The council starts with three seats on purpose: small and manageable, so it stays efficient and effective for where the project is today. As the ecosystem grows, the council will grow with it, and so will the structures and processes around it, including the foundation. The council expects to adjust these rules along the way, and will act as needed for the benefit of the network.</p>

        <h2>Mandate</h2>
        <Table
          head={["The council decides", "The council does not decide"]}
          rows={[
            ["Grants from the Karma pools", "Day-to-day spending inside the budget and under the limit"],
            ["Any single spend above 10,000 к", "Kreator rewards at the published rates - paid without a vote"],
            ["Any payment or grant to one of its own members", "Protocol code - reviewed and approved by the tech lead"],
            ["Who holds a signing key", "Who may use the network - nobody needs permission"],
            ["Protected matters: protocol rules, supply, emission, the sale rule, the market launch date, the brand and domains", ""],
          ]}
        />

        <h2>Seats</h2>
        <p>Three seats, the same deal for each. More seats can be added by a council decision.</p>
        <Table
          head={["Seat", "Term", "Holds a signing key"]}
          rows={[
            ["Seat 1", "3 years", "yes"],
            ["Seat 2", "6 months, renewed by the other members", "yes"],
            ["Seat 3", "6 months, renewed by the other members", "yes"],
          ]}
        />
        <ul>
          <li>Seat 1 runs three years so the project cannot be taken over in its first years. It cannot be removed in that time, except for fraud or a criminal conviction.</li>
          <li>Removal for cause needs both other members. Cause means: broke the sale rule, hid a conflict, or acted against a published decision.</li>
          <li>What a member receives: 200,000 к per seat, earned over four years. The first six months are a trial at 2,000 к a month, counted inside the 200,000.</li>
          <li>Selling: from six months after a market opens, 10% of a member&apos;s credited balance is released each month.</li>
          <li>What a member commits to is set out in the Council Constitution, which every member signs.</li>
        </ul>

        <h2>How a decision is made</h2>
        <p>Most things never reach a vote: the signers act inside the budget and the spend limit. A vote is needed only for the matters in the mandate.</p>
        <ol>
          <li><strong>Raise.</strong> Any member puts the decision in writing: what, how much, who carries it out.</li>
          <li><strong>Vote.</strong> Members vote in the weekly meeting, or in writing within 48 hours.</li>
          <li><strong>Record.</strong> The outcome goes into the decision log with a number, a date and the vote count, within 48 hours.</li>
          <li><strong>Carry out.</strong> The signers pay. The transaction is linked to the decision.</li>
        </ol>
        <Table
          head={["Kind of decision", "What it needs"]}
          rows={[
            ["Normal decision", "2 of 3"],
            ["Payment or grant to a member", "That member abstains; both other members vote yes"],
            ["Protected matter", "2 of 3, with Seat 1 among them"],
            ["Renew a seat", "The other two members"],
            ["Remove a member for cause", "Both other members"],
            ["Add, remove or replace a signer", "Both other members"],
          ]}
        />

        <h2>Money and keys</h2>
        <p>The council&apos;s funds sit in two wallets: the Foundation pool and the Tech Builders pool, both in к. Each needs 2 of 3 signatures. The signers are the three council members.</p>
        <Table
          head={["Spend", "Who approves"]}
          rows={[
            ["Up to 10,000 к per item, inside the budget", "A signer, no vote"],
            ["Above that", "A council vote first, then two signers"],
            ["Kreator rewards at the published rates", "Paid without a vote"],
            ["Anything paid to a council member", "A council vote, then the two other signers"],
          ]}
        />

        <h2>What is published</h2>
        <ul>
          <li>This document and the Council Constitution</li>
          <li>Every decision, with its number, date and vote count. Some are published by title only, with the detail withheld</li>
          <li>Every transaction from the council&apos;s wallets</li>
          <li>The signers and the threshold of each wallet</li>
          <li>Every grant, with its lock terms</li>
          <li>What each seat receives</li>
        </ul>

        <h2>What is not in place yet</h2>
        <p>As of 16 November 2026:</p>
        <ul>
          <li>The pool wallets are still held with a single key.</li>
          <li>The council has not held its first meeting.</li>
          <li>The foundation entity does not exist.</li>
          <li>There is no market for к.</li>
        </ul>

        <h2>How these rules change</h2>
        <p>Only by a council decision that includes Seat 1, published here with its date.</p>
      </div>
    </>
  );
}
