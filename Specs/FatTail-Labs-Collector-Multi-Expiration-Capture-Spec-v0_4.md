# FatTail Labs — Collector Multi-Expiration Capture Spec v0.4

**Status:** **DRAFT — not BUILD AUTHORITY.** Needs Coach, India (architecture boundary),
Hotel (expiration and band convention), and a decision-log entry before a packet opens.
**Date:** 2026-09-05 · **Short name:** **SSR-MEXP** · **Owner:** Juliet (draft) → Alpha / Foxtrot
**Parents:** [Archive Read API v0.8](./FatTail-Labs-StudioOne-Archive-Read-API-Spec-v0_8.md)
· [SSR Collector Hardening v1.0](./FatTail-Labs-SSR-Collector-Hardening-Spec-v1.0.md)
· [Strategy Lab Method v0.2.2](./FatTail-Labs-Strategy-Lab-Backtest-Forward-Walk-Method-v0_2_2.md)
· Time Machine v0.7.4
**Supersedes:** v0.3 (2026-09-05) — adds §1.9, probabilistic fills and Monte Carlo over
entry and exit. That is what turns §1.8 from an idealised surface into an achievable one.

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
| **AT-MEXP-16** | **Confirmed against a real snapshot**, not inferred: every persisted chain row carries `bid`, `ask`, and a size field alongside `mid`. If any is absent, capturing it is added to this change — the fill model cannot be estimated from marks alone, and the sessions are unrepeatable (§1.9, §2). |
| **AT-MEXP-15** | For one structure on one era-2 day, `pnl(entry, exit)` is derivable for **any** pair from a single stored mark series — no pair enumeration, no re-read of snapshots (§1.8). And per Exit Trail v0.2 §5, no member-facing surface renders a **per-trade** counterfactual; aggregated only. |

---

## 12. Changelog

| Ver | Date | Notes |
|---|---|---|
| **v0.4** | 2026-09-05 | Adds **§1.9** — probabilistic fills and Monte Carlo over entry/exit, the correction §1.8 requires: `mark[exit] − mark[entry]` is the idealised outcome and nobody trades at the mark. The archive lets the fill model be **estimated** (spread and size are observable per strike per snapshot) rather than assumed, turns each `(structure, entry, exit)` into a **distribution** — the only correct output for a firm whose thesis is the tail — and corrects a bias that runs the worst way: mid-fill is most optimistic on fast days, whose wings are the newest and thinnest strikes, which is exactly what §14.3 must not be flattered about. Sheldon owns the fill model as an estimator. **AT-MEXP-16** requires the field set be confirmed against a real snapshot, not inferred. |
| **v0.3** | 2026-09-05 | Adds **§1.8** — every strategy, any start, any end. The outcome surface is a *difference of one series*: mark once per snapshot (O(T)), and every `(entry, exit)` is a subtraction (O(1)) — 5,850× less work than enumerating 68 M pairs, and a 1,440-candidate structure grid is 0.13 GB/day answering ~10¹¹ questions. Turns §14's criterion 3 from a sampling exercise into a complete accounting, and supplies the counterfactual Exit Trail v0.2 §5 has been waiting on — bounded by that document's own rule: aggregated in the retrospective, never per-trade on the receipt. **AT-MEXP-15**. |
| **v0.2** | 2026-09-05 | **Reframed, same engineering.** Leads with what the archive becomes (§1): `E(t)` observed rather than modelled, Time Machine as simulator, the aging record, GEX with a time axis, calendars possible at all, and an asset that compounds and cannot be bought. Step one reframed as the first rung rather than a ruling being reversed (§0, §3). Adds **AT-MEXP-14** — a calendar constructible from one snapshot, so §1.5 is testable rather than asserted. OD-1 now names the asymmetry: storage is cheap, an unrepeatable session is not. |
| v0.1 | 2026-09-05 | First draft. Right mechanics, wrong frame — read as a list of things that break. |
