# GSC0-3 — Echo · Design contract

**Agent:** Echo  
**Date:** 2026-09-09  
**Constitution:** `Specs/FatTail-Labs-Human-Interface-Spec-v1.0.md`  
**Tokens file (read, not edited this session):** `web/styles/tokens.css`  
**Product code:** none.

Charlie implements this packet. Echo does not invent a third nav.

---

## Token map (Spec §8.5 → Labs tokens)

Define on **`:root` (light)** and redefine in **dark** (`@media (prefers-color-scheme: dark)` and `:root[data-theme="dark"]`). **Never dark-only.** Do not import the standalone HTML palette.

| Role (Spec §8.5) | Token | Light (Echo contract) | Dark (redefine) |
|------------------|-------|------------------------|-----------------|
| Region — Americas (also page accent) | `--color-session-americas` | `#0d9488` (aligns `--color-tint`) | `#2dd4bf` (aligns dark tint) |
| Region — Europe | `--color-session-europe` | `#2563eb` | `#60a5fa` |
| Region — Asia-Pacific | `--color-session-apac` | `#7c3aed` | `#a78bfa` |
| Region — Futures | `--color-session-futures` | `#c2410c` | `#fb923c` |
| Status — closed (banner + hatch) | `--color-session-closed` | `--color-label-tertiary` / hatch using `color-mix` with `--color-fill` | same roles, dark values |
| Status — early (banner + shifted times) | `--color-session-early` | `--color-warning` (`#ff9f0a` / dark `#ffd60a`) | redefine with `--color-warning` |
| Marker — now | `--color-session-now` | `--color-label` | `--color-label` |

Hatch: repeating 45° lines using `--color-session-closed` at low opacity on `--color-fill`. Not a profit red/green.

Page accent for Sessions chrome (pills already use `--color-tint`): Americas token **may equal tint**; do not introduce a second global `--color-tint`.

Existing `--hit-min: 2.75rem` (44px) stays. Date field, Today, Focus, Fit: **min-height `var(--hit-min)`**, focus-visible outline `2px` offset `2` using `--color-tint` — same grammar as `ResourcesSubNav` / `PracticeSuiteNav`.

---

## Chart geometry

- Sticky **left gutter ~232px** (`position: sticky; left: 0`) holding name, sub-label, computed ET range. Gutter background `--color-surface` so bars slide under it, not through it.
- Group headings: the **inner label** is sticky, not the full-width row (Spec §8.1).
- Hour grid every hour; tick labels every two hours + terminal **17:00**.
- RTH band behind all rows; width from `sessionView` (not hardcoded 09:30–16:00 on early-close days).
- Horizontal scroll **inside** the chart container only. Page body `overflow-x: hidden` on this route.

## Timescale

- **Focus on now** (default): ~85px/hour; marker centered. No marker → center 09:30 cash open. Re-center on load, resize, date change — until a **deliberate pan**.
- **Fit full day:** 23 hours in the viewport, no scroll.
- Pan detect: pointer / wheel / touch / key on the scroller — **not** the `scroll` event (L10). Re-arm on Today / date / Focus / Fit.

## Now-line

- Only when selected date is **today** and NY time is inside 18:00–17:00 ET (hidden in the halt).
- Badge flips when marker `left% > 80`.
- 20s interval; **clear on unmount**; one interval after date changes (AT-GSC-36).
- `prefers-reduced-motion: reduce`: **no `scroll-behavior: smooth`**, no animated re-center (jump).

## Widths

| Width | Note |
|-------|------|
| 1440 | Gutter 232 + ~85px/hour Focus fits several hours; Fit shows full axis |
| 1024 | Same chrome; Focus still pans; Fit may compress hour labels — keep 17:00 tick |
| 390 | Gutter may shrink **label type**, not below ~160px readable; chart still independent scroll; pills wrap (`flex-wrap`) as Practice does |

---

## OD-S4(c) visual contract (HTML missing — likely)

If Coach ticks reconstruct: Echo owns geometry below. Charlie builds against this list; Delta gates **shots**, not row-state (row-state is `sessionView` tsx).

1. Four region bar fills via the tokens above; lunch = two bars + 1px hairline connector in `--color-separator`.  
2. Closed / modified = hatch + `closed` / `modified` in gutter (warning color only on **shifted early-close times**, not on hatch).  
3. Sticky gutter + sticky group **label**.  
4. Focus ~85px/hour vs Fit; pan not via `scroll`.  
5. Now-line + badge flip + 20s + reduced-motion kill of smooth scroll.  
6. Banner above the chart in all four states (Tango strings).  
7. Light and dark at 1440 / 1024 / 390.

That is enough to ship without the 37 KB HTML.

---

## Nav

Extend **`ResourcesSubNav`** only. Same pill classes as today (`min-h-9` → raise to `--hit-min` if Echo GSC3-1 requires 44pt on the new Sessions **Link**; do not invent a third capsule). Do not touch `PracticeSuiteNav`.
