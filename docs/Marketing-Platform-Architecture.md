# FatTail Labs — Marketing Platform Architecture

**Status:** Design draft for Coach review (2026-07-23, rev 3)  
**Product:** Attract traders to Labs membership / education (`labs.fattail.ai`)  
**Doctrine:** Stop the bleeding · process outcomes only · capacity over dependency  
**Parents:** SEO Specs v1.0–v1.3 · Identity-Access · Native Billing · P2 factory ·
**Campaign Workflow Spec v1.0** · Tango/Sierra invariants  

**Rev 2:** Commerce pluggable (Woo optional); ActiveCampaign first-class.  
**Rev 3 (Coach):** **Campaigns are a first-class factory workflow** — same board discipline
as courses (package → human gate → place). Channels: YouTube, X, Instagram + landers.

---

## 0. One-line thesis

**The lightest powerful marketing platform is Labs as the acquisition + education core**,
fed by a **content factory**, **measured with a thin attribution spine**, and **connected
outward** through **pluggable commerce** and **ActiveCampaign** — not a second brand site,
not a required Woo stack, not profit-claim ads.

```text
Attention  →  Trust  →  Identity  →  Entitlement  →  Pathway  →  Retention
   │            │          │             │              │
 YT / SEO     free      Labs login    any commerce    flagship
 shorts AEO   preview   (native/SSO)  provider        process
```

**Backend-agnostic rule:** Marketing never hard-codes “go to Woo.” It hard-codes:

1. **Labs public URLs** (trust),  
2. **Labs identity** (account),  
3. **Labs memberships** (entitlement truth),  
4. **ActiveCampaign** (relationship / nurture),  
5. **Optional checkout adapter** (Woo *or* Stripe *or* manual grant *or* none for free tier).

---

## 1. Constraints (non-negotiable)

| Constraint | Implication for marketing |
|---|---|
| **No profit claims** | Ads, landers, emails, shorts: process outcomes only |
| **Capacity over dependency** | No dark funnels, no humiliation paywalls |
| **Commerce is pluggable** | Woo **optional**; Stripe native already exists; free signup + plan grant valid |
| **Labs owns identity + memberships** | External systems map *into* `memberships` / `provider_plan_map` |
| **AC is relationship system of record for nurture** | Labs does not become an ESP |
| **No MSC code import** | Patterns/contracts only |
| **Standalone public surface** | Catalog/SEO works with **zero** commerce backend configured |
| **SEO/AEO already built** | Do not rebuild hubs, Course JSON-LD, free previews, llms.txt |
| **Light ops** | Prefer adapters + env flags over new hosts |

**Design persona (Tango):** bleeding trader, low trust, little time, allergic to hype.

---

## 2. Backend-agnostic conversion model

### 2.1 Separation of concerns

```text
┌──────────────────────────────────────────────────────────────┐
│  LABS CORE (always on)                                       │
│  Public pages · free preview · register/login · pathway      │
│  plans · memberships · progress · SEO/AEO                    │
└───────────────┬──────────────────────┬───────────────────────┘
                │                      │
     ┌──────────▼──────────┐  ┌────────▼─────────┐
     │ COMMERCE ADAPTERS   │  │ GROWTH ADAPTERS  │
     │ (0..N enabled)      │  │ (0..N enabled)   │
     │ · stripe (native)   │  │ · activecampaign │
     │ · wordpress:fattail │  │ · (future ESP)   │
     │ · wordpress:0-dte   │  │                  │
     │ · manual / CLI      │  │                  │
     │ · none (free only)  │  │                  │
     └─────────────────────┘  └──────────────────┘
```

Labs already implements this for **identity** (`provider_plan_map`, webhooks, Stripe
spec). Marketing **must ride the same seams**, not invent a Woo-shaped funnel.

### 2.2 Conversion targets (abstract)

Marketing CTAs resolve through a **single Labs resolver**, not hard-coded shop URLs:

| Intent | Labs concept | Possible backends |
|---|---|---|
| Create account | `POST /api/auth/register` | Always Labs |
| Start free / observer | membership `observer` or free plan grant | Native · manual |
| Start paid trial | plan slug e.g. `observer-trial` | Stripe Checkout · Woo product · coupon |
| Full membership | plan slug e.g. `navigator` | Stripe · Woo · admin grant |
| Login returning member | native password · WP SSO · (future OAuth) | Pluggable |

**CTA config example (env or admin data — not code forks):**

```json
{
  "default_convert": {
    "mode": "stripe",
    "plan_slug": "observer-trial",
    "label": "Start Observer trial"
  },
  "alternates": {
    "woo_navigator": {
      "mode": "external_url",
      "url": "https://fattail.ai/checkout/?add-to-cart=…",
      "label": "Join via FatTail shop"
    },
    "free_signup": {
      "mode": "labs_register",
      "href": "/signup",
      "label": "Create free account"
    }
  }
}
```

| `mode` | Behavior |
|---|---|
| `labs_register` | `/signup` → free account (observer) |
| `stripe` | Labs `/api/billing/checkout` for mapped price |
| `external_url` | Woo (or any) checkout URL + UTM passthrough |
| `membership` | Deep link `/membership` (page lists enabled options) |

**If no commerce adapter is enabled:** marketing still works — free account + free
previews + pathway content that is free_preview / observer-visible. Paid CTAs hide or
route to waitlist (AC form).

### 2.3 What “works regardless of backend” means in practice

| Scenario | Marketing still works? | Convert path |
|---|---|---|
| **Stripe only** | Yes | Landers → signup/checkout via Labs billing |
| **Woo only** | Yes | Landers → external_url + SSO return |
| **Both** | Yes | Membership page shows both; attribution still Labs |
| **Neither (launch soft)** | Yes | Free account + waitlist (AC) + free previews |
| **Manual B2B grants** | Yes | `create_user.py --plan` + AC tag |

---

## 3. What already exists (build *on*)

| Asset | Role |
|---|---|
| Public SSG catalog, courses, category hubs | SEO/AEO |
| Free-preview lessons + notes | Content marketing |
| Hub, `/about`, `/membership` | Entity + conversion UI |
| `/llms.txt`, sitemap | Answer engines |
| YouTube / Live Show | Attention |
| **Native identity + plans + memberships** | Entitlement truth |
| **Stripe billing** (optional provider) | Native paid |
| **WP SSO + Woo webhooks** (optional provider) | External paid / login |
| Board + cast + HeyGen | Asset factory |
| Hostinger SMTP | Transactional (password, admin) |
| Sierra / Tango / Papa / Bravo | Voice, honesty, video, research |

**Architecture rule:** New marketing surfaces improve Labs public URLs or feed traffic
into them with UTM + a **resolver-based** CTA.

---

## 4. Target architecture

### 4.1 Layers

```text
┌─────────────────────────────────────────────────────────────────────────┐
│  LAYER A — ATTENTION                                                    │
│  YouTube · Live Show · shorts · SEO snippets · (optional paid)          │
│  Factory board product_lines + Sierra packaging                         │
└───────────────────────────────┬─────────────────────────────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  LAYER B — TRUST (Labs public — always)                                 │
│  Free previews · hubs · about · FAQ · llms.txt · process testimonials   │
└───────────────────────────────┬─────────────────────────────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  LAYER C — IDENTITY (Labs — always)                                     │
│  Register / login / SSO adapters · first-touch attach                   │
└───────────────────────────────┬─────────────────────────────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  LAYER D — ENTITLEMENT (Labs memberships — always)                      │
│  Fed by: Stripe webhooks | Woo webhooks | CLI | free defaults           │
└───────────────────────────────┬─────────────────────────────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  LAYER E — ACTIVATION (Labs product — always)                           │
│  Pathway · live · resources · certification                             │
└─────────────────────────────────────────────────────────────────────────┘

CROSS-CUTTING
  · ActiveCampaign (nurture / tags / sequences) — independent of commerce vendor
  · Attribution spine (UTM → identity → plan)
  · Doctrine gates (Sierra + Tango)
  · Thin measurement (cockpit later)
```

### 4.2 Refuse (keeps it light)

| Temptation | Why refuse |
|---|---|
| Second marketing site | Dual CMS, drift |
| HubSpot/Marketo | Heavy; AC is enough if integrated well |
| Hard-coded Woo-only funnel | Breaks standalone + Stripe-only modes |
| Full ESP inside Labs | SMTP transactional only; AC for marketing |
| Profit-claim landers | Doctrine |
| Complex multi-touch CDP | First-touch + last convert enough |
| Sales chatbot closer | Capacity-over-dependency |

### 4.3 Minimal new components

| ID | Purpose | Weight |
|---|---|---|
| **M0 CTA resolver** | Config for convert modes (stripe / external / free) | Tiny |
| **M1 Attribution** | First-touch UTM cookie → identity | Tiny |
| **M2 ActiveCampaign bridge** | Contacts, tags, events out; optional form in | Thin adapter |
| **M3 Campaign workflow** | **First-class** board `product_line=campaign` + package + place | Core (peer to courses) |
| **M4 Landers** | `/go/[slug]` SSG placed by campaign approve | Thin (output of M3) |
| **M5 Growth cockpit** | Funnel KPIs by campaign | Thin admin |

### 4.4 Campaign = first-class workflow (peer to courses)

**Normative spec:** `Specs/FatTail-Labs-Campaign-Workflow-Spec-v1.0.md`

Campaigns are **not** informal social posts. They use the **same Production Board** as
courses:

```text
New card (product_line=campaign)
  → Queued → In production (brief → lander → scripts → video → distribution → growth hooks)
  → Awaiting approval (Sierra/Tango block flags clear)
  → Approve → place: marketing_campaigns row + /go/{slug} live
  → Operators publish YT / X / IG from distribution kit (auto-post later)
```

| Course package places… | Campaign package places… |
|---|---|
| Draft course modules/lessons | Live lander + campaign record + UTM/AC hooks |
| Member education | Acquisition (YouTube · X · Instagram → lander → identity) |

Required campaign stages (summary): `campaign_brief`, `landing_spec`, `script`,
`video_package`, `distribution_plan`, `vision_alignment`, `growth_hooks`.

**Channels in scope:** YouTube (long + shorts), X.com, Instagram — all as
`distribution_plan` posts sharing one `utm_campaign` slug.

---

## 5. ActiveCampaign integration (first-class)

### 5.1 Role

| System | Owns |
|---|---|
| **Labs** | Identity, memberships, learning events, public content |
| **ActiveCampaign** | Lists, tags, automations, broadcast/nurture email, lead scoring (optional) |
| **Commerce adapters** | Payment only; may also fire AC tags if WP-side already does — Labs must not double-fire without care |

AC is **not** optional for Better+ marketing. It is optional for **platform boot**
(same pattern as Stripe: missing config → adapter disabled, rest of Labs works).

### 5.2 Config (fail loud when used)

```bash
# Optional until first AC call — then required
LABS_AC_API_URL=https://<account>.api-us1.com
LABS_AC_API_KEY=...
# Optional defaults
LABS_AC_LIST_ID=...                 # primary marketing list
LABS_AC_TAG_MAP_JSON={"observer":"123","navigator":"456","trial":"789"}
```

Or DB table `provider_tag_map (provider='activecampaign', external_key, labs_event)` for
data-driven tags (preferred over huge env JSON at Best).

### 5.3 Sync directions

```text
LABS ──events──► ActiveCampaign
  identity.created / registered
  membership.activated | grace | cancelled | expired   (plan slug)
  free_preview.completed  (lesson slug)
  pathway.flagship_started | flagship_completed
  marketing.first_touch   (utm json — custom fields)

ActiveCampaign ──optional──► LABS
  Form webhook → waitlist identity note or tag only
  (Do NOT create paid memberships from AC — entitlement stays commerce/CLI)
```

### 5.4 Contact identity

- **Primary key:** email (same as Labs identity join key)  
- On register / SSO: upsert AC contact; set custom field `labs_identity_id` if useful  
- Tags = lifecycle stage + plan + campaign (doctrine-safe names)  
- **Unsubscribe / GDPR:** AC owns preference center; Labs respects “do not market” if
  synced flag present (Better+)

### 5.5 Automations (content, not code)

| Automation | Trigger (Labs → AC tag/event) | Doctrine |
|---|---|---|
| Welcome free | `registered` | Process intro + free-preview link |
| Trial start | `membership.activated` + trial plan | Pathway + live schedule |
| Paid member | `membership.activated` + navigator | Capacity framing, not upsell spam |
| Cancel / expire | `membership.cancelled|expired` | Dignity; alumni path if applicable |
| Free-preview complete | event | Soft CTA via **resolver** (free path or paid) |
| Flagship complete | event | Next pathway step + live invite |

**Email copy:** Sierra formula; Tango review; no P&L claims; every mail has value without
purchase.

### 5.6 Implementation sketch (Labs)

```text
server/integrations/activecampaign.py
  · get_ac_config() optional / fail loud on use
  · upsert_contact(email, fields)
  · apply_tag / remove_tag
  · track_event(name, email, payload)  # AC site tracking or event API

hooks (call from identity / membership / progress — not sprinkle SDKs in UI):
  after register → upsert + tag "labs-registered"
  after upsert_membership → map plan → tags
  after free-preview complete → event
```

**Idempotent:** same email+tag twice is fine.  
**Async later:** queue if AC latency bites; sync OK at Good/Better volumes.  
**No AC → marketing content still ships;** only automations pause (503 on explicit
admin “sync now”, silent skip on fire-and-forget with log).

### 5.7 Forms

| Need | Approach |
|---|---|
| Waitlist (no commerce) | AC form embed on `/go/waitlist` or Labs page |
| Free account | Labs `/signup` (preferred — creates real identity) |
| Paid | Commerce adapter checkout — not AC payment |

Prefer **Labs signup** over AC-only lead so entitlement and pathway work without a
second identity silo. AC receives the contact *after* Labs identity exists.

---

## 6. Funnel design (backend-agnostic)

### 6.1 Primary path

```text
YT short / Live Show
  → Free-preview lesson (Labs public)
  → Create free Labs account  (/signup)     ← always available
  → Pathway / flagship
  → Convert (resolver):
        stripe checkout  OR  external Woo URL  OR  waitlist/AC  OR  stay free
  → Membership truth in Labs
  → Continue pathway
```

### 6.2 Message pillars

1. Stop the bleeding  
2. Defined risk  
3. Process over P&L  
4. Capacity over dependency  

**Forbidden:** guaranteed returns, job-quit promises, P&L flex, shame upgrades.

### 6.3 CTAs (standardized intents)

| Stage | Label | Target (abstract) |
|---|---|---|
| Attention | Watch free lesson | Free-preview URL + UTM |
| Trust | See the pathway | `/pathway` or flagship |
| Identity | Create free account | `/signup` |
| Convert | Start trial / Join | **CTA resolver** (stripe \| external \| membership page) |
| Activate | Continue learning | `/dashboard` |

---

## 7. System design detail

### 7.1 Content engine = factory (courses **and** campaigns)

| Board product_line | Places |
|---|---|
| `course` | Draft course on Labs |
| `youtube_long` / shorts | Assets (may attach to a campaign) |
| **`campaign`** | **Lander + campaign record + distribution kit** (first-class) |

Social distribution (YT / X / IG) is defined **inside the campaign package**, not as
orphan posts. Sierra packaging: titles, captions, UTM, AEO question per asset role.

### 7.2 Owned web = Labs

| Page | Job |
|---|---|
| Free previews / hubs / about / membership | Trust + SEO |
| `/go/[slug]` landers (Better+) | Paid/organic compose free value + **one resolver CTA** |
| `/signup` | Identity (backend-agnostic) |
| `/membership` | Lists **enabled** commerce options only |

Lander CTA field stores `cta_mode` + optional URL/plan — never assumes Woo.

### 7.3 Email split

| Kind | System |
|---|---|
| Password reset, admin alerts, receipts-if-any | Labs SMTP |
| Nurture, campaigns, abandoned-intent (careful), broadcasts | **ActiveCampaign** |

### 7.4 Attribution (M1)

```text
Landing → first_touch cookie (utm + path)
  → on Labs register/login: write marketing_touchpoints
  → on membership activate: stamp plan_slug + provider
  → optional: AC custom fields (utm_source, first_landing)
```

Works for Stripe, Woo, or free — conversion = **membership row change**, not “Woo order.”

### 7.5 Measurement

| Metric | Source |
|---|---|
| Free-preview landings | Analytics + Labs |
| Account creates | Labs identities |
| Plan activations | `memberships` (any source) |
| Flagship progress | Labs progress |
| Email engagement | ActiveCampaign |
| Short performance | YouTube + UTM |

Commerce vendor is a **dimension** on activation (`source=stripe|wordpress:…|native`), not the definition of success.

### 7.6 Doctrine gate

Board guardian flags on growth content; Sierra + Tango before paid/AC broadcasts.

---

## 8. Data model (Better+)

```text
# CTA / campaigns
marketing_landers
  slug, title, answer_md, free_preview_path,
  cta_mode, cta_plan_slug NULL, cta_external_url NULL,
  utm_defaults_json, status, published_at

marketing_touchpoints
  id, identity_id NULL, session_key, first_utm_json, landing_path,
  converted_at NULL, plan_slug NULL, membership_source NULL, created_at

marketing_events
  id, identity_id NULL, name, props_json, created_at

# Optional AC mapping (data-driven)
provider_tag_map
  provider  -- 'activecampaign'
  labs_event -- 'registered' | 'plan:navigator' | 'free_preview_complete' | ...
  external_tag_id
```

Reuse existing: `plans`, `memberships`, `provider_plan_map`, `identity_links`.

---

## 9. Agent / org model

| Callsign | Role |
|---|---|
| Sierra | Copy, landers, AC email templates, AEO |
| Tango | Honesty / capacity gate |
| Bravo / Romeo / Papa | Research, scripts, renders |
| Quebec | Content calendar on board |
| Mike/Alpha | Adapters: AC, CTA resolver, Stripe/Woo seams |
| Coach | Channel mix, budget, convert mode choice |

---

## 10. Good / Better / Best

### GOOD — first campaign workflow MVP + free funnel  
**~2–4 weeks · real eng (board product_line)**

| Work | Detail |
|---|---|
| **Campaign workflow MVP** | `product_line=campaign`, required stages, package gate, place lander + campaign row (Spec §10 Good) |
| Doctrine + UTM kit | Pillars, forbidden claims; `utm_campaign=<slug>` |
| Free-preview + flagship polish | SEO content the lander points at |
| CTAs → free-preview and `/signup` | Works with zero paid backend |
| Distribution kit | YT / X / IG captions in package; **manual** social publish |
| Search Console + simple analytics | |
| **AC manual** | Tags named after campaign slug until bridge ships |

**Success:** operators run a full campaign **on the board** end-to-end; lander live; social pack consistent.

---

### BETTER — AC + attribution + convert resolver  
**~4–8 weeks**

| Work | Detail |
|---|---|
| **M0 CTA resolver** | stripe \| external_url \| signup \| membership |
| **M1 first-touch** | Cookie → identity; bind `utm_campaign` |
| **M2 AC bridge** | Upsert + campaign tags on place/register/membership |
| **`/admin/campaigns`** | List/pause live campaigns (peer to course admin mental model) |
| Paid amplify **winning** campaign assets only | |
| Weekly growth review by campaign slug | |

**Success:** every activation attributable to a campaign; nurture tagged; commerce optional.

---

### BEST — scale + measure  
**~quarter**

| Work | Detail |
|---|---|
| **M5 growth cockpit** | Funnel by campaign + membership.source |
| Labs → AC full events | free_preview, pathway |
| Optional social API publish | Still doctrine-gated |
| Child cards per asset (v1.1) | Optional fan-out from campaign |
| Affiliate kit | |
| Still no HubSpot; still no second CMS | |

---

## 11. Good vs Better vs Best (commerce & AC)

| Dimension | Good | Better | Best |
|---|---|---|---|
| **Requires Woo?** | No | No | No |
| **Requires Stripe?** | No | No | No |
| **Requires some convert path?** | Free signup enough | Resolver + optional paid | Same |
| **ActiveCampaign** | Manual/optional | **Integrated bridge** | Full event map |
| **Attribution** | UTM in links | First-touch → identity | + cockpit |
| **Risk** | Under-distribute | Double-tag if WP+AC both fire | Over-automate email |

---

## 12. Recommended path

1. **Good now** — free-preview + signup funnel; commerce optional.  
2. **Better next** — CTA resolver + **ActiveCampaign bridge** + first-touch; wire **Stripe and/or Woo** as adapters when ready.  
3. **Best** after activation metrics exist.

**Do not** design marketing as “Woo funnel with Labs at the end.” Design it as  
**“Labs trust + identity + pathway, with optional money pipes and AC as the nurture brain.”**

---

## 13. 90-day outline

| Weeks | Focus |
|---|---|
| 1–2 | Doctrine, UTM, free previews, Live CTA, free signup path |
| 3–4 | Factory shorts; AC list hygiene; welcome automation (even if manual trigger) |
| 5–6 | M0 resolver + M1 cookie; landers ×3; AC onboarding 5-mail |
| 7–8 | Enable Stripe and/or Woo convert; measure activations by source |
| 9–12 | Scale winners; event tags; decide cockpit |

---

## 14. Risks

| Risk | Mitigation |
|---|---|
| Dual identity (AC-only leads never become Labs users) | Prefer Labs `/signup` before nurture depth |
| Double emails (WP plugin + Labs → AC) | Single writer for each event; document ownership |
| Commerce lock-in | Resolver + membership-centric metrics |
| Hype under ad spend | Sierra/Tango gates |
| AC as entitlement backdoor | Never grant paid plans from AC webhooks |

---

## 15. Success signals

| Horizon | Signal |
|---|---|
| 30d | Free-preview + free accounts up; AC list clean |
| 60d | Activations by source (free/stripe/woo); nurture open rates without spam |
| 90d | Stable content cadence; CAC or activation cost known for paid path |

---

## 16. Implementation map (when approved)

| Slice | Notes |
|---|---|
| **C0** Campaign workflow spec freeze | This + Campaign Workflow Spec v1.0 |
| **C1** Board `product_line=campaign` + stages + package rules | Peer to course |
| **C2** `marketing_campaigns` + landers + place-on-approve | |
| **C3** `/go/[slug]` public + admin campaigns list | |
| G0 Doctrine + UTM | Doc (feeds campaign brief template) |
| G1 Free-preview sprint | Content targets for landers |
| B0 CTA resolver | Config |
| B1 Attribution cookie | Bind utm_campaign |
| B2 ActiveCampaign adapter | Tags from growth_hooks |
| S1 Events → AC | free_preview, pathway |
| S2 Growth cockpit | By campaign |

---

## 17. Related

| Doc | Role |
|---|---|
| **Campaign Workflow Spec v1.0** | **First-class campaign factory (normative)** |
| Content Board / Production Package Specs | Shared Kanban + package machinery |
| Identity-Access Spec | Pluggable providers |
| Native Billing Stripe Spec | Stripe adapter |
| WooCommerce SSO Integration Guide | Optional Woo/SSO adapter |
| SEO Specs v1.0–v1.3 | Owned acquisition surface |
| P2 factory / cast | Asset production |

---

## 18. Closing principle

> **Powerful** = bleeding trader finds free, honest education and a path into membership  
> without the product caring whether money arrived via Stripe, Woo, or not yet at all.  
> **Light** = Labs + factory + AC + thin adapters — not a shopping stack pretending to be a school.

---

*Rev 2 for Coach. Pick Good / Better / Best; confirm convert mode(s) (free-only, Stripe, Woo, both) and AC account ownership before Juliet seeds B0–B2.*
