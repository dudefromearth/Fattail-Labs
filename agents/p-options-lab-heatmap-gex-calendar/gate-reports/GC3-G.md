# GC3-G — chrome

**Delta** · 2026-09-18 · **PASS** (code + AT-GC3/7/11 on fixtures)

`HeatmapGexCalendar.tsx`: split grid/profile, NET footer, honesty line, gold peak outline, cyan/magenta cells, named empty state. Host branch `layout === "matrix-profile"` only.

| AT | Evidence |
|----|----------|
| AT-GC3 | `isSpot` on nearest listed (golden 1 K=100) |
| AT-GC7 | `gexCal.vocab.test.ts PASS`; rg ITMatrix on product files empty |
| AT-GC11 | `gexCalStickyScale` holds within 25% |

LIM C2: `lim.c2.test.ts ok`
