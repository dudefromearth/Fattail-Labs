# AGENTS.md — FatTail Labs Agent Bench

This project is developed using a professional-grade, specialized multi-agent ensemble
called the **Agent Bench** (defined in `agents/bench/`).

This is not a loose collection of prompts. It is a structured virtual development
organization — each agent with deep domain mastery, strict invariants, and clear
coordination protocols. Same callsigns and governance as the Fly-on-the-Wall / FatTail
bench; domains remapped to this product.

**Product context:** FatTail Labs (`labs.fattail.ai` today) — standalone membership platform
for FatTail.ai: **courses + practice apps** plus **Strategy Lab** (process bots). Replaces
LearnDash. No shared code with MarketSwarm-Canonical (HTTP only).

**Entry points for product truth:**
- Root [`README.md`](./README.md) — **current state + product direction** (start here)
- [`Architecture/README.md`](./Architecture/README.md) — as-built index + decision log
- [`Architecture/00-decision-log.md`](./Architecture/00-decision-log.md) — binding DLs
- Specs under `Specs/`; human explainers under `docs/`
- **Market data (live):** [`Architecture/28-massive-market-bus.md`](./Architecture/28-massive-market-bus.md) — read before any Massive / options / marks / WS work

### Current state & focus (as-built · single host)

| Priority | Guidance for agents |
|----------|---------------------|
| **Strategy Lab NOW** | Lock **Design + Curate** for entitled members. Multi-member Curate is absolute. |
| **Deploy** | Members get **Deploy UX** except **real-broker (Tradier) real-money**. Admin dogfoods Tradier, then provision. **DL-251 / DL-252**. |
| **Market Bus (shipped core)** | Live chains/symbols: **Massive → feeds → Redis → one WS/tab → shared client**. Options Lab at `/app/options-lab`. See Arch **28**. |
| **Do not** | Open multi-member live Tradier before admin proof. Do not block Design/Curate on Deploy. **Do not** add per-widget Massive or extra market WebSockets. |
| **Shipped** | Courses, practice stack (trade log, journal, retros, reports), toughness, admin board/cast/HeyGen, shared marks / house designs path, **Market Bus + Options Lab** |
| **Spec’d, not shipped** | Community Discord second window · Visualize AI · Bot Marketplace · live **header** marks UI |

Timeline: [`docs/Strategy-Lab-Member-Timeline.md`](./docs/Strategy-Lab-Member-Timeline.md) ·
[`Architecture/26-strategy-lab-member-timeline.md`](./Architecture/26-strategy-lab-member-timeline.md) ·
growth playbook [`Architecture/17-strategy-lab-growth-playbook.md`](./Architecture/17-strategy-lab-growth-playbook.md).

### Future direction (intent only — **do not implement the split now**)

| Future host | Membership (target) | Job |
|-------------|---------------------|-----|
| **`practice.fattail.ai`** | **Navigator** (trader default) | Coaching + education suite; **Visualize AI** exclusive here later |
| **`labs.fattail.ai`** | **Labs** membership (**separate product**) | Build/deploy bots, marketplace; OA-class wedge (Arch 16 doctrine) |

- **Current Navigators** at future cutover: **grandfathered** via **granted Labs membership**.  
- **Future Navigators:** Practice only unless they **purchase Labs**.  
- **Community:** both products; channels scoped `practice` \| `labs` \| `shared`.  
- Architect new features with **seams** (product entitlement keys, Spec “home” tags) — **do not** strip as-built Navigator Strategy Lab access today.

→ [`docs/Dual-Subdomain-Practice-vs-Labs.md`](./docs/Dual-Subdomain-Practice-vs-Labs.md) ·
[`Architecture/25-dual-subdomain-practice-labs.md`](./Architecture/25-dual-subdomain-practice-labs.md) · **DL-248–250**.

### Key product Specs / explainers (selected)

| Topic | Spec / doc |
|-------|------------|
| Course hosting | `Specs/FatTail-Labs-Course-Hosting-Spec-v1.0.md` |
| Strategy Lab Curate/Deploy surface | `Specs/Strategy-Lab-Curate-and-Deploy-Surface-Spec-v1.0.md` |
| **Strategy Lab guiding doctrine** | Spec **v1.0** `FatTail-Labs-Strategy-Lab-Guiding-Doctrine-Spec-v1.0.md` · Arch **32** · paper `docs/Strategy-Lab-Position-We-Position-We-Dont-Predict.md` · **DL-382–391** · **DL-396** (SL-GD39–41: BT/FW is Law A consumer; atomic position; tier is a state) — one **P&L surface model** (`web/lib/risk-graph/surfaceModel.ts`) across Design, Analyzer Surface, and the future harness; Timing warrant; dynamic trail |
| **Market Bus (live market plane)** | Spec `FatTail-Labs-Massive-Market-Bus-Shared-Client-Spec-v1.0.md` · Arch **28** · bench `docs/Massive-Market-Bus-Full-Agent-Bench-Plan-v1.0.md` |
| **Live underlier mids (UI standard)** | Arch **28** §4.4 · `web/lib/market/liveUnderlierPattern.ts` · hook `useLiveUnderlierMarks` · `<LiveMid />` / `LiveUnderliersTable` |
| **Options Lab Analyzer** | Spec content **v0.2.1** `FatTail-Labs-Options-Lab-Analyzer-Spec-v0_2.md` (v0_1 SUPERSEDED) · PB Spec **v0.3** · residual bench plan **v1.0.1** `docs/Options-Lab-Analyzer-Residual-Full-Agent-Bench-Plan-v1.0.md` · board `agents/p-options-lab-analyzer/` · **DL-301…306** · OD-AZ1–8 Accept · **Keep-warm v0.1.2 BUILD AUTHORITY** `FatTail-Labs-Options-Lab-Analyzer-Viewport-Keep-Warm-Spec-v0.1.md` · **DL-418** · **DL-419** (live sheet **local**) |
| **OPF Truth · Elegant Failure (positions)** | **NORMATIVE capital-risk doctrine** `Specs/FatTail-Labs-Options-Lab-OPF-Truth-and-Elegant-Failure-Doctrine-v1.1.md` (v1.0 SUPERSEDED) · **DL-309** · **DL-396** — OPF-held chain is sole instrument truth; two clocks (τ vs midnight-ET EXPIRED); additive book; representable or named state; never invent strikes or silent false package prices. Session/Print Spec v0.1 **DRAFT**. Bench: `docs/OT-EF-Session-Print-and-Two-Clocks-Full-Agent-Bench-Plan-v1.0.md` · board `agents/p-ot-ef-session-print/` |
| **Options chain ladder** | Spec `FatTail-Labs-Options-Chain-Picker-Spec-v1.0.2.md` · route `/app/options-lab` · board `agents/p-market-bus/` + `agents/p-options-chain-picker/` |
| **Options Lab Surface Autofit** | Spec **v0.1.1** `FatTail-Labs-Options-Lab-Surface-Autofit-Spec-v0.1.md` · **DL-421** · bench `docs/Options-Lab-Surface-Autofit-Full-Agent-Bench-Plan-v1.0.md` · board `agents/p-options-lab-surface-autofit/` · **DL-422** · W0 `agents/go/OLSAF-W0.md` |
| **Options Lab Heatmap · Advanced Fly** | Spec **v0.2.1** `FatTail-Labs-Options-Lab-Heatmap-Advanced-Fly-Spec-v0_2.md` · Arch **29** · full-agent plan **v1.1.1** `docs/Options-Lab-Heatmap-Advanced-Fly-Full-Agent-Bench-Plan-v1.1.md` · board `agents/p-options-lab-heatmap/` — replace sym-fly; OPF-held dual-side chain; AF0 GO required |
| Curate MySQL marks (dual-write / fallback) | Arch **18** · `live_stream` / `sym_feed` → `market_live_marks`; product UI mids still use live underlier pattern |
| Community | `Specs/FatTail-Labs-Community-App-Spec-v1.0.md` · `docs/Community-Chat-Discord-Second-Window.md` |
| Visualize AI | `Specs/FatTail-Labs-Visualize-AI-Spec-v0.1.md` · `docs/Visualize-AI-How-It-Works.md` |
| Bot Marketplace | `Specs/FatTail-Labs-Bot-Marketplace-Framework-Spec-v0.1.md` · `docs/Bot-Marketplace-How-It-Works.md` |
| OA-class positioning | `Architecture/16-strategy-lab-vs-option-alpha-positioning.md` |

Also: `CLAUDE.md` for ops/commands invariants.

### Market data invariants (agents — non-negotiable)

1. **Sole upstream:** Only feed processes / single-flight miss paths call Massive for live bus topics — not Next.js, not N handlers without coalesce.  
2. **Shared store:** With `LABS_MARKET_BUS=1`, generations live in Redis (`mb:*`); multi-worker requires Redis.  
3. **One WebSocket per tab:** `web/lib/market/MarketSocket.ts` — Options Lab and future apps share it.  
4. **Universe SoR:** `market_symbol_universe` only.  
5. **Proxy honesty:** `massive_proxy_v1` labeled; never center SPX strikes on SPY proxy (OC2).  
6. **Exact strikes:** display listed values cent-exact (OC6a).  
7. **No MSC** market code or MSC Redis schemas.  
8. **Header UI** is not product law until a surface Spec — bus may still publish `session` / `sym` topics.  
   **OPF session/print (DL-395 · DRAFT spec):** target SoR is OPF (open/closed + live vs last print). Spec `FatTail-Labs-OPF-Session-and-Print-Authority-Spec-v0.1.md` is **not BUILD** until Coach GO + Juliet plan. Do not invent a third client Massive/clock SoR in the meantime.  
9. **Live underlier mids (site-wide UI standard — do not invent a third path):**  
   Any surface that shows underlier **mid / last / live price** for symbols in
   `market_symbol_universe` **must** use:
   - Hook: `useLiveUnderlierMarks` (`web/lib/market/useLiveUnderlierMarks.ts`)
   - Bind: `bindUnderlierMark` (product key only — never cross-fill SPY→SPX)
   - Display: `<LiveMid />` / `<LiveProxyMid />` / `LiveUnderliersTable`
   - HTTP poll (`ensure_fresh` on list endpoints) is primary for tables; WS overlays non-proxy only  
   **Do not** poll ad-hoc `/curate/live-marks` for mid chips, invent per-widget Massive,
   or read raw `useSymbolMarks` alone when you need a table mid (WS-only is incomplete).  
   Chains still use `useOptionChainBus`. Multi-leg packages use OPF package-quote.  

Full map: [`Architecture/28-massive-market-bus.md`](./Architecture/28-massive-market-bus.md) §4.4.

### Options Lab position invariants (agents — capital-risk, non-negotiable)

**Doctrine:** [`Specs/FatTail-Labs-Options-Lab-OPF-Truth-and-Elegant-Failure-Doctrine-v1.1.md`](./Specs/FatTail-Labs-Options-Lab-OPF-Truth-and-Elegant-Failure-Doctrine-v1.1.md) · **DL-309** · **DL-396**

These sit next to market invariants. Violations that invent instruments or silent false
marks are **severity: high** (member capital-adjacent judgment).

1. **OPF is the only truth** for create/edit/prefill/package: dual-side chain the OPF holds
   (listed exp + listed strikes + contract marks). No arithmetic placeholder structure
   presented as a finished position. RTH vs closed ≠ second strike universe (live vs held only).
2. **Representable or not:** every leg must be placeable on that plane, or the structure is
   not package-priceable. Do not invent a debit/credit.
3. **Elegant failure:** never leave the member believing the app is broken. Package cell shows
   a **named state** (EXPIRED · HELD/RESIDUAL · NOT TRADED · CHECK LEGS · UPDATING ·
   BUDGET LIMIT · WAITING · HIDDEN) plus calm truthful detail — not blank, not stale prior
   pointer mark after rebind. Last known print is not an outage.
4. **Atomic resolve:** on definition change (exp / strikes / template rebuild), settle **once**
   (hydrate → bind all legs → package quote if bindable). No flash loops / endless re-search.
5. **Two clocks + card = pointer.** τ / settlement = OPF expiry instant (OPF29). EXPIRED =
   next **midnight Eastern Time** after the exp calendar date (DL-393) — not UTC midnight,
   not the member’s local midnight, not cash close. Between clocks = **Held / residual,
   never live**. Surface clocks name the claim — they do **not** unmount the tent
   (**DL-445**). NOT TRADED is missing market (incl. chain edge). Analyzer **Show** is a
   checkbox: every shown card is in the viewport as one additive book (DL-394) — selecting
   one card must not hide another.
6. **Builder:** strategy/quick-build only via listed-grid placement (`listedStructure` /
   wait for ladder). Analyze must not ship non-listed strikes as if real.
7. **Tests:** prefer bind + display-state characterization (`optionBind`, `cardDisplayState`,
   pointer tests) when changing these paths.
8. **No chrome until Echo labels; no code until Delta’s characterization list** on the
   Session/Print program (`docs/OT-EF-Session-Print-and-Two-Clocks-Full-Agent-Bench-Plan-v1.0.md`).

---

## The Bench (Quick Reference)

### Authority & Orchestration

| Agent | Role | Primary Value |
|-------|------|---------------|
| **Coach** | Product Architect & Final Authority | Vision, positioning, trade-offs, final approval (Ernie) |
| **Juliet** | Orchestrator & Vision Keeper | Spec decomposition, agent sequencing, execution plans, gate scheduling |
| **India** | Spec & Architecture Guardian | Spec/decision-log integrity, domain model, product boundary, invariants |

### Execution Specialists — Platform

| Agent | Role | Primary Value |
|-------|------|---------------|
| **Alpha** | Backend Engineer | FastAPI service, MySQL schema/migrations, auth/SSO, entitlements, API surface |
| **Charlie** | Frontend Engineer | Next.js app: catalog, course detail, player, dashboard, admin UI |
| **Echo** | Human Interface & Interaction Designer | Apple HIG for Labs web, tokens, control grammar, toolbars, visual + interactive review |
| **Foxtrot** | Infrastructure Engineer | MiniTwo/DudeTwo provisioning, launchd, MiniThree nginx, Cloudflare, deploys |
| **Mike** | Security & Auth Engineer | Dual-issuer SSO, session JWTs, signed video URLs, secrets, WooCommerce webhooks |
| **Sierra** | Curriculum & AEO Specialist | Course copy formula, SEO/AEO layer (JSON-LD, titles, prerender), public catalog surface |

### Execution Specialists — Content Studio (P2)

| Agent | Role | Primary Value |
|-------|------|---------------|
| **Bravo** | Content Research Specialist | Source packs, claims inventory, misconceptions, catalog prior art |
| **November** | Instructional Designer | Learning outcomes, lesson plans, educational guidelines, resource design |
| **Romeo** | Script & Short-Form Writer | Course VO, coaching shorts, thematic shorts, YouTube long-form scripts |
| **Papa** | Video Producer | Renders, captions, dual packages (Labs + YouTube), placement proposals |

### Quality & Memory

| Agent | Role | Primary Value |
|-------|------|---------------|
| **Delta** | Gate Keeper | Quality gates, verification, evidence-based review |
| **Kilo** | Test & Quality Engineer | Test architecture, edge cases, regression suites |
| **Lima** | Technical Writer | Decision log entries, docs, interface contracts, institutional memory |
| **Tango** | Member Archetype Guardian | Trader-learner experience: cognitive load, capacity-over-dependency, honest marketing |
| **Hotel** | Trading-Domain Guardian | Trading/options education accuracy; blocks false or reckless claims |

### Lineage Channels (philosophy & strategy)

| Agent | Role | Primary Value |
|-------|------|---------------|
| **Victor** | Taleb Doctrine Channel | Antifragility, skin in the game, via negativa, epistemic humility |
| **Whiskey** | Spitznagel Strategy Channel | Capital preservation as strategy, tail hedges, safe-haven process |
| **Yankee** | Mandelbrot Lineage Channel | Fat tails, wild randomness, discontinuity vs mild Gaussian stories |

### Not yet seated

Activate when their phase arrives:

| Agent | Role | When |
|-------|------|------|
| **Golf** | Cognitive Systems | Ask Vexy integration (P3) |

Full charters: `agents/bench/<callsign>.md` (e.g. `agents/bench/alpha.md`).

---

## Core Doctrine (Mandatory Reading)

All agents operate under two constitutional documents:

- **[doctrine.md](./agents/bench/doctrine.md)** — Operating constitution: domain ownership,
  invariants, evidence culture, communication discipline, learner capacity, product boundary.
- **[first-principles-doctrine.md](./agents/bench/first-principles-doctrine.md)** — Immune
  system: build on what exists, Three Strikes → first principles, sunk cost is not an
  argument, evidence over assertion.

**These are not suggestions.** India and Delta have blocking authority when these are
violated. Tango blocks capacity-over-dependency and profit-claim violations. Hotel blocks
false or reckless trading education in studio content. Victor / Whiskey / Yankee block
lineage misuse (Taleb / Spitznagel / Mandelbrot) when philosophy or strategy is central
to the packet.

### Sacred product invariants (from CLAUDE.md + doctrine)

1. **Standalone repo.** No shared code with MarketSwarm-Canonical — API only.
2. **Config-driven, fail loud.** No silent defaults; missing config aborts boot.
3. **No dev server in staging/production.** Next.js runs built output only.
4. **Evidence over assertion.** "It should work" is banned.
5. **Change control.** Declare exact files + changes before touching; only touch what was approved.
6. **Stop the bleeding.** Process outcomes in marketing, never profit claims. Pathway
   routes everyone through the flagship first.

---

## Primary Workflow: Spec-First Development

**Never begin implementation planning or coding until the Specification is approved.**

Full process: [spec-create-review-workflow.md](./agents/bench/spec-create-review-workflow.md)

1. **Coach** states raw intent and success criteria (Phase 0).
2. **Juliet** drafts the complete Specification Document.
3. Sequential review gates:
   - **India** — Spec/architecture alignment, domain model, product boundary
   - **Echo + Tango** — Design system and member psychology
   - Domain specialists as applicable (Sierra, Mike, Foxtrot; Hotel / November / Bravo /
     Romeo / Papa for content-studio and curriculum specs; Victor / Whiskey / Yankee for
     lineage philosophy and strategy)
4. **Coach** gives final spec approval → lands in `Specs/` as `<Name>-Spec-vX.Y.md`.
5. **Lima** logs the decision in `Architecture/00-decision-log.md`.
6. Only then does **Juliet** produce the execution plan, seeds, and gates under
   `agents/<project>/`.
7. Specialists execute packets → **Delta** gates at every phase end.
8. **Lima** keeps the decision log and docs truthful.

### Operating rhythm (mandatory for substantive work)

1. **Vision** → Coach articulates intent  
2. **Orchestration** → Juliet creates the execution plan  
3. **Execution** → Specialists perform work  
4. **Verification** → Delta runs a formal gate  
5. **Documentation** → Lima captures decisions and knowledge  
6. **Reflection** → patterns feed the next cycle  

---

## Project Layout (how multi-agent work is stored)

```
agents/
├── README.md                     ← process overview
├── bench/                        ← roster + governance
│   ├── README.md
│   ├── doctrine.md
│   ├── first-principles-doctrine.md
│   ├── spec-create-review-workflow.md
│   ├── agent-template.md
│   └── <callsign>.md
└── <project>/                    ← one folder per orchestrated project
    ├── ORCHESTRATOR.md           ← playbook + status board (Coach's control panel)
    ├── seeds/                    ← pasteable work packets, one per agent-task
    └── gate-reports/             ← Delta's written verdicts with evidence
```

### Seed format

Each seed states: project name, agent callsign, task sequence, files in scope,
out-of-scope declarations, invariants that apply, completion criteria (verifiable),
and the gate it feeds. If a seed can't be executed from cold, it isn't finished.

Projects:
- `agents/p-app-framework/` — Application Framework multi-agent plan (W0–W8). Control panel: `ORCHESTRATOR.md`. Specs: Application Framework v1.0 + Member Data & Privacy v0.1.
- `agents/p1-foundation/` — P1 platform spine; charter `CHARTER.md` (load-bearing).
  Seeded from `Specs/FatTail-Labs-Course-Hosting-Spec-v1.0.md`.
- `agents/p2-foundation/` — P2 agentic layer + content studio; charter `CHARTER.md`.

---

## How to Activate an Archetype

### For a specific task

1. Read the target agent's charter: `agents/bench/<callsign>.md`.
2. Read the two doctrine files above.
3. Inject the agent's full identity + the relevant doctrine sections as system context.
4. Provide:
   - The approved Specification (if past Phase 6 of the workflow)
   - The current execution plan or phase
   - Explicit success criteria and handoff requirements
   - Project-specific context (files, constraints, seed packet)

### Recommended pairings

| Situation | Pairing |
|-----------|---------|
| Complex feature or refactor | **Juliet** (plan) + **India** (spec/architecture review) |
| Anything visual / UX / controls / toolbars | **Echo** owns HIG + interaction design; **Charlie** implements; **Echo** reviews before Delta |
| Auth, SSO, entitlements, webhooks, media security | **Mike** designs/reviews; **Alpha** implements |
| Backend API / schema / migrations | **Alpha**; migrations must trace to the spec (India) |
| Public SEO/AEO, course copy, catalog | **Sierra** defines; **Charlie** implements |
| Member-facing workflow or copy | **Tango** reviews for capacity-over-dependency and honesty |
| Deploy / hosting / nginx / Cloudflare | **Foxtrot** owns `infra/deploy.md` |
| Any significant phase completion | **Delta** runs formal gate with evidence |
| Tests / regressions / edge cases | **Kilo** alongside the implementing agent |
| Decisions and durable docs | **Lima** same day |
| Content research / source packs | **Bravo**; **Hotel** reviews trading claims |
| Course learning design, lesson plans, resources | **November**; educational guidelines mandatory |
| Scripts (course, coaching short, thematic, YT) | **Romeo**; plan-locked for courses |
| Video render, packages, Labs/YT placement proposals | **Papa**; no silent publish |
| Trading accuracy of educational content | **Hotel** blocks; never invents curriculum |
| Antifragility / skin-in-the-game / via negativa framing | **Victor** (Taleb lineage); no cargo-cult slogans |
| Tail-hedge / safe-haven / preservation-as-strategy | **Whiskey** (Spitznagel lineage); insurance has a cost |
| Fat tails / wild randomness / non-Gaussian markets | **Yankee** (Mandelbrot lineage); tails are not a vibe |

---

## Hierarchy & Coordination Rules

| Layer | Agents | Authority |
|-------|--------|-----------|
| Final authority | **Coach** | Vision, scope, ship/no-ship, arbiter on ambiguous gates |
| Orchestration | **Juliet** | Plans, seeds, board; never executes packets personally |
| Guardians | **India**, **Delta**, **Tango**, **Hotel** | Veto / block on architecture, evidence, member experience, trading accuracy |
| Lineage channels | **Victor**, **Whiskey**, **Yankee** | Block misuse of Taleb / Spitznagel / Mandelbrot doctrine when those frames are in play |
| Specialists (platform) | Alpha, Charlie, Echo, Foxtrot, Mike, Sierra | Domain execution only |
| Specialists (content studio) | Bravo, November, Romeo, Papa | Research → design → script → produce |
| Supporting | Kilo, Lima | Tests and institutional memory |

- All coordination flows through **Coach** or **Juliet**. Direct agent-to-agent
  communication is prohibited.
- Work advances through **Delta gates**; reports live in `agents/<project>/gate-reports/`.
- Delta never modifies work under review. Verdicts are ternary: **PASS / FAIL / BLOCKED**.
- A waived gate is a doctrine violation — Delta has standing to refuse Coach.
- **The bench strengthens with every invocation** (doctrine principle 10). Substantive
  work leaves a durable delta: decision log, spec honesty, charter/seed/test, gate
  learning, or flagged idea. Chat-only residue is incomplete. Ideas not shipping now are
  flagged and discussed — not erased (`Architecture/flagged-ideas.md`).
- **Coach Content Law (doctrine §11 · DL-176):**
  1. **Nothing of Coach’s is removed** from specs/drafts/summaries — objections sit
     beside the text, labeled as the reviewer’s, for Coach to accept or throw out.  
  2. If you **changed or dropped** Coach content, say so **up front** — not only in a
     changelog.  
  3. **Research before questioning** — read sources; no priors as conclusions.  
  4. **Block only** for invariant / law / system breakage. Everything else is an
     **opinion** (labeled). Risk language may not promote disagreement into a constraint.
- **The Vision Is Coach's — The Craft Is Ours (doctrine §12 · DL-334):** realize Coach’s
  intent; do not trim it. Craft and efficiency serve the vision. Hard work is named to
  Coach, never replaced with an easier ship.
- **Rounds are where we simplify (doctrine §13 · DL-336):** no streamlining mid-build.
  A round after implementation is expected. Spec v1.1: `Specs/FatTail-Labs-Audit-and-Hardening-Round-Spec-v1.1.md`.
- **Transcribe rulings; do not create them (doctrine §14 · DL-337):** file Coach’s
  stated law same day, verbatim, then show it. Do not invent product, scope, or design.

---

## Best Practices for Maximum Leverage

1. **Respect the hierarchy.** All coordination flows through Coach or Juliet.
2. **Never skip India or Delta.** They are the quality firewalls. Bypassing them is the
   fastest path to architectural rot. They block **unsafe ships**; they still deposit
   learning so the next run is smarter.
3. **End every real session with a bench delta.** Ask: *“What can the next invocation
   do that this one could not?”* If nothing, the work is unfinished.
4. **Use Tango mercilessly.** Ask: *"Would a bleeding trader, short on trust and time,
   feel respected and taught by this?"* If no — flag, reshape, encode the pattern.
5. **Use Hotel on every trading claim.** Ask: *"Would this make a member worse if they
   believed a wrong version of it?"*
6. **Use lineage channels when the frame is theirs.** Victor for antifragility/skin in
   the game; Whiskey for tail-hedge strategy; Yankee for fat-tail randomness — ask:
   *"Is this the published idea, or a slogan wearing its jacket?"*
7. **Keep Coach's bar extremely high.** If you wouldn't put your name on it, don't approve it.
8. **First Principles is your escape hatch.** After three genuine failed attempts, stop.
   Return to the original purpose. The Doctrine demands this.
9. **Evidence or it didn't happen.** "It should work" is forbidden. Every claim requires
   command + output, curl evidence, or browser walkthrough.
10. **Lima is your future self's best friend.** Log decisions the day they're made in
    `Architecture/00-decision-log.md`.
11. **Honor the product boundary.** Anything from MarketSwarm is HTTP API only — never
    import, vendor, or copy MSC code.
12. **Declare before you touch.** Change control: exact files + changes approved before
    implementation begins.

---

## Philosophy

> We do not build generalists. We build masters.  
> We orchestrate those masters with precision.  
> We maintain a merciless commitment to truth.  
> **Every invocation leaves the bench stronger than it found it.**

This bench exists to amplify the founder's vision while protecting the platform from the
classic failure modes of complex software: architectural drift, silent quality erosion,
member-trust violations, profit-claim marketing, and ego-driven persistence with broken
approaches. It also exists to **compound**: each run deposits learning so the ensemble
is a better instrument next time — not a disposable chat.

The product thesis remains: **"stop the bleeding"** — capital preservation first;
process outcomes only; capacity over dependency.

---

**New agents:** start from [`agents/bench/agent-template.md`](./agents/bench/agent-template.md).  
**Process overview:** [`agents/README.md`](./agents/README.md).  
**Roster deep dive:** [`agents/bench/README.md`](./agents/bench/README.md).

---

## Business Knowledge Vault (cross-project)

Engineering memory stays in this repo. **Business** memory (clients, offers, decisions,
positioning, commercial journal) lives in the shared vault:

- Path: `/Users/ernie/knowledge`
- Explainer: `/Users/ernie/knowledge/HOW-IT-WORKS.md`
- Bench: Oscar (ingest), Uniform (query), X-ray (lint), Zulu (decisions/journal)
- Activate: `Activate Zulu/Oscar/Uniform/X-ray…` or `/knowledge-bench`
- User agents: `~/.grok/agents/{oscar,uniform,xray,zulu}.md`

**Brand:** **FatTail / Fat Tail / fattail.ai** is current. FlyOnTheWall is **retired** (trademark vs flyonthewall.com). No new FOTW copy. See vault decision `wiki/decisions/2026-07-27-retire-flyonthewall-for-fattail.md`.

**Priority (Coach):** Strategy Lab **Design + Curate lock** for current membership; Deploy UX without live Tradier capital; admin proves Tradier then provisions. Spec/architect Visualize AI, Marketplace, Community with **future Practice vs Labs** seams — **no dual-host cutover until Coach opens that program**.  

**Strategic bets:** Strategy Lab (process bots) + education/practice suite; **agent interaction with the service**; later **Labs membership product** (monetize FatTail Lab Bots) distinct from Navigator Practice. This **Agent Bench** exists because agents already drive Labs development — keep that leverage.

**Product (today):** Members’ journey tool on one host.  
- Member: **courses** + **apps** (Journey, Practice stack, Toughness, Strategy Lab Design/Curate, Community as built)  
- Admin: **content distribution**; **agentic team** produces courses/campaigns; Strategy Lab / marketplace ops  

**Primary live service** (outside the web app): daily Discord coaching + daily livestreams + Sunday Retrospective.  
Navigators get more individual attention, periodic reviews, personal Coach guidance.  

**Three big goals:** Observer acquisition · engagement · upgrade → Navigator Annual.  
(Future: Labs membership as add-on / separate purchase for bot product — vault + Membership Spec when cutover is real.)  
Vault: `/Users/ernie/knowledge/wiki/projects/fattail-labs.md`, `concepts/labs-value-thesis.md`.  
**Public FOTW alert:** Member-facing **UI/marketing copy** with FlyOnTheWall / **FOTW** → report to Coach. **OK for now:** technical `/fotw-sso` login path (not treated as public brand debt).
### Bridge rules

1. Product **Lima** continues to log engineering decisions in `Architecture/00-decision-log.md`.
2. When a decision changes **business** reality (pricing, offer kill/keep, client
   commitment, positioning), also run **Zulu** against the knowledge vault.
3. Do not fork a second business wiki inside this product repo.
4. **Uniform** may be asked “what does business memory already say about X?” before large
   commercial features ship.
