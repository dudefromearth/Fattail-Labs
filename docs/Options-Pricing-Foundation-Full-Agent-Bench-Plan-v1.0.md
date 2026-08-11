# Options Pricing Foundation — Full Agent Bench Plan v1.0

**Date:** 2026-08-11  
**Plan revision:** **v1.0**  
**Owner (orchestration):** Juliet  
**Authority:** Coach (GO / ship)  
**Board:** [`agents/p-options-pricing-foundation/`](../agents/p-options-pricing-foundation/)  
**Governance:** [`agents/bench/doctrine.md`](../agents/bench/doctrine.md)  

**Primary law:**

| Doc | Path |
|-----|------|
| **OPF Spec v0.2.1** | [`Specs/FatTail-Labs-Options-Pricing-Foundation-Spec-v0_2.md`](../Specs/FatTail-Labs-Options-Pricing-Foundation-Spec-v0_2.md) |
| **Arch 30** | [`Architecture/30-options-pricing-foundation.md`](../Architecture/30-options-pricing-foundation.md) |
| **DL-289** | [`Architecture/00-decision-log.md`](../Architecture/00-decision-log.md) |

**Parents (do not re-litigate product UI):**

| Doc | Path | Role |
|-----|------|------|
| Market Bus Spec (content **v1.0.1**) | [`Specs/FatTail-Labs-Massive-Market-Bus-Shared-Client-Spec-v1.0.md`](../Specs/FatTail-Labs-Massive-Market-Bus-Shared-Client-Spec-v1.0.md) | Redis hot · WS · feeds · one socket/tab |
| Market Bus bench plan | [`docs/Massive-Market-Bus-Full-Agent-Bench-Plan-v1.0.md`](./Massive-Market-Bus-Full-Agent-Bench-Plan-v1.0.md) | Transport as-built residual |
| Chain Picker Spec **v1.0.2** | [`Specs/FatTail-Labs-Options-Chain-Picker-Spec-v1.0.2.md`](../Specs/FatTail-Labs-Options-Chain-Picker-Spec-v1.0.2.md) | Universe · **OC2 · OC5a · OC6a** |
| Heatmap Templates Spec **v0_2** | [`Specs/FatTail-Labs-Options-Lab-Heatmap-Templates-Spec-v0_2.md`](../Specs/FatTail-Labs-Options-Lab-Heatmap-Templates-Spec-v0_2.md) | **HM18 · HM19** heritage |
| Human Interface Spec v1.0 | [`Specs/FatTail-Labs-Human-Interface-Spec-v1.0.md`](../Specs/FatTail-Labs-Human-Interface-Spec-v1.0.md) | Only if any member-facing resolve error chrome ships |

Specialists execute **only** via seeds. Coordination only through **Coach** or **Juliet**.  
Delta gates: **PASS / FAIL / BLOCKED** with evidence — **never waived**.  
**Coach may overrule** a specialist finding on the record via **DL entry with reasoning** — that is **not** a gate waive.

**Scope honesty:** This program ships **foundation L0–L4 only** (transport hygiene, multi-exp store, pricing plane, model packs, headless resolve API). It does **not** wire Heatmap, Analyzer, GEX, or bots (L5). It does **not** re-open Market Bus Redis posture as a product fight — it **extends** dual keys, multi-interest, and budgets. **MSC is not the standard.**

**Human interface:** No member surface required for foundation exit. Any incidental API/error chrome complies with HIG if present.

---

## 0. Product / architecture law (in scope)

| Spec cluster | Ship meaning |
|--------------|----------------|
| **OPF1–OPF33** | Global laws: dual-side · multi-exp · natural debit · lock · labels · fail loud · r continuous · τ · surface · budgets · cold archive · OC5a |
| **L0** | Snapshot + feeds + Redis hot + WS; MarketStaticFacts; dual-key feed |
| **L1** | Multi-exp ContractStore · InterestManager · interest cap · epoch skew · OPF assembly budget ≠ Heatmap one-page |
| **L2** | LegPricer · PackagePricer · Lock (+ freeze_iv/marks) · StrategyIntent |
| **L3** | Pack registry · day_trade / outlook / backtest defaults+alts · named engines · surface geometry · **AT-L3-RECON** |
| **L4** | Headless `resolve` / interest / lock API |
| **Archive** | Cold day-shard + max-stale gaps (not Redis months) |

**Design invariant:** *One dual-side multi-exp fact store; package marks and per-leg IV from a shared pricing plane; model packs declare use case; tools never invent private Massive/IV paths; headless proof before any app wiring.*

---

## 1. Mission

Ship the **Options Pricing Foundation**:

```text
Massive options SNAPSHOT (per exp · dual-side · complete-or-loud)
  → chain_feed / single-flight → Redis hot mb:ladder:…:dual
  → WS push full|diff|unchanged (+ sym/session)
  → L1 multi-exp ContractStore + InterestManager (+ budget)
  → L2 LegMark / PackageQuote / Lock / τ / r,q
  → L3 pack registry → engines → curves + marks
  → L4 resolve API (headless)
  → [L5 apps later — out of this program]
```

| Pillar | Spec | Ship meaning |
|--------|------|----------------|
| Dual generation key | OPF4 | No side in key; feed/interest aligned |
| Multi-exp first-class | OPF5 · L1 | N interests; epoch `max_skew_ms` |
| Complete assembly | OPF25 · HM18 | Paginate OK; never silent partial leg book |
| Package natural | OPF6–7 | \(\sum q_i m_i\); incomplete loud |
| Per-leg IV cascade | OPF8 · OPF26 | exact…vix; OC5a on VIX tier |
| Lock / limit | OPF9–10 · §5.7 | Basis freeze; freeze_iv/marks rules |
| τ / r / engines | OPF21–22 · OPF29 | Continuous r; 1-min τ floor; AM/PM settlement; CRR/BSM |
| Packs | OPF12–15 | day_trade · outlook · backtest default+alt |
| t=0 recon | AT-L3-RECON | Model matches mark at spot within tol |
| Headless exit | §12 Spec | No L5 required |

**First smoke after F1:**  
(1) Two expirations dual-side on bus.  
(2) Headless PackageQuote complete for a calendar fixture.  
(3) day_trade resolve → mark + model_t0 labels + RECON green on single-exp fly.

---

## 2. As-built honesty

### 2.1 Keep (landed outside this program)

| Area | Status |
|------|--------|
| Market Bus Redis + WS + MarketSocket | Landed (Arch 28) |
| Dual-side ladder domain + IV/greeks on rows | Landed (Heatmap program) |
| Dual cache key shape in chain_ladder routes | Landed partial |
| Heatmap / Analyzer / GEX **apps** | Landed **but out of wire scope** — may keep working on old paths until L5 program |
| OPF Spec v0.2.1 · Arch 30 · DL-289 | Landed DRAFT / design |

### 2.2 Build (this program)

| Gap | Spec / Arch | Phase |
|-----|-------------|--------|
| Spec GO · OD Accept/Override · board · seeds | Spec §11–13 · Arch §15 | **W0** |
| Dual-key feed/interest/stream hygiene | OPF4 · L0 · AT-L0 | **T** (Transport harden) |
| Multi-exp store · interest budget · epoch skew | L1 · OPF23 · OPF27 | **G** (Generation store) |
| MarketStaticFacts · τ law · AM/PM | OPF21 · OPF29 · §3.7 | **R** (Rates / τ / static facts) |
| LegPricer · PackagePricer · Lock | L2 · OPF6–10 · freeze rules | **P** (Pricing plane) |
| Pack registry + day_trade packs + RECON | L3 · AT-L3-RECON | **D** (Day-trade packs) |
| Surface geometry + outlook packs | §6.5 · calendar arb | **O** (Outlook packs) |
| Cold archive + backtest packs | OPF16 · OPF28 · OPF33 | **B** (Backtest / archive) |
| L4 resolve API + headless ATs | L4 · AT-L4 | **A** (API) |
| Full AT matrix green · deploy notes · as-built | Spec §12 | **K** + **Z** |

### 2.3 Gap map (AT → phase)

| AT cluster | Phase |
|------------|--------|
| Spec GO · OD-PF1–11 · seeds · parent cites | **W0** |
| Dual key · feed · AT-L0-1…5 | **T** |
| Multi-exp · budget · skew · strike keys · AT-L1 | **G** |
| r continuous · τ · VIX1D · AM/PM · AT-L0-τ* | **R** |
| Package/lock/IV · AT-L2 | **P** |
| day_trade packs · RECON · AT-L3-1…3,7,RECON | **D** |
| Surface + outlook · AT-L3-4,6 + calendar arb | **O** |
| Archive + backtest · AT-L3-5 · stale gap | **B** |
| resolve API · AT-L4 | **A** |
| Full AT-L0…L4 green | **K** |
| MiniTwo / as-built / program close | **Z** |

**Explicit non-phases (out of program):**

| ID | Out |
|----|-----|
| **NX1** | Heatmap UI wiring to OPF |
| **NX2** | Analyzer UI cutover to OPF resolve |
| **NX3** | GEX / bots consumers |
| **NX4** | Full OPRA option tick stream |
| **NX5** | 3D risk · dealer GEX · broker submit |

---

## 3. Locked decisions (program)

| ID | Decision |
|----|----------|
| **FP1** | Spec **v0.2.1** is product law on Coach GO (after W0-G). |
| **FP2** | **MSC is not the standard** — accuracy and OPF law bind. |
| **FP3** | Foundation-only: **no L5 app wiring** in this program. |
| **FP4** | Dual generation key `…:w{N}:dual`; feed/interest/stream aligned. |
| **FP5** | Multi-exp first-class; package sum across generations. |
| **FP6** | OPF assembly complete-or-loud (paginate OK); Heatmap one-page is **display** law only. |
| **FP7** | Continuous \(r\); τ Actual/365.25; **1-minute** floor; **AM/PM settlement** on product table. |
| **FP8** | American = **CRR** default; BAW only via OD. |
| **FP9** | Epoch `max_skew_ms`; day_trade marks fail-loud default at 3000 ms. |
| **FP10** | Surface: total-variance / log-moneyness; butterfly **and** calendar arb fail-fit. |
| **FP11** | Packs: day_trade / outlook / backtest each default + alternate (§ Spec 6.2). |
| **FP12** | Cold day-shard archive; Redis hot only; max-stale gaps on replay. |
| **FP13** | Interest budget; refuse/queue loud at cap. |
| **FP14** | Server L2–L4 SoR; dual-language only with golden-vector CI. |
| **FP15** | AT-L3-RECON required for day_trade default exit. |
| **FP16** | Delta ternary only; Coach overrule needs DL. |
| **FP17** | Documentation parity with ship; as-built Arch 30 flip at Z. |
| **FP18** | Does **not** re-open Market Bus Redis as product debate — extends it. |

### 3.1 Open points (GO — explicit Accept/Override)

| # | Question | Owner | Recommendation |
|---|----------|-------|----------------|
| **OD-PF1** | Primary exp | Hotel · India | Earliest leg exp |
| **OD-PF2** | Default expiration curve | Hotel · Echo | Front-exp residual |
| **OD-PF3** | Sticky rule day-trade | Hotel | Sticky delta index 0–2 DTE |
| **OD-PF4** | Package bid/ask | Hotel | After mid natural |
| **OD-PF5** | Archive retention + max-stale | Foxtrot · Alpha | Config days + e.g. 15m intraday stale |
| **OD-PF6** | Client engine mirror | India · Alpha | Prefer server-only v1 |
| **OD-PF7** | American engine | Hotel | CRR |
| **OD-PF8** | Day-trade on skew | Hotel · Coach | Fail loud @ 3000 ms |
| **OD-PF9** | Rates bootstrap | Alpha | Config SOFR continuous |
| **OD-PF10** | Interest cap value | Alpha · Foxtrot | e.g. 32 concurrent keys/process class |
| **OD-PF11** | RECON tol | Hotel | $1 or 1% \|mark\| |

### 3.2 Seating

| ID | Rule |
|----|------|
| **S1** | **Kilo** owns AT-L0…L4 evidence at K-G (and phase AT subsets). |
| **S2** | **India** · dual-truth, content_hash, OPF vs Heatmap budget split, no MSC. |
| **S3** | **Alpha** · feeds, dual keys, multi-interest, Massive page integrity, interest budget. |
| **S4** | **Hotel** · natural debit, IV cascade, τ, r/q, engines, RECON, surface arb. |
| **S5** | **Charlie** · L4 client bindings / types only if foundation ships shared client helpers (no app UI). |
| **S6** | **Echo** · labels honesty (mark vs model vs scenario); no chrome product. |
| **S7** | **Tango** · member-facing error copy if any; no profit claims. |
| **S8** | **Mike** · auth on resolve; Redis localhost; caps. |
| **S9** | **Foxtrot** · launchd feed alignment; cold archive path; MiniTwo. |
| **S10** | **Juliet** · board · seeds · Bus/Heatmap coordination (no L5 scope creep). |
| **S11** | **Lima** · DL GO · content hash · as-built paths. |
| **S12** | **Delta** · all phase gates ternary. |
| **S13** | Seeds on disk before phase gate. |

---

## 4. Phase DAG

```text
W0 ──► T ──► G ──► R ──► P ──► D ──► O ──► B ──► A ──► K ──► Z
              │              │
              └──────────────┴── (R may start after G; P needs R+G)
```

| Phase | Name | Depends | Exit summary |
|-------|------|---------|--------------|
| **W0** | Board GO · OD Accept · seeds · cite integrity | — | Spec GO; OD-PF1–11 Accept/Override; board live |
| **T** | Transport harden (dual-key) | W0 | Feed+interest+API dual keys; AT-L0-1…4 |
| **G** | Multi-exp generation store | T | Interest N exps; budget; skew fields; AT-L1 |
| **R** | Rates · τ · static facts | T (parallel after T OK) | MarketStaticFacts; τ law ATs; continuous r |
| **P** | Pricing plane L2 | G + R | PackageQuote; lock; IV cascade; AT-L2 |
| **D** | Day-trade packs | P | mark_hybrid + surface alt; **AT-L3-RECON** |
| **O** | Outlook packs | D (surface builder may share D) | scenario_surface + dynamics gate |
| **B** | Archive + backtest packs | G (writers) + P | Cold shard; max-stale; chain_replay |
| **A** | L4 resolve API | D (min) · prefer O+B complete | Headless resolve; AT-L4 |
| **K** | Full AT green | A | All AT-L0…L4 + RECON |
| **Z** | Deploy notes · Arch as-built · close | K | MiniTwo if needed; DL close; **no L5** |

---

## 5. Phase detail (high level)

### W0 — GO board

- Juliet: CHARTER, seeds README, gate-reports, IMPLEMENTATION-PLAN pointer.  
- Lima: content hash of Spec v0.2.1; OD table recorded.  
- India: parent Spec paths (Picker, Bus, Heatmap) intact.  
- Delta: W0-G PASS → Coach W0-0 GO fire.

### T — Transport harden

- Align `chain_feed` topic parse with `…:w{N}:dual`.  
- Stream/API/interest same key.  
- Evidence: curl generation + Redis GET + WS full with dual rows + IV.

### G — Generation store

- Multi-exp ContractStore (server module).  
- InterestManager refcount + **global cap**.  
- Epoch builder: `max_skew_ms`, `epoch_quality`.  
- Canonical strike strings.  
- OPF complete-or-loud assembly (paginate if needed).

### R — Rates / τ

- MarketStaticFacts config (+ optional load path).  
- `τ(expiration, clock, settlement)` implementation + ATs τ1–τ4.  
- VIX1D selection for 0–1 DTE fallback path.

### P — Pricing plane

- LegPricer (cascade + OC5a).  
- PackagePricer (natural + skew meta).  
- LockController (basis + freeze_iv/marks).  
- StrategyIntent store (in-memory/server session OK for foundation).

### D — Day-trade packs

- Registry.  
- `day_trade.mark_hybrid`: mark_sum + bsm_european / crr_american + sticky.  
- `day_trade.surface`: surface_tv_logk + fit fail loud.  
- **AT-L3-RECON** green on fixture.

### O — Outlook packs

- scenario_surface: time roll + vol_*_pts scenarios.  
- dynamics: SABR + RMSE gate → fallback.  
- Labels must include `scenario`.

### B — Backtest / archive

- Cold day-shard writer on generation commit (optional path from feed).  
- `archive.get` + max-stale → labeled gap.  
- chain_replay + surface_reconstruct packs.

### A — Tool API

- `POST …/pricing/resolve` (or equivalent) + interest/lock endpoints as Spec.  
- Headless client test harness (pytest / script) — **not** Options Lab UI.

### K — Acceptance

- Full AT matrix from Spec §3–7, §6.9, §8.  
- Evidence pack in `agents/p-options-pricing-foundation/gate-reports/`.

### Z — Close

- Arch 30 status → AS-BUILT (foundation).  
- Deploy notes if new processes/config.  
- DL program close.  
- **Explicit non-claim:** apps not wired.

---

## 6. Seeds (naming)

Juliet materializes seeds from this plan §5.

```text
agents/p-options-pricing-foundation/seeds/
  W0-0-coach-go.md
  W0-1-lima-hash-od.md
  T1-0-alpha-dual-key-feed.md
  G1-0-alpha-multi-exp-interest.md
  R1-0-hotel-tau-rates.md
  P1-0-hotel-package-lock.md
  D1-0-hotel-day-trade-recon.md
  O1-0-hotel-surface-calendar-arb.md
  B1-0-foxtrot-cold-archive.md
  A1-0-alpha-resolve-api.md
  K1-0-kilo-at-matrix.md
  Z1-0-lima-as-built.md
```

Naming: `{PHASE}{n}-{agent}-{slug}.md`.  
Do not start implementation seeds before **W0-G** + **Coach W0-0**.

---

## 7. Definition of Done (program)

| # | Criterion |
|---|-----------|
| D1 | Spec v0.2.1 GO + OD-PF1–11 Accept/Override on DL |
| D2 | All phases T…A Delta PASS (or Coach overrule DL) |
| D3 | AT-L0…L4 + **AT-L3-RECON** + τ ATs green with evidence |
| D4 | Headless resolve day_trade without mounting Options Lab routes |
| D5 | Multi-exp calendar PackageQuote complete on fixture |
| D6 | Lock freezes basis; unlock restores natural |
| D7 | Surface/calendar-arb fail-fit proven |
| D8 | Backtest default fails without archive; passes with cold fixture |
| D9 | Interest at cap refuses loud |
| D10 | Arch 30 as-built + DL close; **no claim of app wiring** |
| D11 | No MSC imports; no second Massive client |

---

## 8. Risks

| Risk | Mitigation |
|------|------------|
| Scope creep into Analyzer/Heatmap | **FP3** · NX1–3 · Juliet blocks |
| chain_feed dual-key drift | Phase T first; AT-L0-3 |
| RECON fails on vendor IV vs Labs r | Document tol; tune r/q; fail loud not silent fudge |
| Massive rate blow-up multi-exp | Interest budget OPF27 |
| Dual Python/TS engines | Prefer server-only (OD-PF6) |
| Archive never written | B phase; fail-loud backtest |

---

## 9. Coordination with sibling boards

| Board | Rule |
|-------|------|
| `p-market-bus` | Transport residual only; OPF extends dual/multi-interest — cite MB Spec |
| `p-options-lab-heatmap` | Display/templates; **must not** redefine package pricing once OPF lands; L5 wires later |
| Future Analyzer L5 board | Consumes L4 only after Z |

---

## 10. Coach GO checklist (W0-0)

- [ ] Spec v0.2.1 content hash recorded  
- [ ] OD-PF1–11 Accept or Override (DL)  
- [ ] Board + seeds skeleton present  
- [ ] Scope: L0–L4 only (no L5) explicit  
- [ ] Parent Specs cited (Bus, Picker, Heatmap)  
- [ ] Delta W0-G PASS  
- [ ] Fire T then G/R per DAG  

---

## 11. Document map

| Doc | Role |
|-----|------|
| This plan | Execution DAG · seating · DoD |
| OPF Spec v0_2 | Normative law |
| Arch 30 | Topology · phases F0–F6 map to T…Z |
| Board `p-options-pricing-foundation` | Seeds · gates · charter |

---

**End of plan v1.0.** Implement only after Coach W0-0 GO.
