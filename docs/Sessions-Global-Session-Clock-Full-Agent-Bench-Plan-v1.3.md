# Sessions (Global Session Clock) — Full Agent Bench Plan v1.3

**Date:** 2026-09-09  
**Plan revision:** **v1.3** — Juliet fold of Coach GSC0-0 stamp §5. **Does not reopen ODs.**  
**Program of record at stamp:** v1.2. This file records locked path, allowlist, and AT class splits.  
**Token:** [`agents/go/GSC-W0.md`](../agents/go/GSC-W0.md) **GO** · **DL-685**

Body of work remains [`docs/Sessions-Global-Session-Clock-Full-Agent-Bench-Plan-v1.2.md`](./Sessions-Global-Session-Clock-Full-Agent-Bench-Plan-v1.2.md) except:

## Locked path and auth (OD-S1/S2/S3)

Implement **`/resource/sessions`**. Sessions is a Link pill. Library/Tags stay tabs. Pill hidden when anonymous.

## AT class splits (stamp §5 · Kilo)

| ID | Class (v1.3) | Note |
|----|----------------|------|
| **AT-GSC-33a** | `tsx` | Process TZ (GSC2 both `TZ=UTC` and `TZ=Asia/Tokyo`) |
| **AT-GSC-33b** | `pw` | Browser timezone Asia/Tokyo (GSC5) |
| **AT-GSC-45a** | `static` | `git diff` has no new entitlement/policy (GSC3-2 / GSC6-2) |
| **AT-GSC-45b** | `pw` | Observer session loads stamped path |

Coach wording `tsx + pw` / `static + pw` is these two-row splits so each row has one class.

## GO allowlist (DL-539)

`web/components/resources/ResourcesHub.tsx` is **in scope for GSC3**. Also `ResourcesPageClient.tsx`. Not GSC1/GSC2-axis.

## N1 (stamp §5.4)

Operative gates: **GSC0-G · GSC1-G · GSC2-G · GSC3-G · GSC4-G · GSC5-G · GSC6-G** only. Historical `GSC2-axis-G` strings in v1.2 fold table / risk register / checkbox are **records, not citations**. India's finding is **no-defect**.

## OD-S4

Still **PENDING**. Extra search 2026-09-09: Trash, iCloud Mobile Documents, Containers, git objects — empty. Coach ticks (c) or Stop before GSC3-G. GSC1/GSC2 do not wait.

## As-built this fold

GSC1 `web/lib/marketCalendar/` PASS. GSC2-axis `web/lib/sessions/timeAxis.ts` + `exchanges.ts` tests green both TZs. GSC2-view **not** started.
