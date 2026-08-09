# FatTail Labs — Member Campaign Spec v1.3
## Structured practice · the window model · the prescribed panel · the Campaign Journey

**Status:** Product / architecture authority — complete restatement (redo, Coach-directed 2026-08-09) · **registry/badge clarification 2026-08-09**
**Supersedes:** Member Campaign Structured Practice Spec v1.2 (and via it v1.0–v1.1); Campaign Amendment — Window, Direction, Badge (folded); UX Directive — Prescribed Panel (folded); Campaign Panel v1 — Six Controls (folded)
**Companion:** [Trade Log Spec v1.1](./FatTail-Labs-Trade-Log-Spec-v1.1.md) §17 — **passive participant** (badge host; no campaign logic). Boundary owned here in §2.1 + §9; Trade Log §17 is the host-side amend.
**Queued, not dropped:** D6 convexity gauge / vol-correlation module — Coach-ratified, blocked on the vol data-source OD; lands as v1.4 or companion spec
**Type:** Practice Campaign model — concept, laws, lifecycle, panel, journey, surfaces, schema, migration

---

## 1. Concept

**A campaign is a project bound by a contract — a time-boxed mandate the member signs with another party or with their professional self.** The platform offers the terms; only the member signs. The platform is the paper, the witness, and the lab — never the risk manager, never the doctor. Structure is always present (the ledger absorbs unconsidered practice); **deliberate** structure is always optional (the charter is entered, never imposed). Umpire doctrine throughout: order without force; witnessed, never gated or graded.

The contract form is purpose-agnostic — capital, learning, remediation, transition, and proving campaigns are one object with different clauses. Because the enforceable counterparty is ultimately yourself, every clause is a process clause; statistical clauses are **expectations of the system, never promises of the member — they diagnose, they do not grade.**

## 2. The model — three ideas

**Membership = direction + window. Account = fact, not filter.**

| Law | Statement |
|-----|-----------|
| **L1 — Genesis** | Every Trade Log account is born with its **ledger** (default campaign, furniture — §3) in the same act. The member's first account provisions at first Practice-suite touch (idempotent; provisioning is not a signature). Members create accounts and campaigns at will. |
| **L2 — Direction** | Every trade is **directed** to exactly one campaign — the stamp, the signature act. The decision is pre-answered by memory (L3), so the mandatory choice costs nothing. A member who never engages accumulates everything in the ledger, frictionlessly, forever. |
| **L3 — Memory** | Per account, the system remembers the campaign last directed from that book and pre-fills it. The remembered campaign must be **window-eligible at fill time**; expired or unarmed memory falls back to that account's ledger, silently. The member's last deliberate choice is the standing instruction; the platform never resets or guesses past it. |
| **L4 — Window eligibility** | A trade may be directed to a campaign only if its **fill time** (not entry time) falls inside the campaign's window `[starts_at, ends_at]`. The window is **membership law, not a witnessed clause**: the picker offers only covering windows; a future-armed campaign is unofferable until its start arrives; after `ends_at` the season accepts no new direction; `ends_at` NULL accepts indefinitely. Future start = the season arms itself. Past start = a charter framed over history, into which the member deliberately directs old fills. |
| **L5 — Account freedom + provenance** | A directed trade may come from **any account**; charters carry no account binding (no scope set, no per-account instancing). Each fill's account is **immutable fact**: trades move between campaigns (redirect), never between accounts. Campaigns are interpretation; accounts are history. Interpretation may span books because every fill carries its book. |
| **L6 — Exclusive membership** | **One trade or position, one campaign, one badge.** Panels never double-count a fill; redirect is a move, never a share. The stamp lives at the trade object (position evidence); legs inherit the parent's direction; no per-leg stamping exists. **Badges are permanent** until an explicit redirect moves them — ending or archiving a season never peels stamps from past fills. |
| **L7 — Name law** | Campaign names are unique per identity, across all accounts and all statuses — **archived names reserved forever** (permanence makes weak naming compound). Filesystem semantics on every creation path (new, copy-from, Renew, import): collision auto-suffixes to the next free integer; renames pass the same check. No exceptions, including ledgers ("Default — {account}" pattern, Tango wording) and Renew (lineage chip carries the cycle; the name law stays exceptionless). |
| **L8 — Bounds** | The charter has teeth: the **prescribed panel** (§5) — reference ranges witnessed, never enforced. All bounds are **ranges** (no maxes/targets in the vocabulary; one-sided = open end). Two **roles**: `boundary` (corridor — outside is variance) and `goal` (mark — progress only; never variance, never critical). |

### 2.1 Campaign registry and the badge

**Product language:** the set of campaigns a member owns is the **campaign registry**. There is no second store — `member_practice_campaigns` **is** the registry. Creating a charter (or provisioning a ledger) **registers** a badge the Trade Log may dispense onto trades.

```
  CREATE / ensure campaign ──► registry row (badge definition + window meta)
                                         │
                    Trade Log reads for   │   dispense list (picker)
                    label + eligibility   ▼
                              ┌─────────────────────┐
                              │  eligible badges     │  window covers fill time
                              │  + ledger always     │  (L4); memory pre-fill (L3)
                              └──────────┬──────────┘
                                         │ stamp (direction)
                                         ▼
                              trade.practice_campaign_id   ◄── permanent membership
                              trade.stamped_by             ◄── provenance tier
```

| Concern | Owns | Does not |
|---------|------|----------|
| **Registry** (campaign spine) | Badge identity, title, window, status, ledger flag, panel/journey, memory rules, eligibility | Fills, accounts, blotter chrome |
| **Trade Log** (passive) | Facts of fill + **hosts** chip / picker / filter; stores stamp ids | Window math, panel, lifecycle, inventing campaigns |

**Registry metadata (minimum for badge dispense + display):**

| Field | Purpose |
|-------|---------|
| `id` | Stable badge identity — what is stamped onto the trade **forever** |
| `title` | Chip label (rename updates display; stamp id does not change) |
| `starts_at`, `ends_at` | **Window** — gates **new** direction only (L4), not whether an old badge still displays |
| `status` | planned / active / completed / abandoned — terminal seasons leave the dispense list for *new* stamps; chips on past trades remain |
| `is_ledger` | Furniture vs charter; ledger always dispense-eligible for its book |
| `account_id` | Ledger only (bound book); charters `NULL` (any book may wear the badge) |
| `is_default` | Book-home / prefill hints |
| `export_key` | Pack / import identity |

Optional later (not required for v1 badge): short code, color token, cover art — still registry-side if added; Trade Log never invents badge definitions.

**Dispense vs wear:**

1. **Dispense** — at create/edit of a trade, the sheet offers **only** registry rows that cover fill time (plus the account ledger). That is eligibility, not variance.
2. **Wear** — once stamped, the trade **wears that badge forever** (until explicit redirect). Window expiry, archive, and End campaign stop *new* dispenses into that season; they do **not** strip badges already worn.
3. **Display** — blotter resolves title (and provenance tier from `stamped_by`) from the registry by stamp id. A rename changes the chip label; membership remains the same id.

**Position language:** as-built the stamp is on the **trade** row (open/close fill). Product may say “position wears the badge” — legs inherit the parent trade’s stamp; there is no separate badge table on legs or a parallel position entity for campaigns.

## 3. Ledger doctrine

The genesis default is **furniture, not contract**:

| | Ledger | Charter (member-created) |
|--|--------|--------------------------|
| Created by | Platform, at account creation | Member, deliberately |
| Account | **Bound to its one account** (the book's own page) | **None** (L5) |
| Window | All-time | Member-declared (L4) |
| Signature / amendments | Never | Signs on activation; amendments thereafter |
| Panel / radar | **None** — furniture has no shape | Six controls + Campaign Journey |
| Lifecycle | Always active; cannot complete/end/pause/renew/delete; absent from Archive | Full lifecycle (§4) |
| Retirement | Retires with its account, displayed "Ledger — {account}", not a completed contract | Permanence rules |
| Purpose | Absorb undirected practice honestly | Bind a deliberate season |

Clean account retirement = no open **charters** need settling; the ledger closes with the book silently.

## 4. Lifecycle — signature, amendments, renewal, archive

```
draft (planned) ──activate──► active ──complete──► completed   [read-only]
   │  free edits       ▲   (signature)   └─end──►  abandoned   [read-only]
   └─ hard-delete OK   │  ◄──pause/resume (clock event, same signature)
      (zero stamps     └── every post-signature charter-field edit
       AND never         = immutable amendment row (field, old→new,
       signed)             optional member note; append-only)
```

- **Signature:** activation stamps `signed_at` + immutable `signed_terms` snapshot. Quick-create (title + activate) signs a minimal valid contract. Drafting is free; **signature is permanence** — hard-delete requires zero stamps AND `signed_at IS NULL`; a signed-but-unperformed charter exits only through `abandoned` (honest early end; member word per Tango — "End campaign" gate-reviewed, never euphemized into complete).
- **Amendments:** never blocked, never judged — no warning chrome, no counts-as-badges. The record is the feature; the weekly pivot shows amendments beside the variances they retroactively blessed. Bounds are charter fields: admin or member range edits on a signed charter write amendments (the witness doesn't care who holds the pen).
- **Pause:** clock event, not terms event — same signature, no re-sign on resume; recorded in the status timeline; `ends_at` does not auto-shift.
- **Renewal (cycles):** Renew on any terminal charter creates a draft successor — charter copied as draft, `predecessor_campaign_id` self-FK, **cycle number derived from the lineage walk, never stored**. Lineage is a tree (renewing twice is legal). Offered on terminal detail and in the post-mortem; never nudged (OD-3.3 budget untouched).
- **Archive:** terminal status **is** archived — no second flag (status = sole authority). Library shows **Open / Archive**; archived rows show honest status (`completed` and `abandoned` visibly distinct — a high abandon count can be honest discipline; the Lab does not imply otherwise), term, cycle chip. Affordances: read, export, Renew. **No aggregate completion-rate or P&L chrome, ever.** Ledgers absent.
- **Variance history (normative):** variance is evaluated against the **bounds in force at fill time**; amendments never rewrite historical variance. (Mechanism — temporal derivation from amendment rows, or fill-time stamping — is India's keep/kill; the constraint is law. Goal progress, by contrast, re-reads against current ranges: progress is not a historical ledger.)
- **Migration honesty:** pre-existing rows that ever reached active backfill `signed_at = created_at`, `signed_terms_backfilled = true`, displayed **"Terms as of"** — never "Signed"; never fabricate a signature the member didn't make. Never-signed terminal drafts display a "Never signed" state, no fabricated chrome.

## 5. The prescribed panel — six controls (v1 surface)

**The member chooses a practice, not a configuration.** The doctor didn't ask you to define normal glucose, and didn't ask which tests go on the report: **ranges are printed; composition is prescribed.** The bounds table is storage; **the report is the only surface**. No Role dropdown, no Attribute picker, no Low/High form, no "Add bound" — dead per the Prescribed Panel directive.

### 5.1 The six controls

Every charter's panel comprises **all six** attributes, blood-work anatomy (total range = the strip; **acceptable range = the in-range segment inside it**; pointer + value bubble; "Reference range: X – Y" label line):

| # | Attribute | Seed acceptable | Seed total |
|---|-----------|-----------------|------------|
| 1 | Win rate | 40 – 60 % | 0 – 100 |
| 2 | Risk-to-reward (structural, at entry — Hotel basis) | 9 – 18 | 0 – 30 |
| 3 | Max drawdown (of peak) | 0 – 6 % | 0 – 15 |
| 4 | Avg win/loss ratio | 1.2 – 2.2 | 0 – 4 |
| 5 | Profit factor | 1.3 – 2.5 | 0 – 5 |
| 6 | Sharpe ratio | 2 – 6 | 0 – 10 |

Seeds are arbitrary starting bands around Coach's reference values — the admin dial tunes them toward doctrine. Two-sided reading is the diagnostic (win rate **above** band = drift toward the high-win harvest curve — the side only this doctrine polices; R:R below band = overpaying debit). All-bands rule total: no member-facing max/limit/target/threshold as primary vocabulary.

### 5.2 States and rendering

- **In range** (marker on the acceptable segment) · **out of range** (marker on a flank, either side) · **gathering** (below the attribute's n-floor: no marker, no number — "gathering — n below reference validity"). n-floors are horizon-relative (Hotel defaults; win rate highest — it converges slowest).
- **Sizing rule:** each control scales to **100% of its container width**; all geometry is percentage math against the total range — identical proportions at every size (desktop, panel column, 320 px phone). No fixed pixels, no grammar-swapping breakpoints; value bubble may shift inboard at strip ends, the pointer never lies.

### 5.3 Editing (v1)

- **Admin-only edit toggle** (role: administrator). Toggled on, each control exposes its dial: adjust acceptable range and total (display) range — drag ends or stepper. Members see the report only.
- Total range is **presentation config**, not doctrine (India: panel-level config; bounds rows stay pure).
- **Deferred, not dropped:** member range adjustment (informed-patient case — amendment machinery already waits), goal-role surface chrome, the style × horizon **frame grid** (Hotel's reference literature — complete panels per cell; remains the transmission target for admin tuning and the member-facing pick when it ships), custom blank-charter path (empty panel + one-line-at-a-time picker, tucked away, never the front door).
- Expectancy cross-check (R:R band + win-rate band jointly encode expectancy; both-in-range + negative expectancy over valid n is arithmetically impossible) = frame-authoring sanity for Hotel and a free Kilo consistency test.

## 6. The Campaign Journey — radar + time scrub

**The Journey app is the trader's journey — lifelong, unending. This is the Campaign Journey — one season, finite by design**: born at signature, ending at completion or honest end. Day = atom · campaign = finishable journey · trader = unending journey; finished journeys are what make the unending one gradeable. The Archive is the bookshelf; Renew is the sequel; the cycle chain is a series.

Charter detail renders the radar + **time slider bound T0 → present** (T0 = window start; bidirectional slider ↔ chart; J2 component pattern). Four laws:

1. **Axes = the declared panel** (the six controls; goal rows render role-aware). **Ledger has no radar.**
2. **Band-alignment, never raw magnitude:** extension = alignment with the declared range — full in-band, decaying off-band **both sides** (85% win rate against 40–60 *shrinks* the axis); goal axes = progress toward the mark. Outer ring = operating/reaching as declared. **Big shape = faithful, never big numbers.** Hotel gates the decay function.
3. **Scrub to T evaluates fills [T0→T] against bounds in force at T** — amendments visibly bend the shape at their dates; the earlier season never rewrites.
4. **n-floor renders as focus:** below-validity axes render "gathering"; the fingerprint comes into focus as validity arrives.
- **Minimum Shape rule:** radar renders only at ≥ N axes (floor 4, Hotel/Echo pin). Six-control panels satisfy it by construction; only the future custom path can go sub-N (bars render alone there). No one-spoke radars — fake precision is the same crime as numbers below the n-floor.
- Guards: derived at render (no stored shape series); no Journey feed (shared pattern, never shared plane); clinical register; no P&L on any axis.

## 7. Witnessing — variance, never enforcement

- **Process clauses** (risk-per-trade, position-size band incl. the fear-sizing floor, concurrent-trades range, strategy/strategy-type/asset-type/asset scope — the four-tier SOW) remain model law with witnessing semantics as specced (declared-vs-derived honesty; strategy-type never guesses silently); **surface deferred** in v1 (server-side witness continues; panel shows the six statistical controls).
- A directed fill outside a boundary **logs exactly as it happened** + a quiet variance line; no modal, no block, no 4xx anywhere on the logging path. The weekly pivot's variance audit assembles itself (contract said X, executed Y, dated, member-annotated). Adherence self-report gains its objective substrate; neither replaces the other; the platform never judges.
- **Critical range:** at most one boundary-role range per charter marked as the Invalidation clause; breach surfaces once, prominently; **the member executes the termination** — never auto-abandon, never a new nudge.
- The trading window is **not** a variance clause (L4 — membership law; an out-of-window fill can't be stamped because the picker never offered it).

## 8. Surfaces

| Surface | Definition |
|---------|------------|
| Library | Open / Archive; ledgers pinned/distinct in Open, absent from Archive; cycle chips |
| Charter detail | Signed terms ("Signed" / "Terms as of" / "Never signed" honestly) · amendments list (neutral history) · **the panel (§5)** · **the Campaign Journey (§6)** · lineage chip · Renew on terminal |
| Create | Title + activate remains a valid minimal contract; window fields; frame-pick and custom path arrive with §5.3's deferred items |
| Trade sheet | Campaign field pre-filled by L3; eligibility-filtered picker (L4); quiet variance line (§7); zero new required keystrokes on the happy path |
| **Trade Log (passive)** | **The badge** — see §9 |
| Weekly pivot / post-mortem | Variance audit + panel draw + amendments-beside-variances; post-mortem closes on both ledgers: corridors kept, marks reached; leads with process and psychological friction, never P&L |
| Retirement | Open **charters** surfaced (settle or retire anyway); ledger closes with the book silently |

## 9. Trade Log — the passive-participant boundary

**Normative host amend:** [Trade Log Spec v1.1 §17](./FatTail-Labs-Trade-Log-Spec-v1.1.md). This section is campaign-side law; Trade Log §17 is host-side law. They must not diverge.

**The Trade Log is the system of record for facts (fills, accounts, times) and owns no campaign logic.** Campaign machinery *reads* it; Trade Log surfaces *host* campaign chrome. The registry (§2.1) remains in the practice spine.

1. **The badge:** every blotter row carries its campaign as **one chip** (L6) — campaign name from the registry, report register, chrome-light. **Provenance tiering visible:** deliberate direction = full chip; memory-default and ledger-absorbed = quieter (`stamped_by` made legible — deliberateness is evidence). **The badge never carries conduct** — no variance coloring; membership on the badge, conduct on the panel/pivot; the blotter stays process evidence, never a shame surface.
2. **Badge = read, filter, redirect:** tap filters the blotter to that campaign — **one filter system** (badge as entry point to the existing campaign filter; composes with the Adhere locate view; no second mechanism). Trade detail / sheet: campaign select = eligibility picker (window covers fill time; any account; ledger fallback); **"Direct to campaign…"** when shipped is the same picker.
3. **Dispense list:** Trade Log mounts the registry via campaign list / eligible APIs — it does **not** maintain a parallel badge catalog. Creating a campaign elsewhere immediately expands what the sheet can dispense (subject to L4).
4. **Forever wear:** stamps persist for the life of the trade row; season end does not clear `practice_campaign_id`. Redirect is an explicit member (or import) act that **moves** the stamp.
5. **Fill-time law:** editing a fill's time re-evaluates eligibility for *new* direction choices; a stamp whose fill time moves outside its campaign's window is **surfaced quietly for redirect, never auto-moved**.
6. **Schema:** Trade Log columns for campaigns = `practice_campaign_id` + `stamped_by` only. No denormalized title on the trade (live registry lookup for chip label). Journal stamping remains **optional** (OD-1.4).
7. Trade Log's own doctrine unchanged: options-first blotter, accounts immutable on fills, import per §11, DL-257 untouched (Reports remains objective aggregate; no campaign chrome there beyond optional Practice Context stamp filter, not a P&L hero).

## 10. Data model (delta summary — India refines)

- **`member_practice_campaigns` = campaign registry** (no separate badge registry table): `account_id` **nullable for charters** (L5); ledgers keep account; `is_ledger` marker; `starts_at`/`ends_at` window; `signed_at`/`signed_terms`(+`_backfilled`); `predecessor_campaign_id`; name uniqueness per identity (app-enforced + index); `export_key`
- `member_practice_campaign_bounds`: `role ENUM('boundary','goal')` · attribute · dimension fields · `range_low`/`range_high` (either nullable) · `is_critical` (boundary-only; ≤1 per charter) · `n_floor`; **uniqueness per (campaign, attribute, role)**; panel display domains in panel-level config; house-seeded six on every charter
- `member_practice_campaign_amendments`: append-only (field, old, new, note, timestamps, export_key); status timeline included
- **Stamp on trade (badge wear):** `practice_campaign_id` + `stamped_by ENUM('member','memory','migration','import')` on `member_trade_log_trades` (journal campaign optional — OD-1.4; L2 applies to trades only)
- Memory: per (identity, account) → campaign id, server-side — dispense prefill only; not a second registry
- Derived, never stored: cycle numbers, panel readings, radar shapes, variance (subject to the fill-time constraint §4); chip title resolved at render from registry

## 11. Import / export

- Import: no unstamped path — "none" is gone; unchosen imports land in the **account's ledger**; memory is neither consulted nor updated by import; explicit target allowed (eligibility law applies); colliding names suffix on arrival with report note.
- Pack: campaigns carry signature, amendments, lineage (`predecessor_campaign_export_key`, pending-and-reported when absent), bounds **including role**, ledger flag, stamp provenance; journal campaign keys; cycle numbers derive after import. Round-trip is law; silent drops prohibited.

## 12. Non-goals

Platform gating of trades (never — no 4xx on any logging path) · auto-termination on any breach · content unlocks/rewards from any campaign signal · campaign data as Journey input (Goodhart wall, absolute) · P&L/win-rate hero chrome or archive aggregates · counterparty structure (fields/templates/coach visibility — separate OD) · `campaign_type`/horizon taxonomy columns (ranges are the horizon) · raw-magnitude radar axes · stored shape/stats series without keep/kill · marketing use of any panel/gauge data (Sacred #8 wall — "our members' books…" is a profit claim in a lab coat) · per-leg stamping · Reports as campaign surface (DL-257)

## 13. Acceptance (consolidated, Delta-checkable)

**Genesis/ledger:** 1. First Practice touch provisions default account + ledger; first trade logs with zero campaign keystrokes → ledger, `stamped_by='memory'`. 2. New account → own ledger; ledger cannot complete/end/pause/renew/delete (4xx), absent from Archive, never signed, no panel, no radar; retires with account.
**Direction/eligibility:** 3. No API path creates a trade without campaign_id; per-leg stamping has no path; redirect moves, never shares. 4. Picker offers only window-covering campaigns (fill time); future-armed absent until start; expired accept no new direction; ledger always fallback. 5. Memory recalls per account; ineligible memory falls back to ledger silently; survives devices. 6. Fill-time edits re-evaluate eligibility; outside-window stamps surface for redirect, never auto-move. 7. Charters accept fills from any account; each fill's account immutable (cross-account move = 4xx fail loud).
**Lifecycle:** 8. Signature freezes `signed_terms` (amend every field; snapshot unchanged); hard-delete requires zero stamps AND never signed (else 409/4xx). 9. Amendments append-only, immutable, no UPDATE/DELETE path; multi-field PATCH → N rows. 10. Terminal = read-only + Renew; Renew copies draft + predecessor FK; cycle derives through a 3-chain; two successors both work. 11. Name collisions suffix on every path against the full namespace including archived; archived names never freed. 12. Backfilled rows display "Terms as of"; never-signed terminals display "Never signed."
**Panel:** 13. Fresh charter renders all six controls with seeds; admin toggle invisible to members (render + grep); admin range edit on signed charter writes amendment. 14. Proportional geometry at 320 px = desktop percentages; gathering below n-floor shows no marker/number. 15. Vocabulary grep: no "violated / unlock / reward / earn access / max / limit / target / threshold" as primary member-facing bounds copy.
**Journey:** 16. Radar axes = declared panel only; ledger no radar; sub-N (custom path) renders bars only. 17. Out-of-band-HIGH reduces extension (win-rate case explicit); goal axes render progress, never variance. 18. Scrub at T uses bounds-in-force-at-T; amendment dates segment the series; earlier shape unchanged. 19. Radar derived at render; no stored series; no Journey feed (score-input audit).
**Witness:** 20. Boundary breach logs + variance + quiet line; no modal/block/4xx. 21. Goal rows never produce variance; critical on goal-role rejects 4xx. 22. Critical breach surfaces once; no auto-status-change. 23. Variance evaluated against bounds in force at fill time; amendment does not rewrite it (regression).
**Badge / registry (Trade Log side, tested there):** 24. Create campaign → registry row available to dispense list; one chip per blotter row; provenance tiering; no variance styling on chip; tap filters via the one filter system; eligibility picker for new stamps; end season does not strip existing stamps; "Direct to campaign…" honors eligibility when shipped.
**Pack/import:** 25. Round-trip: signature, amendments, lineage (pending-and-reported), bounds+role, provenance; import lands unchosen fills in ledger, memory untouched, colliding names suffixed with note.

## 14. Gates

| Gate | Jurisdiction |
|------|--------------|
| India | 103 reversal mechanics; bounds uniqueness; variance temporal mechanism (keep/kill within the §4 constraint); memory storage; display-domain placement; no second truth |
| Hotel | Six-control doctrine (R:R structural basis, win definition ≥0 recommended, n-floor defaults horizon-relative, decay function, Minimum Shape N); frame grid when it ships; expectancy sanity |
| Tango | Report register; badge vocabulary; "End campaign" copy (dignity of abandoned); ledger/default-account labels; redirect surfacing copy; admin chrome |
| Echo | Control anatomy + container scaling; radar/slider; badge density; library segmentation |
| Mike | Family B on bounds/amendments/memory/badge queries; import name handling |
| Kilo | Every acceptance row as characterization, same change; celebrate-the-drift; spurious-state regressions |
| Delta | All gates, ternary, evidence |
| Lima | DL: window model + L4-removal supersession (reverses landed 103) + this restatement as v1.3; Trade Log Spec amendment cross-ref; Guide rides feature PRs (F1) |

## 15. Open dispositions

1. n-floor authority (Hotel floors members may raise, not lower — recommended) — carried
2. Restamp bulk vs single in v1 — carried
3. Size-floor probe exemption (recommend: band admits probes, no mechanism) — carried, surface-deferred with process clauses
4. Strategy-type witnessing phasing (recommend trails; unclassified-tolerant from day one) — carried
5. Frame grid launch scope (house styles × short/medium) — carried, arrives with §5.3 deferred items
6. ~~Sharpe v1~~ — **resolved: ships** as display control (Coach, six-controls direction); Hotel pins computation basis
7. ~~NULL-account migration binding~~ — **mooted** by L5 (charters account-free)
8. ~~Silent `is_default` books~~ — **resolved** in landed M-phases (became ledgers)

## 16. Document history

| Date | Note |
|------|------|
| 2026-08-09 | **§2.1 Campaign registry + badge** codified (registry = `member_practice_campaigns`; dispense vs forever wear; Trade Log mounts registry, does not own it). §9 expanded; companion → Trade Log Spec §17. Acceptance #24 registry-aware. |
| 2026-08-09 | **v1.3 — complete restatement.** Window model (L4 membership law; fill-time eligibility); Law-4-of-v1.1 removed (charters account-free; reverses migration 103 NOT NULL — Lima logs against landed work); exclusive membership + badge law; Trade Log passive-participant boundary pre-scoped (§9); prescribed panel + six controls + admin toggle folded as the v1 surface; Campaign Journey + Minimum Shape folded; dispositions 6–8 resolved/mooted. D6 still queued on vol OD. |
| 2026-08-08/09 | v1.0–v1.2 — model inversion; Two Roles; Campaign Journey §6a; superseded by this restatement |

---

*Three ideas: you direct a trade into a season, the season's window decides what it can accept, and the book each fill came from is a fact nothing can rewrite. The registry holds every season's badge; the Trade Log only dispenses and displays it — once worn, the badge stays. Around them: a contract you sign with yourself, a lab report with printed ranges, a radar whose shape means faithfulness, and a shelf where finished seasons become the story of you becoming a trader. Witnessed, never forced or graded.*
