# FatTail Labs — Autofilter Spec v0.1

**Provisional filename and version. Coach names the real ones.**

| | |
|---|---|
| Status | DRAFT — advisor spec. Bench review not yet run |
| Date | 2026-08-25 |
| Type | Product / UX — shared filter component across Practice surfaces |

**Scope statement.** Active program: Autofilter. Surfaces named by Coach: **the Trade
Log, records, and the journal**, plus **Campaign** as the source of the working
implementation. Touches outside program: **NONE**. Applying this component to any
surface not named above requires Coach's direction — that is the scope-drift case
DL-539 exists for.

**Nature of the change.** Read-only. It filters what is already loaded. Nothing
mutates, nothing persists to the server, no schema change, no migration.

---

## 1. What it is

Excel-style Autofilter, already working in Campaign. Each column header carries a
filter control. Opening it lists the distinct values present in that column. The
member ticks the ones they want; the table filters in place.

---

## 2. The existing controls are removed

**The date and campaign filter buttons under the nav are deleted from every named
surface.** Not hidden, not deprecated, not kept as a shortcut. Removed.

They become column filters like any other.

**Why removal and not coexistence.** Two mechanisms filtering the same data is the
condition this spec exists to end. Campaign Spec v1.3 §9.2 already states the rule for
campaign specifically — "one filter system... no second mechanism." Keeping the buttons
alongside Autofilter would violate it directly, and would leave a member with two
controls that can disagree about what is filtered.

The buttons also filter only two dimensions. A member wanting to see one symbol, or
one strategy, or every trade where adherence was `broke`, has no control at all today.

### 2.1 What must be true when this ships

- No date button and no campaign button on any named surface
- Every dimension previously reachable by a button is reachable as a column filter
- No surface has both mechanisms at any point, including mid-migration

**Any state where both exist is a defect, not a transition.**

---

## 3. One component

**Extract from Campaign. Do not rewrite.** It works. The job is making it reusable,
not redesigning it.

The component receives a **column definition** — field, label, filter type (value list
or date), and how to read the value off a row. It owns distinct-value collection, the
dropdown, filter state, and the filtered result.

Each surface supplies its own column definitions. Nothing surface-specific lives inside
the component.

**Four copies would be the mistake.** The Trade Log already carries two hand-rolled
side panels — `TradeSheet.tsx` and `ImportSheet.tsx`, independent copies, no shared
`Drawer.tsx` anywhere in the repo (Echo E-1, IF-6-G). This is that failure at twice the
scale.

---

## 4. The Trade Log

The blotter is block-grouped — one trade is one block, shared meta on the first row. The
filter therefore operates on **trades, not rows**. A filter matching a leg-level field
returns the whole block.

| Column | Filter type | Notes |
|---|---|---|
| Exec time | Date | **Replaces the date button** |
| Campaign | Value list | **Replaces the campaign button** — see §7 |
| Strategy | Value list | From the catalog |
| Status | Value list | Open · Complete · Orphan close |
| Symbol | Value list | Underlier / ticker / root / pair |
| Account | Value list | |
| Expiry | Date | Option rows |
| Right | Value list | Put / Call |
| Entry source | Value list | Manual · Import · Automated |
| Adherence | Value list | followed · partial · broke · unknown |

**The `Open:N` chip.** The blotter carries this today. Under this spec it is the Status
column filtered to Open.

**OPEN — Coach:** does the chip stay as a shortcut, or go? Keeping it is a second
mechanism, which §2 exists to remove; removing it costs a one-tap affordance members
use. No default is written here.

**`Select opens`** is a selection tool for bulk trash, not a filter. Untouched.

---

## 5. Records

**Default date scope is all time.** Records opens unfiltered by date. Every record, no
implicit window.

**Removing the current default is intended and confirmed by Coach.** First load will
show more than it does today.

**Why.** An implicit recent window is indistinguishable from missing data. A member
seeing ninety days cannot tell whether that is a filter or the extent of what exists. A
date filter is something a member applies, never something they must clear to see their
own history.

**OPEN — Coach:** which surface "records" is. The name does not resolve unambiguously
against the specs, and a build packet needs it. Everything in this spec applies
regardless of which surface it turns out to be.

---

## 6. The journal

**Campaign stamping is optional** on journal entries. The filter list needs a **(none)**
value so unstamped entries stay reachable when a campaign filter is on. Same for every
nullable column.

### 6.1 Two renderings — list or calendar boxes

The filtered set renders as **a list of records** or as **boxes matching the yearly
view**. A toggle switches between them.

**Switching never re-runs the filter.** Same matched set, two shapes.

This works because **there is one journal entry per date** (Session Spec §3). A filtered
set of entries is a set of days, so it maps onto day cells without inventing a grouping.

**They answer different questions.** Boxes show *when* — a run of days, a gap, a month
that went quiet. The list shows *what*, and compresses far better.

**The list row is one line.** Date, campaign, adherence, and a truncated first line of
the entry. Not the entry itself, or the compression is lost. Clicking opens the day.

**Match the existing toggle.** Strategy Lab's phase dashboard already carries a
Grid | Table toggle doing this job. Match its placement and behaviour rather than
inventing a second pattern for the same gesture.

**OPEN — Coach:** which view each surface opens in, and whether the choice is remembered
per member.

### 6.2 The boxes are calendar-shaped

**Ruled by Coach.** The full period renders; non-matching days are **dimmed, not
removed**. This is a filter applied *to the calendar*, not a result list that happens to
be square — the member sees when matches cluster.

Three consequences, each load-bearing:

- **Non-matching days stay clickable.** Session Spec §1.7: every cell navigates,
  including empty ones — a member journals a day *because* it is empty. Dimming marks a
  day as outside the filter; it does not disable it.
- **Dimming must not read as gradient.** A dimmed non-match cannot look like a
  low-intensity bucket, or the grid lies about the book. The treatment must be visually
  distinct from "small day net."
- **The period bar follows the filter.** E8 requires period total = Σ day nets. With a
  filter on, that total covers matching days only and must say so, or the number above
  the grid contradicts the grid.

### 6.3 What the boxes inherit

- **Empty is not zero** (E6). No closed outcomes shows an em-dash, never `$0.00`
- **The exposure map toggle governs money chrome** (E12). Map OFF means *zero* money
  chrome — no amounts, no gradient. Absent, not dimmed. Activity chrome only
- **Fixed buckets** (E11). If the map is on, the gradient uses the same stable buckets
  as the calendar. **A filtered view must not renormalize against the filtered set** —
  that would make the same $50 day paint differently depending on what else was
  filtered in

### 6.4 The valence boundary travels

Red/green gradient is sanctioned on the **Journal map only** (E10). Capital, Positions,
the Trade Log blotter, and Reports are forbidden valence color.

**Boxes appearing on any surface other than the journal do not inherit the gradient.**
If the box rendering generalizes, this boundary generalizes with it.

---

## 7. Campaign — a binding constraint

Campaign Spec v1.3 §9.2:

> tap filters the blotter to that campaign — **one filter system** (badge as entry
> point to the existing campaign filter; no second mechanism)

The campaign badge on a blotter row is already an entry point into the campaign filter.
When Autofilter replaces that filter, **the badge tap must route into Autofilter** —
setting the campaign column's filter to that value — rather than driving anything of its
own.

Getting this wrong recreates precisely what §9.2 forbids. It is easy to miss because the
control being replaced is not the control being tapped.

§9.2 also notes the campaign filter composes with the Adhere locate view. **Whatever
composition exists today must survive.**

---

## 8. Behaviour

**Composition.** Filters across columns are AND. Values within one column are OR.
Standard Excel behaviour; what members expect.

**Filtered-state visibility.** Strategy Lab's dashboard shows `shown/total` and an amber
"Filter on" indicator. Carry the same treatment. Members lose track of active filters and
conclude data is missing.

**Conflicting selections fail loud.** Where a combination is genuinely contradictory —
mutually exclusive values, a date range that cannot contain the selected rows, a campaign
whose window excludes every selected fill time — the filter **disallows the choice and
says why**. It does not silently return nothing.

This is invariant #2 applied to the UI: no silent defaults, no quiet empty state standing
in for a broken combination. The member sees which two choices conflict, not a blank
table to reason backwards from.

**Empty-but-valid is different.** A legitimate combination matching no rows is not a
conflict. It says plainly that nothing matched and offers to clear. The distinction is
whether the combination *could* have matched something.

**OPEN — Coach:** disallow at selection time (the conflicting value greys out and
explains), or allow the selection and fail loud on apply? The first prevents the mistake;
the second explains it. Both are fail-loud; they differ in when.

**Persistence.** The Trade Log stores UI preference in localStorage under
`ft.tradeLog.lastUsed.v1`.

**OPEN — Coach:** does a filter survive a page reload, or start clean each visit? Both
defensible; sticky filters are a common source of "where did my data go."

---

## 9. Design standard

Apple HIG, matching how Autofilter already looks and behaves in Campaign. Consistency
across the four surfaces is the point.

---

## 10. Out of scope

Sorting. Saved filter sets. Server-side filtering for large logs. Any surface not named
in the scope statement.

---

## 11. Acceptance

| # | Case | Expect |
|---|---|---|
| A1 | Load any named surface | **No date button, no campaign button** |
| A2 | Filter Trade Log by symbol | Whole trade blocks returned, not partial |
| A3 | Tap a campaign badge on a blotter row | Campaign **column filter** set to that value — not a separate mechanism |
| A4 | Campaign filter + Adhere locate view | Composition preserved |
| A5 | Filter journal by campaign | Unstamped entries reachable via **(none)** |
| A6 | Journal boxes, filter on | Full period renders, non-matches dimmed and still clickable |
| A7 | Journal boxes, exposure map OFF | **Zero money chrome** — no amounts, no gradient |
| A8 | Same $50 day, two different filters | **Same intensity bucket** both times |
| A9 | Period bar with filter on | Total covers matching days only, and says so |
| A10 | Contradictory selection | **Fails loud**, names the conflict |
| A11 | Valid selection matching nothing | Says nothing matched, offers to clear — not an error |
| A12 | Records first load | **All time**, no implicit window |
| A13 | Switch list ↔ boxes | Same matched set; filter does not re-run |
| A14 | Filter active | `shown/total` and "Filter on" visible |
| A15 | grep the four surfaces | **One** Autofilter component, not four copies |

---

## 12. Open items

| # | Item | § |
|---|---|---|
| 1 | Which surface is "records" | 5 |
| 2 | Does the `Open:N` chip stay as a shortcut, or go? | 4 |
| 3 | Conflicts: disallow at selection, or fail loud on apply? | 8 |
| 4 | Do filters persist across reloads? | 8 |
| 5 | Default view per surface, and whether the choice is remembered | 6.1 |

---

## 13. Review gates

Not yet run. India (component boundary, no second filter mechanism), Echo (HIG, the
dimming-versus-gradient distinction, toggle placement), Tango (empty and conflict copy),
Hotel (the valence boundary in §6.4), Delta (gate).
