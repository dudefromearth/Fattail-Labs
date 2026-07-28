# Course export bundle — 2026-07-28

Portable Canonical Course packages from StudioTwo (dev) for import on **MiniTwo**
(production).

## Contents

| File | Course | Modules | Lessons |
|------|--------|--------:|--------:|
| `start-here.course.json` | Start Here | 1 | 6 |
| `fattail-foundations.course.json` | FatTail Foundations | 12 | 52 |
| `fattail-app.course.json` | FatTail App | 5 | 12 |
| `campaigns.course.json` | Campaigns | 10 | 36 |
| `0-dte-foundations.course.json` | 0-DTE Foundations | 7 | 33 |

Plus `MANIFEST.json` (categories + catalog order).

**Not included:** member enrollments, progress, discussions, reviews.

## Import on MiniTwo (production)

```bash
ssh minitwo
cd ~/Fattail-Labs && git pull origin main

# Schema must include catalog order columns
set -a && source .env && set +a
(cd server && .venv/bin/python migrate.py)   # applies 038_* if pending

# Import as published (creates categories if missing)
cd server
.venv/bin/python course_packages.py import \
  --dir ../exports/courses-2026-07-28 \
  --mode publish

# Restart API so catalog is fresh (web only if you also deployed UI)
launchctl kickstart -k gui/$(id -u)/ai.fattail.labs.api

# Verify
curl -s 'localhost:4000/api/courses?sort=order' | python3 -m json.tool | head -40
```

### Rules

- **Refuses** to overwrite a course that is already **published** on the target
  (same slug). Archive/unpublish first, or import will create `slug-2` only when
  using create flow with a different approach — default is fail-loud on published.
- Re-import of an existing **draft** uses replace-then-publish.
- Catalog `sort_order` / `catalog_section` applied from MANIFEST after import
  (requires migration `038_catalog_order`).

### Draft-only import

```bash
.venv/bin/python course_packages.py import \
  --dir ../exports/courses-2026-07-28 \
  --mode create_draft
```

## Re-export from any host

```bash
cd ~/Fattail-Labs/server
set -a && source ../.env && set +a
.venv/bin/python course_packages.py export --out ../exports/courses-$(date +%Y-%m-%d)
# optional: --slug start-here --slug fattail-foundations
```
