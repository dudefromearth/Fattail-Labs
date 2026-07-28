# Seed WK3 — Foxtrot: Env, checkout, sync tick

**Project:** p-wiki · **Agent:** Foxtrot · **Prerequisite:** WK2 (∥ WK4)

## Files in scope

- `infra/deploy.md` (LABS_WIKI_ROOT section; MiniTwo checkout + tick)
- `infra/` launchd plist (new): pull + reindex tick on MiniTwo
- Dev env template/example updates (wherever env schema is documented)

## Out of scope

- Code changes in `server/` · lab-wiki repo contents

## Work

1. Document `LABS_WIKI_ROOT` for dev (`/Users/ernie/lab-wiki`), staging, production
   (MiniTwo checkout path — propose `/Users/ernie/lab-wiki` on MiniTwo via
   `git clone git@github.com:dudefromearth/lab-wiki.git`; deploy key or existing
   account — coordinate with Coach).
2. Sync tick (WIK-D7 + parent D-12): launchd job on MiniTwo —
   `git -C $LABS_WIKI_ROOT pull --ff-only && curl -X POST localhost:4000/api/admin/wiki/reindex`
   every few minutes; log to file; failure = loud log line, not silent.
3. Dev note: manual `reindex` after editing the local vault.
4. Verify on dev: clean-clone simulation → boot → reindex → counts (paste).

## Completion

- [ ] deploy.md updated (section pasted in report)
- [ ] Tick plist written + install instructions; dry-run on dev shown
- [ ] Fail path shown: tick with unreachable API logs loudly
