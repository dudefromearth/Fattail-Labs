# Adversarial review — Agent-Managed Lifecycle Spec v0.1

**Document reviewed:** `Specs/FatTail-Labs-Agent-Managed-Lifecycle-Spec-v0_1.md`  
**Reviewer:** Grok (adversarial, 2026-09-26)  
**Role:** doctrine review. Instance-contract items are labeled as such.  
**Not reopened:** routine model (§1), no-gates (§2), radar-map / system-goes-to-the-member (§3), Observer Lifecycle spec.  
**Spaces doctrine:** findings that would require changing Agentic Spaces v0.5 are not proposed; the fix is in this spec.

**Verify:** first line is `# FatTail Labs — Agent-Managed Lifecycle`. Header is `Spec v0.1 — DRAFT`. Sections 0 through 18 are present.

---

1. **§4 vs §5.** The persistent strip shows today’s loop *with state*, which is a running count of skipped steps — the exact thing §5 says gets dialed to the floor in week two. **Should-fix.** Strip shows only what the loop *produced* (and discovery cues when production is thin); skipped steps are not displayed as empty boxes. Do not reopen the routine shape; change what the marker is allowed to render.

2. **§6.** An unclosed daily loop is “something waiting,” so the floor pulse fires every day for anyone who hasn’t closed, and Observers cannot dismiss it — that is a nag with extra steps. **Blocker.** Doctrine: gesture may fire on a *state change* (loop closed, cycle boundary, first discovery), never on the continued existence of an open loop. Accrual in the bubble is enough.

3. **§4 / §5.** The pre-filled retro that answers “did they journal / trade / analyze” is a weekly skip-report, which §5 forbids as motivational material. **Should-fix.** Pre-fill only facts that exist (entries, trades, analyses). Absences are not listed; meaning-making does not start from a scorecard of zeros.

4. **§5 / §10 / §6.** Dial-to-floor is a learning signal with no ban on “try a more visible framing,” so the Learner can treat quieting as a prompt to get louder. **Should-fix.** Doctrine constraint: dial-down may change *framing* or *timing*, never intensity, and never above the member’s current dial. Quiet is not a reward hole to fill.

5. **§6 / §15.** Accrual without decay turns the bubble into an inbox of leftover nudges, which is a notification system in one corner. **Should-fix.** Waiting objects atrophy (Spaces vitality already requires this). Instance-contract: TTL / merge rules. Doctrine: stale nudges do not pile.

6. **§1 / §3 / §8.** Position is “known, never self-reported” from Labs telemetry, so a member who actually runs the routine off-surface (notebook, Discord-only, watching the show) is scored as not in the loop and then gestured at. They fall through the thesis: internalized routine, system treats them as failure. **Should-fix.** Ledger states only what was *observed in Labs*; it must not imply the routine didn’t happen. Off-platform work is unknown, not “open.”

7. **§3 / §4 / Q1.** The invariant is every surface where hands already are; the first application only instruments Runner or Analyzer. Course player, live session, and Community are current-session surfaces with no strip, so closing the loop still means leaving. Temporary first-slice is fine; the fall-through is unstated. **Should-fix.** Say explicitly: until a surface has the strip, the system may *not* demand a loop step that requires navigation from that surface; it may only accrue in the bubble.

8. **§3.** Weekly retro “arrives” but is not required to open in place (only daily reflection is). If retro is still a Practice destination, the outer cycle violates the reach invariant. **Should-fix.** Same ruling as daily reflection: retro is in-place from the strip or it is out of this spec’s reach.

9. **§11.** “The help system becomes the Space” identifies the substrate with a widget. In Spaces v0.5 a space is things + recognition, not a channel. Collapsing them makes every member-facing object *address* the bubble. **Blocker** (this spec, not Spaces — do not change Spaces). Rewrite: the space is the object environment; the help bubble is *a view* over objects in the member’s scope. Guide writes objects (nudge, observation, question). It does not “write messages into the help window.”

10. **§11 table.** Populator → loop-state object → Guide → member-facing message is a pipeline with an end-to-end path, which this spec claims not to be (vs Factory). **Should-fix.** Keep recognition: Guide recognizes loop-state objects and may emit a *thing*; it is not the next stage of a login pipeline. First-contact is recognition of a first-login object, not a scripted chain.

11. **§11.** “No new plumbing per feature” + “all arrive through the same window” is a fan-in routing convention for humans. Spaces forbids origin choosing who acts; choosing the help window as write-target is the same sin on the member side. **Should-fix.** Covered by finding 9. If Help Concierge today *dispatches* intents, this spec must say that dispatcher is retired or stays outside the space — not that it *is* the space. (If that required changing Spaces notification/recognition, stop — it doesn’t; the fix is here.)

12. **§16 Q4 (answered).** Grok Bot inter-bot coordination is **machinery**, not convention. **Known:** bots address each other by name in threads and hand off work; they share one cloud computer; xAI does not treat separate bots as separate security boundaries; there is no native object-space / recognition substrate. **Inferred (not known):** whether a *single* bot can run a batch job with no peer messaging (probably yes). **Not known:** any official way to disable directed messaging in favor of recognition. **Consequence for this spec:** cooperating janitors coordinate *outside* the space with their native messaging; only deposits cross the membrane. A lone janitor does not need inter-bot coordination at all. Adapter is required if two bots must not appear as a routing layer *inside* the space. **Should-fix.** Record Q4 as answered in v0.2 §17; keep the adapter as instance-contract.

13. **§12.** The ruling is right that the *Grok Bot product* (shared computer, directed messaging) must not be a resident and must not own the coaching voice. It is wrong to dump *member-scoped reconciliation* into that janitor role. Sweeping/reconciling loop state loads member objects into the blast-radius machine (context window is the shared computer). That fights §13. **Blocker.** Narrow janitors to unscoped / batch / external hauls. Member-scoped drift is a native agent skill (Populator/Learner), not a Grok Bot job. Do not make Grok Bots residents.

14. **§12 / §11.** External janitors that “deposit results into the space” are an ETL write-path (Factory-shaped), which this spec says this application is not. **Nit / should-fix.** Name the edge: deposits are how *external* work enters; they are not Guide/Learner structure. Don’t pretend the live environment has no pipeline at the membrane.

15. **§16 Q2 vs §6.** §6 already rules the floor is never zero; Q2 asks Coach to “confirm” that. Self-vote on the binary; only the two member-facing floor *values* are open. **Should-fix.** Move never-zero to §17; Q2 is only the wording of the two floors.

16. **§16 Q3 vs §9.** §9 already grants “view, correct, ask to forget.” “Correct” is edit. Q3 poses edit vs view+request-to-forget as if unset. **Should-fix.** Either strike “correct” from §9 and keep Q3 open, or move the hybrid to §17 and close Q3.

17. **§16 Q4 vs §12.** §12 already treats bot coordination as point-to-point messaging that would be a routing layer if they were residents — i.e. it already answers “machinery.” Q4 is then theatre except as confirmation. **Nit.** After finding 12, close Q4; don’t leave a decided mechanism listed as open.

18. **§7 / §9.** First contact is “on first login” without saying first login *with relationship memory cold*. A new device / empty hydration re-asks name and re-introduces, which is a nag. **Should-fix.** First contact is once per member relationship, restored from relationship memory; missing memory is a load failure, not a new introduction. Instance-contract: where that memory lives.

19. **§8.** “All of this already exists in Labs telemetry” overclaims (consent-to-name, dial position, live loop state do not exist until this system). **Nit.** Say: identity and app/journal/trade events exist; loop state, dial, and consent are derived/new.

20. **§18 vs §2.** Falsification compares guided vs campaign-only closures, but week one is unmeasured and there are no gates, so “close more cycles” can be won by anyone the strip merely *annotates* as closed (e.g. a trade already happening on Analyzer). **Should-fix.** Define closure as the inner loop’s three steps observed, not presence on a work surface. Instance-contract: exact signals. Doctrine: the test must not count strip-visible activity that isn’t the loop.
