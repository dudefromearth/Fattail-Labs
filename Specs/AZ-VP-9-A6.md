# Amendment AZ-VP-9-A6 — Market Price Layer

**Date:** 2026-09-18
**Authority:** Coach directive (reconciliation session): a market
price layer viewable in multiple time slices, in formats including
line, candle, and bar.
**Supersedes:** the original AZ-VP-9 "no candlesticks" clause,
carried through A1/A2, is STRUCK — candles are now an explicit
format of the price layer. A2's profile-primary identity, A3's
color grammar, A4's axes/ranges, and A5's engine all stand; this
adds the market layer beneath them.

## The price layer law

1. **A market price layer renders on the canvas**, default ON,
   user-toggleable, in the user's choice of format: **line, candle,
   or bar** (the engine's native series types per A5).
2. **Time slices:** a selectable timeframe set — initial: 1m, 5m,
   15m, 1h, Daily (versioned config; extendable). The price layer's
   bars span the visible x-window per A4.
3. **Layering:** price layer is the base market layer; the volume
   profile (blue, side-anchored per A2) and, when enabled, the
   structural overlay (A3 colors) render in front of it. Structure
   lines span the canvas across the price layer — that is the
   product's core read: price against structure.
4. **Data, served server-side** (member browsers hold no market-data
   credentials): OHLC per timeframe from the platform's market-data
   services. Target source of record: aggregation from the VP print
   archive per source (ES/MES/SPY), with index-series marks for
   SPX/XSP display where appropriate; until a VP-side OHLC endpoint
   exists, the Labs backend may serve OHLC from existing platform
   market-data — the VP §2 kill rule is unaffected (it retired
   client OHLC **binning for profile purposes**, not price-series
   display).
5. **Contract note:** if serving OHLC through the VP API is chosen,
   that is a Contract v1.2 candidate — proposed to Coach, never
   improvised (coverage-floor precedent).
6. Timeframe, format, and layer-visibility are user settings,
   persisted per user; defaults: candle, 5m, ON.

## Standing

Citable display law until folded into the SA spec's next authored
version. Surface work binds to A6 from this date.
