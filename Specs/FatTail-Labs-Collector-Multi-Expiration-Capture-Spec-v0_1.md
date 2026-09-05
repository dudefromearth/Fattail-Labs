# FatTail Labs — Collector Multi-Expiration Capture Spec v0.1

**Status:** **DRAFT — not BUILD AUTHORITY.** Scope change to a running collector. Requires
Coach approval, India (architecture boundary), Hotel (expiration/band convention), and a
decision-log entry before any packet opens.
**Date:** 2026-09-05
**Short name:** **SSR-MEXP** · **Owner:** Juliet (draft) → Alpha / Foxtrot (execute)
**Parents:** [`FatTail-Labs-StudioOne-Archive-Read-API-Spec-v0_8.md`](./FatTail-Labs-StudioOne-Archive-Read-API-Spec-v0_8.md)
· [`FatTail-Labs-SSR-Collector-Hardening-Spec-v1.0.md`](./FatTail-Labs-SSR-Collector-Hardening-Spec-v1.0.md)
· [`FatTail-Labs-Strategy-Lab-Backtest-Forward-Walk-Method-v0_2_2.md`](./FatTail-Labs-Strategy-Lab-Backtest-Forward-Walk-Method-v0_2_2.md)
· Time Machine v0.7.4
**Affects:** `server/market_data/ssr_live_capture.py` · on-disk layout · Archive Read API
§1, §2, §4 · Time Machine book resolution

---

## 0. Coach intent (do not drop)

> I originally did the collection just for the Time Machine. But collecting this extra
> dimension can drastically increase the capability of the server.

> Not 0DTE only. The FatTail Campaigns describe from 0–5 DTE (Classic, TimeWarp, Batman,
> Convex Stack, Sigma Drift, etc). And I want to leave open strategies with legs that are
> multi-DTE, like calendars, diagonals, etc.

Prior ruling being reversed, and it was Coach's own (2026-08-26, Archive Read API §1):

> **Only the 0DTE expiration is captured.** This is deliberate, not an omission: capturing
> beyond 0DTE balloons the data past what can be delivered for archive replay.

**That reasoning is preserved, not discarded.** It is a statement about *delivery*, and
§6 keeps it: what the tap captures and what the archive serves for replay are separated
here for the first time. The archive may hold more than it hands to a member.

---

## 1. Why this is urgent, not merely desirable

**The corpus accumulates forward only.** Every historical day in
`data/ssr-historical-inventory.md` reads `NO CHAIN`; the tap began 2026-08-14 and each
session is written once. A session captured at 0DTE-only has no 1–5 DTE surface, and
never will. The cost of deferring this decision is not delay — it is permanent absence,
one trading day at a time.

**It already blocks a named test.** Strategy Lab Method v0.2.2 §1a:

> This Batman needs the **next expiration** chain at ~15:45 ET (Friday → Monday, 3 DTE).
> The Aug 14 folder is a 0DTE day — **not** this entry's chain. The coming week on
> StudioOne must capture **next expiration** at that clock or this test has no chain.

`front_expiration()` is unchanged since. That test still has no chain, and nothing failed
loudly — the tap writes a valid 0DTE day every session and reports success. **A collector
that silently captures the wrong book is this program's recurring defect wearing new
clothes: a refusal rendered as a reading.** §7 makes it fail loud instead.

**It caps the analysis program.** Calendars and diagonals need two expirations in one
snapshot. A corpus with one book per day cannot answer those questions at any sample size.

---

## 2. As-built (law for the change)

```python
def front_expiration(row, day):
    """Expiry used for today's snap: the session day, and only if it is listed."""
    key = day.isoformat()
    return key if key in listed_expiration_dates(row) else None
```

| Fact | Today |
|---|---|
| Expirations captured | **Exactly one** — the session day, if listed. Otherwise `not_today`, zero snaps |
| Scanner reach | `scan_listed_expirations` already asks Massive for **45 days / 16 expirations**. The capability exists and is unused |
| Layout | `day=D/chain/<SYM>/snap-HHMMSSmmmZ.json` — the expiration is **implied by the folder**, never in the path |
| Cadence | `LABS_SSR_CHAIN_EVERY_S`, default **2.0 s**, clamped `[2, 5]` (OD-6) |
| Band | ~2.5σ around spot, **ratcheting** — strikes are admitted and never dropped |
| Book identity | `(symbol, listed expiration, wing window)`; one book per `(day, symbol)` folder |

---

## 3. Capture scope (the change)

```
capture_expirations(day, symbol) =
    [ e in listed_expiration_dates(symbol)
      if 0 <= dte(e, day) <= LABS_SSR_MAX_DTE ]
```

`LABS_SSR_MAX_DTE` default **5**, matching the Campaign range Coach named. Fail loud if
absent or non-integer; no silent default (Invariant 2).

**Listed, never derived.** The scanner is the only source of expiration dates. A date that
Massive does not list is never captured, never invented, and never inferred from a weekday
rule — the existing `front_expiration` docstring already names why (*"That invented a 0DTE
Massive does not have"*), and that discipline carries forward unchanged.

**A missing expiration is a named state, not a gap to fill.** If a symbol lists no
expiration at some DTE, that book is `NOT_LISTED` for the day. It is never substituted
with the nearest one.

---

## 4. The band is DTE-dependent — this is the defect most likely to ship

The current band is ~2.5σ around spot, calibrated for a **0DTE** name. Applying that same
strike window to a 5DTE book truncates it, and truncates it **exactly where the strategies
live**: the wings a calendar or diagonal needs are further out precisely because there is
more time for price to reach them.

Expected move scales with `√T`. A 5DTE book needs a band roughly `√5 ≈ 2.24×` wider than
the 0DTE book on the same underlier.

**Law:** the band is computed **per expiration**, from that expiration's own time to
expiry:

```
band_halfwidth(e) = LABS_SSR_BAND_SIGMA × sigma_estimate(symbol) × sqrt(T_e) × spot
```

**`sigma_estimate` is a single shared implementation.** It is the σ_T that Archive Lab WS2
owns and that **Sheldon** (`agents/bench/sheldon.md`) is seated over. This spec must not
create a second one — India blocks a parallel estimator, and AZ-ALGO **E36** is the
standing precedent for how a second volatility quantity poisons a program.

**The ratchet is per-expiration and independent.** Each book widens on its own terms and
never drops a strike. A 5DTE book does not inherit the 0DTE book's ratchet, and vice
versa. Sharing one ratchet across books would let a quiet 0DTE day silently narrow the
5DTE capture.

**Acceptance:** a day on which spot moves more than the 0DTE band but less than the 5DTE
band must show *different* strike coverage per book. Identical coverage across DTE is a
defect, not a coincidence.

---

## 5. Cadence tiers — how this stays affordable

Naively capturing six books at the 0DTE cadence is ~6× the write volume and ~6× the API
draw. It is also **wrong on the merits**: a 5DTE surface does not move at 2-second
resolution, and sampling it there stores mostly repeated bytes.

| Tier | DTE | Cadence | Rationale |
|---|---|---|---|
| **T0** | 0 | `LABS_SSR_CHAIN_EVERY_S` (2 s, unchanged) | Time Machine replay fidelity. **Must not regress** — this is the original purpose |
| **T1** | 1–2 | `LABS_SSR_CHAIN_EVERY_S_NEAR` (default 15 s) | Batman / TimeWarp entries are clock-specific, not tick-specific |
| **T2** | 3–5 | `LABS_SSR_CHAIN_EVERY_S_FAR` (default 60 s) | Structure and IV surface, not path |

Under these tiers the added volume is roughly **T0 + 2×(T0/7.5) + 3×(T0/30) ≈ 1.4×** the
current day, not 6× — before accounting for the wider far-dated bands, which push it up
again. **Foxtrot must measure a real day before this is stamped** (§10, OD-2); the estimate
above is arithmetic, not evidence.

**T0 is protected.** Any change that would slow the 0DTE tier to afford the others is
refused. Time Machine is the collector's founding obligation and the far books are additive.

---

## 6. Capture is not delivery (preserving Coach's 2026-08-26 reasoning)

Coach's original ruling was that beyond-0DTE *"balloons the data past what can be
delivered for archive replay."* True, and unchanged. This spec separates the two concerns
that sentence joined:

| Concern | Rule |
|---|---|
| **Capture** | 0 … `MAX_DTE`, tiered cadence, per-expiration band |
| **Replay delivery** | Unchanged default. Time Machine continues to fetch **one book** and the member-facing download is **not** widened by this spec |

The far books exist for **analysis and strategy testing** (Sheldon, Strategy Lab), which
read from the archive directly on StudioOne rather than through a member download. Widening
what a member can pull is a separate program with its own bandwidth argument, and is
**out of scope** (§9).

---

## 7. On-disk layout — a breaking change, versioned as an era

Today the expiration is implied by the folder. With more than one book per day it must be
in the path.

```
era 1 (2026-08-14 …)   day=D/chain/<SYM>/snap-HHMMSSmmmZ.json
era 2 (this change)    day=D/chain/<SYM>/exp=YYYY-MM-DD/snap-HHMMSSmmmZ.json
```

**Era 1 days are never rewritten.** They are correct for what they are. The archive becomes
**heterogeneous**, and every reader must be able to tell which era a day belongs to
**without opening a snapshot**.

- `PROVENANCE.json` gains `layout_era` (int) and `capture_max_dte` (int).
- `COUNTS.json` becomes **per book**, keyed by expiration, and gains a `books` array.
- A day with `layout_era: 1` has exactly one book and the flat path; `layout_era: 2` has
  the `exp=` level. **A reader that guesses the era from the presence of a directory is a
  defect** — the era is declared, and a day missing `layout_era` is `UNKNOWN_ERA` and
  refused, not assumed to be era 1.

The flat Friday 2026-08-14 tree (`chain/snap-*.json`, no symbol level) remains its own
prior shape and is likewise not rewritten.

---

## 8. Read API impact — the safety property that must be replaced

Archive Read API v0.8 §2 states the design rests on the ruling this spec reverses:

> The date determines the expiration. Because the archive is 0DTE only (§1), a past day
> holds exactly one book per symbol and there is nothing to select between… A client that
> asserts nothing cannot construct a wrong book at all, **which is the stronger position —
> the failure mode is designed out rather than caught.**

**Multi-DTE removes that property.** Once a folder holds several books, a client that
asserts nothing must be handed something, and a wrong answer becomes available where none
existed. That is a genuine regression in safety and it is repaid explicitly, not absorbed:

| Day's era | `expiration` parameter | Behaviour |
|---|---|---|
| **1** (one book) | optional assertion | Unchanged. `WRONG BOOK` on mismatch |
| **2** (many books) | **required** on index and fetch | Absent → **`EXPIRATION_REQUIRED`** (400). Never a default, never "the nearest", never 0DTE-because-that-is-what-it-used-to-be |

**Coverage is the discovery call.** It lists every book for `(day, symbol)` with its
expiration, DTE, cadence tier, band width and snap count, so a client can choose before it
fetches. The client never has to guess, and cannot silently be given the wrong book.

This reverses v0.8's required→optional change **for era-2 days only**. v0.4 required the
parameter and was right for a world with several books; v0.8 relaxed it correctly for a
world with one. Both remain correct for their era, which is why the era is declared on the
day rather than configured globally.

**Read API becomes v0.9.** Coverage, index, fetch, cadence and stats all change shape.
That spec is versioned in the same body of work as this one (Invariant 6, documentation
parity) — not "later."

---

## 9. Out of scope

- Widening the **member-facing** replay download (§6). Separate program, separate argument.
- Backfilling era-1 days. Historical multi-DTE data does not exist and is not recoverable.
- Changing the 0DTE cadence, band sigma, or ratchet semantics for T0.
- A second σ_T, a second realized-move estimator, or any parallel volatility quantity
  (E36 discipline; India blocks).
- Any Quant study. Sheldon's program is specified separately and **must not** begin on
  era-2 data until enough era-2 sessions exist to hold out a fold (§10, OD-4).
- Changing what Time Machine fetches by default.

---

## 10. Open decisions

| # | Question | Owner | Default if silent |
|---|---|---|---|
| **OD-1** | `MAX_DTE` = **5** (Campaign range), or the full listed set the scanner already sees (45 days / 16 expirations)? | **Coach** | **5.** Matches the stated product range; the scanner's reach is not an argument for storing it |
| **OD-2** | Real storage and API-draw measurement for one full session at the proposed tiers, before stamping | **Foxtrot** | **Blocking.** §5's estimate is arithmetic, not evidence |
| **OD-3** | Cadence tier boundaries and values (15 s / 60 s) | **Coach · Hotel** | Starting constants, not findings. Fit once a week of era-2 data exists |
| **OD-4** | Does the analysis program wait for a minimum era-2 sample before opening? | **Coach · Sheldon** | **Yes.** Structure search at N≈15 sessions is the multiplicity trap Sheldon's invariant 4 forbids |
| **OD-5** | Symbols: does multi-DTE apply to every symbol in `LABS_SSR_SYMBOLS`, or SPX/SPY first? | **Coach** | **SPX/SPY first**, widen after OD-2 |

---

## 11. Acceptance

| AT | Criterion |
|---|---|
| **AT-MEXP-1** | `capture_expirations` returns only **listed** dates within `[0, MAX_DTE]`. A date Massive does not list is never captured. Grep: no weekday-arithmetic expiration derivation. |
| **AT-MEXP-2** | `LABS_SSR_MAX_DTE` absent or non-integer → **module load aborts naming the key**. No silent default. |
| **AT-MEXP-3** | On a day where spot moves beyond the 0DTE band but not the 5DTE band, the books show **different** strike coverage. Identical coverage across DTE is a **fail**. |
| **AT-MEXP-4** | Each book's ratchet is independent: forcing a 0DTE narrow day does not narrow the 3DTE book. |
| **AT-MEXP-5** | T0 cadence is unchanged and measured — a full era-2 session's 0DTE snap count is within tolerance of an era-1 session's. **Time Machine does not regress.** |
| **AT-MEXP-6** | `PROVENANCE.json` carries `layout_era` and `capture_max_dte`; `COUNTS.json` carries a per-book `books` array. |
| **AT-MEXP-7** | A day with no `layout_era` is **`UNKNOWN_ERA`** and refused by index/fetch — never assumed era 1. |
| **AT-MEXP-8** | Era-2 index/fetch **without** `expiration` → **`EXPIRATION_REQUIRED`** (400). Era-1 unchanged (optional assertion, `WRONG BOOK` on mismatch). |
| **AT-MEXP-9** | Coverage lists every book for `(day, symbol)` with expiration, DTE, tier, band and snap count. |
| **AT-MEXP-10** | Era-1 days are byte-identical after this change ships. Nothing rewrites history. |
| **AT-MEXP-11** | **Source grep:** one σ_T implementation. No second volatility estimator introduced by this program (E36). |
| **AT-MEXP-12** | A `NOT_LISTED` book is named as such and never substituted with the nearest expiration. |
| **AT-MEXP-13** | The Batman entry named in Strategy Lab Method v0.2.2 §1a — next expiration at ~15:45 ET — resolves to a real captured book on an era-2 Friday. **This is the test that has had no chain since August.** |

---

## 12. Changelog

| Ver | Date | Notes |
|---|---|---|
| **v0.1** | 2026-09-05 | First draft. Reverses the 0DTE-only capture ruling (Coach, 2026-08-26) on Coach's instruction, preserving its delivery reasoning by separating capture from delivery (§6). Adds per-expiration DTE-dependent bands (§4), cadence tiers protecting T0 (§5), the era-versioned layout (§7), and the replacement for the Read API safety property multi-DTE removes (§8). Names the urgency: the corpus is forward-only, and a named test has had no chain since August (§1). |
