# Lesson 3 — The risk graph is a temporal object

*Pure Options · Module 1: See It*

You've seen a risk graph. Everyone has. It's the picture with the bent line — the one that
shows what a position is worth at various prices, with a floor somewhere and a slope
somewhere else.

And you were almost certainly shown it as a still image. A payoff diagram. Here is the shape,
here is where you break even, here is the most you can lose. Useful, and about half of what's
actually on the screen.

Because the risk graph isn't a picture. It's a film, and almost everything that matters is in
the motion.

### There are two lines, not one

Open any broker's analysis tab on a position and look carefully. There are two lines.

One is hard-edged, made of straight segments meeting at sharp corners. That's the position at
**expiration** — what it will be worth when there is no time left. Every bend in it sits at a
strike.

The other is smooth, curved, and sits somewhere above the first. That's the position
**right now** — what you could sell it for today.

Most people glance at the sharp line, because it's the one that answers "what happens if I'm
right." But you own the smooth one. That's the line your account statement reflects, the line
you can actually transact against, and the line that moves when the market moves.

> **[IMAGE — hero]**
> **Shows:** A risk graph with both lines clearly distinguished: the hard-edged expiration line, and the smooth current-value line sitting above it. Both labelled.
> **Type:** Static
> **Note:** **The course's signature image.** Reused in L4, L6, L7 and L8. Produce this one first and at the highest quality — every later graphic should be visually consistent with it.

### The gap between them is the extrinsic value

Now look at the vertical distance between those two lines.

That gap *is* the extrinsic value from Lesson 2. Not a representation of it — it. The
position is worth more today than it will be worth at expiration for exactly one reason:
there's still time on the clock, and time is possibility, and possibility has a price.

> **[IMAGE — supporting]**
> **Shows:** The two-line graph with the vertical gap shaded and labelled 'extrinsic value', tied back visually to L2's split-bar image.
> **Type:** Static, annotated
> **Note:** The connection to L2 should be explicit — same colour for extrinsic in both images.

Which means you can now *see* the thing you learned to name last lesson. Everything Lesson 2
described in words is sitting on this graph as a measurable vertical distance. Wide gap, lots
of possibility left. Narrow gap, most of it already gone.

### And the gap closes

Here's where it stops being a picture.

Set the graph's date forward a day and watch. The sharp line doesn't move — expiration value
depends only on price, and price hasn't changed. But the smooth line drops toward it.

Move forward another day and it drops again, further this time. Keep going and the smooth
line falls faster and faster, until on the final day it collapses onto the hard line and the
two become one. At expiration there's no gap, because there's no possibility, because there's
no time.

That's the decay curve from Lesson 2, drawn in space instead of over time. Same phenomenon,
different view. The bleed you read about is a line falling.

**The risk graph is a movie with one frame per day, and the whole plot is the gap closing.**

> **[IMAGE — hero]**
> **Shows:** The same graph at successive dates — the smooth line falling toward the hard line, frame by frame, until they merge at expiration.
> **Type:** Build or short loop, 5–6 frames
> **Note:** If any image in this course is animated rather than static, it should be this one. The motion *is* the lesson.

### What this changes about how you read one

Once you see two lines instead of one, three things follow.

**Your position has a value today that has nothing to do with being right.** The smooth line
sits above the hard line whether or not price ever goes where you wanted. That difference is
sellable. You'll use this constantly — it's the mechanism behind most of what this course
does with short-dated structures.

**Time has a direction on the graph, and it only goes one way.** Price can move up and back
down. Volatility can rise and fall. The gap only ever closes. It's the one force on the graph
that never reverses, which is why a position built without accounting for it tends to
disappoint in a way that feels like bad luck and isn't.

**Where the two lines are furthest apart is where time is doing the most work.** That's not a
detail. It's a location on the chart, and it tells you where a position's value is most
exposed to the clock — which is exactly what you need to know when the clock is measured in
hours.

### Reading one properly

A short procedure, worth doing every time until it's automatic.

1. **Find both lines.** If your platform only shows one, turn the other on. A single-line
   view is a payoff diagram, not a risk graph, and it's missing the dimension you trade in.
2. **Find the floor.** Where does the hard line stop falling? That's the most the position
   can lose, and in the structures this course builds, it's a number you chose at entry.
3. **Measure the gap at spot.** How far above the hard line is the smooth line, at today's
   price? That's what you're paying for possibility right now.
4. **Advance the date.** Watch what a day costs you, then what a week costs you. The rate of
   closing matters more than the size of the gap.
5. **Then look at the shape.** Only now does the payoff profile mean anything, because you
   can see it as something that arrives over time rather than something that simply is.

Most people do step five and stop. The first four are where the information is.

### Your drill

Open your broker's analysis tab on a single long option — any liquid underlying, roughly a
week out, slightly out of the money. You're not trading it. You're watching it.

Find both lines. Measure the gap at the current price and write the number down.

Now drag the date forward one day at a time, all the way to expiration, and write the gap
down at each step. When you're done, look at your column of numbers.

The differences between them are not equal. They get bigger as you approach the end, and the
last one is much bigger than the first. You just measured the decay curve by hand — and it's
the same curve that will decide whether the structures in Module 2 are worth building.

### Next

You can see the room and you can read its blueprint. Now the interesting part: what happens
to that room when you shorten the term.

All three walls change. Not equally, and not in the direction you'd expect.

---

*Educational content only. Not financial advice. Options, and especially short-dated options,
involve substantial risk of loss.*
