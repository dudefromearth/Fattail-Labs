# Advisor Review — Journal Session v0.7 Full Agent Bench Plan v1.0

**Date:** 2026-08-13
**Input:** `Journal-Session-v0_7-Full-Agent-Bench-Plan.md` (Grok, v1.0)
**Reviewed against:** Journal Session Spec v0.7 rev 3 · Practice-Coach Design
Architecture v0.3 · B-Agent DL entry draft · Journal Session v0.6 (as-built substrate)
· Trade Log v1.1 · repo doctrine (overrule-not-waive, evidence over assertion, seeds,
Delta gates)
**Reviewer:** External advisor layer. Advisory only — no gate, no veto. BLOCKING and
ADVISORY separated per governance.

---

## Verdict

**Sound plan — recommend Coach GO** with **one BLOCKING addition** (B-P1, a one-ledger
sentence in two seeds) and **one BLOCKING dependency already resolved** (B-P2 — the DL
draft correction the plan assigned to Lima has been made at source; Lima now lands
verbatim). Advisories are Coach-disposable.

The plan is faithful to spec rev 3: charter scope J7-0…J7-4, correct fencing of the four
open rulings, heat gate blocking all agent change, the P1 field list implemented exactly,
and the trailing slices held out of the critical path. The as-built substrate section is
the standout — naming which v0.6 tests go red on purpose and rewriting them in the same
slice as the behavior change is precisely the "no accidental CI red" discipline, and
"replace RTH-as-silence with heat-as-silence" is the correct reading of what v0.6's
market-hours rule was actually protecting.

---

## BLOCKING

### B-P1 — One surfacing ledger across channels (J7-3-4 ↔ J7-4-2 seam)

J7-3-4 permits interim **in-session** guide opening ("on-session guide replies only, no
fake notify") before the J7-4 notify kinds exist. J7-4 then adds the notify channel with
its ≤1-per-kind-per-date and consumed-not-deferred accounting.

As seeded, these are **two channels with no shared counter**. Failure modes when J7-4
lands:

- **Double day-open.** Notify fires `coach_day_open` at the boundary; the member opens
  the Journal; the in-thread posture (built in J7-3) opens the day again. Two greetings,
  one date — the ≤1/kind/date law broken in spirit while each channel individually
  claims compliance.
- **Consumed-state mismatch.** Heat suppresses the notify (consumed); the book empties;
  the member visits; the in-thread channel — which never saw the consumption — fires a
  late day-open. That is exactly the "no 'what's the plan?' at 15:00" dump the spec
  forbids, arriving through the side channel.

**Required (one sentence in each seed):** a **single per-(identity, date, kind)
surfacing ledger** — fired or consumed — written by *whichever* channel acts first and
read by both. In-thread day-opening in J7-3-4 writes the same record J7-4-2 reads;
suppression consumes in the ledger, not in the notify scheduler's private state. Kilo
(J7-4-4) adds the cross-channel fixture: notify fired → member visits → no second
in-thread day-open; heat-consumed → book empties intraday → member visits → no in-thread
day-open either.

Implementation shape is India/Alpha's call (a `member_notify` row even for in-thread
fires would do); the *law* — one ledger, both channels — is the blocking part.

### B-P2 — DL draft heat SoR (plan risk item → resolved at source)

The plan correctly flags that the B-Agent DL entry draft still carried the pre-H1 heat
SoR ("identity/date") and assigns Lima to edit it on land (J7-0-0, risk table). A ruling
record should arrive correct rather than be corrected in the landing act — so the
**draft itself is now fixed**: retained rail 1 reads request-time derived open book,
identity-scoped, any active account, journal date not an input, asked analysis rejects,
fail toward restraint, no stored positions table. **Lima lands verbatim; J7-0-0's edit
instruction and the corresponding risk-table row can be struck.**

---

## ADVISORY (Coach-disposable)

1. **Migration numbers.** J7-1-1 says `127_…` with "(next free NNN)"; J7-3-1 hardcodes
   `128_journal_confirmations.sql` without the caveat. Both should say next-free-NNN —
   filename-ordered migrations plus a hardcoded number is a collision waiting on any
   parallel program. One word each.

2. **Field-union SoR sentence.** The plan says "implement exactly this union" and lists
   the twelve P1 keys; the spec says SoR is the as-built `TAG_FIELD_SPECS` union with
   the list as the documented snapshot. If code and list ever diverge, which wins should
   not be ambiguous inside a seed: J7-0-2's APPROVED note should record "code union is
   SoR; verified identical to the P1 list on this date." Keeps Hotel's closed-set gate
   anchored to one truth.

3. **Tone canary in the gate pack.** The no-3+-question-stack canary appears in J7-3-4's
   intent but not in J7-3-7's fixture list or J7-G-1's charter pack enumeration. Name it
   in both so it cannot quietly not-exist at the gate.

4. **Prompt-version continuity.** The guide rewrite replaces the agent prompt; v0.6
   §8.3's admin-editable versioned prompt with per-session `prompt_version_id` stamping
   is inherited law. One fixture line (J7-3-7 or J7-G-1): sessions under the new charter
   still stamp a prompt version, and the admin edit surface still functions.

5. **Draft closed-date semantics.** J7-1-2's "closed-date → read-only 409" compresses
   two behaviors: writes (PUT) 409 with reason; reads still return the draft flagged
   read-only so the member can retrieve their words (spec §7: "not silently discarded").
   Seed wording should keep both halves visible so the 409 doesn't eat the read path.

6. **J7-G-2 scope.** Lima's as-built honesty seed should explicitly include updating
   `docs/ADMIN-GUIDE.md` for the new admin-visible surfaces (notify kinds, model/effort
   config, prompt edit under the guide charter) — documentation parity is same-body-of-
   work law, and the plan currently names only spec status, DL pointers, and retired
   tests.

---

## Consistency checks performed (evidence, not assertion)

- **Spec ↔ plan scope:** every §13 slice appears; charter = J7-0…J7-4; J7-5/6/7 fenced.
  No spec law missing from the mission table; no plan law absent from the spec.
- **Heat gate:** plan's J7-2 matches rev 3 §5.2 including asked-analysis (P3),
  fail-closed, any-account, date-not-an-input, mid-conversation flip. The `/opens`
  account-scoping risk and its all-active-accounts mitigation match the verified Trade
  Log v1.1 read (derived book, per-account matcher, no stored table).
- **Extract:** same-txn law, no member message, no Week dot, closed keys, no
  required-for-complete restoration — all present in J7-3 seeds and DoD.
- **Fencing:** no seed touches B-Name strings, pillar-read fade, a personalization
  store, or a campaign object. Lawful-empties seed (J7-3-6) matches §4.2a including
  playbook-as-current-RAM.
- **Governance:** seeds carry agent/reviewer/files/gate; Delta gates every phase
  ternary; Juliet never executes; coordination through Coach/Juliet only; DoD requires
  both DLs before any behavior change.

---

## Recommendation

**GO**, with B-P1 folded (two sentences + one fixture) and B-P2 acknowledged as resolved
(strike the Lima-edits instruction; land the corrected draft verbatim). Advisories at
Coach's discretion — none block the charter.

---

*Advisor artifact — no gate held. Coach GO + Lima DLs remain the only binding acts.*
