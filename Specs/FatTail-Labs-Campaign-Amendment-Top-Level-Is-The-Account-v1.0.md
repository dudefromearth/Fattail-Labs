# FatTail Labs — Campaign Amendment v1.0  
## The top level is the account (ledger abolition)

**Status:** DRAFT — Coach-dictated 2026-08-09; for bench review, decision-log supersession, and reversal seeds  
**Amends / targets:** [Member Campaign Spec v1.3](./FatTail-Labs-Member-Campaign-Spec-v1_3.md) → intended fold into **v1.4**  
**Companions:**  
- [Capital Spec v0.3](./FatTail-Labs-Capital-and-Position-Sizing-Spec-v0.3.md) — fungibility, funding composition  
- [Trade Log Spec v1.1](./FatTail-Labs-Trade-Log-Spec-v1.1.md) §17 — badge host (undirected = no chip)  
**Source proposal:** [`docs/Campaign-Amendment-Top-Level-Is-The-Account.md`](../docs/Campaign-Amendment-Top-Level-Is-The-Account.md)  
**Review:** Advisor review 2026-08-09 (A-1…A-5) folded  

**⚠️ Supersession flag:** This is a **removal and partial reverse of landed doctrine and migrations**, not a refinement. Operating rule: reverse openly — decision-log entry, reversal seeds, Kilo characterization. Do not soft-pedal.

---

## 0. Mission (Coach terms)

The main account does **not** need a top-level campaign. **It is the top level.** It has no stated goals; it is what it is. Members arrive mid-life with existing books and mess — we cannot require them to define structure up front.

Trading within an account is whatever they choose. **The Journey** (lifelong process standing) helps them stay on track. They **may** create deliberate campaigns and allocate capital as they see fit — wrap one account, wrap many, or proportion capital (Capital Spec) — or leave everything undirected.

**Fungibility principle:** accounts are fungible sources until the user organizes them for specific purposes. Until then, **nothing is imposed**.

### 0.1 Coach restatement — window, stamp, terms, allocate (2026-08-15)

Captured verbatim in spirit; nothing dropped:

> The campaign structure is like a time-based window that provides a view into
> the total trade log, but only trades tagged with the campaign will show, the
> rest get filtered. A trade can only be associated with one campaign or no
> campaigns. This allows us to create a view and do reports of campaigns. We
> can dictate the terms of a campaign, like what we can trade and position size
> and max drawdown. The system doesn't apply these as gating factors, it simply
> reports relative to these factors and warns when you exceed the factors. The
> trader needs a way to search and select and manage which campaign trades are
> allocated to.

| Law | Meaning |
|-----|---------|
| **Window view** | Campaign = time window + stamp filter on the **total** book |
| **One or none** | A trade wears **one** campaign or **no** campaign (not many) |
| **Reports** | Campaign reports are that filtered view |
| **Terms are witnesses** | Allowed methods, size, max DD — report and **warn**, never gate |
| **Allocate** | Member searches, selects, and manages the stamp |

**Law (Coach 2026-08-15):** A **book** is one-for-one the contents of an
**account**. A campaign is a badge, not a book. Confusion here is a product
failure.

**As-built:** **Find and Badge** lives on the **Campaigns main page**
(`/app/practice/campaign#find-badge`). AutoFilter off until selected;
clear-before-assign; five undos. A fill **outside the campaign window is
rejected** — no badge. The **found set** is named (first day → last day · N
positions). The table pages 50. A single campaign page lists **only trades
wearing that badge**. It is not a search surface.

---

## 1. What is removed

| Removed | Was (v1.3 / as-built) |
|---------|------------------------|
| **Ledger campaign** | Every account born with a default “furniture” campaign (`is_ledger`) |
| **Genesis ledger creation** | Law 1: account create → ledger in the same act |
| **Silent ledger fallback** | Law 3: ineligible memory → account ledger |
| **Ledger rows in campaign registry** | `is_ledger` furniture registered as a stampable badge |
| **Mandatory campaign stamp** | Every trade required a `practice_campaign_id` (resolved to ledger) |

**Replacement:** undirected trades carry **no campaign at all** (`practice_campaign_id` null). Resting state is genuinely unstructured — not “structured by a default object pretending not to be structure.” Memory’s fallback is **no pre-answer** (undirected). Registry carries **deliberate campaigns only**.

---

## 2. What is unchanged

| Area | Status |
|------|--------|
| **Direction = stamp** | Still the deliberate membership act; memory may pre-answer when eligible |
| **Window eligibility (L4)** | Fill time must fall in campaign window to stamp |
| **Account freedom (L5)** | Directed fills may come from any account; charters unbound |
| **Exclusive membership (L6)** | One stamp when directed; redirect moves; legs inherit |
| **Name law (L7)** | Uniqueness forever (no ledger naming exception) |
| **Bounds / six controls / panel** | Deliberate charters only |
| **Journey (lifelong)** | Process witness for **all** trading — directed or not. With ledger gone, Journey is the *only* standing structure over undirected trading — its correct role |
| **Campaign Journey radar (season)** | **LOCKED — Coach 2026-08-09 (§2.1).** Present-state only on deliberate charters. Time scrub / as-of-T history **cut** (not deferred). |
| **Prescribed six controls (panel strips)** | Unchanged — always ship with deliberate charters; independent of radar history cut |
| **Account immutability on fills** | Unchanged |

### 2.1 Campaign Journey radar — disposition **LOCKED** (Coach, 2026-08-09)

**Coach clarification (2026-08-09):**

> The radar ships **present-state only** on deliberate charters. The lifetime time slider and all **as-of-T historical rendering are cut (not deferred)**. Static shape renders current standing against declared bounds; band-alignment and n-floor rules unchanged. Supersedes the interim full-deferral posture recorded in Amendment v1.0.1 §2.1. Resolves Advisor finding **A-1**; Amendment acceptance **#10** satisfied on this entry.

| Element | Ship? |
|---------|--------|
| Radar on **deliberate charters** | **Yes** — present standing only |
| Axes = declared panel (six controls); band-alignment; n-floor / gathering | **Yes** — unchanged |
| Minimum Shape rule | **Yes** — unchanged |
| Lifetime time slider / scrub T0→present | **Cut** — not parked for later ship as product law |
| as-of-T historical shape replay | **Cut** |
| Ledger / undirected book radar | **No** — no radar without a deliberate charter |
| Six-control blood-work strips | **Yes** — independent of scrub cut |

**Supersedes:** Advisor interim **D-Full-defer** posture in v1.0.1 §2.1.  
**Lima:** record decision-log entry (radar present-only; scrub cut not deferred).

---

## 3. Laws (v1.4 targets — supersede v1.3 where conflicting)

| ID | v1.3 | v1.4 (this amendment) |
|----|------|------------------------|
| **L1 Genesis** | Account → ledger campaign | Account birth creates **account only**. No campaign. First Practice touch still provisions default **account** (book), not a campaign. |
| **L2 Direction** | Every trade stamps exactly one campaign | Every **directed** trade stamps exactly one campaign. **Undirected trades are lawful** and permanent until the member directs (or redirects). |
| **L3 Memory** | Ineligible → ledger | Ineligible remembered campaign → **clear pre-answer** (offer undirected / empty). Never invent a fallback campaign object. |
| **L4 Window** | Unchanged | Unchanged |
| **L5 Account freedom** | Unchanged | Unchanged; plus **funding composition** is capital-only (Capital Spec) — wrap ≠ stamp |
| **L6 Exclusive membership** | One badge | At most one badge. Undirected = **zero badges**. No ledger chip. |
| **L7 Name law** | Includes ledgers | Deliberate **member-named** campaigns only; uniqueness forever for those names. **Furniture titles** (`Default — …`, `Primary book`, system genesis labels) are **not** member-named — when furniture rows are disposed, those titles are **freed** unless India finds an export_key still referencing them (Advisor A-4) |
| **L8 Bounds** | Charters | Unchanged for deliberate charters |

### 3.1 The account is the top level

Replace Campaign Spec §3 **Ledger doctrine** with:

> The **account** is the top level of the trading book. It has no campaign goals, no panel, no signature. Undirected practice lives on the account alone. Deliberate seasons (campaigns) are optional organization of direction and capital. Structure is always *available*; deliberate structure is never *imposed*.

---

## 4. Registry and Trade Log

### 4.1 Registry

- Only **deliberate** campaigns (`is_ledger` removed from product vocabulary and stamp eligibility).  
- Create campaign → registry row for badge dispense (window meta unchanged).  
- No “always offer ledger” rule.

### 4.2 Trade Log passive host

| Surface | Behavior |
|---------|----------|
| Blotter badge | Empty when undirected; one chip when stamped |
| Picker | Eligible deliberate campaigns **or** empty / “No campaign” |
| Filter | “Undirected” / unaffiliated-campaign filter alongside named campaigns |
| Import | Unchosen → **null stamp** (not ledger) |
| Redirect | Explicit stamp move only |

Amend Trade Log Spec §17 accordingly when this amendment ratifies.

---

## 5. Funding composition (pointer)

Capital wrap / multi-account / proportion lives in **Capital Spec v0.3** Ring 2. Normative here:

- Wrapping is **capital-sourcing**, never direction.  
- A fill from a wrapped account is undirected until stamped.  
- Overcommit witnesses can name source accounts (Capital Spec).

---

## 6. Reversal accounting (prominent)

| Landed | Action |
|--------|--------|
| Migrations **102–104** (ledger marker, ensure ledgers, defaults) | **Reverse ledger portion**: stop genesis ledger creation; disposition existing `is_ledger` rows |
| Domain `ensure_ledger_campaign` / list ensure | Remove from account-create and list-GET paths |
| `resolve_trade_campaign_id` ledger fallback | Null / no campaign when no explicit or eligible memory |
| Trade create requiring campaign resolve | Allow null stamp; do not invent furniture |
| Panel / reports “ledger = full book” filters | Re-express as account scope or undirected filter — India |
| Heal / backfill scripts that promote seasons to ledger | Stop; reverse mis-flags per disposition |

**Disposition options for existing ledger rows (India/Lima propose, Coach pick):**

| Option | Trades stamped to ledger | Ledger row |
|--------|--------------------------|------------|
| **A — Unstamp** | Set `practice_campaign_id` **null**; set `stamped_by` **null** (no stamper without a stamp — Advisor A-3). Migration attribution lives in seed log / DL, not on the row | **Soft-delete / tombstone by default** (preserve `export_key` lineage). Hard-delete only if India **proves** zero pack/export references (Advisor A-2) |
| **B — Tombstone** | Unstamp as A | Keep row non-stampable; export keys retained |
| **C — Promote** | Only if row is actually a member-named season mis-flagged | Convert to charter, clear is_ledger |

**Default recommendation for pure furniture titles** (`Default — …`, `Primary book`, `My first campaign` as sole book home): **Option A with soft-delete**.

Stamp and memory tables/machinery **survive** for deliberate campaigns.

---

## 7. Spec / code touch map (implementation later)

| Area | Touch |
|------|--------|
| Campaign Spec v1.3 | Laws L1–L3,L6–L7; §3 ledger table; §2.1 registry diagram; acceptance #1–2 |
| Capital Spec | v0.3 fungibility; no ledger capital home |
| Trade Log Spec §17 | Null stamp; empty badge; import unchosen → null |
| `practice_spine_domain` | Remove ensure-ledger on account create; resolve without ledger |
| `routes/trade_log` | Allow null campaign; analytics “full book” ≠ ledger id |
| UI | Campaign pickers, blotter badge empty, library no ledger pin |
| Tests | Undirected resting state; memory no-fallback; no genesis ledger |

---

## 8. Acceptance (post-ratification)

1. New account create produces **zero** campaign rows.  
2. Trade create with no campaign field → `practice_campaign_id` null; HTTP 200.  
3. Memory of expired **deliberate** campaign → next trade undirected (null), not another object.  
4. Memory of **deleted furniture ledger** (post-Option-A) → next trade undirected, **no error** (Advisor A-5).  
5. Registry list contains no stampable `is_ledger` furniture.  
6. Blotter shows no badge chip for undirected rows.  
7. Existing furniture ledger stamps migrated per Coach disposition; Kilo pack green.  
8. Wrap (when Capital ships) does not auto-stamp.  
9. Journey (lifelong) still works with undirected-only books.  
10. ~~Coach radar disposition~~ — **SATISFIED** (Coach 2026-08-09 §2.1): present-only radar ships; scrub/as-of-T cut. Lima logs the entry.  

---

## 9. Gates

| Gate | Holder | Question |
|------|--------|----------|
| Architecture | **India** | Ledger disposition; FK/export_key; resolve path; analytics without ledger |
| Doctrine / copy | **Hotel · Tango** | “Undirected” lawful and neutral — never deficiency shame |
| Tests | **Kilo** | §§8.1–8.6; celebrate-the-drift unaffected |
| Decision log | **Lima** | Supersession of ledger doctrine **same day** as ratification |
| Trade Log | **Charlie · Alpha** | Badge empty; picker empty; import null |

---

## 10. Non-goals

- Removing deliberate campaigns, panel, or window model  
- Removing accounts or capital hierarchy  
- Auto-directing undirected trades into any synthetic season  
- Judging undirected volume as bad process  

---

## 11. Document history

| Version | Date | Change |
|---------|------|--------|
| **v1.0.2** | 2026-08-09 | **Coach A-1 resolve:** radar ships present-state only on deliberate charters; lifetime slider and as-of-T history **cut (not deferred)**; band-alignment / n-floor unchanged. Supersedes v1.0.1 full-deferral posture. Acceptance #10 satisfied. |
| **v1.0.1** | 2026-08-09 | Advisor A-1…A-5: radar disposition governance flag (Coach only); Option A soft-delete default; stamped_by null on unstamp; name law frees furniture titles; memory of deleted furniture; acceptance #4/#10. |
| **v1.0** | 2026-08-09 | Formal amendment Spec from Coach “top level is the account” dictation: abolish ledger furniture; undirected null stamp; memory no-fallback; registry deliberate-only; reversal accounting for migrations 102–104. |

---

*The account is the book. A campaign is a season you choose to write in the margin — never a blank form the platform already filled out for you.*
