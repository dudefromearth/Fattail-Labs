# Options Lab Surface Autofit — Full Agent Bench Plan v1.0

**Date:** 2026-08-17  
**Plan revision:** **v1.0**  
**Owner (orchestration):** Juliet  
**Authority:** Coach (GO / ship)  
**W0 artifact:** [`agents/go/OLSAF-W0.md`](../agents/go/OLSAF-W0.md) — Delta reads **this file**, not chat (DL-328).  
**Board:** [`agents/p-options-lab-surface-autofit/`](../agents/p-options-lab-surface-autofit/)  
**Governance:** [`agents/bench/doctrine.md`](../agents/bench/doctrine.md)

**Primary law:**

| Doc | Path | Status |
|-----|------|--------|
| Autofit Spec **v0.1.1** | [`Specs/FatTail-Labs-Options-Lab-Surface-Autofit-Spec-v0.1.md`](../Specs/FatTail-Labs-Options-Lab-Surface-Autofit-Spec-v0.1.md) | **ACCEPTED** · **DL-421** |
| App Spec v0.1.8 **§5.3** / **§5.3c** | [`Specs/FatTail-Labs-Strategy-Lab-3D-Surface-App-Spec-v0.1.8.md`](../Specs/FatTail-Labs-Strategy-Lab-3D-Surface-App-Spec-v0.1.8.md) | Frozen · Autofit pointer |
| App Spec **§4.6** What-if | same | Vol / spot % are What-if, not Time machine |
| Arch **33** | [`Architecture/33-strategy-lab-3d-surface.md`](../Architecture/33-strategy-lab-3d-surface.md) | As-built + Autofit row |
| OT-EF v1.1 | IV NO · additive book | NORMATIVE |

Specialists execute **only** via seeds. Delta: **PASS / FAIL / BLOCKED** — never waived.

**Do not reopen** Surface first-ship W0–W5 (`p-options-lab-surface`).  
**Do not seed** AF-n special cases until Coach files a screenshot + amendment.  
**Do not** reuse Analyzer 2D `autofitView.ts`.

---

## 0. Why this program exists

Surface first-ship boxed the tent. The book was **spot-centered on listed
wings**, so a farther T+0 breakeven clipped the box wall. Coach named
**Autofit**: one general S-window so the shown book fits, with pad, stretch
or compress. Special families later amend the **same** spec (`AF-n`).

Default **v0.1.1 is accepted**. Code landed ahead of this board
(`surfaceAutofit.ts` · freeze on book key + button). This program
**characterizes, gates, and tells the truth** — it does not invent a
second fitter.

---

## 1. Mission

```text
Accepted Autofit Spec v0.1.1
  → Coach stamps agents/go/OLSAF-W0.md (W0)
  → Echo gates Autofit button copy (W1)
  → Delta + Kilo lock AT-AF-1…7 on disk (W2)
  → Charlie honesty: book/button only; union Ks; freeze What-if / live spot / playhead (W3)
  → Kilo + Echo evidence (W4)
  → Lima as-built (W5)
  → Later: AF-n only after Coach screenshot + spec amendment
```

**Ship meaning:** `/app/options-lab/surface` Autofit is the default S
window. Adding or showing a position refits. **Autofit** button refits +
camera Fit. Live spot drift, What-if dials, and playhead **do not**
change `sMin`/`sMax`. Pad stays **in points** until Coach sees index
screenshots.

---

## 2. Hard gates

| Gate | Rule | Unblocks |
|------|------|----------|
| **W0 Coach GO** | Stamp exists at `agents/go/OLSAF-W0.md` | W1 · W2 · W3 |
| **W1 Echo labels** | No Autofit chrome change until `echo-labels.md` gated | W3 button copy |
| **W2 Delta list** | No further Autofit code until `characterization-list.md` is complete | W3 honesty / tests |
| **AF-n** | No profile code without a stamped amendment in Autofit Spec §5 | Later packets |

W1 and W2 may run after W0 in parallel. **W3 waits on W0-G + W1-G + W2-G.**

---

## 3. First-wave scope

| In | Out |
|----|-----|
| Default `profile: "default"` | AF-1… special cases |
| Union of **shown** listed strikes | Invented Ks · ATM-center that clips a BE |
| AT-AF-1…7 | Y Autofit · Z Autofit |
| Freeze window on What-if / live spot / playhead | Time-machine **snap feed** |
| Autofit button + Fit stays camera-only | Analyzer 2D `autofitView.ts` merge |
| Pad-in-points as-built | Pad-unit change (wait screenshots) |

---

## 4. Waves

| Wave | Who | Work | Gate |
|------|-----|------|------|
| **W0** | Coach | Stamp [`agents/go/OLSAF-W0.md`](../agents/go/OLSAF-W0.md) on **v1.0** | W0-G |
| **W1** | Echo · Tango optional | Gate Autofit vs Fit copy (`echo-labels.md`) | W1-G |
| **W2** | Delta · Kilo | `characterization-list.md` = AT-AF-1…7 only | W2-G |
| **W3** | Charlie · Kilo | Trigger freeze + union + tests match spec | W3-G |
| **W4** | Delta · Echo | Evidence: book add refits; What-if / playhead / live mid do not; button does | W4-G |
| **W5** | Lima | Arch 33 / DL honesty if anything drifted | W5-G |

**Later (not this board until Coach opens it):**

- AF-n after index / family screenshots  
- Pad unit change  
- Analyzer 2D sharing this module  

---

## 5. Characterization (W2-G is this set)

| Id | Assert |
|----|--------|
| **AT-AF-1** | Long fly: wings + expiry BEs inside `sMin`…`sMax` with pad |
| **AT-AF-2** | Spot inside the window **at Autofit time** |
| **AT-AF-3** | Equal pad: `sMax − contentHi === contentLo − sMin` (0.01 floor) |
| **AT-AF-4** | Empty legs / bad spot throw |
| **AT-AF-5** | `surface-autofit` exists; camera **Fit** does not change `sMin`/`sMax` |
| **AT-AF-6** | Two shown structures: window covers the **union** of listed Ks |
| **AT-AF-7** | `autofitShouldRun`: book-change + button **true**; What-if, live-spot, playhead, camera-fit **false** |

Hotel / India: no second pricer; no crop-to-hide a fake wall.

---

## 6. Out of this program

- MSC source, vendor, copy  
- Reopening `p-options-lab-surface` W0–W5  
- Time-machine snap **feed**  
- Analyzer layout residual  
- Keep-Warm board  
- MiniTwo (unless Coach asks a deploy)  
- Editing Autofit Spec v0.1.1 body except AF-n append + changelog  

---

## 7. Status

Plan revision **v1.0**. Spec **v0.1.1 ACCEPTED**.  
W0–W5 **PASS** (W4 = Coach walk). AF-n later.

**End of Surface Autofit Full Agent Bench Plan v1.0**
