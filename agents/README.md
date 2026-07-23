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

- `agents/p1-foundation/` — P1 build of the course platform (backend spine, public read
  path, member path, admin builder), seeded from
  `Specs/FatTail-Labs-Course-Hosting-Spec-v1.0.md`.
- `agents/p2-foundation/` — P2 agentic operating layer + content studio (charter draft;
  studio archetypes: Bravo, November, Romeo, Papa, Hotel; lineage channels: Victor,
  Whiskey, Yankee).
