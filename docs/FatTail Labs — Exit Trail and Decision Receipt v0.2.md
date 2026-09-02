# FatTail Labs — Exit Trail and Decision Receipt v0.2

**Status:** PROPOSAL. **No law created.** Supersedes
`FatTail-Labs-Stated-Reason-and-Personal-Base-Rate-Proposal-v0_1.md`, which located the decision at
entry. Coach corrected this on 2026-09-01: the decision is the **exit**.
**Coach's framing, verbatim:** *"Our use of GEX is primarily with exiting a position, making hold or
fold decisions. A user wants to feel comfortable that they made the correct decision given the data
before them. Our strategy is basically a dynamic trailing stop where the trail shrinks as the risk
increases… the trail takes into account the time of day, the gamma/delta risk, the amount of
unrealized gain that has been achieved and how much the trail is willing to give up given the risk
of holding."*
**Gates:** Hotel (trading accuracy, the coefficients) · India (domain model) · Tango (member
experience) · Echo (surface) · Delta (evidence).
**Invariants:** 4 (evidence over assertion) · 8 (process outcomes only) · 9 (capacity over
dependency) · 10 (test suite green).

---

## 1. What changed from v0.1

v0.1 proposed capturing a member's **reason at entry** and giving them a personal base rate on it.
The instinct was right and the moment was wrong. An entry is one decision with one reason. A hold
is a decision taken repeatedly all session, each time with fresh data and a shrinking margin, and
every one of them is real — including the ones where the member does nothing.

Everything structural in v0.1 survives: the countable field, the freeze rule, the small-sample law,
the reason × adherence crossing, and the roadmap inversion. All of it relocates from entry to exit,
and one new item appears that v0.1 could not have found — §3, which is blocking.

---

## 2. The instrument as Coach describes it

A trailing stop whose trail tightens as the risk of holding rises, moved by four inputs:

| Input | What it is |
|---|---|
| Time of day | Session remaining, against a 0DTE contract's clock |
| Gamma / delta risk | The risk carried **in the position** |
| Unrealised gain achieved | How much there now is to protect |
| Willingness to give back | How much of that gain the member will surrender given what holding costs |

The member's question at every moment is not *where is price going* but *is this still worth
holding, and if I am wrong about that, how much does being wrong cost me right now.* The trail's
distance from the position is the answer, computed continuously rather than guessed at under
pressure.

---

## 3. The blocking finding — the coefficients make the claim

**GXF36 bans writing** *"below the flip, volatility expands."* **If the trail tightens when gamma
risk rises, that sentence has been asserted** — as a number rather than a sentence, in the one place
nobody reviews the way they review copy.

A copy law that polices words and not parameters can be satisfied while being defeated. Every
coefficient in the trail is a claim about what the market does, and it ships with the authority of
arithmetic rather than the humility of prose. This is the item to settle before a formula is
written, because a formula written first may be prohibited by the project's own copy law after it
is built.

**The line that survives it:**

> Tightening because **the position's gamma is rising** is a statement about the position —
> mechanically true, checkable, no market claim.
> Tightening because **the market is expected to move more** is a claim about the market.

Same tightening. Different justification. Only the first is permitted without measurement.

### Three legitimate closures

1. **The member sets it.** Their rule; Labs asserts nothing. Cleanest, but most members have no
   prior to set it from.
2. **Labs measures it.** The base-rate work becomes a prerequisite rather than an option: a
   measured coefficient is evidence, not assertion, and satisfies invariant 4.
3. **Labs ships a default, declared unmeasured on the surface.** Honest interim.

**Recommended path: 3 → 2.** Ship defaults labelled as starting points nobody has measured,
accumulate members' own outcomes against them, then tune from measurement and say that is what
happened. What is not available is shipping a tuned-looking number with no evidence behind it.

---

## 4. The deliverable is a receipt, not a signal

*"A user wants to feel comfortable that they made the correct decision given the data before
them."* That sentence rules out a forecast — a forecast can only make a member comfortable by being
right, which Labs cannot promise.

What can be delivered is the decision written down at the moment it was made: what the trail was,
why it was there, what the member did, whether the two matched.

**Correct means: acted on your rule with the data you had.** Not *it turned out well.* That is
invariant 8 in its plainest form, and it is the only definition of correct a member controls.

The receipt records the trail value and the marked position; the trail's width as a fraction of
peak gain, and what it was earlier in the session; which of the four inputs moved it and by how
much; the member's action and its timestamp; and the adherence verdict. Every line is a fact about
the member's own position and their own rule. **Nothing on it claims what price will do**, so it
needs no exemption from the copy law and no measurement to justify it.

It also carries the standing caveats: *Chain GEX (estimate)*, dealer sign assumed not observed, and
— per §3 — that default trail parameters are unmeasured starting points, not findings.

---

## 5. Answering "was it correct?" — the counterfactual

The trail can be evaluated without predicting anything, because the alternative is computable after
the fact. The member folded at the trail; had they held to close, the position would have resolved
at a known value. Run that across their own closed trades and the rule has a track record — their
rule, their trades, no market claim anywhere in it. That is a genuine backtest of a personal
strategy, and no vendor can print it, because it is not a fact about the market.

**The trap, and it is severe.** Shown per trade, this is a regret machine. *"You left 0.42 on the
table"* after every exit teaches a member to widen their trail until it stops protecting them — the
tool causing the harm it exists to prevent.

**Rule: the counterfactual is aggregated in the retrospective, never on the receipt.** Aggregated it
says something actionable without goading: *across 41 exits, holding to close would have been better
14 times and worse 27.* Every figure with its count.

**GXF39 binds harder on a member's own numbers than on ours**, because they will act on their own
record faster than on anything Labs publishes. Below a floor Hotel sets, show the count and withhold
the rate entirely.

---

## 6. The countable field, relocated

`member_trade_log_trades` already carries `setup_md`, `plan_md`, `rules_md`, `adherence`,
`deviation_md`, `lesson_md`. The reflection loop exists. What is missing is a **countable**
dimension — prose cannot be grouped, so two hundred trades describing the same idea in different
words aggregate to nothing.

Under this reframe the field is an **exit reason**, and the vocabulary is short because exits are:

| Permitted — describes the decision | Banned — describes the market |
|---|---|
| Trail met | Level broke |
| Folded ahead of the trail | Expected the wall to fail |
| Held through the trail | Structure said hold |
| Time stop | Gamma was about to explode |

The two deviation rows — *folded ahead* and *held through* — are the ones worth having, and they are
already half-captured by `adherence`. Crossing exit reason against adherence therefore costs almost
nothing and separates the two explanations a member most needs kept apart: **my rule was wrong**
versus **I did not follow my rule.** Collapsing those is how traders abandon sound rules and keep
unsound habits.

The **freeze rule carries over and matters more here**: the trail state at the moment of decision is
written as it happened and is not editable once the fill lands. A receipt revisable after the tape
resolves is not a receipt.

---

## 7. What this does not do

- Does not tell a member to exit. It shows where their trail is and what moved it.
- Does not forecast — no probability of a move, no expected range.
- Does not ship an unexplained number; every parameter is member-set, measured, or declared.
- Does not show per-trade regret; the counterfactual is aggregated or absent.
- Does not rank members. No leaderboards, no cohort percentiles (invariant 9).

---

## 8. Sequencing

1. **Settle §3 first.** Coach and Hotel, on the record, before a formula exists.
2. **The receipt and the exit reason.** Recordable today; touch no GEX compute; proceed under the
   current freeze; start the data accumulating, which nothing substitutes for.
3. **The aggregated counterfactual**, once enough exits exist to meet Hotel's floor.
4. **The GEX surfaces**, each facing one question: *what does this change about a hold-or-fold
   decision that the member could not see without it?* A surface that cannot answer it does not
   ship — which settles whether all six GEX tools are worth building. They are six projections of
   one computation; the ones that move a trail get made.

---

## 9. Open items

| # | Item | Owner |
|---|---|---|
| 1 | Do measured coefficients satisfy GXF36, and may unmeasured defaults ship if declared (§3) | **Coach · Hotel** |
| 2 | The four trail inputs: member-set vs Labs default, and what each default asserts | **Hotel** |
| 3 | Minimum sample before any counterfactual rate is shown | **Hotel** |
| 4 | Recording trail state at decision time — schema, freeze rule, `trade_log_domain` effect | **India** |
| 5 | How the receipt reads on the afternoon a member is stopped out of a winner | **Tango** |
| 6 | Receipt surface and exit-reason control | **Echo** |
| 7 | Characterization tests — freeze rule, minimum-sample suppression, no per-trade counterfactual | **Kilo** |
| 8 | Decision-log entry the day this is approved | **Lima** |

---

## Document control

| Version | Date | Notes |
|---|---|---|
| v0.1 | 2026-09-01 | Stated reason at entry. Superseded. |
| **v0.2** | 2026-09-01 | Decision relocated to the exit per Coach. Adds §3 (coefficients carry the claim) as blocking, the receipt as the deliverable, and the aggregation rule on the counterfactual. **No law created.** |