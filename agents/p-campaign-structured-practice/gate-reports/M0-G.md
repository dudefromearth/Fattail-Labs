# M0-G — Schema reverse + domain account-free charters

**Status:** PASS  
**Date:** 2026-08-08  
**Evidence:** migration `108_campaign_window_model.sql` · domain L5 · `tests/test_campaign_window.py`

## Landed

| Seed | Result |
|------|--------|
| M0-1 | Charters `account_id` cleared to NULL (ledgers retained). Schema already nullable (096). |
| M0-2 | `create_campaign` / `patch_campaign` / `renew_campaign` no longer force account bind on charters. Ledgers still require account. |

## Kilo

- `test_charter_create_account_free` — PASS
- Panel regression updated for L5 (no account on charter DTO)

## Notes

Historical trade stamps unchanged. Client may still send `account_id` on create; server strips for non-ledger.
