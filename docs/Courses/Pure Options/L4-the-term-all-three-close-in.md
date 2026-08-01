# Lesson 4 — The term: all three close in at once

*Pure Options · Module 1: See It*

Here's something you've felt even if nobody named it for you.

A position with sixty days on it and the same position with two days on it are not the same
trade at different speeds. They behave differently in kind. The sixty-day version drifts and
forgives; the two-day version reacts to everything and forgives nothing.

That difference has a name, and it's the organising idea of this whole course.

### The term

**The term is the fixed duration of a trade — from now until the contract expires.**

It's a bond word, and it's the right one, because a term has an end date written into it
before anything happens. You don't choose when it ends. You only choose which one to enter.

And here's the claim this course is built on:

**A long term forgives. A short term doesn't.**

Not because a short term is more dangerous in some vague way. Because when you shorten the
term, all three walls of the room close in at once — and each one behaves differently as it
does.

### Wall one: time accelerates

You met this in Lesson 2 and measured it by hand in Lesson 3. Extrinsic value bleeds slowly
at first and faster near the end, because each remaining day is a larger fraction of what's
left.

The instrument that reads this wall is called **theta** — the amount of value a position
loses to one day passing.

Sixty days out, theta is small and boring. A day costs almost nothing. Two days out, theta is
large and getting larger every hour. The same contract that shrugged off a lost day in
January is losing a meaningful share of its remaining value every hour on its final
afternoon.

Time doesn't just run out in a short term. It runs out *faster the closer you get*.

> **[IMAGE — supporting]**
> **Shows:** The same option at 60 days and at 2 days, side by side, with the day's decay marked on each.
> **Type:** Static
> **Note:** Optional if the three-sensitivity panel is strong. Cut this before cutting that one.

### Wall two: price sharpens

This one surprises people, because price is the dimension everyone thinks they already
understand.

Consider an option a few points out of the money. Sixty days out, a ten-point move in the
underlying changes its value moderately — there's so much time left that a ten-point move
barely alters the odds of where things finish. The same option two days out, the same ten
points, and its value can multiply or vanish. Nothing changed about the move. The term
changed.

Two instruments read this wall. **Delta** is how much the position's value moves for a
one-point move in the underlying. **Gamma** is how fast delta itself changes.

Gamma is the one that matters here, and it climbs steeply as expiration approaches. A
short-term position doesn't just respond to price — its responsiveness itself is changing
under you, quickly, while you hold it. A position that was barely reacting an hour ago can be
reacting violently now, without the underlying having done anything unusual.

### Wall three: volatility turns unforgiving — and not the way you'd guess

Here's where the obvious answer is wrong, so read this one slowly.

You'd expect that if time accelerates and price sharpens, volatility sensitivity must also
increase as the term shortens. It does the opposite.

The instrument that reads this wall is **vega** — how much a position's value changes when
implied volatility changes. And vega *falls* as expiration approaches. It has to. Vega
measures sensitivity to how much movement the market is pricing over the remaining life of
the contract, and when there's almost no remaining life, there's almost nothing for a change
in expectations to act on. At expiration, vega is zero. A change in implied volatility on the
final afternoon barely moves a contract that is about to stop existing.

So the exposure genuinely shrinks. Why call it unforgiving?

**Because there's no recovery window.** In a sixty-day term, a volatility event is survivable
— it hurts, and then there are weeks for conditions to normalise and for the position to
recover. In a two-day term there is no "and then." Whatever the world does to your position
is what happened. Final.

And there's a second thing. In the short-dated band, implied volatility can move violently
*within a single session*. The exposure to each unit of that movement is small, but the
movements themselves aren't, and you're holding a position that is simultaneously very
sensitive to price.

So the honest statement is precise, and worth memorising in exactly this form:

> Time accelerates. Price sharpens. Volatility's *exposure* shrinks while its *consequence*
> grows.

> **[IMAGE — hero]**
> **Shows:** Three sensitivities plotted against days remaining: theta rising, gamma rising, vega falling. Same axes, one panel.
> **Type:** Static
> **Note:** **The falling vega line is the lesson.** It must be unmistakable — different colour, clearly heading the opposite way. This is the accuracy-critical image in the course.

If someone tells you all three sensitivities rise as expiry approaches, they're wrong about
the third, and it's the kind of wrong that produces surprises later.

### About the four words

Theta, delta, gamma, vega. You'll hear them called the Greeks, and you'll find courses that
teach them as mathematics.

This isn't one of them. In this course they're **gauges on the walls** — instruments that
report what each dimension is doing to a position you hold. You need to be able to read them
and know which wall each one watches. You do not need to calculate them, and calculating them
would not make you better at this.

Your broker computes all four and displays them. Your job is to know what they're telling
you.

### What the market thinks the term is worth

One more thing lives in this lesson, because everything in Module 2 depends on it.

If volatility is the market's estimate of how much movement is coming, then that estimate can
be translated into a distance. **The expected move is the range the market's own pricing
implies for a given term** — roughly, how far the underlying is likely to travel by
expiration.

Most platforms display it directly on the chain. It matters for two reasons:

It's the market's own answer to the question you're asking. Not a forecast anyone made
deliberately — a number that falls out of what options are currently trading for.

And it's **visible**. Everyone looking at that chain can see the same line. Which makes it
not merely a statistical boundary but a place where behaviour changes, because traders can
see it and act around it.

> **[IMAGE — supporting]**
> **Shows:** An option chain screenshot with the expected move displayed, marked on the strikes either side of spot.
> **Type:** Static, from a real platform
> **Note:** Needs to look like what the member actually sees. Blur or omit any account values.

Hold onto that. In Module 2 it becomes the single most useful landmark on the board.

### Your drill

Pick one liquid underlying and one strike a few points out of the money.

Find that same strike at three different expirations — roughly a month out, roughly a week
out, and the nearest one available. Write down theta, gamma and vega for each.

Read across your three rows. Theta grows. Gamma grows. **Vega shrinks.**

That table is this lesson. When you've seen it in your own numbers rather than in a
paragraph, you'll never confuse the third wall for the other two again.

### Next

You can see the room and you know what a short term does to it. Module 2 is where you stop
observing and start building — beginning with the wall that moves most, and the choice
everybody makes about it without realising they're making it.

---

*Educational content only. Not financial advice. Options, and especially short-dated options,
involve substantial risk of loss.*
