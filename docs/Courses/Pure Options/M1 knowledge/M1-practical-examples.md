# Practical Examples — See It

*Pure Options · Module 1*

Three worked examples. Nothing to build yet — Module 1 was about reading, so these are
reading exercises done in full, with the numbers shown.

**A note on the numbers.** These use a fictional index, MKT, trading at 5,000. Round figures,
no real chain, nothing to look up or copy. That's deliberate: real prices go stale, and a real
strike on a real underlying invites someone to go and trade it. The skill here transfers; the
numbers don't need to be authentic to teach it.

Work each one before reading the answer. The reading is worth much less than the attempt.

---

## Example A — Splitting a price

MKT is at 5,000. Here are four call options, all expiring in five days.

| Strike | Price |
|---|---|
| 4,950 | 62.00 |
| 5,000 | 28.00 |
| 5,050 | 9.50 |
| 5,100 | 2.75 |

**Split each price into intrinsic and extrinsic.**

Try it before continuing.

> **[IMAGE — supporting]**
> **Shows:** The four prices as stacked bars, each split into intrinsic (lower, solid) and extrinsic (upper, lighter). The 4,950 bar has both; the other three are entirely extrinsic.
> **Type:** Static
> **Note:** Use the same colour for extrinsic as the L2 split-bar image. The visual point is how quickly the intrinsic portion vanishes.

### Working

Intrinsic value for a call is how far spot sits *above* the strike, or zero.

**4,950 strike.** Spot is 50 points above it. Intrinsic = 50. The price is 62, so extrinsic =
12.

**5,000 strike.** Spot is exactly at the strike, not above it. Intrinsic = 0. The whole 28 is
extrinsic.

**5,050 strike.** Spot is below the strike. Intrinsic = 0. All 9.50 is extrinsic.

**5,100 strike.** Same. All 2.75 is extrinsic.

| Strike | Price | Intrinsic | Extrinsic |
|---|---|---|---|
| 4,950 | 62.00 | 50.00 | 12.00 |
| 5,000 | 28.00 | 0 | 28.00 |
| 5,050 | 9.50 | 0 | 9.50 |
| 5,100 | 2.75 | 0 | 2.75 |

### What to notice

**Three of the four are entirely possibility.** Buy any of the last three and you own nothing
real — you've paid for a chance, and if the market sits still for five days you own nothing at
expiration.

**The at-the-money option carries the most extrinsic value.** 28 points, more than double the
in-the-money option's 12. That isn't an accident. At the strike, the outcome is maximally
uncertain, and uncertainty is what extrinsic value prices. Move away from the strike in either
direction and there's less genuinely in doubt, so less to pay for.

**The in-the-money option is mostly real.** 50 of its 62 points would survive expiration today.
It's the only one of the four where most of what you'd pay isn't riding on the clock.

**And the far one is cheap for a specific reason.** 2.75 looks like very little, and it is — but
it's 100% extrinsic on an option 100 points out of the money with five days left. Cheap because
it probably won't happen, not cheap because it's a bargain. Hold onto that distinction; it
reappears in Module 2 as the floor of the price band.

---

## Example B — Reading the gap

Same index. You hold one 5,050 call, five days out, bought at 9.50.

Two days pass. MKT is at 5,000 — exactly where it started. Your option is now priced at 5.80.

**What happened, and how much of what remains is possibility?**

### Working

Nothing happened to price. The underlying is unchanged.

Intrinsic value is still zero — spot is still below the strike. So the entire 5.80 is
extrinsic, exactly as the entire 9.50 was.

Which means the position lost **3.70 points to the passage of time alone.** Two days, no market
movement, and 39% of what you paid is gone.

> **[IMAGE — hero]**
> **Shows:** The two-line risk graph at day 5 and at day 3, overlaid. Expiration line identical in both. Current-value line visibly lower in the second, with the gap at spot marked on each.
> **Type:** Build, 2 states
> **Note:** The unchanged expiration line is the teaching point — one line moved and the other didn't. Same visual language as L3.

### What to notice

**This is the buyer's clock, in numbers.** Lesson 5 described paying rent on a position. That's
3.70 points of rent for two quiet days.

**The expiration line never moved.** On a risk graph, the hard line depends only on price, and
price didn't change. Only the smooth line fell — which is the gap closing, and it's the entire
content of Lesson 3 rendered as two numbers.

**The rate is not constant.** 3.70 over two days is 1.85 a day *on average*, but it wasn't split
evenly. The second day cost more than the first, and the remaining three will cost more still.
The last one will cost the most of all.

**And notice what didn't need to happen for you to lose.** No adverse move. No volatility crush.
No mistake. You were charged for holding.

---

## Example C — The same strike, three terms

MKT at 5,000. The 5,050 call at three expirations, with the gauges:

| Term | Price | Theta | Gamma | Vega |
|---|---|---|---|---|
| 30 days | 42.00 | −0.65 | 0.0018 | 5.40 |
| 5 days | 9.50 | −1.85 | 0.0071 | 2.10 |
| 1 day | 2.40 | −2.20 | 0.0195 | 0.45 |

**Read across the rows. What is each column telling you?**

### Working

**Theta grows.** From −0.65 to −2.20. The daily cost of holding nearly quadruples as the term
shortens. Time isn't just running out — it runs out faster the closer you get.

**Gamma grows, and far more dramatically.** From 0.0018 to 0.0195, more than tenfold. The
position's responsiveness to price is itself changing rapidly. At 30 days it barely reacts; at
1 day it reacts to everything, and how much it reacts is shifting under you while you hold it.

**Vega falls.** From 5.40 to 0.45. And this is the one that catches people.

> **[IMAGE — hero]**
> **Shows:** The three gauges plotted against days remaining. Theta and gamma rising, vega falling — vega in a distinct colour, clearly heading the other way.
> **Type:** Static
> **Note:** Same image as the L4 hero. Produce once, use in both. The falling line must be unmistakable.

### What to notice

**Two of the three sharpened and one didn't.** If your expectation was that everything intensifies
into expiry, this table corrects it. Vega measures sensitivity to a change in expected movement
over the *remaining* life, and with one day left there's almost no remaining life for a change in
expectations to act on.

**Small exposure is not the same as small consequence.** The one-day option barely responds to a
shift in implied volatility. But if volatility spikes because something real happened, price will
move too — and gamma is at 0.0195. The volatility exposure shrank. The volatility *event* is
still coming, and there's no time left to recover from it.

**The price collapse is the same story from a different angle.** 42.00, then 9.50, then 2.40 —
the same right to buy at the same strike, priced at a fraction as the possibility drains out. You
aren't paying for different rights. You're paying for different amounts of remaining chance.

---

## What these three establish

Everything in Module 2 assumes you can do these readings without thinking about them.

You'll split prices into two parts constantly, because the debit you pay for a structure is
almost entirely extrinsic and that's what makes the structure work. You'll read the gap between
two lines, because the gain in this method lives in that gap rather than at expiration. And
you'll read the term off the gauges, because the term is what determines how wide to build.

**One last thing worth taking from Example A**, because it becomes a rule in Lesson 7.

That 5,100 call at 2.75 is very cheap. It's also very unlikely to pay. Those two facts are the
same fact stated twice — the market prices it low *because* it's unlikely, not despite it.

Cheap and worth buying are different properties. Module 2 is largely about telling them apart.

---

*Educational content only. Not financial advice. Options, and especially short-dated options,
involve substantial risk of loss.*

---

## Notes — not part of the lesson

**Fictional underlying, deliberately.** MKT at 5,000 keeps the arithmetic clean, prevents the
examples going stale, and — most importantly — means no member can go and trade the strike used
in the illustration. A real chain in an examples lesson is the most copyable artifact in a
course, which is the failure mode L10 exists to prevent.

**The gauge values are illustrative and directionally correct** — theta and gamma rising into
expiry, vega falling — but they are constructed, not computed from a pricing model. Hotel should
confirm the magnitudes are plausible enough to withstand a member checking them against a real
chain. If precision matters, generate them from an actual model and restate.

**No outcome is shown in any of the three examples.** Nothing here says what a position returned.
Example B shows a loss to decay, which is a mechanical fact about time rather than a performance
figure.
