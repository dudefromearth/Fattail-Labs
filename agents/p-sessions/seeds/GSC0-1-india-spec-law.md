# GSC0-1 — India · Spec integrity

**Project:** p-sessions  
**Callsign:** India  
**Depends:** —  
**Feeds:** GSC0-G  
**Invariants:** Spec immutable · DL append-only · Coach Content Law · DL-539 · L-locks provisional until stamp

## Files in scope

| File | Touch |
|------|--------|
| `Specs/FatTail-Labs-Sessions (Global Session Clock).md` | Read only |
| `docs/Sessions-Global-Session-Clock-Full-Agent-Bench-Plan-v1.2.md` | Read only |
| `agents/p-sessions/evidence/india-checklist.md` | **Write** |

## Out of scope

Product code. Spec edits. MiniTwo. DL-539 trees. Stamping GSC-W0.

## Task sequence

1. `shasum -a 1` the Spec; compare to `81984ba9f2394d52aa359cefcdb108451fdec9e3`.  
2. Confirm L1–L11 are **provisional** in plan/CHARTER/seeds.  
3. Confirm no seed Depends/Feeds a live `GSC2-axis-G`; GSC2-view must not write `timeAxis.ts`/`exchanges.ts`.  
4. Quote plan §1.3 OD conflicts from disk; do not pick.  
5. Verify plan §1.4 neighbor quotes verbatim.  
6. Check plan forbidden list vs DL-539.  
7. State hash procedure for Lima. Verdict APPROVED or RETURNED (build readiness).

## Completion

`evidence/india-checklist.md` on disk with hash, neighbor quotes, L-lock status, no phantom gate, OD table not disposed by India.
