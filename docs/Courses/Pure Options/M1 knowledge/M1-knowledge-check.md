# Knowledge Check — See It

*Pure Options · Module 1*

Ten questions. They test whether you can *use* Module 1, not whether you memorised it — several
have a plausible wrong answer that catches the most common misreading.

Answers and explanations follow the questions. Work through all ten first.

---

## Questions

**1.** MKT trades at 5,000. A 4,900 call is priced at 118. How much of that is extrinsic value?

- A. 118
- B. 100
- C. 18
- D. Zero — it's in the money

---

**2.** Which of these carries the *most* extrinsic value, all at the same expiration?

- A. A call 100 points in the money
- B. A call at the money
- C. A call 100 points out of the money
- D. They carry the same amount

---

**3.** You hold a long call. A day passes and the underlying finishes exactly where it started.
What happened to your position?

- A. Nothing — the underlying didn't move
- B. It gained slightly
- C. It lost value
- D. It depends on the strike

---

**4.** On a risk graph, what does the vertical gap between the expiration line and the
current-value line represent?

- A. The unrealised profit
- B. The extrinsic value remaining
- C. The maximum loss
- D. The breakeven distance

---

**5.** As expiration approaches, which of these *decreases*?

- A. Theta
- B. Gamma
- C. Vega
- D. All three increase

---

**6.** An out-of-the-money option four days from expiry costs very little. Why?

- A. The market has mispriced it
- B. Its intrinsic value is low
- C. Little time remains for price to reach the strike
- D. Volatility is low

---

**7.** Which statement about the expected move is correct?

- A. It's a forecast published by the exchange
- B. It's the range implied by current option pricing
- C. It's the average move over the past year
- D. It's the maximum price is likely to travel

---

**8.** Two identical calls, same strike, one with 30 days and one with 2 days. Which is more
sensitive to a change in implied volatility?

- A. The 2-day
- B. The 30-day
- C. Equally sensitive
- D. Depends on the underlying

---

**9.** A position gained value today. The underlying didn't move. What most likely happened?

- A. Time decay worked in your favour
- B. Implied volatility rose
- C. Intrinsic value increased
- D. This is impossible

---

**10.** Why does this course say an option "lives in a room" rather than on a line?

- A. Options are more complex than stocks
- B. Its price responds to three forces at once, not one
- C. There are three ways to lose money
- D. It has three strikes

---

## Answers

**1 — C. 18.**

Intrinsic value is how far spot sits above the strike: 5,000 − 4,900 = 100. The price is 118, so
extrinsic is the remaining 18.

*If you chose A:* in-the-money options still carry extrinsic value, but they're mostly intrinsic
— that's what "in the money" means. *If you chose D:* every option with time left carries some
extrinsic value, regardless of where it sits.

---

**2 — B. At the money.**

Extrinsic value prices uncertainty, and uncertainty peaks at the strike. Deep in the money, the
outcome is fairly settled. Far out of the money, it's also fairly settled — just in the other
direction. At the strike, it's genuinely in doubt, and that's what carries a price.

Example A in the practical lesson shows this directly: the at-the-money call carried 28 points of
extrinsic value against the in-the-money call's 12.

---

**3 — C. It lost value.**

This is the buyer's clock. A day passed, so extrinsic value declined, and since intrinsic value
didn't change, the position is worth less.

*If you chose A:* this is the most common misreading in Module 1. The underlying not moving
doesn't mean nothing happened. Time passed, and time is one of the three forces.

---

**4 — B. The extrinsic value remaining.**

Not a representation of it — it *is* the extrinsic value, expressed as a distance on the graph.
The position is worth more today than at expiration for exactly one reason: time remains.

*If you chose A:* unrealised profit is the distance between the current-value line and what you
paid, which is a different measurement entirely.

---

**5 — C. Vega.**

Theta and gamma both increase into expiry. Vega falls, and reaches zero at expiration.

Vega measures sensitivity to changes in expected movement over the option's *remaining* life. With
almost no life remaining, there's almost nothing for a change in expectations to act on.

*If you chose D:* this is the intuitive answer and it's wrong on the third. Worth re-reading
Lesson 4.

---

**6 — C. Little time remains for price to reach the strike.**

The option is cheap because it probably won't pay. Price and probability are the same fact stated
two ways.

*If you chose A:* be careful with this instinct. Cheap and mispriced are different claims, and
assuming the second whenever you see the first is how traders end up systematically buying
lottery tickets. Lesson 7 turns this into a rule.

---

**7 — B. The range implied by current option pricing.**

It falls out of what options are currently trading for. Nobody publishes it as a forecast — it's
derived from prices, which is why it's useful: it's the market's own number rather than someone's
opinion.

*If you chose D:* it's not a maximum. Price exceeds the expected move regularly, and Module 3 is
partly about what happens when it does.

---

**8 — B. The 30-day.**

Vega falls as the term shortens. The 30-day option has weeks for a change in expected movement to
matter; the 2-day has almost none.

*If you chose A:* the intuition is that everything intensifies near expiry. Two of the three do.
This one doesn't.

---

**9 — B. Implied volatility rose.**

Three forces move an option's price. Price didn't move, so intrinsic didn't change. Time passing
only ever reduces extrinsic value. That leaves volatility — a rise in implied volatility increases
extrinsic value, and it can outweigh a day of decay.

*If you chose D:* this is exactly why the room has three walls. A position can move without the
underlying moving at all.

---

**10 — B. Its price responds to three forces at once, not one.**

A stock's value answers to price alone — one dimension, a line. An option's answers to price, time
and volatility together.

*If you chose A:* true but not the point. The metaphor is about *dimensions*, not difficulty.

---

## How you did

**8 or more.** You can read an option. Module 2 will assume it.

**5 to 7.** Re-read the lessons behind the ones you missed before continuing. Module 2 builds
directly on all of this and gets harder to follow if the foundation is loose.

**Fewer than 5.** Work back through Module 1 and redo the drills on a live chain rather than
re-reading. The material is not difficult, but it doesn't stick from reading alone — which is why
the drills exist.

**One diagnostic worth applying regardless of score.** Look at whether you missed questions 3, 5
or 8. Those three all test the same thing from different angles: that time and volatility behave
in ways the price-focused intuition gets wrong. Missing two of the three suggests it's the
concept rather than the questions.

---

## Notes — not part of the lesson

**Question design.** Every item has a plausible wrong answer drawn from the specific misreading
that lesson exists to prevent — Q3's "nothing happened," Q5 and Q8's "everything intensifies,"
Q6's "it's mispriced." The distractors are the pedagogy; the explanations name the error rather
than just confirming the answer.

**Q5 and Q8 both test vega falling** deliberately. It's the accuracy-critical fact in Module 1 and
the one most likely to be absorbed backwards.

**Nothing here asks about outcomes, returns, or win rates.** Knowledge checks are an easy place
for a profit claim to slip in through a question stem. None do.

**Format may need adapting** to whatever the platform's quiz component accepts. Delivered as
markdown with a fixed question/options/answer/explanation structure so it maps cleanly to most
formats.
