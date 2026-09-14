# PPL3-1 — Kit confirm on sheet and blotter bulk

**Project:** Practice Position Lifecycle  
**Agent:** Charlie (Echo reviews before Delta)  
**Depends:** PPL3-0 (409 body exists)  
**Feeds:** PPL3-G

## Intent

Human Interface Spec §6.3: destructive = kit `AlertDialog` / `useConfirm`.

| Surface | Today | After |
|---------|-------|--------|
| TradeSheet | in-drawer `trashConfirm` | `useConfirm` / `AlertDialog` |
| `web/app/app/trade-log/page.tsx` bulk | `window.confirm` | same kit |
| Import Manager | already `useConfirm` | **untouched** |

No `trash_reason` chips in the dialog. Title + consequence + Cancel + Delete. Close ≠ delete (no one unmarked control).

Sheet must round-trip gate override checkboxes as payload fields Alpha named. Failed 422 is visible; do not fake a save.

## Files in scope

- `web/components/trade-log/TradeSheet.tsx`
- `web/app/app/trade-log/page.tsx` (**confirm only**)
- `web/components/ui/ConfirmProvider.tsx` / `AlertDialog` — consume, do not fork

## Out of scope

Import Manager restyle. Page chrome restyle. Soft-trash. Autofilter English. `AnalyzerPositionsList.tsx`.

## Done when

Grep: no `window.confirm` in those two files. Echo sign-off in gate evidence. AT-PPL-11.
