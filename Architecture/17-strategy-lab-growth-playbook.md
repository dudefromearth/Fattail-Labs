# Strategy Lab — Growth Playbook (no bullshit)

**Status:** **COACH OPERATING PLAN** (2026-08-06)  
**Audience:** Coach + Juliet sequencing  
**Depends on:** Arch/14 (OA-class host), Arch/16 (opposite doctrine), Arch/09 (Massive data / Tradier orders), brokerage two-layer assessment, Process Runtime Spec  

**Goal:** You fund Tradier, hook the API, dogfood the **FatTail style of process-bots**, then scale so **others can create and deploy the same class of system**—without becoming API trash or profit-theater OA.

### Locked product sequence (Coach 2026-08-06; multi-member lock 2026-08-06)

> **Multi-member is absolute.** The point of Curate is **many bots running**
> so members (and the platform) can **compare** them for **promote** and
> **portfolio inclusion** — not single-bot dogfood forever.

> **Design + Curate for everyone (multi-tenant from day one).**  
> **Deploy for Coach first** (validate Tradier rail), then **provision members**.  
> Curate comparison does **not** wait for Deploy.

| Phase | Who | What |
|-------|-----|------|
| **A — Shared studio** | All members (plan-gated) | **Design** (packs, BT/FW, version) + **Curate** (real market, sim broker, fake money) |
| **B — Deploy validate** | **Coach only** (`deploy_principal` / admin flag) | Tradier paper → live; cloud Process Runtime; prove the rail |
| **C — Deploy provision** | Members who pass product gates | Connect Tradier; arm paper; later gated live — **same** stack Coach used |

**Do not** open multi-member Deploy before Coach has completed at least one full paper (and preferably live) cycle on Labs rails.  
**Do** open Design + Curate early — that’s where “everyone creates our style of bots” starts, without Tradier multi-tenant risk.

---

## 0. The only loop that scales

```text
EVERYONE:  Design (pack + envelope + version + BT/FW)
              → Curate (real market, sim money, decision_log)
COACH:     → Deploy paper/live on Tradier (validate system)
MEMBERS:   → Deploy provisioned (same rails, caps + arming)
```

**Best way = Design/Curate multi-tenant first; Deploy single-principal until validated; then provision.**  
Not: multi-member live before Coach dogfood on the same product.  
Not: Deploy UI for all with no Curate depth.  
Not: multi-broker before Tradier is boring.

---

## 1. What “our style of bots” means (ship this, not everything)

A FatTail bot is **not** a recipe soup. It is:

| Piece | Required |
|-------|----------|
| **Strategy pack** | Structure rules, open/manage/exit decisions (typed) |
| **Risk envelope** | Size, concurrent risk, kill when stressed |
| **Bound version** | Pin what is armed; no silent drift |
| **Life cycle** | Design → Curate → Deploy (proof before capital) |
| **Decision log** | What fired, why, broker ack |
| **Arming** | Human attestation before live |
| **Host** | Cloud worker ticks scan/manage (OA-class reliability) |
| **Broker** | Member Tradier for paper/live; Labs sim for Curate |
| **Doctrine** | Process / capital preservation — not income theater |

If a phase doesn’t strengthen that loop, cut it.

---

## 2. Growth stages (aligned to Design/Curate-for-all → Deploy-Coach → Deploy-members)

### Stage A0 — Coach Tradier dogfood (orders path)

**Purpose:** Prove Tradier adapter with **your** account. Can overlap early Design work.

| Do | Don’t |
|----|--------|
| Fund Tradier; paper (+ live when ready) | Multi-member OAuth |
| Multi-leg open/cancel/status/fill + log | Ten packs |
| One pack you know | Tradier as market data |

**Exit:** Paper cycle logged; optional live for Coach only.

---

### Stage A — Design + Curate for **everyone** (shared studio)

**Purpose:** All members create FatTail-style processes and prove them on **sim**. No member Deploy yet.

| Open to all (plan-gated) | Closed |
|--------------------------|--------|
| Strategy pack authoring / templates | Member Tradier connect |
| Version bind, envelope edit | Member paper/live orders |
| Design BT/FW (as available) | Public “bots running on my broker” |
| **Curate:** real marks + sim broker + fake money + decision_log | Deploy UI for non-Coach |
| Cloud workers for **Curate** ticks only | |

**Build:**

| Component | Notes |
|-----------|--------|
| Pack + envelope + version | Core Design |
| `SimulatedAdapter` + fill_sim + ExecutionService | Curate brain |
| Curate instance + scan/manage on sim | Process Runtime subset |
| decision_log | Always |
| Massive/Coach marks fan-out | Shared data plane |
| Entitlement: `strategy_lab_design`, `strategy_lab_curate` | Membership/plan |

**Exit criteria:**

1. Any entitled member can create/edit a pack and run Curate without staff.  
2. Curate never calls Tradier.  
3. Decision log reconstructs Curate days.  
4. Reference pack(s) from Coach used as teaching defaults.  
5. Load: dozens–hundreds Curate OK (no broker risk).

**This is where “everyone realizes the system of creating our style of bots” happens.**

---

### Stage B — Deploy for **Coach only** (validate)

**Purpose:** Same packs that members Curate can **Deploy** on Tradier—but only Coach’s identity.

| Open | Closed |
|------|--------|
| `deploy_enabled` for Coach / `role=administrator` or allowlist | All other members’ Deploy |
| TradierAdapter paper → live | Member OAuth |
| Cloud workers for **Deploy** instances (Coach) | Provisioning API for members |
| Arming ceremony (even for Coach—dogfood the UX) | |

**Flag (normative):**

```text
deploy_principal = coach | allowlist
member_deploy_provisioned = false  # global until Stage C
```

**Exit criteria (hard):**

1. Coach pack: Design → Curate → **Deploy paper** on Tradier, full cycle.  
2. Prefer broker-held exits proven for that structure.  
3. Optional: Coach live after paper boring.  
4. Throttle gateway + idempotent submits + decision_log with broker ids.  
5. Kill switch works on Coach deploy instances.  
6. Written: “Deploy rail is validated” (gate report / Coach note).

**No member Deploy until this gate passes.**

---

### Stage C — Provision members for Deploy

**Purpose:** Members deploy **their own** bots on **their** Tradier (paper first, live gated).

**Provisioning model (product):**

| Step | Meaning |
|------|---------|
| 1. Entitlement | Plan/feature: `strategy_lab_deploy` (off by default at launch of C) |
| 2. Eligibility | e.g. Curate N days or pack validate + arming training checkbox |
| 3. Connect | Member OAuth → their Tradier paper (live separate flag) |
| 4. Arm | Instance bind version + envelope + attestation |
| 5. Caps | Soft/hard armed instances; min scan interval |
| 6. Live | Separate provision: `deploy_live` after paper proof / invite |

| Open | Keep gated |
|------|------------|
| Member paper Deploy | Live until second gate |
| Multi-member OAuth + throttle | Uncapped bots |
| Same worker topology as Coach Deploy | Clone marketplace / profit UI |

**Exit criteria:**

1. Non-Coach member: Design → Curate → Deploy paper without white-glove.  
2. 429s ~0; support path holds.  
3. Admin can revoke `strategy_lab_deploy` / disconnect / pause tenant.  
4. Counsel ToS live before any member live.

---

### Stage D — Solid platform (hundreds)

HA workers, fair queue, admin fleet, Habit/journal hooks, optional Tradier co-marketing with clean metrics. Live remains capped minority. Doctrine intact (Arch/16).

---

## 3. Build order (matches Design/Curate-all → Deploy-Coach → Deploy-members)

```text
G0  Coach Tradier paper spike (multi-leg + log)     [A0]
G1  Pack + envelope + version (Design core)
G2  Curate sim + ExecutionService + decision_log
G3  Curate workers (cloud) for all entitled members   [Stage A open]
G4  Arming UX (dogfood even on Curate promote)
G5  TradierAdapter + throttle + Coach-only Deploy paper [Stage B]
G6  Coach Deploy live (optional validate)
G7  ★ GATE: Deploy rail validated
G8  Member OAuth + strategy_lab_deploy provision       [Stage C paper]
G9  Member live provision (gated) + counsel
G10 HA, admin fleet, habits/retro, polish              [Stage D]
```

**Parallel OK:** G1–G3 (Design/Curate for all) while G0 Tradier spike runs for Coach.  
**Serial required:** G5–G7 before G8. No member Deploy before Coach validate gate.

---

## 4. How others “realize the system” (product, not vibes)

Teach the **system**, not bot cloning:

| Layer | Member experiences |
|-------|-------------------|
| **Curriculum / pathway** | Why capital preservation; process over P&L |
| **Pack authoring** | Structure + gates + envelope (your style) |
| **Design** | BT/FW honesty |
| **Curate** | Live market, fake money, correlation/provision |
| **Deploy paper** | Their Tradier paper, Labs cloud host |
| **Deploy live** | Gated; arming; broker exits |
| **Review** | Decision log + journal/retro + habits |

**Template strategy:**  
You publish **1–3 reference packs** (your style) as *teaching artifacts*—versioned, gated—not a free-for-all clone casino.

---

## 5. Numbers to pre-plan (adjust with evidence)

Starting assumptions for capacity design (not marketing promises):

| Metric | Stage 2 beta | Stage 4 solid |
|--------|--------------|---------------|
| Labs members in Strategy Lab | 30–100 | 300–800 |
| Curate active / week | most of them | most of them |
| Tradier paper connected | 10–40 | 100–300 |
| Live armed | 0–5 invite | 20–80 capped |
| Armed instances / account | soft 3 / hard 5 | soft 5 / hard 10 |
| Min scan interval | 60s default | 60s default |
| Workers | 1–2 | N with queue fairness |

If live armed explodes without Curate/paper discipline, **raise gates**, don’t raise API limits first.

---

## 6. What you do this month (if serious)

**Track 1 — Everyone’s studio (Design + Curate)**

1. One reference pack (your style) + envelope + version.  
2. Curate sim + real marks + decision_log.  
3. Entitle members to Design + Curate; open UI.  
4. Curate workers stable under multi-member load.

**Track 2 — Your Deploy validate (parallel spike OK)**

5. Fund Tradier; paper API.  
6. Multi-leg paper + log; then wire **Coach-only** Deploy from same packs.  
7. Full Design → Curate → Deploy paper cycle on Labs.  
8. Gate note: Deploy validated.

**Only after Track 2 gate:** member OAuth + `strategy_lab_deploy` provisioning.

---

## 7. Explicit “do not” list (growth killers)

1. **Multi-tenant before dogfood** — you will debug members instead of the system.  
2. **Tradier as market data** — cost + load + wrong architecture.  
3. **Live open to all** before arming + caps + 30 days clean paper.  
4. **Ten packs before one is real** — dilutes style.  
5. **Leaderboards / profit screens** — doctrine violation + wrong users.  
6. **Skipping throttle gateway** — burns the relationship at 200 users.  
7. **Second broker** before Tradier paper/live is boring.  
8. **OA feature parity chase** (SmartPricing, 12 brokers) before life cycle works.

---

## 8. Success definition (no bullshit)

| Milestone | Done when |
|-----------|-----------|
| **Studio live** | Everyone entitled can Design + Curate FatTail-style packs |
| **Deploy validated** | Coach completed Design→Curate→Deploy (paper/live) on Labs rails |
| **Members provisioned** | Non-Coach deploys own bot to **their** Tradier paper via provision flag |
| **Platform** | Hundreds Curate; paper Deploy normal; live gated; clean Tradier metrics |

---

## 9. Bottom line

**Best way (locked):**

1. **Design + Curate for everyone** — create and prove bots in FatTail style (sim).  
2. **Deploy for Coach only** — validate Tradier + workers + arming on real paper/live.  
3. **Provision members** — same Deploy rails, their accounts, paper then gated live.  

Growth is preplanned by **A → B gate → C**, not by opening Deploy early.

---

## 10. Document control

| Ver | Date | Note |
|-----|------|------|
| 1.0 | 2026-08-06 | Coach growth playbook: dogfood → rails → paper beta → live → solid platform |
| **1.1** | **2026-08-06** | **Design+Curate for all; Deploy Coach-validate; then member Deploy provision** |
| 1.2 | 2026-08-06 | Align with Curate Surface Spec v1.0 + Process Runtime v1.2 (as-built multi-member Curate) |

**As-built companion:** [`Specs/Strategy-Lab-Curate-and-Deploy-Surface-Spec-v1.0.md`](../Specs/Strategy-Lab-Curate-and-Deploy-Surface-Spec-v1.0.md) · [`Architecture/19-strategy-lab-as-built-map.md`](./19-strategy-lab-as-built-map.md)
