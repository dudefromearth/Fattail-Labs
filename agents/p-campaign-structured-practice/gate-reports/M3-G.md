# M3-G — Import + trade stamp

**Status:** PASS (core)  
**Date:** 2026-08-08  

## Landed

- Trade create: always resolves campaign (memory/ledger); `stamped_by` column  
- Import commit: never unstamped; defaults to **ledger**; memory not used for bulk import  
- Journal stamps unchanged (optional)

## Remaining

- Import sheet UI labels (U3)  
- stamped_by on pack import trade rows (X1)
