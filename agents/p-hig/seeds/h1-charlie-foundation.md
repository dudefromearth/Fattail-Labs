# Seed — H1 Foundation (Charlie)

**Project:** p-hig  
**Spec:** Human Interface Spec v1.0 §4–6, §11, phase H1  

## Scope

- `web/styles/tokens.css` + `globals.css` semantic tokens  
- `web/components/ui/*` — Button, IconButton, AlertDialog, ConfirmProvider, icons  
- `web/lib/dialogs.ts` imperative bridge  
- Replace `window.confirm` / `alert` with appConfirm / appAlert  
- Structure delete uses HIG dialog + IconTrash (no emoji chrome on modules)  

## Out of scope

Full page restyles (H2+); complete admin density pass (H6).

## Completion

- [ ] Typecheck / build pass  
- [ ] No browser confirm/alert in product paths  
- [ ] Destructive delete gated by AlertDialog  
