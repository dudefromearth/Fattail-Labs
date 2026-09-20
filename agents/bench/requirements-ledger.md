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
| **REQ-009** | 2026-09-20 | Contract specs | OPEN · **BUILD** v0.2 | Registry is the instrument fact SoR. Spec v0.2 BUILD AUTHORITY (`sha1 33675b0b…`). AP-1 Coach. See `artifacts/reqs/REQ-009.md`. |

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

## Closed

_(none)_
