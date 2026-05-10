# PR evidence archive

This directory holds Playwright probe artifacts (screenshots + transcripts) for user-visible PRs. Each PR gets a `pr-<NUMBER>/` subfolder.

The `/do` workflow's evidence step (per `.agency/do.md` → "PR evidence") commits artifacts here on the PR branch and embeds them in the evidence comment via raw GitHub URLs. After merge, they live on `main` as a permanent record of how the surface looked at the time of the change.

## Why a folder per PR rather than amend-and-overwrite

A `pr-12/` folder taken at the time of merge is *evidence*, not state. If the surface evolves in `pr-37`, the screenshots from `pr-12` should still show what the page looked like in 2026-04 — that's the point. Linking each PR's evidence to the version of the page it landed on is the value.

## Why commit images to the repo at all

Considered alternatives:

- **GitHub user-attachments** (drag-drop in the web UI): no programmatic CLI, can't be automated.
- **Orphan `evidence` branch** that never merges: cleaner for `main`, but the URLs break if the branch is ever deleted, and reviewers can't browse the folder offline.
- **Release attachments** (`gh release create`): clutters releases, requires a per-PR draft release.

Committing under `docs/evidence/pr-<N>/` is the lowest-friction option that survives clones, branch deletes, and offline reads. Cost: ~1–2 MB of PNG per user-visible PR. At ~10 PRs/year that's ~10–20 MB on `main` — acceptable for a docs folder.

## Pruning

If `main` ever feels heavy, `git filter-repo --path docs/evidence/ --invert-paths` removes the entire archive. Don't prune individual folders — the value is in the per-PR snapshot, and a partial archive is worse than none.
