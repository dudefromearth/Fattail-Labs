# IKI Factory — what was committed and deployed (2026-08-25)

Operator report of the Factory-only promote to `main` and MiniTwo (`labs.fattail.ai`). Not a spec. Not a GO.

**Host:** MiniTwo · `labs.fattail.ai`  
**Range on disk:** `a7161fc` → `8a74f84`  
**Running:** `git_sha` `8a74f847de2d80fa78a7a1cf806fb23a1ce947d5` · `env=production`

This promote was **Factory commits only**. It was not `git add -A`. Trade Log, Options Lab, Template Runner, and Wiki working-tree dirt stayed local and uncommitted.

---

## Commits that landed on `main` and MiniTwo

Fast-forward `a7161fc..8a74f84` (six commits). The last of these is the IF-8 commit that had been waiting for an explicit promote.

| SHA | Subject |
|-----|---------|
| `6b79e38` | `feat(iki-factory): first commit — IF-1 through IF-6 land together` |
| `c6fc8b8` | `docs(bench): Gemba roster row matches the landed charter (DL-580, DL-582)` |
| `3d04869` | `docs(bench): strip paste debris from README.md` |
| `1750c63` | `feat(iki-factory): IF-7 — conveyor removed, pull model live` |
| `87ed7de` | `docs(iki-factory): file IF-6-G and IF-7-G gate reports` |
| `8a74f84` | `feat(iki-factory): IF-8 Staged lane, v1.1 spec, Published/Woo stub` |

`8a74f84` is **26 files**, +1740 / −64. It is the commit that contains IF-8. It is not still sitting unstaged.

---

## IF-8 is in that commit

`8a74f84` includes:

- `migrations/145_iki_factory_if8_staged.sql` — `staged_ready` + `iki_factory_staged_artifacts`
- `server/tests/test_iki_factory_if8.py`
- `web/components/admin/IkiFactoryBoard.tsx` / `IkiFactoryItemPanel.tsx` (Staged)
- `Specs/FatTail-Labs-IKI-Factory-Spec-v1_1.md` (BUILD)
- `Specs/Capture-2026-08-25-Naming-Derivation-Factory-Scope.md`
- `agents/p-iki-factory/gate-reports/IF-8-G.md` and `IF-8-G-amendment.md`
- `server/main.py` factory routers (`/api/admin/iki-factory`, `/api/iki-factory/live`, publication signal)
- `server/agent_auth.py` scope `factory:operate`

Without this commit, Staged would not exist on the host. It is on the host.

---

## Migrations applied on production `labs`

`schema_migrations` on MiniTwo lists all eight Factory files. They were applied in this deploy, before the API/web restart:

| File | What it does |
|------|----------------|
| `137_iki_factory.sql` | Factory cards + transitions |
| `138_iki_factory_research.sql` | Skills registry / research window fields |
| `140_iki_factory_spec.sql` | `spec_md` |
| `141_iki_factory_live.sql` | Live / publication columns |
| `142_iki_factory_published.sql` | `published`, `obtainable`, `woo_reason` |
| `143_iki_factory_if6_fields.sql` | IF-6 fields |
| `144_iki_factory_if7_backlog_lane.sql` | Lane rename `ideas` → `backlog` |
| `145_iki_factory_if8_staged.sql` | Staged lane: `staged_ready` + `iki_factory_staged_artifacts` |

Checked after apply:

- `iki_factory_cards.staged_ready` present
- `iki_factory_staged_artifacts` table present
- No Factory card rows on production yet, so 144’s rename had nothing to move

Frontend without 144/145 would render and 500. That schema is on production.

---

## What the product is after this deploy

Admin Factory board at `/app/iki/factory` (admin-gated). `/admin/iki-factory` redirects there. Member non-admin sees the Live catalog, not the Kanban.

Lanes: **Backlog → Research → Spec → Build → Staged → Live**. Pull model (IF-7): nothing auto-advances. Admin product type / tier / free-vs-paid is the human promotion (invariant #7). Live write is **Published** first; Woo is a **named stub** (`server/iki_factory_woo.py` · `woo_step`) and does not return success. Free Published templates are obtainable; paid are listed, not obtainable, until the store program. Gemba writes the help guide; Oscar composes the wiki page after publication (DL-583).

Publication signal: `GET /api/iki-factory/publication-signal`.

---

## Host steps that ran

1. `git pull origin main` on MiniTwo → `HEAD=8a74f84`
2. `server/.venv/bin/python migrate.py` → 137–145 applied
3. `web`: `npm ci` + `npm run build` (Next production, `/opt/homebrew/bin`)
4. `launchctl kickstart` API (`:4000`) and web (`:4001`)

**Verify:**

```text
curl -sS https://labs.fattail.ai/api/health
# {"status":"ok","env":"production","git_sha":"8a74f847de2d80fa78a7a1cf806fb23a1ce947d5"}

curl -sS -o /dev/null -w "%{http_code}\n" https://labs.fattail.ai/app/iki/factory
# 200
```

---

## What was not committed or deployed

Left dirty on StudioTwo, not in `8a74f84`, not on MiniTwo:

- Trade Log
- Options Lab / Heatmap
- Template Runner (`web/lib/runner/**`, IKI-P2/P3)
- Wiki chrome / Wiki drafts / help guides for wiki
- SSR / market snap work
- IKI Lab board (`agents/p-iki-lab/`) except the Factory inner app

Do not treat those as live on production from this promote.

---

## Not in this promote

- WooCommerce / store API (stub seam only)
- Wiki SC-3b poll of the Factory signal
- MiniTwo-named research skill
- Runner registry writes
