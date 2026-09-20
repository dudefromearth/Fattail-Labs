# Contract Specifications Registry — Spec v0.2

**Status:** **BUILD AUTHORITY** (Coach APPROVAL v2, 2026-09-20).  
**REQ:** REQ-009  
**Date:** 2026-09-20  
**Supersedes:** v0.1 (`sha1 7147dc4c…`) as law. v0.1 kept as the review object.  
**Advisor review:** 2026-09-20 of v0.1 — **ADOPTED IN FULL** (P0-1…7 and the P1 list). Coach rulings on the five questions land here. No re-review unless this file **deviates**.  
**Home:** StudioOne symbology registry `:4011`. Member surface via the existing hop. No new writers. TOPO-1 intact.  
**Parents:** Symbology & Registry Service Spec v0.2.1 · REQ-008 Sessions service (calendar pointer, not duplicated) · VPS (D7 split-author; errata `Specs/amendments/VPS-D7-split-author-REQ-009.md`).

Coach Content Law: SPEC-1…9 remain Coach's wording, preserved. Numbers are cited.

---

## 0. Problem

(Unchanged from v0.1.) The registry knows *which* symbols exist; it does not know *what an instrument is*. Consumers hardcode ticks, BPV, months. Members have no standard retrieval.

Graves: R0-3 month synthesis (`contracts_for_source`); engine `VP_ROW` ES/MES 0.25; client title maps.

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

### 1.1 Laws promoted at v0.2 (Coach APPROVAL v2)

**SPEC-10 months[] is the cycle only.** `months` is the exchange month-code cycle (`H M U Z`), not the listed strip. Listed horizon lives on universe/strip. A consumer that asks `/spec` for the strip is **wrong by law**.

**SPEC-11 Outright tick.** `tick_size` is the **outright** minimum fluctuation. Spread / BTIC / TACO increments are not this field.

**SPEC-12 Caption is never stored.** `session_summary` is rendered from Sessions (`calendar_id`). It is never a string on the spec snapshot. SPEC-7's example English is the *shape* of the render, not copy to paste.

**SPEC-13 Title is a registry field.** The English title lives on the registry/spec row. Surfaces render `display_name` / `title`. No client `DISPLAY_TITLES` / `ROOT_CHROME.title` map.

**SPEC-14 Loader isolation.** The loader is a **CP-1 post-close StudioOne job**. A cited snapshot is pinned beside `citation.url`. **Live scrape on the member hop is illegal.**

**SPEC-15 Fractional snap is integer.** Fractional quotes snap with integer tick counts (`round(price × denominator)`), never `price / 0.03125` float loops.

---

## 2. Coach rulings (five questions) — seated

**D7 seating — split-author (P0-1).** This block is SoT for SPEC-1 fields on **futures**: `tick_size`, BPV, shape, months-cycle, settlement, `calendar_id`. VPS futures `vp_row` **READS** `tick_size`. `VP_ROW` ES/MES entries **die after AT-SPEC-6**. Strike pattern, **SPY 0.10 grain**, half-day / ex-div keys **stay on the VPS metadata object** until a named later packet. Seating sentence lands in **both** this spec and the VPS errata. Silence-as-third-SoT is refused.

**SPEC-5 ∘ SYM-9/10 — forward-looking (P0-2).** ACTIVE *henceforth* requires complete spec + **resolving** `calendar_id` + per-kind artifact. **Grandfather carve-out (Coach):** ES/MES **chart-kind** rows currently serving members **keep their standing**; their cards show **"Sessions pending."** No existing member surface goes dark under a new law. REQ-008 is on the path to every **NEW** activation and to **model-kind**, period.

**SPX / cash-index spec (P0-3).** Thin later packet. Axis **keeps `saTicks` for cash indices** until that packet. **Futures axis moves to `display_shape` now.**

**REQ-008 completeness (question 5).** REQ-008 must carry **both** ES daily stops — **16:15–16:30 ET cash-close pause** and **17:00–18:00 ET maintenance** — before any SPEC-7 session string is treated as complete. Until then cards show **Sessions pending**. (Watchdog lawful-idle for those windows is a **separate instance**.)

**P0-4.** No new SYM state. Engine named reason (`SPEC_GRAIN_MISMATCH` / `SPEC INCOMPLETE`). Member card uses existing **COMING** (and Sessions pending). Do not invent `SPEC-INCOMPLETE` as a registry state.

**P0-6.** Spec block does **not** duplicate SYM vendor-key mapping. `product_codes` are exchange codes only.

**P0-7.** Loader = SPEC-14.

---

## 3. Ideas inventory

v0.1 inventory stands. Additions:

| Idea | Disposition |
|------|-------------|
| D7 split-author; VP_ROW ES/MES dies; SPY 0.10 stays VPS | **IN-SCOPE** |
| Grandfather ES/MES chart-kind; Sessions pending on cards | **IN-SCOPE** |
| months[] = cycle only (SPEC-10) | **IN-SCOPE** |
| Both ES daily stops on REQ-008 before a complete session string | **IN-SCOPE** as a completeness gate; **not** implemented here (other instance owns the rider) |
| Cash-index spec / SPX axis | **DEFERRED** (thin later packet) |
| Client title map removal (SPEC-13) | **IN-SCOPE** |
| Pinned snapshot loader, no hop scrape (SPEC-14) | **IN-SCOPE** |
| Integer fractional snap (SPEC-15) | **IN-SCOPE** |
| MES citation = MES contract-specs page (not the FAQ) | **IN-SCOPE** |
| ZB ClearPort/Clearing = **17** | **IN-SCOPE** |
| Grep allowlist (tests, snapshots, this spec, SPY 0.10) | **IN-SCOPE** |

---

## 4. Domain model

### 4.1 Attachment

Spec block on the **root**. Dated contracts inherit unless the exchange publishes a different outright fact for that expiry. ESZ2026 does not get a private tick.

D7: this block is SoT for SPEC-1 futures fields. VPS metadata remains SoT for strike pattern, SPY grain, half-day/ex-div. Futures `vp_row` is a **read** of `tick_size`, not a second write.

### 4.2 Stored fields

| Field | Stored? | Notes |
|-------|---------|-------|
| `symbol` | yes | Root (or overlay key). |
| `title` | yes | English name (SPEC-13). |
| `spec_version` | yes | Monotonic. |
| `as_of` | yes | Citation date. |
| `citation` | yes | `{exchange, title, url, retrieved_at, snapshot}` — `snapshot` is a repo-relative pinned file. |
| `exchange` | yes | CME / CBOT / … |
| `product_codes` | yes | `{globex, clearport, clearing}` |
| `tick_size` | yes | **Outright** min fluctuation in quote units (SPEC-11). |
| `big_point_value` | yes | USD per 1.0 quote unit. |
| `display_shape` | yes | §4.4 |
| `months` | yes | **Cycle only** (SPEC-10). |
| `periodicity` | yes | `quarterly` etc. |
| `settlement` | yes | `cash` · `physical` |
| `calendar_id` | yes | Sessions pointer. |
| `tick_value` | **no** | Computed at read. |
| `session_summary` | **no** | Rendered; omit / "Sessions pending" until REQ-008 both-stops resolve (SPEC-12). |
| vendor key map | **no** | SYM already. |

### 4.3 Completeness + grandfather

**New** ACTIVE (any kind) and **all model-kind**: complete §4.2 + resolving `calendar_id` + per-kind artifact (SYM-9/10).

**Grandfather:** ES/MES chart-kind rows already serving members stay up. Cards: **Sessions pending** until REQ-008 both-stops. They do not go dark.

Missing required fields on a **new** activation: engine `SPEC INCOMPLETE`; member **COMING**. No new state.

### 4.4 Display shape + snap (SPEC-15)

```json
{
  "kind": "decimal" | "fractional",
  "precision": 2,
  "fraction": { "denominator": 32, "separator": "'", "width": 2 }
}
```

Decimal: snap `round(price / tick_size)` in integer ticks, format with `precision`.  
Fractional: `ticks = round(price × denominator)`; whole = floor(ticks / denom); num = ticks mod denom; render `{whole}{separator}{num:width}`. Never divide by 0.03125 in a loop.

ZB sample: store `115.5` → `115'16`.

### 4.5 As-of

Latest version with `as_of ≤` query. Omit → current. Corrections append a version.

---

## 5. Wire

```
GET /symbology/v1/spec/{symbol}
GET /symbology/v1/spec/{symbol}?as_of=YYYY-MM-DD
```

Existing hop: member `/api/symbology/v1/spec/{symbol}` → Labs → StudioOne `:4011`. Computing consumers use the same path. **No scrape in this handler.**

200 body = stored fields + computed `tick_value` + `state` + `member_visible` + `roles` + `title`. `session_summary` present **only** when Sessions has both ES daily stops; otherwise omitted and the card prints **Sessions pending**.

Member + non-visible (SPY, ZB until listed) → **404** (no leak).  
Unknown → 404. Bad `as_of` → 422.

---

## 6. Member card

Order: title + symbol · state · exchange/Globex · tick size · tick value · BPV · sample quote from shape · months cycle + periodicity · session summary or Sessions pending · settlement · citation + as-of.

Picker: **one click** (info) to the card. Title from the row, not a client map.

ZB: unlisted; member 404.

---

## 7. Worked examples (cited)

### ES

Citation: CME E-mini S&P 500 Futures contract specs, Globex ES. Active Trader cut **Last Updated 18 Sep 2026 03:42:25 PM CT**. Unit **$50 × S&P 500**; outright **0.25 = $12.50**; Globex/ClearPort/Clearing **ES**; cash.  
URL: `https://www.cmegroup.com/markets/equities/sp/e-mini-sandp500.contractSpecs.html`  
Pinned snapshot: `server/symbology/spec_snapshots/ES.json`

| tick_size | BPV | tick_value | shape | months | calendar_id |
|-----------|-----|------------|-------|--------|-------------|
| 0.25 | 50 | 12.50 | decimal precision 2 | H M U Z | `cme-equity-index-globex` |

### MES

Citation: **MES's own** contract-specs page (not the FAQ). Unit **$5 × S&P 500**; outright **0.25 = $1.25**; Globex **MES**; same session family as ES.  
URL: `https://www.cmegroup.com/markets/equities/sp/micro-e-mini-sandp500.contractSpecs.html`  
Pinned: `server/symbology/spec_snapshots/MES.json`

| tick_size | BPV | tick_value |
|-----------|-----|------------|
| 0.25 | **5** | **1.25** |

Same `calendar_id` as ES. Same shape. Same months cycle.

### ZB (fixture, unlisted)

Citation: CME U.S. Treasury Bond futures specs, Globex **ZB**, CBOT. Face **$100,000**; min **1/32 point = $31.25** (outright); ClearPort/Clearing **17**; physical.  
URL: `https://www.cmegroup.com/markets/interest-rates/us-treasury/30-year-us-treasury-bond.contractSpecs.html`  
Pinned: `server/symbology/spec_snapshots/ZB.json`

| tick_size | BPV | tick_value | shape | product_codes |
|-----------|-----|------------|-------|----------------|
| 0.03125 (1/32) | 1000 | 31.25 | fractional 32nds `'` width 2 | globex ZB, clearport **17**, clearing **17** |

`member_visible=false`.

---

## 8. Loader (SPEC-14)

StudioOne, **post-close**, CP-1 FULL DRESS. Reads pinned snapshots; writes registry spec versions. Does not run on the hop. Member `/spec` only reads.

Re-runnable: change the snapshot, run the job, new `spec_version`.

---

## 9. Consumers

**vp-engine (futures only):** `vp_row := spec.tick_size`. Diverge → **`SPEC_GRAIN_MISMATCH`**. After AT-SPEC-6, `VP_ROW` has **no ES/MES keys**. SPY 0.10 remains VPS metadata.

**Chart axis:** futures → `display_shape` (+ integer snap). Cash indices → existing `saTicks` until the thin packet.

**Grep allowlist:** this spec, pinned snapshots, tests, `VP_ROW` SPY-only, R0-3 file until that blessed delete.

---

## 10. Acceptance

| AT | Assertion |
|----|-----------|
| AT-SPEC-1 | `/spec/ES` 200; BPV 50; tick_value 12.5; citation + as_of; **no** `session_summary` key while Sessions pending |
| AT-SPEC-2 | `/spec/MES` 200; BPV **5**; same calendar_id; MES citation URL is the **MES contract-specs page** |
| AT-SPEC-3 | snapshots contain no `tick_value` / no `session_summary` |
| AT-SPEC-4 | ZB fixture fractional; `format(115.5)=115'16`; member 404; ClearPort/Clearing `17` |
| AT-SPEC-5 | member `/spec/SPY` 404 |
| AT-SPEC-6 | engine ES/MES grain = tick_size; `VP_ROW` has no ES/MES; mismatch → `SPEC_GRAIN_MISMATCH` |
| AT-SPEC-7 | grep allowlist; no consumer `0.25`/`50`/`HMUZ` outside it |
| AT-SPEC-8 | as_of in the past returns that version |
| AT-SPEC-9 | new activation without spec cannot be ACTIVE; grandfathered ES/MES chart-kind still serve |
| AT-SPEC-10 | picker shows registry `title`/`display_name`; `ROOT_CHROME.title` / client title map gone |
| AT-SPEC-11 | hop handler does not call Massive / httpx to cmegroup.com |

**AP-1 (Coach):** member ES card complete, cited, dated, Sessions pending until REQ-008 both-stops; MES shows $5 where ES showed $50; picker one click. His line closes it.

---

## 11. Sequencing

v0.2 composed → BUILD: loader (ES+MES rows, ZB fixture) → fields → GET /spec + as_of → engine grain (futures) → axis display_shape → card. ZB stays unlisted. Nothing cuts in front of tonight's futures GO. Watchdog both-stops = other instance. AP-1 unchanged.

---

## 12. Change table

### v0.1 → v0.2

Advisor P0-1…7 + P1 list adopted. Five Coach rulings seated. SPEC-10…15. Grandfather carve-out. MES own specs URL. ZB codes 17. BUILD AUTHORITY.
