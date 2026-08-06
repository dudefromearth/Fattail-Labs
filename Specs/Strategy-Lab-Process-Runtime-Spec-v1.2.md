# Strategy Lab — Process Runtime Spec v1.2  
### Amendment: multi-member Curate primary · shared marks · phase dashboards · Deploy reports

**Status:** **SPEC AUTHORITY** for sections amended below (2026-08-06)  
**Supersedes in part:** [`Strategy-Lab-Process-Runtime-Spec-v1.1.md`](./Strategy-Lab-Process-Runtime-Spec-v1.1.md)  
**Companion (normative for Curate/Deploy UI & marks):**  
[`Strategy-Lab-Curate-and-Deploy-Surface-Spec-v1.0.md`](./Strategy-Lab-Curate-and-Deploy-Surface-Spec-v1.0.md)

**Decisions:** DL-214–DL-227; especially **DL-216** (OA-class host), **DL-217** (opposite direction), **DL-218/221** (multi-member Curate), **DL-222–224** (marks/universe/VIX), **DL-225–227** (dashboards/reports/correlation).

**How to read:** Unchanged v1.1 sections remain in force. **This v1.2 file overrides** v1.1 §0.1–0.2, §1.4 G-1, §12 delivery priority, and §17 scope notes where they conflict. For Curate sim runtime, symbols, correlation, and Deploy reports, the **Curate & Deploy Surface Spec v1.0 is authoritative**.

---

## 0. Terminology (v1.2 — aligns with Curate Surface Spec)

| Member language | Meaning |
|-----------------|---------|
| **Bot** | Runnable product unit (Design card + Curate/Deploy runtime) |
| **Strategy** | Attribute of the bot (pack / methodology), not the bot itself |
| **Position** | Instance of the bot (open/closed market package) |

v1.1 “Deployment instance” ≈ **bot runtime**. “Strategy card” ≈ **bot**. Do not use “strategy” for the grid unit in member UI.

Full glossary: [`Strategy-Lab-Curate-and-Deploy-Surface-Spec-v1.0.md`](./Strategy-Lab-Curate-and-Deploy-Surface-Spec-v1.0.md) §0.

---

## 0. Amended intent

### 0.1 Execution responsibility (refined — not reversed)

Still true from DL-214:

- User owns strategy + arming.  
- Broker owns custody + fills (Deploy).  
- Prefer broker-held exits on live.  

**Amended product bar (DL-216, DL-221):**

> Labs **hosts** continuous Process Runtime so members can run **many bots** in **Curate** (and **Deploy** when provisioned) — OA-class reliability for the **process clock**.  
> Labs does **not** claim outcome SLAs or discretionary management.

| Party | Owns |
|-------|------|
| **User** | Strategy design, arming, promote/portfolio decisions, contingency |
| **Broker** | Live/paper custody & fills (Deploy) |
| **Labs** | Curate sim runtime; shared marks stream; multi-strategy compare; optional Deploy workers; export |

### 0.2 Execution modes (amended priority)

| Mode | Role in v1.2 |
|------|----------------|
| **Curate sim (Labs-hosted ticks)** | **Primary multi-member surface** — many **bots**, compare, portfolio |
| **M0 Export** | Capacity / contingency — still required |
| **M1 Tradier exits** | Prefer on live Deploy |
| **M2 User-local worker** | Optional power-user path |
| **M3 Labs workers** | **Normative for Curate platform-tick / scheduled ticks**; Deploy when Coach GO |

**v1.1 language that M3 is “optional residual only” is superseded for Curate multi-tenant ticks.** Deploy live still Coach-gated (LEGAL-LIVE).

### 0.3 Delivery sequence (growth playbook)

1. **Design + Curate for everyone** (identity-scoped).  
2. **Deploy for Coach** (Tradier validate).  
3. **Provision members** for Deploy.  

**Curate comparison does not wait for Deploy.**

---

## 1. Amended gates

### G-1 (replace v1.1)

| Rule | |
|------|--|
| **G-1** | **Live Tradier** only in Deploy (or explicit product exception) after arming + counsel path. |
| **G-1b** | **Curate sim** may run in phase `curation` (and may be started from Design packs when product allows instance create) with **fake money only**. |
| **G-1c** | Paper Tradier when Deploy provisioned; not required for Curate. |

### G-2

Unchanged spirit: Design BT/FW/Deployed before promote to Curate as teaching path (Development Phase Spec).

---

## 2. Curate instance (normative pointer)

Full schema, tick semantics, envelope, fill model, APIs:  
**Curate & Deploy Surface Spec v1.0 §1**.

Minimal entity (compatible with v1.1 DeploymentInstance language):

```text
CurateInstance ⊆ DeploymentInstance where
  account_mode = curate_sim
  execution_home = labs_hosted
  broker = sim
```

Statuses: `draft | armed | running | paused | halted | archived`.

---

## 3. Shared market data (normative pointer)

v1.1 assumed Massive for Test; v1.2 adds **shared live marks for Curate**:

| Component | Spec |
|-----------|------|
| Universe + stream + VIX/VIX1D | Curate Surface Spec §2 · Architecture/18 |
| No Tradier streaming | Architecture/09 (unchanged) |

---

## 4. Phase UI (normative)

| Phase | Surface |
|-------|---------|
| Curate | `PhaseRunDashboard` grid/table + mini equity + ρ vs SPY + live marks |
| Deploy | Same dashboard shell + Practice-parity equity/stats reports panel |

Details: Curate Surface Spec §5–6.

---

## 5. Correlation (normative)

Pearson daily simple returns; calculator + relative vs SPY on grid.  
Curate Surface Spec §4.

---

## 6. Delivery checklist (v1.2)

| ID | Item | Status target |
|----|------|----------------|
| C1 | Curate instances/positions/decision_log | As-built |
| C2 | Shared live stream + universe | As-built |
| C3 | Multi-strategy comparison + tick-all | As-built |
| C4 | Symbol catalog + detail pages + picker | As-built |
| C5 | Correlation calculator + ρ on grid | As-built |
| C6 | Phase dashboards (Curate live, Deploy shell) | As-built |
| C7 | Deploy reports-book (Practice layout) | As-built (Curate data until Tradier) |
| C8 | Scheduled multi-member worker | Pending (platform-tick API ready) |
| C9 | Tradier Deploy multi-member | Pending Stage B/C |
| C10 | Pack-native multi-leg Curate open | Pending |

---

## 7. Document control

| Ver | Date | Note |
|-----|------|------|
| 1.0 | 2026-08-05 | Initial process runtime |
| 1.1 | 2026-08-05 | User+broker first; M0–M2 primary |
| **1.2** | **2026-08-06** | Multi-member Curate primary; OA-class host for process clock; shared marks; phase dashboards; pointers to Curate Surface Spec |
