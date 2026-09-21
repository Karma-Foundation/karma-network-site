# karmanetwork.org - v1 build plan for Claude Code

> **Read `CONTEXT-for-a-fresh-chat.md` first.** It holds what this plan assumes you know: how this machine ships code (three steps below would otherwise fail), Roy's workflow and copy rules, the privacy constraints on what a ledger page may show, and where the prototype's rules differ from the live chain.

## Goal
Build and deploy the Karma Network site: the public record of the Karma protocol (rules, ledger, who controls what, what changed). Read-only. Sells nothing. Dummy data for now, real ledger later.

Reference: `brief/karmanetwork.html`. It is a working single-file prototype of every page with the exact design, copy and a seeded dummy-data generator. Port it; do not redesign it.

Deliverable: a live Railway URL I can open, plus a GitHub repo.

## Stack
| Item | Choice |
|---|---|
| Framework | Next.js 15, App Router, TypeScript |
| Styling | Plain CSS with the token variables from the prototype (`globals.css`). No Tailwind, no UI kit |
| Fonts | Google Fonts via `next/font`: Libre Caslon Text, IBM Plex Sans, IBM Plex Mono |
| Data | `lib/ledger/` with a `LedgerSource` interface. `MockLedger` implements it now (port the prototype generator). `RpcLedger` is a stub that throws "not configured" |
| Rendering | Server components. Ledger pages `dynamic`, everything else static |
| Hosting | Railway, Nixpacks, `npm run build` / `npm start` |
| Env | `LEDGER_MODE=mock` (default). `SHOW_DUMMY_BANNER=true` |
| Tracking | None. No analytics, no cookies, no external scripts besides fonts |

## Routes
| Route | Content | Source in prototype |
|---|---|---|
| `/` | Home: hero, 6 stats, sections 01-06 | `P.home` |
| `/protocol` | Full rules page | `P.protocol` |
| `/why` | NEW. One page, ~600 words: why the protocol exists, what it rewards, what it refuses to do. Dated. Ends with `[SIGNED BY - name, name]`. Placeholder body marked `[WHY - Roy to write]` | - |
| `/notices` | NEW. Dated feed of protocol-level events only: upgrade proposed/adopted, incident, election, pending transfer above threshold. Seed with 8 entries derived from the change log, the incident and the pending transfer | - |
| `/notices/[slug]` | One notice | - |
| `/ledger/blocks?p=` | Paginated blocks, 25/page | `P.blocks` |
| `/ledger/transactions?p=&type=` | Paginated, filter tabs | `P.transactions` |
| `/ledger/addresses?p=` | Ranked holders, 50/page | `P.addresses` |
| `/address/[addr]` | Address page; protocol wallets get signers, policy, pending | `P.address` |
| `/block/[n]` | Block page with prev/next | `P.block` |
| `/tx/[id]` | Transaction page | `P.tx` |
| `/wallets` | Two protocol wallets + labelled third-party | `P.wallets` |
| `/governance` | Terms, change log, signers, elections | `P.governance` |
| `/governance/[version]` | One upgrade | `P.upgrade` |
| `/runners` | Runner table, run a node, limits | `P.runners` |
| `/documents` | Docs cards, API, contact | `P.documents` |
| `/status` | Chain + services + incidents | `P.status` |
| `/search?q=` | Address / block / tx resolver | `P.search` |
| `/api/v1/*` | Thin JSON over `LedgerSource`: `supply`, `blocks`, `blocks/[n]`, `tx/[id]`, `addresses`, `addresses/[addr]`, `runners`, `upgrades` | - |

Nav: Protocol · Ledger · Wallets · Governance · Notices · Documents · search box · live block pill (links to `/status`). "Why" is linked from the hero and the footer, not the nav.

## Data layer
```
lib/ledger/types.ts      Block, Tx, Address, Signer, Upgrade, Runner, Notice, Supply
lib/ledger/source.ts     interface LedgerSource { supply(); blocks(page); block(n); tx(id); addresses(page); address(addr); txForAddress(addr); runners(); upgrades(); notices(); search(q) }
lib/ledger/mock.ts       MockLedger - seeded, deterministic. Port constants and generators from the prototype: GENESIS, BLOCK_MS, PER_BLOCK, SHARES, HALVING, address builder (1,208 addresses, power-law balances normalised to issued supply), curated Foundation / Tech Builders outflows with memos, signer events, 900 generated stake/unstake/transfer txs
lib/ledger/rpc.ts        RpcLedger stub, reads LEDGER_RPC_URL, throws until implemented
lib/ledger/index.ts      getLedger() by LEDGER_MODE
lib/format.ts            fmt, K (к suffix), pct, short, dateStr, timeStr, ago
```
Block height is computed from GENESIS and the clock, so it advances on its own. Cache mock results per process; recompute address balances per request from current height.

## Design
Copy the prototype's tokens verbatim, light and dark: `--bg --panel --ink --body --muted --line --line2 --accent --green --amber --red`. Serif headings, mono for every number and address. Max width 1120. Tables inside `overflow-x:auto`. Responsive at 1000 and 600 px. No hero imagery, no gradients, no icons beyond the copy-address button.

Copy: reuse the prototype's text word for word. Bracketed items (`[Independent signer]`, `[Operator entity]`, `[DATE]`, `[EMAIL]`) stay as brackets; they are open decisions, not bugs.

Dummy banner: shown on every page while `SHOW_DUMMY_BANNER=true`. Text: "Simulation with generated dummy data. Numbers, addresses and dates are illustrative; bracketed text marks decisions still open."

## Steps
1. Ask me once for anything you need to run non-interactively (GitHub auth, Railway auth). Then proceed without further questions.
2. Scaffold Next.js (`--ts --app --no-tailwind --eslint --src-dir`) **at the repo root** - this repo already is `karma-network-site`, so `package.json` must land at the top level, beside `brief/`. See the context file, section 2.
3. Build `lib/ledger` and `lib/format` first. Unit-test the mock: issued = height × 400; sum of all balances = issued; Foundation balance = 48 × height − 183,376.
4. Build layout (nav, footer, banner), then routes in the order of the table above.
5. Add `/why` and `/notices`.
6. Add `/api/v1/*`.
7. README: what the site is, how to run, how to swap `mock` for `rpc`, the `LedgerSource` contract.
8. ~~Create the repo~~ **Already done**: `Karma-Foundation/karma-network-site` exists and holds this brief. Every change from here goes through a PR (context file, section 3).
9. ~~Create the Railway project~~ **Already done**: project `karma-network`. Deployment is GitHub-driven - a merge to `main` deploys. You need no Railway credentials; see `brief/DEPLOY-STATUS.md` for whether the service is connected.
10. Open every route on the live URL. Fix anything broken. Then report.

## Definition of done
- Live Railway URL, all routes render, no console errors
- Mobile: nav collapses, tables scroll, nothing overflows
- Block pill updates without reload (client component, 30 s)
- Search resolves an address, a block number and a tx id
- Lighthouse performance and accessibility ≥ 90 on `/`
- README as above
- Final message to me: repo URL, Railway URL, list of bracketed placeholders still on the site, the list of prototype rules that differ from the live chain, and which routes cannot be backed by the live API without new endpoints from Andrey

## Do not
- Add analytics, cookies, wallet-connect, chat widgets, newsletter forms
- Add marketing copy, testimonials, images, animations
- Change the copy's tone or replace hyphens with em dashes
- Invent data outside the seeded generator
- Connect a domain
- Show a person: no names, Instagram handles, Telegram usernames, photos or bios on any page, in mock or real data. Labels exist only for protocol wallets and third parties who asked for one
- Copy real addresses, handles or incidents from the live chain into the mock "for realism"
- Scatter rule-bearing numbers through page copy: keep supply, per-block issuance, split, halving, fee and pre-mine in one module, because several of the prototype's rules differ from the live chain (context file, section 6) and must be swappable in one place
