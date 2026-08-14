# Advisor Review — Journal Session Spec v0.7 DRAFT

**Date:** 2026-08-13  
**Input:** [`Specs/FatTail-Labs-Journal-Session-Spec-v0_7-DRAFT.md`](../Specs/FatTail-Labs-Journal-Session-Spec-v0_7-DRAFT.md)  
**Reviewed against:** Practice-Coach Design Architecture v0.3 · B-Agent Coach-override DL draft · Journal Session v0.6 (inheritance) · Trade Log v1.1 (open book) · Practice Portability v1.4  
**Reviewer:** Architecture / India-shaped check (Grok)  
**For:** Claude (revise spec) → then implementation plan (this reviewer)

---

## Verdict

**FAITHFUL fold of ruled B-Agent.** The charter change, the two code rails, the open-ruling discipline, and the v0.6 inheritance map are the right shape. This is the spec we asked for.

**Not GO yet.** A handful of law-precision gaps will produce the wrong heat gate or a second SoR if they ship as written. None of them are “rewrite the charter.” They are corrections Claude should make in this file before Coach GO.

**Build-plan posture after those edits:** yes — this spec can be planned. Voice and star stay in-spec as later slices, not as GO blockers, if the packaging note below is added.

---

## What holds (do not walk back)

1. **Overrule, not waive.** Delta map names exactly what v0.6 loses. Everything else is inherited. That is the governance bar.
2. **Guide + open moments only.** Unprompted kinds are `coach_day_open`, `coach_day_close`, and existing retro-ready. Intraday is not a fourth ping. Frequency: at most one unprompted per kind per date. Closed dates refuse. Off-session dates: respond if written to.
3. **Extract-and-confirm.** Conversation is SoR. Confirmation card with the member’s own words. Decline → field absent. Agent turns are never an extraction source. v0.6 “never inferred” survives for the unconfirmed case. This is the correct replacement for “no filling empty fields.”
4. **Heat gate fail-closed.** Signal down → treat as position-open. Hard reject at render-time, same class as other guardrails. Mid-conversation flip on the next turn is the right test.
5. **B-Name / B-Journey-Feed / B-Personalize left open.** Placeholder speaker label. Constant `coach_posture_default=forward` until Journey feed is ruled. Personalization absent until its spec. Safe side of fade-too-soon.
6. **Drafts.** Server-side, Family B, purge yes / export no, never in agent context, never extracted from, closed-date draft is read-only with reason. Correct against idle timeout (30 / 15–60).
7. **Once-only absences, attribution, manual adherence, playbook reference-only, interview still member-requested.** All preserved.
8. **Verification section is actually testable.** Heat, surfacing, extract, drafts, posture fail-loud, tone canary.

Keep all of that.

---

## Must-fix before GO (Claude)

### H1 — Heat-gate SoR is the wrong clock (blocking)

**Spec §5.2:** “open Trade Log position for the identity on the **session date**.”

**Doctrine:** don’t put heavy reflection in front of someone **holding risk now**.

Trade Log v1.1: Position is **derived** unmatched open quantity (not a stored row). As-built check is `GET /api/me/trade-log/opens` (FIFO unmatched opens), account-scoped, **current book**.

Problems with “session date”:

- Backdating Tuesday’s journal on Wednesday while a position is open **now** must still restrain. The member is holding risk.
- Journaling today’s date after everything is closed must **release**, even if they were in a trade this morning.
- Overnight hold must restrain **pre-open** (`coach_day_open` suppressed). The verification table already implies this (“position closed: pre-open renders”) but the SoR sentence does not.

**Rewrite §5.2 SoR as:**

> Open-book check at **request time**, identity-scoped, **any active account**: unmatched opens exist in the Trade Log derived book (`listUnmatchedOpens` / equivalent). Journal date is **not** an input to the gate. Closed dates still refuse all agent writes (v0.6 §7) independently.

Cite Trade Log v1.1 §4.1 (derived position) and the opens endpoint. India/Alpha own the exact API; do not invent a stored `open_positions` table.

Also state explicitly:

- Overnight unmatched open → `coach_day_open` **does not fire**.
- A heat-blocked day-open is **consumed, not deferred**. When the book later empties, fire `coach_day_close` if it is post-close; do **not** dump a late “what’s the plan?” at 15:00.
- Multi-account: **any** unmatched open on any active account restrains.

### H2 — `coach_day_open` vs heat must be one law

§4.3 lists kinds. §5.2 lists the gate. They do not meet.

Add a one-line matrix:

| Kind | Heat on | Heat off | Off-session | Closed date |
|------|---------|----------|-------------|-------------|
| `coach_day_open` | suppress (consumed) | fire ≤1 / date | never | never |
| `coach_day_close` | suppress | fire ≤1 / date | never | never |
| retro-ready | existing cadence rules (no analysis in the ping) | same | per retro spec | n/a |

If Journal is already focused, the notify may no-op and only the in-thread presence/entrance runs. Say that so we do not double-nag (inbox + bubble).

### H3 — Confirmations need an event SoR

§6 does not say whether Confirm / Edit / Decline is a chat message, a structured event, or both. Week-view dots key on **member messages**. Attribution forbids quoting agent text as the member.

**Law to add:** confirmation is a **structured event** on the session (field, value-or-absent, source_message_ids, confirmed_at, actor=member). It may render as a card in the thread; it does **not** create a member message (so it does not mint a Week-view dot) and it is not extractable content. Agent “Here’s what I’m filing” is an agent turn or a non-message chrome; either way it is never an extraction source (already stated — keep).

`structured_provenance_json` is fine as the row. Name the write API: no `structured_json` mutation without a confirmation event in the same transaction.

### H4 — Extraction target is the existing interview schema only

§6 does not name the fields. Hotel’s gate (“no state-shaped fields”) is unenforceable without a closed set.

**Add:** extract-and-confirm may draft **only** keys already defined by the v0.6 structured interview. No new psychological / state / emotion fields in this version. Unknown keys are a hard reject.

### H5 — Pre-open with no campaign / empty digest

§3 and §4.2 assume “an active campaign” and “loaded rules.” B-Campaign-bind is still OPEN. Trajectory digest / chunks do not exist until the Retro conversation frame.

**Add two lawful empties:**

- **No active campaign:** still open the day. No loaded-rules block. Do not invent a season.
- **Digest / chunks missing:** context omits them (empty). Never fabricate a paragraph. Fail-loud only if a **required** config key is missing, not if optional context is empty.

Cite Own Spine v1.1 and Member Campaign v1.3 in the parents table (used in body, missing from the table). Snapshot-at-load (B4) is what “loaded rules” means **when** a campaign is active.

### H6 — Parents / portability citations

- Practice Portability parent says **v1.1**. As-built authority is **v1.4**. Bump the cite; the export/purge delta still needs a **v1.5** (or next) bump — say that.
- Add parents: Own Spine v1.1, Member Campaign v1.3, Trade Log v1.1 (already there — keep, tighten to “derived open book”).

---

## Should-fix (same revision)

### S1 — Build-order slice (v0.6 had §14; this draft dropped it)

Juliet cannot plan from a flat requirements pile. Add a short slice table, e.g.:

| Slice | Lands | Notes |
|-------|-------|--------|
| J7-0 | Coach GO + Lima DL (B-Agent) | This spec becomes BUILD AUTHORITY |
| J7-1 | Draft persistence | Independent; safety |
| J7-2 | Trade Log open-book signal + heat gate | Blocks agent change |
| J7-3 | Guide agent + extract-and-confirm + placeholder name | Core charter |
| J7-4 | Notify kinds + presence/entrance | Tango/Echo; B-Name still placeholder |
| J7-5 | Voice (Mike) | Build-gated; not GO-critical |
| J7-6 | Star object | India split-or-keep; retro references later |
| J7-7 | Portability bump | After stores exist |

Charter GO = J7-0…J7-4. Voice/star/portability may ship later against the same spec.

### S2 — Star vs Retro write

`member_practice_references` is written by Retro (§9). Journal v0.7 should **define the star mark only**. Move the references table to the Retro conversation-frame spec, or mark it “reserved; Journal does not write.” Otherwise India has two specs owning one table.

### S3 — `coach_effort_map` keys

Fail-loud is right. List the allowed moment classes so Alpha does not invent them: e.g. `surface`, `mechanical_turn`, `extract`, `day_open`. Journal is **light** effort; max-effort is for retro compile (not this spec). A missing key in the map aborts boot.

### S4 — Presence vs dismiss

§12: dismissing the entrance leaves the composer untouched. Add: dismiss kills the **entrance animation**, not the presence chrome (composer + speaker still there). “Never withdraws presence” must survive dismiss.

### S5 — Trajectory digest is read-only and may be empty

One sentence in §4.1: digest is optional context; empty is lawful; the Coach does not narrate a missing digest.

---

## Nits

- Filename `v0_7-DRAFT` is correct until GO; on GO rename to the repo’s Journal convention and drop DRAFT.
- §4.2 still contains design-intent greeting language (“what’s today’s plan?”). Fine as intent; repeat the B-Name block next to it so it cannot be copied into UI.
- v0.6 §17 item 5 (agent persona name) is now B-Name — say so in §14 so it does not look forgotten.
- v0.6 §17 item 4b (trades-strip width/R2R) remains inherited-open; keep it listed.
- “Advisor artifact” footer is correct until Coach GO.

---

## Open rulings — correctly left open

| Ruling | Spec posture | OK? |
|--------|--------------|-----|
| B-Name | Placeholder; grep forbids name strings | Yes |
| B-Journey-Feed | Constant forward; no pillar-read path | Yes |
| B-Personalize | Context slot gated; no store | Yes |
| B3 | Not this spec (Retro) | Yes |
| B-Campaign-bind | Must not invent a third campaign (H5 empties) | Yes after H5 |

---

## Against the architecture — scope check

| v0.3 item | In v0.7? | Judgment |
|-----------|----------|----------|
| Guide + proactive primary | Yes | Correct |
| Heat as code | Yes | Fix the clock (H1) |
| Extract-and-confirm | Yes | Add event SoR + field set (H3, H4) |
| Fade / pillars | Deferred honestly | Correct |
| Draft persistence | Yes | Correct |
| Voice / star | Requirements, later slices | OK if S1/S2 |
| Courseware routing | Out | Correct (not Journal) |
| Chunks / retro ceremony | Out | Correct |
| Journey pumps | Out | Correct |
| Campaign bind | Implied, not fenced | Fix H5 |

Nothing of Coach’s B-Agent ruling was dropped. Voice/star are extra, not a charter miss.

---

## What Claude should return

A revised `Specs/FatTail-Labs-Journal-Session-Spec-v0_7-DRAFT.md` that:

1. Rewrites §5.2 to **request-time derived open book** (H1) + kind matrix (H2).
2. Adds confirmation-event SoR (H3) and closed interview-field set (H4).
3. Adds empty-campaign / empty-digest law and missing parents (H5, H6).
4. Adds a build-order table (S1) and splits or reserves references (S2).
5. Does **not** reopen B-Name, B-Journey-Feed, or B-Personalize.

After that lands, this reviewer writes the implementation plan from the revised spec + v0.3 + the B-Agent DL draft.
