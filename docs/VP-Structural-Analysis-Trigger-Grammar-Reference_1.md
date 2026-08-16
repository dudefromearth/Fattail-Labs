# VP Structural Analysis — Reference for the Timing & Entry Trigger Grammar

**From:** Coach · 2026-08-16
**For:** Grok / bench — Strategy Lab Designer (Timing & Entry tab) and backtester
resolution loop
**Companion:** the attached chart — Coach's actual morning structural analysis
(ES1!, 5-minute, Aug 12–14 2026), the artifact sent to members every morning.
**Binds:** Config Resolution Standard v0.1 §2–3 · Doctrine amendment "VP and 0DTE"
(2026-08-16) · Arch 32 §4 (VP lens)

---

## 1. What this image is

This is not a chart decoration. It is the **human version of a strategy trigger**:
every morning Coach publishes the structural levels and where they meet the session
boundaries, and members trade the interactions. **The cyan arrows are the strategy.**
The Designer's job is to make the Timing & Entry tab able to write what the arrows
say; the backtester's job is to fire the same events on replay.

## 2. Reading the chart

**Horizontal lines — VP structural levels, color-classed by node topology.** The
colors describe *where the level sits in the volume structure* (Coach's system):

| Color on chart | Example levels | Class |
|---|---|---|
| **Green** | 7800.00 · 7763.25 | **HVN bottom** — the lower edge of a high-volume node |
| **Red** | 7829.75 · 7787.00 | **HVN top** — the upper edge of a high-volume node |
| **Yellow** | 7837.25 · 7793.00 · 7751.50 | **LVN** — structure *between* nodes (low-volume gaps; what most call LVNs) |
| **Blue** | 7820.00 · 7810.75 · 7777.50 · 7772.00 | **Intranode structure** — levels *inside* a node |
| Retracement ladder | 0 / 0.25 / 0.33 / 0.5 / 0.68 / 0.75 / 1 / 1.25 / 1.5 | Fib over the prior swing (7828.50 → 7778.00) |

Read as topology: a red and a green line bracket an HVN (top and bottom); the blue
lines are its internal shelves; the yellow lines are the thin ground between one node
and the next. So on the chart, 7787.00 (red) → 7800.00 (green) is *not* a node — the
red is the top of the node below, the green is the bottom of the node above, and the
travel between them crosses the LVN at 7793.00 (yellow). That's why price moves fast
through yellow and stalls at red/green.

**Vertical blue dashed lines — session boundaries.** The trading day cut into windows:
overnight, premarket, open (9:30), mid-morning, midday, early afternoon, late
afternoon, close. Structure interacts *differently* at each boundary; the boundary
pair defines the window.

**Cyan arrows — the events.** Each arrow reads the same way:

> price **interacts** with a **level** inside a **session window**, then **travels**
> to the next level.

Examples from the chart: 7787.00 holds at the 11:00 boundary → travels to 7793 → 7800.
7763.25 tests in the first window Tuesday → 7777.50. 7829.75 breaks at Friday's 12:00
boundary → down to 7800. Same grammar, every arrow.

## 3. The trigger grammar — three surface-relative fields

The Timing & Entry tab must express an entry as:

```
TRIGGER = level_class × interaction × session_window  →  (optional) travel_target
```

| Field | Values (surface-relative, never absolute) | Notes |
|---|---|---|
| **level_class** | HVN top · HVN bottom · LVN (between nodes) · intranode structure · retracement level | Which *kind* of level to watch. Never a price — today's profile supplies the price for that class. Topology, not importance. |
| **interaction** | test · hold · break · retest · reject | What price does at the level. |
| **session_window** | overnight · premarket · open · mid-morning · midday · early-afternoon · late-afternoon · close · T−N to close | The boundary pair inside which the interaction must occur. |
| **travel_target** (optional) | next level of class X · N ticks · tent placement relative to next level | What the setup expects — feeds where the fly is placed (Convexity & Debit selector) and can inform the opportunistic exit. |

This sits alongside the existing regime condition (premarket vector) and window — a
strategy can require *all three*: regime admits → window open → structural event fires
→ selector places the fly.

## 4. What this changes in the engine

**Designer:** Timing & Entry gains the trigger grammar as first-class fields (per the
2026-08-16 amendment: VP levels are entry events for 0DTE, not only a 3–5 DTE
placement lens).

**Backtester (Config Resolution Standard §3, step 3–4):** at every tick the surface
read includes **today's profile with classified levels**; step 4's selector runs only
when the trigger has fired. On the Aug 14 gold day, the replay must be able to detect
"7829.75 broke at the 12:00 boundary" from the tape and fire the same setup Coach
would have.

**Capture / replay:** VP is derived on replay from the tape (frozen-geometry rule) and
captured going forward. Source labeled: SPY tape now; **ES when wired** — this chart
is ES, which is where the structure actually forms; ES-sourced VP is the target.

## 5. Provenance law for level classification

The **classifier** — the algorithm that decides "this level is an HVN top" or "this is
the LVN between these two nodes" — is part of the strategy's provenance. Two members with different classifiers fire
different trades from the same profile. Therefore:

- The classifier is versioned and named on every resolved trade (like the fill-friction
  model and the config hash).
- Coach's morning-analysis classification is the **reference implementation** — the
  replay must reproduce these lines from the Aug 12–14 tape before it is trusted.
- Level classes are the surface-relative vocabulary; concrete prices are never stored
  in a config.

## 6. Acceptance for the Timing & Entry tab

1. A member can express every arrow on this chart as a config trigger — no arrow
   requires a hard price.
2. The same trigger, run by the backtester on the Aug 14 gold day, fires at the
   moments Coach's arrows mark.
3. The heatmap preview shows where the selector would place the fly *when* the trigger
   fires — one selector, two callers.
4. Nothing in the tab is a clock time without a condition; nothing is a price.

## 7. Market memory — why structure persists, and what that dictates (Yankee lane)

**Coach (2026-08-16):** the structural analysis does *not* require daily updating.
Nodes carry memory across weeks, months, years, even decades. In a mature price
region, the levels are refreshed as little as every 3–4 weeks — and then only minor
things: an edge shifts, a shelf appears, an LVN thins. Updates are frequent only where
history is thin — near all-time highs or after a break into untraded territory — where
structure is still *forming* because no memory exists there yet.

**Grounding.** This is the operational face of long memory in financial series — the
Mandelbrot lineage (fractional Brownian motion, Hurst exponent, *The (Mis)Behavior of
Markets*) and a substantial peer-reviewed literature confirming long-range dependence,
especially in the magnitude of returns and in volatility: Lo's modified R/S work,
Ding–Granger–Engle on long memory in absolute returns, the fractional-integration
family (ARFIMA / FIGARCH), Peters' Hurst work in markets, the econophysics multiscaling
results. **Not one man's claim — a documented statistical property.** *(Bench: cite
from a real reference pass before any of these names appear member-facing; this list
is from memory.)*

**What it dictates for the platform:**

| Consequence | Law |
|---|---|
| **The profile is a cumulative composite over the full tape**, not a rolling window. A 30-day profile discards the memory the doctrine says is the point. Recency is *one* weight among volume mass, confirmation count, and age. | The 2004–2026 SPY tape already on disk *is* the composite's foundation. |
| **VP is a slow layer, not a tick stream.** The classified level set is a versioned artifact refreshed on a memory-driven cadence, never recomputed at 3–5s beside greeks. | On replay a day resolves against the profile version in force that day: `profile_version` on every trade — one classifier output serves a month of backtests. |
| **Cadence is a function of memory, not a schedule.** Mature region → weeks between refreshes; forming region → frequent until enough volume hardens the structure. | The surface context carries `structure_maturity` (mature / forming). A fly against a forming node is a different bet than one against a decade-old HVN; the strategy may say which it accepts. |
| **Node age and confirmation count are level attributes.** A ten-year-old HVN top that has held four times is a different reaction zone than a three-week shelf. | `level_class` gains age + confirmations as continuous attributes; the trigger grammar may filter on them. |
| **The AI project learns change-detection, not daily generation.** The judgment Coach exercises every morning is "has memory changed enough to warrant a redraw?" — a far more tractable target than redrawing structure daily. | The near-future VP-AI trains on the labeled mornings + tape; its first job is detecting when the composite needs a new version. |

**Reception history — the thesis, illustrated (Coach, 2026-08-16).** Mandelbrot did
not keep this in the academy. After developing long memory and fractal geometry he took
the ideas to Wall Street — decades at IBM, consulting to institutions, and *The
(Mis)Behavior of Markets* written explicitly to make the finance industry take the
non-Gaussian, long-memory picture seriously. **The crowd largely ignored it** — not
because it was wrong, but because it was inconvenient: it breaks Black–Scholes
assumptions, forces risk models to admit uncertainty they would rather not, and fits no
quarterly incentive. **Some of the most successful practitioners used it** — the
documented lineage runs through Taleb (Empirica, Universa advisor), Spitznagel
(Universa's public tail-hedge record), Thorp (Princeton-Newport, the Kelly/survive-first
discipline), and the mathematical tradition Simons drew on at Renaissance; the
Mandelbrot–Fisher–Calvet multifractal model was adopted into serious volatility
modeling. **Used by some of the most successful, ignored by the crowd — another
illustration of the thesis:** the position paper's "we sit there *because* they will
not" has a forty-year precedent in how the Street treated the man who explained why.
*(Bench: source the biographical specifics before member-facing use — Mandelbrot's
memoir* The Fractalist *(2012), Taleb's* Incerto, *Spitznagel's* Safe Haven, *Thorp's*
A Man for All Markets, *Zuckerman's* The Man Who Solved the Market. *Frame as documented
practitioners of the lineage — never as performance claims the platform makes.)*

**Lineage seat:** this section is Yankee's lane (Mandelbrot channel) — the first packet
in that lane. Yankee gates the framing: fat tails and long memory as documented
properties, never as a slogan; math matched to the audience.

---

*The arrows are the strategy. Make the tab able to write what the arrows say. The structure they point at remembers.*
