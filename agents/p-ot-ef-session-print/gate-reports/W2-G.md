# W2-G — Characterization-list coverage

**Verdict:** **PASS**  
**Date:** 2026-08-16  
**Agent:** Delta  
**Artifact:** `agents/p-ot-ef-session-print/characterization-list.md`  
**Seed:** `agents/p-ot-ef-session-print/seeds/W2-G-delta.md`  
**Self-gate:** Delta authored W2-1. This report is a second pair of eyes: every required source line is mapped to a CL-id. “Looks good” is not a finding.

**Sources read (not modified):**

- `agents/p-ot-ef-session-print/characterization-list.md` (CL-1…CL-25)
- OT-EF Doctrine v1.1 §11 (litmus 1–9) + Laws A–C / §2.2 named states
- Session/Print Spec v0.1 §9 AT-SESS-1…7
- Guiding Doctrine v1.0 SL-GD39–41 (and OT-EF §6 same three lines)
- Plan v1.0.1 §6 W2 table CL-1…CL-17 · DL-397

This gate writes **this file only**. The characterization list was not edited.

---

## Criteria (restated)

| Check | Pass if | Result |
|-------|---------|--------|
| List on disk | `characterization-list.md` exists | **PASS** |
| Coverage | §11 1–9 · AT-SESS-1…7 · SL-GD39–41 · CL-1…17 minimum | **PASS** |
| No code | W2 did not add product tests or `web/` / `server/` behavior | **PASS** |
| Homes named | Each row has a suggested module | **PASS** |
| No W3-0 blocks | Per DL-397, rows must not be blocked on W3-0 | **PASS** |

Holes that would FAIL: a §11 / AT-SESS / SL-GD line with no CL; a missing plan CL-1…17 row; a row with no home; a row blocked on W3-0; W2 product tests or `web/`/`server/` behavior.

**Defects:** none.

---

## 1. List on disk

`agents/p-ot-ef-session-print/characterization-list.md` is present (390 lines). Header: Author Delta (W2-1), Status **CONTRACT**, Date 2026-08-16.

Rows present: **CL-1 through CL-25** (plan minimum is CL-1…CL-17). Each of those 25 has ID, Fact, Suggested test home, Litmus / AT map, Blocked on.

---

## 2. Independent coverage maps

Maps below were built from the **source sentences**, then checked against the list’s §2 tables. They agree. The list’s own maps are not taken as proof.

### 2.1 OT-EF v1.1 §11 litmus → CL

Source: `Specs/FatTail-Labs-Options-Lab-OPF-Truth-and-Elegant-Failure-Doctrine-v1.1.md` §11.

| §11 # | Source sentence (Coach) | CL that states that fact | Primary? |
|-------|-------------------------|--------------------------|----------|
| **1** | Every prefilled leg strike is on the OPF-held listed chain for its exp (or the UI is waiting with **UPDATING** — not a fake structure). | **CL-18** — prefilled / regenerated strike on held chain or UPDATING, never a fake finished structure. **CL-14** — same Law A universe on BT/FW. | CL-18 |
| **2** | After pointer change, the card settles **once** to a defendable mark or a **named** state from §2.2. | **CL-19** — pointer change settles once to a mark or named Law B state; no flash loop. **CL-24** — `print_quality=none` is a named incomplete state (UPDATING / CHECK LEGS / WAITING). | CL-19 |
| **3** | A member who walks strikes to the chain edge sees **NOT TRADED**, not a synthetic debit. | **CL-20** — chain edge → NOT TRADED, never a synthetic debit or credit. | CL-20 |
| **4** | After settlement and before midnight ET the card is **held / residual**, **never live**. | **CL-3** — after τ / OPF29 and before midnight ET: Held/residual, never live. **CL-17** — last print / residual never drawn as live. **CL-25** — τ ≠ EXPIRED; cash close is not the EXPIRED clock. **CL-1** — still current on exp day (not expired at 16:00Z / cash close / UTC midnight). | CL-3 |
| **5** | After midnight ET a still-shown card is **EXPIRED** + ghost with **defined debit**. | **CL-2** — after 00:00:00 America/New_York on D+1, still-shown card is EXPIRED + ghost residual. **CL-4** — ghost keeps sign-honest defined debit. **CL-25** — two-clock identity. | CL-2 + CL-4 |
| **6** | Two or more **shown** cards add on one continuous book curve. | **CL-6** — N shown representable cards → one continuous additive book (`sumAlignedPnL`), not a replacement curve. **CL-5** — Show is an independent checkbox (not a radio). **CL-7** — do not merge-all-visible into one custom OPF (NX9). **CL-8** — hidden card does not contribute; non-representable sibling does not blank a drawable card. | CL-6 |
| **7** | Closed / last print is not flashed as **OPF unavailable**. | **CL-9** — `print_quality=last_print` (or as-built held last print) is valid truth, not OPF unavailable. **CL-10** — `printing=false` + held generation → one hydrate, no 2.5s/3s retry-loop. **CL-22** — Builder Edit with last print open does not flash OPF unavailable. **CL-24** — `print_quality=none` is named incomplete, never OPF unavailable. | CL-9 · CL-22 |
| **8** | Backtest / forward-walk does not invent strikes (Law A consumer). | **CL-14** — BT/FW emit only OPF-held listed strikes, gold and silver. | CL-14 |
| **9** | Silver is never drawn as gold (tier is a state). | **CL-16** — silver never drawn as gold; every BT/FW result carries its tier tag. | CL-16 |

Every §11 item maps to ≥1 row. No hole.

Plan table CL-1…CL-17 did **not** carry §11 #1–3. The list added **CL-18, CL-19, CL-20**. Those Coach facts were not dropped.

### 2.2 Session/Print §9 AT-SESS-1…7 → CL

Source: `Specs/FatTail-Labs-OPF-Session-and-Print-Authority-Spec-v0.1.md` §9.

| AT | Source criterion | CL that states that fact | Blocked on |
|----|------------------|--------------------------|------------|
| **AT-SESS-1** | Ladder, package-quote, and resolve each carry or cite `opf_session` | **CL-21** — those three surfaces carry or cite `opf_session` with market, printing, print_quality, as_of, generation_as_of | **W4** |
| **AT-SESS-2** | `market=extended` when Massive `extended-hours` / printing; not `closed` | **CL-11** — Massive pre/post printing → `market=extended`, not `closed` | **W4** |
| **AT-SESS-3** | `print_quality=last_print` when mids are last_trade / day_close; UI does not say unavailable | **CL-9** — last_print is valid instrument truth, not unavailable. **CL-23** — last print / residual / extended not readable as lift-now live NBBO. **CL-17** — last print / residual never drawn as live | none (as-built UI) · W4 token |
| **AT-SESS-4** | `market=closed` + held generation → last print served; client does not retry-loop | **CL-10** — `printing=false` + held generation → one hydrate, no retry-loop. **CL-9** — last print served is valid | none |
| **AT-SESS-5** | Client has **no** clock SoR when OPF envelope is present | **CL-12** — envelope present → no client clock SoR; `/session-status` is not member SoR | **W5** |
| **AT-SESS-6** | Builder Edit with last print open does **not** flash OPF unavailable | **CL-22** — same sentence. **CL-9** — last print ≠ unavailable | none |
| **AT-SESS-7** | Live RTH still claims `print_quality=live` and RECON as today | **CL-13** — live RTH claims `print_quality=live` and RECON as today, not held, not reconstruct-as-live | **W4** |

Every AT-SESS maps to ≥1 row. None blocked on W3-0.

AT-SESS-3 is a compound AT (writer mapping + UI honesty). The UI half is a first-class fact (CL-9). The writer half (`last_trade` / `day_close` → `last_print`) is not a standalone row; it is implied by CL-21 (envelope carries `print_quality`) plus CL-9’s W8 note (accept the envelope token without changing the verdict). That is enough to map the AT. W8 must still fixture the writer mapping when proving AT-SESS-3 green — not a coverage hole.

AT-SESS-4 names `market=closed`; CL-10 names `printing=false`. Closed normally implies not printing. W8 must fixture **both** conjuncts from the AT text (`market=closed` ∧ held generation), not only `printing=false`. Mapped, not missing.

### 2.3 SL-GD39–41 → CL

Sources: Guiding Doctrine v1.0 SL-GD39–41 · OT-EF v1.1 §6 (same three lines) · acceptance items 18–20.

| ID | Source amendment | CL that states that fact |
|----|------------------|--------------------------|
| **SL-GD39** | Backtest and forward-walk are **Law A consumers**. Same OPF-held listed universe. No invented strikes on gold or silver. | **CL-14** — BT/FW emit only OPF-held listed strikes on gold and silver. **CL-18** — same listed universe on prefill. |
| **SL-GD40** | A trade is **one atomic position** (restates SL-GD22). BT/FW events, exits, and buckets address the position. | **CL-15** — BT/FW events, exits, and outcome buckets address the atomic position, never a single leg. |
| **SL-GD41** | **Tier is a state** (gold \| silver), same honesty as live \| last print \| expired. Never render silver as gold. | **CL-16** — silver never drawn as gold; result carries its tier tag. **CL-17** — last print / residual never drawn as live (acceptance item 20, same honesty class). |

Every SL-GD39–41 line maps to ≥1 row. No hole.

### 2.4 Plan minimum CL-1…CL-17 preserved

Plan §6 W2 table facts were checked against list facts. None dropped. Additions in the list (UTC midnight on CL-1; exits/buckets on CL-15; tier tag on CL-16) extend Coach facts; they do not replace them.

| Plan ID | Plan fact | List fact matches? |
|---------|-----------|--------------------|
| CL-1 | Same-day exp is not EXPIRED at 16:00Z / cash close | Yes (+ UTC midnight) |
| CL-2 | After midnight ET next calendar day → EXPIRED + ghost | Yes |
| CL-3 | Between τ and midnight ET → Held/residual, never live | Yes |
| CL-4 | Ghost keeps defined debit (sign-honest) | Yes |
| CL-5 | Show is independent checkbox; two shown cards stay shown | Yes |
| CL-6 | Two shown representable cards → one continuous additive curve | Yes |
| CL-7 | Merge-into-one-custom-OPF is not the path | Yes |
| CL-8 | Hidden card does not contribute; non-representable sibling does not blank a drawable one | Yes |
| CL-9 | `print_quality=last_print` is not OPF unavailable | Yes |
| CL-10 | `printing=false` → one hydrate, no 2.5s/3s retry loop | Yes |
| CL-11 | `market=extended` when Massive is printing pre/post | Yes |
| CL-12 | Client has no clock SoR when envelope is present | Yes |
| CL-13 | Live RTH still claims live + RECON as today | Yes |
| CL-14 | BT/FW does not invent strikes (gold or silver) | Yes |
| CL-15 | BT/FW events address the position, not a leg | Yes (+ exits / buckets = SL-GD40 full text) |
| CL-16 | Silver is never drawn as gold | Yes (+ tier tag) |
| CL-17 | Last print / residual is never drawn as live | Yes |

Added rows CL-18…CL-25 close §11 #1–3, AT-SESS-1, AT-SESS-6, Hotel lift-honesty, `print_quality=none`, and two-clock identity (plan NX12). Required by W2-1 (“add rows if the litmus or AT-SESS set is not covered”).

---

## 3. Homes named — each row, file on disk

Criterion: every row names a suggested module. Spot-check: named **existing** paths resolve. Future W4/W5/W7/W8 homes are allowed when labeled.

| ID | Suggested home (first named) | On disk? |
|----|------------------------------|----------|
| CL-1 | `web/lib/options-lab/analyzerBook.pointer.test.ts` (`isOptionPointerExpired`) | Yes · symbol exists |
| CL-2 | `analyzerBook.pointer.test.ts` · `cardDisplayState.test.ts` (`resolveCardDisplayState`, `expiredGhostSeries`) | Yes · symbols exist |
| CL-3 | `cardDisplayState.test.ts` · `optionBind.test.ts` (`assessPositionBind`) · `otEfDoctrine.proof.test.ts` | Yes |
| CL-4 | `cardDisplayState.test.ts` (`definedDebitSigned`, `expiredGhostSeries`) · `optionBind.test.ts` | Yes · `definedDebitSigned` in `analyzerBook.ts` |
| CL-5 | `cardDisplayState.test.ts` (`resolveViewportBookPolicy`, `visibleBookTrade`) · `AnalyzerPositionsList.tsx` | Yes |
| CL-6 | `opfPricingApi.test.ts` (`sumAlignedPnL`) · `cardDisplayState.test.ts` · `positionToTrade.test.ts` | Yes |
| CL-7 | `cardDisplayState.test.ts` (`visibleBookTrade`) · `useOpfRiskGraph.ts` | Yes |
| CL-8 | `cardDisplayState.test.ts` (`resolveViewportBookPolicy`, `visibleBookTrade`) | Yes |
| CL-9 | `builderAtomicState.test.ts` (`resolveBuilderPlaneState`) · `cardDisplayState.test.ts` · `analyzerBook.pointer.test.ts` (`applyPackageQuote`) | Yes |
| CL-10 | `useBuilderChain.ts` (`offMarket` skips `POLL_MS`) · `usePackageQuotes.ts` (`sessionHeld` skips live chase) · `builderAtomicState.test.ts` | Yes · `offMarket` early-return at `useBuilderChain.ts:258–261`; `sessionHeld` skip at `usePackageQuotes.ts:482` |
| CL-11 | W4 envelope fixture · `server/tests/test_market_session_posture.py` (`_printing_from_massive_doc`) · `sessionPosture.ts` (`POSTURE_FIXTURES`) | Yes · `_printing_from_massive_doc` in `server/routes/market_session.py` |
| CL-12 | W5 consume · `OpfRiskAnalyzer.tsx` · `sessionPosture.ts` (`clockPostureFallback`) | Yes · as-built still uses `clockPostureFallback` (list names the gap) |
| CL-13 | W4 envelope · `opfModels.ts` · `useOpfRiskGraph.ts` · `cardDisplayState.test.ts` · `analyzerBook.pointer.test.ts` | Yes |
| CL-14 | `otEfDoctrine.proof.test.ts` (`buildListedStructure`) · W7/W8 SL characterization citing Method v0.2 / v0.2.2 | Yes · analog home + Method `Specs/FatTail-Labs-Strategy-Lab-Backtest-Forward-Walk-Method-v0_2.md` (and `_v0_2_2.md`) on disk. List states no BT/FW emit-path test exists today. |
| CL-15 | `positionToTrade.test.ts` · W7/W8 SL event/exit/bucket characterization | Yes · analog + future SL file named |
| CL-16 | W7/W8 new SL tier-state characterization · honesty class shared with `cardDisplayState.test.ts` | Yes · future SL file named; analog exists |
| CL-17 | `cardDisplayState.test.ts` · `analyzerBook.pointer.test.ts` · `otEfDoctrine.proof.test.ts` | Yes |
| CL-18 | `otEfDoctrine.proof.test.ts` · `listedStructure.ts` · `builderAtomicState.test.ts` · `builderCreateDefault.test.ts` | Yes |
| CL-19 | `analyzerBook.pointer.test.ts` (`setCardExpiration`, `cardDefinitionKey`) · `otEfDoctrine.proof.test.ts` · `builderAtomicState.test.ts` · `usePackageQuotes.ts` | Yes |
| CL-20 | `optionBind.test.ts` (`bindPackageLabel === "NOT TRADED"`) · `cardDisplayState.test.ts` · `otEfDoctrine.proof.test.ts` | Yes |
| CL-21 | `server/tests/test_chain_ladder.py` · `test_opf_package_quote_api.py` · `test_opf_foundation.py` · W4 envelope fixture | Yes |
| CL-22 | `builderAtomicState.test.ts` · W5/W6 `PositionBuilder.tsx` (`planePrinting`) | Yes · `planePrinting` in `PositionBuilder.tsx` |
| CL-23 | `cardDisplayState.test.ts` · `sessionPosture.ts` · W5 chrome from `echo-labels.md` | Yes · `echo-labels.md` on board |
| CL-24 | `cardDisplayState.test.ts` · `builderAtomicState.test.ts` · `analyzerBook.pointer.test.ts` · W4 `print_quality=none` | Yes |
| CL-25 | `analyzerBook.ts` (`isOptionPointerExpired` / `newYorkCalendarDate`) · `server/opf/tau.py` via `test_opf_foundation.py` · `optionBind.test.ts` | Yes · `server/opf/tau.py` exists (`expiry_instant`, `tau`) |

All 25 rows name a module. No invented third suite required for the as-built set.

---

## 4. No W3-0 blocks (DL-397)

`Blocked on` values on the 25 rows:

| Value | Rows |
|-------|------|
| `none` | CL-1…10, CL-14…20, CL-22…25 (21 rows) |
| `W4` | CL-11, CL-13, CL-21 |
| `W5` | CL-12 |
| `W3-0` | **none** |

`W3-0` appears only as a prohibition (list §0, §2.2, §4). Matches DL-397: WHETHER is already BUILD; W3-0 is historical.

Plan §6 W2-G still says “or blocked on W3-0”. That plan sentence is stale. The **list** follows the later law (seed W2-1 + DL-397). Not a list defect.

---

## 5. No code (W2)

Checked:

| Probe | Evidence |
|-------|----------|
| W2 board artifact | Only `characterization-list.md` (markdown contract). No test files under `agents/p-ot-ef-session-print/`. |
| `web/` tokens | Ripgrep `characterization-list` \| `W2-1` \| `AT-SESS-` \| `CL-18`…`CL-25` in `web/**/*.{ts,tsx}` → **no matches**. |
| `server/` tokens | Ripgrep `characterization-list` \| `W2-1` \| `AT-SESS-` \| `opf_session` in `server/**/*.py` → **no matches**. |
| This gate | Writes `gate-reports/W2-G.md` only. List not edited. No tests written. No product files touched. |
| Named homes | Pre-existing as-built characterization (`optionBind`, `cardDisplayState`, `analyzerBook.pointer`, `otEfDoctrine.proof`, `builderAtomicState`, server OPF tests). W2 names them; it does not add cases. |

W2-1 seed forbids writing or changing tests. The list header states the same. Grep finds no product-side residue of this packet.

Residual honesty: HEAD commit message is still `feat(options-lab): independent Show checkboxes, additive book, midnight-ET EXPIRED` (DL-393/394). That is prior product work, not W2. The characterization list is a working-tree board file. This gate does not require a commit.

---

## 6. Holes (FAIL defects)

**None.**

Every required source line has a CL. CL-1…CL-17 exist. Every row has a home. No row is blocked on W3-0. W2 added no product tests or `web/`/`server/` behavior.

---

## 7. Residual notes (not defects — W8 must still read them)

These are honesty already in the list, recorded so W8 does not treat a map as a green test:

1. **CL-3 as-built gap:** display uses `sessionHeld` (market closed) as a proxy for the Held/residual window, not τ. W8 must fixture `now` after τ on exp day D and before D+1 00:00 ET.
2. **CL-14…16:** no BT/FW emit-path test file on disk. W8 records an explicit handoff if still absent — not a false green.
3. **AT-SESS-3 writer mapping** (`last_trade` / `day_close` → `print_quality=last_print`) is not its own row. Prove it at W4/W8 against CL-21 + CL-9.
4. **AT-SESS-4** fixture is `market=closed` ∧ held generation, not `printing=false` alone.
5. **CL-25:** `optionBind.ts` header still says “not past settlement” while the implementation calls `isOptionPointerExpired` (EXPIRED clock). W8 characterizes both clocks; do not paper over the comment; do not change OPF29.
6. Envelope **field names** may change in W3 HOW. Facts (market · printing · live vs last print · as_of) stay.

---

## Next

- **W7 / W8** may use this list as the contract.
- **W4** fires when **this gate and W1-G and W3-G** have all passed (third gate wins). W3-0 is already BUILD (DL-397).
- Juliet updates the board. Lima does not need a new DL for a coverage PASS.

**End of W2-G.**
