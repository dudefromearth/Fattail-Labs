# Strategy Lab Execution Architecture — Review  
### Offload to user + broker · Tradier first · Process runtime · Continuity/versioning fit

**Date:** 2026-08-05  
**Reviewer:** Grok (architecture synthesis)  
**Status:** Review document for Coach / India / Mike / counsel — not legal advice  
**Verdict (summary):** **APPROVE direction** with **mandatory Spec alignment** (Process Runtime v1.1) and **counsel before any live path**.  

---

## 1. Scope of this review

This review covers the emerging Strategy Lab **execution architecture** as of 2026-08-05:

| Artifact | Role |
|----------|------|
| OptionAlpha analysis (bots-as-process) | Feature ideas, not product clone |
| `Specs/Strategy-Lab-Process-Runtime-Spec-v1.1.md` | **Updated:** M0–M2 primary; M3 optional; Tradier; arming; export; §17 M3-only |
| `Architecture/14-strategy-lab-execution-responsibility.md` | **User + broker run**; Labs handoff (DL-214) |
| `Architecture/09-strategy-lab-tradier.md` | Massive data / Tradier execution split |
| Continuity Spec v1.0 | Place ≠ SoR; explore ≠ apply; restore rails |
| Versioning & Process Control Recommendations v1.2 | P1–P8; paper-before-live; freeze; drift |
| Development Phase Spec v1.0 | BT → FW before capital path |
| Admin Dual Surface Spec | Operator cockpit pattern for any residual hosted tier |

**Question under review:**  
Is the architecture (hosted environment vs offload to user/broker; Tradier-first; process runners) sound, risk-minimizing, scalable, and aligned with FatTail doctrine and existing Strategy Lab specs?

---

## 2. Executive verdict

| Dimension | Assessment |
|-----------|------------|
| **Strategic direction** | **Strong** — offload *running* to **user + broker**; Labs = design / prove / handoff |
| **First broker (Tradier)** | **Correct** — matches DL-185; paper path; multi-leg + advanced orders available |
| **Fit to continuity / versioning** | **Strong** if Process Runtime is amended so hosted workers are **optional M3**, not the implied default |
| **Legal/ops risk vs Labs-hosted bot farm** | **Materially lower** under offload model; still requires counsel + attestation |
| **Competitive vs OptionAlpha** | **Superior positioning** if we win on life cycle + defined risk + proof, not 24/7 hosting |
| **Main gap** | ~~Spec tension~~ **Resolved in Process Runtime v1.1** (DL-215) |
| **Five-nines for strategy outcomes** | **Reject as product claim** — neither honest nor necessary under offload model |

**Overall:** Approve **user + broker execution north star** and **Tradier-first** handoff. Treat Labs multi-tenant runtime as **optional residual**, not the flagship. Do not implement live capital until ToS/attestation and Tradier paper spike complete.

---

## 3. What “good” looks like (reviewed model)

```text
LABS (control & proof)
  Design · version · BT/FW · pack validate · arming ceremony · export pack
           │
           │ user intentional handoff
           ▼
USER                          TRADIER (first broker)
  owns strategy & arming        owns account, custody
  optional local scan runtime   multi-leg open
  monitors & contingency        OCO/OTO/OTOCO exits when possible
                                reject/margin/halt truth
```

| Mode | Who runs continuous loop | Preference |
|------|--------------------------|------------|
| **M0** Manual / export at broker UI | User | Default teach path |
| **M1** Broker-held exits after entry | Tradier working orders | Prefer for **manage** |
| **M2** User-local/VPS worker | User infra | Prefer for **scan** graphs |
| **M3** Labs-hosted workers | Labs | Optional only; capped; never brand promise |

---

## 4. Review against continuity & versioning

### 4.1 Continuity Spec — **compatible**

| Continuity lock | Runtime implication | Status |
|-----------------|---------------------|--------|
| Place ≠ product truth | Instances/logs server SoR; place only remembers Deploy focus | Spec’d correctly |
| Empty-on-unknown | No auto-pick of another strategy’s deployment | Spec’d correctly |
| Place not process metrics | Health from decision_log / lifecycle_log | Spec’d correctly |
| Explore ≠ apply | Exploring pack history must not rebind runtime | Spec’d (V-4/V-5) |
| Restore rails | Pack restore does not silent-mutate instances | Spec’d |

**Risk if ignored in implementation:** place memory used as “bot last ran OK” or explore silently rebinds live risk. **Mitigation:** keep Continuity cross-links in every PR checklist.

### 4.2 Versioning recommendations (P1–P8) — **compatible**

| Principle | Runtime fit |
|-----------|-------------|
| P1 Clarity of state | Status strip must show bound version vs HEAD, ladder mode, drift |
| P2 Full control | Arm / ladder / rebind explicit |
| P3 Deterministic trails | Decision log append-only |
| P4 Explore ≠ apply | No silent rebind |
| P5 Process before P&L | Metrics: blocks, stops, dry outcomes — not win rate hero |
| P6 Fail loud | Stale data, envelope, head mismatch |
| P7 Family B | Identity-scoped instances and logs |
| P8 Clone over branch | Experiments = clone card / clone instance |

**Paper-before-live** and **change freeze on live** in Versioning recommendations align with Process Runtime ladder and freeze rules — **keep**.

### 4.3 Development Phase — **compatible and load-bearing**

No live path without Design validation (BT + FW + Deployed) is the main defense against “automate nonsense.” Under offload model this is even more important: we send **users** to Tradier with a **proven pack**, not a doodle.

---

## 5. OptionAlpha process ideas — adopt / adapt / reject (review summary)

### 5.1 Adopt (high value, low doctrinal conflict)

| Idea | FatTail shape |
|------|----------------|
| Shell vs procedures | Deployment instance vs process runners |
| Scanner vs monitor | **scan** vs **manage** types |
| Decision log | SoR trail; include manual |
| Safeguards | Risk envelope (defined-risk + caps) |
| Run-now for debug | Dry-run first |
| Exit policy on position | Prefer **Tradier** working orders |
| Library of automations | Versioned modules later; pin by version |

### 5.2 Adapt carefully

| Idea | Risk | FatTail shape |
|------|------|---------------|
| Natural-language decision recipes | Unbounded complexity | Typed decisions; structure/risk first |
| Multi-symbol loops | Over-trading | Envelope + max per symbol default 1 |
| Hosted 24/7 engine | Legal/ops | **User-local or manual**; Labs M3 optional |

### 5.3 Reject as product spine

| Idea | Why |
|------|-----|
| Bot-first product identity | Life cycle first |
| Indicator-first pedagogy (RSI hero) | Defined risk + process gates |
| POP / rate-of-return as primary quality | Process over P&L theater |
| “Dozens of automations / anything goes” | Capacity; pack constraints |
| Five-nines Labs SLA on strategy outcomes | Dishonest under any model |

---

## 6. Tradier-first assessment

### 6.1 Why Tradier is the right first target

| Factor | Assessment |
|--------|------------|
| Already locked (DL-185) | Execution out; no streaming purchase |
| Paper path | Required for honest ladder |
| Multi-leg options | Required for defined-risk packs |
| Advanced orders (OCO / OTO / OTOCO) | Path to **broker-held** protect after entry |
| API-first broker | Fits Labs adapter model |
| Member custody | Account stays with member |

### 6.2 What we can put on Tradier (offload)

| On Tradier | Effect if Labs/user machine down |
|------------|----------------------------------|
| Multi-leg **open** | Order already at broker |
| **OCO / OTOCO** style exits (where supported for the structure) | Protect may still work **without** Labs tick |
| Position/order **truth** | Reconcile when user returns |
| Margin / reject / halt | Broker owns |

### 6.3 What stays off Tradier (honest)

| Not Tradier | Owner |
|-------------|--------|
| Multi-symbol **scan** graph | User (M0/M2) or optional Labs M3 |
| Pack BT/FW / versioning | Labs |
| Continuous “OA bot shell” inside broker | N/A — not offered |

### 6.4 Implementation risk on Tradier

| Risk | Mitigation |
|------|------------|
| Advanced order + multi-leg combos vary by product | **Paper spike** before Spec freeze of exit templates |
| API rate limits under many users | Throttle gateway; user-local spreads load; not N full poll storms from Labs |
| Token security | User-owned credentials; encrypted store; revocable; never log secrets |
| Member blames Labs for Tradier outage | Product copy: broker status is broker’s; contingency checklist |

**Review finding:** Tradier-first is **approved**. Critical path is a **paper multi-leg + advanced exit spike** with documented capabilities matrix per pack type (butterfly, vertical, etc.).

---

## 7. Responsibility & legal risk (architecture review)

*Not counsel opinion — product architecture only.*

### 7.1 Risk allocation (goal)

| Party | Primary residual risks |
|-------|------------------------|
| **User** | Strategy choice, arming, monitoring, machine off, ignoring contingency |
| **Tradier** | Order handling, account, accepted working orders, their platform |
| **Labs** | Software defects, misleading UX, security of tokens, false “all good” states |

### 7.2 Product controls that shift risk to creator (required)

1. **Informed arming ceremony** — plain summary of envelope, runners, exits, version hash  
2. **Attestations** stored (timestamp, version, checklist)  
3. **No waive** of Design BT/FW for live (default)  
4. **Export Deployment Pack** so user can run without Labs  
5. Education: flatten at Tradier if Labs/client down; broker exits ≠ full scan  

### 7.3 What “99.999% uptime” means here

| Claim | Review |
|-------|--------|
| Five-nines on **strategy P&L / perfect exits** | **Reject** — not a product claim |
| High availability of **Labs Design/web** | Normal web HA; separate from execution |
| Tradier availability | Broker’s domain |
| User-local worker | User’s domain |
| Labs-hosted M3 (if any) | Best-effort internal target + **safe failure** (prefer no new risk) |

**Safe failure > fake five-nines:** when degraded, **block new opens**; rely on **broker-held exits**; fail loud.

### 7.4 Counsel checklist (before live)

- [ ] ToS: software/education; not adviser/discretionary manager  
- [ ] Arming copy + attestation  
- [ ] Tradier developer / API relationship disclosures  
- [ ] Limitation of liability / no outcome warranty  
- [ ] What happens on disconnect (working orders remain at broker)  

---

## 8. Scale (hundreds of users) under offload-first

| Approach | Fits hundreds of users? |
|----------|-------------------------|
| Labs workers tick every member (M3 primary) | Expensive, high liability, needs §17 farm |
| **User + Tradier primary** | Scale is **distributed**: each user’s activity and Tradier’s capacity |
| Shared Labs API for design/export/OAuth | Standard web scale |
| Optional Labs paper assist | Cap concurrent assisted sessions |

**Review finding:** Offload-first **scales better** for legal and ops than hosted bots. Multi-tenant job queue (§17) remains valid **only for M3 or short-lived Labs assist**, not as the brand core.

**Caps still recommended** even under offload: max strategies live-armed, rate limits on API order submission from Labs-assisted paths, min intervals on any Labs-side enqueue.

---

## 9. Admin environment console

### 9.1 Assessment

If **any** Labs-assisted execution exists (paper assist, M3, token proxy), a **separate admin surface** is **required**:

| Admin must control | Why |
|--------------------|-----|
| Global mode off / dry_only / paper_only | Kill switch |
| Queue / worker health (if workers exist) | Ops |
| Halt identity or instance | Abuse / incident |
| Stale data / broker 429 visibility | Fail loud ops |
| Audit of Labs-side order submissions | Support |

### 9.2 Placement

Fits **Admin Dual Surface**: `/admin/strategy-runtime` (or similar), not member header IA.

### 9.3 Family B

Admin sees **ops metadata** (status, error codes, counts). Full decision_log / pack body access only under existing privacy / support policy (Mike + Privacy Spec). Default: **no casual read of member graphs**.

### 9.4 Under pure M0–M2 (no Labs host)

Admin still valuable for: OAuth app health, API error rates, feature flags, export integrity — smaller than full fleet console, still worth a thin page.

**Review finding:** **Approve** separate admin app/view for environment control; scope scales with how much M3/assist you ship.

---

## 10. Spec tension — **resolved (v1.1)**

Process Runtime **v1.1** (DL-215) implements the review recommendations:

1. M0–M2 primary, M3 optional  
2. Deployment plan / handoff language  
3. §17 workers only for M3/assist  
4. Tradier-first + broker exit preference  
5. Arming ceremony + attestation  
6. Deployment Pack export  
7. Admin environment console  

**Implement from v1.1 only.**

---

## 11. Strengths (keep)

1. Life cycle before automation  
2. Version bind + drift + explore isolation  
3. Envelope + defined risk  
4. Decision log as SoR  
5. Dry/paper/live honesty  
6. Massive/Tradier split (cost + clarity)  
7. User/broker responsibility goal (legal + doctrine)  
8. Tradier advanced orders for broker-held protect  

---

## 12. Weaknesses / open risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Spec v1.0 vs DL-214 contradiction | High | Process Runtime v1.1 amend |
| Users expect OA hosted bots | Medium | Product copy + education; optional M3 later |
| Tradier advanced orders incomplete for some multi-leg exits | Medium | Paper matrix spike per pack |
| User machine off with only Labs manage (if M3) | High | Don’t ship live manage without broker exits |
| Software bug still Labs residual | Medium | Quality, fail loud, insurance/counsel |
| Support burden “why no fill” | Medium | Log + Tradier status + contingency docs |
| Token compromise | High | Encrypt, revoke, least privilege, audit |

---

## 13. Recommended decisions (Coach)

| # | Decision | Suggested |
|---|----------|-----------|
| D1 | Execution north star = user + broker | **Yes** |
| D2 | First broker = Tradier only near-term | **Yes** |
| D3 | Labs-hosted M3 not v1 brand promise | **Yes** |
| D4 | Broker-held exits preferred for manage | **Yes** |
| D5 | Process Runtime v1.1 amend before major build | **Yes** |
| D6 | Counsel before live | **Yes** |
| D7 | Admin strategy-runtime console | **Yes** (thin if M0–M2 only; full if M3) |
| D8 | Claim five-nines on strategy outcomes | **No** |

---

## 14. Recommended build order (post-review)

| Order | Work | Offloads to |
|-------|------|-------------|
| 1 | Process Runtime Spec **v1.1** (align DL-214) | Clarity |
| 2 | Counsel pack (ToS + arming) | Legal frame |
| 3 | Arming ceremony + attestation storage | User |
| 4 | Tradier OAuth + **paper** multi-leg open | Broker |
| 5 | Paper spike: OCO/OTO/OTOCO matrix per pack | Broker exits |
| 6 | On-demand reconcile UI | Broker truth |
| 7 | Deployment Pack export | User runtime |
| 8 | User-local worker docs/CLI (optional) | User |
| 9 | Admin thin console (flags, errors) | Ops |
| 10 | Live only after 3–7 proven | Shared residual |

---

## 15. Acceptance of this review

**Approve architecture direction if:**

- [ ] Coach accepts D1–D8  
- [ ] Process Runtime amended to v1.1 (or explicit waiver with written residual)  
- [ ] Tradier paper spike scheduled before live UI  
- [ ] Counsel engaged before live attestation  

**Block live capital if:**

- No arming ceremony / ToS  
- Live manage depends solely on Labs tick without broker-held protect  
- Marketing implies Labs guarantees outcomes or continuous strategy uptime  

---

## 16. Bottom line

The architecture that **diminishes risk** is not “perfect Labs uptime.” It is:

1. **User owns** strategy and the decision to arm.  
2. **Tradier owns** the account, orders, and as many **working exits** as the API allows.  
3. **Labs owns** the best design/proof/handoff tools — and only optional, capped assist.  

That is coherent with continuity, versioning, Development gates, and FatTail doctrine. The outstanding work is **alignment of specs**, **Tradier paper proof**, and **legal packaging** — not inventing a multi-region bot farm.

---

## 17. Document control

| Ver | Date | Author | Note |
|-----|------|--------|------|
| 1.0 | 2026-08-05 | Architecture review (Grok) | Full review of execution offload + Tradier-first + runtime |

**Pointers:**  
- Architecture: `Architecture/14-strategy-lab-execution-responsibility.md`  
- Runtime Spec: `Specs/Strategy-Lab-Process-Runtime-Spec-v1.0.md`  
- Tradier: `Architecture/09-strategy-lab-tradier.md`  
- Decisions: DL-213, DL-213b, DL-214  
