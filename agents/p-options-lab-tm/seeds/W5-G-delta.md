# Seed W5-G — Delta

**Project:** Options Lab Time Machine  
**Agent:** Delta  
**Depends:** W5-1  
**Law:** plan v1.2 W5-G · TMI-79 v0.7.4

Ternary. Fail-closed: 1-minute past-day fetch; serial left-to-right-only fill; uncovered date selectable without NO PATH; capture paused; today’s cache discarded; two archive days held.

W2 occupancy proofs are **open until this gate**. With a past day actually loaded, evidence must show:

1. Switch discards the previous archive day first.
2. Reset drops the archive slot; today survives.
3. Today’s gen count still grows while the archive day is open.

Structural tests on an empty archive slot do **not** close these.
