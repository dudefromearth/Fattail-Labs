# Lesson 6 — The butterfly: two spreads and a tent

*Pure Options · Module 2: Build It*

Last lesson ended on a gap. You want time working for you, and you want a floor under the
worst day. No single contract does both.

So you build one.

### Start with what you know

Take two options on the same underlying, same expiration, different strikes. Buy the nearer
one, sell the further one.

That's a vertical spread, and it does something worth noticing: it has a floor *and* a
ceiling. The most you can lose is the difference between what you paid and what you collected.
The most you can make is capped too. Both numbers are knowable before you enter.

> **[IMAGE — supporting]**
> **Shows:** A single long option's payoff, then the same with a short leg added — the open-ended upside flattening into a ceiling, the cost dropping.
> **Type:** Build, 2 steps
> **Note:** Show the debit shrinking as the second leg is added. That reduction is the mechanism.

That's already a constructed position rather than a chosen one. You didn't find that shape on
a chain. You made it.

Now do it again.

### Two spreads, sharing a strike

Take a second vertical, further out, and put it on backwards — sell the nearer strike, buy the
further one. Arrange it so the strike you sold in the second spread is the same strike you
sold in the first.

You now hold four contracts across three strikes: one bought at the bottom, two sold in the
middle, one bought at the top. The middle strike carries a double short because both spreads
sold it.

That's a butterfly. And the shape it makes is a tent — flat and slightly negative across most
of the range, rising steeply to a peak at the middle strike, falling away on the other side.

> **[IMAGE — hero]**
> **Shows:** Three frames. (1) The first vertical. (2) The second vertical added, inverted. (3) The resulting tent, with the three strikes marked and the double short at the centre.
> **Type:** Build, 3 steps
> **Note:** The construction must be visible — a student should be able to see the tent *arriving* from two spreads rather than being presented as a finished object. This is the most important image in the course after the two-line risk graph.

### What you built

Three things are now true, and each one answers something from earlier in the course.

**The sold middle harvests the decay.** Two short contracts sit at the centre of the
structure, and they bleed extrinsic value exactly as Lesson 5 described — with time working
for you rather than against you.

**The bought wings cap the damage.** Whatever the shorts could cost you, the longs on either
side stop it. There is no scenario, anywhere on the price line, where this position loses more
than a fixed amount.

**That fixed amount is the debit.** What you paid to open it. Nothing else can be lost — not
more than the debit under any move, in any direction, at any speed.

That's the combination Lesson 5 said doesn't exist as a contract. It exists as a construction.

### Why this structure and not another

Four reasons. The last one is the one that matters most and gets noticed least.

**One — the control surface.**

A butterfly is two spreads, which means you have more to work with than any single spread
offers. Two widths to set. A net cost that's the *difference* between what the inner spread
costs and what the outer collects — two inputs producing one number, which lets you tune the
price far more finely than a single spread would. And the two spreads sit at different points
on the volatility surface, so they can be positioned against that difference.

You'll use every bit of that in the next lesson.

**Two — the efficiency, and what it costs.**

At the same starting strikes, a butterfly is the vertical *minus* the outer spread you sold.
Which makes it cheaper than the vertical — and a smaller cost against a similar payoff is a
better ratio.

But you bought that ratio by selling the region beyond the far wing. Past that point, the
structure pays nothing. A long call pays on any large move; the butterfly pays in a *region*
you nominate.

So the efficiency is real and it has a price: **you have to be right about magnitude, not just
direction.** Anyone who describes this structure as a better long call has misunderstood it,
and that misunderstanding is how people hold one through its own peak.

In this method that trade-off costs little, because the thesis never wanted the far region
anyway. You're targeting a zone, so selling what lies beyond it is selling something you had
no use for.

**Three — the decay differential.**

The two shorts at the centre are closer to the money than the wings, and closer-to-the-money
options carry more extrinsic value and lose it faster. So the middle of your structure decays
quicker than its edges — and since you're short the middle and long the edges, that difference
accrues to you.

That's the mechanism behind the approach zone. It's why the position can gain as price comes
toward the tent, without ever arriving.

**Four — one dial.**

Regimes change. Volatility rises and falls, and what's appropriate in a quiet market isn't
appropriate in a violent one.

With this structure, adapting to that is **one number**: how wide you make it. The structure
itself never changes. Same four contracts, same shape, same rules — just wider or narrower
depending on conditions.

That's what makes this operable. Not a family of strategies to choose between under pressure,
but one structure with one adjustment. It's the difference between a method you can run
repeatedly and a series of judgment calls you make fresh each time, and it's why the next
lesson can be a procedure rather than an art.

### The one variant we don't use

The two spreads don't have to be the same width. Make them unequal and you get a broken-wing
butterfly, which can drive the cost toward nothing or even to a credit.

It's tempting. It improves almost every number this course has taught you to check.

We don't use it, and the reason is worth understanding rather than accepting. When the wings
are unequal, the sentence that makes this structure safe — *nothing can be lost but the debit*
— stops being true. Risk extends past the far wing. It's still bounded, capped at the
difference between the two widths, so it isn't the naked position from Lesson 5. But it's that
shape at a smaller scale: pay less, win more often, and accept a loss that's larger than the
gain.

You'll meet broken wings elsewhere, because they're widely taught. Now you know what you're
looking at, and why the discipline that rejected naked selling rejects this too. The rule
gets applied to our own structures, not just to other people's.

### Your drill

Open a chain on a liquid underlying, a few days out.

Pick three strikes above the current price, evenly spaced. Write down the cost of buying the
lowest, the credit from selling the middle **twice**, and the cost of buying the highest. Add
them up with the right signs.

That number is the debit — the entire risk of the position.

Now compare it to the distance between strikes. You're looking at the relationship between
what a structure costs and how wide it is, and that relationship is the subject of the next
lesson.

Don't trade it. Just build it on paper and look at the two numbers.

### Next

You know what the structure is and why it's this one. But you don't yet know *which* one to
build — how wide, placed where, and at what price it's worth putting on.

That's a procedure, and it's the last thing you need before Module 3.

---

*Educational content only. Not financial advice. Options, and especially short-dated options,
involve substantial risk of loss.*
