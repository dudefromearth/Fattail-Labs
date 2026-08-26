# Trade Log Autofilter

Member-facing guide to the Autofilter control on the Trade Log blotter.
It filters this **account’s book** — every fill on the account you have
open, not only the rows on the current page. Teaching only — it does not
tell you what to trade, rank fills, or promise a profit.

## Trade Log Autofilter
On the Trade Log (`/app/trade-log`), **Autofilter** sits on the
**Trade history** row — one control, not a row of chips and not a sidebar.
Tap it to open Exec time, Campaign, Strategy, Symbol, and Status. Filters
apply together (all chosen columns), and within a column any of the values
you pick. A match on one leg still shows the **whole trade**.

The table is a **page** of the matching set (newest first). Earlier years
on this account are in the menus even when they are not on the first page.
Autofilter does not search every account, and it does not assign campaign
badges. That search-and-assign surface is **Find and Badge** on Campaigns.

## How to open it
Practice → Trade Log. On the Trade history row, tap **Autofilter**. The
launcher is the large Autofilter button; each column then has a small
menu (same kind of menu as Find and Badge).

A new visit starts **clean**. Filters do not come back after you leave
the page.

## The columns
- **Exec time** — calendar of fill days in this account book
  (year → month → day), including days not on the current page.
- **Campaign** — the campaign badge the trade wears, or (none).
- **Strategy** — the structure code on the trade (`BUTTERFLY`, `VERTICAL`,
  and so on). The menu shows the catalog name when one exists; otherwise
  the code. Filtering uses the stored code, never an invented name.
- **Symbol** — underlier or symbol on any leg. A match returns the whole
  block, never a partial trade.
- **Status** — Open, Complete, or Orphan close, from the **full account
  book** (not only the rows on screen). These are **matching states**
  (whether an open still needs a close), not a grade of the trade.

## Filter on
When any column is filtering, **Filter on** appears with **shown/total**.
**Shown** is how many rows are on **this page**. **Total** is how many
trades in the account book match. Unfiltered, the same numbers are this
page and the full book. **Clear filters** returns the unfiltered book
(still paged). If a combination is lawful but matches nothing in the book,
the page says **Nothing matched** and offers clear — that is not an
error, and the book is not empty.

## Campaign badge and deep link
Tap a campaign badge on a blotter row to set the **Campaign** column —
the same Autofilter, not a second filter. A link from Campaigns with
`?campaign=` does the same. Clear filters (or pick other campaign values)
to leave that view.

## What Autofilter replaced
The campaign dropdown that used to sit on the blotter is gone. Date pills
and the campaign select under Practice nav are **not on Trade Log** (they
remain on Journal, Reports, Retrospective, and Playbook). Account picker
stays. The playbook dropdown on the blotter stays. **Select opens** still
selects unmatched opens for bulk trash — it is a selection tool, not a
filter. The old **Open:N** chip is gone; filter Status to **Open** instead.

## Conflicts and nothing matched
A date that cannot sit inside a selected campaign’s window is greyed out
and named (“those dates sit outside the selected campaign window”). That
is a conflict, not a blank table. A valid mix that simply matches no
trade in the account book is **Nothing matched** plus Clear.

## Journey locate
A banner from Journey Adhere (“trades that are not followed or partial”)
is a **locate view**, not a standing Autofilter. You can still Autofilter
those located rows. Clear on the locate banner removes the locate; it
does not clear Autofilter.

## What Autofilter is not
It is not Find and Badge. It does not rank fills, pick a “best” symbol,
or tell you what to buy. It is not a multi-year hunt for an edge. It is
not personalised trading or investment advice. Process and bookkeeping
only.
