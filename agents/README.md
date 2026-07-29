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

- `agents/p-practice-harden/` — **Practice stack architectural hardening** (H0–H4:
  isolation, batch legs, single-source position/PnL, module splits, Spec truth).
  Collaboration-mandatory seeds. Board: `agents/p-practice-harden/ORCHESTRATOR.md`.
  Charter: `agents/p-practice-harden/CHARTER.md`.
- `agents/p-trade-log/` — **Trade Log v1.1** (options blotter, accounts, canonical I/O,
  Journal/Records contracts — multi-account totals & charts). Spec:
  `Specs/FatTail-Labs-Trade-Log-Spec-v1.1.md`. Board:
  `agents/p-trade-log/ORCHESTRATOR.md`. Seeds TL0–TL6.
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
