# FatTail Labs — Options Chain Picker Spec v1.0

**Status:** **RATIFIED** — Coach GO 2026-08-10 (DL-279…280); program Z-G PASS  
**Date:** 2026-08-10  
**Current revision:** **v1.0.1**  
**Type:** Product / UX / architecture authority — **member options chain ladder**: symbol + expiry pickers, vertical strike table, live quote diffs  

**As-built paths (v1 land):**

| Layer | Path |
|-------|------|
| UI | `web/app/app/market/chain-ladder/page.tsx` · route `/app/market/chain-ladder` |
| Client | `web/lib/chainLadderApi.ts` · `web/lib/capitalApi.ts` (`fetchMarketUniverse`) |
| API | `server/routes/chain_ladder.py` |
| Domain | `server/market_data/chain_ladder.py` · `server/market_data/massive_client.py` |
| Tests | `server/tests/test_chain_ladder.py` |

**Parents / companions (normative where noted):**

| Spec / doc | Role |
|------------|------|
| Admin **market symbol universe** (migrations 084–087 · `market_symbol_universe`) | **Sole product-symbol SoR** for the picker |
| [Architecture/18 — Shared live marks stream](../Architecture/18-shared-live-marks-stream.md) | Marks SoR · **proxy doctrine** (SPY/VIXY labeled `massive_proxy_v1`) · shared generation pattern (S-3) · VIX1D as daily-decision reference |
| Architecture/09 — Tradier / chain-store doctrine (as cited) | ChainStore-first historical tools; Labs-owned Massive chain pollers (`chain_collector`) — **build on existing collectors**, do not invent a fourth orphan process without checking |
| Strategy Lab **Curate** surface Spec / as-built | Universe picker patterns · VIX1D first-class for 0DTE/daily decisions |
| Visualize AI Spec / Architecture 21–22 | Chain tools prefer ChainStore-first; closed tool catalog — ladder is a **member surface**, not Visualize tool law, but shares Massive client discipline |
| Positions View / Capital | No second valuation store; display never demand |
| **Not** MarketSwarm-Canonical heatmap | Explicitly **out** — no butterfly surface, no MSC pipeline, no shared MSC code |

**Access (DL-194 matrix — one row, fail loud):**

| Role / entitlement | Chain ladder read |
|--------------------|-------------------|
| Paid tool member (Activator / Navigator and equivalents that pass `_require_tool_member` read) | **Allowed** |
| Observer on active trial (≡ Navigator for tool surfaces per DL-194) | **Allowed** when tool-member gate says so |
| Free / no-plan / unauthenticated | **Denied** (401/403) — never soft-empty |

Exact gate implementation reuses existing `require_session` + `_require_tool_member(capability="read")` — **same matrix as other member tool surfaces**, not a new role invention.

**Nav placement (ratify at GO — DL-232 lesson):**

| Choice | Meaning |
|--------|---------|
| **Default for v1** | Route stays `/app/market/chain-ladder` as the first surface of a **Market / options analyzer** area (not a Practice suite pill, not a Strategy Lab tab). |
| **Not** | Suite chrome tab that fights Design sub-nav (DL-232 Symbols fight). |

Subsequent analyzer surfaces (e.g. smile, term structure) **inherit this parent area** rather than inventing new homes. Echo/India may rename “Market” → “Analyzer” at ratification without changing OC laws.

**Doctrine:** Standalone repo · config fail-loud · Family B · no MSC · display never demand · no profit theater · evidence over assertion · **diff updates, not page reloads** · **proxy marks never silently scale into strike math**.

**Human interface:** [Human Interface Spec v1.0](./FatTail-Labs-Human-Interface-Spec-v1.0.md) (**Apple HIG for Labs web**) binds **all** member chrome for this surface — including preliminary design packs used as build authority. Clarity · deference · depth · consistency · feedback · ≥44×44 pt targets · keyboard · focus · reduced motion · WCAG AA. Kit primitives only; no invent tokens. Bench: Echo owns HIG; Charlie implements.

**Bench:** [`docs/Options-Chain-Picker-Full-Agent-Bench-Plan-v1.0.md`](../docs/Options-Chain-Picker-Full-Agent-Bench-Plan-v1.0.md) · board `agents/p-options-chain-picker/`.

**Content hash (document control):**  
`sha1(canonical_bytes_of_this_file_at_publish) → record at ratification` — standing hygiene after byte-identical upload incidents. Implementer records hash in gate report / DL when Spec is ratified.

---

## 0. Mission

Give members a **simple, honest options chain panel**: pick a symbol from the **same Admin universe** used for marks, pick among the **next three distinct listed expirations** for that name, see a **vertical strike ladder** within a **±σ of spot** band, with **spot highlighted** and a **small table of market fields** (price, size, greeks) per strike.

Quotes **update in place**. When the market moves, **only strikes whose fields actually changed** repaint. The full page never reloads; the full chain table is never rewritten on a quiet poll.

**What this is not:** MSC convexity heatmap, strategy tile surface, or always-on multi-worker Redis pipeline. This is a **chain reader + picker**, not a convexity discovery engine.

---

## 1. Laws

| ID | Law |
|----|-----|
| **OC1 — Universe SoR** | Selectable product symbols are exactly the **enabled** rows of `market_symbol_universe` (Admin Symbols). No parallel hard-coded symbol list on the ladder. Disabled or unknown symbols → **422** with clear copy to Admin. |
| **OC2 — Feed + spot resolution (proxy-safe)** | **Chain feed:** Massive options path uses `feed_symbol` when set (e.g. `I:SPX`); else product `symbol` (e.g. `AAPL`). **Spot for band center and nearest-strike highlight** is resolved in this **strict order**: (1) **underlying price on the Massive options snapshot** for that fetch (as-built field: `underlying_asset.value` — correct index scale, no proxy ambiguity); (2) only if absent, `market_live_marks` mid for the **product** symbol **when `source` is not a proxy** (not `massive_proxy_v1` / not labeled proxy); (3) else **503** with honest copy that index/native spot is unavailable — **never** use a proxy mid for strike math, **never** silent scale (SPY×10 forbidden). Proxy marks remain lawful for other surfaces with UI `~` markers; they are **not** lawful ladder spot. |
| **OC3 — Distinct expirations** | “Next three contracts” means the next **three distinct listed expiration dates** on/after today for that underlier — **not** three calendar days. SPX may list every session; some equities only Mon/Wed/Fri or Fridays only. The list is name-specific. |
| **OC4 — Default nearest** | On symbol load (and symbol change), default expiry = **nearest upcoming** distinct listed date. DTE = calendar days from today to that date (0 = 0 DTE). |
| **OC5 — Vertical ladder + band** | Strikes render **top-to-bottom** (ascending strike). Spot’s nearest strike is highlighted. Band = ±σ × expected move over a **non-degenerate time factor** (see OC5a). |
| **OC5a — Vol tenor + proxy vol ban (Hotel)** | **Proxy vol marks are never valid σ inputs.** If VIX / VIX1D mark `source` is proxy (e.g. `massive_proxy_v1`, VIXY dollars) → **ignore** and use the **domain fallback band** (honest non-vol geometry). **Tenor:** for DTE **0–1**, prefer **VIX1D** (platform daily-decision reference, Arch/18 · Curate) when a **non-proxy** mark exists; otherwise non-proxy **VIX**; otherwise fallback. **Time factor:** never use √0 — effective days for √T = **max(1, dte)** calendar days (or Hotel-ratified session fraction), so 0DTE never collapses to a zero-width empty band. |
| **OC6 — Field set (v1 display)** | Right of strike, show at least: **mid, bid, ask, volume, open interest, delta, IV**. Full snapshot may carry gamma/theta/vega for model/export; v1 grid may show a subset without discarding the rest from the API row. |
| **OC7 — No full page refresh** | Client never `location.reload` for quote updates. Controls change → reset local state and request a **full** ladder once; thereafter **poll**. |
| **OC8 — Diff on change** | Poll responses are one of: `unchanged` · `diff` (upserts + removes by strike) · `full`. UI applies **only** changed strike rows (and spot-highlight moves). Quiet polls do **zero** row work. |
| **OC9 — Change definition** | A strike “changed” if any of mid, bid, ask, volume, OI, delta, gamma, theta, vega, IV, ticker, or `is_spot` differs. Content hash ignores pure clock `as_of`. **Note:** volume is often monotonic in RTH, so `unchanged` may be rare on liquid names — protocol still saves work vs full rewrites. A future OD may tier volume/OI to a slower change class; **v1 leaves OC9 as stated**. |
| **OC10 — Side is a control** | Call and put are selectable. One side on the grid at a time in v1 (not dual call/put columns unless a later Spec amends). |
| **OC11 — Preformed calendar (staged, required for v1.1)** | **Target law:** listed next-N expirations for each universe symbol are **stored at Admin / platform level** and **read** by the ladder. Live Massive discovery of the full expiry calendar is **not** the steady-state hot path. **v1 land may still discover live** until preform ships. **v1.1 acceptance requires preform** — Delta **must** ternary on preform land; the gate is **not** optional (“if built”). Prefer extending **existing** Labs chain infrastructure (`chain_collector` / ChainStore / `massive_client`) over standing up an unrelated fourth process. |
| **OC12 — Live quotes stay live** | Preformed data is **calendar + feed geometry** (expiries, optional strike step). Bid/ask/mid/volume/OI/greeks/IV remain **live** Massive snapshot for the **selected** expiry × band. Do not freeze quotes into Admin. |
| **OC13 — No MSC** | No import of MarketSwarm-Canonical code, heatmap builders, or MSC Redis protocol. Labs Massive client + Labs MySQL marks/universe only. |
| **OC14 — Fail loud** | Missing Massive key, missing **usable** spot (OC2), or empty universe → explicit error, not an empty silent grid pretending to be healthy. **Present-but-proxy** spot is **not** usable (OC2) — same fail class as missing for strike math. |
| **OC15 — Shared upstream fetch (scale)** | **One Massive chain snapshot fetch per `(feed_symbol, expiration)` (and fetch generation) per server TTL window** — not one upstream call per member poll. Side / σ / band / diff hash are applied **from the shared cached snapshot**. N members polling the same contract share one generation (Arch/18 S-3 · Process Runtime shared-generation doctrine). Client poll interval remains ~2s; **upstream** rate is TTL-bounded. Legislated in **v1.0**; implementation may land with the first multi-member hardening pass but **must not** be designed as per-member Massive hammering. |

---

## 2. Surfaces

### 2.1 Member — Chain ladder (`/app/market/chain-ladder`)

| Control | Behavior |
|---------|----------|
| **Symbol** | Dropdown of enabled Admin universe symbols (label may show kind + feed). Changing symbol reloads next-3 expiries and defaults to nearest. |
| **Contract (next 3)** | Exactly up to **three** distinct listed expirations for that symbol. Labels include **date · N DTE**. |
| **Side** | Call \| Put |
| **Sigma** | Band width multiplier (default **2**); vol inputs per OC5a. |
| **Header meta** | Product · DTE · spot (source honest if needed) · band · content hash / last patch · as-of |
| **Grid** | Vertical strikes; spot row highlighted; fields per OC6; flash optional on patched rows only |

### 2.2 Admin — Symbol universe (existing + staged)

| Concern | Law |
|---------|-----|
| **CRUD** | Existing Admin market universe is SoR for which names exist. |
| **Validate** | Existing Massive validate on create/edit stays. |
| **Staged: chain calendar** | On save/validate and/or scheduled refresh (prefer `chain_collector` / shared Massive client), platform writes **next listed expirations** (and optional strike step). Ladder prefers that store (OC11). |

---

## 3. Data model

### 3.1 Product identity

| Concept | Source |
|---------|--------|
| Product symbol | `market_symbol_universe.symbol` |
| Chain feed | `feed_symbol` if non-null, else `symbol` |
| Spot (strike math) | **OC2 order** — chain `underlying_asset.value` first; non-proxy marks second; else 503 |
| Vol for σ | **OC5a** — VIX1D (0–1 DTE) / VIX non-proxy only; else domain fallback |

### 3.2 Expiration contract (picker row)

```text
{
  "expiration": "YYYY-MM-DD",
  "dte": <int ≥ 0>,
  "label": "<date> · <n> DTE" | "<date> · 0 DTE"
}
```

Default: first of the next-three list (`default_expiration`).

### 3.3 Ladder row (strike)

| Field | Notes |
|-------|--------|
| `strike` | Key for identity and diff |
| `is_spot` | Nearest strike to **OC2 spot** |
| `mid` · `bid` · `ask` | Quote |
| `volume` · `open_interest` | Size |
| `delta` · `iv` | Display greeks / vol (v1 grid) |
| `gamma` · `theta` · `vega` | Carried when vendor supplies |
| `ticker` | Vendor contract id when present |

### 3.4 Poll protocol

| Mode | When | Client action |
|------|------|----------------|
| **full** | No `since_hash`, or first load after control change | Replace all local strike rows |
| **diff** | Prior hash known; some strikes/meta moved | Upsert/remove only those strikes; update spot meta |
| **unchanged** | Content hash equal | No row mutations |

Client poll interval: **~2s** recommended. **Upstream** Massive rate: **OC15** shared TTL generation.

### 3.5 Preformed calendar (v1.1 — **required** for v1.1 acceptance, OC11)

| Field | Meaning |
|-------|---------|
| `next_expirations_json` | Next N distinct dates (DTE derived at read for “today”) |
| `expirations_as_of` | Last successful calendar scan |
| Optional `strike_step` | e.g. 5 SPX, 1 equity |

**Refresh:** Admin save/validate · scheduled job aligned with **`chain_collector`** where possible · ladder fallback if stale/missing (one live scan, write-through).

**Staleness:** Calendar older than one **session day** (or Coach-set TTL) is stale — re-scan, do not invent non-listed weekdays.

---

## 4. API (as-built v1)

| Method | Path | Role |
|--------|------|------|
| GET | `/api/me/market/universe?enabled_only=true` | Symbol list (shared SoR) |
| GET | `/api/me/market/chain-ladder/expirations?symbol=&limit=3` | Next distinct expiries + DTE |
| GET | `/api/me/market/chain-ladder?symbol=&expiration=&side=&sigma=&since_hash=` | Ladder full / diff / unchanged |

**Auth:** §0 access matrix (session + tool-member read).

**Errors (fail loud):**

| Case | Code |
|------|------|
| Symbol not in universe / disabled | 422 |
| Bad expiration / side | 422 |
| No **usable** spot (OC2) | 503 |
| Massive failure | 502 / 503 |

Prefer `symbol=` (product key). Legacy `underlier=` may alias resolution only.

**Response honesty:** Ladder payload **should** include `spot_source` (`chain_underlying` \| `marks_native` \| …) so UI/ops can audit proxy avoidance.

---

## 5. As-built honesty (2026-08-10)

| Area | Status vs this Spec |
|------|---------------------|
| Vertical ladder UI · symbol from Admin universe · side · sigma | **Landed** |
| Next **3** distinct expirations · DTE labels · default nearest | **Landed** (live Massive discovery per symbol) |
| Poll modes full / diff / unchanged · row-level apply | **Landed** |
| Spot from **product marks only** (pre-v1.0.1) | **Defect vs OC2** if proxy mid used for SPX/XSP — **must heal** to chain underlying / non-proxy / 503 |
| VIX mark without proxy filter | **Defect vs OC5a** if VIXY dollars used as vol — **must heal** |
| Shared Massive generation (OC15) | **Partial** — short in-process TTL exists; law requires **generation by (feed, expiry)** shared across members (legislated now) |
| Preformed Admin expiry calendar (OC11) | **Not built** — **required** for v1.1 acceptance (not optional) |
| Dual call/put columns · multi-expiry surface · heatmap tiles | **Out** |
| MSC heatmap parity | **Forbidden** (OC13) |

---

## 6. Implementation order

### 6.1 v1 maintain / heal (blocking correctness)

1. **OC2 heal:** spot from chain `underlying_asset.value`; reject proxy marks for strike math.  
2. **OC5a heal:** non-proxy VIX1D (0–1 DTE) / VIX; fallback band; `max(1,dte)` time factor.  
3. **OC15:** document + implement shared fetch generation per `(feed_symbol, expiration)`.  
4. Keep universe symbol + next-3 picker + row diffs.

### 6.2 v1.1 (preformed calendar — **required**)

1. Schema + Admin/job (prefer `chain_collector` alignment).  
2. Expirations endpoint: store-first.  
3. Delta **must** ternary PASS on preform evidence — no “if built” hedge.

### 6.3 Explicit non-goals (v1)

- Butterfly / convexity heatmap tiles  
- Always-on multi-Hz quote bus for entire SPX surface  
- Broker order ticket from ladder cells  
- Storing live quotes in Admin  
- Profit/P&L coloring on chain cells  
- Silent proxy scaling into strike or σ math  

---

## 7. Acceptance (Kilo)

1. Symbol dropdown lists only **enabled** Admin universe symbols.  
2. Unknown/disabled symbol → 422.  
3. Next three are **distinct listed** dates for that name — never invent non-listed weekdays.  
4. Default expiry is nearest of those three; DTE matches calendar math for “today.”  
5. Changing symbol reloads the three and selects the new nearest; DTE header updates.  
6. Grid is vertical; nearest strike to **OC2 spot** is highlighted.  
7. Display includes mid, bid, ask, volume, OI, delta, IV (or honest em-dash if vendor null).  
8. Quiet content hash → `unchanged`; UI does not rewrite all rows.  
9. One strike mid moves → `diff` upserts that strike only (plus any spot-flag move).  
10. No full browser navigation/reload for quote updates.  
11. No MSC imports or MSC heatmap Redis keys.  
12. **With only SPY proxy mark for SPX and no chain underlying price → 503 (or successful spot from chain underlying when Massive returns it)** — never SPY-scale band/highlight.  
13. **Proxy VIXY mark never widens/narrows band as if it were VIX%** — fallback band used.  
14. **0 DTE band is non-empty** (time factor floor).  
15. **v1.1:** Preformed calendar present and fresh → expirations path does not require full multi-page discovery; Delta PASS requires this evidence.

---

## 8. Review gates

| Holder | Focus |
|--------|--------|
| **Coach** | Ratify OC2/OC5a/OC15; nav parent name; OC11 mandatory v1.1 |
| **India** | Universe SoR; proxy detection on marks; preform schema; shared generation keying |
| **Hotel** | OC5a sentence (proxy vol ban · VIX1D 0–1 · √T floor) — **must sign** |
| **Alpha** | OC15 shared fetch; Massive filters; `spot_source` on payload |
| **Echo** | Market/Analyzer IA; next-3 labels; DTE header |
| **Charlie** | Memoized rows; no full-table thrash |
| **Tango** | 503 copy for missing/proxy spot; 0 DTE wording |
| **Mike** | Access matrix parity with other tool surfaces |
| **Kilo** | §7 including 12–15 |
| **Delta** | Ternary on heal (OC2/OC5a) and **mandatory** OC11 preform for v1.1 — **no optional hedge** |

---

## 9. Review fold — external Spec review 2026-08-10

| # | Finding | Disposition |
|---|---------|-------------|
| **1 Blocking** | OC2 product marks vs proxy scale (SPY mid on SPX) | **Folded** — OC2 rewrite: chain underlying first; ban proxy for strike math; 503 if no usable spot |
| **2 Blocking** | VIXY dollars as VIX% | **Folded** — OC5a: proxy vol never σ input; VIX1D for 0–1 DTE; √T floor |
| **3 Scale** | Per-member 2s Massive | **Folded** — OC15 shared generation law (legislate v1.0; implement ASAP) |
| **4 Band** | 0DTE + VIX1D | **Folded** — OC5a tenor + time floor |
| **NB** | Volume thrash on OC9 | Noted under OC9 — no law change v1 |
| **NB** | chain_collector reuse | Folded into OC11 |
| **NB** | Access matrix | Folded §0 |
| **NB** | Nav / analyzer parent | Folded §0 default |
| **NB** | Delta “if built” hedge | **Struck** — OC11 + §8 Delta mandatory |
| **NB** | Content-hash footer | Folded header hygiene |

---

## 10. Document history

| Version | Date | Change |
|---------|------|--------|
| **v1.0.1** | 2026-08-10 | External review fold: OC2 proxy-safe spot; OC5a vol tenor + proxy ban; OC15 shared fetch; access matrix; nav parent; OC11 mandatory Delta; as-built defects named; acceptance 12–15. HIG/HI Spec binding + full agent bench plan pointer. |
| **v1.0** | 2026-08-10 | Initial Spec from as-built chain ladder + staged preformed calendar; anti-MSC scope. |

---

*Pick a name from Admin. Pick one of the next three listed expiries. Spot and σ use true scale — never a quiet proxy. Only the strikes that moved change. Calendar preform is required for v1.1, not optional.*
