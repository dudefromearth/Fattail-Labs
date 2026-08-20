# Seed S-1 — Charlie adapter swap

**Project:** p-alerts  
**Agent:** Charlie  
**Phase:** S  
**Depends:** M-G PASS **and** C1-G PASS  
**Law:** AZ-ALB §1 · §2.3 · AT-ALB-9  
**Gate it feeds:** S-2

## Intent

Point `analyzerAlertsAdapter.ts` at Manager HTTP. **Canvas + Builder member grammar do not change.**

## Files in scope

- `web/lib/alerts/analyzerAlertsAdapter.ts`  
- Tests for the swap  
- Feature flag / adapter mode so stub remains if `LABS_ALERTS_MANAGER=0`

## Out of scope

Dialog layout. `HostPnLChart`. New Builder fields. Delete chrome.

## Wire

`listAlerts` / `upsertAlert` / `subscribeAlerts` → `/api/me/alerts*`. Map `kind` → `surface_type`, `position_id` → `local_ref.position_id`. Always send `suite` + `severity`. Fail open to stub if Manager down; **do not** claim OS/SMS.

## Done when

AT-ALB-1…4 still true against the manager (Kilo S-2 proves it). No dialog/canvas diff except imports if required.

## Invariants

FP9. FP2. Fail loud when mode is `manager` and flag missing.
