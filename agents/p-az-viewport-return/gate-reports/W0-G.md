# W0-G — Delta

**Project:** p-az-viewport-return  
**Agent:** Delta  
**Date:** 2026-08-19  
**Depends:** W0-1…5 + W0-M  
**Verdict:** **BLOCKED**

## Evidence

| Item | Status |
|------|--------|
| WHAT + plan v1.0.1 + board | On disk · commit `a34bbf9` |
| W0-0 STAMP | `gate-reports/W0-0-coach-stamp.md` |
| W0-1 RH-B1 | PASS — **no** Packet A `W-G.md` |
| W0-2 lock handoff | APPROVED — named, not “lock over” |
| W0-3…5 | APPROVED |
| W0-M | **BLOCKED** — Chromium A–F green; Coach still fails |
| Product code this phase | None in the W0 commits |

## Why BLOCKED

W0-BA requires W0-M **FAIL**. W0-M did not fail the splitter. Charlie W1 does not fire. Three-strikes: a third guessed fix is forbidden.

Unblock: Coach names path A–F (or E at the machine) and W0-M FAILs, **or** Coach DL names a W0-M bypass (plan forbids silent bypass).
