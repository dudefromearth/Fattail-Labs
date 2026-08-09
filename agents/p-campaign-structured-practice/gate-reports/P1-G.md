# P1-G — Prescribed panel (every charter)

**Status:** PASS (core already landed; regression green)  
**Date:** 2026-08-08

## Landed (prior + confirm)

| Seed | Result |
|------|--------|
| P1-0 | `create_campaign` calls `ensure_six_controls` for every non-ledger. Journey shape also ensures. |
| P1-1 | CMP strip UI + pointer window ∩ stamp (CampaignPanel.tsx). |
| P1-2 | Admin panel PATCH `require_admin`; members read-only. |

## Kilo

`tests/test_campaign_panel.py` — PASS under window model.
