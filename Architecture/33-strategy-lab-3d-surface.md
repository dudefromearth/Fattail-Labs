# Architecture 33 — Strategy Lab 3D Surface

**Status:** FIRST-SHIP AS-BUILT (W3–W5) — time-machine **feed** and mini graphic later.  
**Date:** 2026-08-16  
**Product law (interaction):** [`Specs/FatTail-Labs-Strategy-Lab-3D-Surface-App-Spec-v0.1.8.md`](../Specs/FatTail-Labs-Strategy-Lab-3D-Surface-App-Spec-v0.1.8.md)  
**Technical contract:** [`Specs/FatTail-Labs-Strategy-Lab-3D-Surface-Tech-Spec-v0.1.md`](../Specs/FatTail-Labs-Strategy-Lab-3D-Surface-Tech-Spec-v0.1.md)  
**Parents:** Arch **30** (OPF) · Arch **28** §4.4 (live mids) · Arch **31** (replay later) · Arch **32** (hold/fold reads this tent) · DL-364 / 379–381 / 391 / 399 / 401–416

---

## 0. Mission

Give Options Lab a **dedicated 3D P&L tent** of the shown listed book,
beside Analyzer (builder + 2D risk). Strategy Lab **consumes** the same
object (backtest time machine + mini tape-walk). File name is historical.

**One calculator.** Shape from **per-leg IV** (exact or locked only). Inspect
state (camera, planes, time window) is member-owned and does not reprice.

MSC is **design reference only**. No MSC code.

---

## 1. As-built vs intended

| Layer | As-built today | Intended |
|---|---|---|
| Sheet math | `surfaceModel.ts` — bind exact/locked · τ-window · sampleSheet | First-ship landed |
| Analyzer 2D | OPF resolve + `PnLChart` | Unchanged |
| Analyzer viewport | 2D `HostPnLChart` only — in-Analyzer Surface tab **removed** (Coach 2026-08-20) | Surface is the suite page |
| Product scene | `web/lib/risk-graph/surfaceScene/` | Labs-owned; no `alpha.js` |
| Route / nav | `/app/options-lab/surface` · suite pill **Surface** | Landed |
| Views persist | `identities.surface_inspect_json` (130) · PATCH `/api/me/profile` | Landed |
| **Autofit** | Spec **v0.1.6** · `surfaceAutofit.ts` · book change + button only · expiry BEs at front-exp face | What-if / live spot / playhead do not refit · **AF-n** · **DL-421** · **DL-427** |
| Multi-DTE sheet | Default `timeAxis` ends at `expiryFaceTau` (OD-PF2) · cyan last row = front-exp residual | T+0 magenta unchanged · **DL-427** |
| Host clocks | Remaining listed life (`surfaceBookClock`) · residual/expired are HUD provenance · tent stays | Never clock-block analysis · **DL-445** |
| Expired ghost | Wireframe, no fill · at-expiry residual (`surfaceGhost.ts`) | Analyzer 2D ghost equivalent · **DL-446** |
| Box time axis | Both bottom edges · no “Time” word · hourly ticks · Midnight / Noon / Open · Expiry clock · heavier Open→Expiry rail · RTH ticks match that weight | **DL-447** · `surfaceTimeAxis.ts` |
| Curvature shade | Slope + crease darken non-flat faces · Planes HUD **Curvature** slider | **DL-448** · `surfaceRelief.ts` |
| HUD rail | Left dock · glow · detents always open · other panels collapsed | Coach 2026-08-18 |
| Replay / mini graphic | Not wired | Later consumer wave |

**Do not grow** `web/lib/risk-graph/3d/{alpha,charlie,echo}.js`. Those files are
heritage. The product renderer is a new module that **only** takes a
`SurfaceSheet` + inspect state.

---

## 2. Placement in the product

```text
/app/options-lab/analyzer     build / edit / 2D risk / OPF book
         │  shared focus pointer (listed legs + OPF marks)
         ▼
/app/options-lab/surface      3D tent + camera + planes + time window
         │  same sheet · same Labs renderer
         ▼
Strategy Lab                  backtest time machine + mini tape-walk
```

Surface ships in **Options Lab first** (DL-411). Not a Strategy Lab
life-cycle phase. Options Lab pills:

`Volume Profile · Heatmap · Analyzer · Surface`

Chrome: same HIG workspace as Options Lab heatmap (`workspace` fill). Analyzer
may deep-link `?focus=` or rely on the shared in-tab pointer.

Named consumers: App Spec **§4.8** · DL-410. Mini graphic is the day walking,
never the MC result.

---

## 3. Layer cake

```text
┌─────────────────────────────────────────────────────────────┐
│  SurfaceApp  (Options Lab route + chrome + HUD)             │
│    camera HUD · planes HUD · time-range · views · zoom gain │
├─────────────────────────────────────────────────────────────┤
│  Inspect state  (does not reprice)                          │
│    CameraState · PlaneState · TimeWindow · ViewSnapshot     │
├─────────────────────────────────────────────────────────────┤
│  Scene  (Labs-owned WebGL)                                  │
│    resize host · mesh from SurfaceSheet · three planes      │
├─────────────────────────────────────────────────────────────┤
│  Sheet  surfaceModel.ts                                     │
│    bindListedSurfaceLegs → computeSurfaceSheet → sampleSheet│
├─────────────────────────────────────────────────────────────┤
│  Truth  OPF + Market Bus                                    │
│    held generation · PackagePricer · tau · live underlier   │
└─────────────────────────────────────────────────────────────┘
```

**Downward only.** Scene never calls Massive. HUD never invents IV. Camera
never calls OPF.

---

## 4. Truth plane (reuse, do not fork)

| Fact | Source | Law |
|---|---|---|
| Listed legs | Analyzer pointer / OPF strategy | OT-EF Law A |
| \(\sigma_i\) | `leg_marks.iv` where `iv_source ∈ {exact, locked}` | App Spec §4.3 · DL-402 / **DL-409** |
| Spot mid | `useLiveUnderlierMarks` + `bindUnderlierMark` | Arch 28 §4.4 |
| Package mark | OPF PackagePricer | Law A / elegant failure |
| \(\tau\) | OPF29 / OPF Spec v0.2.1 **§3.7** (`tau_meta["tau"]`) | Law C · App Spec **§4.6a** |
| Session / print | OPF session envelope | DL-395 |

OPF §5.6 cascade steps 2–6 **do not run** on Surface bind. Hole → named
state on the **same host** (IV NO · CHECK LEGS · EXPIRED · NOT TRADED ·
UPDATING · WAITING). No demo smile. No neighbor / ATM / VIX / 0.20 fill.

---

## 5. Sheet (engine)

`computeSurfaceSheet(legs, { spot, nx, nt, padFrac, tauLo?, tauHi? })`

- Axes: \(S \times \tau \times\) package P&L (dollars × 100).  
- Vol is **not** an axis; it shapes \(u_i(S,\tau;\sigma_i)\).  
- **Time-range law:** if `tauLo`/`tauHi` set, `timeAxis` spans **only** that
  interval and **fills** the grid (Spec §5.3c).  
- `sampleSheet(sheet, S*, τ*)` is the readout for walk planes.  
- Rebuild the sheet when: legs, IVs, spot used as **model center**, or τ
  window change.  
- **Do not** rebuild when: camera, plane opacity/hide, playhead move (sample
  only), zoom gain.

Expiry face is **OD-PF2 / DL-427**: single-DTE all-intrinsic − \(D^*\)
(vol-independent); multi-DTE **front-exp residual** (front dead, later
legs still live). Default `timeAxis` ends at that face
(`expiryFaceTau`), not both-dead. Cyan last row **is** that face.

---

## 6. Inspect state (member-owned)

Three clusters. All persist in a **ViewSnapshot** and in **defaults**.

### 6.1 Camera

Projection (perspective | orthographic), pose, look-at, pivot (spot |
structure | origin), zoom gain (Slow default, DL-407), optional FOV.

Named factory views: ISO · Now · Expiry · Spot · Time · Top · Fit.

### 6.2 Time window + playhead

\([\tau_{\mathrm{lo}}, \tau_{\mathrm{hi}}]\) fills the visible timeline.
Playhead \(\tau^\*\) walks inside. Live clamp: remaining life only.

### 6.3 Planes

| Plane | Walk | Hide | Position default | Opacity default |
|---|---|---|---|---|
| Strike | \(S^\*\) | yes | bind spot | medium |
| Time | \(\tau^\*\) | yes | now | medium |
| Value | settable | opacity 0 | **$0** | low |

Walk = readout. Hide ≠ destroy playhead. Opacity independent.

### 6.4 Configurable views

Factory detents stay. Member saves up to **12** named snapshots of inspect
state (not legs/marks). Persist on **profile**. Recall does not reprice.
Clamp + named note if a parked position is off the current sheet.

---

## 7. Scene

New Labs module (suggested): `web/lib/risk-graph/surfaceScene/`  
(or `web/components/strategy-lab/surface/`). **Three** is allowed as a
renderer. Input: `SurfaceSheet` + inspect state. Output: WebGL in a host
div.

| Must | Must not |
|---|---|
| ResizeObserver on **host** | Window-only resize |
| Pixel ratio capped | Unbounded DPR on phones |
| Gesture: orbit / pan / pinch-zoom | Steal HUD pointer or page scroll outside canvas |
| Mutate plane meshes on walk | Rebuild sheet on camera tick |
| Perspective ↔ ortho without sheet rebuild | Import MSC `RiskGraph3DView` |

Responsive law: Spec §5.3a. Phone and desktop. HUD collapsible.

---

## 8. Persistence

**Inspect defaults + saved views** are member preferences, same class as
home quick-nav (server JSON on `identities`, PATCH `/api/me/profile`).

| Key | Role |
|---|---|
| `surface_inspect_json.defaults` | Zoom gain, plane opacities, default view id |
| `surface_inspect_json.views[]` | Up to 12 ViewSnapshots |
| `surface_inspect_json.default_view_id` | Open Surface on this view |

**Not** localStorage as SoR. **Not** MiniTwo-only. Migration planned
**after** Spec Accept (do not apply a column in this design pass).

Focus pointer (which structure) stays client/session shared with Analyzer
(existing analyzer book / selected trade). Views do not store the pointer.

---

## 9. Modes (later, same object)

| Mode | What the number is | First ship |
|---|---|---|
| **Live** | Now: \(S,\tau,\sigma_i\) from the live OPF generation + underlier | **Yes** |
| **What-if** (forward-analysis) | Frozen bind IVs; member moves \(S\) / \(\tau\). **Theoretical decay.** | Later |
| **Time machine** (replay) | Real P&L at \(t\): rebind \(S(t),\tau(t),\sigma_i(t)\) from the **snap at \(t\)** | Later (Arch 31). **Hero walk.** |

Same HUD, different feed, different label. A frozen-smile τ walk is
**What-if**, never Time machine. Last-minute 0DTE is App Spec **§4.6a**
(mark path; hole → IV NO; Friday 5-min cannot claim last-minute gold).

Time machine **reuses** time-range HUD + playhead. It does not get a second scene.

---

## 10. Boundary

1. No MSC imports, vendored files, or copied functions.  
2. No second Massive path, no extra WebSocket.  
3. No `useRiskGraphCalculations` / Heston as authority.  
4. No sticky IV (DL-402).  
5. MSC named in assessment, app spec, this arch, tech spec, DLs — not UI.  
6. Nothing on MiniTwo for this app’s first ship (Studio host is enough).

---

## 11. Verification (when built)

- Desktop + phone: tent fills host; HUD does not steal the mesh.  
- Camera: persp/ortho, orbit/pan/zoom, Fit, six named views, unlock elevation.  
- Zoom default feels Slow vs prior Work Pane; slider + Shift fine-zoom.  
- Time window resample fills the τ axis; Live/What-if playhead walks without IV invention.  
- Time machine rebinds snap IV; hole → **IV NO**; Friday 2026-08-14 not gold-minute / last-minute.  
- Last-minute 0DTE (App Spec **§4.6a**): cite OPF Spec v0.2.1 §3.7; after settlement residual never live; no last-hour fill. Residual / EXPIRED **keep the tent** (DL-445) — claim changes, analysis does not lock.  
- Strike plane walks; both walk planes hide; three opacities; Value parks off $0.  
- Save 12 views; 13th fails loud; recall does not reprice.  
- Missing exact IV → **IV NO**, no tent.

---

## 12. Open (Coach)

S1 closed (DL-411). **S2–S8 accepted as recommended (DL-413).** Chrome
closed. Named consumers (DL-410) are law. **Not BUILD** until Coach GO.
