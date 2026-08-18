# FatTail Labs — Options Lab Surface Autofit Spec v0.1.1

**Status:** **ACCEPTED** default (Coach stamp v0.1.1) · special-case amendments land here  
**Date:** 2026-08-17  
**Content version:** **v0.1.6**  
**Filename:** `FatTail-Labs-Options-Lab-Surface-Autofit-Spec-v0.1.md`  
**Home:** Options Lab Surface · `/app/options-lab/surface`  
**Parents:** App Spec v0.1.8 **§5.3** / **§5.3c** · Tech Spec v0.1 · Arch **33** · OT-EF v1.1 · **DL-421** (stands)  
**Bench:** [`docs/Options-Lab-Surface-Autofit-Full-Agent-Bench-Plan-v1.0.md`](../docs/Options-Lab-Surface-Autofit-Full-Agent-Bench-Plan-v1.0.md) · **DL-422** · board `agents/p-options-lab-surface-autofit/`  
**Code:** `web/lib/risk-graph/surfaceAutofit.ts` · `SurfaceApp.tsx` · `CameraHud.tsx`  
**Engine:** `surfaceModel.ts` `evaluatePnlAtSpot` only — no second pricer  

---

## 0. Coach intent (normative)

Autofit is a **general strategy for all positions**. The book must **fit
inside the viewport box**. That includes **breakevens and/or the listed
strikes, whichever is furthest out**, with **some padding**. **Stretch or
compress** the strike scale so the position fits.

Listed strikes are the **union of every shown structure** in the
viewport. Certain families will look wrong under the default. Those get
**adjustments** — they do **not** get a second Autofit. Amendments to
**this spec** name the special case (`AF-n`). Pad-in-points stays until
Coach sees index screenshots; then AF-n if needed.

**Invoke:**

1. Every time a position is **added to the viewport** (shown book changes).
2. On command when the member clicks **Autofit**.

**Do not invoke** on live spot drift, What-if dials, or playhead walk.
The **Autofit** button covers those.

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

App Spec **§5.3** is the workspace/camera/τ law. Autofit owns **S**.
§5.3c playhead walks \(\tau\) inside the time window; it does **not**
change the Autofit S window.

**Not Autofit:**

| That | Where it lives |
|---|---|
| Camera **Fit** (ISO framing of the box) | `CameraHud` · `scene.fit()` |
| Analyzer 2D ATM / 1σ autofit | `autofitView.ts` — **do not reuse** for Surface |
| **What-if** vol / spot % (App Spec **§4.6**) | Time HUD — rebuilds the sheet, does **not** Autofit |
| Time-machine snap rebind (App Spec **§4.6**) | Later feed — not these dials |
| Cropping a fake left wall | Forbidden — fix the field, don’t hide it |

**Fit** = look at the box. **Autofit** = choose the S field so the book
is in the box, then (on the button) also Fit the camera.

---

## 2. Default strategy (`profile: "default"`)

Accepted. Applies to every shown book until an amendment names a
profile.

### 2.1 Content set

Take the **outermost** of:

| Item | Clock | Why |
|---|---|---|
| Listed strikes | — | **Union** of every **shown** structure’s listed Ks |
| T+0 / \(t_n\) breakevens | remaining \(\tau\) at sheet now (`max tauYears0`) | Magenta cut zeros |
| Expiry breakevens | expiration-face \(\tau\) (`expiryFaceTau`: 0 single-DTE; \(\max\tau_0-\min\tau_0\) multi-DTE / OD-PF2) | Cyan back-wall zeros |
| **Spot** at Autofit time | live mid, or What-if sim spot **if** Autofit is running because the member hit the button | Must stay **inside** the window **when Autofit runs** |

“Whichever is furthest out” = `min` / `max` of that set. Spot is
**inside** the window at fit time. It is **not** required to be the
midpoint. If one breakeven sits farther from spot than the other, the
window **shifts** so both outer points plus pad fit.

Live spot **drift** after the last Autofit does **not** move the
window. What-if sim spot on the dial does **not** move the window.
The button covers both.

### 2.2 Breakeven scan

Zero crossings of `evaluatePnlAtSpot` on a generous S scan
(structure width × 4 or 20% of spot, whichever is larger). Linear
interp at each sign change. Same book pricer as the sheet. Missing
zeros (always debit, always credit) are not invented — listed
strikes + spot still define content.

### 2.3 Pad (member-controlled · both axes)

Autofit is **one algorithm on two axes**. Pad is the air; the book
**fills the remaining box**.

| Axis | Content | Pad | Fill |
|---|---|---|---|
| **Width (S)** | Outermost of listed Ks, T+0 BEs, expiry BEs, spot | Equal **left and right** | `[sMin, sMax] → box X` |
| **Height (P&L)** | Sheet `minPnL`…`maxPnL` and **$0** | Equal **top and bottom** | `[yMin, yMax] → box Y` |

- Pad = `max(contentSpan × padFrac, floor)` on **each** side.
- Default `padFrac` = **0.15** (Analyzer-like: 15% of span each side ≈ 30% of half-width).
- Width floor = **10** points. Height floor = **$1**.
- Member sliders: **Width pad** `0`…`85%` · **Height pad** `0`…`65%`. Same Autofit, new air.
- Moving a pad slider re-pads **held** content (does not rescan BEs).
- **Autofit** button / book-change **rescans** width content, then applies the current pads, then camera Fit (button only).

`$0` is not forced to box center. An asymmetric tent sits with matching air above the peak and below the floor.

### 2.4 Stretch / compress

The box size is the camera viewport. Autofit never changes box
geometry. Mapping `[sMin, sMax] → box X` and `[yMin, yMax] → box Y`
is the stretch/compress into the remaining space after pad.

### 2.5 Fail loud

Empty legs or non-finite / non-positive spot → throw. No silent
±35% of spot. No ATM-centered fallback that clips a farther BE.

---

## 3. When it runs

| Trigger | Autofit window? |
|---|---|
| Position **added** or **shown** (book change · `ANALYZER_BOOK_EVENT`) | **Yes** — recompute window → rebuild sheet |
| Book removed / last Show cleared | No sheet — WAITING. Next non-empty book Autofits |
| **What-if** vol or spot % (App Spec **§4.6**) | **Drop** — sheet may reprice; **sMin/sMax stay**. Button covers it |
| Live spot **drift** | **No** — button covers it |
| Playhead \(\tau^\*\) (App Spec **§5.3c**) | **No** — walk samples the sheet; window unchanged |
| **Autofit** button (`data-testid="surface-autofit"`) | **Yes** — recompute window + camera **Fit** |
| Camera **Fit** only | **No** — does not change `sMin`/`sMax` |

---

## 4. As-built map

| Piece | Path |
|---|---|
| Window | `web/lib/risk-graph/surfaceAutofit.ts` · `surfaceAutofitWindow` |
| Trigger law | `autofitShouldRun` |
| Tests | `web/lib/risk-graph/surfaceAutofit.test.ts` |
| Invoke on book / button | `SurfaceApp` freezes `sMin`/`sMax` until book key or `autofitGen` |
| Button | `CameraHud` **Autofit** next to **Fit** |
| Pad sliders | `PlanesHud` **Width pad** / **Height pad** |
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
| — | `default` | Every shown book | **ACCEPTED** v0.1.1 |
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
| **AF-L2** | Outer content = furthest of BEs (T0 and expiry) and the **union** of shown listed Ks, plus spot **inside at fit time**. |
| **AF-L3** | Default pad is equal on both sides of that span, in **points**. |
| **AF-L4** | Box X maps the Autofit window — stretch/compress is that map. |
| **AF-L5** | Run on viewport **book change** and on the Autofit **button** only. |
| **AF-L6** | `evaluatePnlAtSpot` is the only P&L. No silent 0.20 / sticky smile. |
| **AF-L7** | Special cases only via §5 amendment + Coach stamp. |
| **AF-L8** | No auto-refit on live spot drift or What-if dials. Playhead does not change the window. |

---

## 7. Tests (default)

| ID | Check |
|---|---|
| **AT-AF-1** | Long fly: listed wings and expiry BEs inside `sMin`…`sMax` with pad |
| **AT-AF-2** | Spot strictly inside the window **at Autofit time** |
| **AT-AF-3** | `sMax − contentHi === contentLo − sMin` (equal pad; floor at 0.01) |
| **AT-AF-4** | Empty legs / bad spot throw |
| **AT-AF-5** | Autofit button exists (`surface-autofit`) and Fit does not change the window |
| **AT-AF-6** | Two shown structures: window covers the **union** of their listed strikes |
| **AT-AF-7** | Playhead / What-if / live-spot triggers do **not** Autofit (`autofitShouldRun`) |

---

## 8. Open (not default)

- P&L (Y) special-case profiles (time-spread soft-cap) — default height Autofit is equal pad around the sheet extrema.
- Time (Z) Autofit — window remains full remaining life unless App Spec §5.3c range is opened.
- Analyzer 2D sharing this module — **not** this spec; 2D keeps `autofitView.ts` until Coach unifies.
- First special-case families (vertical, condor, calendar, naked) — wait for a screenshot + AF-n.
- Pad unit after index screenshots — points until then.

---

## Changelog

| Ver | Date | Note |
|---|---|---|
| **v0.1** | 2026-08-17 | Default Autofit as-built. Amendment protocol. **DL-421**. |
| **v0.1.1** | 2026-08-17 | Coach accept. What-if rename (§4.6). **Drop** Autofit on What-if dials. No auto-refit on live spot drift. Union of shown Ks. AT-AF-6/7. App Spec §5.3 pointer. Pad-in-points stays. **DL-421 stands**. |
| **v0.1.2** | 2026-08-17 | Autofit is pad-then-fill on **width and height**. Equal left/right and top/bottom. Member pad sliders. Default 15% of content span (Analyzer-like). **DL-423**. |
| **v0.1.3** | 2026-08-17 | Pad slider max **50%** (was 40%; +25%) on both axes. |
| **v0.1.4** | 2026-08-17 | Pad slider max **65%** (was 50%; +30%) on both axes. |
| **v0.1.5** | 2026-08-17 | Width pad max **85%** (was 65%; +30%). Height stays 65%. |
| **v0.1.6** | 2026-08-17 | Expiry BEs scan the **front-exp face** (OD-PF2 / **DL-427**), not \(\tau=0\) on every leg. |

**End of Options Lab Surface Autofit Spec v0.1.1**
