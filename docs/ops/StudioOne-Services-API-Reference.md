# StudioOne — Services & API Reference

**Date:** 2026-09-20  
**Verified:** live, by SSH from StudioTwo (`ssh studioone`), reading the actual running source and hitting the live ports — not just grep on this checkout.  
**StudioOne checkout at verification time:** `~/Fattail-Labs` @ `6e65104f` (4 commits behind this repo's `main`, plus local uncommitted changes — see `docs/ops/StudioOne-SSH-Reachability.md` for how to re-check).  
**Audience:** anyone (human or agent) working on StudioOne who needs "what's running, on what port, with what routes" without re-deriving it from source every time.

This is the StudioOne-side mirror of [`Architecture/37-visible-range-volume-profile-api.md`](../../Architecture/37-visible-range-volume-profile-api.md) (the member-hop contract) and [`Architecture/36-studioone-data-plane.md`](../../Architecture/36-studioone-data-plane.md) (topology). Re-verify against those + source if this doc and the tree disagree — this file can go stale exactly like any other doc.

---

## 0. One-page map

| Service | Port | launchd job | Auth | What it's for |
|---|---|---|---|---|
| **StudioOne ops dashboard** | **5055** | `ai.fattail.labs.ssr-snapshot-dash` | Mixed — see §1 | Four pages, one process: `/` home (summary + links), `/chain` (capture tap health, day/coverage browsing), `/vp` (VP/futures ops panel), `/docs` (this reference, rendered live) |
| **VP Profile API** | **4010** | `ai.fattail.labs.vp-api` | Computing session cookie, role ≥ administrator | Volume-profile histogram bins (Visible Range window, full range, session/developing), computing-side futures OHLC, SSE stream |
| **Symbology Registry** | **4011** | `ai.fattail.labs.symbology` | Computing session cookie, role ≥ administrator | Contract spec registry: universe, resolve/roll, per-symbol spec, telemetry |
| **Futures History** | **4012** | `ai.fattail.labs.history` | Computing session cookie, role ≥ administrator | Futures OHLC candles + contract listing (Massive-first). **This is what backs the member chart's candles** — REQ-006/007. |
| `chain_feed` / `sym_feed` / `vp-futures` / `vp-engine` / `vp-watchdog` / `ssr-live-capture` | — (no HTTP) | `ai.fattail.labs.*` | n/a | Background writers only (Massive → Redis / on-disk store). Never call these directly — they publish, they don't serve. |

**"Is there a dashboard for futures/VP?"** Yes — `http://studioone.local:5055/vp`, a dedicated page for the same `/api/vp-ops` panel (§1.3): collector liveness for ES/MES/SPY, chain_feed, engine, VP API, backfill, consumers, last autorun. It's a status view (named states, no bins), not a histogram/chart viewer — actual VP histogram data is visible only through the member-facing Options Lab chart (Arch 35) or by calling the VP Profile API directly (§2). The old unwired draft at `server/market_data/ops_dash/page.py` ("GBI ops · VP + chain (interim)") is superseded by this page and can be deleted whenever someone's next in that file.

---

## 1. StudioOne ops dashboard — `:5055`

`server/market_data/ssr_snapshot_dash.py` — a raw `http.server` handler (not FastAPI), bound `0.0.0.0` on purpose so `http://studioone.local:5055` works from the LAN/Tailscale. Port comes from `LABS_SSR_DASH_PORT` (default `5055`); host from `LABS_SSR_DASH_HOST` (default `0.0.0.0`, restricted to `{0.0.0.0, 127.0.0.1, localhost, ::}`). One process serves four HTML pages plus the JSON API below — not four dashboards (OPS-DASH.md's "no second dashboard" rule is about ports/processes, not pages).

### 1.0 Pages

| Path | Page | Notes |
|---|---|---|
| `GET /`, `/index.html` | **Home** | Summary tiles (phase, chain_feed, VP API, ES/MES/SPY state) pulled from `/api/status` + `/api/vp-ops`, plus link cards to the three pages below |
| `GET /chain`, `/chain.html` | **Chain Snapshot** | Capture tap health, day/coverage browsing, symbols table — the original dashboard content, moved off `/` |
| `GET /vp`, `/vp.html` | **Futures / VP** | Full-page render of `/api/vp-ops` (§1.3) |
| `GET /docs`, `/docs.html` | **API docs** | This file, re-read from disk and run through `python-Markdown` (`tables`, `fenced_code`, `sane_lists`) on every request — edit the `.md`, refresh the page, no redeploy |

### 1.1 Open JSON routes (no auth)

| Path | Returns |
|---|---|
| `GET /api/status` | `live_status()` — phase (weekend/RTH/etc.), data root, per-day process map |
| `GET /api/vp-ops` | See §1.3 |
| `GET /api/procs` | Process bits (`process_bits()`) |
| `GET /api/days` | List of captured days |
| `GET /api/day?day=YYYY-MM-DD` | `summarize_day()` for one day (defaults to today NY) |
| `GET /api/available?...` | `_available_from_qs()` |
| `GET /api/retrieve?...` (alias `/api/chain`) | `_retrieve_from_qs()` — pull a specific chain snapshot; `422` on bad query |

### 1.2 Archive-gated routes (Spec §6.2 — Labs archive API)

Require header `Authorization: Bearer <LABS_SSR_ARCHIVE_TOKEN>` (env var, ≥32 chars or the process refuses to configure it — `501 ARCHIVE NOT CONFIGURED` if unset). Also rate-gated (`429 ARCHIVE BUSY` + `Retry-After` under load).

| Path | Returns |
|---|---|
| `GET /api/health` | `_health_doc()` |
| `GET /api/coverage?...` | `_coverage_from_qs()` |
| `GET /api/index?...` | `_index_from_qs()` — `422` on bad query; hole-aware HTTP status (`hole_http_status`) |
| `GET /api/fetch?...` | `_fetch_from_qs()` — same hole-aware status handling |
| `GET /api/marks?...` | `_marks_from_qs()` |
| `GET /api/cadence?...` | `_cadence_from_qs()` |
| `GET /api/stats` | `_stats_from_disk()` |

**Named holes stay holes** (FTI/SSR law) — these endpoints report gaps explicitly (`hole`, `n_gaps`, `first_gap`), never interpolate.

### 1.3 The `vp-ops` panel (the `/vp` page's data source)

`GET /api/vp-ops` → `market_data.ops_dash.snapshot.build_snapshot()` (falls back to a `named_state: UNAVAILABLE` JSON blob on any exception — never a 500). Live sample shape:

```json
{
  "as_of": "...", "host": "StudioOne.local",
  "store": "/Volumes/FatTail2TB/fattail-market-data",
  "read_only": true, "never_commands": true, "no_bins": true,
  "chain_feed": {"pid": 538, "running": true, "freshness_s": 1.8, "state": "LIVE", ...},
  "collectors": {
    "SPY": {"state": "NO COVERAGE", ...},
    "ES":  {"state": "LIVE", "last_print_age_s": 0.9, "day": "2026-09-21", ...},
    "MES": {...}
  }
}
```

Rendered full-page at `/vp` (client-side fetch, `data-panel="vp-ops"`) and no longer duplicated on `/chain` — one panel, one page, one API. Read-only status (collector liveness), **not** a histogram/chart viewer.

---

## 2. VP Profile API — `:4010`

`server/market_data/vp_api/app.py`. FastAPI, `docs_url=None` (no Swagger UI — hit routes directly). **Computing consumers only — 403 for members even in dev** (see §5 for the auth gate shared by all three FastAPI services).

`SOURCE_FOR_TARGET = {"SPX": "ES", "XSP": "MES"}` — target symbols resolve to a tape source unless `source=` overrides it.

| Method | Path | Query params | Notes |
|---|---|---|---|
| GET | `/v1/health` | — | Per-source (`SPY`/`ES`/`MES`) collector liveness + coverage floor/ceiling/sessions-binned |
| GET | `/v1/profile/{target_symbol}/window` | `from_t` (ms, required), `to_t` (ms, required), `source`, `row` | **REQ-007 v2 Visible Range.** Coverage queried per contract at serve time. `404 unknown_target` if not SPX/XSP. Spec grain mismatch → named JSON error, not a 500. |
| GET | `/v1/profile/{target_symbol}/range` | `from`, `to`, `price_lo`, `price_hi`, `row`, `source` | Full-history / session-span histogram (A12). **Member chart L2 does not use this.** |
| GET | `/v1/profile/{target_symbol}/{kind}` | `kind` = `session`\|`developing`; `session_date`, `row`, `source` | `composite` and anything else → `404`. `developing` = today's live-building histogram, `503 UNAVAILABLE` if not yet built. `session` closed for RTH-today (`503` if market open and day = today). |
| GET | `/v1/ohlc/{source_symbol}/{timeframe}` | `from`, `to`, ... | Computing-side OHLC. **Member path hops the History API (`:4012`) instead when `LABS_HISTORY_API_BASE` is set** — this route is a fallback/direct-consumer path, not what the member chart uses today. |
| GET | `/v1/stream`, `/v1/stream/{source_symbol}` | — | SSE (`text/event-stream`), tails ingest for the developing edge. Closed market → holding-last. |

Envelope contract (`bins[]`, `flags.mapping`, `flags.approximation`, `status`, `mapping`) is documented in Arch 37 §"Envelope" — unchanged, verified still true against this source.

---

## 3. Symbology Registry — `:4011`

`server/symbology_app.py`. "Computing-class only (same gate as vp_api). Does not replace Labs `:4000`. No Massive on the hot path (SYM-13)." Every route is registered **twice** — bare (`/symbology/v1/...`) and `/api/`-prefixed (`/api/symbology/v1/...`) — same handler, so hit either.

| Method | Path | Query / body | Notes |
|---|---|---|---|
| GET | `/symbology/v1/health` | — | `{ok, service, strip_generation_id, house_preset_id}` |
| GET | `/symbology/v1/universe` | `roles` | `422 invalid_roles` on bad value |
| GET | `/symbology/v1/resolve` | `q`, `roles`, `preset` | `422 invalid_query` / `422 unknown_preset` / `422 named-not-built` (with a `reason` payload) |
| POST | `/symbology/v1/telemetry` | JSON body `{q, reason_code}` | `422 invalid_body` if not a JSON object |
| GET | `/symbology/v1/eligibility-report` | — | `service.eligibility_report()` |
| GET | `/symbology/v1/roll-catalog` | — | `catalog.catalog_public()` |
| GET | `/symbology/v1/spec/{symbol}` | `as_of` | Pinned contract-spec snapshot (BPV, tick_value, contract-specs URL) — this is the REQ-009 registry (DL-789) |

---

## 4. Futures History — `:4012`

`server/history_app.py`. "Futures history sidecar — SODP2 / F3. Massive-first. Fill never copied. No chain_feed / vp-api port." Same dual-prefix pattern as symbology (`/history/v1/...` and `/api/history/v1/...`).

| Method | Path | Query params | Notes |
|---|---|---|---|
| GET | `/history/v1/health` | — | `{ok, service, price_source: "massive_futures_aggs"}` |
| GET | `/history/v1/ohlc/{source}` | `tf` (default `5m`), `contract`, `bars`, `before_t` | `tf` restricted to `1m\|5m\|15m\|1h\|1d` — `422` otherwise. This is what the member chart's candles hop to via Labs `/api/app/vp/v1/ohlc/{source}`. |
| GET | `/history/v1/contracts/{source}` | — | Next 8 quarterly contract symbols from today (`quarterly_from`) |

---

## 5. Auth model (VP API, Symbology, History — identical gate)

All three FastAPI services share the same `_computing()` check:

1. Read the session cookie (name from `get_config().session_cookie`) — **not** the member `ft_session`.
2. `auth.verify_computing_session(token)` → claims. Failure or missing cookie → `401 {"error": "unauthenticated"}`.
3. Role must be `≥ administrator` (`auth.role_at_least`) → otherwise `403 {"error": "computing_consumers_only"}`.

**Members never reach these ports directly.** Labs `:4000` (`server/routes/vp_display.py`, prefix `/api/app/vp/v1/*`) mints a computing session with `auth.issue_computing_session()` and hops here over the LAN/Tailscale — see Arch 37 for the full member-facing contract. The chain-snapshot dashboard (`:5055`) is the odd one out: mostly open by design (a human ops view), with only the Spec §6.2 archive endpoints bearer-token-gated.

---

## 6. Cross-references

- [`Architecture/37-visible-range-volume-profile-api.md`](../../Architecture/37-visible-range-volume-profile-api.md) — member-hop contract (Labs `:4000` side of this)
- [`Architecture/36-studioone-data-plane.md`](../../Architecture/36-studioone-data-plane.md) — topology, machine catalog, target vs as-built
- [`Architecture/35-options-lab-volume-profile.md`](../../Architecture/35-options-lab-volume-profile.md) — member chart widget that consumes all this
- [`docs/ops/StudioOne-SSH-Reachability.md`](./StudioOne-SSH-Reachability.md) — how to re-verify anything in this doc from StudioTwo
- [`docs/ops/StudioOne-SSR-Live-Capture.md`](./StudioOne-SSR-Live-Capture.md) — the capture tap this dashboard observes

## 7. Known drift to watch for

StudioOne's `~/Fattail-Labs` checkout was 4 commits behind `origin/main` and locally dirty at verification time (uncommitted `server/sa_dev/futures_history.py`, several untracked files including the unwired `ops_dash/page.py` above). Route signatures here were read from StudioOne's **actual running source**, not from this checkout — if the two trees have since converged or diverged further, re-verify before trusting a route table over a live `curl`.
