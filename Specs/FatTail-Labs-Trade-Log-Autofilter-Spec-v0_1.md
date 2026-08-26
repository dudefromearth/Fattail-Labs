# FatTail Labs — Trade Log Autofilter Spec v0.1

**Provisional filename and version. Coach names the real ones.**

| | |
|---|---|
| Status | DRAFT — advisor spec |
| Date | 2026-08-25 |
| Relationship | Narrow slice of `FatTail-Labs-Autofilter-Spec-v0_2.md`. That document stands as the eventual multi-surface design; this one ships first on one surface |

**Scope statement.** Active program: Trade Log Autofilter. Surfaces: **the Trade Log
only**, plus the **Practice nav bar** where the date filter currently sits, plus
**Campaign** as the extract source. Touches outside program: **NONE**.

Records and the journal are **not in this slice**. They come later, against the same
component, with no rework.

**Nature of the change.** Read-only. Filters what is already loaded. No schema change,
no migration, nothing persists to the server.

---

## 1. What ships

**One Autofilter control on the Trade Log title bar.** Not a row of chips, not a
sidebar — a single control in the title bar that opens the filter surface.

**Every button it replaces is removed in the same change**, including the date filters
under the Practice nav bar.

---

## 2. What is removed

| Control | Where | Disposition |
|---|---|---|
| Date filter | **Under the Practice nav bar** | **Removed** |
| Campaign filter | Trade Log toolbar | **Removed** |

**Removed, not hidden or deprecated.**

**One cut.** The removal ships in the same change that mounts Autofilter. A window
where both exist is a defect, not a transition — it does not become acceptable by
being temporary.

**OPEN — Coach:** the date control under the Practice nav bar may be shared chrome
serving Journal and other Practice surfaces, not Trade Log alone. If it is shared,
removing it affects surfaces outside this slice. **Report before removing** — this is
the one place this packet could reach past its own scope.

---

## 3. Columns in this slice

Deliberately fewer than the full design. These replace both removed buttons and prove
the pattern.

| Column | Filter type | Replaces |
|---|---|---|
| Exec time | Date | **the date filter** |
| Campaign | Value list | **the campaign filter** |
| Symbol | Value list | — |
| Status | Value list — Open · Complete · Orphan close | — |

**Deferred to a later slice**, no redesign required to add them: Strategy, Account,
Expiry, Right, Entry source, Adherence.

---

## 4. The component

**Extract from Campaign. Do not rewrite.** It works; the job is making it reusable.

Even for one surface, **build it as the shared component** — column definitions in,
one filtered stream out, nothing Trade-Log-specific inside. Records and the journal
mount it later without rework.

Building it in place would be the fourth hand-rolled copy. The Trade Log already
carries two independent side panels for want of a shared one (Echo E-1).

---

## 5. Trade Log specifics

**The blotter is block-grouped** — one trade is one block, shared meta on the first
row. The filter operates on **trades, not rows**. A leg-level match returns the whole
block; a partial block would misrepresent the trade.

**The `Open:N` chip** is Status filtered to Open.

**OPEN — Coach:** remove it, or keep it? If it stays it must be **identical** to the
column filter — same state object, same clear path, same contribution to
`shown/total`. A chip driving its own private filter is the second mechanism this spec
exists to remove, and worse than the button because it looks like a shortcut.

**`Select opens`** is a selection tool for bulk trash, not a filter. Untouched.

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
today must survive.**

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

**OPEN — Coach:** disallow at selection time, or fail loud on apply?

**Persistence.** If filters persist across reload they get **their own named key and a
visible control** — never silently merged into `ft.tradeLog.lastUsed.v1`. A filter the
member cannot see and did not knowingly set is the "where did my data go" failure with
no way to recover.

**OPEN — Coach:** persist, or start clean each visit?

---

## 8. Design

Apple HIG. Match how Autofilter already looks and behaves in Campaign.

---

## 9. Out of scope

Records. The journal. The list-versus-calendar-boxes toggle. Sorting. Saved filter
sets. Server-side filtering. The six deferred columns. Any surface not named in the
scope statement.

---

## 10. Acceptance

| # | Case | Expect |
|---|---|---|
| A1 | Load the Trade Log | Autofilter control **on the title bar** |
| A2 | Load the Trade Log | **No campaign filter button** |
| A3 | Load Practice | **No date filter under the nav bar** — subject to §2 OPEN |
| A4 | Filter by symbol | Whole trade blocks, never partial |
| A5 | Tap a campaign badge on a row | Sets the **campaign column filter** — not a separate mechanism |
| A6 | Campaign filter + Adhere locate view | Composition preserved |
| A7 | Contradictory selection | **Fails loud**, names the conflict |
| A8 | Valid selection matching nothing | Says nothing matched, offers to clear — not an error |
| A9 | Filter active | `shown/total` and "Filter on" visible |
| A10 | If the `Open:N` chip stays | Same state object as Status=Open |
| A11 | Any commit | Never both mechanisms at once |
| A12 | Inspect the component | Column definitions in, one filtered stream out, nothing Trade-Log-specific inside |

---

## 11. Open items

| # | Item | § |
|---|---|---|
| 1 | Is the date control under the Practice nav bar shared with other surfaces? **Report before removing** | 2 |
| 2 | `Open:N` chip — remove, or keep under the identity rule? | 5 |
| 3 | Conflicts — select-time or apply-time? | 7 |
| 4 | Do filters persist across reloads? | 7 |
