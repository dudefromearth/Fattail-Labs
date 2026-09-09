# GSC0-G — Delta · Program lock gate

**Project:** p-sessions  
**Callsign:** Delta  
**Depends:** GSC0-0 · GSC0-1…GSC0-9 (GSC0-8 may follow GO)  
**Feeds:** GSC1 · GSC2-axis  
**Invariants:** Ternary PASS/FAIL/BLOCKED · evidence · never waive · DL-328 token not chat

## Files in scope

| File | Touch |
|------|--------|
| `agents/go/GSC-W0.md` · `evidence/*.md` | Read |
| `agents/p-sessions/gate-reports/GSC0-G.md` | **Write after stamp** |

## Out of scope

Implementation. Waiving missing reviews. Waiting on `session-clock.html`. Running this gate before Coach stamps GO.

## PASS only if

1. `GSC-W0.md` has **GO** ticked (this file, not chat).  
2. Spec sha1 re-hashed at stamp.  
3. OD-S0…S7 and JR1–12 disposed; L1–L11 may be called LOCKED.  
4. Eight GSC0 evidence files on disk.  
5. Characterization list covers plan §8 with one class per AT.  
6. OD-S4 recorded as a **GSC4** block (a, c, or stop). Missing HTML is **not** a GSC0-G FAIL.  
7. No seed Depends/Feeds a live `GSC2-axis-G`.  
8. No product code in GSC0.

## Completion

`gate-reports/GSC0-G.md`. If PASS: NEXT = GSC1 ∥ GSC2-axis. **Not run in the pre-GO session.**
