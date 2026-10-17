# Deep analysis — ActiveCampaign contact creation, and the Discord plugin

Companion to [SPEC §18](../../Specs/FatTail-Labs-Native-Billing-Spec-v2.0.md). Written 2026-10-16 from the live source
on the FatTail Hostinger box. Read-only throughout.

This document answers two questions SPEC §18.11.6 left open:

1. **What actually creates ActiveCampaign contacts today?**
2. **How does the Discord plugin really work?**

Both answers change the migration plan.

---

## Part 1 — ActiveCampaign contacts

### 1.1 The answer: yes, the vendor plugin does it — by two routes

`activecampaign-for-woocommerce` (144 non-vendor PHP files) is **connected and actively
running** against `0dte.api-us1.com`. It creates contacts through two independent paths:

| Hook | What happens |
|---|---|
| **`user_register`** | `User_Registered_Event::trigger()` creates the AC contact immediately and stamps the WP user with `activecampaign_for_woocommerce_contact_synced` and `…_contact_last_synced`. Its own log line reads *"Registered event: New contact synced to ActiveCampaign."* |
| **`woocommerce_new_order` · `woocommerce_payment_complete` · `woocommerce_checkout_order_created` · `woocommerce_checkout_update_order_meta`** | queues an order sync, which pushes `ecomCustomer` + `ecomOrder` and resolves/creates the `contacts` record via `AC_Contact_Repository` |

It is demonstrably live, not dormant — Action Scheduler history:

```
activecampaign_for_woocommerce_cart_updated_recurring_event      28,720 complete · 1 pending
activecampaign_for_woocommerce_run_order_sync                     4,867 complete · 1 pending
activecampaign_for_woocommerce_admin_sync_single_order_status      1,125 complete
activecampaign_for_woocommerce_admin_sync_single_order_active        582 complete · 8 canceled
```

So `membership-auto-upgrade`'s own `ensure_ac_contact()` is a **fallback**, not the primary
path: it looks the contact up and only calls `/contact/sync` if the vendor plugin has not
already created it. That ordering matters — it is why tagging works on a first purchase.

### 1.2 The finding that matters: this is much bigger than "create contacts"

SPEC §18.9 said Labs must `POST /contact/sync` on signup. True, but it badly understates the
loss. The vendor plugin is driven by **WooCommerce orders and carts**. When checkout moves to
Labs, there are no more Woo orders — so everything below stops, silently:

| Capability | Driven by | After Woo checkout goes |
|---|---|---|
| Contact creation on registration | `user_register` | **stops** — Labs owns signup |
| Contact creation on purchase | Woo order hooks | **stops** |
| `ecomOrder` push (revenue in AC) | Woo order sync | **stops** — AC revenue reporting goes flat |
| `ecomCustomer` records | Woo order sync | **stops** |
| **Abandoned-cart tracking** (28,720 events) | Woo cart hooks | **stops entirely** |
| Browse/product-view tracking | `ba_product_url_patterns` pointing at `fattail.ai/product/*` | **breaks** — the URLs will be Labs URLs |
| Subscription status in AC | `woocommerce_subscription_status_updated`, `woocommerce_subscription_payment_complete`, `woocommerce_scheduled_subscription_trial_end` | **stops** |
| Refund sync | `woocommerce_order_refunded` | **stops** |

Any ActiveCampaign automation keyed on ecommerce data — abandoned cart, purchase value,
product viewed, order count — **dies at cutover and will not announce itself.** That is a
distinct workstream from tier tagging, and nobody has costed it.

### 1.3 What Labs must own, ordered

1. **Contact create/update on signup** — `POST /contact/sync` with email + name. Small.
2. **Tier tagging + stripping** — SPEC §18.6's reconciler. Already designed.
3. **Decide the fate of AC's ecommerce layer.** Three honest options:
   - **(a) Drop it.** Accept that AC becomes a tagging and email tool, with no revenue data.
     Cheapest. Audit which live automations break first.
   - **(b) Re-push it from Labs.** Labs posts `ecomCustomer` / `ecomOrder` from
     `billing_charges` on each successful charge. Moderate work, keeps AC reporting intact.
     The ledger already holds everything needed.
   - **(c) Keep Woo as a shadow order book** purely to feed AC. Rejected — it reintroduces
     exactly the dual-write problem §7.13 exists to remove.
   Recommendation: **(b)**, because `billing_charges` is already the authoritative money record
   and one `ecomOrder` push per successful charge is a small addition to the worker's success
   path. But it is Ernie's call, and it needs an audit of which AC automations actually use
   ecommerce fields before anyone commits.
4. **Abandoned cart** — genuinely lost unless Labs' checkout implements its own. Out of scope
   for v2.0; flag it as a deliberate casualty.

### 1.4 Correction to SPEC §18.9

> §18.9 said: *"today the WooCommerce→AC plugin creates contacts; with Woo checkout gone, Labs
> must `POST /contact/sync` on signup"*.

Accurate as far as it goes, but it frames a repoint where the reality is a **capability
deletion**. §1.2 above is the correct scope.

---

## Part 2 — The Discord plugin, properly understood

### 2.1 First, a correction

SPEC §18.11.6 recorded the plugin as **15,100 files** and argued it need not be read. **That
file count was wrong** — an artefact of a broken sweep script counting the whole plugins
directory. The real plugin is:

```
woo-subscription-discord-1 Backup/      27 files total, 11 PHP, 3,455 lines
├── woo-subscriptions-discord.php                    527   bootstrap, AS tuning
├── includes/class-…-front.php                       929   ALL the subscription logic
├── includes/class-…-settings.php                    621   admin
├── includes/class-…-utils.php                       542   role resolution, API logging
├── includes/class-…-dependencies.php                195
├── includes/class-…-logs.php                        100
├── includes/class-…-constants.php                    54
└── templates/admin/*.php                            487
```

Entirely readable, and now read. The directory name genuinely contains a space and the word
"Backup" — it is the active plugin despite the name.

### 2.2 Where roles come from

Roles are **product meta**, not code. Each product carries
`ets_subsciptions_roles` = an array of Discord role ids. Live values:

| Product | Discord role | Role id |
|---|---|---|
| 1718 Observer | Observer | `1445752902789496912` |
| 1799 Activator | Activator | `1445754832559538288` |
| 1800 Navigator | Navigator | `1445753817332449432` |
| 7864 Navigator Annual | Navigator | `1445753817332449432` |
| 12234 Navigator Quarterly | Navigator | `1445753817332449432` |
| 9816 Navigator Lifetime | Navigator | `1445753817332449432` |
| 7923 Navigator Variable | Navigator | `1445753817332449432` |

All nine roles the plugin knows about in the guild:

```
1440796445035987043  Server Booster      1445752902789496912  Observer
1445753817332449432  Navigator           1445754832559538288  Activator
1446212765352988703  Mini Boss           1457425675018571847  Big Boss
1463963910062215249  coaching            1503429957009932459  Castaway
1542874715125719080  IkI Labs
```

Resolution functions in `utils`: `get_subscription_available_roles($subscription)` (used by the
grant path) and `get_user_available_roles($user_id)` (used on disconnect). Both just collect
`ets_subsciptions_roles` across the items and flatten.

### 2.3 The grant and strip paths

**Grant** — `woocommerce_subscription_status_active` at priority **99**:

```
subscription_status_active($sub)
  -> get_subscription_available_roles($sub)        # product meta
  -> put_discord_role_api($user_id, $role, true)
  -> as_schedule_single_action('ets_woo_subscriptions_discord_as_schedule_member_put_role')
  -> ets_woo_subscriptions_discord_as_handler_put_member_role()
  -> PUT /guilds/{guild}/members/{discord_user}/roles/{role}   Authorization: Bot <bot_token>
```

**Strip** — `subscription_status_cancelled` / `_failed` / `_expired`, all priority 99, all the
same handler. It deletes the product's `ets_subsciptions_roles`, then assigns a **fallback
role** read from `ets_role_upon_canceling_membership`, `ets_role_upon_expire` or
`ets_role_upon_failed_payment`, and optionally sends a DM.

Five Action Scheduler hooks in total: `…as_handle_add_member_to_guild`,
`…as_schedule_member_put_role`, `…as_send_dm`, `…as_schedule_delete_role`,
`…as_schedule_delete_member`. Everything is queued and paced, with
`action_scheduler_queue_runner_batch_size` and `…concurrent_batches` filtered, plus a
randomised timestamp to respect Discord rate limits.

### 2.4 ⚠️ The silent no-op — exact root cause, found

`fotw-discord-role-reconcile.php` exists because role grants silently fail. Here is why, from
`ets_woo_subscriptions_discord_as_handler_put_member_role()`:

```php
$access_token      = get_user_meta( $user_id, '_ets_woo_subscriptions_discord_access_token', true );
$discord_bot_token = get_option( 'ets_woo_subscriptions_discord_bot_token' );
...
if ( $access_token && $_ets_woo_subscriptions_discord_user_id ) {
    $param = [ 'method' => 'PUT', 'headers' => [
        'Authorization' => 'Bot ' . $discord_bot_token,   // <- authenticates with the BOT
    ]];
    $response = wp_remote_get( $discord_change_role_api_url, $param );
}
// no else. no log. the Action Scheduler job completes "successfully".
```

**The request authenticates as the bot, but the code gates on the member's OAuth
`access_token`.** That token is irrelevant to the API call. So when a member's OAuth token has
lapsed — which happens routinely — the grant is skipped entirely, nothing is logged, and the
scheduled action is marked complete. An active, paying member silently sits in the guild
without their role.

This is a genuine upstream bug, not a configuration problem, and it is unfixable without
patching the vendor plugin. It is also the single strongest argument for SPEC §18.6: a
reconciler that reads desired state and uses the bot token alone is immune to it.

### 2.5 A second, latent bug

In `subscription_status_cancelled`:

```php
foreach ( $product_ids as $product_id ) {
    $saved_roles = get_post_meta( $product_id, 'ets_subsciptions_roles', true );   // ASSIGN
    ...
}
// loop ends, then $saved_roles is used
```

`$saved_roles` is **overwritten** each iteration rather than accumulated, so on a
multi-item subscription only the **last** product's roles are stripped. Harmless today — all
171 active subscriptions are single-item (verified in SPEC §9.1) — but it is a landmine for
any future bundle.

### 2.6 Castaway — correcting the record

Prior notes said the Castaway fallback was wiped from **all** products. Re-checked live:

| Product | `…canceling_membership` | `…expire` | `…failed_payment` |
|---|---|---|---|
| 1718 Observer | 0 | 0 | 0 |
| 1799 Activator | 0 | 0 | 0 |
| 1800 Navigator | 0 | 0 | 0 |
| 7864 Navigator Annual | 0 | 0 | 0 |
| 9816 Navigator Lifetime | 0 | 0 | 0 |
| **12234 Navigator Quarterly** | **`1503429957009932459`** (Castaway) | 0 | **`1503429957009932459`** |

So it is **not uniformly dead**: Navigator Quarterly — created October 2026, after the May
wipe — has the Castaway fallback set on cancel and on failed payment. Every other product has
nothing. One of six products behaves differently from the rest, which is almost certainly
unintended in one direction or the other, and someone should decide which.

### 2.7 What Labs replaces it with

The plugin is ~3,455 lines, but the part Labs needs is small. Everything else is admin UI,
settings, logging and OAuth.

| Concern | Labs |
|---|---|
| Role source | `plans` → role id map in config (replacing `ets_subsciptions_roles` product meta). Keep the ids verbatim from §2.2 |
| Grant / strip | `desired_roles(identity)` + `reconcile_roles()` (§18.6), using the **bot token only** — never gated on a member's OAuth token |
| OAuth connect | still needed; Labs must own the connect flow and store the Discord user id on the identity. Labs already stores Discord profiles (`identity_discord_profiles`, migration 091) |
| Guild add / kick | same reconciler. Note **two guilds** — FatTail's, and 0-DTE's via `fotw-0dte-discord-bridge` |
| DMs on cancellation | optional; today gated on `…send_cancelled_dm` |
| Rate limiting | keep the batching + paced timestamps. Discord will 429 |
| Castaway / fallback roles | becomes a plain part of `desired_roles()`: no active membership → Castaway. **This is the right way to resurrect it** — declaratively, not as six separate pieces of product meta that can be wiped without anyone noticing |

The reconcile pattern makes §2.4 and §2.5 both unreachable, and makes Castaway's three-month
silent death detectable on day one via `reconcile(apply=False)`.

---

## Summary of corrections to SPEC §18

| § | Was | Now |
|---|---|---|
| §18.9 | "Labs must create AC contacts" | Correct but understated — the vendor plugin's whole **ecommerce** layer (ecomOrders, ecomCustomers, abandoned cart, browse tracking) also dies at cutover. Part 1.2 |
| §18.11.6 | AC contact creation "unverified" | **Answered**: `user_register` + Woo order sync, both live. Part 1.1 |
| §18.11.6 | Discord plugin "15,100 files, reading not required" | **Wrong count** — 11 PHP files, 3,455 lines. Read. Part 2 |
| §18.6 | reconciler recommended on circumstantial evidence | Now has an **exact root cause**: the grant is gated on an irrelevant OAuth token while authenticating as the bot. Part 2.4 |
| Castaway (prior notes) | fallback wiped on all products | **Set on 12234 Quarterly**, absent on the other five. Part 2.6 |
