"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BlockPill } from "./BlockPill";

const LINKS = [
  { href: "/protocol", label: "Protocol", match: ["/protocol"] },
  { href: "/ledger/blocks", label: "Ledger", match: ["/ledger", "/address", "/block", "/tx", "/search"] },
  { href: "/wallets", label: "Wallets", match: ["/wallets"] },
  { href: "/governance", label: "Governance", match: ["/governance"] },
  { href: "/notices", label: "Notices", match: ["/notices"] },
  { href: "/documents", label: "Documents", match: ["/documents"] },
];

export function Nav({ initialHeight }: { initialHeight: number | null }) {
  const pathname = usePathname();
  // The menu is open only for the path it was opened on, so any navigation closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;

  const on = (match: string[]) => match.some((m) => pathname === m || pathname.startsWith(`${m}/`));

  return (
    <header className="nav">
      <div className="wrap">
        <Link className="brand" href="/">
          <span className="glyph" aria-hidden="true">к</span>Karma Network
        </Link>
        <button className="menu-btn" type="button" aria-expanded={open} aria-controls="links" onClick={() => setOpenOn(open ? null : pathname)}>
          Menu
        </button>
        <nav className={`links${open ? " open" : ""}`} id="links" aria-label="Main">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={on(l.match) ? "on" : undefined} aria-current={on(l.match) ? "page" : undefined}>
              {l.label}
            </Link>
          ))}
          {/* A plain GET form: search works without JavaScript and clears itself on submit. */}
          <form className="search" action="/search" method="get" role="search">
            <label htmlFor="q">Search</label>
            <input id="q" name="q" placeholder="address, block, tx" autoComplete="off" spellCheck={false} />
          </form>
          <BlockPill initialHeight={initialHeight} />
        </nav>
      </div>
    </header>
  );
}
