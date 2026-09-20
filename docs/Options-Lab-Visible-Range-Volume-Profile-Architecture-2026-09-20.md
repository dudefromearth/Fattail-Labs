# Visible Range Volume Profile — architecture overview

**Date:** 2026-09-20  
**SHA:** `2cd6e284`  
**Audience:** humans reading the as-built system (not a new Spec).

Normative as-built:

- Widget: [`Architecture/35-options-lab-volume-profile.md`](../Architecture/35-options-lab-volume-profile.md)
- API: [`Architecture/37-visible-range-volume-profile-api.md`](../Architecture/37-visible-range-volume-profile-api.md)
- Law: [`artifacts/reqs/REQ-007.md`](../artifacts/reqs/REQ-007.md) · **DL-788**
- Feature inventory: [`Options-Lab-Volume-Profile-Feature-Audit-2026-09-20.md`](./Options-Lab-Volume-Profile-Feature-Audit-2026-09-20.md)

---

## What it is

A member Options Lab chart that shows **how much volume traded at each price inside the time the trader can see**. That is Visible Range, in the TradingView sense.

Price is a Lightweight Charts candlestick series. The histogram is a **guest primitive** on that series: same Y scale, engine-driven paint, no second canvas.

The **server** computes bins. Prints where the store covers the contract; aggs-derived before that coverage. The client sends the visible time window (`from_t`, `to_t`) and draws `{price, volume}`.

---

## Why this shape

Coach: visible range is the most natural and the easiest to diagnose. The server must always update bins in real time. Full History is not a member mode.

Lightweight Charts already owns time, price, and paint. The product path is:

1. Candles on the series  
2. Visible candle window  
3. One `/window` GET  
4. Bins on the primitive  
5. `requestUpdate`

Pan, zoom, interval, symbol, and Refresh only change the window and re-run that path.

---

## Topology (short)

Member browser → Labs `/api/app/vp/v1/*` (cookie) → computing VP API (computing session) for bins/stream; StudioOne history for futures OHLC when hopped.

The computing API is not a browser origin.

---

## Defaults and holds

- Default interval **5m**. Default profile grain **24 rows** (ticks-per-row = 1 is in settings).
- Session open/close lines on (ES 5 PM / 6 PM Eastern).
- POC / VA not drawn (HOLD).
- REQ-007 not closed (AP-1 still Coach).
