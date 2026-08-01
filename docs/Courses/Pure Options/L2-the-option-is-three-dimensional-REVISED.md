# Lesson 2 — The option is three-dimensional: its two values

*Pure Options · Module 1: See It*

You already know an option's price has two parts. Intrinsic and extrinsic — you were probably
handed those words in the first hour of whatever course you took, as a pair of definitions to
memorise.

They aren't definitions. They're the architecture. Almost everything that will happen to a
position you hold is decided by the relationship between those two numbers, and by what moves
each of them.

So we're going to crack the price open and look inside. Take your time here — everything
else in this course stands on it.

### A stock lives on a line. An option lives in a room.

A stock moves along a single line: price. Up or down, that's the entire story. One dimension.

An option is different, and here's the tell — its price is always made of two separate parts:
**intrinsic value** and **extrinsic value**. Learn to see them apart, and you'll find an
option doesn't live on a line at all. It lives in a room, with three walls: price, time, and
volatility. Let's build that room one piece at a time.

> **[IMAGE — hero]**
> **Shows:** A single option price as a vertical bar, split into two labelled segments: intrinsic below, extrinsic above. Then an out-of-the-money example where the bar is entirely extrinsic.
> **Type:** Build, 2 steps
> **Note:** The most useful image in the lesson. Everything after refers back to this split.

### Intrinsic value — the price value, and the long shot

Intrinsic value is the real part. It's what an option would be worth if it expired *right
this second*.

It's tied entirely to the strike. A call has intrinsic value only when the price is above its
strike, and only by how much. A put has it only when the price is below. Anywhere else,
intrinsic value is zero — flat zero. A dollar above the strike is a dollar of intrinsic
value. That's the whole rule.

Which means, for an out-of-the-money option, intrinsic value is a long shot. It's zero now,
and it *stays* zero unless the price travels all the way to the strike and through it. The
further out of the money, the longer the shot. Most out-of-the-money options never make the
trip — they finish exactly where they started: nothing.

So if intrinsic value is a long shot that often ends at zero, why does an out-of-the-money
option cost anything at all? Because of the other value.

### Extrinsic value — the time value, and the price of possibility

Extrinsic value is what you're really paying for when you buy an option that isn't yet in the
money. It's usually called time value, but the honest name is **the price of possibility**.

As long as there's still time on the clock, there's still a *chance* the option becomes real
— a chance the price makes the trip to the strike before expiration. Extrinsic value is the
market putting a price on that chance. You're not paying for what the option *is*. You're
paying for what it still *might become*.

### Probability — the paths to the strike

That "chance" is just probability, and it's the idea everything here turns on. Picture all
the paths the price could take between now and expiration. Early in an option's life, there's
plenty of time, so plenty of those paths still reach the strike — lots of surviving
possibility, so the extrinsic value is large. As the days pass, time runs out and paths
disappear; there's less runway for price to get there, so the possibility you're paying for
is worth less and less. The extrinsic value bleeds away.

### So the option is three-dimensional

Now put it together, and the room appears.

Intrinsic value answers to one thing: **price** — how far spot sits above or below the
strike. That's the first dimension.

Extrinsic value answers to two more. **Time** — the more of it left, the more possibility,
the more the value. And **volatility** — how much movement the market is pricing; more
expected movement means more paths reach the strike, so richer extrinsic value. That's the
second and third dimensions, and both of them live inside the extrinsic part.

So: price drives intrinsic; time and volatility drive extrinsic; and the option's whole price
is those two parts — three forces — moving at once. A stock lives on a line. An option lives
in a room.

> **[IMAGE — hero]**
> **Shows:** The room. A stock's single axis, then three axes built one at a time — price, time, volatility — resolving into a dimensional space.
> **Type:** Build, 4 steps
> **Note:** Reused as a callback in L4. Worth the production effort.

This is where a position surprises people. You can be exactly right on price — the one
dimension everyone watches — and the position still doesn't do what you expected, because
time worked against you or volatility got crushed. Those aren't bad luck. They're the other
two walls of the room, and by the end of this course you'll be building with all three.

### The decay: slow, then fast, then a cliff

The bleed of extrinsic value is not steady, and this is the part that matters most for us.

Early on, it barely moves — with lots of time left, one day gone doesn't change the odds
much. Then, as expiration approaches, it falls faster, because each remaining day is a bigger
fraction of the time that's left. And on the final day it collapses — dropping at an
exponential rate, because the probability of a not-yet-real option suddenly becoming real is
falling off a cliff. With hours left, almost no paths remain to make the trip.

Then time runs out completely. At expiration there is no time left, so no possibility, so no
extrinsic value. Every option is worth exactly its intrinsic value — which, for the majority
that never reached their strike, is zero.

> **[IMAGE — hero]**
> **Shows:** The decay curve — extrinsic value against days remaining. Flat early, bending, then falling off a cliff on the final day.
> **Type:** Static, with the final segment emphasised
> **Note:** Recurs in L5 and L7. Produce once, reuse. No dollar values on the axis — proportion only.

### Why the last day is where the work is

Look at where the collapse happens: the final stretch. The overwhelming majority of an
option's extrinsic value disappears there — the steepest part of the whole curve.

Here's the turn. For most of this lesson, decay has looked like a cost — value bleeding out
of something you paid for. But decay is not a force that acts on you. It's a force you choose
a side of. The same collapse that drains value from whoever paid the premium delivers it to
whoever is positioned to receive it, and the steepest part of the curve is where there is
most of it to work with.

That's the honest reason this course lives in the short-dated band. Not because it's fast.
Because that's where the material is.

### One warning before you get ideas

Being on the receiving side of decay is not the same as selling options naked.

Selling naked does collect the decay, and it takes on open-ended risk to do it — the opposite
of everything this course stands for. There is a way to be on that side with the danger
capped, and it's a structure you build rather than a position you pick.

That's Module 2. Don't build anything yet.

### Your drill

Pull up an option chain on any liquid underlying. Pick one out-of-the-money option roughly 5
days out. Write down its price, then split it into its two parts: how much is intrinsic
(price minus strike, or zero if it's not there yet) and how much is extrinsic (everything
left over).

For most out-of-the-money options you'll find it's *all* extrinsic — you're paying entirely
for possibility. Then find the same strike expiring today and do it again. Watch how much of
that possibility has already drained away.

That gap is the lesson.

### Next

Everything you just learned has a picture, and that picture is the **risk graph** — the two
values drawn as two lines, where the vertical gap between them *is* the extrinsic value,
closing as time runs out. You built the room in this lesson. Next you learn to read its
blueprint.

That's why the risk graph comes after this and not before: you can't read a picture until you
know what it's drawing.

---

*Educational content only. Not financial advice. Options, and especially short-dated options,
involve substantial risk of loss.*

---

## Revision notes — not part of the lesson

Four changes from the original page.

**1. Opening rewritten as a re-seeing.** The original opened *"This is the foundation… A
stock is simple,"* which addresses someone meeting the material for the first time. The
audience already has these words; what they lack is the recognition that the pair is
structural rather than definitional.

**2. Butterfly section removed.** The original closed with *"The shape that matches the
odds"* — the OTM butterfly and its outcome zones. That has moved to L6, where the student can
read a risk graph and has met the spread. It was doing too much work here, three lessons
before anything could be built.

**3. Invariant 8 — two fixes.**
- *"the probable outcome, where you make your living"* — removed with the relocated section.
  If any version of it returns in L6, the phrasing must not attach earnings to a frequency.
- The **~half / ~a third / small slice** proportions — removed here. They belong in L8, stated
  as where price finishes relative to the structure, with no return figures attached.

**4. "This is why beginners get ambushed" softened.** Changed to *"where a position surprises
people,"* and the sentence now points forward to building with three dimensions rather than
backward at a mistake. The design frame does not open on what will hurt the reader.

**Also:** section header changed from *Section 2* to *Module 1: See It*. The prediction-trap
framing (*"you can be exactly right on price and still lose"*) has been rewritten to describe
the position behaving unexpectedly rather than the trader being punished — the claim survives,
the victim posture does not.
