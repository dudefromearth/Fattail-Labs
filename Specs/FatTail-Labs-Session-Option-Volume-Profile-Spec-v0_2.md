# FatTail Labs — Session Option Volume Profile Spec v0.2

**Status:** **SUPERSEDED** by [v0.3](./FatTail-Labs-Session-Option-Volume-Profile-Spec-v0_3.md) (2026-09-01) — probe evidence returned.

> **Use v0.3 for all new work.** Four structural assumptions in this revision did not survive the evidence: the day roll (v0.3 SV62), the vendor reconcile (SV63), the session window (SV64), and the storage layout (SV67, withdrawn).
**Date:** 2026-09-01
**Current revision:** **v0.2.2** (filename stays `…-v0_2.md`; the revision field is authority)
**Supersedes:** [v0.1](./FatTail-Labs-Session-Option-Volume-Profile-Spec-v0_1.md) (content rev v0.1.6)
**Advisor status:** fold of G1–G17 **signed off** 2026-09-01 ("accepted shape"); v0.2.2 is the errata pass. **No further spec revision — the next artifact is the SVP0 evidence packet (§15).**
**Canonical filename:** `Specs/FatTail-Labs-Session-Option-Volume-Profile-Spec-v0_2.md`
**Type:** Product + data-plane Spec — **session-cumulative option contract volume by strike**, live and back-selectable
**Short name:** **SVP** / **Session Volume Profile**
**Board (when seated):** `agents/p-session-volume-profile/` — **does not exist yet; correct until GO**

**Content hash (v0.2.2):** recompute at Coach GO:
`shasum -a 1 Specs/FatTail-Labs-Session-Option-Volume-Profile-Spec-v0_2.md` → record in DL.

**External review folded:** advisor reviews **2026-09-01** — first pass **G1–G8** (§19), second
pass **G9–G17** (§19.1). Both accepted in full; **G2** with a modification that preserves the Coach
column lock. Two G1-class defects were closed by these folds: v0.1's live door read a wing-clamped
generation while its artifact was full-chain (**G1**), and v0.2's writer could still have stamped
`full` on band rows (**G9**).

**Headline change from v0.1:** the first ship is **volume only**. Gamma rail, sign changes and
pressure are staged behind their own gates (§15). v0.1 asked one review to approve two products.

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
| Gamma | GEX as a **heat rail** on the strike axis, sign changes marked, **pressure** shown as hedging flow in real units — with OI staleness disclosed on the surface (Appendix A) |

---

## 0. Mission

```text
Massive chain snapshot API
   │
   ├─► full-scope poller (paged, session clock) ──┐
   │        the ONLY producer of strike_scope=full │
   │                                               ▼
   └─► live generation (wing-clamped) ───► session artifact (contract grain, 1m clock)
            │                                      │
            │  tail: ATM band only,                ├─► Heatmap template `session-volume`
            └─►  quotes + cumulative volume ──────►│      (today and back-select)
                 for contracts in the band          ├─► Volume Profile app viewport (SVP7)
                                                    └─► agents / analysis

   fallback only: generation alone → profile stamped band(w), never full   [SV54]
```

Give a member, for one underlier and one expiration, **how much option volume traded at each
strike this session** — and let them walk that same picture back through prior sessions as far
as the archive goes.

**One artifact, two doors — one SoR now, the second door staged.** The Heatmap panel and the VP
app read the **same** server artifact and the **same** numbers, at the **same** `strike_scope`
(SV54). A number that differs between the two doors is a defect, not a view. The VP door lands at
SVP7 (OD-SV9); v0.1's mission line promised both at once while its OD table staged one.

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
  strike_scope: "full" | "band(w)",     // SV8 · SV54 — live door included
  live_tail_scope: "band" | "full",     // SV54b — what the bus tail actually covers
  last_poller_at,                       // SV54b — wing rows are current to this, not to now
  wing_clock_seconds,                   // SV54b — poller cadence for rows outside the band
  source: "vendor_snapshot_cumulative",
  algo_version, complete: bool
}
```

The three `SV54b` fields are **not optional on a live session**: without them the mixed-cadence
disclosure is chrome with no payload behind it, and AT-SV14 would pass on a coverage object that
cannot support the strip the surface is required to draw.

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
| Grain stored | **Contract** — `(session_date, symbol, expiration, side, strike, bucket)` carrying cumulative volume, **mid** (for premium-traded) and **Γ**; **OI once per contract per session**; plus a per-bucket **spot track** (SV33, SV42). Storage of the gamma fields at SVP4a is deliberate — **SV61** |

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

**SV61 — store the gamma fields from day one; forbid 4a from reading them (G10).** `svp_v1`
writes Γ and OI from the first session, so that when the rail opens at SVP4b the history is
replayable rather than starting from that day. The alternative — a `svp_v1` / `svp_v1g` version
split — buys nothing and costs a full rebuild.

The risk this creates is the honest one: fields on disk are a standing invitation to "chart it
while we're there," which is how SVP4a quietly becomes SVP4b without passing the §18 gate. So:

| Rule | |
|------|--|
| The **SVP4a API shape** contains volume, coverage and spot. Γ, OI and every derived GEX field are **absent from the 4a payload**, not merely unrendered (**AT-SV54**) |
| Reading them into chrome before SVP4b opens is a **gate violation**, not an optimisation |

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

**SV54 — one scope across both doors (G1).** *v0.1 had a defect here.* The live chain generation
is **wing-clamped** (HM17), while the artifact is **full chain** (SV7). Reading today from the
generation and history from the artifact would put a band-clipped profile and a full-chain
profile behind the same control — and AT-SV13 (same numbers both doors) could not hold.

| Path | Law |
|------|-----|
| **Primary** | The artifact on this path is **the poller's artifact** (SV54a) — not whatever the generation-subscribed writer produced. The live door reads **that artifact for today** (up to `last_gen_at`) **plus the client tail** from the generation stream — the mechanism already specified for sliced modes. Both doors then share one `strike_scope` |
| **Degraded fallback** | If the artifact is unavailable for today, the panel may fall back to the pure client read of the current generation. It is then **labelled `strike_scope: band(w)` on the surface**, not silently shown as the full picture |
| **`strike_scope` is a live-door field** | Not only a backfill field. Every payload and every rendered profile — today included — carries the scope it was actually built from (**AT-SV48**) |
| **Never mixed** | One profile is built from one scope. A profile is never part-artifact, part-generation across different strike ranges |

**SV54a — only the poller can produce `full` today (G9).** v0.2 left this implicit and an
implementer would reasonably have built the cheap version: a generation-subscribed writer stamping
`full` because the *job type* is "SVP writer", while the rows it wrote came from a clamped band.
AT-SV48 would have passed on a lie.

| Rule | |
|------|--|
| `strike_scope: full` on a live session is produced **only by the full-scope poller** writing the artifact **during** the session — not at close, not by the generation writer |
| The generation-subscribed live writer may **only** extend contracts already present in that artifact, or stamp **`band(w)`** |
| The client tail may update quotes and cumulative volume **only for contracts present in the current generation** |
| Wing rows outside the generation band **hold the last poller value** and are marked **held-to-clock** — not live (**AT-SV53**) |

**SV54b — one profile, two cadences, disclosed (G14).** A live full-scope profile is genuinely
mixed-freshness: ATM strikes tick on the bus, wing strikes step once per poller clock. That is
honest **only if stated**. Coverage carries `live_tail_scope: band | full` and the wing clock, and
the surface marks held-to-clock rows. A panel that presents both as one cadence is defective.

"Today costs nothing extra" survives only as the **fallback** claim, not the default one.

| Mode today | Path |
|------------|------|
| `session_total` | Artifact-to-`last_gen_at` + client tail; recomputed per push (HM11 parity) |
| Sliced / window | Same source, sliced by bucket |
| Fallback | Current generation only, `band(w)` labelled |
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
| `call` / `put` | Single book | **Default** (G2 — see SV55). Side filter, not a re-fetch (HM16) |
| `total` | `V_call(K) + V_put(K)` | Both books in one bar. Quote columns must obey SV55 |
| `pct_of_session` | `V(K) / Σ V` | Share of the expiration's session volume |
| `cp_skew` | `(V_c − V_p) / (V_c + V_p)` | Descriptor; invalid when denominator = 0 |
| `vol_oi` | `V(K) / OI(K)` | **Labeled descriptor** (SV2). Invalid when OI = 0 or null — never ∞/NaN. **Disabled for same-day expiries — SV58** |
| `window` | `Σ Δ(t)` over a member-chosen window | Requires coverage; disabled **with a stated reason on the coverage strip** when `unattributed_pct` exceeds **OD-SV6** — never a silently greyed control |

**SV55 — the quote columns and the bar must describe the same book (G2).** A two-tone `total`
bar carries both books while Bid/Mid/Ask carry one; the eye binds them and reads the wrong
quote against the bar. That is a reading error, not a preference.

| Resolution | |
|-----------|--|
| **Default is a single book** | Side filter on (`call` or `put`). Coach's Strike · Bid · Mid · Ask · VP columns hold exactly as locked, and quote and bar agree by construction |
| **In `total`** | The panel must do one of: hide Bid/Mid/Ask, or show **dual quote stubs** (call quotes one side of strike, put quotes the other). It may **not** show one book's quotes beside a both-book bar (**AT-SV51**) — **OD-SV13** picks which |

*Note for Coach:* the reviewer's version of this was "hide the quotes in `total`." Defaulting to a
single book instead keeps your five columns on screen in the default view, and makes `total` the
deliberate mode where the quote question has to be answered. Your call at SVP0.

**SV58 — `vol_oi` is not available on same-day expiries (G5).** OI settles overnight (SV51), so
on a 0DTE chain the denominator is last night's stock while the numerator is today's flow. The
ratio then invites exactly the "new money / unusual activity" read that SV2 exists to prevent, and
it does so without the loud disclosure the gamma marks carry. For same-day expirations the mode is
**unavailable with a stated reason**, not a rendered number (**AT-SV49**). It remains valid for
dated expiries, where overnight OI is a real stock.

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
| **SV24 — one row grid** | Ladder rows and profile rows share one row height and one strike ordering (descending strike, high at top). A bar is always on its strike's line. Independent scrolling of the two regions is forbidden. **Row height itself is set by the density mode (SV56)**, not fixed here |
| **SV25 — spot rule** | Spot emphasis crosses **both** regions as one horizontal marker, per existing heatmap spot emphasis. Two distinct things, never merged (§7.1) |
| **SV26 — bar scale is stated** | The scale (max bar = session max at any strike in view, or a sticky scale per §6) is labelled. Bars are never rescaled per generation without the 25% hysteresis rule |
| **SV27 — invalid rows** | Missing quote → "—" in the quote cell (HM7). Missing volume → no bar **and** an invalid marker, never a zero-length bar that reads as "traded nothing" (SV9) |

**SV56 — density modes (G3).** v0.1 asserted two incompatible things: share the sibling heatmap's
row grid (SV24), *and* never drop a tip label, raising row height instead (SV34/AT-SV30). On an
SPX 0DTE chain at current heatmap density both cannot hold — and a 20–24 px row carrying a
beveled bar, a flipped-inside label, a gamma rail, a between-rows price line, ATM wash and a gold
trail fails HIG type scale and AA contrast the first time it sits beside a fly matrix.

| Mode | Rule |
|------|------|
| **Compact** (heatmap-aligned, default when the panel shares a workspace with another template) | Row height **equals the sibling template's**. **No tip labels** — magnitude is bar length; the number appears on hover and in the inspector strip. Nothing is dropped silently: the mode is named on the surface |
| **Comfort** (default when the panel is the primary view) | Taller rows, tip labels per SV34, trail and bevel. **AT-SV30 applies to Comfort only.** (When SVP4b opens, Comfort is also where the rail lives — §A.2; it is not part of a 4a reading) |

**Compact mark budget (G13).** Surrendering labels was not enough: bevel, trail wash, ATM wash and
a between-rows price line still compete on a 20–24 px sibling row, and would fail AT-SV26 and AA
contrast on the trail.

| Compact renders | Compact drops |
|-----------------|---------------|
| Price line · ATM emphasis · bar | Tip labels · **row-tint trail** (edge tick only, or Comfort-only) · **bevel** |

Dropping the bevel in Compact costs nothing by SV37's own logic — decoration carries no data, so
it is the first thing to go when the row is tight (**AT-SV55**).

This is the density-versus-clarity trade-off v0.1 refused to make. Making it a mode makes it the
member's choice instead of a hidden compromise (**AT-SV50**).

**SV57 — coverage is chrome, not payload (G7).** The honesty fields were specified as payload
(§2.3) and would have arrived as tooltips — which is how honest metadata becomes decoration. They
are a **persistent strip on the surface**, always on:

**SVP4a strip — no OI (G11).** On a volume-only panel there is no gamma mark, and putting
`OI as-of` on the strip introduces open interest as a co-equal quantity the member did not ask
for — reintroducing exactly the volume/OI conflation SV2 exists to stop. SV51 already scopes the
OI disclosure to *whenever a gamma mark is shown*; the strip follows that scope.

```text
4a:   SPX · 16 Aug 26 · session volume (vendor cumulative) · scope: full · unattributed 3%
4b+:  … · OI as-of 15 Aug · expiration 16 Aug 26
```

| Rule | |
|------|--|
| Always visible | Never a hover, never collapsed by default |
| OI as-of | **From SVP4b**, when a gamma mark exists. Not on the 4a strip (**AT-SV54**) |
| Same-day expiry | From SVP4b, adds the sentence from SV51. At 4a it appears only as the reason string on the disabled `vol_oi` control |
| Mixed cadence | When `live_tail_scope: band` on a `full` profile, the strip says the wings are on the session clock (SV54b) |
| Disabled modes | State the reason on the strip (e.g. window modes off because unattributed 12% > threshold) — not a silently greyed control |
| Band-clipped scope | `scope: band(±w)` reads as a scope statement, and the wings render as absent data, never as zero (SV9) |

**The question the panel teaches at SVP4a.** *What traded at this strike this session — and how
complete is that picture?* Source, scope and unattributed share are the terms of that answer, and
a member who cannot see them at a glance is reading a picture without its terms.

The wider synthesis — today's flow against last night's structure — belongs to §A.1 and arrives
with the gamma marks. Advertising it on a surface that shows no gamma teaches a pairing the panel
does not display.

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

This is the **SVP4a** set. Gamma acceptance (AT-SV34–47, 52) moved to Appendix A with its laws
(G15). **The AT set is now closed** — further coverage belongs in seeds and gate reports, not in
more spec rows.

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
| **AT-SV48** | Today's payload and rendered profile carry `strike_scope` matching what was actually read — artifact `full` or fallback `band(w)` — and the on-surface string matches the payload (SV54) |
| **AT-SV49** | Same-day expiry: `vol_oi` is unavailable with a stated reason, and any gamma mark shows OI as-of plus "today's flow is not in OI" **without a tooltip** (SV58, SV51) |
| **AT-SV50** | Compact mode: no tip labels and row height equals the sibling heatmap template. Comfort mode: AT-SV30 holds. The active mode is named on the surface (SV56) |
| **AT-SV51** | `total` with a two-tone bar never renders single-book quote columns beside it — quotes are hidden or dual (SV55) |
| **AT-SV53** | A live session stamped `full` has poller rows for strikes outside the live generation band, and those rows **do not** update on a generation push — they are marked held-to-clock (SV54a/SV54b) |
| **AT-SV54** | SVP4a member payload and UI emit **no** Γ, OI or GEX value, no rail, no sign-change mark, and no OI as-of on the coverage strip (SV61, SV57) |
| **AT-SV55** | Compact beside a sibling fly template: equal row height, no tip labels, no row-background trail tint, no bevel (SV56) |
| **AT-SV56** | Fallback path: artifact missing for today → `band(w)` on both strip and payload, **never** `full` (SV54) |

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

Rewritten in v0.2 so the table agrees with the locked body (**G6** — v0.1's OD table still
recommended a signed GEX spine after the body (now §A.2) had locked a rail, and staged the VP door while the
mission line promised both). **Disposed** rows are settled by a Coach lock in the body and are
listed for traceability only; **Open** rows still need a decision at SVP0.

### 14.1 Open — decide at SVP0

| # | Question | Recommendation |
|---|----------|----------------|
| **OD-SV1** | Artifact scope: one expiration, or all listed | **One expiration**; roll-ups at read |
| **OD-SV2** | Enabled `(symbol, expiration)` pairs for the full-scope poller | **Write the actual list.** "Front expirations of the coaching symbols" is not a config value — SVP0 closes this with enumerated pairs, since poller cost is linear in them (SV20) |
| **OD-SV3** | Session clock bucket | **1 minute** (SSR precedent). Live view stays real-time regardless |
| **OD-SV4** | Retention | **Keep** — pending P-SV3 |
| **OD-SV5** | **Name the archive mount** ("gold disk") in `market_storage_mount`, existing role only | Coach names it; no new role (SV10) |
| **OD-SV6** | `unattributed_pct` threshold disabling sliced/window modes | **10%**, with the reason shown on the coverage strip (SV57) |
| **OD-SV7** | Default value mode | **Single book (`call`/`put`)** — changed in v0.2 by SV55; `total` is a deliberate mode |
| **OD-SV10** | Member label | "Session volume" / "Volume by strike" — Echo + Tango |
| **OD-SV12** | **"Long / short"** — member's own open-book direction, or something else? | **Coach to say.** If anything ships it is an open-book overlay chip on the strike ("you are short this 6450C"), **never** a colouring of volume. SV28 stays absolute, and this does not block the template |
| **OD-SV13** | Quote columns in `total` (SV55) — hide them, or dual call/put stubs | **Hide in `total`**, show when a side filter is on. Dual stubs are acceptable but cost width Coach's five columns already spend |
| **OD-SV20** | Unit roll point | **Roll at four integer digits** (`999,995` → `1.00M`) |
| **OD-SV26** | Cumulative net-GEX summation direction (frozen in `algo_version`) | From the **low strike upward**; state it on the axis |
| **OD-SV31** | Density default per surface (SV56) | **Compact** when sharing a workspace with another template, **Comfort** when SVP is the primary view |
| **OD-SV32** | **Which book is the default** (G12) — SV55 says "a single book", not which. On an index 0DTE session this changes the first picture every member sees | **Coach + Echo pick it**, then persist the member's last used (HM16 already implies per-member side state). Do not ship a hardcoded call book by default |
| **OD-SV33** | Storage: `svp_v1` carries Γ/OI from day one, or split `svp_v1` / `svp_v1g` (G10) | **Carry from day one** (SV61) — a split costs a full rebuild when the rail opens and buys nothing |

### 14.2 Open — but must not be frozen from a desk

These are **feel** parameters, not laws. Freeze them only after a live-tape sitting with Coach;
a number chosen from a spec document here is a guess wearing a decimal point.

**They live in config, never in `algo_version`.** They are display behaviour, not measurement:
putting 400 ms or 8 rows/second into the artifact's version would make a camera preference force a
re-bin. Starting values go in a config file, and they are not named constants in client code until
the sitting happens.

| # | Question | Starting value |
|---|----------|----------------|
| **OD-SV14** | Centring dead band | ±2 strike rows |
| **OD-SV15** | How auto-centring resumes after manual scroll | Recenter control + 30 s idle; control-only never surprises |
| **OD-SV16** | Follow time constant | ≈400 ms |
| **OD-SV17** | Jump threshold | One viewport height |
| **OD-SV18** | Velocity clamp | ~8 strike rows / second |
| **OD-SV19** | Trail lookback window | **Tied to the selected volume window when in `window` mode** (changed in v0.2 — one interval, two marks; otherwise the trail and the bars argue), else 15 minutes |

### 14.3 Disposed by a Coach lock in the body

| # | Question | Disposition |
|---|----------|-------------|
| **OD-SV8** | Multi-session composite | **Deferred** — one session is the honest unit first |
| **OD-SV9** | VP app door in first ship | **Staged** (SVP7). Mission wording corrected in v0.2: one SoR now, second door later |
| **OD-SV11** | `total` bar composition | **Two-tone split**, now bound by SV55 |
| **OD-SV21** | Blue bars flat or ramped | **Flat blue** (§7.4) |
| **OD-SV22** | GEX render form | **Superseded by OD-SV25** — §A.2 locks the heat rail; the signed-spine recommendation is withdrawn |
| **OD-SV23** | GEX overlay default | **Off** — and its chrome is off before SVP4b/4c (SV59) |
| **OD-SV24** | GEX display divisor | **Inherited from the Heatmap** (OD4) — never a second convention (SV60) |
| **OD-SV25** | GEX heat form | **Dedicated rail**; trail keeps the row (SV43) |
| **OD-SV27** | `zero_gamma_spot` in first ship | **No** — deferred through OPF review |
| **OD-SV28** | Cross-expiration gamma roll-up | **Deferred** (SV47) |
| **OD-SV29** | Pressure-vs-outcome research view | **Deferred** to a research memo (§A.3.4) |
| **OD-SV30** | Pressure display unit | **USD notional per 1% move**; "shares per point" remains worth Coach's ear at SVP4c |

---

## 15. Phases

Phases are prefixed **SVP** so a phase id is never mistaken for a law id (`SV*`).
**v0.2 splits the surface phase** — v0.1 asked one review to approve two products (G4).

| Phase | Deliverable | Exit |
|-------|-------------|------|
| **SVP0** | Spec accepted · ODs disposed · **P-SV1 and P-SV4 closed** · **Heatmap Templates v0.3 drafted in this same packet (§15.1)** · DL entry · board seeded | Coach GO |
| **SVP1** | Catalog migration + artifact writer + mount law + coverage | AT-SV1/2/3/10/14 |
| **SVP2** | Full-scope poller + pagination split | AT-SV5, P-SV2 evidence |
| **SVP3** | Member + admin APIs, horizon endpoint | AT-SV6/11/15 |
| **SVP4a** | **Volume only:** Strike · Bid · Mid · Ask · VP · coverage strip · back-select · live `session_total` from artifact + tail · density modes · price line and follow in both densities, trail in Comfort (edge tick in Compact) | AT-SV4/7/12/16/17/19–31/48–51 |
| **SVP4b** | Gamma **rail + observed sign changes only** — no pressure chrome | AT-SV34/35/36/39/41/42/43/45/52 **and** the §18 misread metric |
| **SVP4c** | Pressure regions · hedging-flow glyphs · notional units | Live-tape Echo + Tango walk · `gex_v2` landed in the Heatmap surface · AT-SV37/44/46/47 |
| **SVP5** | Back-select control driven by catalog horizon | AT-SV6, SV11 |
| **SVP6** | Backfill from existing archive, labelled `band(w)` | AT-SV8, SV8 |
| **SVP7** | VP app door (OD-SV9) | AT-SV13, AT-SV9 |
| **SVP8** | Agent export parity | SV19 |

### 15.1 Heatmap Templates v0.3 — required amendment list (part of SVP0, not a sequel)

| # | Amendment |
|---|-----------|
| 1 | **Auxiliary server-owned read plane** exception to HM1 — a template may declare one; it still owns no fetch |
| 2 | **`day_volume` on `LadderRow` and `ChainContext`**, null → invalid (HM7 parity) |
| 3 | **HM17 and HM18 explicitly scoped to the live generation path** — the batch writer pages |
| 4 | Registry entry **`session-volume`**, layout `profile` |
| 5 | **Coverage object required** for any template reading an auxiliary plane |

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

## 17. Copy freeze (Echo)

Frozen at v0.2. The right-hand column is not a style preference — each phrase makes a claim the
data does not support.

| Use | Do not use |
|-----|------------|
| Session volume (vendor cumulative) | Measured volume · tape volume |
| Unattributed (collection started after open) | Missing · estimated · backfilled |
| Chain GEX (estimate) · OI as-of ⟨date⟩ | Dealer gamma · gamma wall · flip |
| Net GEX changes sign 6445 → 6450 | *The* gamma flip · zero gamma |
| Hedging flow required under convention | Pressure pushing price · dampening regime |
| Scope: band(±w) — wings not collected | Empty · no volume · zero |

**Dampening / amplifying as region names on the surface wait for SVP4c.** On the rail at SVP4b,
sign plus units are enough.

---

## 18. Post-ship metrics (volume-only ship)

Evidence that the surface teaches what it claims. The last row is a **gate**, not a dashboard.

| Metric | Target |
|--------|--------|
| Coverage-strip glance | Member correctly recalls the unattributed % in a 10-second task |
| Band-clipped day | Member states the wings are **missing data**, not zero volume (AT-SV6, qualitative) |
| Zero extra Massive on template / side / mode switch | AT-SV4 holds on a healthy stream |
| Digit match across doors on a golden session | AT-SV13 holds |
| **"Volume magnet" / "gamma wall" misreads** in support and journal, first two weeks | **Near zero. If it is not, SVP4b does not ship.** |

That last line is the honest version of every copy ban in this document: if members read the
picture the doctrine exists to prevent, the doctrine lost and the feature stops.

---

## 19. Review disposition map — advisor reviews 2026-09-01

| ID | Finding | Disposition |
|----|---------|-------------|
| **G1** | Live door reads a wing-clamped generation while the artifact is full chain; `strike_scope` was a backfill-only field | **Accepted — defect.** SV54: live door reads artifact + tail; `strike_scope` on every payload and profile; pure-generation read demoted to a labelled fallback. AT-SV48 |
| **G2** | One-book quotes beside a both-book bar is a reading error | **Accepted, modified.** SV55 states the law. The reviewer's fix was "hide quotes in `total`"; v0.2 instead **defaults to a single book**, so the Coach column lock holds in the default view and `total` is where the question must be answered (OD-SV13). AT-SV51 |
| **G3** | SV24 row-grid parity and SV34 label legibility cannot both hold at heatmap density | **Accepted.** SV56 density modes; AT-SV30 scoped to Comfort. AT-SV50 |
| **G4** | Pressure chrome will read as forecast whatever the copy says; `gex_v2` should not be invented inside an SVP spec | **Accepted.** SV59 stages gamma (SVP4a/4b/4c) with chrome off before its gate; SV60 moves `gex_v2` ownership to the Heatmap GEX surface — v0.1 contradicted its own SV38. AT-SV52 |
| **G5** | `vol_oi` on same-day expiries is a loaded descriptor without the gamma disclosure | **Accepted.** SV58 makes it unavailable with a stated reason for same-day expirations; valid for dated. AT-SV49 |
| **G6** | OD table drifted from the locked body; AT numbering out of sequence | **Accepted.** §14 rewritten as open / feel-parameter / disposed; OD-SV22 withdrawn; AT-SV43 restored to sequence |
| **G7** | Honesty fields were payload, not the first thing the eye hits | **Accepted.** SV57 makes coverage a persistent chrome strip with the reviewer's string format; disabled modes state their reason there |
| **G8** | Blocking probes still open; GO unavailable | **Accepted, no change needed** — SVP0 already gates on P-SV1 and P-SV4. Reaffirmed: the "~2 weeks" string stays out of code and copy (SV11) |

**Also folded from the review's recommendations:** trail window tied to the selected volume window
in `window` mode (OD-SV19); motion parameters explicitly unfrozen until a live-tape sitting
(§14.2); Heatmap v0.3 amendment list made part of SVP0 (§15.1); copy freeze (§17); post-ship
metrics with the misread gate (§18); long/short confined to an open-book overlay chip (OD-SV12).

### 19.1 Second pass — 2026-09-01 (G9–G17), folded at rev v0.2.1

Verdict returned: *the fold is faithful; approve the shape, do not GO the build.* All nine
accepted.

| ID | Finding | Disposition |
|----|---------|-------------|
| **G9** | The generation-subscribed writer cannot produce `full`; AT-SV48 would pass on a lie if it stamped `full` by job type | **Accepted — G1-class defect.** SV54a: only the poller produces `full` during a session; generation writer extends or stamps `band(w)`; wing rows held-to-clock. AT-SV53, AT-SV56 |
| **G10** | Γ/OI stored for a ship that renders no GEX invites "chart it while we're there" | **Accepted, option (a).** SV61: carry from day one for replayability; the **4a payload shape excludes them**, and reading them into chrome before SVP4b is a gate violation. OD-SV33. AT-SV54 |
| **G11** | `OI as-of` on a volume-only strip teaches the volume/OI pairing SV2 exists to stop | **Accepted.** Strip splits 4a / 4b+; OI disclosure follows SV51's scope — gamma marks only. The same-day sentence lives on the disabled `vol_oi` control at 4a |
| **G12** | "A single book" never says **which** book | **Accepted.** OD-SV32 — Coach + Echo pick it, then persist per-member last-used. No hardcoded default |
| **G13** | Compact surrendered labels but not bevel, trail wash, ATM wash, price line | **Accepted.** Explicit Compact mark budget: price line + ATM + bar; trail becomes an edge tick or Comfort-only; bevel dropped (SV37 says it carries no data). AT-SV55 |
| **G14** | Client tail and poller run on different clocks — one profile, two cadences, undisclosed | **Accepted.** SV54b: `live_tail_scope` in coverage, wing clock stated, held-to-clock rows marked |
| **G15** | §7.5–§7.7 sat in the normative body in present tense while SV59 staged them | **Accepted.** Moved to **Appendix A** (A.1/A.2 open at SVP4b, A.3 at SVP4c) with AT-SV34–47 and 52. A 4a implementer now has one reading |
| **G16** | The §0 diagram still showed the live generation as a first-class today path | **Accepted.** Redrawn: poller is the only `full` producer; tail annotates the band; generation-only is the named fallback |
| **G17** | GO still unavailable | **Accepted, standing.** SVP0 gates unchanged; OD-SV2 sharpened from a description to an enumerated list |

**Also folded:** feel parameters explicitly belong in config, never in `algo_version` (a camera
preference must not force a re-bin); the acceptance set is **closed** at AT-SV56 — further coverage
belongs in seeds and gate reports, not in more spec rows.

### 19.2 Advisor sign-off and errata — 2026-09-01 (rev v0.2.2)

Advisor returned **G9–G17 accepted as implemented; no remaining G1-class defect in the text**, with
six errata and an instruction: *stop revising the spec and start the evidence pack.* All six
applied at v0.2.2, plus the §A.2 Compact row-ownership line flagged for 4b. **No G18 was opened,
and none should be** — remaining holes belong to seed work and gate reports.

| Erratum | Applied |
|---------|---------|
| §5 could still fuse "writer artifact" with the generation writer | Primary path now names the **poller's** artifact |
| SV54b had no payload | `live_tail_scope`, `last_poller_at`, `wing_clock_seconds` added to §2.3 |
| Teaching sentence advertised a pairing 4a does not show | Scoped: 4a teaches volume + its terms; synthesis moved to §A.1 |
| Comfort said "rail visible" in a 4a paragraph | Removed; rail pointed at §A.2 / SVP4b |
| SVP4a exit implied a trail in both densities | Trail scoped to Comfort, edge tick in Compact |
| Document-control banner duplicated the G2 sentence | Deduplicated |

**Standing gates, unchanged:** Hotel withheld pending **P-SV1**. India may begin *design* review of
the plane/template boundary now; poller *build* waits on P-SV2 cost and the OD-SV2 list. Echo's 4a
copy is §17's left column **minus every gamma row**. The §18 misread gate remains the SVP4b door
and was not weakened.

**Hotel's standing objection, recorded:** a member who reads vendor-cumulative bars as tape, band
wings as zero, or same-expiration GEX as the market's gamma level is worse off. v0.2.1 has a
surface law for each. It does **not** yet have evidence that Massive's field is what §2 claims.
**Until P-SV1 closes, Hotel cannot sign**, and no amount of drafting changes that.

**Reviewer's answer to India's question, adopted:** artifact, catalog, jobs, mount and poller
belong to the market-data / VP plane; the Heatmap template is a **view** onto that plane; the
amendment is the boundary. Storage under Heatmap would recreate HM1 violations; the panel only in
the VP app would hide the comparison the feature exists for. One SoR now, both doors later.

---

## 20. Document control

| Version | Date | Notes |
|---------|------|-------|
| **v0.1** | 2026-08-31 | Initial DRAFT from Coach intent + four clarifications. Establishes vendor-cumulative measurement law, unattributed bucket, scope split from HM17/HM18, one-artifact-two-doors, SV14 overlay block |
| **v0.2.2** | 2026-09-01 | **Errata pass on advisor sign-off — no new law.** §5 primary path names the **poller's** artifact explicitly; §2.3 coverage gains `live_tail_scope`, `last_poller_at`, `wing_clock_seconds` so SV54b has a payload; SV57's taught question scoped to 4a (volume + its terms) with the flow-vs-gamma synthesis moved to §A.1; "rail visible" removed from the 4a Comfort description; SVP4a exit line scopes trail to Comfort / edge tick; document-control banner deduplicated; §A.2 states the Compact row-ownership rule for when 4b opens. **Spec revision stops here — next artifact is the SVP0 evidence packet** |
| **v0.2.1** | 2026-09-01 | **Second review fold (G9–G17, §19.1).** SV54a — only the full-scope poller produces `full` on a live session; generation writer extends or stamps `band(w)`; wing rows held-to-clock. SV54b mixed-cadence disclosure. SV61 — Γ/OI stored from day one, absent from the 4a payload shape. Coverage strip split 4a / 4b+ (no OI on a volume-only panel). Compact mark budget. Gamma moved to **Appendix A** with its ATs. §0 diagram redrawn. Feel parameters bound to config, never `algo_version`. OD-SV32–33 · AT-SV53–56 · acceptance set closed |
| **v0.2** | 2026-09-01 | **External review fold (G1–G8, §19).** G1 defect fixed: one scope across both doors (SV54). Quote/bar book agreement with a single-book default (SV55). Density modes (SV56). Coverage as chrome (SV57). `vol_oi` off for same-day expiries (SV58). Gamma staged with its chrome (SV59) and `gex_v2` ownership moved to the Heatmap surface (SV60). OD table rewritten open/feel/disposed; ATs resequenced; AT-SV48–52 added. Copy freeze §17; post-ship metrics with the misread gate §18; Heatmap v0.3 amendment list §15.1 |
| **v0.1.6** | 2026-08-31 | **Coach gamma lock (§A.2, §A.3):** GEX renders as a dedicated **heat rail** (SV40 amended from spine); `gex_sign_change` (observed) separated from `zero_gamma_spot` (modeled, deferred); all crossings shown, never one; single-expiration scope stated; **`gex_v2`** freezes the units as USD notional per 1% move with the derivation written out; pressure rendered as signed regions with hedging-flow direction; **OI staleness disclosure made a surface-level requirement**, with session volume named as the missing "today" half of the gamma picture; regime and prediction claims banned. SV43–SV53 · AT-SV39–47 · OD-SV25–30 |
| **v0.1.5** | 2026-08-31 | **Coach GEX lock (§7.5):** overlay reuses the frozen `gex_v1` path and its divisor — no second GEX; separate baselines and units, never summed or scored; sign by geometry not hue; estimate labelling and the banned pin/magnet/wall framing; artifact extended to carry Γ per bucket and OI per session so historical GEX is reproducible, with the intraday "OI settles overnight" statement in the UI. SV38–SV42 · AT-SV34–38 · OD-SV22–24 |
| **v0.1.4** | 2026-08-31 | **Coach label + look lock (§7.3, §7.4):** volume level hangs off the bar tip with flip-inside collision rule; format = exact integer below 1,000, two decimals + unit above, half-away-from-zero, exact value always in tooltip/payload. Black ground, blue beveled bars, bevel adds no length, single blue never the diverging heat palette, trail stays gold. SV34–SV37 · AT-SV29–33 · OD-SV20–21 |
| **v0.1.3** | 2026-08-31 | **Coach motion lock (§7.1):** centring becomes two states — rest (dead band, zero scroll) and **follow** (eased approach that visibly trails and catches up), with settle, jump, velocity clamp and truth-before-motion guards. Adds the **price trail** (decaying highlight of recently traversed strikes, no valence colour, bounded window) and the **session spot track** in the artifact that makes trail-on-history and as-of spot possible. SV30 rewritten · SV32–SV33 · AT-SV20b/c/d · AT-SV25–28 · OD-SV16–19 |
| **v0.1.2** | 2026-08-31 | **Coach price lock (§7.1):** price line drawn at true proportional position (not snapped to the ATM row), ATM row emphasised separately, auto-centring with a ±2-row dead band, manual scroll wins, held price frozen, past sessions labelled by as-of time. SV29–SV31 · AT-SV19–24 · OD-SV14–15. Column order restated in words in SV22 |
| **v0.1.1** | 2026-08-31 | **Coach layout lock (§7):** strike is the axis, then Bid · Mid · Ask; profile anchored right, growing leftward; one shared row grid. SV22–SV28 · AT-SV16–18 · OD-SV11–13. §7.1 records that long/short is not derivable from snapshot volume (OD-SV12) |

**One-line law:**
**Session option volume is the vendor's cumulative contract volume, read on a session clock,
attributed to time only as far as the snapshots honestly allow — one artifact, one scope, two
doors, the unattributed remainder always on the surface, gamma staged behind its own gate, and
never confused with the underlier's volume by price.**

---

## Appendix A — Gamma surface (normative from SVP4b / SVP4c only)

> **Not in scope for SVP4a.** Nothing in this appendix may appear in a volume-only implementation,
> a 4a payload, or 4a chrome (SV59, SV61). It becomes normative when its phase opens: §A.1–A.2 at
> **SVP4b**, §A.3 at **SVP4c**. v0.2 left these in the body in present tense, where an implementer
> reading for 4a would reasonably have treated them as in scope (G15).

### A.1 GEX overlay (Coach lock, 2026-08-31) — opens at SVP4b

> **SV59 — gamma is staged, and its chrome is off before its gate (G4).** §A.1–A.3 do **not**
> land with the first surface. First ship is volume + coverage + motion (**SVP4a**); the rail and
> observed sign changes land at **SVP4b**; pressure regions, hedging glyphs and notional units at
> **SVP4c**, after a live-tape Echo + Tango walk and after `gex_v2` exists in the Heatmap GEX
> surface (SV60).
>
> Default-off (OD-SV23) is necessary and **not sufficient**. The *chrome* is off too before its
> gate: no region names, no glyphs, no pressure figures, no legend teaching the reading.
>
> **Why:** SV48–SV53 are correct copy law and copy law does not control perception. Signed regions
> named dampening/amplifying, plus direction glyphs, plus dollars-per-1% sitting on the same
> strike as a fat volume bar, **is** the pin thesis regardless of what the tooltip says. Echo and
> Tango should treat that as the primary failure mode of this surface, not a wording question.
> The **SVP4b gate** is empirical: see §18.

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
region**, signed GEX is **diverging heat in its own rail** (§A.2). Sign may be carried by hue
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

### A.2 Gamma heat rail and sign changes (Coach lock, 2026-08-31) — opens at SVP4b

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
rows. So: rail carries GEX, trail keeps the row tint — **in Comfort**. In **Compact** the trail is
already an edge tick (SV56 mark budget), so the rail may use the row; what must never happen is
4b silently restoring a row-tint trail in Compact and putting three claimants — ATM wash, trail,
rail — on one shared row (AT-SV43). If Coach prefers **full-row GEX heat**
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

### A.3 Gamma pressure — visualising the hedging flow (Coach lock, 2026-08-31) — opens at SVP4c

Coach: *"visualize the pressures exuded by gamma."* The honest version of "pressure" is not a
mood or a magnet. It is a **quantity with units**: how much underlying a hedged book must trade
to stay delta-neutral through a given move, and in which direction that trading pushes.

#### A.3.1 The units already exist — freeze them (`gex_v2`)

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

**SV60 — `gex_v2` belongs to the Heatmap GEX surface, not to this Spec (G4).** v0.1 defined a GEX
version inside an SVP document while SV38 forbids a second GEX convention — the document
contradicted its own law. The units freeze lands as a **Heatmap Templates / OD4 revision**, owned
there. **SVP consumes it and never defines it**, and `svp_v1` carries no GEX version of its own
(**AT-SV52**). Until `gex_v2` exists there, SVP renders `gex_v1` under `gex_v1`'s own labelling.

This is what makes pressure showable: *"≈ $180M of SPX to be traded per 1% move, and this is
where it sits."* A member can feel that. `1.8e9` in arbitrary units teaches nothing.

#### A.3.2 Direction is the other half

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

#### A.3.3 The disclosure that has to be loud

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

#### A.3.4 Later, and only with evidence

The archive makes an honest follow-up possible that assertion cannot: for back-selected sessions,
compare where the pressure sat against **where price actually went** (the spot track, SV33). If
the mechanism shows up, it shows up in the data; if it does not, members deserve to know that too.
**OD-SV29** — defer to a research memo, not a v1 chrome claim. A surface that can check itself is
worth more than one that asserts.

### A.4 Gamma acceptance tests

| ID | Test |
|----|------|
| **AT-SV34** | GEX overlay values are produced by the **existing** `gex_v1` path — a fixture chain gives byte-identical numbers on the Heatmap GEX template and the SVP overlay (SV38) |
| **AT-SV35** | Null Γ or null OI at a strike → GEX mark **invalid**, never a zero-length mark (SV41) |
| **AT-SV36** | Volume and GEX render on separate baselines with separate unit labels; no shared normalisation, no stacked or summed mark, no composite value exposed in payload or export (SV39) |
| **AT-SV37** | Historical session: GEX recomputed from the artifact's stored Γ (per bucket) and OI (per session) equals the value computed live for that same bucket (SV42) |
| **AT-SV38** | The strings pin, magnet, wall, support, resistance and gravitate appear nowhere in this surface's copy, tooltips, legends, or payload labels — extended to regime claims: no "volatility expands/dampens below/above" phrasing (SV41, SV48) |
| **AT-SV39** | Fixture chain with **three** net-GEX sign changes in the window renders **three** marks, each labelled with its bracketing strikes; no "primary" crossing is selected (SV45) |
| **AT-SV40** | When `zero_gamma_spot` lands: no root, or multiple roots, → named state surfaced; no single number is emitted (SV46) |
| **AT-SV41** | Rail, crossings and any gamma figure carry the expiration they belong to; no copy presents a single-expiration crossing as a market-wide gamma level (SV47) |
| **AT-SV42** | Tooltip on any GEX mark states the dealer sign convention it assumes (SV41) |
| **AT-SV43** | GEX heat and price trail never both occupy the row background: rail form keeps the trail on the row; full-row form moves the trail to an edge ribbon (SV43) |
| **AT-SV44** | Direction glyphs are labelled as **hedging flow**; no copy, tooltip or legend renders them as expected price direction (SV50/SV52) |
| **AT-SV45** | The OI as-of date is visible **on the surface** whenever any gamma mark is shown; selecting a same-day expiration additionally states that today's flow is not yet in OI (SV51) |
| **AT-SV46** | A pressure figure rendered or exported without all three of dealer convention, OI as-of, and expiration scope fails validation (SV53) |
| **AT-SV47** | `gex_v2` values equal `gex_v1` values on a fixture chain — the freeze changes units labelling and display only, never the arithmetic (SV49) |
| **AT-SV52** | `svp_v1` defines no GEX version; the overlay resolves its units and divisor from the Heatmap-owned GEX `algo_version` (SV60) |
