# Strategy Lab — Process Runtime — Full Agent Bench Plan v1.0

**Date:** 2026-08-05  
**Owner (orchestration):** Juliet  
**Authority:** Coach (GO / ship / LEGAL-LIVE flag)  
**Board:** [`agents/p-strategy-runtime/`](../agents/p-strategy-runtime/)  
**Scope:** [`Strategy-Lab-Process-Runtime-Implementation-Scope-v1.0.md`](./Strategy-Lab-Process-Runtime-Implementation-Scope-v1.0.md)  
**Spec:** [`Specs/Strategy-Lab-Process-Runtime-Spec-v1.1.md`](../Specs/Strategy-Lab-Process-Runtime-Spec-v1.1.md) (**SPEC AUTHORITY** v1.1.1)  
**Parents:** Architecture/14 · Architecture/09 · Continuity · Versioning recommendations · Development Phase · Pack Architecture  
**Governance:** [`agents/bench/doctrine.md`](../agents/bench/doctrine.md) · first-principles · spec-create-review-workflow  

Specialists execute **only** via seeds. Coordination only through **Coach** or **Juliet**.  
Delta gates are **PASS / FAIL / BLOCKED** with evidence — never waived.

**Legal:** Counsel / ToS / DPIA are **outside this board**. Coach reports **LEGAL-LIVE** / **LEGAL-COPY** GO/NOGO; seeds must not invent legal text.

---

## 0. Mission

Ship the **process runtime** for Strategy Lab deployments:

| Law | Source |
|-----|--------|
| User + broker run first; Labs handoff not five-nines host | Spec §0 · Arch/14 |
| M0 → M1 → M2 primary; M3 optional Coach GO | Spec §0.2 · §12 |
| Automations are process plugins under versioned life cycle | Spec §0.5 |
| ExitPolicy structure-agnostic (debit-first packs) | Spec §2.7 |
| Order-level dedupe O-1…O-5 (money safety) | Spec §21.4 |
| Pause/halt/archive ≠ cancel broker working orders | Spec §4.1.1 |
| Live only with G-2 + arming + LEGAL-LIVE | Spec §1.4 · §18 · Scope §1 |
| Process metrics over P&L theater | P5 · Hotel · Tango |
| Family B isolation | P7 · Mike |
| Clone over branch | P8 |

**Out of program:** legal drafting; M3 brand promise; indicator marketplace; MSC imports; Continuity Wave A full version explorer (consume bind rules only); Practice suite rewrite.

---

## 1. Full bench roster (this program)

### 1.1 Authority & orchestration

| Callsign | Role | Authority |
|----------|------|-----------|
| **Coach** | Product frame, LEGAL-* flags, M3 GO, ship/no-ship, arbiter | Final |
| **Juliet** | Decomposition, board, seeds, phase order, status honesty | Plans only — **never executes packets** |
| **India** | Domain model, instance/envelope/bind/drift, boundary vs Continuity/Pack, closure | Architecture **veto** |

### 1.2 Platform execution

| Callsign | Role |
|----------|------|
| **Alpha** | FastAPI, migrations, `strategy_runtime` domain, decision_log, export pack, Tradier adapter APIs |
| **Charlie** | Deploy work area UI: instance, arming, ladder, log, banners, status strip, admin console (PR10) |
| **Echo** | Deploy chrome density, status strip, arming ceremony layout, fail-loud banners (HIG) |
| **Mike** | Family B isolation, broker token storage, OAuth, attestation isolation, secrets; Privacy consumer hooks |
| **Foxtrot** | Env for Tradier keys/flags; deploy only when phase needs MiniTwo/stage; **no** M3 fleet until PR10 |
| **Sierra** | No “Labs guarantees bot uptime / profits” in marketing surfaces; process copy only |

### 1.3 Quality, member, trading

| Callsign | Role |
|----------|------|
| **Delta** | Formal gates with evidence; ternary verdicts |
| **Kilo** | Isolation tests, envelope tests, O-* double-submit tests, G-2 live block tests |
| **Lima** | Decision log, Spec as-built parity, Architecture/00 entries |
| **Tango** | Arming copy, pause/archive banners, capacity-over-dependency; no surface-explaining walls |
| **Hotel** | ExitPolicy economics (debit/credit), broker-exit honesty, no reckless live claims |

### 1.4 Lineage (review only — Coach pull)

| Callsign | When |
|----------|------|
| **Victor** | Optional: via negativa on “Labs uptime as edge” |
| **Whiskey** | Optional: capital preservation framing on envelope |
| **Yankee** | Optional: fat-tail honesty — no mild expectancy theater |

### 1.5 Not seated

| Callsign | Why |
|----------|-----|
| **Golf** | Ask Vexy — not this program |
| **Quebec / Bravo / November / Romeo / Papa** | Content studio |

---

## 2. Sacred invariants (all seeds)

1. **Standalone repo** — no MarketSwarm-Canonical imports.  
2. **Config fail-loud** — missing broker/env fails; no silent paper-as-live.  
3. **Family B** — instances, graphs, decision_log, order intents, attestations by `identity_id`.  
4. **User + broker run first** — do not implement M3 as default path.  
5. **O-1…O-5** before any multi-leg paper/live submit.  
6. **ExitPolicy names** structure-agnostic only.  
7. **G-2** before live; fail loud.  
8. **Explore ≠ rebind; restore ≠ silent instance mutate.**  
9. **Labs status ≠ broker risk** — banners on pause/halt/archive/disconnect.  
10. **Process metrics, not P&L theater.**  
11. **Evidence over assertion** — curl/API/UI proof.  
12. **Change control** — declare exact files before touch.  
13. **No waived Delta gates.**  
14. **No production live / attestation retention** without Coach **LEGAL-LIVE = GO**.  
15. **Documentation parity** — Spec + DL + scope status same body of work as ship.

---

## 3. As-built status (honest — 2026-08-05)

### 3.1 Landed (substrate — not runtime-complete)

| Item | Status | Evidence |
|------|--------|----------|
| Strategy Lab shell / bins / place memory | **LANDED** | `StrategyLabApp`, `strategyLabPlace.ts` (localStorage) |
| Strategy cards + lifecycle + version | **LANDED** | `strategy_lab_domain.py`, mig 078+ |
| Butterfly pack + Design BT/FW | **LANDED** | `strategy_packs`, DevelopmentValidation |
| Portability + recovery blobs | **LANDED** | Portability Spec implementation |
| Process Runtime Spec v1.1.1 | **LANDED** | Specs/ |
| Implementation scope + this bench plan | **LANDED** | docs/ + agents/p-strategy-runtime/ |

### 3.2 Not landed

DeploymentInstance, decision_log runtime, arming, Deployment Pack, Tradier member paper open, O-* , broker exits matrix, dry-run graph eval, user worker, live path, M3/admin fleet.

---

## 4. Phase map (seeds + gates)

Naming: **SR** = Strategy Runtime. Phase IDs match Spec PR0–PR10.

```text
SR0-G ──► SR1-G ──┬──► SR2-G ──┐
                  ├──► SR3-G ──┼──► SR7-G
                  ├──► SR6-G   │
                  └──► SR4-G ──► SR5-G ──► SR8-G ──► SR9-G
                                                    │
                              SR10-G ◄── Coach M3 GO only
```

### SR0 — Spec program lock + external legal track

| Seed | Agent | Intent |
|------|-------|--------|
| SR0-0 | Coach | Program GO / ADJUST; set LEGAL-TRACK status; confirm L1–L10 defaults |
| SR0-1 | India | Spec integrity vs Continuity/Pack/Arch14; instance model sign-off |
| SR0-2 | Mike | Family B surfaces + attestation consumer + token posture (no legal text) |
| SR0-3 | Tango | Chrome vocabulary: Deployment/Runner not Bot (L1); banner honesty |
| SR0-4 | Hotel | ExitPolicy economics; broker-exit claims; G-2 live honesty |
| SR0-5 | Echo | Deploy work area / arming / status strip layout criteria |
| **SR0-G** | **Delta** | Spec lock for build authority on PR1+ (paper paths); LEGAL-LIVE may still be NOGO |

**Exit:** Coach BUILD AUTHORITY for **M0/M1 paper + export**. Live production remains LEGAL-LIVE gated.

### SR1 — Deployment plan schema / API / decision_log (no tick loop)

| Seed | Agent | Intent |
|------|-------|--------|
| SR1-1 | India + Alpha | Domain model: instance, envelope, runners, bind hash, statuses |
| SR1-2 | Alpha | Migrations + domain + CRUD APIs; identity isolation |
| SR1-3 | Alpha | `decision_log` append + list (cursor); L-1…L-5 rules |
| SR1-4 | Charlie | Deploy work area: list/create instance, envelope form, log panel |
| SR1-5 | Charlie + Continuity | Place write on instance select; empty-on-unknown |
| SR1-6 | Kilo | Isolation + envelope validation characterization tests |
| **SR1-G** | **Delta** | PR1 acceptance |

### SR2 — Arming ceremony + attestation

| Seed | Agent | Intent |
|------|-------|--------|
| SR2-1 | Alpha | AttestationRecord schema/API; **refuse production live if LEGAL-LIVE=NOGO** |
| SR2-2 | Charlie + Echo | Arming ceremony UI (§18.1–18.2); typed confirm |
| SR2-3 | Tango | Plain-language summary copy (watermark if LEGAL-COPY=NOGO) |
| SR2-4 | Mike | Isolation + export path for attestations; no generic purge assumption |
| SR2-5 | Kilo | Cannot arm live without checklist; fail loud |
| **SR2-G** | **Delta** | PR2; production store evidence only if LEGAL-LIVE=GO else staged/fail-loud documented |

### SR3 — Deployment Pack export

| Seed | Agent | Intent |
|------|-------|--------|
| SR3-1 | Alpha | Export builder + `integrity_hash`; no secrets |
| SR3-2 | Charlie | Export UI affordance |
| SR3-3 | Kilo | Hash verify fixture; round-trip integrity |
| **SR3-G** | **Delta** | PR3 |

### SR4 — Tradier paper multi-leg + reconcile + O-*

| Seed | Agent | Intent |
|------|-------|--------|
| SR4-1 | Mike + Alpha | Member OAuth / token store posture (encrypted; revocable) |
| SR4-2 | Alpha | Paper multi-leg open adapter; order-intent log + `client_order_tag` |
| SR4-3 | Alpha | O-3 reconcile-before-retry; O-5 `order_uncertain` |
| SR4-4 | Alpha | On-demand positions/orders reconcile → UI payload |
| SR4-5 | Charlie | Paper open UX; uncertain/dedupe messaging |
| SR4-6 | Kilo | Double-click / timeout retry does **not** double position (mock broker) |
| **SR4-G** | **Delta** | PR4 |

### SR5 — Broker-held exits matrix

| Seed | Agent | Intent |
|------|-------|--------|
| SR5-1 | Hotel + India | Per-pack advanced order matrix (paper spike findings) |
| SR5-2 | Alpha | ExitPolicy → OCO/OTO/OTOCO paper placement; structure-agnostic fields only |
| SR5-3 | Charlie | Exit policy UI; L4 self-manage path blocked without attest |
| SR5-4 | Kilo | Forbid `*_frac_of_credit` greps; matrix tests |
| **SR5-G** | **Delta** | PR5 |

### SR6 — Dry-run evaluator + typed decisions

| Seed | Agent | Intent |
|------|-------|--------|
| SR6-1 | India + Alpha | Decision catalog v1 (no indicators); graph limits L5 |
| SR6-2 | Alpha | Dry-run tick: evaluate + log `action_suppressed` |
| SR6-3 | Charlie | Dry-run control + log display |
| SR6-4 | Kilo | Dry-run never hits broker adapter |
| **SR6-G** | **Delta** | PR6 |

### SR7 — User-local worker (M2)

| Seed | Agent | Intent |
|------|-------|--------|
| SR7-1 | Alpha + Lima | CLI/reference worker consuming Deployment Pack; hash check |
| SR7-2 | Lima | Operator docs: run on user VPS; contingency flatten |
| SR7-3 | Kilo | Pack load + integrity fail-loud tests |
| **SR7-G** | **Delta** | PR7 |

### SR8 — Live path (LEGAL-LIVE required)

| Seed | Agent | Intent |
|------|-------|--------|
| SR8-0 | Coach | Confirm **LEGAL-LIVE=GO** and **LEGAL-COPY=GO** or **BLOCK** phase |
| SR8-1 | Alpha | Live submit path; same O-*; G-2 gate server-side |
| SR8-2 | Alpha + Charlie | Freeze/drift; rebind with expected_head; status strip |
| SR8-3 | Charlie + Tango | §4.1.1 banners; live promote confirm |
| SR8-4 | Hotel | Live claim review — process language only |
| SR8-5 | Kilo | Live blocked without G-2/attestation/LEGAL flag; paper still works |
| **SR8-G** | **Delta** | PR8 |

### SR9 — Journal / Retro / Habit hooks (optional)

| Seed | Agent | Intent |
|------|-------|--------|
| SR9-1 | India | Event contract: process events only (no P&L theater) |
| SR9-2 | Alpha | Emit hooks / optional write to practice surfaces |
| SR9-3 | Charlie | Minimal “log to journal” if product wants |
| **SR9-G** | **Delta** | PR9 or **SKIP** with Coach |

### SR10 — Optional M3 (Coach GO only)

| Seed | Agent | Intent |
|------|-------|--------|
| SR10-0 | Coach | Explicit M3 GO or cancel |
| SR10-1 | Alpha | Job table, lease, fairness Q-1…Q-7; no per-user WS |
| SR10-2 | Foxtrot | Worker process supervision if production |
| SR10-3 | Charlie | Admin console thin→full (§20) |
| SR10-4 | Mike | Admin Family B ops-metadata only |
| SR10-5 | Kilo | Multi-tenant isolation under load smoke |
| **SR10-G** | **Delta** | PR10 |

### CLOSE — Program

| Seed | Agent | Intent |
|------|-------|--------|
| CLOSE-1 | Lima | As-built Spec notes + DL entry |
| CLOSE-2 | India | Boundary honesty: M0–M2 vs M3 residual |
| **CLOSE-G** | **Delta** | Program complete vs vertical slice DoD |

---

## 5. Gate checklist

| Gate | Agent | Status |
|------|-------|--------|
| SR0-0 Coach program GO | Coach | pending |
| SR0-1…SR0-5 reviews | India/Mike/Tango/Hotel/Echo | pending |
| **SR0-G** | Delta | pending |
| SR1-G … SR7-G | Delta | pending |
| SR8-0 LEGAL-LIVE | Coach | pending (external) |
| SR8-G | Delta | pending |
| SR9-G | Delta | optional |
| SR10-0 M3 GO | Coach | pending / skip |
| SR10-G | Delta | optional |
| **CLOSE-G** | Delta | pending |

---

## 6. Parallelism rules

| Parallel OK | Rule |
|-------------|------|
| PR3 ‖ PR6 after PR1 | Export and dry-run independent |
| PR2 ‖ PR3 after PR1 | Arming and export independent |
| PR4 after PR1 | Does not need PR2 for **paper** (live does) |
| PR5 after PR4 only | Exits need open path |
| PR7 after PR3 only | Worker needs pack |
| PR8 after PR4+PR5 + LEGAL-LIVE + PR2 | Live needs paper path maturity + arming + legal |
| PR10 never parallel as “default” | Separate Coach GO |

---

## 7. Seed template (minimum fields)

Every seed under `agents/p-strategy-runtime/seeds/` must include:

```markdown
# SR?-? — <title>
**Agent:** <callsign>
**Phase:** SR?
**Spec refs:** §…
**Files in scope:** (exact)
**Out of scope:** …
**Invariants:** (cite §2 list numbers)
**LEGAL:** N/A | requires LEGAL-LIVE | draft-copy only
**Completion criteria:** (verifiable)
**Evidence to capture:** curl / test names / screenshots
**Gate:** SR?-G
```

---

## 8. Verification standards (Kilo / Delta)

| Area | Evidence |
|------|----------|
| Isolation | Two identities; A cannot read B’s instances/logs |
| Envelope | Open blocked when concurrent/allocation exceeded; log event |
| Dry-run | Broker adapter call count = 0 |
| O-dedupe | Simulated timeout retry → single broker order |
| G-2 | Live promote 422 without BT/FW/deployed |
| ExitPolicy | Schema reject `*_frac_of_credit` |
| Banners | UI test or manual script for pause/archive copy |
| Export | `integrity_hash` mismatch fails load |
| Place | Deploy empty-on-unknown after clear memory |

---

## 9. Coordination law

1. Spec first — Process Runtime v1.1.1 + Scope.  
2. Juliet owns seeds and board; Coach runs sessions.  
3. No agent-to-agent side channel.  
4. Delta never waived.  
5. LEGAL-* only Coach updates in ORCHESTRATOR status.  
6. Lima logs DL on phase architecture decisions same day.  
7. Prefer mock/sandbox Tradier for CI; live paper account for Coach smoke only.

---

## 10. Status board (initial)

| Track | Status |
|-------|--------|
| Spec v1.1.1 | **LOCKED for product** (legal external) |
| Scope v1.0 | **OPEN** for Coach ACK |
| Bench plan v1.0 | **OPEN** for Coach ACK |
| LEGAL-TRACK | **External — unknown** |
| LEGAL-LIVE | **NOGO** until Coach says GO |
| LEGAL-COPY | **NOGO** until Coach says GO |
| Implementation | **BLOCKED** on SR0-G |
| M3 | **OFF** |

---

## 11. Document history

| Date | Note |
|------|------|
| 2026-08-05 | v1.0 — Full agent bench plan for Process Runtime; SR0–SR10; LEGAL external flags; vertical slice |
