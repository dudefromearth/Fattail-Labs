# The three "a paying member silently gets nothing" blockers — analysed

**2026-10-17.** Everything below is read from the code on `origin/main` and on Ernie's
branch `cursor/front-door-mobile-checkout-395f`, not recalled.

Headline: **one of the three was overstated by the spec and is largely a non-issue. The
other two are real, and one of them is worse than described.** A third problem was found
that nobody had listed.

| | Claim | Verdict |
|---|---|---|
| §7.13 | Woo SSO overwrites a Labs membership | **MOSTLY FALSE** — the code is already source-scoped. A different, real risk sits behind it |
| §7.14 | Labs emits no Discord role or AC tag | **TRUE, and worse** — the Discord role code on Ernie's branch calls five methods that do not exist |
| AC contacts | A Labs signup never reaches AC | **TRUE**, but Labs already owns 80% of the machinery |

---

## 1. §7.13 — "Woo SSO will overwrite a Labs membership"

### What the spec says
> Labs is truth for migrated subscriptions: the Woo SSO sync path must **skip** any identity
> that has an active `billing_subscriptions` row, rather than overwriting it with Woo's view.

### What the code actually does

`identity.sync_provider_memberships()` — the one place Woo SSO writes memberships, called
from `routes/auth_routes.py:314` — is **strictly scoped by source**. Every statement:

```sql
UPDATE memberships SET status = 'expired'
 WHERE identity_id = %s AND source = %s AND plan_id NOT IN (...)
--                        ^^^^^^^^^^^^^ the provider, e.g. 'wordpress:fattail'
```

And the table is keyed to allow exactly this:

```sql
UNIQUE KEY uq_mem_identity_plan_source (identity_id, plan_id, source)
```

Sources coexist **by design**. Woo SSO can only expire rows whose source is
`wordpress:fattail`. A Labs-born membership carries `source = 'front-door'` (Ernie's grant)
and is untouchable by that code path.

### Verdict: the overwrite risk does not exist

The spec's §7.13 as written describes a danger the existing code already prevents. It should
be corrected rather than built.

### ⚠️ But there IS a real risk hiding behind it, and it is worse

**Double billing at checkout.** Nothing stops a member who already has a live WooCommerce
subscription from buying again on Labs. They would then be charged by Woo *and* by Labs, for
overlapping access, from two different systems — and the second charge would look entirely
legitimate to both.

That is not an SSO problem and the §7.13 fix would not catch it. The guard belongs in
`checkout.start()`:

> Before creating a subscription, check whether this identity already holds an active or
> grace membership from a WordPress source. If it does, refuse the purchase and route the
> member to support, rather than taking a second payment.

Cheap to build, and it is the single most expensive mistake available in the parallel-run
model — a member paying twice is both a refund and a trust problem.

**Recommendation:** rewrite §7.13 to describe the double-billing guard. Keep a narrower
version of the skip rule for later, when subscriptions actually migrate (§9) and a single
identity could legitimately have both.

---

## 2. §7.14 — Discord roles and ActiveCampaign tags

### 2a. Discord: the capability does not exist, on either branch

`labs_discord/rest.py` on `origin/main`:

```
get_channel_messages()   create_message()   get_guild_member()
```

That is the whole class. It can **read** a guild member. It cannot add or remove a role.

**Ernie's branch has the same file, byte for byte** — I diffed it. Yet
`front_door_access._sync_discord_membership()` on that branch calls:

```python
rest.list_guild_roles(guild)            # does not exist
rest.add_guild_member(guild, snow, tok) # does not exist
rest.create_guild_role(guild, name)     # does not exist
rest.add_guild_member_role(...)         # does not exist
rest.remove_guild_member_role(...)      # does not exist
```

**Five methods, none of which exist anywhere on his branch.** That code would raise
`AttributeError` the first time a member connected Discord.

This is consistent with his own spec, which admits: *"A finished Discord consent, with a real
approval and a role visible on a person, has not been walked."* Now we know why — it cannot
work as written. Worth telling him, because the spec reads as "untested" when it is actually
"not implemented".

The logic he wrote is sound, incidentally — set the wanted role, remove the other membership
role, create the role if missing. It is a small desired-state reconciler. It just has no REST
layer underneath it.

**What is needed:** five methods on `DiscordRest`, all simple bot-token calls:

| Method | Endpoint |
|---|---|
| `list_guild_roles` | `GET /guilds/{g}/roles` |
| `add_guild_member` | `PUT /guilds/{g}/members/{u}` (needs the member's OAuth token) |
| `add_guild_member_role` | `PUT /guilds/{g}/members/{u}/roles/{r}` |
| `remove_guild_member_role` | `DELETE /guilds/{g}/members/{u}/roles/{r}` |
| `create_guild_role` | `POST /guilds/{g}/roles` |

⚠️ **Do not repeat the vendor plugin's bug.** Its role grant authenticates as the bot but
gates the whole call on the *member's* OAuth access token, which is irrelevant to the request
— so a lapsed token skips the grant silently while the job reports success. That single line
is why `fotw-discord-role-reconcile.php` had to be written. See `ANALYSIS-ac-and-discord.md`
§2.4. The Labs version must use the bot token and nothing else.

⚠️ **Two guilds, not one.** FatTail's own guild, and the 0-DTE guild that
`fotw-0dte-discord-bridge` adds Navigators to. A Labs member should land in both, or Ernie
should decide they should not.

**Role ids, verified live:** Observer `1445752902789496912` · Activator `1445754832559538288` ·
Navigator `1445753817332449432` · Castaway `1503429957009932459` · IkI Labs
`1542874715125719080`.

### 2b. ActiveCampaign: the client exists but cannot do the one thing the model needs

`server/activecampaign.py` (203 lines) already has:

| Function | Does |
|---|---|
| `_sync_contact(cfg, email)` | creates or updates a contact — **this is the hard part, already solved** |
| `_get_or_create_tag(cfg, name)` | resolves a tag by name, creating it if absent |
| `_add_contact_tag(cfg, contact_id, tag_id)` | `POST /contactTags` |
| `sync_lead(...)` | the lead-capture entry point. Never raises — AC problems must not fail a waitlist write |

**What is missing is tag REMOVAL.** There is no `DELETE /contactTags/{id}` anywhere in Labs.
And removal is not a nicety here — it is the entire membership model:

> Four **status** tags toggle (`FOTW - Observer` / `Activator` / `Navigator` / `CANCELLED`)
> and are the exact list the WordPress plugin **strips** on a tier change. Five **history**
> tags are permanent and deliberately outside that list, which is the only reason they
> survive. (`ANALYSIS-ac-and-discord.md` §18.2)

Without removal, an upgrading member accumulates `Observer` **and** `Navigator` and matches
two mutually exclusive segments. Every tier email journey then misfires.

**Also note the config split:** Labs reads `LABS_AC_API_URL` / `LABS_AC_API_TOKEN`, which are
**absent from `.env`** (present only in `.env.example`). The WordPress plugin uses its own
hardcoded key — the one currently readable over the public internet. Labs should get a
**separate** AC token, not that one.

### 2c. The tag model Labs must reproduce

| Kind | Tags | Rule |
|---|---|---|
| **Status — toggle** | `FOTW - Observer`, `Activator`, `Navigator`, `CANCELLED` | exactly one tier tag at a time; `CANCELLED` on at lapse, off at next purchase |
| **History — permanent** | `Observer Completed`, `Observer Dropout`, `Annual`, `Quarterly`, `Lifetime` | **never** in the strip list. That omission IS the mechanism |

Plus the operational detail that is easy to drop: the contact is **subscribed to lists 1
(master) and 4 (active members) BEFORE tagging**, so automations can send immediately.

**And the safety boundary:** the reconciler must only ever remove tags **it owns** — an
explicit allow-list of those four. A naive "remove everything not desired" would delete AC's
own campaign tags.

---

## 3. AC contact creation on signup

### The finding
Contacts are created today by the vendor `activecampaign-for-woocommerce` plugin, by two
routes: `user_register` on the WordPress site, and the Woo order sync. Both are **WordPress**
events. A member who signs up on Labs triggers neither, so **no AC contact exists** and no
journey can reach them. Not the welcome sequence, not Observer week 5, not the day-42 gate.

### Why it is smaller than it sounds
Labs already has `_sync_contact()`. The work is calling it on signup and tagging by tier —
perhaps 40 lines — plus the tag-removal function from §2b.

### Why it is bigger than it sounds
That plugin does far more than create contacts, and **all of it is driven by Woo orders and
carts**. It is live and busy: **4,867 completed order syncs and 28,720 cart events** in
Action Scheduler. When Labs checkout takes over, every one of these stops for Labs-born
members:

| Capability | After |
|---|---|
| `ecomOrder` push — revenue in AC | gone |
| `ecomCustomer` records | gone |
| **Abandoned-cart tracking** | gone entirely |
| Browse / product-view tracking | breaks — its URL patterns point at `fattail.ai/product/*` |
| Subscription status in AC | gone |
| Refund sync | gone |

Any AC automation keyed on ecommerce fields breaks, silently. Options are in
`ANALYSIS-ac-and-discord.md` §1.3; the recommendation is for the Labs worker to re-push
`ecomOrder`/`ecomCustomer` from `billing_charges` on each successful charge, but it needs an
audit of which automations actually use those fields first.

---

## 4. What to build, in order

| # | Work | Size | Why first |
|---|---|---|---|
| 1 | **Double-billing guard in `checkout.start()`** | small | The actual §7.13 risk. Cheapest fix for the most expensive mistake |
| 2 | **`DiscordRest` role methods** (5) + use the bot token only | small | Unblocks Ernie's existing logic, which is otherwise dead code |
| 3 | **AC tag removal** (`DELETE /contactTags/{id}`) | small | Without it the tier model cannot work at all |
| 4 | **`desired_tags()` / `desired_roles()`** — pure functions of membership state | medium | §18.6. Both reconcilers hang off these |
| 5 | **Call them on every membership transition**, and write `membership_events` | medium | The table exists and nothing writes to it |
| 6 | **AC contact create on Labs signup** | small | ~40 lines on top of `_sync_contact` |
| 7 | **`reconcile(apply=False)` drift report** | medium | Run against the live book before anything writes |
| 8 | Decide the AC ecommerce question | — | Ernie's call, needs an automation audit |

Items 1–3 are each under an hour and together remove most of the risk.

---

## 5. Corrections this analysis makes to the spec

| Where | Correction |
|---|---|
| §7.13 | The overwrite risk **does not exist** — `sync_provider_memberships` is already source-scoped and `uq_mem_identity_plan_source` makes sources coexist by design. Replace it with the **double-billing guard**, which is the real exposure |
| §7.14 | Understated. Labs has **no Discord role capability at all**, and the code on Ernie's branch calls five methods that do not exist on it |
| §18.9 | Labs' AC client exists and can create contacts and add tags. It **cannot remove a tag**, which is the operation the whole tier model depends on |
| new | Labs' AC config (`LABS_AC_*`) is **absent from `.env`** and is separate from the WordPress plugin's key — which is the one currently exposed publicly. Labs should have its own token |
