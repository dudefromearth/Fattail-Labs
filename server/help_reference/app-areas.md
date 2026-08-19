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
book. The blotter can filter to a campaign badge (every account) so you can review what
already wears that badge. Search-and-assign is not on the Trade Log — that is Find and
Badge, on the Campaigns page.

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
listed flies; Analyzer builds a book; Surface shows that book's P&L shape.
Surface stays available after the close and after expiration — residual
or expired is a label, not a lock. After midnight, yesterday’s expired
positions stay as a grey wireframe (no filled tent), the same idea as
the Analyzer ghost. You can inspect a weekly or a calendar back-month
any time.
See the Options Lab Heatmap reference for what each Heatmap Value number
means (Long/Debit, Short/Credit, % Change, Risk to Reward, Delta, Gamma,
Theta).

## Heatmap
Options Lab → Heatmap (`/app/options-lab/heatmap`). Rows are body strikes;
columns are fly widths 10 through 50. The Value menu chooses the number on
each tile. Colors follow how that number changes to the neighbor; the − / +
slider under Side only changes color sensitivity. Blank tiles mean the fly
is not on the listed chain. See Options Lab Heatmap for each Value formula.

## Strategy Lab
A space to build and study options strategies — design a structure and examine its
risk/reward before you ever risk capital. Availability can depend on your tier.

## Options Lab
The day-trader risk desk. Its centre is the **Analyzer** (`/app/options-lab/analyzer`),
where you study a position two ways in one session: the **Risk graph** (2D) and the
**Surface** (3D) — same positions, alerts, and what-ifs, you just switch the canvas.
Options Lab also includes the **Heatmap** and **Volume Profile** views. Availability can
depend on your tier.

## Surface
The **Surface** is the 3D view inside the Options Lab Analyzer — a landscape (mesh)
picture of your position's profit-and-loss. It uses the exact same position and pricing
as the 2D Risk graph; only the presentation differs (a 3D surface instead of lines).
Drag to orbit, scroll to zoom.

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
A reference knowledge base inside Labs for looking up concepts and terminology.

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
