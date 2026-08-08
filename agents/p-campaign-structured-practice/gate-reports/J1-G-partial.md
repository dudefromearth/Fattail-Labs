# J1-G — Journey shape API (contracts)

**Status:** PASS (contracts) · shape math deferred to B3/J1-1  
**Date:** 2026-08-08  

## Landed

- `GET /api/me/practice/campaigns/{id}/journey-shape?as_of=`  
- **Ledger → 404** (#20)  
- **Zero-bound charter → kind=invitation** (#20)  
- Charter with bounds → skeleton axes (`state=gathering`, extension null) + amendment markers  
- T0 = signed_at date else first fill day  
- Route under practice-spine, **not** `/api/me/journey/*`  
- Tests: `test_journey_shape_ledger_404_and_invitation`  

## Remaining for full J1-G

- As-of-T fill window + panel readings → extension via `campaign_alignment`  
- Process vs signature n-floor wake  
