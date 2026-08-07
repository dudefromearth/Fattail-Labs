# Dual subdomain future — Practice vs Labs

**Status:** **FUTURE DIRECTION ONLY** — not a current implementation program  
**Decisions:** **DL-248** · **DL-249** · **DL-250**  
**Date:** 2026-08-07  

### Read this first

| Is | Is not |
|----|--------|
| Coach **intent** for a **future** product structure | Something to **build or cut over now** |
| A **design constraint** for new Specs/features (so we do not paint into a corner) | As-built architecture of production today |
| Independent **Practice** vs **Labs** products, memberships, Community segments | Live DNS, nav, or plan-key split |

**Current system remains:** single host `labs.fattail.ai`, unified Apps hub, Navigator includes today’s full suite (including Strategy Lab) until a **future** cutover Spec + membership amend + Foxtrot edge plan explicitly ship.

When designing Marketplace, Visualize AI, Community, Strategy Lab, and membership work **now**, prefer seams that can later map to Practice vs Labs without a rewrite — but **do not** implement the split prematurely.

---

## 1. Intent

Today FatTail is a **single surface** at `labs.fattail.ai` that mixes trader practice/education and bot build/deploy.

**Future target (not yet scheduled):** two subdomains, two **products** (each with membership), **clear homes**, and **segmented Community**.

```text
                    fattail.ai  (brand · membership commerce / WooCommerce)
                           │
           ┌───────────────┴───────────────┐
           ▼                               ▼
 practice.fattail.ai                 labs.fattail.ai
 Become a better trader              Build & deploy bots
 Navigator membership (default)      Labs membership (separate product)
 Full coaching + education suite     OA-class automation wedge
```

---

## 2. Subdomain jobs

| Subdomain | Audience | Job | Competitive frame |
|-----------|----------|-----|-------------------|
| **`practice.fattail.ai`** | Traders (**Navigator** membership) | Skill, process, habits, coaching suite | Courses / practice / coaching platforms |
| **`labs.fattail.ai`** | Bot builders (**Labs** membership) | Design → Curate → Deploy, FatTail Lab Bots marketplace | **Option Alpha–class** tools (Arch 16 doctrine) |

**Shared:** brand ethos, identity, commerce on fattail.ai, optional shared API.  
**Separated:** chrome, app catalog, default URLs, **Community channel access**, bot runtime, **membership SKUs**.

---

## 3. Membership model (Coach · DL-249 · DL-250)

### 3.1 Two products, two membership types

| Product | Membership (target) | Grants |
|---------|---------------------|--------|
| **Practice** | **Navigator** (and Observer trial as Practice parity) | Full coaching + trader education suite on `practice.fattail.ai` |
| **FatTail Labs** | **Labs** membership (own plan/SKU — name exact later) | Bot build/deploy, Strategy Lab, Marketplace on `labs.fattail.ai` |

| Rule | Detail |
|------|--------|
| **M-MEM-1** | **Labs is a separate product** with its **own membership type** — not implied by Navigator alone (DL-250). |
| **M-MEM-2** | A member may hold **Practice only**, **Labs only**, or **both** (independent entitlements). |
| **M-MEM-3** | WooCommerce sells each product; Labs webhooks map to distinct plan keys. |

### 3.2 Navigator home = Practice

| Rule | Detail |
|------|--------|
| **M-NAV-1** | **Navigator membership** grants **Practice** (coaching + education suite). |
| **M-NAV-2** | **Future Navigators** do **not** automatically get Labs; they must **purchase Labs** membership separately (DL-250). |
| **M-NAV-3** | **Observer trial** remains **Navigator feature parity for 6 weeks** (DL-128) → **Practice** suite, not Labs, unless a plan explicitly bundles Labs. |

### 3.3 Grandfather current Navigators (DL-250)

| Rule | Detail |
|------|--------|
| **M-GF-1** | **Current Navigators** (active Navigator membership as of cutover) are **grandfathered** into Labs. |
| **M-GF-2** | Grandfathering is done by **granting a new Labs membership** on their identity (not by silently widening Navigator forever). |
| **M-GF-3** | After cutover, that Labs membership may renew/expire per product policy (define in Membership Spec: complimentary forever vs term-bound). |
| **M-GF-4** | **Future** Navigators who join after cutover: **Practice only** until they buy Labs. |

### 3.4 Access matrix (target)

| Actor | practice.fattail.ai | labs.fattail.ai |
|-------|---------------------|-----------------|
| Free no-plan | Limited / previews as today | No |
| **Observer trial** | **Yes** (Practice / Navigator parity) | No (unless bundled) |
| **Navigator (future)** | **Yes — home** | **Only if Labs membership purchased** |
| **Navigator (current, grandfathered)** | **Yes** | **Yes** (via granted Labs membership) |
| **Labs membership only** | Optional / none unless also Navigator | **Yes — home** |
| **Both memberships** | Yes | Yes |
| Administrator | Ops as needed | Ops as needed |

**Open (Coach later):** exact plan keys (`navigator`, `labs`, …); Activator; whether grandfather Labs is complimentary permanent or term-limited; Observer + Labs add-on.

---

## 4. Community — shared product, segmented channels (Coach · DL-249)

Both Practice and Labs members use **Community**, but **not the same channels**.

| Rule | Detail |
|------|--------|
| **M-COM-1** | Community exists for **both** subdomains (second window on Discord remains the model). |
| **M-COM-2** | **Access control is segmented by channel**: a channel is tagged for **Practice**, **Labs**, or **both** (shared). |
| **M-COM-3** | Practice-entitled members see/post only channels allowed for Practice (+ shared). |
| **M-COM-4** | Labs-entitled members see/post only channels allowed for Labs (+ shared). |
| **M-COM-5** | Members entitled to **both** products see the union of allowed channels. |
| **M-COM-6** | Discord maps 1:1 to Labs Community channel rows as today; **segment filter is an additional gate** before read/post. |
| **M-COM-7** | App embeds (e.g. practice panel vs labs panel) open only channels in that product’s segment. |

### 4.1 Channel model (target)

```text
community_channels
  + product_scope: practice | labs | shared
  + discord_channel_id (as today)
```

| Scope | Example use |
|-------|-------------|
| `practice` | General trader process, Practice app home, Toughness, coaching discussion |
| `labs` | Strategy Lab process, bot catalog discussion, deploy ops (no profit theater) |
| `shared` | Rare cross-cutting (e.g. brand announcements) — use sparingly |

**Admin** assigns scope when creating/mapping channels (`/admin/community` extended).

### 4.2 Enforcement sketch

```text
request to read/post channel
  → require_session
  → resolve product entitlements: { practice?, labs? }
  → channel.product_scope must match
       practice → need practice entitlement
       labs     → need labs entitlement
       shared   → need practice OR labs
  → existing Discord link rules for posting
```

---

## 5. App ownership (target)

### 5.1 practice.fattail.ai (Navigator membership home)

| Domain | Examples |
|--------|----------|
| Learning | Courses, pathway, live, resources, wiki |
| Practice stack | Trade log, journal, retrospectives, reports, playbook |
| Capacity | Toughness / FatTail Hard |
| Community | **Practice + shared** channels only |
| **Visualize AI** | **Exclusive to Practice** (DL-249) — structure literacy for traders |

### 5.2 labs.fattail.ai (Labs membership home)

| Domain | Examples |
|--------|----------|
| Strategy Lab | Design · Curate · Deploy · Archive · Symbols |
| Marketplace | Admin FatTail Lab Bots for **Labs members** (DL-247) |
| Peer bot packages | Limited share among **Labs membership** peers |
| Community | **Labs + shared** channels only |
| Runtime | Marks stream, packs, broker rails |

**Visualize AI is not a Labs feature** in the target world.

---

## 6. Visualize AI (Coach · exclusive to Practice)

| Rule | Detail |
|------|--------|
| **M-VIZ-1** | Visualize AI ships and lives on **`practice.fattail.ai` only**. |
| **M-VIZ-2** | Access = **Practice** entitlement (Navigator / Observer trial suite). |
| **M-VIZ-3** | No Visualize AI chrome or routes as a Labs-primary product. |

Until cutover, Spec may still list path `/app/visualize-ai` on the current host; home subdomain is **Practice**.

---

## 7. Marketplace implications (DL-247 + DL-249 + DL-250)

| Topic | Rule |
|-------|------|
| Who buys commercial FatTail Lab Bots | Holders of **Labs membership** (purchased or **grandfathered**) |
| Future Navigators | Practice only until they **buy Labs** |
| Current Navigators | Grandfather **Labs membership** grant at cutover |
| Peer package share | Labs membership only |

---

## 8. As-built today (authoritative until cutover)

| Fact | Today |
|------|--------|
| Host | **`labs.fattail.ai` only** |
| Navigator | Full stack including Strategy Lab — **no separate Labs membership** |
| Community | Channels without Practice/Labs product_scope |
| Visualize AI | Spec only; path under current Labs host when built |
| Marketplace | Spec only; commercial intent for later Labs product |

**Do not treat this document as a build order.** No split, grandfather batch, or Labs SKU is required for near-term feature work unless Coach opens a cutover project.

---

## 9. Anticipatory design (how to build *now* without implementing the split)

When authoring Specs and code **before** cutover, prefer:

| Seam | Why |
|------|-----|
| **Product entitlement keys** (e.g. `practice`, `labs`) in access control / plan map | Later host can require one or both without rewiring every route |
| **Channel `product_scope`** (or nullable scope defaulting to “all”) on Community | Can stay `shared`/`all` until segment day |
| **Feature home tags** in Specs (`home: practice \| labs \| both`) | Visualize → practice; Marketplace/Strategy Lab → labs |
| **Membership grants as rows** (plan/membership type), not hard-coded “Navigator means everything” | Enables grandfather Labs membership without forever bloating Navigator |
| **Avoid** baking “Navigator only” into Labs Marketplace peer share | Use “Labs-entitled” language already (membership key TBD) |

Near-term implementations may still gate with today’s roles/plans; leave a clear map to future keys in Spec notes.

---

## 10. Future implementation horizon (when Coach opens the program)

Not a schedule — ordered work **if and when** the split project starts:

| Phase | Work |
|-------|------|
| **H0** | Intent locked (this doc + DL-248/249/250) |
| **H1** | Membership Spec: Labs plan key; Navigator ≠ Labs; grandfather design |
| **H2** | WooCommerce Labs SKU + webhook |
| **H3** | Community `product_scope` + gates |
| **H4** | Edge: hosts, cookies, SSO |
| **H5** | Cutover + grandfather batch |
| **H6** | Chrome/nav split; Marketplace Labs-only; Visualize Practice-only |

---

## 11. Related

| Doc | Relation |
|-----|----------|
| Community Spec / `docs/Community-Chat-Discord-Second-Window.md` | Channel map + Discord SoR; segment gate adds on top |
| Visualize AI Spec | Future home = Practice; access = Practice suite |
| Marketplace Spec | Future Labs **membership** monetization |
| Membership / Identity Specs | Future amend for Labs plan + grandfather |
| DL-128 / DL-194 | Observer trial ≡ Navigator features for 6 weeks (maps to Practice suite later) |
| Arch 16 | OA wedge on **labs** host (future) |

---

## 12. One-line summary

**Future intent: Navigator = Practice coaching; Labs = separate paid membership for bots (grandfather current Navigators); Community segmented; Visualize AI on Practice — design for this later; do not implement the split now.**
