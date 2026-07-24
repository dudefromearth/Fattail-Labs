# FatTail Labs — Campaign Workflow Spec v1.0

**Status:** Design approved for build (Coach direction 2026-07-23) — *not yet implemented*  
**Parents:** Content Board Spec v1.0 · Production Package Spec v1.0 · Marketing Platform Architecture  
**Principle:** **Campaigns are first-class work products**, same factory discipline as **courses** —  
backlog card → stages → package → human gate → place on Labs (and outbound channels).

---

## 1. Purpose

Give operators a **campaign creation workflow** parallel to course production:

| Course workflow | Campaign workflow |
|---|---|
| Intent → research → plan → script → video → place **draft course** | Intent → brief → assets → lander → distribute → place **live campaign** |
| Board `product_line=course` | Board `product_line=campaign` |
| Human approve → `/courses/{slug}` draft | Human approve → `/go/{slug}` live + distribution kit |
| Member education | Acquisition (YT / X / Instagram → lander → identity → entitlement) |

Campaigns are **not** ad-hoc social posts. They are **governed packages** with doctrine gates,
artifacts, and a single source of truth on the Production Board.

---

## 2. Product definition

### 2.1 What a Campaign is

A **Campaign** is a time-bounded acquisition effort with:

1. **Objective** (attention / free accounts / trial / plan activation)  
2. **Message** (doctrine-safe hook + process claim)  
3. **Landing surface** (Labs `/go/{slug}` or free-preview deep link)  
4. **Asset pack** (long-form, shorts, X copy, IG captions — versions of one message)  
5. **Distribution plan** (YouTube, X.com, Instagram — channels + UTM scheme)  
6. **Convert path** (CTA resolver: free signup / Stripe / external Woo / membership page)  
7. **Growth hooks** (ActiveCampaign tags/automation id; first-touch UTM campaign key)  
8. **Success metrics** (what we measure when it “works”)

### 2.2 What a Campaign is not

- Not a separate Martech product  
- Not required to use WooCommerce  
- Not a profit-claim ad farm  
- Not publishable without Sierra/Tango-capable guardian clear (block flags)

---

## 3. Board integration (same Kanban as courses)

### 3.1 Product line

Add to `content_items.product_line`:

```text
campaign
```

Existing lines (`course`, `youtube_long`, `coaching_short`, `thematic_short`, `other`) unchanged.
A campaign **may spawn or link** child short/long cards later (v1.1); v1.0 keeps **one card =
one campaign package** with multi-asset artifacts inside.

### 3.2 Columns / authority

**Same columns and transition rules as Content Board Spec v1.0.**

| In production sub_stage | Campaign meaning |
|---|---|
| `research` | Audience insight / hook research (Bravo) |
| `design` | Campaign brief + lander outline (Sierra) |
| `script` | Social scripts + captions pack (Romeo) |
| `produce` | Video renders / creative (Papa / HeyGen) |
| `package` | Distribution + convert + AC checklist (Quebec) |
| `guardian` | Tango / Sierra / Hotel as needed |

### 3.3 Required package stages (`product_line=campaign`)

| Stage key | Artifact | Required content |
|---|---|---|
| `campaign_brief` | Markdown/JSON | Objective, audience, message pillars, success metrics, dates |
| `landing_spec` | JSON | Lander slug, H1, answer_md, free_preview_path, cta_mode + target |
| `script` | Markdown | Master VO/script; short variants; X thread; IG captions |
| `video_package` | JSON | Renders / YT ids / short ids (or dry-run provenance) per asset role |
| `distribution_plan` | JSON | Per-channel posts, UTM templates, publish windows |
| `vision_alignment` | Markdown | How this campaign serves Content Vision + doctrine |
| `growth_hooks` | JSON | AC tags/list, campaign key, optional automation id |

**Guardian:** open `block` flags (Sierra/Tango at minimum for paid) prevent `awaiting_approval`.

Optional extras: `research_pack`, `thumbnail_brief`, `paid_media_plan`.

### 3.4 Approve → place (parallel to course placement)

When admin moves campaign card → **`published`** (or explicit place):

1. Freeze approval package (same `content_approval_packages` machinery).  
2. **Apply campaign placement** (`apply_campaign_placement`):  
   - Upsert **`marketing_campaigns`** row (system of record for live campaigns)  
   - Upsert **`marketing_landers`** and publish `/go/{slug}` if lander mode  
   - Register default UTMs + AC tag keys on the campaign  
3. Board stores `placed_campaign_slug` (or reuses a placement result JSON column).  
4. **Outbound publish** (YouTube/X/IG) remains **human or operator tool** in v1.0 —  
   package must contain the kit; auto-post to social APIs is **Best / later**.

Board **Published** = campaign package approved and Labs lander/hooks live.  
Social platforms may still need a manual “hit publish” unless later automation is added.

---

## 4. Data model

### 4.1 `marketing_campaigns` (system of record)

| Column | Notes |
|---|---|
| id | PK |
| slug | UNIQUE — campaign key (`utm_campaign`, board link) |
| title | |
| status | `draft` \| `live` \| `paused` \| `completed` \| `archived` |
| objective | `attention` \| `accounts` \| `trial` \| `activation` \| `other` |
| message_md | Core claim (process-only) |
| lander_slug | FK logical → marketing_landers.slug |
| free_preview_path | Optional deep link |
| cta_mode | `labs_register` \| `stripe` \| `external_url` \| `membership` |
| cta_plan_slug | Nullable |
| cta_external_url | Nullable |
| utm_defaults_json | source/medium/campaign/content defaults |
| channels_json | `["youtube","x","instagram"]` |
| ac_tag_ids_json | ActiveCampaign tags for this campaign |
| content_item_id | Board card that produced it |
| package_id | Frozen approval package |
| starts_at / ends_at | Nullable windows |
| metrics_json | Optional cached rollups |
| created_at / updated_at | |

### 4.2 `marketing_landers`

As in Marketing Architecture: slug, title, answer_md, free_preview_path, cta_*, status,
campaign_id nullable, published_at.

### 4.3 Board columns

```sql
-- migration sketch
ALTER TABLE content_items
  ADD COLUMN placed_campaign_slug VARCHAR(255) NULL AFTER placed_course_slug;
```

(Or single `placement_result_json` expansion — implementation choice; slug denorm is fine.)

### 4.4 Link to social assets

`video_package` / artifacts may list:

```json
{
  "assets": [
    {"role": "hero_long", "platform": "youtube", "youtube_id": null, "status": "dry_run"},
    {"role": "short_1", "platform": "youtube_shorts", "status": "submitted"},
    {"role": "short_1", "platform": "instagram_reels", "status": "ready"},
    {"role": "short_1", "platform": "x", "status": "caption_only"}
  ]
}
```

---

## 5. Workflow (operator experience)

### 5.1 Create (like new course card)

1. Admin → Production board → **+ New card**  
2. Product line: **campaign**  
3. Title + intent (who, what message, success metric)  
4. Optional: cast_id if HeyGen presenters used  
5. Starts in **Draft** → move to **Queued** when ready  

### 5.2 Produce (same board motion as courses)

```text
Draft → Queued → Scheduled → In production
  research → design → script → produce → package → guardian
→ Awaiting approval → (Approve) Published
```

Artifacts accumulated per §3.3 (AI workbench with `content_item_id`, or paste).

### 5.3 Approve

Human only (same as course publish):

- Package complete + no block flags  
- Tango/Sierra satisfied for paid campaigns  
- Approve → place lander + campaign row **live**  

### 5.4 Run

Operators (or later tools) publish social posts from **distribution_plan** using  
captions + media from package. UTMs must use `utm_campaign=<campaign.slug>`.

### 5.5 Measure

First-touch cookie + membership activations with that `utm_campaign`; AC tag membership.
Growth cockpit (Best) filters by campaign slug.

---

## 6. Artifact contracts (normative JSON sketches)

### 6.1 `campaign_brief`

```json
{
  "objective": "accounts",
  "audience": "bleeding 0DTE traders short on trust",
  "primary_message": "Stop the bleeding before you scale size",
  "forbidden": ["profit claims", "guaranteed returns"],
  "success_metrics": ["free_preview_starts", "signups", "flagship_starts"],
  "channels": ["youtube", "youtube_shorts", "x", "instagram"],
  "window": {"starts_at": null, "ends_at": null}
}
```

### 6.2 `landing_spec`

```json
{
  "slug": "stop-bleeding-preview",
  "title": "Stop the bleeding before you size up",
  "answer_md": "40–60 word Sierra lead answer…",
  "free_preview_path": "/courses/first-stop-the-bleeding/lessons/…",
  "cta_mode": "labs_register",
  "cta_plan_slug": null,
  "cta_external_url": null,
  "cta_label": "Create free account"
}
```

### 6.3 `distribution_plan`

```json
{
  "utm_campaign": "stop-bleeding-preview",
  "posts": [
    {
      "channel": "youtube_shorts",
      "asset_role": "short_1",
      "caption": "…",
      "utm_content": "short_a",
      "scheduled_hint": "within 24h of approve"
    },
    {
      "channel": "x",
      "asset_role": "short_1",
      "caption": "…",
      "utm_content": "x_hook"
    },
    {
      "channel": "instagram",
      "asset_role": "short_1",
      "caption": "…",
      "utm_content": "ig_reel"
    }
  ]
}
```

### 6.4 `growth_hooks`

```json
{
  "ac_list_id": null,
  "ac_tags": ["campaign:stop-bleeding-preview", "source:organic_social"],
  "utm_campaign": "stop-bleeding-preview"
}
```

---

## 7. API (target)

| Method | Path | Behavior |
|---|---|---|
| (existing) | Board CRUD / transition / package | `product_line=campaign` |
| POST | `/api/admin/board/items/{id}/place-campaign` | Apply placement (or overload `/place` by product_line) |
| GET | `/api/admin/campaigns` | List campaigns |
| GET | `/api/admin/campaigns/{slug}` | Detail + metrics stub |
| PATCH | `/api/admin/campaigns/{slug}` | pause / complete / edit CTAs |
| GET | `/go/{slug}` | Public lander (SSG) |

Public landers: noindex optional per campaign; default index for SEO experiments only when intentional.

---

## 8. Admin UI

| Surface | Behavior |
|---|---|
| Board new card | Product line includes **campaign** |
| Board drawer | Campaign checklist stages; **Place campaign** / status |
| `/admin/campaigns` | First-class list (live/paused), link to board card + lander |
| `/go/{slug}` | Public lander |
| Growth cockpit (later) | Filter by campaign |

Campaigns must appear as a **peer** to courses in operator mental model:  
Admin overview card **Campaigns** next to Production board.

---

## 9. Agent mapping

| Stage | Callsign |
|---|---|
| Research / hooks | Bravo |
| Brief + lander copy | Sierra |
| Scripts / captions | Romeo |
| Video | Papa (+ cast) |
| Package / board | Quebec |
| Honesty | Tango (block) |
| Trading claims | Hotel if needed |
| Approve | Human admin only |

---

## 10. Good / Better / Best for *implementation*

| Tier | Ship |
|---|---|
| **Good (MVP workflow)** | `product_line=campaign` + required stages + package validate + place lander + campaign row + board UI; distribution kit in artifacts; **manual** social post |
| **Better** | `/admin/campaigns`; AC tag apply on place; first-touch binds `utm_campaign`; CTA resolver on lander |
| **Best** | Metrics rollup; optional social API publish; child cards per asset; A/B hooks |

**MVP is still a full workflow** (board → package → approve → place), not “post on IG and hope.”

---

## 11. Invariants

1. Campaign packages fail loud if required stages missing (same as courses).  
2. Process outcomes only in brief, lander, captions, AC copy.  
3. Convert path is **resolver modes**, never hard-coded Woo.  
4. Entitlements only via Labs memberships (commerce adapters / free / CLI).  
5. AC never grants paid plans.  
6. Human approve before lander is publicly marked live.  
7. One `utm_campaign` slug = one campaign record.

---

## 12. Relation to course workflow

| | Course | Campaign |
|---|---|---|
| Factory board | Yes | Yes |
| Package freeze | Yes | Yes |
| Human gate | Yes | Yes |
| Place target | Draft course graph | Live lander + campaign record |
| Member product | Education library | Acquisition |
| May share assets | Course trailer | Shorts from same cast |

A future **v1.1** may allow “spawn campaign from course” or “spawn shorts from campaign” as linked cards; v1.0 does not require it.

---

## 13. Verification (when built)

Characterization:

- Create campaign card → incomplete package blocked from awaiting_approval  
- Complete stages → freeze → place creates lander + campaign row  
- Public `/go/{slug}` serves answer + CTA  
- Pause campaign hides or soft-closes CTA  
- Doctrine: fixture copy with profit claim fails Tango review process (process test / flag)

---

## 14. Out of scope v1.0

- Auto-post to YouTube/X/IG APIs  
- Multi-touch attribution  
- Native ad-account budget management  
- Building ActiveCampaign UI inside Labs (tags/events only)

---

*Campaigns are how FatTail turns attention into pathway entrants — with the same rigor  
as building a course, not less.*
