# Lesson 7 — Finding one: regime, expected move, price

*Pure Options · Module 2: Build It*

You can build the structure. Now the harder question: which one, and is it worth putting on?

This lesson is a procedure, and it runs in a fixed order for a reason that will become obvious
by the end. Three steps. Width, placement, price.

### First, the thing that makes this work at all

You don't set the price. The chain does.

What a structure costs falls out of where the strikes sit, how much time remains, and what
volatility is doing. You can't negotiate it and you can't decide it. All you can do is look at
what the market has already priced and judge whether it's worth taking.

That single fact changes the job from *deciding what to trade* to **screening what's on
offer** — and it means the most common outcome of running this procedure is finding nothing
worth doing. That's not the procedure failing. A screen that never rejects anything isn't a
screen.

### Step one — width, from the volatility spectrum

How wide should the structure be? Wider when volatility is higher, narrower when it's lower.

That's the rule, and it really is the whole rule: **width scales with volatility,
continuously.** The market is moving more, so the structure that makes sense is bigger.

We use four names for regions of that spectrum, so it's possible to talk about where we are:

| Region | VIX, roughly | Width |
|---|---|---|
| **Zombieland** | below 17 | 20–30 |
| **Goldilocks 1** | 17 – 24.5 | 30–40 |
| **Goldilocks 2** | 24.5 – 32 | 40–50 |
| **Chaos** | above 32 | 50–60 |

> **[IMAGE — hero]**
> **Shows:** A continuous spectrum from low volatility to high, with width increasing along it, and the four region names marked as zones rather than as steps or gates.
> **Type:** Static
> **Note:** Must read as continuous. Any visual with hard steps or boxed thresholds teaches the opposite of this lesson. No dividing lines between regions.

**These are names for regions, not gates.** A market at 16.9 and a market at 17.1 are the same
market. If your structure changed materially across that line, you'd be responding to a number
rather than to conditions.

So don't compute this. Read it. The difference between a 36-wide and a 40-wide structure is
noise next to placement, price, and how you manage it — and a width you calculated is a width
you didn't think about. **You read width off conditions. You don't derive it from them.**

Two things worth noticing about the ends of that spectrum.

It stops at 60. Volatility has no upper limit, but width does, because a wider structure costs
proportionally more — so widening without limit would mean position cost rising without limit
exactly when conditions are worst. In a crisis you don't keep widening.

It stops at 20 as well. Below the narrow end, the adjustment isn't a smaller structure. It's a
smaller book.

**One thing that catches people, and it catches them quietly.** A 60-wide structure at the
same price percentage costs three times what a 20-wide one costs. If you widen with the regime
and keep your position count the same, you've tripled your risk while believing you followed
the method exactly. Width and size are different dials. Moving one is not permission to leave
the other alone.

### Step two — placement, around the expected move

You know where the structure sits on the spectrum. Now: where on the price line?

Around the **expected move** — the range the market's own pricing implies for this term. You
met it in Lesson 4. Most platforms display it directly on the chain.

Why there?

Inside the expected move is where the crowd is. That's the region where a directional bet still
feels reasonable to most buyers, so demand is dense, and dense demand supports price.

At the boundary, that demand thins out. Past it, the marginal buyer disappears, and what's left
is increasingly a seller's price — structures priced by people writing what the crowd no longer
wants to own. That's where the crowd parts and the professionals take over the supply.

> **[IMAGE — hero]**
> **Shows:** A price line with spot at the centre and the expected move marked either side. Buyer demand dense inside, thinning at the boundary, sparse beyond. The tent placed around that boundary.
> **Type:** Static
> **Note:** This image has to carry the whole placement argument. The density gradient is the idea — not the tent's position.

The expected move is also **visible**. Everyone looking at that chain sees the same line, which
makes it more than a statistical boundary. It's a place where behaviour changes, because people
can see it and act around it.

Adjust from there — directional bias, a structural level you care about. But the expected move
is the landmark you're adjusting *from*.

### Step three — price, and this is where you say no

Now look at what the chain is asking, and compare it to the width.

**Pay between 5% and 10% of the width. Never more than 10%.**

That's the gate. A 40-wide structure should cost between 2 and 4 points. If it costs 5, it
fails. Not "is expensive" — fails. You move on.

Both ends of that band do work.

**The ceiling protects the geometry.** Cost and payoff are two ends of the same relationship:
the less you pay, the more the structure can return relative to what you risked. Pay a tenth of
the width and the geometry can return nine times your risk. That's not a projection — it's what
remains of the width after you've paid for it. Pay more than a tenth and you've bought a
materially worse version of the same shape.

**The floor protects you from a trap.** Structures get cheap for two very different reasons.
Sometimes conditions have discounted the same trade — that's a discount. Sometimes it's cheap
because it sits far enough out that it almost never pays — that's not a discount, that's a
lottery ticket with a good-looking ratio. Below 5%, you're usually looking at the second one.

> **[IMAGE — supporting]**
> **Shows:** Three candidate structures with width, cost, and cost-as-percentage-of-width. One above the band, one below, one inside. Only the third marked as qualifying.
> **Type:** Static table
> **Note:** Two rejections and one pass. The rejections are as instructive as the acceptance — don't show three passes.

### Why the order matters

You may have noticed you could run this backwards — scan the chain for anything priced at 5 to
10% of its width and take what shows up.

Don't. That screen will hand you the furthest-out structures on the board every time, because
distant structures are always cheap relative to their width. You'd be selecting for the exact
trap the floor exists to catch.

Width comes from conditions. Placement comes from where the crowd stops. **Price is the last
gate, never the first** — it confirms that a structure you already had reason to want is
available at a cost worth paying.

### A note on all three numbers

Width is a range. The price band is a range. Placement is *around* a landmark.

None of the three is a value to calculate. All three are judgments made inside constraints, and
that's deliberate — it's what makes this a method rather than a system. The procedure asks
**does this qualify**, not **what is the correct trade**. Nothing here relieves you of
deciding, and if you ever find a version of this that does, be suspicious of it.

### Your drill

Open a chain. Check the VIX and note which region you're in and what width that implies.

Find the expected move for the nearest term. Sketch a structure of your width, placed around
it. Price the four legs and work out the debit as a percentage of the width.

Does it fall between 5 and 10?

Then do it twice more — a different placement, a different term. Write down all three results
and which ones failed.

**Most of them should fail.** If all three passed, check your arithmetic. The rejections are
the skill.

### Next

You can build a structure, find one worth building, and reject the ones that aren't. Module 3
is about what actually happens when you deploy it — starting with the number that surprises
people most, and shouldn't.

---

*Educational content only. Not financial advice. Options, and especially short-dated options,
involve substantial risk of loss.*
