# Autofilter — Design Proposal

**Advisor draft. Coach names the spec file and version if this becomes one.**

**Scope, named by Coach:** the Trade Log, records, and the journal. Campaign is the
source of the working implementation. Nothing outside those four.

---

## 1. What it is

Excel-style Autofilter, already working in Campaign. Each column header carries a
filter control; opening it shows the distinct values present in that column; the
member ticks the ones they want and the table filters in place.

Read-only. It filters what is already loaded. Nothing mutates, nothing persists to
the server, no schema change.

**It replaces the date and campaign filter buttons that sit under the nav** on each
of the named surfaces. Those become column filters like any other.

---

## 2. Why the buttons go

The current filter row is a second mechanism sitting above a table that already has
columns for the same data. A member filtering by campaign uses a button; a member
filtering by symbol has no way at all. Autofilter makes every column filterable by
the same gesture and removes the special-cased two.

**One filter system.** This matters more than tidiness — see §5.

---

## 3. Trade Log

The blotter is block-grouped (one trade = one block, shared meta on the first row),
so the filter operates on **trades**, not rows. Filtering by leg-level fields
returns the whole block.

Proposed filterable columns:

| Column | Filter type | Notes |
|---|---|---|
| Exec time | Date | **Replaces the date button** |
| Campaign | Value list | **Replaces the campaign button** — see §5 |
| Strategy | Value list | From the catalog |
| Status | Value list | Open · Complete · Orphan close |
| Symbol | Value list | Underlier / ticker / root / pair |
| Account | Value list | |
| Expiry | Date | Option rows |
| Right | Value list | Put / Call |
| Entry source | Value list | Manual · Import · Automated |
| Adherence | Value list | followed · partial · broke · unknown |

**Existing chrome that overlaps.** The blotter carries an `Open:N` filter chip today.
Under this design that is the Status column filtered to Open. **OPEN — Coach:** does
the chip stay as a shortcut, or go? Keeping it is a second mechanism; removing it
costs a one-tap affordance that members use.

`Select opens` for bulk trash is a selection tool, not a filter, and is untouched.

---

## 4. Journal

The journal shares `adherence` with the Trade Log and carries an optional campaign
stamp. Proposed columns: date, campaign, adherence, and whatever else the journal
table currently renders.

**Journal campaign stamping is optional** — some entries have no campaign. The filter
list needs a **(none)** value so those are reachable rather than invisible when a
campaign filter is on. Same for any nullable column.

---

## 5. The campaign filter — a real constraint

Campaign Spec v1.3 §9.2 is explicit:

> tap filters the blotter to that campaign — **one filter system** (badge as entry
> point to the existing campaign filter; no second mechanism)

So the campaign badge on a blotter row is already an entry point into the campaign
filter. If Autofilter replaces that filter, **the badge tap must route into
Autofilter** — setting the campaign column's filter to that value — rather than
driving something of its own.

Getting this wrong recreates exactly what §9.2 forbids: two mechanisms filtering the
same thing. Worth naming in the build packet, because it is easy to miss when the
button being replaced is not the thing doing the tapping.

The same section notes the campaign filter composes with the Adhere locate view.
Whatever composition exists today has to survive.

---

## 6. Records

**OPEN — Coach:** which surface. "Records" in the Practice group is not a name I can
resolve confidently against the specs, and naming the wrong one wastes a build packet.
The pattern below applies to it regardless of which it is.

---

## 7. One component

**Extract from Campaign, do not rewrite.** It works; the job is making it reusable.

The component takes a column definition — field, label, filter type (value list or
date), and how to read the value off a row — and owns the rest: distinct-value
collection, the dropdown, filter state, and the filtered result.

Each surface supplies its own column definitions. Nothing surface-specific lives
inside the component.

**Trade Log already carries two hand-rolled side panels** because a shared component
was skipped once (Echo E-1: `TradeSheet.tsx` and `ImportSheet.tsx` are independent
copies with no `Drawer.tsx` anywhere in the repo). Four copies of Autofilter would be
the same mistake at twice the scale.

---

## 8. Behaviour worth stating

**Filtered-state visibility.** Strategy Lab's dashboard already solves this — it shows
`shown/total` and an amber "Filter on" indicator. Members lose track of active filters
and conclude data is missing. Worth carrying the same treatment here.

**Composition.** Filters across columns are AND. Values within one column are OR.
Standard Excel behaviour and what members will expect.

**Persistence.** The Trade Log already stores UI preference in localStorage under
`ft.tradeLog.lastUsed.v1`. **OPEN — Coach:** does a filter survive a page reload, or
start clean each visit? Both defensible; sticky filters are a common source of "where
did my data go."

**Empty result.** A filter combination matching nothing should say so plainly and
offer to clear, not render an empty table.

---

## 9. Out of scope

Sorting. Saved filter sets. Server-side filtering for large logs. Any surface not
named in §1.

---

## 10. Open items

| # | Item | § |
|---|---|---|
| 1 | Which surface is "records" | 6 |
| 2 | Does the `Open:N` chip stay as a shortcut, or go? | 3 |
| 3 | Do filters persist across reloads? | 8 |
