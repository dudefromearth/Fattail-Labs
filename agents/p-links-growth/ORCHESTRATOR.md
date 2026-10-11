# p-links-growth — Orchestrator Playbook

**Full plan:** [`docs/Links-Growth-Phase4-Full-Agent-Bench-Plan-v1.0.md`](../../docs/Links-Growth-Phase4-Full-Agent-Bench-Plan-v1.0.md)
**Spec:** [`Specs/Links-Growth-Acquisition-Spec-v0_1.md`](../../Specs/Links-Growth-Acquisition-Spec-v0_1.md) + [`v0_2.md`](../../Specs/Links-Growth-Acquisition-Spec-v0_2.md) (Coach rulings) — **4a BUILD AUTHORITY**, **4b code-may-proceed / go-live gated**
**Reviewed:** [`agents/p-links/gate-reports/Links-Growth-Acquisition-Spec-v0_1-India-Review-v1_0.md`](../p-links/gate-reports/Links-Growth-Acquisition-Spec-v0_1-India-Review-v1_0.md) — CONDITIONAL APPROVE
**Seeds:** [`seeds/`](./seeds/)
**Gates:** [`gate-reports/`](./gate-reports/)
**Parent product board:** [`agents/p-links/`](../p-links/) — LK Phase 1–3 (shipped). This board is LK Phase 4 (growth/acquisition), split out as its own project since 4a/4b have a different risk class and go-live gate than anything already shipped.

---

## Current junction

### LG1 — two-sided referral credit (4a) — **PROGRAM PASS** (shipped 2026-10-10)

| Step | Status | Report |
|---|---|---|
| Spec v0.1 DRAFT + India review | **DONE** | `agents/p-links/gate-reports/Links-Growth-Acquisition-Spec-v0_1-India-Review-v1_0.md` |
| Spec v0.2 Coach rulings (Q12/Q13) | **DONE** | `Specs/Links-Growth-Acquisition-Spec-v0_2.md` |
| LG1 Alpha+Kilo: referred-side award + tests | **PASS** | `seeds/LG1-1-alpha-kilo-two-sided-award.md`, commit `4df3c45c` |
| LG1-G Delta gate | **PASS** | `gate-reports/LG1-G.md` |
| Lima decision log | **DONE** | `Architecture/00-decision-log.md` DL-825 |
| Deployed | **DONE** | `labs.fattail.ai`, `ai.fattail.labs.api` restarted, `/api/health` 200 |

### 4b — partner/creator co-marketing — **PROGRAM PASS (build)** (shipped 2026-10-10)

Spec v0.2 §2 rulings are complete (PM-L2, Q9–Q11). **Build and deploy complete.** PM-L5 (legal input on cash compensation) remains a standing go-live precondition this board does not and cannot clear — nothing here authorizes paying or comp'ing a real partner.

| Step | Status | Report |
|---|---|---|
| LG2 Alpha+Kilo: partner registry backend | **PASS** | `seeds/LG2-1-alpha-kilo-partners-backend.md`, commit `43b5c65d` |
| LG2-G Delta gate | **PASS** | `gate-reports/LG2-G.md` |
| Backend deploy | **DONE** | `labs.fattail.ai` — migration `158_partners.sql` applied, `ai.fattail.labs.api` restarted, route confirmed live (401 unauthenticated) |
| LG3 Charlie: partner registry admin UI | **PASS** | `seeds/LG3-1-charlie-partners-ui.md`, commit `dc12eaee` |
| LG3-G Delta gate | **PASS** | `gate-reports/LG3-G.md` |
| Frontend deploy | **DONE** | production `web` rebuilt (`npm run build`), `ai.fattail.labs.web` restarted, `https://labs.fattail.ai/admin/partners` 200 |
| Lima decision log | **DONE** | `Architecture/00-decision-log.md` DL-826 |

**Go-live note (standing, not a step to check off):** PM-L5 is unresolved. No partner may be paid or comp'd for real until legal input is obtained.

**Go-live note (standing, not a step to check off):** nothing in LG2/LG3 clears PM-L5. No partner may be paid or comp'd for real until legal input is obtained — this applies regardless of how many of the steps above PASS.

---

## Critical path

```text
Spec v0.1 → India review → Spec v0.2 (Coach rulings) → LG1 → LG1-G → Lima ✓ (4a)
                                                       ↘ 4b (not fired; own seed when Coach fires it)
```

---

## Coach ship

4a: ship when LG1-G PASSes. No separate deploy gate beyond the standard commit/push/deploy discipline this app already uses — 4a is a backend-only amendment to an existing webhook handler, no migration, no frontend.
