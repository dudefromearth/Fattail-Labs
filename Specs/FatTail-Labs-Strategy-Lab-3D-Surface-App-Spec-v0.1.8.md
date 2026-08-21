# FatTail Labs — Options Lab 3D Surface App Spec v0.1.8

**Status:** DRAFT / DESIGN — **not BUILD AUTHORITY**. Coach has not given GO.  
**Date:** 2026-08-16  
**Content version:** **v0.1.8**  
**Filename:** `FatTail-Labs-Strategy-Lab-3D-Surface-App-Spec-v0.1.8.md`  
**Content integrity:** sha1 of body excluding this line: `432b79faea9e875bf525c7ab45267c0914ce3208`.  
**Type:** Product + interaction design for a Labs-native 3D P&L Surface  
**Home:** Options Lab · route `/app/options-lab/surface` (DL-411; supersedes S1)  
**Complements:** Options Lab **Analyzer** (`/app/options-lab/analyzer`)  
**Engine:** `web/lib/risk-graph/surfaceModel.ts` (DL-391) — per-leg volatility  
**Parents:** [MSC 3D Surface Design Port Assessment](../docs/Options-Lab-MSC-3D-Surface-Design-Port-Assessment-2026-08-16.md) · **DL-399** · **DL-409** · **DL-410** · **DL-411** · **DL-412** · **DL-445** · Method v0.2.2 §2 · OT-EF v1.1 · OPF Spec v0.2.1 §3.7 / **OPF29** · DL-364 / 379–381 / 391  
**Architecture:** [`Architecture/33-strategy-lab-3d-surface.md`](../Architecture/33-strategy-lab-3d-surface.md)  
**Technical contract:** [`FatTail-Labs-Strategy-Lab-3D-Surface-Tech-Spec-v0.1.md`](./FatTail-Labs-Strategy-Lab-3D-Surface-Tech-Spec-v0.1.md)  
**Supersedes path:** [`FatTail-Labs-Strategy-Lab-3D-Surface-App-Spec-v0.1.md`](./FatTail-Labs-Strategy-Lab-3D-Surface-App-Spec-v0.1.md) (stub only)  

**This document ports MSC *design thinking only*.** No MSC source, no vendor, no copy of
`RiskGraph3DView`, `realtimeClient`, `sharedRiskSurface`, or proto
`alpha.js` / `charlie.js` / `echo.js` as the product scene. If a WebGL scene is
built later, it is re-derived from the Labs sheet contract below.

---

## 1. What this app is

**Coach intent (2026-08-21, verbatim — do not drop · DL-509):**

> The surface should be a simple alternate view of the Canvas in the Analyzer.

> And the T Ortho is a surprise view within the Surface. An Ester Egg view.

Recorded as **intent of this view**. No implementation from that statement
in the same body of work. Surface = **simple alternate of the Analyzer
canvas**. **T Ortho** = surprise / Easter Egg **inside** Surface, not a
second product.

An **Options Lab app** whose job is to show the **primary surface**: the 3D
real-time P&L tent of the **shown listed book** (DL-381 · §4.7 · DL-394).

The **shape** comes from **per-leg volatility** (DL-380). Analyzer builds and
inspects the book (2D risk graph, builder, ToS, cards). Surface **grows up
beside that builder** — the same shown structures on the sheet. Hold/fold
reads this shape, not a flat-vol cartoon.

**North star:** real package P&L down to the last minute of 0DTE —
per-leg listed IV, no fallbacks, fail loud when the tape does.
No other honest object in the suite.

```text
Analyzer (Options Lab)          Surface (Options Lab) — first home
  build / edit / 2D risk    →     3D tent of the shown listed book
  OPF-held legs + IV                surfaceModel.ts sheet
                                         │
                                         ▼
                              Strategy Lab consumers (DL-410)
                              backtest time machine · mini tape-walk
```

One calculator. Options Lab is the first home. Strategy Lab consumes.
No second pricer.

---

## 2. What it is not

| Not | Where that lives |
|---|---|
| MSC code or a transplant of the Work Pane 3D view | Forbidden (DL-399) |
| A new life-cycle **phase** (Design / Curate / Deploy) | Those stay the board |
| A second IV engine (Heston, regime presets, silent 0.20) | Dropped in the assessment §3 |
| The Analyzer builder, ToS paste, or 2D risk graph | Analyzer |
| Volume profile / GEX **as pricing** | Overlays later, beside the tent |
| Method v0.2 backtest **runner** chrome | Strategy Lab **consumer** of this sheet (DL-410) — not a second engine |
| Mini tape-walk presented as the MC result | Forbidden — label **day walking · n of N**; no P&L hero number; the result is the distribution |
| MiniTwo / production market plane work | Out of this spec |

---

## 3. As-built (honest)

| Piece | State |
|---|---|
| Per-leg sheet | **Shipped:** `computeSurfaceSheet` / `evaluatePnlAtSpot` / `expiryFaceTau` / `sampleSheet` (multi-DTE last row = front-exp, **DL-427**) |
| Analyzer 2D risk | **Shipped:** OPF Analyzer |
| Analyzer in-viewport “Surface” tab | Binds **exact / locked** OPF `leg_marks` IV. Missing truth IV → **IV NO**. No sticky 0.20. |
| Design canvas sketch | `SharedSurfaceView` — 2D isometric of the same sheet, not the app |
| Proto 3D scene files | `web/lib/risk-graph/3d/{alpha,charlie,echo}.js` — heritage. **Not** the product scene. Do not grow them. |
| Options Lab suite nav | Volume Profile · Heatmap · Analyzer — **no Surface pill yet** |

---

## 4. Product law (ported design, Labs names)

### 4.1 Axes

The 3D object is **underlier \(S\) × remaining \(\tau\) × package P&L**.

Vol is **not** a displayed axis. Vol is the **parameter that shapes** the
sheet. Each listed leg keeps \(\sigma_i\).

A second face is **expiry** (cyan back wall):

- **Single-DTE:** every leg intrinsic − cost (vol-independent).
- **Multi-DTE (OD-PF2 / DL-427):** front legs intrinsic; later legs
  residual BS at remaining \(\tau\) after the **first** settlement.
  Same-strike calendars are a hump. \(\tau = 0\) on every leg is
  both-dead ≈ −debit (flat) — that is **not** the product expiration
  curve.

Yellow markers = union of **listed strikes** of **shown** structures (§4.7).
**v0.1 implement slice (named, not product law):** one shown structure is
enough for the first bench. Do not encode a focus radio as the tent.

### 4.2 Engine

```text
OPF-held dual-side generation
        │
        ▼
 listed legs + per-leg IV (§4.3 exact/locked only) + τ (OPF29)
        │
        ▼
 surfaceModel.computeSurfaceSheet(legs, { spot, quality: "per_leg_iv" })
        │
        ▼
 WebGL (or later) presentation of that grid
```

- Quality **`per_leg_iv` only** on any member-facing sheet.  
- **`sticky_cli` is forbidden** in product (Coach 2026-08-16: no sticky IV, only the truth).  
- Exact or locked OPF IV per listed leg — or a named hole (`IV NO` / `CHECK LEGS`).  
- Never invent a smile inside the sheet. No silent 0.20.

### 4.3 IV — mark path only (no fallbacks)

Surface bind uses **only** `iv_source ∈ {exact, locked}` on **every listed leg**,
with `iv > 0`. That is per-leg volatility: each contract keeps **its own**
truth IV. Skew is \(\sigma_i \neq \sigma_j\). It is **not** a cascade that
fills holes so every slot has a number.

**Forbidden on this app (live and time machine):**
nearest strike · closest DTE · stored other than `locked` · ATM · VIX/VIX1D
as σ · mid-implied IV on a hole · silent `0.20` · `sticky_cli`.

OPF §5.6 steps 2–6 **do not run** here. That cascade is a foundation pack
path for later **labeled** silver / model modes. It is not a bind fallback.

| Hole | State | Sheet |
|------|--------|--------|
| Strike not on the OPF-held generation | **NOT TRADED** / **CHECK LEGS** | None |
| Listed strike, no exact/locked IV (or `iv ≤ 0` except keep-near-zero below) | **IV NO** | None |
| Generation in flight | **WAITING** / **UPDATING** | None |

**Keep** vendor near-zero ITM IV in \((0, 0.01]\) when `iv_source` is
exact or locked — that is “no extrinsic,” not a missing mark. Do not
replace it with ATM.

Record `iv_source` on the sheet. Missing or any other source → named
hole, no tent, no invented smile.

### 4.4 Marks vs model

| Cell | Authority |
|---|---|
| Package mark at spot (gold) | OPF PackagePricer — representable or named state |
| Shape away from spot | Per-leg model on the sheet |
| Cost basis \(D^*\) | Lock / card debit — not the model |
| Expiry face | Intrinsic − \(D^*\) |

Do **not** apply an unmarked parallel Δσ\* to force model(spot) = mid.
Optional later: a **labeled** “pin-to-mid” display flag. Default off.
Replay never uses it.

### 4.4a Mark vs model (institutional split)

| Layer | Law |
|-------|-----|
| **Mark** | Listed contract IV / package mid at that instant. No interpolation. Fail loud. |
| **Model** | Named smile or flat σ. Later mode only. Must be labeled. **Must not** write the card debit or the spot-cell mark. |

Spot cell (gold) = OPF PackagePricer. Shape away from spot = per-leg model
on **those same truth IVs**, not a second smile. No unmarked parallel Δσ\*.
Pin-to-mid remains default **off**; never on the time machine.

### 4.5 Two clocks

| Clock | Owner | Surface behavior |
|---|---|---|
| τ / settlement | OPF29 | Sheet time axis. After settlement: **held / residual**, never live. |
| EXPIRED | midnight ET after exp date (Law C) | Viewport **ghost** + defined debit. |

One sheet. Two clocks. MSC had only the 16:00 freeze.

**2026-08-18 amendment (Coach · DL-445):** Clocks name the **claim**, not the
workspace. Residual and EXPIRED **never unmount the tent** and never replace
it with a blocking card. The member may inspect a held or ghost residual
sheet at any wall-clock time. HUD `as_of` is `live` · `residual` · `expired`
(or `time machine`). Book clock is **remaining listed life** (every shown
leg), not the front pointer alone — a weekly or calendar back-month stays
analyzable after today’s 0DTE settlement. “Never live” is honesty of the
mark. It is not a lock on analysis.

**EXPIRED look (Coach 2026-08-18 · DL-446):** after midnight ET the shown
expired book stays as a **wireframe with no filled surface** — Analyzer’s
grey ghost in 3D. Same at-expiry residual (defined debit + intrinsic).
Live / residual books keep the solid tent. Mixed book: solid live +
wireframe ghost.

### 4.6 Modes (PB-MODE-0) and the time machine

The surface is **one object**. Mode is a session property.

| Mode | What the number is | First slice |
|------|--------------------|-------------|
| **Live** | Now: \(S,\tau,\sigma_i\) from the live OPF generation + underlier | v0.1 tent |
| **What-if** (forward-analysis) | Frozen bind IVs; member moves \(S\) / \(\tau\) / later vol. **Theoretical decay.** | Later chrome; HUD must say What-if |
| **Time machine** (replay) | Real package P&L at clock \(t\): rebind listed-leg IV, spot, and OPF29 \(\tau\) from the **snap at \(t\)** | Same HUD, later feed (Method v0.2). **This is the hero walk.** |

**Time machine law (normative):**

\[
\mathrm{P\&L}(t)=\sum_i q_i\,u_i\big(S(t),\,\tau(t);\,\sigma_i(t)\big)-D^*
\]

- \(\sigma_i(t)\) = exact/locked IV of **that** listed contract in the snap at \(t\).
- \(\tau(t)\) = OPF29 / OPF Spec v0.2.1 **§3.7** at \(t\) (cite, do not restate).
- \(S(t)\) = underlier print at \(t\).
- If any listed leg lacks exact/locked IV at \(t\) → **IV NO** at that instant.
  The machine does **not** interpolate through the last hour of 0DTE.
- After that contract’s settlement instant → residual sheet, **never live** (Law C).
- Card EXPIRED remains midnight ET (other clock).

**Must not call the what-if τ playhead a time machine.**
§5.3c range + playhead is the **HUD**. In Live / What-if it walks a frozen
or live-now vector. In Time machine it seeks snaps and **rebinds**.
Same controls, different feed, different label.

Provenance on the HUD always: `as_of` · `iv_source` · quality · tier.
Friday 2026-08-14 is **5-minute chain** — honest at that cadence, never
badged last-minute gold. Monday 2026-08-17+ is the 3–5s gold plane (DL-400).

### 4.6a Last-minute truth

0DTE P&L in the final hour is first-class. The tent’s job is to show
**what the structure was actually worth at clock \(t\)**, including
15:59, not a cartoon of the morning smile.

**Clock**
- \(\tau(t)\) is **OPF29 / OPF Spec v0.2.1 §3.7** (AT-L0-τ1 / AT-L0-τ4).
  Surface does not keep a second τ. §3.7 already forbids a 1-hour floor
  that flatlines the last hour of 0DTE.
- After that product’s OPF settlement instant the sheet is **held /
  residual, never live** (Law C). Settlement instant is OPF §3.7, not this file.
- Card **EXPIRED** is the other clock (midnight ET). Do not use EXPIRED
  to stop the last-minute mark path.

**Number at \(t\)**
- \(\mathrm{P\&L}(t)\) uses \(S(t)\), \(\tau(t)\), and each listed
  \(\sigma_i(t)\) from the snap at \(t\) (time machine) or the live
  generation (live now).
- Last minute is **mark truth**, not model decay.

**When the tape dies, the tent dies**
- If any listed leg has no exact/locked IV at \(t\) — including a wing
  that goes no-bid at 15:47 — that instant is **IV NO**.
- Do **not** fill from nearest, ATM, VIX, or 0.20 so the last hour
  “still draws.” A tent that always paints through 15:59 is lying
  about 0DTE.
- Near-zero ITM exact/locked IV still **keeps** (no extrinsic).

**Cadence honesty (provenance is part of the number)**
| Archive | Honest claim | Forbidden claim |
|---------|--------------|-----------------|
| Friday 2026-08-14 (5-min chain) | P&L at 5-minute snaps | “Last minute” / gold |
| Mon 2026-08-17+ (3–5s chain, DL-400) | Last-minute / last-few-seconds gold | — |
| What-if τ walk on frozen bind IVs | Theoretical decay | Time machine · last-minute truth |

HUD must show `as_of` (to the snap’s second) and cadence/tier.
A 5-minute snap must not wear a last-minute badge.

**Must not**
- Flatline τ in the final hour
- Interpolate a missing last-hour print
- Treat 16:01 as live
- Call a frozen-smile scrub last-minute truth

Cite OPF Spec v0.2.1 §3.7 / OPF29 AT-L0-τ1/τ4. Do not restate τ math here.

### 4.7 Book on the tent

Analyzer viewport = every **shown** representable card, additive (DL-394).
Surface is the same book, not a second focus radio.

\[
V_{\mathrm{book}}(S,\tau)=\sum_{j \in \mathrm{shown}} \big(V_j-D^*_j\big)
\]

Yellow markers = union of listed strikes of **shown** structures.
Non-representable shown cards do not blank a drawable sibling.
Mixed live + EXPIRED = live series + ghost; no blend without a seam.

**v0.1 implement slice (named, not a doctrine change):** one shown
structure is enough for the first bench. The spec law above still holds.
Do not encode “focused only” as product truth.

### 4.8 Named consumers (Coach 2026-08-16 · DL-410 / DL-411)

Once shipped, this Surface is **one object**. PB-MODE-0 is explicit: Method
v0.2 replay / time machine runs on **this sheet**. No side-door engine.

| Consumer | Home | What it is | What it is not |
|----------|------|------------|----------------|
| **Options Lab Surface** | **First ship.** `/app/options-lab/surface`. Sibling of Analyzer. Preview tab stays (S2). | Full tent: live / what-if / time machine | A Strategy Lab life-cycle pill |
| **Backtest surface** | Strategy Lab · Method v0.2 / Arch 31 | Time machine on the same `surfaceModel` sheet | A second pricer · `surface_reconstruct` as default |
| **Mini tape-walk graphic** | Shown **while** a backtest runs | Same sheet + same Labs renderer, **reduced grid/DPR**. Walks **one real day** (same tape across MC runs). Label: **day walking · n of N**. No P&L hero number. | **Never the result.** The result is the **distribution** and lands after. |

Juliet folds the two Strategy Lab rows into the Backtest bench plan **when
that plan seeds**. **Not GO.**

---

## 5. App chrome (Options Lab)

### 5.1 Place in the suite

Surface ships in **Options Lab first** (DL-411). That **supersedes** the S1
recommendation of a fifth Strategy Lab pill. It is **not** a life-cycle phase.

| | |
|---|---|
| Route | `/app/options-lab/surface` |
| Suite pill | **Surface** — sibling of Volume Profile · Heatmap · Analyzer |
| Breadcrumb | Apps › Options Lab › Surface |
| Chrome | Same HIG pattern as Options Lab heatmap: breadcrumb · centered pills · workspace fill |

Analyzer keeps the in-viewport Surface preview + “Open Surface”.
Strategy Lab **consumes** this object (backtest + mini graphic). It does
not own the first ship. It does **not** replace Design Board.

### 5.2 Shared book (complements Analyzer)

Both apps read the **same shown listed book** (§4.7 · DL-394):

- Symbol from the shared Options Lab / universe selector (or Strategy Lab
  symbol if already assigned).
- Shown cards from the Analyzer book (listed legs only). Highlight is
  chrome, not a second radio that un-shows siblings.

If Analyzer has no shown representable structure → Surface shows the named
empty state (“Show a listed structure in Analyzer”). Never a demo smile.

**v0.1 implement slice (named, not product law):** drawing one shown
structure is enough for the first bench. The sheet law remains additive.

### 5.3 Workspace

Full-bleed 3D tent in the remaining viewport after chrome. Dark workspace
(same family as Analyzer Surface preview — `#0a0a0e` — tokens where they
exist).

**Strike Autofit (S window):** [Surface Autofit Spec v0.1.1](./FatTail-Labs-Options-Lab-Surface-Autofit-Spec-v0.1.md) · **DL-421**. Not camera **Fit**. Playhead walk (§5.3c) does not change the S window.

**Must show**

- Sheet (T+0 mesh) colored by signed P&L. Non-flat faces (slope +
  crease) are slightly darker so the tent’s shape reads. **Curvature**
  slider on the Planes HUD scales that shade (0 = off, default 40%,
  100% = near-black folds). Light end of the scale is unchanged
  (**DL-448**).  
- Expiry tent / edge, visually distinct  
- Spot slice (now)  
- Zero-P&L plane  
- Listed structure strikes as markers  
- Label: symbol · structure · `iv_source` · quality · tier if any  
- Named failure states (Law B) that **replace the tent**: NOT TRADED · **IV NO** · CHECK LEGS · UPDATING · WAITING (empty book). **HELD / RESIDUAL** and **EXPIRED** are provenance on a **still-drawn** sheet (DL-445).  

**Must not show (v0.1)**

- VP / GEX / chart floor as if they priced the tent  
- Heston / regime picker  
- Unlabeled Theo overlay  
- MSC Mkt/Theo capsule names (`rgVolSurfaceMode`)  
- Structure-strike drag that invents a K  

### 5.3a Responsive (product law)

The Surface **is** a workspace, not a card that happens to contain a canvas.

| Law | Meaning |
|---|---|
| **Fill the host** | The renderer sizes to the **host element** (ResizeObserver), not `window` alone. Split chrome, rotating a phone, or collapsing the HUD must rebuild aspect without a reload. |
| **Desktop and phone** | Same app. Check both viewports before any ship (Labs UI rule). |
| **Chrome stacks, tent stays** | Below ~640px: breadcrumb / suite pills / HUD stack or collapse. The 3D host keeps the remaining height (min ~50vh, never a 120px stub). |
| **HUD does not steal the tent** | Readouts and camera controls overlay or sit in a drawer. Hit targets ≥44pt. On phone, HUD is collapsible so the mesh is the page. |
| **HiDPI** | Pixel ratio follows the device, capped so a phone does not melt. |
| **Safe area** | Respect notch / home-indicator insets. Orbit gestures start on the canvas, not the browser chrome. |
| **Reduced motion** | Named-view transitions shorten or snap. Manual orbit/pan/zoom stay live. |
| **Empty / Law B** | Failure states use the same host; they do not unmount the workspace and jump the page. |

A layout that only looks right at 1440×900 is a defect.

### 5.3b Camera and viewport (product law — maximum flexibility)

The member is inspecting a 3D P&L tent. They must be able to **put the camera
anywhere useful** without fighting the app. Flexibility is on the **camera**,
not on inventing strikes.

**Projections (both live, swap without rebuilding the sheet)**

| Mode | Use |
|---|---|
| **Perspective** | Default ISO inspect |
| **Orthographic** | Measure P&L / wings without perspective squash (RISK-style face) |

Swap keeps position + look-at. No scene rebuild. No second pricer.

**Manipulate (all required)**

| Gesture | Desktop | Touch |
|---|---|---|
| **Orbit** | Primary drag | One-finger drag |
| **Pan** (move the look-at) | Shift+drag or middle-drag | Two-finger drag |
| **Zoom** | Wheel | Pinch |
| **Reset / fit sheet** | Double-click or **Fit** control | Double-tap or **Fit** |
| **Named views** | Keys or HUD | HUD |

Elevation may clamp just shy of gimbal lock by default; a **Unlock** (or hold
modifier) removes the clamp so they can go under/through the tent. Azimuth is
free 360°. Zoom has a wide min/max, not a tiny detent band.

**Zoom speed (in / out) — member-controlled**

The prior Work Pane zoom was **too fast**. Labs default is **slower**.

| Control | Law |
|---|---|
| **Zoom speed** | HUD slider (or stepped Slow / Medium / Fast). Applies to wheel **and** pinch. |
| **Default** | **Slow** — about half the previous version’s per-notch / per-pinch gain. Not a copy of that gain; a calmer Labs default. |
| **Fine zoom** | Hold a modifier (Shift + wheel / slower pinch) ≈ ¼ of the current slider. |
| **Persist** | With Surface defaults on the member profile; a saved configurable view may override. |
| **Independent** | Zoom speed ≠ orbit speed ≠ pan speed. (Orbit/pan get their own sliders if Coach wants; v0.1 requires **zoom** at minimum.) |

Zoom never jumps the look-at through the mesh in one tick. Speed does not
reprice. Reset defaults restores Slow.

**Named views (detents, not prisons)**

| View | Intent |
|---|---|
| **ISO** | Default ¾ inspect |
| **Now** | Face the live (τ = now) slice |
| **Expiry** | Face the expiration tent |
| **Spot** | Look along increasing S |
| **Time** | Look along remaining τ |
| **Top** | Orthographic down the P&L axis (plan) |

**Fit** frames the current `SurfaceSheet` extents (S, τ, P&L). Fit is not a
hard-coded camera pose.

**Pivot** (HUD): orbit around **spot**, **structure** (listed strikes’ bbox),
or **scene origin**. Default **spot**.

**Configurable views (member-owned — in v0.1)**

Named views above are **factory detents**. The member also **saves their
own views**.

A saved view is a named snapshot of **inspect state**, not market state:

| Stored | Not stored |
|---|---|
| Camera pose, projection (persp/ortho), pivot | Legs, IVs, marks, tape |
| Time-axis **window** + playhead \(\tau^\*\) | Structure pointer |
| Strike playhead \(S^\*\) | |
| Plane show/hide (Strike, Time) | |
| Opacity + position of all three planes | |
| Optional FOV (perspective) | |

**Must**

- **Save view** (name it) from the current inspect state  
- **Recall** by name (HUD list + optional keys)  
- **Rename / delete / reorder** the list  
- **Set as default** — next Surface open uses this view (Fit still available)  
- **Reset** factory named views without deleting member views  
- Persist on the **member profile** (same class as home quick-nav) so it
  survives the browser. Not localStorage-as-SoR.  
- Cap the list (start at **12**; fail loud if they hit the cap — do not
  silently drop)  
- Phone: same save/recall in the HUD drawer  

Recalling a view does **not** reprice or rebind. If the current sheet’s
extents no longer contain a parked \(S^\*\) / \(\tau^\*\) / Value level,
clamp to the sheet and say so (named, calm — not a toast storm).

Factory names (**ISO**, **Now**, …) are reserved. Member names must not
collide with them.

**Must not**

- Steal one-finger scroll from the page **outside** the canvas  
- Orbit when the pointer started on a HUD control  
- Reprice or rebind legs because the camera moved **or a view was recalled**  
- Require a mouse. Phone must do orbit + pinch + pan + Fit + named views
  + save/recall  
- Treat a configurable view as market truth or a backtest input  

S3 is hereby **camera-complete, structure-static**: full camera/viewport
manipulation; no listed-strike drag in v0.1.

### 5.3c Time axis — range fills the timeline; walk the window

**Already in the design (do not confuse these):**

| Piece | What it is |
|---|---|
| Sheet τ axis | Remaining life, OPF29, now → settlement (`surfaceModel` timeAxis) |
| Named view **Time** | **Camera** looks along that axis (§5.3b) |
| Time machine later | Seek the snap at \(t\); **rebind** \(S,\tau,\sigma_i\) (§4.6 / §4.6a) |
| What-if walk | Frozen bind IVs; theoretical decay — **not** last-minute truth |
| Analyzer 2D | `time_offset_hours` what-if on the OPF pack |

**Not yet specified, now law:** the member **owns the τ window** and can
**walk inside it**. That is domain control of the time axis, not a camera
trick.

**Range (stretch-to-fill)**

- Member selects a closed interval \([\tau_{\mathrm{lo}}, \tau_{\mathrm{hi}}]\)
  inside remaining life \([0, \tau_{\mathrm{now}}]\) (τ = 0 at settlement).
- That interval is **the entire visible timeline**. The mesh re-samples so
  the window occupies the full τ grid — it does not leave empty years of
  axis on either side.
- Default window = full remaining life (now → settlement).
- Live gold cannot extend **past settlement** or **before the pointer’s
  remaining τ** (no invented future after expiry, no fake yesterday).
- Replay may window any span the captured day actually covers.
- Changing the range **rebuilds the sheet grid** for that window (same
  legs, same truth IVs). It is not a camera dolly.

**Walk (playhead)**

- A playhead \(\tau^\*\) lives in the current window.
- Default \(\tau^\*\) = window start (live: **now**).
- The Time slider is **elapsed along the box** (0 = Now wall, 1 =
  Expiry wall). Right end is expiry. It must not hit the Expiry wall
  before the thumb is at the right.
- The member scrubs (slider), steps (keys / buttons), and may later Play.
- Walking moves the **Now** face / spot slice / readouts to \(\tau^\*\).
- **Live / What-if:** IVs stay exact/locked from the current bind. Walking \(\tau^*\)
  does not invent a smile and does not re-cascade.
- **Time machine:** the playhead **rebinds** \(\sigma_i\) from the snap at \(t\).
  Still listed truth only — never sticky, never VIX, never 0.20.
  Hole in that snap → IV NO at that minute, no fill.
- Camera may stay put while the playhead moves. Named view **Now** faces
  the playhead slice.

**Box time edge (Coach 2026-08-18 · DL-447)**

The enclosing box names the corners **Now** and **Expiry** on **both
bottom time edges**. There is no axis word “Time”. Labels sit tight
to the wire. On each of those edges:

- **Expiry** shows the expiration-face clock under the word
  (America/New_York, e.g. `Aug 18, 4:00 PM ET`).
- Small ticks every **hour**. **RTH** ticks (Mon–Fri 9:30–16:00 ET) use
  the same heavier weight as the Open→Expiry rail. Off-hours and weekend
  ticks stay the light box weight.
- Longer ticks + labels at **Midnight** (00:00 ET), **Noon** (12:00 ET),
  and **Open** (Mon–Fri 9:30 ET). No Open on Saturday or Sunday.
- Ticks sit strictly between the Now and Expiry corners.
- The **Open → Expiry** stretch (expiry-day session; remaining Now →
  Expiry if Open is already behind) is a **slightly heavier** rail on
  both bottom edges. Same family as the box, not a second color.

**HUD (responsive, §5.3a)**

- All inspect chrome lives in a **left rail**. Panels have a slight
  light glow so they lift off the tent.
- **Named-view detents** (ISO · Now · Expiry · Spot · Time · T Ortho ·
  Top · Fit) stay **expanded**.
- Planes, Time, Camera, and Saved views start **collapsed**.
- Time-range control + playhead on the canvas HUD or a bottom drawer.
- Phone: drawer; ≥44pt. Must not block orbit on the mesh.
- Readout: window in clock time (ET) and remaining, plus playhead clock.
  HUD shows `as_of` (to the snap’s second) and cadence/tier (§4.6a).
  A 5-minute snap must not wear a last-minute badge.

**Must not**

- Treat named view **Time** as a substitute for range/walk  
- Stretch the axis with empty τ the structure does not have  
- Walk past settlement as if the option were still live  
- Reprice from VIX or 0.20 as the playhead moves  
- Label a frozen-smile τ walk as Time Machine  
- Paint last-minute 0DTE P&L from a 5-minute or interpolated smile  

### 5.3d Three reference planes — walk, hide, opacity, position

The tent has **three** translucent reference planes. Two are **walk
planes** (same interaction). The third is the **value** plane.

| Plane | Axis it cuts | Walk | Hide | Default position | Default opacity |
|---|---|---|---|---|---|
| **Strike** | \(S\) (underlier) | Yes — playhead \(S^\*\) | Yes | Live / bind **spot** | Medium (readable, not a wall) |
| **Time** | \(\tau\) (remaining life) | Yes — playhead \(\tau^\*\) (§5.3c) | Yes | Window start (live: **now**) | Medium |
| **Value** | P&amp;L (dollars) | Position settable | Opacity only (always on the axis; hide = opacity 0) | **$0** | Low (floor, not a lid) |

**Already in the design:** a spot slice and a zero-P&amp;L plane (as-built
Analyzer preview; MSC scene had the same two). Time playhead is §5.3c.
**Now law:** strike walks **the same way as time** — a transparent plane
you slide along the axis. Both walk planes can be **hidden**. All three
planes have **member-set opacity** and **member-set position**, plus
**defaults** the member (or later a session preset) can save.

**Walk (strike = time)**

- Strike playhead \(S^\*\) lives in the visible \(S\) window of the sheet.
- Scrub / step; optional later Play (same HUD grammar as τ).
- Walking the strike plane **does not invent a listed strike** and does
  not rebind legs. It is a **readout plane**: P&amp;L at \((S^\*, \tau^\*)\)
  from `sampleSheet`. Structure markers stay on listed Ks.
- Time plane walks \(\tau^\*\) as §5.3c.

**Hide**

- Strike plane and Time plane each have **Show / Hide**.
- Hidden ≠ destroyed: playhead and readout remain; the mesh is uncluttered.
- Value plane has no separate hide control — set opacity to 0 to clear it.

**Opacity**

- Independent opacity for Strike, Time, and Value (0–100%).
- Changing opacity does not reprice.

**Position**

| Plane | Position is | Clamp |
|---|---|---|
| Strike | \(S^\*\) in the visible S range | Sheet \(S\) extents |
| Time | \(\tau^\*\) in the current time window | §5.3c window |
| Value | P&amp;L level in dollars | Sheet P&amp;L extents; **default $0** |

Value at $0 is the usual zero floor. The member may lift or drop it (e.g.
mark the debit, a trail, a tent wall) without changing the model.

**Defaults (settable)**

Ship defaults (above). Member may **Set as defaults** for this browser
session (and later a saved camera+plane preset — not a second market SoR).
**Reset defaults** restores the table. Fit / named views do not overwrite
member plane opacity or a parked Value level unless they hit **Reset**.

**HUD:** one “Planes” cluster — show/hide Strike & Time; opacity sliders
for all three; numeric position for each. Phone: same cluster in the
drawer (§5.3a).

**Must not**

- Treat hiding a plane as deleting the playhead  
- Snap the strike plane to a listed K unless the member chooses snap  
- Let plane drags rebind the structure  
- Use VIX / 0.20 when a plane moves  

### 5.4 Mkt / Theo (design, later chrome)

Keep the **idea**: two IV vectors, one primitive, labeled disagreement.

| Labs name | Meaning |
|---|---|
| **Market smile** | Per-leg OPF IV (product default) |
| **Flat σ** | One σ\* on every leg, **labeled**, never as the mark |

v0.1 ships **Market smile only**. Flat σ is a later mode, not a second mesh
requirement. Flat σ / silver **must not** write PackagePricer, the card
debit, or time-machine \(\sigma_i(t)\).

---

## 6. Data

| Input | Source |
|---|---|
| Listed legs, strikes, rights, expirations | OPF-held generation / Analyzer pointer |
| Per-leg IV | Exact or locked OPF `leg_marks` only (§4.3). No cascade fill. |
| Spot | `useLiveUnderlierMarks` + `bindUnderlierMark` (Arch 28 §4.4) |
| Package mark | OPF PackagePricer |
| τ | OPF `tau_meta["tau"]` |
| Session / print quality | OPF session envelope (DL-395) |

No per-widget Massive. No second WebSocket. No MSC Redis.

---

## 7. Boundary (India)

1. No MSC imports, vendored modules, or copied functions.  
2. Scene math (projection, orbit) is Labs-owned or a normal third-party
   renderer (`three`) driven by `SurfaceSheet`.  
3. Do not extend `alpha.js` / `charlie.js` / `echo.js` as the product path.  
4. Do not treat `useRiskGraphCalculations.ts` as authority.  
5. MSC is named in this spec, the assessment, and the DL — not in UI copy.

---

## 8. Open Coach decisions

| # | Decision | Recommendation |
|---|---|---|
| S1 | Surface as a fifth Strategy Lab pill vs a tool under Design? | **CLOSED (DL-411).** Options Lab first, beside Analyzer. Strategy Lab is the second consumer (DL-410). Fifth-pill recommendation reversed. |
| S2 | Analyzer in-viewport Surface tab: keep as preview or remove? | **Keep as preview** + “Open Surface” until the app ships; then preview may stay. |
| S3 | Camera vs structure drag? | **Camera-complete, structure-static** (§5.3b). Full orbit / pan / zoom / proj / named views / Fit. No strike invent. |
| S5 | Time-range + walk in v0.1 Surface vs replay-only? | **In v0.1.** Range fills the visible timeline; playhead walks τ. Replay tape-walk is still a later **mode** on the same controls. |
| S6 | Plane HUD in v0.1? | **Yes.** Walk + hide Strike & Time; opacity + position on all three; settable defaults. Value default $0. |
| S7 | Configurable (saved) views in v0.1? | **Yes.** Factory named views stay. Member saves inspect state (camera + planes + time window) on the profile. Cap 12. Not market SoR. |
| S8 | Zoom speed control? | **Yes.** Default Slow (~½ prior Work Pane). Slider + Shift fine-zoom. Persist with Surface defaults. |
| S4 | When is Flat σ chrome allowed? | After Hotel + first gold replay. Not v0.1. |

**S1 is closed** (DL-411). S2–S8 remain chrome. **IV bind, time-machine
meaning, named consumers, and first home are not open** (DL-409 · DL-410 ·
DL-411 · §4.3 · §4.6 · §4.6a · §4.8 · §5.1).

---

## 9. Sequence

1. Coach Accept / amend remaining chrome (S2–S8). **S1 is closed.** Responsive + camera law in §5.3a–b is **in** unless Coach cuts it.  
2. Echo: workspace tokens + control grammar + camera HUD (no chrome before that).  
3. Charlie: Options Lab route + suite pill + scene that **only** consumes `SurfaceSheet`.  
4. Wire OPF per-leg IV (product path already refuses sticky 0.20).  
5. Strategy Lab consumers later, same object (Method v0.2 time machine + mini tape-walk). Friday `day=2026-08-14` first tape.

**No implementation from this file until Coach GO.**

---

## Version history

| Ver | Change |
|---|---|
| **v0.1** | Design-only: Strategy Lab 3D Surface app; complements Analyzer; engine = `surfaceModel.ts`; MSC design without MSC code. |
| **v0.1.1** | §5.3a fully responsive workspace. §5.3b maximum camera/viewport (persp/ortho, orbit/pan/zoom, Fit, named views, pivot). S3 = camera-complete, structure-static. **DL-403**. |
| **v0.1.2** | §5.3c time-axis **range fills the visible timeline**; **walk** playhead. Distinct from camera view **Time** and from later tape replay. **DL-404**. |
| **v0.1.3** | §5.3d three planes: walk **strike** and **time** (transparent); hide those two; opacity + position on all three; settable defaults; Value default $0. **DL-405**. |
| **v0.1.4** | §5.3b **configurable views** — save/recall/rename/delete; set default; profile persist; cap 12. Factory named views remain. **DL-406**. |
| **v0.1.5** | §5.3b **zoom in/out speed** member-controlled; default Slow vs prior too-fast Work Pane. **DL-407**. |
| **v0.1.6** | Mark path only (no §4.3 cascade). IV NO folded to OT-EF. Time machine = snap rebind, not frozen-smile walk. Additive book law + v0.1 slice. **§4.6a last-minute truth.** **DL-409**. |
| **v0.1.7** | **§4.8 named consumers** (backtest sheet + mini tape-walk). **S1 closed:** first home is Options Lab (`/app/options-lab/surface`). Strategy Lab consumes. **DL-410** · **DL-411**. |
| **v0.1.8** | Review accept. §1 / §4.1 / §5.2 = shown listed book (§4.7), not a focus radio. Mini graphic label **day walking · n of N**. **DL-412**. |
| **v0.1.8+** | 2026-08-21 Coach intent recorded: Surface = simple alternate of Analyzer canvas; T Ortho = Easter Egg inside Surface. **DL-509**. No code in that body. |
