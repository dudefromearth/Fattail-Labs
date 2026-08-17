# FatTail Labs — Strategy Lab 3D Surface Technical Spec v0.1

**Status:** DRAFT — technical contract. **Not BUILD AUTHORITY.**  
**Date:** 2026-08-16  
**Type:** Interfaces, data shapes, persistence, rebuild rules  
**Product / interaction law:** [`FatTail-Labs-Strategy-Lab-3D-Surface-App-Spec-v0.1.8.md`](./FatTail-Labs-Strategy-Lab-3D-Surface-App-Spec-v0.1.8.md)  
**Architecture:** [`Architecture/33-strategy-lab-3d-surface.md`](../Architecture/33-strategy-lab-3d-surface.md)  
**Engine (as-built):** `web/lib/risk-graph/surfaceModel.ts`  

This spec is what Alpha / Charlie implement against after Coach Accept and
Echo chrome. It does not replace OT-EF or OPF. It does not copy MSC.

---

## 1. Modules (intended)

| Module | Responsibility |
|---|---|
| `web/lib/risk-graph/surfaceModel.ts` | Sheet: bind truth IVs, compute grid, sample, τ-window resample |
| `web/lib/risk-graph/surfaceInspect.ts` | **New.** CameraState, PlaneState, TimeWindow, ViewSnapshot, zoom gain, clamp |
| `web/lib/risk-graph/surfaceScene/` | **New.** Labs-owned renderer. Input: sheet + inspect. No OPF/Massive. |
| `web/components/options-lab/surface/SurfaceApp.tsx` | Route body: chrome + HUD + scene (Options Lab first ship) |
| `web/app/app/options-lab/surface/page.tsx` | Next.js page — `/app/options-lab/surface` |
| `web/lib/optionsLabSuite.ts` | Add `surface` suite id + pill (sibling of analyzer) |
| Strategy Lab backtest host (later) | Consumes the same sheet + renderer; no second scene module |
| `PATCH /api/me/profile` | Persist `surface_inspect` (after migration) |

**Forbidden as product path:** `3d/alpha.js`, `charlie.js`, `echo.js`,
`useRiskGraphCalculations.ts`, any `MarketSwarm-Canonical/**` import.

---

## 2. Sheet contract (extend existing)

As-built types `SurfaceLeg`, `SurfaceSheet`, `bindListedSurfaceLegs` stay.

### 2.1 τ-window resample (new opts)

```ts
type ComputeSurfaceOpts = {
  spot: number;
  r?: number;
  nx?: number;
  nt?: number;
  padFrac?: number;
  /** Inclusive remaining-τ window in years. If set, timeAxis fills [tauLo, tauHi]. */
  tauLo?: number;
  tauHi?: number;
  quality?: "per_leg_iv";
  ivSource?: string;
};
```

Rules:

- If omitted: today’s behavior (`timeAxis` from max remaining τ → ~0).  
- If set: `0 ≤ tauLo < tauHi ≤ τ_now` (live). `timeAxis[0] = tauHi` (nearer
  to now), `timeAxis[nt-1] = tauLo` (nearer settlement). Grid **fills** the
  window.  
- Invalid window → throw / named fail (do not silently expand).  
- `quality` on member sheets is **only** `per_leg_iv`. `sticky_cli` is not a
  product value (DL-402). Tests may still use a fixture IV **on the legs**,
  never as a hidden smile.

### 2.2 Bind (as-built, normative)

`bindListedSurfaceLegs(legs, opfLegMarks, { spot, tauFor })`

- Success only if every leg has `iv_source ∈ {exact, locked}` and a usable IV
  (keep vendor near-zero ITM in (0, 0.01] when source is exact/locked).
- Listed + missing/inferred source → `{ ok: false, hole: "IV NO", detail }`.
- Strike not on held generation → `{ ok: false, hole: "NOT TRADED" | "CHECK LEGS", detail }`.
- **Do not call** OPF cascade steps 2–6 from this bind. No nearest / ATM / VIX / 0.20.

### 2.3 Sample

`sampleSheet(sheet, spot, tauYears): number | null`

- Used by walk planes. `null` if \((S,\tau)\) is outside the **current**
  sheet extents (after windowing).  
- Playhead HUD shows the named clamp, not a stale P&L.

### 2.4 Rebuild vs sample

| Event | Sheet | Scene |
|---|---|---|
| Legs / truth IV / lock change | Rebuild | Rebuild mesh |
| τ window change | Rebuild (new timeAxis) | Rebuild mesh |
| Model-center spot change (rare) | Rebuild | Rebuild mesh |
| Playhead \(\tau^\*\) or \(S^\*\) | **Sample only** | Move plane mesh |
| Time-machine playhead seeks a new snap | Rebuild (rebind IV + S + τ from that snap) | Rebuild mesh |
| What-if playhead only (same bind) | Sample only | Move time plane |
| Value plane dollars | None | Move value plane |
| Camera / zoom gain / hide / opacity | None | Camera / material only |
| Recall view | Rebuild **only if** stored τ window ≠ current | Then apply pose |

### 2.5 Time machine feed (contract, even if implement is later)

Time machine consumes `live_capture` (or successor) snaps:
`sampleSheet` after `bindListedSurfaceLegs` on **that snap’s** `leg_marks`.
No second engine. Fail loud on any leg that is not exact/locked in that snap.
HUD label: Time machine. `as_of` = snap time. Tier = snap provenance
(Friday 2026-08-14 = 5-min chain; do not write gold-minute).

Last-minute 0DTE is **mark path** (App Spec **§4.6a**). Cite OPF Spec
v0.2.1 **§3.7** / OPF29 AT-L0-τ1/τ4 — this file does not invent or
restate τ math. Hole at \(t\) → IV NO, no neighbor fill. After
settlement → residual, never live.

---

## 3. Inspect-state types (new)

```ts
type Projection = "perspective" | "orthographic";
type Pivot = "spot" | "structure" | "origin";
type ZoomPreset = "slow" | "medium" | "fast";

type CameraState = {
  projection: Projection;
  /** World-space eye; Labs scene units, not MSC units. */
  eye: { x: number; y: number; z: number };
  lookAt: { x: number; y: number; z: number };
  pivot: Pivot;
  /** 0.25–2.0 multiplier on the Slow baseline. Default 1.0 = Slow. */
  zoomGain: number;
  fov?: number; // perspective only
  elevationUnlocked?: boolean;
};

type TimeWindow = {
  tauLo: number;
  tauHi: number;
  playheadTau: number;
};

type PlaneId = "strike" | "time" | "value";

type PlaneState = {
  visible: boolean;      // strike & time; value uses opacity===0 as hide
  opacity: number;       // 0..1
  position: number;      // S | τ years | P&L dollars
};

type InspectState = {
  camera: CameraState;
  time: TimeWindow;
  planes: Record<PlaneId, PlaneState>;
};

type ViewSnapshot = {
  id: string;            // uuid
  name: string;          // not a factory reserved name
  inspect: InspectState;
  updated_at: string;    // ISO
};
```

**Factory view ids (reserved):** `iso` `now` `expiry` `spot` `time` `top` `fit`.

**Ship defaults**

| Field | Default |
|---|---|
| `camera.projection` | `perspective` |
| `camera.pivot` | `spot` |
| `camera.zoomGain` | `1.0` (Slow) |
| `time` | full remaining life; playhead = now |
| `planes.strike` | visible, opacity 0.35, position = bind spot |
| `planes.time` | visible, opacity 0.35, position = now τ |
| `planes.value` | visible, opacity 0.18, position = **0** |

Shift+wheel / fine pinch: `zoomGain * 0.25`.

`clampInspect(inspect, sheet): { inspect, notes[] }` — parks that fall
outside sheet extents snap to the edge; `notes` feed the named calm detail.

---

## 4. Scene host

```ts
type SurfaceSceneHandle = {
  setSheet(sheet: SurfaceSheet): void;
  setInspect(inspect: InspectState): void;
  fit(): void;                 // named Fit
  applyFactoryView(id: FactoryViewId): void;
  dispose(): void;
};

function mountSurfaceScene(
  host: HTMLElement,
  init: { sheet: SurfaceSheet; inspect: InspectState },
): SurfaceSceneHandle;
```

- Size from `ResizeObserver` on `host`.  
- `devicePixelRatio` capped (suggest 2).  
- Pointer: primary drag = orbit; shift/middle = pan; wheel = zoom × gain;
  one-finger orbit; pinch zoom; two-finger pan.  
- HUD controls must `stopPropagation` so they do not orbit.  
- `setInspect` with only camera/opacity/playhead must **not** call
  `setSheet`.

---

## 5. Persistence (profile)

After Accept, one migration (next free `NNN`):

```sql
ALTER TABLE identities
  ADD COLUMN surface_inspect_json JSON NULL
    COMMENT 'Options Lab Surface inspect defaults + saved views'
    AFTER home_quick_nav_json;
```

(Exact `AFTER` follows the live column list at implement time.)

**GET /api/me/profile** includes:

```ts
surface_inspect: {
  defaults: Partial<InspectState>;
  default_view_id: string | null;
  views: ViewSnapshot[];
}
```

**PATCH /api/me/profile** `{ surface_inspect: ... }` — replace-or-merge
documented as **replace of the object** (fail loud if `views.length > 12`
or reserved names). Same session cookie as today.

Unknown keys dropped on **read**; unknown keys **422** on **write** (same
posture as `home_quick_nav`).

---

## 6. Focus pointer

Surface does not own instruments.

Intended resolve is the **shown book** (DL-394). v0.1 may bind one
structure; the API must not assume a singleton forever.

| Field | Source |
|---|---|
| Symbol | Shared Options Lab symbol / universe |
| Legs | Analyzer shown book / selected trade (listed legs) |
| Marks | `useOpfRiskGraph` → `result.marks.leg_marks` |
| Spot | `useLiveUnderlierMarks` |

Empty pointer → WAITING / “Show a listed structure in Analyzer”.  
Deep link (optional v0.1): `/app/options-lab/surface` reads the same
in-memory book as Analyzer (same tab). Cross-tab later.

**Named consumers (later, same modules):** Method v0.2 time machine binds
this sheet. Mini tape-walk graphic mounts the **same** `surfaceScene` at
reduced `nx`/`nt` and capped DPR, with a run counter `n of N`. Same tape
across MC runs. The graphic is **not** the result.

---

## 7. API surface (Labs)

No new market endpoints. Pricing stays:

- `POST /api/me/pricing/resolve` (Analyzer already)  
- `POST /api/me/pricing/package-quote`  
- Live underlier via existing marks hooks  

New: profile field only (§5).

---

## 8. Characterization tests (when built)

| Id | Assert |
|---|---|
| T-IV-1 | Bind with `vix` / missing mark → `IV NO`, no sheet |
| T-IV-2 | Bind `exact`+`locked` → legs carry those IVs |
| T-IV-3 | Bind with `nearest` / `atm_exp` / `vix` present and no exact → IV NO, no sheet |
| T-IV-4 | Near-zero ITM exact IV in (0, 0.01] → bind succeeds (keep) |
| T-WIN-1 | `tauLo/tauHi` → `timeAxis[0]===tauHi`, last===tauLo, length nt |
| T-WIN-2 | Window outside remaining life → fail loud |
| T-SMP-1 | Playhead change does not change `pnlGrid` reference / hash |
| T-VW-1 | 13th saved view → 422 |
| T-VW-2 | Name `iso` → 422 |
| T-CAM-1 | `setInspect` camera-only does not call compute |
| T-TM-1 | Time-machine step to snap t₂ changes σ vector to t₂’s exact IVs (not t₁ decayed) |
| T-TM-2 | Snap with one missing exact IV → IV NO, no fill |
| T-TM-3 | HUD / quality must not label a 5-min Friday snap as 3–5s gold |
| T-BOOK-1 | Two shown structures: sheet is additive Σ(V−D*); v0.1 may skip implement but must not document the inverse as law |
| T-LM-1 | 0DTE at 15:59 ET: τ still decreases vs 15:00; not clamped to 1 hour. **Cite** OPF Spec v0.2.1 §3.7 AT-L0-τ1/τ4 — do not invent a second τ. |
| T-LM-2 | Same structure at 16:01 ET (PM settlement): sheet is residual / not live |
| T-LM-3 | Snap at 15:47 with one wing `iv_source` ≠ exact\|locked → IV NO; no neighbor fill |
| T-LM-4 | Time-machine step 15:50 → 15:51 changes σ to the 15:51 snap (not 15:50 decayed) |
| T-LM-5 | Friday 2026-08-14 snap HUD/quality ≠ gold last-minute |
| T-LM-6 | `evaluatePnlAtSpot` is not the card debit; debit stays PackagePricer / lock |
| T-CON-1 | Backtest time machine uses `bindListedSurfaceLegs` + `computeSurfaceSheet` — no second engine |
| T-CON-2 | Mini tape-walk label is **day walking · n of N**; no P&L hero number |

Last-minute truth is App Spec **§4.6a**. Hotel/OPF already own T-LM-1 via
OPF Spec v0.2.1 §3.7 AT-L0-τ1/τ4. Surface docs **cite** those.

HUD / resize / touch: Echo review + browser (desktop + phone).

---

## 9. Out of v0.1 implement (after this spec)

- Strategy Lab backtest host + mini tape-walk graphic (same sheet; App Spec §4.8)
- Replay mode / gold 3–5s tape walk (same HUD)  
- Flat-σ chrome  
- Structure-strike drag  
- FOV slider (type allows; HUD optional)  
- Cross-tab focus sync  
- Growing proto `alpha.js`

---

## 10. Status vs product spec

The **app spec** is member-facing law (gestures, HUD, named states).  
This **tech spec** is implementer law (types, rebuild, persist).  
Conflict → app spec + OT-EF win; fix this file.

Chrome **S2–S8 accepted** as recommended (**DL-413**). S1 closed (DL-411).
**Not BUILD** until Coach **GO** on the Surface bench plan.
