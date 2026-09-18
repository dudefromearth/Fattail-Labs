# Amendment AZ-VP-9-A20 — Right-Click Settings, Everywhere

**Date:** 2026-09-18
**Authority:** Coach directive: a right-click on any object — the
canvas, the candlesticks/price, the price scale, the date scale, the
volume profile, etc. — opens the settings dialog for that object.
**Extends:** A10 (universal dialogs, singleton). Supersedes A10's
plain-click invocation wherever plain click conflicts with an engine
gesture (axis drag-to-scale, canvas pan); the layer-control path
remains.

## The law

1. **Right-click = settings, universally.** Right-click on any
   canvas object opens THAT object's A10 dialog: canvas/backdrop
   (L0 + grid), price series (L1: format, timeframe), the volume
   profile (L2: anchor, opacity), structure lines (L3: weight),
   the price scale (side, and this scale's options), the date
   scale, the legend, chips — every configurable part, one
   gesture.
2. **Hit-testing resolves to the most specific object** under the
   cursor (a candle → price-series dialog; profile bar → profile
   dialog; empty canvas → backdrop); ambiguity resolves to the
   topmost visible layer.
3. **Singleton stands (A10.2):** the right-click dialog replaces
   any open dialog. The browser context menu is suppressed on the
   chart surface only.
4. **Touch equivalent:** long-press invokes the same dialog.
5. Layer-control and utility-bar invocations remain as secondary
   paths; the dialogs themselves are unchanged (A9/A10 pattern,
   lawful settings only).

## Standing

Citable law until folded into the SA spec's next authored version.
Surface work binds to A20 from this date.
