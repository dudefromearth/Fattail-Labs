# p-links-growth — Orchestrator Playbook

**Full plan:** [`docs/Links-Growth-Phase4-Full-Agent-Bench-Plan-v1.0.md`](../../docs/Links-Growth-Phase4-Full-Agent-Bench-Plan-v1.0.md)
**Spec:** [`Specs/Links-Growth-Acquisition-Spec-v0_1.md`](../../Specs/Links-Growth-Acquisition-Spec-v0_1.md) + [`v0_2.md`](../../Specs/Links-Growth-Acquisition-Spec-v0_2.md) (Coach rulings) — **4a BUILD AUTHORITY**, **4b code-may-proceed / go-live gated**
**Reviewed:** [`agents/p-links/gate-reports/Links-Growth-Acquisition-Spec-v0_1-India-Review-v1_0.md`](../p-links/gate-reports/Links-Growth-Acquisition-Spec-v0_1-India-Review-v1_0.md) — CONDITIONAL APPROVE
**Seeds:** [`seeds/`](./seeds/)
**Gates:** [`gate-reports/`](./gate-reports/)
**Parent product board:** [`agents/p-links/`](../p-links/) — LK Phase 1–3 (shipped). This board is LK Phase 4 (growth/acquisition), split out as its own project since 4a/4b have a different risk class and go-live gate than anything already shipped.

---

## Current junction

### LG1 — two-sided referral credit (4a)

| Step | Status | Report |
|---|---|---|
| Spec v0.1 DRAFT + India review | **DONE** | `agents/p-links/gate-reports/Links-Growth-Acquisition-Spec-v0_1-India-Review-v1_0.md` |
| Spec v0.2 Coach rulings (Q12/Q13) | **DONE** | `Specs/Links-Growth-Acquisition-Spec-v0_2.md` |
| LG1 Alpha+Kilo: referred-side award + tests | **IN PROGRESS** | `seeds/LG1-1-alpha-kilo-two-sided-award.md` |
| LG1-G Delta gate | pending | `gate-reports/LG1-G.md` |
| Lima decision log | pending | `Architecture/00-decision-log.md` |

### 4b — partner/creator co-marketing (not fired)

Spec v0.2 §2 rulings are complete (PM-L2, Q9–Q11). **Not started.** Needs its own seed when Coach fires it. Go-live stays gated on PM-L5 (legal input on cash compensation) regardless of when code is built — this is a go-live gate, not a build gate, and this board does not and cannot clear it.

---

## Critical path

```text
Spec v0.1 → India review → Spec v0.2 (Coach rulings) → LG1 → LG1-G → Lima ✓ (4a)
                                                       ↘ 4b (not fired; own seed when Coach fires it)
```

---

## Coach ship

4a: ship when LG1-G PASSes. No separate deploy gate beyond the standard commit/push/deploy discipline this app already uses — 4a is a backend-only amendment to an existing webhook handler, no migration, no frontend.
