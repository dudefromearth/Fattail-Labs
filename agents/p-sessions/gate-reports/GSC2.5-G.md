# GSC2.5-G — segments SoR

**Delta** · 2026-09-09 · Ernies-MacBook-Pro.local  
**Verdict:** **PASS**

Stamp: Spec v0.2 sha1 `6616b1753f21e334c21dc65336c405acafa5d958` · §12.7 ACCEPTED · OD-S8 (a).

## Evidence

```text
TZ=UTC npx --yes tsx lib/sessions/sessionView.test.ts  # ok
TZ=UTC npx --yes tsx lib/sessions/segments.test.ts     # ok
TZ=Asia/Tokyo npx --yes tsx lib/sessions/sessionView.test.ts
TZ=Asia/Tokyo npx --yes tsx lib/sessions/segments.test.ts
TZ=UTC npx --yes tsx lib/sessions/timeAxis.test.ts     # ok (no regression)
```

AT-GSC-50…54. AT-GSC-20/21/22 still in sessionView.test.ts. No `react` / `next` in `web/lib/sessions/*.ts` (excluding tests). `timeAxis.ts` / `exchanges.ts` / `marketCalendar/**` not written this phase.

## Allowlist

`web/lib/sessions/segments.ts` (create) · `sessionView.ts` (segments + currentSegment; `closures` also returned so ClosuresList does not call `marketCalendar`) · tests.

## NOTES

`closures` is a third sessionView field. Spec §12 named two. ClosuresList cannot import the calendar module (L11). Filled in the view-model, not in a component.

## Does not

Paint the ribbon (GSC4). Reopen timeAxis / exchanges.
