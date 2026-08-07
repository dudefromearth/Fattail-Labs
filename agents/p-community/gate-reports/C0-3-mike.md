# C0-3 — Mike auth / Discord platform

**Agent:** Mike  
**Date:** 2026-08-06  
**Depends on:** C0-0 PASS · Spec v1.0.2 §8 · **DL-240**  
**Verdict:** **APPROVED** (design direction) — with **operator inventory residual** before C1b ship

---

## 1. Inventory — member connector (WP)

### 1.1 Plugin (evidence)

| Field | Value | Source |
|-------|--------|--------|
| Product name | **Discord Role Sync for WooCommerce Subscriptions** | Plugin header `woo-subscriptions-discord.php` |
| Slug / text domain | `woo-subscriptions-discord` | Same |
| Vendor | ExpressTech Softwares Solutions Pvt Ltd | Same |
| Version | **1.0.0** | `WOO_SUBSCRIPTIONS_DISCORD_VERSION` |
| MSC WP catalog name | **Woo Subscription Discord** 1.0.0 | `MarketSwarm-Canonical/org/reference/softwares/flyonthewall_wordpress.md` |
| Related (not connect) | **fotw-discord-guardian** 1.0.0 — impersonation monitor | Same MSC ref |
| Local code tree inspected | `/Users/ernie/Sites/0dte/wp-content/plugins/woo-subscription-discord-1/` | Disk inventory 2026-08-06 |

**Assumption (Coach + MSC catalog):** same plugin family is what fattail.ai uses to connect members to guild **FatTail AI**. Live fattail.ai plugin version / guild id / product→role map must be **operator-confirmed** before production C1b (residual §7).

### 1.2 Guild join + OAuth (member path)

| Step | Behavior |
|------|----------|
| Entry UI | Shortcode `[ets_woo_subscriptions_discord]` on Woo **My Account** dashboard + thank-you; button “Connect to Discord” |
| Start connect | Logged-in WP user → `?action=woo-subscriptions-discord-login` → Discord OAuth authorize |
| Scopes | `identify email connections guilds guilds.join` |
| Callback | Redirect page with `via=connect-woo-subscriptions-discord` + `code` |
| Guild | `ets_woo_subscriptions_discord_server_id` (WP option) — expected **FatTail AI** on fattail.ai |
| After token | Fetches Discord user; stores meta; schedules **add member to guild** + **put roles** via Action Scheduler |

**Labs CTA (Spec §8.3):** deep-link members to the **fattail.ai** page that hosts the shortcode / My Account Discord block — **not** a Labs OAuth app. Exact production URL = operator residual (`/my-account/` or configured redirect page).

### 1.3 WP user meta (name + snowflake on fattail.ai)

| Meta key | Content | Labs may ingest? |
|----------|---------|------------------|
| `_ets_woo_subscriptions_discord_user_id` | Discord snowflake | **Yes** — post gate + attribution |
| `_ets_woo_subscriptions_discord_username` | Display string (`username#discriminator` at connect time) | **Yes** — UI name (refresh may lag modern Discord global names) |
| `_ets_woo_subscriptions_discord_avatar` | Avatar hash | Optional (build CDN URL) |
| `_ets_woo_subscriptions_discord_access_token` | OAuth access token | **NEVER** — WP-only |
| `_ets_woo_subscriptions_discord_refresh_token` | Refresh token | **NEVER** — WP-only |
| `_ets_woo_subscriptions_discord_expires_in` | Token expiry | **NEVER** |
| `_ets_woo_subscriptions_discord_role_id_for_*` | Assigned role bookkeeping | Optional diagnostics only |

Coach lock holds: **Discord name is maintained on fattail.ai** (this user meta + WP admin user list column).

### 1.4 Role mapping (WP primary)

- Per WooCommerce **subscription product**: post meta `ets_subsciptions_roles` → Discord role ids.  
- Lifecycle hooks: `active` / `cancelled` / `failed` / `expired` / status changed → Action Scheduler grant/revoke/DM.  
- **Executor of day-to-day paid roles = WP plugin**, driven by **Woo subscription status**.

---

## 2. Labs today (as-built)

| Surface | Discord? | Evidence |
|---------|----------|----------|
| `server/providers.py` WordPress SSO | **No** Discord claims | JWT → `wp_user_id`, email, `display_name`/`name`, plans/roles only |
| `identity_links` | WP providers `wordpress:fattail`, `wordpress:0-dte` | No `discord` provider rows in design yet |
| fotw-sso | Mint SSO only | Docs: `docs/WooCommerce-SSO-Integration-Guide.md` |

**Gap:** member may be Discord-linked on WP while Labs has **no snowflake** → cannot satisfy Community post gate without ingest.

---

## 3. Ingest path (binding design)

### 3.1 Principles

1. **No Labs-primary Discord OAuth** (DL-240).  
2. **Never** store WP Discord OAuth tokens in Labs.  
3. One Discord snowflake → **one** Labs identity (`UNIQUE(provider, external_id)`).  
4. Fail loud if UI claims “linked” but snowflake missing.  
5. Prefer **additive** contracts on existing WP→Labs pipes (SSO + optional webhook).

### 3.2 Recommended claim map (fotw-sso extend — preferred)

Extend **fotw-sso** JWT for issuer `fotw` / provider `wordpress:fattail` (and 0-dte if same plugin later):

| JWT claim (proposed) | Source WP meta | Labs use |
|----------------------|----------------|----------|
| `discord_user_id` | `_ets_woo_subscriptions_discord_user_id` | `identity_links` `provider='discord'`, `external_id` |
| `discord_username` | `_ets_woo_subscriptions_discord_username` | Community display name cache |
| `discord_avatar` (optional) | `_ets_woo_subscriptions_discord_avatar` | Avatar URL build |

On SSO success (`GET /api/auth/sso/wordpress:fattail`):

1. Existing identity upsert unchanged.  
2. If `discord_user_id` present and non-empty → upsert Discord link; reject if snowflake already bound to **another** identity.  
3. If claim **absent** or empty → member treated **unlinked** for Community post (CTA → fattail.ai).  
4. Do **not** invent “linked” from WP role names alone.

### 3.3 Secondary path (connect after Labs session)

Member connects Discord **after** already holding `ft_session`:

| Option | Recommendation |
|--------|----------------|
| A. “Refresh SSO” after WP connect | Simple: CTA → fattail.ai connect → return via fotw-sso with new claims |
| B. Signed WP→Labs webhook on connect | Optional later; same payload as claims; HMAC with existing provider secret pattern |
| C. Labs polling WP REST | **Avoid** v1 — extra attack surface + credentials |

**v1 default:** A (re-SSO / reauth after connect). Status API: `GET /api/me/community/discord/status` → `{ linked, discord_user_id, display_name, connect_url }`.  
`connect_url` = configured `LABS_DISCORD_CONNECT_URL` (absolute fattail.ai URL) — **fail loud if unset in staging/prod** when Community feature on.

### 3.4 Out of scope for Labs secrets

Do not put in Labs env:

- WP Discord **client secret** / member OAuth tokens  
- WP bot token used solely by the Woo plugin (unless intentionally shared as bridge — §5)

---

## 4. Labs bridge bot (second window) — distinct from member connect

Member connect OAuth app + guild join is **WP plugin**. Labs still needs a **bridge** for Spec §6:

| Requirement | Why | Owner |
|-------------|-----|--------|
| Message Content Intent | Discord → Labs body mirror | Labs bot app |
| GUILD_MEMBERS intent | Reconcile + member awareness | Labs bot app |
| Channel read + send | Second window | Labs bot app |
| Per-mapped-channel webhook id+token | Labs-origin post/edit/delete | Labs DB + secrets |
| Guild id + channel map | Spec seed channels | Config/DB |

**Env (fail loud if Community message sync enabled):**

```text
LABS_DISCORD_GUILD_ID=
LABS_DISCORD_BOT_TOKEN=          # bridge bot; never log
LABS_DISCORD_CONNECT_URL=        # https://fattail.ai/... My Account / connect page
# Optional if bridge ≠ WP bot:
# LABS_DISCORD_APPLICATION_ID=
```

Per-channel webhook secrets: DB or env map — not committed.

**May the bridge bot equal the WP plugin bot?** Ops choice only if single bot has least privilege for both role management and channel webhooks. Prefer **document shared token risk**; do not hardcode “must be same app.”

---

## 5. Role executor decision (no dual-writer fight)

| Path | Role | Notes |
|------|------|--------|
| **Primary writer** | **WP plugin** on Woo subscription status | Already grants/revokes/DM on active/cancel/fail/expire |
| **Entitlement SoR** | **Labs memberships** (date-aware) | DL-238; Observer term / alumni year |
| **Safety net** | **Labs scheduled reconcile** using Labs bridge bot | Diff Labs entitled+linked vs guild roles; corrective revoke/grant **or** alert-only Phase 1 |
| **Forbidden** | Labs membership webhook blindly applying roles **without** coordination + WP continuing writes | Dual writers |

### 5.1 Recommended hybrid (binding)

1. **Commerce-time roles:** leave with **WP plugin** (product → Discord role map stays on WP).  
2. **Labs reconcile job (DL-238):**  
   - Input: Labs date-aware Discord entitlement + `identity_links.discord` snowflake.  
   - Read guild member roles via bot.  
   - If Labs **not** entitled but paid role present → **revoke** (Labs bot) + fail-loud log/alert.  
   - If Labs **entitled** + linked but role missing → **prefer alert + “re-sync on fattail.ai”** in P1b; optional grant once role map is mirrored in Labs config (P1b+).  
3. Document paid Discord role **ids** in Labs config (`LABS_DISCORD_PAID_ROLE_IDS` or map) for reconcile — fail loud if empty when reconcile enabled.

This preserves DL-238 (date expiry without Woo event) without replacing the WP connector.

### 5.2 Threat notes

| Threat | Mitigation |
|--------|------------|
| Forged SSO Discord claims | Same HS256 secret as fotw-sso; short TTL (≤120s ops doc); never trust client |
| Snowflake hijack (bind to other account) | Unique link; reject collision |
| Labs bot over-privilege | Least privilege vs Administrator; avoid BOT_PERMISSIONS=8 if possible (plugin default is high — do not copy blindly) |
| Token leak | Never log JWT `sso` query or Discord tokens; secrets ≥32 where applicable |
| WP expire lag vs Labs period end | Reconcile sweep is the safety net |
| Unlinked Discord authors in mirror | `identity_id` null; show Discord name only (Spec §6.9) |

---

## 6. Seed checklist

| # | Item | Status |
|---|------|--------|
| 1 | Inventory WP connector | **Done** (plugin code + MSC catalog; live fattail residual) |
| 2 | Ingest path + claim map | **Done** (§3) — no Labs-primary OAuth |
| 3 | Message Content + GUILD_MEMBERS for bridge | **Done** (§4) |
| 4 | Per-channel webhooks | **Done** (§4) |
| 5 | Role executor | **Done** (§5) — WP primary + Labs reconcile |
| 6 | Secrets fail loud + link collision | **Done** |

---

## 7. Residuals (operator / Alpha before C1b production)

1. Confirm fattail.ai runs same plugin version and guild **FatTail AI** server id.  
2. Capture production **connect URL** for `LABS_DISCORD_CONNECT_URL`.  
3. fotw-sso patch: emit `discord_user_id` + `discord_username` when meta present (WP work — coordinate Conor/WP).  
4. Paid Discord role id list for Labs reconcile.  
5. Decide bridge bot token shared with WP bot or separate app.  

None of these reverse the design verdict; they are **ship evidence**, not design RETURN.

---

## 8. Verdict

**APPROVED** for Community C0 security design under DL-240 / Spec v1.0.2.

- Member connect + Discord name SoR = **fattail.ai Woo Subscription Discord plugin**.  
- Labs = ingest snowflake/name + second-window bridge + DL-238 reconcile.  
- **No** Labs Discord OAuth product.

**Unblocks:** Alpha/Charlie C1b design against claim map; Foxtrot worker design for bridge + reconcile.  
**Does not unlock:** C1a code (still needs C0-G) unless Coach waives sequencing.

**For Alpha (C1b):** implement status + link upsert from SSO claims; never token mirror.  
**For Foxtrot:** Gateway/bridge + scheduled reconcile; config fail loud.  
**For Tango:** CTA copy → fattail.ai connect (not “Authorize Labs Discord app”).
