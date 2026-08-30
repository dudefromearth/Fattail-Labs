# agents/ — Agentic Process Architecture

How multi-agent work runs in this repo. Duplicated from the Fly-on-the-Wall Canonical
operating model, adapted to FatTail Labs.

## Structure

```
agents/
├── README.md                     ← this file
├── bench/                        ← the roster: one file per agent + governance
│   ├── README.md                 ← roster overview
│   ├── doctrine.md               ← constitution: principles, hierarchy, rhythm
│   ├── first-principles-doctrine.md  ← intellectual-honesty law
│   ├── spec-create-review-workflow.md ← pre-implementation process
│   ├── agent-template.md         ← template for new agents
│   └── <callsign>.md             ← agent charters (coach, juliet, india, alpha, …)
└── <project>/                    ← one folder per orchestrated project
    ├── ORCHESTRATOR.md           ← playbook + status board (Coach's control panel)
    ├── seeds/                    ← pasteable work packets, one per agent-task
    └── gate-reports/             ← Delta's written verdicts with evidence
```

## The process

1. **Spec first.** Nothing is orchestrated without an approved spec
   (`bench/spec-create-review-workflow.md`).
2. **Juliet decomposes** the spec into phases and packets; each packet gets a **seed** —
   a self-contained instruction file an agent session can execute from cold, with
   explicit completion criteria.
3. **Coach runs the board** from `ORCHESTRATOR.md`: open a session, load the seed,
   receive PASS/FAIL/BLOCKED, decide advance · re-seed · stop. Coach never executes
   packets personally.
4. **Every phase ends at a Delta gate.** Delta verifies with live evidence and files a
   report in `gate-reports/`. No waived gates.
5. **Lima logs decisions** in `Architecture/00-decision-log.md` as they happen.

## Seed format

Each seed states: project name, agent callsign, task sequence, files in scope,
out-of-scope declarations, invariants that apply, completion criteria (verifiable),
and the gate it feeds. If a seed can't be executed from cold, it isn't finished.

## Projects

- `agents/p-options-lab-tm-os/` — **Time Machine One Source** (StudioOne for every date including today).  
  Spec **v0.2.1 DRAFT — stamp candidate:** `Specs/FatTail-Labs-Options-Lab-Time-Machine-One-Source-Spec-v0_2_1.md`.  
  **Plan v1.2:** `docs/Options-Lab-Time-Machine-One-Source-Full-Agent-Bench-Plan-v1.2.md`.  
  Token: `agents/go/TMOS-W0.md`. **Next: W0-0 Coach stamp of plan v1.2 + spec v0.2.1 BUILD AUTHORITY · no product code before W0-G.**  
  Snapshot (Reset then raise). Full download. Average is not replay. Instant Replay / Day boards stay PARKED.
- `agents/p-options-lab-tm/` — **Options Lab Time Machine** (one surface, one scrubber, today pre-selected).  
  Spec **v0.7.4 BUILD AUTHORITY:** `Specs/FatTail-Labs-Options-Lab-Time-Machine-Spec-v0_7_4.md` · **DL-598**.  
  **Plan v1.2:** `docs/Options-Lab-Time-Machine-Full-Agent-Bench-Plan-v1.2.md`.  
  Token: `agents/go/TM-W0.md`. **W-G PASS** (closed). Instant Replay and Day boards are **PARKED**.
- `agents/p-options-lab-tmi/` — **PARKED.** 32 seeds, never stamped. Not live law. See `PARKED.md`. Stamp `TM-W0.md` / `p-options-lab-tm` instead.  
  Spec: `Specs/FatTail-Labs-Options-Lab-Time-Machine-Instant-Replay-Spec-v0_1_1.md` **DRAFT** (folded).  
  Token: `agents/go/TMI-W0.md` **SUPERSEDED**.
- `agents/p-trader-development/` — **Trader Development** (Practice formation OS:
  Playbook · Campaign · Tags productization · Match hygiene sync/charts · season retro).  
  Specs: `Specs/FatTail-Labs-Trader-Development-*.md`.  
  **Full multi-agent plan:** `Docs/Trader-Development-Full-Agent-Bench-Plan-v1.0.md`.  
  Phase plans: `Docs/Trader-Development-Phase-*-Agent-Bench-Plan.md`.  
  Board: `agents/p-trader-development/ORCHESTRATOR.md`.  
  **Next: Spec finish pass → TD0-0 Coach GO · no TD1+ code before TD0-G.**
- `agents/p-strategy-runtime/` — **Strategy Lab Process Runtime** (deployment instances,
  decision log, arming, Deployment Pack, Tradier paper→live, M0–M2 first; M3 optional).  
  Spec: `Specs/Strategy-Lab-Process-Runtime-Spec-v1.1.md`.  
  **Scope:** `docs/Strategy-Lab-Process-Runtime-Implementation-Scope-v1.0.md`.  
  **Full multi-agent plan:** `docs/Strategy-Lab-Process-Runtime-Full-Agent-Bench-Plan-v1.0.md`.  
  Board: `agents/p-strategy-runtime/ORCHESTRATOR.md`.  
  **Next: Coach SR0-0 ACK · LEGAL-* external · no SR1+ code before SR0-G.**
- `agents/p-access-control/` — **Access Control (admin role/plan gating)** for surfaces,
  apps, and course elements (campaign-ready policies). Spec:
  `Specs/FatTail-Labs-Access-Control-Spec-v0.4.md`.  
  **Full multi-agent plan:** `docs/Access-Control-v0.4-Full-Agent-Bench-Plan.md`.  
  Board: `agents/p-access-control/ORCHESTRATOR.md`.  
  **Next: W0 reviews → Coach BUILD AUTHORITY** (no engine code before W0-G).
- `agents/p-tag-manager/` — **Platform Tag Manager FIRST** (admin-only CRUD; members
  assign only; Resources hub Lexicon; no `/me` tags). **Completes before Journal Session.**
  Plan: `docs/Tag-Manager-Implementation-Plan.md`. Board:
  `agents/p-tag-manager/ORCHESTRATOR.md`. **Next: Spec amend + TM0 GO.**
- `agents/p-journal-session-v06/` — **Journal Session v0.6** (one conversation per date;
  calendar cells = control; fixed thread; header media; Tag Manager assign-only).  
  **Canonical full agent bench plan:**
  `docs/Journal-Session-v0.6-Full-Agent-Bench-Plan.md`. Spec:
  `Specs/FatTail-Labs-Journal-Session-Spec-v0.6.md`. Board:
  `agents/p-journal-session-v06/ORCHESTRATOR.md`. **PROGRAM COMPLETE** (DL-161/162 · JS6-9-G).
  Residual plan: `docs/Journal-Session-v0.6-Residual-Agent-Bench-Plan.md`.
- `agents/p-journal-session-v05/` — **Substrate only** (v0.5 partial land). Product frame
  **superseded** by v0.6. Do not expand multi-entry chrome.
- `agents/p-journal-session-v04/` — **COMPLETE under Spec v0.4a** — **superseded** by v0.5/v0.6.
  Historical only.
- `agents/p-journal-session/` — **COMPLETE under Spec v0.2** — historical only.
- `agents/p-retrospective-v07/` — **Journal Retrospective v0.7.1** (ceremony walk, not report;
  anti-wizard; trader cadence; message routine day; keep-rate fact + specificity).
  Spec: `Specs/FatTail-Labs-Journal-Retrospective-Spec-v0.7.1.md`.  
  **Canonical plan:** `docs/Journal-Retrospective-v0.7.1-Full-Agent-Bench-Plan.md`.  
  Board: `agents/p-retrospective-v07/ORCHESTRATOR.md`. **Next: R0 reviews → Coach GO.**
- `agents/p-retrospective/` — **v0.6 as-built substrate** (**COMPLETE** RT8-G). Historical /
  dual-read until v0.7.1 R-phases land. Specs: Retrospective **v0.5/v0.6**.
- `agents/p-member-export/` — **Practice portability** (export/import/purge, demo pack).
  Spec: `Specs/FatTail-Labs-Member-Practice-Export-Spec-v1.1.md`.
- `agents/p-practice-harden/` — **Practice stack architectural hardening** (H0–H4:
  isolation, batch legs, single-source position/PnL, module splits, Spec truth).
  Collaboration-mandatory seeds. Board: `agents/p-practice-harden/ORCHESTRATOR.md`.
  Charter: `agents/p-practice-harden/CHARTER.md`.
- `agents/p-trade-log/` — **Trade Log v1.1** (options blotter, accounts, canonical I/O,
  Journal/Records contracts — multi-account totals & charts). Spec:
  `Specs/FatTail-Labs-Trade-Log-Spec-v1.1.md`. Board:
  `agents/p-trade-log/ORCHESTRATOR.md`. Seeds TL0–TL6.
- `agents/p-accounts-capital/` — **Accounts & Capital stack** (identity capital surface;
  ledger abolition; cash movements; balance vs trading curves; composition; staleness;
  undirected stamps; Practice/Lab consume only). Specs: Capital v0.3 · Funding v0.2 ·
  Staleness v0.1 · Top-Level Account Amendment · Trade Log undirected amend.  
  **Full multi-agent plan:** `docs/Accounts-Capital-Full-Agent-Bench-Plan-v1.0.md`.  
  Board: `agents/p-accounts-capital/ORCHESTRATOR.md`.  
  **Next: W0-1…W0-5 → W0-G · no L/A/F code before W0-G.**
- `agents/p-campaign-phase/` — **Campaign Phase & Charter Tiering** (Big Three sign gate;
  dormant-until-adopted optionals; end-on-close; Same-bet Tier 2; CR-12 charter-only;
  phase report strip: free cash / free margin / P13 DD% / strategy mix; prune judgment).  
  Spec: `Specs/FatTail-Labs-Campaign-Phase-and-Charter-Tiering-Spec-v1.0.md` (v1.0.1).  
  **Full multi-agent plan:** `docs/Campaign-Phase-Charter-Tiering-Full-Agent-Bench-Plan-v1.0.md`.  
  Board: `agents/p-campaign-phase/ORCHESTRATOR.md`.  
  **PROGRAM PASS (Z-G 2026-08-09)** · residual polish: Trade Log deep link · retro picker · MiniTwo deploy.
- `agents/p-options-chain-picker/` — **Options Chain Picker** (Admin-universe symbol;
  next-3 distinct expiries + DTE; vertical ladder / wings; proxy-safe spot/vol; **OC15 minimal**
  in-process generation; strike-level diffs; HIG; preform calendar v1.1).  
  Spec: `Specs/FatTail-Labs-Options-Chain-Picker-Spec-v1.0.2.md` (v1.0.2).  
  **Full multi-agent plan:** `docs/Options-Chain-Picker-Full-Agent-Bench-Plan-v1.0.md`.  
  Board: `agents/p-options-chain-picker/ORCHESTRATOR.md`.  
  **PROGRAM PASS (Z-G 2026-08-10)** · **OC15 production scale is Market Bus MB-P1 (successor)**.
- `agents/p-market-bus/` — **Massive Market Bus** (Massive → feeds → Redis → one WS/tab →
  shared client; Options Lab consumer; scale without N× Massive).  
  Spec: `Specs/FatTail-Labs-Massive-Market-Bus-Shared-Client-Spec-v1.0.md` v1.0.1.  
  Arch: `Architecture/28-massive-market-bus.md`.  
  **Full multi-agent plan:** `docs/Massive-Market-Bus-Full-Agent-Bench-Plan-v1.0.md`.  
  Board: `agents/p-market-bus/ORCHESTRATOR.md`.  
  **PROGRAM COMPLETE for independent testing (DL-286)** · enable `LABS_MARKET_BUS=1` + Redis.
- `agents/p-options-lab-heatmap/` — **Options Lab Heatmap** (dual-side pure templates;
  **Advanced Fly** residual **replaces** Symmetric Fly on the same OPF-held chain).  
  Spec: `Specs/FatTail-Labs-Options-Lab-Heatmap-Advanced-Fly-Spec-v0_2.md` (v0.2.1).  
  Parent plan: `docs/Options-Lab-Heatmap-Templates-Full-Agent-Bench-Plan-v1.0.md`.  
  **Active impl plan v1.1.1:** `docs/Options-Lab-Heatmap-Advanced-Fly-Full-Agent-Bench-Plan-v1.1.md`.  
  Board: `agents/p-options-lab-heatmap/ORCHESTRATOR.md`.  
  **Next: AF0 seeds → AF0-G · Coach AF0-0 · no AF-H/M code before GO.**
- `agents/p-ot-ef-session-print/` — **OT-EF v1.1 · Session/Print · two clocks** (doctrine
  fold; Echo labels; Delta characterization list; then OPF envelope after Coach W3-0).
  Doctrine: `Specs/FatTail-Labs-Options-Lab-OPF-Truth-and-Elegant-Failure-Doctrine-v1.1.md`.
  Session/Print: `Specs/FatTail-Labs-OPF-Session-and-Print-Authority-Spec-v0.1.md` (**DRAFT**).
  **Full multi-agent plan:** `docs/OT-EF-Session-Print-and-Two-Clocks-Full-Agent-Bench-Plan-v1.0.md`.
  Board: `agents/p-ot-ef-session-print/ORCHESTRATOR.md`.
  **Next: W0-G → fire W1-1 Echo · W2-1 Delta · W3-1 India in parallel. No chrome until
  W1. No code until W2. No BUILD until W3-0.**
- `agents/p-options-lab-surface/` — **Options Lab 3D Surface** (App Spec
  v0.1.8 accepted · S1–S8 closed · plan **v1.0.1 DRAFT** until W0-G).
  Spec: `Specs/FatTail-Labs-Strategy-Lab-3D-Surface-App-Spec-v0.1.8.md`.
  **Plan:** `docs/Options-Lab-3D-Surface-Full-Agent-Bench-Plan-v1.0.md`.
  **W0 token:** `agents/go/OLS-W0.md` (DL-328 — Delta reads the file).
  Board: `agents/p-options-lab-surface/ORCHESTRATOR.md`.
  **Next: W3-1 (W0-G + W1-G + W2-G PASS). No migration before W3-4.
  Do not seed Backtest here.**
- `agents/p-options-lab-surface-autofit/` — **Surface Autofit** (Spec
  **v0.1.1 ACCEPTED** · **DL-421**). Plan
  `docs/Options-Lab-Surface-Autofit-Full-Agent-Bench-Plan-v1.0.md` · **DL-422**.
  **W0 token:** `agents/go/OLSAF-W0.md` (GO · W0–W5 PASS).
  Do not seed AF-n. Do not reopen Surface first-ship.
- `agents/p-az-what-if-tm/` — **Analyzer What-If Time & Measured Vol** (slider remaining
  = last trade; vol = measured listed IV + OPF31 additive; τ stays OPF 16:00).  
  Spec: `Specs/FatTail-Labs-Options-Lab-Analyzer-What-If-Time-and-Measured-Vol-Spec-v0.1.md`
  (**DRAFT · India fold**).  
  **Plan:** `docs/Options-Lab-Analyzer-What-If-Time-and-Measured-Vol-Full-Agent-Bench-Plan-v1.0.md`.  
  Board: `agents/p-az-what-if-tm/ORCHESTRATOR.md`.  
  **Next: Coach stamp impl plan to fire W1, or W0-0 review first.**  
  Impl: `docs/Options-Lab-Analyzer-What-If-Time-and-Measured-Vol-Implementation-Plan-v1.0.md`.
- `agents/p-az-viewport-2d/` — **Analyzer 2D viewport drag & scroll** (sticky view;
  left-drag pans; right-click alerts; live BE / What-if must not Autofit).  
  Law: `docs/Options-Lab-Analyzer-Viewport-Drag-Scroll-Analysis-2026-08-19.md`.  
  **Plan:** `docs/Options-Lab-Analyzer-Viewport-Drag-Scroll-Full-Agent-Bench-Plan-v1.0.md`.  
  Board: `agents/p-az-viewport-2d/ORCHESTRATOR.md`.  
  **Next: W0-0 Coach stamp · no PnLChart code before W0-BA (or impl+DL).**  
  Impl: `docs/Options-Lab-Analyzer-Viewport-Drag-Scroll-Implementation-Plan-v1.0.md`.
- `agents/p-az-algo/` — **Analyzer Algo Alert** (OTM-fly **narrative trail**, not a flatten).  
  Spec: `Specs/FatTail-Labs-Options-Lab-Analyzer-Algo-Alert-Spec-v1.0.md` (**v1.0.2 DRAFT** · **DL-472** · **DL-473** · **DL-488**).  
  **Plan:** `docs/Options-Lab-Analyzer-Algo-Alert-Full-Agent-Bench-Plan-v1.0.md` **v1.0.3** · **DL-474** · **DL-489**.  
  Board: `agents/p-az-algo/ORCHESTRATOR.md`.  
  **W1–W3 PASS.** Next: W3-R (Reason) · W4 HOLD (Packet A / C2). Demo + Reason **in**.  
- `agents/p-az-atm/` — **PARKED.** 15 seeds; W0-0 / W0-BA / W1-G / W2-G already ran. Remaining W3 Enhanced / W4 TPO are NX on the unified GO. See `PARKED.md`. Use `p-options-lab-tm`.  
  Spec: `Specs/FatTail-Labs-Options-Lab-Analyzer-Time-Machine-Spec-v0.1.md` (**v0.1.1 DRAFT** · **DL-486** · **DL-487**).  
  **Plan:** `docs/Options-Lab-Analyzer-Time-Machine-Full-Agent-Bench-Plan-v1.0.md` **v1.0** · **DL-489**.  
  Board: `agents/p-az-atm/ORCHESTRATOR.md`.
- `agents/p-alerts/` — **Labs Alerts** (two planes: Manager + API · Analyzer first client).  
  Specs: ALM v1.0.1 · AZ-ALB v1.0.1 · **DL-464**.  
  **Plan:** `docs/Labs-Alerts-Full-Agent-Bench-Plan-v1.0.md` **v1.0.3**.  
  Board: `agents/p-alerts/ORCHESTRATOR.md`.  
  **Next: W0-0 Coach stamp.** Packet M ∥ C1 after W0-BA. Packet C2 blocked until both viewport W-G + India C2-0 + C2-BA. If W0-G names the canvas menu reachable, W0-BA must keep-dark or accept-as-built+DL. No MiniTwo until asked.
- `agents/p-app-framework/` — **Application Framework implementation** (active plan).
  Charter + full multi-agent board: `agents/p-app-framework/ORCHESTRATOR.md`.
  Specs: `Specs/FatTail-Labs-Application-Framework-Spec-v1.0.md`,
  `Specs/FatTail-Labs-Member-Data-Privacy-Spec-v0.1.md`. Waves W0 (spec lock) →
  W1 Family A stay-put → W2 privacy spine → W3–W6 Family B tools → W7 admin
  consent access → W8 close.
- `agents/p1-foundation/` — P1 course platform spine. Charter:
  `agents/p1-foundation/CHARTER.md` (retroactive; load-bearing). Gate 1 + seeds from
  `Specs/FatTail-Labs-Course-Hosting-Spec-v1.0.md`. Review:
  `docs/P1-Foundations-Review.md`.
- `agents/p2-foundation/` — P2 agentic operating layer + content studio (charter draft;
  studio archetypes: Bravo, November, Romeo, Papa, Hotel; lineage channels: Victor,
  Whiskey, Yankee). Capabilities delivered into P1:
  `docs/P2-Capabilities-for-P1.md`.
- `agents/p-hig/` — Human Interface compliance board (tokens, surfaces, appearance).
- `agents/p-canonical-course/` — **Canonical Course Model** (portable course JSON:
  export/import/validate). Plan: `IMPLEMENTATION-PLAN.md`. Spec:
  `Specs/FatTail-Labs-Canonical-Course-Model-Spec-v1.0.md`.
- `agents/p-resources/` — **First-class versioned Resources** (library publish +
  course pins). Plan: `IMPLEMENTATION-PLAN.md`. Spec:
  `Specs/FatTail-Labs-Resource-Spec-v1.0.md`. Design:
  `Architecture/10-resources-design.md`.
