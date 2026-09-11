# DLG2 — Echo · AT-DLG-17 itemised

**Date:** 2026-09-11
**Spec:** v0.6 §5.2 · AT-DLG-17
**Verdict:** each line **PASS**. Layout §5.3 not restyled into something else.

| Line | Law | Echo |
|------|-----|------|
| Type ladder with distinct steps | DLG-HIG-1 | **PASS** — title `--text-title-3` semibold; section `--text-caption` uppercase secondary; control label `--text-subheadline`; value `--text-body` tabular-nums; caption `--text-caption` |
| Buy/Sell is a segmented control | DLG-HIG-3 | **PASS** — `SegmentedControl` (HI kit). Selection via surface fill, not hue |
| Every menu is a pop-up button | DLG-HIG-3 | **PASS** — strategy, centre, width, expiration, strike, symbol are `<select>` in `CardMenuField` |
| Labels and values on a common alignment axis | DLG-HIG-4 | **PASS** — `grid-cols-[7rem_minmax(0,1fr)]`. Title leads, not centred. Legs on a column grid |
| Commit is the default button, last in reading order, Return-bound | DLG-HIG-5 · 6 | **PASS** — Cancel then Analyze/Update. Tint fill on commit. Enter fires `handleSave` except `[data-value-field]` |
| Colour is semantic only; Buy/Sell distinguishable with hue removed | DLG-HIG-8 | **PASS** — tint / label / fill / separator / code-surface. Buy/Sell labels + selected segment, not green/red |
| Hairline separators, one elevation, one radius | DLG-HIG-9 | **PASS** — `--color-separator`, `--elevation-3`, `--radius-lg` |
| Reduce-motion honoured | DLG-HIG-12 | **PASS** — no CSS transitions added. Drag is member-caused. Payoff `scaleY` is diagram state, not a transition |
| Every control has an accessibility label | DLG-HIG-13 | **PASS** — Symbol, Strategy, Buy or Sell, Call or Put, Centre, Width, Expiration, Strike, Add leg, Copy, Remove, Package debit |

**AT-DLG-16.** Panel 820, `px-5`/`pt-5`/`py-5` = 20 inset, content 780. Off-grid spacing grep empty.

**AT-DLG-6.** Structure → payoff+Buy/Sell+name under strategy → Right when `TEMPLATE_HAS_SIDE` → Shape (centre, width, expiration, legs) → Position (basis, packages) → script → Cancel · Analyze/Update. Preview, entry time, Submit absent. Free-floating `aria-modal="false"`.
