import type { Metadata } from "next";
import Link from "next/link";
import { Crumb } from "@/components/ui";

export const metadata: Metadata = { title: "Why" };

export default function Why() {
  return (
    <div className="wrap page">
      <Crumb items={[{ href: "/", label: "Home" }, { label: "Why" }]} />
      <div className="kicker">Why</div>
      <h1>Why the protocol exists</h1>
      <p className="muted mono f13" style={{ margin: "12px 0 32px" }}>23 September 2026</p>
      <div className="prose">
        <p>
          Every community has people it could not do without. The host who has opened the same space every week for a decade. The
          musician who plays the sunrise set for nothing. The teacher whose students bring their own students. Everyone around them
          knows who they are. No ledger anywhere records it, and so it does not compound. Karma exists to write that fact down and to
          let it earn.
        </p>

        <h2>Why the protocol exists</h2>
        <p>
          The systems that record value today measure the wrong things for this kind of work. Social platforms count attention and
          sell it to advertisers. Financial systems count capital. Blockchains, for all their integrity, reward whoever brings the
          most computation or the most money. None of them has a place to put the sentence &quot;this person holds this community
          together&quot;, and none of them pays for it.
        </p>
        <p>
          Karma is a ledger with exactly that sentence at its centre. A profile is either recognized by its community or it is not.
          Once recognized, it earns a share of every block the protocol produces, for as long as it stays recognized, whether or not the
          person has ever heard of Karma. The people who stand behind that person can stake and earn alongside them. The record is
          public, signed, and checkable by anyone with a copy of the rules. That is the whole idea; everything else on this site is
          the machinery that keeps it honest.
        </p>

        <h2>What it rewards</h2>
        <p>
          It rewards recognition, and it rewards breadth of support over depth of pocket. Seventy-three percent of every block goes to
          recognized creators and the people staking on them. The formula that divides it grows with the square root of the stake and
          with the logarithm of the number of distinct stakers, so a creator backed by fifteen people with a little each earns the same
          as one backed by three people with a lot. No one can buy their way to the top of it, and a creator who stakes on themselves is
          treated like anyone else.
        </p>
        <p>
          It rewards the people who find creators before the protocol does: submit a profile that is later recognized and you are paid
          for the discovery. It rewards the reviewers who do the careful work of admitting the right people. It rewards the runners and
          validators who keep the record straight. And it rewards sending Karma to creators, because a transfer to a recognized profile
          earns that profile a share of the block as well.
        </p>

        <h2>What it refuses to do</h2>
        <p>
          It refuses to score people. Recognition is yes or no. There is no rank, no reputation number, no leaderboard the protocol
          maintains, because a number invites people to play the number instead of doing the work.
        </p>
        <p>
          It refuses to claw back. Revoking recognition stops future rewards and returns every stake to its owner; nothing already earned
          is taken. A ledger that can reach into the past is not a ledger.
        </p>
        <p>
          It refuses to hide its own arithmetic. Every rule that moves Karma is a published parameter with a published range, every
          change to one is a signed transaction in a block, and every block carries two hashes that a stranger with an empty database
          can recompute. If the operators ever produce a block the rules do not produce, the mismatch is on the record.
        </p>
        <p>
          It refuses to pretend to be more decentralized than it is. Block production today is run by a small set of Foundation
          operators. Checking blocks is open to anyone. The gap between those two facts is the roadmap, and this site reports both
          without decoration.
        </p>
        <p>
          It refuses to sell anything. Karma is issued by the protocol to recognized creators and their supporters. It is not sold,
          and this site carries no analytics, no cookies and no advertising.
        </p>
        <p style={{ marginTop: 32 }}>
          The full design, with its economics, its limits and the questions still open, is in the <Link href="/whitepaper">whitepaper</Link>.
        </p>
        <p className="mono f14" style={{ marginTop: 40 }}>The Karma Foundation</p>
      </div>
    </div>
  );
}
