# Architecture — FatTail Labs

As-built architecture and design documentation for the FatTail Labs platform
(`labs.fattail.ai`). These documents describe **the system as implemented**, not a
wishlist. Feature contracts remain in `Specs/`; binding decisions remain in
`00-decision-log.md`.

| Document | Contents |
|---|---|
| [00-decision-log.md](./00-decision-log.md) | Append-only decisions (canonical) |
| [01-system-overview.md](./01-system-overview.md) | Product purpose, topology, major layers, boundaries |
| [02-backend-design.md](./02-backend-design.md) | FastAPI service, modules, API surface, AI runtime |
| [03-frontend-design.md](./03-frontend-design.md) | Next.js app structure, rendering modes, admin UX |
| [04-domain-data-model.md](./04-domain-data-model.md) | MySQL domain, migrations map, key relationships |
| [05-security-and-access.md](./05-security-and-access.md) | Identity, roles, sessions, media, commerce boundaries |
| [06-operations-and-verification.md](./06-operations-and-verification.md) | Env, deploy, tests, evidence culture |
| [07-audit-snapshot-2026-07-23.md](./07-audit-snapshot-2026-07-23.md) | Retroactive code/docs audit findings |
| [08-canonical-course-model.md](./08-canonical-course-model.md) | Portable Course graph: export/import/validate architecture |
| [09-canonical-course-design.md](./09-canonical-course-design.md) | Admin UX design for packages |
| [10-resources-design.md](./10-resources-design.md) | Resources: first-class versioned library |
| [11-wiki-design.md](./11-wiki-design.md) | Member Wiki: lab-wiki checkout → derived index → /app/wiki |
| [12-retrospective-report-dto.md](./12-retrospective-report-dto.md) | Retrospective workspace DTO (gather/report/comparison) — as-built v0.6 |
| [13-habit-catalog-design.md](./13-habit-catalog-design.md) | Habit Catalog methodology layer — **design locked**, pre-Spec |
| [09-strategy-lab-tradier.md](./09-strategy-lab-tradier.md) | Strategy Lab data/exec split (Massive / Tradier) |
| [14-strategy-lab-execution-responsibility.md](./14-strategy-lab-execution-responsibility.md) | User + broker run first; M0–M3 |
| [15-trade-log-manual-management.md](./15-trade-log-manual-management.md) | Trade Log manual entry/close/trash design (as-built) |

**Strategy Lab process runtime (2026-08-05):**  
`Specs/Strategy-Lab-Process-Runtime-Spec-v1.1.md` — process runtime (**user+broker first**, Tradier, DL-215).  
`Architecture/14-strategy-lab-execution-responsibility.md` — execution responsibility (DL-214).  
`docs/Strategy-Lab-Execution-Architecture-Review-2026-08-05.md` — architecture review 2026-08-05.

**Trade Log manual management (2026-08-05):**  
`Architecture/15-trade-log-manual-management.md` — structure-first entry, close gates, trash, blotter open strip.  
Spec authority: `Specs/FatTail-Labs-Trade-Log-Spec-v1.1.md` **§16**.

**Practice / retrospectives (2026-07-29) — p-retrospective R1b–R7 PASS:**

| Doc | Role |
|---|---|
| Spec **v0.6** as-built | `Specs/FatTail-Labs-Journal-Retrospective-Spec-v0.6.md` |
| Journey §4.1a | Cadence meter formula + profiles |
| Board / gates | `agents/p-retrospective/` |

**Member Practice export (2026-07-29):**

| Doc | Role |
|---|---|
| Spec **v1.0** | `Specs/FatTail-Labs-Member-Practice-Export-Spec-v1.0.md` |
| Board | `agents/p-member-export/` |

**Hardening phases (2026-07-23) — complete A–G:**

| Phase | Status | Specs |
|---|---|---|
| **A** Agent identity + dual admin shell | Shipped | Agent-Identity, Admin-Dual-Surface |
| **B** Kanban backlog / production board | Shipped | Content-Board |
| **C** Package checklist + freeze + AI attach | Shipped | Production-Package |
| **D** Multi-module Labs draft placement | Shipped | Production-Package (§5–6) |
| Notifications | Shipped | Admin-Notifications |
| **E** Pool, SSO contracts, smoke tests | Shipped | Phase-E-Hardening |
| **F** Signed CDN (Bunny Stream) | Shipped | Lesson-Video-Signed-CDN |
| **G** Cast + HeyGen factory (G1–G5) | Shipped | Cast-HeyGen v1.0 + **v1.1** |

**Related**

- Product parent: `Specs/FatTail-Labs-Course-Hosting-Spec-v1.0.md`
- Cast / HeyGen: `Specs/FatTail-Labs-Cast-HeyGen-Spec-v1.1.md`, `docs/P2-Cast-and-HeyGen-Production.md`
- P1 / P2 charters: `agents/p1-foundation/CHARTER.md`, `agents/p2-foundation/CHARTER.md`
- Deploy playbook: `infra/deploy.md`
- Operator guide: `docs/ADMIN-GUIDE.md` (board, cast, HeyGen, packages, agents, alerts)
- WooCommerce + WordPress SSO: `docs/WooCommerce-SSO-Integration-Guide.md`
- Marketing platform (design draft): `docs/Marketing-Platform-Architecture.md`
- Capabilities map: `docs/P2-Capabilities-for-P1.md`
- Cast files: `docs/studio/cast/`

**How to amend**

1. Change code only with an approved or versioned **Spec** when behavior changes.  
2. Log the decision in **00-decision-log.md** the same day.  
3. Update the architecture doc that owns the layer so `Architecture/` stays truthful.  
4. India blocks drift: docs that contradict code are defects.
