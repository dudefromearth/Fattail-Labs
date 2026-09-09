# Echo · Visual contract (OD-S4 c)

**Date:** 2026-09-09  
**Stamp:** Coach OD-S4 **(c)** RECONSTRUCT. HTML not found.  
**This file is the visual reference for GSC4 and GSC5.**  
**Derived from:** Spec §8, §8.5, §12.2 ribbon, Human Interface Spec v1.0.  
**Product code:** none in this packet.

Charlie builds GSC4 against this document. Delta gates screenshots against it, not against `session-clock.html`.

---

## 1. Tokens (Spec §8.5)

Define on `:root` **and** redefine in dark (`prefers-color-scheme: dark` and `:root[data-theme="dark"]`). Never dark-only. GSC5 lands the names; GSC4 may paint with the existing semantic stand-ins until then.

| Role | Token | Light | Dark |
|------|--------|-------|------|
| Region — Americas (page accent too) | `--color-session-americas` | `#0d9488` | `#2dd4bf` |
| Region — Europe | `--color-session-europe` | `#2563eb` | `#60a5fa` |
| Region — Asia-Pacific | `--color-session-apac` | `#7c3aed` | `#a78bfa` |
| Region — Futures | `--color-session-futures` | `#c2410c` | `#fb923c` |
| Status — closed / hatch | `--color-session-closed` | `var(--color-label-tertiary)` | same role |
| Status — early (shifted times only) | `--color-session-early` | `var(--color-warning)` | `var(--color-warning)` |
| Marker — now | `--color-session-now` | `var(--color-label)` | `var(--color-label)` |
| Teaching-frame ribbon | `--color-session-frame` | `color-mix` of `--color-label` 12% into `--color-fill` | same mix on dark fill |

Hatch: 45° repeating 1px lines of `--color-session-closed` at low opacity on `--color-fill`. Not profit red/green. Warning color **only** on shifted early-close **times**, never on the hatch.

---

## 2. Chart geometry (1440 / 1024 / 390)

| Measure | Value |
|---------|--------|
| Sticky gutter | **232px** at 1440 and 1024. At 390, shrink **type**, not below **160px** readable. `position: sticky; left: 0`. Background `--color-surface` so bars slide under it. |
| Group heading | The **inner label** is sticky, not the full-width row. |
| Row height | 36px bar + 8px vertical padding (44px hit-ish row). Group heading 28px. |
| Hour grid | 1px `--color-separator` every hour; labels every **two** hours + terminal **17:00**. |
| Focus | **85px / hour**. Marker centered until a deliberate pan. |
| Fit | Full 23h in the scroller. No page-body sideways scroll. |
| RTH band | From `sessionView.bandEndEtMin` and 09:30 ET via `toAxis`. Absent when `bandEndEtMin` is null. Fill ~8% label on the chart. |
| Lunch | Two bars + **1px** hairline `--color-separator` in the gap. Not one bar. |
| Now-line | 1px `--color-session-now`. Badge 11px type, 4px padding, flips when marker is past **80%** of the axis. Hidden in 17:00–18:00 halt and on non-today. |
| Teaching ribbon | **Below** the hour axis, **above** venue rows. Height 22px. Labels `Morning` / `Afternoon` / `Closing` in caption type. Truncated chip: lowercase `truncated`. Not a venue bar (no region fill, no hatch). Distinct from grid ticks. |

## 3. Chrome

Banner above the chart, all four states (Tango). Date / Today / Focus / Fit: `min-height: var(--hit-min)`, `focus-visible` 2px offset 2 `--color-tint`.

## 4. Motion

`prefers-reduced-motion: reduce` → no `scroll-behavior: smooth`, jump re-center. GSC5.

## 5. What this is not

Not a port of missing HTML. Not a third nav capsule. Not profit coloring. Segment ribbon is a **frame**, not market structure (§12.2).
