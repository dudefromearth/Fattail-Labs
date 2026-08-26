# App areas — where things are and what they do

Member-facing guide to each part of FatTail Labs (labs.fattail.ai). Each section
describes what an area is, where to find it, and what you do there. Some areas depend
on your membership tier; if something looks locked it usually needs a higher tier.

## Home / Hub
Your landing page after signing in. It's the jumping-off point to everything —
courses, live sessions, resources, and your practice tools. If you're ever lost,
head back to the Hub.

## Courses
The course library. Open a course to see its lessons; your progress is tracked as you
complete them. This is where the structured teaching lives — see the Courses reference
for what each individual course covers. Some courses or lessons need a higher tier.

## Lessons
The video + written lessons inside a course. A few lessons are free previews; the rest
need an active membership. Some lessons include a short quiz to check understanding.
Your completion is tracked so you can pick up where you left off.

## Live
The schedule of live sessions and where to join them. Join links appear on the Live
page at session time. Live sessions are where the material is taught and applied in
real time with the coach.

## Resources
Downloadable and reference material — the supporting files and quick references that go
alongside the courses. Find it in the main navigation under Resources.

## Pathway
A recommended order to work through the material, so you're not guessing what to study
next. If you're new, Pathway (and the Start Here course) is the place to begin.

## Guide
The full written User's Guide to the platform — the long-form "how everything works"
reference if you want more than a quick answer.

## Profile / Me
Your account area ("Me"). Shows your membership status, your progress, and your account
details. Changes to billing or membership happen on the Membership page or the FatTail
website, not here.

## Trade Log
A practice tool for recording your trades and reviewing them over time. It's the book
of record for your practice — what you did, and how it turned out. Each account is one
book. Filter the **account book** with **Autofilter** on the Trade history row
(Exec time, Campaign, Strategy, Symbol, Status). The table is a **page** of
matches; shown is this page, total is how many in the book match. Status is
the full book. Tap a campaign badge on a row to filter to
that campaign — same Autofilter, not a second control. Search-and-assign is not on
the Trade Log — that is Find and Badge, on the Campaigns page. See **Trade Log
Autofilter**.

## Campaigns
Optional practice charters. A campaign is a **badge**, not a book. The book is the
contents of one account; assigning a badge does not move a fill between books. A
position wears **one** campaign badge or **none**. Open Campaigns from Practice. Each
campaign page lists only positions already wearing that badge. To search the whole book
and assign or clear badges, use **Find and Badge** on the Campaigns main page — not
inside each campaign, and not on the Trade Log.

## Find and Badge
On the Campaigns main page (`/app/practice/campaign#find-badge`). This is the one place
to search every account and assign or clear a campaign badge.

Search every account (each account is one book). A campaign is not a book. Select
positions, then clear or assign a campaign badge. A position already wearing a badge
must be cleared before you assign another. A fill whose date sits outside the campaign
window is rejected and stays unbadged. Five undos.

**AutoFilter** is off until you turn it on. Then you can filter the found set by When
(year → month → day), Symbol, Strategy, Debit/Credit, Effect, and Campaign. The found
set is a date range plus a **position** count (single, vertical, butterfly, and so on
— not raw fills; a close-out of the same structure is not a second position). The table
pages 50 at a time.

The same Autofilter **menus** are used on the Trade Log title bar to filter this
account’s book (the table shows a page of matches). That is a different job —
not search, not badge assign. See **Trade Log Autofilter**.

## Journal
Guided journaling to reflect on your trading and your mindset, session by session. Where
reps become method: you write up what happened and what you learned.

## Retrospective
A weekly review ceremony — look back over the week, draw lessons, and set intentions for
the next one. Running regular Retrospective cycles is a core habit the program builds.

## Reports / Statistics
Summaries and charts of your logged activity — your equity curve, win rate, and other
breakdowns — so you can see your progress and patterns at a glance.

## Journey
Tracks your progress and habits across the platform over time, so you can see the arc of
your development, not just individual sessions.

## Options Lab
The options inspection suite — Heatmap, Analyzer, Surface, Volume Profile.
Open it from the apps area (`/app/options-lab`). The Heatmap is a grid of
listed flies; Analyzer is the 2D **Risk graph** and position book
(`/app/options-lab/analyzer`); Surface is the 3D page
(`/app/options-lab/surface`). See **Options Lab Analyzer** for how to use
the Risk graph (pan, handles, GEX, Probability, What-if, Auto-fit).
See the Options Lab Heatmap reference for what each Heatmap Value number
means (Long/Debit, Short/Credit, % Change, Risk to Reward, Delta, Gamma,
Theta). See **Width Fit** for the Heatmap template that scores listed
long butterflies against your criteria (color-only tiles, footer n,
weights). See **This tab session** for inspector choices that stay when
you leave Heatmap and come back on the same tab.

## Heatmap
Options Lab → Heatmap (`/app/options-lab/heatmap`). Rows are body strikes;
columns are fly widths 10 through 50. The **Template** switcher picks the
view. **Advanced flies** uses the Value menu for the number — the tile value, sometimes called the score — on each tile;
colors follow how that number changes to the neighbor; the − / + slider
under Side only changes color sensitivity. **Width Fit** is a sibling
template (not a Value): color-only tiles (teal = weaker fit, amber =
stronger fit to your weights), footer median + n, hover/click panels.
Blank or dark tiles mean the fly is not on the listed chain. Inspector
choices stay for **this browser tab** when you leave and come back; a new
tab starts from defaults — see **This tab session**. See Options Lab
Heatmap for each Value formula; see Width Fit for the fit template.

## Strategy Lab
A space to build and study options strategies — design a structure and examine its
risk/reward before you ever risk capital. Availability can depend on your tier.

## Analyzer
The Analyzer (`/app/options-lab/analyzer`) is the **Risk graph**: 2D P&L vs
price for every Shown position. Inspector: GEX, Probability, What-if.
Position list and Alerts sit under the canvas. Symbol, Spot, and VIX are
on the strip above the graph; Auto-fit is centered there. See the
**Options Lab Analyzer** help topic for each control (handles, GEX,
Probability bands, What-if, named states). Surface is a **separate**
page (`/app/options-lab/surface`), not a tab on this canvas. Availability
can depend on your tier.

## Surface
The **Surface** (`/app/options-lab/surface`) is the 3D Options Lab page — a
landscape (mesh) picture of position profit-and-loss. It is not a tab on
the Analyzer canvas. Drag to orbit, scroll to zoom.

**What it shows / how to read it:**
- The **height** of the surface at any point is the position's **profit or loss in
  dollars**.
- One axis is the **underlying price** (where the market moves).
- The other axis is **time to expiration** (how the position behaves as days pass).
- A flat **break-even plane** marks $0 — surface **above** it means the position is in
  profit at that price and time; **below** it means a loss.
- A marker shows the **current price (spot)**, so you can see where you stand right now.
- The **Time machine** knobs (time, volatility, spot %) let you push the scenario forward
  and watch the whole landscape change.

**How it helps your trading:**
- See the **shape of your risk at a glance** — where a position makes or loses money
  across price *and* time, not just at expiration.
- Understand **time decay**: watch how today's smooth curve collapses toward the hard
  payoff kinks as expiration nears, so you can tell whether time is working for or
  against this structure.
- **Stress-test before you commit**: move price, time, and volatility with the Time
  machine and see how the P&L landscape responds, so entries and exits are deliberate.
- It shares one session with the Risk graph, your Positions, Alerts, and what-ifs —
  switching to Surface never loses your setup.

**Why it matters:** an option's P&L is not a straight line — it curves with price, time,
and volatility. The Surface makes that curvature visible so you can understand the risk
before you take it. It is a study-and-planning tool for building intuition and
disciplined decisions — it does **not** predict profit, give trade signals, or tell you
what to buy.

## Volume Profile
A study tool in Options Lab (`/app/options-lab/volume-profile`) that shows a sideways
histogram of how much volume has traded at each price. Price runs up the side; a longer
horizontal bar means more volume traded there — so you can see where a symbol has "done
most of its business." A live-price marker highlights the bar at the current mid, and you
choose the symbol, a bar period (1d / 4h / 1h / 30m), and text size.

**How to read it:** pick your symbol and period, then scan for the longest bars — the
busiest, most-accepted prices — note the thin bars where price moved through quickly, and
watch where the live marker sits.

**Why it matters:** high-volume prices tend to be reference levels traders revisit, so it
helps you frame where activity has concentrated when studying a name.

**Good to know:** it's a study tool, not a signal. The member chart *estimates*
volume-by-price from OHLC bars (it's labelled "From OHLC window — not measured tick VP"),
so it's an approximation, not exact tick data; it covers regular-hours equity/ETF data and
doesn't show Point of Control or value areas.

## Playbook
Your personal scrapbook for how you trade under risk — your rules, setups, regimes, and
the evidence behind them (`/app/playbook`, part of Practice). Each strategy is its own
**book** of chapters and pages: a library of covers opens into a scrapbook view with a
chapter list, a clean 16:9 page stage, and an **Archive** drawer for stapled files (charts,
prints, PDFs). Books carry Draft / version / Archived badges, and a **Present** mode opens
any book fullscreen for review or walking a peer through it.

**How to use it:** New book → title it → Open book → Add chapter / Add page → Edit page
(Markdown) → Apply. Upload files into the Archive to staple them in; add Tags; press
**Save** to lock in a version; **Present** to review; **Export book** to download it as a
ZIP.

**Save matters:** your work is kept automatically as a working copy, but only **Save**
creates a version — **Discard** reverts to your last Save (or deletes a never-saved
draft). Once saved, a book can be Archived but not fully deleted. Link supporting evidence
by attaching **journal sessions** from the Journal side (tagging a book alone doesn't
count as evidence). Present mode hides your identity, so screenshots are safe to share.

## Accounts & Capital
The one place to manage your trade books and the money behind them (`/accounts-capital`,
reached from your Profile / the account menu). It shows a total across all accounts, each
account's balance, live position values, your buying-power setting, cash-movement history,
and your tolerated master-drawdown setting.

**How to use it:** create or retire accounts (up to 10 active), set a starting balance,
record deposits and withdrawals, set per-account buying power, set your drawdown
tolerance, and confirm balances as current.

**Why it matters:** it's the only place you edit capital facts — Practice and Reports read
from here (for example, the starting capital shown in Reports is read-only and comes from
here). Balance = starting balance + trade outcomes + cash movements. Money here is
campaign-blind; Practice campaigns are optional direction, not separate accounts.

## Records
"Records" is an older name for your performance dashboard — the Records link opens your
**Reports** (see *Reports / Statistics*): your equity curve, win rate, and other
breakdowns of your logged trades. To manage accounts and cash instead, see *Accounts &
Capital*.

## Market
"Market" is the entry name for the **Options Lab** market-study desk — the Market page and
old market links open Options Lab, with live underlier prices plus the **Heatmap**,
**Volume Profile**, and **Analyzer** (Risk graph + Surface) tools. See *Options Lab* for
the full picture. It's for studying the market, not placing orders.

## Practice
The practice desk: Trade Log, Reports, Journal, Retrospective, Playbook, and optional
Campaigns. Each account is one book. A campaign is a badge, not a book. Journal is still
you — not a separate journal per account. Find and Badge (on Campaigns) is how positions
join a campaign or stay unassociated.

## Toughness
Mindset and resilience training — the psychological side of trading discipline that the
program treats as seriously as the technical side.

## Community
The member community — where members discuss, share, and learn together. Availability can
depend on your tier.

## Wiki
The compiled map of what we teach — search-first, cross-linked pages
(`/app/wiki`). Open it from **Apps → IKI Lab → Wiki**. Type a phrase in your
own words, follow links on an article, or open **Graph** to see how pages
connect. **Start here** is a short pinned reading list. Published pages can
be read without signing in; drafts are not public. The Wiki is a map of
concepts, not a trading signal and not the emerald Help button. See the
**Wiki** help topic for search, keyboard jump (⌘K / Ctrl+K), and what the
empty side rails mean. The **Wiki agent** (zinc pill, left of Help) is
**administrators only** — members never see it; see the Wiki agent topic.

## Membership
Where you see your current tier and manage it. To see pricing, or to upgrade, change, or
cancel, use the Membership page or your account on the FatTail website — all billing is
handled there. Tiers are Observer, Activator, and Navigator (Navigator is the most
complete); higher tiers unlock more courses, tools, live attention, and support.

## Notifications
In-app notices — replies to your help questions, reminders, and platform updates show up
here so you don't miss anything.

## Help
This help window. Ask a question and the assistant answers common ones instantly; if it
can't, it hands your question to the human support team and you'll be contacted. You can
ask to "talk to a human" at any time, and review past questions and replies in the
"My questions" tab.
