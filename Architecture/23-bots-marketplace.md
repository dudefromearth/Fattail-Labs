# Bot Marketplace Framework — System Architecture

**Status:** Design locked (pre-implementation) — Spec **v0.1.2** · DL-243 · DL-244 · **DL-247**  
**Spec authority:** [`Specs/FatTail-Labs-Bot-Marketplace-Framework-Spec-v0.1.md`](../Specs/FatTail-Labs-Bot-Marketplace-Framework-Spec-v0.1.md)  
**UX design:** [`24-bots-marketplace-design.md`](./24-bots-marketplace-design.md)  
**Depends on:** Strategy Lab (house apply, export/import), pack validators, house catalog, membership/plan map, WooCommerce webhooks, Community (optional peer rail), Arch 16/17 doctrine

---

## 1. Purpose

**Primary (Coach · DL-247):** **Monetize FatTail Lab Bots** — admins offer official bots to customers who **purchase FatTail Labs subscriptions**; Labs **entitles and provisions** into Strategy Lab.

**Secondary:** **Limited Labs-member ↔ Labs-member** peer package share.  
**Navigators** default to **Practice**; Marketplace requires **Labs membership**
(purchased or **grandfathered** for current Navigators — DL-249/250).

```text
LANE A (commercial)     Admin catalog + Labs plan offers → provision Curate
LANE B (peer, limited)  Labs-entitled package → share → Import Curate
```

**Binding invariants (DL-244 + 247 + 249):**

1. Lane A is the product center of gravity; Lane B must not become a free public store of FatTail IP; Practice Navigators are out of Labs.  
2. **WooCommerce** = payment SoR; Labs never takes cards.  
3. **Single portable substrate** for peer packages; house catalog for official bots.  
4. **House provenance** on peer packages; admin catalog is trusted SoR.  
5. **Untrusted peer packages** — pack schema validate.  
6. **Downloads** — authed or short-lived signed URL.  
7. Provision/import → **Curate**, never auto-Deploy.  

**Not:** OA clone casino, P&L leaderboards, in-app checkout, free no-plan access to commercial bots.

---

## 2. Topology

### 2.1 Lane A — Commercial (primary)

```text
Admin FatTail Lab Bot catalog (house key@version + config)
        │
        ▼
 plan_offer_map  (plan_key → bot keys)
        ▲
WooCommerce subscription ──webhook──► Labs membership
        │
        ▼
 Member (entitled) → browse catalog → Apply / provision
        │
        ▼
 strategy_lab_strategies (Curate) · house_design binding
        │
        ▼
 Deploy only via existing Strategy Lab gates
```

### 2.2 Lane B — Peer (secondary)

```text
Labs-entitled Curate bots → package build → bot_packages
        │ limited share
        ▼
 other Labs-entitled → Import → Curate drafts
 (optional Community on labs-scoped channels)
```

---

## 3. As-built vs gap

| Piece | Status |
|-------|--------|
| Full-lab export/import JSON (`fattail.labs.strategy_lab`) | **Shipped** |
| `strategy_to_portable`, detect/preview/commit | **Shipped** |
| House catalog + apply / mint starters | **Shipped** (Lane A foundation) |
| Community channels + messages bridge | **Shipped** (C1c path) |
| `community_bot_shares` table + shelf **list** | **Shipped** (read; write APIs incomplete) |
| Plan ↔ bot **offer map** + entitled browse | **Gap** (Lane A) |
| Multi-bot **package** wrapper format | **Gap** (Lane B) |
| `bot_packages` / `bot_package_shares` tables | **Gap** |
| Create package / download / share APIs | **Gap** |
| Import unwrap + **pack schema validate** + house re-derive | **Gap** |
| Curate multi-select + package modal UI | **Gap** |
| Labs chat card + Discord link-back | **Gap** |
| Free-text sanitize on render | **Gap** (pattern exists elsewhere — apply here) |
| New `community_bot_shares` writes without package FK | **Forbidden** (Spec §3.3) |

**Design rule:** one portable substrate; extend portable export; never invent a second strategy serialization.

---

## 4. Core invariants

| Layer | Rule |
|-------|------|
| Package builder | Strip cash/positions/decision_log/secrets; copy house binding from source only |
| Portable format | Only `fattail.bot_package` → `lab_portable` |
| Chat / Discord card | No P&L; free-text encoded; house provenance line if any |
| Import | Pack schema validate; house re-derive; Curate draft; never Deploy |
| Download | Session authed or short-lived signed URL scoped to share — never public blob |

---

## 4.1 Trust boundary (R1)

```text
package bytes
  → parse + size caps
  → for each strategy:
       pack_id ∈ registry
       validate_config(pack, config)  // same as Design/Curate save
       re_derive_house(binding)
  → commit_import as curation/draft
  → bot subject to same Curate board guards as native bots
```

Malformed or hostile packages must fail **before** they become comparison-relevant Curate instances.

---

## 4.2 House provenance (B2)

```text
source bot house_design@1
  → package bots[].house_design_key/version (builder)
  → card "Based on FatTail house …"
  → import: catalog lookup
       known → stamp verified binding from catalog
       unknown/mismatch → clear binding + house_claim_unverified note
```

---

## 5. Module map (target)

| Module | Role |
|--------|------|
| `server/bot_marketplace_domain.py` | CRUD packages, share records, list own, archive |
| `server/bot_marketplace_package.py` | Build manifest, strip, hash, size/bot caps, validate |
| `server/strategy_lab_domain.py` | Reuse portable + import; small detect extension |
| `server/routes/strategy_lab.py` or `routes/bot_marketplace.py` | Package HTTP |
| `server/routes/community_app.py` | Share endpoint + attachment type |
| `server/community_domain.py` | Attachment render helpers |
| Migration **093+** | `bot_packages`, `bot_package_shares`, optional purchases |

---

## 6. Data model

### 6.1 bot_packages

Owner-scoped. Status machine: `draft` → `shared` → `archived` (and draft → archived).

Payload options:

1. **Inline** `payload_json` (MVF preferred for small JSON), or  
2. `blob_storage_key` for object store later  

Always store `blob_sha256`, `byte_size`, `content_type`.

### 6.2 bot_package_shares

Append-ish audit: each post to a channel creates a share row. Multiple shares of same package allowed (e.g. re-share).

### 6.3 Monetization hooks

Columns on `bot_packages` + empty `bot_package_purchases`. **No** product code paths read them for gating in MVF.

### 6.4 Coexistence with community_bot_shares (B1)

| Table | Role after Spec v0.1.1 |
|-------|------------------------|
| `bot_packages` | **Sole** portable config substrate |
| `community_bot_shares` | Thin card index only; **new writes require `bot_package_id`**; single-bot share = package with `bot_count=1` |
| House shelf | Code catalog projection — Apply/Copy via designs API, not package import |

Migration at build: add `bot_package_id` FK if table retained; freeze orphan snapshot payloads.

---

## 7. Package build algorithm

```text
input: identity_id, strategy_public_ids[], title, description, notes?
assert all strategies owned by identity_id
assert each phase in {curation} (MVF) — or allow design if Spec amends
for each strategy:
  card = strategy_to_portable(strategy)
  card = strip_runtime_fields(card)
build manifest + lab_portable { format: fattail.labs.strategy_lab, strategies: cards }
serialize JSON → sha256, size check
insert bot_packages status=draft
return public_id + download path
```

**strip_runtime_fields** removes at minimum: cash balances, open positions, decision_log, broker tokens, fill sim equity curves if any.

---

## 8. Import algorithm

```text
parse JSON
if format == fattail.bot_package:
  lab = document.lab_portable
else if format == fattail.labs.strategy_lab:
  # personal full-lab export still supported for owner backup — not community share substrate
  lab = document
else reject
detect_pack(lab)
for each strategy in lab.strategies:
  validate pack_id + pack schema/bounds  # R1
  re_derive house binding                # B2
  strip residual forbidden fields
preview_import / commit_import with policy:
  force phase=curation, phase_state=draft
  new public_ids for receiver
  never deployment
soft notice if similar package already imported (A2)
```

---

## 9. Share path

```text
POST share(package_id, channel_slug)
assert package.creator == caller OR (future: licensed)
assert package.status in {draft, shared}
assert channel exists / not archived
create bot_package_shares row
post Labs message with attachment_json type bot_package
  + Discord link-back text/URL (F3 minimum)   # R3
store labs_message_id / discord_message_id when returned
set package.status = shared
```

### 9.1 Download (R4)

```text
GET download(package_id) [session]
  if owner → ok (not deleted)
  elif peer → require status=shared AND share_record valid → ok
  else 403

OR redeem signed URL:
  verify signature + expiry + package_id + share_id
  re-check package status + share row server-side
  never long-lived public object ACL
```

---

## 10. Isolation from Deploy

| Action | May set phase=deployment? |
|--------|---------------------------|
| Create package | No |
| Share | No |
| Import commit | **No** |
| Receiver later promote | Only via existing Deploy entitlement + arming |

Arch 17 Deploy provision remains independent. Imported bots use same Curate guards as native bots (DL-231/234).

---

## 11. Security

| Concern | Approach |
|---------|----------|
| Auth | Session + Strategy Lab entitlement |
| Family B | Packages listed only for creator; peer access via share |
| Blobs / download | § Spec 7.5 — authed or short-lived signed only |
| Caps | Bots/package, byte size, rate limits |
| Injection | JSON only; free-text encode on all renders (R2) |
| Untrusted config | Pack schema validate before Curate insert (R1) |

---

## 12. Ops / env

No new required env for MVF if payload is MySQL JSON.  
Optional later: `LABS_BOT_PACKAGE_BLOB_ROOT` for filesystem/object storage (still served via authed/signed path).  
Signed URL secret: use existing Labs signing patterns (Mike) — fail loud if misconfigured when signed path enabled.

**Migration number:** next free at build time (as of Spec land, candidates start at **093** if 092 applied). Confirm with `migrations/` listing (D1).

---

## 13. Testing

See Spec §13 (T1–T14). Characterization tests under `server/tests/test_bot_marketplace.py` (target).

---

## 14. Implementation phases

| Phase | Milestone |
|-------|-----------|
| F0 | Docs + DL-244 gate + **DL-247 purpose** |
| F1 | Lane A plan↔bot map + entitled browse + provision |
| F2 | Lane A admin catalog/plan binding + webhook sync |
| F3 | Lane B Labs-member package + limited share + trust rules |
| F4 | Optional Community/Discord rail for Lane B (labs-scoped channels) |

---

## 15. Related decisions

| DL | Topic |
|----|--------|
| **DL-243** | Bot Marketplace Framework docs (F0) |
| **DL-244** | Gate close: single substrate, provenance, trust, download |
| **DL-247** | Purpose: monetize FatTail Lab Bots |
| **DL-249** | Navigators → Practice; Community segments; Visualize Practice-only |
| **DL-250** | Labs = separate membership; grandfather current Navigators |
| DL-235 | House + mint (private starters, not auto-share) |
| DL-237–242 | Community + Discord |
| DL-231 / DL-234 | Curate comparison perf — imported bots must not regress |

---

## 16. As-built status

**Not implemented** at doc write time. Convert to AS-BUILT when F2+ lands with evidence.
