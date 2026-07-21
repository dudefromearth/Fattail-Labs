# Agent Bench — FatTail Labs

A disciplined ensemble of specialized AI agents purpose-built for the development and
long-term evolution of the FatTail Labs course platform.

This is not a loose collection of prompts. It is a structured development organization —
each agent with deep domain mastery, strict invariants, and clear coordination protocols.
Same callsigns and governance as the Fly-on-the-Wall bench; domains remapped to this
product.

**Governed by:** `doctrine.md` and `first-principles-doctrine.md`
**Pre-implementation process:** `spec-create-review-workflow.md`
**New agents:** start from `agent-template.md`

---

## Core Philosophy

- **Narrow & Deep Expertise** — every agent owns one domain completely and stays in it.
- **Sacred Invariants** — non-negotiable rules that protect system integrity.
- **Evidence-Based Culture** — no assumptions; only verified outputs and command evidence.
- **Canonical Truth** — the approved Spec (`Specs/`) + decision log
  (`Architecture/00-decision-log.md`) are the single source of truth.
- **Product Boundary** — no code shared with MarketSwarm-Canonical; API only.
- **Learner Capacity Over Dependency** — the stop-the-bleeding thesis governs product
  behavior and copy; process outcomes, never profit claims.

---

## The Bench (Current Roster)

### Authority & Orchestration

| Callsign | Archetype | Core Domain |
|---|---|---|
| **Coach** | Product Architect & Final Authority | Vision, positioning, trade-offs, final approval (Ernie) |
| **Juliet** | Orchestrator & Vision Keeper | Spec decomposition, agent sequencing, execution plans, gate scheduling |
| **India** | Spec & Architecture Guardian | Spec/decision-log integrity, domain model, product boundary, invariants |

### Execution Specialists

| Callsign | Archetype | Core Domain |
|---|---|---|
| **Alpha** | Backend Engineer | FastAPI service, MySQL schema/migrations, auth/SSO, entitlements, API surface |
| **Charlie** | Frontend Engineer | Next.js app: catalog, course detail, player, dashboard, admin UI |
| **Echo** | Human Interface Designer | Look & feel, design tokens, visual hierarchy, course-page polish |
| **Foxtrot** | Infrastructure Engineer | MiniTwo/DudeTwo provisioning, launchd, MiniThree nginx, Cloudflare, deploys |
| **Mike** | Security & Auth Engineer | Dual-issuer SSO, session JWTs, signed video URLs, secrets, WooCommerce webhooks |
| **Sierra** | Curriculum & AEO Specialist | Course copy formula, SEO/AEO layer (JSON-LD, titles, prerender), content structure |

### Quality & Memory

| Callsign | Archetype | Core Domain |
|---|---|---|
| **Delta** | Gate Keeper | Quality gates, verification, evidence-based review |
| **Kilo** | Test & Quality Engineer | Test architecture, edge cases, regression suites |
| **Lima** | Technical Writer | Decision log entries, docs, interface contracts, institutional memory |
| **Tango** | Member Archetype Guardian | The trader-learner's experience: cognitive load, capacity-over-dependency, honest marketing |

Not yet seated (activate when their phase arrives): **Golf** (cognitive systems — Ask Vexy
integration, P3), **Hotel** (trading-domain review of course content accuracy, as
curriculum production begins).

---

## Coordination

- All flows through **Coach** or **Juliet** — no direct agent-to-agent communication.
- Work advances through **Delta gates**; reports live in the project folder's
  `gate-reports/`.
- Project folders under `agents/<project>/` hold `ORCHESTRATOR.md`, `seeds/`, and
  `gate-reports/` (see `agents/README.md`).
