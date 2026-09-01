# FatTail Labs — Session Option Volume Profile Spec v0.1

**Status:** **SUPERSEDED** by [v0.2](./FatTail-Labs-Session-Option-Volume-Profile-Spec-v0_2.md) (2026-09-01) — external review fold (G1-G8).

> **Use v0.2 for all new work.** v0.2 fixes a defect in this document: the live door here reads a
> wing-clamped generation while the artifact is full chain, so the two doors could not agree.
**Date:** 2026-08-31
**Current revision:** **v0.1.6** (filename stays `…-v0_1.md`; the revision field is authority)
**Canonical filename:** `Specs/FatTail-Labs-Session-Option-Volume-Profile-Spec-v0_1.md`
**Type:** Product + data-plane Spec — **session-cumulative option contract volume by strike**, live and back-selectable
**Short name:** **SVP** / **Session Volume Profile**
**Board (when seated):** `agents/p-session-volume-profile/` — **does not exist yet; correct until GO**

**Content hash (v0.1.6):** recompute at Coach GO:
`shasum -a 1 Specs/FatTail-Labs-Session-Option-Volume-Profile-Spec-v0_1.md` → record in DL.

**Coach intent (2026-08-31, verbatim frame):** a new template for the Heatmap — a Session
Volume Profile that accumulates volume bins for the session and lets you go back as far as
the archive disk has data (currently ~2 weeks). Clarified in the same exchange:

| Question | Coach answer |
|----------|--------------|
| What is binned | **Option contract volume by strike** — not underlier volume by price |
| Source | Chain generation archive on disk; **truth is the Massive chain snapshot API at full scope** |
| Sessions | **Live today + back-select** to the archive horizon |
| Surface | **Both doors, one artifact** — Heatmap template *and* Volume Profile app |
| Layout | Left to right: **Strike · Bid · Mid · Ask · VP**; the profile is anchored right and extends **leftward** (§7) |
| Price | Current price **highlighted**, kept **near centre with slop**, and on a run the view **trails and catches up**; the highlight leaves a decaying **trail** through the strikes price ran through (§7.1) |
| Bars | Volume level **hangs off the bar tip**; abbreviated with two decimals above 1,000 (§7.3). **Black** ground, **blue** bars with **beveled** edges (§7.4) |
| Gamma | GEX as a **heat rail** on the strike axis, sign changes marked, **pressure** shown as hedging flow in real units — with OI staleness disclosed on the surface (§7.5–§7.7) |

---

## 0. Mission

```text
Massive chain snapshot (full scope, dual-side)
   │
   ├─► live generation  ──► Market Bus push ──► client profile (today, near real time)
   │
   └─► SVP writer (job) ──► session artifact (contract grain, 1m clock)
                                 │
                                 ├─► Heatmap template `session-volume` (back-select + today)
                                 ├─► Volume Profile app viewport
                                 └─► agents / analysis
```

Give a member, for one underlier and one expiration, **how much option volume traded at each
strike this session** — and let them walk that same picture back through prior sessions as far
as the archive goes.

**One artifact, two doors.** The Heatmap panel and the VP app read the **same** server artifact
and the **same** numbers. A number that differs between the two doors is a defect, not a view.

**What this is not:**

- Not an OPRA print measurement. Labs holds **no options tape**. The quantity is the vendor's
  **session-cumulative contract volume** read off chain snapshots (§2.1).
- Not underlier volume-by-price. That is the VP Histogram plane (Spec v0.4), a different
  measurement in a different price space (SV14).
- Not open interest. Volume is session flow; OI is prior-day settled positioning.
- Not dealer positioning, not buy/sell classification, not "smart money" chrome.
- Not POC / value area / HVN / LVN furniture on the profile (VP3 parity — SV13).
- Not a second Massive client in the browser, and not a per-template pull (HM1).

---

## 0.1 Surface naming

| Name | Meaning |
|------|---------|
| **SVP artifact** | Server-written session file at contract grain — the SoR for both doors |
| **`session-volume`** | Heatmap registry template id (layout `profile`) |
| **VP app viewport** | Session option-volume panel inside `/app/options-lab/volume-profile` |
| **Archive mount** | The disk holding archived generations — Coach's "gold disk"; must be named in the mount map (**OD-SV5**) |
| **Session clock** | 1-minute bucket grid over RTH used by the artifact (**OD-SV3**) |
| **Cumulative volume** | Vendor's session-to-date contract volume at snapshot time |
| **Sliced volume** | Positive difference between two cumulative reads — bounded by cadence (§2.2) |

---

## 0.2 Why this needs its own Spec

Heatmap Templates v0.2 is a **client view-plane** law: pure templates, one shared chain model,
zero template-owned data (HM1, HM2, HM6), a generation capped at 250 contracts (HM17), and
`next_url` as a hard error (HM18). SVP breaks three of those on purpose:

| Need | Parent law it strains | Resolution |
|------|----------------------|------------|
| Past sessions | HM1 — one live model, no other plane | **HM amendment** — a template may declare a *server-owned auxiliary read plane*. It still owns no fetch of its own (SV6) |
| Full chain scope | HM17 — ≤250 contracts, one page | Applies to **live heatmap generations** only. The SVP **job** may page (SV7); the live generation stays clamped, unchanged |
| Pagination | HM18 — `next_url` ⇒ hard error | Same split: hard error in the request/stream path, **followed** in the batch writer (SV7) |

**Therefore:** GO on this Spec requires **Heatmap Templates v0.3** landing the amendment in the
same body of work (documentation parity, invariant 6). Adding `session-volume` to the registry
without that amendment is a spec violation, not a feature.

---

## 1. Parents / companions

| Doc | Role here |
|-----|-----------|
| `Specs/FatTail-Labs-Options-Lab-Heatmap-Templates-Spec-v0_2.md` | Template contract, HM1–HM20; **amended to v0.3 by this work** |
| `Specs/FatTail-Labs-Options-Lab-Heatmap-Advanced-Fly-Spec-v0_2.md` (v0.2.1) | History honesty precedent — AF10 seam, AF17 time honesty |
| `Specs/FatTail-Labs-Massive-Market-Bus-Shared-Client-Spec-v1.0.md` (v1.0.1) | One WS/tab; generation store; live priority |
| `Specs/FatTail-Labs-Options-Chain-Picker-Spec-v1.0.2.md` | Universe SoR; OC13 no-MSC |
| `Specs/FatTail-Labs-Volume-Profile-Histogram-Spec-v0_4.md` | **Storage law inherited** (VP13/VP14/VP17/VP18); **measurement kept separate** (SV14) |
| `Architecture/29-options-lab-heatmap-templates.md` | Template registry as-built |
| `Architecture/30-options-pricing-foundation.md` §10 | Cold generation archive — the back-select substrate |
| `Architecture/31-structure-surface-replay.md` §B6 | Mount-role precedent: **do not invent a new role** |
| `Specs/FatTail-Labs-Human-Interface-Spec-v1.0.md` | Chrome, tokens, ≥44pt |

---

## 2. The measurement — say exactly what the number is

### 2.1 Source quantity

Each contract in a Massive options chain snapshot carries a **session-to-date cumulative
volume** for that contract. SVP reads that field. It does not sum prints, because Labs has no
options print tape.

**Consequences, all of which are law:**

| Fact | Law |
|------|-----|
| The number is vendor-reported, not Labs-measured | **SV1** — payload and UI label it `source: vendor_snapshot_cumulative`. Never the word "measured" as VP uses it |
| Exact field name and reset semantics are unconfirmed | **P-SV1** is a **blocking probe**. No artifact is written before it closes |
| Snapshots are periodic | Time attribution is bounded by cadence (§2.2) |
| Volume ≠ opening interest | **SV2** — volume/OI ratio may be shown as a **descriptor**, never as "new positions" |

### 2.2 Two quantities, never conflated

**Session total** (default) — the latest cumulative read for that contract in that session:

```text
V_end(side, K) = last observed cumulative volume for the contract, session-to-date
```

Exact as the vendor reports it. This is what the default profile draws.

**Sliced volume** — attribution of volume into time buckets, from consecutive reads:

```text
Δ(t) = max(0, V(t) − V(t−1))
```

| Rule | Law |
|------|-----|
| Non-monotonic read (vendor revision, late print, correction) | **SV3** — clamp to 0, increment `revision_count`. **Never a negative bar** |
| Volume before the first snapshot of the session, or inside a gap | **SV4** — accumulate into a named **`unattributed`** bucket. Never spread across buckets, never silently dropped |
| Identity that must hold | **SV5** — `Σ Δ(t) + unattributed = V_end` per contract, exactly (**AT-SV1**) |

`unattributed` is displayed, not hidden. A session that opens with a large unattributed share is
telling the member the truth about when collection started.

### 2.3 Coverage object (carried on every artifact and every API response)

```text
coverage = {
  session_date, symbol, expiration,
  first_gen_at, last_gen_at,
  expected_buckets, observed_buckets,
  gap_count, max_gap_seconds,
  revision_count,
  unattributed_volume, unattributed_pct,
  strike_scope: "full" | "band(w)",     // SV8
  source: "vendor_snapshot_cumulative",
  algo_version, complete: bool
}
```

**SV6 — no naked profile.** No door may render an SVP profile without its coverage. A profile
with 40% unattributed volume and one with 0.5% are different claims about the world.

---

## 3. Scope and geometry

| Dimension | v0.1 law |
|-----------|----------|
| Underlier | Enabled `market_symbol_universe` only (HM9 parity) |
| Expiration | **One listed expiration per artifact** (OD-SV1). Roll-ups across expirations are read-time aggregation, never a second store |
| Strikes | **Full listed chain for that expiration**, both sides — not the heatmap wing band (SV7) |
| Sides | Both, always. Side is a view filter (HM16 parity) |
| Contracts | **Standard only**; adjusted/non-standard excluded with `excluded_adjusted_count` on meta (HM19 parity — **AT-SV7**) |
| Session | RTH, VP session calendar incl. early close (VP §6 parity) |
| Clock | 1-minute buckets, last cumulative read in bucket (OD-SV3) |
| Grain stored | **Contract** — `(session_date, symbol, expiration, side, strike, bucket)` carrying cumulative volume, **mid** (for premium-traded) and **Γ**; **OI once per contract per session**; plus a per-bucket **spot track** (SV33, SV42) |

**SV7 — scope split.** The **live heatmap generation** keeps its clamp and its `next_url` hard
error, untouched. The **SVP writer job** pulls the full chain and **follows pagination**,
recording `pages` and `contracts` in coverage. These are two different callers with two
different laws, and neither may be quietly given the other's.

**SV8 — scope honesty on backfill.** Days recovered from the existing generation archive may be
**wing-band clipped**, not full chain. Those days record `strike_scope: "band(w)"` and the UI
says so. A band-clipped day is **never** presented as a full-chain profile — the missing wings
are absence of data, not absence of volume.

**SV9 — empty ≠ zero.** A strike with no data renders invalid ("—"), never a zero-length bar. A
session outside the archive horizon returns an explicit "no data for that session", never an
empty profile (**AT-SV6**). Same doctrine the Journal already holds.

---

## 4. Storage

Inherits VP v0.4 storage law entirely.

| Item | Law |
|------|-----|
| Mount | Under `LABS_MARKET_DATA_MOUNTS`, on an **existing role** (`staging` if present, else `raw-primary`). **SV10 — do not invent a mount role** (SSR §B6 precedent) |
| Missing mount | Job and plane boot **fail loud per mount** (VP13/VP17 parity — **AT-SV10**) |
| Layout | `{mount}/fattail-market-data/chain_session/{algo_version}/{symbol}/expiration=YYYY-MM-DD/day=YYYY-MM-DD.parquet` — sibling of `raw/` and `binned/`, never inside them |
| Sparsity | Write a bucket row only where cumulative volume **changed**; readers treat absent buckets as Δ=0, present-but-null as invalid |
| `algo_version` | **`svp_v1`** — covers field choice, clamp rule, clock, session calendar, scope rule. Any change ⇒ new version + rebuild (VP8 parity) |

**Catalog (MySQL — not bulk SoR):**

| Table | Purpose |
|-------|---------|
| `chain_session_day` | `(symbol, expiration, session_date, algo_version)` → artifact_uri, coverage fields, complete, mount |
| `chain_session_job` | Queue / state / watermark |

**SV11 — horizon from catalog.** The back-select control's reach is `MIN(session_date)` where
`complete = true`, read from the catalog. **"About two weeks" is never a constant in code or
copy.** The horizon is whatever the disk actually holds, and it is reported, not assumed
(**P-SV4** records what is on the mount today as evidence).

**Size (order of magnitude, to be replaced by measured bytes — P-SV3):** a 400-contract
expiration × 390 one-minute buckets, sparse and compressed, is single-digit MB per session-
expiration. If that survives measurement, retention is cheap and OD-SV4 should be "keep".

---

## 5. Live path — today's session

**SV12 — today costs nothing extra.** The live dual-side generation already carries per-contract
volume. The default `session_total` profile for today is a **pure client read of the current
generation** — zero additional Massive, zero additional HTTP, satisfying HM1/HM2/HM3 unchanged.

| Mode today | Path |
|------------|------|
| `session_total` | Current generation's cumulative volume, recomputed per push (HM11 parity) |
| Sliced / window | Server artifact for today up to `last_gen_at`, plus client tail from the generation stream |
| Market closed | Hold last (HM5); hydrate-if-empty once (HM4) |

**Client tail honesty:** the tail obeys the Advanced Fly rules already in the codebase —
non-monotonic `asOf` rejected or seamed (AF17), single clock basis only, gaps beyond the
configured max are gaps, not interpolations.

**Row-field amendment:** Heatmap Templates §3.4 does not list volume as a first-class row
field (the ladder shows it, the contract does not name it). v0.3 must add `day_volume` to
`LadderRow` and to `ChainContext`, with null allowed → invalid (HM7 parity).

---

## 6. Value modes

| Mode | Definition | Notes |
|------|------------|-------|
| `total` | `V_call(K) + V_put(K)` | Default |
| `call` / `put` | Single book | Side filter, not a re-fetch (HM16) |
| `pct_of_session` | `V(K) / Σ V` | Share of the expiration's session volume |
| `cp_skew` | `(V_c − V_p) / (V_c + V_p)` | Descriptor; invalid when denominator = 0 |
| `vol_oi` | `V(K) / OI(K)` | **Labeled descriptor** (SV2). Invalid when OI = 0 or null — never ∞/NaN |
| `window` | `Σ Δ(t)` over a member-chosen window | Requires coverage; disabled when `unattributed_pct` exceeds **OD-SV6** threshold |

**Color:** magnitude scale, session-sticky normalization with the 25% hysteresis rule already
frozen for the heatmap (§5.2.2 of v0.2). Volume is unsigned — use a **sequential** scale, not the
diverging blue↔red reserved for signed quantities. `cp_skew` is signed and may diverge.

**SV13 — no structure furniture.** No POC, value area, HVN/LVN, node labels, or "magnet"
language on the SVP profile or in its chrome. Bars and numbers only. (VP3 parity.)

---

## 7. Panel anatomy (Coach layout lock, 2026-08-31)

The template is **one panel, two regions, one row grid**. Price and volume are read on the same
line, for the same strike, without the eye leaving the row.

```text
│◄──────────── ladder (left) ────────────►│◄─────────── profile (right) ───────────►│
│                                          │                                          │
│  Strike     Bid     Mid     Ask          │            bars grow ◄── from right edge │
│ ────────   ─────   ─────   ─────         │                                          │
│  6460.00    2.05    2.10    2.15         │                 3.10K ████████           │
│  6455.00    1.85    1.90    1.95         │  12.35K ████████████████████████████     │
├─ 6452.30 ────────────────────────────────┼───────────────────────────  price line ──┤
│ ▓6450.00▓  ▓1.62▓  ▓1.67▓  ▓1.72▓  ← ATM │        8.04K █████████████████████       │
│  6445.00    1.44    1.49    1.54         │                    2.61K ███████         │
│  6440.00    1.21    1.26    1.31         │                       847 ████           │
│                                          │                                     ▲    │
│                                          │                          zero baseline    │
```

| Law | |
|-----|--|
| **SV22 — column order** | Left to right, the panel is exactly: **Strike · Bid · Mid · Ask · VP**. Strike is the axis — the anchor every other cell in the row belongs to. Mid is a first-class column (it is the price the fly/structure templates already compute from), not a tooltip. VP is the bar region, not a numeric column (SV23) |
| **SV23 — right anchor, leftward growth** | Volume bars are anchored at the **right edge** of the panel and extend **leftward**. Zero volume = zero length at the right edge. The largest bar reaches nearest the ladder |
| **SV24 — one row grid** | Ladder rows and profile rows share one row height and one strike ordering (descending strike, high at top). A bar is always on its strike's line. Independent scrolling of the two regions is forbidden |
| **SV25 — spot rule** | Spot emphasis crosses **both** regions as one horizontal marker, per existing heatmap spot emphasis. Two distinct things, never merged (§7.1) |
| **SV26 — bar scale is stated** | The scale (max bar = session max at any strike in view, or a sticky scale per §6) is labelled. Bars are never rescaled per generation without the 25% hysteresis rule |
| **SV27 — invalid rows** | Missing quote → "—" in the quote cell (HM7). Missing volume → no bar **and** an invalid marker, never a zero-length bar that reads as "traded nothing" (SV9) |

**Side (calls / puts).** Side stays a **view filter** (HM16) — the ladder shows the viewed book's
bid/ask, and the bars show that book's volume. The default bar may also be a **two-tone split**
(call segment + put segment from the right edge) when value mode is `total`, so a member sees
call/put balance at a strike without switching. **OD-SV11** settles split vs single.

### 7.1 Current price — highlight and centering (Coach lock, 2026-08-31)

The member should be able to find price without hunting, and the panel should not jitter while
doing it.

**Two different marks. Do not collapse them into one.**

| Mark | What it is |
|------|------------|
| **Price line** | The **true** underlier price, drawn at its proportional position **between** strike rows, spanning both regions |
| **ATM row** | The **nearest listed strike** row, given row emphasis (background + strike weight) |

**SV29 — the price line is not a strike.** Spot is rarely a listed strike. The panel must not
paint the ATM row as though it *is* the price. The row emphasis says "nearest listed strike";
the line says "price". Both carry the numeric value in the row/edge label so the member reads
`6452.30` and sees it sitting between 6450 and 6455 — not rounded into one of them.

**SV30 — two states: rest and follow.** The panel is still in chop and **trails-then-catches-up**
in a run. It never teleports, and it never twitches.

| State | Trigger | Behaviour |
|-------|---------|-----------|
| **Rest** | Price line inside a centred band of **±2 strike rows** (**OD-SV14**) | **Zero scroll events.** Not small ones — none. The line moves within the band; the view does not |
| **Follow** | Line leaves the band | The viewport **eases continuously toward centre**, closing the remaining gap at a rate proportional to it (exponential approach, time constant **≈400 ms**, **OD-SV16**). The view visibly **lags the price and catches up** — that lag is the point, not a defect |
| **Settle** | Line re-enters the band and the gap is under a row | Easing completes and stops. **No overshoot, no oscillation** |
| **Jump** | Gap exceeds **one viewport height** (**OD-SV17**) — a gap open, a limit move, an expiry or symbol change | **Reposition instantly.** Sliding through fifty strikes is a slow blur, not information |

**Follow mechanics (normative):**

- Target = scroll offset that puts the price line at vertical centre; recomputed every applied
  generation from the true spot.
- Each animation frame: `offset += (target − offset) × k`, `k` from the time constant. Distance
  falls, so speed falls — fast when far behind, gentle on arrival. This is what reads as
  *catching up*.
- **Velocity clamp** (**OD-SV18**): cap at ~**8 strike rows / second** so a fast tape cannot
  turn the panel into a smear. Beyond the clamp the view falls further behind, then closes when
  price steadies — honest, and still readable.
- The follow is **view-only**. It never reflows rows, never re-fetches, never re-sorts. Quotes
  and bars keep updating on their own cadence while the viewport moves (HM2/HM3 untouched).

| Guard | v0.1 law |
|-------|----------|
| Manual override wins | Any member scroll, drag, or keyboard nav **suspends** follow. It resumes on an explicit **Recenter** control, or after an idle timeout (**OD-SV15**). The panel never yanks the view out from under a member reading a far wing |
| Truth before motion | The price line's **position is always the true spot**. Only the viewport lags. A member reading the line's value during a run reads the current value, never an eased one (**AT-SV25**) |
| Reduced motion | `prefers-reduced-motion` → instant reposition on band exit, no easing (HIG / HM14). Accessibility outranks the feel |
| Held / closed | Model held (HM5) → price line **frozen and labelled held**; follow disabled. No chasing a stale price |
| Cadence | Target recomputed per applied generation; the easing runs on animation frames, never on a polling timer of its own (HM3) |

Rest is the colour scale's 25 % sticky discipline (§5.2.2 of Heatmap v0.2) — ignore noise.
Follow is the departure from it, and it is deliberate: in a run, the member's question is
"where is price going," and a panel that trails and closes answers it better than one that
snaps and sits.

**SV32 — price trail (the highlight has a memory).** The price highlight leaves a **decaying
trail** down the strike axis: rows price has recently traversed keep a background tint whose
opacity falls with age, so a run reads as a visible path through strikes rather than a single
line with no history.

| Rule | v0.1 law |
|------|----------|
| Window | Bounded lookback — default **last 15 minutes** of session time (**OD-SV19**). A trail that covers the whole session tints everything, and tinting everything is tinting nothing |
| Decay | Opacity falls with age to zero at the window edge; oldest rows drop off cleanly. Recomputed per applied generation |
| Distinct from its neighbours | Trail tint sits **below** ATM row emphasis and the price line in visual weight, and uses a different token from the volume bars. Three marks, three jobs, never confusable (**AT-SV26**) |
| **No valence colour** | One neutral accent at varying opacity. **Not** green-up / red-down — this is a volume panel, and importing P&L valence teaches the wrong reflex (Accounts & Capital "no valence colour" precedent). Direction, if shown at all, is a small arrow on the price label, not a colour |
| No motion | The trail is opacity, not animation. Nothing pulses, nothing sweeps |
| No prediction | Trail says **where price has been**. No extrapolation, no "magnet", no momentum language in chrome or tooltip (SV13 parity) |
| Works on history | On a back-selected session the trail is built from the artifact's spot track (SV33), ending at the selected as-of time |

**SV33 — session spot track in the artifact.** The SVP artifact carries a per-bucket **spot
series** for the session alongside the contract rows (`bucket, spot, source`). It is small —
one row per minute — and it is what makes SV31 (as-of spot), SV32 (trail on history), and any
time-window replay possible without a second data plane. Missing spot for a bucket is
**null, not interpolated**; the trail skips it and the coverage object counts it.

**SV31 — historical sessions have no "current" price.** On a back-selected session the mark is
the **spot at the selected as-of time** (or the session's last spot when no time is selected),
labelled with that time. The word "current" is forbidden on a past session, and the panel
centres on that as-of spot, not on today's.

### 7.2 "Long / short" — what the data can and cannot say

Coach's framing includes long/short alongside put/call. **This must be said plainly:** a chain
snapshot reports *how many contracts traded* at a strike. It does not report who initiated, who
was long, or whether a trade opened or closed a position. Buy/sell and long/short attribution
require trade-side or open/close data Labs does not hold.

**SV28 — no side-of-trade fabrication.** SVP must not label volume as long, short, bought, sold,
opening, or closing, and must not derive those from price-versus-quote heuristics presented as
fact. Volume/OI (`vol_oi`) remains a **descriptor** that hints at new activity without claiming
it (SV2).

**OD-SV12 (blocking on this element only):** if "long/short" means something Labs *can* serve —
the member's own position direction at that strike from the open book, or the legs of a
structure loaded in the Analyzer — then it is a lawful **overlay of the member's own positions**
on the ladder, and this Spec should carry it as such. Coach to say which. The rest of the
template does not wait on this.

### 7.3 Bar labels and number format (Coach lock, 2026-08-31)

**SV34 — the number hangs off the tip.** Every bar carries its volume as a label at the bar's
**tip** — the left end, since bars grow leftward (SV23) — sitting just outside the bar and
vertically centred on its row. The member reads magnitude from the bar and the exact level from
the label without a hover.

| Case | Rule |
|------|------|
| Normal | Label outside the tip, one label gap of clear space |
| Long bar (tip reaches the ladder) | Label **flips inside** the bar at its tip, in a contrast-safe fill. It **never** overlaps or crowds the Strike/Bid/Mid/Ask columns |
| Short bar | Label sits to the left of the tip as normal; a near-zero bar still gets its number |
| Invalid row | **No bar and no label** — an invalid row shows the invalid marker only. A "0" here would claim nothing traded, which is not what a missing read means (SV9/SV27) |
| True zero | Renders `0` |
| Legibility | Row height has a minimum that keeps labels at HIG type scale and prevents vertical collision. Labels are never silently dropped to fit — if they cannot fit, the row height is wrong (**AT-SV30**) |

**SV35 — number format.** Contracts are integers; abbreviation begins at a thousand.

| Range | Format | Examples |
|-------|--------|----------|
| `< 1,000` | Exact integer, no decimals, no suffix | `7` · `84` · `847` |
| `≥ 1,000` | Two decimal places + unit suffix | `1.00K` · `1.23K` · `12.35K` · `123.46K` |
| `≥ 1,000,000` | Same, next unit | `1.23M` · `45.67M` |

| Rule | Law |
|------|-----|
| Decimals | **Always exactly two** above the threshold — `1.00K`, never `1K` or `1.0K`. A ragged column of varying decimals is harder to scan than a uniform one |
| Rounding | **Half away from zero**, matching the VP geometry rule (VP §5.2) — one rounding convention across the market-data surfaces |
| Unit roll | Suffix rolls when the integer part would reach four digits: `999,995` → `1.00M`, not `999.99K` (**OD-SV20**) |
| Display only | Abbreviation is presentation. Tooltip, payload, agent export and any CSV carry the **exact integer** (**AT-SV31**). A member who needs 12,347 is never left with 12.35K as the only truth |
| Locale | Thousands separators per locale below the threshold; the suffix set (`K`, `M`) is not localised in v0.1 |

### 7.4 Visual treatment (Coach lock, 2026-08-31)

The panel is a **chart surface**, not a document surface: it keeps a dark ground in every theme,
consistent with the heatmap's existing dark-surface / gold-figures chrome (Arch 29 §1.2).

| Element | v0.1 law |
|---------|----------|
| **Ground** | **Black** panel background, from the dark-surface token family — not an ad-hoc `#000` literal (Human Interface Spec tokens, **SV36**) |
| **Bars** | **Blue** fill with **beveled edges** — lighter top edge, darker bottom edge, giving the bar physical dimension against the black |
| **Bevel does not lie** | The bevel is drawn **inside** the bar's length. It never extends the bar by a pixel, never rounds the tip past its true value. Magnitude is length; decoration may not add to it (**SV37**, **AT-SV32**) |
| **Not the heat palette** | The fly matrix owns diverging blue↔red for *signed* quantities (§5.2 of Heatmap v0.2). Volume is unsigned, so SVP uses a **single blue**, flat or ramped by magnitude (**OD-SV21**) — a member must never read an SVP bar as a signed heat cell |
| **Call / put split** | When OD-SV11 lands the two-tone bar, the second tone is a **second step of the same blue family**, not a second hue. No red/green anywhere on this panel |
| **Trail is not blue** | The price trail (SV32) uses the house **gold/accent** family at low opacity so it never reads as volume. Bars are blue, trail is gold, price line is the brightest mark |
| **Label contrast** | Tip labels meet AA contrast on **both** grounds — gold-on-black outside the bar, and the contrast-safe fill when flipped inside the blue (SV34, **AT-SV33**) |
| **Decoration carries no data** | Bevel, gloss and shadow encode nothing. Every quantity is carried by length, position or a number. A member with low vision or a monochrome display loses no information |

---

### 7.5 GEX overlay (Coach lock, 2026-08-31)

The panel may show **Chain GEX (estimate)** on the same strike axis as session volume. The pairing
answers one honest question: **is today's flow landing where the standing gamma is?** Flow into
strikes that already carry gamma is a different fact from flow into empty strikes.

**SV38 — reuse `gex_v1`, do not write a second GEX.** The overlay calls the **existing frozen**
`gex_v1` computation and its display divisor (Heatmap v0.2 §5.5, OD4). No new formula, no
"SVP GEX", no variant units on this panel. A second implementation of the same quantity is how
two surfaces start disagreeing about the same market.

**SV39 — two quantities, two scales, never one.** Volume is contracts. GEX is Γ·OI·S². There is
no common unit and no common scale.

| Forbidden | |
|-----------|--|
| Shared axis or shared normalisation | Each has its own baseline and its own units label |
| Stacking, summing, or ratio-ing the two into one bar | — |
| A composite "score" combining them | Same descope reasoning as SRS (OD-AF7) |
| Making GEX the visually dominant mark | Volume is the subject of this panel; GEX is context |

**SV40 — sign is spatially separated from volume.** *(Amended in v0.1.6 — Coach chose a heatmap
overlay; the original "neutral outline spine" form is superseded, the reasoning is not.)* GEX is
signed; volume is not. The two never share a visual channel: volume is **blue bars in the profile
region**, signed GEX is **diverging heat in its own rail** (§7.6). Sign may be carried by hue
**only** inside that rail, using the product's frozen diverging scale — never as a fill on the
volume bars themselves.

**SV41 — the estimate stays an estimate.**

| Rule | |
|------|--|
| Label | Always "Chain GEX (estimate)" (HM12). Never "dealer gamma", never "gamma exposure" unqualified |
| Null greeks | Vendor omits Γ on deep ITM → **invalid, never zero** (HM7 / AT-HM8 parity). A zero would draw a wall that isn't there |
| Net cell | `gex_net` needs both books present at that strike, else invalid (AT-HM13 parity) |
| Dealer sign is assumed, not observed | The convention (long calls / short puts) is a modelling choice Labs cannot verify from a chain |
| **Banned framing** | No "pin", "magnet", "wall", "support", "resistance", or "price will gravitate" — in chrome, tooltips, or copy (**AT-SV38**). The failure mode this overlay invites is exactly *heavy volume + big GEX ⇒ price pins here*, drawn from an estimate on an assumed dealer sign. A member trading that thesis can be hurt by it |

**SV42 — history needs Γ and OI in the artifact.** GEX on a back-selected session must be
reproducible, or the two doors diverge the moment a member walks back a day.

| Field | Grain | Why |
|-------|-------|-----|
| `open_interest` | **Once per contract per session** | OI settles overnight (T+1); it does **not** move intraday. Storing it per bucket would be 390 copies of one number |
| `gamma` | **Per bucket** | Γ moves with spot and time all session — it is what makes intraday GEX move at all |

**Say this in the UI:** within a session, GEX changes because Γ and spot change, **not** because
positions changed. Today's trading shows up in OI only tomorrow. That single sentence prevents
the most common misreading of every GEX chart on the internet.

### 7.6 Gamma heat rail and sign changes (Coach lock, 2026-08-31)

```text
│  Strike     Bid     Mid     Ask  │γ│              volume bars ◄──              │
│ ────────   ─────   ─────   ───── │ │                                            │
│  6460.00    2.05    2.10    2.15 │▓│           3.10K ████████                   │
│  6455.00    1.85    1.90    1.95 │▓│  12.35K ████████████████████████████       │
├─ 6452.30 ────────────────────────┤ ├────────────────────────────  price line ───┤
│ ▓6450.00▓  ▓1.62▓  ▓1.67▓  ▓1.72▓│░│        8.04K █████████████████████         │
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│⊗│─ ─ ─ ─  net GEX sign change (6445 → 6450) │
│  6445.00    1.44    1.49    1.54 │▒│                    2.61K ███████            │
│  6440.00    1.21    1.26    1.31 │▒│                       847 ████              │
                                    ▲
                          gamma heat rail (own scale, own units)
```

**SV43 — the heat rail.** Signed net GEX per strike renders as a **dedicated vertical heat rail**
— its own narrow column at full row height, on the frozen diverging scale, aligned to the same
row grid (SV24). It is a heatmap of the gamma profile down the strike axis, read alongside the
volume bars, never on top of them.

**Two background channels cannot both be the background.** The price trail (SV32) already tints
rows. So: rail carries GEX, trail keeps the row tint. If Coach prefers **full-row GEX heat**
instead (**OD-SV25**), the trail moves to an edge ribbon in the same change — one of them owns
the row, never both (**AT-SV43**).

**SV44 — "gamma flip" is two different objects. Name them separately.**

| Object | What it is | Status |
|--------|-----------|--------|
| **`gex_sign_change`** | The strike **interval** where per-strike net GEX changes sign — negative below, positive above (or the reverse). Read **directly off the chain**, no model | **Observed.** Ships first |
| **`zero_gamma_spot`** | The **spot price** at which *total* net GEX across strikes would be zero — the root of GEX(S) = 0, re-evaluating Γ at each candidate spot | **Modeled.** Requires OPF; see SV46 |

These are not the same number and must never share a label, a colour, or a tooltip. The first is
a fact about the strikes as they stand. The second is a model output resting on assumptions.

**SV45 — show every crossing, never "the" flip.** Real chains cross sign more than once. The
panel marks **all** sign changes in view as a rule between the two strikes, each labelled with its
bracketing strikes (`6445 → 6450`). Rendering exactly one crossing, or picking the "main" one,
invents a uniqueness the data does not have (**AT-SV39**). The cumulative-sum direction used for
any running-net display is frozen in `algo_version` (**OD-SV26**) — a cumulative profile summed
from the other end is a different picture of the same chain.

**SV46 — the modeled root is deferred and gated.** `zero_gamma_spot` is **not in first ship**
(**OD-SV27**). When it lands it goes through OPF, not a local formula, and it carries:

| Requirement | |
|-------------|--|
| Declared assumptions | Sticky IV (which sticky rule, named), OI held fixed, dealer sign convention |
| No root / multiple roots | **Named state, fail loud.** Never interpolate to one comfortable number. Same discipline as the OPF surface fit failing on calendar arbitrage rather than fitting through it |
| Labelled modeled | Alongside, never merged with, the observed sign change |

**SV47 — scope honesty: this is one expiration.** The artifact is per-expiration (OD-SV1), so
every gamma quantity here is **that expiration's**. The widely quoted "SPX zero gamma level" is
computed across **all** expirations and is a different number. The panel must say which
expiration its rail and crossings belong to, and must never present a single-expiration crossing
as the market's gamma level (**AT-SV41**). Cross-expiration roll-up needs multi-expiration
artifacts — **OD-SV28**, not a v1 claim.

**SV48 — no regime claims.** Extends the SV41 ban. The panel may state the **mechanical**
definition ("net GEX changes sign between these strikes, under the stated dealer convention").
It may **not** claim what happens as a result — no "below the flip volatility expands", no
"above it moves are dampened", no suppression/acceleration narrative. Those are contested
empirical claims about dealer behaviour Labs has not measured, and a member who sizes a position
on one because our chart implied it has been failed by us (**AT-SV38** extended).

### 7.7 Gamma pressure — visualising the hedging flow (Coach lock, 2026-08-31)

Coach: *"visualize the pressures exuded by gamma."* The honest version of "pressure" is not a
mood or a magnet. It is a **quantity with units**: how much underlying a hedged book must trade
to stay delta-neutral through a given move, and in which direction that trading pushes.

#### 7.7.1 The units already exist — freeze them (`gex_v2`)

`gex_v1` stores \(\Gamma \cdot \mathrm{OI} \cdot S^2\) and deliberately declines to claim a move
basis (Heatmap v0.2 §5.5: *"not 'per 1% move' unless a future `gex_v2` freezes that"*). Written
out, that number already carries one:

```text
Γ            = ∂Δ/∂S, per share
contract     = 100 shares
1% move      ⇒ ΔS = 0.01·S

shares to re-hedge per $1 move        = Γ · OI · 100
shares to re-hedge a 1% move          = Γ · OI · 100 · 0.01 · S = Γ · OI · S
notional dollars for that 1% move     = (Γ · OI · S) · S       = Γ · OI · S²
```

The ×100 and the ×0.01 cancel. **`Γ·OI·S²` is the notional dollars of underlying that must trade
to re-hedge a 1 % move** — under the stated dealer convention.

**SV49 — `gex_v2` freezes the interpretation, not the arithmetic.** Same computation as `gex_v1`,
new `algo_version` that fixes the **units label** (`USD notional per 1% move`) and its display
divisor, with the derivation above recorded in the changelog for India and Delta to check.
`gex_v1` is untouched and keeps its meaning; nothing recomputes.

This is what makes pressure showable: *"≈ $180M of SPX to be traded per 1% move, and this is
where it sits."* A member can feel that. `1.8e9` in arbitrary units teaches nothing.

#### 7.7.2 Direction is the other half

| Net gamma at/around a strike | Hedging behaviour | Effect on movement |
|---|---|---|
| **Positive** | Sell into strength, buy into weakness | **Dampening** — counter-trend flow |
| **Negative** | Buy into strength, sell into weakness | **Amplifying** — pro-trend flow |

**SV50 — render regions, not omens.** The rail shades **contiguous regions** by sign — dampening
above a crossing, amplifying below (or the reverse) — with region magnitude labelled in the frozen
units. Direction may be shown as small in-rail glyphs indicating **hedging flow direction**, and
those glyphs are labelled as hedging flow, never as expected price direction (**AT-SV44**).
Regions come from the same sign-change marks as SV45 — one computation, one picture, no second
crossing logic.

#### 7.7.3 The disclosure that has to be loud

**SV51 — open interest is yesterday's.** OI settles overnight (T+1). Every gamma quantity here is
computed on **the previous close's positions**. For same-day expiries, the positions being traded
right now are **entirely absent** from the gamma picture until tomorrow.

This is the single biggest way GEX visualisations mislead, and it lands hardest on exactly the
0DTE surface FatTail members use. It is not a footnote:

| Requirement | |
|-------------|--|
| Persistent label | The rail carries the OI as-of date **on the surface**, not in a tooltip (**AT-SV45**) |
| 0DTE emphasis | When the selected expiration is today, the panel states plainly that today's flow is not yet in OI |
| No silent freshening | Never blend an OI estimate from volume into the OI figure. Estimating is not measuring (VP honesty doctrine) |

**And this is the argument for the whole feature.** Session volume by strike is the *missing
half* of the gamma picture: OI shows where positions **were** as of last night, volume shows where
the market **is trading today**. Neither alone is the story. Side by side on one strike axis, a
member can see today's flow landing in — or far away from — last night's gamma. That synthesis is
what this panel is for, and it is not something the retail GEX tools show.

**SV52 — mechanism, never prediction.** The panel may state what hedging a book **requires**
under the convention. It may not claim what price **will** do. No "expect a bounce", no
"volatility regime", no shading that reads as a forecast band. Extends SV48 (**AT-SV38**).

**SV53 — pressure is conditional on three assumptions, always named together:** the dealer sign
convention (assumed, unobservable from a chain), OI staleness (SV51), and single-expiration scope
(SV47). A pressure figure shown without all three is malformed (**AT-SV46**).

#### 7.7.4 Later, and only with evidence

The archive makes an honest follow-up possible that assertion cannot: for back-selected sessions,
compare where the pressure sat against **where price actually went** (the spot track, SV33). If
the mechanism shows up, it shows up in the data; if it does not, members deserve to know that too.
**OD-SV29** — defer to a research memo, not a v1 chrome claim. A surface that can check itself is
worth more than one that asserts.

---

## 8. Two doors

| Door | Presentation |
|------|--------------|
| **Heatmap** `session-volume` | The §7 panel, in the chain panel, aligned to the ladder / fly matrix so volume is read against structure |
| **VP app** viewport | Session option-volume panel, session-scoped, beside the underlier composite |

**SV14 — the two volumes never merge.** Option volume by strike and underlier volume by price
are different measurements in different spaces. They may sit side by side; they are never summed,
never share a series, and never share one axis **unless** the underlier profile is served in
**product price space** under a frozen proxy map. Today OD-VP7's default is `price_space=series`
(SPY dollars), so an SPX-strike / SPY-price overlay is **BLOCKED** until that DL closes
(**AT-SV9**). Drawing SPY-dollar bins against SPX strikes would be a lie with a legend.

**SV15 — same numbers both doors.** Row values must match to the digit across doors; divergence
is a defect (Accounts & Capital V1 precedent).

---

## 9. APIs

```text
GET  /api/me/market/chain-session-volume
       ?symbol=&expiration=&session_date=&algo_version=&window_from=&window_to=
GET  /api/me/market/chain-session-volume/horizon?symbol=&expiration=
GET  /api/admin/market/chain-session/status
POST /api/admin/market/chain-session/rebuild
```

| Law | |
|-----|--|
| **SV16 — read-only request path** | The member path **never** triggers a Massive pull, a backfill, or a rebuild. 404 when never built; explicit "outside horizon" when past the archive (**AT-SV11**) |
| **SV17 — access** | `require_session` + tool-member read; universe gate on symbol (HM13/HM9 parity) |
| **SV18 — coverage always** | Every 200 carries the §2.3 coverage object. A response without it is malformed |
| **SV19 — agent parity** | Agents read the same payload; tool description states vendor-cumulative source and the unattributed bucket. Same honesty as "Chain GEX (estimate)" |

---

## 10. Jobs

| Job | Behavior |
|-----|----------|
| **Live writer** | Subscribes to generations already being produced; writes bucket rows for the current session. No second Massive subscription for the same key |
| **Full-scope poller** | Pulls the full chain (paged) on the session clock for enabled `(symbol, expiration)` pairs — this is what makes `strike_scope: full` possible |
| **Backfill** | Reads the existing generation archive; writes days it can, labeled `band(w)` per SV8 |
| **Daily close** | Finalize session, compute coverage, set `complete` **only** on success; partial day never advances the watermark (VP7 parity) |

**SV20 — rate isolation.** The full-scope poller defers to the live Market Bus and chain
generation budget (VP15 / OPF §9 parity). It is a batch citizen; it never starves the member's
live surface. Enabled pairs are **config**, not "every expiration we can think of" — the poller's
cost is linear in enabled pairs and must be declared before it runs.

**SV21 — config fail-loud.** Mount map, session clock, enabled pairs, max gap, page limits — all
required config when the plane is enabled; missing ⇒ boot/job aborts (invariant 2).

---

## 11. Non-goals (v1)

- Options print tape / OPRA measurement
- Buy vs sell, opening vs closing, or dealer-side classification
- Multi-expiration composite as a stored artifact (read-time roll-up only)
- Multi-session composite profile ("two weeks of volume in one picture") — **OD-SV8**
- Underlier VP overlay on one axis (SV14, blocked)
- POC / VA / HVN / LVN (SV13)
- Any copy implying volume at a strike predicts price, or promises member outcomes (invariant 8)
- MSC code or schemas (HM10 / OC13 / VP12)

---

## 12. Acceptance tests

| ID | Test |
|----|------|
| **AT-SV1** | Per contract: `Σ Δ(t) + unattributed = V_end`, exactly, on a golden session fixture |
| **AT-SV2** | Non-monotonic cumulative read → Δ clamped to 0, `revision_count` incremented, **no negative bar** |
| **AT-SV3** | Injected gap beyond max → `gap_count`/`max_gap_seconds` recorded, volume lands in `unattributed`, session not marked complete |
| **AT-SV4** | Template / side / value-mode switch → **zero** extra Massive and zero chain HTTP while stream healthy (HM2/HM3 preserved) |
| **AT-SV5** | Writer job follows `next_url` and records `pages`; **same fixture** through the live generation path still hard-errors (HM18 intact) |
| **AT-SV6** | Session before horizon → explicit no-data response and no-data UI state; never an empty profile that reads as zero volume |
| **AT-SV7** | Standard + adjusted at one strike → standard wins; `excluded_adjusted_count ≥ 1` |
| **AT-SV8** | Strike and expiration roll-ups computed at read equal the sum of contract rows |
| **AT-SV9** | Attempt to render option-strike bars and underlier price bins on one axis under `price_space=series` → refused |
| **AT-SV10** | Mapped mount absent → job fails loud per mount; no partial write |
| **AT-SV11** | Member GET never initiates a pull or rebuild (call-count assertion on the Massive client) |
| **AT-SV12** | Two generations 0.3 s apart with unchanged volume → Δ = 0 (valid), **not** null |
| **AT-SV13** | Both doors render identical values for the same `(session, symbol, expiration, strike)` |
| **AT-SV14** | Coverage object present on every 200 and on every artifact `_meta` |
| **AT-SV15** | `vol_oi` with OI = 0 or null → invalid cell, not ∞/NaN |
| **AT-SV16** | Column order is Strike · Bid · Mid · Ask; a bar's vertical centre matches its strike row's centre at every scroll position and row height (SV22/SV24) |
| **AT-SV17** | Bars anchor at the right edge and grow leftward; zero volume renders zero length at that edge, and a missing-volume row renders an invalid marker instead of a bar (SV23/SV27) |
| **AT-SV18** | No copy, tooltip, legend, or payload field labels volume as long, short, bought, sold, opening, or closing (SV28) |
| **AT-SV19** | Spot between two listed strikes renders the price line at its **proportional** position with its own value label; the ATM row is emphasised separately and is never labelled as the price (SV29) |
| **AT-SV20** | Price moves within ±2 rows of centre → **zero scroll events** (SV30 rest) |
| **AT-SV20b** | Simulated run: price walks 10 rows in one direction → viewport offset approaches centre **monotonically**, lagging the line throughout, and settles with **no overshoot** and no oscillation (SV30 follow/settle) |
| **AT-SV20c** | Instantaneous gap larger than one viewport → single reposition, **no long slide** (SV30 jump) |
| **AT-SV20d** | Tape faster than the velocity clamp → scroll rate stays at the cap and the view closes the gap after price steadies (SV30 clamp) |
| **AT-SV21** | Member scrolls to a far wing, price then moves outside the band → view does **not** move; Recenter control restores auto-centring (SV30) |
| **AT-SV22** | Market closed / model held → price line frozen and labelled held; no re-centre fires (SV30) |
| **AT-SV23** | Back-selected session → mark labelled with its as-of time; the string "current" appears nowhere; centring uses that session's as-of spot (SV31) |
| **AT-SV24** | `prefers-reduced-motion` → re-centre is an instant reposition, no animation |
| **AT-SV25** | During an active follow, the price line's rendered value and proportional position match the latest generation's spot — the **viewport** lags, the **line** never does (SV30) |
| **AT-SV26** | Trail tint, ATM row emphasis, price line and volume bars are four distinguishable marks in one row; trail never renders at or above ATM emphasis weight, and never in a valence (green/red) palette (SV32) |
| **AT-SV27** | Trail covers only the lookback window: a strike traversed before the window has **zero** tint; rows are dropped, not faded forever (SV32) |
| **AT-SV28** | Back-selected session renders a trail from the artifact spot track ending at the as-of time; a bucket with null spot is skipped, never interpolated (SV32/SV33) |
| **AT-SV29** | Bar tip label present on every valid row, outside the tip; a bar long enough to reach the ladder flips its label inside and **never** overlaps Strike/Bid/Mid/Ask (SV34) |
| **AT-SV30** | Labels are never dropped to fit: at minimum row height all in-view rows carry a legible label with no vertical collision (SV34) |
| **AT-SV31** | Format vectors: `847` → `847`; `1000` → `1.00K`; `1234` → `1.23K`; `12345` → `12.35K`; `123456` → `123.46K`; `999995` → `1.00M`; `1234567` → `1.23M`. Tooltip and payload carry the exact integer in every case (SV35) |
| **AT-SV32** | Rendered bar length for a given volume is identical with bevel on and off — the bevel adds no length (SV37) |
| **AT-SV33** | Tip label meets AA contrast both outside the bar on black and flipped inside the blue fill (SV36) |
| **AT-SV34** | GEX overlay values are produced by the **existing** `gex_v1` path — a fixture chain gives byte-identical numbers on the Heatmap GEX template and the SVP overlay (SV38) |
| **AT-SV35** | Null Γ or null OI at a strike → GEX mark **invalid**, never a zero-length mark (SV41) |
| **AT-SV36** | Volume and GEX render on separate baselines with separate unit labels; no shared normalisation, no stacked or summed mark, no composite value exposed in payload or export (SV39) |
| **AT-SV37** | Historical session: GEX recomputed from the artifact's stored Γ (per bucket) and OI (per session) equals the value computed live for that same bucket (SV42) |
| **AT-SV38** | The strings pin, magnet, wall, support, resistance and gravitate appear nowhere in this surface's copy, tooltips, legends, or payload labels — extended to regime claims: no "volatility expands/dampens below/above" phrasing (SV41, SV48) |
| **AT-SV39** | Fixture chain with **three** net-GEX sign changes in the window renders **three** marks, each labelled with its bracketing strikes; no "primary" crossing is selected (SV45) |
| **AT-SV40** | When `zero_gamma_spot` lands: no root, or multiple roots, → named state surfaced; no single number is emitted (SV46) |
| **AT-SV41** | Rail, crossings and any gamma figure carry the expiration they belong to; no copy presents a single-expiration crossing as a market-wide gamma level (SV47) |
| **AT-SV42** | Tooltip on any GEX mark states the dealer sign convention it assumes (SV41) |
| **AT-SV44** | Direction glyphs are labelled as **hedging flow**; no copy, tooltip or legend renders them as expected price direction (SV50/SV52) |
| **AT-SV45** | The OI as-of date is visible **on the surface** whenever any gamma mark is shown; selecting a same-day expiration additionally states that today's flow is not yet in OI (SV51) |
| **AT-SV46** | A pressure figure rendered or exported without all three of dealer convention, OI as-of, and expiration scope fails validation (SV53) |
| **AT-SV47** | `gex_v2` values equal `gex_v1` values on a fixture chain — the freeze changes units labelling and display only, never the arithmetic (SV49) |
| **AT-SV43** | GEX heat and price trail never both occupy the row background: rail form keeps the trail on the row; full-row form moves the trail to an edge ribbon (SV43) |

---

## 13. Probes (evidence before GO — invariant 4)

| ID | Probe | Why blocking |
|----|-------|--------------|
| **P-SV1** | **Confirm the volume field's exact name and semantics** in the Massive options snapshot: is it session-cumulative, when does it reset, is it delayed relative to quotes, does it revise? Reconcile one contract's end-of-session value against an independent daily source | **The whole measurement rests on this.** Blocking |
| **P-SV2** | Full-chain page count, latency and rate cost for the widest live case (e.g. SPX 0DTE) | Sizes the poller and proves SV7/SV20 are affordable |
| **P-SV3** | Measured artifact bytes per session-expiration | Turns OD-SV4 retention into arithmetic instead of a guess |
| **P-SV4** | **What is actually on the archive mount today** — path, mount role, symbols, expirations, earliest and latest complete session, whether generations are band-clipped or full | Converts "about two weeks" from assertion into recorded evidence, and settles SV8 backfill scope |

Store under `docs/evidence/session-volume-profile/`.

---

## 14. Open decisions — Coach Accept / Override

| # | Question | Recommendation |
|---|----------|----------------|
| **OD-SV1** | Artifact scope: one expiration, or all listed | **One expiration**; roll-ups at read |
| **OD-SV2** | Enabled `(symbol, expiration)` pairs for the full-scope poller | Front expirations of the coaching symbols; explicit config list |
| **OD-SV3** | Session clock bucket | **1 minute** (SSR precedent). Live view stays real-time regardless |
| **OD-SV4** | Retention | **Keep** — pending P-SV3 |
| **OD-SV5** | **Name the archive mount** ("gold disk") in `market_storage_mount` and assign an existing role | Coach names it; no new role (SV10) |
| **OD-SV6** | `unattributed_pct` threshold above which sliced/window modes are disabled | **10%** |
| **OD-SV7** | Default value mode | `total` |
| **OD-SV8** | Multi-session composite ("last N sessions" profile) | **Defer to v0.2** — one session is the honest unit first |
| **OD-SV9** | VP app door in first ship, or staged after the Heatmap door | **Stage it** — same artifact, second door in the next phase |
| **OD-SV10** | Member label | "Session volume" / "Volume by strike" — Echo + Tango to settle |
| **OD-SV11** | Bar composition in `total`: single bar, or two-tone call/put split from the right edge | **Two-tone split** — call/put balance at a strike is the point |
| **OD-SV12** | **"Long / short" (§7.1)** — does Coach mean the member's own position direction overlaid on the ladder, or something else? Trade-side attribution is not derivable (SV28) | **Coach to say.** Recommend: member's own open-book direction as an overlay chip on the strike row |
| **OD-SV14** | Centring dead band | **±2 strike rows.** Alternative: ±15% of viewport height — rows are the honest unit on a discrete grid |
| **OD-SV15** | How auto-centring resumes after a manual scroll | **Recenter control + 30 s idle.** Coach may prefer control-only (no timeout), which never surprises the member |
| **OD-SV16** | Follow time constant — how hard it chases | **≈400 ms.** Lower = tighter and more urgent; higher = lazier trail. Coach should feel this on a live tape before it freezes |
| **OD-SV17** | Jump threshold (slide vs reposition) | **One viewport height** |
| **OD-SV18** | Velocity clamp | **~8 strike rows / second** |
| **OD-SV20** | Unit roll point | **Roll at four integer digits** (`999,995` → `1.00M`). Alternative: never roll below 1M, accepting `999.99K` |
| **OD-SV22** | GEX render form | **Signed spine on its own baseline** beside the volume bars. Alternative: mirrored second bar — clearer, twice the ink |
| **OD-SV23** | GEX overlay default state | **Off.** The member turns on context when they want it; a busy default panel teaches less |
| **OD-SV25** | GEX heat form | **Dedicated rail** (trail keeps the row). Alternative: full-row heat, which forces the trail to an edge ribbon in the same change |
| **OD-SV26** | Cumulative net-GEX summation direction (frozen in `algo_version`) | From the **low strike upward**; state it on the axis |
| **OD-SV27** | `zero_gamma_spot` (modeled root) in first ship? | **No — defer.** Ship the observed sign change, see whether members read it well, then take the modeled root through OPF review |
| **OD-SV29** | Pressure-vs-outcome research view from the archive (§7.7.4) | **Defer to a research memo.** Ship the mechanism honestly first; earn the claim with data |
| **OD-SV30** | Pressure display unit | **USD notional per 1% move** (derivation in §7.7.1). Alternative: shares per point — more concrete for SPX traders, worth Coach's ear |
| **OD-SV28** | Cross-expiration gamma roll-up | **Defer.** Needs multi-expiration artifacts; a per-expiration number must not be dressed as a market level (SV47) |
| **OD-SV24** | GEX display divisor on this panel | **Inherit the Heatmap's** (OD4, e.g. 1e9) — never a second convention |
| **OD-SV21** | Blue bars: flat fill, or luminance ramp by magnitude | **Flat blue.** A ramp double-encodes what length already says, and risks reading as the fly matrix's heat |
| **OD-SV19** | Trail lookback window | **15 minutes** of session time. Coach may want it tied to the selected value-mode window instead, so the trail and the sliced volume describe the same interval — arguably the better idea, worth a look on a live tape |
| **OD-SV13** | Quote columns when side filter is off — one book at a time, or calls-left / puts-right dual ladder around the strike axis | **One book at a time** (side stays a view filter, HM16) |

---

## 15. Phases

Phases are prefixed **SVP** so a phase id is never mistaken for a law id (`SV*`).

| Phase | Deliverable | Exit |
|-------|-------------|------|
| **SVP0** | This Spec accepted · ODs disposed · **P-SV1 and P-SV4 closed** · Heatmap Templates v0.3 amendment drafted · DL entry · board seeded | Coach GO |
| **SVP1** | Catalog migration + artifact writer + mount law + coverage | AT-SV1/2/3/10/14 |
| **SVP2** | Full-scope poller + pagination split | AT-SV5, P-SV2 evidence |
| **SVP3** | Member + admin APIs, horizon endpoint | AT-SV6/11/15 |
| **SVP4** | Heatmap `session-volume` template + §7 panel + live path | AT-SV4/7/12/16/17 |
| **SVP5** | Back-select control driven by catalog horizon | AT-SV6, SV11 |
| **SVP6** | Backfill from existing archive, labeled `band(w)` | AT-SV8, SV8 |
| **SVP7** | VP app door (OD-SV9) | AT-SV13, AT-SV9 |
| **SVP8** | Agent export parity | SV19 |

---

## 16. Review gates before Coach GO

Per `agents/bench/spec-create-review-workflow.md`:

| Gate | Question this Spec must survive |
|------|--------------------------------|
| **India** | Is the Heatmap amendment the right boundary, or does SVP belong wholly in the VP/market-data plane? Is contract-grain storage the correct SoR shape? |
| **Echo + Tango** | Does a bleeding trader read this profile and learn something true, or does it invite "big volume = magnet" superstition? |
| **Hotel** | **Would a member be made worse by believing a wrong version of this?** Volume ≠ positioning; vendor-cumulative ≠ measured tape; band-clipped ≠ full chain. Every one of those is a way to be wrong |
| **Mike** | Access gate, universe gate, no new unauthenticated surface |
| **Foxtrot** | Mount presence, poller scheduling, rate isolation on the production host |
| **Delta** | Evidence pack: P-SV1…P-SV4, AT transcripts, browser walk on both doors |
| **Lima** | DL entry the same day as approval; Arch companion; parity across Spec/Arch/ADMIN-GUIDE |

---

## 17. Document control

| Version | Date | Notes |
|---------|------|-------|
| **v0.1** | 2026-08-31 | Initial DRAFT from Coach intent + four clarifications. Establishes vendor-cumulative measurement law, unattributed bucket, scope split from HM17/HM18, one-artifact-two-doors, SV14 overlay block |
| **v0.1.6** | 2026-08-31 | **Coach gamma lock (§7.6, §7.7):** GEX renders as a dedicated **heat rail** (SV40 amended from spine); `gex_sign_change` (observed) separated from `zero_gamma_spot` (modeled, deferred); all crossings shown, never one; single-expiration scope stated; **`gex_v2`** freezes the units as USD notional per 1% move with the derivation written out; pressure rendered as signed regions with hedging-flow direction; **OI staleness disclosure made a surface-level requirement**, with session volume named as the missing "today" half of the gamma picture; regime and prediction claims banned. SV43–SV53 · AT-SV39–47 · OD-SV25–30 |
| **v0.1.5** | 2026-08-31 | **Coach GEX lock (§7.5):** overlay reuses the frozen `gex_v1` path and its divisor — no second GEX; separate baselines and units, never summed or scored; sign by geometry not hue; estimate labelling and the banned pin/magnet/wall framing; artifact extended to carry Γ per bucket and OI per session so historical GEX is reproducible, with the intraday "OI settles overnight" statement in the UI. SV38–SV42 · AT-SV34–38 · OD-SV22–24 |
| **v0.1.4** | 2026-08-31 | **Coach label + look lock (§7.3, §7.4):** volume level hangs off the bar tip with flip-inside collision rule; format = exact integer below 1,000, two decimals + unit above, half-away-from-zero, exact value always in tooltip/payload. Black ground, blue beveled bars, bevel adds no length, single blue never the diverging heat palette, trail stays gold. SV34–SV37 · AT-SV29–33 · OD-SV20–21 |
| **v0.1.3** | 2026-08-31 | **Coach motion lock (§7.1):** centring becomes two states — rest (dead band, zero scroll) and **follow** (eased approach that visibly trails and catches up), with settle, jump, velocity clamp and truth-before-motion guards. Adds the **price trail** (decaying highlight of recently traversed strikes, no valence colour, bounded window) and the **session spot track** in the artifact that makes trail-on-history and as-of spot possible. SV30 rewritten · SV32–SV33 · AT-SV20b/c/d · AT-SV25–28 · OD-SV16–19 |
| **v0.1.2** | 2026-08-31 | **Coach price lock (§7.1):** price line drawn at true proportional position (not snapped to the ATM row), ATM row emphasised separately, auto-centring with a ±2-row dead band, manual scroll wins, held price frozen, past sessions labelled by as-of time. SV29–SV31 · AT-SV19–24 · OD-SV14–15. Column order restated in words in SV22 |
| **v0.1.1** | 2026-08-31 | **Coach layout lock (§7):** strike is the axis, then Bid · Mid · Ask; profile anchored right, growing leftward; one shared row grid. SV22–SV28 · AT-SV16–18 · OD-SV11–13. §7.1 records that long/short is not derivable from snapshot volume (OD-SV12) |

**One-line law:**
**Session option volume is the vendor's cumulative contract volume, read on a session clock,
attributed to time only as far as the snapshots honestly allow — one artifact, two doors, the
unattributed remainder always shown, and never confused with the underlier's volume by price.**
