# SODP1 — Census (read-only)

**May run during SODP0.** No history code. No StudioOne install. No Massive GET unless Foxtrot already has live numbers (prefer process/lsof/launchctl; do not starve chain_feed).

**Artifact:** `gate-reports/SODP1-inventory.md`

Must contain:

1. Consumer table (spec §11) with **file:line** for every OHLC / contracts / stream / VP / symbology caller, plus Market Bus `/api/me/market/*` (SODP-MB hold).
2. Massive writers on **StudioOne and StudioTwo** (process, interval, standing vs burst). Name the **recognition cache** or write “none found.”
3. **Combined CP-1 budget** per spec §12 v0.1.5: **both** machines’ `chain_feed` + `sym_feed` until SODP-MB. A number that omits StudioTwo writers is FAIL.
4. Leftover StudioTwo launchd (vp-api, chain-feed, vp-engine).

CP-1: if you SSH StudioOne, read-only. No bootout. No git pull.
