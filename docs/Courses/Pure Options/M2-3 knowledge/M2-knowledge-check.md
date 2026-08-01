# Knowledge Check — Build It

*Pure Options · Module 2*

Ten questions. Several require arithmetic — do it rather than estimating, because the arithmetic
is the skill.

Answers follow. Work through all ten first.

---

## Questions

**1.** A 40-wide butterfly. What is the maximum acceptable debit?

- A. 2.00
- B. 4.00
- C. 8.00
- D. Depends on the underlying

---

**2.** You buy a 30-wide butterfly for 2.40. What is the maximum you can lose?

- A. 30.00
- B. 27.60
- C. 2.40
- D. Unlimited

---

**3.** Same structure — 30 wide, paid 2.40. What is the risk-to-reward?

- A. About 1:11.5
- B. About 1:12.5
- C. About 1:9
- D. Cannot be known before expiration

---

**4.** Why does the price band have a *floor* as well as a ceiling?

- A. To keep commissions proportionate
- B. Because very cheap structures are usually far from where price will go
- C. To ensure enough premium in the short strikes
- D. Because brokers won't fill smaller debits

---

**5.** In what order should the three screening steps run?

- A. Price, width, placement
- B. Placement, price, width
- C. Width, placement, price
- D. Order doesn't matter as long as all three are checked

---

**6.** VIX is 28. Which width band applies?

- A. 20–30
- B. 30–40
- C. 40–50
- D. 50–60

---

**7.** You move from a 20-wide structure to a 60-wide one, keeping the debit at 10% of width and
the same number of contracts. What happened to your risk?

- A. Unchanged — same percentage
- B. Roughly tripled
- C. Roughly doubled
- D. Reduced, because wider structures are safer

---

**8.** Why place the structure around the expected move rather than closer to spot?

- A. It's more likely to be reached there
- B. Demand thins past that boundary, so the structure is priced by sellers
- C. Volatility is higher there
- D. It reduces the time to expiration

---

**9.** A butterfly is best described as:

- A. A long option with a hedge
- B. Two vertical spreads sharing a middle strike
- C. A naked short with protection
- D. Four unrelated contracts

---

**10.** Why doesn't this course use broken-wing butterflies?

- A. They're too expensive
- B. They're harder to fill
- C. Risk extends past the far wing, so max loss is no longer just the debit
- D. They don't work in short terms

---

## Answers

**1 — B. 4.00.**

The ceiling is 10% of width. 10% of 40 is 4.00. The floor would be 2.00.

*If you chose C:* check whether you're using total span rather than wing-to-centre. Width in this
course is wing to centre strike.

---

**2 — C. 2.40.**

The debit is the entire risk. That's the defining property of the symmetric butterfly and the
reason it can be taught before you're ready to run a live session.

*If you chose B:* 27.60 is the maximum *payoff* — width minus debit. Easy to invert under time
pressure, which is why it's worth being deliberate about now.

---

**3 — B. About 1:12.5.**

Maximum payoff is 30 − 2.40 = 27.60. Against a risk of 2.40, that's 27.60 ÷ 2.40 = 11.5, so about
1:11.5 — wait, work it yourself before reading the next line.

27.60 ÷ 2.40 = 11.5. So the answer is **A, about 1:11.5.**

If you picked B without doing the arithmetic, that's the point of the question. The numbers in
this method are close enough together that estimating produces wrong answers, and the difference
between 1:9 and 1:12 is the difference between an acceptable structure and a good one.

*Corrected answer: A.*

---

**4 — B. Because very cheap structures are usually far from where price will go.**

Price and probability are the same fact. A structure priced at 2% of width is priced there because
the market considers it very unlikely to pay, and the excellent-looking ratio is compensation for
that unlikelihood rather than an edge.

Candidate 2 in the practical examples is exactly this.

---

**5 — C. Width, placement, price.**

Price is the last gate, never the first. Screening by price first systematically selects the
furthest-out structures, because those are always cheap relative to their width.

*If you chose D:* order is the whole lesson. A screen that reaches the same three checks in a
different sequence reaches different conclusions.

---

**6 — C. 40–50.**

VIX 28 falls between 24.5 and 32 — Goldilocks 2.

Worth remembering that these are regions of a spectrum rather than gates. VIX 24.4 and 24.6 are
the same market, and the width you'd choose barely differs.

---

**7 — B. Roughly tripled.**

At 10% of width, a 20-wide structure costs 2.00 and a 60-wide costs 6.00 — three times the capital
per contract, for the same rule correctly applied.

*If you chose A:* this is the trap. The percentage is unchanged and the risk is not. Width and
size are different dials, and widening with the regime without reducing contracts triples your
exposure while you believe you've followed the method exactly.

---

**8 — B. Demand thins past that boundary, so the structure is priced by sellers.**

Inside the expected move is where the crowd buys, and that demand supports price. Past it, the
marginal buyer disappears and what remains is increasingly a seller's price.

*If you chose A:* the opposite is true. Price is *less* likely to reach a structure placed further
out — that's precisely why it costs less.

---

**9 — B. Two vertical spreads sharing a middle strike.**

A debit spread from the lower wing to the body, and a credit spread from the body to the upper
wing. That decomposition is why you have two widths and a tunable net cost — the control surface
that makes screening possible.

*If you chose C:* closer than it looks, but incomplete. It describes the shorts and the ceiling
without the structure that produces the tent.

---

**10 — C. Risk extends past the far wing, so max loss is no longer just the debit.**

Unequal wings can drive the cost toward nothing or to a credit, which improves nearly every number
this course teaches you to check. What it costs is the sentence that makes the symmetric structure
safe.

The loss is still bounded — capped at the difference between the two widths — so it isn't the
naked position from Lesson 5. But it's that shape at a smaller scale.

---

## How you did

**8 or more.** You can build and screen. Module 3 is about what happens when you deploy.

**5 to 7.** Look at whether your misses were arithmetic or judgment. Arithmetic errors resolve
with practice — redo the practical examples with a pencil. Judgment errors, especially on Q4, Q5
and Q8, mean re-reading Lesson 7.

**Fewer than 5.** Work back through Lessons 6 and 7 and build three structures on a live chain
before continuing. Module 3 assumes this is automatic.

**Regardless of score:** if you missed Q3, do the arithmetic in Q1 and Q2 again by hand. Every
number in this method is small and close to other small numbers, and estimating is not a skill
that survives contact with a live chain.

---

## Notes — not part of the lesson

**Question 3 contains a deliberate error and then corrects itself.** The stem presents a plausible
wrong answer as though it were right, then works the arithmetic and reverses. Two purposes: it
catches anyone reading the answers without attempting the questions, and it demonstrates that
estimating in this range produces wrong conclusions.

**This is unconventional and Tango should rule on it.** It's effective, and it risks reading as
sloppy rather than deliberate to a member who doesn't notice the intent. The alternative is a
conventional explanation that makes the same point less memorably. If it stays, the platform's
quiz component needs to render it without auto-marking the answer — which may make it impractical
regardless of whether it's good pedagogy.

**Q7 tests the sizing hazard** — the one thing in Module 2 that could genuinely hurt a member and
the one least likely to be noticed, since following the width rule correctly is what causes it.

**No question asks about outcomes, returns, or win rates.**
