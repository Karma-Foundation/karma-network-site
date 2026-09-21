# Deploy status

**NOT CONNECTED - one step left, and it is Roy's.** Updated 22 Sep 2026.

What exists on Railway (created from Roy's Mac):

| | |
|---|---|
| Project | `karma-network` (`722c3a4f-4f32-4a99-a7fb-791293386234`), workspace "roeilevav's Projects" |
| Service | `web` (`b6f7ff8b-42a8-429e-87d3-58b42c40b746`), environment `production` |
| Variables | `LEDGER_MODE=mock`, `SHOW_DUMMY_BANNER=true` - already set |
| URL | https://web-production-72973b.up.railway.app - reserved, serves nothing until a deploy lands |

What is missing: the service has **no source**. Linking it to this repo from the CLI was
refused ("Unauthorized", with a valid login) both before and after the repo had a commit. The
sibling site deploys from `Karma-Foundation/karma-terminal-site`, so Railway's GitHub app does
reach the org - it is almost certainly installed on *selected repositories*, and this new repo
is not among them.

**Roy's step (phone is fine):**
1. GitHub -> Karma-Foundation -> Settings -> GitHub Apps -> Railway -> Configure -> add
   `karma-network-site` to the repository list.
2. Railway -> project `karma-network` -> service `web` -> Settings -> Source -> Connect Repo ->
   `Karma-Foundation/karma-network-site`, branch `main`.

After that every merge to `main` builds and deploys by itself (Nixpacks: `npm run build`,
`npm start`). Until then merges are harmless: nothing deploys, nothing breaks.

**For the session building the site:** do not wait on this. Build, open PRs, merge. When you
reach plan step 10 ("open every route on the live URL"), check the URL above. If it serves the
app, do step 10 against it. If it still serves nothing, verify every route against
`npm run build && npm start` locally instead, say so plainly in your final message, and list
the two steps above as the only thing between the merged code and a live site. Whoever
connects the source should then replace the first line of this file with `CONNECTED` and the
date.
