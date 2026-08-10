# W0-2 — India schema map (preform)

**Status:** PASS  
**Date:** 2026-08-10  

## Preform placement (OD)

**On `market_symbol_universe`** (Option A — lean):

| Column | Type | Notes |
|--------|------|--------|
| `next_expirations_json` | JSON NULL | `[{expiration, dte?}]` or date strings; DTE recompute at read for “today” |
| `expirations_as_of` | DATETIME NULL | last successful calendar scan (UTC) |
| `strike_step` | DECIMAL(8,4) NULL | optional override; else kind-based default |

## Stale rule

OD-preform-ttl: **1 session day** — if `expirations_as_of` older than session day or null → live scan + write-through.

## Dual truth

No second symbol list. Calendar is **geometry only**; quotes stay Massive live (OC12).

## Process reuse

P1 calendar job must call `massive_client` and align with `chain_collector` patterns — no orphan fourth process without DL.
