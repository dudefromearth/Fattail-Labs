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

**Prior slice:** this report was **RETURNED** on v0.1.2 (R1 — Market Bus writer deleted before the consumer is hopped). That finding is **landed** as **SODP-11** (v0.1.4) plus Coach §12 both-sets (v0.1.5). It is **not** re-opened.

---

## Up front

India **did not** change or drop Coach content. Coach wording in spec header (clean separation + hardening round) is intact. SODP-4 (product Labs on MiniTwo until **SODP-LABS**) is intact — flagged, not erased (**FI-052**). Coach rules that tension **at stamp**. India does not kill either sentence.

Juliet’s four v0.1 return items (TS-1 one-motion, CP-1 arithmetic, consumer proofs, MiniTwo topology) remain **addressed**. R1 is **addressed**. No remaining system hole on this DRAFT.

---

## Verdict

| Gate | Verdict |
|------|---------|
| **Spec / architecture (build readiness of this DRAFT)** | **APPROVED** |
| **Coach’s four v0.1 return items (TS-1 one-motion, CP-1 arithmetic, consumer census, MiniTwo designed now)** | **ADDRESSED** (not India’s kill) |
| **India R1 (Market Bus sequencing)** | **LANDED** — SODP-11 + §11 census row + §12 interim both-sets + §13 carve-out. Not re-opened. |
| **SODP-4 vs Coach “all API on StudioOne”** | **FLAG FI-052** — Coach box **at stamp**. **Not a block.** |
| **Implementation / SODP2 history / fill repair / MiniTwo cutover** | **NO-GO** until Coach BUILD stamp + `SODP2-W0` |

**Open REQs (every report):** REQ-001 **OPEN** · REQ-002 **OPEN** · REQ-003 **OPEN**. No “done.” REQ-004 / REQ-005 **HOLD** (after TOPO-1 AP-1).

**This is not BUILD AUTHORITY.** APPROVED means the DRAFT matches parents and is fit for Coach stamp. It does not start SODP2.

---

## Review object (bytes at this pass · 2026-09-19 22:43 ET)

| File | sha1 | bytes | lines |
|------|------|------:|------:|
| `Specs/FatTail-Labs-StudioOne-Data-Plane-Spec-v0_1.md` (header **v0.1.5**) | `dab97e4f19cb1fdc71a7b165dfadbc0d617876fd` | 21706 | 295 |
| `Architecture/36-studioone-data-plane.md` | `edf6f58b6cddf9c8fb07d37fc0309c3fe8fc8bbd` | 7369 | 150 |
| `Architecture/36-studioone-data-plane-design.md` | `4e10524c2f2e02bb6759f9f225f80c74cc647f6e` | 3139 | 72 |
| `docs/StudioOne-Data-Plane-Full-Agent-Bench-Plan-v1.0.md` (status v1.1 revised) | `2d2c794ceba30295590fe123c230c7c02518a03d` | 9991 | 170 |
| `agents/go/SODP0-W0.md` | `fe8b37c8acc7ebf2d1b6713c13dfe01e14a5f5e9` | 1536 | 30 |

Filename still `v0_1.md` while header is v0.1.5 — freeze note, not a block. Spec status line: **NOT BUILD AUTHORITY.** Coach §12 both-sets is in the header.

---

## 1. MATCH — SODP-1…11 vs parents

| Law / parent | Verdict | Evidence |
|--------------|---------|----------|
| **Arch 28** sole Massive writers for **bus topics** | **MATCH** (target + hold) | Arch 28: `chain_feed` / `sym_feed` = “Massive REST (sole writers for bus topics).” SODP-1 kills the Labs OHLC fill (a second, non-bus Massive caller). History provider is StudioOne, burst-only, **not** a bus topic. **SODP-11** holds StudioTwo bus writers until **SODP-MB** hops `/api/me/market/*` + WS — do not delete the writer before the consumer is hopped. |
| **CP-1 DL-707** | **MATCH** | Plan copies CP-1 **verbatim**. SODP-8 + spec §12 are **arithmetic**. History **0 standing**, 1 paginated GET/(ticker,tf) on miss, first ES+MES = 2 REST bursts, post-close or HOLD; no Redis `CONFIG`; no chain-feed plist; rollback = bootout history agent only. **v0.1.5:** interim combined standing = StudioOne writers **plus StudioTwo `chain_feed` / `sym_feed`**. A number that omits a live writer does **not** satisfy SODP-8. Recognition cache must be **named** at SODP1 before SODP2 GO. Token: CP-1 on every StudioOne packet. |
| **TS-1 doctrine §17** | **MATCH** | Two AP-1 strikes cited in **DL-777**: (1) REQ-001 pre-swap never confirmed at Coach’s screen; (2) post-swap ES and MES cut at Sep 6, banner silent. Struck component = `_aggs_price_fill`. SODP-7: F3 **is** the migration; born on StudioOne; copy-then-replace = **FAIL**. Plan DAG: “FAIL the program if any packet sequences move the fill, then F3.” |
| **OPF** | **MATCH — not in play** | Zero OPF mentions in spec / Arch 36 / plan. No position create/edit/package, no `AnalyzerPositionsList`, no OPF chain-truth rewrite. `chain_feed` stays the options Massive writer (CP-1 sacred). |
| **VPS D1 home** | **MATCH** | VPS spec v0.5 / v0.6 **Host: StudioOne**. SODP §1 D1 home = StudioOne ingest/feeds/engine/VP API. Prints = **tail only** for price (not 90-day BASE). VPS Q1 ES/MES **model** ACTIVE stays blocked. Data-delivery **D1** (90-day floor, **DL-760**) aligns with SODP-5 default 90d / REQ-001 — different noun than “D1 home” (see opinions). |
| **SYM-4** (v0.2.1) | **MATCH** | SODP-5 keys Labs `bound_symbol` (`ESZ2026` = SYM-3 dated long form), vendor-translates on the server (`ESZ6`). Client still must not contain `FGHJKMNQUVXZ` (Arch 36 §5). Hotel honors: no root-default hardcoded `ESZ6`; strip `front` then translate; no silent D6.5 B-ADJ (**SYM-4.2**). D6/D7/D8 **stay open** (SYM readiness / metadata / activity-preset — token + plan). |
| **Arch 01** MiniTwo sole **product** host | **MATCH** | SODP-4; Arch 01 §3 production = MiniTwo `labs.fattail.ai`. Arch 01 already has a data-plane **target** row for StudioOne. |
| **SODP-9 / RL-1** | **MATCH** | Ledger `agents/bench/requirements-ledger.md` rows REQ-001/002/003 **OPEN**. Spec, plan, token, board all refuse “done” before AP-1. |
| **SODP-10 / doctrine §13** | **MATCH** | After TOPO-1 AP-1: **REFACTOR** (REQ-004) then **HARDEN** (REQ-005). Not during SODP2–6. Combined SODP-H is **split**. **DL-778**. |
| **SODP-11 / Arch 28 sequencing** | **MATCH** | Spec §2 SODP-11 · §11 Market Bus row · §12 interim both-sets · §13 “not in this deletion set until SODP-MB” · plan DAG SODP5 “chain_feed/sym_feed stay until SODP-MB” · plan SODP-MB paragraph. This **is** the landed R1. |
| **Isolation LIM / QFRIC / XS / PPL** | **MATCH** | Spec §8 · Arch 36 §6 · plan §3 Isolation FAIL. No those files in this packet. Help Watch / IKI named out. |

### Neighbor-board artifact quotes (workflow)

| Plan assertion | Quote (not the plan’s table) |
|----------------|------------------------------|
| Symbology already hopped | **DL-774:** “Member Labs `:4000` hops `/symbology/v1/*` to StudioOne `http://192.168.1.111:4011` (computing-class; member cookie not forwarded).” |
| SYM-SWAP lesson (orphan branches) | **DL-774** / `agents/p-symbology-registry/gate-reports/SYM-SWAP-G.md` — fixture deleted; hop is the live path. Spec §11 is the SODP encoding of that lesson for OHLC. |
| CP-1 live dress on StudioOne | **DL-773** SYM1-DEPLOY: “chain_feed pid **538** BEFORE and AFTER, RSS 71088 unchanged, last line `no interest keys; idle`.” Spec §12 Saturday probe cites pid 538 **and** StudioTwo pid 99058. |
| REQ OPEN | Ledger: `REQ-001` VP OPEN · `REQ-002` VP settings OPEN · `REQ-003` VP contracts OPEN (`agents/bench/requirements-ledger.md` lines 11–13). REQ-004 / REQ-005 OPEN · HOLD. |
| CP-1 verbatim | `docs/Volume-Profile-Service-Full-Agent-Bench-Plan-v1.2.md` standing law (cited **DL-707**). **Note:** `Architecture/00-decision-log.md` has **no `## … DL-707` heading** — only citations. Pre-existing Lima gap; not invented by SODP. |

---

## 2. Coach “all API on StudioOne” vs SODP-4

**Coach (verbatim, spec header):** “serverside functionality including all data movement and api run from StudioOne, and then the UI is remote.”

**SODP-4:** Product Labs (identity, courses, MySQL `labs`, SSO issuers) stays MiniTwo until Coach stamps **SODP-LABS**. **DL-777:** “Flagged for India, not erased.”

| | |
|--|--|
| **India label** | **FLAG (FI-052)** — opinion / Coach box **at stamp**. **Not a block.** |
| **Why not a block** | Doctrine §11.4: block only invariant / law / system breakage. SODP-4 is a named carve-out of **product** Labs, consistent with Arch 01 / `infra/deploy.md`. Erasing it would drop Coach’s MiniTwo production UI. Collapsing Coach “all API” into SODP-4 would drop the clean-separation sentence. **Keep both texts.** |
| **What Coach still owns** | SODP-LABS now / later / never — **ruled at stamp**. India does not kill either sentence. |
| **Not this flag** | Market Bus hop. That was R1; it is **SODP-11**, not FI-052. |

---

## 3. As-built §3 — evidence (this machine, 2026-09-19 22:43 ET)

| Claim | Verdict | Evidence |
|-------|---------|----------|
| **OHLC in-process on StudioTwo Labs** | **CONFIRMED** | `server/routes/vp_display.py` `get_source_ohlc` → `ohlc_for_source(...)` locally (no `_computing_headers` hop). Health / structure / range / stream **do** hop. `.env`: `LABS_SA_DEV_VP_API_BASE=http://192.168.1.111:4010`. |
| **Leftover StudioTwo vp-api** | **CONFIRMED** | `lsof -nP -iTCP:4010 -sTCP:LISTEN` → `Python PID 66270` `127.0.0.1:4010`. `ps`: `python -m market_data.vp_api`. launchd `ai.fattail.labs.vp-api`. Also leftover `chain_feed` PID **99058** `--interval 2` (elapsed 18d); `vp_engine.bin_loop` PID **31332**. Local `curl 127.0.0.1:4010/v1/health` → HTTP 401 (process up). `:4011` / `:4012` empty on StudioTwo. |
| **StudioOne hop targets up** | **CONFIRMED** | `curl http://192.168.1.111:4010/v1/health` → HTTP 401 in 16 ms (not connection refused). `:4011` HTTP 404 in 11 ms (path is `/symbology/v1/*`, listener up). Computing-class required; India did not mint a hop JWT. |
| **ESZ2026 empty / ESZ6 history / silent print fallback** | **Mechanism CONFIRMED.** Live n=12098 / n=0 **not re-hit** (CP-1 — India did not call Massive). | `_aggs_price_fill` passes `ticker=requested` into `fetch_futures_aggs` → `GET /futures/v1/aggs/{ticker}`. Picker binds SYM-3 `ESZ2026`. `if filled:` else keep `price_source=vp_prints`. Empty Massive → silent print BASE (TS-1 struck). |
| **Print-store wall ~Sep 6 / ~11 d** | **CONFIRMED (local collector, no Massive)** | `store_ok True local-collector:/Users/ernie/fattail-market-data`. ES **and** MES days **10**: `2026-09-07` … `2026-09-18`. FatTail2TB **not mounted** on StudioTwo. Arch 36’s “2026-09-06 / 11.52d” is the same short wall; India did not re-run `ohlc_for_source` (that path calls Massive). |
| **§12 both-sets are live** | **CONFIRMED** | StudioTwo `chain_feed` pid **99058** still running. Spec §12 Saturday probe names this pid. SODP1 that omits it FAILS SODP-8. StudioTwo `sym_feed` **not** in `launchctl list` this pass — SODP1 names process **or** “none found.” |

Struck fill wiring (for replacement diagnosis only, TS-1): `server/sa_dev/service.py` `_aggs_price_fill` + `if requested or span_days < _REQ001_MIN_DAYS`.

---

## 4. Isolation

LIM / QFRIC / XS / PPL / Help Watch / IKI: **not opened**. Spec §8, Arch 36 §6, plan §3. Token MiniTwo not this tree until SODP4. D6/D7/D8 stay open. ES/MES model ACTIVE blocked on VPS Q1. No history code. Not BUILD.

---

## Blocks (invariant | law | system only)

**None.**

R1 is not re-opened. FI-052 is not a block.

---

## Opinions / recommendations (not blocks — Coach may discard)

1. **Arch 36 §5** combined standing still reads StudioOne-only (`chain_feed + sym_feed + vp-futures + recognition`). Spec §12 is law for SODP1 (both machines until SODP-MB). Align Arch 36 at freeze; do not let SODP1 measure the stale sentence.
2. **Plan SODP5 body** still says leftover `chain-feed` “process gone, plist gone.” DAG + SODP-11 + spec §13 carve-out are law. Juliet: strike `chain-feed` from that SODP5 sentence **before the SODP5 seed**. Executing the body as written would re-break R1. Not a SODP0 return — SODP5 is HOLD until stamp.
3. **§11 close sentence** (“SODP3 does not close until every row has a command + output”) vs Market Bus row re-point **SODP-MB**. SODP3 attests that row as **held** (writer still local; hop not this packet). A seed that requires `/api/me/market` hop before SODP3 close couples REQ-001 to SODP-MB — Isolation FAIL vs SODP-11.
4. **§12 history port** still says “`:4010` route or `:4012`.” Spec §4 + Foxtrot SODP0 + plan SODP2 = sibling **`:4012`**. Chrome at freeze.
5. **Arch 36 ASCII** still draws history on `:4010` with vp-api. Table §4.2 is `:4012`. Chrome.
6. **“D1 home”** (StudioOne machine) vs VP Data Delivery **D1** (90-day floor, DL-760) vs SYM **D6** (readiness vector) vs VP-DD **D6** (B-ADJ continuous). SODP-5 is per-contract native (SYM-4.2). Do not treat SODP as answering VP-DD D6. Token “D6/D7/D8 stay open” is the **SYM** trio.
7. **Arch 28 honesty at BUILD:** name StudioOne history as an allowed **non-bus** Massive class (burst, CP-1). Do not silently extend “single-flight fill on miss” on UI-host Labs.
8. **DL-707** has no decision-log heading (Lima, pre-existing). SODP may keep citing the VPS-plan verbatim until Lima files or points the heading.
9. **CP-1 verbatim** still says “never disrupted by **Volume Profile Service** work.” SODP-8 correctly extends (a)(b)(c)(d) to every StudioOne packet; Lima may note the program name at next CP-1 cite.
10. **Freeze filename** `v0_1.md` vs header v0.1.5 when Coach stamps BUILD.
11. **Board** `ORCHESTRATOR.md` still shows spec v0.1.2 and India RETURNED on R1 — Juliet chrome after this slice.

---

## Flagged ideas

| ID | Idea | Why flagged | Discuss with |
|----|------|-------------|--------------|
| **FI-052** | Coach “all data movement and api run from StudioOne” vs SODP-4 MiniTwo product Labs until **SODP-LABS** | Do not erase Coach text. Do not collapse SODP-4 into the clean-separation sentence. SODP-4 is a named product carve-out (Arch 01). **Coach rules SODP-LABS now / later / never at stamp.** Market Bus hop is **not** this flag (landed SODP-11). | Coach + Juliet |

Register: `Architecture/flagged-ideas.md` (already OPEN). India did not edit that file this pass.

---

## Coach content intact?

**Yes.** Clean-separation sentence retained. Hardening-round sentence retained. SODP-4 retained. MiniTwo as production UI retained. SODP-11 retained. §12 both-sets retained. REQ-001/002/003 remain OPEN. India did not edit the Spec.

---

## Build disposition

**APPROVED** — DRAFT architecture MATCH. Product intent is not deleted. FI-052 stays beside SODP-4 for Coach at stamp.

Juliet: SODP0-G India slice is no longer the hold. Coach stamps BUILD (or not). Echo / Tango / Foxtrot / Mike / Hotel APPROVED stand.

**NO-GO until stamp + `SODP2-W0`:** SODP2 history code, copying `_aggs_price_fill` onto StudioOne, MiniTwo cutover, writing “done” on REQ-001/002/003, bootout of StudioTwo `chain_feed` / `sym_feed`.

---

## Bench delta

1. **R1 is a law now (SODP-11), not a review finding.** Next India MATCH greps SODP5 seeds for `chain_feed` bootout **before** SODP-MB — that is Isolation FAIL, not a new Advisor return.
2. **v0.1.5 combined standing is both machines.** Next SODP1 artifact that reports only StudioOne `chain_feed` FAILS SODP-8, even if CP-1 is quoted verbatim.
3. **FI-052 is Coach’s stamp box**, not India’s kill and not Market Bus. Keep both texts until Coach names SODP-LABS now / later / never.
4. **SODP3 vs SODP-MB:** census rows whose re-point is **held** attest the hold (process up, hop not this packet). They do not block OHLC re-point.
5. Print-store on StudioTwo still serves **10** ES/MES sessions (`2026-09-07`…`2026-09-18`) via local-collector — the silent wall SODP-5 replaces. Leftover plane still live: `:4010` PID 66270 + `chain_feed` 99058 + `vp-engine` 31332.

---

**Parents read:** India charter · doctrine §11 / §13 / §15 / §17 TS-1 · first-principles · CP-1 verbatim (VPS plan v1.2 / DL-707 cite) · Arch 01 · Arch 28 · SYM v0.2.1 SYM-3/4 · VPS v0.5/v0.6 host · DL-760 D1 · DL-773/774 · DL-777/778/779 · REQ-001/002/003 ledger · OPF doctrine (adjacent, not in play) · prior SODP0-india RETURNED (R1) · SODP0 Foxtrot / Mike / Hotel / Echo+Tango APPROVED.
