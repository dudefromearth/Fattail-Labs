# PPL5-0 — Events layer (BLOCKED stub)

**Project:** Practice Position Lifecycle B1  
**Agent:** Juliet (does not execute; sequences when gates PASS)  
**Depends:** PPL3-G **and** PPL4-G **and** D-B1 block stamp **and** `PPL5-W0`  
**Feeds:** PPL5-G

## Intent

Do **not** start because the B1 board exists. Split when Coach stamps `PPL5-W0`:

| Seed (write then) | Job |
|-------------------|-----|
| PPL5-1 Alpha events | Migration: transformation event + revocation event. Family B. Same writer for wizard and Link |
| PPL5-2 Alpha API | Link / unlink / 409 predecessor-delete / 409 double-revoke / refuse partial-qty transform |
| PPL5-3 Kilo | AT-B1-3, 4, 8, 10, 11, 13, 14, **16** (campaign inherit/override at API). AT-B1-9 Keep green |
| PPL5-4 Mike | Identity scope on 409 |

## Out of scope

Drawer chrome. Import agent. Analyzer. Matcher FIFO.

## Done when (this stub)

Juliet refuses product-code seeds while PPL3-G or PPL4-G is not PASS. Board row stays **blocked**.
