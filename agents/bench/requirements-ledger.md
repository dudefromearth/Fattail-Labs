# Requirements Ledger (RL-1)

Canonical capture of Coach requirements. Wording preserved. Close only by **AP-1** (Coach acceptance) or explicit withdraw. Hashable FINAL texts: `artifacts/reqs/REQ-001.md` · `REQ-002.md` · `REQ-003.md` · `REQ-004.md` · `REQ-005.md` · `REQ-006.md` · `REQ-007.md` · `REQ-009.md`.

Status: `OPEN` · `AP-1` · `WITHDRAWN`  
**WG-1 last cycle:** never (not armed — TOPO-1 backlog). Canonical `agents/bench/groundskeeping.json`.

## Open

| ID | Captured | Track | Status | Coach wording |
|----|----------|-------|--------|-----------------|
| **REQ-001** | 2026-09-19 | VP | OPEN | See full row below. |
| **REQ-002** | 2026-09-19 | VP settings | OPEN | See full row below. |
| **REQ-003** | 2026-09-19 | VP contracts | OPEN | See full row below. |
| **REQ-004** | 2026-09-19 | Refactor sweep | OPEN · **HOLD** | After TOPO-1 AP-1. See row below. |
| **REQ-005** | 2026-09-19 | Hardening pass | OPEN · **HOLD** | After REQ-004. See row below. |
| **REQ-006** | 2026-09-19 | Chart lookback | OPEN | N bars per interval; TV pan-page. See row below. |
| **REQ-007** | 2026-09-20 | Visible Range VP | OPEN | Server bins; VR default. See `artifacts/reqs/REQ-007.md`. |
| **REQ-009** | 2026-09-20 | Contract specs | OPEN · **BUILD** v0.2 | Registry is the instrument fact SoR. Spec v0.2 BUILD AUTHORITY (`sha1 33675b0b…`). `:4011` overlay + loader **folded into futures deploy GO** (DL-790). AP-1 Coach. See `artifacts/reqs/REQ-009.md`. |
| **REQ-010** | 2026-09-28 | OPF full book | OPEN · **BUILD** v0.3 | Ceiling 2,500 / 10 pages. SPX 2026-09-30 must be captured whole. See row below. |
| **REQ-011** | 2026-09-28 | OPF full book W4 | OPEN | Before any fullbook launchd load, the mexp2 tree at the W1-G commit. See row below. |
| **REQ-012** | 2026-09-28 | Runner 500s | OPEN | Diagnose Runner internal server errors. P1 P2 P3 P5 approved. P4 approved, last. P5 after Tuesday 2026-09-29 close, one API restart. See row below. |
| **REQ-013** | 2026-09-28 | Runner live ladder | OPEN · **ACCEPTED** | Plan v1.0 accepted. Reach path `:5055`. W0 dispatched. Canary is Coach plus one admin; ids later; no member ids. See row below. |
| **REQ-014** | 2026-09-29 | Member market path | OPEN · **ACCEPTED** | Plan v1.0 accepted. Q1 `:4012`. Q2 one cut per phase. Q3 today's keys, no new `stale`. W0 dispatched. Canary is Coach plus one admin; id strings not yet on file. See row below. |

### REQ-001 — ≥ 90 days of price on the chart (VP confirmation blocker)

**Captured:** 2026-09-19 (this session).  
**Track:** Volume Profile. **Priority: now.** Nothing else advances on the VP track first.

**Coach wording (addendum, 2026-09-19):**

> REQ-001 is not an enhancement. Without >= 90 days of price on the chart, Coach cannot validate the volume profile against known price structure — the VP product itself is UNCONFIRMED until this lands. Priority: now. Nothing else advances on the VP track first.
>
> Add one step after acceptance: Coach performs the visual cross-check — profile nodes and gaps against 3 months of price he knows. HIS confirmation, not the screenshot, is what marks the VP instrument CONFIRMED on the board. The screenshot only closes the range requirement.

**Prior statements (RL-1 process defect — stated ≥5 times without a row):** Data Delivery v1.0 D1 / T1 “≥ 3 months”; REQ-001 addendum; this packet “LONG OVERDUE”. Filed as REQ-001. Does not close conversationally.

**Acceptance split:**
1. **Range requirement** — screenshot of ≥ 90 days of price on the chart closes REQ-001's *range* half.
2. **Instrument CONFIRMED** — only Coach's visual cross-check (nodes/gaps vs 3 months of price he knows). Not the screenshot.

**Closes:** AP-1 or Coach withdraw. Not closed.

### REQ-002 v2 — TV-model settings dialog (hierarchical, context, light)

**Captured:** 2026-09-19. Addendum same day: hierarchical combined dialog; context right-click; light theme; our settings only.

**Coach wording (RL-1):**

> the same layout, the same control elements and components, the same sizes, everything the same as TV.
>
> current settings standards are "inadequate"; he wants "the exact model that TV uses."
>
> Light theme for the dialog: white background, black text.

**Visual contract:** `artifacts/references/REQ-002-settings-dialog-reference.png`  
**Git blob:** `bf9fa21ac600cfe0432f2651dcee9080d55258f4`  
**Spec:** `Specs/REQ-002-TV-Settings-Dialog-Fidelity-Spec-v2.md`  
**Measurement:** `artifacts/references/REQ-002-measurement-spec.md`  
**Inventory:** `agents/p-vp-chart-primitive/gate-reports/REQ-002-inventory.md`

Our option set only — do not clone TV fields we do not have. VP chart is first wire.

**Acceptance — AP-1 / PP-1:** headed screenshots on studiotwo:3000 member route — (a) dialog open, white/black, sidebar; (b) two right-click targets → two sections. Closure: Coach's own browser, his right-click. **OPEN until then.**

**Closes:** AP-1 or Coach withdraw. Not closed.

### REQ-003 FINAL — Symbol picker: TV pattern, role-aware registry, gray law

**Captured:** 2026-09-19. **Supersedes** REQ-003 v1–v4 and the addendum; this is the only build text.

**Coach wording (RL-1):**

> same method as TV for selection... unsupported unavailable or grayed out
>
> universe "about 20 or so" bound by ">= 3 expirations per week" because "we are focused on 1-5 DTE"
>
> futures supported "for other purposes"
>
> goal: "maximize the way we display available symbols."

**Visual contract:** `artifacts/references/REQ-003-symbol-search-reference.png` on **main**. Not on main → **do not dispatch, ask Coach.** Do not substitute another screenshot.

**Law (summary):** TV-fidelity picker; All/Futures/Stocks/Indices chips; full universe visible at rest; ES family expandable (ES1!/ES2! + strip contracts); dialect ES1! /ES @ES / ESZ6; interim 1! opens front labeled “opens front contract · continuous coming”; registry-driven roles **options** (SPX, XSP; ≥3 expirations/week) vs **price-structure** (ES, MES); gray real-but-unsupported with reason; eligibility report before adding ~20 options rows.

**Acceptance — AP-1 / PP-1:** headed studiotwo:3000 artifacts (a)–(e) per the FINAL packet. Closure: Coach's own browser, his clicks. REQ-003 in every status report until closed.

**Dispatch:** PNG on `origin/main` blob `f09d78735399a7d4fe78d13ee5fe21e3c4707ab6`. SYM3-G PASS (surface). SYM-SWAP-G PASS. **REQ-003 stays OPEN.**

**F1 amendment (2026-09-19, Coach-ruled):** replaces F1 clauses **2–3** only. Filed `artifacts/reqs/REQ-003-F1.md`.

> "full search" (tickers AND names both matched, substrings highlighted)
>
> "the current active and the forward contract are on top."

Typing "es" → ES family on top, front first, forward second, highlights visible. Clauses 1, 4–6 stand as issued.

**Closes:** AP-1 or Coach withdraw. Not closed.

### REQ-004 — Refactor sweep (after TOPO-1)

**Captured:** 2026-09-19. **HOLD** until TOPO-1 AP-1. R0 inventory then Coach-approved list; no R1 before that list.

**Coach wording:** TOPO-1 AP-1 → REFACTOR → HARDEN. R0: dead code, orphaned routes, fill remnants, fixture leftovers, overlay/redrawVp, L2/custom-series comments, duplicate symbol lists, hardcodes, TS-1 one-strike candidates, SYM-SWAP/migration seams. Triaged packets + effort — Coach approves before execute. R1: behavior-preserving; tests before/after; AP-1 in reverse; grep-proofs; line counts (DL-766 health, not a gate).

**Priority:** Open REQs, F3, TOPO-1, eligibility report stay first. This program starts only when that board is clear.

**Closes:** AP-1 (reverse) or withdraw. Not closed. Filed `artifacts/reqs/REQ-004.md`.

### REQ-005 — Hardening pass (after REFACTOR)

**Captured:** 2026-09-19. **HOLD** until REQ-004 closes.

**Coach wording:** H0 minimum: fail-loud/banner-law; auth seams (computed headers — what authenticates a member); dev-login gap; structure 500; STALE re-verify cadence; CP-1 watchdog + combined Massive budget; secrets/.env; restart-on-crash; backup/off-site + Sept-14 volumes/archive + one restore drill; CVE pass. SEV-ranked packets — Coach approves. H1: PP-1; StudioOne = CP-1 full dress; member-facing close AP-1.

**Closes:** AP-1 per member-facing seed or withdraw. Not closed. Filed `artifacts/reqs/REQ-005.md`.

### REQ-006 — Lookback is a fixed bar count per interval (v2)

**Captured:** 2026-09-19. **GO.** Supersedes calendar 90-day window (**deleted**, not retired).

**Coach wording:** "There should be a fixed number of intervals or candles we can go back, so it will be different for the different time chart intervals." · "Do away with the 90 day current model." · "It is intuitive, where ToS forces you to learn how it works."

N=5000 initial + 5000-bar pages. Cap at contract birth = COMPLETE. SHORT HISTORY only if shorter than N **and** more exists. Payload: bars_served, bars_rule, at_contract_birth. ToS aggregation pairs rejected for lookback (SYM-4.0 keeps ToS continuity).

**Closes:** AP-1 pan ES+MES every interval, pages to first-traded (Sep 2025 Z6). Filed `artifacts/reqs/REQ-006.md`.

### REQ-010 — Full SPX and XSP book, ceiling 2,500

**Captured:** 2026-09-28. **BUILD.** Spec v0.3. Plan v1.1 accepted with this amendment, recorded as plan v1.2.

**Coach wording:**

> The 750-contract ceiling is raised so every listed book is captured whole. New ceiling 2,500 contracts / 10 pages; a book past THAT fails loud. Rationale: SPX 2026-09-30 is 1,198 contracts and costs 1.14 s on a 15-second cadence; refusing it contradicts the ask. W1's ceiling test uses that book as the one that must SUCCEED, and a synthetic book over 2,500 as the one that fails.
>
> Storage planning figure: the last_updated-gated write, ~5.7 GB per session both names, as the plan already builds. The 12.8 GB figure is the bound, not the plan.
>
> Plan v1.1 accepted with that amendment. Dispatch W1 after India's W0-G and after the close.

**Closes:** W7 AP-1 (Wednesday screen on the existing expiry control) or Coach withdraw. Not closed.

### REQ-011 — W4 names the tree before the fullbook launchd load

**Captured:** 2026-09-28. **OPEN.** Plan v1.3. Spec v0.3 unchanged.

**Coach wording:**

> Add to Foxtrot's W4 gate, before any parallel launchd load: ssr_fullbook.py and its tests are present in ~/Fattail-Labs-mexp2 on StudioOne at the commit W1-G reviewed, the tests pass there in that tree's venv, and the fullbook_capture plist's script and working directory name that tree. Two trees is how Friday nearly lost a session; W4-G states which tree runs Tuesday's capture.

**Closes:** Coach AP-1 on W4-G's tree statement, or Coach withdraw. Not closed. W4 is not opened by filing this row.

### REQ-012 — Runner internal server errors

**Captured:** 2026-09-28. **OPEN.** Diagnostic only. Production was not changed.

**Coach wording:** Coach and members have had internal server errors viewing the Runner app (Options Lab) over the past few days. Find the cause. Inventory every 500. Correlate deploys, the Sep 25 collector change, Monday's slow session, the OPF API, and host sockets. Reproduce one 500 on StudioTwo if it can be done without load on production. Report, then a GO / NO-GO on a hotfix. The hotfix is its own packet on Coach's acceptance, after the close.

**Disposition:** `docs/Runner-500-Diagnostic-v0_1.md` (hotfix was **NO-GO** the night it was written) and `docs/Runner-Performance-Audit-v0_1.md`. Coach on 2026-09-28, recorded as DL-802: P1, P2, P3, and P5 approved. P5 after Tuesday 2026-09-29 close, one restart of `ai.fattail.labs.api`, evidence as the audit. P4 approved and scheduled last. It changes fill order. The 500 and the 502 are unchanged by it. None of the five packets has been started. Not closed. The structural ladder spec is REQ-013, not a rewrite of this row.

### REQ-013 — Runner live ladder from the StudioOne data plane

**Captured:** 2026-09-28. **OPEN. ACCEPTED.** Plan v1.0 accepted (DL-803). Nothing built. Production was not restarted. W0 dispatched. W1 has not started.

**Coach wording:**

> Nothing else in Runner changes. No control, screen, selector, or default. Spec, for the bench to plan: production Runner's live ladder is served from the data plane on StudioOne, not from Massive inside the Labs API process on MiniTwo. State the design that already exists (LABS_MARKET_BUS / Redis ladders), what reaching it from MiniTwo requires under TOPO-1 (the bus, or a ladder route on the OPF API — the bench decides which and says why), and what the handler does when the bus has no fresh ladder (a stale-but-marked ladder, never a 60-second Massive wait on the request thread). The response JSON to the browser does not change. Wings cap stays at 50 until Coach rules otherwise. Parallel-run discipline: a canary member set or a staging host first, measured with P2's duration log, then production after a close. No Massive call remains on the Runner request path when this ships. Plan first; nothing built until Coach accepts.

**Disposition:** Spec `docs/Runner-Live-Ladder-Data-Plane-v0_1.md` unchanged. Plan v1.0 accepted and frozen. Plan v1.1 records the acceptance rulings: `:5055` confirmed, Tuesday's one API restart is P5 + P1 + P2 with no data-plane code, and the W3 canary is Coach's own identity plus one administrator identity. Coach names both ids before that close. No member identity is on the list. Inventory GO remains the Runner ladder only. W0 is dispatched. This row stays open.

**Closes:** Coach AP-1 on the production cut (spec §8: no Massive call on the Runner request path, one regular-hours hour of P2 durations inside the hop), or Coach withdraw. Not closed. Accepting the plan started W0. It does not close this row.

### REQ-014 — Member market path on the StudioOne data plane

**Captured:** 2026-09-29. **OPEN. ACCEPTED.** Plan v1.0 accepted (DL-805). Nothing built. Production was not restarted. W0 dispatched. Phase 2 has not started. Phase 1 is REQ-013 and is not this row.

**Coach wording:**

> Spec for the bench. Write it to docs/Labs-Member-Market-Path-Data-Plane-v0_1.md, commit, and plan it — the Runner ladder plan v1.1 is Phase 1 of this and is not re-planned. Show me the plan before any packet beyond Phase 1 runs. CP-1 on every StudioOne packet. No Labs control, screen, selector, or default changes anywhere in this program.

The spec text he supplied is the file. It is not restated here.

**Disposition:** Spec `docs/Labs-Member-Market-Path-Data-Plane-v0_1.md` unchanged. Plan v1.0 accepted and frozen. Plan v1.1 records the rulings: Q1 `:4012` as drawn (`GET /history/v1/store-bars`, `LABS_HISTORY_READ_TOKEN`); Q2 one production cut per phase; Q3 session-status keeps today's keys, no `stale` field added, §2 governs over row 2, wording error noted at W0 and corrected in spec v0.2 only when a later version is cut for another reason. Canary composition is Coach's identity and one administrator for every phase. The acceptance left both id values unfilled, so no id string is on file. W0 is dispatched. This row stays open. REQ-010, REQ-011, REQ-012, and REQ-013 stay open.

**Closes:** Coach AP-1 on the program ship bar (spec §4: one regular-hours session after the last cut), or Coach withdraw. Not closed. Accepting the plan started W0. It does not close this row.

## Closed

_(none)_
