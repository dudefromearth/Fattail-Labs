# FatTail Labs — Member Campaign Concept Spec v1.0

**Status:** **Product authority** (Coach 2026-08-08; review pass B1–B3 closed same day)  
**Type:** Product concept + architecture (Practice + Strategy Lab)  
**Authority:** DL-258 · DL-259 · DL-260 · DL-261 · DL-262 · permanence doctrine **OD-PB-7** (platform-wide)  
**Source of life-cycle language:** Strategy Life Cycle PDF (`LifeCycle.pdf`) — Development → Curation → **Live Campaign**  
**Not this document:** Marketing acquisition campaigns — see [Campaign Workflow Spec v1.0](./FatTail-Labs-Campaign-Workflow-Spec-v1.0.md). ActiveCampaign CRM sync is a different product word.

**Supersedes (locks):** Decision Addendum **OD-1.3** single-active campaign — via **DL-259** (not silent rewrite of the addendum). Phase 1 Own Spine v1.1 campaign MVP single-active language is **stale** until v1.2 / amendment (see §11 alignment checklist).

---

## 1. Positioning

**Campaign is a professional concept brought to retail level and made retail simple.**

Professionals structure live work inside a **campaign**: capital context, goals, what is being run, start and end, log, prune, learn. FatTail keeps that professional structure and presents it so a retail member can:

- Ignore it and still trade cleanly, or  
- Use one quiet campaign for everything, or  
- Grow into multiple campaigns and account splits when ready.

| Professional core (kept) | Retail simple (how we ship) |
|--------------------------|-----------------------------|
| Work happens *in a campaign* | Optional — never a gate |
| Capital / goals / multi-book | Optional fields; quiet until used |
| Deploy strategies *into* campaigns (Lab) | Suite process step labeled **Deploy** (verb); campaigns are the container |
| Multi-campaign per account | Available, not required |
| Import into a campaign | Available when the member chooses |
| Broker files have no campaign column | FatTail owns the concept; absence is valid |

**UX rule:** Never look like a wiki or a prop-firm ops console. Defaults are quiet; power is structural when the member grows into it.

---

## 2. Two products, one concept

**Practice** and **Strategy Lab** are separate entities. They share **no** apps, tables, nav chrome, or data planes.

The **concept of Campaign** exists in **both** — same idea (context of live work), different **mode**:

| | Practice (human) | Strategy Lab (automated) |
|--|------------------|---------------------------|
| Mode | Manual fills, process suite | Bots / strategy cards |
| Path | **`/app/practice/campaign`** | Campaign **entities** under Lab; board step **Deploy** |
| Wrong path | `/app/campaigns` (top-level cross-product app) | — |
| What you do | Trade and journal *in* a campaign context | **Deploy** curated strategies *into* campaigns |
| Tables | `member_practice_campaigns` (Family B) | Lab campaign / deployment domain (own schema; not Practice FKs) |

**Do not merge.** Homonyms are allowed. Coupling is not. Future “Lab campaign stamps a Practice campaign” requires a **separate OD**.

---

## 3. LifeCycle.pdf alignment (Strategy Lab)

### 3.1 Big picture

Development → Curation → **Live Campaign**.

### 3.2 Campaign Phase (container)

PDF Campaign Phase elements:

1. Strategies  
2. Capital allocation  
3. Start date  
4. Log  
5. Prune  
6. Retrospective  
7. End date  

That is the **campaign as container** — capital book, window, and group of work.

### 3.3 Deploy as process step (UI label)

Strategy Lab **renames the board process step** for that live stage to **Deploy** so most people hear a clear **verb** (put work into action).

| Term | Meaning |
|------|---------|
| **Deploy** (suite process step) | Board phase UI label for the live/campaign stage of the life cycle. API/DB phase key may remain `deployment`. **One product meaning of “Deploy” on the suite board.** |
| **Campaign** (entity) | Capital/context container strategies are **deployed into** (one or many). |
| **Deploy to Sim** | Inside **Development** only — simulation deployment, not Live Campaign board. Prefer phrase **“Deploy to Sim”** fully, never bare “Deploy.” |
| **Curation final review** | PDF Curation step 5. Prefer UI label **Approve** (or **Release**) when as-built allows — avoid a third bare “Deploy.” Until renamed, treat as *curation final-review gate*, not the suite Deploy phase. |

**Rule:** You **deploy into** campaigns. The suite nav process step is **Deploy**, not “Campaign.” Confusing the step with the container is a product error.

### 3.4 Suite nav (Strategy Lab)

**Design · Curate · Deploy · Archive**  
(Symbols hang under Design only.)

Canonical Deploy board URL: `/app/strategy-lab?phase=deployment`.  
`/app/strategy-lab/campaign` may host campaign **entity** management; it must not replace the Deploy process step.

---

## 4. Practice Campaign (human mode)

### 4.1 What it is

A **Practice Campaign** is optional structure for human trading:

- Context of work for a period of practice  
- Optional capital and goals  
- Optional binding to a Trade Log **account**  
- Optional links from trades and journal sessions (`practice_campaign_id`)  
- Optional playbook associations (season of practicing an identity — see Phase 1 Own Spine)

It is **not** a performance report, not P&L theater, and not required to use Trade Log or Reports.

### 4.2 Flexibility (member stories)

All of the following are first-class:

1. **Single campaign, never change it** — entire book under one campaign (or none).  
2. **Import from another platform** into an account, optionally onto a chosen campaign. Broker CSV/ToS has no campaign field — FatTail stamps only when the member (or import options) say so.  
3. **Several campaigns on one account** — e.g. three distinct campaigns in “IRA”.  
4. **Different campaigns on different accounts** — e.g. two campaigns on “Sim”, three on “Live”.  
5. **Unbound campaigns** (`account_id` NULL) — not limited to one account (see §4.6).  
6. **No campaign at all** — `practice_campaign_id` NULL on trades is valid forever.

### 4.3 Optional / never enforced (DL-261)

| Do | Don’t |
|----|--------|
| Offer create / list / activate / complete / abandon | Require a campaign to open an account |
| When the member creates a campaign, let them use it as the stamp prefill for that scope (most-recently-activated rule, §4.7) | Auto-create a campaign on every new account |
| Offer import *into* a selected campaign | Force every ToS/CSV import onto a campaign |
| Allow multiple `active` campaigns | Identity-wide “only one active” hard block |
| Leave trades and journal sessions unstamped | Block trading without an active campaign |

### 4.4 Suite nav and path (Practice)

- **Path:** `/app/practice/campaign`  
- **Nav:** peer of Trade Log, Reports, Journal, Retrospective, Playbook  
- **Not:** `/app/campaigns` as a top-level cross-product app  

Chrome on other Practice apps (especially Reports) must not host campaign CTAs, story strips, or process scorecards. Reports is objective book aggregate only (DL-257).

### 4.5 Lifecycle statuses and permanence

**Statuses:** `planned` · `active` · `completed` · `abandoned`  

Transitions remain domain-enforced; **multiple rows may be `active` simultaneously** (DL-259 supersedes OD-1.3 via decision log — not silent edit of the addendum).

**Permanence (same doctrine as Playbook OD-PB-7 — platform law, not playbook-local):**

| Situation | Allowed exit |
|-----------|----------------|
| Campaign has **zero stamps** — no trades with `practice_campaign_id`, no journal sessions with `practice_campaign_id`, no rows in `member_practice_campaign_playbooks` | **Hard-delete** allowed (`DELETE` API) |
| Campaign has **any** stamp or playbook link | **No hard-delete.** Only lifecycle exits: `completed` or `abandoned` (archive states already in the model) |

This is the **same permanence doctrine** as scrapbook books (draft discardable until first version; then archive-only). Campaign rows that hold member evidence must not leave dangling FKs on trades or journals. Domain returns **409** with a clear message if delete is attempted while referenced.

### 4.6 Unbound campaign semantics (`account_id` NULL)

- `account_id` set → campaign is scoped to that Trade Log account.  
- `account_id` NULL → **unbound**: not limited to one account; it is a candidate for **every** account filter.  
- When listing or resolving actives with `?account_id=N`: include (1) campaigns bound to N, and (2) unbound campaigns.  
- Prefill rule (§4.7) ranks **account-bound** ahead of unbound, then most recently activated.

### 4.7 Prefill / `GET …/campaigns/active` selection rule (deterministic)

Multiple actives are first-class. Convenience “single active” is **not exclusive**.

**Selection rule (must be identical for API and stamp/prefill UX):**

1. Candidates: `status = active`.  
2. If request/context has `account_id = N`: candidates = bound to N **or** unbound.  
3. Prefer **account-bound** over unbound.  
4. Then **most recently activated** (`activated_at DESC`, tie-break `id DESC`).  

UI when stamping a trade on an account with multiple actives: default picker to this selection; show remaining actives in the list.

**Column:** `activated_at` set when status transitions **into** `active`; cleared when leaving `active`. Migration **097**.

### 4.8 Schema (Practice) — as-built

**Table:** `member_practice_campaigns` (Family B, `identity_id`)

| Column | Role |
|--------|------|
| `title` | Member-facing name |
| `status` | Lifecycle |
| `activated_at` | Clock for prefill rule when active |
| `starts_at` / `ends_at` | Optional window |
| `account_id` | Optional FK → `member_trade_log_accounts`; NULL = unbound (§4.6) |
| `starting_capital` | Optional campaign book capital |
| `goals_md` | Optional member-authored goals. **Platform** prompts/placeholders use process language (Sacred #8). **Member text** is theirs — Sacred #8 governs Labs copy, not free-text goals. |
| `export_key` | Pack identity |

**Links:** `member_trade_log_trades.practice_campaign_id`, `member_journal_sessions.practice_campaign_id` (nullable).  
**Playbooks:** `member_practice_campaign_playbooks` (M2M).

**Migrations:** 093 (base) · 096 (account + capital + goals) · 097 (`activated_at`).

### 4.9 APIs (Practice)

| Method | Path | Notes |
|--------|------|--------|
| GET | `/api/me/practice/campaigns` | Full list; optional `account_id` for scoped `actives` |
| GET | `/api/me/practice/campaigns/active` | Convenience **one** active by §4.7 rule; also returns `actives` array |
| POST | `/api/me/practice/campaigns` | Create; optional scope/capital/goals; `activate` |
| PATCH | `/api/me/practice/campaigns/{id}` | Status, scope, capital, goals |
| DELETE | `/api/me/practice/campaigns/{id}` | **Only if unreferenced** (§4.5); else 409 |

### 4.10 Import / export (first-class JSON schema — not an afterthought)

**Normative machine schema:**  
[`Specs/schemas/practice-campaign-v1.json`](./schemas/practice-campaign-v1.json)  
(`$id`: `https://fattail.labs/schemas/practice-campaign-v1.json`)

| | |
|--|--|
| **Format** | `fattail.labs.practice_campaign` |
| **model_version** | **1.1** (1.0 = Phase 1 MVP fields only; 1.1 = full first-class pack) |
| **Pack surface** | Required entry in `member_export.surfaces` when present; empty `entries: []` is valid |

Campaigns are a **peer surface** to playbook / trade_log / journal_session — not a footnote on trade rows. Stamps on trades and journal sessions are **foreign keys by export_key** into this surface.

Third-party broker imports (ToS, CSV) **do not** invent campaigns. Member may choose target account and optional campaign; if omitted, trades land **unstamped**. Never fail import solely because campaign is missing.

**Document shape (normative; must validate against practice-campaign-v1.json):**

```json
{
  "format": "fattail.labs.practice_campaign",
  "model_version": "1.1",
  "exported_at": "…",
  "source": { "system": "fattail-labs" },
  "identity": { "export_subject": "self" },
  "entries": [
    {
      "id": "camp-…",
      "title": "…",
      "status": "planned|active|completed|abandoned",
      "starts_at": null,
      "ends_at": null,
      "activated_at": null,
      "account_export_key": "acct-12",
      "account_label": "Primary",
      "starting_capital": 50000,
      "goals_md": "…",
      "playbook_export_keys": ["pb-…"],
      "created_at": "…",
      "updated_at": "…"
    }
  ]
}
```

**Cross-surface stamps (same pack):**

| Surface | Field | When |
|---------|--------|------|
| `trade_log` trade object | `practice_campaign_export_key` | Non-null iff trade linked to a campaign; value = `entries[].id` |
| `journal_session` entry | `practice_campaign_export_key` | Non-null iff session stamped (OD-1.4); value = `entries[].id` |

**Import order (pack):** playbook → **practice_campaign** → trade_log → journal_session.  
After trade_log, importer **rebinds** campaign `account_export_key` / `account_label` if accounts now exist (campaign may import before accounts).

**Round-trip must preserve:** full entry fields (096 + activated_at + M2M), trade stamps, **and** journal session stamps. Missing journal campaign key when DB had a stamp is a pack defect.

**Gates:** “campaigns green” (e.g. OD-PB-8 / TD2) means: document validates against **practice-campaign-v1.json**, pack lists the surface, and round-trip preserves §4.10 fields — not “a campaign file exists.”
---

## 5. Strategy Lab Campaign (automated mode)

### 5.1 What it is

A **Strategy Lab Campaign** is the automated-mode counterpart: a capital/context group into which **Deploy** places curated strategies/bots. PDF: strategies, capital allocation, timeline, log, prune, retrospective, end.

### 5.2 Deploy vs Campaign

- **Deploy** = process step on the board (Design → Curate → **Deploy** → Archive).  
- **Campaign** = entity/container strategies are deployed **into**.  
- Multi-campaign Lab capital books may land after the Deploy board is solid; the **concept is normative now**.

### 5.3 Separation from Practice

No foreign keys between Lab campaign rows and `member_practice_campaigns`. Optional future product links require a **separate OD**.

---

## 6. Word disambiguation (Labs-wide)

| Word | Product | Spec |
|------|---------|------|
| **Member Campaign** (this doc) | Practice / Lab live capital context | **This spec** |
| **Marketing Campaign** | Acquisition workflow / landers | Campaign Workflow Spec v1.0 |
| **ActiveCampaign** | CRM lead sync | ActiveCampaign Lead Sync Spec |
| **Campaigns course** | Education product line | Course catalog |

---

## 7. Non-goals

- Enforcing campaign before trade or import  
- P&L / win-rate as hero metrics of a campaign  
- Shared Practice ↔ Lab campaign store  
- Top-level `/app/campaigns` app  
- Auto-adherence or auto-playbook from campaign  
- Marketing campaign factory features on member Campaign surfaces  
- Hard-delete of referenced campaigns  

---

## 8. Acceptance criteria (Delta-checkable)

1. Member can use Trade Log with **zero** campaigns.  
2. Member can create one campaign and optionally stamp trades.  
3. Member can create **multiple active** campaigns, including **more than one on the same account**.  
4. Member can scope campaigns to different accounts; unbound actives appear in every account’s candidate set.  
5. Import from ToS/CSV succeeds **without** a campaign; optional stamp only when chosen.  
6. Practice Campaign lives at **`/app/practice/campaign`**, not `/app/campaigns`.  
7. Strategy Lab suite shows **Deploy** as the process step; Deploy means into campaign context.  
8. Reports has **no** campaign CTAs or process scoreboards (DL-257).  
9. No shared DB FKs between Practice and Lab campaigns.  
10. **Permanence:** unreferenced campaign may hard-delete; once stamped or playbook-linked, only `completed`/`abandoned` — never hard-delete (409).  
11. **`GET …/campaigns/active`** is deterministic under §4.7 for a fixed `(identity, account_id, DB state)`.  
12. Pack round-trip restores campaign 096 fields, playbook M2M, trade **and** journal `practice_campaign_export_key`.  

---

## 8a. Upgrade safety (existing accounts & trades)

**Doctrine:** This upgrade is **additive and optional**. It must not break members who already have accounts, unstamped trades, stamped trades, or old campaign rows.

| Guarantee | How |
|-----------|-----|
| **No forced campaign** | Trades/journal with `practice_campaign_id` NULL remain valid forever |
| **No rewrite of fills** | Migrations **do not** UPDATE `member_trade_log_trades` or journal sessions |
| **No rewrite of accounts** | Migrations **do not** ALTER account rows or create default campaigns |
| **Existing campaign rows** | New columns are **NULL-able**; old rows keep title/status/dates/export_key |
| **Existing stamps** | FKs on trades/journals unchanged; cascade remains SET NULL / protected by permanence |
| **Multi-active** | Removes demotion of second actives on **new** imports only; existing DB rows untouched |
| **Export 1.0 consumers** | Still readable; 1.1 adds fields (additionalProperties / omit nulls OK) |
| **Import 1.0 packs** | Still commit (title/status/dates/playbook keys); missing 1.1 fields → NULL |
| **Import 1.1 on old hosts** | Requires migrate 096+097 first (fail loud if columns missing) |
| **Idempotent migrate** | 096/097 use information_schema guards — safe re-run |

**Operator order:** `python migrate.py` (apply 096, 097) → deploy API/web. Do not deploy import 1.1 writers before migrations on that host.

**Smoke after upgrade (Delta):**

1. Member with trades and **no** campaign still lists Trade Log and Reports.  
2. Member with an existing campaign still loads `/app/practice/campaign`.  
3. Existing `practice_campaign_id` on a trade still resolves (no orphan FK).  
4. Export pack includes `practice_campaign` surface (may be empty `entries`).  
5. Re-import of a **pre-1.1** `practice_campaign` document does not error.

---

## 9. As-built map (2026-08-08)

| Artifact | Role |
|----------|------|
| `migrations/093_practice_playbook_campaign.sql` | Practice campaign + trade/journal FKs |
| `migrations/096_practice_campaign_account_scope.sql` | `account_id`, `starting_capital`, `goals_md` |
| `migrations/097_practice_campaign_activated_at.sql` | `activated_at` for §4.7 |
| `server/practice_spine_domain.py` | Multi-active; delete permanence; prefill order |
| `DELETE /api/me/practice/campaigns/{id}` | Unreferenced hard-delete only |
| `web/app/app/practice/campaign/page.tsx` | Practice Campaign UI |
| `web/lib/practiceSuite.ts` | Suite nav → Campaign |
| `web/lib/strategyLabSuite.ts` | Suite nav → **Deploy** |
| `Architecture/00-decision-log.md` | DL-257–263 |
| `Specs/schemas/practice-campaign-v1.json` | **First-class** machine schema (model 1.1) |
| `Specs/FatTail-Labs-Member-Practice-Export-Spec-v1.4.md` | Pack/export authority for campaign surface |
| `export_domain.build_practice_campaign_document` | Full field export |
| `import_domain.commit_practice_campaign` | Multi-active + 096/097 fields; account rebind |

---

## 10. Related documents

| Doc | Relation |
|-----|----------|
| [Trader Development Phase 1 Own Spine v1.1](./FatTail-Labs-Trader-Development-Phase-1-Own-Spine-v1_1.md) | Playbook + campaign MVP; **single-active superseded** — bump v1.2 or § amendment (checklist §11) |
| [Decision Addendum v1.1](./FatTail-Labs-Trader-Development-Decision-Addendum-v1_1.md) | OD-1.3 superseded by DL-259 — amend to v1.2 |
| [Playbook Scrapbook Presentation v1.1a](./FatTail-Labs-Playbook-Scrapbook-Presentation-v1_1a.md) | OD-PB-7 permanence pattern; campaign keeps trade FKs |
| [Trade Log Spec v1.1](./FatTail-Labs-Trade-Log-Spec-v1.1.md) | Accounts, import, `practice_campaign_id` |
| [Member Practice Export](./FatTail-Labs-Member-Practice-Export-Spec-v1.3.md) | Pack surfaces — bump when §4.10 schema lands in export code |
| [Strategy Lab Life Cycle](./Strategy-Lab-Life-Cycle-Architecture-v1.1.md) | Develop / curate / campaign language |
| [Strategy Lab Architecture Design](./Strategy-Lab-Architecture-Design-v1.0.md) | Design · Curate · Deploy labels |
| [Campaign Workflow Spec v1.0](./FatTail-Labs-Campaign-Workflow-Spec-v1.0.md) | **Marketing** only |
| LifeCycle.pdf | Source diagram for Campaign Phase |

---

## 11. Documentation parity checklist (Invariant #6 — lands with this body of work)

| Item | Owner action | Status |
|------|--------------|--------|
| DL-258–262 in `Architecture/00-decision-log.md` | Confirm present | Landed |
| Decision Addendum **OD-1.3** → multi-active via DL-259; addendum **v1.2** or normative § pointing here | Alpha/docs | **Open** — must not stay “later” |
| Phase 1 Own Spine v1.1 §2.2 / campaign MVP “two actives blocked” → v1.2 or amendment note | Alpha/docs | **Open** |
| Practice Export Spec **v1.4** + `schemas/practice-campaign-v1.json` + export/import 1.1 | Alpha | **Landed** with this body of work |

| Playbook scrapbook pack “campaigns green” reads §4.10 as completeness | Gate writers | Reference this § |

---

## 12. Document history

| Date | Note |
|------|------|
| 2026-08-08 | v1.0 — Coach product authority: professional concept, retail simple; dual mode; Deploy vs container; optional multi-campaign (DL-258–262) |
| 2026-08-08 | v1.0 review close — B1 permanence (OD-PB-7 platform-wide); B2 prefill rule + `activated_at`; B3 pack yaml (trades + journal + 096 + M2M); S1–S5 wording; §11 parity checklist |
