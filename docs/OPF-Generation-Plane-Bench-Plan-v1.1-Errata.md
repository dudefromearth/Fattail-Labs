# Bench Plan v1.1 — Errata (for the W0-0 stamp)

**Status:** **ERRATA** to plan v1.1. **One plan change, one spec erratum, one new fail-closed line.**
Stamp **v1.1 + this errata**, the way India signed **spec v0.2 + v0.2.1**.
**Date:** 2026-09-01
**Raised by:** the reviewer's *"one leftover"* — P1b before P2-0 and listed topics.

**Summary:** the leftover is real. Reading `chain_feed.py` shows the mechanism is **not** the one
described, and the root cause is **a defect in the spec (GP21a), not in the plan.** The fix removes
the trap rather than managing it with env discipline.

---

## 1. What the feed actually does

`server/market_data/chain_feed.py`, `tick()`:

```python
parsed = parse_ladder_topic(topic)
if parsed is None:
    print(f"skip unparseable topic {topic}", flush=True)
    continue
wings = parsed.wings
...
write_key = (
    f"mb:ladder:{parsed.chain_underlier}:{exp}:w{wings}:dual"   # ← inline, not bus_ladder_key()
    if parsed.dual else topic
)
```

**Two findings:**

| | |
|---|---|
| **A** | **The feed builds ladder keys with an inline f-string**, not `bus_ladder_key()`. There are already **two** key constructors in the tree |
| **B** | That f-string **hardcodes `w{wings}`**. A parsed listed topic carries `wings: None` (GP18a), so post-P2-0 it would produce **`mb:ladder:I:SPX:2026-09-01:wNone:dual`** and pass `wings=None` into `_fetch_ladder_uncached` |

**So the risk window is not where it was described.**

| Phase | Listed interest topic reaches the feed | Result |
|---|---|---|
| **Before P2-0** | parser returns `None` | `skip unparseable topic` — **harmless no-op**, as the reviewer said |
| **P2-0 → P4** | parser succeeds, `wings=None` | **`wNone` key written and published, or a fetch failure.** This is the dangerous window, and it opens *because* P2-0 succeeded |

The reviewer's remedy — *env discipline: listed pairs wait for P4* — is correct and would hold. But
it depends on nobody setting a variable during precisely the window when the parser has just started
understanding listed topics.

---

## 2. Root cause — **spec GP21(a) is wrong**

Spec §6 **GP21** says the plane heartbeats interest for:

> **(a)** each enumerated listed pair, and **(b)** any wings topic declared always-on.

**(a) is a defect.** Interest exists so **`chain_feed` pulls**. `chain_feed` produces **wings** books
— `_fetch_ladder_uncached` with a wings clamp. It has no listed path and, per **GP18**, never needs
one:

> **GP18** — the listed writer writes Redis, on its own key, through the same path.
> **Listed writer → `set_json` → `mb:pub` → hydrator.**

**The listed writer pulls Massive itself and writes its own key. It does not depend on the feed, and
therefore does not need interest.** Holding interest for a "listed pair" does not produce a listed
book; it asks the feed for a **wings** book under a key the feed cannot spell.

**Erratum — GP21 replaced:**

> **GP21** — the plane holds standing interest **for wings topics only**
> (`LABS_OPF_PLANE_WINGS_TOPICS`), so `chain_feed` does not idle. **Listed pairs are not registered
> as interest.** The listed writer (**GP16–GP20**) pulls on its own cadence (**OD-GP4**) and writes
> its own key; interest is the feed's input, and the feed produces wings.

**This removes the trap in code rather than managing it in config.** There is no window in which a
listed topic can reach `chain_feed`, because nothing ever registers one.

---

## 3. Plan changes

### E1 — `plane_interest.py` is wings-only

| | |
|---|---|
| **`P1b-1-alpha-interest.md`** | Heartbeat reads **`LABS_OPF_PLANE_WINGS_TOPICS` only**. **It does not read `LABS_OPF_LISTED_PAIRS` and does not construct a listed topic.** `LISTED_PAIRS` belongs to the listed writer (P4) |
| **P4** | Gains **no** interest work. The writer pulls and writes; it registers nothing |
| **Spec §9 config table** | `LABS_OPF_PLANE_WINGS_TOPICS` moves from *"Plane interest"* covering both, to plane interest covering wings; `LABS_OPF_LISTED_PAIRS` stays with the listed writer alone — **which is already how E1 of the v0.2.1 errata split the boot gates.** The two are now consistent |

**A code constraint, not an env default.** The reviewer's env-discipline line is kept as
belt-and-braces (§5), but it is no longer load-bearing.

### E2 — P1b-G is unachievable on the default config, and must say so

`LABS_OPF_PLANE_WINGS_TOPICS` **defaults empty** (v0.2.1 errata E3). With it empty the heartbeat
correctly no-ops — and **P1b-G's exit is *"`mb:ladder:*` key AND an `mb:pub` message with no member
watching"*, which nothing can then produce.**

**P1b-G amended:**

> **Precondition:** **at least one wings topic is configured** on the named host. With
> `PLANE_WINGS_TOPICS` empty the heartbeat is a correct no-op and there is nothing to observe —
> that is a **configuration gap, not a P1b failure**, and Delta records it as `BLOCKED`, not `FAIL`.

This is the same distinction the spec draws at §9.3 between `not_configured` and `misconfigured`,
applied to a gate.

### E3 — one new fail-closed line

Add to plan §10:

> - **Constructing a ladder topic string outside `keys.py`.** `chain_feed.py:tick` already does
>   this (`f"mb:ladder:{ul}:{exp}:w{wings}:dual"`). **New code uses `bus_ladder_key()`.** The
>   existing inline f-string is recorded, out of scope for this program, and is the reason a listed
>   topic must never reach the feed (§2)

---

## 4. Recorded, deliberately not fixed here

**`chain_feed.py`'s inline key construction is a second source of truth** and is **not in the §8
allowlist**. It stays that way:

| | |
|---|---|
| It is **correct today** — the feed only ever serves wings topics, and `w{wings}` is right for those |
| With **GP21 corrected**, no listed topic can reach it, so the `wNone` path is unreachable |
| Bringing `chain_feed.py` into the allowlist to refactor a working inline string would widen a DL-539 allowlist for **no behaviour change** |
| **Recorded for Lima** as a known divergence, alongside the Arch 30 list, so a future program that *does* want the feed to serve a second book knows the f-string is there |

---

## 5. The three ticks — unchanged, plus one line

1. **OD-GP3: StudioTwo** — Redis already answers `PONG`; MiniTwo stays `not_configured`
2. **AT-GP22: plan default** — keys in P2-0, P4 regression only
3. **DL-539 OK 1, then 2, then 3.** P1a may run after W0-G without them. **P2-0 may not**

**Env discipline line for W0-0** *(belt-and-braces behind E1)*:

> **P1b ships with `LABS_OPF_LISTED_PAIRS` unset and the listed writer disabled.** Per **E1**
> `plane_interest.py` does not read that variable, so setting it early is inert rather than
> dangerous — but leaving it unset keeps the config honest about what is running.

---

## 6. Disposition

| # | Item | Disposition |
|---|---|---|
| Reviewer's leftover | P1b before P2-0, listed topics | **Accepted, mechanism corrected.** Risk window is **P2-0 → P4**, not before P2-0. Root cause is **GP21(a)**, a spec defect |
| **GP21 erratum** | Plane interest is **wings-only**; listed pairs need no interest | **Spec erratum** — Lima records with the GP18a erratum in P0 |
| **E1** | `plane_interest.py` wings-only, in code | **Plan change**, `P1b-1` seed |
| **E2** | P1b-G precondition; empty config is `BLOCKED`, not `FAIL` | **Plan change**, P1b-G |
| **E3** | No ladder topic built outside `keys.py` (new code) | **Plan change**, §10 |
| **§4** | `chain_feed.py` inline f-string | **Recorded, not fixed.** Correct today; unreachable once GP21 is corrected |

**Nothing else in v1.1 changes.** DAG shape, seating, isolation, gates, AT map and the ten applied
findings all stand.

---

## 7. Document control

| Version | Date | Notes |
|---|---|---|
| **v1.1-E1** | 2026-09-01 | Errata to plan v1.1. Traces the reviewer's leftover to **spec GP21(a)** — plane interest is the *feed's* input and the feed produces wings, so listed pairs must never be registered as interest. **E1** wings-only heartbeat in code · **E2** P1b-G precondition, empty config is `BLOCKED` not `FAIL` · **E3** no ladder topic constructed outside `keys.py`. Records `chain_feed.py`'s inline key builder as a known divergence, correct today and left alone |

**One line:**
**Interest is what the feed eats, and the feed makes wings — so the listed book is never asked for
that way, and the trap closes in code instead of in an environment variable.**