# SOURCE DOCUMENT — not a spec

**Classification:** voice-session retelling (2026-09-16). **"v1.0" is void.** Never a review or build object.  
**Law:** [`Specs/Structural-Analysis-Service-Spec-v0_1.md`](../Structural-Analysis-Service-Spec-v0_1.md) (sha1 `d6ae0e682cde2cb4057e6dda0fa83bc6430f239d`). Where this retelling conflicts, **the spec is law**.  
**Strikes / keepers:** Decision log **DL-712**.

---

# Volume Profile — Full Specification v1.0-draft

2026-09-16 · Coach · v1.0-draft

## 1. Purpose & scope

Volume profile is the fourth leg of market structure. Without it, GEX plus volatility, time and price are incomplete — structure is as influential on price development as the three D's of options. It is built as capability first, before any templates that read it, completing the one unfinished app in Options Lab.

The system's entire output is a set of **horizontal levels** — prices a trader can read as significant potential support or resistance. Every level marks a **contested boundary**: a price the market has battled over. Nothing else qualifies.

Two phases are strictly separated:

1. **Creation.** Levels are computed from the binned volume data alone — a one-dimensional analysis of the histogram, without regard to price action.
2. **Presentation.** Only the resulting lines appear on the price chart. The profile itself is hidden.

**Phasing.** Phase 1 ships the levels product: capture, binning, detection, presentation and the API, plus arbitrary click-and-drag profiles (which fall out of the data model). Phase 2 adds footprint/order flow, TPO and market-profile replay views, and GEX fusion (§13).

Consumers: Options Lab, Runner, Strategy Lab, and any future product via the API (§12).

## 2. Doctrine & terminology

This section is normative for the build **and** is the seed of the Help and Wiki content. Anyone building or documenting this tool must not quietly reintroduce the rejected concepts.

### What FatTail rejects, and why

- **POC (point of control).** Never used. Not actionable: it marks where buyers and sellers already agreed, not where they battle, and provides no consistent support or resistance.
- **Value area high / value area low.** Arbitrary — the 70% convention is a decades-old choice, not something the market told us.
- **Day-typing from session profiles** (normal day, trend day, etc., and inferring future days from today's shape). Bunk: it names noise and treats the name as information.

The root problem: volume profile inherited its lexicon wholesale from **Market Profile** (Steidlmayer's time-price-opportunity work). Those concepts describe a *time* distribution; nobody re-examined whether they mean anything for a *volume* distribution. They just assume they do.

**What survives the filter:** market delta — bid/ask-classified volume at each price inside a time-sliced bar. Genuinely measures aggression rather than fitting a shape to a name. Integrated in Phase 2 (§13).

### Why levels persist — the causal story

Persistence is not primarily trader memory. Market makers and institutions carry **long-lived inventory and positions** at these prices, which must be defended or unwound there. Psychology and physiology contribute as a secondary mechanism. Positions outlive sentiment — which is why some levels hold for weeks, months, years, even decades. Nodes and crevices are structure the efficient market hypothesis says should not exist; however one resolves that argument, they provide predictive support and resistance.

### Terminology

| Term | Meaning |
| --- | --- |
| **Volume node** | A high-volume shelf — a price region of established acceptance |
| **Volume well** | The absence of nodes — the low-volume space between them |
| **Crevice** | A locally-thin price inside or between nodes; the market's avoided tick |
| **Cliff / edge** | A heavy tick immediately adjacent to a nearly empty one |
| **Child node** | A smaller node forming *adjacent* to (not inside) an established parent, as price finds new value and fills it in |
| **Appendage / temporary shelf** | A forming feature not yet established enough to count as a node |

### Sessions are practical, not analytical

Sessions exist in this system solely because member access differs: some brokers only allow trading once a session opens, others offer 24-hour trading. Session markers indicate where the market is in time — they are never used for day-typing, and levels are never attributed to the session that built them. The existing **Sessions** tool in FatTail Labs Resources is the single source of session boundaries.

## 3. Data capture & binning

All capture and binning runs on **StudioOne**. Downloads run overnight (StudioOne does no data capture overnight; estimated a couple of hours) and are not expected to disrupt other collection.

### Sources

- **SPX has no contract volume** — there is nothing to profile from SPX itself. **ES E-mini futures** are the source for SPX profiles.
- **SPY** is the source for **XSP** — same fractal.
- ES and SPY are highly correlated and do not behave differently: **one parameterized service with a symbol mapping**, not separate pipelines.
- SPY history comes from Massive (no new subscription needed; start there). ES follows once the futures subscription lands — the same real-time futures feed later serves footprint/order flow (§13).

### Binning

- Maximum granularity on both dimensions: **penny bins** on price, and **prints kept with timestamps** so profiles can be sliced by session segment and support TPO replay views later.
- Estimated scale: full SPY history ≈ 50 GB raw, reducing to ≈ 40 MB binned. **Keep the raw data** after binning — archival cost is trivial.

### Ongoing upkeep

A continuous service modeled on the option-chain capture mechanism keeps the base profile current as markets evolve. It takes its clock from the **Sessions** tool (ES and SPX boundaries both matter), never carrying its own session logic.

### ES → SPX mapping (resolved)

Rollover and basis are immaterial. The signal is **contact, not price**: when ES price runs into a structural level, SPX is simultaneously at the same structural level — no scaling or translation layer. The deliverable is a **notification** on the SPX chart, with the hit marked on the ES chart where the profile lives (§8).

## 4. Analysis range

Before any levels are drawn, fix the **price band** to analyze: a maximum up range and down range around spot, typically **±2.5σ** measured longer-dated off the index (not a daily expected move — the exact sigma definition is an open decision, §15).

Once the band is set, **all history that traded inside it is included** — no price action within the band may be omitted. It is a price band, not a time window: the sweep runs backward until the band runs dry, however long that takes.

Worked example (as of 2026-09-16): ±2.5σ ≈ ±200 points, which reaches back to about May 2026. The four months is an *output* of the sweep, not a chosen lookback — there is simply nothing older inside the band.

## 5. Display aggregation

Penny bins stay penny bins underneath; the display aggregates. The goal is maximum granularity — all the nooks and crannies — without looking disjointed at any canvas size, in the manner of TradingView.

Two user-selectable modes, matching TradingView's:

1. **Ticks per row** — direct control of row height in price terms.
2. **Number of rows** — row count for the viewable canvas; ticks-per-row is derived as (histogram top − histogram bottom) ÷ rows ÷ tick size.

Both are pure linear rebinning of the penny bins into display rows — no smoothing kernel. Rebinning is a rendering concern only and never feeds detection (§7), which always runs on the full-resolution bins.

## 6. Node segmentation

Segmentation decides what counts as a **volume node**, and everything downstream depends on it: it produces the node-boundary levels directly, and it tags every crevice and cliff as intranode or internodal — which decides its color.

**Why nodes form.** When price moves between nodes it is searching out value. The most logical place to find it is another node, not the well. If no node exists, price may decide it has found value intranode, or at a brand-new node at an all-time high, and create it there.

**Approach.** Apply the same topographic-prominence logic as level detection (§7), inverted — peaks instead of troughs — to identify high-volume shelves and their outer edges. Thresholds are tuned against the hand-labeled corpus (§11); Coach's eye is the ground truth.

**Node boundaries are levels:** the bottom of a node is a thick green line, the top a thick red line. They follow the cliff paradigm at larger scale, encapsulating a whole grouping of high-volume ticks.

**Child nodes and promotion.** A child node forms *adjacent* to an established parent — price finds value above or below it, creates a smaller node, and fills it in. Until it qualifies as a node it is an appendage or temporary shelf and gets **no line treatment**. Promotion criteria: how established it is, how often it is revisited, how big it became, and whether it served as a stepping stone to a new level. These criteria are quantified during the labeling work (§11).

## 7. Level detection

Detection is the crux of the whole system, and it runs on the full-resolution bin data alone — never on price action, never on display rows. Two detectors, both finding contested boundaries.

### Crevices

- A deep, locally-thin region — the antithesis of a POC. A very definitive price the market has decided not to trade, despite going over the area many times.
- The level is drawn at the **tick price with the least volume** in that crevice.
- **Local, not global:** several crevices can qualify on one chart, each at its own local minimum.
- Occur **both between nodes and intranode**, and both carry the **same weight** — the intranode case is arguably stronger evidence, since price hung around constantly and still skipped that tick.
- **Algorithm:** rank every trough by **topographic prominence** — how far volume must climb on both sides before a higher peak. One knob: the cutoff is set by how many levels belong on a chart, not by a volume threshold. Prominence handles internodal and intranode cases identically.

### Cliffs / edges

- A tick with extended or excess volume sitting immediately next to one or two ticks with very little volume. Occur intranode or internodal.
- Which side of the cliff carries the line **does not matter** — either choice is within a point or two.
- **Not directional.** A cliff means the same thing as a crevice: another level the market has battled over, volume on one side and not the other.
- Cliffs fold in with crevice lines for rendering — colored by location, not mechanism (§8).

Expectation set explicitly: prominence is the first swing, not the answer. Matching Coach's eye will take **significant training** against the labeled corpus (§11) — more than a few marked profiles.

## 8. Presentation

At presentation time the profile is hidden — lines only, on the price chart. Zoomed into a 5-minute chart the profile is useless anyway; the line colors are the trader's only structural context. The color grammar must therefore carry the structure by itself.

### Color grammar

| Line | Weight | Color | Reading |
| --- | --- | --- | --- |
| Node bottom | Thick | Green | You are at the floor of a node |
| Node top | Thick | Red | You are at the ceiling of a node |
| Internodal crevice or cliff | Thin | Yellow | You are between nodes |
| Intranode crevice or cliff | Thin | Blue | You are inside a node |

Color encodes **location in the structure**, never mechanism (crevice vs cliff) and never a support/resistance prediction.

### Session markers

The surface identifies where the morning, afternoon and closing sessions are — vertical time context only, sourced from the Sessions tool. Never an attribution of which session built which level, and never an input to detection.

### SPX / XSP delivery

The ES chart shows the profile with the hit marked; the SPX chart receives the **notification**. Contact, not price (§3) — no overlay or translation on the SPX chart itself. Same model for SPY → XSP.

## 9. Refresh policy

Update cadence scales inversely with how much history the band holds — a day of new volume barely moves a year of prints, but is a meaningful fraction of a few weeks of data.

| Band contents | Recompute cadence |
| --- | --- |
| A year or more of volume data | Once every few weeks, even if price is moving back and forth |
| A few weeks–months (e.g. near all-time highs) | About once a week |

The cadence itself handles level retirement: a level that gets washed out or repositioned simply is not redrawn on the next cycle — no separate retirement mechanism. Flicker between refreshes is rare in mature nodes and levels but can happen frequently with brand-new features; forming features are provisional by nature and get no line treatment until promoted (§6). Whether provisional features additionally need hysteresis is an open question (§15).

Implementation note: a data-driven trigger — recompute when new volume exceeds a set percentage of the band's total — realizes this policy without a calendar.

## 10. Level characterization

Each level carries a **probability distribution** over how price behaves at it — where it tends to stop, how far through it runs, how often it fails entirely. Explicitly **not a confidence score**: a single number implies calibration the evidence does not support and invites members to trade it as if it were.

Candidate inputs to the distribution:

- Geometric strength (prominence, cliff sharpness)
- Test history: how many times the level has been touched, from which side, and what happened
- Age and survival
- **Provenance** — how many instances in the level's history built it, and their nature. A node made by one enormous capitulation day and one built by thirty quiet days of accumulation should behave differently on retest; the academic literature (§14) is expected to inform how provenance weighs in.

The level schema carries distribution fields from day one, even while the distributions themselves are being developed.

## 11. Validation & training

Detection ships only after it has been validated against Coach's eye and against naive baselines. Two workstreams, sharing one dataset.

**Hand-labeled corpus.** Coach marks up profiles by hand — dozens, across regimes (trending days, balanced days, post-gap sessions); a handful is explicitly not enough. The corpus is ground truth for tuning the prominence cutoff, node-segmentation thresholds, and child-promotion criteria.

**Baseline comparison.** Run the forward-return study three ways on the same history:

1. Detected levels (this spec)
2. Round numbers
3. Prior session highs and lows

If the detected levels do not separate from the baselines, that is learned early and cheap — before the tool ships and before members are taught against it. This is distinct from the §10 distributions: characterization describes behavior at a level once drawn; the baseline test asks whether the detection method has edge at all.

## 12. API & consumers

Levels are **computed server-side** and served as a cached list — the weekly-or-slower refresh cadence (§9) makes client-side computation pointless, and a single API is the only way Runner, Strategy Lab and Options Lab consume identical levels. Capture, binning and level computation run on **StudioOne**; the serving host is an open decision (§15).

Each level in the served list carries at minimum:

| Field | Content |
| --- | --- |
| price | The level's price |
| type | node-bottom · node-top · crevice · cliff |
| location | intranode · internodal |
| color / weight | Per the §8 grammar (derivable from type + location) |
| distribution | §10 characterization fields, when available |
| computed-at | Timestamp of the refresh cycle that produced it |

The API also exposes the bin data itself for the alternate views (§13), including range-bounded queries that power click-and-drag profiles. Consumers: Runner, Strategy Lab, Options Lab, and any future product.

## 13. Additional profile views & Phase 2

The same bin data supports multiple views — different versions off one dataset.

**Phase 1 (ships with levels):**

- **Click-and-drag profiles.** Select any span on a chart and build a profile for just that range. Falls out of the data model — timestamped penny bins mean this is a query with two bounds.

**Phase 2:**

- **Market profile / TPO replay views.** Not a foil to the volume view — entirely useful for seeing how a day unfolded, which a volume profile flattens away. Requires confirming the capture's time resolution supports bracket construction (§15).
- **Footprint charts and order flow.** Market delta — bid/ask-classified volume per price per bar — is the part of the Market Profile lineage that survives the doctrine filter. Data is already available: the OPS and options-chain capture carry bid/ask, and the incoming real-time futures feed provides ES tick data with bid/ask, the canonical footprint source. One feed serves profile, delta and footprint.
- **GEX fusion.** GEX and volume profile are temporal cousins — GEX the fast layer repositioning daily, the profile the slow layer built over months; the honeybees and the honeycomb they create (GEX Lean is the existing precedent). The interesting signal is where they disagree: dealer walls sitting where structure says nobody trades.

## 14. Research agenda & reading list

Collected as fodder for future analysis, and expected to feed the §10 distributions. Not blocking Phase 1.

**Foundations — Mandelbrot.** Benoit Mandelbrot originated the market-memory idea: long-range dependence via the Hurst exponent, fractional Brownian motion, and fractal market structure (*The (Mis)Behavior of Markets*; *Fractals and Scaling in Finance*). Directly relevant to the ES/SPY same-fractal premise and to why structure compounds.

**Level persistence — initial finds:**

- [Chung & Bellotti, Evidence and Behaviour of Support and Resistance Levels in Financial Time Series (arXiv 2101.07410)](https://arxiv.org/abs/2101.07410) — discovered SR levels reverse trends with statistical significance; levels with more prior bounces are more likely to bounce again; bounce probability decays over time, but the memory effect is more persistent in stock markets, and for the LLOY series it is hard to determine from their data whether it decays at all. Empirical backing for the decades claim — and their bounce-count result is a direct precedent for §10's test-history input.
- [Garzarelli et al., Memory effects in stock price dynamics: evidences of technical trading (Sci. Rep. 4:4487, arXiv 1110.5197)](https://arxiv.org/abs/1110.5197) — prices re-bounce off detected support/resistance more often than they cross; framed as quantitative evidence of self-fulfilling dynamics. Their self-reinforcement story complements (does not replace) the inventory mechanism in §2.

**To search at follow-up:**

- [ ] Provenance literature — whether concentrated vs. dispersed volume accumulation at a price predicts different behavior on retest (§10)
- [ ] Currencies as the persistence proving ground — pairs live in bounded ranges for the life of the currency, so the same levels are revisited and deepened for decades; equities drift into virgin territory

**Open empirical questions (build the view, let the data speak):**

- Time × price correlation — traditional volume bars are time-segmented, the profile is price-segmented; the two axes are orthogonal but may support one another. Explicitly no asserted direction.
- Node birth — how a new node emerging at an all-time high or intranode manifests over time. A learning tool and content angle: a level that looks like ordinary price action on the day it forms can persist for weeks, months, years, decades.

## 15. Open decisions & version history

Decisions that need Coach; everything else in this spec is decided.

1. **Sigma definition.** How exactly is the 2.5σ band measured — realized vol over what window, on the index itself? Consequence: it sets how much history every analysis includes. Until decided, the ±200-point working value stands.
2. **Serving host.** Capture and computation run on StudioOne; which machine serves the levels API to Runner, Strategy Lab and Options Lab? Consequence: uptime and load isolation from data collection.
3. **Provisional-feature hysteresis.** The refresh cadence retires stale levels, but brand-new features can flicker between refreshes. Is no-line-until-promoted (§6) sufficient, or do forming features need a sticky on/off rule? Consequence: chart stability near all-time highs.

To verify during build (not decisions): that the capture's timestamp resolution supports TPO bracket construction (§13), and the prominence cutoff and segmentation thresholds — those are outputs of the §11 labeling work, not choices to make now.

### Version history

| Version | Date | Change |
| --- | --- | --- |
| v1.0-draft | 2026-09-16 | First full draft, from the 2026-09-15/16 voice sessions |

Per spec-handoff discipline: once this document is numbered v1.0 (draft suffix dropped), its content freezes — any change, however small, becomes v1.1 with a Supersedes note.