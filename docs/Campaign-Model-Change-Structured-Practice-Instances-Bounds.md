# Campaign Model Change — Structured Practice, Instances, and Charter Bounds
## Consolidated model-change document (for Member Campaign Concept Spec vNext)

**Author:** Claude (advisor layer) — from Coach direction, 2026-08-08 (afternoon session)
**Status:** Coach-ratified model. **Formalized as product/architecture Spec (stamp-ready after review fixes F1–F3):**  
[`Specs/FatTail-Labs-Member-Campaign-Structured-Practice-Spec-v1.0.md`](../Specs/FatTail-Labs-Member-Campaign-Structured-Practice-Spec-v1.0.md)  
This docs note remains the advisor source narrative; the Spec is implementation/surgery authority for the model inversion. Supersedes specific sections of the Member Campaign Concept Spec v1.0 (enumerated in Spec §12 / here §9).  
**Review dispositions folded into Spec:** fill-time variance history stability (§5.4); import none→ledger / memory not used (§6, #15); expectancy cross-check (§7b); End-campaign copy on Tango gate.  
**Full agent bench plan:** [`docs/Campaign-Structured-Practice-Full-Agent-Bench-Plan-v1.0.md`](./Campaign-Structured-Practice-Full-Agent-Bench-Plan-v1.0.md)  
**Bench review A–C folded:** default-account genesis (Spec §2.1); journal stamp optional; hard term-gate audit.  
**Scale of change:** This is a **model inversion**, not a patch. The campaign moves from *optional structure over an unstructured stream* to *the structure practice is born into*. Every trade lives in a campaign from the first fill. Optionality moves up one level: members are no longer free to have no campaign; they are free to never think about campaigns.

---

## 0. The model in one paragraph

Practice begins structured: every member starts with a default account and a default campaign bound to it. Every trade is stamped to a campaign — but the decision is pre-answered by the member's last choice, so the default absorbs everything silently until the member wants structure. Campaigns are instances bound to exactly one account; designs travel across accounts, running instances never do. Names are unique across the member's entire practice, forever, archive included. Trades can be restamped between campaigns but never moved between accounts — campaigns are interpretation, accounts are fact. And the charter gains teeth: structured bounds — process clauses witnessed per fill, and the six performance attributes as blood-panel reference ranges witnessed per campaign — surfaced always, enforced never. The platform is the lab, never the doctor.

---

## 1. The Seven Laws

### Law 1 — Genesis: practice is born structured

- Account creation (including the member's first, at practice provision) **creates that account's default campaign** in the same act.
- The default campaign is **furniture, not contract**: see §2 (Ledger doctrine).
- Members create additional accounts and campaigns at will; each new account gets its own default campaign at creation (not lazily at first trade).

### Law 2 — Stamping: every trade chooses a campaign

- Logging a trade **requires** a campaign; there is no unstamped trade.
- The choice is **pre-answered**: it defaults to the last campaign the member chose (Law 3). Accepting the default is zero effort; the decision becomes visible work only when the member wants to redirect.
- A member who never engages with campaigns accumulates everything in the default, frictionlessly, forever. **Mandatory but frictionless** is the design invariant: the umpire survives because the required decision costs nothing.

### Law 3 — Memory: last pair wins, per account

- The system remembers the **last account↔campaign pair used**. Switching accounts recalls that account's last-chosen campaign.
- A new account with no history stamps to its own default campaign until the member deliberately redirects.
- The member's last deliberate choice is always the standing instruction. The platform never resets it, never guesses past it, never expires it.
- The remembered campaign is always one of **that account's own instances** (Law 4) — the memory cannot dangle across books.

### Law 4 — Instancing: one campaign, one account

- Every campaign instance is bound to **exactly one account**. `account_id` becomes **NOT NULL**. The unbound campaign is abolished.
- "Assigning" a campaign to another account (or again to the same account) **creates a new instance**: own id, own stamps, own lifecycle, own signature and amendments, own archive entry. Same design, separate contracts. No campaign row ever holds trades from two accounts.
- v1 instantiation is **copy, not link**: "assign to account X" pre-fills the create form from the source campaign's charter; the instances share a name family (Law 6 suffixes) and nothing structural. A formal lateral-lineage column (`template_campaign_id`) is a future OD if "show all instances of this design" is ever wanted.
- Contract-frame grounding: a mandate names its capital book. The Lab fractal: designs are reusable, deployments are singular.

### Law 5 — Provenance: trades move between campaigns, never between accounts

- **Restamping is legal**: a member may move trades from one campaign to another (within the same account — implied by Law 4, stated for clarity). Reorganizing your seasons is legitimate interpretation.
- **Account moves are impossible**: the account is where the fill physically happened. Campaigns are mutable meaning; accounts are immutable fact. You can rebind the story; you cannot rebind the history.
- Restamping across a signed campaign's boundary is an ordinary act (no amendment record — stamps are not charter fields), but the panel (Law 7) recomputes, and the weekly pivot sees the composition change.

### Law 6 — Name law: one namespace per member, forever

- Campaign IDs globally unique (as today). Campaign **names unique per identity, across all accounts and all statuses — open, paused, and archived alike**.
- Rationale (Coach): two archived campaigns with the same name is a permanent, uncleanable ambiguity — permanence makes weak naming compound. Archived names stay **reserved forever**.
- **Filesystem semantics** on every creation path (new, instantiate-to-account, Renew, import): collision auto-suffixes to the next free integer — "Q3 OTM Season" → "Q3 OTM Season (1)". Never reuse any name currently held anywhere in the member's history. Renames pass the same check (auto-suffix, consistent everywhere).
- **No exceptions**: genesis defaults get distinguishable names at birth (pattern: "Default — {account name}" or Tango's wording); Renew inherits the name and takes a suffix (the lineage chip carries the cycle relation; the name law stays exceptionless).
- Import: colliding names suffix on arrival, noted in the import report; export keys carry identity, so lineage never depends on names.
- Side benefit: the suffix is legible lateral lineage for free — "(1)" announces a sibling instance without a schema column.

### Law 7 — Bounds: the charter has teeth; the platform witnesses, the member enforces

Free-text goals impose no boundary; a contract whose clauses live only in prose is ceremonially binding and operationally void. The charter gains **structured, machine-readable bounds** in two layers.

**THE ALL-BANDS RULE (total, Coach 2026-08-08):** Every factor, both layers, expresses as a **range**. The model's vocabulary contains no maxes, mins, targets, or thresholds — one grammar: *declared range, member-set ends, either end open* (`range_low`/`range_high`, either nullable). A "max" is a range with an open floor; a "target" was always a range pretending to be a point. This is Kaufmann applied to every clause of the contract — big pants fit more butts: nobody can write a brittle point-optimized charter because the schema does not offer points. Declaring your practice means declaring zones you operate within, which is what a professional mandate looks like — no firm hands a trader "win rate: exactly 52%"; they hand corridors. Even naturally one-sided clauses are ranges with conventions (drawdown = open floor by default), and closing the "obvious" open end is itself a legitimate diagnostic — see the drawdown-floor and size-floor notes below.

#### 7a. Process clauses — witnessed per fill, at entry

Optional per campaign; a charter with none behaves as today. All ranges:

| Clause | Range semantics |
|--------|-----------------|
| Risk per trade | Currency, % of campaign capital, or R — the tranche clause. Ceiling usual; floor open by default |
| **Position size** | **% of trading capital deployed per trade, as a band (floor–ceiling).** The floor is the interesting half: undersizing is variance too — fear-sizing at 0.1% against a declared 1–2% truncates the payoff engine (the tail cannot pay for the misses if the tranches carrying it are vestigial; the self-funding body stops self-funding). Distinct from risk-per-trade (deployed ≠ at-risk; they nearly coincide for debit flies, diverge elsewhere — and seeing them as separate panel lines is itself course content). Denominator is a declared dimension (default: % of campaign starting capital) |
| Concurrent open trades | Integer range. A floor says "the system needs presence to work" — declaring 2–5 open flies declares the middle-body engine must actually be deployed |
| **Strategy scope** | Set-range over the existing playbook M2M: *these named systems and no others*. Witnessed **as declared** — checked against the member's playbook stamp; an unstamped trade reads "unstamped" (a distinct state, never silently passed as in-scope) |
| **Strategy-type scope** | Set-range over structure families (butterflies, verticals, condors, calendars…): *this class of geometry, regardless of playbook*. Witnessed **by derivation** from legs where confident (1-2-1 same-expiry = butterfly), **"unclassified"** where not (broken wings, partials, rolls) — member may classify; the witness never guesses silently. Hotel owns the taxonomy (what counts as a butterfly is doctrine, not code style) |
| **Asset-type scope** | Set-range over instrument classes (index options, equity options, ETFs, futures, futures options, shares…): *these markets*. Objectively witnessed from the fill |
| **Asset scope** | Set-range over specific underlyings (SPX, XSP, /ES…): *these tickers exactly*. Objectively witnessed from the fill |
| Trading window | `starts_at`/`ends_at` — the range that was always one. A fill outside the term is a variance, not an error |

The four scope tiers together are the charter's **Statement of Work** made structural (Charter architecture §4.0: "a setup outside this scope is explicitly banned from the campaign"): a member declaring "index options · butterflies · SPX + XSP · Classic OTM playbook" has written a fully-specified professional mandate. Each tier is independent; declare any subset.

**Witness posture (the law's core):** a breach is a **recorded variance, never a prevented act**. The trade always logs exactly as it happened — the log never lies about reality. The fill is stamped against bounds at entry (within-terms / variance, per clause, automatic); the member sees one quiet line at logging time ("outside charter: size 5 > max 3"), may annotate, and the moment passes without a modal wall. The weekly pivot's Variance Audit then **assembles itself**: contract said X, executed Y, here are the fills that stepped outside, dated, with the member's annotations. The umpire calls the play; the umpire never tackles the runner.

**Adherence gains a substrate:** self-reported followed/partial/broke now sits beside objective within-terms/variance. Subjective intent + objective fact, member-read together. Neither replaces the other; the platform still never judges.

#### 7b. Statistical signature — reference ranges, witnessed per campaign

The six performance attributes — **avg win/loss ratio · risk-to-reward · drawdown · Sharpe · win rate · profit factor** — are charter-attachable **reference ranges, blood-panel style** (Coach's model: the doctor's lab report). All ranges, per the all-bands rule:

- Each attribute declares a **normal range**, in a chosen **dimension of measure**: per trade or per campaign; $, %, or R; of peak vs of starting capital; rolling window vs since inception.
- The campaign's current reading renders as a **marker on the band** — in range / out of range. Out of range is **information, not intervention**: the lab doesn't stop you living at glucose 102; the interpreting physician — the member's professional self — decides what it means.
- **R:R is the style signature itself (Coach lock).** 9–18 and 20–50 are not tighter/looser versions of one strategy — they are different animals: 9–18 is the classic OTM fly in the 5–10% debit sweet spot (10% debit → 1:9 at the floor, 5% → 1:19 — the AMEX lore and the Kaufmann band, machine-readable in a charter); 20–50 is deep-OTM tail-hunting at 2–5% of width, different regime posture, different miss cadence, different psychology. P&L cannot reveal drift from one style into the other; the R:R band catches it immediately, both sides. Below band: overpaying debit, the fly degenerating toward ATM, convexity leaking. Above band: reaching further OTM than declared — evolving or chasing, either way not the system signed. **Measurement basis (Hotel pin): structural R:R at entry** (max payoff ÷ debit — a property of the position built, not of what the market later delivered), which makes it witnessable per-fill like a process clause while aggregating like a signature; it sits in both layers by design.
- **Win rate polices both betrayals (Coach lock).** The industry treats win rate as a maximization target — the high-win-rate frame this platform defines itself against. A band (e.g. 40–60% for the classic fly, honest about the ~50/50 tent entry) declares: *this system is not supposed to win often; it is supposed to win right.* **Below floor** past the n-floor: something real — entries off structure, regime outside the declared width band, thesis broken, contaminated execution; the honest "bring it to the weekly pivot" line. **Above ceiling** — the side only this doctrine polices: 85% against 40–60 is drift *toward the enemy's curve* — harvesting early, taking the sure body win, cutting the tail exposure that pays for everything, while the equity curve looks great and P&L applauds. The ceiling catches a trader quietly becoming a premium-seller inside a convexity charter — the one failure mode where feeling good is the symptom. **Hotel pins:** (1) win definition — one rule, recommend P&L ≥ 0 at close, no member config v1; (2) win rate converges slowest and swings hardest at small n — its default n-floor should be the highest of the six.
- **The bands cross-check (panel self-audit).** R:R and win rate banded together encode the expectancy geometry as a pair: "roughly half my entries miss cheaply; the ones that land pay 9× or better" — the self-funding-body argument as reference ranges. R:R in range + win rate in range + negative expectancy over a valid sample is arithmetically impossible — a member whose panel shows both green while bleeding has a *measurement* problem, not a system problem. The falsifiable fingerprint at full form.
- **Drawdown** is a range with an open floor by convention — but a member may close it: a drawdown floor reads "if this system isn't experiencing at least normal drawdown over a valid sample, I am probably not taking the declared risk" — under-risking detected from a second angle, independent of the size floor.
- **Doctrine reconciliation (§1 amendment):** these are not outcome promises — §1's "an outcome clause is void on its face" stands. A statistical clause is the **declared fingerprint of the system being run**, a falsifiable self-claim: *this system, faithfully executed, should show these ranges; hold my season against the claim.* When the fingerprint diverges over a valid sample, exactly two readings exist: execution drifted (check process clauses + adherence) or the thesis broke (invalidate, per the contract's own clause). Limits terminate; ranges falsify. Add to §1: *"Statistical clauses are expectations of the system, never promises of the member — they diagnose, they do not grade."*
- **n-floor (fasting status):** every signature attribute carries a minimum sample size before rendering as anything but **"gathering — n below reference validity."** A 12-trade win rate is not a fasting draw. The n-floor is itself a dimension of the bound (Hotel sets defaults per attribute; member may raise, not lower below Hotel's floor — **[open: or fully member-set? Coach disposition §10.3]**).
- **Three gating tiers (range vocabulary):** (1) **reference ranges** — informative, member-interpreted (most clauses, most of the time); (2) **member-designated critical range** — the charter may mark one range as its **Invalidation clause** (drawdown ceiling is the natural one); breaching it is the lab calling you at home: surfaced once, prominently — and per the standing lock, *the member executes the termination*, or amends, or annotates; never auto-abandon; (3) **platform gates — none, ever.**

#### 7c. Where the panel lives

- **Campaign detail** gains the **panel view**: each charter-attached attribute as a range bar with current marker — the blood-work grammar exactly.
- **Weekly pivot** reads the panel like periodic blood work: same panel, new draw, trend vs last draw.
- **Cycle compare**: this season's panel against the predecessor cycle's — the "Compare" affordance; member-read.
- Bounds are **charter fields**: signature freezes them; amendments record changes. Loosening max-size mid-drawdown is legal and recorded — and the pivot shows the amendment beside the breaches it retroactively blessed. Member-read, no platform commentary. The most honest mirror the platform holds.

---

## 2. Ledger doctrine — what the default campaign is

The genesis default cannot carry contract semantics the member never entered (D2's own logic: no fabricated signatures). Resolution:

| | Default campaign ("the ledger") | Member-created campaign ("a charter") |
|--|--------------------------------|----------------------------------------|
| Created by | The platform, at account creation (Law 1) | The member, deliberately |
| Signature | **Never signed** — no `signed_at`, no `signed_terms`, no amendments | Signs on first activation (existing §4.5 law) |
| Bounds | **None, by definition** — the ledger is not a contract | Optional process clauses + reference ranges (Law 7) |
| Lifecycle | Always active; **cannot** be completed, abandoned, paused, or renewed; not listed in Archive | Full lifecycle (§4.5) |
| Deletable | No (structural furniture); retires **with its account** | Permanence rules (§4.5.6) |
| Panel | No panel (nothing declared) | Panel per attached bounds |
| Purpose | Absorb unconsidered practice honestly | Bind a deliberate season |

**Account retirement** closes the ledger with the book: retiring an account archives its default campaign as part of the account, displayed as "Ledger — {account}" in history, not as a completed contract. The prior "silent book blocks clean retirement" problem dissolves: the ledger is never an *open contract* for the clean-retirement test — clean retirement = no open **member-created** campaigns.

**Umpire restated:** structure is always present; **deliberate structure is always optional.** The §1/§4.3 sentence "auto-creating a campaign would be signing the member's name for them" survives with one term sharpened: the platform provisions the **ledger** (unsigned, furniture); it never signs a **charter**. Signature remains the member's alone.

---

## 3. Superseded mechanisms (replaced by the Seven Laws)

| Old mechanism | Disposition |
|---------------|-------------|
| `is_default` flag + "ensure default book" on import Book-path | **Replaced** by genesis default (Law 1). Every account has its default from birth; import's "Book (default)" targets it directly; the ensure-helper and the flag's edge rules (clear-on-pause, at-most-one-active) retire |
| §4.7 multi-active prefill cascade (default → account-bound → most recent) | **Replaced** by last-pair memory (Law 3) — simpler and member-governed. §4.7's determinism requirement carries over: the memory is the rule |
| Unbound campaigns (`account_id NULL`), §4.2 story 5, S3 semantics | **Abolished** (Law 4). `account_id` NOT NULL |
| Unstamped trades as first-class (§4.2 story 6, §4.3 table, acceptance #1, #5's "without a campaign") | **Superseded** (Law 2). Every trade stamps; the ledger absorbs the unconsidered. §4.9's "unstamped trades are not a gate" becomes moot (there are none) |
| "No auto-create" absolutes (§4.3 Don't column, §8a account-provision row) | **Amended** per Ledger doctrine: provisioning the ledger at account creation is lawful furniture; signing remains member-only. **D3 (GET never creates) stands unchanged** — genesis is a creation-time act, not a navigation side-effect |
| Free-text-only goals | **Superseded** by Law 7 (`goals_md` remains for narrative; bounds are structured fields beside it) |

**Unchanged and reaffirmed:** signature/amendments/renewal (§4.5), Open/Archive library (§4.5.5, ledger excluded), permanence incl. D2 signature-is-permanence, name-carrying Renew, pack round-trip discipline, Goodhart wall (nothing here feeds Journey), OD-3.3 nudge budget, DL-257, Sacred #8.

---

## 4. Migration (honesty section)

| Item | Rule |
|------|------|
| Existing accounts | Each gains its genesis default ("Default — {account}" per Tango), flagged as ledger (column form = India's call) |
| Existing unstamped trades | **Swept into their account's ledger**, `stamped_by = 'migration'` — distinguishable from member choices forever; pivot and panel may include/exclude by member filter. Never silently indistinguishable from deliberate stamps |
| Existing `is_default` silent books | Coach disposition (§10.1): become the account's ledger (recommended — they already played the role), or remain member campaigns beside a fresh ledger |
| Duplicate names | Suffix by creation order — oldest keeps the clean name; noted per campaign in migration output |
| Campaigns with `account_id NULL` | Disposition (§10.2): bind to sole account where one exists; else to the unanimous account of their stamped trades; ambiguous remainder per Coach rule (candidate: default account + note) |
| Signature backfill | Unchanged from §4.5.7 + the terminal-row extension (bench-plan finding) |
| Bounds | All existing campaigns migrate with **zero bounds** — behavior identical to today. Panels appear only as members declare ranges |

---

## 5. Surfaces (delta)

| Surface | Change |
|---------|--------|
| Trade sheet | Campaign field always present, pre-filled by Law 3 memory; quiet variance line on out-of-bounds fills (7a); zero new required keystrokes on the happy path |
| Campaign library | Ledger pinned or visually distinct in Open (Echo); Archive unchanged (ledgers absent) |
| Campaign detail | + Bounds editor (charter section) · + Panel view (range bars, markers, "gathering" states) · ledger detail shows stamps/stats but no charter, panel, or lifecycle chrome |
| Create / instantiate | "Start from existing campaign" pre-fill path (Law 4); name field with live uniqueness + suffix preview (Law 6) |
| Restamp | Trade sheet / Trade Log affordance to move trades between same-account campaigns (Law 5); bulk vs single = Echo + §10.5 |
| Weekly pivot | Variance audit auto-assembled from 7a stamps; panel draw + trend vs last draw (7b); amendments displayed beside the variances they retroactively blessed |
| Retirement flow | Simplified per Ledger doctrine: open **member** campaigns surfaced; ledger closes with the book silently |

Copy rules (Tango): "outside charter," never "violation"; panel vocabulary in the clinical register — normal range, in range, out of range, gathering; ledger naming; no celebration or shame chrome on range states.

**Starting frames become doctrine transmission (Hotel-authored):** with the all-bands rule, frames ship complete style-true band-sets — and the catalog is a **two-axis grid: style × horizon (Coach lock)**. Short-, medium-, and long-term horizons demand different ranges of all seven attributes even within one style family: decay, win cadence, R:R geometry, drawdown texture, and size norms all shift with the time scale. Example cells: "Classic OTM Butterfly · Short-term: debit 5–10% of width · R:R 9–18 · win rate 40–60% · size 1–2% · DD ceiling 6%"; "Deep Tail · Medium: R:R 20–50 · …". The member picks a cell as their starting fingerprint and amends freely; the charter may record which frame seeded it (provenance, not classification). **No `horizon` schema taxonomy** — per the purpose-ladder precedent (frames now, open vocabulary by OD, closed enum only if forced), the ranges *are* the horizon; a column would duplicate what the bands already say. The 10% debit rule the AMEX traders taught becomes, decades later, a prefilled range in a member's contract.

**n-floors scale with horizon (Hotel pin, load-bearing):** a short-term charter accumulates n fast; a long-horizon campaign may log twenty trades a year — a flat n-floor of 100 renders its panel "gathering" forever, statistically correct and pedagogically useless. n-floor defaults (and rolling-window dimensions) are horizon-relative per frame cell: honest-and-high where data arrives fast, proportionate where it arrives slowly. What counts as a valid draw depends on the metabolism being measured.

---

## 6. Data model (delta, indicative — India refines)

- `member_practice_campaigns`: `account_id` → NOT NULL; + ledger marker (`is_ledger BOOL` or `kind ENUM('ledger','charter')` — India keep/kill); name uniqueness per identity (app-level check + supporting index; DB unique on (identity_id, title) if collation semantics acceptable)
- New `member_practice_campaign_bounds` (Family B): `campaign_id` FK · `attribute` (enum: process clauses + six stats) · dimension fields (unit, basis, window) · `range_low`/`range_high` (either nullable → one-sided allowed) · `is_critical BOOL` (at most one true per campaign — the Invalidation designation) · `n_floor` · timestamps. Bounds are **charter fields** → amendment rows on post-signature change
- Trade stamp provenance: + `stamped_by ENUM('member','memory','migration')` (memory = accepted default; member = explicit pick) — makes the deliberateness of structure itself visible evidence
- Per-fill variance stamps (7a): small table or derive-on-read — **derive-on-read preferred** if bounds lookups are cheap (no second truth); India keep/kill
- Last-pair memory: per (identity, account) → campaign_id; **server-side** (prefs or small table); survives devices
- Panel readings: **derived, never stored** (same law as cycle numbers); no stats cache without a keep/kill

---

## 7. Acceptance seeds (Delta-checkable; Grok expands)

1. New member: default account + ledger exist before first action; first trade logs with zero campaign keystrokes, stamped to ledger, `stamped_by='memory'`.
2. New account → own ledger at creation; first trade there stamps to that ledger absent contrary memory.
3. Explicit pick updates memory; account switch recalls that account's pair; memory survives re-login and device change.
4. No API path creates a trade without `campaign_id`; no API path moves a trade across accounts (4xx, fail loud); same-account restamp works.
5. Instantiate-to-account creates a new row (new id, empty stamps); source untouched; name suffixes.
6. Name collision on every path (create, rename, renew, instantiate, import) suffixes against the full namespace **including archived**; archived names never freed.
7. Ledger: cannot complete/abandon/pause/renew/delete (4xx); absent from Archive; never signed; retires with its account.
8. Bounds: fill outside any process range logs successfully + variance record + quiet line; no modal, no block. **Both sides record identically**: a fill below the size floor = variance exactly as one above the ceiling; structural R:R below floor and above ceiling both record. Panel renders in/out of range on both sides; below n-floor renders "gathering," no numbers styled as verdicts. Grep: no "max," "limit," "target," or "threshold" in member-facing bounds copy — range vocabulary only.
9. Critical value crossing surfaces once; no auto-status-change; complete/abandon/amend all available from the surfacing.
10. Nothing in Journey reads bounds, variance counts, panel readings, or range states (grep + score-input audit).
11. Migration: unstamped trades → ledger with `stamped_by='migration'`; duplicate names suffixed oldest-first; NULL `account_id` resolved per §10.2; zero data loss.
12. Export/import round-trips bounds, ledger flag, and stamp provenance; colliding import names suffix with report note.

---

## 8. Gates

| Gate | Jurisdiction |
|------|--------------|
| **India** | NOT NULL migration; ledger modeling; bounds table; derive-vs-store for variance and panel; memory storage; **structure-classification as-built check** (does leg-pattern detection exist, or is strategy-type witnessing new machinery — affects phasing); no second truth anywhere |
| **Hotel** (heavy — new jurisdiction) | The **style × horizon frame grid** (fingerprints are transmitted doctrine); band semantics that encode doctrine both sides (win-rate ceiling especially); **n-floor defaults, horizon-relative** (win rate highest); **R:R basis = structural at entry**; win definition (P&L ≥ 0 recommended); size-vs-risk clause distinction + denominator defaults; **structure-family taxonomy** for strategy-type scope; **whether Sharpe ships v1**; critical-range framing |
| **Tango** (heavy) | Mandatory-stamping copy (zero-friction, not surveillance); variance-line neutrality; panel clinical register; ledger naming; migration notices |
| **Echo** | Trade-sheet density; panel design; suffix preview; restamp UX |
| **Mike** | Family B on bounds/memory/stamps; import name handling |
| **Kilo** | §7 as characterization tests, same change |
| **Delta** | All gates; ternary; evidence |
| **Lima** | DL: model inversion + seven laws + ledger doctrine + supersessions; **major version bump (v2.0 candidate)**; Guide campaign-section rewrite rides feature PRs (F1) |

---

## 9. Spec surgery map (Concept Spec sections)

| Section | Action |
|---------|--------|
| §1 | + statistical-clause sentence; "signing the member's name" sharpened per Ledger doctrine |
| §4.2 stories | Rewrite: unbound story deleted; "no campaign at all" becomes "never thinks about campaigns"; new stories: instantiate-to-account, restamp, bounds declaration |
| §4.3 table | Rewrite per Laws 1–3 + Ledger doctrine (offer/force spirit survives; auto-create row amended) |
| §4.5 | Stands; + ledger exclusions; Renew name-suffix note |
| §4.5.5 | + ledger presentation (pinned/distinct; absent from Archive) |
| §4.6 schema | Law 4/6/7 columns + bounds table |
| §4.7 | **Replaced** by Law 3 memory |
| §4.8/§4.11 | Book-path targets genesis ledger; name-collision clause; bounds + provenance in pack |
| §4.9 | Simplified: clean = no open **member-created** campaigns |
| §7 non-goals | + platform gating of trades (never); + stats cache without keep/kill |
| §8 acceptance | #1/#5 rewritten; §7 seeds merged and renumbered |

## 10. Open dispositions (Coach's word before Grok finalizes)

1. **Existing silent `is_default` books:** become the account's ledger (recommended — they already played the role), or remain member campaigns beside a fresh ledger?
2. **NULL-account campaigns at migration:** unanimous-trades binding acceptable? Fallback rule for the ambiguous remainder?
3. **n-floor authority:** Hotel floors that members may raise but not lower (recommended), or fully member-set?
4. **Sharpe in v1:** Hotel's call, but state a conviction if you have one (my read: defer — five honest attributes beat six with a hand-wave).
5. **Restamp scope v1:** single-trade only, or bulk?
6. **Size-floor probe exemption:** the five-stage Blueprint's stage-1 recon tranche is deliberately undersized — a Blueprint charter shows constant floor-variance on every probe unless (a) the member sets the floor to admit probes (recommended v1 — no mechanism), or (b) fills can be tagged probe and the panel reads accordingly (future OD if Blueprint charters become common).
7. **Frame grid scope v1:** how many style × horizon cells ship at launch? (Hotel authors; recommend starting with the house styles × short/medium — a sparse honest grid beats a full speculative one.)
8. **Strategy-type scope phasing:** if leg-pattern classification is new machinery (India's as-built check), does strategy-type witnessing ship v1 alongside the other three scope tiers, or trail by a phase? (Recommend: trail rather than hold the objectively-witnessable tiers hostage; the clause can exist unclassified-tolerant from day one.)

---

*Nothing from today's earlier work is undone: signature, amendments, cycles, archive, permanence, and the umpire all stand — this model gives them the structured practice and the teeth they were waiting for. Every superseded mechanism is enumerated in §3/§9; nothing is removed silently.*
