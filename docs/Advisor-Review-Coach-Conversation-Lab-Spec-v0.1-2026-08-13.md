# Advisor Review — Coach Conversation Lab & ConversationSurface Spec v0.1

**Date:** 2026-08-13  
**Input:** `Specs/FatTail Labs — Coach Conversation Lab & ConversationSurface Spec v0.1 (DRAFT).md`  
**Reviewed against:** Practice-Coach Design Architecture v0.3 · Journal Session v0.7 (BUILD, DL-325/326) · Human Interface Spec v1.0 · as-built `/admin` shell · as-built `SessionInterviewChat`  
**Reviewer:** Architecture / India-shaped check (Grok)

---

## Verdict

**Sound Stage-1 harness. Recommend GO after four must-fixes.** The split is right: a reusable `ConversationSurface` built for keeps, and a disposable admin lab that talks first. Fencing (no journal/retro stores, no heat gate, no member strings, B-Name not resolved) is correct.

This is **not** a Journal remount. Do not treat GO as license to replace `SessionInterviewChat` in this program.

---

## What holds

- Component vs lab page are cleanly separated. Props/callbacks only. Zero journal/retro imports is the reuse law.
- Record discipline (stamped, persisted, exportable) is host law from day one. The lab exercises it on `coach_lab_*` tables only.
- Arrival greeting + typing indicator is the right first-contact test. Reset closes-and-stores; past threads are read-only.
- Heat gate correctly **not** applied (no member, no book). Journal v0.7 §5.2 stays Journal law.
- Model-down is named, composer stays alive, no fake turns.
- Voice is optional and must be verified against current xAI docs at build — do not invent Path A.
- Default Yogi instruction is lab-only and already forbids analysis/advice.
- Acceptance has a Coach feel-test **and** mechanical checks. India reuse note is the right remount gate.

---

## Must-fix before GO

### H1 — Filename

Repo convention is ASCII hyphens, no spaces or em-dash. Rename to:

`Specs/FatTail-Labs-Coach-Conversation-Lab-Spec-v0_1.md`

### H2 — Who owns a conversation

`coach_lab_config` is a single global row (`id=1`). `coach_lab_conversations` has **no `identity_id` / `started_by`**. Two administrators will share one current thread and one history.

**Add:** `started_by identity_id` on every conversation. Current = latest open row **for that admin**. Config can stay global (shared instruction/model/colors). Transcripts do not.

### H3 — Component does not persist; the host does

§1 says every conversation the surface *carries* is persisted. §2.4 says the component fetches nothing and knows no stores.

**Resolve in one sentence:** persistence is a **host contract**. `ConversationSurface` only renders `messages[]` and calls `onSend`. The lab page (later Journal / Retro) writes tables. The component never grows a store.

### H4 — Lab transcripts are not member memory

§9 says the retro-side lab loads prior `coach_lab_conversations` so “the Coach that greeted you remembers.” In this spec “you” is the **admin**. Those rows are Yogi-lab chats, not a member’s journal.

**Add an explicit ban:** member Journal / member Retro **must not** ingest `coach_lab_*` as that member’s context. Continuity in production is journal thread → retro gather (v0.3). Lab-to-lab read-only is fine among admin sessions of the **same** admin.

---

## Should-fix (same revision)

### S1 — Role enum collision

§2.4: `role: coach|member`. §6: `role (coach|trader)`. Pick one. Recommend `coach|trader` in the lab schema (admin is not a member) and map to `incoming|outgoing` in the component so Journal can pass `member` later without a schema fight.

### S2 — `ConversationSurface` never hardcodes “Coach”

Name, avatar, and unavailable copy come from `senderIdentity` / host strings. The component ships with no “Coach” literal. Lab page may use “Coach · Lab” internally. B-Name still blocks anything that later mounts on `/app/journal`.

### S3 — G4 vs always-visible timestamps

iMessage does not stamp every bubble. v0.6 §1.4 does (never hover-only). Spec already chooses the Journal law. **Say so in §2.1:** side-by-side “cannot tell which is which” is the bubble/geometry/type test; per-bubble times are a **deliberate deviation** so G4 is not failed for inherited law.

### S4 — Journal remount stays outside the component

As-built Journal v0.7 already has drafts, extract cards, campaign stamp, playbook links, heat, presence. Those stay **page chrome**. Remount = swap the thread/composer only. Send-key (lab: Enter; Journal today: Cmd+Enter) is a host prop, not a silent change on remount.

### S5 — Enable flag + boot

“Fail-loud when the lab is enabled” needs `LABS_COACH_LAB=1` (or equivalent). Missing `XAI_API_KEY` must not abort the whole API when the lab is off. Voice env only required if `voice_enabled`.

### S6 — First name and avatar

If display name has no first token, greet without a name — do not invent one. Avatar is a **provided static mark** (path in the lab page), not a generated portrait of anyone.

### S7 — Voice is a later slice

v0.1 GO can ship §2–§6 without §7. Same pattern as Journal J7-5. Toggle stays disabled-with-reason until voice config exists.

---

## Open / not this spec

| Topic | Status |
|-------|--------|
| B-Name | Untouched. Lab label is internal. |
| Heat gate | Untouched. Journal only. |
| B-Journey-Feed / B-Personalize / B-Campaign-bind | Untouched. |
| Defect Artifact | Parent not in `Specs/` — Coach-held. Fine. |
| xAI voice endpoint | Verify at build; Path B is the safe default if Path A is not documented. |

---

## GO recommendation

**GO** after H1–H4. S1–S7 can land in the same file. Then a thin implementation plan: component → lab page + proxy + config → persist/export → (optional) voice.

Do **not** fold Journal remount into that plan.
