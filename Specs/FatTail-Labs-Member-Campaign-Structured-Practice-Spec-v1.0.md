# FatTail Labs — Member Campaign Structured Practice Spec v1.0

**Status:** **Product / architecture authority (model inversion)** — formalizes Coach-ratified direction from  
[`docs/Campaign-Model-Change-Structured-Practice-Instances-Bounds.md`](../docs/Campaign-Model-Change-Structured-Practice-Instances-Bounds.md)  
**Date:** 2026-08-08  
**Type:** Practice Campaign model (structured practice · instances · charter bounds)  
**Relationship to Concept Spec v1.0:** This document **supersedes** the optional/unstamped/unbound campaign model and the interim §4.7a “continuous Default Campaign as signed charter” framing where they conflict. Concept Spec v1.0 remains authority for charter architecture language, dual Practice/Lab modes, signature/amendments/renewal **mechanics** (reaffirmed), Open/Archive pattern, pack discipline, and umpire spirit — **as amended by this Spec**. A future Concept Spec **v2.0** should fold this body in place of the superseded sections (surgery map §12).  
**Not this document:** Marketing campaigns ([Campaign Workflow Spec](./FatTail-Labs-Campaign-Workflow-Spec-v1.0.md)). Strategy Lab Deploy mode. Journey meters (Goodhart wall).  
**Build status:** Spec authority (stamp-ready). Not fully as-built.  
**Execution law:** [`docs/Campaign-Structured-Practice-Full-Agent-Bench-Plan-v1.0.md`](../docs/Campaign-Structured-Practice-Full-Agent-Bench-Plan-v1.0.md) · board [`agents/p-campaign-structured-practice/`](../agents/p-campaign-structured-practice/)

---

## 0. Model in one paragraph

Practice is **born structured**. Every member has a **default account** and, with it, a **ledger campaign** (furniture, not a signed contract). Every trade is stamped to a campaign; the choice is **pre-answered** by last-pair memory so a member who never thinks about campaigns still accumulates a complete book under the ledger. Campaigns are **instances of one account** — designs may be copied across accounts; running instances never span books. Names are unique per member for all time, archive included. Trades may be **restamped** between campaigns on the same account, never moved between accounts. Charters gain **structured bounds**: process clauses witnessed per fill, and six performance attributes as **blood-panel reference ranges** witnessed per campaign — **surfaced always, enforced never**. The platform is the lab, never the doctor.

**Scale of change:** Model inversion, not a patch. Optionality moves up one level: members are no longer free to have *no* campaign; they are free to *never think about* campaigns.

---

## 1. Positioning amendments (vs Concept Spec §1)

| Prior (Concept Spec v1.0) | Structured Practice (this Spec) |
|---------------------------|----------------------------------|
| Campaign optional wrapper over unstructured stream | Campaign is the structure practice is born into |
| Unstamped trades first-class forever | Every trade stamps; ledger absorbs the unconsidered |
| Unbound campaigns (`account_id` NULL) | Abolished — one instance, one account |
| Auto-create = signing the member’s name | Platform provisions **ledger** only (unsigned furniture); **charter** signature remains member-only |
| Free-text goals only | `goals_md` remains narrative; **bounds** are machine-readable charter fields |
| §4.7a continuous Default Campaign as active signed home | **Ledger doctrine** (§3): default is never signed, no bounds, no terminal lifecycle |

**Reaffirmed from Concept Spec:** day is the atom (Scientific Trading Protocol); process-over-outcome; permanence (OD-PB-7); signature / amendments / Renew for **member-created charters**; multi-active charters (DL-259); no Journey coupling to bounds/variance; DL-257 Reports not process scoreboards; Sacred #8.

**Statistical clauses (add to Concept §1 language):**  
> Statistical reference ranges are **expectations of the system being run**, never promises of the member — they **diagnose**, they do not grade. An outcome clause as a guarantee remains void on its face; a falsifiable fingerprint of faithful execution is not a profit promise.

---

## 2. The Seven Laws (normative)

### Law 1 — Genesis: practice is born structured

1. Creating a Trade Log **account** (including the member’s first at practice provision — §2.1) **creates that account’s ledger campaign in the same act**.  
2. The ledger is **furniture, not contract** (§3).  
3. Each **new account** gets its own ledger at creation — not lazily at first trade.  
4. Members create additional **charter** campaigns at will.

#### 2.1 Practice provision — default account (furniture)

Law 1’s “at practice provision” is **load-bearing**. Defined here:

| Rule | Detail |
|------|--------|
| **When** | At **first Practice-suite touch** — any authenticated entry that needs a trade book to be coherent: first open of Trade Log, Campaign library, Journal (if it needs account context), or import. **Not** bare marketing landing / course catalog. Idempotent: if a default account already exists, no second genesis. |
| **What** | Platform ensures one standing **default account** (Trade Log account row) for the identity if none exists. Same furniture logic as the ledger: **creating the book is not a signature**; the member did not “enter a contract” by opening Practice. |
| **Label** | Provisioned title **`Default`**. Member may **rename** freely (Profile → Trade accounts). Member-facing phrase: **default account**. Legacy **`Primary`** is treated as the same standing home until renamed. |
| **Then** | In the **same act**, create that account’s **ledger** campaign (Law 1 item 1). Order: account → ledger. |
| **Not** | List-GET of campaigns alone must not invent accounts (D3 still: browsing empty campaign list does not provision). First *Practice tool* that requires a book triggers ensure. |
| **Later accounts** | Member-created accounts (second book, IRA, Sim, …) also get a ledger at **account create** — same as today, plus ledger. |

**Rationale:** Acceptance “default account + ledger exist before first action” is only achievable if the platform provisions the book at first Practice touch. The account is the book; the ledger is its first page.

### Law 2 — Stamping: every trade chooses a campaign

1. Logging a **trade** (Trade Log fill / import row that becomes a trade) **requires** `practice_campaign_id`. There is **no unstamped trade**.  
2. The choice is **pre-answered** by Law 3. Accepting the default is zero effort.  
3. A member who never engages campaigns accumulates everything in the **ledger**, frictionlessly, forever.  
4. **Invariant: mandatory but frictionless.** The umpire survives because the required decision costs nothing on the happy path.  
5. **Journals are not trades.** Journal session `practice_campaign_id` remains **optional** (OD-1.4). Law 2 does **not** require campaign classification on the journal composer. Mandatory journal stamping is **out of doctrine** for this Spec.

### Law 3 — Memory: last pair wins, per account

1. System remembers **last (account_id → campaign_id)** used for stamping.  
2. Switching accounts recalls that account’s last-chosen campaign.  
3. New account / no history → stamps to **that account’s ledger** until the member redirects.  
4. Platform never resets, guesses past, or expires the standing instruction.  
5. Remembered campaign is always an instance **of that same account** (Law 4).

### Law 4 — Instancing: one campaign, one account

1. Every campaign has **`account_id` NOT NULL**. Unbound campaigns abolished.  
2. “Assign to another account” (or again to the same) **creates a new instance**: new id, empty stamps, own lifecycle, own signature/amendments, own archive entry. Same design, separate contracts.  
3. v1 instantiation is **copy, not link** (pre-fill create from source charter). Formal `template_campaign_id` lateral lineage = future OD.  
4. No campaign row ever holds trades from two accounts.

### Law 5 — Provenance: restamp campaigns, never accounts

1. **Restamp** (same account): legal — reinterpret seasons.  
2. **Move trade to another account:** impossible (4xx, fail loud). Account = fact of fill; campaign = interpretation.  
3. Restamp is not a charter amendment (stamps are not charter fields); panel and weekly pivot recompute composition.

### Law 6 — Name law: one namespace per member, forever

1. Campaign **titles unique per `identity_id`** across **all** accounts and **all** statuses (open, paused, archived).  
2. Archived names stay **reserved forever**.  
3. Every creation path (new, instantiate, Renew, import, rename): collision **auto-suffixes** next free integer — `"Q3 OTM Season"` → `"Q3 OTM Season (1)"`.  
4. **No exceptions.** Ledger names distinguishable at birth (pattern: **`Default — {account label}`** or Tango-locked wording). Renew inherits base name + suffix; lineage chip carries cycle relation.  
5. Import: suffix on arrival; note in import report. Export keys carry identity — lineage never depends on names.

### Law 7 — Bounds: charter has teeth; platform witnesses, member enforces

Free-text goals alone are operationally void. Charters gain **structured, machine-readable bounds** in two layers. **All-bands rule (total):** every factor is a **range** (`range_low` / `range_high`, either nullable). No member-facing vocabulary of max, min, target, or threshold as primary grammar — zones only. A “max” is a range with an open floor.

#### 7a. Process clauses — witnessed per fill (at entry)

Optional per **charter** campaign. Ledger has none by definition.

| Clause | Range semantics |
|--------|-----------------|
| Risk per trade | Currency, % of campaign capital, or R. Ceiling usual; floor open by default |
| Position size | % of trading capital deployed per trade (floor–ceiling). Floor catches undersizing/fear-sizing. Distinct from risk-per-trade. Denominator default: % of campaign starting capital |
| Concurrent open trades | Integer range |
| Strategy scope | Set-range over playbook M2M — named systems only. Unstamped playbook → distinct state, never silently in-scope |
| Strategy-type scope | Set-range over structure families (butterflies, verticals, …). Derive from legs when confident; else **unclassified** — never silent guess. Hotel owns taxonomy |
| Asset-type scope | Instrument classes (index options, equity options, …) — objective from fill |
| Asset scope | Specific underlyings (SPX, XSP, …) — objective from fill |
| Trading window | `starts_at` / `ends_at` — fill outside term is **variance**, not a hard block |

**Witness posture:** breach = **recorded variance, never prevented act**. Trade always logs as it happened. Quiet line at log time (e.g. “outside charter: size …”); no modal wall. Weekly pivot Variance Audit assembles: contract said X, executed Y, dated fills + annotations.

**Adherence substrate:** self-reported followed/partial/broke sits **beside** objective within-terms/variance. Neither replaces the other; platform never judges.

#### 7b. Statistical signature — reference ranges (per campaign)

Six attachable attributes as **blood-panel reference ranges**:

| Attribute | Notes (doctrine locks) |
|-----------|------------------------|
| Avg win/loss ratio | Range + dimension |
| Risk-to-reward (R:R) | **Style signature.** Structural R:R **at entry** (max payoff ÷ debit). Bands distinguish systems (e.g. classic fly 9–18 vs deep tail 20–50). Both sides matter |
| Drawdown | Range; open floor by convention; optional closed floor detects under-risking |
| Sharpe | **Open:** Hotel may defer v1 (§13) |
| Win rate | Band polices **both** floor (broken system) and **ceiling** (drift to high-win harvest / enemy curve). Hotel: win = P&L ≥ 0 at close (recommended, no member config v1); highest default n-floor of the six |
| Profit factor | Range + dimension |

Each attribute: **normal range**, dimension of measure (per trade / campaign; $ / % / R; peak vs start capital; rolling vs inception). Current reading = **marker on the band**. Out of range = information, not intervention.

**Expectancy cross-check (panel self-audit):** R:R and win-rate bands together encode the expectancy geometry of the style (e.g. “roughly half the entries miss cheaply; the ones that land pay ~9× or better”). Over a **valid n** (above both n-floors), **both bands in range while campaign expectancy is negative** is arithmetically impossible under faithful measurement — the panel self-audits: measurement problem, not “system failure chrome.” Implementer note: Kilo free consistency test; Hotel sanity anchor when authoring style × horizon frame cells. Not a third gate tier; not Journey input.

**n-floor:** below validity sample → render **“gathering — n below reference validity”** only. Defaults Hotel; member may raise, not lower below Hotel floor (**open** if fully member-set — §13).

**Three gating tiers:**

1. **Reference ranges** — informative, member-interpreted (default).  
2. **Critical range** — at most one per campaign as **Invalidation** clause; breach surfaces once prominently; **member** completes / ends / amends / annotates — **never auto-status-change**.  
3. **Platform gates — none, ever.** No hard block of fills from bounds.

#### 7c. Panel surfaces

- **Campaign detail:** panel view — range bars, markers, gathering states.  
- **Weekly pivot:** same panel as periodic blood work + trend vs last draw; process variance list auto-assembled.  
- **Cycle compare:** this season’s panel vs predecessor (when lineage exists).  
- Bounds are **charter fields**: signature freezes; post-sign changes → **amendments**. Loosening mid-drawdown is legal and recorded; pivot shows amendment beside later variances.

---

## 3. Ledger doctrine

The genesis default **cannot** carry contract semantics the member never entered (no fabricated signatures).

| | **Ledger** (genesis default) | **Charter** (member-created campaign) |
|--|------------------------------|----------------------------------------|
| Created by | Platform at account creation (Law 1) | Member deliberately |
| Signature | **Never** — no `signed_at`, no `signed_terms`, no amendments | Signs on first activation (Concept Spec §4.5) |
| Bounds | **None by definition** | Optional process clauses + reference ranges (Law 7) |
| Lifecycle | Always active; **cannot** complete, end-early, pause, or renew; **not** in Archive | Full §4.5 lifecycle |
| Delete | No (structural); retires **with its account** | Permanence §4.5.6 |
| Panel | No panel | Panel when bounds declared |
| Purpose | Absorb unconsidered practice honestly | Bind a deliberate season |
| Naming | Distinct ledger pattern (e.g. `Default — {account}`) | Member title under Law 6 |

**Account retirement:** clean = no open **member-created** charters. Ledger closes with the book (not an “open contract” for soft-gate count). History display: e.g. “Ledger — {account}”, not a completed contract.

**Umpire restated:** structure is always present; **deliberate structure is always optional.** Platform provisions the ledger; only the member signs a charter.

**Starting capital / Reports:** On **charter** campaigns, `starting_capital` remains optional and may feed Reports Starting Capital attributed by campaign title. Ledger may optionally hold capital for book-level report convenience (**implementation**: if set, Reports may use it as account standing capital; no signature required — not a contract clause). Prefer Reports clarity: capital on charters is primary; ledger capital = account-book default if product needs a number without a season.

---

## 4. Supersessions (explicit)

| Prior mechanism (Concept Spec v1.0 / as-built) | Disposition under this Spec |
|-----------------------------------------------|-----------------------------|
| `is_default` + ensure-on-import-only | **Replaced** by genesis ledger (Law 1). Import “default” targets the ledger. Flag may become `is_ledger` / `kind` |
| §4.7 prefill cascade (default → bound → recent) | **Replaced** by Law 3 last-pair memory |
| Unbound campaigns §4.6 | **Abolished** |
| Unstamped trades first-class | **Superseded** — Law 2 |
| “No auto-create on account provision” absolute | **Amended** — ledger at account creation is lawful; **GET list never creates** (D3) **stands** |
| Free-text-only goals | **Superseded** by Law 7 (narrative `goals_md` remains) |
| §4.7a continuous signed Default Campaign + term **reject** stamps | **Superseded** by ledger + trading-window **variance** (not hard reject) |
| Interim “End campaign” copy | **Stands** for charters (`abandoned` storage); ledger cannot end |

**Unchanged:** §4.5 signature/amendments/renew for charters; Open/Archive (ledger excluded from Archive); D2 permanence; pack round-trip discipline; Goodhart wall; OD-3.3; DL-257; multi-active charters.

---

## 5. Data model (normative intent — India refines)

### 5.1 `member_practice_campaigns`

| Change | Rule |
|--------|------|
| `account_id` | **NOT NULL** |
| Ledger marker | `is_ledger TINYINT(1)` **or** `kind ENUM('ledger','charter')` — India keep/kill |
| Title uniqueness | Per `(identity_id, title)` app-enforced (+ index if collation safe); Law 6 |
| Lifecycle guards | Domain rejects complete/end/pause/renew/delete when ledger |

### 5.2 `member_practice_campaign_bounds` (new, Family B)

| Column | Meaning |
|--------|---------|
| `identity_id`, `campaign_id` | Ownership + FK (charters only; ledger has zero rows) |
| `attribute` | Process clause or statistical attribute (enum/config) |
| Dimension fields | unit, basis, window as needed |
| `range_low`, `range_high` | Nullable ends → one-sided ranges |
| `is_critical` | At most one true per campaign (Invalidation) |
| `n_floor` | Sample validity floor for signature attributes |
| `export_key` | Pack identity |
| timestamps | created/updated |

Bounds are **charter fields** → post-signature changes write **amendment** rows (field path e.g. `bound.{attribute}`).

### 5.3 Trade stamp provenance

| Column | Meaning |
|--------|---------|
| `stamped_by` | `member` \| `memory` \| `migration` \| `import` (optional distinct from migration — India keep/kill; bulk import with no pick defaults ledger) |

Deliberateness of structure is itself evidence. **Session memory** stamps (`memory`) are never written by bulk import (§6).

### 5.4 Variance

**Normative (history stability — both mechanisms must satisfy):**

> **Variance for a fill is evaluated against the bounds in force at fill time.** Amendments never rewrite historical variance. Loosening or tightening a bound mid-season changes judgment only for **new** fills; last month’s within-terms / variance stamps (or derive-at-then results) **stand**.

**Mechanism (India keep/kill — not “whether history is stable”):**

| Option | How it satisfies the rule |
|--------|---------------------------|
| **(a) Temporal derivation** | Derive-on-read reconstructs **bounds-as-of-fill-time** from append-only amendment rows (`old_value` / `new_value` / `amended_at`) + original signed snapshot. Single source of truth; join nontrivial. **Naive derive-on-read against *current* bounds is forbidden** — it retroactively rewrites history on every amendment. |
| **(b) Stamp at fill time** | Store immutable per-fill variance (within-terms / variance per clause) evaluated once against bounds then in force. No rewrite path. |

Prefer (a) when amendment reconstruction is proven correct and cheap; (b) if India keeps stored stamps. **No second truth:** panel and weekly pivot must not disagree with the fill-time evaluation for historical rows.

### 5.5 Last-pair memory

Server-side per `(identity_id, account_id) → campaign_id`. Survives devices. Always validated to same-account campaign.

### 5.6 Panel readings

**Derived, never stored** (same law as cycle numbers).

---

## 6. Surfaces (product delta)

| Surface | Requirement |
|---------|-------------|
| Trade sheet | Campaign always present; pre-filled by Law 3; zero extra keystrokes on happy path; quiet variance line on out-of-bounds |
| **Broker / bulk import** | Paths: **ledger** (default / former “none”) · **pick charter** · **new charter**. **There is no unstamped import path.** “None” / no campaign selection → stamp all fills to the **account ledger** (`stamped_by = migration` or a dedicated `import` provenance if India prefers — must be distinguishable from deliberate session memory). **Last-pair memory is not consulted and not updated by import** — bulk history must not pollute a signed charter the member last hand-picked in a live session. Explicit pick/new on the import sheet *does* stamp to that campaign and **may** update memory only if the product treats import as a deliberate session choice (**default: do not update memory on import** — session memory stays session). |
| Campaign library | Ledger **pinned or visually distinct** in Open; **absent from Archive** |
| Ledger detail | Stamps/stats; **no** charter editor, panel, lifecycle toolbar |
| Charter detail | Bounds editor + panel; existing lifecycle (sign, amend, pause, complete, end, renew) |
| Create / instantiate | “Start from existing campaign” pre-fill; live name uniqueness + suffix preview |
| Restamp | Same-account campaign reassignment; bulk vs single = Echo + §13 |
| Weekly pivot | Variance audit from 7a; panel draw + trend; amendments beside blessed variances |
| Retirement | Soft-gate open **charters** only; ledger closes with account |
| Starting frames | **Style × horizon** grid of complete band-sets (Hotel doctrine transmission). No `horizon` schema column — ranges *are* the horizon. n-floors horizon-relative |

**Copy (Tango):** “outside charter,” never “violation.” Panel: normal range, in range, out of range, gathering. Clinical register. No celebration/shame chrome.  

**End-campaign vocabulary (Tango gate — explicit, not inherited fact):** Storage status remains `abandoned` (early terminal). Member-facing chrome may use **End campaign** / **Ended early** (retail-simple). That is a **copy-doctrine change** vs “abandoned renders with dignity, never euphemized” as the *only* surface word. Tango must lock: whether Archive chip says **Ended early**, **Abandoned**, or both (label vs glossary); never soft-merge with Complete or Pause.

---

## 7. Lifecycle interaction (charters only)

| Event | Behavior |
|-------|----------|
| First activate | Signature freezes charter **including bounds** |
| Bound change after sign | Amendment rows; panel uses **current** bounds for **new** fills; historical variance evaluated per §5.4 (**bounds in force at fill time** — amendments never rewrite history) |
| Trading window passed | Fills still allowed; **variance** on window clause — not API 422 for “term expired” (supersedes §4.7a.4 hard gate) |
| Renew | New draft charter instance; name Law 6 suffix; predecessor lineage; bounds copied as draft |
| Ledger | No signature, no renew, no terminal states |

---

## 8. Migration (honesty)

| Item | Rule |
|------|------|
| Existing accounts | Ensure ledger (`Default — {account}` / Tango); mark ledger |
| Unstamped trades | Sweep to account ledger; `stamped_by = migration` forever distinguishable |
| Existing `is_default` rows | **Recommended:** become the account ledger if they already played that role; else charter beside fresh ledger (**Coach open** §13) |
| Duplicate titles | Suffix by creation order; oldest keeps clean name; report |
| `account_id` NULL campaigns | Bind to sole account; else unanimous stamp account; ambiguous remainder per Coach (§13) |
| Bounds | All existing → **zero bounds** (behavior = today) |
| Signature backfill | Concept Spec §4.5.7 unchanged |

---

## 9. Pack / export (delta)

model_version **≥ 1.3** (or pack surface bump) when implemented:

- Ledger flag / kind  
- Bounds array per campaign entry  
- `stamped_by` on trade stamps in trade_log surface  
- Name collision on import → suffix + report note  
- Round-trip: bounds, ledger, provenance; no data loss  

---

## 10. Acceptance criteria (Delta-checkable)

1. New member: after **first Practice-suite touch** (§2.1), **default account** (`Primary` / Tango) **and** its **ledger** exist; first trade logs with zero campaign keystrokes; stamped to ledger; `stamped_by = memory`.  
2. New account → own ledger at creation; first trade stamps to that ledger absent contrary memory.  
3. Explicit campaign pick updates memory; account switch recalls pair; memory survives re-login / device change.  
4. No API creates a **trade** without `practice_campaign_id`; no API moves a trade across accounts (4xx); same-account restamp works. Journal `practice_campaign_id` may remain null (OD-1.4).  
5. Instantiate-to-account creates new row (new id, empty stamps); source untouched; name suffixes.  
6. Name collision on create/rename/renew/instantiate/import suffixes against full namespace **including archived**.  
7. Ledger: cannot complete/end/pause/renew/delete (4xx); absent from Archive; never signed; retires with account.  
8. Bounds: fill outside any process range logs successfully + variance + quiet line; no modal/block. Both sides of band record. Below n-floor → “gathering.” No “max/limit/target/threshold” as primary member-facing bounds vocabulary.  
9. Critical range breach surfaces once; no auto-status-change; complete / end / amend available.  
10. Nothing in Journey reads bounds, variance counts, panel readings, or range states.  
11. Migration: unstamped → ledger with `migration`; names suffixed oldest-first; NULL account resolved; zero data loss.  
12. Export/import round-trips bounds, ledger flag, stamp provenance; import name collisions suffix with note.  
13. Multi-active **charters** still allowed on one account (DL-259).  
14. GET `/api/me/practice/campaigns` never creates rows (D3).  
15. **Import path:** import with **no campaign selection** (and the former “none” option) stamps every fill to the **account ledger**; last-pair **memory is not consulted and not updated** by that import. Explicit import pick/new stamps to the chosen charter; default remains **memory not updated** unless product later opts in with a documented rule.  
16. **Variance history:** after amending a bound, a fill that was within-terms under the old bound remains within-terms in audits/panel history for that fill; a new fill under the new bound is judged only against the new bound (§5.4).  

---

## 11. Non-goals

- Platform hard-blocking fills for bound breach  
- Auto-complete / auto-end / auto-abandon on critical range  
- Journey grades from panel or variance counts  
- Stored panel/stats cache without keep/kill (prefer derive)  
- **Naive derive-on-read variance against *current* bounds** (retroactive rewrite — forbidden by §5.4)  
- Unbound campaigns  
- Unstamped trades as a product path (import “none” → ledger, not NULL stamp)  
- **Mandatory journal campaign stamp** (Law 2 = trades only; OD-1.4 stands)  
- Hard-reject (4xx) of trade create for term window / bound breach (variance only)  
- Closed `campaign_type` enum  
- Lateral `template_campaign_id` graph in v1 (copy-only instantiate)  
- Goal-prose enforcement without declared bounds  

---

## 12. Concept Spec surgery map (for v2.0 fold-in)

| Concept Spec section | Action |
|---------------------|--------|
| §1 | + statistical-clause sentence; signing-name line sharpened per ledger doctrine |
| §4.2 stories | Delete unbound / pure-unstamped stories; add instantiate, restamp, bounds, “never thinks about campaigns” |
| §4.3 | Rewrite offer/force table per Laws 1–3 + ledger |
| §4.5 | Stands for charters; + ledger exclusions; Renew name-suffix |
| §4.5.5 | Ledger presentation; absent from Archive |
| §4.6 | Replace with Law 4 instance semantics |
| §4.7 | Replace with Law 3 memory |
| §4.7a | **Replace** with this Spec §3 (ledger) — continuous signed default retired |
| §4.8–4.11 | Ledger ensure; bounds pack; name law; stamp required |
| §4.9 | Clean = no open **charters** |
| §7–8 | Align non-goals + acceptance with this Spec §10–11 |

Source note for advisors:  
[`docs/Campaign-Model-Change-Structured-Practice-Instances-Bounds.md`](../docs/Campaign-Model-Change-Structured-Practice-Instances-Bounds.md)

---

## 13. Open dispositions (Coach before build freeze)

1. Existing silent `is_default` books → ledger (recommended) or charter beside fresh ledger?  
2. NULL-account migration: unanimous-trades binding + fallback rule?  
3. n-floor: Hotel floor raisable-only (recommended) vs fully member-set?  
4. Sharpe in v1? (Recommend defer.)  
5. Restamp v1: single only vs bulk?  
6. Size-floor vs Blueprint stage-1 probe undersizing (member sets floor vs future probe tag)?  
7. Frame grid v1: which style × horizon cells (sparse honest grid recommended)?  
8. Strategy-type scope: ship v1 or trail if leg-pattern classification is new machinery?

---

## 14. Agent gates (implementation seating)

| Gate | Jurisdiction |
|------|--------------|
| India | NOT NULL migration; ledger modeling; bounds table; **variance mechanism (a) temporal derive vs (b) stamp-at-fill under §5.4 history-stability constraint**; memory storage; import→ledger + no memory update; structure-classification as-built |
| Hotel | Style × horizon frames; band semantics; n-floors; R:R basis; win definition; structure-family taxonomy; Sharpe keep/kill; **expectancy cross-check as frame-authoring sanity** (§7b) |
| Tango | Mandatory-stamping copy; variance neutrality; panel clinical register; ledger naming; **End campaign / Ended early vs Abandoned surface doctrine** (§6); import path labels (ledger vs pick vs new — no “none/unstamped”) |
| Echo | Trade-sheet density; panel UI; suffix preview; restamp UX; import sheet path chrome |
| Mike | Family B; import names; import stamp provenance |
| Kilo | §10 characterization tests incl. **#15 import→ledger / memory untouched**, **#16 variance history stability**, expectancy cross-check optional |
| Delta | Ternary evidence |
| Lima | DL model inversion + seven laws; Guide rewrite on feature PRs; Concept Spec v2.0 fold |

---

## 15. Document history

| Date | Note |
|------|------|
| 2026-08-08 | **Bench review A–C:** §2.1 default-account genesis at first Practice-suite touch; Law 2 journals optional (OD-1.4); hard term/bounds gate audit + fill-after-`ends_at` variance only. |
| 2026-08-08 | **Review fix (stamp-ready):** F1 §5.4 normative fill-time bounds + temporal-derive vs stamp-at-fill; F2 import “none”→ledger, memory not consulted/updated, acceptance #15–16; F3 expectancy cross-check restored in §7b; Tango End-campaign vocabulary gate explicit. |
| 2026-08-08 | v1.0 — Formal Spec from Coach-ratified model in `docs/Campaign-Model-Change-Structured-Practice-Instances-Bounds.md`. Seven Laws, ledger doctrine, bounds/panel, supersessions vs Concept Spec v1.0 / §4.7a, migration, acceptance, open dispositions. |

---

*Signature, amendments, cycles, archive, permanence, and the umpire stand for **charters**. This model gives structured practice and charter teeth: every fill lives in a campaign; bounds are witnessed, never forced.*
