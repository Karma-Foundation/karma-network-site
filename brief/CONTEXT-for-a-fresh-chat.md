# Context a fresh chat will not have

Read this before `karmanetwork-build-plan.md`. The plan says WHAT to build. This file is
everything the plan assumes you know and you do not: who Roy is, how this machine ships code,
what the real chain looks like next to the prototype's dummy one, and the rules that were
learned the hard way in the wallet work. Written 22 Sep 2026 from the session that built the
wallet, the GDPR gate and the claim flow.

Nothing here changes the plan's scope. Where it contradicts a plan step, it says so explicitly
(section 2 only: the repo and the Railway project already exist, and the app goes at the repo root).

---

## 1. Who and what

- **Roy** (roei.levav@gmail.com) is the founder. He owns every frontend and all product and
  copy decisions. He wants short answers, work shipped without narration, and simulations or
  mockups BEFORE a visual change is built. He reads diffs rarely and outcomes always.
- **Andrey** (@Crypto_Wombat) owns the protocol: the chain, the API, consensus, the database.
  Nothing in this project touches his code. If the site ever needs a new API route, that is a
  PR to his repo for him to merge, never a direct change.
- **Karma** is a rule-based ledger. People stake Karma (symbol **к**, Cyrillic small ka, which
  the prototype already uses - keep it; the wallet uses the Greek κ and unifying the two is a
  known open item, not yours) on "Kreators" - artists and hosts - and both earn from block
  emission. "Kreator" is always spelled with a K.
- **This site** is the protocol's public record: rules, ledger, who controls what, what
  changed. It sells nothing. It is deliberately the dry, institutional sibling of the product
  sites below, and should not borrow their look.

### The other properties (do not confuse them, do not restyle this site after them)

| Property | What | Repo | Host |
|---|---|---|---|
| wallet.karmaterminal.com | The wallet, a Telegram mini app + web | `Karma-Foundation/karma-wallet` (static HTML) | Cloudflare Pages |
| karmaterminal.com | Marketing site + Karma Auction | `Karma-Foundation/karma-terminal-site` (Next 16) | Railway, project "Karma Terminal Website" |
| chain.karmaterminal.com | The protocol API | `Karma-Foundation/Karma-Protocol` (Andrey's) | Railway, project "nurturing-adventure" |
| **karmanetwork.org** | **This site** | to be created | Railway, new project |

`karmanetwork.org` already resolves (3.33.130.190 / 15.197.148.33 - a registrar parking or
forwarding address, not ours). The plan says do not connect a domain; that stands. Just know
it is registered and parked, so nobody is surprised later.

---

## 2. Where you are running, and what is already done

**You are most likely a cloud session** on `Karma-Foundation/karma-network-site`, started from
Roy's phone so the work does not depend on his Mac. The brief you are reading lives in
`brief/` of that repo. Three things follow.

**The repo and the Railway project already exist - do not create them.** Plan steps 8 and 9
were done on 22 Sep 2026 from Roy's Mac:

- GitHub: `Karma-Foundation/karma-network-site`, public, `delete_branch_on_merge` on.
- Railway: project **`karma-network`** (id `722c3a4f-4f32-4a99-a7fb-791293386234`), workspace
  "roeilevav's Projects", environment `production`, service **`web`** with the plan's two
  variables already set. Reserved URL: https://web-production-72973b.up.railway.app

**You have no Railway credentials, and you do not need any.** Deployment is meant to be
GitHub-driven: a Railway service sourced from this repo builds and deploys every merge to
`main` (Nixpacks, `npm run build` / `npm start`, env `LEDGER_MODE=mock` and
`SHOW_DUMMY_BANNER=true`). Your job ends at a merged PR; Railway does the rest.
Check `brief/DEPLOY-STATUS.md` for whether that service is connected yet. If it says NOT
CONNECTED, build and merge anyway, and tell Roy in your final message that the one remaining
step is his: connect the repo in the Railway dashboard. Do not ask him for a Railway token and
do not try to install the CLI - it is a two-tap job for him and a credentials problem for you.

**Build the app at the REPO ROOT**, not in a subfolder. The plan's step 2 creates a
`karma-network-site/` directory; here the repo already is that directory. Scaffold into a temp
folder and move the files up, or run the generator with `.` as the target - either way
`package.json` must end up at the root or Railway will not find it. Leave `brief/` where it
is; it is reference only and must never be served or imported.

**The very first commit already exists** (the brief). So rule 2 of section 3 applies from your
first change: branch, PR, squash-merge. No direct pushes to `main`.

**Next version.** The plan says Next 15. The sibling site runs Next 16.1.4 / React 19.2.3 on
Railway without trouble. If `create-next-app@latest` gives you 16, keep it and say so in the
README rather than pinning backwards.

### If you are instead running on Roy's Mac

Then four things differ, all of them traps:

- **`gh` is not installed.** Every GitHub operation goes through the REST API with the token
  from git's credential helper:
  ```bash
  TOK=$(printf 'protocol=https\nhost=github.com\n\n' | git credential fill | sed -n 's/^password=//p')
  umask 077; printf 'header = "Authorization: Bearer %s"\n' "$TOK" > "$SCRATCH/cc"   # 0600, never echo the token
  curl -sS -K "$SCRATCH/cc" -H "Accept: application/vnd.github+json" \
    -X POST https://api.github.com/repos/Karma-Foundation/karma-network-site/pulls -d @body.json
  rm -f "$SCRATCH/cc"
  ```
  Merge with `PUT .../pulls/<n>/merge {"merge_method":"squash"}`. Parse GitHub JSON with
  `json.loads(text, strict=False)` - PR bodies carry raw control characters.
- **`npx` is broken** (the symlink exists, the shell reports "no such file"). Use
  `npm exec --yes -- create-next-app@latest ...`. Node is v24.13, npm 11.6.
- **`git config --global user.name/email` are empty.** The local clone at
  `~/karma-network-site` already has them set; a fresh clone would not.
- **Railway CLI is logged in and directory-scoped.** `~/karma-network-site` is linked to the
  `karma-network` project. Never run `railway` from `~/karma-terminal-site` or
  `~/Desktop/karma-protocol`: those are linked to live production, and the second is the
  production API.

---

## 3. Workflow rules (Roy's global CLAUDE.md - these apply to every repo)

1. Sync before starting: `git fetch origin`, be level with `origin/main`.
2. **Everything goes through a PR. Never push to `main`**, even one line. Branch
   (`feat/…`, `fix/…`), commit, push, PR, squash-merge. For this site Roy's lane rule is
   self-merge after checks - there is no second reviewer. The one exception is the very first
   push that creates `main`.
3. **Stage by explicit path. Never `git add -A` or `git add .`** Verify with
   `git diff --cached --name-only` before committing. A past PR carried 13 stray binaries and
   a debug script this way.
4. **Base every PR on `main`, never on another open branch.** Twice, a PR stacked on a branch
   was auto-closed when that branch squash-merged and was deleted, and GitHub refuses to
   reopen a PR whose base is gone. Eat the merge conflict instead.
5. If you hold a PR waiting on something else, set a monitor. Two held PRs sat unmerged for a
   day after their dependency shipped, and the Core app showed no images the whole time.
6. Commit messages explain WHY, in prose, including what was tried and rejected. End them with
   the `Co-Authored-By:` line the session's attribution reminder gives you; end PR bodies with
   the `🤖 Generated with [Claude Code]` line.

---

## 4. Copy rules

- **No em dashes in anything a user can read. Ever.** Use " - " (spaced hyphen). The plan
  says this once; it is Roy's hardest copy rule and it has been broken by accident more than
  once, including in mockups. Grep the build for `—` before every PR. En dashes too.
- The public name of the operator is **"the Karma community"**. Not "Karma Foundation", not
  "the Foundation" as a legal person. "Foundation wallet" as the NAME OF A WALLET is fine and
  is what the prototype uses. There is no incorporated entity yet; that is why the prototype
  has `[Operator entity]` in brackets. Leave the bracket.
- Privacy and contact address in use across the other sites: **karmaterminal1@gmail.com**.
  The prototype has `[EMAIL]` - leave the bracket, the plan says brackets are open decisions.
  This is only so you know what the answer will probably be.
- Governing law named on the other sites' terms is the British Virgin Islands, flagged to a
  lawyer as unsettled because there is no entity for it to attach to. Do not assert a
  jurisdiction on this site.
- Plain, dry, declarative. No exclamation marks, no "we're excited". The prototype's tone is
  correct; match it in the two new pages (`/why`, `/notices`).

---

## 5. Privacy: the constraint that shapes what a "ledger explorer" may show

On 18 Sep 2026 every Kreator's personal data was moved behind the wallet login (Karma-Protocol
#669, #674). This matters here because a block explorer is exactly the kind of page that leaks
it back out. **Hard rules for this site, mock data or real:**

- An address page shows an address, balances and transactions. It never shows a person's
  name, Instagram handle, Telegram username, photo or bio. Not as a label, not in a memo,
  not in a tooltip.
- The ONLY labelled addresses are protocol wallets (Foundation, Tech Builders) and third
  parties who asked for a published label. That is already the prototype's design
  ("Third-party wallets with a published label"). Keep it that narrow.
- Mock data must be invented. No real handle, no real name, no real address copied from the
  live chain "for realism". The wallet's Demo Studio was deleted for carrying three real
  people in its fixtures, then rebuilt on invented ones. The prototype's generator is already
  clean - keep the port clean.
- The real public API reflects the same rule, which constrains `RpcLedger` later:
  `/public/transactions` returns addresses only (usernames were removed);
  `/public/blocks/:n/replay-envelopes` is served redacted (no notes, no review notes, no voter
  ids, no Instagram handles, each row marked `redacted: true`); `/public/builders` returns
  **401** without a wallet session, so there is no public list of Kreators to build a page
  from, by design.
- The plan already says no analytics, no cookies, no external scripts beyond fonts. Add:
  `robots` stays permissive here (this site is MEANT to be public and indexed, unlike the
  wallet, which is `noindex` everywhere). Do not copy the wallet's `noindex`.

---

## 6. The prototype's chain is not the real chain

The plan says dummy data now, real ledger later, and to port the prototype's copy word for
word. Do that. But the prototype's RULES are illustrative too, not just its numbers, and
several of them are flatly untrue of the live protocol. A fresh chat will not know that, and
the day `LEDGER_MODE=rpc` is switched on, these become false statements on the protocol's own
public record. **Do not fix them now** - the plan is explicit about porting verbatim - but
(a) keep every rule-bearing number in ONE place (`lib/ledger/` constants or a `rules.ts`), not
scattered through page copy, so the swap is one file; and (b) list them in the README under
"what changes when mock becomes rpc". Measured on the live chain, 21-22 Sep 2026:

| | Prototype says | Live chain |
|---|---|---|
| Pre-mine | "none - block 1 is the first issuance" | **There is one.** `total_allocation` 80,000,000; `unreleased_pre_mine` 74,958,904; it vests daily. This is the biggest gap: "Pre-mine: 0 к" is a headline card. |
| Transaction fee | "0 к - the protocol has no transaction fee" | **There is one.** Configurable 0.5-5% (spec default 1.5%); a live 15 к transfer carried `fee_amount` 0.015, all burned. |
| Burn | not mentioned | 558,386 к burned to date (unused reward budget + fees). Supply is not simply `height × per-block`. |
| Emission per block | 400 к, split 292 / 48 / 32 / 28 | The SPLIT is right: 73 / 12 / 8 / 7 % (Builders / Foundation / Tech Builders / Validators). The AMOUNT is not: live blocks carry `emission_amount` 40.000 (29.2 / 4.8 / 3.2 / 2.8), governed by `emission_release_pct` = 5 from activation block 12,833. |
| Builders pool | "to staked Kreators and their stakers" | Split again inside: 25% staking rewards, 75% transaction rewards, with unused transaction budget redirected to staking (`redirect_unused_tx_reward_to_staking_enabled`). Staking weight is `sqrt(stake) × log2(stakers + 1)`; 50/50 Kreator/stakers is right. |
| Max supply | 800,000,000 | 800,000,000. Correct. |
| Block time | 10 minutes | 600 s. Correct. |
| Genesis | 12 Jan 2026 | Live genesis is 26 Jun 2026 era (config rows stamped 2026-06-26); height was 16,440 on 21 Sep 2026. |
| Addresses | 44-char base58 (`7fQm3AxV9n…`) | **64-char lowercase hex** (`0f4232ad2c08994f…`). Affects `short()`, the search resolver's address regex, column widths and the copy button. Build `search` so the address pattern lives in one place. |
| Tx ids | prototype format | UUIDs (`af8b4f2c-2df3-49ee-9951-71ed2b0bb213`). |
| Block identity | height | height plus `block_hash`, `prev_block_hash`, `tx_set_hash`, `state_hash`, `proposer_id`, per-signer `signatures[]`, `status` (`finalized`). A real block page has far more to show than the prototype's. |
| Runners | 4 generated, one "[Independent runner operator]" | 4 runners, `foundation-1` … `foundation-4`, all protocol version 52, all operated by the same party today. 4 of 4 signatures on a block. The prototype's claim of independent operators is aspirational; the brackets are honest, keep them. |
| Multisig | Foundation 3-of-5, Tech Builders 2-of-3, 7-day notice above 50,000 к | Not how the live wallets work today. Governance in the prototype is a DESIGN, not a description. |
| Scale | 1,208 addresses | 929 wallets, 557 of them Kreators; 11,798 transactions; 287,757 к staked across 8,206 active stakes. |

The supply identity the real chain enforces after every block, which is what the plan's unit
tests are a toy version of:

```
total_minted + pre_mined = circulation + burned + unreleased_pre_mine
```

`GET /public/supply` returns both sides and the discrepancy (`holds: true`, `0.000`). When
RpcLedger is built, the `/status` page should show THAT, not a recomputed number.

### The real public API, for `RpcLedger` later

Base: `https://chain.karmaterminal.com/api/v1/public`. Responses are `{ "data": … }`. All
amounts are **strings with three decimals** (`"29.200"`) - the protocol uses DECIMAL(20,3) and
never floats; parse with a decimal library or keep them as strings, never `parseFloat` for
arithmetic. Unauthenticated GETs that exist today:

`/blocks` `/blocks/:number` `/blocks/:number/rewards` `/blocks/:number/replay-envelopes`
(redacted) `/transactions` `/supply` `/parameters` `/parameters/history` `/network/overview`
`/network-stats` `/staking/overview` `/runners/active` `/validators` `/service-wallets`
`/genesis-snapshot` `/mempool` `/user-count`

Notes that save an afternoon:
- `/parameters/history` is the real change log - the honest source for `/governance` and
  `/notices` once live. `/network/overview` is one call that feeds most of the home stats.
- There is **no** address endpoint, no address-ranking endpoint, no tx-by-id endpoint, and no
  search endpoint. `/ledger/addresses`, `/address/[addr]`, `/tx/[id]` and `/search` cannot be
  backed by the live API as it stands; they need routes from Andrey. Say this in the README so
  nobody assumes `rpc` mode is a config flip.
- `/builders` is 401 (section 5). `/status` does not exist (404) despite the name.
- **Every call has a floor of about 0.5 s** regardless of payload (6 KB took 533 ms, measured
  20 Sep). Server components that fan out to several endpoints must fetch in parallel and
  cache (`revalidate` of a block interval is natural - nothing changes faster than 600 s).
  The plan's "ledger pages `dynamic`" is fine for mock; for rpc, prefer ISR keyed to the block
  interval.
- The plan puts THIS site's own JSON at `/api/v1/*` and the prototype's Documents page names
  `api.karmanetwork.org`. That is a second, separate API that merely shares a path prefix with
  the protocol's. Keep the distinction explicit in the README.

---

## 7. Technical lessons from the wallet that apply here

- **The in-app Browser pane runs with `document.hidden === true`.** `requestAnimationFrame`
  and `IntersectionObserver` never fire in it unless the tab is fronted (`tabs_select`).
  Screenshots time out while hidden. This produced two false "it's broken" alarms. The plan's
  "block pill updates every 30 s" and any scroll behaviour must be tested with the tab
  fronted, or by calling the function directly - and say which you did.
- **Verify by measuring, not by reading.** Roy was told a flash was fixed when only its button
  had been hidden; the subtitle still flashed. Sample what is on screen during the slow path,
  not just the end state. For alignment, measure; for "is it live", curl the deployed file
  and grep for the new symbol.
- **Test against real shapes.** A name-shortening rule looked right on five invented names and
  produced "Hi The!" and "Hi Black!" on the real 549. When a formatter handles addresses,
  amounts or names, run it over the full mock set and eyeball the outliers.
- **HTTP errors are not network errors.** `fetch().then(r => r.json())` resolves happily on a
  401 whose body is JSON, and the error object then flows into `.map`/`.forEach`. Check
  `res.ok` and assert array shape before iterating. This took the admin mempool view down.
- **A deep link is a one-time instruction.** If `/search?q=` or any query param drives
  navigation, make sure a reload does not re-fire it over the user's place.
- **Deploy check.** Railway builds take a couple of minutes. After merge, poll the live URL
  for a string unique to the change before telling Roy it is live. Do not infer "deployed"
  from a 401/200 on a route that would answer the same way before the change - that mistake
  was made once and caught only by checking the deployed commit hash (`railway status --json`).
- **Railway SSH** (only if ever needed): arguments are joined and run through `sh -c`
  unquoted; pass pipeline operators as separate quoted args. Sessions over ~3 minutes drop
  silently.

---

## 8. Things the plan leaves open that Roy will be asked about - decide or flag, do not guess

1. **Owner of the GitHub repo**: `Karma-Foundation` (assumed above). Confirm if org creation
   is refused.
2. **`/why`** is Roy's to write. Ship the placeholder exactly as the plan specifies and list
   it in the final message.
3. **`/notices` seed entries** are to be "derived from the change log, the incident and the
   pending transfer" in the prototype. Derive them; do not invent new events, and do not
   import real incidents from the live chain into a page labelled as simulation.
4. **Dark mode**: the prototype supports `prefers-color-scheme` plus a `data-theme` override.
   Port both; with server components, set the attribute before paint (inline script in
   `<head>`) or the page flashes light on a dark system.
5. **The dummy banner must be impossible to miss and impossible to forget.** Given section 6,
   it is the only thing standing between this site and a false statement about pre-mine on
   the protocol's public record. It is env-driven per the plan; default it ON in code so a
   missing env var fails safe.

---

## 9. Final message Roy expects (the plan's, plus two lines)

Repo URL, Railway URL, the list of bracketed placeholders still on the site - and, from this
file: the list of prototype rules that differ from the live chain (section 6), and which of
the routes cannot be backed by the live API without new endpoints from Andrey.
