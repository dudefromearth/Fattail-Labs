# FatTail Labs — IKI Store & Entitlement Spec v0.1

| | |
|---|---|
| Status | **DRAFT** — Coach review flips status |
| Date | 2026-08-26 |
| Type | Program spec — the store surface, the Woo interface, and entitlement gating |
| Short name | **IKI Store** / **ST** |
| Decision log | DL-TBD (assign at Coach GO) |
| Canonical filename | `Specs/FatTail-Labs-IKI-Store-and-Entitlement-Spec-v0.1.md` |

**Subordinate to:** `Specs/FatTail-Labs-IKI-Factory-Spec-v1_1.md` (**BUILD AUTHORITY**).
Where this document and the Factory spec disagree, the Factory spec wins.

**This is the program IKI Factory v1.1 §8.7 defers:**

> "The Woo step is a stub — no WooCommerce API interface exists. The store as its own
> native surface on `labs.fattail.ai` runs through Mike and Foxtrot as a separate
> program. Woo is the cash register, not the storefront."

**Owner:** **Mike** — "identity, sessions, entitlements, and every boundary where money
or membership meets the app" (`agents/bench/mike.md`). **Foxtrot** for the surface's
hosting per `infra/deploy.md`.

**Content hash:** recompute at Coach GO / amend:
`shasum -a 1 Specs/FatTail-Labs-IKI-Store-and-Entitlement-Spec-v0.1.md` → record in DL.

**Related:** `Specs/FatTail-Labs-Access-Control-Spec-v0.4.md` ·
`Specs/FatTail-Labs-Identity-Access-Spec-v1.0.md` ·
`docs/WooCommerce-SSO-Integration-Guide.md` ·
`Specs/FatTail-Labs-Template-Runner-Spec-v0_1_1.md`

**Vocabulary.** Per Factory v1.1 §0.1b, "template" is retired. The Factory produces a
**Knowledge app**. **Intelligence apps** are the tier above and evolve from similar
zygotes — not a different species. This document uses those terms throughout.

---

## 0. Mission

A published Knowledge app becomes **obtainable** by a member, and stops being obtainable
when they stop paying.

**What this program owns:**

1. Connecting the one named seam — `iki_factory_woo.woo_step()`.
2. The entitlement record that a purchase produces.
3. The gate that a Knowledge app's surface consults.
4. Revocation when payment stops.

**What this program does not own:** the Factory board, its lanes, its pull model, its
Staged artifacts, or the Live boundary. Those are Factory v1.1 and are not restated
here. It does not set `product_type`, `product_tier` or `free_vs_paid` — Coach enters
those at the Live gate (v1.1 §8.2), and that act **is** the human promotion.

---

## 1. Laws

| ID | Law |
|----|-----|
| **ST1 — One seam** | `iki_factory_woo.woo_step()` is the only product-create path. Per its own docstring: "Do not hunt the tree for a second product-create path." No parallel Woo writer may be introduced. |
| **ST2 — Woo is the cash register, not the storefront** | v1.1 §8.7. The member-facing store is a Labs surface. Woo processes money and owns the subscription record. Labs never takes cards. |
| **ST3 — Live write first, then Woo** | v1.1 §8.5. A Woo failure leaves a `Published` card, never an undefined one. Publication never depends on the store succeeding. |
| **ST4 — No role elevation** | An IKI plan row **must** have `grants_role = 'observer'` (ladder floor). Buying a Knowledge app never promotes a member. |
| **ST5 — Products never join plan buckets** | IKI plan slugs must not enter `OBSERVER_/ACTIVATOR_/NAVIGATOR_/COACHING_PLAN_SLUGS` in `access_control/constants.py`. Those drive cumulative expansion and would leak every app to every tier. |
| **ST6 — Exact plans for paid apps** | A paid app's policy uses `exact_plans_only = true`. Cumulative expansion is for tiers, never for apps. |
| **ST7 — Fail closed** | A Knowledge app surface with no policy row denies. An unsold app is never open by omission. |
| **ST8 — Revocation is live** | Entitlement is read per request. No session snapshot, no manual re-login required to lose access. |
| **ST9 — Paid does not invent a price** | v1.1 §8.6. The store never fabricates a price. See §7 — price has no home yet. |
| **ST10 — Paid Intelligence is server-computed** | Proprietary compute behind a paid app runs server-side. Client-side pure-compute apps stay free. See §8. |

---

## 2. The seam, as built

`server/iki_factory.py` at the Staged → Live promotion, verified on `origin/main`:

```python
free = str(card.get("free_vs_paid") or "").strip().lower() == "free"
# ... Live write ...
#   published      = 1
#   obtainable     = 1 if free else 0
#   store_visible  = 0
#   woo_product_id = NULL
import iki_factory_woo as woo
step = woo.woo_step(published)
woo_reason = str(step.get("reason") or woo.WOO_STUB_REASON)
```

**As-built consequence:**

| `free_vs_paid` | After Live today |
|---|---|
| `free` | `published=1`, **`obtainable=1`** — usable immediately |
| `paid` | `published=1`, **`obtainable=0`** — published but unobtainable, awaiting this program |

`store_visible` is `0` for everything, and `woo_product_id` is always `NULL`.

**The stub contract** (`server/iki_factory_woo.py`):

```python
def woo_step(card: dict) -> dict:
    return {"ok": False, "stubbed": True,
            "reason": WOO_STUB_REASON, "product_id": None}
```

### 2.1 What this program changes

`woo_step()` gains a real implementation returning `ok`, `product_id`, `reason`. The
caller in `iki_factory.py` then persists `woo_product_id` and sets `store_visible`.

**Constraint:** the caller currently hard-writes `store_visible = 0` and
`woo_product_id = NULL` after the Woo step. Connecting the seam requires editing that
write — a Factory-file change, therefore **Coach's authority, not this program's
unilaterally**. Named here so it is not discovered at build time.

---

## 3. Entitlement model

### 3.1 One Woo subscription product per paid Knowledge app

No WooCommerce Membership plan per app. The **subscription status is the entitlement
signal**. Woo Memberships plans are not reliably creatable via REST, and a Woo-side gate
would only need mirroring into Labs — a layer with no consumer.

### 3.2 One Labs plan row per paid Knowledge app

```sql
INSERT INTO plans (slug, name, grants_role)
VALUES ('iki-<card-slug>', '<Knowledge app name>', 'observer');   -- ST4
```

Mapped to the Woo product through the existing provider mechanism:

```sql
INSERT INTO provider_plan_map (provider, external_key, plan_id)
SELECT 'wordpress:fattail', '<woo_product_id>', id
FROM plans WHERE slug = 'iki-<card-slug>';
```

`woo_product_id` on the card is the join. No new mapping table.

### 3.3 Free apps

`obtainable = 1` already at Live. No Woo product, no Woo order, no plan row. Access is
governed by the app's policy alone (§4.1).

Rationale for no Woo order on free acquisition: guest checkout is disabled and account
creation precedes payment on fattail.ai, so routing a free acquisition through WP
checkout taxes the funnel for nothing. The `free-show` membership plan on the live site
is precedent for free-in-Woo, and is deliberately **not** followed here.

---

## 4. Gating

### 4.1 Free Knowledge app

```
target_key:        <app target>
mode:              hard
require_signed_in: true
min_role:          null
selected_plans:    null
```

**Ruled 2026-08-26 — free means free to anyone with a login.** A free Knowledge app is
a lead magnet; the price of entry is a name, an email and a login. Nothing else is
required, so the policy constrains nothing else: no role floor, no plan.

> ### ⚠ A free member is NOT an Observer
>
> The role ladder's bottom rung is *named* `observer`, and `derive_role()` returns it
> as the **fallback for an identity with no plan at all**
> (`server/identity.py:444`). That is a name collision with the **paid Observer
> tier**, which is a real subscription carrying a plan slug (`observer-trial`, or the
> `observer` base-tier plan — migration 076).
>
> | Who | `access_role` | `plan_slugs` |
> |---|---|---|
> | Free signup | `observer` | **empty** |
> | Paying Observer | elevated per plan | `observer-trial` / `observer` |
>
> **Therefore `min_role: observer` does not mean "an Observer subscriber" — it means
> "anybody signed in".** Writing it would read as a tier requirement and enforce
> nothing. Free apps use `min_role: null` and lean on `require_signed_in` alone, which
> says exactly what is meant. To actually require a paying tier, constrain on
> **plans**, never on the role name.

**Browsing is public; using is not.** About and Catalog stay publicly readable
(statically generated, SEO-bearing) so a visitor can see what exists. Opening a
Knowledge app requires a session — `require_signed_in: true` is the conversion
boundary, and it is the only thing a free app charges.

### 4.2 Paid Knowledge app

```
target_key:        <app target>
mode:              soft            # deny_ui → the app's store page
require_signed_in: true
min_role:          null
selected_plans:    ["iki-<card-slug>"]
exact_plans_only:  true            # ST6
```

Both shapes are written through the existing admin policy API
(`server/routes/access_admin.py`, incl. bulk write and an audit trail). Moving an app
from free to paid is a policy field change, not a migration or a deploy.

### 4.3 Target key — blocker

`server/access_control/keys.py` uses a **closed** `TargetKind` enum: surface, app,
course, module, lesson, resource, campaign. There is **no `product:` kind**.

Two options:

| Option | Note |
|---|---|
| Reuse `app:{slug}` | Zero grammar change. But `app:` carries as-built defaults (`APP_AS_BUILT`, data-bearing floor) intended for Family-B member-authored apps — wrong semantics for a sold artifact |
| Add `product:{slug}` | Clean, fail-closed default (ST7), matches the `campaign:` precedent |

**Recommended: add `product:`.** Decision needed before any policy is written.

---

## 5. Revocation

### 5.1 Entitlement is read live

Verified: `server/access_control/viewer.py::load_plan_slugs` loads plan slugs **per
request** from the database, filtered `status IN (active, grace)` **and**
`current_period_end IS NULL OR current_period_end > NOW()`. Only `session_role` is
snapshotted into the cookie.

Therefore revocation takes effect on the **next request** — no re-login (ST8) — and
`current_period_end` acts as a dead-man's switch: if the webhook chain fails silently,
access lapses at period end rather than persisting forever.

### 5.2 The webhook

Labs already exposes a signed lifecycle endpoint with HMAC over the raw body plus
anti-replay: `POST /api/integrations/wordpress:fattail/membership`
(`server/routes/auth_routes.py:453`). Body: `external_id`, `email`, `plan_key`,
`status`, `timestamp`, optional `external_ref`.

**Gap.** The live `membership-auto-upgrade` v1.4.0 hooks are:
`woocommerce_order_status_completed`, `woocommerce_order_status_processing`,
`woocommerce_subscriptions_switched_item`, `woocommerce_subscription_status_cancelled`,
`woocommerce_subscription_status_expired`.

It does **not** hook `on-hold` — where Subscriptions puts a failed renewal, and the most
common churn path — nor `pending-cancel`, nor reactivation.

**Requirement:** the WP-side emitter must cover the full status set. Recommended as a
**separate mu-plugin** rather than an edit to `membership-auto-upgrade`, so a fault
cannot take down live ActiveCampaign tagging or upgrade logic.

### 5.3 Refunds

**Ruled 2026-08-26: a refund revokes immediately.** Not currently emitted by any hook;
the emitter must add it.

---

## 6. Store surface

Member-facing store pages render in **Labs** (ST2). The Woo product page is a checkout
entry point only and is excluded from the fattail.ai storefront catalog.

`iki_factory.list_live()` already returns the Live catalog — id, title, `live_at`,
`product_type`, `product_tier`, `free_vs_paid`, `publication_hash`, `published`,
`obtainable`. The store surface consumes it; it does not query the board.

`store_placement` is already one of the four Staged artifacts (v1.1 §7.3, migration
145 `iki_factory_staged_artifacts.kind`). This program consumes that artifact; it does
not produce it — production is Gemba's.

**Checkout return path.** After payment, return the member through
`fattail.ai/fotw-sso?redirect=<labs callback>` rather than a plain link, so the session
is reissued with current entitlements. Carry the Labs session email into checkout —
identity joins on email, and a mismatch silently creates a second identity.

---

## 7. Price

v1.1 §8.6 states "paid does not invent a price." Verified against every
`iki_factory_cards` migration (137, 138, 140–145): **there is no price column**, and
`_product_complete()` / `_publication_hash()` consider only `product_type`,
`product_tier` and `free_vs_paid`.

So a paid Knowledge app can currently reach Live with no price anywhere in the system.

**Ruled 2026-08-26 — price lives on the Factory card, entered at the Live gate.**

It sits beside `product_type`, `product_tier` and `free_vs_paid`, which Coach already
enters at that same moment (v1.1 §8.2). One act, one place, no second surface to visit.

| Field | Note |
|---|---|
| `price_cents` INT NULL | Integer minor units. NULL for free apps |
| `price_currency` VARCHAR(3) NULL | ISO 4217. NULL for free apps |
| `price_period` VARCHAR(16) NULL | `month` \| `year` \| `once` |

**Consequences, stated so they are not discovered at build time:**

1. A **Factory migration** adds the columns — a Factory-program change, therefore
   Coach's authority, not this program's (same class as §2.1).
2. `_product_complete()` must require a price when `free_vs_paid = 'paid'`, so a paid
   app cannot reach Live priceless. That is the enforcement of ST9.
3. `_publication_hash()` should include the price, so a price change is a publication
   change.
4. `woo_step()` reads the price from the card. It still never invents one (ST9) — if
   the price is absent it fails and reports, exactly as the stub does today.

---

## 8. Intelligence app IP doctrine (ST10)

### 8.1 The problem

Heatmap templates are **statically imported** into one registry
(`web/lib/options-lab/templates/registry.ts`) and compute **purely client-side** over a
chain model the browser already holds (HM1, HM6). `widthFit.ts` alone is 682 lines
carrying a multi-component efficiency model. Every template's `computeCell` ships to
every visitor, entitled or not.

**A menu-level gate hides the name, not the code.**

### 8.2 Threat model

| Threat | Stopped by a UI gate? |
|---|---|
| Casual member curiosity | Yes |
| Competitor buys one month and copies the model | No |
| Member shares their login | No — an account-sharing problem, out of scope |

### 8.3 Resolution

**Client-side pure-compute apps are free. Paid Intelligence apps are server-computed
from day one.**

Zero retrofit: existing templates stay client-side and stay free, which matches Coach's
own model — some apps stay free, others must be paid. New paid apps are designed
server-side from the start, on the precedent already in the tree —
`server/routes/pricing.py` is a headless server-side OPF compute API gated on member
session plus tool gate.

Rejected: dynamic `import()` behind auth (the chunk still reaches the browser, and it
fights Next.js asset serving — friction, not protection); porting existing templates to
server compute (breaks HM2 "diff once, paint many" and HM5, adds latency to a live
surface, and duplicates 682 tested lines into a second implementation).

**Consequence:** a paid Intelligence app must declare a server compute entrypoint. This
is a **Staged** production concern — flagged to the Factory program, not enforced here.

---

## 9. Verified ground truth (2026-08-26)

### 9.1 Labs

`server/access_control/` and `server/identity.py` are **unchanged** across the 33
commits from `bab997be..ce858c93`, so these hold as stated:

| Fact | Evidence |
|---|---|
| Plan slugs load live per request | `access_control/viewer.py::load_plan_slugs` |
| `exact_plans_only` bypasses cumulative expansion | `access_control/policy.py::effective_plans` |
| `min_role` + `selected_plans` combine via `plan_role_combine` | `access_control/evaluate.py` |
| Admin policy API with bulk write + audit | `routes/access_admin.py` |
| Plan slugs validated against a **compile-time** frozenset | `access_control/write_validate.py:55` — **blocker §10.3** |
| No `product:` target kind | `access_control/keys.py` — **blocker §4.3** |
| `grandfather_enrollments` is course-family only | `access_control/evaluate.py` |
| Default role with no plan is `observer` | `identity.py:426` |
| Read-only Woo REST client exists | `progress/sources_woo.py` |
| Per-identity path telemetry ingested | `routes/pageview.py` |

### 9.2 WordPress (fattail.ai, live)

| Component | State |
|---|---|
| WooCommerce / Subscriptions / Memberships | 11.0.0 / 9.1.0 / 1.29.1 |
| All Products for Subscriptions | 6.1.0 |
| Gateways | PayPal Payments 4.1.2 · Stripe 10.8.5 · WooPayments 11.0.0 |
| Products | 8 total (5 `subscription`, 1 variable-sub, 1 simple, 1 grouped) |
| Woo REST API keys | 4, **all `read`** — no write key exists (**§10.4**) |

**Unverified:** whether Memberships 1.29.1's REST controllers permit *creating* plans.
It ships `src/API/` with v2/v3/v4 controllers and `Webhooks.php`. §3.1 does not depend
on the answer.

---

## 10. Blockers

| # | Blocker | Blocks |
|---|---|---|
| ~~10.1~~ | ~~§4.1 — who may open a free app?~~ **RESOLVED 2026-08-26** — anyone with a login | — |
| **10.2** | §7 — price columns + `_product_complete()` enforcement are a **Factory** change | All paid apps |
| **10.3** | `KNOWN_PLAN_SLUGS` is compile-time (`write_validate.py:55`) — a policy naming a new plan slug needs **a code deploy per app**. Fix: validate against the `plans` table, or exempt the `iki-` namespace | All paid apps |
| **10.4** | No write-capable Woo API key | `woo_step()` |
| **10.5** | §2.1 — connecting the seam requires editing the Factory's post-Woo write | Coach authority |
| **10.6** | §5.2 — WP emitter misses `on-hold`, `pending-cancel`, reactivation, refund | Revocation correctness |

---

## 11. Telemetry

`server/routes/pageview.py` records `(identity_id, path)` for every authenticated
navigation. If each Knowledge app owns a **distinct route**, this yields per-app,
per-member usage with no new instrumentation — the data that tells you which apps to
charge for, what to price them at, and who to grandfather.

**It cannot be backfilled.** Distinct routes are therefore a requirement on app
production, flagged to the Factory program.

---

## 12. Phases

| Phase | Work | Blocked by |
|---|---|---|
| **ST-0** | `product:` target kind + fail-closed default; policies for free apps | — **unblocked** |
| **ST-1** | Store surface over `list_live()`; free apps obtainable end-to-end | ST-0 |
| **ST-2** | `KNOWN_PLAN_SLUGS` fix; Woo write key; price decision; plan rows | §10.2, §10.3, §10.4 |
| **ST-3** | Real `woo_step()`; seam write edit; checkout + SSO return | ST-2, §10.5 |
| **ST-4** | Full-status WP emitter; revocation proven | ST-3 |

ST-0 and ST-1 deliver the free half with **no WooCommerce work at all**.

---

## 13. Verification

"It should work" is banned. Each phase proves itself:

| Phase | Proof |
|---|---|
| ST-0 | `parse_target_key` round-trips the new kind; a no-policy target denies |
| ST-1 | A free app reaches `obtainable=1` and opens for a member; `pageview` rows land on the distinct path |
| ST-2 | A policy naming `iki-*` writes without a deploy |
| ST-3 | Staging purchase → `woo_product_id` persisted, membership row active, app opens |
| ST-4 | Webhook `on-hold` → app denies on the **next request**, no re-login (ST8). Replayed webhook → 409. Refund → immediate deny |

---

## 14. Open questions

| # | Question | Owner |
|---|---|---|
| 1 | §4.3 — new `product:` kind, or reuse `app:`? **Recommendation: `product:`** | Mike / India |
| 2 | §2.1 + §7 — the two Factory-file changes this program needs (post-Woo write, price columns) | Coach |
| 3 | Is the native store surface this program's build, or Foxtrot's separate one? | Coach |

**Closed:** free-app access (§4.1, 2026-08-26 — anyone with a login) · price location
(§7, 2026-08-26 — the Factory card) · refunds (§5.3, 2026-08-26 — immediate revocation).

---

## 15. Appendix — observer-gate audit (2026-08-26)

Prompted by §4.1: if `min_role: observer` reads as a tier gate but enforces nothing,
anywhere else expressing "paying members" that way is silently open to every free
signup. Audited at `origin/main` `ce858c93`.

### 15.1 Method

| Checked | Result |
|---|---|
| `access_policies` rows (local dev DB) | **0 rows** — all gating currently runs on type defaults |
| Policies seeded by migration | **None.** `075_access_policies.sql` creates the table only |
| `min_role` in application code | Only `routes/access_admin.py` CRUD plumbing and `routes/live.py` |
| `role_at_least(...)` callers | activator · navigator · administrator — **never observer** |
| `require_role(...)` callers | one, `require_admin` → administrator |
| `"observer"` string literals | All `claims.get("role") or "observer"` — least-privilege fallbacks, not gates |

### 15.2 Result — no misuse found

The collision is already handled correctly wherever it matters:

```python
def can_access_member_content(cur, identity_id, session_role) -> bool:
    """Courses / resources / gated lessons: alumni+ feature role OR any live membership.
    Covers paid Observer with a stale JWT still saying role=observer."""
    if role_meets(cur, identity_id, session_role, "alumni"):
        return True
    return has_active_membership(cur, identity_id)
```

**The floor is `alumni` — deliberately one rung above the free-signup fallback** — with
`has_active_membership()` as the second arm, whose own docstring reads *"Any unexpired
active/grace membership (paid or alumni) — **not free signup**."* A free account clears
neither.

Other correct expressions of "paying":

| Site | Shape |
|---|---|
| `routes/live.py` | `CATEGORY_MIN_ROLE = {"public": None, "members": "activator", "coaching": "navigator"}` — observer never appears |
| `routes/flow_admin.py` | `PAID_PLAN_SLUGS = ("observer", "observer-trial", "activator", "navigator")` joined against `memberships` on status + expiry — **a plan constraint, the pattern §4.1 prescribes** |

Note the `flow_admin` list contains the string `observer` — but as a **plan slug**, not
a role. That is the distinction this appendix exists to keep visible: an `observer`
*plan* is a real paid subscription; the `observer` *role* is what you get for having
nothing.

### 15.3 Production — audited, clean

**Closed 2026-08-26.** Queried directly on **MiniTwo** (`100.127.76.52`, the sole
production Labs host), read-only:

```text
TOTAL_POLICY_ROWS: 0
---- OBSERVER GATES ----
COUNT: 0
```

**Production holds zero `access_policies` rows**, therefore zero observer gates. Dev and
production agree. The audit has no remaining gap.

### 15.4 Consequence — the policy engine is deployed but unused

Zero rows in both environments means **every gate in Labs today is a type default or a
route-level check** (`can_access_member_content`, `CATEGORY_MIN_ROLE`, `require_admin`).
Access Control v0.4 — the engine, the admin API, the audit table — is live and correct
but carries no data.

Two consequences for this program:

1. **ST-0's fail-closed default is load-bearing, not decorative.** A `product:` target
   with no policy row is the *normal* state, not an edge case. Had `product:` inherited
   an open default, every published Knowledge app would have been world-readable the
   moment it went Live.
2. **The first IKI policy rows will be the first policy rows in Labs, ever.** ST-1
   should therefore verify the write path against production reality rather than
   assuming the engine has been exercised there. It has not.
