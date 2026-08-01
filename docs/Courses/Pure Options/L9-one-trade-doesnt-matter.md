# Lesson 9 — One trade doesn't matter

*Pure Options · Module 3: Run It*

Last lesson ended somewhere awkward. Half your positions lose by design, a single loss carries
no information, and results only mean anything across many deployments.

Which leaves an obvious question. If one trade doesn't tell you anything, what does?

The answer is that you've been thinking in the wrong unit. A trade isn't the thing you're
running. It's one instance of the thing you're running.

### The unit is the campaign

A **campaign** is a defined series of deployments, run under one set of rules, judged as a
whole.

Not a strategy — a strategy is the shape of what you build. Not a portfolio — a portfolio is
what you own. A campaign is a decision to deploy a particular structure, in a particular way,
at a particular cadence, for a defined stretch, and to evaluate it only when that stretch is
done.

It exists because of the arithmetic in Lesson 8. A structure whose modal outcome is a loss
simply cannot be assessed one instance at a time. The information isn't there. It only appears
across enough deployments for the distribution to show itself — which means the campaign isn't
an organisational nicety. It's the smallest unit at which this method can be evaluated at all.

> **[IMAGE — hero]**
> **Shows:** A long sequence of small deployments over time — mostly small defined losses, some approach-zone gains, occasional larger ones. Bars on a timeline, not an equity curve.
> **Type:** Static
> **Note:** **No cumulative line, no running total, no vertical scale in currency.** The visual point is the pattern and the density of deployments, not a result. An equity curve here would be a performance claim.

### What a campaign carries

Write these down before the first deployment, not during.

**A thesis.** What you're deploying against and why. Which underlying, which region of the
volatility spectrum, what you expect the market to look like over this stretch.

**An allocation.** How much capital the whole campaign may use — a number that doesn't move
once the campaign starts.

**A cadence.** How often you deploy. Regularly, not opportunistically. This one matters more
than it looks and there's a section on it below.

**Diversification.** Across underlyings and across terms. Not so you feel spread out — so that
one bad session isn't the whole campaign.

**A per-position cap.** The maximum any single deployment may risk, as a fraction of the
campaign. Small enough that a run of losses is survivable, because a run of losses is expected.

**A pause threshold.** A drawdown level at which you stop and review rather than continue on
momentum. Note *pause*, not stop — see below.

**A log.** Every deployment: date, structure, width, debit, what the regime was, how you
managed it, what happened.

**An end criterion.** A number of deployments, or a period, or a change of regime. Defined in
advance, so the campaign concludes rather than dissolves.

**A retrospective.** At the end, look at all of it together. Did you follow the screen? Did you
size correctly? Did you take the transit or wait for the peak? Were the rejections real?

That's the discipline. Nine items, all written before anything is deployed.

### The rule that protects all of it

**Never increase size after losses.**

It's the most tempting thing in trading and it's the one that ends accounts. The logic feels
sound — the method loses often, a run of losses is expected, so a larger position now would
recover them faster.

But you already know from Lesson 8 that a loss carries no information. It doesn't make the next
deployment more likely to pay. Sizing up after losses isn't recovery, it's converting a
designed, survivable pattern into a concentrated bet at the worst possible moment — and doing it
precisely when your judgment is least reliable.

Size changes at campaign boundaries, from a written rule, based on the retrospective. Not
mid-campaign, and never in response to how the last few felt.

### Why cadence matters more than it looks

Here's something the market does that changes how you should think about presence.

Large moves don't distribute evenly. They cluster. Long quiet stretches where the market
behaves and very little exceeds what was priced, then a compressed period where several
outsized moves arrive close together, then quiet again.

> **[IMAGE — supporting]**
> **Shows:** Realised moves against expected, over several years — the quiet stretches and the clusters of exceedance clearly visible.
> **Type:** Static
> **Note:** Coach's expected-vs-actual chart works here, but needs cleanup first: the label collisions in the dense clusters are unreadable, and the axis reads dollars where it means index points.

For a method built to pay in the uncommon regions, that has a direct consequence. **The
positions that pay most arrive in bursts you can't schedule.** Which means presence during the
quiet is the precondition for being there in the loud. Not because presence is virtuous — because
there's no way to be selectively present for events you can't see coming.

That's the real argument for cadence. You deploy regularly not out of discipline for its own
sake, but because irregular deployment means being absent for exactly the sessions the method
was built for.

And it explains the pause threshold rather than a stop. A quiet stretch produces a run of
defined losses **by design** — the method working, in an environment with nothing to give. A
pause says stop and check whether this is a quiet regime or a broken method. A stop assumes the
answer.

### The container: the barbell

One more layer, and it's underneath everything else.

The capital these deployments use is not your capital. It's a **bounded portion** of it, set
aside in advance, separate from the part that isn't doing this.

That's the barbell — a stable side that isn't exposed to any of this, and a speculative side
that is. Everything in this course lives on the speculative side, and it lives inside a
boundary drawn before the first deployment.

> **[IMAGE — supporting]**
> **Shows:** Two clearly separated pools — a large stable side and a small speculative side — with campaign deployments occurring only in the smaller one.
> **Type:** Static
> **Note:** Proportions illustrative, no percentages labelled. See the note at the end of this file.

Four rules make it a barbell rather than an intention.

**The speculative side is capped**, as a share of the whole, decided in advance.

**Each position is a small fraction of that side.** Small enough that the expected run of
losses doesn't threaten the campaign.

**You compound only from speculative gains.** Growth on that side can increase future size. The
stable side never funds an increase.

**You never deplete the stable side to keep speculating.** If the speculative side is spent,
the campaign ends. It does not get topped up past its original allocation because you feel
close to something.

That last rule is the entire structure. The stable side isn't a reserve you draw on — it's the
reason you can take the other side of the barbell at all. A trader who raids it hasn't stretched
the method. They've dismantled it and kept the name.

**On the specific numbers.** There are proportions we use, and they're ours — chosen for our
capital, our circumstances, our tolerance. They're not a prescription for yours, and this course
won't tell you what percentage of your money to allocate. What transfers is the structure: a
bounded speculative side, a small per-position fraction, compounding only from gains, and a
stable side that is never raided. Where you set the numbers is yours, and worth discussing with
someone who knows your whole picture.

### Your drill

Write a campaign plan for a campaign you're not going to run.

All nine items. Thesis, allocation, cadence, diversification, per-position cap, pause
threshold, log format, end criterion, retrospective. One page.

Two of them will be harder than the rest: the pause threshold and the end criterion. Notice
that. They're the two that require deciding in advance what you'll do when things are going
badly, and they're the two people skip — which is why campaigns dissolve instead of concluding.

If you keep a trade log or journal, this plan belongs at the front of it.

### Next

You can see it, build it, find one, and hold it inside something that survives a bad run.

The last lesson is an honest accounting of what that adds up to — and what it doesn't.

---

*Educational content only. Not financial advice. Options, and especially short-dated options,
involve substantial risk of loss.*

---

## Notes — not part of the lesson

**Allocation numbers deliberately omitted.** The source material specifies a speculative sleeve
percentage and a per-trade cap. Teaching those as *the* numbers tells a member how to allocate
their portfolio, which is personalised advice rather than education. The lesson teaches the
structure and the four invariant rules, presents the specific proportions as ours, and points
outward for the member's own figures. Worth a compliance read.

**"Campaign" collides with a platform member state.** The platform uses Campaign as one of five
member states; this lesson teaches it as a trading concept. Both are member-facing. Resolve
before publish — it's a terminology decision, not a copy fix.

**The clustering argument is doing double duty** — it justifies cadence, and it explains why the
pause threshold is a pause. Both follow from the same observation, which is why they share a
section.

**No cumulative performance visuals anywhere in this lesson.** The deployment-sequence image
must not become an equity curve.
