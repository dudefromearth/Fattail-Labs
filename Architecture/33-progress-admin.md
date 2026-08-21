# 33 — Progress admin

Spec: `Specs/FatTail-Labs-Progress-Admin-Spec-v1.0.md` · **DL-530**

## Shape

```
launchd (hourly)                     admin browser
      |                                    |
      v                                    v
progress/refresh.py            GET /api/admin/progress
      |                                    |
  sources_woo ---+                  routes/progress_admin.py
  sources_youtube +--> progress_snapshot -----> progress/report.py
  sources_ac ----+     (per source,                 |
                        status + error)      metrics / projection / rules
                                                    |
                                          web/app/admin/progress/page.tsx
```

Sources are I/O only — they fetch and normalise, they derive nothing. All arithmetic
lives in three pure modules (`metrics`, `projection`, `rules`) with no I/O, no clock
and no config, which is what makes it testable and what keeps the page honest.

## Isolation

`refresh_source()` never raises: it records `ok` or `failed` with the error text and
returns. `report.build()` reads the latest **successful** snapshot per source, so a
broken feed degrades one panel and appears in the freshness footer as stale. There is
no code path that turns an unreachable source into a zero.

## Blast radius

Additive. New tables, new package, new route file, new page. Two existing lines
change: the router registration in `server/main.py` and one nav entry in
`web/components/admin/AdminNav.tsx`. Nothing on a member path is touched, and the
WooCommerce credential is read-scope — Labs never writes to commerce.

## Extending

- **New source:** add `sources_x.py` exposing `fetch(months, now) -> dict`, add it to
  `refresh.SOURCES`, surface it in `report.build()`.
- **New finding:** add a function taking the context dict and returning
  `Finding | None`, add it to `rules.RULES`. It must state its trigger and threshold.
- **New parameter:** insert a row in `progress_model_param` via a migration; the
  editor and range validation pick it up with no code change.
