# Amendment AZ-VP-9-A18 — One Design, Every Ticker

**Date:** 2026-09-18
**Authority:** Coach directive: the same design used for SPX applies
to all other tickers in the system.
**Extends:** A2–A17, the stable-extension directive, and Contract
v1.2.1/v1.3. Nothing struck.

## The uniformity law

1. **One surface design for every symbol.** SPX, XSP, ES, MES, and
   every stable ticker render through the IDENTICAL surface —
   same layers, layout, controls, dialogs, presets, color grammar,
   behaviors, and performance budgets. No per-ticker variants, no
   bespoke chrome for the primary pairs.
2. **Only three things vary by symbol, all served:** the data, the
   tick grid (Contract v1.2.1 tick block → A16 derivation), and
   the provenance line (source→target, mapping state, coverage,
   dual-source tagging where law defines it).
3. **Symbol switch is pure re-derivation** (A16.4): selector reads
   the served registry; switching rebinds data, grid, stream, and
   provenance — zero layout or behavior change, zero per-symbol
   code paths (VP-L3 applied to the surface).
4. Any genuinely symbol-specific surface behavior, if ever needed,
   requires its own amendment naming the symbol class and the
   reason — never an if-statement that quietly forks the design.

## Standing

Citable law until folded into the SA spec's next authored version.
Surface work binds to A18 from this date.
