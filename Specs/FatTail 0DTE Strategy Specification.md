# FatTail 0DTE Strategy Specification

**Scope:** the complete 0DTE strategy, extending from 0DTE to 1DTE.
**Stance:** positioning, not prediction. Convexity hunting.
**Track record:** five years live, Sharpe roughly 5 to 6 across variations.

---

## 1. Premise

Every trade is a defined-risk, far out-of-the-money butterfly bought for a small
debit, positioned so that a move the market is already inclined to make pays
asymmetrically. Nothing in the method predicts direction with precision. The edge
is in where the position sits relative to structure, and in how much of an
unrealized gain gets retained.

Convexity will almost always give a better payoff curve. The strategy is built
around finding it, paying as little as possible for it, and not surrendering it
prematurely.

---

## 2. Pre-market decisions

All four are made before the open. The intraday tooling confirms them; it does
not make them.

### 2.1 Volatility regime selects the structure

| Regime | Variation | Structure |
|---|---|---|
| Very low vol | **Time Warp** | 1DTE, Batman — positions both above and below the market, entered the day before |
| Low / mid / high | **Classic Out of the Money Butterfly** | 0DTE, single directional fly. The workhorse |
| Very high vol | **Batman** | 0DTE, two-sided |

The Batman appears at both extremes for opposite reasons: in very low vol it buys
time when there is not enough movement; in very high vol it covers both
directions when there is too much.

### 2.2 Trend selects direction

From the daily chart. Trend up means long calls, trend down means long puts.

### 2.3 Regime selects wing width

Narrow flies in low volatility, wider flies in high volatility.

### 2.4 Volume profile supplies the structural level

The entry level is structural, not predictive. Wait for it.

---

## 3. Strike selection

Its own discipline, not a footnote under entry.

**Convexity band.** The debit should be 5 to 10 percent of the width of the fly.
That is what produces the working risk-to-reward range of roughly 1-to-18 through
1-to-9. Outside that band the trade is not a butterfly worth having — at 1-to-30
the far out-of-the-money longs are effectively worthless and the structure stops
making sense.

**Shop the adjacent strikes.** Strikes inside the band are not equally priced.
Going one strike further out can cut the debit by around 30 percent for a
near-equivalent payout curve. Take the comparison, not the first strike that fits.

**Regime determines how much shopping there is to do.** Low volatility may offer
only two candidate strikes inside the band. High volatility may offer eight or
nine. Strike selection therefore matters most in exactly the regime that also
calls for the most patience in management.

---

## 4. Entry

Trade with the trend. Wait for a pullback (or pull-up) into the structural level.
Enter in the direction of the trend at extreme risk-to-reward.

The mechanics of arming, triggering, and rearming are specified separately — see
the arming and management spec.

---

## 5. Return and outcome profile

**Return on risk by where price finishes relative to the profit tent:**

- Minimum return: 25 to 50 percent
- Outside the profit tent: commonly 100 to 250 percent
- Near the profit tent: 250 to 450 percent
- Inside the profit tent: 450 percent up to as much as 1500 percent

**Outcome distribution:**

- About 50 percent of trades go to a 100 percent loss — the market moves the
  other way
- Of the surviving half, roughly three quarters land in the band up to 250 percent
- Roughly one quarter reach the medium-to-upper range
- About 2.5 to 5 percent land in the highest range

**The consequence that drives everything downstream:** the rarest outcomes carry
a disproportionate share of the return, and they are too rare to learn from
experience alone. Folding early on a trade bound for the top band is the most
expensive available error. It is also the one a trader will almost never
encounter often enough to develop a feel for. This is the primary criterion for
validating any management rule.

---

## 6. Pin behavior

Price touches the center strike quite often. A pin is not a pin until the end of
the day, and it is rare to actually finish near the pin. Apex paper profit is
therefore large while the probability it holds is low until late in the session.
The apex is a risk location, not a destination.

---

## 7. How volatility regime shapes the curve

- **Low volatility.** Advanced premium decay produces much greater delta and
  gamma. The profit curve is tip-toppy, bulbous, very steep.
- **High volatility.** The profit curve is very flat through the early part of
  the day.

Stance follows from this: **more opportunistic in low-volatility regimes, more
patient in high-volatility regimes.** It also means any fixed-percentage giveback
rule is misleading — the same 20 percent means very different things on a flat
curve than on a bulbous one.

---

## 8. Teaching progression

New traders are taught to be much more opportunistic regardless of regime.
Practice *taking* profit before learning to hold it. Letting a profitable trade
run all the way to a full loss is a double whammy, and it is the habit worth
breaking first.

The mechanical trail schedule exists for traders who do not yet have the
proclivity or experience for the nuanced approach. Rule first, nuance earned
later.

---

## 9. The full arc

1. Regime picks the structure — Time Warp, Classic, or Batman
2. Daily chart picks direction; regime picks width
3. Volume profile picks the level
4. Convexity picks the strike
5. GEX and the trail decide how long it is held