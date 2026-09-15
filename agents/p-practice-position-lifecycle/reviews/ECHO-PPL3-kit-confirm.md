# Echo — PPL3 kit confirm

**Date:** 2026-09-14 · StudioTwo  
**Seed:** PPL3-1

## Grammar

Destructive confirm is kit `useConfirm` → `AlertDialog` (same provider as Import Manager).

| Surface | Title | Consequence | Actions |
|---------|-------|-------------|---------|
| Sheet — unmatched TO OPEN | Delete open #{id} permanently? | No paired close — this open is removed from the book. Cannot be undone. | Cancel · Delete |
| Sheet — remove close fill | Remove this closing trade? | The open stays on the book. Cannot be undone. | Cancel · Delete |
| Sheet — entire position | Delete the entire position? | Removes the open and this close. Cannot be undone. | Cancel · Delete |
| Blotter bulk | Trash N open position(s)? | This permanently deletes the selected unmatched opens. Cannot be undone. | Cancel · Delete |

No `trash_reason` chips. Close (sheet overlay / Cancel) ≠ Delete. Import Manager untouched.

## Visual

Kit `AlertDialog` is the existing HIG dialog (`web/components/ui/AlertDialog.tsx`). No new chrome family. Live SSO walk of the dialog on Coach’s book was not available in this packet; the control is the same ConfirmProvider already on `/app/trade-log` import recycle.

## AT-PPL-11

`window.confirm` absent from `TradeSheet.tsx` and `web/app/app/trade-log/page.tsx`. Both call `useConfirm`.
