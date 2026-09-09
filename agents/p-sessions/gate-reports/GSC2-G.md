# GSC2-G — time-axis + sessionView

**Delta** · 2026-09-09  
**Verdict:** **PASS**

## Evidence

```text
TZ=UTC npx --yes tsx lib/sessions/timeAxis.test.ts     # ok
TZ=Asia/Tokyo npx --yes tsx lib/sessions/timeAxis.test.ts  # ok
npx --yes tsx lib/sessions/sessionView.test.ts         # ok
```

AT-GSC-01…05, 06a/b/c (does not error), 20–22, Toronto-normal on 2026-10-12.  
TSE close 15:30. ES early label `6:00 PM – 1:15 PM` (not 5:00 PM).  
No `react` / `next` imports. GSC2-view did not write `timeAxis.ts` / `exchanges.ts` after create.

## Out of scope

GSC3 route. GSC4 chart. OD-S4.
