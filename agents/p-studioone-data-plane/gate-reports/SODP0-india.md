# SODP0 — India Advisor

**Project:** StudioOne Data Plane & Remote UI (SODP)  
**Agent:** India (Spec & Architecture Guardian)  
**Gate:** SODP0-G (India slice)  
**Date:** 2026-09-19  
**Machine:** StudioTwo, read-only. No `server/` `web/` product edits.  
**Seed:** `agents/p-studioone-data-plane/seeds/SODP0-india.md`  
**Token:** `agents/go/SODP0-W0.md` (intake only — not a data-plane build GO)

**Coach Content Law (doctrine §11):** nothing of Coach’s was removed. Objections sit beside, labeled India’s. Block only for invariant / law / system breakage. Opinions are labeled opinions.

**This pass did not:** implement · repair `_aggs_price_fill` · call Massive · bootout launchd · edit the Spec · write the decision log · open LIM / QFRIC / XS / PPL.

---

## Up front

India **did not** change or drop Coach content. Coach wording in spec header (clean separation + hardening round) is intact. SODP-4 (product Labs on MiniTwo until **SODP-LABS**) is intact — flagged, not erased (**FI-052**).

Juliet already marked spec **v0.1.2 DRAFT — RETURNED** (Coach: TS-1 collision, CP-1 arithmetic, consumer proofs, MiniTwo topology). Those four items are **addressed** in the current packet. India still **RETURNED** on one remaining system hole (R1).

---

## Verdict

| Gate | Verdict |
|------|---------|
| **Spec / architecture (build readiness of this DRAFT)** | **RETURNED** |
| **Coach’s four v0.1 return items (TS-1 one-motion, CP-1 arithmetic, consumer census, MiniTwo designed now)** | **ADDRESSED** (not India’s kill) |
| **SODP-4 vs Coach “all API on StudioOne”** | **FLAG FI-052** — Coach box, not a block |
| **Implementation / SODP2 history / fill repair / MiniTwo cutover** | **NO-GO** until Coach BUILD stamp + `SODP2-W0` |

**Open REQs (every report):** REQ-001 **OPEN** · REQ-002 **OPEN** · REQ-003 **OPEN**. No “done.”

---

## Review object (bytes at this pass)

| File | sha1 | lines |
|------|------|------:|
| `Specs/FatTail-Labs-StudioOne-Data-Plane-Spec-v0_1.md` (header **v0.1.2**) | `2acb6524278e7fdcae561f279db4e86a2ac372cc` | 281 |
| `Architecture/36-studioone-data-plane.md` | `edf6f58b6cddf9c8fb07d37fc0309c3fe8fc8bbd` | 150 |
| `Architecture/36-studioone-data-plane-design.md` | `4e10524c2f2e02bb6759f9f225f80c74cc647f6e` | 72 |
| `docs/StudioOne-Data-Plane-Full-Agent-Bench-Plan-v1.0.md` (status v1.1 revised) | `f67d9fafab5323e856ff9ebbbeb28fbe181a4be1` | 180 |
| `agents/go/SODP0-W0.md` | `fe8b37c8acc7ebf2d1b6713c13dfe01e14a5f5e9` | — |

Filename still `v0_1.md` while header is v0.1.2 — freeze note, not a block.

---

## 1. MATCH — SODP-1…10 vs parents

| Law / parent | Verdict | Evidence |
|--------------|---------|----------|
| **Arch 28** sole Massive writers for **bus topics** | **MATCH** (target) | Arch 28: `chain_feed` / `sym_feed` = “Massive REST (sole writers for bus topics).” SODP-1 kills the Labs OHLC fill (a second, non-bus Massive caller). History provider is StudioOne, burst-only, **not** a bus topic. Arch 36 §4.1 names history as SODP-5 / TS-1. |
| **CP-1 DL-707** | **MATCH** | Plan copies CP-1 **verbatim**. SODP-8 + spec §12 are **arithmetic**: history **0 standing**, 1 paginated GET/(ticker,tf) on miss, first ES+MES = 2 REST bursts, post-close or HOLD; no Redis `CONFIG`; no chain-feed plist; rollback = bootout history agent only. Recognition cache must be **named** at SODP1 before SODP2 GO. Token: CP-1 on every StudioOne packet. |
| **TS-1 doctrine §17** | **MATCH** | Two AP-1 strikes cited in **DL-777**: (1) REQ-001 pre-swap never confirmed at Coach’s screen; (2) post-swap ES and MES cut at Sep 6, banner silent. Struck component = `_aggs_price_fill`. SODP-7: F3 **is** the migration; born on StudioOne; copy-then-replace = **FAIL**. Plan DAG: “FAIL the program if any packet sequences move the fill, then F3.” |
| **OPF** | **MATCH — not in play** | Zero OPF mentions in spec / Arch 36 / plan. No position create/edit/package, no `AnalyzerPositionsList`, no OPF chain-truth rewrite. `chain_feed` stays the options Massive writer (CP-1 sacred). |
| **VPS D1 home** | **MATCH** | VPS spec v0.5 **Host: StudioOne**. SODP §1 D1 home = StudioOne ingest/feeds/engine/VP API. Prints = **tail only** for price (not 90-day BASE). VPS Q1 ES/MES **model** ACTIVE stays blocked. Data-delivery **D1** (90-day floor, **DL-760**) aligns with SODP-5 default 90d / REQ-001 — different noun than “D1 home” (see opinions). |
| **SYM-4** (v0.2.1) | **MATCH** | SODP-5 keys Labs `bound_symbol` (`ESZ2026` = SYM-3 dated long form), vendor-translates on the server (`ESZ6`). Client still must not contain `FGHJKMNQUVXZ` (Arch 36 §5). Hotel honors: no root-default hardcoded `ESZ6`; strip `front` then translate; no silent D6.5 B-ADJ (**SYM-4.2**). D6/D7/D8 **stay open** (SYM readiness / metadata / activity-preset — token + plan). |
| **Arch 01** MiniTwo sole **product** host | **MATCH** | SODP-4; Arch 01 §3 production = MiniTwo `labs.fattail.ai`. Arch 01 already has a data-plane target row for StudioOne. |
| **SODP-9 / RL-1** | **MATCH** | Ledger `agents/bench/requirements-ledger.md` rows REQ-001/002/003 **OPEN**. Spec, plan, token, board all refuse “done” before AP-1. |
| **SODP-10 / doctrine §13** | **MATCH** | Hardening after SODP5 + AP-1. **DL-778**. Not during SODP2–6. |
| **Isolation LIM / QFRIC / XS / PPL** | **MATCH** | Spec §8 · Arch 36 §6 · plan §3 Isolation FAIL. No those files in this packet. Help Watch / IKI named out. |

### Neighbor-board artifact quotes (workflow)

| Plan assertion | Quote (not the plan’s table) |
|----------------|------------------------------|
| Symbology already hopped | **DL-774:** “Member Labs `:4000` hops `/symbology/v1/*` to StudioOne `http://192.168.1.111:4011` (computing-class; member cookie not forwarded).” |
| SYM-SWAP lesson (orphan branches) | **DL-774** / `agents/p-symbology-registry/gate-reports/SYM-SWAP-G.md` — fixture deleted; hop is the live path. Spec §11 is the SODP encoding of that lesson for OHLC. |
| CP-1 live dress on StudioOne | **DL-773** SYM1-DEPLOY: “chain_feed pid **538** BEFORE and AFTER, RSS 71088 unchanged, last line `no interest keys; idle`.” Spec §12 Saturday probe cites pid 538. |
| REQ OPEN | Ledger: `REQ-001` VP OPEN · `REQ-002` VP settings OPEN · `REQ-003` VP contracts OPEN (`agents/bench/requirements-ledger.md` lines 11–13). |
| CP-1 verbatim | `docs/Volume-Profile-Service-Full-Agent-Bench-Plan-v1.2.md` standing law (cited **DL-707**). **Note:** `Architecture/00-decision-log.md` has **no `## … DL-707` heading** — only citations. Pre-existing Lima gap; not invented by SODP. |

---

## 2. Coach “all API on StudioOne” vs SODP-4

**Coach (verbatim, spec header):** “serverside functionality including all data movement and api run from StudioOne, and then the UI is remote.”

**SODP-4:** Product Labs (identity, courses, MySQL `labs`, SSO issuers) stays MiniTwo until Coach stamps **SODP-LABS**. **DL-777:** “Flagged for India, not erased.”

| | |
|--|--|
| **India label** | **FLAG (FI-052)** — opinion / Coach box. **Not a block.** |
| **Why not a block** | Doctrine §11.4: block only invariant / law / system breakage. SODP-4 is a named carve-out of **product** Labs, consistent with Arch 01 / `infra/deploy.md`. Erasing it would drop Coach’s MiniTwo production UI. |
| **What Coach still owns** | SODP-LABS now / later / never. India does not kill the clean-separation sentence. |

---

## 3. As-built §3 — evidence (this machine, 2026-09-19 ~21:45 ET)

| Claim | Verdict | Evidence |
|-------|---------|----------|
| **OHLC in-process on StudioTwo Labs** | **CONFIRMED** | `server/routes/vp_display.py` `get_source_ohlc` → `ohlc_for_source(...)` locally (no `_computing_headers` hop). Health / structure / range **do** hop. `.env`: `LABS_SA_DEV_VP_API_BASE=http://192.168.1.111:4010`. |
| **Leftover StudioTwo vp-api** | **CONFIRMED** | `lsof -nP -iTCP:4010 -sTCP:LISTEN` → `Python PID 66270` `127.0.0.1:4010`. `ps`: `python -m market_data.vp_api`. launchd `ai.fattail.labs.vp-api`. Also leftover `chain_feed` PID **99058** `--interval 2`; `vp_engine.bin_loop` PID **31332**. Local `curl 127.0.0.1:4010/v1/health` → HTTP 401 (process up). |
| **StudioOne hop targets up** | **CONFIRMED** | `curl http://192.168.1.111:4010/v1/health` → HTTP 401 in 5 ms (not connection refused). `:4011` same. Computing-class required; India did not mint a hop JWT. |
| **ESZ2026 empty / ESZ6 history / silent print fallback** | **Mechanism CONFIRMED.** Live n=12098 / n=0 **not re-hit** (CP-1 — India did not call Massive). | `_aggs_price_fill` passes `ticker=requested` into `fetch_futures_aggs` → `GET /futures/v1/aggs/{ticker}`. Picker binds SYM-3 `ESZ2026`. `if filled:` else keep `price_source=vp_prints`. Empty Massive → silent print BASE (TS-1 struck). |
| **Print-store wall ~Sep 6 / ~11 d** | **CONFIRMED (local collector)** | `store_ok True local-collector:/Users/ernie/fattail-market-data`. ES days **10**: `2026-09-07` … `2026-09-18`. Arch 36’s “2026-09-06 / 11.52d” is the same short wall; India did not re-run `ohlc_for_source` (that path calls Massive). |

Struck fill wiring (for replacement diagnosis only, TS-1): `server/sa_dev/service.py` `_aggs_price_fill` + `if requested or span_days < _REQ001_MIN_DAYS`.

---

## 4. Isolation

LIM / QFRIC / XS / PPL / Help Watch / IKI: **not opened**. Spec §8, Arch 36 §6, plan §3. Token MiniTwo not this tree until SODP4. D6/D7/D8 stay open. ES/MES model ACTIVE blocked on VPS Q1.

---

## Blocks (invariant | law | system only)

### R1 — SODP-1 vs leftover `chain_feed` / Market Bus consumers (system)

**Violates:** SODP-1 (sole data-plane runtime) **as sequenced**, plus first-principles “no parallel implementations” when SODP5 deletes a live Arch 28 writer without a hopped consumer.

**As-built:** StudioTwo `chain_feed` PID **99058** is running. Arch 28 member door is Labs `:4000` + Redis `mb:*` + `GET/WS /api/me/market/*`. Spec §6 hop table and §11 census list VP / OHLC / symbology **only** — **zero** `/api/me/market` rows.

**As written:** UI host “does not run … `chain_feed`.” SODP5 / §13 retire leftover StudioTwo `chain-feed`. Spec §14 MiniTwo “does not run … Massive.” Those retires, without a Market Bus hop, drop the Arch 28 inbound writer on the UI host while Options Lab still consumes local Labs Redis.

**Required change (one sentence in spec §6 or §8 + plan SODP5/SODP4):**

> Either (a) add Market Bus member routes (`/api/me/market/*`, WS stream) to the §11 census and hop them **before** SODP5/SODP4 bootout of `chain_feed`/`sym_feed` on that UI host, **or** (b) explicit hold: SODP5 does not retire StudioTwo `chain_feed`/`sym_feed`, and SODP4 does not strip MiniTwo feeds, until a named **SODP-MB** GO.

This is **not** FI-052. FI-052 is product Labs (SODP-4). Market Bus is **data movement** — already in SODP-1. Coach “all API” does not get erased; the DAG must not delete the writer before the consumer is hopped.

**Not R1:** history on sibling `:4012` (Foxtrot; §4 vs §12 still says “`:4010` route or `:4012`” — chrome, Foxtrot).

---

## Opinions / recommendations (not blocks — Coach may discard)

1. **§2 heading** still says “Laws (SODP-1…9)” while the table includes **SODP-10**. Chrome at freeze.
2. **“D1 home”** (StudioOne machine) vs VP Data Delivery **D1** (90-day floor, DL-760) vs SYM **D6** (readiness vector) vs VP-DD **D6** (B-ADJ continuous). SODP-5 is per-contract native (SYM-4.2). Do not treat SODP as answering VP-DD D6. Token “D6/D7/D8 stay open” is the **SYM** trio.
3. **Arch 28 honesty at BUILD:** name StudioOne history as an allowed **non-bus** Massive class (burst, CP-1). Do not silently extend “single-flight fill on miss” on UI-host Labs.
4. **DL-707** has no decision-log heading (Lima, pre-existing). SODP may keep citing the VPS-plan verbatim until Lima files or points the heading.
5. **CP-1 verbatim** still says “never disrupted by **Volume Profile Service** work.” SODP-8 correctly extends (a)(b)(c)(d) to every StudioOne packet; Lima may note the program name at next CP-1 cite.
6. **Freeze filename** `v0_1.md` vs header v0.1.2 when Coach stamps BUILD.

---

## Flagged ideas

| ID | Idea | Why flagged | Discuss with |
|----|------|-------------|--------------|
| **FI-052** | Coach “all data movement and api run from StudioOne” vs SODP-4 MiniTwo product Labs until **SODP-LABS**; Market Bus member APIs unnamed in §6 | Do not erase Coach text. SODP-4 is a named product carve-out (Arch 01). Market Bus hop is **R1** (system), not this flag. Coach disposes SODP-LABS now / later / never. | Coach + Juliet |

Register: `Architecture/flagged-ideas.md`.

---

## Coach content intact?

**Yes.** Clean-separation sentence retained. Hardening-round sentence retained. SODP-4 retained. MiniTwo as production UI retained. REQ-001/002/003 remain OPEN. India did not edit the Spec.

---

## Build disposition

**RETURNED** — implementation readiness only. Product intent is not deleted.

Juliet: land **R1** (Market Bus hop **or** explicit SODP-MB hold on `chain_feed`/`sym_feed` retire) in spec + plan, then India re-slice. Echo / Tango / Foxtrot / Mike may continue SODP0 in parallel; their APPROVED does not waive R1.

**NO-GO:** SODP2, copying `_aggs_price_fill` onto StudioOne, MiniTwo cutover, writing “done” on REQ-001/002/003.

---

## Bench delta

1. **TS-1 on this tree is one motion:** replacement is **born** on StudioOne; the struck fill is never copied then repaired. Next India MATCH greps for “move then F3” as Isolation FAIL.
2. **CP-1 without numbers is not a GO** on SODP (spec §12). Next StudioOne packet that only cites DL-707 fails India.
3. **As-built leftover plane is live on this Mac:** `:4010` PID 66270 + `chain_feed` 99058 + `vp-engine` 31332. SODP5 ghost proofs have a known baseline.
4. **FI-052** holds Coach “all API” vs SODP-4 without promoting it to a kill. **R1** is the separate Market Bus sequencing hole.
5. Print-store on StudioTwo still serves ~10 ES sessions (`2026-09-07`…`2026-09-18`) via local-collector — the silent wall SODP-5 replaces.

---

**Parents read:** India charter · doctrine §11 / §13 / §15 / §17 TS-1 · first-principles · CP-1 verbatim (VPS plan v1.2 / DL-707 cite) · Arch 01 · Arch 28 · SYM v0.2.1 SYM-3/4 · VPS v0.5 host · DL-760 D1 · DL-773/774 · DL-777/778 · REQ-001/002/003 ledger · OPF doctrine (adjacent, not in play).
