# Amendment AZ-VP-9-A16 — Per-Instrument Tick Pricing

**Date:** 2026-09-18
**Authority:** Coach directive: each futures contract has its own
tick pricing; the chart must take that into account.
**Refines:** A15 clause 5. Nothing struck.

## The law

1. **The price scale's increments derive from the INSTRUMENT'S own
   tick metadata** — minimum tick per contract from the
   symbol-metadata service (futures fed by the vendor Contracts
   reference; equities/index displays by their own metadata) —
   never a hardcoded 0.25 or any per-symbol constant in surface
   code (the VP-L3/VP-L12 principle applied to display).
2. Tick values and grid lines land on multiples of that
   instrument's tick; major labels on clean multiples appropriate
   to the tick and zoom; crosshair and last-price labels round to
   the instrument's tick, never beyond its precision.
3. Switching instrument (ES→SPX, SPY/MES→XSP, and any future
   symbol) re-derives the scale automatically; a new contract added
   to metadata needs zero surface changes.

## Standing

Citable law until folded into the SA spec's next authored version.
