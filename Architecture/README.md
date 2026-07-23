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

**Related**

- Product parent: `Specs/FatTail-Labs-Course-Hosting-Spec-v1.0.md`
- P1 / P2 charters: `agents/p1-foundation/CHARTER.md`, `agents/p2-foundation/CHARTER.md`
- Deploy playbook: `infra/deploy.md`
- Operator guides: `docs/ADMIN-GUIDE.md`, `docs/P2-Capabilities-for-P1.md`

**How to amend**

1. Change code only with an approved or versioned **Spec** when behavior changes.  
2. Log the decision in **00-decision-log.md** the same day.  
3. Update the architecture doc that owns the layer so `Architecture/` stays truthful.  
4. India blocks drift: docs that contradict code are defects.
