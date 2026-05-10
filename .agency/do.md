# /do config

## Check command
pnpm typecheck && pnpm lint

## Test command
pnpm test

## CI command
pnpm typecheck && pnpm lint && pnpm test && pnpm build

## Documentation
Keep `README.md` in sync with user-facing changes.

## PR evidence

Whenever the PR's diff touches `src/pages/**` or `src/components/**`, capture a Playwright walk-through and post it as the PR evidence comment. Screenshots are mandatory — a transcript alone is not enough; a reviewer needs to see the surface render. Diffs that touch only `src/repo/`, `src/lib/`, `src/domain/`, tests, or config skip the probe and post a one-line "no UI surface changed" note instead.

### Procedure

1. **PR number:** read from `gh pr view --json number`. The current branch's head SHA is the artifact target.
2. **Dev server:** `pnpm dev` in the background. Read the actual port from the `Local:` line — vite falls back to 3001/3002 if 3000 is taken.
3. **Probe:** copy `.agency/pr-evidence/probe-template.mjs` to `/tmp/qa-lakshya/probe-pr-<NUMBER>.mjs` and replace the `PR-specific flows` section with the routes/components this PR adds or changes. One `log()` line per distinct user-visible behavior; one `page.screenshot()` per *meaningful decision point* (default state, key filter applied, drill-down landing, post-action effect) — not one per step.
4. **Run:** `env -u LD_LIBRARY_PATH -u LD_PRELOAD node /tmp/qa-lakshya/probe-pr-<NUMBER>.mjs | tee /tmp/qa-lakshya/artifacts/transcript-pr-<NUMBER>.txt`. The `env -u` strips `LD_LIBRARY_PATH` so system Chrome doesn't pick up the Nix `libstdc++` (see commit history if you're curious). The probe writes screenshots to `/tmp/qa-lakshya/artifacts/evidence-pr-<NUMBER>-*.png`.
5. **Commit:** copy screenshots and the transcript into `docs/evidence/pr-<NUMBER>/` on the PR branch and push. Commit message: `docs(evidence): pr-<NUMBER> probe artifacts`.
6. **Compose the comment:**
   - Header: `## Evidence`
   - For each screenshot: `### <flow name>` + a one-line caption + `![<alt>](https://github.com/<OWNER>/<REPO>/raw/<BRANCH>/docs/evidence/pr-<NUMBER>/<FILE>)`. Use `git remote get-url origin` and `git branch --show-current` to fill in OWNER/REPO/BRANCH.
   - Inline the transcript in a fenced block at the bottom.
   - Close with a one-line size note (`Total artifact size: ~X MB`) so the reviewer can weigh the merge cost.
7. **Return the markdown only** — the /do evidence step posts the comment itself; the sub-agent should not call `gh pr comment`.

### Conventions for the probe

- Viewport 420×900 (the app is mobile-first; testing at desktop widths misses thumb-reach and overflow bugs).
- Fresh IndexedDB per run via `indexedDB.databases() → deleteDatabase` so the bootstrap is reproducible.
- Bootstrap by importing the sample schedule (`/tmp/qa-lakshya/artifacts/sample-schedule.json` if present; otherwise click "Download sample" on the Import page once and save the result there).
- For every new route, include a *direct-URL refresh* assertion (`page.goto`) — "the route works on cold load" is a regression class the probe should catch.
- For every page-design rule that the hickey/lowy review pinned (e.g. "today partial → todo tone"), include an explicit assertion. The probe is the regression net for those rules going forward.
- Capture `pageerror` and `console.error` events; any non-empty list at the end fails the comment as a hard ❌ rather than just informational.
