# Advisor Review — Coach Conversation Lab & ConversationSurface Spec v0.1.1 (rev 2)

**Date:** 2026-08-13
**Input:** `Specs/FatTail-Labs-Coach-Conversation-Lab-Spec-v0_1_1.md`
**Prior review:** `docs/Advisor-Review-Coach-Conversation-Lab-Spec-v0.1-2026-08-13.md`
**Reviewed against:** Practice-Coach Design Architecture v0.3 · Journal Session v0.7 (BUILD, DL-325/326) · Human Interface Spec v1.0 · as-built `SessionInterviewChat` send-key · current xAI model docs (2026-08-13)
**Reviewer:** Architecture / India-shaped check (Grok)

---

## Verdict

**APPROVED (spec GO).** H1–H4 and S1–S7 from the first pass are folded honestly and in the right places. The split still holds: reusable `ConversationSurface` built for keeps; disposable admin lab that talks first. Fencing is intact.

This is **not build authority** until Coach GO + Lima DL. This lab GO is still **not** license to remount the member Journal.

Remaining items below are **housekeeping** and **implementability polish** for Juliet’s plan — not invariant breaks, not a RETURN.

---

## Disposition of rev-1 findings

| ID | Disposition | Where |
|----|-------------|-------|
| H1 Filename | **Folded in text.** On-disk residual: see Housekeeping. | Header |
| H2 `started_by` | **Folded.** Per-admin current thread; config stays global. Acceptance check added. | §3, §6, §8 B |
| H3 Host persistence | **Folded.** Component renders `messages[]` / calls `onSend`; never grows a store. | §1, §2.4 |
| H4 Lab ≠ member memory | **Folded.** Same-admin lab-to-lab only; member Journal/Retro must not ingest `coach_lab_*`. | §9, §8 B |
| S1 Role mapping | **Folded.** Component `incoming\|outgoing`; lab schema `coach\|trader`; Journal later maps `agent\|member`. | §2.4, §6 |
| S2 No “Coach” literal | **Folded.** Host supplies every name/avatar/unavailable string. Grep in acceptance. | §2.4, §8 B |
| S3 G4 vs timestamps | **Folded.** Side-by-side is bubbles/geometry/color/type; per-bubble times are a deliberate v0.6 §1.4 deviation. | §2.1 |
| S4 Remount = thread/composer | **Folded.** `sendKey` host prop; drafts/heat/extract stay page chrome. Lab GO ≠ Journal remount. | §2.4, §9 |
| S5 Enable flag | **Folded.** `LABS_COACH_LAB=1`; `XAI_*` abort only when enabled. | §6, §8 B |
| S6 No invented name / static mark | **Folded.** | §3, §8 B |
| S7 Voice later slice | **Folded.** Same pattern as J7-5. | §7 |

Nothing from the first review was dropped silently.

---

## What still holds

- Component vs lab page remain cleanly separated. Zero journal/retro imports is still the reuse law.
- Heat gate correctly **not** applied (no member, no book). Journal v0.7 §5.2 stays Journal law.
- Arrival greeting + typing indicator is the right first-contact test. Reset closes-and-stores; past threads are read-only.
- Model-down is named, composer stays alive, no fake turns.
- Default Yogi instruction is lab-only and still forbids analysis/advice.
- Acceptance has Coach’s feel-test **and** mechanical checks. India reuse note remains the remount gate.
- As-built Journal send-key is Cmd/Ctrl+Enter (`SessionInterviewChat.tsx`) — the host-prop callout is accurate.

---

## Housekeeping (do on land, not a spec RETURN)

1. **Filename residual (H1 leftover).** Spec header claims
   `Specs/FatTail-Labs-Coach-Conversation-Lab-Spec-v0_1.md`. The file on disk is
   `Specs/FatTail-Labs-Coach-Conversation-Lab-Spec-v0_1_1.md`. The spaced DRAFT
   (`Specs/FatTail Labs — Coach Conversation Lab & ConversationSurface Spec v0.1 (DRAFT).md`)
   is still the unrevised rev 1. On Coach GO: land as `…-Spec-v0_1.md` (or keep
   `v0_1_1` and fix the header to match) and archive/delete the spaced file so
   `Specs/` has one current text.
2. Status line still says DRAFT. After Coach GO, flip to BUILD and Lima logs the DL.

---

## Implementability polish (fold into the plan; optional tiny spec rev)

None of these break invariants. They will cause Alpha/Charlie drift or a false Delta fail if left implicit.

### P1 — Server-held transcript is the SoR

§4: `POST …/chat` body is “message history.” §3: every conversation is stored server-side.

**Rule for the plan:** the proxy attaches the instruction plus the **server-held** turns plus the new user text. Client-supplied history is not the source of record. Lab-only lowers the blast radius; the record-discipline claim still requires the server to own the script.

### P2 — Mid-conversation model/effort vs start snapshot

§5.3 / §8: effort and model apply on the **next message**. §6 snapshots `model, effort` **at conversation start**. Export-all JSON then lies about later turns — the experiment the lab exists to run.

**Pick one in the plan (opinion: b):**
- (a) Model/effort also apply only on Reset (snapshot stays truthful; weaker experiment).
- (b) Persist `model` + `effort` **per message** (or per request). Start-row snapshot remains “opened with.” Export includes per-turn values.
- (c) Export named as start-snapshot only, and say mid-turn changes are not in the artifact (honest, incomplete).

### P3 — Appearance is not in the component contract

§2.1 / §5.5 make bubble colors admin-adjustable. §2.4 lists no theme prop.

**Add to the contract (or say the host wraps via CSS variables):** optional `appearance` `{incomingBg, incomingText, outgoingBg, outgoingText}` with screenshot defaults as fallbacks. Lab passes config. Journal remount omits and gets G4 defaults. Do not bake lab color controls into the component as required props.

### P4 — Contrast acceptance fights §5.5

§5.5: low-contrast pairs warn and do **not** block (it’s a lab). §8 B: “All text ≥ 4.5:1.”

**Clarify:** defaults meet 4.5:1; custom pairs warn; G3 binds anything promoted beyond the lab.

### P5 — H4 acceptance wording vs §9

§8 B: “no production code path reads them.” §9: the later retro-side lab **does** read same-admin `coach_lab_*` into model context.

**Say:** no **member** Journal / member Retro / member production path reads `coach_lab_*`. Lab-to-lab same-admin read is a later program, not a v0.1 path.

### P6 — Thin route list

Named today: `POST /chat`, `PUT /config`. The plan should also name (admin-gated):

- `GET` current conversation + messages (this admin)
- `GET` past conversations (this admin)
- `GET` config
- `POST` reset (close-and-store + new + greeting)
- `GET` export markdown (one) / JSON (all)

### P7 — Effort wire token

UI copy uses `x-high`. Schema uses `xhigh`. Current xAI docs use `"xhigh"` (`reasoning.effort` / `reasoning_effort`). **Wire `xhigh`.** Display hyphen is chrome only.

### P8 — Conversation header stamp

§2.1 puts “Conversation started …” inside the thread. §2.4 has no `startedAt`. Host may render it above the surface, or the contract grows an optional `startedAt`. Pick one so Charlie does not invent a store inside the component.

---

## xAI check (research, not a block)

Checked 2026-08-13 against `docs.x.ai`:

| Spec string | Docs |
|---|---|
| `grok-4.20` | Documented family / alias class (“`grok-4.20` and newer”). Dated slugs exist (`grok-4.20-0309-reasoning`, etc.). |
| `grok-4.20-multi-agent` | **Documented alias** of `grok-4.20-multi-agent-0309`. |
| Effort `low\|medium\|high\|xhigh` | Documented. On multi-agent: agent-count ceiling. On `grok-4.6` / `grok-4.5`: reasoning depth. |
| Voice | Public materials list voice; Path A vs Path B still **verify at the voice slice**, not now. |

Spec already says verify exact strings at build and fail loud. That posture is correct.

**Opinion (not a constraint):** current “which model should I choose?” on xAI docs points chat/code at `grok-4.6`. The lab’s closed list can stay the 4.20 family because that is the multi-agent experiment. Adding `grok-4.6` as the single-agent default would make “effort = depth” true on the non-multi-agent side. Coach’s call.

---

## Open / not this spec

| Topic | Status |
|-------|--------|
| B-Name | Untouched. Lab label internal. |
| Heat gate | Untouched. Journal only. |
| B-Journey-Feed / B-Personalize / B-Campaign-bind | Untouched. |
| Journal remount | Own gated packet. This GO does not open it. |
| Defect Artifact | Parent not in `Specs/`. Fine. |
| xAI voice endpoint | Verify at S7 slice. |

---

## Opinions (not constraints)

- “Read Yesterday” under the latest outgoing bubble is decorative iMessage chrome. The model did not read anything. Harmless in a lab; do not carry the fake receipt onto the member Journal without a real meaning.
- Inert back chevron is fine as reference chrome.
- Two tabs for the same admin is unspecified. Lab-only; last-write / latest-open is enough.

---

## GO recommendation

**Spec GO.** Coach may approve. Then:

1. Housekeeping rename + drop the spaced DRAFT.
2. Thin implementation plan: component → lab page + proxy + config → persist/export. Voice stays a later slice. **Do not** fold Journal remount.
3. Juliet folds P1–P8 into that plan (P1 and P2 especially) so Alpha does not invent a client-history SoR or a lying export.

---

## Bench delta

Next invocation can treat Conversation Lab v0.1 as **spec-GO** (pending Coach + Lima), with H1–H4 / S1–S7 closed, and a known implementability list (server-held transcript, per-turn effort snapshot, appearance prop, contrast wording, H4 member-path wording, route list, `xhigh` wire token, `startedAt`). It does not need to re-litigate fencing, heat, B-Name, or remount scope.

**Flagged ideas:** inventory intact — voice Path A, Journal remount, retro-side lab continuity remain later programs.
