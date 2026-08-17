# W2 characterization list — OT-EF · Session/Print · Two Clocks

**Author:** Delta (seed W2-1)  
**Status:** **CONTRACT** for W4–W7 implementers and **W8** (Kilo matrix). Not a gate verdict.  
**Date:** 2026-08-16  
**Law:** OT-EF Doctrine v1.1 §10 #4 · §11 · Session/Print Spec v0.1 §9 AT-SESS-1…7 · SL-GD39–41  
**Plan:** [`docs/OT-EF-Session-Print-and-Two-Clocks-Full-Agent-Bench-Plan-v1.0.md`](../../docs/OT-EF-Session-Print-and-Two-Clocks-Full-Agent-Bench-Plan-v1.0.md) §6 W2  

This file is the pasteable W8 contract. **No tests were added. No product code was changed.**

---

## 0. How W8 uses this list

Every row is a fact later code must satisfy. At W8 each row is a **test**, an **explicit handoff**, or an **NX**. A row is not green because “it should work.”

| Rule | Meaning |
|------|---------|
| Prefer | Bind + display-state characterization (`optionBind`, `cardDisplayState`, `analyzerBook.pointer`, `otEfDoctrine.proof`, `builderAtomicState`) |
| Severity **high** | Inventing strikes, a silent false package price, or a **live** claim in the Held/residual window |
| `Blocked on` | `W4` = needs `opf_session` on the feed · `W5` = needs client consume · `none` = as-built home can prove it now |
| **Never** | Block a row on **W3-0**. WHETHER is already BUILD (DL-397). W3-0 is historical. |
| Do not revive | Merge-all-visible into one custom OPF strategy (**CL-7** · plan NX9) |
| Do not confuse | τ / OPF29 ≠ EXPIRED midnight ET (**CL-25** · plan NX12) |

Envelope **field names** may change in W3 HOW review. The **facts** (market · printing · live vs last print · as_of) stay.

---

## 1. Rows (CL-1…CL-25)

Minimum plan table is CL-1…CL-17. CL-18…CL-25 close uncovered §11 litmus items, AT-SESS-1, two-clock identity, named `none`, and Hotel lift-honesty. Coach facts are not dropped.

### CL-1

| Field | Value |
|-------|--------|
| **ID** | CL-1 |
| **Fact** | Same-day expiration is not EXPIRED at 16:00Z, at cash close, or at UTC midnight — EXPIRED is the next midnight America/New_York after the exp calendar date. |
| **Suggested test home** | `web/lib/options-lab/analyzerBook.pointer.test.ts` (`isOptionPointerExpired`) · `web/lib/options-lab/cardDisplayState.test.ts` |
| **Litmus / AT map** | OT-EF §11 #4 (precondition: still current through exp day) · Law C · DL-393 |
| **Blocked on** | none |
| **W8 note** | Existing pointer tests already lock 23:59 ET current, UTC midnight still Eastern evening, 00:00 ET next day expired. Do not let a cash-bell or 16:00Z fixture expire the card. |

### CL-2

| Field | Value |
|-------|--------|
| **ID** | CL-2 |
| **Fact** | After 00:00:00 America/New_York on the calendar day following expiration, a still-shown card is EXPIRED and the viewport draws the ghost residual. |
| **Suggested test home** | `web/lib/options-lab/analyzerBook.pointer.test.ts` · `web/lib/options-lab/cardDisplayState.test.ts` (`resolveCardDisplayState`, `resolveViewportFocusPolicy`, `expiredGhostSeries`) |
| **Litmus / AT map** | OT-EF §11 #5 |
| **Blocked on** | none |

### CL-3

| Field | Value |
|-------|--------|
| **ID** | CL-3 |
| **Fact** | After the OPF settlement instant (τ / OPF29) and before midnight ET the card is Held/residual and must never claim live. |
| **Suggested test home** | `web/lib/options-lab/cardDisplayState.test.ts` (`resolveCardDisplayState`) · `web/lib/options-lab/optionBind.test.ts` (`assessPositionBind`) · `web/lib/options-lab/otEfDoctrine.proof.test.ts` |
| **Litmus / AT map** | OT-EF §11 #4 · Law C · OT-EF A6 |
| **Blocked on** | none |
| **W8 note** | **As-built gap:** display currently uses `sessionHeld` (market closed) as a proxy, not τ. W8 must fixture `now` after τ on exp day D (PM default 16:00 ET) and before D+1 00:00 ET and assert chip/kind is held/residual, **not** `live`. Bind must not fail as `expired` in this window (`expired` is the other clock). Do not treat cash close as EXPIRED (that is CL-1). |

### CL-4

| Field | Value |
|-------|--------|
| **ID** | CL-4 |
| **Fact** | An EXPIRED ghost keeps the sign-honest defined debit (`definedDebitPerShare` / `definedDebitSigned`) and must not zero it or substitute a leftover entry-price. |
| **Suggested test home** | `web/lib/options-lab/cardDisplayState.test.ts` (`definedDebitSigned`, `expiredGhostSeries`) · `web/lib/options-lab/optionBind.test.ts` (expired bind keeps debit) · `web/lib/options-lab/analyzerBook.ts` |
| **Litmus / AT map** | OT-EF §11 #5 · Law B2 |
| **Blocked on** | none |

### CL-5

| Field | Value |
|-------|--------|
| **ID** | CL-5 |
| **Fact** | Show is an independent checkbox: two shown cards stay shown, and unchecking one does not radio-clear the other. |
| **Suggested test home** | `web/lib/options-lab/cardDisplayState.test.ts` (`resolveViewportBookPolicy`, `visibleBookTrade` — “hide is not a radio”) · `web/components/options-lab/AnalyzerPositionsList.tsx` (native checkbox; chrome only after W1 labels) |
| **Litmus / AT map** | OT-EF §11 #6 · DL-394 · PB-VIEW-4 retired / PB-VIEW-4a |
| **Blocked on** | none |

### CL-6

| Field | Value |
|-------|--------|
| **ID** | CL-6 |
| **Fact** | Two or more shown representable cards draw one continuous additive book curve — independent OPF resolve per card plus `sumAlignedPnL`, not a replacement curve. |
| **Suggested test home** | `web/lib/options-lab/opfPricingApi.test.ts` (`sumAlignedPnL`, `interpolatePnl`) · `web/lib/options-lab/cardDisplayState.test.ts` (`visibleBookTrade`) · `web/lib/options-lab/positionToTrade.test.ts` |
| **Litmus / AT map** | OT-EF §11 #6 · DL-394 |
| **Blocked on** | none |

### CL-7

| Field | Value |
|-------|--------|
| **ID** | CL-7 |
| **Fact** | Merge-all-visible cards into one custom OPF strategy is not the path; that attempt produced viewport CHECK LEGS and must not be revived. |
| **Suggested test home** | `web/lib/options-lab/cardDisplayState.test.ts` (`visibleBookTrade` — each shown card is its own structure / `trades.length === N`) · `web/lib/options-lab/useOpfRiskGraph.ts` (sum of independent series) |
| **Litmus / AT map** | OT-EF §11 #6 (correct additive path) · plan NX9 · DL-394 as-built correction |
| **Blocked on** | none |
| **W8 note** | Assert `visibleBookTrade` emits **N independent** trades for N shown representable cards, never one synthetic multi-card strategy sent to a single custom OPF resolve. CHECK LEGS remains a per-card representability name (Law B), not a book-merge symptom. |

### CL-8

| Field | Value |
|-------|--------|
| **ID** | CL-8 |
| **Fact** | A hidden card does not contribute to the book, and a non-representable shown sibling does not blank a drawable shown card. |
| **Suggested test home** | `web/lib/options-lab/cardDisplayState.test.ts` (`resolveViewportBookPolicy`, `visibleBookTrade` — hide A keeps B; updating sibling still listed) |
| **Litmus / AT map** | OT-EF §11 #6 · Law B2 HIDDEN · viewport policy |
| **Blocked on** | none |

### CL-9

| Field | Value |
|-------|--------|
| **ID** | CL-9 |
| **Fact** | `print_quality=last_print` (or as-built held last print) is valid instrument truth and must not be flashed as OPF unavailable. |
| **Suggested test home** | `web/lib/options-lab/builderAtomicState.test.ts` (`resolveBuilderPlaneState` off-market + last print → `off_market` / `ready`, not `plane_unavailable`) · `web/lib/options-lab/cardDisplayState.test.ts` (held numeric path) · `web/lib/options-lab/analyzerBook.pointer.test.ts` (`applyPackageQuote` under `sessionHeld`) |
| **Litmus / AT map** | OT-EF §11 #7 · AT-SESS-3 · OPF36 · OT-EF B1 |
| **Blocked on** | none |
| **W8 note** | Envelope token `print_quality=last_print` is added at W4; the as-built fact (held last print ≠ outage) is already testable. After W4, the same homes must accept the envelope field without changing the verdict. |

### CL-10

| Field | Value |
|-------|--------|
| **ID** | CL-10 |
| **Fact** | When `printing=false` and a held generation exists, the client hydrates once and must not 2.5s/3s retry-loop chain or package-quote. |
| **Suggested test home** | `web/lib/options-lab/useBuilderChain.ts` (`offMarket` skips `POLL_MS` interval) · `web/lib/options-lab/usePackageQuotes.ts` (`sessionHeld` skips live chase) · `web/lib/options-lab/builderAtomicState.test.ts` |
| **Litmus / AT map** | OT-EF §11 #7 · AT-SESS-4 · OPF36 · OPF-SESS-4 |
| **Blocked on** | none |
| **W8 note** | After W4 the trigger is envelope `printing=false`, not a client cash-bell. W8 must prove no interval hydrate while printing is false and a generation is already held. |

### CL-11

| Field | Value |
|-------|--------|
| **ID** | CL-11 |
| **Fact** | When Massive is printing pre/post (`extended-hours` / `printing=true`), OPF states `market=extended`, not `closed`. |
| **Suggested test home** | W4 envelope fixture on ladder / package-quote / resolve · `server/tests/test_market_session_posture.py` (`_printing_from_massive_doc`) · `web/lib/options-lab/sessionPosture.ts` (`POSTURE_FIXTURES` extended-hours) |
| **Litmus / AT map** | AT-SESS-2 · OPF-SESS-1 · OPF-SESS-5 |
| **Blocked on** | W4 |
| **W8 note** | L0 Massive/bus mapping may stay in `market_session.py`; the **member SoR** after W4 is `opf_session.market`. Do not hard-cut the feed at 16:00 / 09:30 if Massive is still printing. |

### CL-12

| Field | Value |
|-------|--------|
| **ID** | CL-12 |
| **Fact** | When the OPF session envelope is present, the client has no clock SoR and `/session-status` is not member-facing SoR. |
| **Suggested test home** | W5 consume: `web/components/options-lab/OpfRiskAnalyzer.tsx` · `web/lib/options-lab/sessionPosture.ts` (`clockPostureFallback` must not win when envelope present) · Builder `planePrinting` sourced from envelope |
| **Litmus / AT map** | AT-SESS-5 · OPF34 · OPF-SESS-4 · OD-SESS-4 (shim, not SoR) |
| **Blocked on** | W5 |
| **W8 note** | **As-built:** Analyzer still uses `GET /api/me/market/session-status` + `clockPostureFallback`. After W5 that path is a labeled shim at most. Grep W5-G / W8 for cash-bell SoR (09:30 / 16:00) on Analyzer and Builder when `opf_session` is on the payload. NX10: do not delete `/session-status` in W0–W3. |

### CL-13

| Field | Value |
|-------|--------|
| **ID** | CL-13 |
| **Fact** | Live RTH still claims `print_quality=live` and RECON as today — not held, not reconstruct-as-live. |
| **Suggested test home** | W4 envelope on package-quote / resolve · `web/lib/options-lab/opfModels.ts` (`day_trade` RECON) · `web/lib/options-lab/useOpfRiskGraph.ts` (`reconPass`) · `web/lib/options-lab/cardDisplayState.test.ts` (live chip after open) · `web/lib/options-lab/analyzerBook.pointer.test.ts` (pre_open → live NBBO) |
| **Litmus / AT map** | AT-SESS-7 · OPF-SESS-2 |
| **Blocked on** | W4 |

### CL-14

| Field | Value |
|-------|--------|
| **ID** | CL-14 |
| **Fact** | Backtest and forward-walk are Law A consumers: they emit only OPF-held listed strikes, on gold and on silver. |
| **Suggested test home** | Law A analog now: `web/lib/options-lab/otEfDoctrine.proof.test.ts` (`buildListedStructure` / `shiftCardStrikes` never invent) · W7/W8 SL characterization (Kilo; no engine rewrite) citing Method v0.2 / v0.2.2 and Config Resolution Standard §3 step 4 |
| **Litmus / AT map** | OT-EF §11 #8 · SL-GD39 |
| **Blocked on** | none |
| **W8 note** | No BT/FW emit-path test file exists today. W7 is tests-only if the engine is already honest. If no emit path is on disk, W8 records an explicit handoff — not a false green. Gold and silver share one listed universe; silver is not a second strike grid. |

### CL-15

| Field | Value |
|-------|--------|
| **ID** | CL-15 |
| **Fact** | BT/FW events, exits, and outcome buckets address the atomic position, never a single leg. |
| **Suggested test home** | Doctrine analog now: `web/lib/options-lab/positionToTrade.test.ts` (one structure = one trade) · W7/W8 SL event/exit/bucket characterization · Method v0.2 §5 (butterflies are atomic units; no partial-leg fill) · SL-GD22 / SL-GD40 |
| **Litmus / AT map** | SL-GD40 (restates SL-GD22) · OT-EF A5 |
| **Blocked on** | none |

### CL-16

| Field | Value |
|-------|--------|
| **ID** | CL-16 |
| **Fact** | Silver is never drawn as gold; every BT/FW result carries its tier tag. |
| **Suggested test home** | W7/W8 new SL tier-state characterization (no existing gold/silver render test) · honesty class shared with `web/lib/options-lab/cardDisplayState.test.ts` (live vs held vs expired) · Method v0.2 §1 |
| **Litmus / AT map** | OT-EF §11 #9 · SL-GD41 · OT-EF A6 |
| **Blocked on** | none |
| **W8 note** | Silver is a named state of the tape, same honesty class as last print / residual / expired. No validation ceremony that makes silver look like gold. |

### CL-17

| Field | Value |
|-------|--------|
| **ID** | CL-17 |
| **Fact** | Last print / residual is never drawn as live. |
| **Suggested test home** | `web/lib/options-lab/cardDisplayState.test.ts` (held chip vs live chip; pre_open vs live) · `web/lib/options-lab/analyzerBook.pointer.test.ts` (`sessionHeld` → `liveState === "held"`) · `web/lib/options-lab/otEfDoctrine.proof.test.ts` |
| **Litmus / AT map** | OT-EF A6 · B2 · SL-GD41 (same honesty class) · pairs with CL-3 |
| **Blocked on** | none |

### CL-18

| Field | Value |
|-------|--------|
| **ID** | CL-18 |
| **Fact** | Every prefilled or regenerated leg strike sits on the OPF-held listed chain for its expiration, or the UI is UPDATING — never a fake finished structure. |
| **Suggested test home** | `web/lib/options-lab/otEfDoctrine.proof.test.ts` (`buildListedStructure`) · `web/lib/options-lab/listedStructure.ts` · `web/lib/options-lab/builderAtomicState.test.ts` (`updating` while resolving) · `web/lib/options-lab/builderCreateDefault.test.ts` |
| **Litmus / AT map** | OT-EF §11 #1 · Law A1–A4 |
| **Blocked on** | none |

### CL-19

| Field | Value |
|-------|--------|
| **ID** | CL-19 |
| **Fact** | After a pointer change (expiration, strikes, or template rebuild) the card settles once to a defendable mark or a named Law B state — no flash loop until the definition changes again. |
| **Suggested test home** | `web/lib/options-lab/analyzerBook.pointer.test.ts` (`setCardExpiration` clears stale mark + `cardDefinitionKey` moves) · `web/lib/options-lab/otEfDoctrine.proof.test.ts` (rebind) · `web/lib/options-lab/builderAtomicState.test.ts` · `web/lib/options-lab/usePackageQuotes.ts` (one resolve per definition) |
| **Litmus / AT map** | OT-EF §11 #2 · Law B3 |
| **Blocked on** | none |

### CL-20

| Field | Value |
|-------|--------|
| **ID** | CL-20 |
| **Fact** | Walking strikes to the chain edge yields NOT TRADED, never a synthetic debit or credit. |
| **Suggested test home** | `web/lib/options-lab/optionBind.test.ts` (`chain_edge` / missing mid → `bindPackageLabel === "NOT TRADED"`) · `web/lib/options-lab/cardDisplayState.test.ts` · `web/lib/options-lab/otEfDoctrine.proof.test.ts` |
| **Litmus / AT map** | OT-EF §11 #3 · Law B2 · Law B4 |
| **Blocked on** | none |

### CL-21

| Field | Value |
|-------|--------|
| **ID** | CL-21 |
| **Fact** | Ladder, package-quote, and resolve each carry or cite `opf_session` stating market, printing, print_quality, as_of, and generation_as_of. |
| **Suggested test home** | `server/tests/test_chain_ladder.py` · `server/tests/test_opf_package_quote_api.py` · `server/tests/test_opf_foundation.py` (`resolve_pricing`) · W4 envelope fixture (Alpha) |
| **Litmus / AT map** | AT-SESS-1 · OPF35 |
| **Blocked on** | W4 |
| **W8 note** | Envelope sits **beside** per-leg `mark_source` and package `mark_mode` — do not delete those. Field names may be Coach-renamed in W3 HOW; facts stay. |

### CL-22

| Field | Value |
|-------|--------|
| **ID** | CL-22 |
| **Fact** | Builder Edit with a last print open does not flash OPF unavailable or retry-loop the plane. |
| **Suggested test home** | `web/lib/options-lab/builderAtomicState.test.ts` (off-market + listed last print → `ready` / `off_market`, never `plane_unavailable`) · W5/W6 consume in `web/components/options-lab/PositionBuilder.tsx` (`planePrinting`, `offMarket: !planePrinting`) |
| **Litmus / AT map** | AT-SESS-6 · OT-EF §11 #7 · OPF36 |
| **Blocked on** | none |
| **W8 note** | Dialog chrome words wait for W1 Echo labels. The **state machine** fact is already homeable. After W5 the same assertion is driven by envelope `print_quality=last_print`, not a client clock. |

### CL-23

| Field | Value |
|-------|--------|
| **ID** | CL-23 |
| **Fact** | Last print, residual, and extended prints must not be readable as a lift-now live NBBO quote. |
| **Suggested test home** | `web/lib/options-lab/cardDisplayState.test.ts` (chip/kind: held vs live vs expired) · `web/lib/options-lab/sessionPosture.ts` (Extended ≠ Live) · W5 chrome only from `agents/p-ot-ef-session-print/echo-labels.md` |
| **Litmus / AT map** | OT-EF A6 · B2 · Hotel W1-3 · AT-SESS-3 (UI honesty) |
| **Blocked on** | none |
| **W8 note** | Hotel row. Distinct from CL-17 (display kind): this is claim honesty — “Pre/post” is not RTH NBBO; “Off market” + last print is not a now-tradeable market; Held/residual is not “still live through the close.” |

### CL-24

| Field | Value |
|-------|--------|
| **ID** | CL-24 |
| **Fact** | `print_quality=none` (no generation) is a named incomplete state — UPDATING, CHECK LEGS, or WAITING — never a blank cell and never OPF unavailable. |
| **Suggested test home** | `web/lib/options-lab/cardDisplayState.test.ts` (incomplete → UPDATING) · `web/lib/options-lab/builderAtomicState.test.ts` · `web/lib/options-lab/analyzerBook.pointer.test.ts` (incomplete quote invents no mark) · W4 envelope `print_quality=none` |
| **Litmus / AT map** | Session/Print §6 · OPF36 · Law B1–B2 · OT-EF §11 #2 |
| **Blocked on** | none |
| **W8 note** | Named-state path is as-built. After W4, `print_quality=none` must map onto that path, not onto `plane_unavailable`. |

### CL-25

| Field | Value |
|-------|--------|
| **ID** | CL-25 |
| **Fact** | τ / settlement (OPF29) and EXPIRED (next midnight ET) are two clocks; cash close must not be used as the EXPIRED clock and EXPIRED must not be used as τ. |
| **Suggested test home** | `web/lib/options-lab/analyzerBook.ts` (`isOptionPointerExpired` / `newYorkCalendarDate`) · OPF `server` `opf/tau.py` (via `server/tests/test_opf_foundation.py`) · `web/lib/options-lab/optionBind.test.ts` (bind `expired` = EXPIRED clock, not τ) |
| **Litmus / AT map** | Law C · OT-EF §11 #4–5 · plan NX12 |
| **Blocked on** | none |
| **W8 note** | `optionBind.ts` header still says “not past settlement” while the implementation calls `isOptionPointerExpired` (EXPIRED clock). W8 must characterize the **two** clocks, not paper over the comment. Do not change OPF29 in this program. |

---

## 2. Coverage maps

### 2.1 OT-EF v1.1 §11 litmus → CL-ids

| §11 # | Litmus (Coach) | CL-ids |
|-------|----------------|--------|
| **1** | Every prefilled leg strike is on the OPF-held listed chain (or UI is UPDATING — not a fake structure) | **CL-18** (primary) · CL-14 (BT/FW same Law A) |
| **2** | After pointer change, the card settles once to a defendable mark or a named §2.2 state | **CL-19** (primary) · CL-24 (named incomplete) |
| **3** | Walk to chain edge → NOT TRADED, not a synthetic debit | **CL-20** |
| **4** | After settlement and before midnight ET → held / residual, **never live** | **CL-3** (primary) · CL-1 (still current on exp day) · CL-17 · CL-25 |
| **5** | After midnight ET a still-shown card is EXPIRED + ghost with defined debit | **CL-2** · **CL-4** · CL-25 |
| **6** | Two or more shown cards add on one continuous book curve | **CL-5** · **CL-6** · **CL-7** · CL-8 |
| **7** | Closed / last print is not flashed as OPF unavailable | **CL-9** · **CL-10** · **CL-22** · CL-24 |
| **8** | Backtest / forward-walk does not invent strikes (Law A consumer) | **CL-14** |
| **9** | Silver is never drawn as gold (tier is a state) | **CL-16** |

Every §11 item maps to ≥1 row.

### 2.2 AT-SESS-1…7 → CL-ids

| AT | Criterion | CL-ids | Blocked on |
|----|-----------|--------|------------|
| **AT-SESS-1** | Ladder, package-quote, and resolve each carry or cite `opf_session` | **CL-21** | W4 |
| **AT-SESS-2** | `market=extended` when Massive extended-hours / printing; not `closed` | **CL-11** | W4 |
| **AT-SESS-3** | `print_quality=last_print` when mids are last_trade / day_close; UI does not say unavailable | **CL-9** · CL-23 · CL-17 | none (as-built) · W4 token |
| **AT-SESS-4** | `market=closed` + held generation → last print served; client does not retry-loop | **CL-10** · CL-9 | none |
| **AT-SESS-5** | Client has no clock SoR when OPF envelope is present | **CL-12** | **W5** |
| **AT-SESS-6** | Builder Edit with last print open does not flash OPF unavailable | **CL-22** · CL-9 | none |
| **AT-SESS-7** | Live RTH still claims `print_quality=live` and RECON as today | **CL-13** | W4 |

Every AT-SESS maps to ≥1 row. None are blocked on W3-0.

### 2.3 SL-GD39–41 → CL-ids

| ID | Amendment | CL-ids |
|----|-----------|--------|
| **SL-GD39** | BT/FW is a Law A consumer; no invented strikes on gold or silver | **CL-14** · CL-18 (same universe) |
| **SL-GD40** | A trade is one atomic position; events / exits / buckets address the position | **CL-15** |
| **SL-GD41** | Tier is a state; never render silver as gold | **CL-16** · CL-17 (same honesty class: last print / residual ≠ live) |

### 2.4 Plan smoke after W5 (not extra rows — these rows prove it)

| Smoke | CL-ids |
|-------|--------|
| Same-day card held/residual after settlement, never live | CL-3 · CL-17 · CL-25 |
| After midnight ET: EXPIRED + ghost + defined debit | CL-2 · CL-4 |
| Two shown cards add; unchecking one is not a radio | CL-5 · CL-6 · CL-7 |
| Closed + last print: Edit does not flash OPF unavailable | CL-9 · CL-22 · CL-10 |
| Extended (Massive still printing) is not closed / unavailable | CL-11 · CL-23 |

---

## 3. Homes index (existing characterization — do not invent a third suite)

| Existing file | Rows that should land here first |
|---------------|----------------------------------|
| `web/lib/options-lab/analyzerBook.pointer.test.ts` | CL-1 · CL-2 · CL-9 · CL-13 · CL-17 · CL-19 · CL-24 · CL-25 |
| `web/lib/options-lab/cardDisplayState.test.ts` | CL-1 · CL-2 · CL-3 · CL-4 · CL-5 · CL-6 · CL-7 · CL-8 · CL-9 · CL-17 · CL-20 · CL-23 · CL-24 |
| `web/lib/options-lab/optionBind.test.ts` | CL-3 · CL-4 · CL-20 · CL-25 |
| `web/lib/options-lab/otEfDoctrine.proof.test.ts` | CL-3 · CL-14 · CL-17 · CL-18 · CL-19 · CL-20 |
| `web/lib/options-lab/builderAtomicState.test.ts` | CL-9 · CL-10 · CL-18 · CL-19 · CL-22 · CL-24 |
| `web/lib/options-lab/opfPricingApi.test.ts` | CL-6 |
| `web/lib/options-lab/positionToTrade.test.ts` | CL-6 · CL-15 |
| `web/lib/options-lab/sessionPosture.ts` | CL-11 · CL-12 · CL-23 |
| `server/tests/test_market_session_posture.py` | CL-11 (L0 input only) |
| `server/tests/test_chain_ladder.py` | CL-21 |
| `server/tests/test_opf_package_quote_api.py` | CL-21 |
| `server/tests/test_opf_foundation.py` | CL-13 · CL-21 · CL-25 (τ) |

W7/W8 may **add** SL files for CL-14…16 if no emit path exists. They must not edit this list’s meaning.

---

## 4. Explicit non-claims (not W8 green)

These are plan NX / out of program. Do not mark a CL row shipped by testing these.

| ID | Out |
|----|-----|
| NX1 | MSC as pricing SoR |
| NX9 | Merge-all-visible into one custom OPF (**CL-7** forbids the path; passing CL-7 is *not* shipping a merge) |
| NX10 | Deleting `/session-status` before W5 cutover |
| NX12 | Changing τ / OPF29 |
| NX14 | Chrome before W1 · product tests-as-substitute for this list · envelope BUILD before W1-G + W2-G + W3-G |

W3-0 WHETHER is **BUILD** (DL-397). No row in this list is blocked on W3-0.

---

**End of W2 characterization list.** W8 packs every row. Delta W2-G checks this file’s coverage maps, not a test suite.
