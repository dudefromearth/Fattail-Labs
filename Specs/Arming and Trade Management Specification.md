# Arming and Trade Management Specification

**Scope:** the state machine from armed setup through to exit, and the GEX-guided
profit-retention layer that replaces the fixed trail schedule.
**Output stance:** advisory. A visible line to be judged and overridden, never an
automatic exit.

---

## Part I — Arming and entry

### 1. States

| State | Who acts | What is happening |
|---|---|---|
| **Armed** | Trader (discretionary) | Setup identified, algo switched on, no position |
| **In trade** | Algo (mechanical) | Trigger fired, position on, below the management gate |
| **Managing** | Trail + GEX | Open profit ≈75% of risk or better |

Arming is discretionary. Entry is mechanical. Management is a third state with
its own gate.

### 2. Arming

The trader identifies the structural level from volume profile, watches price
pull back into it, and — when it appears to bounce — arms the algo.

### 3. Trigger

The algo enters when the bounce off the structural level confirms and price heads
toward the fly.

> **Open item.** The trigger condition is deliberately left as "the bounce
> confirming" until enough live observations exist to name it precisely. It
> should be specified from observed entries, not from theory.

### 4. There are no stops

The trader is never in the trade to stop out. Loss is bounded by the debit. This
matters for what follows — "rearm" does not mean retry after a stop.

### 5. Rearming

Rearming covers one specific case: **an armed setup never triggers, and price
continues past the original entry level toward the next structural level.**

Example, call fly: price pulls back to a structural level, appears to bounce, the
trader arms, the trigger never fires, price continues past and keeps going. The
trader may rearm against a lower structural level.

### 6. Repositioning on rearm

The fly is **repositioned, not reused.** Distance does not improve the position —
past a point the far out-of-the-money longs become worthless and the butterfly
stops making sense.

**Rearm check:** price the fly at the new level. If the debit is not within 5 to
10 percent of the width, re-strike it to a level where real convexity exists.

**Width does not change on rearm** — the volatility regime has not changed.

> **Tool requirement.** Flag when an armed fly has gone stale and needs
> re-striking. This is a hard, checkable constraint.

---

## Part II — Management

### 7. Activation gate

Profit management does not begin until the position is at roughly **75 percent
profit over risk taken.** Below that: no line, no alerts, nothing displayed.

### 8. What GEX is and is not

GEX is **not** an entry filter. For entry it is largely useless, particularly on
a 0DTE trade held more than a few hours. Entry is trend plus structural level
from volume profile.

GEX is a **management instrument.** It decides hold-or-fold once already in the
trade. Volume profile supplies the static map; GEX supplies the live weather.

GEX cuts both ways:

- Positive dealer gamma around the position means price is being held — reason to
  widen, and potentially to override the trail stop
- Below the flip, moves feed themselves — reason to tighten
- A heavy positive-gamma strike at the center is a real wall worth patience
- Nothing but air in the drift direction is reason to tighten hard
- Near the center strike, GEX may justify exiting *ahead* of the trail rather
  than waiting for it

Volume profile can be read the same way for this decision, not only for entry.

### 9. Fold signals

Decaying premium, constricting breakevens, extreme gamma and delta slope. All of
these are only *experienced* near the edges of the trail — which is why the
awareness layer has to exist before the trader gets there.

### 10. The apex is a risk location

Same risk applies at the apex of the profit curve as at the edges: large open
profit, and a small move toward an edge costs a great deal of it. Combined with
the pin behavior in the strategy spec, the apex should be treated as a place to
be alert, not a place to relax.

### 11. Legacy trail — the rule of thumb being replaced

Trail expressed as a percentage of accumulated unrealized gain, diminishing
through the day:

- ~75 percent early morning
- ~40 percent by noon
- ~20 percent by 2pm

Percentages reach the narrower values *earlier* in low volatility.

Current algo implementation is cruder than that: the user sets an entry width and
an end-of-session width (e.g. 75 percent at a 10am entry down to 25 percent at
4pm) and the algo tapers linearly between them.

This schedule is a rule of thumb. It remains as fallback and as beginner
scaffolding, not as the primary read.

---

## Part III — Dynamic trail computation

> **Status: proposed, unvalidated.** The structure below reflects the design
> decisions made; the constants are starting points to be fitted, not results.

### 12. Purpose

An in-trade profit-retention guide that derives the trail from live position risk
rather than from a time schedule, modulated by dealer gamma. It should breathe
through the day rather than only shrink — but eventually shrink.

### 13. Inputs

- Live delta and gamma of the position
- **Rolling realized movement** over a short window, 15 to 30 minutes
- Running high-water mark of open profit
- Net dealer GEX, **normalized against its own recent distribution** — not
  absolute dollars, since scale drifts
- Distance from spot to the nearest heavy gamma strike
- Time remaining in the session

**Expected move is explicitly rejected as an input.** The entire premise of the
strategy is targeting moves that *exceed* expected move, which happens about 20
percent of the time. Realized movement is used instead.

Useful property of that choice: realized movement makes the trail naturally wider
in the volatile early session and naturally compress into the afternoon. The
breathing behavior comes from the tape rather than from a schedule.

### 14. Core computation

```
move_unit       = rolling realized movement over the 15–30 min window

profit_at_risk  = delta × move_unit + ½ × gamma × move_unit²

trail_level     = high_water_profit − k × profit_at_risk
```

The gamma term is what makes profit-at-risk explode near the apex. That is the
intended behavior, not a side effect.

**Worked example.** Open gain $1,000, profit_at_risk $300, k = 1.5 → trail level
at $550.

### 15. k modulation

- Base **k = 1.5**
- **Gamma factor:** 0.7 (strongly negative dealer gamma) to 1.3 (strongly positive)
- **Proximity factor:** 0.8 (thin path ahead) to 1.2 (heavy strike near the center)
- **Clamp** the product to [1.0, 2.5]

> **Open item.** Whether k is a constant or a function of regime is unresolved.
> Test both.

### 16. Floors

Retain the end-of-session anchor from the legacy schedule as a hard floor, so the
computed trail cannot stay wide into the close.

### 17. Display

Show the computed line **and** the legacy linear-taper line together. Newer
traders watch them diverge and learn from the gap. This is the teaching mechanism,
not just a debugging view.

---

## Part IV — Batman-specific handling

### 18. Both sides, same logic

Hold-or-fold applies to each side independently. You do not always get to visit
both sides; the logic is unchanged either way. The trail is live on whichever
side price is actually working.

### 19. Free-wing conversion

When price is working one side, the other side is virtually worthless. It often
makes sense to **buy back the center (short) strikes of the further-out fly** —
typically when they are under about ten cents, sometimes five.

The result is free wings in case price swings all the way back.

> **Tool requirement.** Alert when the far-side shorts drop under the 5–10 cent
> threshold. It is a small side-condition that only fires on Batman days, which
> makes it easy to miss in the heat of the session.

---

## Part V — Validation

### 20. Backtest criteria

1. Across volatility regimes — low, mid, high — separately, not pooled
2. Across the full outcome distribution
3. **Primary criterion:** whether the computed line would have folded trades bound
   for the top return band. Those are 2.5 to 5 percent of trades and carry a
   disproportionate share of the return. A line that improves average retention
   while cutting off the tail is a worse line.
4. Compare against the legacy linear taper on the same trades
5. Fit k — constant versus regime-dependent

### 21. Open items

- Name the entry trigger precisely from observed entries
- Determine whether k is constant or regime-dependent
- Incorporate findings from the six-vendor GEX tool comparison