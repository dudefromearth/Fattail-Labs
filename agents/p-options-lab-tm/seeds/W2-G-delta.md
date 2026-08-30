# Seed W2-G — Delta

**Project:** Options Lab Time Machine  
**Agent:** Delta  
**Depends:** W2-1  
**Law:** plan v1.2 W2-G · TMI-79 v0.7.4

Ternary **PASS / FAIL / BLOCKED**. Evidence on disk.

Fail-closed: `server/` film; Record; capture paused; today’s cache discarded because a past date was selected; two **archive** days; occupancy modeled as a single `heldDay: Date | null` (or equivalent); archive days written into Heatmap Redis.

**Not a fail:** today slot + empty archive slot. AT-TM-C8 is “does not grow with days *visited*.”
