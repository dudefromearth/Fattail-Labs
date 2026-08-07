# FatTail Labs — Bot Marketplace Framework Specification v0.1

### Monetize FatTail Lab Bots · admin catalog for Labs subscribers · limited Labs peer share  
### Portable substrate + provision rails (not OA clone-to-live casino)

| | |
|--|--|
| **Status** | **v0.1.2 — Coach commercial purpose locked** (builds on v0.1.1 gate close; Coach stamp → **v1.0** for build) |
| **Version** | 0.1.2 |
| **Date** | 2026-08-07 |
| **Product** | labs.fattail.ai |
| **Surfaces** | Admin catalog / Labs member bot offer · Strategy Lab provision · limited Labs peer share (Community Labs channels) |
| **Author** | Juliet · architecture evaluation · **Coach monetization purpose (2026-08-07)** |
| **Decision log** | DL-243 · DL-244 · **DL-247** (marketplace purpose = monetize FatTail Lab Bots) |
| **Companion docs** | Arch [23](../Architecture/23-bots-marketplace.md) · Design [24](../Architecture/24-bots-marketplace-design.md) |

**Doctrine:** capacity over dependency · process outcomes only · **no P&L leaderboards / profit theater on bot cards** ·  
Family B · fail loud · standalone Labs repo · no MSC shared code ·  
**Design → Curate → Deploy** never skipped by share/import · **WooCommerce sole payment SoR** (Labs never takes cards).

**Home subdomain (future intent · DL-248 / DL-249 / DL-250 — not current build):** Marketplace
belongs on **`labs.fattail.ai`**, gated by a **separate Labs membership**. **Navigator** =
Practice coaching. Grandfather + purchase rules apply **at a future cutover**, not today.
Until then: design seams for Labs membership; **do not** strip current Navigators of Strategy Lab.
Peer package share language: “Labs-entitled” (membership key TBD).

---

## Parents / siblings

| Document | Role |
|----------|------|
| [Strategy-Lab-Curate-and-Deploy-Surface-Spec-v1.0](./Strategy-Lab-Curate-and-Deploy-Surface-Spec-v1.0.md) | Bots, Curate/Deploy phases |
| [Strategy-Lab-Strategy-Pack-Architecture-v1.0](./Strategy-Lab-Strategy-Pack-Architecture-v1.0.md) | Packs, config, versions |
| [FatTail-Labs-Community-App-Spec-v1.0](./FatTail-Labs-Community-App-Spec-v1.0.md) | Community chat, Discord second window, `attachment_json` |
| [FatTail-Labs-Member-Data-Privacy-Spec-v0.1](./FatTail-Labs-Member-Data-Privacy-Spec-v0.1.md) | Family B isolation |
| Arch [16](../Architecture/16-strategy-lab-vs-option-alpha-positioning.md) | Process over profit theater; no clone-to-live |
| Arch [17](../Architecture/17-strategy-lab-growth-playbook.md) | Design/Curate multi-tenant; Deploy gated |
| Arch [23](../Architecture/23-bots-marketplace.md) | System architecture (target) |
| Arch [24](../Architecture/24-bots-marketplace-design.md) | UX design (target) |
| DL-235 | House designs + private mint starters |
| DL-237–242 | Community + Discord bridge path |

---

## 0. Coach intent (binding — 2026-08-07)

### 0.1 Primary purpose — monetize FatTail Lab Bots

The **main purpose** of the Marketplace is to **monetize FatTail Lab Bots**:

- **Admins** of FatTail Labs define and version **official FatTail Lab Bots** (house / catalog SoR).  
- Those bots are **offered to customers who purchase FatTail Labs subscriptions** (WooCommerce on fattail.ai is the commerce entry point — Labs never takes payment itself).  
- On entitled membership, members **receive / apply** official bots into Strategy Lab (Curate first; Deploy only via existing gates).

### 0.2 Secondary purpose — limited Labs peer share

**Labs product** members (bot builders on `labs.fattail.ai`) may have **limited peer package sharing** with other **Labs-entitled** members. **Practice Navigators do not use Labs** and do not participate in Marketplace peer share (DL-249).

| Priority | Goal |
|----------|------|
| **Primary** | Admin-offered **FatTail Lab Bots** as part of **Labs subscription** monetization |
| **Secondary** | **Limited Labs-member ↔ Labs-member** package share (caps, entitlement, process-only) |

### 0.3 What this is not

- Not OA-style “community clone casino” or P&L leaderboards.  
- Not the primary story of “anyone packages and freely publishes to the world.”  
- Not in-app checkout — **WooCommerce** sells; Labs **entitles and provisions**.

---

## 1. Purpose

### 1.1 In one sentence

**Marketplace = the product system that lets FatTail admins offer official Lab Bots to Labs subscribers, and (secondarily) lets Labs members share limited process packages with each other — always into Curate, never one-click live Deploy. Navigators live on Practice and are out of Marketplace peer share.**

### 1.2 Two lanes

```text
LANE A — Commercial (primary)
  Admin FatTail Lab Bot catalog (house / versioned)
       → tied to subscription / plan entitlement (WooCommerce)
       → member provisions into Strategy Lab (Curate drafts / house apply)
       → Deploy only via normal Labs rails

LANE B — Peer (secondary, limited)
  Labs-entitled member packages process bots
       → share only to other Labs-entitled members (limited)
       → Import → Curate drafts
       → same portable substrate as Lane A
```

### 1.3 Success criteria (framework done when)

**Lane A (primary)**  
1. Admins can publish / version **FatTail Lab Bots** in the official catalog.  
2. A customer who purchases a qualifying **Labs subscription** can **see and provision** the offered bots into **their** Strategy Lab.  
3. Provision lands as **Curate** process bots (or house apply), not auto-Deploy live.  
4. Entitlement is driven by Labs membership / plan map — **not** by peer chat alone.  

**Lane B (secondary)**  
5. A **Labs-entitled** member can package bots and share with **another Labs member** under explicit limits.  
6. **Practice Navigators** cannot use Marketplace peer share; they receive coaching on Practice (DL-249). Lane A admin bots only for members whose plan includes the Labs bot product.

**Cross-cutting**  
7. One portable substrate (`fattail.bot_package` / house apply).  
8. No P&L rankings or profit theater on offer cards.  
9. Trust: pack schema validate, house provenance, authed downloads (DL-244).

---

## 2. Design principles

| # | Principle |
|---|-----------|
| P1 | Stay inside **Design → Curate → Deploy**. Provision/import never arms live Deploy. |
| P2 | **Primary value** = **admin FatTail Lab Bots** offered with **subscriptions** (monetization). |
| P3 | **Peer share is secondary and limited** — Labs-entitled → Labs-entitled only (DL-249). |
| P4 | Professional tone — **no gamification of performance**, no public win-rate shelves. |
| P5 | **WooCommerce sole payment SoR**; Labs maps entitlement → bot offers. |
| P6 | Package / catalog contents are **process definitions**, not live P&L or decision logs. |
| P7 | Commerce fields (`is_premium`, plan maps, purchase records) are **product-real**, not decorative — enforced for Lane A. |
| P8 | **One portable substrate:** `fattail.bot_package` (and house catalog apply) — sole member transfer formats (B1). |
| P9 | **House provenance** displayed and **re-verified** where peer packages claim house descent (B2). |
| P10 | Peer packages are **untrusted input** — pack schema/bounds validation (R1). Admin catalog is trusted SoR. |
| P11 | Official house bots remain **admin-only** to create/version (DL-235). |

---

## 3. Scope

### 3.1 In scope

**Lane A — Commercial (primary)**  
- Admin **FatTail Lab Bot catalog** (extends house designs / admin versioning).  
- **Offer binding**: which bots are available to which **plans / subscriptions** (data, not hardcode).  
- Member **browse entitled FatTail Lab Bots** and **Apply / provision** into Strategy Lab Curate.  
- Mint / starter bots may align with catalog (already DL-235) as a subset of Lane A.  
- Entitlement check on provision; revoke path when membership lapses (policy TBD with Mike — soft-lock vs remove).  

**Lane B — Peer (secondary)**  
- **Bot Package** substrate for multi-bot process packages.  
- **Labs-entitled only** create + share + import among Labs members (limits: rate, count, **Labs Community channels**, no public gallery required).  
- Optional Community attachment as a delivery rail for Lane B on **labs-scoped** channels (not the commercial spine).  

**Shared technical**  
- Pack-schema validation, strip live state, house re-derive, authed download (DL-244).  
- Tables: catalog/offers, `bot_packages`, `bot_package_shares`, entitlement/purchase projection as needed.  

### 3.2 Out of scope (explicit)

| Item | Notes |
|------|--------|
| In-app payment / card capture | Forbidden — WooCommerce only |
| Public anonymous bot storefront (no login) | Not required; member-facing offer shelf is enough |
| Rankings, reviews, performance leaderboards | Forbidden |
| Automatic performance tracking of bots as marketing | Forbidden |
| Open peer share for Practice Navigators | Out — Lane B = **Labs-entitled limited** (DL-249) |
| One-click Community → live Deploy | Forever forbidden without new Spec |
| Member-authored bots sold as official FatTail catalog | Admin catalog only for Lane A |
| Indicator marketplace | Non-goal |

### 3.3 Single portable substrate (B1 — binding)

**Law M-SUB-1.** The **only** portable format for member-to-member bot transfer into Strategy Lab is:

```text
fattail.bot_package  →  wraps  →  fattail.labs.strategy_lab (lab_portable)
```

| Law | Rule |
|-----|------|
| **M-SUB-2** | There is **one** import path and **one** member-facing verb for receiving bots: **Import**. |
| **M-SUB-3** | A “single-bot share” is a package with **`bot_count = 1`**, not a second format. |
| **M-SUB-4** | Community **FatTail house shelf** remains a **projection of the admin house catalog** (code SoR) — apply/copy-rebuild uses existing Strategy Lab designs APIs, **not** a parallel portable blob. |
| **M-SUB-5** | Table `community_bot_shares` (if retained) is a **thin index / card projection** over `bot_packages` (`bot_package_id` required for any new write). Legacy rows without packages are migrated or frozen read-only; **no new writes** that invent a second portable payload. |
| **M-SUB-6** | Chat may show a **card**; the card is a UI over a package (or house catalog entry), never a second SoR of config. |

**Deprecated as parallel path:** Community Spec §7 “Apply member share” that forked from a free-standing snapshot **without** a `bot_package`. Implementation of new share/import **must** use this Spec. Community Spec gets a cross-link amend (document control).

Inner portable id remains: `fattail.labs.strategy_lab` (`FORMAT_ID` in `strategy_lab_domain.py`).

---

## 4. Core objects

### 4.1 Bot Package

| Field | Required | Description |
|-------|----------|-------------|
| `id` / `public_id` | Yes | Unique Labs id |
| `creator_identity_id` | Yes | Strategy Lab user (Family B owner of source bots) |
| `title` | Yes | Human title |
| `description` | Yes | Short process description (no profit claims) |
| `version` | Yes | Package semver string (e.g. `1.0.0`) — **informational only** in MVF (A2); no update propagation |
| `status` | Yes | `draft` \| `shared` \| `archived` |
| `contents` | Yes | One or more bot definitions (JSON) — see §5 |
| `package_notes_md` | No | Optional process notes (sanitized on render — §9) |
| `correlation_notes_md` | No | Optional process-relationship notes only — **Hotel-gated language** (A1); no portfolio/edge thesis |
| `created_at` / `updated_at` | Yes | Timestamps |
| `manifest_json` | Yes | Canonical manifest (§5.2) |
| `blob_sha256` | Yes | Hash of packaged payload for integrity |
| `content_type` | Yes | `application/json` or `application/zip` |
| `byte_size` | Yes | Size cap enforced |

**Lane A catalog / offer fields (product-real):**

| Field | Type | Role |
|-------|------|------|
| `publisher` | `admin` \| `member` | Admin catalog vs peer package |
| `offer_plan_keys` | JSON list | Which Labs plans may provision this bot (Lane A) |
| `is_subscription_included` | BOOLEAN | Included with qualifying subscription |
| `is_premium` | BOOLEAN | Optional upsell SKU later (still sold via WooCommerce) |
| `price_cents` / `currency` | nullable | Display/sync only — payment SoR = WooCommerce |
| `license_type` | VARCHAR | `personal` \| `commercial` \| `restricted` |

### 4.2 Share Record

| Field | Required | Description |
|-------|----------|-------------|
| `id` / `public_id` | Yes | Unique |
| `package_id` | Yes | FK → bot package |
| `shared_by_identity_id` | Yes | Sharer |
| `shared_at` | Yes | Timestamp |
| `target_channel_id` | No | Community channel (Labs) when shared in-app |
| `target_channel_slug` | No | e.g. `strategy-lab` |
| `labs_message_id` | No | When Community messages table exists |
| `discord_message_id` | No | For Discord/web sync |
| `attachment_ref` | No | Storage key / URL token for the file |

### 4.3 Purchase record (hook only — empty product)

Table `bot_package_purchases` **may** be created empty of product meaning:

| Field | Notes |
|-------|--------|
| id, identity_id, package_id | Future buyer |
| amount_cents, currency | Future |
| purchased_at | Future |
| provider_ref | e.g. WooCommerce order id |

**Lane A:** purchase / entitlement rows are written from membership webhooks / plan map — not from peer share.  
**Lane B peer packages:** no purchase row; **Labs product entitlement** only.

---

## 3.4 Access by lane

| Action | Who |
|--------|-----|
| Admin publish / version FatTail Lab Bots | **Administrator** only |
| Browse / provision **entitled** FatTail Lab Bots | Holders of **Labs membership** (purchased or grandfathered) |
| Create peer package + share | **Labs membership** only (limited) |
| Import peer package | **Labs membership** only |
| **Future Navigator** (Practice only) | **No Marketplace** until they buy Labs (DL-250) |
| **Current Navigator at cutover** | Receives **Labs membership grant** (grandfather) → Marketplace as Labs member |
| **Observer trial** | Practice suite; Labs only if plan bundles Labs membership |
| Free no-plan | No Marketplace provision or peer share |

---

## 5. Package format

### 5.1 Principle

Reuse Strategy Lab portability already shipped:

- `GET /api/me/strategy-lab/export` → `build_export_pack`  
- `POST /api/me/strategy-lab/import/{detect,preview,commit}`  

Marketplace packages are a **typed wrapper** around a **creator-selected subset** of that portable model. MVF default: **Curate-phase bots only**.

### 5.2 Manifest (normative)

```json
{
  "format": "fattail.bot_package",
  "format_version": "1.0",
  "title": "string",
  "description": "string",
  "version": "1.0.0",
  "created_at": "ISO-8601",
  "creator": {
    "export_subject": "peer",
    "display_label": "optional non-PII label"
  },
  "source": {
    "system": "fattail-labs",
    "app": "strategy-lab-marketplace"
  },
  "bots": [
    {
      "local_key": "string",
      "name": "string",
      "pack_id": "butterfly",
      "bound_version_hint": "1.0.0",
      "house_design_key": "optional",
      "house_design_version": "optional"
    }
  ],
  "package_notes_md": "optional",
  "correlation_notes_md": "optional",
  "lab_portable": {
    "format": "fattail.labs.strategy_lab",
    "model_version": "1.0",
    "foundation_version": 1,
    "strategies": []
  }
}
```

**Rules:**

1. `lab_portable.strategies` length ≥ 1 and matches `bots[]` count (1:1).  
2. **Strip** from each strategy card before package: live cash, open positions, decision_log, broker credentials, private notes marked Family-B-sensitive.  
3. **Keep:** name, pack_id, pack config / spec_json needed to rebuild process, house_design binding, version fields.  
4. Single-file **JSON** preferred for MVF; **ZIP** allowed if needed (manifest at root `manifest.json` + strategies).  
5. Max size: fail loud above limit: **2 MiB** JSON / **5 MiB** ZIP. Max **10** bots per package.  
6. No profit metrics, expectancy, win rate, or equity series in package.  
7. Package `version` is **informational only** in MVF (A2) — import is a **point-in-time fork**; no update stream to importers.

### 5.3 Validation on import (untrusted input — R1)

Treat every package as **untrusted**. Validation is **not** “structure only.”

| Check | Fail behavior |
|-------|----------------|
| `format` == `fattail.bot_package` (or unwrap nested `lab_portable`) | Reject |
| Known `model_version` / `foundation_version` | Reject if unsupported |
| Each strategy `pack_id` known to pack registry | **Reject package** if any unknown pack |
| **Each pack config validates against that pack’s schema/bounds** (same validators Strategy Lab uses on save/apply) | **Reject** bot or whole package (MVF: reject whole package on any invalid config) |
| Forbidden live fields present (cash, positions, decision_log, creds) | **Strip** if residual; if strip fails integrity check → **Reject** (A3) |
| JSON schema / required fields | Reject |
| Size / bot count caps | Reject |
| Performance claim fields present | **Strip** + honesty note |
| House provenance claims | **Re-derive / verify** per §5.5 — never trust bare self-claim |

Import **does not** validate “good process,” edge quality, or historical performance.  
Imported bots **inherit Curate performance guards** (DL-231/234 family): they must not place work on the comparison hot path differently than any other Curate bot.

### 5.4 Import placement

| Rule | Value |
|------|--------|
| Owner | **Receiver** identity only |
| Phase | **`curation`** (Curate) |
| Phase state | Prefer **`draft`** until receiver arms |
| Disposition | `active` |
| Name collision | Create new public_ids (never overwrite without explicit policy) |
| Re-import same package | Soft notice “similar package already imported” when detectable (A2); still allows fork unless product tightens later |
| Deploy | **Never** auto-promote to deployment |

### 5.5 Provenance & house redistribution (B2 — binding)

**Coach policy (locked in Spec until Coach amends):**

| Law | Rule |
|-----|------|
| **M-HOUSE-1** | **Official FatTail Lab Bots** are admin catalog only (Lane A). Members never publish to the commercial catalog. |
| **M-HOUSE-1b** | **Labs-entitled** members **may** package bots that **descend from** house designs for **limited peer share** (Lane B) with mandatory provenance. Practice Navigators do not. |
| **M-HOUSE-2** | Peer redistribution does **not** make the package an official FatTail house listing. House catalog remains **admin-only** SoR for commercial offers. |
| **M-HOUSE-3** | Whenever a source bot carries `house_design@1` (or equivalent binding), the package **must** record `house_design_key` + `house_design_version` on that bot entry. |
| **M-HOUSE-4** | **Card + import preview must display** provenance, e.g. `Based on FatTail house: {name} · {key}@{version}`. |
| **M-HOUSE-5** | On **import**, house fields are **re-derived/verified** against the **house design catalog** (and pack registry). If key/version is unknown or inconsistent with pack_id → **clear house binding** on the imported bot and set honesty note `house_claim_unverified` — **do not** invent official lineage. If key is known, stamp verified binding from catalog (not free-text from package). |
| **M-HOUSE-6** | Packages **must not** claim a house key they did not have on the source bot at package time (builder copies from source binding only). |
| **M-HOUSE-7** | FatTail **official** house shelf cards continue to use Design **Apply / Copy & rebuild** APIs — not package import — for first acquisition of house process. |

### 5.6 Discord representation (R3)

Discord cannot host Labs “Import” chrome. Normative representation when a package is shared:

| Surface | Representation |
|---------|----------------|
| **Labs Community chat** | Full attachment card: title, bot_count, provenance, **Download** + **Import to Strategy Lab** |
| **Discord (same conversation)** | **Link-back card**: title, bot_count, short description, house provenance line if any, URL to Labs deep-link `https://labs.fattail.ai/app/strategy-lab?import_package={public_id}` (or equivalent). No false claim that Discord installs bots. |

**Sequencing:** Discord link-back ships **with F3** (same release as Labs share), not a late F5 afterthought. F5 may deepen parity (richer embeds); **F3 must not ship Labs-only share without a defined Discord degrade** (minimum: message text + Labs URL).

---

## 6. Minimal user flows

### 6.A Package & Share (Creator)

```text
1. Strategy Lab → Curate
2. Select one or more bots (multi-select)
3. “Create Package”
4. Enter title (required) + short description (required)
5. Optional: package notes / correlation notes
6. System builds package JSON (+ hash), status = draft
7. User shares into Community via **Share to Community** (preferred) or download for offline handoff
8. System writes Share Record; posts Labs attachment card + Discord link-back (§5.6)
9. Package status → shared
```

### 6.B Import (Receiver)

```text
1. User sees package card in Labs chat OR link-back in Discord
2. Opens Import (deep-link or file) — download only via §7.5 authz
3. Strategy Lab → Import Package
4. detect → validate pack schemas + house re-derive → preview → commit
5. Bots appear in receiver’s Curate as drafts (with provenance lines)
6. Receiver reviews, curates, later deploys only via normal gates
```

### 6.C Archive (Creator)

Owner sets package `status = archived` — no longer offered as “active share”; prior downloads remain local files (no remote revoke of copies — capacity honesty).

---

## 7. Technical requirements (minimal)

### 7.1 Reuse

| Existing | Use |
|----------|-----|
| `strategy_to_portable` / selected export | Subset builder for selected strategy public_ids |
| `detect_pack` / `preview_import` / `commit_import` | Extend to accept `fattail.bot_package` wrapper or unwrap `lab_portable` |
| Community `attachment_json` | Type `bot_package` with package public_id + title |
| `community_channels` / `community_messages` | Target channel + message ids for Share Records |

### 7.2 New modules (target)

| Module | Role |
|--------|------|
| `server/bot_marketplace_domain.py` | Packages CRUD, share records, blob meta |
| `server/bot_marketplace_package.py` | Build/validate package bytes |
| Routes under strategy_lab + community | HTTP |
| Migration **next free at build** (confirm ordering — do not assume 093 if tree advanced; D1) | Tables in §7.3 |

### 7.3 Database (normative sketch)

```sql
-- bot_packages
id, public_id, creator_identity_id,
title, description, version, status,  -- draft|shared|archived
manifest_json, payload_json NULL,     -- or object storage key
blob_storage_key NULL, blob_sha256, content_type, byte_size,
package_notes_md, correlation_notes_md,
is_premium, price_cents, currency, license_type,  -- hooks
created_at, updated_at

-- bot_package_shares  (Share Records)
id, public_id, package_id, shared_by_identity_id,
shared_at, target_channel_id, target_channel_slug,
labs_message_id, discord_message_id, attachment_ref,
created_at

-- bot_package_purchases  (hook only)
id, identity_id, package_id, amount_cents, currency,
purchased_at, provider_ref, created_at
```

### 7.4 HTTP surface (MVF)

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/me/strategy-lab/packages` | Create package from selected bot public_ids + title/description |
| `GET` | `/api/me/strategy-lab/packages` | List own packages |
| `GET` | `/api/me/strategy-lab/packages/{id}` | Own package meta |
| `GET` | `/api/me/strategy-lab/packages/{id}/download` | Download package file (owner or authorized share) |
| `POST` | `/api/me/strategy-lab/packages/{id}/archive` | Archive |
| `POST` | `/api/me/strategy-lab/packages/import/detect` | Or extend existing import detect |
| `POST` | `/api/me/strategy-lab/packages/import/preview` | |
| `POST` | `/api/me/strategy-lab/packages/import/commit` | Import into Curate |
| `POST` | `/api/me/community/packages/{id}/share` | Create Share Record + attachment payload for channel |

**Auth:** session + Strategy Lab entitlement (same ladder as Strategy Lab).  
**Family B:** never return another user’s draft package payload without an explicit share path.

### 7.5 Download authorization (R4 — binding)

| Law | Rule |
|-----|------|
| **M-DL-1** | **No bare public blob URLs.** Package bytes are never served from a guessable long-lived public object URL. |
| **M-DL-2** | Allowed paths only: (a) **authenticated** `GET .../packages/{id}/download` with session + entitlement, or (b) **short-lived signed URL** whose claims include `package_id`, `share_id` (when peer), expiry, and server-side re-check of share/package status on redeem. |
| **M-DL-3** | Creator: download if package not deleted and caller owns it. |
| **M-DL-4** | Peer: download only if package `status = shared` **and** a valid Share Record exists (or equivalent explicit grant); server re-validates on every request/redeem. |
| **M-DL-5** | Anonymous: **never**. |
| **M-DL-6** | “Link to Labs-hosted package” in product copy means a **Labs app deep-link or signed URL**, not an open CDN path. |

---

## 8. Monetization (primary product purpose — Coach)

### 8.1 Commercial spine

```text
Customer buys FatTail Labs subscription on WooCommerce (fattail.ai)
    → webhook / plan map → Labs membership entitlement
    → Marketplace offer table: which FatTail Lab Bots this plan unlocks
    → Member opens Labs → sees entitled bots → Apply / provision → Curate
```

| Rule | Detail |
|------|--------|
| Payment | **WooCommerce only** — Labs never processes cards |
| SoR for “what bots are official” | Admin FatTail Lab Bot catalog (code + admin APIs; house designs lineage) |
| SoR for “who may provision” | Labs membership + **offer_plan_keys** / plan map |
| Provision | Into **Curate** (or house apply) — not live Deploy |
| Marketing copy | Process / capacity language; **no profit guarantees** on bot offer cards |

### 8.2 Product tables (normative direction)

| Concept | Role |
|---------|------|
| FatTail Lab Bot catalog entry | Admin-versioned process bot (house key@version + config) |
| Plan offer map | plan_key → bot catalog keys included |
| Provision audit | identity, bot key, version, at time of apply |
| Peer package / share | Lane B only; Labs-entitled limited |

### 8.3 Peer share is not the monetization path

Labs peer packages **do not** replace subscription sales of official bots. Caps and Labs-only gates prevent the peer lane from becoming a free public store of FatTail IP without a Labs subscription.

### 8.4 Optional future SKUs

Individual bot or pack upsells remain **WooCommerce products** mapped into Labs entitlement — same pattern as memberships. Spec v1.1+ if à la carte beyond subscription bundles.

---

## 9. Security, privacy, doctrine

| Concern | Rule |
|---------|------|
| Family B | Source bots remain private; package is explicit export snapshot |
| Strip live state | No positions, cash, decision_log, broker secrets |
| Untrusted import | Pack schema/bounds validation (R1); house re-derive (B2) |
| No P&L in package or chat card | Hotel / Tango |
| Import never Deploy-arms | Arch 17 |
| Rate limits | Package create/import caps (Mike) |
| Blob storage / download | **§7.5 only** — authed or short-lived signed (R4) |
| Content moderation | Description/notes subject to process-language rules (Hotel on `correlation_notes_md` especially — A1) |
| **Free-text sanitization (R2)** | All member free-text (`title`, `description`, `package_notes_md`, `correlation_notes_md`, `display_label`) is **output-encoded / sanitized** on every render surface (Labs chat card, import preview, Discord link-back text). Stored XSS and link-injection must fail characterization tests. Prefer store as plain text / constrained markdown subset; never raw HTML. |

---

## 10. API / DTO sketches

### 10.1 Create package request

```json
{
  "title": "0DTE process set — week of study",
  "description": "Two house-based Curate bots I run together for process practice.",
  "strategy_public_ids": ["abc123", "def456"],
  "package_notes_md": "optional",
  "correlation_notes_md": "optional process relationship notes"
}
```

### 10.2 Create package response

```json
{
  "package": {
    "id": "pkg_…",
    "title": "…",
    "version": "1.0.0",
    "status": "draft",
    "bot_count": 2,
    "byte_size": 12345,
    "download_path": "/api/me/strategy-lab/packages/pkg_…/download"
  }
}
```

### 10.3 Community attachment_json

```json
{
  "type": "bot_package",
  "package_id": "pkg_…",
  "title": "…",
  "version": "1.0.0",
  "bot_count": 2,
  "creator_display": "optional",
  "provenance": [
    { "house_design_key": "0dte_otm_classic_butterfly", "house_design_version": "1.0.0", "label": "Based on FatTail house …" }
  ],
  "import_path": "/app/strategy-lab?import_package=pkg_…"
}
```

No P&L fields allowed. Free-text fields sanitized on render (§9).

---

## 11. UI surfaces (minimal)

| Surface | Chrome |
|---------|--------|
| **Member FatTail Lab Bots** (primary) | Entitled official bots: browse + **Apply / provision** (Strategy Lab / Apps) |
| Admin catalog | Publish / version FatTail Lab Bots; bind to plans |
| Strategy Lab Curate | Labs members: multi-select + **Create Package** (Lane B); entitled: apply house/catalog |
| Strategy Lab Import | **Import Package** (peer) — Labs-entitled limited |
| Community (Labs channels) | Attachment card for Labs peer packages |
| Discord | Link-back for peer packages if shared in Community |
| **Not required for Lane A** | Public anonymous storefront, ratings, search SEO |

**Verbs:** Lane A official = **Apply / Provision**. Lane B peer = **Import**.  

Design detail: [Architecture/24-bots-marketplace-design.md](../Architecture/24-bots-marketplace-design.md).

---

## 12. Phased delivery

| Phase | Deliverable |
|-------|-------------|
| **F0** | Spec + Arch 23 + Design 24 + DL-243/244/**247** |
| **F1** | Lane A: plan↔bot offer map + member entitled catalog browse + provision to Curate (extends house apply) |
| **F2** | Lane A admin UX for catalog version + plan binding; webhook entitlement sync |
| **F3** | Lane B: Labs-member package build/import + limited share + trust rules (DL-244) |
| **F4** | Community/Discord rail for Lane B (optional) |
| **Later** | À la carte WooCommerce bot SKUs beyond subscription bundles |

**R3 closed:** Discord representation is defined in §5.6 and **minimum parity is part of F3**, not deferred past share.

---

## 13. Acceptance tests (implementation)

| ID | Evidence |
|----|----------|
| T1 | Create package from 2 Curate bots → JSON validates manifest |
| T2 | Package contains no cash/positions/decision_log |
| T3 | Import as second identity → 2 strategies in curation, owned by receiver |
| T4 | Import does not set phase=deployment |
| T5 | Share record written when share API called |
| T6 | Anon cannot download; bare public URL path not offered |
| T7 | Free no-plan cannot provision catalog bots; entitled plan can |
| T7b | Labs-entitled can peer-import; Practice Navigator cannot peer-share |
| T8 | Unknown pack_id → reject |
| T9 | Invalid pack **config** (known pack_id, bad bounds) → reject (R1) |
| T10 | Package with planted cash/decision_log/creds → stripped or rejected (A3) |
| T11 | Free-text XSS / `javascript:` payload → encoded on chat + preview (R2) |
| T12 | House binding on source → provenance on card; import re-derives verified key or clears unverified claim (B2) |
| T13 | Peer download without Share Record / unshared status → 403 (R4) |
| T14 | Discord share path includes Labs import deep-link (R3) |

---

## 14. Review gates (specialists)

| Gate | Focus | v0.1.1 status |
|------|--------|----------------|
| **India** | Single substrate (B1), provenance model (B2), format reuse | Findings folded — re-stamp |
| **Mike** | §7.5 download, signed URLs, free-text encode (R2/R4) | Findings folded — re-stamp |
| **Hotel** | No perf claims; **correlation_notes_md** (A1) | Findings folded — re-stamp |
| **Tango** | Capacity language; Import verb; no FOMO | Pending |
| **Echo** | Cards + Discord link-back chrome | Pending |
| **Coach** | Approve → **v1.0** build authority | Pending |

---

## 15. Review checklist (Coach) — post architecture gate

| # | Decision | Spec default after v0.1.1 |
|---|----------|---------------------------|
| C1 | **Primary purpose = monetize FatTail Lab Bots via subscriptions** | **Accept (binding · DL-247)** |
| C2 | Admins own official catalog; WooCommerce sells memberships | Accept |
| C3 | Peer share secondary: **Labs ↔ Labs limited**; Navigators on Practice only | Accept |
| C4 | Provision/import → Curate only; never auto-Deploy | Accept |
| C5 | Strip live state; no P&L theater on cards | Accept |
| C6 | Package substrate for peer + portable transfer (B1) | Accept |
| C7 | Lane A offer_plan_keys / entitlement enforced | Accept |
| C8 | House peer redistribute only as Lane B with provenance | Accept |
| C9 | Authed downloads (R4); pack schema validate (R1) | Accept |
| C10 | Build after v1.0 | Accept |

### Residual Coach calls (optional)

1. Exact plan matrix: which WooCommerce products unlock **Labs** vs **Practice Navigator**?  
2. Lane B caps (packages/month, bots/package)?  
3. Member UI labels: “FatTail Lab Bots” vs “Marketplace”?

---

## 16. Approval

| Role | Verdict | Date |
|------|---------|------|
| Architecture evaluation | **CONDITIONAL GO** — B1–B2, R1–R4 required | 2026-08-06 |
| Spec amend v0.1.1 | B1–B2, R1–R4, A1–A3, D1 folded | 2026-08-06 |
| Spec amend v0.1.2 | Commercial purpose primary (DL-247) | 2026-08-07 |
| Coach | _pending v1.0 stamp_ | |
| India re-stamp | _pending_ | |
| Mike re-stamp | _pending_ | |
| Hotel re-stamp | _pending_ | |
| Tango | _pending_ | |
| Echo | _pending_ | |

**After Coach v1.0:** BUILD AUTHORITY; Juliet seeds; Alpha F1 (migration number = next free at build time).

---

## 17. Architecture gate response map

| Finding | Disposition | Spec locus |
|---------|-------------|------------|
| **B1** Two share formats | **Closed** — package sole substrate; single-bot = `bot_count=1`; one verb Import | §3.3, P8 |
| **B2** House provenance | **Closed** — redistribute allowed + display + import re-verify | §5.5, P9 |
| **R1** Pack config trust | **Closed** — schema/bounds validate; Curate guards inherit | §5.3, P10, T9 |
| **R2** Free-text XSS | **Closed** — sanitize/encode all free-text on render | §9, T11 |
| **R3** Discord lag | **Closed** — link-back defined; min parity in F3 | §5.6, §12, T14 |
| **R4** Public blob URL | **Closed** — authed or short-lived signed only | §7.5, T6/T13 |
| **A1** correlation notes | **Tracked** — Hotel focus + process-only language | §4.1, §9 |
| **A2** version / re-import | **Tracked** — informational version; soft re-import notice | §4.1, §5.2.7, §5.4 |
| **A3** adversarial tests | **Tracked** — T10–T12 | §13 |
| **D1** migration number | **Tracked** — next free at build; do not hardcode 093 if tree moved | §7.2, §12 |

---

## 18. Document control

| Ver | Date | Note |
|-----|------|------|
| **0.1** | 2026-08-06 | Formal Spec from Coach MVF outline; FOR COACH REVIEW |
| **0.1.1** | 2026-08-06 | Architecture evaluation: B1–B2, R1–R4 folded; A1–A3/D1 tracked; DL-244 |
| **0.1.2** | 2026-08-07 | **Coach:** primary purpose = **monetize FatTail Lab Bots** for Labs subscribers; secondary = limited Labs peer share (DL-247/249) |
| **0.1.2** | 2026-08-07 | **DL-248:** future home = **labs.fattail.ai** (vs practice.fattail.ai for trader practice) |
| **0.1.2** | 2026-08-07 | **DL-249:** Navigators → Practice only; Lane B = Labs peers; Community channel segments |
| **0.1.2** | 2026-08-07 | **DL-250:** Labs = **separate membership**; current Navigators **grandfathered** via Labs membership grant; future Navigators purchase Labs |

---

## Appendix A — Glossary

| Term | Meaning |
|------|---------|
| **FatTail Lab Bot** | Official admin-versioned process bot in the commercial catalog |
| **Bot** | Member `strategy_lab_strategies` row (process unit) after provision |
| **Package** | Portable multi-bot (or single-bot) bundle — Lane B peer substrate |
| **Share Record** | Audit of a peer package delivery |
| **Provision / Apply** | Lane A: entitled member receives official bot into Curate |
| **Import** | Lane B: Labs member loads peer package into Curate |
| **Marketplace** | Product system for **selling/offering** FatTail Lab Bots via subscription + limited peer share |

## Appendix B — Intent evolution

| Version | Intent center of gravity |
|---------|---------------------------|
| v0.1 outline | Peer package + Community chat loop first |
| v0.1.1 | Trust / single substrate gate |
| **v0.1.2** | **Monetize admin FatTail Lab Bots via subscription; peer share secondary** |

## Appendix C — Capabilities summary

### Lane A — Commercial (primary)

- Admin catalog of FatTail Lab Bots (versioned)  
- Plan/subscription entitlement map  
- Member browse + provision into Strategy Lab Curate  
- WooCommerce sells membership; Labs entitles  

### Lane B — Peer (secondary)

- Labs-entitled packages process bots  
- Limited share to other Labs members  
- Import → Curate drafts; provenance + trust rules  

### Not in product

- In-app payments  
- Public P&L rankings / clone casino  
- One-click live Deploy from Marketplace  
- Free no-plan access to commercial bots  
- Practice Navigator access to Labs / Marketplace peer share (DL-249)  

