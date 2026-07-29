# Seeds — p-practice-harden

Execute in phase order. **Every seed names Primary + required Reviewers.**  
A seed is incomplete until all required reviewers **APPROVED**.

## H0 — Safety

| Seed | File | Primary | Reviewers |
|------|------|---------|-----------|
| PH0-0 | `PH0-0-juliet-board-freeze.md` | Juliet | Coach |
| PH0-1 | `PH0-1-alpha-mike-identity-gate.md` | Alpha | Mike · India |
| PH0-2 | `PH0-2-alpha-kilo-batch-legs.md` | Alpha | Kilo · India |
| PH0-3 | `PH0-3-kilo-alpha-mike-characterization.md` | Kilo | Alpha · Mike |
| PH0-G | `PH0-G-delta-gate.md` | Delta | — |

## H1 — Domain truth

| Seed | File | Primary | Reviewers |
|------|------|---------|-----------|
| PH1-0 | `PH1-0-india-domain-design.md` | India | Alpha · Charlie · Coach |
| PH1-1 | `PH1-1-alpha-domain-module.md` | Alpha | India · Kilo |
| PH1-2 | `PH1-2-alpha-analytics-api.md` | Alpha | India · Mike · Kilo |
| PH1-3 | `PH1-3-charlie-wire-clients.md` | Charlie | Alpha · Kilo |
| PH1-4 | `PH1-4-alpha-seeds-share-domain.md` | Alpha | Kilo |
| PH1-5 | `PH1-5-tango-hotel-copy.md` | Tango · Hotel | India |
| PH1-G | `PH1-G-delta-gate.md` | Delta | — |

## H2 — Module boundaries

| Seed | File | Primary | Reviewers |
|------|------|---------|-----------|
| PH2-1 | `PH2-1-alpha-split-routes.md` | Alpha | India · Kilo |
| PH2-2 | `PH2-2-charlie-api-client.md` | Charlie | Alpha · Echo |
| PH2-3 | `PH2-3-charlie-split-journal.md` | Charlie | Echo · Kilo |
| PH2-4 | `PH2-4-charlie-split-reports.md` | Charlie | Echo · Kilo |
| PH2-5 | `PH2-5-charlie-practice-slugs.md` | Charlie | India |
| PH2-G | `PH2-G-delta-gate.md` | Delta | — |

## H3 — Spec / institutional truth

| Seed | File | Primary | Reviewers |
|------|------|---------|-----------|
| PH3-1 | `PH3-1-india-lima-spec-asbuilt.md` | India · Lima | Coach |
| PH3-2 | `PH3-2-lima-decision-log.md` | Lima | India · Juliet |
| PH3-3 | `PH3-3-juliet-ops-vs-product.md` | Juliet | Coach |
| PH3-4 | `PH3-4-india-nongoals.md` | India | Coach |
| PH3-G | `PH3-G-delta-gate.md` | Delta | — |

## H4 — Performance UX (Coach-gated optional)

| Seed | File | Primary | Reviewers |
|------|------|---------|-----------|
| PH4-0 | `PH4-0-coach-gono.md` | Coach | Juliet |
| PH4-1 | `PH4-1-charlie-virtualize.md` | Charlie | Echo · Kilo |
| PH4-2 | `PH4-2-alpha-server-filters.md` | Alpha | India · Kilo |
| PH4-G | `PH4-G-delta-gate.md` | Delta | — |

## Seed template

```markdown
# Seed PHn-x — <Primary>: <title>

Primary: …
Reviewers (required): …
Prerequisite: …
Goal: …
Files in scope: …
Out of scope: …
Invariants: …
Collaboration / review protocol: …
Completion criteria: …
Feeds: …
```
