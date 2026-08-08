# FatTail Labs — AI Help Concierge Spec v1.1 (delta over v1.0)

**Status:** Implemented (2026-08-09, DL-270) — chat‑experience additions.
**Builds on:** `FatTail-Labs-Help-Concierge-Spec-v1.0` (unchanged core: whitelisted
KB, guardrails, fail‑open escalation, quiet human queue).

This version adds member‑facing chat improvements. It does **not** change the
answer/guardrail/escalation core.

---

## 1. Inactivity auto‑close

A bot‑handled chat that goes quiet closes itself so stale threads don't linger:

- After **4 min** idle a banner appears — "Still there? This chat closes in ~Ns" — with
  a **Keep open** button that resets the timer.
- After **5 min** idle the thread is closed: `POST /api/help/questions/{id}/close`
  (`reason: "inactivity"`) sets `status='closed'`, `closed_reason='inactivity'`. The
  closed panel tells the member it's saved and offers to start a new one.
- **Only bot‑handled threads auto‑close** (`ai_pending`/`ai_resolved`). A thread the
  team is on (`open`/`answered`) is never auto‑closed — they still owe a reply; the
  close endpoint returns `skipped` for those. Any new message resets the idle clock.
- Thresholds are constants (`IDLE_WARN_MS`, `IDLE_CLOSE_MS`) — trivial to tune.

## 2. Proactive human hand‑off

The concierge now **offers** a human instead of waiting to be asked. The system prompt
instructs it: when it isn't confident it resolved the issue, or the member signals the
answer didn't help ("that didn't work", repeats the question), end by asking *"Did that
sort it? If not, I can pass you to our team."* If the member accepts, it sets
`resolved:false` → the existing escalation fires (ticket + admin notify). The explicit
**"Talk to a human instead"** control remains.

## 3. Answer feedback (👍/👎)

Each real assistant answer shows a **Helpful? 👍/👎** control.
`POST /api/help/messages/{message_id}/rating` (`rating: up|down`) stores it on
`help_messages.rating` (member may only rate assistant answers on their own questions).
This is the signal for the self‑improving loop (which answers land, which to fix) and a
👎 nudges the human hand‑off. Ratings are hidden once a human is in the thread.

## 4. Data model (migration 093)

Additive, no enum changes:
- `help_messages.rating VARCHAR(8) NULL` — `up` | `down`.
- `help_questions.closed_reason VARCHAR(32) NULL` — `inactivity` | `member` | `resolved`.

## 5. Invariants (unchanged + new)

- All v1.0 invariants hold (whitelist KB, read‑only, fail‑open, quiet queue).
- **Auto‑close never touches a human‑owned thread.**
- Feedback and close are member‑scoped: a member may only rate/close their own items.

## 6. Verification

`server/tests/test_help_v2.py` — rating stored, invalid rating rejected, cross‑member
rating 404; bot thread closes, human thread close is skipped.

## 7. Deferred to v1.2+ (next)

- **Self‑improving engine:** admin "Questions" dashboard (most‑asked, unanswered,
  escalation rate, 👎'd answers) + a curated FAQ that feeds approved answers back into
  the KB so the bot improves over time; optional publish to a Help wiki page.
- **Streaming replies** (token‑by‑token) — reworks the JSON answer contract, isolated.
- **Image‑aware bug reports** (pass the uploaded screenshot to Grok vision).
