# B1-badge-G — Blotter campaign badge (Spec v1.3 §9)

**Status:** PASS (B1-0 + B1-1 chrome)  
**Date:** 2026-08-08

## Landed

| Seed | Result |
|------|--------|
| B1-0 | One chip per row beside strategy (`data-testid=blotter-campaign-badge`). Title from campaign options; no variance color. Provenance tier in title tooltip (`member` / `memory` / ledger). |
| B1-1 | Chip tap → `onCampaignFilter(cid)` (same blotter filter system). |
| B1-2 | Deferred full "Direct to…" surface — TradeSheet campaign select remains the redirect path (eligibility filtered). |

## API support

- Trade DTO includes `stamped_by` for provenance tier.
