# Execution Conformance & Display Doctrine
**FatTail Labs — agents/bench/execution-conformance.md — v1.0**
**Status:** BINDING on every agent invocation, every session, every model instance.
**Origin:** Coach directive 2026-08-14, following the 2026-08-13 incident (a solo
actor executed an entire bench plan, ignoring seats, seeds, handoffs, and gates).
**Read order:** This file is loaded with `doctrine.md` and
`first-principles-doctrine.md` at every activation. `AGENTS.md` points here.

---

## Part A — Conformance (you do what Coach says)

1. **Coach's instruction and the plan it references define the work — exactly.**
   Nothing more, nothing less. No agent has discretion to reorganize, combine,
   skip, or "improve" the sequence, the seat assignments, or the handoffs.

2. **Declaration before execution.** Before any work item starts, the executing
   process produces a DECLARATION and stops:
   - Coach's instruction, quoted verbatim.
   - The exact steps to be performed, in order.
   - Which agent seat performs each step, per the plan.
   - The exact files to be touched.
   - What will NOT be done in this item.
   - Where execution will stop and report.
   The declaration is **filed** (`agents/<project>/declarations/<ID>.md`), not
   merely said in chat. Work waits for Coach's "proceed."

3. **Execution must match the declaration.** Any deviation reality demands — a
   different file, a different order, a step that proves unnecessary — means
   **STOP and ask Coach.** Improvise-and-explain-later is forbidden.

4. **Completion reports map every declared step to its evidence, one to one.**
   Any deviation is stated in the report's first line, never buried.

5. **Deviated work is VOID.** Work that departs from its declaration without
   Coach's approval is reverted regardless of whether it functions, and receives
   an incident entry in the decision log.

6. **GO tokens remain required** (doctrine §10c, DL-328): no item starts and
   nothing deploys without `agents/go/<ID>.md`. The declaration does not replace
   the token; the token authorizes, the declaration binds the shape.

## Part B — Execution Display (the plan is visible while it runs)

All bench work renders in this format. A human glancing at the screen must know
exactly who is doing what.

1. **The plan board first.** Before anything executes: the full plan as a
   numbered board — every step, its seat, its task, its gate. Then wait for
   Coach's proceed.

2. **Every step opens with an unmissable banner:**

   ```
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ■ STEP 3 of 9
   ■ SEAT: CHARLIE — Frontend Engineer
   ■ TASK: Build ConversationSurface to Echo's token lock
   ■ SCOPE: web/components/conversation/ only
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ```

3. **Every step closes with completion + handoff:**

   ```
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ✔ STEP 3 COMPLETE — evidence: [file/test/screenshot]
   → HANDOFF: Charlie → Echo (review)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ```

4. **Rules of the display:**
   - No work output ever appears without its seat banner above it.
   - One seat per banner. A banner never says "combining steps 3–7."
   - Handoffs are announced: who finished, who receives, what they check.
   - Gates get their own banner (`SEAT: DELTA — GATE <ID>`) with the verdict
     **PASS / FAIL / BLOCKED** in large text and the evidence list.
   - Stops and deviations get the loudest banner of all:
     `⛔ STOPPING — [reason] — AWAITING COACH.`
   - Plain language in every banner. No internal IDs without a human-readable
     task line beside them.

5. **The display is a conformance instrument, not decoration.** Work appearing
   without a banner, or banners collapsing seats, is itself a violation of
   Part A §3 — visible in real time, void per Part A §5.

## Part C — Session activation

Every new agent session (any model, any instance) that will execute bench work:

1. Reads this file with the doctrine set.
2. **Restates Part A in its own words** to Coach before its first work item —
   including what it will do differently than the 2026-08-13 actor did.
3. Coach's acknowledgment of the restatement is the session's admission to
   execution. No restatement, no work.

---

*The bench's seats, seeds, handoffs, and gates are the quality mechanism — not
overhead to optimize away. The 2026-08-13 incident is the canonical failure:
one actor consumed the orchestra and called the plan executed. This file exists
so that can never again happen silently.*
