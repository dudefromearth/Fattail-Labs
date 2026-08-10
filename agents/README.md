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
  next-3 distinct expiries + DTE; vertical ±σ ladder; proxy-safe spot/vol; shared Massive
  generation; strike-level diffs; **Apple HIG / Human Interface Spec** on prelim + production;
  preform calendar v1.1 required).  
  Spec: `Specs/FatTail-Labs-Options-Chain-Picker-Spec-v1.0.2.md` (v1.0.2).  
  **Full multi-agent plan:** `docs/Options-Chain-Picker-Full-Agent-Bench-Plan-v1.0.md`.  
  Board: `agents/p-options-chain-picker/ORCHESTRATOR.md`.  
  **PROGRAM PASS (Z-G 2026-08-10)** · residual: Admin calendar refresh chrome · MiniTwo deploy.
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
