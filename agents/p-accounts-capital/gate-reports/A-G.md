# A-G — Accounts & Capital shell + sole write path

**Status:** PASS  
**Date:** 2026-08-09  
**Phase:** A (Capital §6 · W0-6 IA)

## Evidence

### API
- `GET /api/me/capital/overview` — accounts, total net, prefs, master DD witness.
- `GET|PATCH /api/me/capital/prefs` — tolerance form, BP posture, confirm balances.
- Account create/patch support `starting_balance` via existing trade-log accounts routes (consumed by capital UI).

### Route / nav
- Page: `/accounts-capital` (`web/app/accounts-capital/page.tsx`).
- Users menu: SiteHeader → **Accounts & Capital**.
- Profile (`/me`): TradeAccountsSettings **removed**; link-only card to capital surface.

### Shell blocks (W0-6)
1. Total net capital + master-DD witness line  
2. Accounts list (balance derived, create / retire)  
3. Account detail: starting balance, movements, deposit/withdraw  
4. Buying power posture + as-of  
5. Tolerated master drawdown  
6. Confirm as current  

### Sole write path
- Practice chrome “manage accounts” → `/accounts-capital` (was `/me#trade-accounts`).
- Account CRUD UI only on Accounts & Capital (not Profile, not Practice suite).
- Trade Log pickers remain **read** consumers.

### Tests
- `tests/test_capital.py` overview + prefs paths green.
- Frontend `tsc --noEmit` clean.

## Delta

| Acceptance | Result |
|------------|--------|
| Users-menu route | PASS |
| Shell per W0-6 | PASS |
| No parallel account write chrome on Profile | PASS |
| Practice link retargeted | PASS |
