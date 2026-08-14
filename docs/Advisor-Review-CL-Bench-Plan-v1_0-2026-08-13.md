# Advisor Review — Coach Conversation Lab Full Agent Bench Plan v1.0

**Date:** 2026-08-13
**Input:** `docs/Coach-Conversation-Lab-Full-Agent-Bench-Plan-v1.0.md` (Grok, v1.0)
**Reviewed against:** Lab spec rev 2 · Journal v0.7 BUILD (DL-325/326) · as-built
substrate table · prior review chain (H1–H4, S1–S7, P1–P8)
**Reviewer:** External advisor layer. No gate. BLOCKING / ADVISORY separated.

**Disposition:** Folded into plan **v1.1** (2026-08-13). B-CL1 is plan law. Advisories 1–5 landed as written below.

---

## Verdict

**Recommend Coach GO after one BLOCKING addition** (B-CL1 — a named greeting
mechanism; the plan's own seeds currently promise a behavior its route table cannot
produce). Advisories are disposable. Everything else is tight: token lock from the
still, weight-as-gate, interface-sized column, fixture-first visual path, server-held
SoR, per-admin isolation, spoof fixture, H4 ban in the invariants, remount fenced in
every seed, and the Coach feel test seated as CL-G-4. P1–P8 endorsed as written —
P1 (server-held SoR, `{text}`-only body) improves on the spec and is adopted as the
correct reading.

## BLOCKING

### B-CL1 — The first-load greeting has no route

CL-4-1 requires "arrival greeting on load with typing." CL-3-1 creates the current
conversation on first `GET /conversation` — empty. CL-3-3 fires the greeting only on
`POST /reset`. So on a fresh load there is **no lawful way to obtain the first Coach
turn**: the page can't POST empty text, and calling `/reset` to force a greeting would
close-and-store an empty conversation and open another — a husk loop.

**Fix (one route + one law):** `POST /greet` — if the caller's current conversation
has **zero coach turns**, generate and persist the arrival greeting (first-name /
no-name rule, per-turn model+effort per P2); otherwise **no-op 200** (idempotent, so a
double-mounted page can't double-greet). `POST /reset` then simply calls the same path
after opening the new row. Kilo adds: fresh conversation + two rapid `/greet` calls →
exactly one greeting persisted. India signs it in CL-0-2 with the rest of the route
list.

## ADVISORY

1. **Empty-husk resets.** `POST /reset` on a conversation containing only a greeting
   (or nothing) will archive husks. Suggest: a conversation with zero **trader** turns
   is discarded on reset, not stored — the record discipline is for conversations that
   happened. India's call; either way, say it.
2. **Fake "Read" receipt** — the plan's recorded opinion (lab-only chrome; never
   remounts without real meaning) is endorsed; suggest Lima carries that sentence into
   the DL entry so the ban has a citation when the Journal remount packet is written.
3. **Migration "128 expected"** — fine as labeled; keep next-free-NNN as the law and
   the number as a guess, exactly as written.
4. **Model aliases** — `grok-4.20` / `grok-4.20-multi-agent` "as of 2026-08-13" with
   CL-3 re-verification is the right posture; no change.
5. **Greeting persistence** already implied by P2 (per-message model/effort); B-CL1's
   fix should state it explicitly so the greeting turn is stamped like any other.

---

*Advisor artifact — no gate held. GO + Lima DL remain the binding acts.*
