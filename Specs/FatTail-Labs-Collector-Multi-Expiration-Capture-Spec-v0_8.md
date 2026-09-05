# FatTail Labs — Collector Multi-Expiration Capture Spec v0.8

**Status:** **DRAFT — not BUILD AUTHORITY.** Needs Coach, India (architecture boundary),
Hotel (expiration and band convention), and a decision-log entry before a packet opens.
**Date:** 2026-09-05 · **Short name:** **SSR-MEXP** · **Owner:** Juliet (draft) → Alpha / Foxtrot
**Parents:** [Archive Read API v0.8](./FatTail-Labs-StudioOne-Archive-Read-API-Spec-v0_8.md)
· [SSR Collector Hardening v1.0](./FatTail-Labs-SSR-Collector-Hardening-Spec-v1.0.md)
· [Strategy Lab Method v0.2.2](./FatTail-Labs-Strategy-Lab-Backtest-Forward-Walk-Method-v0_2_2.md)
· Time Machine v0.7.4
**Supersedes:** v0.7 (2026-09-05) — adds **§5.1** (storage and draw model: ~40 GB/year
compressed, and the real constraint is file count, not bytes) and **§13** (Coach's
sequencing: benchmark traversal on the corpus that exists **while** era-2 collection runs).

---

## 0. Coach intent (do not drop)

> I originally did the collection just for the Time Machine. But collecting this extra
> dimension can **drastically increase the capability of the server**.

> Not 0DTE only. The FatTail Campaigns describe from **0–5 DTE** (Classic, TimeWarp,
> Batman, Convex Stack, Sigma Drift, etc). And I want to leave open strategies with legs
> that are **multi-DTE**, like calendars, diagonals, etc.

> It is what I have always been after, but taking small steps.

**Read that last line as the frame for this whole document.** The 0DTE-only capture was
never a judgment about the destination. It was the first rung: prove the tap writes, prove
a day can be replayed, prove the archive is real. That worked. This is the second rung.

---

## 1. What the archive becomes

This is the case for the change. Everything after §3 is how to get there without
damaging what already works.

### 1.1 The algo's biggest hole becomes a lookup

AZ-ALGO **E30** states it plainly: `E(t)` — remaining package extrinsic, *"the market's
own price of how much movement is still expected, the closest thing to a quoted `p`"* —
**has always been `null`**. Every trail this platform has ever drawn was a clock ramp
wearing decay's clothes.

With 0–5 DTE captured every session, decay stops being modelled and starts being
**observed**: the actual extrinsic surface bleeding down, conditioned on GEX, on distance
to the body, on regime, on time of day. The single largest gap in the hold-or-fold model
turns from a modelling program into a table you read.

### 1.2 Time Machine becomes a simulator

Today it walks one day's 0DTE. With the near term structure, a member puts a structure on
Monday and **walks it to Friday** — real surfaces, real overnight decay, real gap risk
across a weekend they did not get to skip.

That is a different product. It is also the one that actually teaches the thesis: *stop
the bleeding* only lands as a lesson once someone has had to hold something overnight and
decide in the morning.

### 1.3 A longitudinal record nobody else holds

Five times a week, every week, you watch a 5DTE structure **become** a 0DTE structure.
Thousands of observations of the same fly aging through its own life.

Not *what did butterflies do in 2019*. **What does this butterfly, on this underlier, in
this regime, look like twenty-four hours from now.** That is the empirical base under
every Campaign already named.

### 1.4 GEX gains a time axis

One expiration is a photograph. Zero through five is the **shape of dealer exposure
rolling forward** — a wall building, a pin migrating as near expirations roll off,
positioning concentrating into a Friday.

This is the tool Coach described when he asked for something that lets people understand
*what is pressuring the market*. It does not exist at one expiration. It exists across
five.

### 1.5 Calendars and diagonals become possible at all

They express the thesis most directly — long the wing, short the body, financed by the
decay differential — and they cannot be shown, taught, tested or replayed without two
expirations in one snapshot. This opens a curriculum arm that is currently closed.

### 1.6 The analysis gets better, not merely bigger

DTE is a **within-day** axis: every session yields five or six books, so a term-structure
question has 15 × 6 observations of the relationship rather than 15. Term structure is
also one of the few regularities in options that is **durable** — it is compensation for
risk, not an inefficiency waiting to be arbitraged away.

Adding this axis does not just enlarge the corpus. It adds the axis where the answerable
questions live, which is why **Sheldon** (`agents/bench/sheldon.md`) has real work the day
era-2 data starts landing.

### 1.7 It compounds, and it cannot be bought

Every captured session is permanent and the corpus only appreciates. In a year this is the
full near-term surface of your own instrument, at your own cadence, with your own band
logic — something no vendor sells and no competitor can assemble after the fact.

**That is the asset the rest of the platform gets built on.** This is not a collector
upgrade.

### 1.8 Every strategy, any start, any end — and it costs almost nothing

Coach: *"being able to track every single possible strategy starting and ending at any
time you choose is a huge advantage."*

It inverts how strategy evaluation works here. Today a backtest takes a rule as **input**
and returns a number. With a dense multi-DTE surface you compute the outcome for **every**
entry and **every** exit, and the rule becomes something you **read off the result** — the
edge shows up as a region on a surface rather than a hypothesis someone had to guess first.

**The reason this is affordable: the outcome surface is a difference of one series.**

```
mark[t]                     for every snapshot t          — computed ONCE, O(T)
pnl(entry, exit) = mark[exit] − mark[entry]               — every pair, O(1)
```

Nothing is enumerated. One session at T0 cadence:

| | |
|---|---|
| Snapshots per session (2 s) | **11,700** |
| Naive `(entry, exit)` pairs for one structure | **68,439,150** |
| Mark-once series for the same structure | **11,700 values — 0.09 MB** |
| Work avoided | **5,850×**, and every pair is one subtraction |

Scale it to a structure grid — centres × widths × expirations, say 1,440 candidates:

**16.8 M marks/day ≈ 0.13 GB**, from which roughly **10¹¹ `(structure, entry, exit)`
questions** are answered by subtraction. The combinatorics are in the *answers*, not in
the storage.

What that buys:

- **Entry/exit surfaces.** For one structure on one day, a 2-D field of outcome over
  (entry time × exit time). Whether the edge lives in entry timing, exit timing, or
  neither is visible at a glance instead of argued.
- **§14 stops sampling and starts enumerating.** AZ-ALGO's criterion 3 — *did the guide
  fold trades bound for the top return band* — needs exactly this: for every trade, what
  the trail did against everything that was available. The clause-A/clause-B split report
  (OD-ALGO-10) becomes a complete accounting rather than an estimate.
- **Discovery instead of testing.** Sweep the structure grid and let the surface show
  where the mass is, rather than pre-committing to a rule and asking whether it worked.
- **The counterfactual the product already wants.** `docs/FatTail Labs — Exit Trail and
  Decision Receipt v0.2.md` §5 is built on this exact question and has been waiting on the
  data to answer it.

**The guardrail is already written, and it is what makes this shippable.** Exit Trail v0.2
§5: *the counterfactual is **aggregated in the retrospective, never on the receipt**,*
because per-trade "money left on the table" teaches a member to widen their trail until it
stops protecting them. So: **total internally, aggregated externally.** The archive
computes everything; the member surface shows the pattern, not the regret. **AT-MEXP-15.**

### 1.9 Probabilistic fills — the difference between a research toy and a decision instrument

Coach: *"once we have the data, we can experiment with probabilistic fills and simulate
conditions, like liquidity and spread, letting us assign a probability to each and doing a
Monte Carlo analysis on entry and exit fills."*

**This is the correction §1.8 needs.** `mark[exit] − mark[entry]` is the *idealised*
outcome — it assumes you traded at the mark. Nobody trades at the mark. A butterfly is
three strikes wide, each with its own spread, and on a 0DTE wing the spread can be a large
fraction of the whole debit. A mid-fill backtest can manufacture an edge that does not
survive contact with a broker.

**The archive lets the fill model be estimated rather than assumed.** `LADDER_FIELDS` is
`mid · bid · ask · volume · open_interest · delta · iv`, and the tap writes the whole
generation, so spread and size are observable **per strike, per snapshot** — conditioned on
moneyness, DTE, time of day, and volatility regime. Every other backtest in this business
applies a made-up haircut. This one measures the thing.

**The output becomes a distribution, which is the only correct output for this firm.** A
point estimate of P&L is a category error at FatTail: the whole thesis is about the shape
of the tail, not the middle. Monte Carlo over per-leg fills turns each
`(structure, entry, exit)` from a number into a distribution, and *then* the questions
worth asking become askable — what does the left tail of this structure look like once
you price the spread, and does the right tail survive it.

**The bias this corrects runs in the worst possible direction.** The wings of a fly on a
fast-moving day are the strikes the band **just ratcheted in** — newest, thinnest,
widest-spread. So a mid-fill assumption is most optimistic exactly on the trending days
that produce the top return band. That is a systematic overstatement of precisely the
trades AZ-ALGO **§14.3** exists to protect, and it would flatter the model in the one place
this program has said it must not be flattered.

**Sheldon owns the fill model** (`agents/bench/sheldon.md`): it is an estimator, so it is
one implementation, fitted, with its search space declared and its out-of-sample behaviour
reported. A fill model tuned until a strategy looks good is the failure his invariants 1
and 4 exist to prevent.

**Verification, not assumption.** That `LADDER_FIELDS` is the persisted field set is
inferred from the writer storing `"generation": payload` wholesale. It must be **confirmed
against a real snapshot** before this section is relied on — and if bid/ask/size are *not*
in the archive, adding them is the same forward-only argument as §2 and belongs in this
same change. **AT-MEXP-16.**

### 1.10 Every greek, per strike, per snapshot — and §14 stops waiting

Coach: *"The ladder contains every Greek as well. And we need to capture that data."*

**Correction to §1.9.** `LADDER_FIELDS` is the **display** column set — its own comment says
*"Display columns (right of strike) — 7 fields."* It is not the persisted set. The tap
writes `"generation": payload` wholesale, and the ladder builds `delta · gamma · theta ·
vega · iv`, which the tap then counts per row:

```python
if all(r.get(k) is not None for k in ("delta", "gamma", "theta", "vega")):
```

So the first-order greek set is already in the payload. **Capturing it is therefore mostly
a matter of guaranteeing it** — asserting the fields are present and named, rather than
adding a fetch (**AT-MEXP-17**).

**The mark series becomes a risk series.** §1.8 gives outcome by `(entry, exit)`. Greeks
give the **exposure path between them** — so the question stops being *what did I make*
and becomes *what was I carrying while I made it.* Worst gamma exposure during the hold,
vega at the moment of the decision, theta actually earned versus theta quoted. That is the
risk question, and it is the one this firm teaches.

**AZ-ALGO §14 no longer waits for new data.** `profit_at_risk = Δ·m_adv + ½Γ·m_adv²` is a
**package** quantity (E10). Per-strike greeks let package greeks be reconstructed for **any
structure at any snapshot** — so the hold-or-fold model can be replayed across every
session since 2026-08-14 and criterion 3 answered: *did the guide fold trades bound for the
top return band.* The clause-A/clause-B split (**OD-ALGO-10**) is computable on the 0DTE
corpus **that is already on disk**. That gate does not have to wait for era 2.

**Theta archived is decay measured.** §1.1 said `E(t)` becomes observable; per-strike theta
makes it direct rather than inferred, and vega across 0–5 DTE is the term structure of vol
sensitivity — the engine under every calendar and diagonal.

**Greeks also condition the fill model.** Spread is not random: a market maker widens where
their own risk is highest. Archived gamma and vega are the natural conditioning variables
for §1.9's estimator, which is why these two sections are one idea.

**Archive greeks as quoted; never recompute on read.** A greek is a *model output*. Recomputed
later from a different vol surface or a different pricer it is a **different number wearing
the same name**, and every study built on it becomes irreproducible. The snapshot's greeks
are the greeks, and they carry their provenance — which model, which IV, as-of when. A
greek without a stated source is not evidence. **AT-MEXP-18.**

---

## 2. Why the timing is the whole game

**The corpus is forward-only.** Every historical day in `data/ssr-historical-inventory.md`
reads `NO CHAIN`; the tap began 2026-08-14. A session captured 0DTE-only has no 1–5 DTE
surface, and never will — that day's term structure is simply not for sale afterwards.

Every trading session between now and the change is a session of §1 that does not get
built. That is the entire argument for moving on this before the next open.

**A named test is already waiting on it.** Strategy Lab Method v0.2.2 §1a:

> This Batman needs the **next expiration** chain at ~15:45 ET (Friday → Monday, 3 DTE)…
> The coming week on StudioOne must capture **next expiration** at that clock or this test
> has no chain.

`front_expiration()` is unchanged since, so that test has been quietly unrunnable. Nothing
failed loudly — the tap writes a good 0DTE day every session and reports success.
**AT-MEXP-13 is that test coming back to life.**

---

## 3. Where step one got to, and what step two changes

```python
def front_expiration(row, day):
    """Expiry used for today's snap: the session day, and only if it is listed."""
    key = day.isoformat()
    return key if key in listed_expiration_dates(row) else None
```

| | Step one (as built) | Step two |
|---|---|---|
| Expirations | Exactly one — the session day if listed | `0 … LABS_SSR_MAX_DTE`, default **5** |
| Scanner | Already reaches **45 days / 16 expirations** — capability present, unused | Same scanner, now the source of the capture set |
| Band | One ~2.5σ ratcheting window | **Per expiration** (§4) |
| Cadence | 2 s, everything | **Tiered by DTE** (§5) |
| Layout | Expiration implied by the folder | Expiration in the path, era-versioned (§7) |

```
capture_expirations(day, symbol) =
    [ e in listed_expiration_dates(symbol) if 0 <= dte(e, day) <= LABS_SSR_MAX_DTE ]
```

**Listed, never derived.** The scanner is the only source of expiration dates — the
existing docstring already says why (*"That invented a 0DTE Massive does not have"*), and
that holds. A symbol with no expiration at some DTE is `NOT_LISTED` for the day, named,
never substituted with the nearest one.

## 3.1 Capture policy — verbatim, and a field allowlist is the defect

**Law: the tap stores the vendor response as returned. Reduction happens on READ, never on
WRITE.**

Coach: *"get everything the API has to offer. Anything short of that is wasting my money in
the subscription."*

That is the governing rule of this document, and §1's capabilities all rest on it. It is
also not what the pipeline does today.

### What is being discarded right now

`chain_ladder.build_ladder()` reads Massive's full snapshot — `last_quote`, `last_trade`,
`day`, `greeks`, `details`, `underlying_asset` — and returns a dict of **18 flat keys**.
Everything else is dropped before the tap is ever offered it:

| Discarded | Why it matters |
|---|---|
| **`last_quote.bid_size` / `ask_size`** | **Fatal to §1.9.** A fill probability without depth is a guess. This is the single most valuable field for the Monte Carlo model and it is thrown away on every snapshot |
| `last_trade.size` · `.conditions` · `.sip_timestamp` | The other half of a fill model — what actually printed, how big, under what condition |
| `last_quote.sip_timestamp` · exchange | Quote staleness and venue. A stale quote priced as live is a fill model lying to itself |
| `day.open` · `high` · `low` · `vwap` · `change` | Only `close` survives. Intraday range per contract, gone |
| `break_even_price` · `underlying_asset` · `exercise_style` | Vendor-computed reference values |

**These sessions are unrepeatable (§2).** Every one of those fields has been bought and
discarded since 2026-08-14, and cannot be re-bought for those days at any price.

### The rule

```
write path :  store the vendor's contract object VERBATIM, plus the tap's own envelope
read path  :  project, flatten, rename, display — as much as the caller likes
```

- **No allowlist, no projection, no flattening in the writer.** A hand-listed field set in
  the write path is a **defect**, not a design — it is a bet that today's questions are the
  only questions, and §1 is the proof that bet loses.
- `LADDER_FIELDS` stays exactly as it is. It is a **display** concern (its own comment says
  so) and display reduction is correct — on read.
- **Unknown fields are stored, not skipped.** A field the vendor adds next quarter lands in
  the archive without a code change. A schema that must be edited to keep a new field is the
  same defect wearing a different hat.
- **Vendor payload is stored as received, never normalised in place.** Units, names and
  nulls stay as the vendor sent them; every interpretation is a read-side decision that can
  be revisited. An archive that has already interpreted its inputs cannot be re-interpreted.
- Provenance already required by §1.10 extends to the whole object: which endpoint, which
  API version, as-of when.

**Cost.** A verbatim contract object is perhaps 3–5× a flattened 18-key row, and it
compresses well because most fields repeat between snapshots. Against §2's argument —
unrepeatable sessions, bought and discarded — that is not a close call. **AT-MEXP-19,
AT-MEXP-20.**

---

## 4. The band is per expiration — get this right or the data is quietly useless

The 2.5σ band is calibrated for **0DTE**. Applied unchanged to a 5DTE book it truncates
the chain **exactly where the strategies live**: the wings a calendar or diagonal needs are
further out precisely because there is more time to reach them.

Expected move scales with `√T`, so a 5DTE book needs roughly `√5 ≈ 2.24×` the width.

```
band_halfwidth(e) = LABS_SSR_BAND_SIGMA × sigma_estimate(symbol) × sqrt(T_e) × spot
```

**One σ implementation.** This is the σ_T that Archive Lab WS2 owns and **Sheldon** is
seated over. No second estimator — India blocks a parallel one, and AZ-ALGO **E36** is the
standing precedent for what a duplicate volatility quantity does to a program.

**Each book ratchets independently.** A book widens on its own terms and never drops a
strike. Sharing one ratchet across books would let a quiet 0DTE day silently narrow the
5DTE capture — losing the far wings on exactly the days worth studying.

**AT-MEXP-3 fails the build if strike coverage comes out identical across DTE.** That
would mean one band is being applied to every book, which is the failure this section
exists to prevent, and it would not otherwise announce itself.

### 4.1 The band follows price, and it must lead — not react

Coach: *"What I don't want is the full range of strikes, only the range that is reasonable
given the current volatility, with a follow-algorithm to ensure we can capture all relevant
prices."*

**Two axes, opposite answers, and they do not conflict:**

| Axis | Rule | Where |
|---|---|---|
| **Fields** | **Everything the vendor returns.** Verbatim | §3.1 |
| **Strikes** | **Bounded** — the reasonable range given current volatility | this section |

Storing every listed strike would be waste; storing every *field* of the strikes that
matter is the point. §3.1 does not license a wider band, and this section does not license a
narrower field set.

### The window has two parts

```
follow(t)  = spot(t) ± ( LABS_SSR_BAND_SIGMA × sigma_estimate × sqrt(T_e) × spot(t) )
active(t)  = follow(t)  ∪  { every strike admitted at any earlier t }
```

`follow` **re-centres on current spot every evaluation**; the union with everything already
admitted is the ratchet (§4) — nothing is ever dropped mid-session. On a trending day the
active set is therefore the swept corridor, not a fixed window: the origin side stays
because it was relevant, and the leading side grows because it is about to be.

### Admission must precede arrival — this is the whole requirement

A band that widens *when price approaches* records the strike **after** the interesting part
is over. The approach — the minutes when a strike goes from far to near and its greeks,
spread and size all move — is exactly the data a fill model and a structure study need, and
a reactive band never has it.

```
lead(t) = LABS_SSR_BAND_LEAD_SIGMA × sigma_estimate × sqrt(horizon) × spot(t)
```

The admission edge sits at `follow(t) + lead(t)`. `LABS_SSR_BAND_LEAD_SIGMA` is a starting
constant, fail loud if absent, fitted once a week of data exists.

**The invariant, and it is measurable:** *spot never comes closer to the admission edge than
the lead buffer.* If it does, the follow algorithm lagged — and that is a **named defect
recorded in the day's PROVENANCE**, not something to discover later by noticing a study has
no data at its most interesting moment. **AT-MEXP-21.**

### Per expiration, independently

Each book follows and leads on **its own** `T_e` (§4). A 5DTE book needs a wider band *and*
a longer lead, because price has more time to travel. One shared follow across books would
let the 0DTE window govern the 5DTE capture — the failure §4 already forbids, reappearing
on the time axis.

### What this is not

- **Not the full chain.** Bounded is the point; §3.1 is about fields, not reach.
- **Not a fixed strike count.** The band is volatility-derived, so a quiet day is narrow and
  a wild day is wide. A constant strike count would be widest when it mattered least.
- **Not re-centred by dropping.** Following moves the *leading* edge; the ratchet keeps the
  trailing one. A band that slid — admitting ahead and dropping behind — would lose the
  origin side of exactly the trending days worth studying.

---

## 5. Cadence tiers — how §1 stays affordable

Six books at the 0DTE cadence is ~6× the volume, and it is also wrong on the merits: a
5DTE surface does not move at 2-second resolution, so sampling it there stores mostly
repeated bytes.

| Tier | DTE | Cadence | Why |
|---|---|---|---|
| **T0** | 0 | `LABS_SSR_CHAIN_EVERY_S` — **2 s, unchanged** | Time Machine replay fidelity. Step one's obligation, protected |
| **T1** | 1–2 | `LABS_SSR_CHAIN_EVERY_S_NEAR` — 15 s | Batman / TimeWarp entries are clock-specific, not tick-specific |
| **T2** | 3–5 | `LABS_SSR_CHAIN_EVERY_S_FAR` — 60 s | Structure and IV surface, not path |

Roughly **1.4×** a current day rather than 6×, before the wider far bands push it back up.
**Foxtrot measures a real session before this is stamped** (OD-2, blocking) — the number
above is arithmetic, not evidence.

**T0 is never slowed to afford the others.** Anything that would trade replay fidelity for
term structure is refused; the far books are additive or they wait.

### 5.1 Storage and draw — what it actually costs

Modelled at 2.5σ capture (§4.1), verbatim rows (§3.1), the §5 tiers, SPX 6000 at ~1%
session σ and 5-point strikes. **Assumptions are stated so they can be attacked**; OD-2
replaces them with measurement.

| DTE | Cadence | Strikes | Snaps/session | Raw |
|---|---|---|---|---|
| 0 | 2 s | 60 | 11,700 | 1.05 GB |
| 1–2 | 15 s | 60–84 | 1,560 each | 0.34 GB |
| 3–5 | 60 s | 103–134 | 390 each | 0.21 GB |
| | | | **Total** | **≈ 1.60 GB/day** |

| | Per day | Per year | Five years |
|---|---|---|---|
| Raw | 1.60 GB | 403 GB | 2.0 TB |
| Compressed (zstd ~10×, conservative for JSON this repetitive) | **0.16 GB** | **≈ 40 GB** | **200 GB** |

**The 2 TB volume holds roughly fifty years of this.** Against today's capture it is 5.7×
the bytes — and today is 0.03 GB/day compressed, so 5.7× of very little is still very
little. **Storage is not the constraint and should not drive any decision in this spec.**

**What does constrain, in order:**

1. **File count — the sleeper.** ~16,000 files/day/symbol → **4 M/year, 20 M over five
   years.** Only 1.4× today's count, because the far tiers are slow. But the Read API's
   index **stats every file** (§1 of that spec: *"Index without envelope opens"*), so
   coverage and index costs grow with file count, not bytes. This is a **read-path** cost
   that compounds, and it is cheaper to design for at 4 M files than to discover at 20 M.
2. **Burst shape, not sustained rate.** 16,000 calls/session/symbol is **0.68/sec
   sustained** versus 0.50 today — comfortable. The shape to manage is that all six books
   can come due on the same tick every 60 s. **Stagger the far tiers by a few seconds** and
   the burst disappears.
3. **Bytes.** Last, and by a wide margin.

---

## 6. Capture and delivery are different decisions

Coach, 2026-08-26: capturing beyond 0DTE *"balloons the data past what can be delivered
for archive replay."* Still true — and it is a statement about **delivery**.

| | Rule |
|---|---|
| **Capture** | `0 … MAX_DTE`, tiered cadence, per-expiration band |
| **Member replay download** | **Unchanged.** Not widened by this spec |

The far books serve §1 — the decay surface, the aging study, the term-structure work,
Strategy Lab — all of which read the archive **on StudioOne**, never through a member's
connection. What a member can pull is a separate program with its own bandwidth argument.
The archive is allowed to hold more than it hands out.

---

## 7. Layout — two eras, both correct

The expiration has to be in the path once a day holds more than one book.

```
era 1  (2026-08-14 …)   day=D/chain/<SYM>/snap-HHMMSSmmmZ.json
era 2  (this change)    day=D/chain/<SYM>/exp=YYYY-MM-DD/snap-HHMMSSmmmZ.json
```

**Era-1 days are never rewritten.** They are correct for what they are and they are the
proof step one worked. The archive is simply heterogeneous, and readers are told which era
a day is, rather than inferring it.

- `PROVENANCE.json` gains `layout_era` and `capture_max_dte`.
- `COUNTS.json` becomes per book, with a `books` array.
- A day with no `layout_era` is **`UNKNOWN_ERA`** and refused — never assumed to be era 1.
  Guessing the era from directory shape is a defect.

---

## 8. Read API — expiration becomes a choice the client makes

Read API v0.8 §2 gave a real safety property: with one book per day, *"a client that
asserts nothing cannot construct a wrong book at all — the failure mode is designed out
rather than caught."*

With several books, the client has a genuine choice to make, so it makes it explicitly:

| Day's era | `expiration` | Behaviour |
|---|---|---|
| **1** | optional assertion | Unchanged. `WRONG BOOK` on mismatch |
| **2** | **required** on index and fetch | Absent → **`EXPIRATION_REQUIRED`** (400). Never a default, never "the nearest" |

**Coverage is the discovery call** — it lists every book for `(day, symbol)` with
expiration, DTE, tier, band and snap count, so the client chooses from what exists rather
than guessing. v0.4 required the parameter and was right for many books; v0.8 relaxed it
and was right for one. Both stay right, which is why the era is a property of the day.

**Read API goes to v0.9 in the same body of work** — documentation parity, not "later."


## 13. Sequencing (Coach, 2026-09-05)

> Let's start with the current data set to test how long it takes to traverse the set, and
> in the interim we will collect the full set, and when we have enough days, maybe 2–4
> weeks, we will start testing the traversability of that set.

Three tracks, and the first two run **in parallel** — the benchmark needs no new data and
collection must not wait for it.

| Track | Starts | Depends on |
|---|---|---|
| **A — Traversal benchmark on era 1** | **Now.** The corpus since 2026-08-14 exists | Nothing. Read-only |
| **B — Era-2 collection** | **As soon as the change is stamped.** Every session deferred is unrepeatable (§2) | Coach · India · Hotel · DL |
| **C — Traversal benchmark on era 2** | After **2–4 weeks** of era-2 sessions | B, plus enough days to hold out a fold (OD-4) |

### 13.1 What the benchmark must report — dominance, not elapsed time

A benchmark that returns *"a day takes N seconds"* is not actionable, because the fix
depends entirely on **what dominates**:

| If the cost is mostly… | The mitigation is |
|---|---|
| **JSON parse** | a derived columnar layer (parquet/arrow) built once per day; the raw archive stays verbatim (§3.1) |
| **File open / stat** | packing snapshots per book per interval — a layout change, and the reason to know now rather than at 20 M files |
| **Disk I/O** | compression at rest; already cheap (§5.1) |
| **Deserialise-to-structure** | cache the per-structure mark series (§1.8), which is `O(T)` and answers every `(entry, exit)` |

**Required measurements, per run:** wall time · CPU time · bytes read · files opened ·
time split across open / read / parse / extract · page-cache cold **and** warm.

### 13.2 The three passes to time

1. **Index-only** — coverage and index for a day, **no envelope opens**. This is the Read
   API's own claim (§1 of that spec) and the benchmark verifies it holds at scale.
2. **Full-day linear scan** — every snapshot of one book, parsed, one field extracted. This
   is §1.8's mark-once pass and the thing every study depends on.
3. **Multi-day sweep** — the same across N days, to see whether cost is linear in days or
   whether file count starts to dominate.

### 13.3 The comparison that makes track C meaningful

Track A establishes the **era-1 baseline**. Track C repeats *the identical passes* on era-2
and is judged against a **predicted** multiplier derived from §5.1 — roughly 1.4× the files
and 5.7× the bytes.

**Coming in materially worse than predicted is a finding, not a disappointment.** It would
mean either the model in §5.1 is wrong, or something in the era-2 layout costs more than
counting suggests — and either is worth knowing before the corpus is a year deep.

---

## 9. Out of scope

- Widening the member-facing replay download (§6).
- Backfilling era-1 days. That data does not exist and cannot be recovered.
- Changing T0 cadence, band sigma, or ratchet semantics for 0DTE.
- A second σ_T or any parallel volatility estimator (E36).
- Sheldon's studies — specified separately, and they wait for enough era-2 sessions to
  hold out a fold (OD-4).

---

## 10. Open decisions

| # | Question | Owner | Default if silent |
|---|---|---|---|
| **OD-1** | `MAX_DTE` = **5** (the Campaign range), or wider now while it is cheap to decide? | **Coach** | **5.** But note §1.7 — sessions are unrepeatable, so erring wide costs storage and erring narrow costs a year of data you cannot buy back |
| **OD-2** | One full session measured at the proposed tiers before stamping | **Foxtrot** | **Blocking** |
| **OD-3** | Tier boundaries and values (15 s / 60 s) | **Coach · Hotel** | Starting constants. Fit after a week of era-2 data |
| **OD-4** | Minimum era-2 sample before analysis opens | **Coach · Sheldon** | Enough to hold out a fold |
| **OD-5** | Every symbol in `LABS_SSR_SYMBOLS`, or SPX/SPY first? | **Coach** | **SPX/SPY first**, widen after OD-2 |

---

## 11. Acceptance

| AT | Criterion |
|---|---|
| **AT-MEXP-1** | Only **listed** dates within `[0, MAX_DTE]` are captured. Grep: no weekday-arithmetic expiration derivation. |
| **AT-MEXP-2** | `LABS_SSR_MAX_DTE` absent or non-integer → module load **aborts naming the key**. |
| **AT-MEXP-3** | On a day where spot exceeds the 0DTE band but not the 5DTE band, books show **different** strike coverage. Identical coverage is a **fail** (§4). |
| **AT-MEXP-4** | Ratchets are independent — forcing a narrow 0DTE day does not narrow the 3DTE book. |
| **AT-MEXP-5** | **Time Machine does not regress.** An era-2 session's 0DTE snap count is within tolerance of an era-1 session's. |
| **AT-MEXP-6** | `PROVENANCE.json` carries `layout_era` and `capture_max_dte`; `COUNTS.json` carries a per-book `books` array. |
| **AT-MEXP-7** | A day with no `layout_era` is `UNKNOWN_ERA` and refused — never assumed era 1. |
| **AT-MEXP-8** | Era-2 index/fetch without `expiration` → `EXPIRATION_REQUIRED` (400). Era-1 unchanged. |
| **AT-MEXP-9** | Coverage lists every book with expiration, DTE, tier, band, snap count. |
| **AT-MEXP-10** | Era-1 days are byte-identical after this ships. |
| **AT-MEXP-11** | **Source grep:** one σ_T implementation (E36). |
| **AT-MEXP-12** | A `NOT_LISTED` book is named, never substituted with the nearest expiration. |
| **AT-MEXP-13** | The Batman entry from Strategy Lab Method v0.2.2 §1a — next expiration at ~15:45 ET — resolves to a real captured book on an era-2 Friday. **The test that has had no chain since August.** |
| **AT-MEXP-14** | A calendar spread — two legs, two expirations — is constructible from a single era-2 snapshot. §1.5 is real or it is not. |
| **AT-MEXP-21** | **Follow does not lag.** Across a full session, `spot` never comes within `lead(t)` of the admission edge for any book. A violation is recorded in that day's `PROVENANCE.json` as a named defect — never silent. Replayed on a strongly trending archived day, the leading strikes are present **before** spot reaches them, with their approach recorded (§4.1). |
| **AT-MEXP-22** | Band width tracks volatility, not a constant strike count: a low-σ session is measurably narrower than a high-σ session on the same symbol and expiration (§4.1). |
| **AT-MEXP-19** | **Source grep of the write path:** no field allowlist, no key projection, no flattening. A snapshot round-trips the vendor's contract object with every key the vendor sent, including keys this spec does not name. A writer that enumerates fields **fails** (§3.1). |
| **AT-MEXP-20** | A captured snapshot contains `bid_size` and `ask_size` where the vendor supplied them. Absent from the vendor → **named state**; absent from the archive because the pipeline dropped them → **defect** (§3.1, §1.9). |
| **AT-MEXP-17** | **Confirmed against a real snapshot:** every persisted chain row carries `delta`, `gamma`, `theta`, `vega` and `iv`. A row missing any is a **named state**, never a zero and never an interpolation. `greek_count` in the snapshot envelope matches the rows that actually carry the full set (§1.10). |
| **AT-MEXP-18** | Greeks are stored **as quoted** and carry provenance — source model, IV used, as-of. Nothing in the read or study path recomputes a greek from the archived surface and presents it under the same name (§1.10). |
| **AT-MEXP-16** | **Confirmed against a real snapshot**, not inferred: every persisted chain row carries `bid`, `ask`, and a size field alongside `mid`. If any is absent, capturing it is added to this change — the fill model cannot be estimated from marks alone, and the sessions are unrepeatable (§1.9, §2). |
| **AT-MEXP-15** | For one structure on one era-2 day, `pnl(entry, exit)` is derivable for **any** pair from a single stored mark series — no pair enumeration, no re-read of snapshots (§1.8). And per Exit Trail v0.2 §5, no member-facing surface renders a **per-trade** counterfactual; aggregated only. |

---

## 12. Changelog

| Ver | Date | Notes |
|---|---|---|
| **v0.8** | 2026-09-05 | Adds **§5.1** — storage and draw modelled: **≈1.6 GB/day raw, ≈0.16 GB/day compressed, ≈40 GB/year**, and the 2 TB volume holds roughly **fifty years**. Storage is **not** the constraint and must not drive a decision here. What does: **file count** (~16 k/day/symbol → 4 M/year; the Read API stats every file, so this is a read-path cost that compounds — cheaper to design for at 4 M than to discover at 20 M), then **burst shape** (0.68/sec sustained is fine; six books coming due on one tick is not — stagger the far tiers), then bytes, last. Adds **§13**, Coach's sequencing: track A benchmarks traversal on the era-1 corpus **now** (needs no new data), track B collects era 2 **in parallel** (unrepeatable sessions), track C repeats the identical passes after 2–4 weeks against a predicted multiplier. The benchmark reports **what dominates** — parse, file-open, or I/O — because the mitigation differs entirely; elapsed time alone is not actionable. |
| **v0.7** | 2026-09-05 | Adds **§4.1, the follow algorithm**. States the two axes together so they cannot be confused: **fields verbatim (§3.1), strikes bounded**. The window is `follow(t) ∪ everything already admitted` — re-centred on spot every evaluation, never dropping. The requirement with teeth: **admission must precede arrival.** A band that widens when price approaches records the strike *after* the interesting part — the approach, when greeks, spread and size all move, is exactly what a fill model and a structure study need. So the edge sits at `follow(t) + lead(t)`, and the measurable invariant is that spot never comes within the lead buffer of the admission edge; a violation is a named defect in that day's PROVENANCE, not something found later by noticing a study has no data at its most interesting moment. Per-expiration follow and lead on each book's own `T_e`. **AT-MEXP-21, AT-MEXP-22**. |
| **v0.6** | 2026-09-05 | Adds **§3.1**, the policy that governs the document: **store the vendor payload verbatim; reduce on read, never on write.** Coach: *get everything the API has to offer; anything short of that is wasting my money in the subscription.* Names what the pipeline discards today — `build_ladder()` reads Massive's full snapshot and emits **18 flat keys**, throwing away **`bid_size`/`ask_size`** (fatal to §1.9 — a fill probability without depth is a guess), trade size and conditions, SIP timestamps and venue, and `day` OHLC/VWAP. Those fields have been bought and discarded on every session since 2026-08-14 and cannot be re-bought. Unknown fields are stored without a code change; the payload is never normalised in place. `LADDER_FIELDS` is unchanged — display reduction is correct on **read**. **AT-MEXP-19, AT-MEXP-20**. v0.2–v0.5 enumerated fields one at a time, which is how this was missed. |
| **v0.5** | 2026-09-05 | Adds **§1.10** — the full greek set per strike. Corrects v0.4: `LADDER_FIELDS` is the *display* set, not the persisted one; the generation already carries `delta/gamma/theta/vega/iv`, so this is guaranteeing the fields rather than adding a fetch. The consequence nobody had named: **AZ-ALGO §14 can run on the archive that already exists** — `PaR = Δ·m + ½Γ·m²` is a package quantity, per-strike greeks reconstruct package greeks for any structure at any snapshot, so criterion 3 and the OD-ALGO-10 clause split are computable on the 0DTE corpus already on disk. The mark series becomes a **risk** series (exposure path, not just outcome). Theta archived makes `E(t)` direct. Greeks condition the §1.9 fill model. **Greeks are archived as quoted and never recomputed on read** — a recomputed greek is a different number wearing the same name. **AT-MEXP-17, AT-MEXP-18**. |
| **v0.4** | 2026-09-05 | Adds **§1.9** — probabilistic fills and Monte Carlo over entry/exit, the correction §1.8 requires: `mark[exit] − mark[entry]` is the idealised outcome and nobody trades at the mark. The archive lets the fill model be **estimated** (spread and size are observable per strike per snapshot) rather than assumed, turns each `(structure, entry, exit)` into a **distribution** — the only correct output for a firm whose thesis is the tail — and corrects a bias that runs the worst way: mid-fill is most optimistic on fast days, whose wings are the newest and thinnest strikes, which is exactly what §14.3 must not be flattered about. Sheldon owns the fill model as an estimator. **AT-MEXP-16** requires the field set be confirmed against a real snapshot, not inferred. |
| **v0.3** | 2026-09-05 | Adds **§1.8** — every strategy, any start, any end. The outcome surface is a *difference of one series*: mark once per snapshot (O(T)), and every `(entry, exit)` is a subtraction (O(1)) — 5,850× less work than enumerating 68 M pairs, and a 1,440-candidate structure grid is 0.13 GB/day answering ~10¹¹ questions. Turns §14's criterion 3 from a sampling exercise into a complete accounting, and supplies the counterfactual Exit Trail v0.2 §5 has been waiting on — bounded by that document's own rule: aggregated in the retrospective, never per-trade on the receipt. **AT-MEXP-15**. |
| **v0.2** | 2026-09-05 | **Reframed, same engineering.** Leads with what the archive becomes (§1): `E(t)` observed rather than modelled, Time Machine as simulator, the aging record, GEX with a time axis, calendars possible at all, and an asset that compounds and cannot be bought. Step one reframed as the first rung rather than a ruling being reversed (§0, §3). Adds **AT-MEXP-14** — a calendar constructible from one snapshot, so §1.5 is testable rather than asserted. OD-1 now names the asymmetry: storage is cheap, an unrepeatable session is not. |
| v0.1 | 2026-09-05 | First draft. Right mechanics, wrong frame — read as a list of things that break. |
