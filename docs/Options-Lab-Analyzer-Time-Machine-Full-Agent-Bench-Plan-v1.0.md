# Analyzer Time Machine — Full Agent Bench Plan v1.0

**Date:** 2026-08-20  
**Plan revision:** **v1.0**  
**Canonical filename:** `docs/Options-Lab-Analyzer-Time-Machine-Full-Agent-Bench-Plan-v1.0.md`  
**Owner (orchestration):** Juliet  
**Authority:** Coach (GO / ship)  
**Board:** [`agents/p-az-atm/`](../agents/p-az-atm/)  
**Governance:** [`agents/bench/doctrine.md`](../agents/bench/doctrine.md) · [`AGENTS.md`](../AGENTS.md) · [`spec-create-review-workflow.md`](../agents/bench/spec-create-review-workflow.md)

**Primary law:**

| Doc | Path | Status |
|-----|------|--------|
| **AZ-ATM Spec v0.1.1** | [`Specs/FatTail-Labs-Options-Lab-Analyzer-Time-Machine-Spec-v0.1.md`](../Specs/FatTail-Labs-Options-Lab-Analyzer-Time-Machine-Spec-v0.1.md) | **DRAFT** · **DL-486** · **DL-487** · not BUILD AUTHORITY until W0-BA |
| Analyzer v0.2.1 | [`Specs/FatTail-Labs-Options-Lab-Analyzer-Spec-v0_2.md`](../Specs/FatTail-Labs-Options-Lab-Analyzer-Spec-v0_2.md) | Parent · Autofit strip · What-if §1.11 |
| What-If T/σ v0.1 | [`Specs/FatTail-Labs-Options-Lab-Analyzer-What-If-Time-and-Measured-Vol-Spec-v0.1.md`](../Specs/FatTail-Labs-Options-Lab-Analyzer-What-If-Time-and-Measured-Vol-Spec-v0.1.md) | What-if knobs **stay What-if** |
| AZ-ALGO v1.0.2 | [`Specs/FatTail-Labs-Options-Lab-Analyzer-Algo-Alert-Spec-v1.0.md`](../Specs/FatTail-Labs-Options-Lab-Analyzer-Algo-Alert-Spec-v1.0.md) | Demo may **consume** this clock (`mode: demo_timemachine`) |
| Surface App Spec v0.1.8 §4.6 | 3D Time machine = **snap rebind** | **Not this program** |
| OT-EF / DL-309 | Named holes, no invented prints | |
| Arch 28 | **No client Massive.** Server download. | |
| HI Spec v1.0 | 44pt · tokens · no emoji chrome | |

**Juliet does not invent WHAT.** Coach wrote AZ-ATM §0. This plan **sequences**.

Delta gates: **PASS / FAIL / BLOCKED** — **never waived**.  
Coach overrule = **DL with reasoning**, not a waived gate.  
Reviews: findings are **BLOCKING** (invariant / law / system) or **ADVISORY** (opinion).

---

## 0. Why this program exists

Coach (verbatim, compressed from AZ-ATM §0):

Time Machine is **thinkorswim OnDemand-class day replay**, not What-if. Calendar selects the NY day. The system downloads the **minute-granular** day; the member **sees the mini chart fill** as it lands. Pick start time. Video controls in the **dark strip above the canvas**, **right of Autofit**. **Strikes/in left of Autofit.** Mini day candle/line + **draggable scrubber** in the **upper-right canvas corner**. Inner glow: **blue** Time Machine, **red** What-if. Each day **390 candles or closes**. Replay **close-to-close** or a **TPO path**. **Basic** turns **Probability and GEX off**. **Enhanced** **allows** them.

---

## 1. Mission

```text
W0     Review (India · Echo · Tango · Hotel)
         → Delta W0-G → Coach W0-BA (BUILD AUTHORITY)
W1     Math / data (NO contested chrome)
         server 1-minute day fetch · 390 path · close-to-close walk · playhead clock
W2-0   India chrome lock — HostPnLChart / toolbar queue
W2     Basic chrome (after the serialization queue)
         calendar · video controls · mini chart fill · scrubber · glows · GEX/Prob OFF
W3     Enhanced — allow GEX and Probability
W4     TPO walk (behind simple close-to-close)
W5     Kilo AT-ATM-1…17
W6     Lima honesty
W-G    Delta
```

**No product code in W0.** W1+ fire **only** after W0-BA.

**W1 is the same seam as AZ-ALGO W1-before-W4:** buildable **before any** toolbar / `HostPnLChart` / glow chrome.

### 1.1 Serialization queue (chrome — explicit)

AZ-ATM chrome lands on the Analyzer **viewport toolbar** (`OpfRiskAnalyzer.tsx` dark strip) and the **`HostPnLChart` region** (mini chart, inner glow). Those are the most contested files in the tree.

**Chrome packets (W2+) do not fire until this queue is clear, in order:**

| Order | Board / packet | Why |
|-------|----------------|-----|
| **1** | `p-az-viewport-2d` **Packet A W-G** | Left-drag pan / right-click alerts **gesture** on `HostPnLChart.tsx` |
| **2** | `p-az-algo` **W4-G** | Algo dashed pair / overlay **draw** on the same host |
| **3** | `p-alerts` **C2-G** | Threshold **apply** on the same host |

W2-0 India **quotes today’s artifacts** from those three boards (workflow template: neighbor-board quotes, not this table). If any of 1–3 is **in flight** or **W-G unfiled**: **HOLD W2**. W1 may still run.

`p-az-viewport-return` product code remains **Forbidden** until that board’s W0-BA — do not steal host life.

---

## 2. Hard gates

| Gate | Rule | Unblocks |
|------|------|----------|
| **W0-2 India** | Spec v0.1.1 is architecture-safe. What-if ≠ Time Machine ≠ Surface snap-rebind. Arch 28: **server** fetch, no client Massive. **ATMP-B1:** quote **three** neighbor artifacts from **their** ORCHESTRATOR / gate-reports — (1) `p-az-viewport-2d` Packet A / **W-G**, (2) `p-az-algo` **W4-0 / W4-G**, (3) `p-alerts` **C2**. Name `OpfRiskAnalyzer.tsx` + `HostPnLChart.tsx` overlap. Confirm **§1.1 queue**. BLOCKING vs ADVISORY labeled. | Echo · Tango · Hotel · W0-G |
| **W0-3 Echo** | Toolbar: Strikes/in **left of Autofit**; TM transport **right of Autofit** in the **dark strip**; 44pt. Mini chart **upper-right canvas**, not a second SoR. **Mode glows:** Time Machine **blue blur** inner edge; What-if **red glow**. Signal is **not color-only** (token name + geometry / `data-glow`; do not rely on hue alone). No raw hex in chrome. | W0-G · Charlie W2 |
| **W0-4 Tango** | Vocabulary: inspector knobs stay **What-if**; replay is **Time Machine**. No profit claims. Basic vs Enhanced is capacity (GEX/Prob off in Basic — less to track). Calendar download is one job, not an essay. | W0-G |
| **W0-5 Hotel** | 390 is cash RTH; do not invent bars to pad. Close-to-close does not fake intra-bar. TPO missing → **NO TPO**, never OHLC-synthesized path. 1-minute, not 5-minute as a substitute. | W0-G |
| **W0-G Delta** | Spec v0.1.1 + this plan v1.0 + board on disk. India W0-2 APPROVED **with three neighbor quotes**. Echo glow tokens named. **No product code in W0.** | W0-BA |
| **W0-BA Coach** | BUILD AUTHORITY. Silent ODs apply unless named. | W1 |
| **W1-G** | 1m fetch (no client Massive); 390 (or honest short); close-to-close playhead; clock tests. **No** `HostPnLChart` / toolbar edit in the W1 diff. | W2-0 · W4 (TPO later) |
| **W2-0 India** | Re-quote the **§1.1 queue**. HOLD if Packet A W-G, algo W4-G, or C2 is unfiled / in flight. | W2-1 |
| **W2-G** | AT-ATM-1…7, 9–11, 13–16 (Basic). GEX/Prob **off**. Mini chart fills. Scrubber seeks. Glows. | W3 · W5 |
| **W3-G** | AT-ATM-8 Enhanced: GEX and Probability **can** turn on. | W5 |
| **W4-G** | AT-ATM-17 TPO path or **NO TPO**. Simple walk still works. | W5 |
| **W5-G** | AT-ATM-1…17 evidence table. | W-G |
| **W-G Delta** | Ternary. Fail-closed on client Massive, invented 390 pad, color-only glow, chrome jumped ahead of queue. | Coach ship / MiniTwo **when asked** |

---

## 3. Locked (not ODs)

| ID | Decision | Source |
|----|----------|--------|
| **FP1** | What-if = ad-hoc T/S/Vol. Time Machine = pick a day and replay. | §0.8 · DL-486 |
| **FP2** | Calendar is the day picker. 1-minute download. Mini chart **fills as it downloads**. | §0.3–4 · ATM-C1 · ATM-D3 |
| **FP3** | Full cash day = **390** candles or closes. Short sessions not padded. Extra index minutes **append**. | §0.12 · DL-487 · ATM-P1 |
| **FP4** | **Simple** walk = close-to-close. Default Basic. | ATM-P2 |
| **FP5** | **TPO** walk specified, **sequenced behind** simple (W4 after W1). Missing TPO = **NO TPO**. | ATM-P3 · ATM-P4 |
| **FP6** | **Basic:** GEX off, Probability off. **Enhanced:** allow both. | §0.10 |
| **FP7** | Chrome: Strikes/in **left of Autofit**; transport **dark strip, right of Autofit**; mini chart **upper-right canvas**; scrubber **draggable**. | §0.5–6, 9 |
| **FP8** | Glows: TM **blue inner blur**; What-if **red**. Blue wins if both. **Not color-only** (Echo tokens). | §0.7 · W0-3 |
| **FP9** | Server fetch. No client Massive. No invented prints. | Arch 28 · OT-EF |
| **FP10** | W1 **must not** edit `HostPnLChart.tsx` or the Autofit toolbar. W2+ chrome **behind §1.1 queue**. | This plan |
| **FP11** | Algo Demo may tick this clock (`mode: demo_timemachine`) without this board owning Algo canvas. | DL-486 · DL-488 |
| **FP12** | Not Surface §4.6 snap-rebind. Basic does not badge last-minute package IV. | AZ-ATM §2 · FI-036 |
| **FP13** | Juliet does not invent WHAT. Coach Content Law. Delta ternary. | Doctrine |

**Silent if Coach fires W0-BA without override:**

| OD | Silent default |
|----|----------------|
| **OD-TPO-GRAIN** | FI-037 stays **open**. W4 does not pick tick vs 30-min letters without a Coach DL. |
| **OD-VOL-SNAPS** | FI-036 stays **out** of W1–W3. |
| **OD-1X** | Speeds are **3 / 10 / 20** only. |
| **OD-W2** | If queue not clear: **HOLD chrome**. W1 still legal. |

---

## 4. DAG

```text
W0-0 Coach plan stamp
  → W0-1 Lima hash
  → W0-2 India (parents + §1.1 queue quotes)
       ├── W0-3 Echo (glow tokens + toolbar)
       ├── W0-4 Tango
       └── W0-5 Hotel
  → W0-G Delta
  → W0-BA Coach BUILD AUTHORITY
       → W1 math/data  → W1-G          ← no contested chrome
            └── W2-0 India lock (queue)
                  → W2 Basic chrome → Echo W2-2 → W2-G
                        → W3 Enhanced → W3-G
            └── W4 TPO (after W1-G; may ∥ W2 if no HostPnLChart steal)
       → W5 Kilo (after W2-G; W3/W4 if fired)
       → W6 Lima
  → W-G Delta
```

W1 does **not** wait for Packet A / algo W4 / C2.  
W2 **does**.

---

## 5. Packets

### 5.1 W0 — review (no code)

| Seed | Agent | Fire |
|------|-------|------|
| `W0-0-coach-plan-stamp.md` | Coach | First |
| `W0-1-lima-hash.md` | Lima | After W0-0 |
| `W0-2-india-parents.md` | India | After W0-1 |
| `W0-3-echo.md` | Echo | After W0-2 |
| `W0-4-tango.md` | Tango | After W0-2 |
| `W0-5-hotel.md` | Hotel | After W0-2 |
| `W0-G-delta.md` | Delta | After W0-2…5 |
| `W0-BA-coach-build-authority.md` | Coach | After W0-G |

### 5.2 W1 — math / data (no contested chrome)

| Seed | Agent | Files | ATs |
|------|-------|-------|-----|
| `W1-1-alpha-day-fetch.md` | Alpha | `server/routes/algo_replay.py` · `server/market_data/algo_replay_path.py` · pytest | ATM-D1, D2, AT-ATM-13, 15 |
| `W1-2-charlie-playhead.md` | Charlie | `web/lib/options-lab/algoDayReplay.ts` (+ tests). **No UI.** | ATM-P1, P2, playhead, AT-ATM-5, 16 |
| `W1-G` | Delta | W1 diff must **not** contain `HostPnLChart.tsx` or Autofit-strip chrome | W1-G |

**Must implement:** calendar-day 1-minute Massive (or SSR marks) **on the server**; 390 closes (honest short); **close-to-close** cursor; speeds 3/10/20 without jump; named **NO PATH** / **WAITING**.

**As-built sketch** (`algo_replay` 5m fallback) is **not law** — W1 replaces 5m with **1m**.

### 5.3 W2 — Basic chrome (after queue)

| Seed | Agent | Files | ATs |
|------|-------|-------|-----|
| `W2-0-india-lock.md` | India | No code. Re-quote §1.1. | lock |
| `W2-1-charlie-chrome.md` | Charlie | `OpfRiskAnalyzer.tsx` **strip** · mini-day HUD · glow overlay. `HostPnLChart.tsx` **only if W2-0 names it** (region / no pan steal). | 1–7, 9–11, 13–16 |
| `W2-2-echo.md` | Echo | Glow tokens + HIG | FP8 |
| `W2-G` | Delta | Basic: GEX/Prob **forced off** | W2-G |

### 5.4 W3 — Enhanced

| Seed | Agent | Files | ATs |
|------|-------|-------|-----|
| `W3-1-charlie-enhanced.md` | Charlie | Mode control; GEX/Prob **allowed** | AT-ATM-8 |
| `W3-G` | Delta | Prefs restore on Basic re-entry | |

### 5.5 W4 — TPO (behind simple)

| Seed | Agent | Files | ATs |
|------|-------|-------|-----|
| `W4-1-tpo-path.md` | Alpha + Charlie (Juliet sequences; no peer-to-peer) | TPO payload + follow-path cursor. Grain = Coach DL or **NO TPO**. | AT-ATM-17 |
| `W4-G` | Delta | Simple walk still works without TPO | |

### 5.6 W5 / W6 / W-G

| Seed | Agent |
|------|-------|
| `W5-1-kilo-ats.md` | Kilo |
| `W6-1-lima.md` | Lima |
| `W-G-delta.md` | Delta |

---

## 6. Non-goals (NX)

| ID | Out |
|----|-----|
| **NX1** | MiniTwo until Coach asks |
| **NX2** | Client Massive |
| **NX3** | Surface §4.6 snap-rebind as this Basic |
| **NX4** | FI-036 chain-snap vol in W1–W3 |
| **NX5** | Inventing TPO grain (FI-037) |
| **NX6** | 5-minute bars as a 1-minute substitute |
| **NX7** | Padding short sessions to 390 |
| **NX8** | Relabeling What-if knobs “Time Machine” |
| **NX9** | Jumping chrome ahead of Packet A W-G · algo W4 · C2 |
| **NX10** | MSC / thinkorswim source copy |
| **NX11** | Product code before W0-BA |
| **NX12** | Closing / Tradier from replay |

---

## 7. AT → packet map

| AT | Packet |
|----|--------|
| AT-ATM-13, 15 (fetch / 390) | W1 |
| AT-ATM-5, 16 (speed / close-to-close) | W1 |
| AT-ATM-1…4, 6, 7, 9–11, 14 | W2 Basic chrome |
| AT-ATM-8 | W3 |
| AT-ATM-12 (Demo clock) | W1 playhead + algo board consumes |
| AT-ATM-17 | W4 |
| All 1…17 evidence | W5 · W-G |

---

## 8. Characterization (Kilo)

Prefer **pure path/clock** fixtures (`algoDayReplay.test.ts`, pytest `test_algo_replay_path.py`). Do not scrape canvas pixels for the playhead.

**Must-have (W1):**

1. Full cash fixture = **390** closes; early-close fixture **< 390**, not padded.  
2. Playhead steps **close to close** only.  
3. 3×: 1 wall-second → 3 session-seconds; speed change does not jump.  
4. Empty/holiday → **NO PATH**.  
5. Fetch path does not originate from the browser to Massive.

**W2:** mini chart count grows during a stubbed progressive download; scrubber seek matches sample `t_ms`; `data-glow=timemachine` / `whatif`.

---

## 9. Files

| Path | Packet |
|------|--------|
| `server/market_data/algo_replay_path.py` · `server/routes/algo_replay.py` | **W1** |
| `web/lib/options-lab/algoDayReplay.ts` + `.test.ts` | **W1** |
| `web/lib/options-lab/algoReplayApi.ts` | W1 |
| `OpfRiskAnalyzer.tsx` dark strip + glow | **W2** (after W2-0) |
| Mini-day HUD component | **W2** |
| `HostPnLChart.tsx` | **W2 only if W2-0 names it** — never W1 |
| TPO loader | **W4** |

---

## 10. Coordination

| Board | Rule |
|-------|------|
| `p-az-viewport-2d` | **Packet A W-G first** in the HostPnLChart queue. Do not steal pan. |
| `p-az-algo` | **W4-G second.** This board does not paint algo verticals. Demo may read the playhead. |
| `p-alerts` | **C2 third.** Do not implement threshold apply. |
| `p-az-viewport-return` | No product code here. |
| `p-az-what-if-tm` | Inspector What-if stays that board’s knobs. |

### 10.1 Neighbor snapshot (plan landing 2026-08-20 — not a skip of W0-2 / W2-0 live quotes)

Quoted from those boards (not this table as SoR):

| Neighbor | Artifact | Excerpt |
|----------|----------|---------|
| `p-az-viewport-2d` | `ORCHESTRATOR.md` | W-G **BLOCKED**. Phase-order **W1-1 in flight**; Status table still **Packet A Not fired**. Packet B BLOCKED. |
| `p-az-algo` | `ORCHESTRATOR.md` · `gate-reports/W4-0-india.md` | W1–W3 **PASS**. **W4 HOLD** — live scope on `HostPnLChart.tsx`. |
| `p-alerts` | `ORCHESTRATOR.md` | C1 **PASS**. **C2-0 BLOCKED** (viewport W-G unfiled). |
| `p-az-viewport-return` | `ORCHESTRATOR.md` | Product code **Forbidden**. W0-G BLOCKED. |

**Implication at landing:** W1 (math/data) is the only implementation packet that can be BA’d without waiting. **W2 chrome is HOLD** until the §1.1 queue moves.

---

## 11. Changelog

| Ver | Date | Notes |
|-----|------|--------|
| **v1.0** | 2026-08-20 | Full bench: W0 India/Echo/Tango/Hotel → W1 math/data (390, close-to-close, 1m fetch, playhead) → chrome **behind** Packet A W-G · algo W4 · C2 → Basic then Enhanced → TPO last. Echo glow tokens. Coach stamp gates. **DL-489**. |
