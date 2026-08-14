# DL entry draft — B-Agent ruled by Coach override

**For:** `Architecture/00-decision-log.md` · Lima assigns the next free DL number
**Date of ruling:** 2026-08-13 (Coach, explicit, in advisor session)
**Prepared by:** external advisor layer (draft only — Lima lands it)

---

## DL-NNN — Coach agent charter: witness → guide (Coach override)

**Ruling.** The Practice agent's charter changes from **witness** to **guide**, ruled by
explicit Coach override of the shipped agent-response rules. Per overrule-not-waive
doctrine, this entry is the override's record; the change lands in law via **Journal
Session Spec v0.7** (versioned amendment), never as quiet behavior change.

**What is overridden (Journal Session Spec v0.6):**

| Shipped rule | Disposition |
|---|---|
| §8.2 — member always writes first; no unprompted questions | **Superseded.** The Coach may surface proactively and open the day. Proactive surfacing is the primary interaction model of The Practice |
| §9 — no more than one question per turn | **Superseded** as an absolute. Conversational judgment governs, inside the retained rails below |
| §9 — no filling of empty fields | **Superseded as stated; replaced by extract-and-confirm** (retained rail 2 below). The prohibition on *silent* field writes stands |
| §1.3 — agent is not an "Interviewer" | **Superseded as posture.** The guide asks open-ended questions that drive the routine; the label prohibition in speaker chrome is unaffected |

**Retained rails (conditions of the new charter — not overridden):**

1. **Heat restraint, as code.** While the member is **holding risk — at request time** —
   the Coach is quiet and non-analytic: receives, acknowledges briefly, answers only
   non-analytically; no unprompted questions, no analysis (asked analysis rejects too),
   no emotional processing. Source of record: the **request-time derived open book** —
   unmatched opens per Trade Log v1.1's derived-position model, identity-scoped, any
   active account; **the journal date is not an input**; fail direction is toward
   restraint. Hard reject at the same layer as existing render-time guardrails. Thin
   spec: journal-facing open-book helper over the existing opens matcher (no stored
   positions table).
2. **Extract-and-confirm.** The conversation is the source of record; the machine-side
   structured pass files fields *from* the member's words with a **member-visible
   confirmation** of what was filed. Silent invent-and-store remains forbidden
   ("unfilled structured fields are absent — never inferred" survives for anything the
   member did not say and confirm).
3. **The preserved column** (design doc §6.6): no motive/emotion naming; no P&L framing;
   no grades recited; conduct never character; no advice or prescriptions; never therapy;
   fail loud; Sacred Invariant 8 absolute.
4. **Fading glide path.** Proactivity calibrates against the Journey pillars and fades as
   the trader internalizes the routine; presence never withdraws, only insistence.
   (Pillar-read mechanics pend B-Journey-Feed.)
5. **Entrance character is Tango-gated** — welcome, never nag. Member-facing agent name
   remains **blocked** pending B-Name; no UI string ships before that ruling.

**Advisor note for the record:** Coach's override instruction ("purposefully overriding
the rule about agent responses" → "do it") was given against the advisor's stated framing
that rails 1–2 are new constraints of the new charter and survive the override. This
entry records them as **retained**. If Coach intended the override to sweep rails 1–2 as
well, this entry must be corrected before fold.

**Supersession pointers (forward only):** Journal Session v0.6 §8.2/§9/§1.3 remain
as-built authority until Journal Session v0.7 lands; v0.7 will cite this entry.

**Open rulings this entry does not touch:** B-Name · B-Journey-Feed · B-Personalize ·
B3 (cadence tier + vocabulary) · B-Campaign-bind · Journey documentation-parity check
(running UI vs Journey Experience v1.0).

**Cross-refs:** Practice-Coach Design Architecture v0.3 §6, §17 · Advisor Review
2026-08-13 (Grok) · Continuous Journaling DL-191 · Journey DL-190 · DL-067.
