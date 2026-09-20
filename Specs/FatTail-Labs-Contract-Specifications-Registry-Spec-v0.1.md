# Contract Specifications Registry — Spec v0.1

**Status:** DRAFT — **not BUILD AUTHORITY.** Spec to Coach before any build.  
**REQ:** REQ-009 (`artifacts/reqs/REQ-009.md`)  
**Date:** 2026-09-20  
**Home:** StudioOne symbology registry `:4011`. Member surface via the existing hop (MiniTwo / StudioTwo). No new writers. TOPO-1 intact.  
**Parents:** Symbology & Registry Service Spec v0.2.1 · Sessions (Global Session Clock) as the human Sessions *page*; **REQ-008** Sessions *service* is the calendar pointer (referenced, not duplicated here).  
**Immediate consumer:** vp-engine bin grain · chart price-axis display shape.

Coach Content Law: every law below is Coach's wording, preserved. Worked-example numbers are **cited**, not remembered.

---

## 0. Problem

The registry already knows *which* symbols exist, their roles, and (for futures) a strip of dated contracts. It does not know *what an instrument is*: tick, Big Point Value, how the price is written, which months list, which session calendar it runs, how it settles.

Consumers therefore hardcode facts. As-built graves:

| Grave | Location | Fact hardcoded |
|-------|----------|----------------|
| **SPEC-3 first grave (R0-3)** | `server/sa_dev/service.py` `contracts_for_source` — `HMUZ` + `{src}U{yr}` / `{src}Z{yr}` | Contract months / nearby synthesis. Blessed for deletion after REQ-003 AP-1. |
| Engine grain | `server/market_data/vp_engine/coverage.py` `VP_ROW = {SPY: 0.10, ES: 0.25, MES: 0.25}` | Tick / bin step. A16 already named this VP-L3 debt. |
| Display tick fallback | `web/lib/saTicks.ts` `tickFromPrices` when `vp_row` is absent | Derives a tick from prices instead of asking the registry. |

A member who wants the same facts has no standard retrieval. The engines and the trader must share one row.

---

## 1. Laws (Coach, verbatim)

**SPEC-1 One authority.** The registry serves the contract specification: tick size, tick value, Big Point Value / multiplier, price display shape (decimals vs fractional 32nds/ 64ths, display precision), contract months + periodicity, exchange + product codes, settlement style, calendar_id (Sessions ref per REQ-008), and the vendor key mapping already in SYM law. Per-root defaults with per-contract overrides only where the exchange actually differs.

**SPEC-2 Specs are cited data.** Every row versioned, as-of queryable, with the exchange citation as its PP-1 artifact — loaded from CME/CFE specs, re-runnable, never typed from memory.

**SPEC-3 No consumer hardcodes an instrument fact.** Tick, BPV, display shape, months — queried from the registry. Grep law extends: no tick-size or multiplier constants outside the service. (R0-3's hardcoded month synthesis, already blessed for deletion, is this law's first grave.)

**SPEC-4 Derived values are computed, never stored twice.** tick_value = tick_size × BPV; one arithmetic, one source.

**SPEC-5 No ACTIVE without a complete spec.** Same gate shape as SESS-6: a row missing required spec fields for its role cannot activate. Onboarding a new future = registry row + spec block + calendar pointer — data, zero code.

**SPEC-6 Member retrieval is standardized.** One read endpoint, one shape, every instrument: /v1/spec/{symbol}, as-of capable, served through the existing member hop. The same rows the engines consume — members read the system's own truth, never a parallel copy.

**SPEC-7 Presentation is a spec card.** Labs surface: symbol → card with tick size, tick value, Big Point Value, display shape, months/periodicity, session summary (from the Sessions ref, human-rendered: "Sun 6 PM – Fri 5 PM ET, daily 5–6 PM halt"), exchange, and the citation line with the spec's as-of date — provenance visible, Hotel honors. Reachable from the symbol picker and anywhere a symbol is shown.

**SPEC-8 Visibility follows registry law.** Member surface serves member-visible rows only — volume-source rows (SPY) stay invisible here as everywhere (SYM law unchanged). Roles and states govern; COMING rows may show cards marked as such.

**SPEC-9 Same truth, both audiences.** No member-only spec fields, no divergent copy: the card is a rendering of the registry row, so a correction lands everywhere at once.

---

## 2. Ideas inventory (Phase 0 — nothing dropped)

| Idea | Disposition |
|------|-------------|
| Registry is the one authority for instrument facts (SPEC-1) | **IN-SCOPE** |
| Cited, versioned, as-of, re-runnable from exchange specs (SPEC-2) | **IN-SCOPE** |
| Grep law: no tick/BPV/shape/months constants outside the service (SPEC-3) | **IN-SCOPE** |
| R0-3 month synthesis is the first grave of SPEC-3 | **IN-SCOPE** (delete on R0-3 after REQ-003 AP-1; not this spec's build) |
| tick_value derived, never stored twice (SPEC-4) | **IN-SCOPE** |
| No ACTIVE without a complete spec (SPEC-5); onboard = data, zero code | **IN-SCOPE** |
| Per-root defaults; per-contract override only when the exchange differs | **IN-SCOPE** |
| Vendor key mapping already in SYM law — not reinvented | **IN-SCOPE** |
| calendar_id points at Sessions (REQ-008); do not duplicate session tables | **IN-SCOPE** (pointer). REQ-008 spec is the calendar body. |
| Member `/v1/spec/{symbol}` via existing hop (SPEC-6) | **IN-SCOPE** |
| Spec card: tick, tick value, BPV, shape, months, session summary, exchange, citation+as-of (SPEC-7) | **IN-SCOPE** |
| Picker one-click to the card; anywhere a symbol is shown | **IN-SCOPE** |
| SPY volume-source stays invisible (SPEC-8) | **IN-SCOPE** |
| COMING rows may show cards marked COMING | **IN-SCOPE** |
| Same row for engines and members (SPEC-9) | **IN-SCOPE** |
| vp-engine: `vp_row ≡ tick_size` or named failure | **IN-SCOPE** (first engine consumer) |
| Chart price-axis precision from display shape | **IN-SCOPE** (first surface consumer) |
| Worked example ES vs MES (BPV $50 vs $5, same calendar/shape) | **IN-SCOPE** |
| Worked example ZB fractional 32nds, end-to-end, **before we ever list it** | **IN-SCOPE** as a proving fixture. **Not** a member-visible ACTIVE row until Coach lists ZB. |
| Overnight / day-trade **margin** | **OUT** — broker-variable; not in SPEC-1. |
| Options contract specs (multiplier, exercise, AM/PM settle) | **DEFERRED** — futures GO first. Options roots keep SYM roles; spec block for options is a later packet. |
| CFE products (VIX, etc.) | **DEFERRED** until listed. Loader is CME/CFE-capable (SPEC-2). |
| A Resources hub listing of all specs | **FLAGGED** — SPEC-7 names picker + “anywhere a symbol is shown,” not a new Resources child. Sessions page remains the GSC product. |

---

## 3. Scope

**In**

- Spec **block** on the registry (root defaults; optional per-contract overlay).
- Version + `as_of` + citation (exchange URL + retrieved-at).
- `GET /symbology/v1/spec/{symbol}?as_of=` (Coach's `/v1/spec/{symbol}` on the existing symbology hop — no second hop, TOPO-1 intact).
- Member spec **card** as a rendering of that JSON.
- vp-engine grain assertion + chart axis consumer.
- ES and MES filled as the first live roots (COMING until SPEC-5 + existing SYM artifacts).
- ZB as a **proving fixture** (fractional shape), `member_visible=false`, not in the picker until Coach lists it.

**Out**

- Implementing REQ-008 (Sessions calendars). This spec stores `calendar_id` only.
- Duplicating the Global Session Clock page or its exchange table.
- New Massive writers, new StudioOne ports, MiniTwo capture.
- Typing ticks from memory. Loader re-runs against the cited exchange page.
- Activating ES/MES **model** (VPS Q1 unchanged).
- R0-3 deletion itself (already blessed, gated on REQ-003 AP-1).

---

## 4. Domain model

### 4.1 Attachment

The spec block hangs on a registry **root** (ES, MES, …). Dated strip contracts inherit the root spec unless an overlay exists for that `bound_symbol`. Overlays are legal **only** when the exchange publishes a different fact for that expiry (SPEC-1). ESZ2026 does not get a private tick.

`metadata_ref` (SYM D7) is the named join. This spec **fills** that join. It does not create a second metadata store.

### 4.2 Stored fields (authority)

| Field | Type | Notes |
|-------|------|--------|
| `symbol` | string | Registry symbol (root or dated overlay key). |
| `spec_version` | int | Monotonic per symbol. |
| `as_of` | date | Calendar date the citation was true. Queryable. |
| `citation` | object | `{exchange, title, url, retrieved_at}` — PP-1 artifact. |
| `exchange` | string | `CME` · `CBOT` · `NYMEX` · `COMEX` · `CFE` · … |
| `product_codes` | object | `{globex, clearport, clearing}` as the exchange lists them. |
| `vendor_keys` | object | Existing SYM mapping (Massive / Labs identity). Not reinvented. |
| `tick_size` | decimal | Minimum price fluctuation **in quote units** (outright). |
| `big_point_value` | decimal | USD (or contract currency) per 1.0 quote unit. Coach: BPV / multiplier. |
| `display_shape` | object | See §4.4. |
| `months` | string[] | CME month codes in list order, e.g. `["H","M","U","Z"]`. |
| `periodicity` | string | `quarterly` · `serial` · `monthly` · … as the exchange lists. |
| `settlement` | string | `cash` · `physical` (exchange term). |
| `calendar_id` | string | Opaque Sessions (REQ-008) pointer. Never a copied hours table. |

**Not stored:** `tick_value`. SPEC-4: `tick_value = tick_size × big_point_value` at read.

**Not stored:** session hours, halt windows, holidays. Those live on `calendar_id`. The card's English summary is a **rendering** of that calendar (SPEC-7 example: "Sun 6 PM – Fri 5 PM ET, daily 5–6 PM halt").

Currency is USD for the worked examples; store `currency` only when a non-USD listing is onboarded (labeled **proposed**, not a Coach field).

### 4.3 Completeness (SPEC-5)

For a **price-structure** futures root to leave COMING toward ACTIVE, all of §4.2 except overlays are required, and `calendar_id` must resolve in Sessions. Missing any required field → cannot activate. Named state: `SPEC INCOMPLETE` (engine) / card badge **COMING** (member). Same shape as SESS-6.

Onboarding a new future: insert registry row + spec block + `calendar_id`. Zero code. Grep law fails the PR that adds a tick constant to land it.

### 4.4 Display shape

```json
{
  "kind": "decimal" | "fractional",
  "precision": 2,
  "fraction": { "denominator": 32, "separator": "'", "width": 2 }
}
```

| kind | Meaning | Axis / card |
|------|---------|-------------|
| `decimal` | Ordinary decimal quote. `precision` = digits after the point (ES: 2, because 0.25). | `7700.25` |
| `fractional` | Points and *n*ths. Store prices as decimal points (`115.5`); render with `separator` and `denominator`. | `115'16` = 115 + 16/32 |

`precision` for fractional is unused for the apostrophe form; denominator is the shape. Chart axis **must** ask this object, not `toFixed(2)`.

64ths (notes, some options) use `denominator: 64`. Not in the first two examples; the field carries them.

### 4.5 As-of

`GET …/spec/{symbol}?as_of=YYYY-MM-DD` returns the latest version with `as_of ≤` that date. Omit `as_of` → current. A correction is a **new version**, never an edit in place. Engines and the card read the same version.

---

## 5. Wire

Coach: one read, one shape, `/v1/spec/{symbol}`.

On the existing symbology hop (no new port, no new writer):

```
GET /symbology/v1/spec/{symbol}
GET /symbology/v1/spec/{symbol}?as_of=YYYY-MM-DD
```

Member browser (existing catch-all): `/api/symbology/v1/spec/{symbol}`.  
Labs computing hop to StudioOne `:4011` is the same path already used for universe/resolve.

**200 body (engines and card, SPEC-9):**

```json
{
  "symbol": "ES",
  "spec_version": 1,
  "as_of": "2026-09-18",
  "state": "COMING",
  "member_visible": true,
  "roles": ["price-structure"],
  "tick_size": 0.25,
  "big_point_value": 50,
  "tick_value": 12.5,
  "display_shape": { "kind": "decimal", "precision": 2 },
  "months": ["H", "M", "U", "Z"],
  "periodicity": "quarterly",
  "exchange": "CME",
  "product_codes": { "globex": "ES", "clearport": "ES", "clearing": "ES" },
  "settlement": "cash",
  "calendar_id": "cme-equity-index-globex",
  "session_summary": "Sun 6 PM – Fri 5 PM ET, daily 5–6 PM halt",
  "citation": {
    "exchange": "CME",
    "title": "E-mini S&P 500 Futures — Contract Specifications",
    "url": "https://www.cmegroup.com/markets/equities/sp/e-mini-sandp500.contractSpecs.html",
    "retrieved_at": "2026-09-18T20:42:25Z"
  }
}
```

`tick_value` is computed at serve (SPEC-4). `session_summary` is rendered from Sessions (`calendar_id`), not stored on the spec row. If Sessions has not resolved the id, `session_summary` is omitted and the card shows a named **Sessions pending** line — never invented hours.

**404** unknown symbol.  
**403/404** member asking a non-`member_visible` row (SPY): same as picker — not found, no leak.  
**422** `as_of` unparseable.

---

## 6. Member card (SPEC-7)

One card, one JSON. Fields on the card, in this order:

1. Symbol + title (registry `DISPLAY_TITLES` / name). State chip if COMING / STALE.
2. Exchange + Globex code.
3. Tick size · tick value · Big Point Value.
4. Display shape (shown as a sample quote: `7700.25` or `115'16`).
5. Months / periodicity (`H M U Z` · quarterly).
6. Session summary in trader English (Sessions render).
7. Settlement.
8. Citation line: exchange title, **as-of date**. Hotel: provenance visible; we do not paraphrase the exchange into a claim.

Reachable: symbol picker **one click** (AP-1). Also from any surface that already shows the symbol (chart chrome, utility). No second search box.

SPY: no card (SPEC-8).

ZB proving fixture: not in the picker. Card exists for engines/tests; member hop 404s it until Coach lists it.

---

## 7. Worked example 1 — ES vs MES

Same index, same tick, same session calendar, **BPV $50 vs $5**. Sibling divergence is data.

**Citation (PP-1 target):** CME Group E-mini S&P 500 Futures contract specifications (Globex **ES**). CME Active Trader product page, **Last Updated 18 Sep 2026 03:42:25 PM CT**: contract unit **$50 × S&P 500 Index**; outright minimum fluctuation **0.25 index points = $12.50**; Globex **Sunday 6:00 p.m. – Friday 5:00 p.m. ET** with daily maintenance **5:00 p.m. – 6:00 p.m. ET**; product code CME Globex/ClearPort/Clearing **ES**; quarterly listings.  
URL: `https://www.cmegroup.com/markets/equities/sp/e-mini-sandp500.contractSpecs.html`

**MES citation:** CME Group Micro E-mini Equity Index Futures FAQ — Micro E-mini S&P 500 multiplier **$5** (one-tenth of ES **$50**); outright **0.25 index points = $1.25**; Globex **MES**. Same Globex session window as the E-mini equity-index suite.  
URL: `https://www.cmegroup.com/articles/faqs/micro-e-mini-equity-index-futures-frequently-asked-questions.html`

| Field | ES | MES | Same? |
|-------|----|-----|-------|
| `tick_size` | 0.25 | 0.25 | yes |
| `big_point_value` | **50** | **5** | **no — data** |
| `tick_value` (computed) | 0.25 × 50 = **12.50** | 0.25 × 5 = **1.25** | no |
| `display_shape` | decimal, precision 2 | decimal, precision 2 | yes |
| `months` | H M U Z | H M U Z | yes |
| `periodicity` | quarterly | quarterly | yes |
| `settlement` | cash | cash | yes |
| `calendar_id` | `cme-equity-index-globex` | `cme-equity-index-globex` | **yes — same Sessions ref** |
| `session_summary` | Sun 6 PM – Fri 5 PM ET, daily 5–6 PM halt | *same string* | yes |
| `product_codes.globex` | ES | MES | no |

AP-1: member opens ES, sees **$50** BPV and **$12.50** tick value; opens MES, sees **$5** where ES said **$50**. One calendar, two rows.

**Loader note:** ES lists more quarterly expiries than MES on the exchange page (ES “21 consecutive quarters” on the 2026-09-18 Active Trader cut; MES “five concurrent” in the CME FAQ). That is **listed horizon**, not tick/BPV. Store it only if we add a field; it is **not** required for SPEC-1 completeness. Do not hardcode 21 vs 5 in a consumer.

---

## 8. Worked example 2 — ZB (fractional 32nds)

Proves `display_shape` before ZB is ever a picker row.

**Citation (PP-1 target):** CME Group U.S. Treasury Bond futures contract specifications (Globex **ZB**, CBOT). Contract unit **face value $100,000**; price quotation **points and fractions of points, par = 100**; minimum fluctuation **1/32 of a point = $31.25** (outright); calendar-spread increment **1/4 of 1/32 = $7.8125** (not the outright tick); settlement **deliverable**; Globex **ZB**.  
URL: `https://www.cmegroup.com/markets/interest-rates/us-treasury/30-year-us-treasury-bond.contractSpecs.html`

| Field | ZB |
|-------|----|
| `tick_size` | 0.03125 (= 1/32 point) |
| `big_point_value` | 1000 (USD per 1.0 point; 32 ticks × $31.25) |
| `tick_value` (computed) | 0.03125 × 1000 = **31.25** |
| `display_shape` | `{ "kind": "fractional", "fraction": { "denominator": 32, "separator": "'", "width": 2 } }` |
| Sample render | store `115.5` → card/axis **`115'16`** |
| `months` | H M U Z |
| `periodicity` | quarterly |
| `settlement` | physical |
| `calendar_id` | `cbot-treasury-globex` (Sessions; not the equity-index calendar) |
| `member_visible` | **false** until Coach lists ZB |

Outright tick is **1/32**, not the spread tick. Consumers that need spread increments ask a later overlay; v0.1 serves the **outright** spec.

End-to-end proof (tests, not a member row): registry JSON → `tick_value` arithmetic → axis formatter emits `115'16` → card shows the same string. If the formatter uses `toFixed`, the AT fails.

---

## 9. Immediate consumers

### 9.1 vp-engine bin grain

For every futures root the engine bins (today: ES, MES):

```
assert spec.tick_size == vp_row   # else named failure SPEC_GRAIN_MISMATCH
```

Evidence artifact at build: table of root, `tick_size`, current `VP_ROW`, pass/fail. After land, `VP_ROW` **dies** (SPEC-3). SPY is not a future; its 0.10 remains a separate options/ETF grain until an options spec packet.

### 9.2 Chart price-axis

`resolveTick` / `formatTick` take `display_shape` from the spec hop (or the envelope once it carries the block). Decimal → existing precision. Fractional → 32nds/64ths formatter. No `0.25` literal in `SaPriceChart` / `saTicks`.

---

## 10. Sessions pointer (REQ-008)

`calendar_id` is an opaque key. This spec does **not** copy Globex hours, the daily halt, or holidays.

The GSC member page (`Specs/FatTail-Labs-Sessions (Global Session Clock).md`) is a **different product**: a 23-hour map of many markets. Its ES row (`18:00–17:00` America/New_York) matches the CME window in coarse form and **does not** encode the daily 5–6 PM ET halt. The spec card's English line comes from the **Sessions service (REQ-008)**, which must carry halt windows so SPEC-7's example string is a render, not a hardcoded caption.

Until REQ-008 lands, ES/MES spec rows may exist as COMING with `calendar_id` set and `session_summary` omitted (`Sessions pending`). SPEC-5: they still cannot go ACTIVE.

---

## 11. Acceptance

### Build / PP-1 (when Coach stamps BUILD)

| AT | Assertion |
|----|-----------|
| AT-SPEC-1 | `GET /symbology/v1/spec/ES` 200; `big_point_value=50`; `tick_value=12.5`; `tick_size=0.25`; citation URL + `as_of` present |
| AT-SPEC-2 | `GET …/spec/MES` 200; `big_point_value=5`; same `calendar_id` as ES; same `tick_size` |
| AT-SPEC-3 | `tick_value` is absent from stored JSON; present on the wire as `tick_size × big_point_value` |
| AT-SPEC-4 | ZB fixture: `display_shape.kind=fractional`; formatter(`115.5`) = `115'16`; member hop 404 (not visible) |
| AT-SPEC-5 | Member hop `GET /api/symbology/v1/spec/SPY` does not return a spec card (volume-source) |
| AT-SPEC-6 | Engine: ES/MES `vp_row` equals spec `tick_size` or payload `error=SPEC_GRAIN_MISMATCH` |
| AT-SPEC-7 | Grep: no `0.25` / `$50` / `HMUZ` month synthesis in vp-engine / chart / `contracts_for_source` after R0-3 |
| AT-SPEC-8 | `as_of` in the past returns the version current on that date |
| AT-SPEC-9 | Incomplete spec → row cannot be ACTIVE (`SPEC INCOMPLETE`) |

### AP-1 (Coach, member login)

Logged in as a member: pull up **ES** — card complete, cited, dated, session summary in plain trader English; pull **MES** — **$5** where ES said **$50**; the picker links there in **one click**. That line closes REQ-009. Do not write “done” before it.

---

## 12. Sequencing

1. This spec to Coach (now). REQ-008 Sessions spec alongside or first — `calendar_id` is otherwise an unresolved pointer.  
2. Tonight's futures GO (ES/MES as the supported roots) remains first for **product** strip/registry; spec **block** does not cut in front of that GO.  
3. Build (only after Coach stamps BUILD AUTHORITY): loader + registry fields + `GET …/spec` + vp-engine assert + axis consumer.  
4. Member card **with or after** the spec block — same JSON, no new plumbing.  
5. R0-3 month-synthesis deletion stays on its blessed gate (REQ-003 AP-1), then satisfies SPEC-3.

No code in this packet.

---

## 13. Risks (labeled)

- **Opinion (Juliet):** CME HTML is hostile to fetch; the loader should pin a retrieved snapshot (PDF or saved HTML) next to `citation.url` so PP-1 is re-runnable when the live page 403s. That is an implementation note, not a new required field.  
- **Opinion (Juliet):** GSC's ES row is not a substitute for REQ-008; using it would drop the daily halt from SPEC-7's example.  
- **Block only if:** a build stores `tick_value`, hardcodes 0.25/50/5, or ships a member-only copy of the spec.

---

## 14. Change table

### v0.1 (2026-09-20)

Initial draft. SPEC-1…5 from the futures GO; SPEC-6…9 from the member-resource amendment. Worked examples ES/MES and ZB, cited. Immediate consumers named. Not BUILD AUTHORITY.
