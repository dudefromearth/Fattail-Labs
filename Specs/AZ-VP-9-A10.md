# Amendment AZ-VP-9-A10 — Universal Settings Dialogs, One at a Time

**Date:** 2026-09-18
**Authority:** Coach directive (reconciliation session): every part
of the canvas has a similar settings dialog, looking alike and
floating over the canvas; only one dialog can be active at a time.
**Extends:** A9 — its dialog pattern becomes universal; its
per-layer scope is widened, nothing struck.

## The law

1. **Universal pattern.** Every configurable part of the canvas —
   the layers (A9) AND the canvas parts themselves: axes (side,
   scale), grid/backdrop (intensity), the price and time scales'
   range presets, the legend, the utility-bar chips — opens the
   SAME floating dialog: non-modal, draggable, dismissible,
   position remembered, identical visual shape (header: part name
   + its primary toggle where lawful; body: that part's lawful
   settings only, per A7/A9.3).
2. **Singleton rule.** ONLY ONE dialog is active at a time —
   invoking any dialog closes the currently open one. No stacking,
   no dialog clutter over the terrain.
3. Invocation is consistent everywhere: from the layer control for
   layers, from the part itself (click/tap the axis, the legend,
   the chip) for canvas parts.
4. One reusable component implements all of it (A9's construction
   rule extended): a new configurable part added later inherits
   the dialog, the look, and the singleton behavior by
   construction.
5. Per-user persistence covers every dialog's values and last
   position (A8.2/A9.5 pattern).

## Standing

Citable display law until folded into the SA spec's next authored
version. Surface work binds to A10 from this date.
