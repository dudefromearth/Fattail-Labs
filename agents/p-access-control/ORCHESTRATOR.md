# p-access-control — Orchestrator Playbook

**Charter:** [`CHARTER.md`](./CHARTER.md)  
**Full plan:** [`docs/Access-Control-v0.4-Full-Agent-Bench-Plan.md`](../../docs/Access-Control-v0.4-Full-Agent-Bench-Plan.md)  
**Spec:** [`Specs/FatTail-Labs-Access-Control-Spec-v0.4.md`](../../Specs/FatTail-Labs-Access-Control-Spec-v0.4.md) — **BUILD AUTHORITY**  
**Seeds:** [`seeds/`](./seeds/)  
**Gates:** [`gate-reports/`](./gate-reports/)  

---

## Current junction

### **PROGRAM PASS** (AC8) — MVP shipped 2026-08-02

| Step | Status | Report |
|------|--------|--------|
| W0 reviews + BUILD AUTHORITY | **DONE** | AC0-* |
| AC1 Engine core | **PASS** | AC1-G |
| AC2 Admin API | **PASS** | AC2-G |
| AC3 Lessons | **PASS** | AC3-G |
| AC4 Apps floor | **PASS** | AC4-G |
| AC5 Admin UI MVP | **PASS** | AC5-G |
| AC6 Catalog/SEO | **PASS** (minimal) | AC6-G |
| AC7 Campaigns/gates | **PASS** (partial) | AC7-G |
| AC8 Program close | **PASS** | AC8-program-close.md |

### Residuals (follow-up, non-blocking)

- Preview-as admin UI toggle  
- SSG skeleton hydrate polish  
- feature_gates → surface policy cutover  
- Production: migrate **075** on MiniTwo  
- Re-seed course + re-run `test_lesson_gating` if catalog empty  

### Coach ship

W0 target: **after AC5-G MVP** — met. Deploy when ready via `infra/deploy.md` Access Control section.

---

## Critical path (historical)

```text
W0 → AC1 → AC2 → AC3 ‖ AC4 → AC5 (MVP) → AC6 → AC7 → AC8 ✓
```
