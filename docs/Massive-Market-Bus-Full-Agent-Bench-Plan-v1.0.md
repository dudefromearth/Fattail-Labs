# Massive Market Bus & Shared Client — Full Agent Bench Plan v1.0

**Date:** 2026-08-10  
**Plan revision:** **v1.0.1**  
**Owner (orchestration):** Juliet  
**Authority:** Coach (GO / ship) — Spec **v1.0.1 DRAFT** after architecture review fold; **GO blocked** until §18 specialist gates PASS  
**Board:** [`agents/p-market-bus/`](../agents/p-market-bus/)  
**Governance:** [`agents/bench/doctrine.md`](../agents/bench/doctrine.md)  
**Spec:** [`Specs/FatTail-Labs-Massive-Market-Bus-Shared-Client-Spec-v1.0.md`](../Specs/FatTail-Labs-Massive-Market-Bus-Shared-Client-Spec-v1.0.md) (**v1.0.1**)

Specialists execute **only** via seeds. Coordination only through **Coach** or **Juliet**.  
Delta gates: **PASS / FAIL / BLOCKED** with evidence — **never waived**.  
**Coach may overrule a specific specialist finding** on the record via a **DL entry with reasoning** (arbiter authority). That is **not** a gate waive: the review still happened; the finding was overridden visibly. A waived gate (review skipped) is a **doctrine violation**; Delta has standing to refuse.

**Scope honesty:** This program ships **transport + generation store + shared client**, not a live member header product and not OD-nav catalog naming. Header remains a **possible consumer** until a separate surface Spec (Tango · Echo · Coach).

**Human interface:** Any member-facing UI this program adds (MarketClient errors, chain ladder adapter chrome, future consumers) complies with  
[`Specs/FatTail-Labs-Human-Interface-Spec-v1.0.md`](../Specs/FatTail-Labs-Human-Interface-Spec-v1.0.md). Echo owns HIG; Charlie implements kit only. **No header chrome in scope** without surface Spec.

---

## 0. Product / architecture law (in scope)

| Spec / doc | Path | Role |
|------------|------|------|
| **Market Bus Spec v1.0.1** | [`Specs/FatTail-Labs-Massive-Market-Bus-Shared-Client-Spec-v1.0.md`](../Specs/FatTail-Labs-Massive-Market-Bus-Shared-Client-Spec-v1.0.md) | **Primary law** — MB1–MB12 · Redis posture · OC15 stages · WS · AT-MB1–10 · phases P0–P6 |
| **Options Chain Picker Spec v1.0.2** | [`Specs/FatTail-Labs-Options-Chain-Picker-Spec-v1.0.2.md`](../Specs/FatTail-Labs-Options-Chain-Picker-Spec-v1.0.2.md) | Chain ladder surface · OC1–OC15 · **OC6a** · H1-2 vs MB-P1 · as-built routes |
| **Picker bench plan** | [`docs/Options-Chain-Picker-Full-Agent-Bench-Plan-v1.0.md`](./Options-Chain-Picker-Full-Agent-Bench-Plan-v1.0.md) | **H1-2** minimal OC15 — successor link required |
| Architecture/18 | [`Architecture/18-shared-live-marks-stream.md`](../Architecture/18-shared-live-marks-stream.md) | Proxy · marks · poller · VIX1D |
| Claude.md / deploy | MiniTwo · launchd · no MSC · config fail-loud | Ops doctrine |

**Related boards (do not re-litigate product UI):**

| Board | Use |
|-------|-----|
| [`p-options-chain-picker`](../agents/p-options-chain-picker/) | Chain ladder surface; H1-2 OC15 minimal; **cite MB §1.2** |
| [`p-hig`](../agents/p-hig/) | Kit only if UI adapter ships |
| Arch/18 live_stream as-built | Marks path until O2 exit |

**Queued out of this program:**

- Live **main header** UI (needs surface Spec)  
- Catalog name ratification for “Options Lab” (OD-nav on picker plan)  
- Multi-chart board product UI beyond optional P6 adapter hooks  
- Full OPRA options WebSocket as default chain input  
- MSC / second universe  
- Silent dual-write forever (O2 exit required)

---

## 1. Mission

Ship the **Market Bus**:

```text
Massive → feed(s) → Redis → labs-api → one WS / tab → shared MarketClient → apps
```

| Pillar | Spec | Ship meaning |
|--------|------|----------------|
| **Sole upstream** | MB1 | Only feeds call Massive for live bus topics |
| **Shared store** | MB2 · §1.1 | Redis multi-worker; posture reversal in DL at GO |
| **One WS** | MB3 | Never per-widget / per-chart sockets |
| **Shared client** | MB4 | One web module; chain ladder is a consumer |
| **Interest** | MB5 | Eager ∪ demand; no ambient OPRA |
| **Universe** | MB6 | Enabled Admin symbols only |
| **Snapshot→delta** | MB7 | Sub/reconnect snapshot first |
| **Proxy honesty** | MB8 · OC2 | Labeled proxy; no proxy-centered index chains |
| **Auth** | MB9 | Session + tool-member; Redis localhost |
| **Fail loud** | MB10 · MB12 | Feed/Redis/config dead → explicit err |
| **No MSC** | MB11 | No MSC Redis schemas |
| **OC15 scale** | §1.2 · MB-P1 | Redis successor to H1-2 minimal |

**Design invariant:** *Headcount multiplies sockets and fan-out; Massive multiplies only with hot topics. Browsers never see Redis or Massive.*

**First smoke after build (Coach / Delta):**  
(1) **Single client** — sub chain topic; snapshot + updates.  
(2) **N clients** same chain — Massive rate **O(generation/TTL)**, not O(N).

---

## 2. As-built honesty

### 2.1 Keep (landed outside this program)

| Area | Status |
|------|--------|
| Chain ladder domain + poll API + listed wings | Landed (picker program) |
| In-process TTL / generation key (partial OC15) | Landed partial — **H1-2 minimal** if not closed |
| Arch/18 `live_stream` → MySQL marks | Landed — dual-write exit O2 later |
| Massive REST client | Landed |

### 2.2 Build (this program)

| Gap | Spec | Action |
|-----|------|--------|
| Specialist gates + Coach GO | §18 · O1–O6 | **W0** / **G*** |
| Redis + chain generations multi-worker | MB-P1 · AT-MB1 | **R*** |
| Chain feed process; request path Massive=0 | MB-P2 | **F*** |
| Sym + session topics; WS entitlement probe | MB-P3 | **S*** |
| WS gateway + MarketClient | MB-P4 · AT-MB2/7/8/10 | **T*** |
| Chain ladder on shared client | MB-P5 · AT-MB5 | **C*** |
| Optional chart follow hooks | MB-P6 | **X*** (optional) |
| Deploy + DL posture + program close | Z | **Z*** |

### 2.3 Gap map (acceptance → phase)

| Spec cluster | Phase |
|--------------|--------|
| Spec gates · O1–O6 explicit · DL posture · board seeds · H1-2 ordering | **W0** |
| Redis store · single-flight · ladder prefers store · AT-MB1 | **R** (Redis / MB-P1) |
| Chain feed daemon · launchd · Massive only in feed | **F** (Feed / MB-P2) |
| Symbol + market_status · entitlement probe | **S** (Sym / MB-P3) |
| WebSocket stream · shared client · MB7/MB9 | **T** (Transport / MB-P4) |
| Chain ladder consumer cutover · poll degraded | **C** (Consumer / MB-P5) |
| Optional multi-widget / bar follow | **X** (eXtension / MB-P6) |
| Kilo AT-MB pack + multi-client scale smoke | **K** |
| Deploy MiniTwo · as-built · close | **Z** |

---

## 3. Locked decisions (program)

| ID | Decision |
|----|----------|
| **MP1** | Spec v1.0.1 is architecture law on Coach GO (after §18 PASS). |
| **MP2** | Redis is normative multi-worker store — **posture reversal** named in DL at GO (§1.1). |
| **MP3** | H1-2 = OC15 **minimal** (in-process); MB-P1 = OC15 **production** (Redis) — **one evidence trail** (§1.2). |
| **MP4** | WebSocket is member transport law; **one socket per tab**. |
| **MP5** | Header UI is **out of scope** until surface Spec; topics may still exist. |
| **MP6** | Surface catalog name not settled here — use “chain ladder surface”; OD-nav on picker plan. |
| **MP7** | O1–O6 require **Accept** or **Override** at GO — no silent defaults. |
| **MP8** | O2 dual-write has **named exit** (20 green sessions or 14d + DL remove). |
| **MP9** | MB-P3 requires Massive **WS entitlement probe** transcript. |
| **MP10** | No MSC; Redis localhost; fail-loud. |
| **MP11** | P1–P2 before multi-member marketing of live boards. |
| **MP12** | First scale smoke: 1 client then N clients same chain topic. |

### 3.1 Open points (GO — explicit per row)

| # | Question | Owner | Recommendation (not automatic) |
|---|----------|-------|--------------------------------|
| **O1** | Single feed unit vs split sym/chain | Foxtrot · Alpha | Split OK; one writer/class |
| **O2** | Dual-write marks | India · Alpha | Temp yes + exit § Spec |
| **O3** | Eager symbols without demand | Coach | Empty until surface Spec |
| **O4** | Unsub grace | Alpha | 30–60s |
| **O5** | Soft stale thresholds | Hotel · Alpha | 3s chain · 5s sym · 120s status |
| **O6** | OD-nav product name | Coach · Echo | Picker OD-nav; bus follows |

### 3.2 Seating

| ID | Rule |
|----|------|
| **S1** | Kilo on every testable seed; AT-MB1–10 ownership at K-G. |
| **S2** | India: Redis keys · dual-truth ban · O2 exit. |
| **S3** | Mike: WS auth · Redis exposure · caps. |
| **S4** | Foxtrot: Redis + feed launchd · MiniTwo. |
| **S5** | Alpha: feed/API · single-flight · protocol. |
| **S6** | Hotel: MB8 / OC2 survival · O5 thresholds. |
| **S7** | Echo: shared client HIG touchpoints; **no header product**. |
| **S8** | Tango: doctrine note if header later; bus orientation-capable. **Advisory only while no member chrome ships**; full guardian standing if Phase X or any later UI becomes member-visible. |
| **S9** | Juliet: H1-2 ↔ MB-P1 order; board; seeds. |
| **S10** | Lima: DL posture reversal at GO; hash. |
| **S11** | Delta: ternary gates; multi-client scale smoke. |
| **S12** | Charlie: MarketClient + ladder adapter UI only when C* ships. |
| **S13** | Seeds on disk before phase gate. |

---

## 4. Roster

| Callsign | Role |
|----------|------|
| **Coach** | GO, O1–O6 Accept/Override, ship/no-ship, posture DL |
| **Juliet** | Board, seeds, H1-2/MB-P1 ordering, sequence |
| **India** | Redis schema · O2 dual-write exit · generation identity |
| **Alpha** | Feeds · API · single-flight · protocol · phases R/F/S/T |
| **Charlie** | MarketClient · ladder adapter (C*) · kit only |
| **Echo** | HIG for client errors/loading; no silent header product |
| **Hotel** | Proxy/MB8 · stale thresholds O5 |
| **Tango** | Copy for err/stale; doctrine note on live chrome (advisory) |
| **Mike** | WS auth · Redis bind · sub caps · AT-MB7 |
| **Kilo** | AT-MB1–10 evidence packs |
| **Delta** | All phase gates ternary |
| **Lima** | DL: GO · Redis reversal · O2 exit when due · hash |
| **Foxtrot** | Redis install · launchd · MiniTwo deploy · one-writer |

**Not seated for product UI:** Marketing · full multi-chart product program · header surface Spec (spawn later if Coach opens).

---

## 5. Sacred invariants (this program)

1. Standalone repo — **no MSC**.  
2. Config fail-loud (MB12).  
3. **Feed owns Massive** (MB1) — no steady-state Massive on member request path after F-G.  
4. **Redis shared** for multi-worker (MB2); process-local is not production scale.  
5. **One WS per tab** (MB3).  
6. **Shared client module** (MB4).  
7. **Interest ≠ ambient OPRA** (MB5).  
8. **Universe SoR** (MB6).  
9. **Snapshot then delta** (MB7).  
10. **Proxy honesty** (MB8 · OC2).  
11. Redis **not public** (MB9).  
12. **Fail loud** (MB10).  
13. **H1-2 / MB-P1 one evidence trail** (§1.2).  
14. **No header product** without surface Spec (§0.1).  
15. **No silent GO** on O1–O6.  
16. Evidence over assertion; Delta never waives AT-MB* (ternary only).  
17. Coach **overrule** of a specialist finding requires a **DL entry** — not a silent or “waived” gate.  
18. Documentation parity with ship.

---

## 6. Phases, seeds, gates

### Phase W0 — Spec specialist gates + Coach GO + board lock

| Seed | Agent | Intent |
|------|-------|--------|
| **W0-0** | Coach | **Blocked until W0-G**; final GO on Spec v1.0.1 + this plan; O1–O6 Accept/Override; content hash |
| **W0-1** | India | MB-G-India: Redis key map; dual-write O2 exit criteria; generation identity; no dual-truth |
| **W0-2** | Mike | MB-G-Mike: WS auth design; Redis localhost; sub caps; session cookie upgrade |
| **W0-3** | Foxtrot | MB-G-Foxtrot: Redis unit; feed unit(s); one-writer; MiniTwo bind; fail-loud ops |
| **W0-4** | Alpha | MB-G-Alpha: API/feed contracts; single-flight; phase cut feasibility |
| **W0-5** | Echo | MB-G-Echo: client HIG touchpoints; confirm **no header product** in scope; OD-nav deference |
| **W0-6** | Tango | MB-G-Tango: doctrine note — bus OK for orientation topics; header surface deferred |
| **W0-7** | Hotel | MB-G-Hotel: MB8/OC2 on bus; recommend O5 thresholds |
| **W0-8** | Delta | MB-G-Delta: AT matrix ownership; multi-client smoke plan; H1-2 evidence uniqueness checklist |
| **W0-9** | Juliet | MB-G-Juliet: H1-2 vs MB-P1 order written; picker board note; materialize seeds |
| **W0-10** | Lima | MB-G-Lima: DL draft for GO (posture reversal text); hash procedure |
| **W0-11** | Juliet | Materialize board `agents/p-market-bus/` + cold seeds |
| **W0-12** | Juliet · Lima | **Picker Spec v1.0.2 artifact:** file `Specs/…-Spec-v1.0.2.md` with OC6a; stub/redirect old `v1.0.md` path; sweep stale links in bus plan, bus Spec, picker plan, agents; record **as-built routes** (`/app/options-lab` + legacy redirect) and **OD-nav** resolution note (name still Coach/Echo if open) |
| **W0-G** | Delta | All MB-G-* **PASS** or **FAIL** (ternary). If Coach **overrules** a specialist finding, a **DL entry with reasoning** must exist before W0-0 — that is not a waive. O1–O6 table ready; seeds on disk; **W0-12** Picker v1.0.2 + route note on file |

**W0-0 runs after W0-G** (or Coach sits W0-0 as final stamp immediately post W0-G).

### Phase R — Redis + chain generations (MB-P1) — OC15 production

| Seed | Agent | Intent |
|------|-------|--------|
| **R1-0** | Foxtrot · India | Redis config fail-loud; localhost; health check |
| **R1-1** | India · Alpha | Key schema `mb:chain:*` · write/read generation JSON + hash |
| **R1-2** | Alpha · Kilo | Single-flight per chain key; instrument Massive call counter |
| **R1-3** | Alpha | Ladder **read path** prefers Redis generation when fresh; miss path single-flight fill (transition) |
| **R1-4** | Juliet · Delta | Cite picker H1-2: successor link in gate report; no double OC15 PASS |
| **R1-G** | Delta · Kilo · India | **AT-MB1** green; multi-worker proof; H1-2 successor cited |

### Phase F — Chain feed process (MB-P2)

| Seed | Agent | Intent |
|------|-------|--------|
| **F1-0** | Alpha · Foxtrot | `labs-chain-feed` process: hot set, Massive snapshot, write Redis, publish |
| **F1-1** | Alpha | Interest registry (or demand from API) drives hot set + grace O4 |
| **F1-2** | Alpha · Kilo | Request path **no Massive** for hot chains (assert counter) |
| **F1-3** | Foxtrot | launchd unit; one writer; restart behavior |
| **F1-G** | Delta · Foxtrot · Kilo | MB-P2 exit; AT-MB1 still green under feed ownership |

### Phase S — Symbol + session feed (MB-P3)

| Seed | Agent | Intent |
|------|-------|--------|
| **S1-0** | Alpha · Kilo | **Massive WS entitlement probe** — transcript filed (curl/connect) |
| **S1-1** | Alpha | Sym feed: REST and/or WS per probe; Arch/18 proxy labels |
| **S1-2** | Alpha | `session:market_status` slow poll + publish-on-change |
| **S1-3** | India · Alpha | O2 dual-write marks **if Accept** — instrument dual path; document exit clock |
| **S1-G** | Delta · Hotel · Kilo | Topics readable; **AT-MB4**; **AT-MB9** proxy path; probe evidence on file |

### Phase T — WebSocket + shared client (MB-P4)

| Seed | Agent | Intent |
|------|-------|--------|
| **T1-0** | Alpha · Mike | `WS /api/me/market/stream` auth + hello/ping |
| **T1-1** | Alpha | sub/unsub · snapshot then updates · caps |
| **T1-2** | Charlie · Alpha | `web/lib/market` MarketClient + provider; **one** socket |
| **T1-3** | Charlie · Echo | Reconnect + resub; error/stale UI kit states |
| **T1-4** | Mike · Kilo | **AT-MB7** unauth reject; **AT-MB10** bad symbol; **AT-MB8** reconnect snapshot |
| **T1-G** | Delta · Mike · Kilo · Echo | MB3/MB4/MB7/MB9; one-socket proof |

### Phase C — Chain ladder consumer cutover (MB-P5)

| Seed | Agent | Intent |
|------|-------|--------|
| **C1-0** | Charlie · Alpha | Ladder page uses shared client for chain topic; poll degraded only |
| **C1-1** | Charlie · Kilo | **AT-MB5** OC6a cent-exact strikes e2e |
| **C1-2** | Alpha · Kilo | **First scale smoke:** 1 client then N concurrent same chain — Massive O(gen) not O(N) |
| **C1-3** | Tango | Copy: reconnecting · stale · feed down |
| **C1-G** | Delta · Kilo | Happy path WS; poll fallback fail-loud; multi-client smoke PASS |

### Phase X — Optional extension (MB-P6)

| Seed | Agent | Intent |
|------|-------|--------|
| **X1-0** | Alpha | Optional `bar:*` or multi-`sym` follow hooks for future chart board |
| **X1-1** | Charlie | Dev-only multi-widget demo proving **AT-MB2** (ladder + 2 fake charts one WS) if not covered in T |
| **X1-G** | Delta | **Ternary only** (PASS / FAIL / BLOCKED). Phase X is **optional by scope**: Coach may **descope X** on the board/DL so **X1-G never convenes**. If X executes, Delta gates it like every other phase — no **SKIP** verdict. |

### Phase K — Full AT pack (can interleave after T/C)

| Seed | Agent | Intent |
|------|-------|--------|
| **K1-0** | Kilo | AT-MB1 … AT-MB10 matrix executed; evidence paths listed |
| **K1-1** | Kilo · Delta | Scale: 1 → 10 → 50 clients same chain (or max safe in env); Massive rate table |
| **K1-G** | Delta · Kilo | All required ATs PASS; scale table in gate report |

### Phase Z — Deploy + close

| Seed | Agent | Intent |
|------|-------|--------|
| **Z1-0** | Foxtrot | MiniTwo: Redis + feed(s) + API; fail-loud if Redis down |
| **Z1-1** | Lima | DL: GO stamp · Redis posture reversal final · as-built paths · O2 exit tracker |
| **Z1-2** | Juliet | Picker board H1-2 successor note closed; no double OC15 |
| **Z1-G** | Delta · Coach | Program close; P1–P2 before marketing live boards affirmed |

---

## 7. Acceptance matrix (Spec §14 → phase)

| AT | Primary phase | Gate |
|----|---------------|------|
| AT-MB1 | R · F | R1-G · F1-G |
| AT-MB2 | T · X | T1-G · X1-G |
| AT-MB3 | F · T | F1-G / T1-G |
| AT-MB4 | S | S1-G |
| AT-MB5 | C | C1-G |
| AT-MB6 | F · T · Z | K1-G |
| AT-MB7 | T | T1-G |
| AT-MB8 | T | T1-G |
| AT-MB9 | S · C | S1-G · K1-G |
| AT-MB10 | T | T1-G |
| Scale smoke 1→N | C · K | C1-G · K1-G |

---

## 8. Cross-program coordination (Juliet)

| Program | Touch | Rule |
|---------|-------|------|
| **p-options-chain-picker** | H1-2 · H1-G · OC15 | Minimal in-process only; **MB-P1 is successor**; H1-G cites Market Bus §1.2 |
| **Arch/18 live_stream** | Marks | Dual-write only if O2 Accept; exit tracked |
| **Future header Spec** | Out of board | May open **p-market-header** later; not this program’s Z requirement |

**Forbidden:** Delta PASSes “OC15 complete” on both boards without successor language.

---

## 9. Risk register

| Risk | Mitigation |
|------|------------|
| Redis becomes permanent dual-truth with MySQL marks | O2 exit · India gate · dedicated DL |
| Header product sneaks in via eager set | §0.1 · Echo W0-5 · empty O3 default |
| Double OC15 theater with picker H1-2 | §1.2 · R1-4 · Z1-2 |
| Multi-worker still hits Massive | AT-MB1 · F1-2 counter |
| WS entitlement assumed wrong | S1-0 probe before S1-1 design |
| Aged browsers / many sockets | MB3 · AT-MB2 |
| Ops burden on MiniTwo | Foxtrot W0-3 · Z1-0 launchd |

---

## 10. Definition of Done (program)

- [ ] Spec §18 specialist gates **PASS** (or each non-PASS finding **overruled by Coach in a DL entry** with reasoning — review still on file)  
- [ ] Coach GO + O1–O6 explicit + DL Redis posture reversal  
- [ ] MB-P1–P2 green (Redis + chain feed; request-path Massive=0 for hot chains)  
- [ ] MB-P3–P4 green (sym/session topics + one WS client)  
- [ ] MB-P5 green (chain ladder on shared client)  
- [ ] AT-MB1–10 PASS (or documented N/A for optional X only)  
- [ ] Scale smoke: 1 client + N clients same chain — Massive O(gen)  
- [ ] H1-2/MB-P1 single evidence trail closed  
- [ ] MiniTwo deploy + fail-loud Redis  
- [ ] No header UI shipped under this program  

---

## 11. Document control

| Ver | Date | Notes |
|-----|------|-------|
| **1.0** | 2026-08-10 | Full bench coverage for Market Bus Spec v1.0.1; W0…Z; H1-2/MB-P1; 1→N smoke |
| **1.0.1** | 2026-08-10 | Review fold: overrule≠waive everywhere; W0-12 Picker v1.0.2+route seed; X1-G no SKIP; Tango standing note |

**Board scaffold:** [`agents/p-market-bus/`](../agents/p-market-bus/)  
**Gate reports:** `agents/p-market-bus/gate-reports/`  
**Seeds:** `agents/p-market-bus/seeds/`
