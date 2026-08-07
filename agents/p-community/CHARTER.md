# Charter — p-community

**Mission:** Ship **Community** at `/app/community` — Discord **second window**
(same guild conversation in Labs) plus FatTail/member **bot shelves**. Dual SoR:
Discord = guild chat; Labs = bots, shares, channel map, membership entitlement.

**Board:** [`ORCHESTRATOR.md`](./ORCHESTRATOR.md)  
**Plan:** [`IMPLEMENTATION-PLAN.md`](./IMPLEMENTATION-PLAN.md)  
**Spec:** [`Specs/FatTail-Labs-Community-App-Spec-v1.0.md`](../../Specs/FatTail-Labs-Community-App-Spec-v1.0.md) **v1.0.2 BUILD AUTHORITY**  
**Decisions:** DL-237 · DL-238 · DL-239 · **DL-240** (WP Discord connector)  
**Seeds:** [`seeds/`](./seeds/)  
**Gates:** [`gate-reports/`](./gate-reports/)

**Doctrine:** standalone repo · Family B on bot shares · process outcomes only ·
no profit theater · date-aware Discord role revoke (DL-238) · fail loud · no
waived Delta gates · no MSC shared code.

---

## Coach locks (approved 2026-08-06)

| # | Lock | Value |
|---|------|--------|
| L1 | Surface | Apps hub card → `/app/community` |
| L2 | Chat thesis | Second window on Discord guild **FatTail AI** |
| L3 | Seed channels | General, Practice, Strategy Lab, Toughness |
| L4 | No channels | Journey, Wiki |
| L5 | Admin channels | Admin may create/map additional channels |
| L6 | Display name | Discord name **maintained on fattail.ai** (WP plugin) |
| L7 | Post gate | Discord link required to post; lurk OK if entitled |
| L8 | **Connect path** | **WP Discord connector plugin on fattail.ai** — no Labs-primary OAuth (DL-240) |
| L9 | Role sync | WP and/or Labs fast path + **scheduled date-aware reconcile** (DL-238) |
| L10 | Message heal | Backfill since last `synced_at` on reconnect + schedule |
| L11 | House bots | Default shared; admin-only version; provenance on forks |
| L12 | Hold | Labs hold ≠ Discord delete |

---

## Goals

1. App registration + Community shell + channel map seed.  
2. WP→Labs Discord link ingest (fattail.ai plugin) + display names + role sync + reconcile.  
3. Bidirectional message mirror + gap-heal + composer.  
4. FatTail + member bot shelves; publish/apply isolation.  
5. Admin channel create/map; in-app channel panels (Practice / Strategy Lab / Toughness).  
6. Ops evidence in Architecture/06; program close via Lima/Delta.  
