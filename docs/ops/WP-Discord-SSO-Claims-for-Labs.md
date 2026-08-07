# WP → Labs Discord identity (seamless auth)

**Audience:** WP/fotw-sso operator (Conor) + Labs Mike/Alpha  
**Date:** 2026-08-06  
**Decisions:** DL-240 · Mike C0-3 · Community Spec §8  

---

## Goal

When a member is already signed into **fattail.ai** and has connected Discord via the
**Woo Subscription Discord** plugin, a hop to **labs.fattail.ai** should already know:

- Labs identity (existing `fotw-sso` JWT → `ft_session`)
- Discord **user snowflake** + **display name** (for Community second-window attribution)

**Two-way chat** does **not** use the member’s Discord OAuth token. It uses the Labs
**bridge bot** + channel map (C1c). Identity is only for “who is this person.”

---

## Do **not** pass Discord OAuth tokens to Labs

| Pass to Labs? | Item |
|---------------|------|
| **Yes** | Signed fotw-sso JWT (already) with **new claims** below |
| **Yes** | `discord_user_id`, `discord_username`, optional `avatar` |
| **No** | Discord `access_token` / `refresh_token` (WP user meta only) |
| **No** | WP bot token / client secret in Labs browser cookies |
| **No** | Labs-primary Discord OAuth product |

Reasons: token theft via query strings/logs, scope overreach, dual OAuth product
conflict with the existing WP connector (DL-240).

---

## WP meta keys (Woo Subscription Discord)

From plugin inventory:

| Meta key | Use in JWT claim |
|----------|------------------|
| `_ets_woo_subscriptions_discord_user_id` | `discord_user_id` |
| `_ets_woo_subscriptions_discord_username` | `discord_username` |
| `_ets_woo_subscriptions_discord_avatar` | `discord_avatar` (optional) |

Connect URL (member CTA): `https://fattail.ai/my-account/?action=woo-subscriptions-discord-login`  
(or dashboard with shortcode — dual-domain plugin sets OAuth redirect to  
`https://fattail.ai/my-account/?via=connect-woo-subscriptions-discord`).

**0-DTE bridge** is a **separate** guild (Navigator perk). Labs FatTail AI second
window uses the **primary** Woo Subscription Discord connection, not `_fotw_0dte_*`.

---

## fotw-sso patch (required on fattail.ai)

When minting the Labs SSO JWT, if Discord meta exists, add:

```php
// Pseudocode inside fotw-sso JWT payload builder
$discord_id = get_user_meta( $user_id, '_ets_woo_subscriptions_discord_user_id', true );
if ( $discord_id ) {
    $payload['discord_user_id'] = (string) $discord_id;
    $payload['discord_username'] = (string) get_user_meta(
        $user_id, '_ets_woo_subscriptions_discord_username', true
    );
    $avatar = get_user_meta( $user_id, '_ets_woo_subscriptions_discord_avatar', true );
    if ( $avatar ) {
        $payload['discord_avatar'] = (string) $avatar;
    }
}
// Never put access_token / refresh_token in the JWT.
```

Keep JWT TTL **≤ 120s** (`docs/ops/WP-SSO-JWT-TTL.md`).

Existing Labs login entry is unchanged:

```text
https://fattail.ai/fotw-sso?redirect=<urlencoded Labs callback>
Labs callback:
  https://labs.fattail.ai/api/auth/sso/wordpress:fattail?next=/app/community
```

---

## Labs behavior (as-built C1b ingest)

On successful SSO verify:

1. Resolve identity + memberships (unchanged).  
2. If `discord_user_id` present → `identity_links` provider `discord` +  
   `identity_discord_profiles` (username/avatar).  
3. Collision (snowflake already on another identity) → **409**.  
4. `GET /api/me/community/discord/status` reports `linked` + display name.  

No Discord OAuth tokens are stored.

---

## Two-way chat (separate track — C1c)

| Direction | Mechanism |
|-----------|-----------|
| Discord → Labs | Labs Gateway bot (Message Content Intent) |
| Labs → Discord | Bot or channel webhook |
| Auth for members | `ft_session` + Discord link for **post** gate |
| Channel map | Admin `/admin/community` Discord snowflakes |

Seamless **recognition** = SSO claims. Seamless **chat** = bridge bot after map.

---

## Plugin inventory (zip 2026-08-06)

| Plugin | Role |
|--------|------|
| **woo-subscriptions-discord** | Primary connect + guild roles on FatTail AI |
| **fotw-dual-domain-discord** | OAuth redirect host fattail vs legacy flyonthewall |
| **fotw-0dte-discord-bridge** | Separate 0-DTE guild for Navigators |
| **fotw-discord-guardian** | Impersonation / name abuse monitoring |

**Security:** The 0-DTE bridge PHP in the zip contains **hardcoded Discord client_secret
and bot token**. Treat as compromised if the zip was shared broadly — **rotate those
credentials in Discord Developer Portal** and move secrets to WP options / env, never
commit them to Labs.

---

## Env (Labs) — where secrets live

**Safe place:** gitignored repo-root **`.env`** (mode `600`). Never commit.  
**Template:** `.env.example` (placeholders only).  
**Production:** same keys on MiniTwo `.env` (Foxtrot); not the plugin zip.

| Key prefix | Source | Used for |
|------------|--------|----------|
| `LABS_DISCORD_0DTE_*` | fotw-0dte-discord-bridge (Navigator guild) | Optional; separate product surface |
| `LABS_DISCORD_*` (no 0DTE) | FatTail AI Labs bridge app | Community second window C1c |
| WP `ets_woo_subscriptions_discord_*` | Woo plugin **WP options** | Stay on WordPress — do not copy member OAuth tokens into Labs |

```bash
# Local .env (example shapes — real values only in gitignored .env)
LABS_DISCORD_CONNECT_URL=https://fattail.ai/my-account/
LABS_DISCORD_BRIDGE=0
# LABS_DISCORD_GUILD_ID=
# LABS_DISCORD_BOT_TOKEN=
# LABS_DISCORD_0DTE_GUILD_ID=
# LABS_DISCORD_0DTE_BOT_TOKEN=
```

Member Discord **access/refresh** tokens remain WP user meta only (never Labs `.env`).
