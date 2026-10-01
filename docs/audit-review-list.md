# Audit review list - items deferred from the Sep 2026 audit round

| # | Item | Why deferred | Owner | Status |
|---|---|---|---|---|
| 1 | Unclaimed Kreators earn in their name without consent | Needs a protocol change | Andrey | open |
| 2 | Auth-gated route under /api/v1/public/ (builders) contradicts "Auth: none" on the documents page, and /builders is missing from the endpoint list | Rename when client ids change | Andrey | open |
| 3 | Protocol API is served from chain.karmaterminal.com, a product domain. Move the canonical API to a karmanetwork.org hostname (e.g. api.karmanetwork.org); keep chain.karmaterminal.com as an alias until every client has switched. The Karma Terminal runner stays on its own domain by design. | Needs a planned migration; nothing changes until then. | Andrey | open |
| 4 | Why block 0 was re-sealed on 26 Jun and why vesting started 5 May | One line each for the site | Andrey | open |
| 5 | Foundation pool outflows not itemised (~259K), Grants tab empty | API itemisation, #696 follow-up | Andrey | open |
| 6 | Wallet 3775f434… 100% not itemised | Same as 5 | Andrey | open |
| 7 | observer_last_verified_block:foundation-3 stuck at 4208 since 28 Jun | Dead parameter or verification not running | Andrey | open |
| 8 | Foundation auto-stake wallet unlabelled; no bot vs human split of staked total | Needs the address from Andrey, then a site label | Andrey for the address, site for the label | open |
| 9 | Ordinary wallets show first_seen = 26 Jun wallet-row re-creation, not earliest activity (example 4894fe60… has a transfer in block 1,561 on 10 Jun) | API fix, first_seen should be earliest activity | Andrey | open |
