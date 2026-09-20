# R0 / H0 inventories — 2026-09-20

**Document type:** FatTail Labs inventory (analysis only)  
**Date:** 2026-09-20  
**Status:** **Inventories only. R1 / H1 remain locked** until Coach’s marks plus Coach-approved lists.  
**Author:** Juliet-archetype (Grok Build)  
**Authority:** Coach RELEASE — R0/H0 inventories ahead of TOPO-1 mark; no execution  
**REQs:** `artifacts/reqs/REQ-004.md` · `REQ-005.md`  
**Boards:** `agents/p-refactor-sweep/` · `agents/p-hardening-pass/`  
**Plan:** `docs/Refactor-and-Hardening-Full-Agent-Bench-Plan-v1.0.md`

Nothing in this document is an execute GO. R1 and H1 stay locked. StudioTwo `chain_feed` is not a deletion packet until named SODP-MB. Vendor keys are not rotated here.

---

## Census (read-only, 2026-09-20 ~07:01 ET)

| Host | Live |
|------|------|
| **StudioOne** | `chain_feed` pid **538** RSS 71088 idle · `sym_feed` 82012 · `ssr_live_capture` 2712 · vp-api `:4010` 44322 · symbology `:4011` 42187 · history `:4012` 42185 · vp-engine 53072 · dash `:5055` |
| **StudioTwo** | Next `:3000` · Labs `:4000` · **`chain_feed` pid 99058** launchd `ai.fattail.labs.chain-feed` (SODP-MB hold) · **no `:4010`** · SSR capture plist **disabled** |

---

## R0 — refactor inventory (REQ-004)

Coach approves this list before any R1 packet. Acceptance later: behavior-preserving, tests before/after, AP-1 reverse, grep-proof.

| ID | Candidate | Location | Reason | Risk | Effort | Proposed order |
|----|-----------|----------|--------|------|--------|----------------|
| **R0-1** | Stale “L2 / custom series” + **90d** comments | `web/lib/saChartStyle.ts` L51–56, L95 | Audit 2026-09-19: overlay/`redrawVp` **gone**; comments still describe deleted path and deleted 90d lookback (DL-785) | L — comments only | S | **1** (first deletion) |
| **R0-2** | Print-store OHLC still carries **90-day SHORT HISTORY** | `server/sa_dev/service.py` `_REQ001_MIN_DAYS = 90` L238, L369–391; admin `GET /api/dev/sa/v1/ohlc/{source}` still calls `ohlc_for_source` (`sa_dev.py` L101–113). Member hop uses `:4012` when `LABS_HISTORY_API_BASE` set (`vp_display.py` L219–235) | REQ-006 **DELETED** 90d. Struck-fill `_aggs_price_fill` is gone (`test_futures_history_hygiene.py`); this is the leftover print BASE + 90d gate. SODP5 “delete whole” not done for this function | M — admin-dev candles; member path hops | M | **2** after confirming member OHLC never falls through `inprocess` |
| **R0-3** | Hardcoded nearby ES/MES tickers | `service.py` `contracts_for_source` L282–321 (`HMUZ`, `{src}U{yr}`/`Z{yr}`) | Duplicate of SYM-4 catalog month codes; invents contracts when vendor miss | M — picker/contract list | M | **3** after REQ-003 AP-1 (same picker surface) |
| **R0-4** | Duplicate symbol SoR outside registry | `symbology/service.py` `FUTURES_ROOTS`/`INDEX_ROOTS`/`STOCK_ROOTS` L23–28; `vp_api/app.py` `SOURCE_FOR_TARGET = {SPX:ES, XSP:MES}` L35; Admin `market_symbol_universe` 18-row set | REQ-004: lists surviving outside the registry. Eligibility slate showed Admin 18 ≠ picker four | H if merged wrong | M | **4** after REQ-003 AP-1; do not invent NDX/RUT here |
| **R0-5** | Frozen intake date | `symbology/service.py` `INITIAL_AS_OF = date(2026, 9, 19)` L40 | Named as test-stable, not `date.today()` — still a date constant on the live strip path | M — strip as-of | S | **5** with SYM strip write |
| **R0-6** | Retired ops-dash chrome vs live snapshot dash | `server/market_data/ops_dash/` page “RETIRED chrome”; StudioOne still listens **`:5055`** (`ssr_snapshot_dash` pid 54391) | Two dashboards; retired tree still in repo | L if only docs; M if wrong dash is the watchdog | S | **6** name the live pane, then delete retired tree |
| **R0-7** | StudioTwo `chain_feed` leftover plane | pid **99058**, plist `ai.fattail.labs.chain-feed` **enabled**; SODP-11 / DL-783 **both-sets until SODP-MB** | SODP5 body once said “process gone” — **Isolation FAIL if deleted before SODP-MB** (India SODP0) | **H — do not execute** | — | **HOLD** until named SODP-MB. Not an R1 packet now |
| **R0-8** | SYM-SWAP fixture | `artifacts/symbology/req-003-picker.json` **deleted**; CI `test_symbology_fixture_hygiene.py` + `dialog.source.test.ts` | Already grep-clean in production web. No work | — | — | **done** — keep hygiene tests |
| **R0-9** | `redrawVp` / overlay | **0 hits** in `web/` `.ts/.tsx` | Already removed (A23 W3). Only comments remain → R0-1 | — | — | **done** except comments |
| **R0-10** | `_aggs_price_fill` | **no `def`** in runtime; hygiene test forbids it | TS-1 replacement is F3 on `:4012`. Do not repair | — | — | **done**; R0-2 is the remaining cousin |

### Week’s builds left behind (same form, still not R1)

| ID | Candidate | Location | Reason | Risk | Order |
|----|-----------|----------|--------|------|-------|
| **R0-W1** | Structure leak-guard on **MiniTwo** | StudioTwo/StudioOne: 422 `BINS_LEAKED` + sessionless ceiling **live** (`agents/p-studioone-data-plane/gate-reports/structure-sessionless-2026-09-20.md`). MiniTwo Labs hop **not overlayed** (unnamed) | Same code, third consumer | M if MiniTwo still 500s the tripwire | Deploy packet **after Coach names MiniTwo** — not R1 refactor |
| **R0-W2** | Eligibility calendars stale | Admin `next_expirations_json`: QQQ/IWM/AAPL as_of August; Mon–Thu capture **SPX+XSP only** | Capture follows calendar, not Massive listing (`agents/p-symbology-registry/gate-reports/eligibility-slate-2026-09-20.md`) | H for gold tape, not a delete | Product/ops, not a refactor delete |
| **R0-W3** | REQ-007 visual HOLD | `artifacts/references/REQ-007-vrvp-reference.png` not on main (DL-788) | POC/VA blocked | — | Not R0 |
| **R0-W4** | D6 / D7 / D8 still open | `symbology/__init__.py` L5; catalog D8 named-not-built | Strip/metadata/activity rows | — | Not this sweep |
| **R0-W5** | ES/MES **model** ACTIVE blocked | VPS Q1; ~11 print sessions on 2TB (`agents/p-volume-profile-service/gate-reports/2TB-mount-2026-09-20.md`) | Do not grant ACTIVE | — | Not R0 |

**TS-1 one-strike candidates (not packets):** REQ-001 / 002 / 003 still OPEN at Coach’s screen (fill already **two** strikes, replaced). Do not third-repair the fill.

**R0 proposed execute order if/when Coach approves:** R0-1 → R0-2 → R0-6 → R0-3 → R0-4 → R0-5. **Never R0-7** until SODP-MB.

---

## H0 — hardening inventory (REQ-005)

SEV-ranked. Coach approves before H1. Structure-500 row is **disposed on this plane**, still listed for MiniTwo verify.

### Standing rows Coach named

| ID | SEV | Finding | Location / evidence | Risk | Effort | Proposed H1 order |
|----|-----|---------|---------------------|------|--------|-------------------|
| **H0-S1** | **SEV-1** | **Secrets-rotation standing practice** | DL-787: *any secret that appears in a log is rotated as a matter of course, not judgment.* PP-1 by behavior (new 200, old 401), never by value. Hop family already rotated (`agents/p-studioone-data-plane/gate-reports/DL787-rotation.md`) | Process, not a one-shot | Standing | Encode as H1 runbook + checklist; fire whenever a log leak is found |
| **H0-S2** | **SEV-1** | **Vendor-key rotation (not done)** | Same leak: SSO `LABS_SSO_SECRET_*`, SMTP, **Massive**, XAI, ActiveCampaign. DL-787: *cannot rotate without those dashboards* | Shared Massive + SSO if those values are still live | S once Coach supplies replacements | **1** — Coach supplies values; Foxtrot/Mike rotate on-box; no invented keys |

### Fail-loud / banner

| ID | SEV | Finding | Evidence | Risk | Effort | Order |
|----|-----|---------|----------|------|--------|-------|
| **H0-1** | SEV-2 | Two original silent misses: Sep-6 fill (TS-1) and empty chart. Member OHLC now names `MASSIVE EMPTY` / SHORT HISTORY (`web/components/sa/SaPriceChart.tsx` L239–259). **Print-path `ohlc_for_source` still 90d-gates** (`server/sa_dev/service.py` L369) | Generic `"No OHLC"` if hop empty and no named_state (L248) | M | M | After R0-2, generalize banner-law on every short/stale/empty route |
| **H0-2** | SEV-3 | Structure **500** | Sidecar+StudioTwo hop: **422 `BINS_LEAKED` / sessionless 200 ceiling** (PP-1 2026-09-20). **MiniTwo Labs hop unverified** | L here; M on MiniTwo | S verify | **Verify MiniTwo** when named; do not re-fix |

### Auth seams

| ID | SEV | Finding | Evidence | Risk | Effort | Order |
|----|-----|---------|----------|------|--------|-------|
| **H0-3** | SEV-2 | What authenticates a **member** request to StudioOne registry/OHLC | Member cookie **not** forwarded. Labs mints `issue_computing_session()` (`server/routes/vp_display.py` L36–40); sidecar `verify_computing_session` (`server/market_data/vp_api/app.py` `_computing`). Cookie name = session cookie, **secret = `LABS_COMPUTING_SECRET`**. After DL-787, Labs `issue_session` ≠ sidecar (tests had to mint computing cookies) | H if a host still shares the old hop secret | M | Document + fail-loud 401 matrix; no member JWT on StudioOne |
| **H0-4** | SEV-2 | Dev-login identity gap | `/api/auth/dev-login` → `identity_id=0`; no `identities` row (DL + Arch 05). Member hops with iid=0 worked for structure PP-1; Trade Log / inbox do not | M in `LABS_ENV=dev` only | S | Named 400 on member product routes; keep admin-dev |

### Known faults / cadence

| ID | SEV | Finding | Evidence | Risk | Effort | Order |
|----|-----|---------|----------|------|--------|-------|
| **H0-5** | SEV-2 | STALE artifact **re-verify not scheduled** | Registry `row_state_from_artifact` (`server/symbology/service.py`); no launchd/tick. Chart LIVE/STALE is heartbeat age (`web/lib/saLive.ts` 3s), different clock | M — COMING/STALE can lie | M | Named cadence job after REQ-003 AP-1 |
| **H0-6** | SEV-2 | CP-1 **freshness watchdog + alert** | Dash `:5055` shows chain_feed; **no alert** when idle during RTH or log stops. Weekend idle is lawful | H if RTH silent | M | Watchdog = process + last-write + “idle during RTH”; page Foxtrot |
| **H0-7** | SEV-1 | **Combined Massive budget not a counter** | Live writers: StudioOne `chain_feed` 2s + `sym_feed` 5s + `history_app` (burst) + `vp-engine`/`vp-futures`; **plus StudioTwo `chain_feed` 99058**. Spec §12 both-sets (DL-783). No single budget object | H — rate-limit vs CP-1 | L | SODP1-style census as a **live** budget; do not add writers |

### Ops / CVE / restore

| ID | SEV | Finding | Evidence | Risk | Effort | Order |
|----|-----|---------|----------|------|--------|-------|
| **H0-8** | SEV-2 | Restart-on-crash | Sidecars `KeepAlive` (vp-api, history, symbology, vp-engine). chain_feed launchd enabled both hosts. Not proven by a kill-and-watch drill | M | S | One kill drill per agent, CP-1 |
| **H0-9** | SEV-1 | Backup / off-site / **restore drill never performed** | Gold volume `/Volumes/FatTail2TB` mounted (`agents/p-volume-profile-service/gate-reports/2TB-mount-2026-09-20.md`). On-box leftover `~/fattail-market-data/vp/futures_history`. **No off-site replica. No restore drill.** Sept-14 volumes/archive assessment folds here (REQ-005) — **no dated restore evidence found** | H — one disk | L | Name replica host + one restore drill as H1 acceptance |
| **H0-10** | SEV-2 | CVE pass | `web` `npm audit --omit=dev`: **1 critical, 3 high** — Next.js (Turbopack middleware bypass + App Router DoS), nanoid, postcss, sharp/libvips. **pip-audit not installed** on server venv | Prod Next is `npm start` (not turbopack) — still inventory | M | Pin/upgrade after R1; install pip-audit for the Python tree |
| **H0-11** | SEV-3 | Eligibility calendar starvation | Same as R0-W2: capture skipped SPY/QQQ Mon–Thu | H for gold snaps | M | Refresh `next_expirations_json` from Massive (CP-1, post-close) — **H1 only after Coach picks the slate** |
| **H0-12** | SEV-3 | WG-1 timer **not armed** | `agents/bench/groundskeeping.json` `armed: false`, `last_completed_cycle: null` (DL-782) | Process | S | Arm after priority board clear; this inventory is **not** a WG-1 cycle |

**H0 proposed H1 order if/when Coach approves:** H0-S2 (vendor keys, Coach supplies) → H0-S1 runbook → H0-7 Massive budget census → H0-9 backup/restore → H0-6 chain_feed alert → H0-10 CVE → H0-3/4 auth → H0-1 banner-law → H0-5 STALE cadence → H0-2 MiniTwo structure verify → H0-11 calendars (after eligibility pick). **H0-12 arm WG-1 last.**

---

## Still locked

R1, H1, groundskeeping fire, StudioTwo `chain_feed` deletion, MiniTwo overlay, vendor rotation without dashboard values. Priority board (REQ-001 / 002 / 003, F3/TOPO-1 AP-1, eligibility pick) is unchanged.

Effort key: **S** &lt; 0.5 day · **M** 0.5–2 days · **L** 2+ days. Risk: L/M/H for R1 behavior-preservation / H1 production impact.
