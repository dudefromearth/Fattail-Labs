# Adversarial review — Agent-Managed Lifecycle Spec v0.2

**Document reviewed:** `Specs/FatTail-Labs-Agent-Managed-Lifecycle-Spec-v0_2.md`  
**Against:** `docs/Agent-Managed-Lifecycle-Spec-v0_1-Adversarial-Review.md`  
**Reviewer:** Grok (second pass, 2026-09-26)  
**Not reopened:** routine model; no-gates; system-goes-to-the-member; Observer Lifecycle spec; Agentic Spaces v0.5; §17 except where a rationale would be shown false (none was).  
**Q6:** not ruled. Coach’s.

**Verify:** header is `Spec v0.2 — DRAFT for second review`. Supersedes names `v0_1`. Sections 0 through 19 present. Appendix A has twenty rows.

**F2 cleared in §6:** “A gesture fires on a state change … and never on the continued existence of an open loop.” Also §17.

**F13 cleared in §12:** “Janitor duties are unscoped, batch, or external only … Member-scoped work … is native (Populator, Learner), never a Grok Bot job.” Also §13, §17.

**F9 / Q6:** If Coach confirms the reinterpretation, **§11 as written clears the blocker** (space = object environment; bubble = view; Guide emits objects; no write-target; dispatcher is not the space). If he meant the bubble as write-target, the blocker stands.

---

## (a) Verification of v0.1 findings

| # | Landed? | If not |
|---|---|---|
| 1 | Landed (§4, §15) | |
| 2 | Landed (§6, §17). Blocker cleared. | |
| 3 | Landed (§4, §17) | |
| 4 | Landed (§6, §10, §17) | |
| 5 | Landed (§6, §15, §19) | |
| 6 | Landed (§4, §8, §17) | |
| 7 | Landed (§3 corollary, Q1) | |
| 8 | Landed (§3, §4, §17) | |
| 9 | Landed in §11; blocker pending Q6 | |
| 10 | Landed (§7, §11) | |
| 11 | Landed (§11, §19) | |
| 12 | Landed (§12, §17, §19) | |
| 13 | Landed (§12, §13, §17). Blocker cleared. | |
| 14 | Landed (§11) | |
| 15 | Landed (§17; Q2 wording only) | |
| 16 | Landed (§9; Q3 open) | |
| 17 | Landed (Q4 closed) | |
| 18 | Landed (§7, §17, §19) | |
| 19 | Landed (§8) | |
| 20 | Landed (§10, §18, §19) | |

**§16 / §17 self-voting:** none introduced. Q4 is out of §16 and in §17. Never-zero is in §17; Q2 is wording. Q3 matches §9. Q6 is a veto on text already written, not a question the body pretends is unanswered.

**§19:** TTL, memory location, claim liveness, adapter, gesture map, dispatcher-which-of-two are mechanisms. One dodge — see finding 4 below.

---

## (b) New findings

1. **§4.** “Available actions” for untaken loop steps keeps a standing three-item close-the-loop menu on the strip, which is the skip-count as chrome after F1/F2 forbade empty boxes and persistence-gestures. **Should-fix.** Produced work and thin-state discovery stay on the strip; untaken steps are reachable from it, not permanently listed.

2. **§4 / §6 / §8.** Discovery cues when production is “thin,” plus gesture on “first discovery” / “object of substance arriving,” treat an off-platform routine (unknown ledger) as a member who needs to be shown the tools. **Should-fix.** Unknown ≠ thin. Discovery gesture only when Labs has observed *this* member using Labs and producing nothing; unknown ledgers get no discovery campaign.

3. **§6.** “Object of substance arriving” as a gesture trigger includes Populator’s session loop-state writes, so every login can wiggle. **Should-fix.** State changes that gesture are the ones already named (loop closed, cycle boundary, first discovery); routine loop-state refresh is not substance.

4. **§19 / §18.** “Exact signals that constitute observed analysis, execution, and reflection” parks in instance-contract whether a *surface visit* counts — that is doctrine, or F20’s falsification is gamed. **Should-fix.** Doctrine here: the three steps are observed *work products* (analysis artifact, declared/sim/live trade, journal entry), not visits. Wire-level detectors stay in §19.

5. **§14.** Gesture events and bubble-open rate are listed as raw material of the reward function, which §10 forbids (reward closure, not clicks). **Should-fix.** Those two are diagnostic only; they are not reward inputs.

6. **§11.** Guide “Talks to members: yes” is leftover addressing language after the object/view rewrite. **Nit.** Table column: the Guide is the only agent whose objects the member-facing view is allowed to present.
