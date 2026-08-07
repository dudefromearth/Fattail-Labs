# FatTail Labs — Trader Development Phase 1
## Own Spine — Playbook · Campaign · Adherence

**Status:** **BUILD AUTHORITY** (Coach GO 2026-08-07 · DL-254) — implement after TD0-G  
**Supersedes:** v1.0 (2026-08-07 draft) — all v1.0 content preserved; deltas in §12  
**Type:** Product addition + **architectural change** (new Family B Practice objects)  
**Horizon:** ~3–6 weeks  
**Value / Effort / Risk:** Highest / Medium / Low–Medium  
**Parent:** [Trader Development Roadmap v1.1](./FatTail-Labs-Trader-Development-Roadmap-v1_1.md)  
**OD authority:** [Decision Addendum v1.1](./FatTail-Labs-Trader-Development-Decision-Addendum-v1_1.md)
**As-built contracts:** Trade Log Spec **v1.1** (trades/legs/accounts, adherence enum, `entry_source` catalog) ·
Tag Manager **v0.3** (`playbook_entry` object type already specified) · Practice Context **v0.2** ·
Member Practice Export **v1.3** · Strategy Lab Life Cycle **v1.1** + Development Phase Spec **v1.0**
(as-built UI labels: **Design · Curate · Deploy · Archive**) · Campaign Workflow Spec (**acquisition — explicitly out of scope**)
**Doctrine:** Playbook is the **person's rules**, not a setup catalog · Trade Log stays evidence, not hero · Family B absolute · fail loud

---

## 1. Goal statement

Phase 1 ships the Own spine at MVP depth: a member can write down **who they are under risk**
(Playbook), open a **season of practicing that identity** (Campaign), and mark every fill
against the covenant (**adherence vs playbook**). This is the category claim — no journal
competitor owns character → season → evidence. It is deliberately *not* trade development:
no backtester, no rule engine, no edge optimizer. The smallest complete design is a durable
Playbook SoR, a campaign container with a real lifecycle, optional links from trades to both,
and filters that answer: *"What did I do in this season, against this book?"*

| Object | Trader-development meaning |
|--------|----------------------------|
| **Playbook** | Who I am under risk — rules I will not break |
| **Campaign** | A season of practicing that identity |
| **Adherence link** | Did I keep the covenant on this fill? |

---

## 2. User journeys

### 2.1 Happy path — opening a season

1. Member opens `/app/playbook` (stub replaced). Creates entry "0DTE Butterfly rules":
   title + body (rules, structure intent, size constraints). Tags it `discipline`
   (`object_type=playbook_entry` — already in TM v0.3).
2. Creates a Campaign: "September season", status `planned`, window 9/1–9/30, scoped to
   that playbook entry. Activates it → status `active`.
3. Practice chrome now shows the **active campaign badge** beside account/date.
4. Logs a trade; the sheet defaults `practice_campaign_id` to the active campaign
   (removable); optionally links the playbook entry. Adherence prompt reads:
   **"Against your playbook: followed / partial / broke?"**
5. Blotter filters by campaign → sees only the season's evidence.
6. At window end, member marks the campaign `completed`. (Season *review* is Phase 3.)

### 2.2 Failure paths

| Failure | Required behavior |
|---------|-------------------|
| Trade links to a playbook entry the caller doesn't own | 404/403 by identity scope — FK + query constraint, fail loud |
| Campaign dates invalid (`ends_at < starts_at`) | 422 with reason |
| Deleting/archiving a playbook entry with linked trades | **Archive only** (status flip); links remain readable — never orphan or cascade-delete member evidence |
| Two campaigns `active` | **Blocked** — single active only (OD-1.3 locked); activating another completes/abandons or 422 |
| Import replays a pack containing campaign/playbook keys | Additive, idempotent by `export_key`; never duplicated |

---

## 3. In / out of scope

| Item | Mode | v1 |
|------|------|----|
| Playbook CRUD + archive, tags, export keys | Own | Yes |
| Campaign lifecycle (planned/active/completed/abandoned) | Own | Yes |
| Trade → playbook / campaign links + blotter filters | Own | Yes |
| Practice Context: active-campaign badge | Own | Yes |
| Adherence copy vs playbook | Own | Yes |
| Export Spec bump (v1.4) for both objects | Reliability | Yes (or documented 1.1 follow-up — OD-1.5) |
| Live rule engine, auto-block orders | Refuse (theater) | Never as auto-enforcement |
| Strategy Lab pack compile from playbook | — | No (bridge only, §6) |
| P&L by setup / edge stats | Refuse | Never |
| Broker sync, charts | Match | Phase 2 |
| Auto-adherence AI | — | Phase 4 gated |
| Marketing campaigns / ActiveCampaign | — | Out — different spec, different word |

---

## 4. Product design

### 4.1 Playbook v1 — `/app/playbook`

| Capability | v1 scope |
|------------|----------|
| List / create / edit / **archive** entries | Yes (`status: active \| archived`; no hard delete once linked) |
| Title + `body_md` | Yes — the member's language is the product |
| Optional light structured fields | `asset_class?`, `structure_codes?[]` (Trade Log strategy catalog codes), `default_risk_note?` — **all optional, none validated against markets**. Anything heavier is Refuse-class |
| Tagging | TM v0.3 `playbook_entry`; assign-only |
| Export/import | Portable `export_key`s (§7) |
| Empty state | Teaches the object: "Your playbook is who you are under risk — the rules you will not break." (Tango) |

**Non-goals v1 (kept from v1.0):** live rule engine, auto-block, Strategy Lab compile, P&L by setup.

### 4.2 Campaign v1

Time-bounded **practice season**. Not marketing (Campaign Workflow = acquisition), and not
the Strategy Lab Deploy phase (§6).

| Field | Purpose |
|-------|---------|
| `title` | Member language |
| `status` | `planned · active · completed · abandoned` — transitions logged with timestamps |
| `starts_at` / `ends_at` | Season window; `ends_at` nullable (open-ended active allowed) |
| Playbook scope | 0..n entries via M2M (`member_practice_campaign_playbooks`) — "only these rules this season" |
| `identity_id` | Family B |
| `export_key` | Portability |

**Lifecycle rules:** `planned→active→completed`; `abandoned` reachable from planned/active;
completed/abandoned are terminal (no silent reopen — audit posture; reopen = new season).

### 4.3 Links & filters

| Link | Behavior |
|------|----------|
| Trade → playbook entry | Optional on create/edit (sheet control near adherence) |
| Trade → campaign | Optional; **defaults to active campaign**, one-tap removable — a default is a suggestion, never a silent claim |
| Journal session → campaign | **OD-1.4 LOCKED** — optional `practice_campaign_id` on journal session; default-suggest active campaign, removable; seasons incomplete if only fills count |
| Blotter filters | By campaign · by playbook entry · by tag (Phase 0) — composable |
| Chrome | Active-campaign badge in Practice context strip |

**Active campaign cardinality (OD-1.3 LOCKED):** at most **one** `active` campaign per
identity. Enforced server-side.

### 4.4 Adherence vs playbook

Enum unchanged (`followed · partial · broke · unknown` — shared with Journal, Trade Log v1.1
§4.4). When a playbook entry (direct or via active campaign scope) is in context, prompt copy
becomes "**Against your playbook:** …". No auto-scoring in v1 — manual is honest and low risk.

---

## 5. Architecture

### 5.1 New Family B stores

```text
member_playbook_entries
  id, identity_id, title, body_md, structured_json NULL,
  status ENUM(active,archived), export_key, created_at, updated_at

member_practice_campaigns
  id, identity_id, title,
  status ENUM(planned,active,completed,abandoned),
  starts_at NULL, ends_at NULL, export_key, created_at, updated_at

member_practice_campaign_playbooks
  campaign_id FK, playbook_entry_id FK  (both identity-checked on write)

member_trade_log_trades
  + playbook_entry_id BIGINT NULL FK
  + practice_campaign_id BIGINT NULL FK
```

Migrations filename-ordered per platform rule; exact numbers in the implementation seed.
**Fail loud** on any cross-identity FK write (server-side identity check, not FK alone).

### 5.2 API (session + Practice gate, identity-scoped — same entitlement as Trade Log/Journal)

| Method | Path | Purpose |
|--------|------|---------|
| GET/POST | `/api/me/playbook/entries` | List/create |
| GET/PATCH | `/api/me/playbook/entries/{id}` | Read/edit/archive (status flip) |
| GET/POST | `/api/me/practice/campaigns` | List/create |
| PATCH | `/api/me/practice/campaigns/{id}` | Edit + status transitions (validated) |
| existing | `/api/me/trade-log/trades*` | Accept/return the two nullable link fields; blotter list accepts `campaign_id=` / `playbook_entry_id=` filters |

### 5.3 Practice Context extension

Campaign joins the shared chrome as an **optional third context** — with a scoping rule the
v0.2 doctrine forces us to state: like adherence and journal conversation, **campaign is
trader-level, not account-scoped** (the season is the trader's regardless of which book the
fills land in). Badge shows active campaign; absence shows nothing (no nag). Persistence
follows the account/date preference pattern.

### 5.4 Entitlement

Same Practice gate as Trade Log/Journal (Observer trial / Navigator). No new SKU (Phase 4
territory). Fails closed.

---

## 6. Strategy Lab boundary (the naming question — with research)

**Finding (as-built, Development Phase Spec v1.0):** Strategy Lab's member-facing board labels
are now **Design · Curate · Deploy · Archive**. "Campaign" is PDF/internal language for the
Deploy phase — members do not see a "Campaign" column in the Lab. The collision risk v1.0
§4.3 worried about is therefore **lower than drafted**, but not zero: Lab lifecycle docs,
coach language, and any Deploy-phase copy may still say "campaign."

| Option | Shape | Tradeoff |
|--------|-------|----------|
| **A — Separate objects, one member word (recommended)** | Practice owns `member_practice_campaigns`; SL Deploy runtime keeps its own campaign entity; member-facing word "Campaign" belongs to **Practice only**; SL UI keeps "Deploy" | Clean SoRs; no cross-domain FK; requires copy discipline in SL |
| B — Linked objects | SL Deploy instance may reference a practice campaign id ("this deployment runs inside my September season") | Nice story; adds a cross-surface dependency before either side is proven |
| C — Shared object | One campaign table serves both | Violates smallest-complete-design; couples Practice Family B store to Lab runtime; **not recommended** |

**Invariant (kept from v1.0):** the member never maintains two unrelated "campaign" concepts
without UI explanation.

**OD-1.1 LOCKED — Option A.** Practice owns member-facing “Campaign.” Strategy Lab UI keeps
Deploy. Option B (nullable SL → practice campaign link) may be added later without migration
pain; Option C rejected.

---

## 7. Portability (Export Spec v1.4 candidate) — OD-1.5 LOCKED

**Portability green before Phase 2 exit.** Prefer ship in Phase 1; residual must hard-gate
before TD2-G.

- `fattail.labs.playbook` — real entries (beyond stub notes): id/export_key, title, body_md,
  structured_json, status, tags-by-assignment (existing tag export path).
- `fattail.labs.practice_campaign` — campaigns + playbook-scope links by export_key.
- Trade and journal session campaign/playbook links travel by export_key, not row id.
- Import: **additive only**; idempotent on export_key; at most one active campaign after import
  (demote surplus active → completed/interrupted-style demotion with warning).

---

## 8. Reliability invariants

| ID | Invariant |
|----|-----------|
| R-1.1 | Family B: no cross-identity read/write on any new table; isolation tests in same change (Kilo) |
| R-1.2 | Links are nullable and survivable: archiving a playbook entry or completing a campaign never mutates or hides trades |
| R-1.3 | Status transitions validated server-side; invalid transition = 422, never silent coercion |
| R-1.4 | Campaign default on trade create is visible and removable pre-save — no silent attribution of evidence to a season |
| R-1.5 | Export round-trip for both objects + links is additive and idempotent |
| R-1.6 | No new score store: campaign carries **no** computed adherence/P&L columns — Reports derives (DS-2 pattern) |
| R-1.7 | Entitlement fails closed (observer without trial → 403 + membership CTA, matching Trade Log) |

---

## 9. Acceptance criteria (Delta-checkable)

1. `/app/playbook`: create, edit, archive an entry; tag it; archived entries leave pickers but stay readable on linked trades. (UI + curl)
2. Campaign: full lifecycle planned→active→completed; invalid transitions 422. (curl)
3. Active campaign badge appears in Practice chrome on all Practice surfaces; absent when none active. (UI walk)
4. New trade defaults to active campaign, removable before save; saved link visible in sheet + blotter chip. (UI walk)
5. Blotter filter by campaign returns exactly the linked trades; composes with tag + date filters. (curl + fixture)
6. Adherence prompt copy switches to "Against your playbook:" when a playbook is in scope. (UI walk, Tango-approved copy)
7. Cross-identity link attempt fails loud. (pytest)
8. Export→purge→import round-trips playbook entries, campaigns, scopes, and trade links exactly once. (pytest) — or OD-1.5 documents the 1.1 follow-up gate before Phase 2 completes.
9. Nothing on any surface correlates playbook/campaign with P&L or win rate. (UI walk)
10. Characterization suite green; new tests landed in same change.

---

## 10. Dependencies & sequencing

| Item | Note |
|------|------|
| Phase 0 Tags UX | Strongly preferred first (labeling habit feeds season filters) |
| OD-1.1 (SL boundary) | Decide before migration lands — table shape is identical for A/B, so design work can proceed |
| TM v0.3 `playbook_entry` | Already specified — consume |

## 11. Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Two "campaign" meanings | §6 Option A single-owner word + SL copy check |
| Scope creep into process runtime | v1 = container + links only (§3 Refuse rows) |
| Export lag | OD-1.5 explicit gate: portability green before Phase 2 exit |
| Playbook becomes setup catalog | §4.1 structured fields optional + unvalidated; Tango empty-state copy anchors "person's rules" |

---

## 12. v1.0 → v1.1 ideas inventory (nothing silently dropped)

| v1.0 item | Disposition |
|-----------|-------------|
| Playbook v1 capabilities table | Kept; structured fields concretized (optional-only); archive semantics hardened |
| Campaign fields + statuses | Kept; lifecycle transition rules added |
| Trade↔playbook↔campaign links + filters | Kept; default-visible/removable rule added (R-1.4) |
| Adherence copy enhancement | Kept verbatim |
| §4.1 illustrative tables | Kept, promoted to normative-with-seed-detail |
| §4.3 SL bridge "weekend arch" | Kept, **elevated to OD-1.1 with as-built research + options** — not resolved unilaterally |
| Export bump v1.4 | Kept; OD-1.5 formalizes the 1.1 fallback Coach's draft allowed |
| Entitlement (no new SKU) | Kept |
| All v1.0 out-of-scope + risks | Kept |

## 13. Open decisions — **RESOLVED** (Decision Addendum v1.1)

| # | Lock |
|---|------|
| OD-1.1 | **Option A** — Practice owns “Campaign”; SL Deploy separate |
| OD-1.2 | **Ship three optional** structured fields (unvalidated) |
| OD-1.3 | **Single** active campaign |
| OD-1.4 | **Journal campaign stamp in Phase 1** (optional, default-suggest) |
| OD-1.5 | **Export green before Phase 2 exit** (prefer in-phase) |

See [Decision Addendum](./FatTail-Labs-Trader-Development-Decision-Addendum-v1_1.md).

## 14. Decision-log entry (draft, on approval)

> **Phase 1 Own Spine:** Playbook and Practice Campaign land as Family B SoRs
> (`member_playbook_entries`, `member_practice_campaigns` + M2M scope), with nullable trade
> links, blotter filters, active-campaign Practice context, and adherence-vs-playbook copy.
> Campaign is trader-level, the member-facing word "Campaign" is owned by Practice
> [per OD-1.1], and Strategy Lab's Deploy phase remains a separate surface. No rule engine,
> no auto-scoring, no P&L by setup. Export keys portable [per OD-1.5]. No profit claims.
> Family B unchanged.

## 15. Agent Bench

| Artifact | Path |
|----------|------|
| Phase bench plan | [`Docs/Trader-Development-Phase-1-Agent-Bench-Plan.md`](../Docs/Trader-Development-Phase-1-Agent-Bench-Plan.md) |
| Full program plan | [`Docs/Trader-Development-Full-Agent-Bench-Plan-v1.0.md`](../Docs/Trader-Development-Full-Agent-Bench-Plan-v1.0.md) |
| Board | [`agents/p-trader-development/`](../agents/p-trader-development/) |
| Decision addendum | [`FatTail-Labs-Trader-Development-Decision-Addendum-v1_1.md`](./FatTail-Labs-Trader-Development-Decision-Addendum-v1_1.md) |

Gate prefix: **TD1-***. Prerequisite: **TD0-G** PASS.

---

## 16. Document history

| Date | Note |
|------|------|
| 2026-08-07 | v1.0 draft (Coach/Grok) |
| 2026-08-07 | v1.1 Claude first pass — journeys, lifecycle rules, SL research + OD-1.1, invariants, acceptance |
| 2026-08-07 | v1.1a — OD locks + Agent Bench links (Decision Addendum) |
