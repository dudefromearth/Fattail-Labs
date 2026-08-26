# FatTail Labs — Trade Log Autofilter Spec v0.1.1

**Canonical filename:** `Specs/FatTail-Labs-Trade-Log-Autofilter-Spec-v0_1_1.md`  
**Supersedes:** `FatTail-Labs-Trade-Log-Autofilter-Spec-v0_1.md` (kept on disk as history)

| | |
|---|---|
| Status | **BUILD AUTHORITY** — shipped (TLAF2-G · TLAF3-G · **DL-584** · **DL-586**) |
| Date | 2026-08-25 |
| Relationship | Narrow slice of parked `FatTail-Labs-Autofilter-Spec-v0_2.md`. **This Trade Log slice is the active Autofilter program.** Parent v0.2 (journal, records, six extra columns) is **parked** — not the next GO |

**Scope statement.** Active program: Trade Log Autofilter. Surfaces: **the Trade Log
only**, plus the **Practice nav bar** where the date filter currently sits (omit on
Trade Log only — O1), plus **Campaign** as the extract source. Touches outside
program: **NONE**.

Records and the journal are **not in this slice**. They come later, against the same
component, with no rework — only when Coach names that program.

**Nature of the change.** Read-only. Filters what is already loaded. No schema change,
no migration, nothing persists to the server.

---

## 1. What ships

**One Autofilter control on the Trade Log title bar.** Not a row of chips, not a
sidebar — a single control in the title bar that opens the filter surface.

**Every button it replaces is removed in the same change**, including the date filters
under the Practice nav bar **on Trade Log**.

---

## 2. What is removed

| Control | Where | Disposition |
|---|---|---|
| Date filter | **Under the Practice nav bar** | **Omitted on Trade Log only** (O1) |
| Campaign filter | Trade Log toolbar (`blotter-campaign-filter`) | **Removed** |
| Open:N chip | Trade Log title row | **Removed** (O2) |

**Removed, not hidden or deprecated.**

**One cut.** The removal ships in the same change that mounts Autofilter. A window
where both exist is a defect, not a transition — it does not become acceptable by
being temporary.

**Coach question (kept):** the date control under the Practice nav bar may be shared
chrome serving Journal and other Practice surfaces, not Trade Log alone. If it is
shared, removing it affects surfaces outside this slice. **Report before removing.**

**Closed — O1 (Coach DL-584).** The control **is shared**. Mechanic: omit date **and**
campaign on Trade Log only (`omitDateCampaignFilters` on `PracticeSuiteChrome`). Do
not delete `practice-granularity` / `practice-campaign-select` from Journal, Reports,
Retrospective, or Playbook. Account picker stays. After the cut, Practice-context
date/campaign must not still filter Trade Log rows (one stream).

---

## 3. Columns in this slice

Deliberately fewer than the full design. These replace both removed buttons and prove
the pattern.

| Column | Filter type | Replaces |
|---|---|---|
| Exec time | Date | **the date filter** |
| Campaign | Value list | **the campaign filter** |
| Symbol | Value list | — |
| Status | Value list — Open · Complete · Orphan close | Open:N (removed) |

**Deferred to a later slice**, no redesign required to add them: Strategy, Account,
Expiry, Right, Entry source, Adherence.

---

## 4. The component

**Extract from Campaign. Do not rewrite.** It works; the job is making it reusable.

Even for one surface, **build it as the shared component** — column definitions in,
one filtered stream out, nothing Trade-Log-specific inside. Records and the journal
mount it later without rework **when Coach names that slice**.

Building it in place would be the fourth hand-rolled copy. The Trade Log already
carries two independent side panels for want of a shared one (Echo E-1).

**As-built:** `web/lib/autofilter/` (engine) · `web/components/autofilter/` (menus).
Host column readers: `web/lib/tradeLogAutofilter.ts`. Find and Badge consumes the
same menus.

---

## 5. Trade Log specifics

**The blotter is block-grouped** — one trade is one block, shared meta on the first
row. The filter operates on **trades, not rows**. A leg-level match returns the whole
block; a partial block would misrepresent the trade.

**The `Open:N` chip** is Status filtered to Open.

**Coach question (kept):** remove it, or keep it? If it stays it must be **identical**
to the column filter — same state object, same clear path, same contribution to
`shown/total`. A chip driving its own private filter is the second mechanism this spec
exists to remove, and worse than the button because it looks like a shortcut.

**Closed — O2 (Coach DL-584).** **Remove.** Status=Open is the column. `filterOpenOnly`
is gone. **`Select opens`** remains a selection tool for bulk trash, not a filter.

---

## 6. Campaign badge routing — binding

Campaign Spec v1.3 §9.2:

> tap filters the blotter to that campaign — **one filter system** (badge as entry
> point to the existing campaign filter; no second mechanism)

The badge on a blotter row is already an entry point into the campaign filter. When
that filter becomes a column, **the badge tap sets the campaign column's filter** — it
does not drive anything of its own.

Easy to miss: the control being replaced is not the control being tapped.

§9.2 also notes composition with the Adhere locate view. **Whatever composition exists
today must survive.** As-built: `?campaign=` uses the same `campaignColumnFilter`
identity. Journey Adhere locate (`adherence_mode` / `from_day` / `to_day`) remains a
locate on the fetch, not a standing Autofilter.

---

## 7. Behaviour

**Composition.** AND across columns, OR within a column. Excel behaviour.

**Filtered-state visibility.** Show `shown/total` and a "Filter on" indicator, matching
the treatment already used on Strategy Lab's dashboard. Members lose track of active
filters and conclude data is missing.

**Conflicting selections fail loud.** A genuinely contradictory combination —
mutually exclusive values, a date range that cannot contain the selected rows —
**disallows the choice and says why**. Invariant #2 applied to the UI: no silent empty
state standing in for a broken combination.

**Empty-but-valid is different.** A legitimate combination matching nothing says so
plainly and offers to clear. The distinction is whether the combination *could* have
matched.

**Coach question (kept):** disallow at selection time, or fail loud on apply?

**Closed — O3 (Coach DL-584).** **Select-time** — conflicting values grey out and
explain (`selectionGate` + `dateVsWindowsConflict`).

**Persistence.** If filters persist across reload they get **their own named key and a
visible control** — never silently merged into `ft.tradeLog.lastUsed.v1`. A filter the
member cannot see and did not knowingly set is the "where did my data go" failure with
no way to recover.

**Coach question (kept):** persist, or start clean each visit?

**Closed — O4 (Coach DL-584).** **Clean visit.** No Autofilter persist API. Never
`ft.tradeLog.lastUsed.v1`.

---

## 8. Design

Apple HIG. Match how Autofilter already looks and behaves in Campaign. Title-bar
launcher ≥44 pt; column menus match Find and Badge.

---

## 9. Out of scope

Records. The journal. The list-versus-calendar-boxes toggle. Sorting. Saved filter
sets. Server-side filtering. The six deferred columns. Any surface not named in the
scope statement. Playbook blotter `<select>` (stays; not named for removal).

---

## 10. Acceptance

| # | Case | Expect |
|---|---|---|
| A1 | Load the Trade Log | Autofilter control **on the title bar** |
| A2 | Load the Trade Log | **No campaign filter button** |
| A3 | Load Trade Log | **No date/campaign under the Practice nav** (O1). Journal / Reports / Retro / Playbook still show that chrome |
| A4 | Filter by symbol | Whole trade blocks, never partial |
| A5 | Tap a campaign badge on a row | Sets the **campaign column filter** — not a separate mechanism. `?campaign=` same identity |
| A6 | Campaign filter + Adhere locate view | Composition preserved |
| A7 | Contradictory selection | **Fails loud**, names the conflict (select-time) |
| A8 | Valid selection matching nothing | Says nothing matched, offers to clear — not an error |
| A9 | Filter active | `shown/total` and "Filter on" visible |
| A10 | `Open:N` | **N/A** — removed (O2). Status=Open is the column |
| A11 | Any commit | Never both mechanisms at once |
| A12 | Inspect the component | Column definitions in, one filtered stream out, nothing Trade-Log-specific inside |

---

## 11. Closed items (were OPEN in v0.1)

Coach questions remain in §§2, 5, 7. Answers:

| # | Item | Answer | DL |
|---|---|---|---|
| O1 | Is the date control under the Practice nav bar shared? | **Yes, shared.** Omit date+campaign **on Trade Log only** | DL-584 |
| O2 | `Open:N` chip — remove, or keep under the identity rule? | **Remove** | DL-584 |
| O3 | Conflicts — select-time or apply-time? | **Select-time** | DL-584 |
| O4 | Do filters persist across reloads? | **Clean visit** | DL-584 |

This table is closed. It is not a standing OPEN list.

---

## 12. As-built (TLAF4)

| Piece | Path |
|---|---|
| Engine | `web/lib/autofilter/` |
| Menus | `web/components/autofilter/` |
| Trade Log columns | `web/lib/tradeLogAutofilter.ts` |
| Title bar | `web/components/trade-log/TradeLogAutofilterBar.tsx` on `TradeLogTable` Trade history row |
| Omit seam | `PracticeSuiteChrome` `omitDateCampaignFilters` — Trade Log page only |
| Help | `server/help_reference/trade-log-autofilter.md` (**DL-585**) |
| Find and Badge | still consumes extract; not rewritten |

Architecture note: [`Architecture/15-trade-log-manual-management.md`](../Architecture/15-trade-log-manual-management.md) §5.4.

---

## Changelog v0.1 → v0.1.1

Record O1–O4 in the body (Coach questions kept, labeled Closed). Header DRAFT →
**BUILD AUTHORITY**. A3/A10 match O1/O2. As-built paths. Parent Autofilter v0.2 named
**parked**. No Coach text deleted.
