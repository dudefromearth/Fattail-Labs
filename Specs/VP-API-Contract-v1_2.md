# VP Profile API — Contract v1.2

**Status:** FROZEN interface contract. **Supersedes:**
VP-API-Contract-v1_1.md (sha1 d01b3dd9bfbac3bbcafb34110ef7d06cd6650915).
**Date:** 2026-09-18
**Change (sole):** the market price layer (AZ-VP-9-A6) — OHLC time
slices become servable. Everything in v1.1 carries forward unchanged
in meaning; existing clients remain valid.

## Added: OHLC endpoint

```
GET /v1/ohlc/{source_symbol}/{timeframe}?from=&to=
    source_symbol ∈ SPY | ES | MES
    timeframe ∈ 1m | 5m | 15m | 1h | 1d   (versioned set)
    from/to: date-time bounds within the visible x-window (A4)
```

Response envelope: identity block, status + flags, gaps[], and
coverage exactly per v1.1, plus:

```json
"timeframe": "5m",
"bars": [ { "t": 1789660800000000000, "o": 6558.25, "h": 6559.00,
            "l": 6557.75, "c": 6558.50, "v": 12345 } ]
```

Rules the shape encodes: bars are **source-space** (consumers apply
ratio + offset_published for target display, per Q7(a)); `t` is the
bar-open exchange timestamp, raw UTC ns; volume is size (VP-L14);
bars derive from ELIGIBLE prints under the same §4 rules as profile
bins; session boundaries per vendor session keying; a bar interval
overlapping a declared gap carries a per-bar `gapped: true` rather
than invented continuity; empty intervals inside coverage are served
as absent bars, never zero-filled fabrications. Below-coverage
requests behave per v1.1's /range law (422 / allow_partial).

## Added: time-bucket aggregates (the "additional bins")

The Engine maintains time-bucketed OHLC aggregates per source: 1m as
the base bucket aggregated from prints; coarser timeframes derived
from 1m. Deterministic (VP-L6), parameter-hashed, rebuildable from
the print archive by the rebuild law — the archive remains the only
SoR; buckets are derived state, backfilled alongside tranches.

## Access

Computing-class only, as all /v1/*; member browsers receive price
series via the Labs backend display path (A2 clause 6 pattern).
Mock fidelity: the APPS mock adds one OHLC fixture per format-driving
case (normal span, gap-spanning bar, below-coverage).

## Unchanged from v1.1

All endpoints, envelopes, coverage law, 403 deny, dual-source XSP
rule, error set (per-bar gapped flag is payload, not a new error).
