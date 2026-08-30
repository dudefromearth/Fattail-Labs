# Kilo — AT-TM-OS-1…15 + C11

**Date:** 2026-08-29

| ID | Result | Evidence |
|----|--------|----------|
| OS-1 | **not scored live** | Needs dash bounce. Today index/fetch still 409 `TODAY_LIVE` on PID 13277. After 13:00 ET today is Saturday; empty hold + raise today cannot land over HTTP. Not faked. |
| OS-2 | **PASS** | `loadTmDay` → `fillArchiveSlot` for every date. Past day 08-27 loaded. |
| OS-3 | **not scored live** | Reader tests pass (`test_today_retrieves_when_files_exist`). Live dash still 409. Bounce. |
| OS-4 | **PASS** | Switch discards archive; Reset drops hold (`tmHost` / prior tm-w5-archive). |
| OS-5 | **PASS live** | Hold line `The archive holds from 1:17 AM ET` (first snap `2026-08-27T01:17:30-04:00`). No megabyte slider. No Instant Replay. |
| OS-6 | **PASS live** | 08-27 `data-tm-covered=true`. Today is not `false` (not grey-because-live). Weekend today has 0 SPX chain snaps — not dotted, honest. |
| OS-7 | **PASS code** | Snapshot at raise; no tail-append. Reset-then-raise is help law. Live 5-minute wait not re-run this wave. |
| OS-8 | **not full** | C11 12 min: 20,367 gens / 36,107 index (56%). Infill not complete. |
| OS-9 | **PASS** | `captureToday` remains in `useOptionChainBus` L417 / `useOpfRiskGraph` L706. Average ring intact. |
| OS-10 | **PASS code** | `useChainAtPlayhead` never live under playhead. Playwright Analyzer/Heatmap/Surface share the strip. |
| OS-11 | **PASS code** | VIX from marks; positions reprice from hold. |
| OS-12 | **PASS code** | Named hole, not live-read (`tmChainAtT.ts` L229). |
| OS-13 | **PASS live** | Labs marks 08-27 VIX `source=massive_proxy_v1` mid 17.545. Not a fixture. |
| OS-14 | **not scored live** | 08-29 is today. Dash marks of today still `TODAY_LIVE`. Bounce. Tape on disk is `massive_index_v1` from 00:38:08. |
| OS-15 | **PASS code** | Dark via `resolveEntryAt`; `data-tm-dark`. Not hidden. |
| C11 | **recorded, not full** | 08-27 SPX. 12 min infill: **20,367** held / **36,107** on disk, fidelity **56%**, JS heap **123 MB**. Tab still responding. Not unusable; not complete. No ceiling named. Not a silent pass. |
| C6 / TPO / 1× / Record | **HOLD** | Not this stamp. |

HOLD C6 explicit. No row waived.
