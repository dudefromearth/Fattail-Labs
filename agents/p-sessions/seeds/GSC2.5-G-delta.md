# GSC2.5-G — Delta · segments SoR

**Depends:** GSC2.5-0 · GSC2.5-1  
**Feeds:** GSC4 ribbon (still blocked on OD-S4)

PASS requires:

1. `TZ=UTC` and `TZ=Asia/Tokyo` `npx --yes tsx` green on segment tests + existing `sessionView.test.ts` (AT-GSC-20/21/22 still hold).
2. `segments.ts` and `sessionView.ts` have no `react` / `next` imports.
3. `git diff --stat` ⊆ `web/lib/sessions/segments.ts`, `sessionView.ts`, and the test files. `timeAxis.ts` / `exchanges.ts` / `marketCalendar/**` untouched.
4. No component exists that computes 12:30 or truncation (GSC4 not started).

**BLOCKED not FAIL** if the addendum is still DRAFT. Do not waive into GSC4.
