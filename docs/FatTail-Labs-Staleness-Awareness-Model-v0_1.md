# FatTail Labs — Staleness Awareness Model

**Formal Spec (review):** [`Specs/FatTail-Labs-Staleness-Awareness-Spec-v0.1.md`](../Specs/FatTail-Labs-Staleness-Awareness-Spec-v0.1.md)  
**Status:** DRAFT v0.1 — advisor proposal for bench review and Coach ratification  
**Date:** 2026-08-09  
**Parents:** [Capital Spec v0.3](../Specs/FatTail-Labs-Capital-and-Position-Sizing-Spec-v0.3.md) · [Funding Spec v0.2](../Specs/FatTail-Labs-Funding-and-Defunding-Spec-v0.2.md)  
**Purpose:** The campaign-blind capital layer runs on numbers only the trader can keep true — starting balances entered once, self-reported buying power, member-recorded cash movements. Staleness is therefore this model's principal honesty burden: the difference between **witnessing reality and witnessing a memory of it**. This document defines what staleness is, how it propagates from account to campaign to trade, and how the member is kept aware of it — in the umpire register, without nagging.

---

## 1. The principle

**Staleness is not an error state; it is an honest property of a declared number.** The platform never treats a stale figure as wrong — it may be perfectly current in reality. It treats staleness as *unknown freshness* and shows the age, so no decision is silently made against a number from three weeks and forty trades ago. The obligation is **display, never demand**: the member decides when refresh is worth their time.

### 1.1 Two kinds of numbers, only one can go stale

| Kind | Examples | Staleness? |
|---|---|---|
| **Derived** | fills P&L, trading curve, master drawdown vs. trading curve, allocation sums | **Never stale** — recomputed from history at read time |
| **Declared** | starting balance, cash movements (record lag), self-reported buying power, allocations, tolerated drawdown | **Can go stale** — true only as of when stated |

The system's discipline: derived numbers are always fresh by construction; every declared number carries an **as-of**; and any figure *composed* from declared inputs inherits the **oldest relevant as-of** in its chain.

### 1.2 The two clocks

Age alone is a weak signal — a buying-power figure from last month may be fine for a dormant account and dangerous for an active one. Staleness is therefore measured on two clocks:

- **Time since stated** — calendar age of the declaration.
- **Activity since stated** — fills executed, movements recorded, and (where relevant) allocation changes since the declaration.

A figure is *quietly aging* on the first clock; it becomes *worth mentioning* when the second clock runs — because activity is what makes an old number likely to be a wrong number. ("As of 12 days and 40 fills ago" is the honest unit.)

---

## 2. Staleness at the account level

The root layer. Everything above inherits from here.

| Declared figure | Goes stale when | Shown as |
|---|---|---|
| **Starting balance** | Never, in itself (it is historical fact) — but an *unentered* starting balance blocks derivation and is surfaced as absence, not zero | "Starting balance not set" — a gap, never a fabricated 0 |
| **Cash movements** | Reality moved money the record doesn't show. Invisible to the platform *except* via the honesty prompt below | Record-lag is self-declared via backdating; the surface shows last-movement recency alongside fill recency |
| **Buying power (self-report posture)** | Both clocks: age + fills since stated | "Buying power $X — as of 12 days / 40 fills ago" |
| **Buying power (arbitrary posture)** | By member's own choice, never surfaced as stale — they opted out of tracking | Figure shown with posture label; no aging display |
| **Buying power (live sync, queued)** | Only on sync failure | "Last synced …" only when sync is broken |

**The honesty prompt (bounded).** The platform cannot see unrecorded withdrawals. The one lawful mitigation is a *rare, quiet* prompt on the Accounts & Capital surface — e.g., a line noting how long since balances were last confirmed, with a one-tap "confirm as current" that refreshes the as-of without editing anything. **Never a modal, never on trade paths, never repeated within a cycle** — this lives inside the two-nudge budget (OD-3.3). Confirmation is itself a declared fact and gets its own as-of.

## 3. Staleness at the campaign level

Campaigns *compose* declared numbers, so they inherit staleness — and add their own.

| Figure | Inherits from | Adds |
|---|---|---|
| **Allocation** | Source accounts' balances (derived, fresh) — but the *claim* was sized against balances **as they were at declaration** | Allocation-age: "declared 60 days ago; Account A has since moved −$8k" |
| **Funding provenance** (wrap/proportion) | Source account existence and balance | Source-drift: the per-source overcommit witness (Funding proposal §4.2) is the *effect*; staleness display is the *age* of the claim behind it |
| **Drawdown latitude** | The allocation it was scaled to | If the allocation is amended, latitude's basis moved; shown as-of the amendment, per existing amendment law |

**Display rule:** campaign staleness renders on the campaign's own surface as at most **one quiet composed line** — the oldest relevant as-of in the campaign's chain — never a per-figure wall of timestamps. Detail lives one tap deeper. The variance witnesses (overcommit, source-drift) remain separate lines with their own register; staleness explains *how old the intent is*, witnesses show *what reality did to it*.

## 4. Staleness at the trade level

The moment of consequence — where a stale number stops being an abstraction and prices a position.

- **The solved size inherits the chain.** Size is solved from allocation and latitude (declared) against capital (derived). Wherever the solved size is presented (open disposition in the capital model), it carries the chain's oldest as-of in the same breath: *"Solved from your Campaign X allocation — as of 12 days / 40 fills ago."* One line. Not a warning — a provenance label.
- **Buying-power gate, self-report posture:** the feasibility check is only as hard as the figure is fresh (capital model §5.4). At trade time the gate's answer therefore includes its basis-age: *"within stated buying power (as of …)"*. Live-sync posture omits this — the figure is true.
- **Never a gate on staleness itself.** A member may knowingly trade on old numbers forever; that is their practice. The platform's whole duty is that the word *knowingly* stays true.
- **No trade-path interruptions.** Staleness at trade level is inline text on surfaces already being read — never a confirm step, never a dialog. The trade path stays exactly as fast as it is today.

## 5. The display grammar (system-wide)

1. **As-of everywhere a declared number renders.** Format: relative, two-clock where activity exists — "as of 12 days / 40 fills ago."
2. **Composed figures show the oldest link.** One line, chain detail one tap deeper.
3. **Quiet register, always.** Same typographic voice as variance lines: small, neutral, factual. No amber/red aging colors — color implies judgment, and an old number is not a sin.
4. **Display, never demand.** No modals, no required confirmations, no trade-path steps. The single bounded exception is the §2 honesty prompt, inside the two-nudge budget.
5. **Confirmation is cheap.** Anywhere an as-of renders on an editable surface, one tap re-affirms currency without editing. Refreshing honesty should cost seconds.
6. **Postures are respected.** The arbitrary-posture trader chose not to track buying power; the platform does not age what they declined to maintain. Capacity over dependency includes the freedom to be loose.

## 6. Explicit non-goals

- **No staleness scoring, grading, or streaks.** Freshness is not a virtue metric and never touches process-integrity surfaces.
- **No inferred staleness.** The platform never guesses that reality moved (no bank scraping, no heuristics); it only measures against what was recorded.
- **No enforcement.** Nothing is blocked, dimmed, or gated because it is old.
- **No profit-adjacent framing** (Sacred #8) — staleness copy speaks of currency of information, never of money left on the table.

## 7. Open dispositions (Coach)

1. **Honesty-prompt cadence** — proposal: surface-only, at most once per [cycle length TBD], within the two-nudge budget. Coach to set the cycle.
2. **Activity-clock thresholds** — when does quiet aging become worth composing into the campaign line? Proposal: any activity on a source account after a declaration qualifies; tuning is Echo/Tango's after member contact.
3. **Whether the two-clock unit ("12 days / 40 fills") is the standard everywhere** or time-only at account level. Proposal: two-clock wherever fills exist.

## 8. Gates

| Gate | Holder | Question |
|---|---|---|
| Member psychology | **Tango** | The whole document is a Tango surface: aging without nagging, no shame mechanics, honesty prompt inside nudge budget, "knowingly" preserved |
| Design | **Echo** | As-of grammar, two-clock format, one-line composition, tap-deeper detail |
| Architecture | **India** | As-of chain computation is derived-at-read (no stored staleness state — no second store) |
| Trading accuracy | **Hotel** | Basis-age on solved size and gate answers is accurate and never softens the buying-power wall where it is truly hard |
| Tests | **Kilo** | Oldest-link inheritance; posture-respecting display; confirm-tap refreshes as-of without value edits |
| Decision log | **Lima** | Staleness model ratification entry |
