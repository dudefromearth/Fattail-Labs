# Practical Examples — Build It

*Pure Options · Module 2*

Two worked examples. First you build a structure and total its cost. Then you screen three
candidates and reject two of them.

Same fictional index as Module 1: **MKT, trading at 5,000.** Nothing here is a real chain and
nothing here is a trade. The point is the procedure, not the strikes.

---

## The chain

One set of call prices, used throughout. Five days to expiration.

| Strike | Price |
|---|---|
| 5,020 | 38.00 |
| 5,055 | 21.00 |
| 5,060 | 19.40 |
| 5,090 | 11.00 |
| 5,095 | 10.60 |
| 5,130 | 4.60 |
| 5,150 | 2.90 |
| 5,185 | 1.30 |
| 5,220 | 0.55 |

Two conditions you'll need:

- **VIX is 21.** That puts us in Goldilocks 1, so width lands in the 30–40 range. We'll use 35.
- **The expected move for this term is ±62 points.** So the market's implied range runs roughly
  4,938 to 5,062.

---

## Example A — Build one and total it

Build a 35-wide call butterfly with its body at 5,095.

Wing to centre strike is 35, so the strikes are **5,060 / 5,095 / 5,130**. Buy the lower wing,
sell the body twice, buy the upper wing.

**Work out the debit before reading on.**

> **[IMAGE — hero]**
> **Shows:** The four legs as a ledger — one bought at 5,060, two sold at 5,095, one bought at 5,130 — resolving into the tent, with the three strikes marked.
> **Type:** Build, 2 steps
> **Note:** The ledger and the shape side by side. A member should see the arithmetic produce the picture.

### Working

| Leg | Action | Price | Cash |
|---|---|---|---|
| 5,060 call | Buy 1 | 19.40 | −19.40 |
| 5,095 call | Sell 2 | 10.60 | +21.20 |
| 5,130 call | Buy 1 | 4.60 | −4.60 |
| | | **Net** | **−2.80** |

**Debit: 2.80.** That's the entire risk of the position. Nothing else can be lost, in any
direction, at any speed.

Now the rest of the geometry falls out of that one number:

**Maximum payoff** is the width minus what you paid: 35 − 2.80 = **32.20**, occurring only if
price finishes exactly at 5,095.

**Risk to reward** is 32.20 to 2.80, or about **1 to 11.5**. That's not a projection. It's what's
left of the width after you've paid for it — arithmetic, fixed at entry, true regardless of what
price does next.

**Breakevens** sit at the lower wing plus the debit and the upper wing minus it: 5,062.80 and
5,127.20. Between them the structure is worth more than you paid at expiration. Outside them it
isn't.

### What to notice

**Two of the four legs are the ones doing the work.** The 21.20 collected from the body is what
makes this affordable — buying the 5,060 call alone would cost 19.40 for a position with a
completely different shape. The sold middle is why the debit is 2.80 instead of 19.40.

**Notice the wing you bought at the top.** It cost 4.60 and it caps your risk. Without it, the
two short calls at 5,095 would be naked above 5,130, and Lesson 5's loss line would run off the
frame. That 4.60 is the price of the ceiling.

**Notice how much of every leg is extrinsic.** Spot is 5,000, so all four contracts are out of
the money and carry zero intrinsic value. The entire structure is built from possibility — which
is exactly why it responds to time the way it does.

---

## Example B — Screen three candidates

Same chain, same conditions. Three possible placements at 35 wide. Which qualify?

Recall the gate: **the debit must fall between 5% and 10% of the width.** At 35 wide, that's
between **1.75 and 3.50**.

> **[IMAGE — hero]**
> **Shows:** Price line with spot, the expected move boundaries marked, and the three candidate tents placed along it — one inside the expected move, one at its edge, one far beyond.
> **Type:** Static
> **Note:** Placement relative to the expected move is the point. Do not colour-code pass and fail — the reader should have to work it out.

### Candidate 1 — body at 5,055

Strikes 5,020 / 5,055 / 5,090.

| Leg | Action | Price | Cash |
|---|---|---|---|
| 5,020 | Buy 1 | 38.00 | −38.00 |
| 5,055 | Sell 2 | 21.00 | +42.00 |
| 5,090 | Buy 1 | 11.00 | −11.00 |
| | | **Net** | **−7.00** |

Debit 7.00 on a 35-wide structure is **20% of width**. The ceiling is 10%.

**Rejected.**

*Why it's expensive:* the whole structure sits inside the expected move, right where the crowd
is. Demand is dense there, and dense demand supports price. You're bidding against everyone else
who thinks a move of this size is reasonable.

*What you'd be buying:* the same shape at more than double the acceptable cost. Max payoff drops
to 28.00 and risk-to-reward falls to 1:4 — a materially worse version of the identical structure,
for identical work.

### Candidate 2 — body at 5,185

Strikes 5,150 / 5,185 / 5,220.

| Leg | Action | Price | Cash |
|---|---|---|---|
| 5,150 | Buy 1 | 2.90 | −2.90 |
| 5,185 | Sell 2 | 1.30 | +2.60 |
| 5,220 | Buy 1 | 0.55 | −0.55 |
| | | **Net** | **−0.85** |

Debit 0.85 is **2.4% of width**. The floor is 5%.

**Rejected.**

And this is the one people argue with. The risk-to-reward here is about 1:40 — far better than
anything else on the board. It looks like the best trade available.

*Why it's cheap:* the body sits nearly 200 points above spot, when the market's implied range for
this term is 62 points. It's cheap because price almost never gets there, and the market has
priced it accordingly.

*What you'd be buying:* a lottery ticket with an attractive ratio. This is the exact trap the
floor exists to catch, and it's the reason price is the last gate rather than the first. A screen
that ranked by cheapness would return this one every single time.

### Candidate 3 — body at 5,095

Strikes 5,060 / 5,095 / 5,130. The structure from Example A.

Debit 2.80 is **8% of width**. Inside the band.

**Accepted.**

*Why the placement works:* the lower wing sits just past the expected move boundary at 5,062.
Inside that line is where the crowd is. Past it, the marginal buyer thins out and price is
increasingly set by sellers — which is why the same structure is affordable here and wasn't a
hundred points lower.

Not far enough out to be a lottery ticket. Not close enough in to be paying the crowd's price.

### The result

Three candidates, one qualifies. **That ratio is normal.** On many days none qualify, and the
correct action is to do nothing at all.

If you find yourself running this screen and passing most of what you look at, something is
wrong with how you're applying it — the band is a gate, not a guideline.

---

## Two things worth extracting

**The order is load-bearing, and Candidate 2 shows why.**

Screen by price first and Candidate 2 wins outright. Best ratio, lowest cost, most attractive
numbers on the page. Every heuristic that isn't the full procedure selects it.

Width comes from conditions. Placement comes from where the crowd stops. Price confirms that a
structure you already had reason to want is available at a cost worth paying. Reverse that and
you systematically buy the thing furthest from happening.

**The rejections carry more information than the acceptance.**

Candidate 1 taught you what paying the crowd's price looks like. Candidate 2 taught you what a
false bargain looks like. Candidate 3 taught you one placement, on one day, under one set of
conditions — which will never recur in exactly that form.

The two you rejected transfer. The one you accepted doesn't.

---

## Your drill

Open a real chain. Check the VIX, note the region, and pick a width from within its band.

Now build three candidates at that width: one placed inside the expected move, one placed well
beyond it, one placed around its boundary. Price all four legs of each and calculate the debit as
a percentage of width.

Write down which pass and which fail.

Then do it again tomorrow, on the same underlying. Notice whether the same *placement* still
qualifies — and whether the width you'd choose has changed.

Do not trade any of them.

---

*Educational content only. Not financial advice. Options, and especially short-dated options,
involve substantial risk of loss.*

---

## Notes — not part of the lesson

**Copyability was the main design constraint.** A worked example is the most copyable artifact in
a course that spends ten lessons arguing against copying. Three defences are in place: the
underlying is fictional, two of the three candidates fail, and the closing section states
explicitly that the rejections transfer and the acceptance doesn't.

**The chain is internally consistent** — prices decline monotonically with strike and the decline
is convex, so the three debits are arithmetically coherent with each other. Hotel should confirm
the price levels are plausible for a five-day term at VIX 21, but the relationships between them
hold regardless.

**Candidate 2 is the important one.** It's the only example in the course where the *most
attractive-looking* numbers belong to the rejected trade. That inversion is the whole reason the
floor exists and it needs to survive review intact.

**R:R stated once, as arithmetic.** 1:11.5 appears with an explicit note that it's what remains of
the width after payment — fixed at entry, independent of outcome. It is not attached to any
frequency, timeframe or account anywhere in this lesson.
