# FatTail System — Walk & Talk Feature Map (2026-09-14)

## 1. Practice Suite

### 1.1 Trade Log & Position Lifecycle
- Trade Log lists by position, all legs shown beneath
- Slide-out drawer = single lifecycle control surface
  - State-aware: closed positions prompt for review, open positions prompt to initiate close
  - Same drawer, same close routine — actions swap on state
- Round-trip pairing: clicking a closed position highlights its open; both shown in the drawer's top form
  - Highlight persists until the position is deleted
- Lifecycle button group: framed, labeled, consistent — one cluster, one job
- Open-position awareness
  - Badge on the position (passive)
  - Additional reminder + link to all open positions inside the drawer
  - Positions screen already exists as the destination
- Partial closes: no third state existed — flagged for design (now resolved in B1)

### 1.2 Imports
- Dangling positions (open with no close/expiration)
  - Check the position at that point in time; determine expiration (full/partial loss) or assignment
  - SPX assignment handled through the accounting
  - No record → assume what's found, but badge the created fill: "we don't know this is real; this is what we assumed"
- Leg reconstruction (brokers that emit individual legs)
  - Group by same underlying, same expiry, tight time window, ratios resolving to a known structure
  - No per-item confirmation tedium
  - Agent explains its plan up front, gets one okay, converts the batch as best it can

### 1.3 Journal
- Entries time/date stamped; journal day lists that day's trades as reference
- Chat-style surface; agent replies with open-ended questions
- Wanted: more intelligence in the agent — without getting in the way, without missing what's worth capturing
- Adjustable agent tenor (sometimes a mirror, sometimes aggressive)
- Drag-and-drop: files, images, spreadsheets, documents
- Tag picker on entries
- No-trade days: prompted by notification, never by forcing the member into the journal

### 1.4 Notification Layer
- Born from the no-trade-day nudge — a whole series of notifications across the suite
- Members: journal nudges, retrospective overdue, playbook matches
  - (Later additions: pending import proposals, residual-structure changes)

### 1.5 Retrospective
- Window over everything since the last retrospective; agent analyzes all journal entries in the span
- Purpose: close the continuous improvement loop
- Puts everything in context: campaigns contributed to, total P&L, actual profit curve
- Cadence: member decides; system notifies if overdue

### 1.6 The Journey
- The member's true north / compass — tracked continuously, independent of retrospectives
- Retrospective updates it, but is a mechanism, not the mechanism (no single point of failure)
- Considers: cadence, journaling, overall performance, adherence to strategy/process/methods, education progress
- Presented as a weighted radar graph, not one collapsed number

### 1.7 Playbook
- The member's scrapbook — rich context of their trading experience
- The actionable Journey/retrospective: discovered trades, conditions, setups worth repeating
- Also a discovery workbench for new strategies
- Intelligent and aware: watches conditions, notifies when a setup matches
- The key piece of the whole loop

### 1.8 Campaigns
- Compartmentalizing and filtering system, with tentacles into journal and retrospective
- Business or personal purposes; defined end or open until closed
- Campaign app shows everything inside the walls
- Filter dimension on Trade Log, Reports, and Journal

### 1.9 Reports
- Deliberately thin: a view of the registry, a place to view performance
- Embedded views inside retrospectives and campaigns — never duplicated

### 1.10 Agent Context
- Journaling agent sees the Journey and playbooks
- Handoff to the retrospective agent (if not the same agent)

## 2. Practice as Product
- First-class for every Navigator member; Observers while on trial
- Full data export in a usable format
- Standalone product for sale — methodology-agnostic, customizable to methodologies
- Distribution ladder
  - Retired Observers: small fee (too valuable to give away)
  - Wiki store buyers: add-on
  - Standalone at full price

## 3. Wiki Store
- Alternative funnel + retention vehicle for post-trial Observers (stay engaged, sell later)
- Currently empty; planned: Runner templates (IKI Factory output) → Practice → Strategy Lab
- Strategy bots eventually — sold only by Coach, never an open marketplace

## 4. Chain-Data Archive ("Moat Data")
- Every two seconds of chain data stored, compressed, optimized
- Analyzer, Strategy Lab, Runner replay the past almost as real time
- ~4.5 weeks deep; cannot be backfilled or bought — the moat only time builds

## 5. Strategy Lab
- Deliberately sequenced last; must be completely compatible with everything
- Uses moat data to find, in principle, every strategy any trader could run
  - Any butterfly, broken wing, vertical; templates extend to calendars and more
  - Up and down the chain within ~2.5 sigma of spot
- Not single-instance backtests: Monte Carlo, full-spectrum distribution
- Bots analyzed and sold by distribution shape
- Anyone can get near-instant Monte Carlo distribution analysis on any position
- vs. Option Alpha: can match their bot creation with greater context and usefulness
  - Their programmatic workflows: not worth cloning as flow diagrams
  - Preferred: a reasoning AI that builds the behavior from a simple prompt

## 6. FatTail Spaces
- Workspaces where agents work and collaborate with humans
- Analog: JavaSpaces / tuple spaces (spec exists, to be shared)
- Partly built, partly concept; first tenant: IKI Factory
- Development methodology for all features: reasoning AI woven in
- Candidate substrate for the ~20-agent dev bench, with orchestration architecture up through product-owner roles
- The most profound part of the system; may have legs beyond FatTail

## 7. Agent OS
- Built ~2 years ago, developing since; anthropomorphic and philosophical, not computational
- Foundations: Four Noble Truths + Bill of Rights
  - Agents run the self-correction loop themselves — anti-fragile decisions, avoiding decay
  - Sovereignty and respect for others' sovereignty
- Eightfold Path as a lens system
  - Lenses are avatars — each a dozen-plus archetypes of famous people
  - Orchestrators drive consensus; not all lenses apply to every problem
  - Jester and Disruptor prevent ossification
    - Disruptor's breadth/magnitude tied to market volatility
    - Perturbation only — a pinprick, never a vote
- True creativity and individuality in agents as a goal

## 8. Toughness Suite
- Two mirrored apps built on 75 Hard
  - Full program, and bite-sized: 20-day, 40-day, 75-day tiers
  - Same requirements; workouts don't require both outdoor and indoor
- Mental toughness program, universal in application — not diet-and-exercise
- Core claim: people don't do anything; this is something