# MSC 3D Options Surface — Design Port Assessment

**Date:** 2026-08-16  
**Status:** FILLED — Phase 0 next (Juliet drafts Labs Surface Spec). **Not BUILD AUTHORITY.**  
**Purpose:** Port the *design* of the MSC 3D options surface model into Options Lab —
keep what proved good, discard what didn't, adapt for Options Lab's needs. **No code
crosses the boundary** (Sacred Invariant 1: zero shared code with MSC; MSC is reference
only, reached by reading, never by import/vendor/copy). Same pattern as the MSC Broker
Adapter assessment (2026-08-06).
**Output:** this assessment → a Labs surface spec (the Analyzer's per-leg vol modeler,
fully realized) → gated build → the engine Method v0.2 backtests and forward-walks run on.
**Owner:** Coach + one seat · **Reviews:** Hotel (math), India (boundary + fit with
OPF/PB-MODE-0), Alpha (implementability).

**Labs constraints:**
- **No shared code** with MSC — never import, vendor, or copy MSC TypeScript/Python.
- OPF-held chain is sole instrument truth (OT-EF / **DL-309**).
- One P&L calculator: `web/lib/risk-graph/surfaceModel.ts` (**DL-391**).
- Method v0.2.2: gold ticks + silver synthesis + replay are **modes of one surface**.
- Fail loud / named state — never silent 20% IV, never invented strikes.

**Verdict:** **Yes — adopt MSC’s *surface authority* design, not MSC’s container.**

Keep: **one compute path** (2D = 3D), **per-leg IV as the shape**, **Mkt vs Theo as
labeled disagreement**, **cost basis separate from the model**, **marks pin the spot
cell**, **VP/GEX ride beside pricing**.

Discard: silent `0.20` IV, mid-implied IV when the contract is missing, parallel
Δσ\* as an unmarked smear, hardcoded \(r,q\), weekend wall-clock τ, the proto
`useRiskGraphCalculations` transplant (Heston / regime presets).

The Labs object **is** `surfaceModel.ts` **extended** (Coach OD-1 below) — OPF
supplies listed legs + IV + τ; the sheet does not mint instruments.

**No — do not copy MSC code.** Re-derive every formula from published BS/CRR (Hotel
H1) or from OPF Spec v0.2.1.

**2026-08-16 fold (DL-409):** Product Surface bind is **exact/locked only**.
Assessment §2 “keep cascade 1–3” is **design history**, not product law.
Steps 2–6 are later labeled silver/model only. Time machine = snap rebind,
not cascade-fill. Last-minute 0DTE is mark path (App Spec §4.6a).

---

**MSC sources reviewed (design read only — no implementation files opened):**

- `docs/fattail-work-pane-feature-list.md` §4 (shared 2D/3D authority, IV cascade, Surface view)
- `docs/risk-graph-mkt-theo-mode-plan.md`
- `architecture/17_theoretical_pricing/risk_graph_vol_surface_mode_v1.0.md` (normative Mkt/Theo)
- `docs/risk-graph-tos-parity-program.md` (index only — authority claim)

**Labs sources:**

- `web/lib/risk-graph/surfaceModel.ts` · `useChainIV.ts` · OPF Spec v0.2.1 §5.6
- Method v0.2.2 §1–§2 · OT-EF v1.1 Law A/B/C · Arch 30 · DL-364 / 379–381 / 391
- Friday 2026-08-14 live_capture (5-min chain, 5s marks) — gold *target* is 3–5s chain

---

## 1. What the MSC surface is (as designed)

Describe the design in Labs terms, not MSC's code names.

| Aspect | MSC design (describe) | Notes |
|---|---|---|
| **Axes** | The 3D object is **underlier \(S\) × remaining time \(\tau\) × package P&L**. Vol is **not** a displayed axis — it is the **parameter that shapes** the sheet. A second face is expiry (intrinsic − cost). Yellow dots = listed strikes of the structure. | Same picture Coach locked as primary (`3d-pnl-surface-primary.png` · DL-381). Not a vol-cube trader would call “the vol surface.” It is a **P&L tent**. |
| **Per-leg vol** | Each leg keeps its own \(\sigma_i\). Resolve IV in a **cascade**: exact contract → nearest strike same expiry → closest DTE same strike/right → (MSC extras below). Term: ATM scales with DTE; **sticky-strike** skew ratios when rolling time. | **The core.** This is how skew gets into the tent (Labs DL-380). |
| **Inputs** | Live option chain IVs and mids; package mid as the spot-pin target; ATM-by-DTE from the heatmap; VIX as a **seed only** for Theo search. Cadence = whatever the Work Pane’s live path pushed (SSE / chain poll in MSC). | Maps to gold (chain IV + greeks + mids) vs silver (ATM/VIX reconstruction). MSC did not name gold/silver. |
| **Rebuild cadence** | Full **re-sample of the sheet** when legs, spot, IV, or clock change. Incremental = new IV vector + same BS primitive, not a PDE morph. 2D and 3D share one compute. | Must support 3–5s gold ticks and per-bar silver. MSC was “as fast as the UI path,” not a named 3–5s law. |
| **τ handling** | \(T = \max(0, \text{exp 4pm ET} - \text{asOf})\). **Closed market:** freeze `asOf` at last **16:00 ET** session mark — weekend wall clock must not shrink \(T\). Multi-exp: front residual BS on longer legs (not all-intrinsic). | One clock only. Labs **two-clocks** (OT-EF Law C · OPF29) is new: τ/settlement ≠ midnight-ET EXPIRED. |
| **Pricing model** | Black–Scholes European, **one** primitive for every name. Fixed \(r = 0.05\), \(q = 0.013\). User vol/time what-if is a shift on top. | Bibliography H1 (published BS). Labs OPF already splits **European BSM (index)** vs **CRR American (equity + discrete divs)**. Do not import MSC’s single-engine constants. |
| **Greeks** | Carried from the chain when present; also computed from the same BS primitive for the sheet. Package greeks = signed sum of legs. | Package quote law (OT-EF Law A): **display** package from OPF PackagePricer when representable; sheet greeks are model, labeled. |
| **Package pricing** | Multi-leg P&L = \(\sum q_i\,u_i(S,\tau;\sigma_i) - D^*\). **Atomic** in the trader sense (one structure, one cost basis). Fill policy lived in brokerage, not on this sheet. | Matches Method v0.2 atomic fly. Labs fill friction is **downstream** of the sheet. |
| **Marks vs model** | **Mkt mode:** per-leg smile, then a **parallel Δσ\*** so model(spot) ≈ package mid. **Theo mode:** one flat σ\* fit to the same mid. **Both:** overlay; stats follow Mkt. Card debit stays market algebra. | Gold: marks win **at the mark cell**. Silver: model fills. Parallel Δσ\* is the contested piece (§3). |
| **Edge behavior** | Cascade walks to nearest / DTE / ATM / VIX / **0.20**. Deep-ITM vendor IV in \((0, 0.01]\) is **kept** (no extrinsic). | OT-EF Law B: missing listed contract → **NOT TRADED**, never invented. MSC’s last three cascade steps invent. Keep the first three + “keep near-zero ITM IV.” |

---

## 2. What proved good (keep — port the design)

For each: what it does, why it's right, evidence it worked in MSC.

| Design element | Why keep | Evidence |
|---|---|---|
| **One compute path, two presentations** | 2D T+0, time-slice BEs, and the 3D mesh are the **same** \(V(S,\tau)\). No second worker, no second smile. | MSC Work Pane law (“hard invariant”). Labs already locked this as `surfaceModel.ts` (DL-391) + `sampleSheet` for the harness. |
| **Per-leg IV is the shape** | Skew lives in \(\sigma_i \neq \sigma_j\). A flat-vol tent is a cartoon. | MSC Mkt vs Theo overlay: flanks **diverge by design**. Coach: DL-380 / Method §1a.2 / DL-364. |
| **IV cascade (exact → nearest → closest DTE)** | Listed contract first; then the two interpolations a desk actually uses. Records a source. | MSC arch §5.1 steps 1–4. Labs OPF §5.6 is the same first three + stored / atm_exp / vix with **OC5a**. |
| **Mkt vs Theo as labeled disagreement** | Same spot pin, different smile. The overlay **teaches** skew. Stats stay on Mkt when both show. | MSC v1 shipped 2D; Both-mode acceptance: peaks meet at zero, wings may separate. Keep as **named modes**, not silent. |
| **Cost basis is not the model** | \(D^*\) from cards / lock. P&L = model − basis. Expiry face is intrinsic − basis (vol-independent). | MSC §4.1–4.2. Labs lock `freeze_iv` / `freeze_marks` (OPF9) is the same split. |
| **Marks pin the spot cell** | At the underlier print, T+0 should not invent a residual the book does not have. | MSC Mkt/Theo both target package mid at spot. Labs gold: **mark cell = OPF package quote**; shape away from spot is model. |
| **Keep near-zero ITM IV** | \(0 < \sigma \le 0.01\) means “no extrinsic,” not “missing.” Replacing it with ATM lies. | MSC §5.1. Aligns with OT-EF: do not upgrade a dead option into a live smile. |
| **Closed-session clock freeze** | Weekend wall clock must not decay Friday’s sheet. | MSC `pricingAsOfMs` = last 16:00 ET. Labs: OPF session/print (DL-395 / OD-SESS) + Law C held/residual after settlement. |
| **Calendars / diagonals stay on one sheet** | Longer legs keep residual τ; do not collapse the book to all-intrinsic. | MSC §4.1 multi-expiry. Required for 1DTE Batman (Friday entry → Monday exp). |
| **VP / GEX / chart as overlays** | Pricing stays pricing. Structure lenses ride **beside** the tent. | MSC backdrop capsules. Method v0.2: VP/GEX do not block first replay. |
| **Atomic package P&L** | One structure, one \(D^*\), signed sum of legs. No per-leg fill theater on the sheet. | MSC card debit SSOT. Method v0.2 §5.1 / DL-396 atomic position. |

---

## 3. What didn't (discard or redesign)

For each: what's wrong, whether it's a fixable design flaw or an accretion to drop.

| Element | Problem | Disposition (drop / redesign) |
|---|---|---|
| **Silent `0.20` IV fallback** | Last cascade step and Theo seed invent a smile. Labs already forbids this (OPF fail-loud, SSR11, `surface_reconstruct` silent 20%). | **Drop.** Missing IV → named state (`IV NO` / NOT TRADED / CHECK LEGS). |
| **Mid-implied IV when chain IV is missing** | Cascade step “imply σ from live mid at spot” **mints a vol** for a hole. | **Drop** on gold. Silver may *synthesize* IV only if **tier = silver** and provenance says so. |
| **Unmarked parallel Δσ\*** | Additive shift on every leg so model(spot) = mid. Hides a broken wing. Fine as a **labeled “pin-to-mid” display**, lethal as unmarked backtest truth. | **Redesign.** Gold mark cell = OPF package quote (no shift). Optional `pin_to_mid` display flag, never the replay engine. |
| **VIX / ATM as unmarked σ** | MSC Theo seed and cascade use VIX/100 and ATM map. OC5a: proxy vol is never a silent σ input. | **Redesign.** Allowed only as **labeled silver** or Theo **seed**, never as a gold mark. |
| **One European BS + hardcoded \(r,q\)** | \(r=0.05\), \(q=0.013\) for every name. Equity options are American; rates belong to OPF. | **Drop constants.** Use OPF engines (BSM index / CRR equity) and OPF21 \(r\). |
| **Single τ clock** | 16:00 ET expiry instant only. After settlement the card is still current until midnight ET (Law C). MSC has no held/residual. | **Redesign** onto two clocks. Surface owns **τ from OPF29**; card EXPIRED is the other clock. |
| **Heston / regime presets / empirical skew** | Labs file `useRiskGraphCalculations.ts` still carries this proto stack (header: transplanted). Not the Analyzer authority. | **Drop** from the official surface. Do not port MSC Heston. `surfaceModel.ts` is the SoR. |
| **IV from MSC SSE / heatmap tile** | Cascade step 1 was a second market path. Labs: OPF-held generation only. | **Drop.** Exact IV = OPF contract row. |
| **localStorage vol-mode** | Session/print doctrine: named state, not a browser key as SoR. | **Redesign.** Mode is a **session property** (PB-MODE-0), persisted with the run, not `rgVolSurfaceMode`. |
| **TOS-parity / ms-transplant naming** | Accretion. Accuracy is OPF + Hotel, not TOS lookalike. | **Drop** the program and the names. |
| **3D Mkt-only in MSC v1** | Dual mesh deferred. Labs needs one sheet; Theo is a **mode**, not a second mesh requirement for v1. | **Keep one mesh.** Mode selects the IV vector that built it. |

---

## 4. What Options Lab needs that MSC never did (adapt)

| Need | Source | Design implication |
|---|---|---|
| **Gold-tick updates** — real per-leg greeks every 3–5s replace model where present | Method v0.2 §1–2 | Surface = model + tick overlay; model fills gaps only. Friday 2026-08-14 archive is **5-minute chain / 5s marks** — gold *target* is 3–5s **chain**; do not rewrite Friday. |
| **Replay mode** — rebuild the day from captured snapshots, tick by tick | Method v0.2, Config Resolution §3 | Same surface object, historical feed; PB-MODE-0 (mode selects pack, no side-door engine). `sampleSheet(S(t), τ(t))` is the walk. |
| **Silver synthesis** — surface from minute bars + VIX/VIX1D | Method v0.2 §1 | A second *input* adapter, same surface; **tier tag on every output**. No MSC 0.20. Native VIX vs labeled proxy (Friday VIX was `massive_proxy_v1`). |
| **Per-leg vol → fill friction** | Method v0.2 §4.1 | Surface exposes per-leg IV + spread to the friction model. Does not roll fills itself. |
| **Two clocks** — τ (settlement) vs card EXPIRED (midnight ET); held/residual between | OT-EF v1.1 Law C | Surface must know settlement instant per product (AM/PM). After settlement, before midnight: residual sheet, **never live**. |
| **OPF as sole instrument truth** — only listed strikes; package quote from OPF | OT-EF Law A | Surface never mints a strike; edge → NOT TRADED. Wings window ≠ full book (Friday tap). |
| **Live + forward-analysis + backtest** as modes of one surface | PB-MODE-0 (2026-08-12) | Mode is a session property; the surface is one object. Pack family: `day_trade.*` / `outlook.*` / `backtest.chain_replay` (not `surface_reconstruct` as default). |
| **VP / GEX as context, not pricing** | Trigger grammar ref | Surface stays pricing; structure lenses ride beside it. |
| **Provenance** on every price | Config Resolution §7 | Surface version, tier, tick timestamp, `iv_source` on outputs. Friday snaps already carry `provenance: live_capture`. |

---

## 5. Boundary attestation (India)

- [x] No MSC **source** files opened for copying; design read only (architecture + Work Pane / vol-mode docs listed above).
- [x] No MSC imports, vendored modules, or copied functions are proposed for the Labs implementation.
- [x] Any formula reused is a *published* one (Black–Scholes / CRR — bibliography H1) or re-derived in OPF Spec v0.2.1, not lifted from MSC `realtimeClient`.
- [x] MSC named only in this assessment and the DL entry — never in Labs surface **API** names (`surfaceModel`, OPF packs, `iv_source`).
- [x] Existing Labs file `useRiskGraphCalculations.ts` (header admits transplant) is **out of the official surface** and is listed in §3 to retire from authority — not a precedent to copy more.

---

## 6. Open decisions for Coach

| # | Decision | Options |
|---|---|---|
| 1 | Does the Labs surface replace the Analyzer's current per-leg modeler or *become* it (same object, extended)? | **Become it** — Method v0.2 §2 assumes so. SoR = `surfaceModel.ts` + OPF IV/τ. |
| 2 | Silver synthesis: how much of MSC's model-fill logic carries vs a fresh minimal fill? | **Fresh minimal fill.** Carry cascade steps 1–3 + keep-near-zero ITM. Do **not** carry mid-implied, silent 0.20, or unmarked Δσ\*. Assessment §3. |
| 3 | Settlement-instant table per product (AM/PM index options) — surface owns it or OPF? | **OPF** (OPF29 / OD-SESS-3). Surface **reads** `tau_meta`; it does not keep a second calendar. |
| 4 | Surface versioning: semver with the OPF pack registry? | **Yes.** Sheet `quality` + `ivSource` + pack_id@semver + tier. L0–L5 plane. |
| 5 | Parallel pin-to-mid as a **display** flag in Analyzer? | Default **off** for replay. Optional labeled overlay in live Analyzer only. Coach. |
| 6 | Gold chain cadence: tighten standing tap from 5 min → 3–5s this week, or keep 5 min until the week is on disk? | **ACCEPT — tighten now (Coach 2026-08-16 · DL-400).** From Monday **2026-08-17 open**, StudioOne **must** write OPF chain snaps with full greeks at **3–5s**. Prior interval is immaterial. Friday 2026-08-14 stays **5-min** as captured (labeled, not rewritten). Gold plane for Strategy Lab bots. |

---

## 7. Sequence

1. **This document** fills §1–§4 (Coach + seat). Hotel math · India boundary · Alpha implementability sit **beside** — they do not delete Coach rows.
2. Coach Accept / amend OD-1…6.
3. Phase 0 → Juliet drafts the **Labs Surface Spec** (Analyzer per-leg vol modeler v1.0) from this assessment + OPF v0.2.1 + Method v0.2.2 + OT-EF v1.1.
4. Gated build on `surfaceModel.ts` + OPF IV cascade + replay adapter against `day=2026-08-14`. Lands as the engine for Method v0.2.
5. Silver adapter is a **later pack**, tagged, after gold week is accumulating.

---

## Alpha implementability (note, not a build plan)

| Already exists | Must add | Do not touch |
|---|---|---|
| `computeSurfaceSheet` / `sampleSheet` / `evaluatePnlAtSpot` | Gold overlay: replace \(\sigma_i\) / greeks from snap when present | MSC repo |
| OPF cascade + `iv_source` + lock | Replay iterator over `live_capture/day=*/chain/snap-*.json` | `useRiskGraphCalculations.ts` as authority |
| OPF τ + session/print | Two-clock gate on the sheet (live vs residual vs EXPIRED) | MiniTwo (tap is Studio host) |
| Friday gold-ish day + standing tap | Tighten chain cadence only after Coach OD-6 | Invented strikes / silent IV |

**First proof:** one Batman instance on 2026-08-14, per-leg IV from the opening snap, walk `sampleSheet` on the SPY tape (464,585 prints). Distribution later.

---

*Port the design. Keep the thinking, drop the container. Nothing from MSC crosses but understanding.*
