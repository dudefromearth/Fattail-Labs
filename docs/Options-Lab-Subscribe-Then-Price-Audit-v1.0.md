# Options Lab — Subscribe-then-price audit v1.0

**Date:** 2026-08-17  
**DL:** **DL-419** (live sheet local) · **DL-420** (this audit)  
**Coach (verbatim):** *“As a general rule, we do not want to go to the server for something that can easily be done in the browser.”* *“This is why we developed the SSE gateway and subscribe to it with the client, so that we can get what we need from the server and do the rest in the client.”*

**Intended design (this product):** the client **subscribes** to the Market Bus generation (listed exp, strikes, mids, IVs). The browser **prices, slices, and draws**. The server does **not** recompute a book curve the client already has the inputs for.

**As-built transport (India, not a Coach deletion):** Coach said “SSE gateway.” Labs as-built is Market Bus **one WebSocket** per tab (`/api/me/market/stream` · `MarketSocket` · Arch **28**). Arch **30** is explicit: **not SSE** for chain generations. The doctrine is the same subscribe plane. This audit does **not** propose a second SSE.

---

## 1. Pattern (the law)

| Server | Client |
|--------|--------|
| Hold / publish the generation (feeds → Redis → one stream) | Subscribe once per tab |
| Universe, session posture, interest budget, lock, archive | Price the live sheet (BSM on listed IVs) |
| Package SoR that needs epoch / skew / mark_mode (until portable) | Heatmap cell math, GEX, 3D sheet, 2D curves |
| Persistence (book, alerts, designs) | Draw last paint |

**Fail loud:** missing listed IV → named hole. Never invent. No client Massive. No second socket.

---

## 2. Verdict

**The live Analyzer curve now follows the pattern** (DL-419). Working and Away share `resolveLocalBookCurves`. `/api/me/pricing/resolve` is **off** that clock.

**The subscribe side is not yet one path.** Heatmap uses the Market Bus socket. Analyzer keep-warm, Position Builder, and card package quotes each **HTTP-poll** the same ladder. That is the remaining break: three (plus) clients asking the server for a generation the tab already has a stream for.

---

## 3. Instance register

Severity: **high** = live tick asks the server to compute or re-fetch what the subscribe plane already holds. **med** = lawful today but should share the one generation. **ok** = intended server work. **out** = not this pattern.

### 3.1 Follows the pattern (after DL-419)

| ID | Surface | What it does | Verdict |
|----|---------|--------------|---------|
| **OK-1** | Analyzer 2D / Surface 3D sheet | `resolveLocalBookCurves` · `evaluatePnlAtSpot` on held IVs | **Follows.** Engine `local.bsm_european`. |
| **OK-2** | Heatmap cells / GEX / fly debit | `web/lib/options-lab/templates/pricing.ts` on `useOptionChainBus` rows | **Follows.** Subscribe + local mid math. |
| **OK-3** | Underlier mids | `useLiveUnderlierMarks` + one `MarketSocket` | **Follows** Arch 28 §4.4. |
| **OK-4** | Heatmap chain | `useOptionChainBus` — WS push, HTTP hydrate-if-empty / one-shot refresh, **no interval** | **Follows** subscribe. This is the reference client. |

### 3.2 Breaks the pattern (flagged)

| ID | Surface | File | What it does today | Why it breaks | Severity |
|----|---------|------|--------------------|---------------|----------|
| **BR-1** | Analyzer keep-warm / Working tick | `web/lib/options-lab/useOpfRiskGraph.ts` `resolveAndCache` | Every 2.5s / 5s **`pollChainLadder` HTTP** per shown expiration, then local sheet | Generation is already on Market Bus. Heatmap already subscribed. Analyzer re-pulls Redis via HTTP as if there were no stream. | **high** |
| **BR-2** | Position Builder chain | `web/lib/options-lab/useBuilderChain.ts` | **`setInterval` 3s** `pollChainLadder` for every warm expiration | Second HTTP poller for the same generation. Does not call `MarketSocket.setChainInterest`. | **high** |
| **BR-3** | Card package quotes | `web/lib/options-lab/usePackageQuotes.ts` | On settle: **another** `pollChainLadder` + `POST /package-quote` | Hydrate should reuse the subscribed generation (BR-1/2). Package POST is a separate SoR question (BR-4). | **high** (hydrate) |
| **BR-4** | Card package debit | same · `quoteOpfPackage` | Server PackagePricer (epoch, skew, mark_mode, mid natural) | Debit is ∑ qty × listed mid — the client has the mids. Epoch/skew/mark_mode are the only server-shaped facts. Today we ship the whole quote to the server. | **med** |
| **BR-5** | Dead API | `opfPricingApi.resolveOpfPricing` | Still defined; **no live caller** after DL-419 | Not a live break. Leave for lock/RECON; do not re-wire the clock to it. | **low** |

### 3.3 Lawful server (do not “fix” into the browser)

| ID | Surface | Why the server stays |
|----|---------|----------------------|
| **SV-1** | `fetchLadderExpirations` | Listed calendar / DTE horizon. Not a curve. |
| **SV-2** | `touchOpfInterest` | Shared generation budget (OD-PF10). |
| **SV-3** | Session/Print `fetchPlanePosture` (~10s) | Plane Live vs Held. Idle work (OD-KW-2). |
| **SV-4** | Volume Profile OHLC `refreshSeriesLive` | Bars, not chain IVs. Separate plane. |
| **SV-5** | OPF lock / RECON / outlook·backtest packs | Named server packs when those modes run. Not the live day-trade picture. |
| **SV-6** | Book / alerts persistence | Member data, not market math. |
| **SV-7** | Strategy Lab Curate `tick` | Bot process, not Analyzer sheet. |

### 3.4 Out of scope

Trade log, journal, enrollments, courses, admin. Those APIs are persistence and identity — not the subscribe-then-price plane.

---

## 4. Cost of the remaining break (BR-1…3)

One seated member, one shown structure, one expiration, Analyzer + Builder + Heatmap open:

| Path | Before DL-419 | After DL-419 (now) | Intended |
|------|---------------|--------------------|----------|
| `/resolve` / min | 24 | **0** | 0 |
| Ladder HTTP / min | Analyzer 24 + Builder 20 + quotes on settle | **same HTTP** | **0** on the clock (WS deltas) |
| Local 161-pt sheets / min | 0 | 24 | 24, on WS patch or 2.5s, **no extra server** |
| Market WebSockets / tab | 1 (Heatmap) | 1 | 1 — Analyzer/Builder **join it** |

DL-419 removed the engine bill. The **generation** is still pulled three ways.

---

## 5. Remediation plan

### Phase A — done (this session · DL-419)

- [x] Live 2D/3D sheet = `resolveLocalBookCurves` on held listed IVs  
- [x] Working and Away share that path (AZ-KW-10)  
- [x] `/resolve` off the keep-warm / Working clock  
- [x] `generation` is a truth IV source (Surface still binds)  
- [x] Characterization: 161 pts · IV NO · NOT TRADED · hook has no `resolveOpfPricing`

### Phase B — one generation subscriber (next packet)

**Goal:** Heatmap, Analyzer, Builder, and package hydrate read **one** in-tab generation store fed by `MarketSocket`.

1. Extract the ladder map from `useOptionChainBus` into a **module store** (symbol+exp+wings → `LadderFull`), interest-counted like `setChainInterest`.  
2. `useOpfRiskGraph` **subscribes** for each shown expiration. Tick = local sheet on the store (or on WS patch). **Delete** the 2.5s/5s `pollChainLadder` loop. Keep HTTP **hydrate-if-empty** and one-shot focus refresh (same as Heatmap).  
3. `useBuilderChain` **drops** `POLL_MS = 3000`. Same store. `ensureExpiration` = register interest.  
4. `usePackageQuotes` hydrate = read the store; HTTP only if empty.  
5. Tests: one socket; no interval poll while stream is live; last paint still holds on hide.

**Acceptance:** with Heatmap + Analyzer + Builder open, Network shows **no** repeating `/api/me/market/chain-ladder` while `transport === "stream"`.

### Phase C — package debit (after B)

Local ∑ qty × listed mid on the held rows. Named `mark_mode` / epoch / skew stay honest: either port those checks with tests, or keep a **thin** server quote on **definition change only** (already atomic — not a poll). Do **not** put package-quote on the 2.5s clock.

### Phase D — labeled later

| Item | Note |
|------|------|
| SPY American CRR on the live sheet | Still `local.bsm_european`. Label deferred. |
| Outlook / surface-fit / backtest packs | Server when the member selects those packs. Not the day-trade clock. |
| Golden-vector CI vs server BSM | OD-PF6 leftover. Optional parity tests; do not block the live sheet. |

### Phase E — do not do

- Stand up a second SSE next to Market Bus.  
- Client Massive.  
- Re-attach `/resolve` “just for accuracy.”  
- Invent IVs when the row has none.

---

## 6. Packet recommendation (Juliet)

| Order | Packet | Owner | Gate |
|-------|--------|-------|------|
| 0 | Local sheet (done) | Charlie | DL-419 tests |
| 1 | Shared generation store + Analyzer/Builder join MarketSocket | Charlie · India (no second SoR) | AT: no repeating ladder HTTP on stream |
| 2 | Package hydrate from store; optional local debit | Charlie · Hotel (mark honesty) | Atomic settle still once |
| 3 | SPY CRR / pack parity | later | labeled |

Layout residual **L** stays the top **UI** packet. This subscribe packet is **data-plane** and does not fold into L.

---

## 7. Evidence (this session)

```
cd web && npx --yes tsx lib/options-lab/localBookCurves.test.ts
# 6 passed — including “keep-warm hook does not POST /resolve”
npx --yes tsx lib/risk-graph/surfaceModel.test.ts
# ok — generation IV is lawful
```

`useOpfRiskGraph.ts` contains `resolveLocalBookCurves` and does **not** contain `resolveOpfPricing`.

---

**End of Subscribe-then-price audit v1.0**
