# LIM0-4 — Tango copy lock (Heatmap LIM)

**Agent:** Tango  
**Seed:** `agents/p-options-lab-heatmap-lim/seeds/LIM0-4-tango-vocab.md`  
**Spec:** Heatmap LIM Template **v0.4.2 DRAFT** — Appendix B is contractual (LIM27).  
**Feeds:** LIM0-G · LIM3-2 · AT-LIM18 · AT-LIM22 · AT-LIM23  
**Out of scope:** code · forecast copy · vendor product names as product copy · GO token

This packet **quotes** Spec Appendix B. It does not rewrite it. Echo still owns the picker label (OD-LIM2). Charlie interpolates values at LIM3-2. Tango does not stamp `agents/go/OLLIM-W0.md`.

### Verdict: **APPROVED** (copy lock for LIM0-4)

Appendix B strings, the `{oiAsOf}` hole sentence, Compact density, the AT-LIM23 grep list, the crossing-price rule, and the placeholder name are locked here. No invariant violation in the quoted chrome. Final name remains Echo’s (LIM35). Help + member guide remain JR6 / LIM6.

---

## 1. Four standing chrome lines — verbatim Appendix B (LIM27)

Quoted from Spec v0.4.2 **Appendix B — chrome, verbatim (LIM27)**. Do not paraphrase in UI, tests, or help.

1. `Chain GEX (estimate). Dealer sign is assumed, not observed.`
2. `Window read — mass outside the wings is not counted.`
3. `Open interest as of {oiAsOf}. Today's trading is not in it.`
4. `The near-spot mix is a blend of measured factors. Whether it resists price movement is unmeasured.`

Plus the **state line** (facts, not a fifth standing sentence): expiration, wing count, `crossingCount`.

Tango does not mint a state-line sentence. Charlie interpolates the three facts. The state line is not a place to print a crossing **price**.

---

## 2. `{oiAsOf}` null — named hole (AT-LIM22 · E6 · JR3)

`{oiAsOf}` is `LimResult.oiAsOf`.

When it is a date, line 3 is Appendix B line 3 as written.

When it is `null`, line 3 renders **exactly**:

`Open interest as-of date unavailable. Today's trading is not in it.`

Rules:

- Line 3 is **never omitted**.
- Line 3 is **never silently dated to today**.
- Never print `captured_at` / `asOf` as if it were OI settlement (**JR3**).
- The same-day-expiry sentence is the second clause of line 3, dated **and** hole: `Today's trading is not in it.` (**E6**). On a same-day expiry the structure shown is last night’s book. Compact still shows this line.

---

## 3. Compact vs comfort (LIM31 · E11)

| Surface | Standing lines | State facts | Not in chrome |
|---------|----------------|-------------|---------------|
| **Comfort** | **1, 2, 3, 4** | expiration, wing count, `crossingCount` | a crossing **price**; a midpoint |
| **Compact** | **1 and 3 only** | expiration, wing count | lines 2 and 4; trail; annotations; numeric chip; readout; `crossingCount` |

Compact keeps the proximity **ring** (geometry — Echo). Compact does **not** drop line 3: a 0DTE member on the small surface still gets OI T+1 or the named hole.

---

## 4. AT-LIM18 — no single crossing price when `crossingCount ≠ 1`

**LIM14 / AT-LIM18:** chrome never prints a single crossing price when `crossingCount ≠ 1`.

| `crossingCount` | Chrome may print | Chrome must not print |
|-----------------|------------------|------------------------|
| `0` | the count | any strike or invented price |
| `1` | the count; if a crossing is shown at all, the **interval** `{ lo, hi }` (annotations, default off) | a single price; `(lo+hi)/2` (**AT-LIM20**) |
| `> 1` | the count | **any** single crossing price; a chosen “the” flip; a midpoint |

Crossings are intervals. Chrome does not invent a strike. Interval ticks live behind `LIM_SHOW_ANNOTATIONS` (LIM30), default off — not in standing chrome.

---

## 5. AT-LIM23 — grep list (exact strings)

Grep **every output string, field name, and picker label**. None of these substrings ship (E4 · E7 · LIM35). Word-boundary grep is the intended scan (`lim.vocab.test.ts` at LIM3-2 / LIM5).

```
wall
magnet
pin
gravity
intent
hostile
support
resistance
friction
muddy
slippery
```

**Apply to:**

| Surface | What is scanned |
|---------|-----------------|
| Output strings | Appendix B lines as rendered; state line; chips; tooltips; help that LIM6 will write; annotation labels if ever on |
| Field names | `LimResult` keys and any UI binding names |
| Picker label | template `label` **and** `valueModes[].label` |

This file and the Spec **contain** the banned words as the scan list and as held skins. AT-LIM23 greps **shipped copy sources**, not this packet and not the Spec (LIM5-0).

### 5.1 Field names that ship (E4 · E2)

| Ship | Do not ship |
|------|-------------|
| `nearSpotMix` | `friction` |
| `crossingProximity` | `confidence` |
| `centrePts` | any `*gravity*` name |
| `lean`, `netRatio`, `concF`, `magF` | `intent`, `hostile`, axis skins |

Spec prose says “centre of gravity” for the `centrePts` hairline (LIM30). That phrase **must not** become a member-facing label — `gravity` is on this list.

Axis poles stay in the book’s terms (LIM11). *Friction / muddy / slippery* stay off the axis until a tape sitting (§15.3 · OD-LIM3). Quadrant ships **no cell names** in v1 (LIM36): not *Pin*, *Air-Pocket*, *Downside Acceleration*.

### 5.2 Picker label (LIM35 · E7 · OD-LIM2)

Placeholder until Echo stamps a final name:

- Template `label`: `GEX lean (window)`
- Value-mode `label`: `Lean / near-spot mix`
- Code `id`: `lim` — not member-facing

**Do not ship `Liquidity-Intent`.** Nothing in the input is intent. Neither *intent* nor *friction* in the picker.

---

## 6. Do not ship — forecast, retired name, vendor products

**LIM1.** LIM forecasts nothing and asserts no relationship between the book and the tape. Line 4 already says the mix-vs-tape claim is unmeasured. Do not add a second sentence that takes it back.

Do not write: forecast, predict, will pin, gravitates, likely to stall / hold / reverse, magnetize, tends to pin, directional signal, the book will, expect price to.

**Retired source name.** `Liquidity-Intent` / `Liquidity-Intent-Map` is the MSC source contract, reference only. Not a picker label, not chrome, not a heading.

**Vendor product names** (IKI GEX vocab note — positioning input, **no law**, not product copy). Do not ship, among others: TRACE, HIRO, Call Wall, Put Wall, Gamma Flip, Zero Gamma as a branded level, DealerEdge, Defense Lines, Anchor Point, HVL, King Nodes, GEX Levels, Interval Map, Volatility Trigger, Options Inventory Model, Dealer Gravity, control node, GEX Rating. *Call Wall / Put Wall / Gamma Flip* fail AT-LIM23 on *wall* anyway.

LIM does not convert GEX to dollars, gate orders, or publish a composite score (Spec §13).

---

## 7. Walkthrough — bleeding trader, 0DTE, low trust

Compact is the seat that matters. Two lines:

1. This is an **estimate**; dealer sign is **assumed, not observed**. The industry already sold this person a wall. We do not.
3. Open interest is **as-of a date or named unavailable**, and **today’s trading is not in it**. Same-day expiry is last night’s book. Omitting that sentence is a capacity violation: they would trade a picture of yesterday as if it were now.

Comfort adds the window (mass outside the wings is not counted) and the mix caveat (blend of measured factors; resistance to price is unmeasured). Those are not optional honesty on the large surface. They are density drops on Compact, not a second story.

A crossing **count** is a fact. A crossing **price** when the count is not one is a story. We do not tell it.

---

## 8. Pasteable for LIM3-2 / AT-LIM23

Comfort standing lines, in order:

```
Chain GEX (estimate). Dealer sign is assumed, not observed.
Window read — mass outside the wings is not counted.
Open interest as of {oiAsOf}. Today's trading is not in it.
The near-spot mix is a blend of measured factors. Whether it resists price movement is unmeasured.
```

Hole (replaces line 3 when `oiAsOf == null`):

```
Open interest as-of date unavailable. Today's trading is not in it.
```

Compact standing lines: **first and third of Comfort**, including the hole substitution on line 3.

Forbidden grep (exact list in §5). Extra Tango bans for the same test file: `Liquidity-Intent`, `Liquidity Intent`.

---

## Bench delta

Next Tango (LIM3-2) greps **shipped** chrome, field names, and picker labels against §5 — not this file. Compact must still render line 3 dated **or** the hole sentence; never `captured_at`. Chrome prints `crossingCount`, never a single price when the count is not one, and never `(lo+hi)/2`. Placeholder remains `GEX lean (window)` until Echo stamps OD-LIM2. Do not let LIM30’s “centre of gravity” leak onto the annotation label. JR6 help at LIM6 quotes Appendix B; it does not improve it.
