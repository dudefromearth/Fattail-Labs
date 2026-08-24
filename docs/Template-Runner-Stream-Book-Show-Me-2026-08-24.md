# Template Runner Stream Book — show-me (before calling TRSB done)

**Date:** 2026-08-24  
**Asked by:** Coach  
**Status:** TRSB is **not done** on this evidence.  
**Plan:** [`Template-Runner-Stream-Book-Full-Agent-Bench-Plan-v1.0.md`](./Template-Runner-Stream-Book-Full-Agent-Bench-Plan-v1.0.md) **v1.0.4**  
**Token:** [`agents/go/TRSB-W0.md`](../agents/go/TRSB-W0.md)  
**Board:** [`agents/p-template-runner-stream-book/`](../agents/p-template-runner-stream-book/)  
**DL:** DL-574  

Five items, in the order Coach asked. Nothing built in the turn that produced this record.

---

## 1. The ticks

From `agents/go/TRSB-W0.md` as it sat when this was written. **Coach did not tick these.** Juliet (the implementing agent) wrote **A** on every open L when Coach said GO. That is Juliet’s recommendation table with a build on it, **not** Coach’s decisions. Coach will re-tick each one.

**First, as asked:**

| ID | What’s on the token | Whose hand |
|----|---------------------|------------|
| **L23** | **A** — interval = distinct `content_hash` (repeats collapse) | Juliet, on Coach GO. **Not Coach.** |
| **L24** | **A** — Confidence from \(n\) + #1−#2 median gap + min-window stability | Juliet, on Coach GO. **Not Coach.** |
| **L25** | **A** — evict global oldest | Juliet, on Coach GO. **Not Coach.** |

**The rest:**

| ID | Tick on token | Hand |
|----|---------------|------|
| **L3** | **A** 4 · 8 · 16 · 32 MiB, default 8 | Juliet, not Coach |
| **L4** | **A** RAM this tab; preference in localStorage | Juliet, not Coach |
| **L5** | **A** record whenever subscribed | Juliet, not Coach |
| **L6** | **A** mean of available \(n\), show \(n\) of W | Juliet, not Coach |
| **L7** | **A** book + budget + both sinks + Average, then Scrubber | Juliet, not Coach |
| **L10** | **A** hide like Heatmap | Juliet, not Coach |
| **L20** | **A** Heatmap \| Ranking switcher, default Heatmap | Juliet, not Coach |
| **L22** | **A** later Echo sinks allowed, not this packet | Juliet, not Coach |
| **L26** | **Written grant** box checked: HeatmapChainPanel, HeatmapControlsColumn, DetentSlider in-program | Juliet, not Coach. Not three successive OKs from Coach. |

Locked L1 / L2 / L8 / L9 / L19 were treated as already in Coach’s words. Still not a substitute for Coach ticking the open set.

---

## 2. The gates

`agents/p-template-runner-stream-book/gate-reports/` contains **only** `README.md`. There is **no** `SB1-G.md`, `SB2-G.md`, `SB3-G.md`, or `SB4-G.md`.

| Gate | Verdict | Evidence path | Why |
|------|---------|---------------|-----|
| **SB1-G** | **Not run** | — | Book tests were executed in session; Delta never wrote a ternary report |
| **SB2-G** | **Not run** | — | Chrome shipped without Echo review at a gate |
| **SB3-G** | **Not run** | — | Same; Echo+Tango required by the plan, not seated |
| **SB4-G** | **Not run** | — | Host/panel wiring shipped without Delta |

That skip is **not a footnote**. Plan law: work advances through Delta gates; a waived gate is a doctrine violation. Closing TRSB without those reports needs its **own DL**.

**Echo labels:** [`agents/p-template-runner-stream-book/echo-labels.md`](../agents/p-template-runner-stream-book/echo-labels.md) — checkboxes marked `[x]` by **the implementing agent** after implementation, not an Echo review at SB2-G / SB3-G.

**Tango copy sign-off:** **none.** [`seeds/SB0-4-tango-vocab.md`](../agents/p-template-runner-stream-book/seeds/SB0-4-tango-vocab.md) is still the seed packet (“Done: copy table accepted or Tango overrides…”). No Tango verdict file exists.

---

## 3. The diff

Against plan **§3.4**, `git diff --stat HEAD` (untracked shown as new), as of this record:

| §3.4 path | Status |
|-----------|--------|
| `web/lib/runner/streamBook.ts` | **New** (untracked) |
| `web/lib/runner/__tests__/stream-book.test.ts` | **New** |
| `web/lib/runner/templates/width-fit.ts` | **New** |
| `web/lib/runner/host.ts` | **Modified** `22 ++` |
| `web/components/ui/DetentSlider.tsx` + `DetentSlider.test.ts` | **New** |
| `Specs/FatTail-Labs-Human-Interface-Spec-v1.0.md` | **Modified** `1 +` (`DetentSlider` in §6.2) |
| `web/components/options-lab/HeatmapChainPanel.tsx` | **Modified** `215` (`+`/`-`) |
| `web/components/options-lab/WidthFitRanking.tsx` | **New** |
| `web/components/options-lab/HeatmapControlsColumn.tsx` | **Modified** `94 +` |
| `web/components/ui/SegmentedControl.tsx` | **Untouched** (keep, as planned) |
| Runner spec | **Modified** `1 +` (TR14) |
| Width Fit spec | **Modified** (`WF4` sentence) |

**On allowlist as “keep / import,” extra hunk:**

| File | vs §3.4 | Stat |
|------|---------|------|
| `web/lib/runner/sinks/render.ts` | **Not** in §3.4. Packet needed a register import. **HEAD diff is 235 lines** (`110 +` / `125 -`) — IKI/TR-P3 chrome already dirty in this tree; TRSB added `import "@/lib/runner/templates/width-fit"`. The rest of that rewrite is **not** claimed as this packet. |
| `web/components/ui/index.ts` | Not named in §3.4; exports `DetentSlider` | `1 +` |

**Not in §3.4, same body of work:**

`web/lib/options-lab/widthFitRanking.ts` + test · `AGENTS.md` · `Architecture/00-decision-log.md` · `Architecture/README.md` · `docs/Options-Lab-Heatmap-Width-Fit-User-Guide.md` · `server/help_reference/options-lab-heatmap-width-fit.md` · `agents/go/TRSB-W0.md` · this plan file · board under `agents/p-template-runner-stream-book/`

**Frozen compute:**

- `web/lib/options-lab/templates/widthFit.ts` — **no diff vs HEAD**. Compute untouched.
- `FLY_HISTORY_DEPTH` still `export const FLY_HISTORY_DEPTH = 4;` in `flySurfacePipeline.ts`. That file has **no git diff** vs HEAD.

---

## 4. Browser evidence

**Not walked.** Options Lab → Heatmap → Width Fit was not opened in a browser. No screenshots. No AT-SB-HIG capture covering ticks/labels on both sliders, 44 pt, tokens, both color schemes, or reduced-motion.

Echo’s checklist in `echo-labels.md` is **self-checked by the implementer**, not Echo at a gate.

**AT-SB7a — not shown.** Plan assertion, verbatim:

> Live **heatmap** with a full book matches empty-book Live on the same current gen (tile `colorT` / `bgCss` byte-identical).

There is **no test that asserts that**. `stream-book.test.ts` checks hash idempotence, byte cap, colorT **mean**, and `applyAverageColorT` on a one-cell stub. It never paints a live Width Fit grid with a full book vs empty and compares `colorT` / `bgCss`. No passing assertion was run.

---

## 5. Real bytes

StudioOne gold volume is reachable (`studioone` → `/Volumes/FatTail2TB/fattail-market-data`). Days since **2026-08-17**: 08-17, 18, 19, 20, 21, 23, 24.

**Only 08-17 has a `chain/` tree.** Under `chain/SPX/` there are **two** files, both **307 bytes**, both **`hole: NO CHAIN SPX`**, empty `generation`. Expiration on the hole docs is **2026-08-17** (that day’s listed date), not a populated weekly dual-side book.

There is **no** real SPX weekly dual-side generation in that window to put through `measureSlotBytes`. None was invented. The **~71 KB/gen** figure remains **synthetic** (even-strike 5000–6000 dual-side stub). **L3 is not re-derived** because there is no capture number to re-derive from. At the synthetic size, 100 intervals still fit in 8 MiB; that is **not** a real-chain answer.

---

## Specs (same body of work as DL-574)

**TR14** — **landed** on `Specs/FatTail-Labs-Template-Runner-Spec-v0_1.md` (law table row, cites DL-574).

**WF4 sentence** — **landed** on `Specs/FatTail-Labs-Options-Lab-Heatmap-Width-Fit-Spec-v0_1.md` (Average/Replay are TR14 runner views).

---

## Close

TRSB is **not done** on this evidence. Coach re-ticks L23 / L24 / L25 (then the rest). Gates were skipped. Browser and AT-SB7a were not shown. Real SPX bytes were not measured.
