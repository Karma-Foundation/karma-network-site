# Deploy status

**CONNECTED - 22 Sep 2026.** Roy linked the Railway service to this repo. Every merge to
`main` now builds and deploys by itself.

| | |
|---|---|
| Project | `karma-network` (`722c3a4f-4f32-4a99-a7fb-791293386234`), workspace "roeilevav's Projects" |
| Service | `web` (`b6f7ff8b-42a8-429e-87d3-58b42c40b746`), environment `production` |
| Source | `Karma-Foundation/karma-network-site`, branch `main` - verified |
| Variables | `LEDGER_MODE=mock`, `SHOW_DUMMY_BANNER=true` - already set |
| Live URL | https://web-production-72973b.up.railway.app |

**The deployments so far show FAILED, and that is expected.** The repo held only `brief/` when
the source was connected, so there was no `package.json` and nothing for Nixpacks to build. Do
not investigate those. The first deployment that matters is the one triggered by the merge
that puts a Next.js app at the repo root. Until then the URL answers 404.

**For the session building the site:**

- You have no Railway credentials and need none. Your part ends at a merged PR.
- Builds take a couple of minutes. After a merge, poll the live URL for a string unique to
  that change before saying it is live. A 200 alone proves nothing once any version is up.
- If a deploy fails after the app exists, the usual causes are: `package.json` not at the repo
  root; a missing `start` script (`next start`); not binding to `$PORT` (Next does by default
  under `next start` - do not hardcode 3000); or a build that needs an env var the service
  does not have. You cannot read Railway's build logs from the cloud. Reproduce with
  `npm ci && npm run build && npm start` locally first - that catches nearly all of them - and
  if it builds locally but fails on Railway, tell Roy exactly that and ask him for the log.
- `brief/` is reference only. Never import from it, never serve it.
