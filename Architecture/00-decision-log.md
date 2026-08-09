# FatTail Labs — Architecture Decision Log

Append-only. Each entry: date, decision, rationale. Reversals get a new entry, never an edit.

---

## 2026-08-09 — DL-272 Admin "Flow" — aggregate member journey (Sankey + drop-off)

**Decision:** New admin view (`/admin/flow`, nav after Users) answering "where do
members naturally flow, and where do they drop off." Read-only, admin-only. Data =
existing `page_views` (no migration): sessionised per member on the same 30-min gap as
the Users view (`activity.SESSION_GAP_SECONDS`), granular paths mapped to ~15 readable
**areas** (`flow.area_for`, longest-prefix; unknown paths fall back to a titleised
segment so new routes surface instead of being dropped). All aggregation is pure in
`server/flow.py`; `routes/flow_admin.py` only fetches rows + applies the date-window
(7/30/90/all) and tier (all/paid/free, paid via the same active-membership rule as the
billing view) filters. Endpoint: `GET /api/admin/flow`.

**The visual (hero = Sankey):** a **step-based** behavior-flow — column N = the Nth page
of a session. Sessions that end are carried into a growing grey **"Left"** lane along the
bottom, so every column is the same height (all sessions) and drop-off reads as the
widening grey band. Balance invariant the frontend depends on and a test locks: for every
step with a next column, `node[i][A] == Σ_B link[i][A→B] + exit[i][A]`. Below the Sankey:
a **drop-off table** (per area: reached / left-here / exit-rate, sorted by exits) and the
**top journeys** (ordered area paths). Hand-rolled SVG Sankey — no chart lib.

**Verified locally** on seeded synthetic journeys (7/7 `test_flow.py` incl. the balance
invariant; visual confirmed in-browser — funnel narrows 79→66→41→14→10, grey "Left" lane
grows, panels populate). Meaningful only on **production** traffic; local `page_views` is
otherwise empty. Spec: `FatTail-Labs-User-Flow-Spec-v1.0`. Status: implemented + locally
verified; pending live deploy to MiniTwo.

## 2026-08-09 — DL-271 Help concierge — optional topic (AI auto-classifies)

**Decision:** The help topic dropdown is now **optional**. If a member submits without
picking one, the concierge classifies the message into `bug` | `struggling` | `general`
itself (new `"topic"` field in the JSON answer contract; `help_ai.answer` always returns
it, defaulting to `general`). `routes/help.py` writes the AI's topic back onto the
question row when none was chosen, so admin filtering/counts stay accurate. Removes a
point of friction (members shouldn't have to categorise their own problem) without losing
the categorisation the admin side needs. No migration. Verified locally (submit with no
topic → 200, auto-tagged `bug`; 14/14 help tests pass). Folded into the help concierge
work; pending the same MiniTwo deploy as DL-270.

## 2026-08-09 — DL-270 Help concierge v1.1 — inactivity close, proactive human, feedback

*(Renumbered from DL-254 on rebase — origin concurrently took DL-254 for the Trader
Development program. This is the member help concierge v1.1.)*

**Decision:** Member chat improvements on top of the concierge (DL-253); core
answer/guardrail/escalation unchanged. (1) **Inactivity auto-close** — bot-handled
chats warn at 4 min idle and close at 5 min via `POST /api/help/questions/{id}/close`
(`closed_reason='inactivity'`); **never** closes a thread the team is on (returns
`skipped`). (2) **Proactive human hand-off** — prompt now makes the bot *offer* a human
when it isn't resolving it or the member says it didn't help; accepting escalates
(existing ticket + notify). (3) **Answer feedback** — 👍/👎 per assistant answer via
`POST /api/help/messages/{message_id}/rating` → `help_messages.rating`. Migration `093`
(`093_help_concierge_v2.sql`; coexists with origin's `093_practice_playbook_campaign.sql`)
adds `help_messages.rating` + `help_questions.closed_reason` (additive, no enum change).
Spec: `FatTail-Labs-Help-Concierge-Spec-v1.1`. Tests: `test_help_v2.py`. **14/14 help
tests pass locally.**

**Deferred to v1.2 (next):** self-improving engine (admin Questions dashboard —
most-asked/unanswered/escalation-rate/👎'd — + curated FAQ fed back into the KB, optional
Help-wiki publish), streaming replies, image-aware bug reports. Status: implemented +
locally verified; pending live deploy to MiniTwo.

## 2026-08-09 — DL-269 Accounts & Capital program BUILD AUTHORITY

**Coach:** Full Spec set **APPROVED**. Execution law:
[`docs/Accounts-Capital-Full-Agent-Bench-Plan-v1.0.md`](../docs/Accounts-Capital-Full-Agent-Bench-Plan-v1.0.md) · board `agents/p-accounts-capital/`.

| Spec | Version |
|------|---------|
| Capital & Position Sizing | v0.3 |
| Funding & Defunding | v0.2 |
| Staleness Awareness | v0.1 |
| Campaign Amendment — Top Level Is the Account | v1.0.2 |

Ship ODs (defaults): tolerance **percent**; wrap **snapshot**; keep `starting_balance` separate; free-form latitude v1; live BP sync **out**.

## 2026-08-09 — DL-268 Ledger furniture abolished (supersession)

**Coach / Amendment:** The **account is the top level**. No genesis ledger campaign. Undirected trades (`practice_campaign_id` NULL) are lawful. Memory does not fall back to a furniture object. Registry = deliberate campaigns only.

**Reverses** ledger-as-furniture doctrine from structured-practice L1 genesis (migrations 102–104 ledger portion). Furniture disposition: Option A soft-delete; unstamp clears stamp **and** `stamped_by`. Hard-delete only if zero export refs.

Implements via program phases L\*. Spec: `Specs/FatTail-Labs-Campaign-Amendment-Top-Level-Is-The-Account-v1.0.md`.

## 2026-08-09 — DL-267 Campaign Journey radar present-only; scrub cut

**Coach:** Radar ships **present-state only** on deliberate charters. Lifetime time slider and as-of-T historical rendering are **cut (not deferred)**. Band-alignment and n-floor unchanged. Supersedes interim full-deferral posture. Resolves Advisor A-1.

Spec: Campaign Spec v1.3 §6 · Amendment §2.1.

## 2026-08-09 — DL-266 Funding curves + master drawdown dollars

**Coach / Hotel (W0-1):** Balance curve = start + fills + cash movements. Trading curve = **Σ fill P&L only** (starts at 0). Master DD witness compares **realized drawdown dollars** (trading) vs **tolerance budget dollars** (from total net capital / form). Withdrawal ≠ drawdown; deposit ≠ recovery; new-account start ≠ recovery.

Spec: Funding v0.2 §3 · Capital v0.3 §4.1.

## 2026-08-09 — DL-265 Accounts & Capital surface (identity)

**Coach:** Single identity-level **Accounts & Capital** under users menu. Sole account write path. Practice and Strategy Lab **consume** only. Product independence (DL-248–250). Parallel Practice “add account” after land is a **blocking** defect.

Spec: Capital v0.3 §6.

## 2026-08-08 — DL-264 Campaign upgrade must not break existing books

**Coach:** Enacting campaign structure (096/097, pack 1.1, multi-active) is **additive**.

- Do not auto-create campaigns or rewrite trades/accounts.  
- New columns nullable; existing stamps and unstamped trades remain valid.  
- Import accepts model 1.0; export 1.1 is backward-compatible for readers that ignore unknown fields.  
- Migrate before deploy on each host. Spec: Member Campaign Concept §8a · Export Spec v1.4 §4.

## 2026-08-08 — DL-263 Campaign permanence + active prefill (Spec B1/B2)

**Permanence (OD-PB-7 platform-wide):** Practice campaign hard-delete only when
zero stamps (no trade / journal `practice_campaign_id`, no playbook M2M). Else
only `completed` / `abandoned`. Same doctrine as Playbook scrapbook permanence.

**Prefill:** `GET …/campaigns/active` and stamp default = most recently
**activated** (`activated_at`), prefer account-bound over unbound when
`account_id` filter set. Migration **097**. Spec: Member Campaign Concept v1.0 §4.5–4.7.

## 2026-08-08 — DL-262 Campaign: professional concept, retail-simple surface

**Coach positioning:** Campaign is how **professionals** structure live work
(capital context, goals, group of strategies or fills, start/end, log, prune,
retro — LifeCycle Campaign Phase). FatTail brings that idea to **retail** without
the institutional ceremony.

| Professional core (kept) | Retail simple (how we ship) |
|--------------------------|-----------------------------|
| Work happens *in a campaign* | One default-style campaign if they want — or none |
| Capital / goals / multi-book | Optional fields; hide complexity until used |
| Deploy strategies *into* campaigns (Lab) | Suite step stays **Deploy** (verb); campaigns are the container |
| Multi-campaign per account | Available, not required |
| Import into a campaign | Available when chosen; broker files need no campaign column |

**UX rule:** Never look like a wiki or a prop-firm ops console. Defaults are quiet;
power is there when the member grows into it. Optional structure, not enforcement
(DL-261). Practice and Strategy Lab each own the concept in their mode (DL-258/260).

## 2026-08-08 — DL-261 Campaigns are structural & optional — never enforced

**Coach:** FatTail **offers** campaigns as structure (capital context, multi-campaign
per account, stamp on trades/journal, import *into* a campaign when the member
chooses). We **do not enforce** them.

| Do | Don't |
|----|--------|
| Make campaign create/list/stamp available | Require a campaign to open an account |
| Allow one default-style campaign if the member wants it | Auto-create a campaign on every account |
| Import into a chosen campaign when the UI/API says so | Force every ToS/CSV import onto a campaign |
| Multiple campaigns per account (optional) | Block trading without an active campaign |

Broker exports usually have no campaign notion — FatTail owns the concept, but
**absence of campaign is valid**. Trades with `practice_campaign_id` NULL remain
first-class. Strategy Lab Deploy → campaigns same spirit: available structure,
not a gate.

## 2026-08-08 — DL-260 Strategy Lab: Deploy step vs Campaign container (LifeCycle.pdf)

**Source:** `/Users/ernie/LifeCycle.pdf` — Strategy Life Cycle.

**Big picture:** Development → Curation → **Live Campaign**.

**Campaign Phase** (PDF): strategies · capital allocation · start date · log · prune ·
retrospective · end date. That is the *container* / live context of work.

**Strategy Lab naming:**
| Term | Meaning |
|------|---------|
| **Deploy** (suite process step) | Board phase UI label for the PDF Campaign/live stage — a **verb** most people understand. API key may stay `deployment`. |
| **Campaign** (entity) | Capital context strategies are **deployed into** (one or many campaigns; capital, goals, dates, log, prune, retro). |
| **Deploy to Sim** (Dev) | Inside Development only — not the Live Campaign board. |
| **Deploy** (Curate step 5) | Final review before live — not the same as multi-campaign container mgmt. |

**Rule:** You **deploy into** campaigns. You do not rename the process step to “Campaign”
in the suite nav (that confuses step with container). Practice has the same *concept*
of campaign as work context under `/app/practice/campaign` (human mode).

## 2026-08-08 — DL-259 Practice Campaign = work context (multi per account)

**Coach product model:** When you trade (Practice) or **deploy into a campaign**
(Strategy Lab), work happens **in the context of a campaign** — capital focus, goals,
a group of strategies or fills.

| | Practice (human) | Strategy Lab (automated) |
|--|------------------|---------------------------|
| Campaign path | `/app/practice/campaign` | Campaign entities under Lab (Deploy board deploys *into* them) |
| Mode | Manual fills / process suite | Bots deploy into campaigns |
| Share tables? | **No** | **No** |

**Practice flexibility:**

- One person may run **everything** in a **single** campaign.  
- Another may run **several distinct campaigns on one Trade Log account**.  
- Another may run **different campaigns on different accounts**.  

**As-built:** Multiple `active` campaigns allowed. Optional `account_id`,
`starting_capital`, `goals_md`. Migration `096_practice_campaign_account_scope.sql`.

## 2026-08-08 — DL-258 Practice ≠ Strategy Lab; Campaign at the right level

**Coach correction:** Practice and Strategy Lab are **separate products** (human vs
automated). They share **no** tables or chrome. The **concept of Campaign** exists
in **both** — same idea (capital focus, goals, group of work), different mode.

| | Practice (human) | Strategy Lab (automated) |
|--|------------------|---------------------------|
| Product | Manual Trade Log / process suite | Bots · Design → Curate → **Deploy** (into campaigns) |
| Campaign home | **`/app/practice/campaign`** | Campaign containers + Deploy process step |
| Wrong | `/app/campaigns` (top-level cross-product app) | Suite label “Campaign” for the process step (use **Deploy**) |
| Data | Practice campaign domain only | Lab campaign / deployment domain only |

**Do not** merge them. **Do not** put Campaign at `/app/campaigns`.

## 2026-08-08 — DL-257 Reports = objective trade aggregate only (process off Reports)

**Coach correction:** A **process scorecard** (adherence mix, process/behavior tag
frequency, campaign-season process rates) does **not** belong on **Reports**.

| Surface | Owns |
|---------|------|
| **Reports** (`/app/reports`) | Aggregate of **trades** — objective collected book: equity path, drawdown, strategy/outcome distributions, multi-account totals. Not character/process grading. |
| **Trade Log** | Capture fills + optional process fields on the fill (source of truth for *data*). |
| **Retrospective** | Derived process ceremony over a window (adherence, integrity, habits) — preferred home for adherence mix / process look-back. |
| **Journey** | Optional **aggregate** process pulse for the path (later), not a second Reports. |

**Rationale:** Reports answers “what happened in the book.” Process answers “was I true to the covenant.” Mixing them turns Records into coaching theater and was not an intentional Coach lock.

**Disposition of TD2-7 process pack UI:** removed from `ReportsDashboard`. Domain/API
(`process-pack`, `records/summary` by_adherence, tag usage) may remain as **derivation
backends** for Retro/Journey — not as Reports widgets. Phase 2 Spec §3.4 process pack
placement amended by this DL (Reports no longer the default host).

**Also out of Reports:** Process labels (`ProcessTagUsage`) — same rule as adherence
mix. Components live under `web/components/practice/` (not `reports/`) so they are not
re-mounted on Records by accident. Featured card copy on Reports must not say “process.”

## 2026-08-08 — DL-256 Phase 2 charts track (Match Hygiene) — Massive underlier review

**Decision:** Start TD2 **charts** workstream without waiting on TD2-0 broker vendor.
Sync remains blocked on Coach vendor GO. Process reports may follow in parallel.

**Contract:**

| Surface | Detail |
|---------|--------|
| API | `GET /api/me/trade-log/trades/{id}/chart?tf=5m\|15m\|1d` |
| Data | Massive stock/index aggs via existing `MassiveClient` (`fetch_aggs`); short-TTL in-process cache |
| Proxy | SPX/XSP/VIX → labeled proxy (universe `proxy_symbol` or default SPY/VIXY); never silent |
| Fail loud | Missing/stale/incomplete bars → `ok: false`, **empty bars** — never a partial path as complete |
| UI | Trade sheet Chart section; entry/exit markers from fill `exec_at`; structure band when axis matches |
| Out of scope | Tick replay, L2, broker sync, `entry_source=sync`, Journal day embed (OD-2.3 defer) |

**Config:** `MASSIVE_API_KEY` (existing); optional `LABS_TRADE_CHART_CACHE_TTL_S` (default 120).

**Spec:** Phase 2 Match Hygiene v1.1 · gate `TD2-PROGRESS.md`.

## 2026-08-07 — DL-255 Playbook Scrapbook Presentation (v1.1a) BUILD AUTHORITY

**Coach GO:** implement Spec
`Specs/FatTail-Labs-Playbook-Scrapbook-Presentation-v1_1a.md`.

**Locks:**

| ID | Decision |
|----|----------|
| OD-PB-1 | One book per strategy; chapters/pages |
| OD-PB-2 | Export-only share v1 (no public URL) |
| OD-PB-3 | Explicit journal evidence + optional tags (tags alone ≠ evidence) |
| OD-PB-4 | Scrapbook metaphor × 16:9 present |
| OD-PB-5 | Family B on book/pages/archive/evidence/versions |
| OD-PB-6 | Character under risk — no P&L theater |
| OD-PB-7 | Permanence: draft discardable until first version; then archive-only. Book-level snapshots on explicit Save; autosave = working copy. **Migration seeds version 1** for contentful books. Retention purge may drop oldest history only with **≥1 version floor** (never latest alone). |
| OD-PB-8 | Playbook pack 2.0 is PB3; does not silently move OD-1.5 TD2 gate |

**Schema:** evolve `member_playbook_entries` as Book root; chapters/pages/stickies/attachments/evidence/versions. Cover = book-level properties. `status` sole archived-ness. `body_md` derived snippet only after pages land.

**Phasing:** PB1 canvas+versions → PB2 archive+evidence → PB3 export 2.0.

## 2026-08-07 — DL-253 AI help concierge (Phase 1)

*(Numbered DL-253 to avoid collision — DL-213 was concurrently taken by the Strategy
Lab Process Runtime work. This is the member help concierge.)*

**Decision:** The member help desk becomes AI-first. A member picks a topic
(bug | struggling | general) and writes one message; the **concierge** (`server/help_ai.py`)
answers instantly via a cheap Grok model, from a whitelisted member-facing
knowledge base (`server/help_concierge_kb.md`). If it can't answer — or the member
asks — the thread **escalates to the existing human help desk** (admins notified).
Bot-resolved threads do NOT notify admins, so the human queue holds only what the
bot couldn't handle. UI (`web/components/HelpLauncher.tsx`) is now a topic picker +
single box that grows into a chat view. Routes extended in `server/routes/help.py`
(AI answer on create + follow-up, new `POST …/{id}/escalate`). **No migration** —
`status`/`author_role` are VARCHAR, so new values `assistant` / `ai_pending` /
`ai_resolved` need no schema change.

**Security (guardrails are architectural, not just prompt):** the model is fed
ONLY the member-facing KB — never `server/`, `Architecture/`, `Specs/`, `infra/`,
`.env`, IPs, or secrets — so it cannot leak what it was never given. On top: a hard
system prompt (never discuss backend/hosting/infra/keys/security; read-only, no
account actions; no financial/profit advice; ignore prompt-injection). **Fail-open
to humans:** if Grok is unconfigured, errors, or returns unparseable output, the
question escalates — a broken AI never blocks a member from help.

**Model:** `LABS_HELP_AI_MODEL` (default `grok-4-fast`) called via the xAI provider
directly (registry whitelists only the configured primary/secondary, so a direct
provider call keeps the P2 studio agents on grok-4.5 untouched). `XAI_API_KEY` added
to the API launchd plist (was absent — AI was unconfigured platform-wide before this).
Gotcha logged: the key must be the full ~84-char `xai-…` value; a truncated 46-char
extraction is silently rejected by xAI as "Incorrect API key".

**Phase 2 (deferred, per Coach):** self-improving FAQ + publishing common answers to
a Wiki Help page. Wiki is an external git repo with no write API + human-gated 5-min
sync, so that's a separate build. Spec: `FatTail-Labs-Help-Concierge-Spec-v1.0`.
Tests: `test_help_ai.py`. Status: implemented + live on MiniTwo (Grok answering verified).

---


## 2026-08-07 — DL-254 Trader Development program BUILD AUTHORITY (OD locks)

**Coach GO** (direction: implement Decision Addendum; stop only for new decisions):

| Artifact | Status |
|----------|--------|
| Roadmap v1.1 + Decision Addendum v1.1 | **BUILD AUTHORITY** for implementation planning + TD0 |
| Phase 0 Foundation Glue v1.1b | **BUILD AUTHORITY** — implement now |
| Phase 1 Own Spine v1.1a | **BUILD AUTHORITY** — after TD0-G |
| Phases 2–3 | **BUILD AUTHORITY for design/seeds**; implement per Agent Bench gates |
| Phase 4 | Trigger-gated catalog only |

**OD locks (Addendum):** Practice owns “Campaign”; single active campaign; `entry_source=sync` (+ Trade Log Spec catalog amend in same body of work as sync migration); progressive story copy; server tag filter; journal campaign stamp in Phase 1; export green before Phase 2 exit; Schwab/ToS-class first venue; error grace ≤7d; cadence retro + campaign context; two process nudges; no co-occurrence v1.

**Board:** `agents/p-trader-development/` · Full plan: `Docs/Trader-Development-Full-Agent-Bench-Plan-v1.0.md`

**Sequencing:** TD0 implement → TD0-G → TD1 → …

## 2026-08-07 — DL-252 Deploy: members get full Deploy UX; gate only real-broker (Tradier) real-money

**Coach refine on DL-251:**
- Members may use **all of Deploy** except **connectivity to real brokers** (**Tradier**).
- The gated piece is what Deploy is **ultimately** for: trading the bot in a **real-money** environment.
- Admin continues to prove Tradier (paper → live); then **provision** real-broker / real-money to designated members.

**Member messaging:** Deploy is available for process/promote/monitor (non–real-money); live Tradier is next when the rail is ready — not “everyone live on capital today.”

**Arch:** `Architecture/26-strategy-lab-member-timeline.md` §4 · Arch 17 · `docs/Strategy-Lab-Member-Timeline.md`

## 2026-08-07 — DL-251 Strategy Lab timeline: Design+Curate for members; Deploy path

**Coach product focus (current system — not dual-host cutover):**

| Track | Scope |
|-------|--------|
| **Member (now)** | Continue **Design + Curate**, **lock** them, give **current membership complete access** |
| **Deploy UX** | Members use Deploy **except real-broker real-money** (see **DL-252**) |
| **Parallel** | Admin develops/proves **Tradier** connectivity |
| **Later** | **Provision real-broker Deploy** for designated members on the same rails |

**Aligns with** Arch 17 (Design+Curate multi-tenant first; real-broker admin validate; then provision).  
**Does not** open multi-member **live Tradier** early.  
**Does not** wait on dual-subdomain split (DL-248–250) to ship Design+Curate.

**Arch:** `Architecture/26-strategy-lab-member-timeline.md` · Arch 17 header reaffirm  
**Docs:** `docs/Strategy-Lab-Member-Timeline.md`

## 2026-08-07 — DL-250 FatTail Labs = separate product membership + Navigator grandfather

**Scope:** **Future product direction** — not a present-day cutover or mandatory near-term
build. Intent is locked so features can be **architected in anticipation**.

**Coach:**
1. **FatTail Labs** becomes a **separate product** with its **own membership type**
   (not an automatic side-effect of Navigator).
2. **Current Navigators** are **grandfathered** into Labs by **granting a new
   membership** (Labs entitlement) — they keep bot/Labs access without a new purchase.
3. **Future Navigators** receive **Practice only** (coaching + trader education suite).
   They get **Labs only if they purchase** the Labs membership.
4. Aligns with dual subdomain (DL-248/249): Practice home for Navigators; Labs product
   at `labs.fattail.ai` for bot build/deploy / marketplace.

**Until Coach opens a cutover program:** production stays single-host unified suite;
Navigators retain as-built access including Strategy Lab.

**Later Spec / ops (when scheduled):**
- New plan key e.g. `labs` / `labs-annual` (Membership Spec amend).
- Grandfather batch: active Navigator as-of cutover → add Labs membership.
- Product entitlement matrix: Practice vs Labs independently combinable.
- WooCommerce Labs SKU; Navigator product no longer implies Labs.

**Open (for that future program):** Activator; Observer + Labs add-on; grandfather
term policy; cutover date/runbook.

**Arch:** `Architecture/25-dual-subdomain-practice-labs.md`  
**Docs:** `docs/Dual-Subdomain-Practice-vs-Labs.md`

## 2026-08-07 — DL-249 Dual subdomain access: Navigator→Practice, Community segments, Visualize

**Scope:** Future direction (with DL-248/250) — design constraints for later; not present cutover.

**Coach refinements on DL-248:**

1. **Community** — Both Practice and Labs use Community, but with **segmented
   channel access** (`practice` | `labs` | `shared`). Members only see/post
   channels allowed for their product entitlement(s).
2. **Visualize AI** — **Exclusive to `practice.fattail.ai`** (trader structure
   literacy), not the Labs bot product.
3. **Navigators** — Default home is **Practice** (full coaching/education suite).
   Labs access is **not** automatic for future Navigators (see **DL-250**).
4. **Labs** — Separate product for bot build/deploy / FatTail Lab Bots monetization
   (DL-247).

**Arch:** `Architecture/25-dual-subdomain-practice-labs.md`  
**Docs:** `docs/Dual-Subdomain-Practice-vs-Labs.md` · Community + Visualize how-it-works notes

**Superseded in part by DL-250** on how Navigators obtain Labs (grandfather vs purchase).

## 2026-08-07 — DL-248 Dual subdomain future: practice.fattail.ai vs labs.fattail.ai

**Scope:** **Future direction** for architecture foresight — **not** as-built and
**not** a scheduled split. Current system remains one host until a later program.

**Coach:** Forward-looking product structure. Today is a **single** host
(`labs.fattail.ai`) mixing education/practice and bot automation. The **target**
is a **split into two subdomains**:

| Host | Audience | Job |
|------|----------|-----|
| **`practice.fattail.ai`** | Traders (**Navigators’ home**) | Become **better traders** (practice, courses, process stack) |
| **`labs.fattail.ai`** | Bot builders / operators | **Build and deploy bots** — compete with **Option Alpha–class** products (Arch 16 doctrine: same service type, opposite soul) |

**Implications:**
- Marketplace monetization of FatTail Lab Bots (DL-247) is **Labs-subdomain–primary**.  
- Practice stack / education remain **Practice-subdomain–primary**; Navigators live here (DL-249).  
- Shared: brand ethos, identity/membership commerce (WooCommerce), Community with **segmented channels** (DL-249).  
- **Not as-built** — no DNS/app split yet; ship on current monolith until cutover Spec + Foxtrot edge plan.

**Arch:** `Architecture/25-dual-subdomain-practice-labs.md`  
**Docs:** `docs/Dual-Subdomain-Practice-vs-Labs.md`

## 2026-08-07 — DL-247 Bot Marketplace purpose: monetize FatTail Lab Bots

**Coach:** The purpose of the Marketplace is to **monetize FatTail Lab Bots**.

| Priority | Meaning |
|----------|---------|
| **Primary** | **Admins** offer **FatTail Lab Bots** to customers who **purchase FatTail Labs subscriptions** (WooCommerce sells; Labs entitles + provisions into Strategy Lab Curate). |
| **Secondary** | **Navigator** members may have **limited sharing** with other **Navigators** (peer process packages — not the commercial center). |

**Not primary:** free peer-publish marketplace as the product spine.  
**Not:** in-app payments; P&L leaderboards; one-click live Deploy.

**Spec:** Bot Marketplace Framework **v0.1.2** · Arch 23/24 updated.  
**Builds on:** DL-235 house catalog · DL-243/244 package substrate/trust · DL-128 Observer≡Navigator for who may receive subscription bots.

## 2026-08-07 — DL-246 Visualize AI: vertical layout + Observer access

**Coach:**
1. **Layout** — conversation and chart canvas are **vertical** (stacked), not
   side-by-side as the primary orientation. Default: **canvas above**, conversation
   below (chart is the live preview). Conversation above canvas allowed as alternate.
2. **Access** — Visualize AI is available to **Observer** as a **paid trial** with
   **exactly the same privileges as Navigator**. Sole product difference for Observer:
   **weekly** subscription that **terminates after 6 weeks** (DL-128 / DL-194
   `feature_role`). **There is no free Observer plan.** Free no-plan accounts remain
   denied. Also open to Activator / Navigator / admin via normal entitlement.

**Correction:** Earlier draft language that treated “free Observer” / role=observer
cookie as full access was **wrong** and is superseded here.

**Spec:** R6 (Observer ≡ Navigator parity), R10 (vertical); §3.2 · §10.1 · acceptance #7/#10.  
**Docs:** Spec · Arch 21/22 · `docs/Visualize-AI-How-It-Works.md`

## 2026-08-07 — DL-245 Visualize AI: local Save + Copy chart (v1.0)

**Coach:** Member must be able to (1) **save the chart** to an OS directory of
choice (browser download / save-as PNG) and/or (2) **copy the chart image** to
the system clipboard for paste elsewhere.

**Spec:** Visualize AI Spec v0.1 — requirements **R8/R9**, canvas actions, acceptance
#8–9; client-side only (no server round-trip). Server chart **library** remains v1.1.

**Docs:** Spec · Arch 22 · `docs/Visualize-AI-How-It-Works.md`

## 2026-08-06 — DL-244 Bot Marketplace gate close (B1–B2, R1–R4)

**Source:** Architecture evaluation of Spec v0.1 (CONDITIONAL GO).  
**Spec:** v0.1.1 folds findings.

| ID | Binding decision |
|----|------------------|
| **B1** | **`fattail.bot_package` is the sole portable substrate** for member→member bot transfer. Single-bot share = `bot_count=1`. One verb: **Import**. `community_bot_shares` may only thin-index packages (`bot_package_id`); no parallel snapshot payload. House shelf stays code-catalog Apply/Copy. |
| **B2** | House-derived redistribution **allowed** with **mandatory provenance** on card/manifest; import **re-derives/verifies** house binding against house catalog (no free-form self-claim trust). Official house listing remains admin catalog. |
| **R1** | Packages are untrusted: every pack config validated against pack schema/bounds on import; imported bots inherit Curate performance guards. |
| **R2** | All package free-text sanitized/output-encoded on Labs card, import preview, Discord text. |
| **R3** | Discord representation = link-back + Labs import deep-link; **minimum parity ships in F3** with Labs share. |
| **R4** | Downloads only via authenticated endpoint or short-lived signed URL scoped to share; **never** bare public blob URL. |

**Advisory tracked:** A1 Hotel on correlation notes · A2 version informational + re-import notice · A3 adversarial tests T10–T12 · D1 migration number at build.

**Coach residual:** may override M-HOUSE-1 to forbid house redistribute entirely.

## 2026-08-06 — DL-243 Bot Marketplace Framework (package · chat · import)

**Coach outline:** Minimal viable **Bot Marketplace Framework** — not a public
storefront. Strategy Lab users **package** bots (or multi-bot packages), **share**
via **Community chat** attachment, peers **import** into their own **Curate**.

**Locked principles:**
- Stay in Design → Curate → Deploy; import never arms live Deploy  
- No rankings, leaderboards, public scores, or performance theater  
- Reuse Strategy Lab portable export (`fattail.labs.strategy_lab`) inside
  wrapper format `fattail.bot_package`  
- Monetization hooks (`is_premium`, `price_cents`, `license_type`, purchases
  table) **schema only** — unused in MVF  
- Commerce later = WooCommerce only if activated  

**Docs landed (F0, pre-implementation):**
- Spec v0.1 → **v0.1.1** — `Specs/FatTail-Labs-Bot-Marketplace-Framework-Spec-v0.1.md`  
- Arch — `Architecture/23-bots-marketplace.md`  
- Design — `Architecture/24-bots-marketplace-design.md`  

**Gate:** DL-244 closes architecture CONDITIONAL GO items.

**Not shipped:** migrations/APIs/UI (F1+ after Coach Spec → **v1.0**).

## 2026-08-07 — DL-242 Community second-window message bridge (C1c path)

**Coach north star:** FatTail members already connected to Discord at enrollment;
Labs Community is an extension of that server; messages sync both ways.

**Shipped path:**
- `community_messages` mirror table · REST backfill on channel open · Labs send via
  bot with honest “Name (via Labs)” attribution.
- Entitled roles (observer/activator/navigator/admin) read/post when channel mapped
  and `LABS_DISCORD_BRIDGE=1` + bot token.
- Identity: Discord name from SSO claims when present (DL-241); else Labs display name.
- Admin map: `/admin/community` (channel snowflakes).

**Not yet:** Gateway long-poll worker (Foxtrot launchd); fotw-sso claim patch on WP
(still required for automatic Discord name); dedicated FatTail AI bot token separate
from 0-DTE (dev may fall back to `LABS_DISCORD_0DTE_BOT_TOKEN`).

**Related:** DL-238–241 · Spec §6.

## 2026-08-06 — DL-241 Discord identity to Labs via SSO claims (not OAuth tokens)

**Coach intent:** Seamless recognition on labs.fattail.ai when the member already
connected Discord on fattail.ai; two-way Community chat.

**Locked design (Mike + plugin inventory):**
1. **Do not** pass Discord OAuth access/refresh tokens to Labs or the browser.  
2. **Do** extend **fotw-sso** JWT with `discord_user_id` + `discord_username` (+ optional
   avatar) from Woo Subscription Discord user meta.  
3. Labs SSO callback upserts `identity_links` provider `discord` +
   `identity_discord_profiles`.  
4. **Two-way chat** remains Labs **bridge bot** + channel map (C1c) — not member
   Discord tokens speaking as the user from Labs.  
5. Primary connect UI stays **fattail.ai** My Account (DL-240).

**Ops:** `docs/ops/WP-Discord-SSO-Claims-for-Labs.md`  
**Related:** DL-238 · DL-239 · DL-240 · Community Spec §8.

## 2026-08-06 — DL-240 Community Discord connect = fattail.ai WP plugin (binding)

**Coach:** The connector to the Discord server is a **WordPress plugin on fattail.ai**.
It connects the member to guild **FatTail AI**. The member’s **Discord name is
maintained on fattail.ai**.

**Locks:**
1. **Primary connect path** = existing WP Discord connector on fattail.ai — **not** a
   Labs-first Discord OAuth product that competes with it.  
2. **Display name in Labs Community** for linked members = Discord name as stored on
   fattail.ai (ingested via SSO claims and/or WP→Labs sync).  
3. Labs still stores Discord snowflake on the identity for post gate + message
   attribution (`identity_links` or equivalent sourced from WP).  
4. Labs **bridge bot** (Message Content Intent, channel webhooks, mirror/send) remains
   Labs-owned for the second window — distinct from member-connect plugin.  
5. **DL-238** date-aware role reconcile remains binding; Mike designs executor so WP
   plugin and Labs bot do not fight (single coherent grant/revoke story).

**Spec:** Community App Spec **v1.0.2** §8.0–8.6.  
**Related:** DL-237 · DL-238 · DL-239 · Identity Access (wordpress:fattail SSO).

## 2026-08-06 — DL-239 Community App Spec v1.0.1 — Coach Phase 5 APPROVED (BUILD AUTHORITY)

**Coach:** Approves Community App Spec **v1.0.1** as **build authority**.

**Locks (from Spec + DL-237/238):**
- Surface: Apps hub card → `/app/community`
- Chat = **Discord second window** (Discord SoR for guild chat; Labs SoR for bots/shares/map)
- Seed channels: General, Practice, Strategy Lab, Toughness; admin may create more; no Journey/Wiki channels
- **Date-aware Discord role reconciliation** mandatory (DL-238) — not webhooks alone
- Message mirror: idempotent upsert + **gap-heal backfill**; event matrix §6.7
- Platform: Message Content Intent + GUILD_MEMBERS; per-channel webhook id+token
- House bots default shared; member publish/apply; hold ≠ Discord delete

**Execution:** `agents/p-community/` (Juliet plan + seeds). India CONDITIONAL GO closed.
Specialist C0 reviews (Tango/Mike/Echo/Foxtrot) before Discord-heavy P1b/c; P1a shell after C0-G.

**Spec:** `Specs/FatTail-Labs-Community-App-Spec-v1.0.md` (v1.0.1 approval; **v1.0.2** adds DL-240 WP connector).  
**Related:** DL-237 · DL-238 · **DL-240** · Membership Tiers Discord annotation

## 2026-08-06 — DL-236 Visualize AI member app (spec + arch + design)

**Coach:** New top-level Apps product **Visualize AI** (`/app/visualize-ai`): text
(voice later) interface with the resident AI to create **custom visualizations**
and **correlations** from **options-related Massive data**.

**Locked product choices (amended DL-245/246):**
- Hub: top-level Apps card (sibling of Strategy Lab, not nested)
- V1: text → structured chart plan → **deterministic tools** → render
- Access: **Observer trial ≡ Navigator features** (6-week paid weekly); free no-plan denied (DL-246 / DL-128)
- Layout: **vertical** canvas + conversation (DL-246); Save/Copy PNG (DL-245)
- Data plane: **options Greeks**, **VIX ~1–30 day** (VIX1D + VIX; VIX9D if entitled),
  **SPX**, and **any entitled Massive** surface via a **closed tool catalog**
  (never raw browser passthrough; never model-invented numbers)

**Docs landed (pre-implementation):**
- Spec **v0.1** — `Specs/FatTail-Labs-Visualize-AI-Spec-v0.1.md` (Coach intent;
  India/Echo/Tango/Mike/Hotel → Coach v1.0 before code)
- Arch — `Architecture/21-visualize-ai.md`
- Design — `Architecture/22-visualize-ai-design.md`

**Invariants:** proxy honesty (DL-223/224); correlation/on-demand isolation from
Curate comparison (DL-231); member ethos + distress (DL-209–211); ChainStore
prefer for chain/Greeks cost control (DL-186).

**Not shipped:** routes, migration, UI — Spec review gates first.

## 2026-08-06 — DL-238 Discord role sync: date-aware reconciliation (binding)

**Coach / India gate (Community Spec review):** Discord paid roles must not outlive
Labs entitlement. Webhooks alone miss **date-based** expiry:

- Observer trial term end (`current_period_end`)
- Alumni-year end (`courses-alumni` period end)

**Invariant:** Discord guild roles for Discord-included tiers are derived from the
**same date-aware membership derivation** Labs uses for roles (memberships with
`current_period_end` in the past are not entitled — Identity/Tiers Spec §3).

**Required worker:** scheduled **reconciliation sweep** that:

1. For each Discord-linked Labs identity, compute Labs Discord-entitlement (date-aware).  
2. Diff vs actual guild roles.  
3. Corrective grant/revoke.  
4. **Fail-loud** alert on persistent divergence.

Webhook-driven sync is complementary (faster path), not sufficient alone.

**Spec:** Community App Spec §8.5 · §6.6.  
**Related:** DL-128 Observer = 6-week term · Membership Tiers date-expiry · DL-237.

## 2026-08-06 — DL-237 Community App Spec v1.0 (product intent) — was misnumbered DL-236

**Coach:** New Community app at `/app/community` (Apps hub card). Chat is a
**second window on FatTail Discord** (sync users + messages; Discord display names).
Seed channels: **General**, **Practice**, **Strategy Lab**, **Toughness**. Admin may
create more. Journey/Wiki: no channels. FatTail bots shared by default; member bot
shares opt-in. Labs SoR for bots; Discord SoR for guild chat. Discord-included
subscribers connect Discord identity + roles.

**Spec:** `Specs/FatTail-Labs-Community-App-Spec-v1.0.md`  
**Status:** Superseded for *build* status by **DL-239** (Coach Phase 5 APPROVED / v1.0.1).

**Note:** Earlier log line that reused **DL-236** for Community was a numbering
collision with Visualize AI (DL-236). Community is **DL-237**. India review D2 closed.

**India architecture gate (2026-08-06):** CONDITIONAL GO → B1 closed as DL-238;
R1–R4 folded into Spec v1.0.1.

## 2026-08-06 — DL-235 FatTail house strategies + mint provision

**Coach:** House strategies are FatTail-designed, taught in courses, **versioned**,
and **admin-only** to modify/version. Members apply, configure bots, or
copy-and-rebuild — cannot remove house entries from the managed list.

**Catalog (v1.0.0 each):** 0DTE OTM Classic Butterfly · 1–2 DTE Timewarp Batman ·
1–2 DTE Timewarp Trend Single · 0DTE High Vol Batman · Convex Stack (2–4 DTE) ·
Sigma Drift (5–10 DTE). Each includes **entry + management** process and
**course_refs** to Labs curriculum.

**Mint:** On first identity create (SSO join / register), provision **3 starter
bots** in **Curate** (`monitored`), house-bound, **armed** sim instances ready
to tick and later promote to Deploy:
`0dte_otm_classic_butterfly`, `0dte_high_vol_batman`, `1_2dte_timewarp_batman`.

**Tracking:** `attributes.house_design@1` `{key, version, name, …}` on the bot;
comparison rows expose `house_design_key` / `house_design_version` for Curate/Deploy.

**Code:** `house_designs.py` · `strategy_lab_designs.py` · mint hook in
`identity.get_or_create_identity` · `GET /api/me/strategy-lab/designs` ·
`POST .../designs/house/apply` · migration **089** member copies · UI
`DesignHouseLibrary`.

## 2026-08-06 — DL-234 Curate comparison performance guard tests

**Coach:** Automated tests must fail early if the multi-bot comparison hot path
regresses (live Massive corr, 3N SQL, dual payload, fat series, multi-second wall).

**Landed:** `server/tests/test_strategy_lab_curate_perf_guards.py`  
**Budgets:** ≤12 SQL executes · ≤2s wall @ N=8 · `correlation.deferred` · bots-only  
**Arch:** `Architecture/20` §4 · Spec Surface acceptance #12

## 2026-08-06 — DL-233 Documentation parity: Curate board performance + suite nav

**Coach:** Update specs, architecture, and user guide for (1) multi-bot board
performance/stability contract and (2) suite nav restoration (Design · Curate ·
Deploy · Archive; Symbols under Design).

**Landed:**
- Spec Surface **v1.0.2** (§1.5 comparison hot path, §3 symbols under Design, §5 board stability)
- `Architecture/20-strategy-lab-curate-board-performance.md` (audit conclusions + as-built)
- Updates: Arch **19**, **18**, **README**; Curate user guide; Navigation Continuity note
- Decision log **DL-230–DL-232**

## 2026-08-06 — DL-232 Suite nav: Design · Curate · Deploy · Archive; Symbols under Design

**Coach:** Top suite must remain **Design · Curate · Deploy · Archive**. Do **not**
rename to Sim market / Live market. **Symbols is not a top-level suite tab.**

**As-built:**
- `web/lib/strategyLabSuite.ts` — suite = four items only
- Design **sub-nav**: Board | Symbols (`StrategyLabDesignSubNav`)
- Symbols pages chrome with `active=development`, `designSub=symbols`
- **Design:** assign symbol (underlying) via designer `CurateSymbolPicker` for BT/FW
- **Curate:** re-select scan symbol when creating a sim run
- **Deploy:** no symbol step — only curated bots

**Rationale:** Symbol is an attribute of the bot’s design and Curate run, not a
life-cycle phase. Deploy consumes already-curated bots.

## 2026-08-06 — DL-231 Curate multi-bot board: performance & browser stability

**Coach:** Browser must stay stable with many Curate instances (customer confidence).
Performance/architecture audit → redesign of comparison + PhaseRunDashboard.

**Root causes found:**
1. Live **Massive correlation** inside `GET .../comparison` (~20–22s @ 17 bots)
2. **1 Hz** parent `nowMs` re-rendering all cards + SVG charts
3. Unbounded mount of N mini equity charts
4. O(N) SQL + dual `bots`+`strategies` full payload

**As-built contract:**
- Comparison = **book metrics only**; corr **deferred** (calculator / `/correlation*`)
- Batched SQL (position aggs + last-N equity series window); compact `{equity}` points
- Primary array: **`bots`**; `strategies` empty (no dual full list)
- UI: **page size 12**; memo cards/charts; runtime clock **per-cell** only; tab-hidden pause
- Silent poll **30s**, no stacked fetches, loading only on initial/manual refresh
- Measured @ 17 bots: comparison **~6 ms**, payload **~19 KB** (was ~20s / ~60 KB)

**Code:** `curate_domain.comparison_report` · `PhaseRunDashboard` · `MiniEquityChart` ·
`CuratePhaseDashboard` · migration **088** `run_started_at` (runtime stat)

**Arch:** `Architecture/20-strategy-lab-curate-board-performance.md`

## 2026-08-06 — DL-230 Runtime since last start/restart

**Coach:** Dashboard must show **current runtime since last start/restart**, adaptive:
seconds → min:sec → hours/min → days/hours.

**As-built:** Column `run_started_at` on `strategy_lab_curate_instances` (migration
**088**). Set/reset on **Arm**. API: `run_started_at`, `runtime_seconds`,
`runtime_label`. UI: live Runtime on grid/table (per-cell timer after DL-231).

## 2026-08-05 — DL-212 Users admin free/paid visibility

**Decision:** The admin Users section now classifies every identity into a
**billing status** — `paid` / `free` / `alumni` / `staff` — surfaced as a badge
column, header counts, and filter buttons, so operators can see who is a paying
member at a glance. Read-side only: `server/routes/users_admin.py` +
`web/app/admin/users/page.tsx`. No migration (data already exists).

**Definitions (Coach-locked):**
- **paid** = an active/grace membership on a paid plan. Paid plans =
  `{observer, observer-trial, activator, navigator}`. **Observer and Observer
  Trial are the SAME $17/wk tier — no split**; both display as "Observer".
- **free** = an account with no active paid membership (self-serve `/register`
  observer-tier account, or a provisioned identity that never purchased). Free is
  the *absence* of a paid membership, not a tag. Waitlist leads
  (`feature_gate_emails` / AC "Labs Lead") are not identities and never appear here.
- **alumni** = active `alumni`-plan membership (churned-but-retained free grant);
  ranks below paid, shown as its own class.
- **staff** = `role_override = administrator`; excluded from member counts.
- Precedence when several apply: **staff > paid > alumni > free**.

**Also fixed in the same change (were making the data "look wrong"):**
1. Roster now **sorts by last-active** (max of login/pageview/lesson), matching
   the "Last active" column — previously it sorted by `last_login`, so order
   disagreed with the displayed times.
2. Login **method is relabeled** in the UI (`native`→"Password",
   `wordpress:fattail`→"FatTail SSO", `wordpress:0-dte`→"0-DTE SSO",
   `stripe`→"Stripe") and the column renamed "Signed in via", with a note that
   login method ≠ membership. This resolves the "native but Observer" confusion:
   "native" was a password login, never a plan.

**Implementation notes:** classify/sort/among-class-filter happen in Python over
the matched set (capped `ROSTER_CAP=5000`) so the filter and last-active sort stay
consistent with the table; header `counts` are always the full unfiltered picture.
`list_users`/`export.csv` accept `?billing=`; `user_detail` also returns
`billing_status`/`plan_tier`. Spec: `FatTail-Labs-User-Billing-Visibility-Spec-v1.0`.
Tests: `test_user_activity.py` (classifier truth table + counts sum + free-filter).
Status: implemented; pending live verification on MiniTwo.

*(Note: production MySQL session tz is America/New_York, so `_iso()`'s "Z" suffix
is nominal — Ernie's server and ops are ET, accepted as-is, not changed here.)*

---

## 2026-08-05 — DL-216b Trade Log `entry_source`: manual · import · automated

**Decision:** Three **distinct** provenance values on `member_trade_log_trades.entry_source`:

| Value | Meaning |
|-------|---------|
| **`manual`** | Member typed (structure form / legs) |
| **`import`** | File or paste adapters (ToS, CSV, canonical) |
| **`automated`** | Strategy Lab process runtime or other Labs automations |

**Never** stamp Strategy Lab fills as `import`, or file imports as `automated`. Legacy
`machine` → `automated` (migration **082**, normalizer synonym).

**Rationale:** Coach: import and automation are different audit/policy channels.
Automated fills will come from Strategy Lab (and future bots), not from ToS paste.

## 2026-08-05 — DL-216 Trade Log manual management (structure entry · close · trash)

**Decision:** Manual trade entry/close/trash is a first-class Practice surface. Spec
**§16** of Trade Log v1.1 and design architecture **`Architecture/15-trade-log-manual-management.md`**
are as-built authority. Structure-first create; open strip + row Close/Trash; close
pairing gates (orphan, account, units, drift); universal trash for now; `entry_source`
via migration **081** (refined in **DL-216b**). Client match helpers mirror
`trade_log_domain` and must not fork structure-key rules.

**Rationale:** Members re-enter multi-leg books by hand; leg-by-leg default was too
heavy. Honest open→close pairing and trash prevent silent book corruption without
profit theater. Provenance column enables later “manual-only trash” without guesswork.

**Code:** `web/lib/tradeLog.ts` · `TradeSheet` · `TradeLogTable` · `tradeLogPrefs.ts` ·
`migrations/081_trade_log_entry_source.sql` · create/import stamp `entry_source`.

## 2026-08-04 — DL-211 Member Help System (DB-backed help desk)

**Decision:** New in-app help desk. Members ask questions (optional image upload),
admins answer in a thread, all stored in the Labs DB. Migration `058`
(`help_questions`, `help_messages`); `server/help.py` + `routes/help.py`
(member) + `routes/help_admin.py` (admin); `web/components/HelpLauncher.tsx`
(mounted in AppChrome, members only) + `web/app/admin/help/`. Optional attachment
is a plain **image upload** (native file picker) — no auto-capture, no new
frontend dependency.

**Rationale:** Inspired by MarketSwarm-Canonical's in-app bug reporter (capture →
submit → admin triage → reply) but **stored in MySQL, not GitHub Issues** — the
requirement was DB-backed. Reuses notification infra: new question →
`notify.notify_admins` (admin in-app + email); public admin answer →
`member_notify.create_in_app` + SMTP email (sent after commit). All notifications
best-effort, never block the write. Members see only their own questions and only
public messages (internal notes are admin-only). Uploads validated by magic bytes,
capped at 5 MB, stored under `uploads/help/`; 10 questions/hour/member rate limit.

**Isolation (purely additive bolt-on, cannot block Labs):** help routers register
in a guarded `try/except` in `main.py` (import/registration failure is logged and
skipped — the app still boots); the member widget is wrapped in an `ErrorBoundary`;
`package.json`/build graph untouched; migration 058 is additive-only. Worst case =
"the Help button doesn't work," never a blocked login/page/API. Spec:
`FatTail-Labs-Help-System-Spec-v1.0`. Tests: `test_help.py`. Status: draft,
pending live verification on MiniTwo.

## 2026-08-06 — DL-229 Terminology: Bot · Strategy attribute · Position

**Coach:** Correct terminology for Curate/Deploy units:

| Term | Meaning |
|------|---------|
| **Bot** | Primary unit (what we wrongly called “strategy” on the grid) |
| **Strategy** | **Attribute of the bot** (pack / methodology) |
| **Position** | **Instance of the bot** (open/closed package) |

**Spec:** Curate-and-Deploy-Surface-Spec v1.0 §0 terminology; Process Runtime v1.2 glossary.  
**API:** emit `bot_id` / `bot_name` (+ legacy `strategy_*` aliases).  
**UI:** dashboards/reports use Bot / Position language.

## 2026-08-06 — DL-228 Spec & architecture documentation parity

**Coach:** Update specs and architecture docs for as-built Strategy Lab
Curate/Deploy surfaces.

**Landed:**
- `Specs/Strategy-Lab-Curate-and-Deploy-Surface-Spec-v1.0.md` (authority for Curate/Deploy UI, marks, symbols, correlation, reports)
- `Specs/Strategy-Lab-Process-Runtime-Spec-v1.2.md` (amends multi-member Curate / host priority)
- `Architecture/19-strategy-lab-as-built-map.md`
- Updates: Arch README, 09, 17, 18; Implementation Scope overlay; Curate user guide cross-links

## 2026-08-06 — DL-227 Relative correlation on grid + calculator

**Coach:** Grid view shows **relative correlation**; calculator for **any two
symbols** → Pearson coefficient.

**Shipped:** `market_data.correlation` (daily simple returns, Massive aggs);
indexes use proxy series when needed; `GET .../correlation?a=&b=&days=`;
`GET .../correlation/relative`; comparison attaches `corr_vs_spy` per run;
grid/table show **ρ vs SPY**; `CorrelationCalculator` on Symbols + Curate footer.

## 2026-08-06 — DL-226 Deploy equity & stats like Practice Reports

**Coach:** Deploy phase needs **detailed equity and stats reporting** similar to
Practice **Reports** (equity curve, drawdown, stats table, featured cards,
outcome distribution).

**Shipped:** `build_run_reports_book` (same DTO as trade-log reports-book);
`GET .../deploy/reports-book` + `.../curate/reports-book`; `DeployReportsPanel`
reuses Practice `EquityChart`, `DrawdownChart`, `StatsTable`, featured cards,
`BarDist`. Until Tradier Deploy outcomes exist, book is built from closed
**Curate sim** packages with honest source_note.

## 2026-08-06 — DL-225 Curate/Deploy high-visibility phase dashboards

**Coach:** Curate and Deploy must be highly visible with **similar interfaces**:
grid or table reporting plus **mini equity charts**. Shared `PhaseRunDashboard`
primitive; Curate live with sim equity series; Deploy shell mirrors layout until
Tradier provisioned.

## 2026-08-06 — DL-224 VIX + Daily VIX (VIX1D) for strategy decisions

**Coach:** VIX and **Daily VIX** for reference and strategy decisions.

| Symbol | Meaning |
|--------|---------|
| **VIX** | 30-day IV regime |
| **VIX1D** | Cboe Daily / 1-day VIX — 0DTE and daily decision context |

Both are **shared reference** marks (role=reference), not default scan underliers.
Each poll stores **mid + prev_close + day_change_pct** for daily reference.
API: `GET /api/me/strategy-lab/curate/vol-reference`. UI vol cards on Curate stream strip.
Until Massive index entitlement: proxies labeled (VIX/VIX1D → VIXY).

## 2026-08-06 — DL-223 Curate symbol universe (indexes + ETFs + stocks)

**Coach universe (enabled shared stream):**

| Kind | Symbols |
|------|---------|
| Indexes | **SPX, XSP, VIX** |
| ETFs | **SPY, QQQ, IWM, GLD, TLT, SLV, USO, XLF, UNG** |
| Stocks | **AAPL, AMZN, NVDA, TSLA, GOOGL, META, MSFT** |

Options cadence: 3–5 expirations/week class. Migration `085` + `086` (VIX→VIXY proxy).
Index feeds `I:*` may 403; SPX/XSP proxy **SPY**, VIX proxy **VIXY**, always labeled.

## 2026-08-06 — DL-222 Shared live marks stream for all members

**Coach:** Support a **set of symbols** and a **live stream** that **every member's
collection** uses — one shared stream, not per-member sockets.

**Design:** `market_symbol_universe` + `market_live_marks` + heartbeat;
`python -m market_data.live_stream` polls Massive into DB; Curate
`get_mark(cur=…)` reads shared table first. Default universe: SPY, QQQ, IWM + Mag7.
Stale policy `LABS_MARK_STALE_SECONDS` (default 60); optional
`LABS_LIVE_MARKS_REQUIRED=1` fail-loud (no stub).

**API:** `GET /api/me/strategy-lab/curate/live-marks`. UI strip on Curate phase.
**Not Tradier streaming** (Arch/09).

## 2026-08-06 — DL-221 Multi-member Curate comparison is core

**Coach:** Multi-member is an **absolute** requirement. Curate exists so **many
strategies run** and can be **compared** for promote / portfolio inclusion — not
single-strategy hobby mode.

**Shipped:** `GET .../curate/comparison` (per-member multi-strategy metrics);
`POST .../curate/tick-all` (tick all armed/running for member);
`POST .../curate/platform-tick` (admin multi-member worker tick);
UI **Strategy comparison** + tick-all on Curate phase. Family B identity isolation.

**Still true:** Deploy Tradier multi-member after Coach validate; Curate sim is
the multi-strategy comparison plane first.

## 2026-08-06 — DL-220 Curate runtime user guide

**Coach:** User guide for Curate run environment: UI path, under-the-covers
position/cash/mark/envelope, decision log, chart feasibility (data-ready; UI charts
not shipped in v1).

**Doc:** `docs/Strategy-Lab-Curate-Runtime-User-Guide.md`

## 2026-08-06 — DL-219 Curate run environment v1 (sim)

**Coach:** Start Curate run environment for everyone (Stage A). Real-market marks
(stub v1) + simulated broker + fake money; never Tradier. Member-triggered tick
(manage-before-scan); cloud scheduled workers later.

**Shipped:** migration `083_strategy_lab_curate_runtime.sql`; package
`server/strategy_runtime/`; routes `/api/me/strategy-lab/curate/*`; UI
`CurateRuntimePanel`; tests `test_strategy_lab_curate.py`. Fill model
`mark_mid_v1` labeled. Deploy still Coach-only / not in this slice.

## 2026-08-06 — DL-218 Strategy Lab growth playbook (dogfood → platform)

**Coach:** Fund Tradier, hook API, scale through FatTail Labs so others can create
and deploy **FatTail-style** process-bots. Best path is **vertical slice first**,
growth stages with hard exit criteria—not multi-tenant or multi-pack before dogfood.

**Stages (v1.1 refine):**  
- **A — Design + Curate for everyone** (shared studio; sim only; no member Deploy)  
- **B — Deploy for Coach only** (validate Tradier paper/live + runtime)  
- **C — Provision members** for Deploy (their Tradier; paper then gated live)  
- **D — Solid platform** (hundreds, caps, HA, doctrine)

**Build order:** Design/Curate multi-tenant + Coach Tradier spike in parallel →
Coach-only Deploy gate → member OAuth + `strategy_lab_deploy` provision.

**Architecture:** `Architecture/17-strategy-lab-growth-playbook.md` **v1.1**

## 2026-08-06 — DL-217 Same service type as OA, opposite strategic direction

**Coach:** Offer the **same type of service** as Option Alpha (no-code process
automation, cloud continuous run, paper engine, broker-connected live) with a
**completely opposite strategic direction for traders**.

| Same | Opposite |
|------|----------|
| Hosted bots / process runtime, paper, Tradier | Capacity over dependency (not set-and-forget) |
| OA-class reliability & performance (DL-216) | Stop the bleeding; process outcomes never profit claims |
| Encode → prove → run → inspect | Proof gates, version pin, arming; Habit Catalog + retro |
| Member broker custody | Defined-risk pathway; creator owns plan; no profit theater |

**Architecture:** `Architecture/16-strategy-lab-vs-option-alpha-positioning.md`  
**Bar:** OA-class **service**; FatTail **doctrine**. Features that increase dependency
or profit theater without increasing capacity or proof do not ship.

## 2026-08-06 — DL-216 Competitive bar: Option Alpha–class host reliability

**Coach:** Strategy Lab will **compete with Option Alpha**. Therefore the service must
be **at least equal in reliability and performance** for continuous automations
(paper/Curate and live).

**Implication:** Cloud-hosted Process Runtime (**M3-class workers**) is **competitive
primary**, not an optional residual. MiniTwo-only multi-tenant bot hosting is
insufficient. OA-class means: always-on cloud host, auto-restart, queue/workers,
monitoring/kill switches, in-house paper (Curate: real market + sim broker + fake
money), live via member broker API (Tradier first).

**Still locked from DL-214:** User owns strategy + arming; broker owns custody and
fills; prefer **broker-held exits**; no P&L or perfect-exit guarantees; M0 export and
M2 user-local remain **secondary** (capacity/portability).

**Architecture:** `Architecture/14-strategy-lab-execution-responsibility.md` **v1.1**  
**Follow-on:** Process Runtime Spec amend to **v1.2** (M3 primary for continuous
paths; §17 normative). Broker stack: two-layer adapter + ExecutionService
(`docs/Strategy-Lab-MSC-Broker-Adapter-Assessment-2026-08-06.md`).

## 2026-08-05 — DL-215 Process Runtime Spec v1.1

**Coach:** Runtime Spec amended for execution offload. **v1.1** is SPEC AUTHORITY;
v1.0 superseded for responsibility/priority. M0–M2 primary; M3 optional; Tradier-first;
arming ceremony; Deployment Pack export; broker-held exits; admin console for residual
fleet; §17 workers only for M3/assist.

**Note (2026-08-06):** Competitive mandate **DL-216** elevates M3-class cloud hosting
to primary for continuous bots; v1.2 Spec amend required. v1.1 remains authority until
v1.2 lands.

**Spec:** `Specs/Strategy-Lab-Process-Runtime-Spec-v1.1.md`

## 2026-08-05 — DL-214 Execution responsibility: user + broker first

**Coach direction:** Primary goal is to **offload running automations** to the
**user (creator)** and the **broker**, not to make Labs the always-on multi-tenant
bot host. Labs = design, validate, version, document, export/handoff, optional
assisted connectivity. Broker = account, orders, custody, broker-held exits when
possible. User = strategy ownership, arming, monitoring, contingency.

**First broker target: Tradier** (paper → live). Market data remains Massive /
Coach chain pipe — do not buy Tradier streaming. Maximize multi-leg open +
OCO/OTO/OTOCO **broker-held** exits; scan graphs stay user-local or manual.

**Architecture:** `Architecture/14-strategy-lab-execution-responsibility.md` §13  
**Implication:** Process Runtime Spec §17 (Labs workers at scale) becomes
**optional M3**, not the product north star. Prefer M0 export/manual, M1
broker-native exits, M2 user-local runtime.

## 2026-08-05 — DL-213b Process Runtime multi-tenant scale (§17)

**Coach:** Plan for **dozens → hundreds** of members with armed automations.
Normative: **control plane (API) ≠ data plane (workers)**; **job queue + leased
workers**; fair multi-tenant claim; manage-before-scan under load; shared market
data fan-out (not per-user sockets); broker throttle gateway; per-identity caps;
decision_log volume/retention. Separate **worker role** required for scheduled/live;
separate microservice repo **not** required. Defaults: soft 5 / hard 10 armed
instances; min scan 60s; MySQL jobs table v1.

**Spec:** `Strategy-Lab-Process-Runtime-Spec-v1.0.md` §17.

## 2026-08-05 — DL-213 Strategy Lab Process Runtime Spec v1.0

**Coach:** Spec for deployment process runtime (FatTail shape of “bots as
processes”): **deployment instance** + **risk envelope** + **scan/manage runners**
+ **typed decisions** + **decision log** + **dry/paper/live ladder**. Explicitly
inherits Continuity (place ≠ SoR; empty-on-unknown), Versioning P1–P8 (explore ≠
rebind; restore does not silent-mutate runners; freeze on live; drift fail loud),
Development Phase gates (no live without BT/FW path), Massive/Tradier split.

**Spec:** `Specs/Strategy-Lab-Process-Runtime-Spec-v1.0.md` (SPEC AUTHORITY).  
**Not:** OptionAlpha clone; free-floating bots before life cycle.

## 2026-08-03 — DL-212 Habit Catalog Spec v0.1 + multi-agent plan

**Coach:** Design architecture locked (`Architecture/13-habit-catalog-design.md`).
**Spec** `FatTail-Labs-Habit-Catalog-Spec-v0.1.md` opened for W0 review (not BUILD
until HC0-G). **Plan:** `docs/Habit-Catalog-Full-Agent-Bench-Plan.md` · board
`agents/p-habit-catalog/`. Sequence HC0→HC6; vertical slice `size-reason`.
Coverage law + Family B floor normative. Implementation blocked on Coach GO.

## 2026-08-03 — DL-211 North star ethos v1.2 (distress vernacular + register)

**Coach / review:** Address false positives on trading death/violence vernacular;
language register on **agent output only**; distress gate independent of ethos MODE;
named support paths; Family B LLM **opt-in** default; priors held until Hotel.

| Topic | Decision |
|-------|----------|
| Distress classifier | **Target = self** (self-harm/suicide), not intensity; exclude suicide spread / trade killed me / blew up / etc. |
| After stop | Session stays open; re-eval each turn; no day lockout |
| Support paths | Free write; US 988; IASP local resources; not founder crisis routing |
| Register | `plain` (default) \| `vernacular` \| `mirror`; mirror off under distress; never on member input |
| ETHOS_MODE=off | Drops ethos preamble only; **distress code gate remains** |
| WORLD_MODEL_PRIORS | Hotel hold; not product-exported until ratified |
| Model-in-loop | Scheduled eval later; CI keeps unit/vernacular corpora |

**Spec:** v1.2. **Code:** `labs_member_ai_ethos.py` V1_2 + tests.

## 2026-08-03 — DL-210 North star ethos v1.1 (completeness)

**Coach + review holds addressed:** Spec **v1.1** supersedes v1.0.

| Hold | Resolution |
|------|------------|
| Distress case | §5.2 #9 + code gate stop-interview (`distress_hold`) |
| Unsourced % in AI world model | Qualitative ethos body; `WORLD_MODEL_PRIORS` sourced/dated §7 |
| Behavioral ban eval | Tests: composed bans present; validator rejects advice/motive; distress no probe |
| Family B → LLM | Spec §5.6 privacy terms |
| Version any wording edit | `LABS_MEMBER_AI_ETHOS_V1_1`; MODE=off fallback |
| Truth 1 quiet week | Explicit nothing-hard branch |

**Alpha:** `labs_member_ai_ethos.py` V1_1; journal distress path; tests extended.

## 2026-08-03 — DL-209 North star & member AI ethos (V1)

**Coach:** True north star — **help traders become enlightened** (secular: present,
aware, integrated; habit-engineered cessation; toughness as enabler). Brand roots:
0DTE ensō + FatTail swoosh (right-skew / fat tails / Zen ink). Retrospective maps to
Four Noble Truths shape; Truth 3 = habit-building machine.

**Spec:** v1.0 GO → **superseded by v1.1** (DL-210).

**Alpha:** `server/labs_member_ai_ethos.py` + Journal/Retro compose/stamp (amended DL-210).

**Lima:** Guide “Why we practice”; CLAUDE.md pointer.

**Follow-on:** Habit Catalog; insight plane; Hotel §7 series; Tango distress copy;
Mike/counsel journal-agent privacy notice.

## 2026-08-03 — DL-208 CSRF Origin/Referer guard (M6)

**Alpha:** Middleware `CsrfOriginMiddleware` rejects POST/PUT/PATCH/DELETE that carry
`ft_session` unless Origin or Referer matches allowlist (`LABS_WEB_ORIGIN`,
`LABS_CSRF_ORIGINS`, same request host, plus localhost/testserver in dev).
Skips safe methods, cookieless requests (login/webhooks), and Bearer agent auth.
Tests: `test_csrf_m6.py`. conftest sets Origin: http://testserver.

## 2026-08-03 — DL-207 SSO email/link reconciliation (M2)

**Alpha:** `identity.resolve_sso_identity` is the single SSO/webhook identity
resolver. Prefer `(provider, external_id)` link; if JWT/webhook email changes and
the new email is free, update Labs email; if email belongs to another identity or
the same email is already linked to a different WP user id → **409**. Used by
SSO callback and membership webhooks. Tests: `test_sso_m2_email_link.py`.

## 2026-08-03 — DL-206 Membership webhook anti-replay (M7)

**Alpha:** `POST /api/integrations/{provider}/membership` requires `timestamp`
(or `sent_at`) inside the HMAC-signed JSON body. Reject if age >
`LABS_WEBHOOK_MAX_AGE_SECONDS` (default 300) or too far future. Exact raw-body
replay within the window → 409. Module: `server/webhook_security.py`.
Tests: `tests/test_webhook_m7.py`. Docs: WooCommerce SSO guide §6 updated.

## 2026-08-03 — DL-205 Auth rate limits (M1)

**Alpha:** In-process sliding-window rate limits on auth routes (`server/rate_limit.py`):

| Endpoint | Default |
|----------|---------|
| POST /login | 10/min per IP + per email |
| POST /forgot-password | 5/hour per IP + per email |
| POST /register | 5/min per IP |
| POST /reset-password | 10/min per IP |
| GET /auth/sso/* | 30/min per IP |

429 + Retry-After. Env overrides: `LABS_RL_*`. Single-worker launchd assumed.
Tests: `tests/test_rate_limit_m1.py`.

## 2026-08-02 — DL-204 Auth hardening H3 allowlist + H1 live role

**Alpha · Mike posture:** High-impact auth fixes implemented in-repo.

**H3:** `LABS_ADMIN_EMAILS` (required outside dev). SSO sets `role_override=administrator`
only if WP is_admin **and** email allowlisted (`admin_allowlist.py`). Seed:
ernie@dudefromearth.com, coach@fattail.ai, conor@fattail.ai.

**H1:** `guards.require_admin` / `require_role(administrator)` use live
`identity.derive_role` — demoted admin JWT → 403. `identity_id=0` forbidden outside dev.
Member `require_role` still uses `feature_role` for Observer elevation.

**H2/H4:** SSO log email domain only; deploy.md nginx/TTL notes; `docs/Auth-Account-Switch-Runbook.md`.

**H5 residual:** agent could not SSH MiniTwo — human deploy still required.

Tests: `test_admin_allowlist_h3.py`, `test_live_role_h1.py`. Board: `p-auth-hardening` CLOSE.

## 2026-08-02 — DL-203 Auth hardening program GO (p-auth-hardening)

**Coach W0 GO:** Multi-agent program to close high-impact auth findings.

- Order: **H5 deploy → H3 admin allowlist → H1 live role → H2 SSO JWT hygiene → H4 account-switch ops**
- Board: `agents/p-auth-hardening/ORCHESTRATOR.md`
- Plan: `docs/Auth-Hardening-Full-Agent-Bench-Plan.md`
- Audit: `docs/Auth-Hardening-Audit-2026-08-02.md`
- H3 allowlist seed emails: ernie@dudefromearth.com, coach@fattail.ai, conor@fattail.ai
- Assessment + reevaluation after each H*-G; M-backlog parked until promoted

**Next:** H5-1 Foxtrot deploy (not localhost-only).

## 2026-08-02 — DL-202 Access Control AC1–AC8 implementation (MVP)

**Alpha · Charlie · Kilo · Delta · Lima:** Access Policy Engine shipped through MVP.

| Phase | Delivered |
|-------|-----------|
| AC1 | constants, keys, DDL 075, evaluate, unit tests |
| AC2 | admin CRUD/bulk/decision/audit, write validation 422 |
| AC3 | lesson evaluate + dual-write free_preview + access JSON |
| AC4 | trade-log read/export/write capabilities + floor |
| AC5 | `/admin/access` cockpit |
| AC6 | sitemap §6.2 notes + anonymous_http_status helper |
| AC7 | bulk API; feature_gates merge deferred |
| AC8 | program PASS with residuals |

**Spec:** v0.4 BUILD AUTHORITY. **Board:** `agents/p-access-control/`.  
**Tests:** `test_access_control_*.py` (41 passed).

## 2026-08-02 — DL-201 Access Control AC1-3 evaluate engine

**Alpha · India · Mike:** `server/access_control/` evaluate path:

- `evaluate` / `evaluate_many` / `effective_plans` / `expand_plans` (eval-time only)
- `require_access` resource hook — **no** public decision route
- Viewer from claims + live plan slugs; PreviewAs empty enrollments
- Data-bearing `read_only_floor`; grandfather course family; campaign fail-closed defaults

**Next:** AC1-4 characterization unit suite → AC1-G.

## 2026-08-02 — DL-200 Access Control AC1-2 schema (075)

**Alpha · India:** Migration `075_access_policies.sql` applied.

- Tables: `access_policies` (PK target_key), `access_policy_audit`
- Intent columns: `selected_plans_json`, `exact_plans_only` — **no** expanded-plan cache
- Spec: Access Control v0.4 §9 exact SoR
- Evidence: migrate dry-run / apply / empty pending; SHOW CREATE verified

**Next:** AC1-3 evaluate engine.

## 2026-08-02 — DL-199 Access Control BUILD AUTHORITY + AC1-1 constants

**Coach:** Spec v0.4 **BUILD AUTHORITY** (W0-G PASS). AC1-1 lands pure package:

- `server/access_control/` — `constants.py`, `keys.py`, `defaults.py`
- Target grammar: `surface:{name}`, `app:{slug}`, `course|module|lesson|resource:{id}`,
  `campaign:{slug}:{part}`
- Plan buckets commercial expand-at-eval; **alumni never auto-added**
- `DATA_BEARING_APPS` = trade-log, journal, playbook
- `ACCESS_UNGATEABLE_TARGETS` login/signup/membership/recovery/`me`
- Type defaults table mirrors Spec §6.3 / as-built (lesson free_preview + membership, campaign fail-closed)
- Tests: `server/tests/test_access_control_keys.py` (13 pure unit tests)

**Board:** `agents/p-access-control/` · next AC1-2 DDL.

## 2026-08-02 — DL-198 Access Control Spec v0.4 (third review)

**Coach:** Third external review of Access Control v0.3 → **v0.4 DRAFT**.

**Blocking fixes:**
1. **Store plan intent; expand at evaluate** (not write-time freeze of slug vocabulary).
2. **Alumni** outside commercial expansion; admitted via min_role ladder; UI copy.
3. (Carried) data-bearing floor; sitemap = anonymous 200.

**Should-fix:** 422-only on illegal app locks (no silent coerce); deny_plans does **not**
strip data-bearing read/export; SSG skeleton (no lock→open flash); complete self-contained DDL;
dead branches removed from algorithm.

**Artifact:** `Specs/FatTail-Labs-Access-Control-Spec-v0.4.md` (supersedes v0.3).  
**Superseded status note:** BUILD AUTHORITY stamped same day — see **DL-199**.

## 2026-08-02 — DL-197 Access Control Spec v0.3 (second review)

**Superseded by DL-198 / v0.4.**  
**Artifact:** `Specs/FatTail-Labs-Access-Control-Spec-v0.3.md` — SUPERSEDED.

## 2026-08-02 — DL-196 Access Control Spec v0.2 (review fixes)

**Coach:** External evaluation of Access Control v0.1 incorporated into **v0.2 DRAFT**.
**Superseded by DL-197 / v0.3.**

**Artifact:** `Specs/FatTail-Labs-Access-Control-Spec-v0.2.md` — SUPERSEDED.

## 2026-08-02 — DL-195 Access Control Spec v0.1 (DRAFT)

**Coach intent:** Admin-controlled gating by role/plan for **pages (surfaces), apps,
and course elements**, with campaign design control (time, CTAs, soft/hard lock)
without deploys.

**Artifact:** `Specs/FatTail-Labs-Access-Control-Spec-v0.1.md` — **superseded by v0.2**.

**Direction:** Unified Access Policy Engine + `/admin/access` cockpit; consumes
Identity Access memberships; absorbs feature_gates and free_preview over phases P0–P2.

**Does not reverse:** Woo commerce; provider_plan_map; server-side auth only.

---

## 2026-08-02 — DL-194 Observer ≡ Navigator via `feature_role` (all gates)

**Decision (Coach):** Paid **Observer** membership (`observer-trial`) has the **same
feature access as Navigator** for the term (DL-126/128). Implement centrally:

- `identity.feature_role(cur, identity_id, session_role)` elevates active Observer
  membership to **navigator** for gates (live coaching, courses, resources, Practice).
- `identity.role_meets(...)` is the single comparison helper.
- `GET /api/auth/me` returns `access_role` for UI chrome (hide free-only CTAs).

**Wired:** live join gates · lessons · progress · resources · Practice
(`can_create_or_gather` / Trade Log) · Journey retro eligibility.

**Free no-plan** stays true `observer` (previews only). Sole product difference remains
**6-week term**, not feature cuts.

## 2026-08-02 — DL-193 Trade Log / Reports: Observer = Navigator Practice gate

**Decision (Coach):** Trade Log and Reports use the **same Practice entitlement** as
Journal / Retrospective (`can_create_or_gather`): administrator, role activator+, or
active **observer-trial** membership — even when the session role cookie is still
`observer`. Free no-plan remains denied.

**Why:** Trade Log wrongly required Activator+ only, blocking paid Observers who should
have full Navigator Practice access for the 6-week term (DL-126 / DL-128).

**Code:** `server/routes/trade_log/common.py` `_require_tool_member` · UI copy on Trade Log
and Reports forbidden states. Superseded in part by **DL-194** central elevation.

**Does not reverse:** free observer = previews only; alumni course library only.

---

## 2026-08-02 — DL-192 SSO post-login deep links (`next`)

**Decision (Coach):** WordPress My Account (and any member CTA) may deep-link into any
Labs path after SSO. Labs callback accepts optional site-relative query `next`
(e.g. `?next=/course`). Default remains `/home`. Unsafe values (absolute URL,
`//…`, etc.) fall back to `/home` — open-redirect safe.

**Why:** Bare `labs.fattail.ai/…` never mints `ft_session`; members hit free-account
CTAs. fotw-sso must always be the entry. `next` lets one SSO hop land on catalog,
Journey, Journal, etc. without hardcoding a single post-login page.

**Ops paste sheet:** `docs/WP-My-Account-Courses-SSO-Link.md`  
**Code:** `server/routes/auth_routes.py` (`safe_next_path`, SSO `next` param)

**Does not reverse:** dual-issuer SSO, `ft_session`, Woo as commerce only.

---

## 2026-08-02 — DL-191 Continuous journaling + day-start routine

**Decision (Coach):** Journaling is **not** an end-of-day task. It is capture **with every
experience throughout the day** — including **pre-market analysis** and **post-market
exhale**. Trade Log holds structure as the experience happens; Journal holds mind. The
day is one conversation (Journal Session v0.6); timestamps and market phase already make
continuous capture load-bearing.

**Day-start routine:** A notification system should **invite the routine when the trader
starts their day** (prep Journal / Practice Context) — gentle, process-only, idempotent,
no shame language, no P&L. Recommended design: member prep time + first Labs open of day
if pre-market note missing. P0 = in-app; browser/email later. Full build follows thin
spec + `member_notify` kind — not a second journal product.

**Education:** Labs OS course Practice module + Guide teach continuous journaling.

**Artifact:** `Specs/FatTail-Labs-Continuous-Journaling-Direction-2026-08-02.md`

**Does not reverse:** Journal Session v0.6 one-session-per-date model; Family B; empty≠zero.

---

## 2026-08-02 — DL-190 Process Flow: state of being + recent-weighted scoring

**Decision (Coach):** Reposition what was branded **Process Integrity (score)** as
**Process Flow** — a **state of being**, the **flow state of your trading process**,
not a test result you “got after the exam.”

**Scoring intent (same decision):**
- Keep **dimension weights** on key parts (quality: adherence, retrospective, etc.).
- Apply **exponential average / decay (EWMA)** so **more recent behavior weighs more**
  than older history — extend the live-presence EWMA pattern to the other time-series
  meters and the overall state, not only Live.
- Language: weight recent more heavily; never “punish.”

**Does not reverse:** DL-171 Option 1 **rebalance** (adherence + retro real weight;
not engagement-majority). This is **not** the rejected rename of trial overall to
“Practice engagement.”

**Working member name:** **Process Flow** (Coach may refine).  
**API key `process`:** keep during migration; framing/UI first.  
**Privacy / no P&L:** unchanged.

**Artifacts:**
- `Specs/FatTail-Labs-Process-Flow-Repositioning-Note-2026-08-02.md`
- Course spine Journey lesson (Process Flow framing)
- Guide copy aligned to Process Flow language
- PI Spec v0.4 header pointer → this decision (full formula EOL in next Journey/PI amend)

**Next build:** India formulas + Alpha `scoring_model_version` bump + shadow; Charlie
UI strings; characterization tests for EWMA half-lives.

---

## 2026-08-01 — DL-189 Navigator pricing $267/mo · $2,997/yr

**Decision (Coach):** Navigator list prices are **$267/month** and **$2,997/year**
(was $250 / $2,500). Annual badge **Save $207/year** vs 12× monthly.

**Updated:** `plans.display_json` (mig 066), seed_dev, Guide, Membership Tiers Spec,
Course Hosting Spec, SEO offers note.

---

## 2026-08-01 — DL-188 Observer membership 6 weeks (habit formation)

**Decision (Coach):** Observer membership duration is **6 weeks** (not 4).

**Rationale:** Give process habits time to form. Habit research commonly cites
on the order of **~33–66 days** for a habit to hold; six weeks sits in that band.
Product/billing: **$17/wk or $102** for the six-week term. Full Navigator
access during the term; complete the six weeks → alumni course year rule unchanged.

**Materials updated:** `plans.display_json` (mig 064), `seed_dev.py`, membership
FAQ + Guide, Start Here course copy (description + roadmap lessons), hub-intro
script, Membership Tiers Spec already stated 6 weeks / $102.

**Not changed:** Live Presence EWMA half-life (4 weeks) — different concept.
`free_observer` tenure ramp (4 weeks) — not the paid Observer membership.

---

## 2026-08-01 — DL-187 Chain archive: collect local, not on-demand history

**Decision (Coach):** Option chain **history for Test is local**. Collect forward
into `data/market/chains/`. **Do not** rely on on-demand re-fetch for historical
windows. On-demand is only optional “latest” live fill-in.

**Coach feed reality (2026-08-01):** Full SPX chain already arrives as fast as the
vendor delivers (**~5–10 s**) with Greeks; **SPX underlier differential pricing
~4 Hz**. Labs should **ingest those feeds** as primary — not re-poll Massive for
the same SPX surface. Massive poller remains a fallback / other-underlier tool.

**Ingest design (Coach):** **Tee/pipe a copy** of whatever is already delivered to
the FatTail app each trading day into a local archive. That archive is the
historical backtest corpus. Production consumers stay unchanged.

**Other symbols:** For the supported non-SPX-chain universe (Mag 7, ETFs, few
futures underliers), **download ~1 year of history** (Massive bars/trades) for
historical Test. Refresh incrementally. Still **no** multi-year Mag 7 option-chain
warehouse.

**Landed:** `server/market_data/` (`MassiveClient`, `ChainStore`, `chain_collector`
CLI), unit tests for store, gitignore `data/market/`. Next: pipe from FatTail app
feed → archive; underlier history bulk load.

---

## 2026-08-01 — DL-186 Strategy Lab: Massive data, dual Test, chain collect-forward

**Decision (Coach):**

1. **Market data = Massive** (already paid). **Do not** buy Tradier ~$400/mo streaming.  
2. **Execution / deploy = Tradier** only (paper → live orders and fills).  
3. **Test has two modes — both required:**  
   - **Historical** — replay frozen underlier history + stored option chain snaps  
   - **Live** — Massive WebSocket (signal-only or Tradier paper)  
4. **SPX chains:** no deep historical archive assumed. **Collect forward** (e.g. few weeks
   of periodic snapshots), then run historical structure tests on that recent window.
   Until enough history exists: underlier historical tests + live tests still ship.

**Doc:** `Architecture/09-strategy-lab-tradier.md` (expanded).

---

## 2026-08-01 — DL-185 Strategy Lab execution target: Tradier

**Decision (Coach):** **Tradier is the target broker platform** for Strategy Lab
bots and live/paper execution rails.

| Item | Lock |
|------|------|
| **Primary broker** | **Tradier** (Coach relationship + business hub page) |
| **Scope stages** | Build · Test · Run bots · live and paper |
| **Dogfood** | Coach has Tradier; IB / TradeStation **not** v1 targets |
| **TradingView** | **Reach + funnel** (alerts / ideas / optional webhooks) — not source of truth for risk or fills |
| **tastytrade / ToS** | Optional later adapters or human desk; not v1 bot host of record |
| **Robinhood** | Out of product scope for bots |
| **Architecture** | Broker-agnostic adapter interface; **Tradier first implementation only** |

**Rationale:** Relationship + hub page enable distribution and integration
partnership; REST API fits Labs FastAPI; options multi-leg automation is dogfoodable
without Gateway. Futures remain phase-2 after equity-options path works.

**Product promise:** Process brakes, kill switch, logs — never “set and forget”
profit claims. Paper/virtual before live.

**Landing:** Strategy Lab member copy names Tradier as intended execution partner
when workspace ships. Spec / adapter implementation is a later build packet.

---

## 2026-07-31 — DL-180 FatTail Hard H3 — MT on Journey composite

**Decision:** Mental Toughness meter wired into Process Integrity overall when
member has **active** Hard enrollment (Hard Spec v1.0 §8 · H3).

| Item | As-built |
|------|----------|
| Model version | `pi-weights-v1-option1+mt` |
| Meter | `mental_toughness` empty if not enrolled/paused/exited |
| Raw | 50% streak vs sprint cap + 50% completion rate (window) |
| Weights | `PROCESS_METER_WEIGHTS_WITH_MT` seven-maps (Spec §8.3 integers) |
| Journey Spec | §4.1 amended — seventh meter |
| Tests | `test_hard.py::test_process_meters_mt_empty_then_enrolled` |

**Not in H3:** photos (H4), agent (H5). Coach may retune MT weight integers later.

---

## 2026-07-31 — DL-179 FatTail Hard H2 — Toughness UI shipped

**Decision:** H2 member surfaces for Hard Spec v1.0.

| Route | Content |
|-------|---------|
| `/app/toughness` | Hub: physiology cite, status, True 75 + FatTail Hard cards |
| `/app/toughness/true-75` | Frisella credit + honor-system enroll |
| `/app/toughness/fattail-hard` | Progressive program enroll (20/40/75) |
| `/app/toughness/today` | Daily task log + progress record |

**UI:** `web/components/hard/*` · `web/lib/hardApi.ts` · Apps grid card **Toughness**.  
**Cite block:** mandatory Touroutoglou et al. 2020 on hub and program pages.  
**Not in H2:** photos (H4), MT in Journey composite (H3), agent (H5).

---

## 2026-07-31 — DL-178 FatTail Hard H1 — domain + API shipped

**Decision:** H1 domain spine for Hard Spec v1.0 implemented.

| Item | As-built |
|------|----------|
| Migration | `059_hard_mental_toughness.sql` — `member_hard_enrollments`, `member_hard_daily_logs` |
| Domain | `server/hard_domain.py` — variants (True 75 honor + FatTail 20/40/75), how_it_works, miss→restart day one, enroll, daily, pause/exit/resume, compliance, MT raw empty-until-active |
| API | `GET /api/me/hard`, `/variants`, `POST enroll|daily|pause|exit|resume` |
| Privacy | Identity-scoped FKs; private by default; no board routes; physiology cite on snapshot |
| Photos | Column `photo_resource_id` nullable (H4); H1 progress_note for record |
| Tests | `server/tests/test_hard.py` — 4 passed |

**Not in H1:** UI, PI composite MT weight, photo upload, agent.  
**Next:** H2 `/toughness` UI.

---

## 2026-07-31 — DL-184 Life events & priority shift (Hard copy)

**Decision (Coach):** Member copy must warn that people often are **not prepared**
for how the program changes **lives and priorities** — especially **no drinking**
and **no diet cheating**. Vacations, weddings, and other life events will challenge
resolve; rules do not pause.

**Landed:** `HOW_IT_WORKS.life_and_priorities` + body/rules; HowItWorks + FatTail/
Today copy; Hard Spec §6.

---

## 2026-07-31 — DL-183 Ladder psychology 20→40→75

**Decision (Coach):** Member copy must name the lived path:

- After **20**, people may give up or choose **40**; some need **20 twice** before
  40 feels possible (capacity, not failure).
- At **40**, most hit a **major period of despair**; through that → end is reachable.
- **75** by stacking rungs, not skipping the middle.

**Landed:** `HOW_IT_WORKS.ladder` + per-variant `ladder_blurb`; HowItWorks + FatTail
enroll UI; Hard Spec §6.

---

## 2026-07-31 — DL-182 Toughness How-it-works + 20/40/75 ladder

**Decision (Coach):**

1. **How it works** must be explicit on `/app/toughness`: these programs develop
   **Mental Toughness**; complete all required activities every day for the full
   length; fail any activity → **restart day one**; hard but most effective for
   real physiology/mindset change; become mentally tough by progressing the set.
2. **Intro video** slot on hub (YouTube via `HARD_INTRO_VIDEO_ID` when published);
   written rules are the contract until the video ships.
3. **FatTail Hard lengths:** **20 / 40 / 75 days** (breakthrough periods), not
   7/14/30. Variants: `fattail_sprint_20|40|75`. `miss_policy: restart`.

**Landed:** `hard_domain.HOW_IT_WORKS` + restart engine; `HowItWorks` UI; Hard Spec
§6–7; tests for 20/40/75.

---

## 2026-07-31 — DL-181 Product term: mental toughness (not tenacity)

**Decision (Coach):** Member-facing Hard / physiology copy uses **mental toughness**,
not “tenacity.” Academic sources may retain “tenacity” in titles/quotes only;
product never surfaces that synonym in UI — maps the capacity to mental toughness.

**Updated:** PhysiologyCite (no member-facing “tenacity”), hard API note, journey MT
hint, Apps blurb, Hard Spec §4, PI Spec §5.1b, aMCC source pack product claim lines.

---

## 2026-07-31 — DL-177 FatTail Hard H0 GO — Spec v1.0 build authority

**Decision (Coach):** **GO on H0** for FatTail Hard / Mental Toughness program.

**Landed:**

| Artifact | Path |
|----------|------|
| Implementation plan | `agents/p-fattail-hard/IMPLEMENTATION-PLAN.md` |
| Orchestrator | `agents/p-fattail-hard/ORCHESTRATOR.md` |
| **Hard Spec v1.0** | `Specs/FatTail-Labs-Hard-Mental-Toughness-Spec-v1.0.md` (**BUILD AUTHORITY**) |
| Science pack | `agents/p-fattail-hard/science/aMCC-source-pack-v1.md` |

**Coach inventory C1–C10** retained in Spec (True 75 + FatTail Hard + MT composite when
enrolled + mandatory aMCC cites). Photos: requirement **kept**; H2 ships progress
**record**, photo upload **H4** (stated up front — not silent drop).

**Primary science:** Touroutoglou et al. (2020) *Cortex* “The tenacious brain” (PMID
31733343). Hotel formal secondary verify before H2 copy.

**Next:** H1 domain + privacy + API. No Track C product deletion without Coach.

---

## 2026-07-31 — DL-176 Coach Content Law (hard rules for all agents)

**Decision (Coach):** Non-negotiable operating law for every agent and every review
folded into the repo. Doctrine **§11**.

1. **Nothing of Coach’s is removed** — not from a spec, draft, or summary. If something
   “doesn’t belong,” it **stays** and the objection goes **next to it**, marked as the
   objector’s, for Coach to accept or throw out.  
2. If an agent **changed or dropped** Coach content, say so **up front** — not buried in
   a changelog where a downstream agent turns it into a fait accompli.  
3. **Research before questioning** — search, read actual sources, check evidence; not
   priors dressed up as conclusions.  
4. **Blocking** only when something breaks an **invariant**, breaks the **law**, or breaks
   the **system**. Everything else is an **opinion**, free to discard, and **labeled**
   that way. Disagreement may **not** be promoted into a constraint by reaching for risk
   language.

**Why:** DL-173 (FatTail Hard silent de-scope) is the failure mode this law prevents.
External reviews remain valuable **input**; they never become silent product law.

**As-built:** `agents/bench/doctrine.md` §11 · `spec-create-review-workflow.md` · India/Tango
charters · `AGENTS.md` · agent-template completion checklist.

---

## 2026-07-31 — DL-175 Hard must cite physiological underpinnings (Coach)

**Decision (Coach):** FatTail Hard / Mental Toughness **shall cite the physiological
underpinnings** of the program — not slogan-only discipline marketing.

**Required on member-facing Hard surfaces:** what is trained (mental
toughness/persistence under effort cost), **aMCC** as the literature locus, why
repeated voluntary challenge is the intervention, and **named sources**
(paraphrase-and-attribute). Product term: mental toughness (DL-181).

**Canonical anchor paper (minimum pack):**

- Touroutoglou, A., Andreano, J., Dickerson, B. C., & Barrett, L. F. (2020). The tenacious
  brain: How the anterior mid-cingulate contributes to achieving goals. *Cortex, 123*,
  12–29. https://doi.org/10.1016/j.cortex.2019.09.011

**Forbidden:** guaranteed brain growth, medical diagnosis/treatment claims, uncited
“science says,” profit claims from willpower.

**Gates:** Hotel (+ Bravo) on sources · Tango on capacity/shame · Sierra/Charlie on cite
blocks in UI · agent source IDs when explaining MT/Hard.

**Spec:** PI Scoring Guidance v0.4 **§5.1b**. Supersedes soft language in DL-174 on
“may use” — citation is **mandatory**, not optional flavor.

---

## 2026-07-31 — DL-174 FatTail Hard thesis: aMCC / willpower (Coach)

**Decision (Coach):** FatTail Hard / Mental Toughness product framing is **capacity
training for persistence and willpower**, associated with the **anterior mid-cingulate
cortex (aMCC)** — sometimes called the “willpower muscle” — described as a brain region
linked to persistence that can strengthen with repeated challenging use (75 Hard–class
protocols, deliberate hardship training as analogy).

**Product consequences:**

- Hard remains **Coach product scope** (DL-173); not a side gimmick.  
- MT meter (when enrolled) scores **behavioral compliance**, not medical imaging.  
- Education copy uses aMCC framing with paraphrase-and-attribute + no guaranteed
  clinical outcomes / no profit claims.  
- Spec: PI Scoring Guidance v0.4 **§5.1a**.  
- Build still needs Privacy/safety/counsel work for photos/health-adjacent data — constraints
  on *how*, not *whether*.

**Amended by:** DL-175 — citing physiology is **required**, not optional.

**Not decided here:** exact MT weight table when enrolled; Track C ship date.

---

## 2026-07-31 — DL-173 FatTail Hard restored — unauthorized de-scope failure

**Failure (owned):** Coach **explicitly included** FatTail Hard / True 75 / Mental
Toughness in Process Integrity Scoring v0.1 and **never removed it**. An external
review (Claude) recommended parking Hard and never feeding the composite. The agent
folding that review into Spec v0.3 / DL-169 **treated that as product law without
Coach disposition and without telling Coach** the feature was being removed from
scope. That is a **colossal process failure**: reverse of doctrine principle 10
(ideas flagged, not discarded) and of Coach final authority.

**Correction (Coach 2026-07-31, this entry):**

| Item | Status |
|------|--------|
| FatTail Hard / True 75 / MT | **Coach product scope — restored** |
| “PARKED / never feeds composite” as *product* decision | **Void** |
| Privacy, consent, counsel, safety reviews | Remain **implementation constraints** — do not authorize deletion |
| MT scoring design | Empty until enrolled; **may enter composite when enrolled**; never zero non-enrollees; never membership gate; never inject MT because PI is weak |
| Spec | v0.4 §1, §5 rewritten · FI-002 `ADOPTED` · FI-010 `RESHAPED` |

**Rule going forward:** No agent or external review may drop or “park forever” a
feature Coach put in a thesis/spec **unless Coach explicitly disposes it and is
notified the same day**. Reviews may **flag risks**; only Coach **removes scope**.

**Apology:** Coach was right to call this. Silence + de-scope is worse than a hard
conversation about constraints.

---

## 2026-07-31 — DL-172 Process Integrity Track A P0 shipped (Option 1 weights)

**Decision:** Implement PI Scoring Spec v0.4 Track A P0 in as-built Journey meters.

| Item | As-built |
|------|----------|
| Model version | `scoring_model_version` = `pi-weights-v1-option1` on `process` |
| Overall | Weighted mean `round(Σ w·raw / Σ w)` — raw already 0–100 |
| Weights | `PROCESS_METER_WEIGHTS` all seven `meter_profile` ids (Option 1) |
| Adherence dual-empty | no trades → empty; trades untagged → raw 0 included |
| Shadow | `overall_raw_equal_mean` during migration |
| Meter field | `weight` per meter; `weights` + `weights_applied` on process |
| Specs | Journey Experience §4.1 amended; PI Spec v0.4 points to code/Journey SOT |
| Tests | `test_journey_scores.py` — weights, arithmetic, dual-empty, API version |

**Code:** `server/journey_scores.py`. **Not in this ship:** Track B/C, self-assessment, journal scanning.

**Cross-ref:** DL-171 Option 1 · Spec v0.4 · FI-001/017/018/019/020.

---

## 2026-07-31 — DL-171 Process Integrity weights: Option 1 rebalance (Coach)

**Decision (Coach):** Process Integrity scoring uses **Option 1 — rebalance**, not
Option 2 rename.

- Keep the name **Process Integrity** for all stages (including Observer trial).  
- **Adherence + retrospective** carry real weight from day one.  
- Establishing/tenure absorb early noise — do not use engagement-majority weights to
  “protect” new members.  
- Canonical tables: Spec **v0.4 §3.6** (trial quality share **45%**).  
- Dual-empty adherence (v0.4 §3.5) remains mandatory so quality weight cannot be
  renormed away by never tagging.

**Rejected:** Renaming observer overall to “Practice engagement” / Labs loop.

**Flags:** FI-017 → `ADOPTED`. FI-001 → `ADOPTED` (weighted overall under Option 1).

**Next for build:** India/Tango on v0.4 Track A P0 → Alpha implement weighted overall +
dual-empty + `scoring_model_version` + Journey Experience Spec amend in same body of
work. Integer tweaks to §3.6 still allowed before Alpha if Coach edits; default **as-is**.

---

## 2026-07-31 — DL-170 PI Scoring Spec v0.4 (design review folded)

**Decision:** Design review of Spec **v0.3** (Claude) accepted as high-quality input
(not a standing gate). Landed in:

- `agents/bench/reviews/2026-07-31-pi-scoring-v03-design-review.md`
- `Specs/FatTail-Labs-Process-Integrity-Scoring-Guidance-Spec-v0.4.md`
- Flags FI-017…FI-022

**Correctness fixed in v0.4:**

1. Weighted overall formula — drop erroneous `100 ·` when raw is already 0–100  
2. Weight tables for all seven `meter_profile` ids  
3. Dual empty for adherence (untagged trades → raw 0, not renorm-away)

**Coach decision blocking P0 weight GO:** engagement-majority trial score vs true
Process Integrity — **Option 1 rebalance (recommended)** or **Option 2 rename** (§3.0 / Q6).

**Also:** doc EOL into Journey on P0; no waiver language; no self-assessment collect
until Track B; no journal-body distress scan; checkable floor-support/graduation
proposals; mandatory model version + shadow migration.

**India/Tango:** still own formal gates independently when Coach requests them.

---

## 2026-07-31 — DL-169 PI Scoring Spec v0.3 (Claude review folded)

**Decision:** External review of Process Integrity Scoring **v0.1** (Claude) is accepted
as high-quality. Folded into:

- Review artifact: `agents/bench/reviews/2026-07-31-pi-scoring-v01-external-review.md`
- Spec: `Specs/FatTail-Labs-Process-Integrity-Scoring-Guidance-Spec-v0.3.md` (supersedes v0.2)
- Flags FI-008…FI-016

**Build disposition:**

| Track | GO |
|-------|-----|
| **A Scoring** (deterministic meters/weights) | Eligible after Coach GO + Journey amend + tests |
| **B Analyst + chat** | BLOCKED — phase route + scoped agent credentials |
| **C FatTail Hard / True 75** | PARKED — counsel + DPIA; **default never feeds PI composite** |

**Accepted blocks from external review:** no self-SSOT; agent must not mutate profiles;
Hard health/photo/trademark out of scoring doc; floor-support not hardship-on-fragility;
conversion firewall on weights; `meter_profile` derived only; paraphrase-only excerpts;
no Monday multi-track launch; gradeable math + characterization tests.

**Already fixed before Claude (kept):** MT inverted gate rejected; equal-mean honesty;
Live EWMA; private PI vs contribution board.

**Not build GO yet:** v0.3 remains DRAFT until Coach Phase-5 per track.

---

## 2026-07-31 — DL-168 The bench strengthens with every invocation

**Decision (Coach intent):** The Agent Bench’s primary process law is **compounding
strength**, not merely “don’t discard ideas.”

**Doctrine principle 10 (restated):** Every substantive invocation must leave the
ensemble stronger — at least one durable delta (truth, memory, skill, doctrine, or
capacity learning). Conversation-only residue is incomplete work.

**Supporting mechanics (not the goal):**

- Ideas that cannot ship as written → **flag + discuss** (ADOPTED / DEFERRED / PARKED /
  RESHAPED) via `Architecture/flagged-ideas.md`
- Review verdicts require **§ Bench delta** (+ flags when relevant)
- First-principles law 8: Leave the Bench Stronger
- India / Tango / templates: completion includes bench delta

**Unchanged:** Guardians still block unsafe **build**. Strengthening does not mean
shipping unsafe design; it means the *next* invocation is smarter for having run this one.

**Rationale:** The bench exists to compound mastery. Renting intelligence for one
session and forgetting is failure — even when the immediate packet “passes.”

---

## 2026-07-31 — DL-167 Process Integrity Scoring & Guidance Spec v0.2 (draft)

**Decision:** Coach draft “Trader Process Integrity Scoring & Guidance System v0.1”
is **reviewed and superseded** by design-authority draft:

`Specs/FatTail-Labs-Process-Integrity-Scoring-Guidance-Spec-v0.2.md`

**Review outcomes folded into v0.2:**

| Keep | Change / reject |
|------|-----------------|
| Process-only; no P&L | Drop “v1.0 / Monday full system” build claim |
| Six Journey dimensions + Live EWMA | Anchor to **as-built** meters/tenure/empty |
| Profile-shaped weights (target) | Equal mean remains interim until P0 weights ship |
| Analyst + self-assessment + Hard (phased) | MT **empty until enrolled** — reject v0.1 “inject MT when PI weak” |
| Research grounding | Soft self-assessment (skip OK); Hard never membership gate |
| | Profiles = as-built set (monthly/annual nav, alumni, free) |
| | P0–P3 delivery; Monday = P0 weights only if anything |

**Not build GO:** v0.2 is DRAFT design authority. P0 (weighted overall + transparency)
needs explicit Coach GO + Journey Spec bump in same work. Hard / agent = P2.

**Cross-ref:** DL-165/166 (Live), Journey Experience §4, Gamification §3.3, Privacy v0.1.

---

## 2026-07-31 — DL-166 Live presence meter: weekly EWMA (near-term heavier)

**Decision:** Process Integrity **Live presence** is an **EWMA of weekly check-in
presence** (binary 1/0 per Eastern ISO week), not streak-only and not a flat
streak/coverage blend.

```
α = 1 − 0.5^(1/half_life)   # half_life = 4 weeks
s_t = α · x_t + (1−α) · s_{t−1}   # oldest → newest over live_horizon_weeks
raw% = round(100 · s_final)
```

Grace: incomplete current week with no check-in is omitted (same spirit as streak).

**Rationale (Coach):** Reward consistency; punish lack of consistency; weight
**near-term** consistency heavier than long-term — exponential decay of older
weeks. Recent slack dings harder than an equal-length drought further back;
comeback streaks recover faster than a flat multi-month average but still sit
below continuous presence. Leaderboard / contribution remains streak-only (§3.4).

**Supersedes:** DL-165 blend formula (same day). Horizons unchanged (trial 6 /
monthly 16 / annual 20 / …).

**As-built:** `live_presence_ewma` · `live_week_presence_series` ·
`LIVE_HALF_LIFE_WEEKS=4`. Detail: `{pct}% EWMA · {streak}w streak ·
{active}/{horizon} weeks present`. Specs + `test_journey_scores` (near-term vs
faded drought, alternating vs consecutive).

---

## 2026-07-31 — DL-165 Live presence meter: streak + coverage blend

**Decision:** Process Integrity **Live presence** is no longer streak-only.
Formula (personal process meter only):

```
streak_pct   = min(streak, live_streak_cap) / live_streak_cap
coverage_pct = active_weeks / live_horizon_weeks   # empty weeks ding
raw          = 0.5 * streak_pct + 0.5 * coverage_pct
```

**Rationale:** A 10-week check-in streak after slacking the prior couple of months
must not read as full Live integrity — coverage over a multi-month horizon pulls
the score down. Leaderboard / contribution still uses attendance streak alone
(Journey Gamification Spec §3.3–3.4).

**Profile horizons:** Observer trial 6w · Navigator monthly 16w · annual 20w ·
Activator 16w · Alumni 12w · Free 8w. Caps unchanged.

**As-built:** `journey_scores.live_presence_percent` · meter detail
`{streak}w streak · {active}/{horizon} weeks present`. Specs: Journey Experience
§4.1 live · Gamification §3.3. Tests: drought vs pure-streak cases in
`test_journey_scores.py`.

**Superseded by:** DL-166 (EWMA; same day).

---

## 2026-07-30 — DL-164 Journal Retrospective v0.7.1 PROGRAM COMPLETE

**Decision:** Agent-bench program `agents/p-retrospective-v07/` is **COMPLETE** (RT07-9-G
**PASS**). Ceremony frame as-built through R1–R9:

| Phase | As-built |
|-------|----------|
| R1 | mig **055** cadence + columns; routine day = member message NY |
| R2 | Nine fixed-order ceremony steps (anti-wizard) |
| R3 | `period_indicator` (period only; rolling not co-framed) |
| R4 | `emotion_mirror` + lexicon→step map |
| R5 | clustering · trends (floor 4) · process correlation (no P&L) |
| R6 | interruption notice + forward-only cadence stamp/history |
| R7 | mig **056** in-app material notifications (once/period; RTH suppress) |
| R8 | mig **057** sequence agent + prompt stamp; code guardrails |
| R9 | Practice Export Spec **v1.3**; export/purge for new Family B surfaces |

**Export:** `Specs/FatTail-Labs-Member-Practice-Export-Spec-v1.3.md` — retrospective
model_version **1.1**, notifications + cadence_history; purge keeps
`identities.retro_cadence_days` setting.

**Evidence:** pytest suite (retrospectives · habits · agent sequence · notify · export ·
journey · journal sessions) **165 passed** (2026-07-30).

**Board:** `agents/p-retrospective-v07/` — **PROGRAM COMPLETE**.

**Deferred (unchanged §20):** optimal-window mechanism; email Family B payload until Mike
approves; external LLM for sequence agent; first-class open-position model.

---

## 2026-07-30 — DL-163 Journal Retrospective Spec v0.7.1 BUILD AUTHORITY (Coach GO)

**Decision:** Journal Retrospective **v0.7.1** is BUILD AUTHORITY. Product frame: ceremony
that is walked (anti-wizard fixed-order sections), not a scrollable report. Cadence is a
trader setting (forward-only history). Indicator uses Journey meters only — period-scoped
in ceremony, rolling in Journey, never one frame. Routine day = member message local day
(amends Journal Session / Journey dual-read). Keep rate member-facing fact only, paired
with specificity for product eval. Notification in-app first. Board
`agents/p-retrospective-v07/`. v0.6 remains as-built for shipped APIs until R-phases land.

**Locks (§20):** 1 interim rules SoR · 2 two contexts · 3 one retro · 5 period adherence ·
9 routine day · 10 keep-rate fact · 11 in-app notify first.

**R1 landed same day:** mig **055** (`retro_cadence_days`, cadence history, retro columns);
`list_member_message_ny_dates` / routine dual-read; create stamps period_index /
cadence_days_at_period / interrupted.

**Plan:** `docs/Journal-Retrospective-v0.7.1-Full-Agent-Bench-Plan.md`

---

## 2026-07-30 — DL-162 Journal Session v0.6 residual program close

**Decision:** Residual agent-bench program for Journal Session **v0.6** is **COMPLETE**
(JS6-9-G PASS). Closed: agent guardrail corpus + RTH member-first tests (J2); admin
prompt version API + `/admin/journal-prompts` UI with session stamp (J3); formal surface
gate bundle; retro closure-preview warning evidence (J7); scope-true closure suite (J8);
Practice Export Spec **v1.2** for one-session/date · tags · attachments (J9).

**Plan:** `docs/Journal-Session-v0.6-Residual-Agent-Bench-Plan.md`  
**Board:** `agents/p-journal-session-v06/` — PROGRAM COMPLETE.

**Non-blocking residuals:** live LLM CI optional; Trade Log SoR R2R field later.

---

## 2026-07-30 — DL-161 Journal Session Spec v0.6 BUILD AUTHORITY (implement GO)

**Decision:** Journal Session **v0.6** is BUILD AUTHORITY. One conversation per
`(identity_id, journal_date)` (mig **054** merge + UNIQUE); get-or-create API; chatbot
surface with fixed-height thread, visible timestamps, header media (drop/click/lightbox
caption), Week member-message band dots with deep-link scroll, calendar cell navigation
(no Open panel), trades strip width/R:R/entry-exit (process framing), Tag Manager
assign-only. Board `agents/p-journal-session-v06/`. Supersedes v0.5 multi-entry product
frame. Tag Manager prerequisite remains COMPLETE (DL-159).

**Evidence / as-built:** domain get-or-create; `SessionMediaHeader`; `week-activity` API;
`JournalCalendar` nav; export model_version 1.1 attachments; prompt_version_id stamp;
collision table for dual structured merges.

**Locks (interim):** agent display name "Journal"; client structural R:R until Trade Log
SoR; band midpoint AM/PM + later_day→CL.

**Program remaining:** formal Delta gates JS6-2-G…JS6-9-G; admin prompt edit UI; full
guardrail corpus; retro warning polish; export Spec bump formal.

---

## 2026-07-29 — Catalog manual order + sections (Catalog-Order v1.0)

**Decision:** Course catalog order is editorial, not computed: `courses.sort_order`
(migration 038, default sort) + `courses.catalog_section` display grouping (section
order derived from lowest member sort_order — no second table). Reorder via
`POST /api/admin/courses/reorder` (full id list, x10 rewrite) with B4 stepper UX on
the catalog cards; section assigned in the card editor. Filters/explicit sorts render
flat (headings would mislead). Fix landed same-day: admin course list now returns
`id`/`sort_order`/`catalog_section` and follows manual order (the missing `id` made
the steppers silently no-op for admins).

**Spec:** `Specs/FatTail-Labs-Catalog-Order-Spec-v1.0.md` (DRAFT — Coach approval pending).

## 2026-07-28 — DL-065 Admin Users section + activity analytics

**Decision:** New `/admin/users` section shows every identity (keyed by email)
with login history, membership, and engagement. Adds migration `039`
(`login_events`, `page_views`), `server/activity.py` (best-effort write helpers +
gap-based `estimate_sessions`), `routes/pageview.py` (member page-view ingest),
`routes/users_admin.py` (roster list/detail/CSV, admin-only), a login hook in
`_session_response`, and a client `PageViewTracker` mounted in `AppChrome`.

**Rationale / scope:** Auth was stateless with no login record and no telemetry.
Login logging is captured at the single session choke-point; page views only for
authenticated members on non-`/admin` routes (anonymous + admin navigation are
never recorded). Analytics writes are best-effort and **never** block login or
navigation. Membership/"how they logged in" reuse existing `memberships` /
`identity_links` (SSO already syncs fattail.ai / 0-dte). "Time on platform" is an
**estimate** from page-view sessionisation (30-min gap), single-view sessions = 0
(no heartbeats, no guessing). Engagement metadata only — member private content
stays under the Member-Data-Privacy spec. Spec:
`FatTail-Labs-User-Activity-Analytics-Spec-v1.0`. Tests: `test_user_activity.py`.
Open: consent/disclosure line + `page_views` retention (flagged to Coach).

---

## 2026-07-29 — Practice harden H0–H3 institutional close

**Decision:** p-practice-harden phases **H0–H2 PASS**; **H3** documents as-built truth.

| Topic | Record |
|-------|--------|
| Identity | `_storage_identity_id` fallback for session id `0` only when `LABS_ENV=dev`; else 401 |
| List legs | Batch load; not N+1 |
| Domain | `server/trade_log_domain/` single source for match / open-on-day / estimated PnL / series |
| API | `analytics/day-book`, `analytics/days-interest`, `analytics/reports-book` |
| Client | No dual TS domain; `web/lib/tradeLogApi.ts` shared client |
| Routes package | `server/routes/trade_log/{common,accounts,trades,analytics,io}.py` |
| Spec honesty | Trade Log Spec §15 as-built; Journal-Retrospective P0 shell honesty |
| Ops vs product | `agents/p-practice-harden/OPS-VS-PRODUCT.md` |
| Migrations | Practice suite / trade log already on `040`/`041` era; no new H0–H2 migrations |

**Non-goals locked:** live brokers; Retrospective content; productizing ops xlsx/seeds;
H4 virtualization only after Coach GO.

**Evidence:** `agents/p-practice-harden/gate-reports/H{0,1,2}-delta-gate.md` · H3 Spec/docs.

## 2026-07-29 — Practice domain single-source shipped (H1 PASS)

**Decision:** H1 of p-practice-harden **PASS**. Authoritative domain is
`server/trade_log_domain/`. Read models:

- `GET /api/me/trade-log/analytics/day-book`
- `GET /api/me/trade-log/analytics/days-interest`
- `GET /api/me/trade-log/analytics/reports-book`

Reports and Journal consume these APIs; client dual match/PnL algorithms removed.
`seed_reports_demo_pnl` uses the same domain. Behavior freeze: ported client formulas.

**Evidence:** `agents/p-practice-harden/gate-reports/H1-delta-gate.md` · pytest 20 passed
(domain + analytics + trade_log).

## 2026-07-29 — Practice domain single-source design (PH1-0)

**Decision:** Position matching, open-on-day, synthetic realized PnL, and Reports
equity/DD series move to server package `server/trade_log_domain/` with pure
functions. Clients consume read models:

- `GET /api/me/trade-log/analytics/day-book`
- `GET /api/me/trade-log/analytics/reports-book`

**Behavior freeze:** port current `journalDayBook` / `reportsBook` formulas 1:1 —
no intentional metric change. Starting capital stays client preference (query
param). Spec `records/*` may alias later; as-built analytics paths are primary
until Spec honesty (H3). Design: `Architecture/11-practice-domain-single-source.md`.

## 2026-07-29 — Practice stack hardening board (p-practice-harden)

**Decision:** Architectural hardening of the Practice suite is run as Agent Bench
project `agents/p-practice-harden/`: phased H0–H4, **mandatory multi-agent
collaboration** (Primary + required Reviewers + Delta gate per phase). Goals:
isolation fail-loud, kill N+1 list, single-source position/PnL, module splits,
Spec/as-built truth — without behavior change unless Coach-labeled usability wins.
H0 **PASS** (identity gate + batch legs + useful-only tests).

**Board:** `ORCHESTRATOR.md` · **Charter:** `CHARTER.md` · Seeds start at PH0-*.

## 2026-07-29 — Retrospective first-class Practice nav + shell

**Decision:** **Retrospective** is a first-class Practice suite player between
**Journal** and **Playbook** (`/app/retrospective`). Spec updated:
`Specs/FatTail-Labs-Journal-Retrospective-Spec-v0.1.md` (§3.1–3.3). Retrospectives
**filter up into Journey** as process milestones (read model; later slices).
Slice **P0** ships nav + page shell only — no week roll-up/agent yet.

**Nav order:** Trade Log · Reports · Journal · **Retrospective** · Playbook.

## 2026-07-28 — Practice home = Reports (equity + drawdown)

**Decision:** Navigating to **Practice** opens **Reports** (`/app/practice` →
`/app/reports`). Layout: suite nav (Trade Log · Reports · Journal · Playbook);
**equity curve** primary; **drawdown** directly under; **stat blocks**; then
**outcome + strategy distribution** charts. Multi-account via pager (All + each
active account). Curves computed client-side from Trade Log fills until
`records/summary|series` API lands. Framing remains process-first (path health,
not profit theater).

## 2026-07-28 — Practice suite: Reports + shared nav + Journal calendar

**Decision:** Product name for process totals/charts is **Reports** (not
Statistics, not Records). Shared Practice suite chrome:
**Trade Log · Reports · Journal · Playbook** (`PracticeSuiteNav` on every suite
route). Top-level Apps grid nests all four under **Practice** (`/app/practice`).
Legacy `/app/statistics` and `/app/records` redirect to `/app/reports`.

**Journal:** calendar-first shell (month tiles, view segment, day panel) —
kinship with Live calendar; entry CRUD awaits Journal Spec. Journal app status
`live` for the shell. Migration `041_practice_suite_reports.sql` renames
`statistics` → `reports` in `apps`.

**Rationale:** Coach mockup + coupling of the four tools; FatTail App process
sidebar already says Reports. API path `records/summary|series` may stay until
Reports build renames endpoints.

## 2026-07-28 — Echo agency upgrade: HIG + interactive design authority

**Decision:** Expand **Echo** from thin “look & feel / polish” owner to full
**Human Interface & Interaction Designer**: Apple HIG for Labs web, design tokens,
control grammar, toolbar/header recipes, and blocking review on visual +
interactive changes. Charter: `agents/bench/echo.md`. Constitution remains
`Specs/FatTail-Labs-Human-Interface-Spec-v1.0.md`.

**Locked split:** Echo designs/reviews; Charlie implements. Domain work surfaces
may keep domain skins (e.g. ToS blotter **table body** only); Labs **shell,
headers, buttons, sheets, dialogs** stay HIG — never broker-skinned chrome.
Default tool-header recipe: ≤1 primary CTA per region; secondary/plain; overflow
Menu when crowded; no equal-weight pill farms.

**Rationale:** Trade Log header shipped as ad-hoc outline pills without Echo
depth — symptom of under-specified agency, not missing product taste. Coach
directed HIG mastery + strong interactive principles into Echo so design work
routes through the bench correctly.

## 2026-07-28 — Trade Log v1.1 Spec + Agent Bench (p-trade-log)

**Decision:** Land `Specs/FatTail-Labs-Trade-Log-Spec-v1.1.md` (DRAFT) defining the
options-first ToS-style Trade Log: table-never-leave shell, right slide-out,
multi-leg strategies, accounts with required **broker or sim** (≤10 active),
canonical `fattail.labs.trade_log` + adapters, and integration contracts for
**Journal** (link field + shared process vocabulary) and **Records**
(formerly “Statistics”: multi-account **totals and charts** via
`records/summary` + `records/series` read models). Implementation is **Agent
Bench only** via `agents/p-trade-log/` (seeds TL0–TL6). Supersedes MVP form-first
shape for product direction; production may keep MVP until build approval and ship.

**Rationale:** Coach design direction (2026-07-28); doctrine T-D5 process-first;
Family B isolation; Practice stack compatibility without merging stores in v1.1.
**Records** is the aggregation surface across broker/sim accounts; Trade Log
remains the blotter.

## 2026-07-28 — DL-064 ActiveCampaign lead sync (free waitlist leads only)

**Decision:** Free waitlist signups (`feature_gate_emails`) are pushed to the
shared FatTail/0-DTE ActiveCampaign account as contacts tagged **`Labs Lead`**.
New optional module `server/activecampaign.py` (`sync_lead()`), called from
`join_waitlist` **after** the email is committed; migration `038` adds
`ac_status`/`ac_error`/`ac_synced_at` for observability.

**Rationale / scope:** Marketing needs a live, taggable pre-launch lead audience
without manual CSV export. Modelled on `notify.py` SMTP: env-driven
(`LABS_AC_*`), disabled when unconfigured (`skipped`), fail-loud when
half-configured or `LABS_AC_REQUIRED=1`, and **never** allowed to fail the
waitlist write (best-effort, post-commit, wrapped). **Customers are out of
scope** — buyers enter via WooCommerce and are already tagged by the WordPress
`membership-auto-upgrade` plugin in the same AC account; Labs does not
double-plumb them. Stripe not integrated with AC. Spec:
`FatTail-Labs-ActiveCampaign-Lead-Sync-Spec-v1.0`. Tests:
`test_activecampaign.py`. Status: draft pending live staging smoke.

---

## 2026-07-28 — Feature gates (countdown / waitlist) admin-only

**Decision:** Feature gates hide public surfaces until ready and create anticipation
via countdown + optional email waitlist. **Admin UI only** at `/admin/gates` (card
on operator cockpit). Data: `feature_gates` + `feature_gate_emails` (migration 037).
Public: `GET /api/feature-gates/{surface}`, `POST …/waitlist`. Email CSV export for
mail management. Surfaces seeded: home (enabled for Labs launch), hub, app,
resource, live, wiki (disabled until adopted). Env launch vars are superseded for
home by DB when gate is active.

## 2026-07-28 — Member Wiki W1: two-store split + spine shipped (p-wiki)

**Decision (WIK-D1):** Wiki content system-of-record is the `dudefromearth/lab-wiki`
git checkout (`LABS_WIKI_ROOT`, boot fail-loud); MySQL holds a rebuildable derived
index only (migration 035: `wiki_pages_idx` FULLTEXT + `wiki_links_idx`).
**Decision (WIK-D2):** member visibility = `status: published` frontmatter; drafts
404 for members, render for admins. **WIK-D3:** search v1 = FULLTEXT over pages;
transcripts join in parent-spec W2. **WIK-D5:** card slug `wiki` replaced Vexy
(034). **WIK-D6:** `[[wikilinks]]`; unresolved render muted, never 500. **WIK-D7:**
reindex = idempotent full rebuild (`POST /api/admin/wiki/reindex`, human admin or
agent key w/ `wiki:reindex`).
**Shipped:** `server/wiki_store.py` + `routes/wiki.py` + tests; frontend surfaces
wired (`/app/wiki`, `[slug]`, `search`, `graph`, ⌘K); sync tick documented
(`infra/deploy.md`, `infra/labwiki-sync.plist`). Evidence:
`agents/p-wiki/gate-reports/W1-delta-gate.md`. As-built:
`Architecture/11-wiki-design.md`. Specs: Member-Wiki v0.1 + Wiki-Interface v0.1
(DRAFT — Coach approval pending; W0 gate).

**Related:** deferred to parent phases: corpus/transcripts (W2), compiler+board
(W3), practice rail (W4, Mike gate).

## 2026-07-28 — Apps hub: Practice Log section + Strategy Life Cycle

**Decision:** `/app` organizes tools into sections, not a flat grid: **Journey** ·
**Practice Log** (Trade Log + Journal cards) · **Strategy Life Cycle** (Strategy
Lab, `slug=strategy-lab`, soon) · **Playbook** · **Insights** (Statistics + Wiki).
Section map is UI IA in `web/app/app/page.tsx`; migration `036` seeds Strategy Lab
and refreshes Practice Log blurbs. Full Practice Log merge (`/app/practice` modes)
and Strategy Lab product ship in later waves — hub presents the organization now.

**Related:** `docs/Apps-Practice-Stack-and-Strategy-Life-Cycle-Proposal.md`.

## 2026-07-28 — Apps hub: flat 2-col + Practice Log parent card

**Decision:** Revert disheveled multi-section layout. `/app` is again a **flat
two-column card grid**. **Practice Log** is a **single card** → `/app/practice`
hub, which shows **Trade Log** and **Journal** as child cards (2-col). Strategy
Life Cycle remains its own top-level card (`strategy-lab`, soon). Nested
`trade-log` / `journal` are omitted from the top-level grid.

## 2026-07-28 — Strategy Life Cycle landing organization

**Decision:** `/app/strategy-lab` is an **orientation landing** (open while tool
is soon), organized as: (1) hero + kill rule, (2) **The path** — Build / Prove /
Paper / Run as primary IA (2×2 stage cards + under-the-covers line each),
(3) **two entry paths** (validate existing vs develop new), (4) connected tools
(Practice Log, Playbook, Journey), (5) courseware promise (process assessment
only). Workspace/kanban ships later; landing is the map for members and
courseware deep-links.

## 2026-07-28 — Strategy Life Cycle hub: 2-col cards + courseware backlog

**Decision:** Strategy Lab page uses **section headers + two-column card grids**
throughout (The path, How you enter, The one rule, Connected tools, Courseware).
**Courseware** is a **hub of backlog course cards** (code, overview, “students
will learn”) — not published catalog links yet; titles feed course development
backlog. Process-only assessment language retained.

## 2026-07-28 — Wiki card replaces Vexy on Apps grid

**Decision:** The sixth `/app` card is **Wiki** (`slug=wiki`), not Vexy. Open →
`/app/wiki`. Badge remains `soon` until Member Wiki W1; entry/search/graph routes
are scaffolded per Wiki Interface Spec v0.1 §1–2, §4–5.

**Rationale:** Specs `FatTail-Labs-Member-Wiki-Spec-v0.1` + `Wiki-Interface-Spec-v0.1`
(D-i4: retire Vexy row; Ask-mode absorbs the cognitive-partner role in v2). Migration
`034_wiki_replaces_vexy_app.sql`.

**Not yet:** corpus registrar, transcripts, lab-wiki checkout, FULLTEXT search, graph
data — those track the parent wiki phasing.

## 2026-07-26 — Every named entity: stable id + name-derived slug (for versioning)

Each **course**, **module**, **lesson**, **resource**, and **app** always has:
- **`id`** — permanent unique primary key (bigint). Never changes on rename.
- **`title`** — display name.
- **`slug`** — URL segment derived from title (unique in its scope). Changes with rename.

**Rationale: versioning.** Version rows, pins, and history hang on the stable **id**,
not the slug. Renaming must not orphan prior versions or break references. Public URLs
stay human-readable names; identity and version lineage stay on id. Resources already
version via `resource_versions` → `resource_id`. Course/module/lesson/app content
versions attach the same way when introduced.

Public and admin APIs return `id` + `slug` + `title` together. Mutations that need a
stable target use `id` (e.g. `PUT /api/admin/lessons/{id}`); public routes use the
name path `/course/{course}/{module}/{lesson}` and `/app/{app}` resolved to the
underlying ids. Apps live in table `apps` (migration 033); catalog is
`GET /api/apps`.

## 2026-07-26 — Title and public slug stay in lockstep

Whenever an admin renames a **course**, **lesson**, or **resource**, the server
rewrites the public slug from the new title. Responses return the new `slug`; the
web editor navigates when a course slug changes so the address bar matches the name.
**All public URLs must be unique as full paths.** Lesson path is
`/course/{course}/{module}/{lesson}` — uniqueness is the **combination**. Lesson slugs
need only be unique **within a module** (same lesson name OK in two modules of one course).
Module slugs unique within a course; course slugs site-wide under `/course/…`; resources
under `/resource/…`. Rename collisions return **409 NAME_CONFLICT** (no silent `-2`);
the editor keeps the field open with a red halo. Create defaults may still allocate
`-2`/`-3` for default titles.

## 2026-07-26 — Public SEO namespaces: singular content roots

Public URLs use singular category roots for clean SEO hierarchy:

| Namespace | Shape | Notes |
|-----------|--------|--------|
| Courses | `/course`, `/course/{course}`, `/course/{course}/{lesson}` | Lesson path drops the old `/lessons/` segment |
| Campaigns | `/campaign`, `/campaign/{name}` | Catalog + reserved detail (content TBD) |
| Resources | `/resource`, `/resource/{name}` | Library + first-class resource pages |
| Apps (Labs tab) | `/app`, `/app/{name}` | Journey, Trade Log, future Journal/Playbook |

Rationale: two primary content families (courses, campaigns) plus resources and member apps
need distinct, short, crawlable namespaces. No legacy redirects — public URLs were not
established yet; these are the first canonical shapes. Backend API paths stay plural under
`/api/courses`, `/api/resources` (API contract, not SEO).

Helpers: `web/lib/paths.ts`.

## 2026-07-20 — Product model benchmarked on AI Labs by First Movers

Live teardown of labs.firstmovers.ai (custom Next.js + Stripe, no LMS platform). Adopted:
public `/courses` catalog as entry point, public course detail pages with gated lessons,
explicit per-course enrollment inside all-access membership, module/lesson accordion,
reviews, per-course discussion, live sessions folded back into the library as replays.
Full teardown in `Specs/FatTail-Labs-Course-Hosting-Spec-v1.0.md` §2.

## 2026-07-20 — Positioning: "stop the bleeding"

Capital preservation is the first step to trading success and for many the only one.
Funnel strategy: sell the dream, sequence the discipline — pathway routes everyone through
the stop-the-bleeding flagship first. Marketing uses process outcomes, never profit claims.

## 2026-07-21 — Standalone repo; no shared code with MarketSwarm-Canonical

Only reason to share the repo would be reusing MSC code, which is not a requirement.
Anything needed from MarketSwarm is consumed via API (Vexy gateway :3003; MSC App API
later). Kills drift risk, frees the stack choice.

## 2026-07-21 — Stack: FastAPI + MySQL + Next.js

FastAPI backend (`server/`), own MySQL `labs` database, own filename-ordered migration
runner. Next.js frontend (`web/`): public pages statically generated at publish time
(Course JSON-LD, unique titles — spec §5.6); member routes client-rendered behind auth.
No dev servers outside dev.

## 2026-07-21 — Hosting: MiniTwo is the sole Labs production host

labs.fattail.ai → MiniTwo (M2 Mac Mini), supervised by launchd (not MSC Node Admin).
Staging labs-stage.fattail.ai → DudeTwo. MiniThree nginx routes both; Cloudflare proxied
A records → shared public IP. Rationale: blast-radius separation from the trading app
(DudeOne), whose peak-reliability hours coincide with Labs traffic peaks. Build proceeds
fully on the internal network; DNS/cert/vhost is a launch-day step.

## 2026-07-21 — Labs is the first native fattail.ai property

flyonthewall.ai was retired (trademark); the FatTail App remains on flyonthewall.io until
its own migration. Labs establishes the fattail.ai zone (origin cert, Cloudflare config,
vhost pattern) that the app migration will inherit. Session cookie domain `.fattail.ai`
from day one so future app migration shares SSO sessions.

## 2026-07-21 — Auth: dual WordPress SSO; WooCommerce is the access-control entry point

Issuers `fattail` (fattail.ai WP) + `0-dte` (0-dte.com WP), same architecture as the
FatTail App's SSO. `(issuer, wp_user_id)` compound identity, universal identity_id,
cumulative roles observer < activator < navigator < administrator. Entitlement mapping
(WooCommerce plan slug → role, per issuer) is config — MSC's blanket 0-dte coaching bypass
does NOT auto-apply. Selling/cancelling/refunds happen only in WordPress; webhooks sync.

## 2026-07-21 — Admin is custom and in-app

`/admin` (role: administrator) owns all course authoring. WordPress has no role in course
content. LearnDash is fully replaced: WP keeps commerce + identity only.

## 2026-07-21 — Repo layout mirrors MarketSwarm-Canonical

`Specs/` (versioned, immutable once approved), `Architecture/` (durable docs + this log),
`infra/` (deploy playbooks). Same muscle memory across both repos.

## 2026-07-21 — Lesson video: YouTube embeds with per-lesson player parameters

Lessons carry `video_provider` + `video_id` + `video_params` (JSON). The API validates
params against an allowlist (autoplay, controls, start, end, mute, loop, rel,
cc_load_policy, fs, hl, playsinline) and builds the embed URL server-side
(youtube-nocookie.com, rel=0 + playsinline baseline); the client never assembles player
URLs. Free-preview lessons are publicly playable; gated lessons 401 until the member
path. **Accepted tradeoff:** spec §7.4 rejected YouTube for gated content (unlisted links
are leakable); Coach chose YouTube for launch speed — signed-CDN migration (Bunny/Mux)
remains the recorded path if/when leakage matters. Placeholder video: Big Buck Bunny
(Blender Foundation official upload).

## 2026-07-21 — Admin is edit-in-place on the production interface

No separate admin panel: administrators see a floating ✎ Edit button on the production
course page; activating it opens the editor over the same page (course fields + per-lesson
title/YouTube video/start/end/free-preview). Saves hit `/api/admin/*` (role-gated
server-side), then `/api/revalidate` regenerates the static page in place — publish IS
the prerender. Course pages use `dynamicParams=true` so revalidation can regenerate
(dynamicParams=false 404s after cache purge — NoFallbackError). Browser API calls ride a
same-origin Next rewrite proxy (`/api/*` → Labs API) so the session cookie flows without
CORS. Dev-only `/api/auth/dev-login` (404 outside LABS_ENV=dev) issues an administrator
session until WordPress SSO lands; staging/production sessions come only from SSO.

## 2026-07-21 — Catalog covers every category; real channel videos as examples

One published course per category (9 categories: 0-DTE, Butterflies, Convexity, Fat-Tail
Doctrine, Risk & Sizing, Journaling & Routine, MarketSwarm Platform, Options Foundations,
Psychology) + the flagship + the draft-invisibility fixture. All video lessons use real
uploads from youtube.com/@0DTE with accurate durations; first lesson of every course is
a free preview. Live Replays category deferred until the replay pipeline exists.

## 2026-07-21 — Builds always clear the Next fetch cache (stale-prerender defect)

Defect: Next.js persists fetch responses across builds (`.next/cache/fetch-cache`); a
rebuild after reseeding baked the OLD catalog (2 courses instead of 10) into the static
pages. Fix: `prebuild` script removes `fetch-cache` before every `next build`, so
prerender always reflects current database state. Runtime admin edits are unaffected
(revalidatePath purges correctly); this only bit build-time data freshness.

## 2026-07-21 — Identity & access: Labs-native model, providers pluggable

Coach directive: Labs owns its own identity/roles/subscriptions/memberships model and
must work standalone; WordPress + WooCommerce demoted from foundation to pluggable
provider. Spec: FatTail-Labs-Identity-Access-Spec-v1.0 (supersedes parent §7.2–7.3's
WP-first model; the dual-issuer JWT mechanics survive inside the WordPress provider).
Core: Identity (email = universal key) / IdentityLink / Credential (stdlib scrypt) /
Plan / Membership / ProviderPlanMap (migration 003). One role algorithm for all paths:
role_override else best active-membership plan else observer. Native login + operator
CLI; SSO callback + HMAC membership webhooks per provider; login page renders SSO
buttons only for configured providers. LABS_ENTITLEMENTS env removed — entitlement
mapping is now data. Verified: native admin/member/observer logins, wrong-password 401,
simulated WP SSO grant → activator, forged-webhook 401, signed cancellation → observer
on next login, same identity across provider logins.

## 2026-07-21 — Global site header: Join CTA / membership avatar on every page

Sticky header mounted in the root layout (all pages): brand → /courses, Courses nav.
Right side is auth-state-driven via /api/auth/me after hydration (static pages ship the
neutral shell): logged out → "Sign In" + "Join FatTail Labs" CTA; logged in → initials
avatar (emerald = activator+, gray = observer) opening a menu with name, role label
(Free account / Member / Coaching member / Admin), Dashboard, Become-a-member upsell
for observers, Sign out. Belongs in parent spec v1.1's shell section when that version
is cut.

## 2026-07-21 — Header amendment: logged-out avatar slot IS the sign-in button

Refines the header entry above: no "Sign In" text link — the avatar position renders a
gray person-silhouette circle linking to /login when logged out, keeping the avatar slot
constant across auth states (silhouette → your initials on sign-in).

## 2026-07-21 — Header final form: Log In + Sign Up buttons ⇄ avatar

Supersedes the two header entries above. Logged out: "Log In" (outline) + "Sign Up"
(emerald) buttons. Logged in: both replaced by the initials avatar (emerald activator+,
gray observer) whose dropdown holds user info (name, role label) and actions (Dashboard,
Become-a-member for observers, Sign out).

## 2026-07-21 — Signup is live; previews require an account; members get playback

Spec: FatTail-Labs-Enrollment-Access-Spec-v1.0 (supersedes YouTube spec §5 public
previews). Self-serve registration (POST /api/auth/register: free observer account,
session issued, 409 on existing email — no password attach to SSO identities). Lesson
access matrix: anonymous → 401 everywhere (the preview is the reward for signing up);
observer → previews 200, gated 403; activator+ → member playback of gated lessons
(activated now that roles are real). Player renders distinct prompts: 401 → "Create a
free account to watch"; 403 → "Become a Member". All lesson rows link to the player —
the lesson endpoint is the sole access authority. Accepted debt: no email verification
yet (must land before production launch).

## 2026-07-21 — Catalog cards adopt the Udemy model (banner card + hover info panel)

Coach directive with Udemy reference. Compact card: banner (hero image when set;
otherwise deterministic per-category gradient art with category label + title), title,
instructor, rating stars + review count (or NEW / "Not yet rated"), meta line
(total duration · level · lesson count). Hover (desktop only, lg+) raises an expansive
panel beside the card — title, NEW/Certification badges, "Updated <Month Year>", meta,
subtitle, up to 3 ✓ outcome bullets parsed from the description's outcome list, View
Course CTA; panel flips to the left for last-column cards. API list payload gained
total_duration_seconds + review_count. Touch devices tap straight through to the course
page. Belongs in parent spec v1.1 §5.1 when cut.

## 2026-07-21 — Progress tracking shipped (watch position, auto-complete, dashboard)

Spec: FatTail-Labs-Progress-Tracking-Spec-v1.0 (implements parent §9's progress half;
certificates deferred to their own spec). Endpoints: POST /api/progress (delta clamped
≤60s, auto-complete at ≥90% cumulative watch for videos), POST /api/progress/complete
(manual/non-video), GET /api/me/progress?course=, GET /api/me/continue (percent over
standard-module lessons only; resume = latest-touched incomplete). Player wraps the
served iframe with the YouTube IFrame API (enablejsapi now in base embed params):
resume-seek >10s, 5s sampling, 15s reporting + pause/end/leave flushes; Mark-complete
button; prev/next lesson nav. Course Modules tab shows ✓ ticks; dashboard Continue
Learning renders progress bars + resume deep links. Verified live end-to-end incl. real
playback auto-reporting (28s position captured with no manual action), access matrix on
progress writes (anon 401, observer-on-gated 403), clamping, and worksheets excluded
from completion denominators.

## 2026-07-21 — Enrollment records + student page + dropdown consolidation

Spec: FatTail-Labs-Enrollment-Records-Student-Page-Spec-v1.0. Enrollment = explicit
(course-page Enroll card) or automatic on first progress event (no orphan progress);
never an access gate. Course completion stamped on the enrollment when all
standard-module lessons complete. Enrolled counts on cards/pages are now real. New
APIs: POST /courses/{slug}/enroll, GET /api/me/enrollments, GET /api/me/activity
(merged enrolled/watched/completed feed + stats). Avatar dropdown gains a lazy-loaded
CONTINUE LEARNING section (top 3 in-progress, mini bars, resume deep links) and a My
Learning link to /me — the student page: stats row (enrolled/completed/lessons/watch
time), full enrollment list with Continue/Review actions, Quiz Results placeholder
(future quiz spec's home), and the activity feed. Course-page right rail replaced by
the session-aware EnrollCard (anon → Join, signed-in → Enroll, enrolled → progress +
Continue, completed → ✓). Verified live: explicit + auto enroll, idempotency,
completion stamping, dropdown, /me rendering all sections.

## 2026-07-21 — In-place editing v1.1: direct manipulation replaces the modal

Spec: FatTail-Labs-InPlace-Admin-Spec-v1.1 (supersedes v1.0's modal form; server
contract unchanged). Coach: the element IS the editor — click a block of text and it
becomes its editor, in its own place. Implemented: edit-mode toggle + floating edit bar
(status select, pending count, Discard/Exit/Save & Publish, dirty-navigation warning);
EditableText/EditableMarkdown/EditableSelect client components rendering display markup
identical to static output (SEO unaffected — zero edit artifacts in prerendered HTML);
lesson rows edit inline (title, video URL/ID, start/end, preview); markdown block editor
with Preview using the same renderer as the public page. Site-wide markdown decision
folded in: react-markdown + rehype-sanitize replaces the minimal renderer (md.tsx
deleted); lesson body_md renders as markdown and is click-to-edit on the lesson page
(body_md added to the admin field allowlist). v1.0 modal (AdminBar.tsx) deleted — no
parallel implementations. Verified live: edit mode affordances, in-place title edit →
Save & Publish → regenerated page, static HTML clean of affordances.

## 2026-07-21 — Ratings & Reviews + Course Discussion (benchmark parity)

Coach reaffirmed: Labs operates with or without WordPress — both features build purely
on the native model. Specs: FatTail-Labs-Reviews-Spec-v1.0 +
FatTail-Labs-Course-Discussion-Spec-v1.0.

Reviews: eligibility = enrolled + ≥1 completed lesson (server-enforced); rating 1–5,
one per identity per course, writing again upserts; aggregate public at ≥3 visible;
admin moderate visible/held (held never renders publicly nor counts). Course Review
block in the About tab: aggregate + stars, list w/ Show more, star-picker write form,
per-review admin Hide/Show. After a write the client revalidates the course page —
/api/revalidate loosened to any authenticated session for /courses/* (idempotent),
keeping the baked hero rating + JSON-LD aggregateRating fresh.

Discussion: course-scoped threads + comments (migration-001 tables). Reading public
(community as sales surface); posting requires any authenticated account (observer+);
bodies render through the sanitizing markdown renderer; Admin badge on staff posts;
admin moderate on threads/comments; Discussion tab now enabled, client-fetched.

Verified live: full reviews matrix (eligible post, ineligible reason, anon 401, bad
rating 422, upsert), full discussion matrix (thread/replies incl. admin badge, anon
401, hide → public count drops, non-admin moderate 403), UI rendering of both blocks.
(Browser-pane screenshots hit a stale-compositor glitch; content verified via DOM.)

## 2026-07-21 — Students tab + course trailers (benchmark parity complete)

Specs: FatTail-Labs-Students-Tab-Spec-v1.0 + FatTail-Labs-Course-Trailer-Spec-v1.0.
Students: roster from enrollments — signed-in accounts see the grid (initials avatar,
name — never email — joined date, Completed ✓, Admin badge); logged-out sees count +
sign-in prompt. Trailers: hero ▶ button when trailer_video_id set; click swaps the hero
for the player in place (no modal), ✕ restores; embed built server-side (public payload
carries embed config, never the raw ID); trailer_video_id joined the admin course
allowlist with URL→ID normalization; edit-mode Trailer chip in the hero for authoring;
seed sets trailers on flagship + butterfly. Verified: anon count-only vs member roster,
no raw-ID leak, admin set-by-URL, play button baked into regenerated static HTML.
With these, all five AI Labs course-page tabs are functional — benchmark course-page
parity is complete.

## 2026-07-21 — Editor complete (v1.3): reorder, media, assignment, course creation

Spec: FatTail-Labs-InPlace-Admin-Spec-v1.3. No authoring task requires SQL anymore.
Reorder: HTML5 drag on module cards + lesson rows (⠿ handles); exact-set validation
server-side (422 on mismatched ids); immediate structure-write semantics. **Media
storage decision: local disk** (server/uploads, git-ignored, content-hash filenames,
served at /api/media; S3-compatible is a future backend swap) — POST /api/admin/media
validates png/jpeg/webp ≤5MB; hero_image_url allowlisted with an edit-mode Hero chip;
hero doubles as the catalog card banner, replacing the gradient placeholder when set.
Assignment in place: Categories checklist in the hero strip (replace-set PUT),
Instructors checklist in the About tab, Attachments manager in the Resources tab
(add/edit/delete; file kind uploads through media). New-course creation: admin-only
"+ New Course" card on the catalog → POST creates a draft (unique slug) → dedicated
draft editing route /admin/courses/{slug} (dynamic, admin-only, robots noindex)
rendering the course-page components from the admin payload with edit mode auto-active;
drafts remain 404 on all public surfaces until published from the edit bar. Verified:
media pipeline (upload/serve/bad-type 422/unauthed 401), module reorder + exact-set
rejection, category/instructor replace-sets, attachment CRUD, course creation with
draft invisibility, draft route rendering with all editors live. Draft "Tail Hedging
Workshop" left in dev DB as a playground.

## 2026-07-21 — Quizzes + Resource Library

Specs: FatTail-Labs-Quizzes-Spec-v1.0 + FatTail-Labs-Resource-Library-Spec-v1.0.

Quizzes: a quiz is a LESSON KIND (no parallel container) — ordered, access-gated,
completion-counted like any lesson (migration 004: quiz_questions, quiz_attempts).
Three question kinds: multiple_choice (options + correct index), binary (True/False),
short_answer (server-graded, trimmed case-insensitive acceptable-answers list).
Grading is server-side only; public payloads never carry correct answers; every
submission is an immutable attempt; first submission completes the lesson (pass
thresholds future). QuizPlayer (forms → score + per-question ✓/✗ + correct answer +
explanation + retake); admin QuizBuilder in place on the quiz lesson page; lesson rows
gained a kind select; /me Quiz Results placeholder now real (attempt history).

Resource Library: /resources aggregates course attachments (no orphan store) with
category/kind filters; header nav gained Resources. Storage tiers: public media
(images) vs NEW private tier (POST /api/admin/media?private=true — pdf/zip/office/
text/images ≤25MB, server/uploads/private, NOT statically mounted, url stored as
private:{name}). Downloads gated at GET /api/attachments/{id}/download: activator+
(member benefit), streams with human filename; observers get the upsell. Course
Resources tab rows now functional; attachments editor uploads target the private tier.

Verified: all three question kinds graded (incl. short-answer normalization), no
correct-answer leak, bad-question 422s, attempt in /me results, quiz completes lesson;
private file 404 at public path, anon 401 / observer 403 / member 200 with
Content-Disposition, library listing + anon 401. Demo quiz "Knowledge Check: The
Anatomy of the Bleed" (free preview) lives on the flagship.

## 2026-07-21 — Live sessions + pathway assessment

Specs: FatTail-Labs-Live-Sessions-Spec-v1.0 + FatTail-Labs-Pathway-Spec-v1.0. The
migration-001 live_sessions and pathways tables are now in service.

Live: /live (header nav gains Live) — public schedule (marketing surface), join URLs
double-gated server-side (role ≥ min_role AND T−15min→+4h window) with machine-readable
lock reasons (sign_in/role/too_early) driving the right prompt; public ICS export
(never carries the join URL); replays link past sessions to their replay course
(recording→lesson pipeline stays manual, honestly specced); in-page admin scheduler
(create/delete). Dashboard gains a Next Live Session card.

Pathway: 4-question intake (experience/account/struggle/time) → deterministic
server-side sequence. **Step 1 is first-stop-the-bleeding for every possible answer
set — proven by exhaustive test over all 108 combinations.** Struggle answer routes
psychology/routine/sizing early; platform primer always last (tool after doctrine).
Progress overlay derived at read time from lesson_progress. /pathway renders the
assessment or the numbered step list ("Start here" on first incomplete, Retake).
**Signup now lands on /pathway** — the benchmark's post-signup assessment pattern
carrying the sell-the-dream/sequence-the-discipline strategy. Dashboard gains a Your
Pathway card.

Verified: join gating matrix (entitled+in-window URL, role lock, sign_in lock, no URL
leak to anonymous), ICS output, session CRUD; pathway routing per struggle answer,
progress overlay against real member data, invalid answers 422, flagship-first
invariant exhaustively. Demo sessions seeded (workshop + trading room).

## 2026-07-21 — Trailer hero sizes to the full video

Refines the Course Trailer spec's playback: the hero is wrapped in TrailerShell — at
rest, normal hero content + centered play button; playing, the entire hero block swaps
to a true 16:9 (aspect-video) player sized by the column, so the video is never cropped
to the text-content height. ✕ restores the hero. Verified visually (full-width playback
with captions).

## 2026-07-21 — Native Stripe billing (third provider; live wiring awaits MiniTwo)

Spec: FatTail-Labs-Native-Billing-Stripe-Spec-v1.0. Stripe rides the existing
provider seams — Prices→plans via provider_plan_map (link_stripe_price.py CLI),
customers via identity_links, lifecycle via upsert_membership. Stripe hosts all
payment surfaces (Checkout + Customer Portal); the server never touches card data.
Endpoints: GET /api/billing/plans (amounts cached from Stripe), POST checkout (hosted
session, identity metadata, customer reuse), POST portal, POST webhook. Webhook
verified with the SDK's signature check but processed as plain JSON (StripeObject
accessor quirks bypassed — SDK is verify-only) and deliberately needs NO Stripe API
calls: payloads carry customer/price/status. Status map: active|trialing→active,
past_due→grace, canceled|unpaid|incomplete*→expired. Config-gated (no key → provider
absent, 503s + graceful UI fallback). /membership pricing page (success/cancel
banners; anonymous → signup first); all upgrade CTAs (gated lesson, resources denial,
dropdown upsell, live role locks) now point to /membership; /me gains Manage billing
(portal). Verified offline with the real signature scheme: disabled mode, customer
linking, active→grace→expired lifecycle, bad-signature 400, unmapped-price graceful
ignore, and role round-trip (observer → activator while Stripe-active → observer
after cancel). PENDING on MiniTwo (Coach): live keys, two Prices, price↔plan mapping
via CLI, webhook endpoint registration, one test-mode checkout.

## 2026-07-21 — Membership tiers, alumni grandfather, 2-step enrollment funnel

Spec: FatTail-Labs-Membership-Tiers-Enrollment-Spec-v1.0 (Coach directive with AI Labs
funnel screens; supersedes parent §3.2 placeholder pricing).

Tiers: Navigator $250/mo·$2,500/yr (featured — the AI Labs price structure);
Activator $100/mo PROMO-ONLY (renders only with ?promo, verified absent without);
Observer Trial $20/wk × 4 weeks with FULL Navigator access. Courses included with
every tier. Discord/app delivered outside Labs.

Role ladder gains **alumni** (observer < alumni < activator < navigator < admin);
lesson content + resource downloads dropped to alumni threshold; livestreams stay
activator+/navigator. **Alumni rule:** churn after ≥28 days tenure (any paid tier, or
the completed 4-week trial) auto-grants courses-alumni for 1 year
(current_period_end); role derivation is now date-expiry aware (expired-by-date
memberships confer nothing — also ends the alumni year). Tenure check wired into
BOTH churn paths (Stripe webhook + WP sync).

Funnel: signup = "Step 1 of 2" (what-happens-next list) → lands on
/membership?welcome=1 = "Step 2 of 2 — Welcome, {name}" with tier cards (display_json
on plans, migration 005 — cards render before billing wiring; checkout buttons attach
when Stripe is live). Exit-intent modal (once/page) pitches the trial + alumni promise
instead of a discount. "Continue with your free account" always visible → /pathway.

Verified: full alumni matrix (courses 200, resources 200, workshop role-locked,
year-expiry → observer), navigator subscribe → role navigator, cancel@5d → observer
(no alumni), cancel@35d → "expired + alumni granted" → role alumni with courses
playing and alumni year ending exactly +1yr, promo gating, step-2 page rendering.

## 2026-07-21 — Course lifecycle: unpublish + title-confirmed delete (admin v1.4)

Spec: FatTail-Labs-InPlace-Admin-Spec-v1.4. Danger zone at the bottom of the course
page (and draft route) in edit mode: Unpublish (published only — status→draft,
republish, redirect to /admin/courses/{slug}; published_at retained so republish keeps
the original date) and Delete course (confirmation requires TYPING the exact title —
stronger than modules/lessons confirm). DELETE /api/admin/courses/{slug} cleans the
non-FK relations explicitly: course attachments incl. their private files on disk, and
course-scoped threads (comments cascade); FKs handle modules/lessons/progress/
questions/attempts/enrollments/reviews/certificates; replay links null. Both actions
refused while the dirty set is non-empty. Verified: full-cascade delete on a
disposable course (zero orphans, private file removed from disk, unauthed 401),
danger-zone rendering with both controls in edit mode.

## 2026-07-21 — Draft visibility: admins auto-route from public URL to the editor

Extends spec v1.4 (§3, same working session): a draft's /courses/{slug} URL keeps its
genuine 404 for everyone (HTTP status + SEO unchanged), but the 404 page carries an
admin-only client check — administrators whose slug resolves in the admin API are
routed straight to /admin/courses/{slug}. Verified: anonymous draft URL stays 404;
admin visiting the same URL lands in the draft editor (DRAFT badge confirmed).

## 2026-07-21 — Resource visibility (free vs members) + library admin controls

Spec: FatTail-Labs-Resource-Library-Spec-v1.1 (extends v1.0; migration 006:
attachments.free_preview). Every resource is free (any signed-in account — mirrors
lesson previews; nothing is anonymous) or members-only (alumni+, the default).
Free/Members badges on the library and course Resources tab. Admin controls: course
attachments editor gains a Free checkbox on create + per-row toggle; the /resources
page itself gains admin create (course selector — resources always belong to a
course, no orphan store — title, URL or private upload, Free checkbox) plus per-row
make-free/members toggle and confirmed delete. Verified: observer free-download 302,
members-only 403, anon 401, live toggle flip, flags in listings.

## 2026-07-21 — Live Sessions v1.1: recurring standing schedule

**Decision:** The real schedule is recurring, not one-off. Added `live_recurrences`
(migration 007) storing America/New_York wall-clock schedules; occurrences
materialize at read time over a 14-day horizon (no cron, no generated rows).
Seeded the standing three: Live Trading Room Mon–Fri 11:00–12:15 ET (navigator+ —
all members except Activators), Friday Pre-Market Briefing Fri 9:30–10:00 ET
(activator+ — the one session Activators get), Sunday Retrospective Sun 21:00 ET
(navigator+). `min_role` widened to public|observer|activator|navigator so a
public YouTube show (e.g. Mon/Wed/Fri 15:00) can be listed; kind gains `show`.
Recurrence ICS is a true repeating VEVENT (RRULE WEEKLY, TZID) — add once, holds
forever. Admin recurrence manager on /live; occurrences are managed through the
recurrence, not individually. Deleted the demo one-off "Live Trading Room" (now
covered by the recurrence).

**Verification:** ET→UTC conversion exact under EDT (11:00→15:00, 9:30→13:30,
Sun 21:00→Mon 01:00). Today's already-ended occurrence correctly absent.
Activator session: trading room + Sunday locked `role`, Friday briefing passes to
`too_early`; navigator passes all role gates. ICS shows
`DTSTART;TZID=America/New_York` + `RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR`.
Live DOM: 14 Weekly-badged occurrences, recurrence manager lists all three
standing sessions, delete absent on occurrence cards.
Spec: FatTail-Labs-Live-Sessions-Spec-v1.1.md.

## 2026-07-21 — Live Sessions v1.2: month calendar replaces the upcoming list

**Decision:** With a standing recurring schedule, a flat list grows linearly with
occurrences and buries the rhythm — replaced /live's Upcoming list with a
Monday-first month calendar, opening on the current month, with ‹/Today/›
navigation. Chips colored by kind; click → detail card (countdown, ICS, gated
Join, admin delete for one-offs). API gains `?month=YYYY-MM` returning the full
ET month including past occurrences (locked `ended`); the no-param dashboard
shape is unchanged. Past sessions always render "Session ended" client-side —
never a sign-in prompt for something that's over.

**Verification:** July 2026 returns 33 sessions (23 weekday rooms + 5 Friday
briefings + 4 Sunday retros + 1 one-off), 23 distinct days; August returns 30,
first = Sun Aug 2 21:00 ET (2026-08-03T01:00Z); bad month → 422. Browser: grid
renders with today (21st) highlighted, past days dimmed, one-off auto-selected;
past-chip click shows "ended"; › navigation loads August with 30 chips matching
the API. Spec: FatTail-Labs-Live-Sessions-Spec-v1.2.md.

## 2026-07-21 — Live Sessions v1.3: membership-based content categories

**Decision:** Live content is categorized by membership audience, not role
plumbing — `category` (public | members | coaching) replaces `min_role` on both
tables (migration 008 backfills then drops the column; no dual schemas).
public = no gate; members = every membership (Observer, Activator, Navigator);
coaching = Observer & Navigator only. The ladder derivation (members→activator+,
coaching→navigator+) lives in one mapping and works because Observer trials
grant the navigator role; alumni fall below activator so they lose all live
content automatically. Standing schedule revised: 0DTE Live Show (public,
Mon/Wed/Fri 15:00 ET, youtube.com/@0dte/live), Daily Livestream (coaching,
Mon–Fri 11:00–12:30), Friday Morning Coach Call (members, Fri 9:30–10:00),
Sunday Evening Retrospective (coaching, Sun 21:00–22:00). Forward note: agents
producing live content will author the schedule through the same admin API —
category is the agent-facing contract (audience, never internal roles).

**Verification:** Full matrix — anonymous: coaching/members locked sign_in,
public show passes to too_early; activator: coaching locked role, Coach Call
passes; navigator: all pass. Public one-off in-window exposes join_url to
anonymous callers; invalid category → 422. Calendar renders the four-show week
(rose 0DTE chips Mon/Wed/Fri); recurrence manager shows category labels.
Spec: FatTail-Labs-Live-Sessions-Spec-v1.3.md.

## 2026-07-21 — Live Sessions v1.4: Recurring Event Viewer (scope-aware editing)

**Decision:** Two event types made explicit — single (`live_sessions`) and
recurring (`live_recurrences` + new `live_recurrence_overrides`, migration 009).
Editing a recurring occurrence requires a scope choice, iCalendar-style:
(1) this event only → override row (NULL = inherit, cancelled = removed);
(2) this and all future → series split (old bounded by `until_date`, clone with
edits from `start_date`, overrides ≥ split date move to the clone);
(3) all events → series update. Delete honors the same scopes. Occurrence
payloads gain `occurrence_date` + `modified`; the UI shows an amber "edited"
badge and an inline editor on the detail card (scope radio for recurring,
plain edit for single events). Known limits logged in spec §6 (series ICS shows
the base pattern; join_url override can't clear a series URL; no one-click
"restore occurrence to series" yet — re-edit or scope=all covers it).

**Verification:** Disposable series exercised end to end — scope=one changed
exactly one date (title + 13:00 ET → 17:00Z, modified=true); scope=future split
at Aug 10 left Aug 3–7 on the old series (30m) and moved Aug 10+ to the clone
(45m) including a pre-existing Aug 12 override; scope=one delete removed only
Aug 11; Saturday prefill 404; bad scope 422; scope=all cleanup left zero probe
sessions and zero orphan overrides. Browser: viewer opens from the calendar with
the three choices as specified, prefilled 11:00 ET/90m; a scope=one retitle
round-tripped to the chip + "edited" badge with the rest of the week untouched.
Spec: FatTail-Labs-Live-Sessions-Spec-v1.4.md.

## 2026-07-21 — Live Sessions v1.5: recurring series end limit

**Decision:** A recurring series can be bounded at creation — `until_date`
(YYYY-MM-DD, ET) or `until_days` (1–730, converted to a concrete date at save;
a fixed limit, never a rolling window). Both → 422; past date → 422; neither →
unbounded as before. No schema change (until_date existed since 009; the
materializer already honors it). Admin create form gains an Ends selector
(Never / On date / After N days); manager rows show "until {date}". Ending an
existing series = v1.4 scope-future delete.

**Verification:** until_days=7 on Jul 21 → until_date Jul 28; July listing ends
Jul 28, August has zero occurrences; explicit until_date Aug 6 on a Thursday
series kept only Aug 6; both-fields and past-date both 422. UI: Ends selector
renders with the three modes; N-days input appears on switch (default 30).
Probes deleted. Spec: FatTail-Labs-Live-Sessions-Spec-v1.5.md.

## 2026-07-21 — Course Card Editor v1.0: banner color/image + quick-info blurb

**Decision:** Catalog cards become authorable per course (migration 010:
`card_color`, `card_image_url`, `card_blurb_md`). Banner precedence:
card image (object-cover, scales to fill the 16:9 banner) → chosen color
(rendered as the same gradient art style: shade(color,0.3)→color, category
label + title kept) → hero image → category gradient; all-NULL = previous
behavior exactly. The hover panel's blurb (Markdown, sanitized pipeline)
replaces the default subtitle + ✓-outcomes block when set; derived meta
(duration, level, lesson count, badges) stays computed — not editable, so the
card can't lie. Editing happens ON the catalog: admin-only "✎ Card" chip flips
the card face into an inline editor (live preview, palette swatches + custom
picker, upload via existing public media tier or URL, blurb textarea);
save → PUT (allowlist +3 fields) → revalidate /courses + course page → reload.

**Verification:** Browser round trip — purple swatch picked, live preview
showed computed gradient, saved; regenerated catalog renders
linear-gradient(135deg, rgb(50,26,74), rgb(168,85,247)) and the Markdown blurb
appears in the hover panel; API returns the stored fields. Image path: PUT an
uploaded media URL → banner renders the image in prerendered HTML; full revert
confirmed (banner back to category art, blurb gone). Draft editor adapt()
extended for the new CourseDetail fields (build was failing until then).
Spec: FatTail-Labs-Course-Card-Editor-Spec-v1.0.md.

## 2026-07-21 — Card Editor v1.1 + Media Library v1.0: unified banner, popup removed

**Decision:** Same-day revision of Card Editor v1.0 on review. (1) The hover
quick-view popup is removed — cards click straight through; card_blurb_md dies
with it. (2) One banner per course: hero_image_url is shared — sharp
(object-cover) on the catalog card, expanded + Gaussian-blurred (blur-2xl,
scale-110) + shaded (bg-zinc-950/60) behind the course page header (public page
and draft editor both). card_image_url superseded; migration 011 drops both
columns (no dual schema). Precedence: banner image → card_color → category art.
(3) Banner uploads from two places, one store: the course page hero chip
(existing) and the new /admin/media Media Library — grid of public-tier uploads
with copy-URL and delete; delete is referentially safe (409 + who uses it,
checked against courses.hero_image_url and attachments.url). Card editor keeps
color + image (now writing hero_image_url) and links to the library.

**Verification:** Catalog HTML contains no group-hover popup; PUT banner →
card renders the sharp image and the course header renders blur-2xl +
scale-110 + bg-zinc-950/60 in prerendered HTML; screenshot confirms legible
title over the blurred, shaded image. Media API lists the store's 1 file;
deleting the referenced banner → 409 "In use — banner for
['butterfly-foundations']". Probe banner reverted cleanly. /admin/media 200,
admin-gated. Specs: Course-Card-Editor v1.1, Media-Library v1.0.

## 2026-07-21 — In-Place Admin v1.5: image embedding in the lesson markdown editor

**Decision:** The lesson-notes editor embeds images by upload, three ways
(toolbar Insert image…, clipboard paste, drag-drop), GitHub-style: instant
![Uploading…]() placeholder at the cursor → public-tier media upload (same
store as banners; visible in /admin/media) → swapped for ![alt](url) with
alt = filename sans extension; removed + error shown on failure; Save disabled
mid-upload. Site renderer (already img-safe via sanitize schema) gains image
styling (max-w-full, rounded). Logged limits: lesson images are public URLs
(member-only material belongs in private resources); Media Library delete does
not reference-check body_md (banners/attachments only) — accepted debt.

**Verification:** Browser flow on a real lesson — file fed through the Insert
input produced ![embed-test](/api/media/6b7fa434….png) at the cursor; Save
persisted and the page rendered the <img>; original notes restored; the
dereferenced upload then deleted with 200 (guard releases once unused).
Spec: FatTail-Labs-InPlace-Admin-Spec-v1.5.md.

## 2026-07-21 — Resource Library v1.2: in-place editing, descriptions, emoji

**Decision:** Library items become editable on the page (migration 012:
attachments.description_md + emoji ≤16 chars). Each row renders its emoji
(fallback by kind: file 📄, link 🔗), title, visibility badge, 2-line
description, course link; admin Edit swaps the row into an inline editor with
an emoji quick-pick strip + custom field, title input, and description
textarea. Create form gains the same fields. Course-tab surfacing of
emoji/description logged as future scope (payload + draft-adapter ripple).

**Verification:** Browser round trip on "Butterfly Construction Checklist" —
default 📄 shown, picked 📊 + description, saved; list re-rendered with the
new emoji and clamped description; reverted to NULL/NULL cleanly (fallback
returned). Create form shows picker + description field. API payload carries
both fields. Spec: FatTail-Labs-Resource-Library-Spec-v1.2.md.

## 2026-07-21 — Test Suite v1.0: characterization coverage (refactor step 1/4)

**Decision:** Before any structural refactor, the hand-verified behavior from
16 feature commits is codified as 44 pytest characterization tests
(server/tests/, FastAPI TestClient in-process, dev DB; probe rows zztest-*
created and cleaned by fixtures; seeded standing content read-only). Coverage:
auth/role ladder, catalog + draft visibility, lesson gating matrix, the full
live-sessions surface (materialization vs an independent calendar oracle,
category gating matrix, scope edits, bounds, ICS), resource visibility +
metadata, media upload/reference-guard, enrollment/progress clamps +
auto-complete, the alumni tenure rule, and quiz answer-leak prevention.
New rule in CLAUDE.md: server-touching commits must pass the suite; features
ship with their tests.

**Verification:** 44/44 passing in ~2s. One first-run fix: quiz questions live
at the lesson payload's top-level `questions` key, not under `quiz` — the test
was corrected to match reality (characterization, not aspiration).
Spec: FatTail-Labs-Test-Suite-Spec-v1.0.md.

## 2026-07-21 — Refactor step 2/4: shared guards + course lookup

**Decision:** server/guards.py (claims_or_none, require_session, require_role,
require_admin) replaces seven per-module reimplementations of the cookie →
verify → role-gate dance across admin, live, community, member, and quizzes;
resources/pathway/billing now import from guards instead of routes.member.
server/repo.py:course_id_by_slug (published_only flag) replaces eight
slug → id → 404 lookups (six in admin.py, plus community and member enroll).
Semantics preserved: 401 "Sign in required" / verifier reason, 403 "<Role>
role required". Unused imports pruned (quizzes auth/get_config).

**Verification:** Test suite 44/44 before commit (caught a missed quizzes
import mid-refactor — exactly the net it was built to be). Dev API restarted
clean; health + live month smoke pass.

## 2026-07-21 — Refactor step 3/4: web client helpers + useIsAdmin

**Decision:** web/lib/client.ts (getJSON/postJSON/putJSON/del, uploadMedia,
revalidate) and web/lib/useIsAdmin.ts (module-cached /api/auth/me promise +
hook) replace the pasted fetch dances: six components converted from their own
admin-check effect to useIsAdmin (one /me request per page load instead of
3–4); five upload sites and five revalidate sites now use the helpers;
ResourceLibrary's JSON verbs converted; lib/ui.ts FIELD replaces the pasted
form-field class. Deliberately NOT converted: SiteHeader and MembershipPlans
/me fetches (they consume richer identity data), EditContext's save()
revalidate (it checks the response and throws) and uploadHero (structureOp
needs the raw Response), MediaLibrary's list fetch (drives a denied state).
Failure alerts on uploads lost the HTTP status detail (helper returns
url-or-null) — accepted.

**Verification:** Build clean; all routes 200. Browser: catalog shows 10
✎ Card chips + New Course card, /me fired exactly 2× (SiteHeader + shared
cache); /resources shows 4 Edit buttons + admin form. Server suite still 44/44.

## 2026-07-21 — Refactor step 4/4: LiveSessions.tsx split

**Decision:** The 979-line LiveSessions.tsx was five components in a trench
coat — split into components/live/ (types.ts with the shared Session/
Recurrence types + constants, MonthCalendar, SessionDetail incl. Countdown +
JoinControl, EventEditor, RecurrenceManager, AdminManager); LiveSessions.tsx
becomes a 153-line orchestrator (cursor + fetch + selection + replays + admin
mounting). The moved files adopted the step-3 client helpers and FIELD while
relocating. No behavior change intended or observed.

**Verification:** Build clean; browser on /live — July renders 46 chips,
detail card present, Event editor opens with the 3 scope radios, both admin
managers mounted. Server suite 44/44 (unchanged surface). Refactor sequence
complete: tests → server guards → web client helpers → component split.

## 2026-07-21 — SEO v1.0: technical foundation (Layer 1)

**Decision:** Crawl plumbing before the strategy layers. app/sitemap.ts (API-
driven: 3 static URLs + every published course with lastmod, hourly revalidate),
app/robots.ts (allow public, disallow /me /dashboard /admin/ /api/ /login,
sitemap pointer; AI crawlers deliberately welcome), noindex metadata on
/me + /dashboard, metadataBase + og siteName/type on the root layout so
relative banner URLs resolve absolute. Canonical-host decision recorded:
https://labs.fattail.ai only, 301 from every variant at the MiniThree vhost —
added to infra/deploy.md as a wire-BEFORE-announcing launch step. Roadmap
(free-lesson landing pages → category hubs → structured-data expansion → AEO)
and anti-goals (no blog bolt-on, no keyword stuffing, no funnel bypass) live
in the spec.

**Verification:** robots.txt and sitemap.xml serve correctly; sitemap has 13
URLs (3 static + 10 published, draft absent); /me carries noindex,nofollow;
catalog page carries no robots meta; course canonical absolute; og:image
verified absolute with a probe banner (then reverted). Server suite 44/44.
Spec: FatTail-Labs-SEO-Spec-v1.0.md.

## 2026-07-21 — SEO v1.1: free-lesson landing pages (Layer 2)

**Decision:** The anonymous lesson page becomes a real landing page instead of
a contentless sign-in wall. New public endpoint (…/lessons/{slug}/public)
returns safe metadata + notes for free previews only — no video fields by
construction, gated notes never public, drafts 404. Anonymous render: breadcrumb,
title/module/duration, locked player panel with signup/membership CTA, notes
(free only), prev/next links, LearningResource + BreadcrumbList JSON-LD
(isAccessibleForFree: false — watching always requires an account, per the
founding funnel rule). Index policy: free previews indexable with derived
descriptions; gated shells noindex,follow. Sitemap gains all free-preview
lessons (11 today). Authoring consequence recorded: notes on free previews are
now public ranking copy. Signed-in behavior unchanged.

**Verification:** Suite 46/46 (2 new endpoint tests: payload safety + draft
404s). Anon HTML: full title/h1/JSON-LD/lock CTA, zero "youtube" occurrences;
gated page noindex,follow + members shell; probe notes rendered in anon HTML
and drove the meta description, fallback description verified with notes
absent (probe reverted to NULL). Sitemap 11 lesson URLs.
Spec: FatTail-Labs-SEO-Spec-v1.1.md.

## 2026-07-21 — SEO v1.2: category hub pages (Layer 2b)

**Decision:** Nine prerendered keyword hubs at /courses/category/{slug}.
Migration 013 adds categories.description_md, seeded with doctrine-voice intro
copy for every category; public GET /api/categories (separate router — the
courses router prefix would have swallowed the path, caught by the endpoint's
own test failing first) returns slug/name/copy/published-count. Hubs render
copy + the category's courses (CatalogGrid, prerendered) + cross-links to all
other non-empty hubs; empty categories 404 rather than exist as thin pages.
Catalog gains a server-rendered "Browse by category" footer (the client-side
filter chips are invisible to non-JS crawlers). ItemList + BreadcrumbList
JSON-LD; sitemap gains the 9 hub URLs. Category copy editing is seed/DB-only
for now — logged future scope.

**Verification:** Suite 47/47 (new categories-endpoint test). Build prerenders
9 hub routes; risk-sizing hub HTML carries title/h1/copy/canonical/ItemList
and its 2 courses; unknown category 404s; catalog links all 9 hubs; hubs
cross-link; sitemap +9 category URLs. Spec: FatTail-Labs-SEO-Spec-v1.2.md.

## 2026-07-21 — SEO v1.3: structured data + AEO (Layers 3+4)

**Decision:** Course JSON-LD gains offers (Subscription $250 → /membership)
and the trailer as VideoObject (YouTube thumbnail, embed, uploadDate) —
lessons deliberately stay VideoObject-free since watching is gated. /live
emits Event JSON-LD for upcoming PUBLIC sessions only (0DTE Live Show;
member sessions never in schema), hourly window. New /about entity page:
Person (Ernie Varitimos) + Organization with sameAs to youtube.com/@0dte,
0-dte.com, fattail.ai; bio limited to in-repo facts (founder review invited);
sitewide Organization JSON-LD in the layout; About in nav + sitemap.
Membership page: six-question FAQ rendered visibly AND as FAQPage JSON-LD
from one array (no drift possible), grounded in the tier/trial/alumni specs.
/llms.txt site card for AI crawlers. SEO design v1.0–v1.3 complete; remaining
work is content-side and post-launch ops.

**Verification:** Course HTML carries VideoObject + i.ytimg thumbnail +
Subscription offer; /live has 5 Event entries (remaining July MWF shows);
/about serves Person + Organization + copy; /membership serves FAQPage +
visible FAQ; /llms.txt 200; catalog carries the sitewide Organization; nav
links /about; sitemap +1. Suite 47/47. Spec: FatTail-Labs-SEO-Spec-v1.3.md.

## 2026-07-21 — User's Guide (/guide) + Admin Guide (docs/)

**Decision:** Two guides, two audiences. (1) Member-facing User's Guide at
/guide — static, indexable (help content doubles as answer-engine content),
linked in the nav and sitemap; nine sections with anchor chips covering
accounts/previews, finding courses, taking a course (position resume, 90%
auto-complete), quizzes, progress surfaces, the live schedule with the
standing session times and access tiers, resources, membership + the alumni
year, and Stripe billing. Every claim mirrors shipped behavior — no promised
features. (2) docs/ADMIN-GUIDE.md — the operator's manual consolidating the
admin workflows spread across 30 specs: in-place editing model, course
lifecycle, lessons/video/notes (with the free-preview-notes-are-public
warning), card/banner/media, quizzes, resources, live schedule management
(scopes, categories, bounds), category copy, membership ops, and the
test/build rhythm. Specs remain authoritative; the guide cites them.

**Verification:** /guide 200 with title, section content (alumni year, 0DTE
show, Manage billing) in prerendered HTML; nav links it; sitemap +1;
screenshot confirms layout. Build clean, 38 static pages.

## 2026-07-22 — Bootstrap administrators

**Decision:** Three platform administrators, granted via
`identities.role_override = administrator` (not plan memberships):
`ernie@fattail.ai`, `conor@fattail.ai`, `coach@fattail.ai`. Seeded
idempotently by migration `014_bootstrap_admins.sql` so every environment
has the same operator set. Passwords and WordPress identity links remain
operator-managed (`create_user.py` / SSO).

## 2026-07-22 — Labs landing page is the front door

**Decision:** `/` is a real public landing page (stop-the-bleeding thesis,
pillars, flagship callout, featured courses, CTAs) — no longer a redirect
to `/courses`. Brand link in `SiteHeader` points to `/`. Catalog stays at
`/courses` as the library storefront. Amends parent Course-Hosting spec
§4.1 ("`/courses` is the entry point" / "`/` redirects to `/courses`"):
Labs now owns its own front page; fattail.ai marketing can still deep-link
to courses. Sitemap priority 1 moves to `/`.

## 2026-07-22 — Front page is the course hub

**Decision:** `/` is the **course hub**, not a marketing funnel. Layout:
compact hub header → flagship "Start here" strip → category chips → full
`CatalogGrid` (flagship sorted first) → light membership/guide footer.
Pillars / sales CTAs removed. `/courses` remains the dedicated library
route (nav "Courses"); brand still lands on the hub.

## 2026-07-22 — Course hub optimized for SEO / AEO / agents

**Decision:** `/` is the canonical **machine-readable course index**, not a
card grid. Server-rendered: 40–60-word lead answer, flagship section with
description lead, every category hub (copy + course title links), complete
ordered catalog (title, subtitle, description lead, meta, absolute-style
URL path), visible FAQ matching schema. JSON-LD: `WebSite`,
`CollectionPage`+`ItemList`, standalone `ItemList` of `Course` items, and
`FAQPage` (same Q&As as the visible block). Flagship sorted first.
`/courses` stays the interactive filtered catalog; `/llms.txt` points
agents at `/` as the hub start. No profit claims — process/doctrine only.

## 2026-07-22 — Course hub layout: categories + 2-col + intro video

**Decision:** Hub courses are grouped by category section with a two-column
card grid (title, subtitle, description lead). Jump chips to each category.
Intro video at the top: click-to-play YouTube poster (`HubIntroVideo`),
resolved from `NEXT_PUBLIC_LABS_INTRO_VIDEO_ID` → flagship trailer →
fallback id. `VideoObject` JSON-LD + YouTube link for agents/crawlers.

## 2026-07-22 — Hub CMS: editable page + accordion FAQ

**Decision:** Course hub content is CMS-backed like other in-place admin
pages. Migration `015_hub_content.sql`: `site_pages` (title, description_md,
intro video, faq_title, faq_description_md) + `site_faq_items` (sort_order,
question text, answer_md markdown). Public `GET /api/hub`; admin
`PUT /api/admin/hub` replaces fields + full FAQ list. UI: `HubEditProvider`
+ Edit FAB/bar; title/lead/video editable; FAQ is an accordion (collapsed by
default, single open panel) with add/reorder/delete in edit mode; answer
editor is markdown with image upload (media library). FAQPage JSON-LD from
DB. Catalog/category blocks remain server-rendered.

## 2026-07-22 — Lesson course navigation rail

**Decision:** Lesson pages use a **9/12 main + 3/12 right rail** layout. The
rail is course navigation (modules → lessons with links), sticky on desktop,
with per-lesson completion indicators from `GET /api/me/progress` and live
updates via `labs:progress` when the player/quiz completes a lesson. Shown for
authenticated, 403, and anonymous lesson views when course detail loads; the
lesson API remains access authority. Spec:
`FatTail-Labs-Lesson-Course-Nav-Spec-v1.0.md` (extends parent §5.3).

## 2026-07-23 — Agent model interface: Grok primary, Claude secondary

Spec: FatTail-Labs-Agent-Model-Interface-Spec-v1.0. P2 agents and workflows call
foundation models through `server/ai/` only — no vendor SDKs scattered in seeds.
**Primary:** xAI Grok (`XAI_API_KEY`, default model `grok-4.5`). **Secondary:**
Anthropic Claude (`ANTHROPIC_API_KEY`, default `claude-sonnet-4-5`). Prefer modes:
`primary` (default), `secondary`, `auto` (fallback on provider failure only).
AI keys are optional at platform boot (same pattern as Stripe); completions fail
loud if the selected provider key is missing. No member-facing chat route in v1.
Agent callsign may set prefer via `LABS_AI_AGENT_<CALLSIGN>_PREFER`.

## 2026-07-23 — Agent task runtime tests for studio bench

`server/ai/agents.py` loads `agents/bench/<callsign>.md` charters and runs
catalogued tasks via the model interface. Characterization in
`server/tests/test_agent_tasks.py`: every studio agent × task end-to-end with
fake Grok; pipeline order smoke; optional live Bravo smoke when `XAI_API_KEY`
is set. Required section markers fail loud if missing.

## 2026-07-23 — Browser agent workbench + live API key validation

Admin gateway `/api/admin/ai/*` and UI `/admin/ai` let administrators run catalogued
agent tasks through the browser. Live runs require `XAI_API_KEY` on the API (Grok
primary). Playwright e2e (`web/e2e/agent-workbench.spec.ts`) validates the workbench
UI and, when the key is present, live Bravo/November task output section markers.
Dev login: `/api/auth/dev-login`.

## 2026-07-23 — Retroactive as-built architecture documentation pack

Code audit of `server/` + `web/` produced Architecture docs 01–07 (system overview,
backend design, frontend design, domain data model, security/access, operations/
verification, audit snapshot). Decision log remains append-only authority for
*why*; Architecture describes *shape*. Specs remain feature contracts. Index:
`Architecture/README.md`.

## 2026-07-23 — Phase A: agent identity + dual admin surface

Specs: FatTail-Labs-Agent-Identity-Spec-v1.0, FatTail-Labs-Admin-Dual-Surface-Spec-v1.0.
Migration 016: agent_principals, agent_api_keys, actor_events; studio principals seeded.
Agents authenticate via `Authorization: Bearer ftl_ag_<prefix>_<secret>` with scopes
(`ai:run`, `ai:status`, …). Human admins mint/revoke keys. AI workbench accepts human
session or agent bearer; successful runs write actor_events. Admin app shell at `/admin/*`
suppresses member SiteHeader (AppChrome); in-place editing remains on production URLs.

## 2026-07-23 — Phase B: content backlog & Kanban production board

Spec: FatTail-Labs-Content-Board-Spec-v1.0. Migration 017: content_vision,
content_items (work-product cards), transitions, artifacts, guardian flags.
Kanban UI at `/admin/board` — cards drag across process columns (draft → queued →
scheduled → in_production → awaiting_approval → published / rejected / revision).
Human admins create cards and own publish/reject; agents with `board:operate` may
move pipeline columns (Quebec). Open flags block awaiting_approval.

## 2026-07-23 — Admin notifications (email + in-app + browser)

Spec: FatTail-Labs-Admin-Notifications-Spec-v1.0. Migration 018: admin_notifications.
When a board card moves to awaiting_approval or revision_requested, or a block flag
opens, all role_override administrators get an in-app inbox row and optional SMTP
email (LABS_SMTP_*). Admin shell polls unread count, supports browser Notification
API, deep-links /admin/board?item=N. Dev identity_id=0 has no inbox (use real admin).

## 2026-07-23 — FatTail outbound SMTP is Hostinger

Admin notification email uses **smtp.hostinger.com** (port **465** SSL preferred;
587 STARTTLS alternate). Env: LABS_SMTP_HOST/PORT/MODE/FROM/USER/PASSWORD.
Documented in `.env.example`, notifications spec, and `infra/deploy.md`.
`notify.py` supports SMTP_SSL (465) and STARTTLS (587).

## 2026-07-23 — Phase C production packages + Phase D placement start

Spec: FatTail-Labs-Production-Package-Spec-v1.0. Migration 019: ai_invocations,
content_approval_packages, artifact hash/invocation FKs, placed_course_slug.
Awaiting_approval requires complete stage checklist per product_line; freezes a
pending package snapshot. AI runs with content_item_id attach artifacts. Publish
approves package and applies Phase D draft course placement (module+lesson) when
placement_proposal present. Board drawer shows package checklist.

## 2026-07-23 — Phase D complete: multi-module placement

Placement apply parses placement_proposal / lesson_plan / video_package JSON:
modules, lessons (video_id, free_preview, body_md), trailer, course resource
links. Re-place rebuilds draft courses only (refuses published). Board Approve
uses replace=True; drawer Re-apply placement; Admin Guide updated.

## 2026-07-23 — Architecture docs parity for Phases A–D

Brought Architecture README + 01–07 in line with shipped agent identity, Kanban board,
packages, multi-module placement, and admin notifications. Admin Guide already covered
operators; design docs had lagged Phase D completion.

## 2026-07-23 — Phase E hardening: pool, SSO contracts, smoke tests

DB connection pool in `server/db.py` (LABS_DB_POOL_SIZE default 10). Characterization:
test_db_pool, test_sso_providers (stub WP JWTs + native fallback), test_smoke_member_path.
Browser smoke: web/e2e/smoke.spec.ts (npm run test:e2e:smoke). Spec:
FatTail-Labs-Phase-E-Hardening-Spec-v1.0. P1 ORCHESTRATOR marked historical.

## 2026-07-23 — Phase F: Bunny Stream signed embeds for gated video

Spec: FatTail-Labs-Lesson-Video-Signed-CDN-Spec-v1.0. Provider `bunny` builds
time-limited Stream embed URLs (sha256 token + expires). YouTube remains for free
preview/trailers. Env: LABS_BUNNY_LIBRARY_ID, LABS_BUNNY_TOKEN_KEY, optional TTL.
LessonPlayer supports bunny iframe + visibility heartbeat progress.

## 2026-07-23 — Phase G1 cast registry + G2a HeyGen board kick

Spec: FatTail-Labs-Cast-HeyGen-Spec-v1.0. Migration 020: `content_items.cast_id`.
Cast source of truth remains `docs/studio/cast/AVATAR-*.md` (DUDE-PRIMARY,
DUDE-ALT registered from existing HeyGen groups). Admin `/admin/cast` lists
members; board create/patch assigns cast; drawer Produce HeyGen writes
`video_package` (dry-run or live video-agent submit via CLI). Live requires
HEYGEN_API_KEY + wallet credits; LABS_HEYGEN_DRY_RUN forces dry path. YouTube
upload and multi-scene batch remain later G slices.

## 2026-07-23 — Phase G complete (G2b–G5)

Spec: FatTail-Labs-Cast-HeyGen-Spec-v1.1. Migration 021: `heygen_job_ledger`.
**G2b** multi-lesson batch from lesson_plan/placement/script beats (default batch
LABS_HEYGEN_MAX_BATCH=3). **G3** daily/monthly live job budgets
(LABS_HEYGEN_DAILY_JOB_LIMIT / MONTHLY). **G4** Quebec tick advances
queued→scheduled→in_production→awaiting_approval from artifacts; agents need
LABS_QUEBEC_AUTO=1; humans force. **G5** refresh-heygen poll + youtube-map on
package for Phase D. Board UI: budget chip, Quebec tick, render list, YT map.
No auto YouTube upload; publish remains human.

## 2026-07-23 — Docs parity for Phase G (A–G complete)

Brought operator and architecture docs in line with shipped cast/HeyGen factory:
Admin Guide (§2.5–2.7, cast map, env table, spec index), root README, Architecture
01–04/06/README, ops verification tests, deploy.md HeyGen env, P2 capabilities +
charter, cast registry README, Cast-HeyGen v1.0 cross-link to v1.1.

## 2026-07-23 — Native forgot-password / password reset

Spec: FatTail-Labs-Password-Reset-Spec-v1.0. Migration 022: `password_reset_tokens`
(SHA-256 of raw token only). `POST /api/auth/forgot-password` (enumeration-safe;
requires SMTP + LABS_WEB_ORIGIN) emails a one-time link; `POST /api/auth/reset-password`
sets a new scrypt password. UI: `/forgot-password`, `/reset-password?token=`, link on
login. Shell `create_user.py` remains operator fallback. TTL default 1h
(`LABS_PASSWORD_RESET_TTL_SECONDS`).

## 2026-07-23 — WooCommerce + WordPress SSO integration guide

Operator runbook `docs/WooCommerce-SSO-Integration-Guide.md` documents dual-issuer
SSO JWT claims, Labs callback URLs, HMAC membership webhooks, `provider_plan_map`,
env secrets, verification curls, and WP plugin checklist. Linked from README,
Admin Guide, deploy.md, and Architecture security.

## 2026-07-23 — Labs SSO aligned with MarketSwarm-Canonical / fotw-sso

SSO mint remains WP **fotw-sso** (documented in MSC
`org/reference/softwares/flyonthewall_wordpress.md` and verified like
`src/auth/sso.py`). Labs `providers.py` now accepts MSC claim shapes: `iss` fotw|fattail
for `wordpress:fattail`, user id `sub|id|wp_id|wp_user_id`, entitlements
`membership_plans|plans|subscription_tier`, name `name|display_name`, and query
param `sso` as well as `token`. Login URLs use `/fotw-sso?redirect=` (MSC LoginPage
pattern). Still no MSC code import — contract only.

## 2026-07-23 — Marketing platform architecture (design draft)

`docs/Marketing-Platform-Architecture.md`: lightest high-power acquisition system
built on Labs public SEO/AEO, factory (board/cast/HeyGen/YT), thin attribution
spine — not a second CMS or heavy Martech. Good/Better/Best; Sierra/Tango gates;
flagship-first funnel.

## 2026-07-23 — Marketing architecture rev 2: backend-agnostic + ActiveCampaign

Coach: WooCommerce not required. Marketing rides Labs identity/memberships and
**pluggable commerce** (Stripe native, optional Woo external_url, free signup,
manual grants). **ActiveCampaign** first-class growth adapter (contacts/tags/events),
independent of WP; Labs SMTP stays transactional. CTA resolver abstracts convert
modes. Metrics keyed on membership activations by `source`, not shop vendor.

## 2026-07-23 — Campaigns as first-class factory workflow

Coach: campaigns are peers to courses. Spec:
`Specs/FatTail-Labs-Campaign-Workflow-Spec-v1.0.md` — board `product_line=campaign`,
required package stages (brief, lander, script, video, distribution, vision, growth
hooks), human approve → place lander + `marketing_campaigns` row. Channels YouTube /
X / Instagram in distribution_plan. Marketing architecture rev 3. Implementation
not started; Good MVP = full board workflow + manual social publish.

## 2026-07-23 — Quebec automatic poller + forward progress

Coach: automatic poller ensuring board cards move forward. Spec:
`FatTail-Labs-Quebec-Poller-Spec-v1.0`. Process `server/quebec_poller.py` when
`LABS_QUEBEC_POLLER=1`; each cycle advances queued→scheduled→in_production and
optionally produces next missing package stage (`LABS_QUEBEC_AUTO_PRODUCE`, mode
fixtures|live|auto). Never publishes. Status in `quebec_poller_status` (migration
023); board UI chip + Tick + produce. Manual tick still available.

## 2026-07-23 — Workflow manager design (course submit must start run)

Design draft `docs/Workflow-Manager-Architecture.md`: generic WFM (definitions,
runs, steps, worker) with board as control surface. **draft→queued** for a course
**must** start `course_create` run; worker executes research→plan→script→video→
placement→vision→awaiting_approval. Human still Approve + member publish. Quebec
poller becomes step executor. Campaigns reuse same manager later. Awaiting Coach
decisions before build.

## 2026-07-23 — Content types frozen (four) + Course skills first

Coach ratified `docs/Content-Types-Taxonomy.md`:

| product_line | Shape |
|---|---|
| `course` | Header + ≥1 modules + lessons |
| `tutorial` | Header + exactly one lesson (own type) |
| `youtube_long` | Header + primary video |
| `campaign` | Funnel + landing page + mail list |

Shorts/`other` not first-class factory types for v1. Skills are required for type
components; **Course first** as the most complex pattern. Skill pack:
`skills/course/` — research, lesson-plan, header, resources, lesson-script,
lesson-video, placement, vision, package, and orchestrator `course-create`.
Tutorial / YT Long / Campaign skill packs derive from Course later.

## 2026-07-23 — Course shape refined: Header · Outline · KC · Resources

Coach: a Course has **Header**, **outline with Modules**, **Lessons**, **Knowledge
Check**, and **Resources**. Modules require **description**. Lessons require
**video + markdown**. Skill pack v0.2: `course-knowledge-check` added; plan,
placement, package, and `course-create` enforce the contract.

## 2026-07-23 — Course Blueprint is first validated product (AI chat)

Coach: Header + Outline is the **first product** the system creates that requires
validation. Minimum bar: **descriptions** (course + each module). Primary UX:
**AI chat** (not form-first). Human **Approve Blueprint** before scripts/video/KC
detail. Skill: `skills/course/course-blueprint/`. Second gate remains full package
approval. Two-gate `course-create` pipeline.

## 2026-07-23 — Course Blueprint Chat API shipped

Migration `024_course_blueprint`: `content_blueprints` + item `blueprint_status` /
`blueprint_id`. Module `server/blueprint.py`. Board routes:

- `GET/PUT /api/admin/board/items/{id}/blueprint`
- `POST …/blueprint/chat` (November/Grok live or `use_fixtures`)
- `POST …/blueprint/validate` (min bar: descriptions)
- `POST …/blueprint/approve` (human; writes `lesson_plan` artifact)

Tests: `server/tests/test_course_blueprint.py` (7).

## 2026-07-23 — Course Blueprint board UI (drawer panel)

`web/components/admin/CourseBlueprintPanel.tsx` on course cards in board drawer:
Chat / Preview tabs, fixture toggle, Validate, Approve Blueprint. Card face shows
`bp:` status chip. Drawer widens to `max-w-lg` for courses.

## 2026-07-23 — Blueprint co-pilot doctrine (chat ≠ project input)

Coach: long-running chat must not be the primary project input. **Approved
structured Course Blueprint** is system of record for gate 1; chat is **co-pilot
+ provenance** only. Factory advances by skills/stages after Approve, not by
continuing chat into video. Skills pack v0.4 + UI copy: Preview = product,
Chat = co-pilot; default tab Preview.

## 2026-07-23 — Blueprint streaming chat + full workspace

Coach: streaming + live-default (Grok-like); drawer felt too small.
- `POST …/blueprint/chat/stream` SSE (delta/done/error); xAI `stream=true`
- UI live default (fixtures opt-in); stream bubbles
- Full workspace `/admin/board/blueprint/{id}` — side-by-side chat + preview
- Drawer keeps compact panel + **Open full workspace** link

## 2026-07-23 — Outline workspace is chat-first (primary surface)

Coach: chat should be the full-sized workspace for developing course outline,
modules, and lessons. Board drawer is **launch pad only** (no embedded chat).
Workspace layout: ~60% streaming chat, ~40% live outline product; near-viewport
height; wider admin max width.

## 2026-07-23 — HeyGen batch experiment protocol (3 → 4 → 2)

Coach: discover practical concurrent limit and optimal use empirically — not
assume whole-course dump. Protocol `docs/studio/HeyGen-Batch-Experiment.md`:
Wave A batch 3, B batch 4, C batch 2; fixed prompt template + lesson briefs;
JSONL log + results sheet. Default product remains max_batch=3 until data.

## 2026-07-23 — HeyGen delivery-format experiment (outline / scripts / inline)

Coach: try three payloads for the same Foundation module — (α) module outline
only, (β) outline then separate video scripts, (γ) outline with inline scripts
(slice per lesson). Protocol
`docs/studio/HeyGen-Delivery-Format-Experiment.md` + fixtures under
`docs/studio/experiments/fixtures/`. Concurrent batch held at 2 while comparing
formats; log `delivery_format` on each job.

## 2026-07-23 — HeyGen live Wave A results (batch 3, format β)

Coach: three Foundation lessons via CLI (Dude Primary, separate script prompts).
**Quality very good (5/5).** Cost **~$5.50/video**, duration **~2:55 avg**. Batch of
3 concurrent completed cleanly. Provisional: keep max_batch=3; β (script packets)
credible default; course cost scale ~$55/10 lessons video-only at this density.
Logged in `docs/studio/experiments/`.

## 2026-07-23 — Manual vs System two-course experiment started

Coach: full course manually, then next course via system — learn cost/quality.
Protocol `docs/studio/experiments/manual-vs-system-courses.md`.
**Course A (manual):** Stop the Bleeding Foundations — 2 modules / 6 lessons;
L1–3 done; L4 submitted; L5–6 scripts ready; Labs draft
`/admin/courses/stop-the-bleeding-foundations` with dense video + rich notes.
**Course B (system):** board item 291 + blueprint workspace
`/admin/board/blueprint/291` — Capital Preservation Operators — Daily Discipline.

## 2026-07-24 — Hub intro clips submitted to HeyGen (13 jobs)

Coach plan course-hub-intro-v0.5: role-variant opens/closes + shared body.
Submitted **13/13** Video Agent jobs (body 6–8 separate for Lab re-record), Dude
Primary, landscape. Manifest:
`docs/studio/experiments/hub-intro/MANIFEST.md`. Assemble into 5 hub videos
(Anonymous/Campaign/Observer/Activator/Navigator) in editor with screen-capture
B-roll; gates Hotel/Tango/Coach before publish.

## 2026-07-24 — Human Interface Spec v1.0 (Apple HIG for Labs web)

Coach approved `Specs/FatTail-Labs-Human-Interface-Spec-v1.0.md` as the GUI
constitution for member site, in-place admin, and `/admin/*`.

**Decisions locked:**
- Apple HIG principles adapted to web (clarity, deference, depth, 44pt targets,
  AA a11y); one component kit, member vs operator density dialects.
- Tokens-only styling; no emoji as chrome; AlertDialog replaces `confirm`/`alert`.
- **Appearance & Chrome Control Plane:** administrators control brand (swatch
  tint enum), chrome nav (allowlisted routes), hub region composition, course
  tabs, announcements, operator shell prefs — typed JSON, draft/publish, no
  freeform CSS/JS.
- Tint: closed swatches only (v1). Font: system/SF stack only (v1). Density:
  admin-published only. Draft preview: admin session + `?appearance=draft`.
  Hub FAQ body stays in-place CMS; appearance toggles region only.

**Delivery:** phases H0–H7 under `agents/p-hig/`. Foundation (H1) and appearance
schema/API (H5 scaffold) ship with first implementation wave.


## 2026-07-24 — Primary nav: Labs hub; Pathway not a top tab

Coach: Pathway remains a product surface (assessment funnel / future role-based
sequencing) but is **not** primary chrome. Primary tabs:
**Courses · Labs · Resources · Live · About · Guide**.

**Labs** (`/labs`) sits between Courses and Resources as the home of member
practice tools: Trade Log, Journal, Playbook, Statistics, Vexy. Tools ship
incrementally; no survey-driven customization UI yet — path personalization will
be seamless by role later.


## 2026-07-25 — Application Framework + Member Data & Privacy (W0 lock)

**Specs approved for build:**
- `Specs/FatTail-Labs-Application-Framework-Spec-v1.0.md` — L1 Display–Edit, L2
  Component Contract, L4 Templates; supersedes In-Place Editing System v1.x.
- `Specs/FatTail-Labs-Member-Data-Privacy-Spec-v0.1.md` — Family B isolation,
  dual admin access modes (aggregates vs consented examination), member rights.

**Reviews (gate-reports under `agents/p-app-framework/`):** India, Mike, Echo+Tango,
Hotel+Sierra — all PASS. India amendments applied (L0 privacy co-authority; slot
policy documentation-enforced v1; AF-B1 no admin back door; Journey delete vs
derived progress; isolation key `identity_id`).

**Decisions locked:**
- **F-D1** Application Framework is L1+L2+L4 of record.
- **F-D2** Lesson URLs are regions of Course Presentation (not a separate template).
- **T-D1** Family B private tools in scope; privacy model = Member-Data-Privacy;
  no member-public sharing in v1.
- **T-D2 Cut A** ship now: W0 + **W1 Family A formalize/stay-put**. Cut B (W2+
  privacy spine → Journey → Trade Log → …) after Gate 1; production Family B
  after counsel/DPIA status recorded.
- **T-D3** Journal is a finite Calendar variant (structure only; own data store).
- **T-D4** Calendar/Schedule extends `live_sessions` — no parallel event store.
- **T-D5** Trade Log/Journal process-first; P&L neutral never headline (Hotel).
- **Privacy D-2** default k=5 cohort floor (Mike).
- **Privacy D-3** analytics opt-in default false; separate from examination consent.
- **Privacy D-5** v1 = platform/disk encryption posture; app-level field encryption deferred.
- **Privacy D-1** starter allowlist: completion/progress distributions, tool usage
  counts, streak histograms — no free text, no raw P&L series (Mike).
- **Privacy D-4** sketch: purge authored tools ≤30d after account delete; audit 2y.
- **Privacy D-6** no competitive/public gamified streaks (Tango default).

**Orchestration:** `agents/p-app-framework/` (CHARTER + ORCHESTRATOR + seeds W0–W8).

**Related:** 2026-07-24 primary nav Labs hub hosts future Trade Log/Journal/Playbook.

## 2026-07-26 — DL-061 Canonical Course Model v1.0

**Decision:** Accept Canonical Course Model as the portable, inspectable, validatable
definition of a Course (Coach draft v0.1 evolved to Spec v1.0).

**Locked:**
- Format `fattail.labs.canonical_course`, `model_version` `1.0`.
- **References over duplication** for Resources, Categories, Media, Cast, Live series;
  full copies only in export `bundle`.
- Hierarchy: Course → Module → Lesson → **content_blocks** (discriminated union).
- Runtime MySQL remains SoR for members; document projects to/from lesson columns +
  `extra_blocks_json` for multi-block fidelity.
- Import default `create_draft`; never silent overwrite of **published**.
- ProductionState travels with the document as enrichment; board transitions stay on
  board APIs.
- Legacy Course Package / placement plans adapt **into** this model.
- JSON Schema: `Specs/schemas/canonical-course-v1.json`.

**Shipped with decision (C0–C3 partial + C4 validate hook):**
- Spec + Architecture/08 + Design/09 + `agents/p-canonical-course/`
- Migration `028_canonical_course_model.sql`
- `server/course_model.py` + admin APIs under `/api/admin/canonical-courses/*`
- Characterization: `server/tests/test_canonical_course_model.py`
- Admin: Export package (edit bar) + Import package (catalog)

**Specs:** `Specs/FatTail-Labs-Canonical-Course-Model-Spec-v1.0.md`  
**Orchestration:** `agents/p-canonical-course/ORCHESTRATOR.md`

## 2026-07-26 — DL-061a Canonical Course Model media & free-preview rules

Coach resolved open gap questions on Canonical Course Model v1.0:

| ID | Decision |
|----|----------|
| **CCM-D10** | YouTube is the default and current-only video provider (trailers + lessons). Other providers (e.g. local) deferred. |
| **CCM-D11** | Preserve lesson `kind` exactly: video \| text \| download \| external \| replay \| quiz. |
| **CCM-D12** | Course- and lesson-level resources are **pointers** to the generic Resource type. |
| **CCM-D13** | All media except emoji is a **reference** (Resource pointer or YouTube id). No media ZIP in v1.0; no binary embed. |
| **CCM-D14** | Instructors export **full profiles** (name, bio_md, avatar_url reference, links) in `bundle.instructors[]`; import may create. |
| **CCM-D15** | SEO JSON-LD: platform regenerates for now; package `seo` stays thin/optional. |
| **CCM-D16** | `free_preview` is an **authorization flag only** — free-preview lessons have the same content shape as any lesson. |

**Code:** `server/course_model.py` + Spec Canonical Course Model v1.0 coach-decisions block.

## 2026-07-26 — DL-062 Resource entity (versioned, first-class) Spec v1.0 draft

**Decision:** Resources are first-class versioned materials (logs, worksheets, process
infographics), not solely course-owned attachments.

**Model locked in** `Specs/FatTail-Labs-Resource-Spec-v1.0.md` **(DRAFT pending Coach
formal approval of implementation):**

| ID | Decision |
|----|----------|
| **RES-D1** | First-class Resource; courses **link** (many courses possible) |
| **RES-D2** | Immutable integer versions; edit = new version |
| **RES-D3** | At most one **published** version; **slug → published only** |
| **RES-D4** | Course **pins** a version; course always shows linked resources at pin |
| **RES-D5** | Library visibility = publish flag (`published_version_id`) |
| **RES-D6** | New resources default **unpublished** to hub until explicit publish |
| **RES-D7** | free_preview = access, separate from publish |
| **RES-D8** | Canonical packages use slug + optional pin; no binary embed |
| **RES-D9** | Types include spreadsheet, document, image, link (frequent-update assets) |

**Migration path:** backfill from `attachments` (Resource Library v1.x) → Resource +
Version 1 + CourseResourceLink.

**Status:** Spec drafted 2026-07-26; implementation phases R0–R7 in the spec. Not yet
built as runtime SoR (library still attachment-based until R* ships).

## 2026-07-26 — DL-062a Resource Spec build approved; R1 domain shipped

Coach approved build and started R1. Schema + pure domain ops for first-class
versioned Resources:

- Migration `029_resources.sql`: `resources`, `resource_versions`,
  `course_resource_links`, `resource_migration_map`
- Module `server/resources_domain.py`: create, add_version, publish/unpublish,
  attach/set_pin/unlink, slug resolve
- Tests: `server/tests/test_resources_domain.py` (6) — unpublished default,
  single publish, pin ≠ published, unpublish keeps pin

**Next:** R2 APIs (`agents/p-resources/seeds/R2-alpha-api.md`).

## 2026-07-26 — DL-062b Resources R2 APIs shipped

Member + admin HTTP for first-class Resources (p-resources R2):

- `GET /api/resources` dual-read (published resources + legacy attachments)
- `GET /api/resources/{slug}` published only
- `GET /api/resource-versions/{id}/download` (published or course-pinned; free/alumni gate)
- Admin: `/api/admin/resources`, versions, publish, course attach/pin/unlink/list
- Course detail payload: `resources[]` alongside legacy `attachments`

Tests: `test_resources_api.py` + domain suite (10). Next: R3a hub UI / R3b course UI.

## 2026-07-26 — DL-062c Resources R3a+R3b UI shipped

Member + admin Resources hub (`ResourceLibrary.tsx`): first-class create, version,
publish/unpublish; dual-read legacy attachments. Course builder
(`CourseResourcesEditor`): attach existing, create+link, pin picker, free, unlink.
Course Resources tab lists pins + legacy attachments.

## 2026-07-26 — DL-062d Resources R4 attachment backfill

Idempotent migrator `server/migrate_attachments_to_resources.py`:
- Course attachments → Resource + v1 + course link; publish v1 if course published
- Lesson attachments → link with lesson_id; not auto-published to hub
- Map table `resource_migration_map` for re-runs
- Type inferred from kind/url/title (spreadsheet/image/document/link)

Tests: `test_resources_migration.py`. Next: R5 Canonical Course package pins.

## 2026-07-26 — DL-062e Resources R5 Canonical Course package pins

Canonical export includes `resource_ids` (slugs) and `resource_links`
[{slug, pinned_version, free_preview}]. Bundle carries metadata URL refs only.
Import resolves slug (or creates from bundle), attaches with pin via
resources_domain. Wipe path clears course_resource_links. Test:
test_export_import_resource_slug_pin (U9).

## 2026-07-26 — DL-062f Resources R6 cutover (single SoR)

Library and course member surfaces use first-class Resources only:

- `GET /api/resources` drops attachment dual-read
- Course public payload `resources[]` only (attachments empty)
- `POST /api/admin/courses/{slug}/attachments` creates Resource + link (compat)
- Legacy `GET /api/attachments/{id}/download` retained for old URLs only

Next: R7 project close.

## 2026-07-26 — DL-062g Resources R7 project close PASS

p-resources v1.0 closed. Evidence: 34 pytest (resources + canonical + production
packages); R7_SMOKE U1–U10; no outbound fetch on resource paths. Spec status
approved as built. Residuals: lesson attach UI, attachment row cleanup, bulk repin.

## 2026-07-26 — DL-063 Section hubs (Labs, Resources, Live) CMS + SEO

Labs, Resources, and Live are first-class **section hubs** using `site_pages`
(same pattern as course hub `slug=hub`):

- Fields: `title`, **`description_md`** (markdown for members + crawlers)
- Public: `GET /api/site-pages/{slug}` for `labs` | `resources` | `live` | `hub`
- Admin: `PUT /api/admin/site-pages/{slug}` (in-place **Edit hub** on each page)
- SEO: generateMetadata from CMS + CollectionPage JSON-LD; Live keeps Event JSON-LD
- Sitemap includes `/labs` and `/resources`
- Migration `030_section_hub_pages.sql` seeds default doctrine-safe copy

## 2026-07-29 — DL-064 Member Profile + Journey visibility (presence roster)

**Coach intent:** Refashion header account menu; consolidate My Learning + Dashboard
into **Profile** preferences and **Journey** as the single progress surface.

**Product decisions:**
- Menu: Continue Learning strip + **Profile** + **Journey** (+ member/admin/sign out)
- `/me` = Profile (display name, avatar upload, Journey visibility)
- `/app/journey` owns enrollments, quizzes, activity, pathway, next live
- `/dashboard` redirects to Journey
- Journey **presence roster** (opt-in): display name + avatar only — not a P&L or
  progress ranking; private-by-default (`journey_visible=0`)

**Privacy amendment:** Member-Data-Privacy MR-1 “no sharing v1” amended for this
surface only (opt-in name/photo). Family B content remains private.

**Implementation:** migration `042_member_profile.sql`; APIs `GET/PATCH /api/me/profile`,
avatar POST/DELETE, `GET /api/journey/presence`; `/api/auth/me` returns `avatar_url`.
Spec: `Specs/FatTail-Labs-Member-Profile-Journey-Visibility-Spec-v1.0.md`.
Tests: `tests/test_member_profile.py` (5 passed).

## 2026-07-29 — DL-065 Journey gamification (self presence + community board)

**Coach intent:** Gamify Labs as presence for self and community so members are
seen as people who **contribute**, and can gauge **personal growth** vs process peers.

**Locked:**
- Opt-in via existing `journey_visible` (default off)
- Pillars: Reputation, Personal Growth, Attendance streak, Contribution (rank axis)
- v1 events: course completion, threads/comments/reviews, lessons/quizzes, live check-in
- **Strategy Life Cycle / Strategy Lab sharing reserved** for a later Spec addendum
  (never auto-publish private strategy content)
- Framing: process peers, not P&L competition (amends Privacy D-6 for opt-in only)
- Derive-on-read in `server/journey_scores.py`; migration `043_journey_gamification.sql`
- Spec: `Specs/FatTail-Labs-Journey-Gamification-Spec-v1.0.md`

**APIs:** `GET /api/me/journey/scores`, `GET /api/journey/leaderboard`,
`POST|GET /api/live/check-in`.

## 2026-07-29 — DL-066 Granular Journey share (community vs personal growth)

**Coach:** Community presence can be tailored. Members may keep personal growth
as a trader completely private while increasing community presence.

**Ship:** `share_reputation` (default on), `share_personal_growth` (default **off**),
`share_attendance` (default on). Board ranks by **public contribution** (shared pillars
only). Unshared pillars return null on leaderboard. Migration `044_journey_share_pillars.sql`.

## 2026-07-29 — DL-067 Member login-landing at /home

**Coach mock:** `landing.png` (First Movers–style member home).
**Ship:** `/home` MemberHome — welcome + streak, continue hero, process CTA,
my learning progress tabs, recommended courses, right rail (activity, achievements,
community board compact, get started). Login/SSO/dev-login redirect → `/home`.
Journey remains deep scores surface; Profile visibility unchanged.

## 2026-07-29 — DL-068 Personal standing = process meter (not achievements)

**Coach:** Personal progress is not about winning achievements — it is a **meter**
for how well you do the work that improves long-term success (daily routine,
retrospectives, growth, live presence, plan adherence).

**Ship:** `process_meters()` on `/api/me/journey/scores` → `process` payload;
`ProcessMeter` UI on `/home` Personal standing and Journey. Community presence
stays separate (reputation / board). No P&L in meters.

## 2026-07-29 — DL-069 Process meter includes practice persistence

**Coach:** Meter also measures **persistence** with the things that advance practice
(Trade Log, Journal, lessons, live) — not only short-window routine.

**Ship:** `practice_persistence` / `persistence` meter (12-week window, target 8 weeks);
included in overall process health. Spec §3.2b updated.

## 2026-07-29 — DL-070 Process meter profiles by membership

**Coach:** Meter profiles — Observer ~6-week focus; Navigator monthly vs yearly
adjusts persistence horizon.

**Ship:** `resolve_meter_profile` + profiles in `journey_scores.py`;
`process.profile` on `/api/me/journey/scores`; UI chip for profile/horizon.

## 2026-07-29 — DL-070 Process meter profiles by membership

**Coach:** Meter profiles — Observer ~6-week focus; Navigator monthly vs yearly
adjusts persistence horizon.

**Ship:** `resolve_meter_profile` + profiles in `journey_scores.py`;
`process.profile` on `/api/me/journey/scores`; UI chip for profile/horizon.

## 2026-07-29 — DL-071 G1 north star: Observer → Navigator + continued practice

**Coach:** Goal for Observers is to **maximize chance they upgrade to Navigator
and continue their practice** (process-first; not “leave happy” as co-equal target).

**Docs:** `docs/Dual-Goal-Product-Strategy-2026-07-29.md` G1 success + metrics updated.
**Product:** Observer trial process-meter copy; `/home` G1 framing + honest
“Continue as Navigator” CTA (membership). Alumni fairness remains doctrine.

## 2026-07-29 — DL-072 Journey Experience Spec v1.0

**Decision:** Land umbrella Spec for Journey as-built experience + implementation:
`Specs/FatTail-Labs-Journey-Experience-Spec-v1.0.md`.

Covers: dual standing (process meter vs community board), G1/G2, meter profiles,
share pillars, APIs, routes (/app/journey, /home, /me), live check-in, DS-2 no second
store, frontend/backend file maps, verification, DL index. Gamification Spec remains
formula detail; Profile Visibility remains opt-in fields.

## 2026-07-29 — DL-073 Process integrity grade scale (Poor→Excellent)

**Coach:** Process health 
## 2026-07-29 — DL-073 Process integrity grade scale (Poor to Excellent)

**Coach:** Process health percent also presented as color grades aligned with trading-psych norms (journal process scores).

**Scale:** Poor (0-24) · Fair (25-49) · Good (50-69) · Great (70-84) · Excellent (85-100).
Colors and blurbs are process-focused (not P&L / identity shame). API `process.grade` +
`grade_scale`; UI badge + segmented scale on ProcessMeter. Spec Journey Experience §4.0b.

## 2026-07-29 — DL-074 Tenure-weighted process grades (earn extremes)

**Coach:** Fresh members cannot start at Poor; time in the game weights grades.
Extremes (Poor / Excellent) are earned — square ease-in toward center until
profile grade_ramp_days. Establishing grade for early zero-signal period.


## 2026-07-29 — DL-075 Journey Experience Spec updated (grades + tenure)

**Decision:** Refresh `Specs/FatTail-Labs-Journey-Experience-Spec-v1.0.md` as-built for:
process integrity grade scale (Poor-Excellent + Establishing), tenure-weighted grades,
needle UI, G1 success criteria, scores API shape, verification 8-11, DL index through
DL-074. Journey Gamification Spec 3.2b/c points at Experience Spec as canonical meter detail.


## 2026-07-29 — DL-076 Session idle timeout (15–60 min, default 30)

**Coach:** Timeout after no activity for every role except admin. Default 30 minutes;
member may set 15–60. On timeout: logout and return to login page.

**Ship:** migration `045_session_idle_timeout.sql`; Profile + auth/me fields;
`IdleSessionGuard` client; login `?idle=1` notice. Journey Experience Spec §2.3b.


## 2026-07-29 — DL-077 Retrospective Spec v0.2 (Coach model)

**Coach intent:** A Retrospective is started in the **trading journal** by selecting
journal type Retrospective. That tells the system to **gather all work since the last
retrospective** (or **maiden journey** if none). Gather produces a dual report:
**actual P&L performance** + **process performance**, plus **Process Integrity** review.
If prior retros exist, **compare for progress**. Agent analysis flags **concerns**,
helps uncover **root cause(s)**, and drafts **habit-altering plan(s)** (member owns plans).

**Spec:** `Specs/FatTail-Labs-Journal-Retrospective-Spec-v0.2.md` (direction approved;
implementation slices R1–R5 not yet built). v0.1 remains historical + P0 shell honesty.


## 2026-07-29 — DL-078 Retrospective R1–R3 build

**Ship:** Journal-Retrospective Spec v0.2 slices R1–R3.
- Migration `046_retrospectives.sql` (`member_retrospectives`)
- Domain `server/retrospective_domain.py` + routes `server/routes/retrospectives.py`
- Create from Journal type **Retrospective** or `/app/retrospective` Start
- Gather: dual P&L + process report, Process Integrity, prior comparison / maiden
- Complete sets next scope boundary; one open retro at a time
- UI: library, workspace `/app/retrospective/[id]`; agent R4 deferred
- Tests: `tests/test_retrospectives.py`


## 2026-07-29 — DL-079 Retrospective Spec v0.4 (advisor draft)

**Action:** Landed `Specs/FatTail-Labs-Journal-Retrospective-Spec-v0.4.md` for India /
Hotel / Tango / Mike / Sierra / Delta review, then Coach GO and implementation plan.

Unifies v0.2 gather model + v0.3 process-first quality fixes; reconciles as-built R1–R3;
MIN_INFERENCE_N default 20; process-first workspace; collapsed book performance;
normalized comparison; agent anchoring; habit plan cap 2. Not yet Coach-approved for
build of R1b–R7 deltas.


## 2026-07-29 — DL-080 Observer trial on retros; Activator is legacy

**Coach:** Only **Observer trial** (among free/trial populations) gets retrospective
create + G1 cadence story. **Activator is legacy** — self-directed traders, not
advertised, few signups; keep technical Practice/retro access. Marketed path is
**Observer trial → Navigator**. Free observer with no trial plan: no retro create.

Landed in: Retrospective cadence delta §E.2 (closed); Journal-Retrospective Spec v0.4
entitlement + dual-goal map; Dual-Goal Product Strategy tier note.


## 2026-07-29 — DL-081 RT0-1 Spec fold (Retrospective v0.5 + Journey §4.1a)

**India (p-retrospective RT0-1):** Landed build-authority draft Specs:
- `Specs/FatTail-Labs-Journal-Retrospective-Spec-v0.5.md` (v0.4 + cadence delta fold)
- Journey Experience Spec §4.1a retrospective cadence meter + `retro_horizon_days` on §4.4
Coach structural ack / full GO remains after W0 reviews (RT0-2…G).

## 2026-07-29 — DL-082 RT0-2 Hotel sample gate (`MIN_INFERENCE_N=20`)

**Hotel (p-retrospective RT0-2), India APPROVED:**
- Locked **`MIN_INFERENCE_N = 20`** trades for outcome sample banner, no outcome-trend language, and suppression of outcome-corroborated agent hypotheses. Change only via Spec bump.
- Banner locked: *"This is a small sample. It describes what happened; it does not measure process quality."* (precision fix vs “whether process is working.”)
- Deviations remain legitimate at n=1; P&amp;L stays neutral sample. Domain constant required (no UI-only magic number).
- Tango RT0-3 still owns shame/cadence tone; must not reintroduce resulting.

## 2026-07-29 — DL-083 RT0-3 Tango member-facing copy

**Tango (p-retrospective RT0-3), Hotel APPROVED on sample-banner interaction:**
- Locked carry-forward evidence language; collapsed book chrome; nudge strings N1–N3; meter labels/tooltip; dismiss = **Not now**.
- Accepted Hotel RT0-2 sample banner without diluting process/outcome split.
- Added Retrospective Spec **§19** banned-phrase glossary (resulting, cadence shame, carry-forward moralizing, book bait, person grading).
- Invariant: nudge and meter never cross-link in copy (“start or lose points” banned).

## 2026-07-29 — DL-084 RT0-4 Mike isolation + plan entitlement

**Mike (p-retrospective RT0-4), India APPROVED:**
- Create/gather: **admin OR role activator+ OR active membership plan slug `observer-trial`** (live `memberships`+`plans.slug`). Free no-plan **403**. Not role-only for trial (as-built role gate admits trial only because grants_role=navigator).
- Isolation: `identity_id` only; cross-member GET → **404**; body identity ignored; PD-8 no admin raw Family B.
- Family B forever: pre_market quotes, report/agent JSON, book sample; Option C no coverage indicator.
- Attack notes A1–A8 for RT1-2 characterization. R1b implements plan-aware gate.

## 2026-07-29 — DL-085 RT0-5 Sierra marketing boundary

**Sierra (p-retrospective RT0-5), Tango APPROVED:**
- Retrospective book performance / dual-report P&amp;L is **never** a public acquisition source.
- Spec **§20**: ban public member-results pages, SEO/AEO derived from retros, testimonials/ads quoting retro book, public board leakage, average-P&amp;L marketing stats.
- Explicit non-goal: no SSR/index of member results from `member_retrospectives`; no marketing export pipeline in v0.5.
- Catalog may describe the *feature* (practice loop) without sample numbers. Process-outcomes doctrine unchanged.

## 2026-07-29 — DL-086 RT0-G Spec lock PASS (p-retrospective W0)

**Delta:** Gate **PASS** — all eight checklist items evidenced.
Report: `agents/p-retrospective/gate-reports/RT0-G-spec-lock.md`.
Build authority: Retrospective Spec v0.5 + Journey §4.1a (after **Coach GO**).
Residuals: Coach GO; then Juliet RT0-0 freeze; do not start R1b without GO.

## 2026-07-29 — DL-087 Coach GO + RT0-0 board freeze (p-retrospective)

**Coach GO** on Journal Retrospective Spec v0.5 + Journey Experience §4.1a.
**Juliet RT0-0:** Program status **BUILDING**; seed list frozen (no silent adds); non-goals reaffirmed; parallelism rules active; R5 left open for RT5-0 GO/DEFER.
Freeze note: `agents/p-retrospective/gate-reports/RT0-0-board-freeze.md`.
Next: **RT1-1** (Alpha — schema + plan-aware entitlement).

## 2026-07-29 — DL-088 RT1-1 plan-aware entitlement + R1b schema

**Alpha (p-retrospective RT1-1), Mike · India APPROVED:**
- Migration `047_retrospective_r1b.sql`: `member_habit_plans`; `identities.retrospective_pnl_expanded` default 0.
- Create/gather/preview: `can_create_or_gather` = admin OR role activator+ OR active plan slug `observer-trial` (live memberships). Free no-plan **403**.
- List/get/patch/complete/abandon: session + `identity_id` isolation (downgrade preserves own rows); draft→complete gather still gated.
- Characterization: trial create OK (observer cookie + plan), free 403, activator OK, cross-member 404, concurrent 409.

## 2026-07-29 — DL-089 RT1-2 entitlement/isolation characterization

**Kilo (p-retrospective RT1-2), Alpha · Mike APPROVED:**
- Extended `tests/test_retrospectives.py` — 11 tests, run twice green (flake check).
- Covers seed matrix + A1 body identity spoof ignored, A5 expired trial → 403 (live membership), A6 concurrent 409, unit matrix for `can_create_or_gather`.
- Residual: stale JWT navigator after trial expiry still passes role path until session re-issue (Mike session lifecycle).

## 2026-07-29 — DL-090 RT1-G R1b phase gate PASS

**Delta:** Gate **PASS** — migration 047 live; entitlement matrix + isolation proven (11 pytest); no UI scope this phase.
Report: `agents/p-retrospective/gate-reports/RT1-G-r1b.md`.
Next: RT2-1 process-first gather DTO.

## 2026-07-29 — DL-091 RT2-1 retrospective report DTO contract

**India · Alpha (p-retrospective RT2-1), Charlie APPROVED:**
- Locked workspace/`report_json` contract: `Architecture/12-retrospective-report-dto.md` (version 0.5 target + v0.2 fallback map for Charlie).
- Domain stubs: `MIN_INFERENCE_N`, `SAMPLE_BANNER`, `ReportV05` TypedDict in `retrospective_domain.py`.
- Gather fill remains RT2-2; UI may start RT2-3 on contract + fallbacks.

## 2026-07-29 — DL-092 RT2-2 process-first gather (report v0.5)

**Alpha (p-retrospective RT2-2), India · Hotel APPROVED:**
- `gather_report` emits Spec §6 process rates, integrity_review, deviations (broke + journal gap N=3, max 5), what_worked (process-only), book_performance with sample gate (`MIN_INFERENCE_N=20`, Hotel banner).
- Option C scope boundaries unchanged. `pnl` alias retained for compat. carry_forward / expected_vs_actual null until R4/R6.
- Characterization: 13 tests green including sample-gate assertions.

## 2026-07-29 — DL-093 RT2-3 process-first workspace UI

**Charlie (p-retrospective RT2-3), Echo · Tango APPROVED:**
- `RetrospectiveWorkspace` render order matches Spec §6; book last and **collapsed by default**.
- Expand preference: `identities.retrospective_pnl_expanded` via `GET/PATCH /api/me/profile`.
- Toggle copy: Show/Hide book sample; collapsed summary + sample banner when expanded.

## 2026-07-29 — DL-094 RT2-4 report/UI characterization

**Kilo (p-retrospective RT2-4), Alpha · Charlie APPROVED:**
- Extended `tests/test_retrospectives.py` to 18 cases; run twice green.
- Proved sample_below_min true at n=7 and false at n=22; DTO required keys; profile expand pref; workspace §6 source order.

## 2026-07-29 — DL-095 RT2-G R2b phase gate PASS

**Delta:** Gate **PASS** — process-first UI order; book collapsed + sample gate; deviations bounded; 18 pytest green.
Report: `agents/p-retrospective/gate-reports/RT2-G-r2b.md`.
Next: RT3-1 normalized comparison.

## 2026-07-29 — DL-096 RT3-1 normalized comparison (§7)

**Alpha (p-retrospective RT3-1), India · Hotel APPROVED:**
- Comparison emits `metrics[]` with rates, `window_days`, `n`, `comparable` / `comparable_reason`.
- Floors: activity `window_days < 14`; adherence/book `n < 20`; window length ratio **≥ 3** not comparable (21d vs 63d).
- Heading: “This window (Nw) vs previous (Mw)”. Integrity delta only when comparable.

## 2026-07-29 — DL-097 RT3-2 comparison UI

**Charlie (p-retrospective RT3-2), Tango APPROVED:**
- Workspace renders §7 heading + side-by-side metric values; “Not comparable” when `comparable=false` (no arrows/delta pts).
- Maiden: baseline copy only. Integrity grades as labels, not trend theater.

## 2026-07-29 — DL-098 RT3-3 comparison characterization

**Kilo (p-retrospective RT3-3), Alpha APPROVED:**
- 30 tests (×2 green): 21d vs 63d all metrics not comparable; book per-trade math; adherence n-floor; UI Not comparable markers.

## 2026-07-29 — DL-099 RT3-G R3b phase gate PASS

**Delta:** Gate **PASS** — normalized comparison payload; UI suppresses non-comparable deltas; 21d vs 63d tests green (30 pytest).
Report: `agents/p-retrospective/gate-reports/RT3-G-r3b.md`.
Next: RT4-1 habit plans.

## 2026-07-29 — DL-100 RT4-1 habit plans API + cap

**Alpha (p-retrospective RT4-1), Mike · India APPROVED:**
- CRUD `/api/me/habit-plans`; `observable_signal` required enum; states proposed→active→kept|partial|lapsed|retired.
- Max **2** active per identity → **409** (row lock + count). Isolation by `identity_id`.
- Gather `carry_forward` populated for non-maiden when plans exist.

## 2026-07-29 — DL-101 RT4-2 carry-forward UI

**Charlie (p-retrospective RT4-2), Tango · Echo APPROVED:**
- Workspace opens with carry-forward first (maiden: absent); empty Tango copy when no plans.
- Member sets Kept / Partial / Lapsed via habit-plans PATCH; no success/fail moralizing.

## 2026-07-29 — DL-102 RT4-3 habit plan characterization

**Kilo (p-retrospective RT4-3), Alpha APPROVED:**
- 12 tests ×2 green: third active 409, maiden carry_forward null, empty non-maiden message, isolation 404, invalid transition 409, UI maiden gate.

## 2026-07-29 — DL-103 RT4-G R4 phase gate PASS

**Delta:** Gate **PASS** — max 2 active 409; carry-forward first in UI; isolation OK; 42 pytest (habit + retro).
Report: `agents/p-retrospective/gate-reports/RT4-G-r4.md`.
Next: **RT5-0** Coach GO/DEFER agent analyze.

## 2026-07-29 — DL-104 RT5-0 Coach GO agent analyze

**Coach:** **GO** on retrospective agent path (p-retrospective R5).
- Ship `POST …/analyze` with Spec §8 constraints (anchoring, sample gate, symmetry).
- Observer trial: agent **off by default** (config to open later).
- Missing agent config → fail loud (no silent empty analysis).
- Local deterministic analyzer allowed when `LABS_RETRO_AGENT_MODE=local`.
Report: `agents/p-retrospective/gate-reports/RT5-0-agent-go.md`.
Next: RT5-1.

## 2026-07-29 — DL-105 RT5-1 agent analyze endpoint

**Alpha · Mike (p-retrospective RT5-1), India · Hotel · Tango APPROVED:**
- `POST /api/me/retrospectives/{id}/analyze`; `LABS_RETRO_AGENT_MODE=local` or **503**.
- Validation: anchors required; no P&amp;L-origin hypotheses; symmetry what_worked; sample gate.
- Trial agent off unless `LABS_RETRO_AGENT_TRIAL=1`. Local analyzer from staged report.

## 2026-07-29 — DL-106 RT5-2 agent panel UI

**Charlie (p-retrospective RT5-2), Tango APPROVED:**
- Workspace agent panel: Run analysis; show what_worked / concerns / hypotheses / proposed plans.
- Human gate: edit title → Accept (creates proposed habit plan) or Reject. No profit copy.

## 2026-07-29 — DL-107 RT5-3 agent validation characterization

**Kilo (p-retrospective RT5-3), Alpha · Mike APPROVED:**
- 14 tests ×2 green: empty anchors rejected; symmetry what_worked; isolation 404; sample-gate drops P&L-supported hyps; 503 unconfigured; trial 403.

## 2026-07-29 — DL-108 RT5-G R5 phase gate PASS

**Delta:** Gate **PASS** (Coach GO path) — analyze endpoint; fail-loud config; validation; trial off; UI accept/reject; 56 pytest.
Report: `agents/p-retrospective/gate-reports/RT5-G-r5.md`.
Next: RT6-1 (what worked / expected vs actual).

## 2026-07-29 — DL-109 RT6-1 what worked + expected vs actual gather

**Alpha (p-retrospective RT6-1), Hotel · Tango APPROVED:**
- `what_worked`: adherence runs, journal stretch, adverse “followed on negative book day” without printing P&amp;L figures.
- `expected_vs_actual`: from `pre_market` notes (surface or journal markers); **null** if none; intent verbatim after marker strip.

## 2026-07-29 — DL-110 RT6-2 what worked + expected vs actual UI

**Charlie (p-retrospective RT6-2), Tango APPROVED:**
- Workspace §6.4–6.5 polish: process-only framing; stated intent / what executed grid; honest empty; gap optional.

## 2026-07-29 — DL-111 RT6-G R6 phase gate PASS

**Delta:** Gate **PASS** — what_worked / expected_vs_actual present or honestly absent; no P&amp;L figures in adverse what-worked; 33 pytest.
Report: `agents/p-retrospective/gate-reports/RT6-G-r6.md`.
Next: RT7-1 cadence meter.

## 2026-07-29 — DL-112 RT7-1 retrospective cadence meter

**Alpha (p-retrospective RT7-1), India · Tango APPROVED:**
- Meter profiles carry `retro_horizon_days` (trial 42 / monthly 30 / annual 90 / free n/a).
- `retrospective` meter uses §4.1a formula; not `soon`; E1–E3 empty; only `completed_at` moves clock; `nudge` when d>H.

## 2026-07-29 — DL-113 RT7-2 cadence UI + nudge

**Charlie (p-retrospective RT7-2), Tango · Echo APPROVED:**
- ProcessMeter shows Retrospective cadence with grade chip (not soon; empty = "—").
- `RetroCadenceNudge`: Tango N1 + **Not now** (session dismiss); home, journey, retro library.
- No grade↔late cross-link in copy.

## 2026-07-29 — DL-114 RT7-3 cadence verification (§D.2 10–17)

**Kilo (p-retrospective RT7-3), Alpha APPROVED:**
- Characterization in `test_journey_scores.py`: formula boundaries, open/abandoned clock, E2 grace excluded from average, free observer empty, maiden live 100, nudge↔horizon same field, UI copy sweep + N1 dismiss.
- Suite: 23 passed ×2. Comment-only fix on `RetroCadenceNudge.tsx` so whole-file sweep does not match banned tokens in docs.
- Next: RT7-G phase gate.

## 2026-07-29 — DL-115 RT7-G R7 phase gate PASS

**Delta (p-retrospective RT7-G):** R7 cadence meter + nudge **PASS**.
- Meter un-soon; formula + E1–E3 + completed_at-only clock proven; nudge/horizon single field; copy sweep clean.
- Gate re-run: `test_journey_scores.py` 23 passed; adjacent retro/habit/agent 59 passed.
- Report: `agents/p-retrospective/gate-reports/RT7-G-r7.md`.
- Next: RT8-1 as-built + program close.

## 2026-07-29 — DL-116 RT8-1 Journal Retrospective as-built (program close docs)

**Lima · India (p-retrospective RT8-1), India APPROVED; Coach pending RT8-G:**

**Decision:** Land **Spec v0.6** as as-built product truth for Journal Retrospectives. v0.5 remains historical build authority (Coach GO). Locked product decisions (Option C, MIN_INFERENCE_N=20, §10.1 entitlement, cadence formula, copy/marketing locks) are unchanged. Honesty and residuals live in v0.6.

**As-built shipped (R1b–R7, gates RT0-G…RT7-G PASS):** plan-aware create; process-first gather/UI; normalized comparison; habit plans (max 2); local agent analyze; what worked / expected vs actual; cadence meter + N1 nudge.

**Docs updated:** Spec v0.6; v0.51 marked non-binding (H=7 draft ≠ shipped trial H=42); Journey §4.1a R7 shipped; Architecture 02/03/04/12 + README; CHARTER DoD.

**Residuals (not shipped — do not claim):** cost-of-deviation counterfactual; external agent LLM; trial agent default-on; N2/N3 nudge rotation; Journey milestone feed from complete; alumni create TBD.

**Suite snapshot:** 82 passed (`test_retrospectives` + habit + agent + journey_scores).

**Next:** Delta **RT8-G** program gate.

## 2026-07-29 — DL-117 RT8-G p-retrospective program COMPLETE

**Delta (p-retrospective RT8-G): PASS — program closed.**

- CHARTER Definition of Done satisfied; phase gates RT0-G…RT7-G + RT8-G all **PASS** on file.
- Live suite: retro + habit + agent + journey_scores **82 passed**.
- As-built truth: Spec **v0.6**; decisions from v0.5 locks unchanged.
- Residuals (cost-of-deviation, external agent LLM, trial agent default-on, N2/N3 rotation, Journey milestone feed, alumni create) remain explicit non-ship — not blocking.
- Report: `agents/p-retrospective/gate-reports/RT8-G-program-close.md`.
- Board: **COMPLETE**. Future residual work requires a new Spec / new board.

## 2026-07-29 — DL-118 Spec v0.51 cadence teaching horizons (Coach amendment)

**Coach decision (landed after RT8-G close as post-close amendment):**

1. Retrospectives are immutable process, not gated features — Observer trial full create path remains.
2. **Cadence horizons are teaching rhythms:** Observer trial **weekly** (`retro_horizon_days = 7`). Navigators own rhythm after convert (monthly 30 / annual 90). Alumni **90**.
3. **Meter is signal, not enforcement** — one of six process meters; integrity is contextual.

**Code:** `journey_scores.py` — trial H **7** (was 42); alumni H **90** (was 60). `grade_ramp_days` trial still **42** (tenure ≠ cadence).

**Docs:** Spec v0.51 restored as COACH AMENDMENT; Journey §4.4; Spec v0.6 honesty; `Specs/Advisor-Gates-Retrospective-v0.51.md` filed; CHARTER G1 H=7.

**Tests:** profile assertions updated in `test_journey_scores.py`.

## 2026-07-30 — DL-160 Journal Session Spec v0.5 BUILD AUTHORITY (Coach GO)

**Coach (p-journal-session-v05 J0-0):**

- Spec: `Specs/FatTail-Labs-Journal-Session-Spec-v0.5.md` → **BUILD AUTHORITY**
- Product: chatbot = journal; interview on request → bar; no second write path
- **Tags:** Tag Manager v0.3 only; admin vocabulary; members assign via **compact control +
  list window** (not chip wall); never gate/script/instruct agent
- **Retro nav:** Session action, not a system tag
- **Seal:** retrospective complete only, scope-true
- Prerequisite Tag Manager shipped (DL-159)
- Board: `agents/p-journal-session-v05/` · plan
  `docs/Journal-Session-v0.5-Implementation-Plan.md`
- §17 open items residual unless they block critical path (voice optional; principals interim)

## 2026-07-30 — DL-159 Tag Manager v1 land (admin lexicon)

**Coach locks + Alpha/Charlie (p-tag-manager):**

- **Admin-only** tag definition CRUD; members **assign/unassign** existing tags only
- No `/me` tag manager; no free-text auto-create; no personal tag ownership table
- Schema mig **053**: `tag_categories`, `tags`, `tag_assignments` + seed vocabulary
- APIs: `GET /api/tags`, assign PUT/POST/DELETE, admin `/api/admin/tags` (+ merge, retire)
- UI: `/admin/tags` Tag Manager; Resources hub **Library | Lexicon** browse
- `TagPicker` component for Practice consumers (Journal next)
- Export journal sessions include assigned tags; purge removes assignments
- Tests: `tests/test_tags.py` (7 passed)
- Spec v0.2 personal-tier text superseded by product locks; amend to v0.3 residual
- **Journal Session v0.5 J1 unblocked** after this program (TM ready)

## 2026-07-30 — DL-158 Journal Session v0.4a program land (J1–J9)

**Alpha · Charlie · Kilo (p-journal-session-v04 autonext after JS0-0 GO):**

- Migration **052**: tags join, absence keys, closed denorm, market_calendar_config,
  status map partial→open, sealed→closed iff closure exists
- Domain: optional tags; create without tag; seal deprecated no-op (stays open);
  dual-read includes open pre_market + pre_open turns; retro complete closes sessions
- Agent: `llm|local|off`; once-only keys; no depth refusal; RTH quiet/silent; LLM path
  via `ai.client.complete`; plain-text degrade
- UI: **Start conversation** primary; closed status labels
- Tests: journal 52 + retro suite green (85 combined)
- Gates: JS0-G…JS9-G PASS · board COMPLETE

## 2026-07-30 — DL-157 Journal Session Spec v0.4a BUILD AUTHORITY (Coach GO)

**Coach (p-journal-session-v04 JS0-0) · India:**

- Spec: `Specs/FatTail-Labs-Journal-Session-Spec-v0.4a.md` → **BUILD AUTHORITY**
- Board: `agents/p-journal-session-v04/` (v0.2 board complete and **not reopened**)
- **Locks:**
  - **§20.9 scope-true closure** — close NY dates from `scope_start` through gather−1
  - **§20.11 agent mode** — product `llm` when configured; `local` test/offline only;
    `off` fail-loud; member plain-text always available
  - **§20.10** — no Journal create without Practice membership (planless/lapsed)
  - **§20.6 interim** — `agent_service` + member session Family B ACL until P2 principals
  - **Migration** — `partial`→`open`; `sealed`→`closed` only if a closure covers the date,
    else `open`; never reopen grandfathered closed dates
- Product frame: chat primary · optional structured · phase gate · one seal on retro complete
- Program executes J1–J9 autonomously under this GO

## 2026-07-30 — DL-156 Journal agent chat default ON (product flip)

**Coach product lock (post JS3-G):**
- **Agent interview chat is the default primary path.** Structured form is the
  **alternative**, not the default UI surface.
- `LABS_JOURNAL_AGENT_MODE`: unset → **`local`** (was default `off` per DL-148).
  Explicit `off` still fails loud on agent routes (503). Form always available.
- Code: `journal_session_agent.agent_mode()` default local; day view form collapsed
  behind “Structured form · alternative”; chat remains above.
- Spec board line updated. Dev `.env`: `LABS_JOURNAL_AGENT_MODE=local`.
- Tests: `test_agent_off_fail_loud` uses explicit off; `test_agent_default_mode_is_local`.

## 2026-07-30 — DL-155 p-journal-session program complete (J5–J9)

**Juliet autonext (Coach: seeds to gates without pause):**
- **J5** media: mig 050 · `journal_session_media` · attach API · isolation 404 · private Cache-Control
- **J6** export `fattail.labs.journal_session` dual-read in pack/zip; purge sessions+media
- **J7** retrospective tag navigate-only (422 create)
- **J8** mig 051 `identities.is_demo`
- **J9** as-built + **JS9-G PASS** program close
- Residuals: full session import rehydrate, LLM agent path, media paste UI polish, Journey wording

## 2026-07-30 — DL-154 JS4 date closure + JS4-G PASS

**Alpha · Charlie · Kilo · Delta (p-journal-session J4):**
- On retro complete: write `member_journal_date_closures` for NY days strictly before
  gather date; gather stays open. Preview + list APIs; 409 with retro link.
- UI: complete confirm names dates; journal day closed banner.
- JS4-G **PASS**. Suite 51+. Next: **JS5** private media.

## 2026-07-30 — DL-153 JS3-G Delta phase PASS

**Delta (p-journal-session JS3-G):**
- Verdict **PASS** — `gate-reports/JS3-G-phase.md`. Agent path: mode off-by-default,
  Appendix A, D7/D8, validator + form fallback, chat UI, **49 tests**.
- Next: **JS4-1** date closure (autonext per Coach).

## 2026-07-30 — DL-152 JS3-4 journal agent characterization (Kilo)

**Kilo (p-journal-session JS3-4) · Alpha · Mike:**
- Expanded agent tests: validator corpus, intraday silent, isolation on agent
  routes, observer-trial agent, depth status, no author escalation.
- Flake check: **49 passed** ×2. Next: **JS3-G** Delta phase gate.

## 2026-07-30 — DL-151 JS3-3 journal interview chat UI

**Charlie (p-journal-session JS3-3) · Tango:**
- `SessionInterviewChat` on day view: agent transcript, depth budget, auto first
  probe, member reply via `…/agent/turn`; intraday quiet hint; clean_day max-1 copy;
  form fallback uses Appendix B tone (no “AI failed”).
- Structured form remains always below. `tsc --noEmit` clean.
- Next: **JS3-4** Kilo agent tests · JS3-G.

## 2026-07-30 — DL-150 JS3-2 agent turn validator + form fallback

**Alpha (p-journal-session JS3-2) · Mike:**
- `journal_session_validator.py` — Spec §8.2 block rules before render.
- One retry with safe fallback; double-fail → form_fallback, **no** agent row inserted.
- Wired in `run_agent_turn`. Tests: **42 passed**. Next: **JS3-3** chat UI.

## 2026-07-30 — DL-149 JS3-1 journal session agent interview API

**Alpha · Mike (p-journal-session JS3-1) · India · Tango · Hotel:**
- `journal_session_agent.py`: `LABS_JOURNAL_AGENT_MODE=local|off`; Appendix A as
  `JOURNAL_SESSION_SYSTEM_PROMPT_V1`; local checklist-driven probes; D8 depth caps;
  intraday silent; D7 via `append_agent_message`.
- Routes: `GET/POST …/agent` + `…/agent/turn`. Depth exhausted → 409 form_fallback.
- Tests: **38 passed**. Next: **JS3-2** turn validator + double-fail → form.

## 2026-07-30 — DL-148 JS3-0 Coach GO journal session agent path

**Coach (p-journal-session JS3-0):**
- **GO** on J3 agent interview track (not DEFER).
- Product-wide mode: `LABS_JOURNAL_AGENT_MODE=local|off` (default **off**; fail loud when
  off). When on: Observer trial = Navigator for agent (D6). Free no-plan still no create.
- Form path remains DoD and always available; validator double-fail → J2 form (§8.2).
- D7 attribution + D8 depth + Appendix A apply. J3 still requires JS3-G evidence.
- Next: **JS3-1** interview endpoint + system prompt constant.

## 2026-07-30 — DL-147 JS2-G Delta phase PASS

**Delta (p-journal-session JS2-G):**
- Verdict **PASS** — report `agents/p-journal-session/gate-reports/JS2-G-phase.md`.
- Falsifiable pre_market **without LLM** proven: schemas/checklist, form UI + seal
  confirm, tests (33 passed). Seeds JS2-1…JS2-3 APPROVED.
- Next: **JS3-0** Coach agent GO/DEFER, or **JS4-1** date closure (form path shippable).

## 2026-07-30 — DL-146 JS2-3 form characterization (Kilo)

**Kilo (p-journal-session JS2-3) · Alpha:**
- Expanded form tests: absent fields not invented on seal; PATCH structured-only;
  complete seal path; empty→absent; require_complete gate; multi-tag schemas.
- Flake check: **33 passed** ×2. Next: **JS2-G** Delta phase gate.

## 2026-07-30 — DL-145 JS2-2 structured form UI + seal confirm

**Charlie (p-journal-session JS2-2) · Tango · Echo:**
- `StructuredSessionForm` on journal day view: schema fields, save, checklist,
  seal confirmation (complete vs absences), partial path; create uses `prefill: true`.
- Free-text notes remain optional under the form. No agent required.
- Tango: no shame/grade; Echo: tokens consistent. `tsc --noEmit` clean.
- Next: **JS2-3** Kilo form tests · JS2-G.

## 2026-07-30 — DL-144 JS2-1 structured_json schemas + checklist

**Alpha · India (p-journal-session JS2-1) · Hotel:**
- `journal_session_structured.py` — per-tag field specs; code checklist;
  `invalidation` required_for_complete; uncertainty phrases allowed; normalize drops
  unknown keys; prefill instrument/size from prior plan + day trades — **never**
  invent invalidation.
- API: GET schemas/schema/prefill; create `prefill`; seal `require_complete`;
  session payload includes `checklist`.
- Tests: **26 passed** in `test_journal_sessions.py`.
- Next: **JS2-2** confirmation UI.

## 2026-07-30 — DL-143 JS1-G Delta phase PASS

**Delta (p-journal-session JS1-G):**
- Verdict **PASS** — report `agents/p-journal-session/gate-reports/JS1-G-phase.md`.
- J1 complete: schema 049 · domain/API · dual-read · calendar attach · Kilo suite.
- Live evidence: `pytest tests/test_journal_sessions.py tests/test_retrospectives.py`
  → **54 passed**. Seeds JS1-1…JS1-5 all APPROVED; no waived reviews.
- Residuals named (J2 form, J3 agent, J4 closure, J5 media, J6 export).
- Next: **JS2-1** structured form (no LLM).

## 2026-07-30 — DL-142 JS1-5 Journal session characterization (Kilo)

**Kilo (p-journal-session JS1-5) · Alpha · Mike:**
- Expanded `tests/test_journal_sessions.py` — isolation, multi-entry, seal locks,
  free 403, trial/navigator create, dual-read, open excluded from §6.5, list filters,
  unauth deny, entitlement unit matrix.
- Flake check: **21 passed** ×2 identical; retro regression **33 passed**.
- Next: **JS1-G** Delta phase gate.

## 2026-07-30 — DL-141 JS1-4 Journal calendar session attach

**Charlie (p-journal-session JS1-4) · Echo:**
- Day view starts sessions by tag via `/api/me/journal-sessions`; lists entries for
  `journal_date`; member notes + partial/seal; retrospective chip still navigates.
- `web/lib/journalSessionApi.ts`; `JournalCalendar` day shell; day-book trades panel
  unchanged; multi-year trade interest dots untouched.
- `tsc --noEmit` clean. Next: **JS1-5** Kilo tests · JS1-G.

## 2026-07-30 — DL-140 JS1-3 dual-read notes + sessions

**Alpha (p-journal-session JS1-3) · India:**
- Spec §2.1 dual-read: gather §6.5, process journal days, activity gaps, what-worked
  stretch, Journey routine (D2) union legacy `member_tool_notes` with
  `member_journal_sessions` (`session_started_at` NY day; pre_market sessions by
  `journal_date` for expected-vs-actual).
- Helpers on `journal_session_domain`; wired in `retrospective_domain` + `journey_scores`.
- Never invent structured fields. Tests: journal + retro suites **46 passed**.
- Next: **JS1-4** calendar UI · **JS1-5** more isolation tests · JS1-G.

## 2026-07-30 — DL-139 JS1-2 Journal session domain + API

**Alpha (p-journal-session JS1-2) · India:**
- `server/journal_session_domain.py` + `routes/journal_sessions.py` wired in `main.py`.
- Endpoints: list/create/get/patch/messages/seal/partial under `/api/me/journal-sessions`.
- Entitlement D6 via `can_create_or_gather`; free 403; sealed/closed 409; isolation 404;
  multi entry/date; member messages only (agent J3); phase interim US RTH NY.
- Tests: `tests/test_journal_sessions.py` — **10 passed**.
- Next: **JS1-3** dual-read notes → sessions for gather/routine.

## 2026-07-30 — DL-138 JS1-1 Journal session schema migration

**Alpha (p-journal-session JS1-1) · Mike · India:**
- Migration `migrations/049_journal_sessions.sql` applied on dev (`migrate.py`).
- Tables: `member_journal_sessions`, `member_journal_messages`,
  `member_journal_date_closures` — Spec v0.2 §14 SoR.
- Attachments deferred to J5. Closures: `closed_by_retrospective_id` ON DELETE SET NULL
  (date stays closed). Messages append-only (no updated_at). export_key unique per owner.
- Next: **JS1-2** domain + API.

## 2026-07-30 — DL-137 Journal Session Spec v0.2 Coach GO (BUILD AUTHORITY)

**Coach (p-journal-session JS0-0):**
- **GO** — Spec `FatTail-Labs-Journal-Session-Spec-v0.2.md` is **BUILD AUTHORITY**.
- Prerequisite: Delta JS0-G **PASS** (`gate-reports/JS0-G-spec-lock.md`).
- **D1–D9 locked** (D9 promoted LOCKED at GO: additive import; never overwrite sealed
  transcript). D6 Observer = Navigator features; sole difference = 6-week term.
- Ship order: **J1–J2 before LLM**; J3 agent needs separate product enablement / JS3-0.
- Carry residuals: Journey routine wording (JS1/J9); Export Spec `journal_session` (JS6-1).
- Board: J0 frozen · **next JS1-1** (Alpha schema). Program board
  `agents/p-journal-session/`.

## 2026-07-30 — DL-136 JS0-G Delta Spec lock PASS

**Delta (p-journal-session JS0-G):**
- Verdict **PASS** — report `agents/p-journal-session/gate-reports/JS0-G-spec-lock.md`.
- Parent citations real (Retro v0.6, Journey §4.1a, Export v1.1); D3–D5 APPROVED (no
  silent waive); D1–D2·D4·D7·D8·§20 also locked with seed+DL evidence; D6/DL-128
  Observer 6-week term + parity stated; J1–J2 before LLM + §8.2 form fallback present.
- Named residuals (non-blocking): D9 formal LOCK row; Journey routine wording patch;
  Export Spec `journal_session` section; Spec Status remains DRAFT until Coach GO.
- **Do not start J1** until **JS0-0 Coach GO**.

## 2026-07-30 — DL-135 JS0-6 Sierra marketing / public boundary APPROVED

**Sierra (p-journal-session JS0-6) · Tango co-sign:**
- **§20 LOCKED** — Journal sessions are Family B only; **no** SEO/AEO/public marketing
  pipeline from transcripts, structured fields, media, or session aggregates.
- **Demo ban** — `is_demo` content never used as real member proof/testimonials (D5).
- Aligns Retrospective Spec v0.5 §20 (RT0-5). Process-outcome catalog copy OK; no
  production quotes; no JSON-LD from practice data; no marketing CMS export.
- Tango: trust > acquisition; member not turned into content.
- Owner seeds JS0-1…JS0-6 complete. Next: **JS0-G** Delta → **JS0-0** Coach GO.

## 2026-07-30 — DL-134 JS0-5 Hotel tag scripts + D8 APPROVED

**Hotel (p-journal-session JS0-5) · Tango co-sign:**
- **D8 LOCKED** — ≤8 agent **absence** questions per interview phase (ceiling not quota);
  trade-log/prior-plan prefill; ≥2 slots reserved for **invalidation** if missing;
  confirmation restatement is one code-owned turn outside the 8 absence budget.
- **pre_market §5.1** — field meanings; invalidation load-bearing; never invent levels;
  “I don’t know” > false precision; same checklist for agent and J2 form.
- **Scripts §8.4** — clean_day = one process question (not a day grade); post_session
  member-named deviations; reflection does not feed §6.5 as plan.
- Appendix A soft-review PASS (no text change). Feeds JS2-1 / JS3-1.
- Next: JS0-6 Sierra → JS0-G → Coach GO.

## 2026-07-29 — DL-133 JS0-4 India·Mike D5 is_demo APPROVED

**India · Mike (p-journal-session JS0-4):**
- **D5 LOCKED** — `identities.is_demo TINYINT(1) NOT NULL DEFAULT 0`; set only at identity
  create (ops/CLI); **immutable** (no flip via API/webhook/admin); never convert flag off.
- Identity-level only (no per-session demo column). Migration named for **JS8-1**
  (`0NN_identities_is_demo.sql`). Wholesale purge+reseed; admin date reopen demo-only.
- Hard exclude: leaderboard, journey peer visibility, live aggregates, marketing proof.
- Audit still fires with demo label. `is_demo` is not an auth bypass.
- Spec §13 full. D1–D7 now locked at owner level; build still needs JS0-G + Coach GO.
- Next: JS0-5 · JS0-6 → JS0-G → Coach GO.

## 2026-07-29 — DL-132 JS0-3 Mike D4 media + D7 attribution APPROVED

**Mike (p-journal-session JS0-3) · India co-sign:**
- **D4 LOCKED** — separate Family B journal media store (not course `uploads/private` /
  `private:` / `/api/media/`). Config root fail-loud; owner via `ft_session` only;
  **no public URL**; cookie-authenticated stream; export_ref + purge binaries; PD-8 no
  admin back door; never journey-public. Spec §11.2 · §14 attachments SoR for J5.
- **D7 LOCKED** — `author=agent` ⇒ `agent_service=labs-journal-session`; member owns ACL;
  server sets attribution; audit every turn; P2 principals later without re-key. Spec §11.3.
- Isolation: identity from cookie only; cross-member → 404. Attack notes listed for J1/J3/J5.
- Next: JS0-4 (D5) … JS0-6 → JS0-G → Coach GO.

## 2026-07-29 — DL-131 JS0-2 Tango D3 + Appendix B APPROVED

**Tango (p-journal-session JS0-2) · Hotel co-sign:**
- **D3 LOCKED** — journal session image/book P&L chrome inherits Retrospective process-first
  section collapse (default collapsed; member expands). Spec §11.1 SoR for JS5-3.
- **Appendix B APPROVED** — leave/gather/complete copy; banned late/grade/meter/P&L-hero phrases;
  agent→form capacity path added.
- **Capacity §16 APPROVED** — form always a path; validator withdraws to form; no member-facing ratio.
- **D2 soft-review PASS** — routine copy = days started a sitting; no backdate shame.
- Hotel: D3 prevents resulting; Appendix B no trading falsehoods; clean_day/invalidation → JS0-5.
- Next: JS0-3…JS0-6 → JS0-G → Coach GO. D4–D5 still open.

## 2026-07-29 — DL-130 JS0-1 India Spec integrity APPROVED

**India (p-journal-session JS0-1):**
- Session Spec v0.2 consistent with Retrospective v0.6, Journey §4.1a, Practice Export v1.1.
- **D1 LOCKED** — tags replace dual surface/type taxonomy.
- **D2 LOCKED** — Journey routine keys `session_started_at` NY day; `journal_date` scopes retros only.
- Schema §14 approved as JS1-1 migration SoR (expanded indexes/FKs/phase enum).
- Dual-read plan §2.1 mandatory until cutover (gather, routine, export union notes + sessions).
- Next: JS0-2…JS0-6 owner gates → JS0-G → Coach GO.

## 2026-07-29 — DL-129 p-journal-session Agent Bench board

**Juliet:** Full multi-agent implementation board for Journal Session Spec v0.2:
- `agents/p-journal-session/` — CHARTER, ORCHESTRATOR, IMPLEMENTATION-PLAN, seeds JS0–JS9,
  gate-reports.
- Phases: J0 Spec GO → J1 schema → J2 form (no LLM) → J3 agent (optional) → J4 closure →
  J5 media → J6 portability → J7 retro routing → J8 demo → J9 close.
- Program status **READY**; **do not code J1** until JS0-G PASS + Coach GO.
- Coach locks already in force: D6/DL-128 (Observer 6-week term, full Navigator access);
  D3–D5 still owner gates.

## 2026-07-29 — DL-128 Observer vs Navigator: only difference is 6-week term

**Coach:** The **only** product difference between **Observer** membership and **Navigator** is that
Observer’s membership **term is limited to 6 weeks**. Feature access is identical for that term
(Trade Log, Journal, Retrospective, habits, agent when product-enabled). Observer is **not free**.
Free no-plan remains a separate, non-Practice-create population.

Docs updated: Journal Session D6, Retrospective v0.5/v0.6 entitlement matrix, CHARTER G1,
Dual-Goal strategy. Agent parity remains DL-127.

## 2026-07-29 — DL-127 Retrospective agent: Observer parity (fix RT5-0 trial lockout)

**Coach correction:** Retrospective Spec/code wrongly treated Observer trial agent as optional
(403 unless `LABS_RETRO_AGENT_TRIAL`). **Observer = Navigator** for Practice including analyze.

**Code:** `can_run_agent_for_role` allows active `observer-trial` whenever agent mode is on
(no trial env flag). Tests: `test_analyze_observer_trial_parity_with_navigator`.  
**Docs:** Spec v0.5/v0.6 agent tables + Architecture 02 updated. Free no-plan still no create.

## 2026-07-29 — DL-126 Observer = Navigator Practice access (not free)

**Coach:** Observers are **not** free accounts. **Observer has the same Practice access as Navigator**
for the membership term. **Refined in DL-128:** sole difference is **6-week term**.  
Free no-plan remains outside Practice create. Agent lockout fixed in **DL-127**.

## 2026-07-29 — DL-125 Journal Session Spec v0.2 (then critique fix)

**v0.2** supersedes v0.1 (as-built honesty, phasing, portability, citations to Retrospective **v0.6**).

**Post-critique amendment (same day):** Status = **DRAFT** only (not dual “build authority + draft”).
D3/D4/D5 proposed-pending Tango / Mike·Alpha·India / India·Mike — not waived gates.
D6 free-observer create **OPEN for Coach**. Validator double-fail → J2 form (not dead partial).
Interview depth **≤8** with trade-log prefill. Schema: `status` only (no redundant incomplete).
Format id **`fattail.labs.journal_session`**. Warning copy + system prompt inlined (App A/B).
Script telemetry + backdate-into-closure restored.

## 2026-07-29 — DL-124 Demo Practice pack generator

**Ops/demo:** `server/seed_practice_demo_pack.py` builds a canonical member export
(ZIP/JSON) with trades, journal, retrospective, habit, check-ins; optional
`--import-email` / `--purge-first`. Walkthrough: `agents/p-member-export/DEMO.md`.

## 2026-07-29 — DL-123 Purge Practice data (keep membership)

**Coach:** Member may delete all Practice data while keeping membership, then load from export.
- `POST /api/me/practice-data/purge` with confirm `DELETE_PRACTICE_DATA`.
- Deletes: trade log, journal notes, retros, habits, live check-ins.
- Keeps: identity, memberships, enrollments, lesson progress, privacy prefs.
- Full replace = download → purge → additive load.
- Profile UI: **Delete Practice data…** warns; **Download backup first** offered; delete requires acknowledge checkbox; audit `purge_practice`.

## 2026-07-29 — DL-122 Import is additive only (non-destructive)

**Coach:** Load must not be destructive — **insert only**, never overwrite or delete.
- Import policy fixed to **`additive`**: matching `export_key` / external id / session_key → **skip**.
- No UPDATE of notes, retros, habits, check-ins, or privacy prefs on load.
- Journey: new check-ins only; meters never written.
- Spec v1.1 amended; UI copy states additive; tests include no-overwrite case.

## 2026-07-29 — DL-121 Member Practice portability two-way (import)

**Coach GO (plan defaults I1–I6 + Profile load UI):**
- Spec **v1.1**: `Specs/FatTail-Labs-Member-Practice-Export-Spec-v1.1.md` — reverse export-only D6.
- Migration `048_practice_export_keys.sql` — `export_key` on notes / retros / habit plans.
- API: `POST /api/me/import/detect|preview|commit`; pack ZIP or JSON.
- **Superseded on merge:** see DL-122 additive-only.
- UI: Profile **Load Practice data** (preview → confirm).
- Tests: round-trip + isolation in `test_member_export.py`.

## 2026-07-29 — DL-120 Member Practice Canonical Export v1.0

**Coach plan GO (recommended D1–D7) + Alpha/Lima implement:**

- Spec: `Specs/FatTail-Labs-Member-Practice-Export-Spec-v1.0.md`
- Formats: `fattail.labs.journal` · `fattail.labs.retrospective` · `fattail.labs.journey` · `fattail.labs.member_export` (embeds existing `fattail.labs.trade_log`)
- API: `GET /api/me/export` (zip default / json), per-surface export routes; audit action=`export`
- UI: Profile **Download my data** (ZIP)
- Export-only v1; omit raw identity_id; include email; Journey is derived snapshot
- Tests: `server/tests/test_member_export.py` (isolation, pack, zip, audit)
- Board: `agents/p-member-export/`

## 2026-07-29 — DL-119 Advisor Gates v0.51 packet filed + clearance

**Lima (post-close docs):** Canonical advisor packet landed at
`Specs/Advisor-Gates-Retrospective-v0.51.md` (Coach text + clearance matrix).

| Gate | Clearance |
|------|-----------|
| Hotel MIN_INFERENCE_N=20 | RT0-2 · DL-082 |
| Tango sample banner / collapsed book | RT0-3 · DL-083 |
| Mike Family B / pre_market isolation | RT0-4 · DL-084 |
| India habit_plans + pnl_expanded on identities | RT1-1 · DL-088 (schema) · RT0-1 fold |
| Sierra no marketing reuse of book P&L | RT0-5 · DL-085 · Spec §20 |
| Delta evidence plan R2b–R7 | RT0-G…RT8-G PASS · characterization suites |

**Deferred (unchanged):** cost-of-deviation; external agent provider; anti-gaming empty-retro clock.
Cross-ref Spec v0.51, v0.6 residuals, DL-118.

