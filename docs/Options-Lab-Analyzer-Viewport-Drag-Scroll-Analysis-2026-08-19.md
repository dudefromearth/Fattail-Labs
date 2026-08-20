# Analyzer 2D viewport — drag and scroll feel immovable

**Date:** 2026-08-19  
**Status:** Analysis + proposed fix. **Review-folded** (VP-B1 stamped · VP-A1–A3 advisory).  
**Bench:** [`docs/Options-Lab-Analyzer-Viewport-Drag-Scroll-Full-Agent-Bench-Plan-v1.0.md`](./Options-Lab-Analyzer-Viewport-Drag-Scroll-Full-Agent-Bench-Plan-v1.0.md) · board [`agents/p-az-viewport-2d/`](../agents/p-az-viewport-2d/).  
Packet A is **GO-able** after W0-BA (or impl stamp + DL). Packet B waits. **Not BUILD AUTHORITY** until Coach GO.  
**Surface:** Options Lab Analyzer 2D risk graph (`/app/options-lab/analyzer`, Risk tab)  
**Bench:** Charlie (code) · Echo (interaction) · Kilo (edges / tests)  
**Owner:** Coach. Juliet sequences. Charlie implements. Echo reviews hits/cursors. Kilo writes characterization. Lima spec/DL on ship (VP-A3). Delta gates.

**Review fold (2026-08-19):** External advisor. **VP-B1** blocking (sequencing, not content) — stamped below. **VP-A1–A3** advisory. Coach Content Law: original “shown book” lock-clear sits beside VP-A1; it is not erased.

**Symptom (Coach):** In most cases the member cannot drag a position in the viewport and cannot scroll to stretch or compress the strike axis. In less frequent, less obvious cases both work. Intermittent.

---

## Verdict

Two independent defects stack. Viewport notices are **not** eating events (`pointer-events-none`). The chart is not missing pan/zoom code.

1. **Autofit undoes pan and wheel** on live ticks (primary reason zoom feels dead).  
2. **Left-click on the tent opens the alert menu** and never starts pan (primary reason grabbing “the position” feels glued).  
3. **Strike-tick drag is unwired** in Analyzer (always off — does not explain “sometimes works”).

MSC’s transplanted chart already had the first two lessons: alerts on **right-click**; sticky `viewState` after the member takes the view. Analyzer 2D reintroduced both failures.

Surface 3D already has the autofit law Analyzer 2D violates: Autofit only on **book change** and the **Autofit button** (`autofitShouldRun`; AT-AF-7: live spot / What-if / playhead must not Autofit). This packet brings 2D under that **same** law (one law, two surfaces). Packet A step 1 (left-click never a menu) is **§1.14.3 conformance**, not a spec change — as-built left-click-on-tent is the deviation.

---

## Coordination (VP-B1 · Juliet stamp)

Same shape as What-If **PL-B1**: exclusive file lock while a packet is open, so Delta can attribute a regression.

| Packet | Exclusive lock | State |
|--------|----------------|--------|
| What-If **W2** Analyzer inspector | `OpfRiskAnalyzer.tsx` + Controls + `localBookCurves` | Claim: closed. **India W0-2 proves it from that board’s artifact** (not this table). Does **not** reopen for Packet A. |
| **Packet A** (this program) | `web/components/options-lab/risk-graph/PnLChart.tsx` **only** | **NEXT** on Coach GO. May fire **now** because W2 is closed and A does not touch `OpfRiskAnalyzer.tsx`. |
| **Packet B** strike-handle wiring | HUD-wire slice of `OpfRiskAnalyzer.tsx` + listed-grid commit | **After Packet A.** After Echo grammar review. Must not run in parallel with any other `OpfRiskAnalyzer` packet. |

**Behavioral hinge (AT-2D-AF-7):** What-If W2 already makes Enable + knobs rebuild the sheet. Packet A asserts those rebuilds **must not Autofit**. That assertion lives in `PnLChart` (T8 / `userAdjustedView`), not in W2. Do not reopen W2 to “help” AF-7.

**Order (stamped):** W2 (done) → **Packet A** → Packet B. Not assumed — written here. Delta W-G for Packet A reviews `PnLChart.tsx` + 2D autofit tests only.

---

## Intended grammar (Echo)

Member job: grab the position on the strike axis and drag it; scroll to stretch or compress strike scale. Professional-chart feel. HIG: no stolen gestures, no overlay eating events.

| Gesture | Intended |
|---------|----------|
| Drag in the plot (including the tent) | Pan X/Y |
| Scroll | Zoom **X** (strike) about the pointer |
| Shift+scroll | Zoom **Y** |
| Drag bottom pad | Scale X |
| Drag left pad | Scale Y |
| Drag amber strike tick on the zero line | Reposition a **listed** strike (OPF grid; Shift = whole package) |
| Auto-fit | First paint · structure/book change · **explicit Auto-fit** — then **sticky** view |
| Alerts | **Right-click** only. Blank plot → price alert. Near curve → position alert |

Analyzer spec §1.14.3 matches right-click for alerts. As-built left-click on a hovered curve is a menu.

---

## As-built (Charlie)

Files:

- `web/components/options-lab/risk-graph/PnLChart.tsx` — pan, wheel, strike-handle, autofit effects  
- `web/components/options-lab/OpfRiskAnalyzer.tsx` — how `PnLChart` is wired (~1162)  
- `web/lib/options-lab/useOpfRiskGraph.ts` — 2.5s live sheet while the plane is printing  
- `web/lib/risk-graph/pricing/autofitView.ts` — ATM-centered fit math (not the bug; **when** fit is called is the bug)  
- Contrast: `web/lib/risk-graph/surfaceAutofit.ts` (`autofitShouldRun`)  
- MSC reference (read-only, no copy): `strategy-lab-proto/msc-risk-graph-ui/src/ms-transplant/components/PnLChart.tsx`

`PnLChart` **contains** pan, X-zoom, axis-drag, and strike-handle drag. Analyzer **wires alerts and autofit**, **does not wire strike-handle drag**, and **assigns left-click on the tent to the alert menu**.

---

## Root cause 1 — Autofit wipes pan and scroll

`autoFit()` is `viewState.current = calculateFitBounds(); draw()`. Wheel and drag write `viewState`. Autofit **replaces the whole window**.

Analyzer rebuilds the local 161-pt sheet every **2.5s** in focus while Live/Extended (`OPF_POLL_MS`, `pollLive: planePrinting`). Each sheet recomputes expiration breakevens (`findBreakevens`). Those prices are interpolated floats, hashed as `.toFixed(2)`.

```text
PnLChart.tsx ~1400–1412
  expBeHash = expirationBreakevens.toFixed(2).join
  on hash change: if !isStrikeDragging → autoFit()
```

A debit tick of a few cents, or a 1-pt spot recenter of the sheet, routinely changes the hash. **Pan (`isDragging`) is not gated. User zoom is not gated.** Only strike-drag is skipped.

A ~3% scroll-zoom is erased on the next poll. It feels like scroll does nothing.

Other autofit triggers (Kilo T1–T9):

| ID | Trigger | Live poll? | Gates strike-drag? | Gates pan/zoom? |
|----|---------|------------|--------------------|-----------------|
| T1 | Mount + 100 ms | Once | No | No |
| T2 | First ResizeObserver size | Once | No | No |
| T3 | `strikes.join(',')` | Only if strike list/order changes | Yes | **No** |
| T4–T5 | GEX / VP | Analyzer does not pass these | — | — |
| T6 | `spotPrice` first / drift `min(1%, 50 pts)` | Rare under smoothed ATM | Yes | **No** |
| T7 | `seriesLen` (four series lengths) | First paint, empty↔curves, Show/Hide | Yes | **No** |
| T8 | `expBeHash` (cent BE change) | **Yes — primary live reset** | Yes | **No** |
| T9 | Controls Autofit button | Click only | — | Intentional |

New curve **y-values** with the **same length** only `scheduleDraw()` — good. The killer is **T8**, not every PnL tick.

`useSmoothNumber` (~420 ms) on `axisSpot` re-renders often but T6 compares consecutive **smoothed** steps to 50 pts / 1%, so easing almost never trips T6. What-if Time/Vol/Spot% **does** rebuild the sheet → new BEs → T8 (Surface AT-AF-7 forbids Autofit on What-if; 2D does it anyway).

MSC transplant: `autoFitOnStrategyChange={false}` and **no** T7/T8. Proto already noted: *autofit after every drag makes the scale jump; sticky viewState is the fix.*

---

## Root cause 2 — Left-click on the tent steals the drag

`CURVE_HIT_DISTANCE = 8`. Hover within 8 px of expiration or T+0 sets `hoveredCurveRef`. Cursor becomes `pointer`.

Canvas `onMouseDown` (left button):

```text
PnLChart.tsx ~1483–1500
  if (hoveredCurveRef.current) {
    setContextMenu(...)   // Position Alert sheet under the cursor
    return                // never isDragging
  }
  handleMouseDown(e)
```

Grabbing the tent (the thing the member calls “the position”) is the usual click. That path **opens the 220 px alert menu and never pans**. The menu (`z-index: 50`) then **owns the pointer**. Move = hover the menu, not the chart. Leave the menu and it vanishes. Feels glued.

MSC already fixed this: left-drag always pans; alerts stay on `onContextMenu`.

Analyzer notices (UPDATING / CHECK LEGS / empty book) are `pointer-events-none`. Innocent. The context menu is the overlay.

---

## Root cause 3 — Strike-handle drag is not connected

`PnLChart` supports `strikeToStrategyId` + `onStrikeDrag`. Hit test requires the map (`if (!sMap) skip`; `if (!stratId) continue`). Analyzer **passes neither**.

Tick-drag cannot start. MSC `RiskGraphPanel` does pass both. Analyzer legs already move from the book **↑/↓** via `shiftCardStrikes` (listed grid only, DL-309).

This is **always** dead, not intermittent. It does not explain “sometimes it works” unless Coach meant **pan** (empty plot / axis pads).

Hit box today is **15×15 px** on the zero line (not 44 pt). After a hard Y zoom, `zeroY` can leave the plot and **all** tick hits fail (FM-ZERO-OFFSCREEN).

---

## Coach repro (sharpened)

Hard refresh → **can** drag and scroll. Then **any** of: switch Risk/Surface (or leave Analyzer and come back), **or add another position** → **cannot** drag or scroll.

That is not a third root cause. It is causes 1 + 2 in sequence:

1. **First paint** often has no curves yet, or one small tent and lots of empty plot. Left-drag hits empty grid → pan starts. Wheel hits the canvas → zoom writes `viewState`. Feels fine.
2. **Switch view** unmounts `PnLChart` (Risk ↔ Surface is a ternary). Return remounts with **keep-warm cache** — full expiration + T+0 already painted. Cursor on the tent is `pointer`. Next left-click opens the **Position Alert menu under the pointer** and never sets `isDragging`. Wheel then hits the **menu** (`z-index: 50`), not the canvas — scroll looks dead too.
3. **Add a position** does not need a remount. A second structure adds more polylines. The 8 px curve hit covers most of the useful plot. Same menu steal. `strategyHash` / more BEs also fire **T8 Autofit**, so any zoom that does reach the canvas is wiped on the next 2.5 s poll.

So: refresh = sparse plot + no menu. After “anything” that puts a live tent under the cursor = menu owns the gesture, Autofit owns the window.

---

## Why it feels intermittent

| Usual (fails) | Less obvious (works) |
|---------------|----------------------|
| Plane **Live/Extended** → 2.5 s poll → BE hash change → Autofit snaps X/Y back | Plane **Held/Closed** (`pollLive` false) or ladder `unchanged` → zoom/pan stick |
| Pointer **on the tent / T+0** (most of the useful area) → left-click = menu, not pan | Pointer on **empty grid** or **X-axis pad** → pan / axis-drag starts |
| Quiet tape: `toFixed(2)` happens not to change for a few polls → one zoom “takes” | Next print that moves BE ≥ 0.01 → view jumps to ATM fit |
| Mid-pan, a poll can still `autoFit` (`isDragging` not checked) | Between polls a fast pan looks alive, then dies |
| Empty book (no curves) never hits the curve branch | Shell **pans**; axes never hit the curve branch |

React 19 registers delegated `wheel` as **passive**. `e.preventDefault()` on `onWheel` does not cancel browser zoom/scroll. The handler **still mutates `viewState`**, so “dead zoom” is usually **reset (T8)**, not “handler never fired.” “Zoom fights the page” is the passive listener. Surface 3D already uses a native `{ passive: false }` listener (`SurfaceScene3D`, `TimeOrthoLiveChart`).

Not the cause: Risk vs Surface tabs (Surface unmounts `PnLChart`). Book-height splitter. Backdrop and crosshair (`pointerEvents: 'none'`). Parent `overflow-hidden` (clips some bubble-scroll, not the Autofit snap).

---

## Proposed fix (Packet A GO-able · Packet B waits)

**Packet A files:** `web/components/options-lab/risk-graph/PnLChart.tsx` only (VP-B1). Plus Kilo helpers/tests next to it. **Out of A:** `OpfRiskAnalyzer.tsx`.

Do **not** change `/resolve`, OPF τ, or invent strikes from a free canvas drag (DL-309).

### Packet A — Restore pan and sticky zoom

1. **Left-click always pans / axis-zooms.** Delete the `hoveredCurveRef` → `setContextMenu` / `return` block. Alerts stay on **right-click** (`onContextMenu` already exists). Menu must not appear on `pointerdown` under the cursor. **§1.14.3 conformance** — no spec version bump for this step; Lima honesty note on ship (VP-A3).

2. **`userAdjustedView` lock.** Set `true` in `handleWheel` and when pan / X-axis / Y-axis drag actually writes `viewState`. Clear only on:
   - imperative `autoFit()` (Controls **Auto-fit**),
   - genuine **structure** change (legs added/removed, listed strikes changed).

   **Original text (kept):** lock also cleared on `strategyHash` / “shown book.”  
   **VP-A1 (advisory · Echo must rule before Charlie encodes):** if “shown book” includes Show/Hide of T+0 or expiration, a member who zooms then hides a series gets snapped to ATM — the same stolen-view feeling. **Juliet proposes:** Show/Hide = `scheduleDraw()` only; lock clears on structure change, not curve visibility. Echo stamps before Packet A lands that branch.

3. **Gate every autofit effect.** After the member has moved the view, `expBeHash` (T8), `seriesLen` (T7), and spot drift (T6) only **`scheduleDraw()`**. Keep first-paint + first-curves fit (MSC `hasCurvesFitRef` pattern). Mirror Surface: `autofitShouldRun2d("live-spot" | "what-if") === false` (**AT-2D-AF-7** — What-If W2 rebuilds must not Autofit).

4. **Native wheel** on the chart host: `addEventListener("wheel", onWheel, { passive: false })` with `preventDefault` + `stopPropagation`. Keep X-only zoom; Shift = Y. **VP-A2:** current **3% per tick stays** in Packet A acceptance. Larger step is Echo feel, not a defect; do not gate Delta on taste.

5. **Pointer capture** on pan so the drag does not die on `mouseLeave`. Floor axis-zoom so `xMin === xMax` cannot NaN (`AUTOFIT_MIN_HALF_PTS`).

Toolbar **Auto-fit** remains the way back to ATM + ½-viewport BEs after the member has taken the view.

### Packet B — Listed strike handles (follow-on; Echo grammar)

Do **not** invent strikes. Wire `strikeToStrategyId` + `onStrikeDrag` through the same law as `shiftCardStrikes`: OPF-listed grid, representable or no-op, unlock and atomic re-bind on commit. Fat hits (≥ 44×44 pt) on zero-line ticks (and/or a vertical rail through each shown strike). Shift-drag = whole package. **Do not Autofit on drop.** Map keys must be exact listed strikes (float mismatch → silent pan).

Charlie must not invent a third gesture set. Echo reviews hits/cursors before Delta.

---

## Tests (Kilo)

There are **zero** `PnLChart` / 2D autofit / strike-drag tests today. Surface tests lock the opposite law (`autofitShouldRun("live-spot") === false`). Prefer pure helpers (same style as `surfaceAutofit.test.ts`) plus a thin view-state harness. Do not rely on Playwright for the first lock.

**First test (would fail today):** user wheel-zoom, then feed `expirationBreakevens` with a cent-level change; `viewState` must stay (must **not** equal `calculateFitBounds()`).

| ID | Assert |
|----|--------|
| **AT-VS-1 / AT-2D-AF-1** | Zoom, then jittered exp BEs → window **not** ATM-fit |
| **AT-2D-AF-2** | Same BE hash, new curve y, same `seriesLen` → no fit |
| **AT-2D-AF-3** | BE `5999.994` → `6000.005` changes `toFixed(2)` hash |
| **AT-2D-AF-7** | What-if / live-spot must not Autofit 2D |
| **AT-2D-AF-9** | `isDragging` + T8 must not fit (today fails) |
| **AT-2D-AF-10** | `isStrikeDragging` + T8 must not fit (today passes) |
| **AT-WH-1** | Mount spies `addEventListener('wheel')` with `{ passive: false }` |
| **AT-CLICK-1** | Left-click on hovered curve **pans**; no menu |
| **AT-CLICK-2** | Right-click still opens alerts |
| **AT-AF-BTN** | Autofit button / `ref.autoFit()` resets to fit bounds |
| **AT-AZ-WIRE-1** | Analyzer today: **no** `strikeToStrategyId` / `onStrikeDrag` (lock “not shipped” until Packet B) |

---

## Failure-mode table (Kilo)

| ID | Symptom | Mechanism |
|----|---------|-----------|
| **FM-BE-POLL** | Wheel/pan rubber-bands every ~2.5 s | T8 `expBeHash` → `autoFit()`; pan not gated |
| **FM-WHATIF** | Zoom dies while What-if knobs move | New sheet → new BEs → T8 |
| **FM-CURVE-STEALS** | Grab tent → menu, no pan | Left-click + `hoveredCurveRef` |
| **FM-WHEEL-PASSIVE** | Chart zoom fights page/browser zoom | React 19 passive `wheel` |
| **FM-STRIKE-UNWIRED** | Ticks never grab | Props omitted |
| **FM-NO-CAPTURE** | Fast pan dies at canvas edge | No `setPointerCapture`; `mouseLeave` ends drag |
| **FM-RANGE-COLLAPSE** | After hard axis-drag, pan/zoom NaNs | Zoom factor ≤ 0; no min range |

---

## Out of scope for Packet A

- Canvas strike-handle → `shiftCardStrikes` (Packet B).  
- Passing `oneSigmaBandWidth` / `autofitProfile` (wrong window, not dead controls).  
- Touch / iPad (mouse-only today).  
- Surface 3D camera / T Ortho (separate grammar; already sticky Autofit).  
- Copying MSC code. Re-derive the sticky-view and right-click rules in Labs.

---

## Lima on ship (VP-A3)

Same body of work as Packet A code (documentation parity / invariant #6):

- Analyzer Spec §1.14.3 honesty: left-click is pan; alerts are right-click (as-built deviation closed).  
- New 2D sticky-autofit rows: Autofit = first paint · structure change · Auto-fit button; **not** live tick / BE jitter / What-if / smoothed spot. Cite Surface AT-AF-7 — **one law, two surfaces**.  
- `Architecture/00-decision-log.md` DL: 2D now carries the same autofit law as Surface.  
- This analysis status → implemented / DL cited. Spec stays validatable without reading code.

---

## Ship meaning

After Packet A: grabbing the tent pans; scroll stretches/compresses strike and **stays** through live prints and What-if rebuilds; right-click still sets alerts; Auto-fit is the only snap-back. After Packet B: listed-grid handles move the package without inventing strikes.

**GO Packet A** after Coach fire. Echo VP-A1 (Show/Hide vs structure) before Charlie encodes that branch. Packet B waits on Echo grammar + this A landing.
