# OPF strike band by DTE — analysis v0.1

**Date:** 2026-09-28  
**Machine:** StudioTwo (OPF API `http://studioone.local:5055`). Collector code read-only on StudioOne.  
**Collector process:** `ai.fattail.labs.ssr-live-capture` · `LABS_REPO=/Users/ernie/Fattail-Labs-mexp2` · HEAD `a91302a2` (`ssr-mexp-finalize-2000`) · `LABS_SSR_MEXP=on` · `LABS_SSR_MEXP_MAX_DTE=5`  
**Not done:** no collector restart, no writes, no archive-file reads, no implementation.

Coach’s question: since 2026-09-25 the collector stores 0–5 DTE. Is the **0DTE 2.5σ** capture band applied unchanged to 1–5 DTE?

---

## Part 1 — Code

The running tap is **not** FatTail-Intelligence (that tree has no capture band). It is **Fattail-Labs-mexp2** `python -m market_data.ssr_live_capture` (front book) plus `market_data.ssr_mexp_capture.MexpCapture` (1–MAX_DTE extra books).

### 0DTE (front book)

```python
# server/market_data/ssr_live_capture.py
WINGS_DEFAULT = 25

def wings() -> int:
    raw = (os.environ.get("LABS_SSR_WINGS") or "").strip()
    if not raw:
        return WINGS_DEFAULT
    v = int(raw)
    if v < 5 or v > 100:
        raise RuntimeError(f"LABS_SSR_WINGS={v} outside [5, 100]")
    return v
```

Call site: `LiveTap._ladder_lookup_topics` asks Redis `mb:ladder:{SYM}:{exp}:w{wing}:dual` for `wing = wings()`, then **15 and 25** as fallbacks. `chain_feed` fetches that many **listed strikes** around ATM (`select_listed_wing_window`). There is **no IV, no T, no 2.5σ** on this path.

On StudioOne `.env`, `LABS_SSR_WINGS=15`. Live 0DTE snaps today used topic `…:w25:dual` (fallback). Friday 0DTE used `w15`.

### 1–5 DTE (MEXP)

```python
# server/market_data/ssr_mexp_capture.py
def trading_dte(day: date, exp: str) -> int:
    """Weekdays in (day, exp]. Holidays are not knowable here and count as days
    (a slightly wider band: the safe direction)."""
    ...

def band_scale(t_dte: int) -> float:
    """sqrt(T) with T = 1 + trading_dte (the front book is T = 1). Spec §4."""
    return math.sqrt(1 + max(0, t_dte))

def book_wings(base_wings: int, t_dte: int, lead_wings: int, wings_max: int) -> int:
    return min(wings_max, int(math.ceil(base_wings * band_scale(t_dte))) + lead_wings)
```

Call site — **once per extra book, each time that book is due** (`MexpCapture._plan` → `_capture_one`):

```python
t = trading_dte(tap.day, exp)
base = cap.wings()          # LABS_SSR_WINGS, not the 0DTE σ
w = book_wings(base, t, self.cfg.lead_wings, self.cfg.wings_max)
# topics = mb:ladder:{SYM}:{exp}:w{w}:dual
```

Defaults: `lead_wings=5`, `wings_max=50`. With `base=15`:

| trading DTE | `band_scale` | `book_wings` |
|-------------|--------------|--------------|
| 1 | √2 ≈ 1.41 | 27 |
| 2 | √3 ≈ 1.73 | 31 |
| 3 | √4 = 2.00 | 35 |
| 4 | √5 ≈ 2.24 | 39 |
| 5 | √6 ≈ 2.45 | 42 |

That matches the `generation.wings` on the snaps below.

### Inputs that are **not** used

- Spot, ATM IV, `LABS_SSR_BAND_SIGMA`, year-fraction `√(T/252)` — **not in the capture path**.
- `chain_ladder.sigma_band_points(..., sigma=2.5)` exists (legacy half-width in **points**) and is **not called** by live or MEXP capture.

### How often / recenter

| Book | Cadence | Band recompute |
|------|---------|----------------|
| 0DTE | 2 s | Fixed wing count (process env). Ladder **re-centres on current ATM every fetch**. |
| 1–2 DTE (T1) | 15 s | `book_wings` per due snap, T = that expiry’s `trading_dte`. |
| 3–5 DTE (T2) | 60 s | same |

**T in the collector formula is per expiry**, but it is `1 + trading_dte` inside a **strike-count** scale, not `T/252` inside a σ formula. 0DTE is not scaled at all (raw `wings()`).

There is **no ratchet**. Spec v0.8 §4.1 wants `active(t) = follow(t) ∪ previously admitted`. The feed rebuilds ±N listed strikes around **current** ATM, so the trailing side **drops** when spot moves. `lead_wings` is extra **counts**, not `LABS_SSR_BAND_LEAD_SIGMA × σ × √T × spot`.

---

## Part 2 — Data

**API:** `GET /api/coverage` then `GET /api/fetch` (Bearer archive token). No disk reads.

**Window:** target 10:30 America/New_York. If that window was empty, nearest snap (noted in `how`).

**Trading days in range:** 2026-09-25 (Fri), 2026-09-28 (Mon). 09-26/09-27: no books.

**Day-count for σ_T:** same as collector `trading_dte` — weekdays in `(session_day, expiration]`; holidays counted. **0DTE has T = 0; σ uses T_σ = max(T, 1)** so the 0DTE year-fraction is **1/252**, not 0. IV is the snap’s ATM `iv` (decimal).

**σ_T = spot × IV × √(T_σ / 252).** Coverage = (high − spot)/σ_T and (spot − low)/σ_T. **Flag** if either side **< 2.5**.

Friday 0DTE books had **4 / 2 snaps**, all after 16:00 ET; ATM IV on SPX 0DTE that snap is **0.8%** (settled/garbage). Those two 0DTE rows are **not** 10:30 science.

### 2026-09-25 SPX

| DTE | exp | t (ET) | spot | lo–hi | n | ATM IV | σ_T | cov ↑ | cov ↓ | wings | flag |
|-----|-----|--------|------|-------|---|---------|-----|-------|-------|-------|------|
| 0 | 09-25 | 16:26 * | 7743.41 | 7670–7820 | 31 | 0.008 | 3.91 | 19.59 | 18.77 | 15 | — * |
| 1 | 09-28 | 10:45 | 7706.81 | 7570–7840 | 55 | 0.088 | 42.88 | 3.11 | 3.19 | 27 | |
| 2 | 09-29 | 16:29 * | 7743.41 | 7590–7900 | 63 | 0.083 | 57.52 | 2.72 | 2.67 | 31 | |
| 3 | 09-30 | 16:30 * | 7743.41 | 7570–7920 | 71 | 0.093 | 78.65 | **2.25** | **2.20** | 35 | **Y** |
| 4 | 10-01 | 16:31 * | 7743.41 | 7550–7940 | 79 | 0.102 | 99.26 | **1.98** | **1.95** | 39 | **Y** |
| 5 | 10-02 | 16:31 * | 7743.41 | 7535–7950 | 82 | 0.110 | 120.18 | **1.72** | **1.73** | 42 | **Y** |

\* not 10:30.

### 2026-09-25 XSP

| DTE | exp | t (ET) | spot | lo–hi | n | ATM IV | σ_T | cov ↑ | cov ↓ | wings | flag |
|-----|-----|--------|------|-------|---|---------|-----|-------|-------|-------|------|
| 0 | 09-25 | 16:26 * | 774.34 | 759–789 | 31 | 0.042 | 2.04 | 7.19 | 7.53 | 15 | — * |
| 1 | 09-28 | 10:45 | 770.79 | 744–798 | 55 | 0.080 | 3.90 | 6.98 | 6.87 | 27 | |
| 2 | 09-29 | 16:30 * | 774.34 | 743–805 | 63 | 0.083 | 5.72 | 5.36 | 5.48 | 31 | |
| 3 | 09-30 | 16:35 * | 774.34 | 739–809 | 71 | 0.095 | 8.06 | 4.30 | 4.38 | 35 | |
| 4 | 10-01 | 16:37 * | 774.34 | 735–810 | 76 | 0.103 | 10.03 | 3.56 | 3.92 | 39 | |
| 5 | 10-02 | 16:30 * | 774.34 | 732–816 | 85 | 0.108 | 11.76 | 3.54 | 3.60 | 42 | |

### 2026-09-28 SPX (true 10:15–10:45)

| DTE | exp | t (ET) | spot | lo–hi | n | ATM IV | σ_T | cov ↑ | cov ↓ | wings | flag |
|-----|-----|--------|------|-------|---|---------|-----|-------|-------|-------|------|
| 0 | 09-28 | 10:32 | 7700.73 | 7575–7825 | 51 | 0.111 | 53.83 | **2.31** | **2.34** | 25 | **Y** |
| 1 | 09-29 | 10:28 | 7706.31 | 7570–7840 | 55 | 0.117 | 56.64 | **2.36** | **2.41** | 27 | **Y** |
| 2 | 09-30 | 10:36 | 7700.21 | 7545–7855 | 63 | 0.125 | 85.62 | **1.81** | **1.81** | 31 | **Y** |
| 3 | 10-01 | 10:33 | 7702.54 | 7530–7875 | 70 | 0.127 | 106.88 | **1.61** | **1.61** | 35 | **Y** |
| 4 | 10-02 | 10:37 | 7699.95 | 7505–7895 | 79 | 0.136 | 132.11 | **1.48** | **1.48** | 39 | **Y** |
| 5 | 10-05 | 10:26 | 7706.15 | 7495–7915 | 85 | 0.113 | 122.5 | **1.70** | **1.72** | 42 | **Y** |

### 2026-09-28 XSP (true ~10:30)

| DTE | exp | t (ET) | spot | lo–hi | n | ATM IV | σ_T | cov ↑ | cov ↓ | wings | flag |
|-----|-----|--------|------|-------|---|---------|-----|-------|-------|-------|------|
| 0 | 09-28 | 10:34 | 770.29 | 745–795 | 51 | 0.110 | 5.34 | 4.63 | 4.73 | 25 | |
| 1 | 09-29 | 10:27 | 770.60 | 744–798 | 55 | 0.116 | 5.64 | 4.86 | 4.72 | 27 | |
| 2 | 09-30 | 10:28 | 770.62 | 740–802 | 63 | 0.121 | 8.30 | 3.78 | 3.69 | 31 | |
| 3 | 10-01 | 10:29 | 770.50 | 735–805 | 71 | 0.123 | 10.36 | 3.33 | 3.43 | 35 | |
| 4 | 10-02 | 10:18 | 770.52 | 732–810 | 79 | 0.134 | 12.97 | 3.04 | 2.97 | 39 | |
| 5 | 10-05 | 10:34 | 770.17 | 728–810 | 83 | 0.114 | 12.41 | 3.21 | 3.40 | 42 | |

### Median coverage (min of two sides, σ), by DTE

Excludes Friday 0DTE (bad IV / after-close). 09-25 DTE 2–5 are after-close but IV looks live-like; included and marked.

| DTE | SPX median σ | XSP median σ | SPX flags / n |
|-----|----------------|--------------|----------------|
| 0 | **2.32** (Mon only) | 4.68 | 1 / 1 usable |
| 1 | 2.38 (3.15 Fri 10:45, **2.36** Mon) | 5.79 | 1 / 2 |
| 2 | **1.81** Mon; 2.67 Fri after-close | 4.53 | 1 / 2 |
| 3 | **1.61** / 2.20 | 3.86 | 2 / 2 |
| 4 | **1.48** / 1.95 | 3.26 | 2 / 2 |
| 5 | **1.71** / 1.73 | 3.47 | 2 / 2 |

**Every SPX row with a usable 10:30 (or near) snap at DTE ≥ 0 on Monday, and DTE ≥ 3 on Friday, is below 2.5σ on both sides.** XSP never dropped below 2.5σ in this sample ($1 listed step × same wing count is ~2× the relative width of SPX $5).

---

## Part 3 — Impact

Full listed chains are not on the API, so “missing strikes” is the **gap from captured half-width to 2.5 σ_T**, divided by listed step (SPX $5, XSP $1), both sides.

| DTE | SPX extra strikes / snap (Mon) | SPX missing fraction of 2.5σ width | XSP extra / snap |
|-----|-------------------------------|--------------------------------------|------------------|
| 0 | ~4 | 0.08 | 0 |
| 1 | ~8 | 0.05 | 0 |
| 2 | ~31 | 0.28 | 0 |
| 3 | ~38 | 0.35 | 0 |
| 4 | ~54 | 0.41 | 0 |
| 5 | ~37–54 | 0.31–0.41 | 0 |

**Storage (RTH 09:30–16:00, current cadence):** extra SPX rows are dual-sided. Rough added **row-writes / day** if the band were 2.5σ per expiry:  
`(extra strikes × 2 sides) × snaps`. Snaps ≈ 11 700 (0DTE @ 2s), 1 560 (T1 @ 15s), 390 (T2 @ 60s).

- 0–1 DTE: a few thousand extra row-writes (noise vs the 0DTE book).  
- 3–5 DTE: ~38–54 strikes × 2 × 390 ≈ **30–42k extra row-writes / symbol / day**. Small next to 0DTE’s ~51 strikes × 2 × 11 700 ≈ 1.2M row-writes.

**Structures unplaceable today (SPX, Monday 10:30):** anything whose **outer listed strike sits between the captured edge and 2.5 σ_T**.

| DTE | captured half-width | 2.5 σ_T | Unplaceable |
|-----|---------------------|---------|-------------|
| 0 | ~125 pt | ~135 pt | 125–135 pt verticals / fly wings (thin strip) |
| 1 | ~135 pt | ~142 pt | same, thin |
| 2 | ~155 pt | ~214 pt | **~60 pt of wing** missing each side |
| 3 | ~173 pt | ~267 pt | **~90 pt** |
| 4 | ~195 pt | ~330 pt | **~135 pt** |
| 5 | ~210 pt | ~306 pt | **~95 pt** |

Tight ATM flies (10–25 wide) still fit. **2–2.5σ flies, broken-wing flies with the broken side out there, and long verticals to 2.5σ** on **SPX 2–5 DTE** do not: the cube has no contract. XSP in this sample still covers >2.5σ, so those structures remain placeable on XSP.

---

## Part 4 — Findings

**a.** The band is **per expiry as a listed-strike *count*** (`book_wings` from `√(1+T)` plus `lead_wings`, cap 50). It is **not** per-expiry 2.5σ from that book’s T and ATM IV. 0DTE is a **fixed wing count** (15 configured, 25 seen today via fallback). Coach’s “unchanged 0DTE σ window on 1–5 DTE” is **false as identical N**, **true as missing 2.5σ**.

**b.** On Monday 10:30, **SPX coverage falls from ~2.3σ at 0–1 DTE to ~1.5–1.8σ at 2–5 DTE** — both sides under 2.5 from 0DTE onward. **XSP stays ~3–5σ** at the same wing counts because the listed step is $1 vs SPX $5.

**c.** Fix in one line: **each book’s half-width = 2.5 × spot × ATM_IV(expiry) × √(T_σ/252), listed strikes inside that window, plus a lead buffer; ratchet union so trailing strikes never drop.** Change `book_wings` / `wings()` from a count formula to that window (and stop using `sigma_band_points`’s `max(1,dte)` only as T_σ). Recenter today already follows spot every fetch; the missing piece is the **union/ratchet**, not another recenter.

**d.** Friday 0DTE almost wasn’t collected (4 snaps, after the close). `LABS_SSR_WINGS=15` while live 0DTE ladders are `w25`. Extra books scale off **15**, not off the 25-wide ladder actually stored for 0DTE. Spec v0.8 §4 (per-expiry σ, never-drop ratchet, lead in σ) is **not what shipped**. Archive `:5055` can fetch extra books by `expiration=`; FatTail-Labs `main` `snap_files` still does not glob `exp=*/` — only the mexp2 dash does.
