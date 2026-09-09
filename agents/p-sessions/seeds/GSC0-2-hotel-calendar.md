# GSC0-2 — Hotel · Calendar golden

**Project:** p-sessions  
**Callsign:** Hotel  
**Depends:** —  
**Feeds:** GSC0-G · GSC1-2  
**Invariants:** No false trading claims · derive from Spec §7 rules · do not copy §8.2 first · do not edit Spec

## Files in scope

| File | Touch |
|------|--------|
| Spec §7 and §9.2 | Read |
| `agents/p-sessions/evidence/hotel-calendar.md` | **Write** |

## Out of scope

Product code. Foreign holidays. Toronto calendar. Inventing Globex hours on a full US close.

## Task sequence

1. Derive 2026, 2027, 2028, 2031 holidays and early closes from rules (nth weekday, computus, weekend shift, New Year's Saturday exception).  
2. Derive `2021-12-31` (open) and `2020-07-03` (closed).  
3. Then diff against plan §8.2 / Spec §9.2. Report every difference, including none.  
4. Show 2028-07-03 is a 13:00 early close; 2027 has one early close; TSE 15:30; ES `modified` on full US close.

## Completion

`evidence/hotel-calendar.md` shows derivation **before** the diff. Block plainly if a Spec date is wrong — flag beside Coach text, do not fix.
