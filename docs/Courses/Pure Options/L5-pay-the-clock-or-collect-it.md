# Lesson 5 — Pay the clock, or collect it

*Pure Options · Module 2: Build It*

Everything in Module 1 was about seeing. From here you're building — and the first thing to
build with is the wall that moves most.

You already know extrinsic value drains away, slowly at first and then off a cliff. What you
may not have been told is that this is a **position**, not a condition. Decay isn't weather.
It's a flow with two ends, and every option trade puts you on one of them.

Most traders never choose. They pick a direction, buy a contract, and find out afterward which
side of the clock they were on.

You're going to choose.

### The buyer's clock

When you buy an option, time is a cost you pay every day you hold it.

Not metaphorically. Open a position, let a day pass with the underlying perfectly unchanged,
and the position is worth less. Nothing happened, and you paid anyway. That's the smooth line
from Lesson 3 dropping toward the hard line, and it happens whether you're right, wrong, or
still waiting to find out.

Which changes what "right" even means. If you buy a call and the underlying rises, you have
not necessarily made money. You've made money only if it rose *enough*, *soon enough* to
outrun what the clock charged you in the meantime. Being correct about direction is the
beginning of the requirement, not the end of it.

> **[IMAGE — supporting]**
> **Shows:** A long option's value over several days with the underlying flat — a declining staircase.
> **Type:** Static
> **Note:** The underlying being unchanged is the point. Label it clearly.

What you get in exchange is real: your loss is capped at what you paid, and your upside isn't.
That's a genuine asymmetry and it's why long options exist.

But you are fighting the clock the entire time you hold one.

### The seller's clock

Sell an option and the flow reverses. The same passage of time that charged the buyer now
credits you. Every quiet day, every hour where nothing much happens, the extrinsic value in
the contract you sold gets smaller — and you sold it at the larger number.

The remarkable thing about the seller's position is that it doesn't require a forecast. The
buyer needs the underlying to move, far enough, in the right direction, before the deadline.
The seller needs the deadline to arrive. One of those is uncertain. The other is guaranteed.

Which is why win rates on short-premium positions look so good. The buyer needs something
specific to happen. The seller mostly needs nothing to happen — and most of the time, nothing
is what happens.

### So sell everything?

No. And the reason why is the most important thing in this lesson.

Selling an option naked — without anything held against it — collects the decay and takes on
an obligation with no ceiling. If you sell a call and the underlying rises far enough, your
loss grows with it. There's no point where it stops on its own. The premium you collected was
a fixed, small number. The obligation you accepted is not fixed and not small.

> **[IMAGE — hero]**
> **Shows:** A naked short's payoff — flat premium collected across most of the range, then a loss line descending and running off the bottom edge of the frame.
> **Type:** Static
> **Note:** The line must **leave the frame**, not terminate at a floor. That's the entire lesson in one visual. Do not add a y-axis minimum that implies a bottom.

Here's how that plays out in practice, and why it's so effective at fooling people.

You sell premium. Most days nothing happens and you keep it. You do it again. Your win rate
is excellent — genuinely excellent, not a story you're telling yourself. Weeks go by. The
approach appears to work, because it *is* working, in the sense that the thing you expected to
happen keeps happening.

Then a day arrives that isn't like the others. And the loss on that single day is not
proportionate to the wins. It can exceed all of them together, because the wins were bounded
by what you collected and the loss was bounded by nothing.

**High win rate with bad risk-to-reward is how accounts die smiling.**

That's not an argument against being on the collecting side. It's an argument against being
there *unprotected*. If you've been running short premium and reading this with some
recognition — that's worth sitting with rather than defending against. The approach isn't
stupid. It's incomplete, and the missing piece is the entire subject of the next lesson.

### The thing to notice

Look at what the two sides actually are.

The buyer has **defined risk and an uncertain reward**. Worst case is known before entry;
best case is open.

The naked seller has **defined reward and undefined risk**. Best case is known before entry —
you keep what you collected, no more. Worst case is open.

Neither is what you want. You want the collection *and* the ceiling on damage. You want time
working for you and a floor under the worst day.

That combination doesn't exist as a contract you can buy. There's no ticker for it. It exists
only as something you construct — by holding one option and selling another against it, so
that the sold one harvests the decay and the held one caps what the sold one can cost you.

Which is why this course teaches building rather than picking. The position you actually want
isn't on the menu. You assemble it.

> **[IMAGE — supporting]**
> **Shows:** Two columns. Buyer: risk defined, reward open. Naked seller: reward defined, risk open. A third column outlined but empty, marked "next lesson".
> **Type:** Static
> **Note:** The empty third column is the hook. Leave it genuinely blank.

### One more thing about the short-dated end

You know from Lesson 2 that the steepest decay happens in the final stretch, and from Lesson 4
that the term is where all three dimensions sharpen at once.

Put those together. If decay is a flow you can position on either side of, and the flow is
fastest at the end of the term, then the short-dated band is simply where the most of it is
moving. That's the honest reason this course lives there. Not because it's exciting. Because
that's where the material is.

It's also where being unprotected is least survivable, since the same compression that
concentrates the decay concentrates everything else. Which makes the structure in the next
lesson not an optimisation but a prerequisite.

### Your drill

Find a liquid underlying and pick one out-of-the-money strike about a week out.

Write down its price. Now write down two numbers: what you'd risk to buy it, and what you'd
collect to sell it. Then write the worst case for each side. The buyer's is easy — it's the
price you wrote first. For the seller's, try to write an actual number.

You can't. There isn't one.

Sit with that for a moment before you move on. It's the reason the next lesson exists.

### Next

You want the decay working for you with the worst case capped. That structure has to be built,
and it's built out of something you may already know — two spreads, sharing a strike.

---

*Educational content only. Not financial advice. Options, and especially short-dated options,
involve substantial risk of loss.*
