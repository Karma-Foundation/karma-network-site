# karma-network-site

karmanetwork.org - the public record of the Karma protocol: the rules, the ledger, who controls
what, and what changed. Read-only. Sells nothing. No analytics, no cookies, no external scripts.

**Everything on the site today is a simulation.** The ledger is a seeded dummy chain
(`LEDGER_MODE=mock`) and a banner on every page says so. Bracketed text (`[EMAIL]`, `[DATE]`,
`[Operator entity]` ...) marks decisions that are still open; the brackets are intentional.

- Live: https://web-production-72973b.up.railway.app (Railway project `karma-network`, service `web`)
- Deploys: every merge to `main` builds and deploys by itself (Nixpacks, `npm run build` / `npm start`)
- `brief/` is the original brief and single-file prototype. Reference only: never imported, never served.

## Run

```bash
npm ci
npm run dev        # http://localhost:3000
npm test           # unit tests for the mock ledger
npm run lint
npm run build && npm start   # what Railway runs; binds to $PORT
```

Node 22 or newer. Next.js 16 (App Router, React 19), TypeScript, plain CSS. The build plan named
Next 15; `create-next-app@latest` gave 16, which the sibling site already runs on Railway, so it
was kept rather than pinned backwards. Fonts (Libre Caslon Text, IBM Plex Sans, IBM Plex Mono)
are self-hosted at build time by `next/font`, so the browser makes no third-party request.

| Env | Default | Meaning |
|---|---|---|
| `LEDGER_MODE` | `mock` | `mock` or `rpc`. `rpc` is a stub that throws "not configured". |
| `SHOW_DUMMY_BANNER` | on | The banner shows unless this is exactly `false`. A missing variable fails safe. |
| `LEDGER_RPC_URL` | - | Read by the `rpc` stub only. |
| `SITE_PASSWORD` | unset | When set, the whole site (pages and `/api/v1`) answers 401 until the visitor enters this password (HTTP Basic auth, any username). Set it on the host only. This repo is public: never commit the value. Unset it to open the site. |

## Layout

```
src/lib/ledger/rules.ts    every rule-bearing number: supply, per-block issuance, split, halving,
                           fee, pre-mine, thresholds, address and tx id patterns. ONE file.
src/lib/ledger/types.ts    Block, Tx, Address, Signer, Upgrade, Runner, Notice, Supply ...
src/lib/ledger/source.ts   the LedgerSource interface and page sizes
src/lib/ledger/mock.ts     MockLedger - seeded, deterministic, ported from the prototype
src/lib/ledger/rpc.ts      RpcLedger stub
src/lib/ledger/index.ts    getLedger() by LEDGER_MODE, showDummyBanner()
src/lib/format.ts          fmt, K (к suffix), pct, short, dateStr, timeStr, ago
src/components/            Nav, BlockPill, CopyButton, ThemeToggle (client); ui.tsx (server)
src/app/                   one folder per route; src/app/api/v1/* is the JSON API
```

Rendering: ledger pages (`/ledger/*`, `/address`, `/block`, `/tx`, `/search`, `/status`) are
dynamic. Pages that only show the height or supply (`/`, `/protocol`, `/wallets`, `/runners`)
revalidate every 60 s. The rest are static. The block pill in the nav is a client component
that polls `/api/v1/supply` every 30 s.

## The LedgerSource contract

Pages and API routes talk to the ledger only through `getLedger()`:

```ts
interface LedgerSource {
  supply(): Promise<Supply>
  blocks(page): Promise<Page<Block>>              // 25 per page, newest first
  block(n): Promise<BlockDetail | null>
  transactions(page, type): Promise<Page<Tx>>     // 40 per page; type: all | Transfer | Stake | Unstake | Signer change
  tx(id): Promise<Tx | null>
  addresses(page): Promise<Page<Address>>         // 50 per page, ranked by balance
  address(addr): Promise<Address | null>
  txForAddress(addr, limit?): Promise<{ items: Tx[]; total: number }>
  labels(addrs): Promise<Record<string, string>>  // published labels only
  wallets(): Promise<Wallets>                     // the two protocol wallets + labelled third parties
  runners(): Promise<Runner[]>
  upgrades(): Promise<Upgrade[]>
  incidents(): Promise<Incident[]>
  notices(): Promise<Notice[]>
  search(q): Promise<SearchResult>
}
```

Rules of the contract:

- **No method returns a person.** An address is an address, balances and an optional published
  label. No names, Instagram handles, Telegram usernames, photos or bios, in mock or real data.
  Labels exist only for protocol wallets and for owners who published one themselves.
- Every method is async and may be slow. Callers fan out with `Promise.all`.
- Amounts in the mock are whole к as numbers. The live chain uses DECIMAL(20,3) as strings;
  see below.

### What MockLedger does

Ported from `brief/karmanetwork.html`: same constants, same mulberry32 rng and seeds for the
1,208 addresses (power-law balances), the same curated Foundation and Tech Builders outflows
with memos, the same signer events, runners, upgrades, pending transfer and incident. Height is
computed from `GENESIS` and the clock, so the chain advances on its own. Balances are rebuilt
once per block; generated transactions are cached and only ever appended.

Two deliberate differences from the prototype, both because a server has permanent URLs and a
single page that regenerates on load does not:

1. **Transactions are generated per block**, seeded by the block number, at the prototype's
   density (about two per three blocks), instead of 900 transactions walked back from the current
   height. In the prototype every generated transaction slid one block later each time the
   height advanced, so `/tx/<id>` and `/block/<n>` would have changed content every ten minutes.
   Now block n always holds the same transactions, and a tx id encodes its block so `/tx/<id>`
   resolves directly. Address pages show the latest 50 transactions and say so.
2. **Balances sum to the issued supply exactly.** The prototype floored each balance and lost up
   to about 1,200 к; the remainder is handed out 1 к at a time.

Unit tests (`npm test`) hold the invariants: issued = height x 400; the sum of all balances =
issued; Foundation balance = 48 x height - 183,376; a block's content does not depend on the
current height; every tx id resolves to its own transaction; every address matches the one
address pattern; labels are limited to the allowed set; search resolves an address, a block
number, a tx id and a tx prefix; 8 notices, none containing an em or en dash.

`/notices` holds 8 entries derived only from data already in the prototype: the five upgrades,
the one incident, the announced bridge transfer and the pending Grant #9 transfer. Nothing was
invented and nothing was taken from the live chain.

## Swapping mock for rpc

Set `LEDGER_MODE=rpc` and implement `RpcLedger` in `src/lib/ledger/rpc.ts`. **This is not a
config flip**, for three reasons.

### 1. The live API cannot back every route yet

Live public API: `https://chain.karmaterminal.com/api/v1/public`, responses `{ "data": ... }`.

| LedgerSource method | Routes | Live endpoint |
|---|---|---|
| `supply()` | `/`, `/protocol`, `/status`, pill | `/supply`, `/network/overview` |
| `blocks()`, `block()` | `/ledger/blocks`, `/block/[n]` | `/blocks`, `/blocks/:n`, `/blocks/:n/rewards` |
| `transactions()` | `/ledger/transactions` | `/transactions` (addresses only) |
| `runners()` | `/runners`, `/status` | `/runners/active`, `/validators` |
| `upgrades()`, `notices()` | `/governance`, `/notices` | `/parameters/history` is the real change log |
| `wallets()` | `/wallets` | `/service-wallets` (no signer sets) |
| `addresses()` | `/ledger/addresses` | **none** - no address-ranking endpoint |
| `address()`, `txForAddress()` | `/address/[addr]` | **none** - no address endpoint |
| `tx()` | `/tx/[id]` | **none** - no tx-by-id endpoint |
| `search()` | `/search` | **none** - no search endpoint |

The four "none" rows need new routes in the protocol repo. That repo is Andrey's: it is a PR
for him to merge, never a direct change. `/public/builders` answers 401 by design (Kreator data
sits behind the wallet login), so there is no public list of Kreators to build a page from.
`/public/status` does not exist.

Practical notes for the implementation: every live call has a floor of about 0.5 s whatever the
payload, so fetch in parallel and switch the dynamic ledger pages to ISR with `revalidate` at
the block interval (600 s). Check `res.ok` and assert array shape before iterating: a 401 with a
JSON body resolves happily through `fetch().then(r => r.json())`. Amounts are strings with three
decimals (`"29.200"`): parse with a decimal library or keep them as strings, never `parseFloat`
for arithmetic. `/status` should show the chain's own identity from `/supply`
(`total_minted + pre_mined = circulation + burned + unreleased_pre_mine`, `holds: true`), not a
recomputed number.

### 2. The prototype's rules are not the live chain's rules

The copy was ported from the prototype word for word, as briefed. Several of its RULES are
illustrative and are untrue of the live protocol. They all live in `src/lib/ledger/rules.ts`
(and the governance data in `mock.ts`), so the swap is in one place. Measured on the live chain,
21-22 Sep 2026:

| | This site says (prototype) | Live chain |
|---|---|---|
| Pre-mine | none; "Pre-mine: 0 к" is a home page card | There is one: `total_allocation` 80,000,000; about 74.96M unreleased, vesting daily |
| Transaction fee | 0 к, "the protocol has no transaction fee" | Configurable 0.5-5% (spec default 1.5%), burned |
| Burn | not mentioned | 558,386 к burned to date; supply is not height x per-block |
| Issuance per block | 400 к (292 / 48 / 32 / 28) | The 73 / 12 / 8 / 7 % split is right; the amount is 40 к per block (`emission_release_pct` = 5 from block 12,833) |
| Builders pool | to staked Kreators and their stakers | Split again: 25% staking rewards, 75% transaction rewards, unused transaction budget redirected to staking |
| Genesis | 12 Jan 2026 | 26 Jun 2026 era; height 16,440 on 21 Sep 2026 |
| Addresses | 44-char base58 | 64-char lowercase hex. Change `ADDRESS_RE`, `ADDRESS_LENGTH`, `ADDRESS_FORMAT_TEXT`; `short()` and the copy button already cope |
| Tx ids | 64 hex | UUIDs. Change `TX_ID_RE` |
| Block identity | height and one hash | plus `prev_block_hash`, `tx_set_hash`, `state_hash`, `proposer_id`, `signatures[]`, `status` |
| Runners | 4, three marked `[Independent operator]` | 4 (`foundation-1` to `foundation-4`), one operator today |
| Multisig, elections | Foundation 3 of 5, Tech Builders 2 of 3, 7-day notice above 50,000 к, holder elections | Not how the live wallets work today. Governance here is a design, not a description |
| Scale | 1,208 addresses | 929 wallets, 557 Kreators, 11,798 transactions |
| Unstake | immediate, no lock | the live protocol has a cooldown |

Max supply (800,000,000) and block time (10 minutes) are correct as they stand.

### 3. The banner

`SHOW_DUMMY_BANNER` is the only thing standing between this site and a false statement about
pre-mine on the protocol's own public record. Turn it off only after the table above is empty.

## Two APIs, one path prefix

`/api/v1/*` on THIS site is a thin read-only JSON layer over `LedgerSource`:
`supply`, `blocks?p=`, `blocks/[n]`, `tx/[id]`, `addresses?p=`, `addresses/[addr]`, `runners`,
`upgrades`. Responses are `{ "data": ... }`, errors `{ "error": ... }` with 404 or 503. The
Documents page names it as `https://api.karmanetwork.org/v1`, which is where it is meant to
live once a domain is connected. It is NOT the protocol API at
`chain.karmaterminal.com/api/v1`; the two only share a prefix.

## Copy rules

- No em dashes or en dashes in anything a user can read. Use " - ". Check before every PR:
  `grep -rn "—\|–" src/` must print nothing.
- The operator is "the Karma community". "Foundation wallet" is the name of a wallet, not an entity.
- Do not assert a jurisdiction. Leave bracketed placeholders as brackets until decided.
- "Kreator" is spelled with a K. The symbol is к (Cyrillic small ka).

## Workflow

Branch, PR, squash-merge. Never push to `main`. Stage by explicit path. Base every PR on `main`.
After a merge, poll the live URL for a string unique to the change before calling it live.
