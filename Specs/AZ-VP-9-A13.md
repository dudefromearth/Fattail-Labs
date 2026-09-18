# Amendment AZ-VP-9-A13 — TradingView Look Parity

**Date:** 2026-09-18
**Authority:** Coach directive with reference screenshots: our layout
must look like the provided TradingView layout.
**Supersedes:** A11 clause 6's muted/hollow candle DEFAULT — candles
default to TV-standard green/red; the separation principle survives
via structure's line weights (4 px heavies) and Coach-tuned shades.
Everything else in A2–A12 stands; this law is how it must LOOK.

## The benchmark

Coach's 2026-09-18 TradingView screenshots (ES1! VRVP set) are the
recorded visual benchmark, filed with this amendment. "Does it look
like the benchmark" is the acceptance test, judged by Coach's eye.

## Parity requirements (defects vs the current build, each is law)

1. **Profile anchored FLUSH to the chosen axis edge** — bars grow
   from the axis into the canvas (A12.1). Never a floating block
   mid-canvas.
2. **Long translucent bars:** default profile opacity in the TV
   range (~35–50%, Coach-tuned) so candles read through; max bar
   extends a substantial fraction of canvas width (TV-like, config;
   benchmark shows roughly half to three-quarters); minimum one-
   pixel bar for any nonzero row so thin rows remain visible.
3. **Prominent price layer:** TV-standard green/red candles at full
   visibility — the price action is a first-class element, never
   background dust.
4. **Y-range auto-fit on open:** visible price window fits the data
   span with sensible margin (A11's defaults law); no dead void.
   Manual pan/zoom then governs per A4.
5. **Last-price line + axis label** (the TV "Ask"-style tag):
   engine-native price line and last-value label, on by default.
6. **Edge-to-edge dark:** everything inside the app's page frame —
   utility bar, tabs, chips, canvas surround — dark theme matching
   the canvas; only the Labs global site chrome is outside this
   law's reach.
7. **Axis and grid styling per the benchmark:** crisp light axis
   text on dark; grid subtle beneath data (A4.3), never brighter
   than bars.
8. Structure overlay (when on) renders per A3 over this look; the
   4 px node heavies and line weights carry the separation from
   candle colors.

## Standing

Citable look law until folded into the SA spec's next authored
version. The benchmark screenshots accompany this file on the
board. Surface work binds to A13 from this date; Coach's eye is
the gate.
