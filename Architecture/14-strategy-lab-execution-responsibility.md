# Strategy Lab — Execution Responsibility Architecture  
### Competitive bar: **Option Alpha–class reliability & performance** for hosted automations  
### Still true: **custody and capital at the broker**; user owns strategy and arming

**Status:** **DESIGN DIRECTION** (Coach **2026-08-06**) — **amends** 2026-08-05 offload-first default  
**Related:**  
`Specs/Strategy-Lab-Process-Runtime-Spec-v1.2.md` (runtime modes amended) ·  
`Specs/Strategy-Lab-Curate-and-Deploy-Surface-Spec-v1.0.md` (as-built Curate/Deploy) ·  
`Architecture/09-strategy-lab-tradier.md` · `Architecture/19-strategy-lab-as-built-map.md` ·  
`docs/Strategy-Lab-MSC-Broker-Adapter-Assessment-2026-08-06.md` (two-layer brokerage)

**First broker target:** **Tradier** (paper → live). Market data: **Massive / Coach chain pipe** (not Tradier streaming).  
**Competitive peer (service type):** **Option Alpha** (hosted bots + in-house paper + multi-broker live).  
**Strategic direction:** **Opposite** of OA-shaped trader philosophy — see  
`Architecture/16-strategy-lab-vs-option-alpha-positioning.md` (DL-217).

**Doctrine:** Capital preservation · process over profit theater · fail loud · capacity over dependency · **creator owns the strategy**  

**Legal:** Architecture and product boundary, not legal advice. Counsel must review ToS, disclaimers, and broker agreements before live capital.

---

## 0. Goal (locked product intent — 2026-08-06)

### 0.1 Competitive mandate (Coach)

> **FatTail Labs Strategy Lab will compete with Option Alpha. Therefore the service must be at least equal in reliability and performance for continuous automations (paper and live).**

Implications (non-negotiable product bar):

| Dimension | Bar |
|-----------|-----|
| **Host** | Always-on **cloud** process host for armed scan/manage — not “laptop or nothing” as the primary path |
| **Uptime / ops** | OA-class: multi-AZ or equivalent HA, auto-restart, health checks, monitoring, kill switches, broker disconnect handling |
| **Paper / Curate** | In-house or Labs **sim path** with **live market data** without requiring a broker (OA paper engine parity) |
| **Live** | Member broker account; Labs cloud workers send/manage via API (OA connector model) |
| **Performance** | Scan/manage cadence, order submit latency, multi-leg open, and data freshness **not worse** than OA for comparable workflows (measure; don’t assert) |
| **Scale** | Design for multi-tenant queue + workers from day one of hosted runtime (not a single MiniTwo process loop) |

### 0.2 What “equal reliability” does **not** mean

| Not required / not claimed | Why |
|----------------------------|-----|
| Guarantee of P&L or fills | No serious platform claims this (including OA) |
| Host uptime = capital safety alone | Broker can still be down; exits must still prefer **broker-held** orders |
| Five-nines marketing of strategy outcomes | Legal and operational theater |
| Copy OA feature-for-feature day one | Parity on **reliability & performance of the automation host**; product differentiation elsewhere |

### 0.3 Responsibility still shared (OA does this too)

Even with cloud hosting as primary:

| Party | Owns |
|-------|------|
| **User (creator)** | Strategy design, parameters, when to arm, acceptance of risk, monitoring, contingency at broker |
| **Broker** | Custody, order accept/reject, matching, fills, balances, broker platform uptime for **accepted** orders |
| **Labs** | **Host and operate** the automation process at competitive reliability; tools to build/test/version; secure API pipe; honest failure modes — **not** fiduciary discretionary management |

**Huge win if true:** Members get OA-class “bots keep running while I’m offline,” **and** FatTail still wins on life cycle, versioning, defined risk, education, and ethos — without pretending we are the broker.

### 0.4 Relationship to 2026-08-05 offload direction (DL-214)

| DL-214 idea | Status after competitive mandate |
|-------------|----------------------------------|
| User owns strategy + arming | **Still locked** |
| Broker owns custody + fills | **Still locked** |
| Prefer broker-held exits | **Still locked** (defense in depth; higher residual safety than host alone) |
| M0 export / M2 user-local | **Still offered** (capacity, portability, power users) — **not** the primary competitive path |
| M3 Labs-hosted as “optional residual” | **Superseded** — **M3-class cloud host is competitive primary** for Deploy/Curate continuous paths |
| “Don’t build five-nines bot farm as north star” | **Reframed** — build **OA-class host reliability** as north star; still **no outcome SLA** |

**Offload** now means: offload **capital custody and order truth** to the broker; offload **strategy ownership** to the user — **not** “offload the always-on clock to the user’s laptop.”

---

## 1. Why this is the right goal

### 1.1 Competitive reality

Option Alpha’s product promise is: **cloud bots + paper engine + broker connectors**.  
If Labs ships “export and run on your machine” as the **primary** Deploy experience, we are **not** competing with OA on the dimension members feel day-to-day (does the bot run when I’m at work?).

Reliability and performance of the **hosted automation service** are table stakes for that market.

### 1.2 What OA actually provides (public model)

| Capability | OA pattern | Labs must match |
|------------|------------|-----------------|
| Continuous bot process | AWS-hosted | Cloud-hosted workers |
| Paper without broker | In-house paper engine | Curate: real market + sim broker + fake money |
| Live execution | API to member broker (Tradier, TS, tasty, Schwab, …) | Tradier first; Protocol for more |
| Funds | At broker | At broker |
| Disconnect behavior | Bots stop managing until reauth | Same honesty + fail loud |
| Multi-tenant scale | Cloud fleet | Queue + leased workers |

### 1.3 Doctrine fit (refined)

- **Capacity over dependency:** Still teach contingency, export, flatten at broker; do **not** make members helpless if Labs is down — but **do** run a serious host so they are not forced into dependency on their own infra.  
- **Process over P&L theater:** Hosting reliability ≠ profit claims.  
- **Stop the bleeding:** Defined risk, envelopes, arming — stricter than OA if we choose; never weaker on risk honesty.

### 1.4 Legal / operational honesty

Hosting increases platform-in-the-blame-path vs pure export. That is the cost of competing with OA. Mitigations:

- Arming attestation, ToS, best-effort host SLA (not outcome guarantee)  
- Broker-held exits as primary protect  
- Kill switches: pause new risk when degraded  
- Counsel before live  

---

## 2. Responsibility model (RACI-style)

### 2.1 User (creator) — primary for “the strategy”

Before any live path:

1. Sole strategist and account owner.  
2. Labs is software/education, not investment adviser or discretionary manager (counsel language).  
3. Designed/adopted process graph and envelope.  
4. Completed gates or product-allowed path.  
5. Accepts that **host, connectivity, or broker** failure can leave risk open — contingency at broker.  
6. Version armed is known (`bound_version` / export hash).  

**Product:** Informed arming ceremony (multi-step, typed confirm for live, plain-language summary).

### 2.2 Broker — primary for “the order and the account”

Once accepted: lifecycle, margin, positions, routing, their uptime.  
Prefer **OCO/OTO/OTOCO** (and equivalents) so critical exits survive **Labs** outage.

### 2.3 Labs — primary for “the automation host” **and** the build plane

| Labs domain | Examples |
|-------------|---------|
| **Cloud process reliability** | Scan/manage workers, queues, restarts, multi-AZ or HA target, monitoring |
| **Performance** | Cadence SLOs, submit latency budgets, data fan-out, broker throttle gateway |
| Build / version / test / curate | Life cycle, packs, BT/FW, Curate sim |
| Connectivity | Member-authorized Tradier (etc.) session; Labs as authorized app |
| Paper engine | Curate fill/order management + real marks |
| Audit | Decision log when Labs is in the path |
| Admin | Fleet console, kill switch, tenant halt |

**Labs is not:** broker-dealer (unless licensed), guarantor of P&L, or guarantor of broker API availability.

---

## 3. Target architecture: “Design + run here, custody there”

### 3.1 Competitive product shape (primary)

```text
┌────────────────────────────────────────────────────────────────┐
│  FATTAIL LABS — CLOUD (control + execution plane)                │
│  Design · version · validate · Curate sim · Process Runtime      │
│  Always-on workers (scan/manage) · decision_log · arming         │
│  BrokerAdapter + ExecutionService (two-layer)                    │
└────────────────────────────┬───────────────────────────────────┘
                             │ API (member credentials)
                             ▼
                    MEMBER BROKER (Tradier first)
                    custody · orders · fills · OCO/…
```

**Primary promise:** OA-class **build + continuous run**.  
**Custody promise:** money and working orders at the **broker**.  
**Secondary paths:** M0 export, M2 user-local (power users, portability, capacity).

### 3.2 Execution modes (competitive ranking)

| Mode | Who runs the loop | Competitive role |
|------|-------------------|------------------|
| **M3 Labs-hosted cloud workers** | Labs multi-tenant fleet | **Primary** — OA parity for paper/live continuous bots |
| **M1 Broker-native exits** | Broker holds protect after entry | **Required defense** for live (pairs with M3) |
| **Curate / paper engine** | Labs sim + real marks (or Tradier paper) | **Primary** for pre-live proof |
| **M2 User-local runtime** | User machine/VPS | **Optional** power-user / offline trust path |
| **M0 Export / manual** | User at broker UI | **Teach + contingency + portability** |

**Goal hierarchy:** M3 + M1 as the competitive Deploy stack; M0/M2 always available; never market “only works if your laptop is on.”

### 3.3 What to build first (aligned with competitive goal)

| Priority | Capability |
|----------|------------|
| P0 | Life cycle, packs, BT/FW, versioning, arming |
| P0 | **Cloud worker topology**: queue, lease, restart, health, env separation (stage/prod) |
| P0 | **Curate**: real market + sim broker + fake money (OA paper parity) |
| P1 | Two-layer brokerage: ExecutionService + `sim` + `tradier` adapters |
| P1 | Tradier paper multi-leg + broker-held exits matrix |
| P1 | Performance budgets: scan min interval, submit p95, reconcile |
| P2 | Live Tradier path + counsel + attestation |
| P2 | Admin fleet console (kill, halt, fairness) |
| P3 | Second broker; multi-region only if measured need |
| P3 | M2 user-local worker (documented) |

---

## 4. Reliability & performance bar (OA parity targets)

Targets are **internal product SLOs**, not customer legal guarantees. Measure against OA workflows; adjust with evidence.

### 4.1 Reliability (host)

| Area | Target direction |
|------|------------------|
| Process host | Cloud (not sole MiniTwo for armed multi-tenant bots) |
| Restart | Auto-restart workers; job lease reclaim on death |
| Deploy | Blue/green or rolling; no “SSH and hope” for bot fleet |
| Data plane vs control | API ≠ tick workers (Spec §17 pattern) |
| Degraded mode | Pause **new** opens; surface stale data; prefer broker-held exits |
| Broker disconnect | Fail loud; stop manage/open until reauth; no silent fantasy |
| Multi-AZ / HA | Stage: single region + restart OK; **Prod competitive:** multi-AZ or proven equivalent before scaling marketing |

### 4.2 Performance

| Area | Target direction |
|------|------------------|
| Scan cadence | Configurable; default competitive with OA-class bots (e.g. ≥60s class unless pack requires faster; document cost) |
| Manage priority | Manage-before-scan under load (Spec §17) |
| Order submit | Thin adapter; p95 budget set after Tradier paper spike |
| Market data | Shared fan-out (Massive/Coach); not per-bot sockets |
| Multi-leg | Paper-proven path before live |
| UI | Decision log and bot status refresh without blocking execution |

### 4.3 Broker-held exits (still mandatory for live)

Cloud host reliability **complements** broker-held exits; it does not replace them.

| If Labs cloud is down | Desired residual |
|-----------------------|------------------|
| Working OCO/stop at Tradier | Still protecting |
| Only Labs manage loop | **Unprotected** — design packs to avoid this as sole live protect |

---

## 5. Two-layer brokerage (execution stack)

See assessment v1.2: MSC pattern, Labs-native.

```text
Process Runtime (M3 workers)
        → ExecutionService (lifecycle, envelope, fill_sim for Curate)
        → BrokerAdapter (sim | tradier | future)
        → Tradier API | Labs sim ledger
```

- Protocol is **any brokerage**; first Labs wave: **sim + Tradier**.  
- Order management simulates fills for Curate; live fills from broker.

---

## 6. Shifting residual risk (not shifting the product off cloud)

| Risk | Control |
|------|---------|
| Labs outage with open risk | Broker-held exits; contingency education; pause new risk |
| Software defect | Tests, paper-first, kill switch |
| Broker API down | Honest status; no pretend fills |
| Member expects profit | Ethos + copy; process outcomes only |
| Scale cost | Caps, fair queue, plan tiers |

---

## 7. Uptime claims (honest marketing)

| Claim | Appropriate? |
|-------|----------------|
| Competitive cloud hosting for armed automations | **Yes** — product truth |
| Host SLO (e.g. 99.9% process availability) as **best effort** | Internal + optional status page; counsel on customer language |
| 99.999% on **strategy outcomes** / never miss exit | **No** |
| Broker uptime | Broker’s domain |
| “Set and forget forever without monitoring” | **No** — capacity doctrine |

**Safe failure modes:** no new risk over wrong risk; broker-held exits; fail loud; user can always flatten at broker.

---

## 8. Comparison: offload-only vs competitive cloud

| | Offload-first (2026-08-05) | **Competitive OA parity (2026-08-06)** |
|--|----------------------------|----------------------------------------|
| Who runs scan/manage 24/7 | User / export | **Labs cloud (primary)** |
| Paper | Optional / Tradier paper | **Labs Curate engine + Tradier paper** |
| Legal blast radius | Lower | Higher — accept to compete; contain with exits + ToS |
| Multi-AZ / fleet | Optional | **Required for competitive Deploy** |
| Admin fleet console | Nice | **Essential** |
| Superiority vs OA | Life cycle only | **Life cycle + equal host reliability/performance** |
| Broker-held exits | Prefer | **Still required** |

---

## 9. Implications for Process Runtime Spec

**v1.1** said M0–M2 primary, M3 optional. **Amend to v1.2** (or Coach GO patch):

| Concept | New reading |
|---------|-------------|
| Deployment instance | Cloud-hosted shell **primary**; export remains portable |
| Runner | **Labs worker tick primary**; M2 optional |
| Decision log | Labs when hosted (always for M3 path) |
| Dry/paper/live | Labs ladder with Tradier paper/live |
| §17 multi-tenant workers | **Normative for competitive product**, not residual |
| Admin console | Required for M3 fleet |
| L9 “M3 in v1?” | **Yes for paper/Curate path; live gated by counsel** |

Keep entities: instance, envelope, runners, decision log, ladder.

---

## 10. Phased product plan (competitive)

| Phase | Deliver |
|-------|---------|
| **C0** | Counsel track for hosted live; ToS draft path |
| **C1** | Cloud worker skeleton (queue, lease, health) + admin kill |
| **C2** | Curate: real marks + ExecutionService fill_sim + fake money |
| **C3** | Tradier adapter + paper multi-leg + exit matrix |
| **C4** | Process Runtime bind + arming + decision_log on cloud ticks |
| **C5** | Performance/reliability measurement vs internal OA-class budgets |
| **C6** | Live Tradier (LEGAL-LIVE gate) |
| **C7** | Export + optional M2 (parity backup paths) |
| **C8** | Second broker only after Tradier solid |

---

## 11. Success criteria

1. Member can arm a **cloud-hosted** paper/Curate process that runs without their laptop.  
2. Live path (when enabled) uses **member Tradier** + Labs workers at competitive reliability.  
3. Critical protection **preferentially** broker-held working orders.  
4. Attestation + version hash before live.  
5. Marketing: competitive host reliability **yes**; outcome guarantee **no**.  
6. Measured host/performance SLOs exist and are reviewed; not vibes.  
7. M0/M2 still work for contingency and capacity.  
8. Counsel has reviewed hosted-automation boundary language.

---

## 12. Risks of the competitive goal

| Risk | Mitigation |
|------|------------|
| Ops cost of cloud fleet | Start single-region multi-AZ; scale with revenue/plan caps |
| Legal exposure of hosting | Arming, ToS, broker exits, no outcome SLA |
| Building MSC-scale OMS too early | Thin Layer B; Tradier + sim first |
| Underperforming OA on latency | Measure early; shared data fan-out; manage-before-scan |
| MiniTwo as sole bot host | **Forbidden for multi-tenant armed bots** — cloud required |

---

## 13. First broker target: Tradier

**Locked:** Tradier is the **first** execution venue for Deploy.

| Layer | Provider |
|-------|----------|
| Market data / Test / marks | Massive + Coach chain archive |
| **Orders paper → live** | **Tradier API** |
| **Curate fills** | Labs ExecutionService fill_sim |

### 13.1 Maximize Tradier offload of *capital* risk

Multi-leg open · paper accounts · account truth · **OCO/OTO/OTOCO** · user custody.

### 13.2 What Tradier does not replace

Full scan graph · pack validation · continuous bot shell · fill quality theater.

**Implication:** **Scan/manage host = Labs cloud** (competitive). **Capital/exits = Tradier** (safety).

### 13.3 Credential pattern

Encrypted, user-revocable tokens; member is API principal; Labs is authorized application.

---

## 14. Bottom line

**Yes — to compete with Option Alpha, Labs must host continuous automations in the cloud at reliability and performance parity with OA-class bot platforms.**

**Also yes — custody and preferred exits stay at the broker; strategy ownership stays with the user; no P&L or perfect-exit guarantees.**

**Architecture:** Cloud Process Runtime (M3 primary) + two-layer brokerage (sim + Tradier) + broker-held exits + honest arming.  
**Not the architecture:** MiniTwo-only bot farm, or “export only” as the main Deploy story.

**Next steps:**  
1. **Coach confirm** this amend as execution north star (this document).  
2. Process Runtime Spec **v1.2** — M3 competitive primary; M0/M2 secondary.  
3. Foxtrot: cloud worker topology + stage/prod HA plan.  
4. Alpha/Mike: ExecutionService + Tradier/sim adapters.  
5. Spike: Tradier paper multi-leg + OCO matrix; Curate fill_sim against live marks.  
6. Counsel: hosted automation ToS path before live.  

---

## 15. Document control

| Ver | Date | Note |
|-----|------|------|
| 1.0 | 2026-08-05 | Offload-first: user + broker run; M3 optional |
| **1.1** | **2026-08-06** | **Coach: compete with OA → cloud host reliability/performance parity required; M3 competitive primary; broker custody + exits retained** |
