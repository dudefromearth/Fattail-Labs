# p-community — Implementation plan

**Authority:** Spec v1.0.2 BUILD AUTHORITY (DL-239 + **DL-240** WP connector)  
**Do not implement out of phase.** Seeds define file scope.

---

## C0 — Reviews (no product code)

| Seed | Agent | Outcome |
|------|-------|---------|
| C0-0 | Coach | **DONE** — Phase 5 approve |
| C0-1 | India | Residual architecture stamp (B1/R1–R4 already in Spec) |
| C0-2 | Tango | Copy honesty, Connect CTA, hold UX, no profit theater |
| C0-3 | Mike | §8.5 intents, OAuth secrets, webhook tokens, fail-loud |
| C0-4 | Echo | Board layout, channel chrome, shelves, composer density |
| C0-5 | Foxtrot | Worker placement (Gateway bot, reconcile cron, launchd) |
| C0-G | Delta | Spec lock + review evidence |

---

## C1a — Shell + shelves (no live Discord required)

| Work | Owner |
|------|--------|
| Migration: `community_channels`, `community_bot_shares` (message tables may wait C1c) | Alpha |
| Seed four channels + `apps` row `community` | Alpha |
| API: list channels, FatTail shelf (house designs), member shares list | Alpha |
| Web: `/app/community` board shell, channel list, shelves | Charlie + Echo tokens |
| Feature gate `app.community` if used | Alpha/Mike |

**Gate C1a-G:** card + page load; shelves render house catalog; no Journey/Wiki channels.

---

## C1b — Discord identity + roles (WP connector first)

| Work | Owner |
|------|--------|
| Inventory fattail.ai WP Discord plugin: fields, connect URL, role behavior | Mike |
| Ingest Discord snowflake + **name from fattail.ai** into Labs (SSO claim and/or sync) | Mike + Alpha |
| Labs `discord/status` + CTA deep link to **fattail.ai** (no Labs-primary OAuth) | Alpha + Charlie |
| Role grant/revoke executor design (WP plugin vs Labs bot — no dual fight) | Mike |
| **Scheduled reconcile** date-aware entitlement vs guild roles (DL-238) | Foxtrot + Alpha |
| Fail-loud alert on divergence | Foxtrot |

**Gate C1b-G:** WP-connected member appears linked in Labs with correct name; entitled grant;
**date-expired revoke without webhook** evidence; CTA does not invent Labs OAuth.

---

## C1c — Message second window

| Work | Owner |
|------|--------|
| Gateway / bot: MESSAGE_CREATE/UPDATE/DELETE → Labs upsert | Alpha + Foxtrot |
| Labs send → Discord webhook/API; attribution “via Labs” | Alpha + Mike |
| Gap-heal backfill per channel | Alpha |
| Composer + read rules (linked to post) | Charlie |
| Event matrix §6.7 enforced in code + tests | Alpha + Kilo |
| In-app `CommunityChannelPanel` for Practice / Strategy Lab / Toughness | Charlie |

**Gate C1c-G:** bidirectional message evidence; backfill idempotency; hold local-only.

---

## C1d — Admin map + publish/apply

| Work | Owner |
|------|--------|
| Admin create/map channel | Alpha + Charlie |
| Member bot publish/apply (snapshot isolation) | Alpha + Charlie |
| House provenance on share cards | Charlie |
| Characterization tests | Kilo |

**Gate C1d-G:** Spec §14 acceptance items for shares + admin channels.

---

## C2 / CLOSE

Deferred features per Spec §13 P2.  
Lima: Architecture community doc if needed; Architecture/06 reconcile evidence.  
Delta: program close.
