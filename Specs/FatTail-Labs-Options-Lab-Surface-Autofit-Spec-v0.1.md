# FatTail Labs — Options Lab Surface Autofit Spec v0.1

**Status:** AS-BUILT default · special-case amendments land here  
**Date:** 2026-08-17  
**Content version:** **v0.1**  
**Filename:** `FatTail-Labs-Options-Lab-Surface-Autofit-Spec-v0.1.md`  
**Home:** Options Lab Surface · `/app/options-lab/surface`  
**Parents:** App Spec v0.1.8 · Tech Spec v0.1 · Arch **33** · OT-EF v1.1 · **DL-421**  
**Code:** `web/lib/risk-graph/surfaceAutofit.ts` · `SurfaceApp.tsx` · `CameraHud.tsx`  
**Engine:** `surfaceModel.ts` `evaluatePnlAtSpot` only — no second pricer  

---

## 0. Coach intent (normative)

Autofit is a **general strategy for all positions**. The book must **fit
inside the viewport box**. That includes **breakevens and/or the listed
strikes, whichever is furthest out**, with **some padding**. **Stretch or
compress** the strike scale so the position fits.

Certain families will look wrong under the default. Those get
**adjustments** — they do **not** get a second Autofit. Amendments to
**this spec** name the special case. The framework stays lightweight:
one window, one pad, one compress, profiles later.

**Invoke:**

1. Every time a position is **added to the viewport** (shown book changes).
2. On command when the member clicks **Autofit**.

---

## 1. What Autofit is

Autofit chooses the **strike / S window** (`sMin`…`sMax`) of the Surface
sheet so the shown Analyzer book is **completely visible** in the box,
with air beyond the outer content.

The box size is the camera viewport. Autofit does **not** invent a
second universe. It only chooses **which S range** the existing box
maps onto. A wider window **compresses** the strike axis; a narrower
window **stretches** it. Every grid point is still the listed book
(`evaluatePnlAtSpot`).

**Not Autofit:**

| That | Where it lives |
|---|---|
| Camera **Fit** (ISO framing of the box) | `CameraHud` · `scene.fit()` |
| Analyzer 2D ATM / 1σ autofit | `autofitView.ts` — **do not reuse** for Surface |
| Time-machine vol / spot / τ | Time HUD — does not replace Autofit |
| Cropping a fake left wall | Forbidden — fix the field, don’t hide it |

**Fit** = look at the box. **Autofit** = choose the S field so the book
is in the box, then (on the button) also Fit the camera.

---

## 2. Default strategy (`profile: "default"`)

As-built. Applies to every shown book until an amendment names a
profile.

### 2.1 Content set

Take the **outermost** of:

| Item | Clock | Why |
|---|---|---|
| Listed strikes | — | Structure markers (yellow) |
| T+0 / \(t_n\) breakevens | remaining \(\tau\) at sheet now (`max tauYears0`) | Magenta cut zeros |
| Expiry breakevens | \(\tau = 0\) | Cyan back-wall zeros |
| Live (or Time-machine) **spot** | — | Must stay **inside** the window |

“Whichever is furthest out” = `min` / `max` of that set. Spot is
**inside** the window. It is **not** required to be the midpoint. If
one breakeven sits farther from spot than the other, the window
**shifts** (the book slides in the box) so both outer points plus pad
fit.

### 2.2 Breakeven scan

Zero crossings of `evaluatePnlAtSpot` on a generous S scan
(structure width × 4 or 20% of spot, whichever is larger). Linear
interp at each sign change. Same book pricer as the sheet. Missing
zeros (always debit, always credit) are not invented — listed
strikes + spot still define content.

### 2.3 Pad

Equal pad on **both** sides of the content span:

- Pad = `max(median listed-strike step × 4, 10)` points.
- One listed strike or unknown step → step **5**.
- `sMin = max(0.01, contentLo − pad)`
- `sMax = contentHi + pad`

The same number of points beyond the left outer content and the
right outer content. If the outer content **is** the two breakevens,
that is “same pad on both breakevens.” If a wing sits outside a
breakeven, the wing is the outer content and still gets that pad.

### 2.4 Stretch / compress

The box strike width is fixed (host aspect). Mapping
`[sMin, sMax] → box X` is the stretch/compress. Autofit never
changes box geometry, P&L scale, or time depth.

### 2.5 Fail loud

Empty legs or non-finite / non-positive spot → throw. No silent
±35% of spot. No ATM-centered fallback that clips a farther BE.

---

## 3. When it runs

| Trigger | What happens |
|---|---|
| Position **added** or **shown** in the Analyzer book (Surface listens `ANALYZER_BOOK_EVENT` / book tick) | Recompute Autofit window → rebuild sheet |
| Book removed / last Show cleared | No sheet — WAITING. Next non-empty book Autofits again |
| Time-machine **vol** or **spot %** | Sheet rebuilds; Autofit reruns on the what-if legs / sim spot |
| **Autofit** button (`data-testid="surface-autofit"`) | Recompute window + camera **Fit** |
| Camera **Fit** only | Does **not** change `sMin`/`sMax` |

Autofit does **not** run on every playhead drag. Walking \(\tau\)
samples the existing sheet.

---

## 4. As-built map

| Piece | Path |
|---|---|
| Window | `web/lib/risk-graph/surfaceAutofit.ts` · `surfaceAutofitWindow` |
| Tests | `web/lib/risk-graph/surfaceAutofit.test.ts` |
| Invoke on book | `SurfaceApp` `computeSurfaceSheet({ sMin, sMax })` from Autofit |
| Button | `CameraHud` **Autofit** next to **Fit** |
| Profile hook | `AutofitProfileId = "default"` — unused until an amendment |

---

## 5. Special cases — amendment protocol

The default is **wrong** for some books (too wide, too tight, wrong
clock’s zeros, a wing that should not set the frame). Do **not**
patch `surfaceStrikeWindow` or add a second fitter.

Each special case is an **amendment** to this spec, then a
**profile** on the same function.

### 5.1 What an amendment must state

| Field | Required |
|---|---|
| **ID** | `AF-n` (next integer) |
| **Name** | Short, e.g. “short naked put — debit floor” |
| **Applies when** | Detectable from the shown book (template, topology, wing count, credit/debit) — fail loud if ambiguous |
| **What default does wrong** | Evidence: clipped peak, empty half-box, BE off-frame, etc. |
| **Content change** | Add / drop / replace items in the content set (which BEs, which Ks) |
| **Pad change** | Only if equal-pad default is the problem. Say left/right if they must differ — default remains equal |
| **Compress change** | Only if stretch/compress of the default span is the problem |
| **Must not** | Second pricer · invent strikes · hide a wall by cropping a fake field · ATM-center that clips the far BE |
| **Tests** | Characterization: outer content in box, spot in box, pad law |
| **Coach** | Stamp before code |

### 5.2 Registry (append only)

| ID | Profile id | Applies when | Status |
|---|---|---|---|
| — | `default` | Every shown book | **AS-BUILT** |
| *AF-1…* | *(named)* | *(amendment)* | *empty — wait Coach* |

When AF-1 lands, add a row here **and** a `AutofitProfileId` member.
Detection stays in one place. Default remains the fallback.

### 5.3 Amendment template (copy)

```text
### AF-n — <name>

**Applies when:** …
**Default failure:** …
**Content:** …
**Pad:** (unchanged | …)
**Compress:** (unchanged | …)
**Must not:** …
**Tests:** …
**Coach stamp:** pending | accepted YYYY-MM-DD
```

---

## 6. Laws

| ID | Law |
|---|---|
| **AF-L1** | One Autofit. Profiles amend; they do not fork. |
| **AF-L2** | Outer content = furthest of BEs (T0 and expiry) and listed Ks, plus spot inside. |
| **AF-L3** | Default pad is equal on both sides of that span. |
| **AF-L4** | Box X maps the Autofit window — stretch/compress is that map. |
| **AF-L5** | Run on viewport book change and on the Autofit control. |
| **AF-L6** | `evaluatePnlAtSpot` is the only P&L. No silent 0.20 / sticky smile. |
| **AF-L7** | Special cases only via §5 amendment + Coach stamp. |

---

## 7. Tests (default)

| ID | Check |
|---|---|
| **AT-AF-1** | Long fly: listed wings and expiry BEs inside `sMin`…`sMax` with pad |
| **AT-AF-2** | Spot strictly inside the window |
| **AT-AF-3** | `sMax − contentHi === contentLo − sMin` (equal pad; floor at 0.01) |
| **AT-AF-4** | Empty legs / bad spot throw |
| **AT-AF-5** | Autofit button exists (`surface-autofit`) and Fit does not change the window |

---

## 8. Open (not default)

- P&L (Y) Autofit — box height still uses `displayAbs` from the structure corridor.
- Time (Z) Autofit — window remains full remaining life unless §5.3c range is opened.
- Analyzer 2D sharing this module — **not** this spec; 2D keeps `autofitView.ts` until Coach unifies.
- First special-case families (vertical, condor, calendar, naked) — wait for a screenshot + AF-n.

---

## Changelog

| Ver | Date | Note |
|---|---|---|
| **v0.1** | 2026-08-17 | Default Autofit as-built. Amendment protocol for special cases. **DL-421**. |

**End of Options Lab Surface Autofit Spec v0.1**
