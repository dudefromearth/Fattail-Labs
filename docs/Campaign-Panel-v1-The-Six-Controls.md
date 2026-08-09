# Campaign Panel v1 — The Six Controls
## Build note (Coach direction, 2026-08-09) — supplements the Prescribed Panel directive

**This is the v1 surface, stated concretely.** Six attributes, displayed almost identical to a blood-work report (Coach's CMP reference), house ranges seeded around the values in Coach's Reports screenshot, **admin-only** range tuning behind an edit toggle, members read-only. Radar + time slider live from day one — the panel is always complete (six axes ≥ Minimum Shape floor), so shape-viability is guaranteed structurally.

---

## 1. Anatomy of one control (×6, identical)

Blood-work grammar, per Coach's CMP screenshot:

```
  ATTRIBUTE NAME                                    [value bubble: 52.7]
  Reference range: 40 – 60                                  ▼
  ├────────────┃━━━━━━━━━━━━━━━━━━━━┃────────────┤
  total-low    acceptable-low   acceptable-high   total-high
  (flank)          (in-range segment)              (flank)
```

| Element | Rule |
|---------|------|
| **Total range** | The bar's full display domain (the whole strip, flanks included) |
| **Acceptable range** | The in-range segment **inside** the total range (the green band; flanks amber/yellow) |
| **Pointer + number** | Marker sits at the current campaign reading; value in a bubble above it (CMP style) |
| **States** | In range (marker on green) · out of range (marker on flank, either side) · **gathering** (below n-floor: no marker, no number — "gathering — n below reference validity") |
| **Label line** | "Reference range: X – Y" printed under the attribute name, exactly like the lab report |

**Sizing rule (Coach, 2026-08-09):** each control **scales to the width of its container** — the strip fills 100% of available width, and all geometry is proportional: total range maps to full width; acceptable-segment position and pointer position are percentage math against the total range. Same proportions at every size (desktop card, panel column, phone). No fixed pixel widths, no truncated flanks, no horizontal scroll, no breakpoint that changes the visual grammar. Value bubble stays anchored to the pointer at all widths (collision with strip ends handled by Echo — bubble may shift inboard, pointer never lies). Phone path is a locked floor; the report reads identically there.

## 2. The six, with seed ranges (arbitrary starting bands around Coach's Reports values — admin tunes from here)

| # | Attribute | Current-value example (Reports 2026-08-08) | Seed **acceptable** range | Seed **total** range |
|---|-----------|--------------------------------------------|---------------------------|----------------------|
| 1 | Win rate | 52.7% | 40 – 60 | 0 – 100 |
| 2 | Risk-to-reward | 12.54 | 9 – 18 | 0 – 30 |
| 3 | Max drawdown (of peak) | 6.00% | 0 – 6 | 0 – 15 |
| 4 | Avg win/loss ratio | 1.61 | 1.2 – 2.2 | 0 – 4 |
| 5 | Profit factor | 1.79 | 1.3 – 2.5 | 0 – 5 |
| 6 | Sharpe ratio | 4.89 | 2 – 6 | 0 – 10 |

Seeds are deliberately **arbitrary starting bands** per Coach — the admin dial is how they get tuned to doctrine. (Sharpe's v1-defer disposition is overridden by this direction: it ships as a display control; Hotel still pins its computation basis.)

## 3. Admin edit toggle (the only editor, for now)

- **Edit toggle visible to administrators only** (role: administrator). Members never see edit affordances — they see the report.
- Toggled on, each control exposes its **dial**: adjust the acceptable range (expand/contract — drag band ends or stepper on the two numbers) and the total range (display domain). Six controls, each with total + acceptable, exactly as stated.
- Storage: the existing `member_practice_campaign_bounds` rows (role `boundary`, both range ends) **plus display-domain fields** (`display_low`/`display_high` or panel-config — India keep/kill on where total range lives; it is presentation range, not doctrine range, so panel-level config is acceptable if bounds rows stay pure).
- Admin edits on an **active (signed) charter still write amendment rows** — the witness machinery does not care who holds the pen; history stays honest.
- **Deferred, not dropped:** member-facing range adjustment (the informed-patient case), goal-role surface rendering, frame-grid picker. All machinery exists in the model (Spec v1.2); the v1 surface simply doesn't expose it. When member editing arrives, signature/amendment law is already waiting.

## 4. Radar + time slider (live at v1)

- Six axes = the six controls. Alignment semantics per §6a (in-band = full extension, decaying off-band **both sides**; big shape = faithful, never big numbers).
- **Time slider bound T0 → present**, bidirectional, as-of-T evaluation per §6a.3; axes wake from "gathering" as n-floors pass — the fingerprint comes into focus.
- Always shape-viable: six axes ≥ Minimum Shape floor by construction. No empty-invitation state needed on the mainline — every campaign panel has six lines from birth (ledger still has **none**: no panel, no radar — the U1 guard stands).

## 5. Out of this build

No member bounds editing · no Add-bound form (dead per directive) · no process-clause rows on this surface (scope/size/window witness continues server-side; surface later) · no goal-role chrome · no Journey feed · no P&L on the radar · D6 vol gauge still queued on its OD.

## 6. Seed deltas

| Seed | Delta |
|------|-------|
| U2-1 | Rebuild = **this note**: six controls, CMP anatomy, admin toggle, no member editor |
| B3-1 | Panel derive serves the six (values + gathering per n-floor); display-domain config read |
| J1/J2 | Unchanged — six axes guaranteed; drop empty-invitation from mainline path |
| B4-1 | Frames defer at surface (panel is house-seeded v1); Hotel still authors doctrine ranges as the admin-tuning target |
| Kilo | + admin-only toggle (member session sees no edit affordance — grep + render test); + amendment row on admin range edit of signed charter; + six controls render with seeds on fresh campaign; + Sharpe display present; + **proportional geometry at narrow widths** (pointer/segment positions = same percentages at 320px as at desktop) |
| Echo | **Container-width scaling** per §1 sizing rule; value-bubble collision at strip ends (bubble shifts inboard, pointer never lies); vertical rhythm of six stacked controls on phone |
| Tango | Report register on labels ("Reference range: X–Y", "gathering"); admin chrome wording |

*Six strips, six ranges inside ranges, six pointers with numbers, a radar that's always ready, and one admin dial behind a toggle. The member reads their blood work; the doctor tunes the reference ranges; the season draws itself.*
