# FatTail Labs — Community App Spec v1.0  
### Discord second window · app channels · shared bots · Apps hub card

**Status:** **BUILD AUTHORITY** — Coach Phase 5 approved 2026-08-06 · amended v1.0.2  
**Version:** 1.0.2  
**Date:** 2026-08-06  
**Surface:** Apps hub card → **`/app/community`** (`labs.fattail.ai/app/community`)  
**Slug:** `community`  
**Author:** Juliet (from Coach intent)  
**Decision log:** DL-237 · DL-238 · DL-239 · **DL-240** (WP Discord connector)  

---

## Parents / siblings

| Document | Role |
|----------|------|
| [`FatTail-Labs-Application-Framework-Spec-v1.0.md`](./FatTail-Labs-Application-Framework-Spec-v1.0.md) | Apps hub, cards, member shell |
| [`FatTail-Labs-Identity-Access-Spec-v1.0.md`](./FatTail-Labs-Identity-Access-Spec-v1.0.md) | Identity, plans, memberships, `identity_links` |
| [`FatTail-Labs-Membership-Tiers-Enrollment-Spec-v1.0.md`](./FatTail-Labs-Membership-Tiers-Enrollment-Spec-v1.0.md) | Discord included by tier |
| [`FatTail-Labs-Member-Data-Privacy-Spec-v0.1.md`](./FatTail-Labs-Member-Data-Privacy-Spec-v0.1.md) | Opt-in presence, Family B |
| [`FatTail-Labs-Journey-Gamification-Spec-v1.0.md`](./FatTail-Labs-Journey-Gamification-Spec-v1.0.md) | Journey presence (no Community channel) |
| [`FatTail-Labs-Course-Discussion-Spec-v1.0.md`](./FatTail-Labs-Course-Discussion-Spec-v1.0.md) | Per-course threads (bridge later) |
| [`Strategy-Lab-Curate-and-Deploy-Surface-Spec-v1.0.md`](./Strategy-Lab-Curate-and-Deploy-Surface-Spec-v1.0.md) | Bots, Curate/Deploy |
| House designs (DL-235) | FatTail house strategies — admin-versioned |

**Doctrine:** capacity over dependency · process outcomes only · no profit theater ·  
Family B · fail loud · standalone Labs repo · no MSC shared code  

**Legal:** Community + Discord ToS alignment — counsel before public launch if needed.

---

## 0. Coach intent (preserved in full)

1. **Community app** with its own card under the Apps hub at **`/app/community`**.  
2. **Share completed bots** with the community; **FatTail house bots shared by default**.  
3. **Single board** consolidating community features.  
4. **Channels (seed):** **General** (open discussion), **Practice**, **Strategy Lab**, **Toughness**.  
5. **Journey** and **Wiki** do **not** get Community channels.  
6. **Admin** may create additional channels.  
7. Each relevant app can open **its channel from inside the app**; it is the **same channel** as in Community (not a fork).  
8. Chat is an **extension of FatTail Discord** — a **second window on the same conversation**.  
9. **Sync messages** and **sync users** with Discord.  
10. In Labs chat, the member is known by their **Discord name**.  
11. Every **subscriber** (Discord-included tiers) has a **connected Discord** identity on the FatTail Discord server.  
12. House strategies: **admin exclusive** modify/version rights; members apply / configure / copy-rebuild only.  
13. House strategies are **versioned** and trackable on bots through Curate and Deploy.  
14. House strategies include **entry + management** process and **course references**.

**Coach clarification (2026-08-06, DL-240):** Discord connector is a **plugin on
fattail.ai** WordPress; guild name **FatTail AI**; Discord name is maintained on
fattail.ai. Labs does not replace that connector with a parallel OAuth product.

---

## 1. Intent

### 1.1 Problem

Members already live in FatTail Discord; Labs has no first-class place that is the **same room**. Bot sharing has no home. In-app chat must not invent a second, disconnected conversation.

### 1.2 Thesis

> **Labs Community chat = second window on the FatTail AI Discord guild.**  
> Same users, same messages, same mapped channels.  
> You appear as your Discord name (maintained on fattail.ai).  
> FatTail and member bots live as Labs shelves beside that chat.  
> App panels open the same channels as the Community app.

### 1.3 Dual system of record

| Concern | System of record | Labs role |
|---------|------------------|-----------|
| Guild text in mapped channels | **Discord** (server: **FatTail AI**) | Mirror + send; second-window UI |
| Member ↔ Discord **connect** | **WordPress on fattail.ai** (Discord connector **plugin**) | Consume link + name; do **not** re-implement primary OAuth |
| Discord display name (member) | **fattail.ai** (plugin-maintained) | Ingest via WP SSO / provider sync; show in Labs UI |
| Unlinked Discord authors in mirror | Discord API / cache | Display name only; no Labs profile |
| Labs membership / plan | **Labs** | Entitlement SoR; drives who *should* have paid guild access |
| Labs ↔ Discord user snowflake | **Labs** `identity_links` (source = WP sync) | Required to post as “you” |
| FatTail house bots + versions | **Labs** | Shelf; admin versions only |
| Member bot share snapshots | **Labs** | Publish / Apply to Strategy Lab |
| Labs channel list + Discord map | **Labs** mapping table | Admin creates/maps channels |

### 1.4 Success criteria

1. `/app` shows a **Community** card; `/app/community` loads the board.  
2. Seed channels: `general`, `practice`, `strategy-lab`, `toughness` — each mapped to a Discord channel.  
3. Message in Discord appears in Labs for that map; message from Labs appears in Discord.  
4. Authors show **Discord name as maintained on fattail.ai** (and avatar when available).  
5. Strategy Lab / Practice / Toughness in-app panel shows the **same** channel as Community.  
6. FatTail Bots shelf lists house designs with `key@version` + course refs; members cannot remove them.  
7. Member can publish an eligible bot share; others can Apply / Copy & rebuild into Design.  
8. Discord-included members arrive with Discord linked via **fattail.ai** (WP plugin);
   Labs has their Discord snowflake + name; paid guild access follows entitlement (DL-238).  
9. Members without a Discord link (not connected on fattail.ai) cannot post to synced channels.  
10. No P&L / profit claims on bot shelves. Family B private bots never auto-publish.  
11. Admin can create additional mapped channels; members cannot.  
12. Characterization tests for isolation, share gates, link requirements, channel map uniqueness.

---

## 2. Scope

### 2.1 In scope (v1)

| Area | Detail |
|------|--------|
| App shell | Hub card `community` → `/app/community` |
| Channel list | Seed + admin-created, Discord-mapped |
| Second-window chat | Bidirectional message sync; Discord display names |
| User sync | WP connector link ingest (DL-240) + role sync (WP primary + Labs reconcile DL-238) |
| App embeds | Practice, Strategy Lab, Toughness only |
| FatTail Bots shelf | House catalog projection |
| Member bot shares | Opt-in publish / unpublish / apply |
| Admin channel CRUD | Create / rename / archive + Discord map |
| Moderation | Discord authoritative in guild; Labs may hide in UI |

### 2.2 Out of scope (v1)

| Out | Notes |
|-----|--------|
| Full Discord client (voice, multi-server, Nitro) | Never core |
| Labs-only chat without Discord sync | Violates second-window intent |
| Discord as SoR for house bots / versions | Never |
| Journey / Wiki channels | Concept does not apply |
| Auto-publish mint starter bots | Private copies only |
| One-click live Deploy from Community | Life cycle gates remain |
| Profit leaderboards / shared P&L | Doctrine forbid |
| Replacing Help desk | Optional admin `#help` topic later |
| Full course-discussion migration | Phase 2 bridge |

### 2.3 Ideas inventory

| Idea | Status |
|------|--------|
| Single Community app + hub card | **IN-SCOPE** |
| Discord second window (sync users + messages) | **IN-SCOPE** |
| Channels: General, Practice, Strategy Lab, Toughness | **IN-SCOPE** |
| Admin-created extra channels | **IN-SCOPE** |
| App-scoped embed = same channel | **IN-SCOPE** |
| FatTail bots default shared, versioned, admin-only | **IN-SCOPE** |
| Member opt-in bot share + apply | **IN-SCOPE** |
| Course refs on house bots | **IN-SCOPE** |
| Journey/Wiki channels | **OUT** |
| Discord announces for house version bumps | **DEFERRED** Phase 2 |
| Reactions | **DEFERRED** Phase 1b/2 |

---

## 3. App registration

| Field | Value |
|-------|--------|
| **slug** | `community` |
| **title** | Community |
| **href** | `/app/community` |
| **blurb** | Process peers and FatTail bots — same conversation as Discord, plus shared designs. No P&L theater. |
| **audience** | Signed-in members (observer+) |

Seed via `apps` migration (same pattern as Strategy Lab). Feature gate `app.community` if gates apply.

**Deep links**

- `/app/community?channel={slug}`  
- In-app: `CommunityChannelPanel({ appKey })` or `?community=1`  

---

## 4. Domain model

### 4.1 Channels

```text
community_channels
  id, public_id, slug, title, description
  kind: app_home | topic | system
  app_key: NULL | 'practice' | 'strategy-lab' | 'toughness'
  discord_guild_id
  discord_channel_id          -- required for synced chat
  sort_order
  archived_at, created_at, updated_at
```

### 4.2 Messages (Labs mirror of Discord conversation)

```text
community_messages
  id, public_id, channel_id
  identity_id NULL              -- set when author linked to Labs
  discord_message_id            -- unique; upsert key for Discord origin
  discord_author_id
  author_display_name           -- Discord name at sync (cached)
  author_avatar_url
  body_text / body_md
  status: visible | held | deleted
  parent_id / discord_parent_id
  source: discord | labs
  attachment_json NULL | { type: bot_share|house_design|course_ref, … }
  created_at, edited_at, synced_at
```

### 4.3 Bot shares (Labs SoR)

```text
community_bot_shares
  id, public_id, identity_id
  visibility: community | unlisted | private
  strategy_public_id
  bot_name, bot_version
  pack_id, pack_config_snapshot_json
  house_design_key, house_design_version   -- nullable
  phase_at_share, summary_md
  status: published | unpublished
  published_at, created_at, updated_at
```

### 4.4 FatTail Bots shelf

Not member-owned rows. **Projected** from house design catalog (code / admin SoR):

- `key`, `version`, `name`, `summary`, DTE/family labels  
- `course_refs[]` with hrefs into Labs courses  
- Entry + management config (process)  
- Actions: Apply · Copy & rebuild  

**Members cannot remove** house entries. **Only administrators** modify or version the house catalog.

### 4.5 Discord user cache (optional)

```text
community_discord_users
  discord_user_id, display_name, global_name, avatar_url, updated_at
```

For **linked members**, prefer display name from **fattail.ai** (WP-maintained Discord name)
synced into Labs. Cache is for mirror authors and refresh, not the primary connect store.

### 4.6 Identity link

```text
identity_links
  provider = 'discord'          -- or equivalent key Mike names
  external_id = Discord user snowflake
  -- populated FROM WordPress connector sync / SSO claims (wordpress:fattail)
  -- NOT from a Labs-primary Discord OAuth product path
```

Member already has `identity_links` for `wordpress:fattail`. Discord snowflake is an
**additional** link (or structured claim on the WP identity) established when the
**fattail.ai Discord connector plugin** connects them to guild **FatTail AI**.

---

## 5. Channels

### 5.1 Laws

**C-CH-1.** One Community board UI; chat content for mapped channels is the Discord conversation.  
**C-CH-2.** Seed set is fixed by Spec; admin may add more mapped channels.  
**C-CH-3.** App embed opens the channel with matching `app_key` — same `channel_id` / Discord channel as Community.  
**C-CH-4.** Unmapped channels cannot open the composer (fail loud).  
**C-CH-5.** No Journey or Wiki app_home channels in v1.

### 5.2 Seed channels (normative)

| kind | app_key | slug | Title | Purpose |
|------|---------|------|--------|---------|
| `topic` | `NULL` | `general` | General | Open general discussion |
| `app_home` | `practice` | `practice` | Practice | Practice process discussion |
| `app_home` | `strategy-lab` | `strategy-lab` | Strategy Lab | Design / Curate / Deploy process |
| `app_home` | `toughness` | `toughness` | Toughness | Mental toughness process |

Each seed row **must** map to a Discord channel on the FatTail guild at deploy.

### 5.3 Admin-created channels

| Rule | |
|------|--|
| Who | **Administrator only** |
| What | Create / rename / archive channels; set Discord channel mapping |
| Default kind | `topic` (unbound to an app) |
| App bind | Optional `app_home` only if a Labs app should embed it |
| No new app card required | Admin topics do not need an Apps hub entry |

### 5.4 In-app embed

Component: `CommunityChannelPanel({ appKey })`

| appKey | v1 |
|--------|-----|
| `practice` | Yes |
| `strategy-lab` | Yes |
| `toughness` | Yes |
| `journey` | **No** |
| `wiki` | **No** |

Header: channel title + **Open in Community** → `/app/community?channel={slug}`.  
Working in the panel **is** working in Discord (via sync) and in Community.

---

## 6. Discord second window (chat)

### 6.1 Experience

1. Member is **linked to Discord via fattail.ai** (WP Discord connector plugin) — or
   prompted to complete connect **on fattail.ai** (not a Labs-only OAuth invention).  
2. UI shows them as their **Discord name as maintained on fattail.ai** (+ avatar when available).  
3. Channel = mapped Discord channel on guild **FatTail AI**.  
4. History = same conversation as Discord (mirrored for Labs).  
5. Send from Labs → Discord; send in Discord → Labs.

Labs adds **bot shelves** beside chat — not a second social graph.

### 6.2 Sync

| Direction | Behavior |
|-----------|----------|
| Discord → Labs | Bot Gateway (or equivalent): create/update/delete; upsert on `discord_message_id` |
| Labs → Discord | Post into mapped channel; store returned id; fail loud on API error |
| Users | Link + name from **fattail.ai WP connector** (ingest); cache avatar; role sync per §8.6 |
| Idempotency | Never double-insert the same Discord message |

**Attribution:** If API policy requires bot-sent messages, label honestly (e.g. name + “via Labs”) — do not silent-impersonate.

### 6.3 Post / read rules

| Action | Requirement |
|--------|-------------|
| Read synced chat | Signed-in + Discord-included membership (v1 members-only) |
| Post | Session + **Discord link** + entitled + Discord access to channel |
| Unlinked | May use FatTail Bots shelf; **cannot post** to synced channels |

### 6.4 Moderation

- Discord moderators remain authoritative in the guild.  
- Labs `held` may hide a message in Labs UI; full guild moderation is Discord-side unless also actioned there.

### 6.5 Sync SLA (target)

| | Target |
|--|--------|
| Discord → Labs | Near real-time (Gateway) or few seconds |
| Labs → Discord | Immediate on send |
| Name refresh | On message + periodic cache |

### 6.6 Reconciliation & backfill (binding — India B1 / R1)

Gateway disconnects and worker downtime **drop** live events. Webhooks alone **miss
date-based entitlement expiry**. Both require scheduled heal jobs.

#### 6.6.1 Message gap-healing (R1)

| Trigger | Action |
|---------|--------|
| Bot reconnect after disconnect | Per mapped channel: Discord history **backfill** since `max(synced_at)` (or last stored `discord_message_id` timestamp) |
| Scheduled (e.g. every 5–15 min) | Same backfill for all mapped channels |
| Upsert | Idempotent on `discord_message_id` — never double-insert |
| Fail loud | Alert if backfill errors persist or gap exceeds SLA threshold |

Labs does **not** invent local-only history when Discord is unavailable for backfill.

#### 6.6.2 Discord role reconciliation (B1 — binding invariant)

**Problem:** Observer trial and alumni-year access end by **`current_period_end`**, not
always by a billing webhook. Event-only role sync leaves expired members with paid
Discord roles (access + revenue integrity defect).

**Invariant (DL-238):** Discord paid roles for Discord-included tiers are computed from
the **same date-aware membership derivation** Labs uses for roles (memberships past
`current_period_end` are not entitled — Membership Tiers Spec §3; Identity Access).

**Worker (required for P1b/P1c):**

1. Enumerate Discord-linked Labs identities (and/or guild members with paid roles).  
2. Compute Labs Discord-entitlement via **date-aware** membership query (not webhook payload alone).  
3. Diff vs actual guild roles.  
4. Corrective **grant** or **revoke**.  
5. **Fail-loud** alert (ops/notify) on repeated divergence after correction attempts.

Webhook-driven sync remains the **fast path** on plan change; the **sweep is mandatory**
and is the safety net for date expiry (Observer **6-week** term per DL-128; alumni year).

Evidence for gates: scheduled job logs + sample diff report (Architecture/06).

### 6.7 Event-mapping matrix (R2)

Discord events → Labs mirror behavior for mapped channels:

| Discord event / shape | Labs action | Notes |
|----------------------|-------------|--------|
| Message create | **sync** upsert | Key: `discord_message_id` |
| Message update (edit) | **sync** update body + `edited_at` | |
| Message delete | **sync** set `status=deleted` (or hard-hide) | Soft tombstone preferred for audit |
| Bulk delete | **sync** each id if provided; else channel backfill heal | |
| Reaction add/remove | **drop** (v1) | May **sync** Phase 2 |
| Thread create (channel-like) | **degrade** | v1: do not model as full Labs channel; optional show parent notice; Phase 2 map threads |
| Thread message | **degrade** / optional sync into parent display | Lossy vs Discord threads-as-channels |
| Embed-only / stickers | **degrade** | Store plain text fallback or “unsupported attachment” |
| Labs `held` (admin) | **local only** | Does **not** delete on Discord (see §6.4 / R4) |
| Labs send success | **sync** store mirror with `source=labs` | |
| Labs send API fail | **fail loud** | No optimistic permanent local-only message |

### 6.8 Moderation workflow (R4)

| Action | Effect on Discord | Effect on Labs UI |
|--------|-------------------|-------------------|
| Discord mod deletes message | Message gone in guild | Mirror → `deleted`; not shown |
| Discord mod edits message | Guild shows edit | Mirror updates |
| Labs admin **holds** message | **No change** in Discord | Hidden in Labs only |
| Labs admin wants true removal | Must act in **Discord** (or bot delete if permitted) | Then mirror follows Discord delete |

**Mod workflow (documented for admins):**

1. Prefer Discord moderation tools for real takedown.  
2. Labs **Hold** = “hidden in Labs second window only” — member may still see it in Discord.  
3. UI must not imply Labs Hold removed the message from Discord.  
4. Bot-posted “via Labs” messages: edit/delete from Discord client may be limited (member cannot always edit webhook/bot messages as themselves) — surface honest UX copy (A2).

### 6.9 Unlinked / anonymous Discord authors (A1, A3)

| State | Labs chat UI |
|-------|----------------|
| Linked Labs member | Discord display name; optional Labs profile affordance later |
| Discord author **not** linked to Labs | Show Discord display name; **no** Labs profile link; `identity_id` null |
| Labs member not linked | May **read** if entitled (lurk); **cannot post** until Discord is connected on **fattail.ai** (graceful CTA → WP connect flow — A1) |

### 6.10 Member share provenance (A4)

Member bot share cards **must** show fork provenance when the snapshot descends from a house design (`house_design_key` + `version` + “Copy & rebuild” / apply lineage). Reduces shelf clutter of near-duplicate house forks. Featured/curated tier deferred.

---

## 7. Bot sharing

### 7.1 FatTail Bots (default shared)

| Rule | |
|------|--|
| Source | House design catalog |
| Visibility | Always on shelf for signed-in members |
| Version | `key` + `version` shown; bots carry `house_design@1` into Curate/Deploy |
| Course refs | Required on each house design |
| Entry + management | Part of house config |
| Edit / version / remove from list | **Admin only** |
| Member actions | Apply · Copy & rebuild |

### 7.2 Member bot publish

| Rule | |
|------|--|
| Opt-in | Explicit publish; never on mint or arm |
| Eligibility (v1 default) | Curate or Deploy phase (or house-bound + pack config) |
| Snapshot | Frozen at publish; republish to update |
| Card content | Name, summary, phase, pack, house key@version, process notes — **no P&L** |
| Unpublish | Owner only |

### 7.3 Apply

| Action | Effect |
|--------|--------|
| Apply house | Bind house key@version + config onto Design bot |
| Copy & rebuild | Fork; provenance kept; member may diverge |
| Apply member share | Fork into **recipient** Family B only |

Never one-click live Deploy from Community.

### 7.4 Mint starters

First identity mint provisions **private** Curate house bots for that member.  
Those are **not** auto community shares. Public FatTail set = house shelf.

---

## 8. Discord membership connection

### 8.0 Existing platform (Coach — binding)

| Fact | Detail |
|------|--------|
| Guild | Discord server **FatTail AI** |
| Member connector | **WordPress plugin** on **fattail.ai** (not a Labs-first OAuth product) |
| Discord name | **Maintained on fattail.ai** by that connector; Labs displays the same name |
| Labs SSO | Existing `wordpress:fattail` / fotw-sso path already joins Labs identity to WP user |

**Law C-D-0.** Labs **must not** invent a parallel primary “Connect Discord” OAuth that
competes with the fattail.ai plugin. Connect UX for members is **on fattail.ai** (or a
deep link into that plugin flow). Labs **ingests** Discord user id + display name after
connect (SSO claims, membership webhook fields, or a dedicated WP→Labs sync Mike designs).

### 8.1 Laws

**C-D-1.** Labs membership is SoR for subscriber **entitlement** (who may have paid access).  
**C-D-2.** Discord user snowflake stored on Labs identity (`identity_links` or equivalent)
**sourced from the fattail.ai connector**, not Labs-native OAuth as primary.  
**C-D-3.** Guild paid roles must not outlive Labs entitlement (DL-238). Executor of
grant/revoke may be the **WP plugin**, a **Labs bot**, or both — Mike designs one coherent
path; no silent dual-writers fighting.  
**C-D-4.** Chat content SoR for mapped channels = Discord (**FatTail AI**); Labs mirrors.  
**C-D-5.** Bots/shares SoR = Labs.  
**C-D-6.** Link does not expose private Family B data.  
**C-D-7.** Display name in Labs Community chat for linked members = **Discord name as
maintained on fattail.ai** (not a Labs-only nickname override for guild identity).

### 8.2 Tier matrix

| Plan | Discord entitled |
|------|------------------|
| Navigator | Yes |
| Activator | Yes |
| Observer (full-access term) | Yes |
| Course Alumni | No |
| No plan | No |

### 8.3 Journey

1. Member on **fattail.ai** connects Discord via the **WordPress Discord connector plugin**
   → joined to guild **FatTail AI**; Discord name stored on WP.  
2. Labs identity exists (SSO / native); entitled plan for Discord-included tiers.  
3. Labs **ingests** Discord snowflake + display name from WP (SSO claim and/or sync).  
4. Open Community / app panel → same Discord conversation; UI shows fattail.ai Discord name.  
5. Lapse Labs entitlement → paid roles revoked (DL-238 reconcile; coordinate with WP plugin).  
6. No Discord link on Labs → cannot post in Labs second window (CTA: complete connect on
   fattail.ai).  

### 8.4 Failures

| Case | Behavior |
|------|----------|
| WP connector / SSO missing Discord fields | Shelf works; chat prompts “Connect Discord on fattail.ai”; fail loud if claimed linked but snowflake absent |
| Send/API fail | Fail loud; no fake local-only success |
| Dual Labs bind same Discord user | Reject |
| Rate limits | Queue + backoff |
| Role divergence after reconcile | Fail-loud alert (DL-238) |

### 8.5 Discord platform requirements (R3 — Mike owns)

Named prerequisites **before** message-sync build (P1c). Split **member connect** vs
**Labs bridge bot**:

| Requirement | Owner surface | Why |
|-------------|---------------|-----|
| WP Discord connector plugin on fattail.ai | **WP / existing** | Member connect + Discord name on fattail.ai |
| Discord snowflake + name in Labs via WP SSO/sync | **Mike + Alpha** | Post gate + attribution |
| **Message Content Intent** (privileged) | Labs (or shared) bot | Read message bodies for Discord → Labs mirror |
| **Server Members Intent** (`GUILD_MEMBERS`) | Bot used for reconcile | Role reconcile + member awareness |
| Bot in **FatTail AI** guild with channel read/write | Labs bridge | Second-window send/mirror |
| **Webhook id + token per mapped channel** (or equivalent) | Labs | Labs → Discord send; edit/delete of Labs-origin messages |
| Guild id + mapped channel ids in config/DB | Labs | Channel map |
| Secrets in env only | Labs | `LABS_DISCORD_*` — never commit |
| Inventory WP plugin role-sync vs Labs reconcile | Mike | Single grant/revoke story (C-D-3) |

Auth owner (Mike) documents: WP plugin name/version, claim field names for Discord id/name,
and rotate/runbook. Does **not** add Labs-primary OAuth without Coach amend.

### 8.6 Role sync paths

| Path | When |
|------|------|
| WP plugin / Woo membership events | Existing member connect + often role apply on fattail.ai |
| Labs webhook / membership change | Fast path entitlement signal (may notify WP or Labs bot) |
| **Scheduled reconciliation** | Mandatory Labs safety net: date-aware entitlement vs guild roles (DL-238) |
| After WP→Labs Discord link ingest | Ensure Labs has snowflake + name; role apply if executor is Labs |

---

## 9. API sketch

```
# Channels & messages (synced)
GET    /api/me/community/channels
GET    /api/me/community/channels/{slug}
GET    /api/me/community/channels/{slug}/messages?cursor=
POST   /api/me/community/channels/{slug}/messages   # requires Discord link

GET    /api/me/community/apps/{app_key}/channel      # practice|strategy-lab|toughness

POST   /api/admin/community/channels                # create + Discord map
PATCH  /api/admin/community/channels/{slug}

# Bot shelves (Labs SoR)
GET    /api/me/community/bots/fattail
GET    /api/me/community/bots/member
POST   /api/me/community/bots/shares
POST   /api/me/community/bots/shares/{id}/unpublish
POST   /api/me/community/bots/shares/{id}/apply

# Discord (link status from WP ingest — no Labs-primary OAuth)
GET    /api/me/community/discord/status       # linked?, display_name, discord_user_id
GET    /api/me/community/discord/connect-url   # deep link / fattail.ai connector entry (not Labs OAuth app)
POST   /api/internal/discord/ingest-link      # WP→Labs snowflake+name (if not pure SSO claim)
POST   /api/internal/discord/sync-roles
POST   /api/internal/discord/reconcile-roles   # scheduled date-aware sweep (DL-238)
POST   /api/internal/discord/backfill-channel  # gap-heal messages for one channel
# Gateway bot worker (ops process, not public browser API)
```

---

## 10. Permissions

| Action | Who |
|--------|-----|
| Read channels | Entitled signed-in member |
| Post message | Linked + entitled member |
| Publish bot share | Bot owner (eligibility) |
| Apply house/share | Signed-in member |
| Create/rename/archive channels | **Administrator** |
| Version house catalog | **Administrator** |
| Moderate guild | Discord mods; Labs admin may hold in Labs UI |
| Discord role assignment | WP plugin primary; Labs entitlement + DL-238 reconcile |

---

## 11. Privacy & doctrine

1. Private bots default; publish is explicit.  
2. Publish is a **snapshot**, not a live window into Family B.  
3. Journey remains opt-in presence; **no Journey channel**.  
4. No marketing scrape of P&L (none should exist on board).  
5. Process outcomes only in norms and bot card copy.  
6. Demo identities excluded from public aggregates if policy requires.

---

## 12. Relationship to existing surfaces

| Surface | Relationship |
|---------|----------------|
| **Discord server** | Conversational SoR; Labs is second window + roles |
| **Strategy Lab** | Embed `#strategy-lab`; FatTail shelf; Apply designs |
| **Practice** | Embed `#practice` |
| **Toughness** | Embed `#toughness` |
| **Journey** | No channel; keep Journey app |
| **Wiki** | No channel; keep Wiki |
| **Course discussion** | Stay until Phase 2 bridge |
| **Help desk** | Separate; optional admin `#help` later |

---

## 13. Phased delivery

| Phase | Deliverable |
|-------|-------------|
| **P0** | This Spec · Coach + gates approval |
| **P1a** | App card, shell, channel map seed, FatTail + member bot shelves |
| **P1b** | WP→Labs Discord link ingest (fattail.ai plugin), display names, role sync + **scheduled date-aware reconcile (DL-238)** |
| **P1c** | Bidirectional message sync + **gap-heal backfill** + composer + app embeds |
| **P1d** | Admin channel create/map; share/apply + house provenance on cards |
| **P2** | Bot-share Discord embeds; course discussion migration; reactions / threads |

**Coach Phase 5 APPROVED (2026-08-06) — build authority (DL-239).**  
**India CONDITIONAL GO closed:** B1 (DL-238 + §6.6.2); R1–R4 (§6.6–6.8, §8.5).  
**C0-G PASS (2026-08-06):** specialist C0 + Delta lock — **C1a unlocked** (`agents/p-community/gate-reports/C0-G.md`).

---

## 14. Acceptance checklist

1. Community card on `/app`; page loads at `/app/community`.  
2. Four seed channels mapped to Discord; no Journey/Wiki channels.  
3. Admin can create another mapped channel; member cannot.  
4. Discord message appears in Labs; Labs send appears in Discord.  
5. UI shows Discord name as maintained on fattail.ai for linked authors; unlinked Discord authors have no Labs profile link.  
6. Unlinked user cannot post; CTA sends them to **fattail.ai** Discord connector (may lurk if entitled).  
7. In-app Strategy Lab panel matches Community `#strategy-lab`.  
8. FatTail shelf: house versions + course refs; cannot delist by member.  
9. Member share publish/apply isolation; share cards show house provenance when forked.  
10. Role sync: entitled → roles; lapsed → revoke; **date expiry without webhook still revokes** (reconcile).  
11. Message backfill after Gateway downtime is idempotent.  
12. Labs Hold does not claim Discord removal (mod workflow copy).  
13. Tests: map uniqueness, link collision, share isolation, no local-only fake send, event matrix edit/delete.  
14. Tango: no profit-claim copy on shelves/empty states.

---

## 15. Risks

| Risk | Mitigation |
|------|------------|
| Two diverging chats | Sync mandatory for mapped channels |
| Full Discord client scope | No voice; single guild; chat + shelves only |
| API / intent limits | Document bot send policy; fail loud |
| Clone-to-live culture | Apply → Design only |
| Moderation split | Discord guild authority; Labs UI hold documented |
| Dual identity bind | Unique Discord external_id |
| Parallel Labs Discord OAuth | **Forbidden** without Coach amend (DL-240); connect stays on fattail.ai |

---

## 16. Open questions (defaults in this Spec)

| Question | Default |
|----------|---------|
| Board message read: members-only vs public? | **Members-only** |
| Member publish minimum phase? | **Curate or Deploy** |
| Discord connect required for Labs apps? | **Soft for Labs tools; hard for chat post** — connect on **fattail.ai** plugin, not Labs OAuth |

---

## 17. Document control

| Ver | Date | Note |
|-----|------|------|
| **1.0** | **2026-08-06** | Complete Community App Spec: Discord second window, seed channels, admin channels, bot shares, Apps hub card |
| **1.0.1** | **2026-08-06** | India gate: §6.6 reconciliation/backfill (B1/R1), §6.7 event matrix (R2), §6.8 mod workflow (R4), §8.5 platform intents (R3); A1–A4; DL-237/238 |
| **1.0.1** | **2026-08-06** | **Coach Phase 5 APPROVED** — BUILD AUTHORITY (DL-239); execution under `agents/p-community/` |
| **1.0.2** | **2026-08-06** | **DL-240:** Discord connect + name = WP plugin on fattail.ai → guild **FatTail AI**; Labs consumes (no parallel Labs OAuth) |
| **1.0.2** | **2026-08-06** | India C0-1 residual: §2.1 / §10 wording aligned to DL-240 (no “OAuth link” drift) |
| **1.0.2** | **2026-08-06** | **Cross-link:** Bot Marketplace Framework Spec (DL-243). |
| **1.0.2** | **2026-08-06** | **DL-244 / Marketplace Spec v0.1.1:** `fattail.bot_package` is the **sole** portable substrate for member bot transfer. Community §7 member share **writes** must target packages (`bot_count=1` allowed); no parallel free-standing portable snapshot. FatTail **house shelf** remains catalog Apply/Copy (unchanged). Verb for packages: **Import**. |

---

## 18. Approval

| Role | Verdict | Date |
|------|---------|------|
| Coach | **APPROVED** — Phase 5 / BUILD AUTHORITY; v1.0.2 DL-240 connector amend | 2026-08-06 |
| India (architecture) | **APPROVED** residual stamp C0-1 (B1/R1–R4 + DL-240 dual SoR) | 2026-08-06 |
| Tango (member experience) | **APPROVED** C0-2 | 2026-08-06 |
| Mike (auth / Discord secrets) | **APPROVED** C0-3 | 2026-08-06 |
| Echo (UI) | **APPROVED** C0-4 | 2026-08-06 |
| Foxtrot (bot worker / deploy) | **APPROVED** C0-5 | 2026-08-06 |
| Delta (C0-G) | **PASS** — unlocks C1a | 2026-08-06 |
