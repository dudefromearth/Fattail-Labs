# L3-G — Editor + library lifecycle UI

**Status:** PASS  
**Date:** 2026-08-08  
**Phase:** L3  

## Done

### Editor (`[campaignId]/page.tsx`)

- Signed / Terms as of / Never signed (honest labels)
- Amendments list (neutral) + status timeline separate
- Lineage chip + predecessor link
- Renew on terminal → opens draft successor
- Cover stays library-only
- Activate vs Resume (never signed vs paused)

### Library (`page.tsx`)

- Cycle N chip when `cycle_number > 1`
- Archive **Renew** entry
- Open/Archive unchanged

### Guide

- `#campaign` as-built: sign · amendments · Renew · no Journey coupling

### API client

- `fetchCampaignAmendments`, `renewCampaign`, lifecycle fields on `PracticeCampaign`

## Build

`cd web && npm run build` — success

## Seeds

- L3-1, L3-2
