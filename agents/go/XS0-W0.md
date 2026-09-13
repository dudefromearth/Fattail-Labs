# GO token — Options Lab XSP / SPY Scale W0

**ID:** `XS0-W0`  
**Program:** Options Lab XSP / SPY Scale  
**Plan:** [`docs/Options-Lab-XSP-SPY-Scale-Full-Agent-Bench-Plan-v1.3.md`](../../docs/Options-Lab-XSP-SPY-Scale-Full-Agent-Bench-Plan-v1.3.md) **v1.3**  
**Board:** `agents/p-options-lab-xsp-spy-scale/`  
**DL:** **DL-700** (this stamp + AGENTS.md third-tree reassignment)

**Status:** **XS0-0 STAMPED GO** — 2026-09-13. Coach: *“let’s execute plan 1.3”*. Dispositions ticked as the plan’s silent-at-GO defaults (Coach did not name an alternative).

**DL-328:** Delta gates XS0 by **this file**. Chat is not a stamp. Gate name is **XS0-G**.

---

## Preconditions (file must name these)

| Check | Value |
|-------|--------|
| Plan revision | **v1.3** — not v1.0, v1.1, or v1.2 |
| Plan sha1 (whole file, at stamp) | `6959b93629991a3c47481b8c6dc230850d6c3158` |
| WIDTH-1 prerequisite | `a27f187` · **DL-699** · mig 152 — **done**. Not in this GO’s implementation |
| Seed files on disk | `agents/p-options-lab-xsp-spy-scale/seeds/XS0-1` … `XS0-9` — **required before stamp** (S10) |
| Spec version bump | **None** unless OD-XS5 Override names one. Silent: DL + changelog row |
| Advanced Fly Wave-1 | **Closed** — do not reopen `p-options-lab-heatmap` AF0–AF-Z. Do not implement AF-X |
| Width Fit WF1–WF5 | **Closed** · **DL-526**. Do not reopen. Historical WIDTH-1 shots stay on that board |
| L3 Width picker | **LOCKED** (AT-DLG-22). Not an OD. **No OD-XS3** |
| `AnalyzerPositionsList.tsx` | **Frozen** |
| `fetch_step_floor` | **Frozen** (XSP 5.0 / SPY 2.5) |
| `defaultWidth` | **Frozen** (WIDTH-1 Keep) |
| MiniTwo | **No.** Coach MacBook dev only. Do not stop `:3000` / `:4000` |
| **NX18 / FI-049** | This GO does **not** entitle IKI Labs, `observer-light`, or Factory catalog. **A passing XS gate is not progress on the bigger goal.** Runner = existing Template Runner (`web/lib/runner/`), not a coined name |
| Active-program line (`AGENTS.md`) | Resolved at XS0-0 / PR 1 by **reassignment DL-700** (OD-XS0 (a) · QFRIC B1 pattern). Three-OK log unused |
| L14 | Scoped DL-435 reverse lands in **PR 3** only if OD-XS1 (a). Not this PR |

---

## OD-XS0, XS1, XS2, XS4–XS11 (stamp Accept or Override)

**No OD-XS3** — Width picker is L3 LOCKED.

| ID | Juliet recommendation | Coach |
|----|----------------------|-------|
| **OD-XS0** | Reassignment DL naming this board alongside LIM/QFRIC. Lands in **PR 1 / XS0-0**, before any product edit. Three-OK log unused | [x] **Accept** — **DL-700** · [ ] Override (three OKs) · [ ] BLOCKED |
| **OD-XS1** | **(a)** overlay `fly_widths` 1–7 + new DL reversing DL-435 **for XSP/SPY only** (DL in **PR 3**). (b) keep DL-435 10…50 on heatmap forever | [x] **(a)** · [ ] (b) |
| **OD-XS2** | **(a)** listed-only (honest 20 when 1 unlisted; Tango copy). (b) arithmetic 1-wide. (c) denser fetch / `fetch_step_floor` (NX2). (d) off-hours exception only | [x] **(a)** · [ ] (b) · [ ] (c) · [ ] (d) |
| **OD-XS4** | **New** `p-options-lab-xsp-spy-scale`. WF board is **closed** | [x] **New board** · [ ] extend WF |
| **OD-XS5** | **No version bump.** DL amends AF §3.2 for XSP/SPY + India changelog row, no version header change | [x] **DL + changelog, no bump** · [ ] Override (named bump): ________ |
| **OD-XS6** | **Hold** `a27f187` local until XS1+XS2 are reviewable together | [x] **Hold** · [ ] push as PR 0 |
| **OD-XS7** | **XSP only.** `defaultDiagonalWidth` 15 → 1; `axisSpot` XSP 6000 → ~spot-class. SPY diagonal already 5 — out. SPX `axisSpot` deferred (A3) | [x] **XSP only** · [ ] expand |
| **OD-XS8** | **Same resolver** as Advanced Fly for vertical / bw-fly heatmap columns | [x] **Same resolver** · [ ] Override |
| **OD-XS9** | **(a)** Butterfly-only this packet; leave `productWingHint("XSP")` at 20. (b) hint → 1 for all `wingWidth: w` templates | [x] **(a)** butterfly-only · [ ] (b) |
| **OD-XS10** | **(a)** Pass the resolved list as optional `ChainContext.columnWidths`. No `profile` on `ChainContext`. Fail loud if XSP/SPY list missing. (b) one `{ symbol, profile }` call site. (c) descope both panel and runner | [x] **(a)** `columnWidths` · [ ] (b) · [ ] (c) |
| **OD-XS11** | **(a)** Keep `OFFLINE_FALLBACK_WIDTHS` as written. (b) return `[]` for every non-universe profile | [x] **(a)** keep fallback · [ ] (b) fail loud |

## Juliet recs JR1–8 (dispose)

| ID | Rec | Coach |
|----|-----|-------|
| **JR1** | Do not call `flyWidthsFromProfile` for all symbols (would change SPX heatmap 10…50 → 20…50) | [x] Accept |
| **JR2** | Do not change NDX/QQQ/IWM/AAPL/RUT/SPX butterfly recipes (today 20). Butterfly uses `butterflyWingWidth`, **never** `productWingHint` | [x] Accept |
| **JR3** | Do not migrate localStorage user presets | [x] Accept |
| **JR4** | Fold `web/e2e/width1-xsp-spy.spec.ts` into XS4; re-home `OUT` to this board’s `gate-reports/xs4/`; assert SPY **prefer=1** and **listed snap honesty**, not a hard `width===1` if the chain is sparse | [x] Accept |
| **JR5** | Hotel owns listed-vs-arithmetic; Sheldon is **not** seated. Hotel also seats **OD-XS9** | [x] Accept |
| **JR6** | OD-XS9 (a): do **not** change `productWingHint("XSP")` this packet. SPY hint stays 5. Do not “fix” SPY vertical 5 → 1 | [x] Accept |
| **JR7** | Provenance gate: accept overlay only when `source === "market_symbol_universe"` **and** `fly_width_mode === "fixed_points"` **and** `fly_widths` is a non-empty finite list. Kind-default → `XSP_SPY_FLY_WIDTHS`. Universe + empty list → **fail loud**. Do **not** clamp `max ≤ 7` | [x] Accept |
| **JR8** | Lima flags **XS-ETF** (QQQ / IWM $1-strike heatmap still 10…50) in `Architecture/flagged-ideas.md` at XS0-9. Not this board’s implementation | [x] Accept |

**OD-XS0 three-OK log:** **N/A** — superseded by reassignment (**DL-700**), not satisfied.

| # | Date | Coach OK |
|---|------|----------|
| 1 | — | [ ] unused; OD-XS0 is the reassignment DL |
| 2 | — | [ ] |
| 3 | — | [ ] |

---

## L* at this stamp

L0–L14 **LOCKED** as written in plan v1.3 §3 with the dispositions above. L3 (Width picker) and L10 (`AnalyzerPositionsList`) were already standing locks.

---

## Allowed `PositionBuilder` / `OpfRiskAnalyzer` functions (later PRs)

This GO names the **only** allowed product functions. This PR contains **no product code**.

- `handleTemplate` Lab branch (recipe width only)
- `defaultDiagonalWidth` — **XSP 15 → 1 only** (OD-XS7 Accept); do not touch SPY
- `axisSpot` fallback — **XSP 6000 → ~spot-class** (OD-XS7 Accept); do not add a SPY special case; do not “fix” the SPX arm (A3 deferred)

**Forbidden in every XS PR:** `defaultWidth` · dialog chrome · Tos padlock · `AnalyzerPositionsList.tsx` · `fetch_step_floor` · `HEATMAP_FLY_WIDTHS` mutation · `useOptionChainBus.ts`.

If the Dialog board GO is still open, **sequence XS1 behind that board’s current packet**. Do not race `handleTemplate`.

---

## A1 `profileLine` wording (Echo + Tango confirm at XS2)

GO-named **defaults** (not a copy decision until XS2-3 / XS2-4):

| State | Renders |
|-------|---------|
| Universe overlay | `· universe` |
| Kind-default / offline | `· kind default` |
| Other | `· unknown` |
| Empty column list | `widths — (no column list)` — never `undefined` |

Echo XS2-3 and Tango XS2-4 confirm. No new element, no layout change.

---

## Isolation

LIM, QFRIC, AF-X, WF math, Dialog Width picker: **out**. New board path + seed prefix `XS0-`. No seeds on sibling boards.

---

## Coach stamp

Stamp **one**:

- [x] **GO** — fire XS1 and XS2 as siblings after this stamp  
- [ ] **Amend** — reason below; board stays DRAFT  
- [ ] **Stop**

**Signed:** Coach  
**Date:** 2026-09-13  

Coach: *“let’s execute plan 1.3”* (2026-09-13). Silent-at-GO OD defaults apply.

Delta does **not** treat chat “go” as this stamp — **this file is the stamp.**
