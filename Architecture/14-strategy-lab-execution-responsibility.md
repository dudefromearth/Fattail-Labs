# Strategy Lab — Execution Responsibility Architecture  
### Goal: offload **running** automations to the **user** and the **broker**

**Status:** **DESIGN DIRECTION** (Coach 2026-08-05) — supersedes “Labs as always-on multi-tenant bot host” as the **default** product goal  
**Related:**  
`Specs/Strategy-Lab-Process-Runtime-Spec-v1.1.md` (runtime model; **M0–M2 primary**, M3 optional)  
`Architecture/09-strategy-lab-tradier.md` · Continuity · Versioning · Development Phase · North Star  

**First broker target:** **Tradier** (paper → live). Market data remains **Massive / Coach chain pipe** (not Tradier streaming).  

**Doctrine:** Capital preservation · process over profit theater · fail loud · capacity over dependency · **creator owns the strategy**  

**Legal:** This document is **architecture and product boundary**, not legal advice. Counsel must review ToS, disclaimers, and broker agreements before live capital.

---

## 0. Goal (locked product intent)

> **As much responsibility as possible for *running* automations sits with the user (creator) and the broker — not with FatTail Labs as a 24/7 execution host.**

Labs’ job is to make the member **able and accountable** to run a **validated, versioned, defined-risk process** — not to be the firm that “can’t go down or we get sued for missed exits.”

| Party | Owns |
|-------|------|
| **User (creator)** | Strategy design, parameters, when to arm, acceptance of risk, monitoring their account, decisions encoded in the plan |
| **Broker** | Custody, order acceptance/rejection, matching, fills, account balances, broker-side risk controls, broker platform uptime for **accepted orders** |
| **Labs** | Tools to **build, test, version, document, export, and hand off** process; education; optional *assistive* connectivity — **not** fiduciary management of live risk |

**Huge win if true:** Labs is not the always-on bot farm with five-nines legal exposure for every member’s open risk.

---

## 1. Why this is the right goal

### 1.1 Legal / operational reality

If Labs **hosts** hundreds of live runners:

- Outage during manage/exit windows → **platform** is in the blame path  
- “99.999% uptime” is extremely expensive and still not a legal shield  
- Multi-region active-active for options automation is a **broker-grade** problem  

If Labs **does not host** the continuous execution loop:

- Missed exit because laptop closed / user paused → **user**  
- Rejected order / halt / margin → **broker + user**  
- Labs evidence: “we delivered the plan, version, tests, and export/handshake”  

### 1.2 Doctrine fit

- **Capacity over dependency:** member retains agency; Labs does not become the indispensable money robot  
- **Process over P&L theater:** we teach life cycle and gates, not “set and forget”  
- **Stop the bleeding:** defined risk and validation before capital — not infinite hosted leverage  

### 1.3 What “offload” does **not** mean

| Still Labs’ responsibility (can’t offload) | Not Labs’ responsibility (goal) |
|--------------------------------------------|----------------------------------|
| Honest software (no silent fantasy fills) | 24/7 tick for every member |
| Clear UI of what will be sent to broker | Guarantee of fill or profit |
| Secure handling of API tokens (if any) | Strategy performance |
| Not claiming we are the broker | Broker matching/custody |
| Not inducing unsuitable automation | User’s decision to arm live |

---

## 2. Responsibility model (RACI-style)

### 2.1 User (creator) — primary for “the bot”

The user must **understand and affirm** before any live path:

1. They are the **sole strategist** and account owner.  
2. Labs is **software / education**, not an investment adviser or discretionary manager (counsel-confirm language).  
3. They designed or adopted the process graph and envelope.  
4. They completed required gates (Design BT/FW, pack validate) or explicitly waived what product allows (prefer **no waive** for live).  
5. They accept that **connectivity, machine, or attention failure** can leave risk open — and they have a **broker-side or personal** contingency (flatten, close platform, phone desk).  
6. Version they arm is known (`bound_version` / export hash).  

**Product requirement:** **Informed arming** — multi-step acknowledgment, typed confirm for live, show plain-language summary of envelope + runners + exits (not buried legalese only).

### 2.2 Broker — primary for “the order and the account”

Once an order is **accepted** by the broker:

| Broker domain | Examples |
|---------------|----------|
| Order lifecycle | Accept, reject, partial, cancel, replace |
| Account integrity | Buying power, margin, position truth |
| Market access | Routing, halt, corporate actions handling per their rules |
| Platform availability | Their API / trading platform uptime for **their** services |
| Regulatory broker duties | As their registration requires (not Labs’) |

**Labs cannot and must not** claim: best execution, continuous market access, or “we hold your risk.”

**What broker can absorb (architecture goal):**

- Final **authority** on whether an order exists  
- **Position truth** for reconcile  
- Optional: broker-native **bracket/OCO/algo** if available → prefer **broker-held exits** over Labs-held manage loops when possible  

**What most brokers will *not* absorb (honest assessment):**

- Full OptionAlpha-style multi-symbol decision graphs running **inside** the broker  
- Labs-specific scan recipes / structure logic  
- “Guarantee my bot keeps running if FatTail is down”  

So offload is **order & account risk**, not “broker runs our entire Strategy Lab graph.”

### 2.3 Labs — primary for “the product and the handoff”

| Labs domain | Examples |
|-------------|---------|
| Build / version / test / curate | Life cycle, packs, BT/FW |
| Process design tools | Typed decisions, envelopes as **user-owned config** |
| Handoff packages | Export runner config, order templates, checklists |
| Connectivity **assist** (optional) | User-authorized API session that **user can revoke**; Labs as pipe, not principal |
| Education | Courses, playbook, what automation does not do |
| Audit artifacts | Decision log **when** Labs is in the path; export of plan |

**Labs is not:** discretionary manager, broker-dealer (unless separately licensed — out of scope), guarantor of P&L or continuous uptime of member strategies.

---

## 3. Target architecture: “Design here, run there”

### 3.1 Default product shape (preferred)

```text
┌──────────────────────────────────────────────────────────┐
│  FATTAIL LABS — STRATEGY LAB (control & proof plane)      │
│  Design · version · validate · document · export · arm UI  │
│  Decision log for *assisted* sessions only                 │
└────────────────────────┬─────────────────────────────────┘
                         │ handoff (user intentional)
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
   USER MACHINE     BROKER PLATFORM   USER ATTENTION
   (optional        (orders,          (monitor, flatten,
    local runner)    account,          contingency)
                     custody)
```

**Primary promise:** best-in-class **build and prove**.  
**Secondary:** optional **assisted** paper/live **under user authority**, never as the only way risk is managed.

### 3.2 Execution modes (responsibility-ranked)

| Mode | Who runs the loop | Labs liability surface | Goal rank |
|------|-------------------|------------------------|-----------|
| **M0 Export / manual** | User at broker UI or manual tickets from Labs plan | Lowest | **Default teach path** |
| **M1 Broker-native exits** | Broker brackets/OCO/algos after user/Labs submits entry | Low–medium | **Prefer for manage** |
| **M2 User-local runtime** | User’s always-on machine / VPS **they** control, using Labs-exported config + optional Labs client | Medium (software defects) | **Preferred for full scan/manage graphs** |
| **M3 Labs-hosted worker** | Labs multi-tenant workers (§17 prior plan) | **Highest** | **Optional premium / constrained**; not the legal/product north star |

**Goal hierarchy:** maximize M0–M2; minimize dependence on M3 for live capital.

### 3.3 What to build first (aligned with goal)

| Priority | Capability | Offloads to |
|----------|------------|-------------|
| P0 | Life cycle, packs, BT/FW, versioning, status strip | User understanding |
| P0 | **Plain-language “what this will do”** + live arming ceremony | User |
| P0 | **Export deployment pack** (graph, envelope, exits, version hash) | User / their runner |
| P1 | **Broker order adapter** (Tradier) for **user-initiated** or **user-hosted** client | Broker for fills |
| P1 | Prefer **broker-side exit orders** at entry when API allows | Broker for manage path |
| P2 | **User-local / BYO worker** (documented, user-operated) consuming export pack | User ops uptime |
| P3 | Labs-hosted workers only with **strict caps**, **paper default**, **explicit live addendum**, admin fleet | Shared residual risk |

---

## 4. Shifting manage-loop risk to the broker (maximize)

### 4.1 Prefer broker-held exits

When opening a structure, **attach exit instructions the broker accepts** (brackets, OCO, multi-leg close rules as supported):

- Profit target / stop as **working orders** on the broker  
- DTE/time exits if broker supports GTD/GTC strategies; else **user** or **user-local** manage  

**If Labs is down:** broker still holds protective orders (to the extent the broker accepted them). That is the single biggest offload for “manage.”

### 4.2 Honest limits

| Broker can hold | Broker typically cannot hold |
|-----------------|------------------------------|
| Limit/stop/bracket after entry | Full multi-symbol RSI/structure scan graph |
| Account buying power checks | Labs pack validation semantics |
| Their platform availability | FatTail-specific decision recipes |

**Architecture rule:** Design packs so **critical protection is expressible as broker orders**, not only as “Labs manage runner must tick.”

### 4.3 Reconcile without owning the clock

Even in M0–M2, Labs may offer **on-demand reconcile** (“pull positions from broker”) when the user opens the app — user-initiated, not 24/7 duty.

---

## 5. Shifting run-loop risk to the user (maximize)

### 5.1 Informed creator (non-negotiable product)

Before live arming (any path that can send live orders):

1. **Summary screen:** symbols, structure, envelope, scan vs manage, exit policies, version hash  
2. **Checkboxes** (must all be true): I understand; I am not advised by Labs; I can flatten at broker; I accept outage scenarios  
3. **Typed confirm** (e.g. strategy name or “LIVE”)  
4. Store **attestation record** (timestamp, version, IP, checklist ids) — Family B / legal evidence  

### 5.2 User-operated runtime (M2)

Provide:

- Exported **Deployment Pack** (JSON): instance config, runners, decisions, envelope, pack pin  
- Optional **open-source or Labs CLI worker** run on **user infra**  
- Docs: “If this machine is off, **you** are not running; broker exits still apply if placed”  
- Updates: user pulls new pack version; Labs does not silent-push live graph changes  

**Uptime of M2 = user’s problem** (their VPS, their power). Labs problem = software correctness of the worker when used as directed.

### 5.3 Contingency checklist (required education)

Product/course must teach:

- How to flatten at broker if Labs/client down  
- That scan will not fire if user runtime is off  
- That only broker-accepted working orders protect without a manage loop  

---

## 6. What remains if Labs ever hosts (M3) — residual risk containment

M3 is **not** the goal, but if offered:

| Control | Purpose |
|---------|---------|
| Paper default; live as explicit add-on | Reduce capital at Labs-host risk |
| Hard instance caps | Limit blast radius |
| Broker-held exits still required for live | Don’t rely on Labs tick for survival |
| Admin fleet console | Kill switch, halt tenant |
| Multi-AZ only if business accepts cost | Still no “cannot fail” claim without counsel |
| SLA language: **best effort**, not 99.999% guarantee of strategy outcomes | Uptime ≠ P&L or perfect exits |
| Kill switch defaults **safe**: pause **new** opens; do not invent mass closes without user policy | Avoid wrong-way automation in outage |

**Never market M3 as “set and forget; we guarantee continuity.”**

---

## 7. Uptime reframed (honest)

| Claim | Appropriate? |
|-------|----------------|
| 99.999% on **member strategy outcomes** | **No** — not a product claim |
| High availability on **Labs website / Design tools** | Yes, normal web HA |
| Broker uptime | Broker’s SLA / status page |
| User-local worker uptime | User’s SLA |
| Labs-hosted worker (if any) | Internal target (e.g. 99.9% best effort) + **safe failure modes** |

**Safe failure modes (any Labs path):**

1. Prefer **no new risk** over wrong risk when degraded.  
2. Prefer **broker-held exits** over Labs-only exits.  
3. Fail loud in UI; never silent “all good” when workers/data stale.  
4. User always has broker path to flatten.

---

## 8. Comparison: old vs goal architecture

| | Hosted-first (prior scale narrative) | **Offload-first (this document)** |
|--|--------------------------------------|-------------------------------------|
| Who runs scan/manage 24/7 | Labs workers | User runtime and/or broker exits |
| Legal blast radius | High | Lower (counsel still required) |
| Multi-region Labs | Tempting / costly | Mostly unnecessary for M0–M2 |
| Admin fleet console | Essential | Still useful for **assisted** M3 / support; smaller surface |
| Process Runtime Spec §17 | Full multi-tenant farm | **Optional tier**; job queue still useful for M2/M3 |
| Superiority vs OA | Compete on hosting bots | Compete on **life cycle, proof, defined risk, handoff, education** |

---

## 9. Implications for Process Runtime Spec

Keep entities (instance, envelope, runners, decision log, ladder) as **the language of a deployment plan**.

Reinterpret:

| Concept | Hosted-first | Offload-first |
|---------|--------------|---------------|
| Deployment instance | Labs-hosted shell | **Portable deployment plan** (+ optional Labs assist session) |
| Runner | Labs worker tick | **User worker** or **broker-native** fragment |
| Decision log | Always Labs | Labs when assisted; export always; user worker can ship log back |
| Dry/paper/live | Labs ladder | User/broker ladder with Labs as coach/tools |
| Admin environment | Fleet of Labs bots | **Connectivity health, export integrity, optional M3**, never “we run your book” branding |

Recommend a Spec amend (v1.1) stating: **M0–M2 are primary; M3 secondary.**

---

## 10. Phased product plan (goal-aligned)

| Phase | Deliver | Responsibility shift |
|-------|---------|----------------------|
| **E0** | Counsel: ToS, disclaimers, attestation copy | Legal frame |
| **E1** | Design/version/validate + **arming ceremony** + plain summary | User understanding |
| **E2** | **Export Deployment Pack** + contingency docs | User can run elsewhere |
| **E3** | Tradier connect: user-initiated orders; **broker exits where possible** | Broker holds exits |
| **E4** | Optional **user-local worker** (docs + CLI) | User uptime |
| **E5** | Optional Labs-assisted paper (short sessions / opt-in) | Limited Labs residual |
| **E6** | Optional Labs-hosted M3 only with caps + admin + no outcome SLA | Explicit residual |

---

## 11. Success criteria (for this architecture)

1. Member can **fully** use Strategy Lab value **without** Labs hosting live ticks.  
2. Live path always shows **who runs what** (user / broker / Labs assist).  
3. Critical protection **preferentially** on broker as working orders.  
4. Attestation + version hash stored before any live order path.  
5. Marketing never implies Labs is a discretionary manager or uptime guarantor of strategies.  
6. Counsel has reviewed boundary language.  

---

## 12. Risks of this goal (honest)

| Risk | Mitigation |
|------|------------|
| Users expect OA-style hosted bots | Product clarity; optional M3 later; education |
| Broker API lacks rich exits | Document limits; user-local manage; contingency |
| User turns off machine mid-risk | Broker exits + education + arming ceremony |
| Labs still blamed for software bugs | Quality, fail loud, insurance/counsel; not solved by architecture alone |
| Competitive gap vs hosted OA | Win on **proof + life cycle + risk doctrine**, not hosting arms race |

---

## 13. First broker target: Tradier

**Locked:** Tradier is the **first** (and near-term only) execution venue for Strategy Lab handoff.

Aligns with DL-185 / `Architecture/09-strategy-lab-tradier.md`:

| Layer | Provider |
|-------|----------|
| Market data / Test / marks | Massive + Coach chain archive |
| **Orders paper → live** | **Tradier API** |

### 13.1 What we can offload to Tradier (maximize)

| Capability | Use in FatTail model |
|------------|----------------------|
| **Multi-leg options orders** | Open defined-risk structures (spreads, butterflies, etc.) as broker-native multi-leg |
| **Paper / sandbox accounts** | Paper ladder without Labs hosting risk |
| **Account truth** | Positions, balances, order status via API — reconcile on demand |
| **Advanced orders (OTO / OCO / OTOCO)** | **Prefer** after entry: profit target + stop as **broker-held** working orders so manage path does not require Labs uptime |
| **Order reject / margin / halt** | Broker owns acceptance; Labs logs and surfaces fail loud |
| **User custody** | Member’s Tradier account; Labs never holds funds |

Public Tradier docs support multi-leg trading and advanced types (**OCO**, **OTO**, **OTOCO**) for chaining entry and protective legs — exact option multi-leg + OCO combinations must be **validated in paper** per structure (implementation spike).

### 13.2 What Tradier does **not** replace (honest)

| Not on Tradier | Remains user or Labs-design |
|----------------|-----------------------------|
| Full **scan** graph (multi-symbol decisions, structure filters, schedule) | User-local worker (M2) or manual (M0) or optional Labs assist (M3) |
| Labs pack validation / BT / FW | Strategy Lab Design |
| Continuous “bot shell” with OA-style automations library | Not a Tradier product feature |
| Guarantee of fill quality / no slippage theater | Broker + market; never Labs promise |

**Implication:** For **manage**, push as much as possible into **Tradier working orders** at open. For **scan**, expect **user-operated** runtime or manual arming — not “Tradier runs our Strategy Lab graph.”

### 13.3 Tradier-first delivery slice (goal-aligned)

```text
1. Member OAuth / API token to their Tradier account (user-owned credentials)
2. Design → validate pack → arming ceremony (attestation + version hash)
3. Paper: multi-leg open via Tradier sandbox
4. Attach OCO/OTOCO (or best supported) exits on broker when possible
5. On-demand reconcile positions/orders (user opens Labs)
6. Export Deployment Pack for user-local scan later
7. Live only after paper path proven + counsel copy
```

### 13.4 Credential & liability pattern

- Tokens stored encrypted, user-revocable; **member is API principal** to Tradier.  
- Labs acts as **authorized application**, not the account owner.  
- Docs: disconnecting Labs does not cancel broker working orders — user manages at Tradier.  

---

## 14. Bottom line

**Yes — the strategic goal should be:**  
Labs provides the **environment to design, prove, version, and hand off** automations; the **user** owns running the process; the **broker** owns the account, orders, and (where possible) working protective orders.

**First broker:** **Tradier** (paper then live). Data stays Massive/Coach pipe.

That **diminishes** platform legal/ops exposure far more than multi-region five-nines Labs bot hosting, and it fits FatTail: **capacity, process, defined risk** — not dependency on our always-on robot farm.

**Next steps:**  
1. Coach confirm this as **execution north star** (Tradier-first).  
2. Counsel review of arming + ToS + Tradier app relationship.  
3. Amend Process Runtime Spec v1.1: M0–M2 primary, M3 optional, Tradier adapter.  
4. Spike: multi-leg open + OCO/OTOCO on **Tradier paper** for butterfly/spread packs.  
5. Spec **Deployment Pack export** + **Tradier exit preference** as first build slices.  
