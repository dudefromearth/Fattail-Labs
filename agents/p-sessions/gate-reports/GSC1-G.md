# GSC1-G — marketCalendar

**Delta** · 2026-09-09  
**Verdict:** **PASS**

## Evidence

```text
cd web && npx --yes tsx lib/marketCalendar/index.test.ts
# marketCalendar/index.test.ts ok
```

AT-GSC-10…16, 17a, 18, 19a green. `OVERRIDES.length === 0`.  
No `20xx-xx-xx` literals in `web/lib/marketCalendar/index.ts`.  
No `react` / `next` imports.

Hotel golden (`evidence/hotel-calendar.md`) matches module output.

## Out of scope (not this gate)

UI, time-axis, `sessionView`.
