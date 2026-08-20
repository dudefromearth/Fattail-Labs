# Analyzer 2D viewport — return vs hard refresh

**Date:** 2026-08-19  
**Status:** Analysis. **Not BUILD AUTHORITY.**  
**Board:** [`agents/p-az-viewport-return/`](../agents/p-az-viewport-return/)  
**Plan:** [`docs/Options-Lab-Analyzer-Viewport-Return-Hard-Refresh-Full-Agent-Bench-Plan-v1.0.md`](./Options-Lab-Analyzer-Viewport-Return-Hard-Refresh-Full-Agent-Bench-Plan-v1.0.md)  
**Prior program (different splitter):** [`docs/Options-Lab-Analyzer-Viewport-Drag-Scroll-Analysis-2026-08-19.md`](./Options-Lab-Analyzer-Viewport-Drag-Scroll-Analysis-2026-08-19.md) — T8 Autofit · left-click menu. Packet A **W-G has not filed** (`p-az-viewport-2d` `W1-G.md` pending W2/W3/W-G; no `W-G.md`). **This document does not replace Coach’s words there.** It is a new WHAT for the defect that remains. Lock handoff is India’s job (plan RH-B1), not “shipped / lock over.”

**Surface:** Options Lab Analyzer 2D risk graph (`/app/options-lab/analyzer`, Risk tab)  
**Bench:** Juliet (sequence) · India (persistence / layout) · Charlie (as-built) · Echo (gesture) · Kilo (measurement) · Lima (docs) · Delta (gates)  
**Owner:** Coach.

---

## 0. Coach law (verbatim · nothing dropped)

| When | Coach |
|------|--------|
| Start | After **Hard refresh** it works. After going to **another view** and coming back, the viewport is **blank**. Have to click **hide/show** for the position to reappear, then **can't drag or scroll**. |
| Sharpen | The **entire viewport** is blank, not just the position. |
| After keep-2D work | When I returned to the page the **position was there**, but I **still can't drag and scroll**. |
| Splitter | It **only** returns drag and scroll after a **hard refresh**. |
| Binding (this program) | **Works after a hard refresh. Stops working after moving away and coming back. That is it.** |

Coach Content Law: those sentences stay. Reviewer notes are labeled. This program’s **acceptance** is the last row: after leave-and-return, **drag and scroll work without a hard refresh**. The earlier blank-pane sentences stay as history of the same session; they are not deleted.

**Juliet does not invent WHAT.** “Moving away” is not collapsed to one route in this analysis. Coach used: another view · coming back · returned to the page · moving away. Paths that match those words are listed in §3. Which path Coach used on the failing machine is **not measured** until W0-M.

---

## 1. Splitter (the only diagnostic)

| After | Drag | Scroll (wheel zoom) | Position in the pane |
|-------|------|---------------------|----------------------|
| Hard refresh | Works | Works | There |
| Move away and come back | Does not work | Does not work | There (current Coach report) |

Anything that does **not** change across that pair is **not** this bug.

Hard refresh (browser): new JS process, all modules re-evaluate, every `window` / `document` listener from the old page is gone, React trees are new, WebGL contexts are gone, pointer capture is gone.

Move away and come back (in this app, without hard refresh): Next.js App Router **client navigation** inside `/app/options-lab/*` **keeps** `layout.tsx`. The page child unmounts and remounts. **Module-level `let` / `const` in client bundles keep their values.**

That pair is as-built. See §4.

---

## 2. Measured (command / file · not assertion)

### 2.1 As-built that survives leave/return and dies on hard refresh

Traced in source (SPA inside Options Lab: Analyzer ↔ Heatmap / Volume Profile / Surface **page**):

| Survivor | File | What it is |
|----------|------|------------|
| `OptionsLabProvider` | `web/app/app/options-lab/layout.tsx` | Layout does **not** unmount on suite nav. Symbol/universe React state stays. |
| `stickyView` | `web/components/options-lab/risk-graph/PnLChart.tsx` | Module `let`. View + `userAdjusted` + `painted`. Written on pan/zoom/unmount. Read on next `PnLChart` mount. |
| `graphCache` / `keepWarm` | `web/lib/options-lab/useOpfRiskGraph.ts` | Module cache + `setInterval` keep-warm. `onTick` cleared when subscriber count hits 0. Job may continue until TTL. |
| `getMarketSocket()` singleton | `web/lib/market/MarketSocket.ts` | Tab singleton. Not recreated on Analyzer remount. |
| `sharedUniversePoll` interval | `web/lib/market/sharedUniversePoll.ts` | Module `intervalId`. |

Traced: Analyzer **page** unmounts on suite nav (`web/app/app/options-lab/analyzer/page.tsx`). `PnLChart` unmounts. Its `useEffect` cleanup **does** `removeEventListener` on the host + `window` `pointerup`. That cleanup runs only if that effect ran and returned a function. If the effect hit `if (!host) return` with **no cleanup**, no listeners were bound and none are removed — a **new** mount must bind.

### 2.2 As-built gesture bind (current tree)

`PnLChart` binds **native** `wheel` (`passive: false`, **capture**) and `pointerdown` / `pointermove` (**capture**) on the chart host, plus `window` `pointerup`. Canvas CSS is `pointer-events: none`; hits are intended for the host. `data-wheel-bound="1"` is set when that effect attaches.

Risk pane vs Surface tab (current tree): 2D host **stays mounted** (hidden + `inert` while Surface). SurfaceViewport **unmounts** on Risk (`viewportMode === "surface"` conditional).

Analyzer page: `<Suspense fallback={null}>` around `OpfRiskAnalyzer` (uses `useSearchParams`).

### 2.3 Automated Chromium (this session)

Harness: `web/e2e/analyzer-viewport-hit-probe.spec.ts`  
Evidence file: `web/test-results/analyzer-hit-probe.json`  
Browser: Playwright Desktop Chrome. Seed: unlisted 5990/6010/6030 fly (not OPF-held). **Real** `page.mouse.down/move` and `page.mouse.wheel` (not `dispatchEvent` on the host).

| Step | `vp.inert` | Hit top (`elementsFromPoint` center) | Real drag `viewX` changed | Real wheel ticks |
|------|------------|--------------------------------------|---------------------------|------------------|
| After hard `reload` | `false` | `pnl-chart-host` | yes | 0→8 |
| On Surface tab | `true` | `analyzer-surface-viewport` | not run | — |
| Surface → Risk (same Analyzer mount) | `false` | `pnl-chart-host` | yes | 8→16 |
| Heatmap link → Analyzer link (SPA remount) | `false` | `pnl-chart-host` | yes (ticks 0→1, new instance) | 0→8 |

Host box in that run: **902×300**. 300 is the host `minHeight: 300px`, not the full flex pane.

**This harness PASSES the splitter.** Coach’s machine **FAILS** the splitter. Those two facts stand together. The harness does **not** falsify Coach. It falsifies the claim that *this* Chromium + seed + Heatmap-link path is Coach’s failure.

### 2.4 What that harness did not run

Not measured (no pass/fail):

- Safari / Coach’s actual browser  
- Trackpad / `wheel` vs `mouse.wheel` vs ctrl-pinch  
- Listed OPF butterfly (Create 20-wide at spot) so Surface 3D `initScene` actually appends a canvas  
- `/app/options-lab/surface` (suite Surface **page**, `surfaceScene/index.ts` listeners) then Analyzer  
- Browser **Back** (`pageshow` / bfcache)  
- Browser **tab** hide/show (`visibilitychange` only)  
- Volume Profile round-trip  
- Coach’s live book (held generation, real tent)

---

## 3. Leave/return paths (Coach words mapped to as-built · not a pick)

| Path | Matches Coach words | Layout provider | Analyzer / PnLChart | Hard-refresh-only survivors |
|------|---------------------|-----------------|---------------------|-----------------------------|
| A. Risk ↔ Surface **tab** | “another view” | Stays | Analyzer stays; 2D stays (hidden); SurfaceViewport unmounts | `stickyView`, keep-warm, socket; **inert** was true on 2D while Surface |
| B. Suite nav Heatmap / VP | “moving away”, “returned to the page” | **Stays** | Page + PnLChart **unmount/remount** | Provider, `stickyView`, cache, socket, keep-warm |
| C. Suite nav `/surface` | “another view” | Stays | Analyzer unmounts; SurfaceApp + `surfaceScene` mount | Same + 3D host listeners if dispose skipped |
| D. Other Labs app (`/app/...`) | “returned to the page” | Options Lab layout **unmounts** | Full unmount | Socket singleton, any module `let` still in the tab |
| E. Browser tab / window | “coming to the window” | Nothing unmounts | Nothing unmounts | `visibilitychange` handler in PnLChart (draw + maybeAutofit) |
| F. Browser Back | “coming back” | bfcache possible | Frozen listeners possible | Process not killed — **same as “not hard refresh”** |

W0-M must mark **which of these Coach used** when drag died, or run **all of them** until one **FAILS** the splitter.

---

## 4. Hypotheses that **predict the splitter**

A hypothesis belongs here only if: hard refresh → gestures work **and** leave/return → gestures do not, **and** the position can still be visible.

| ID | Hypothesis | Predicts splitter because | Open / closed |
|----|------------|---------------------------|---------------|
| R1 | Native bind `useEffect` hits `if (!host) return` on remount; no listeners; hard refresh layout is ready so bind succeeds | SPA remount timing ≠ full load | **Open.** Paint on return implies a host existed for `useLayoutEffect` draw; the **listener** effect is a **different** effect. Not closed. |
| R2 | `inert` (or `pointer-events: none` / `visibility`) left on the Risk pane after Surface tab | Surface sets `inert: true`; omitting the prop on Risk may not clear it in Coach’s browser | **Open on Coach’s browser.** Chromium probe: after Surface→Risk, `inert === false` and drag worked. |
| R3 | Pointer capture held on a **detached** host after leave; new host never gets moves | Capture is not released in cleanup; hard refresh drops it | **Open.** Explains **drag**. Does **not** by itself explain **wheel** (wheel is not pointer-capture). Coach’s splitter is **both**. So R3 alone is **insufficient**. |
| R4 | A 3D/WebGL canvas still in the tab (`initScene` `appendChild`, or `surfaceScene` host) sits in the hit stack after return | Hard refresh destroys GL; SPA may not if dispose skipped | **Open.** Chromium seed never built Surface 3D (`!legs.length` path). Not measured with a listed structure. |
| R5 | `window`/`document` listener from 3D (`alpha.js` resize is removed on dispose; wheel is on host) leaked | Hard refresh clears window | **Open** iff dispose did not run. `SurfaceScene3D` cleanup **does** remove host wheel. `surfaceScene.dispose()` **does** remove canvas+host wheel. Not measured if a path skips dispose. |
| R6 | `stickyView.userAdjusted` + a post-return Autofit or NaN range makes pan/zoom a no-op **feel** | Module `let` dies on hard refresh | **Open as “gestures run but view does not move.”** Probe after SPA: `dragTicks` and `wheelTicks` **incremented** and `viewX` **changed**. That closes R6 **for the Chromium seed path**. Not closed for Coach. |
| R7 | Browser Back / bfcache restores the page without re-running `useEffect` binds | Hard refresh is not bfcache | **Open.** Not in the harness. |
| R8 | `keepWarm.onTick` or socket delivers into a **stale** setter; not a gesture bug | Does not steal pointer | **Does not predict** lost drag **and** scroll. Out. |
| R9 | Market Bus singleton / extra WS | Does not steal pointer | **Does not predict.** Out. |
| R10 | T8 Autofit / left-click alert menu (Packet A original) | Hard refresh would not uniquely fix left-click menu | **Does not predict this splitter.** Packet A may still be correct for the *old* intermittency. Out **as the cause of this splitter.** |

No row in this table is marked **the** cause. Rows that do not predict the splitter are **out**. Rows that predict it stay **open** until a FAIL matches Coach.

---

## 5. Prior program — what it did and what it is not

Packet A (`p-az-viewport-2d`) addressed: live Autofit stealing the view; left-click opening the alert menu; React 19 passive `onWheel`. That matches an **intermittent immovable tent on a live session**, not “dead until hard refresh.”

Follow-on patches in the same files (keep 2D mounted, native capture listeners, remount paint) targeted **blank pane** and **Surface WebGL steal**. Coach then reported: **position is there; drag/scroll still dead until hard refresh.**

Those patches are not erased. They are **not accepted as closing this splitter.**

---

## 6. Acceptance (this program)

After **any** leave-and-return Coach uses in daily Analyzer work:

1. The 2D pane is not blank (already Coach-confirmed on last return).  
2. **Left-drag pans** the position (no hard refresh).  
3. **Wheel zooms** the strike axis (no hard refresh).  
4. A characterization test **fails on main** for that same leave/return, then **passes** after the fix. “Playwright passes on a seed that never failed for Coach” is **not** acceptance.

---

## 7. First work (not a fix)

**W0-M (Kilo):** produce **one** automated or Coach-instrumented FAIL that matches §1. Until that FAIL exists, Charlie does not change product code for this splitter.

Measurement order (all recorded: hit stack, `data-wheel-bound`, `data-drag-ticks`, `data-wheel-ticks`, `viewX`, `inert`, `elementFromPoint`):

1. **Coach’s path first** (W0-0 named A–F, Coach’s order). Tab-within-app, suite route, browser tab, Back, minimize are different lifecycles.  
2. Then remaining §3 paths. Listed Create 20-wide at spot (not only the unlisted seed).  
3. Suite **Surface page** then Analyzer.  
4. **page.goBack()** (bfcache).  
5. If still green: instrument Coach’s session (`data-wheel-bound` / ticks on the host — already in DOM) and read them **instead of guessing**. If A–F are green and Coach still fails → W0-M **BLOCKED**, Coach at the machine.

India: no architecture change until W0-M names the survivor in §2.1 or a new survivor with evidence.

---

## 8. Out of scope (this analysis)

- Packet B strike handles  
- MiniTwo / production deploy  
- Reopening What-If W2  
- Inventing listed strikes  
- Declaring Surface WebGL, `inert`, or `stickyView` **the** bug without a FAIL
