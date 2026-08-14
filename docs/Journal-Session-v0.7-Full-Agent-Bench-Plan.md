# Journal Session Spec v0.7 — Full Agent Bench Plan (charter GO)

**Date:** 2026-08-13  
**Owner (orchestration):** Juliet  
**Authority:** Coach (GO / ship)  
**Board:** [`agents/p-journal-session-v07/`](../agents/p-journal-session-v07/)  
**Plan revision:** **v1.1** — folds advisor review of plan v1.0 (B-P1 ledger · B-P2 DL draft already corrected)  
**Spec:** [`Specs/FatTail-Labs-Journal-Session-Spec-v0_7-DRAFT_1.md`](../Specs/FatTail-Labs-Journal-Session-Spec-v0_7-DRAFT_1.md) — **rev 3** (P1–P3 folded; Lima promotes to BUILD AUTHORITY on GO)  
**Design frame:** [`Architecture/FatTail-Labs-Practice-Coach-Design-Architecture-v0_3.md`](../Architecture/FatTail-Labs-Practice-Coach-Design-Architecture-v0_3.md)  
**Override record:** [`docs/DL-Entry-Draft-B-Agent-Coach-Override-2026-08-13_1.md`](./DL-Entry-Draft-B-Agent-Coach-Override-2026-08-13_1.md) — Lima lands **verbatim** (heat SoR already request-time)  
**Governance:** [`agents/bench/doctrine.md`](../agents/bench/doctrine.md) · overrule-not-waive · evidence over assertion

Specialists execute **only** via seeds. Coordination through **Coach** or **Juliet**.  
Delta gates: **PASS / FAIL / BLOCKED** — never waived.

**Charter scope (this plan):** **J7-0 → J7-4**.  
**Later, same spec, not this critical path:** J7-5 voice · J7-6 star · J7-7 Portability v1.5.

**Fenced — do not implement:** B-Name strings · B-Journey-Feed pillar-read fade · B-Personalize store · B-Campaign-bind (new campaign object). Lawful empties in the spec keep those open.

---

## 0. Mission

Land ruled **B-Agent** as versioned Journal law: the agent is a **guide**, not a witness.

| Law | Spec |
|-----|------|
| Proactive surfacing is the primary interaction model | §4.2–4.3 |
| Unprompted kinds: `coach_day_open` · `coach_day_close` · existing retro-ready only | §4.3 matrix |
| Heat gate is **code**, request-time derived open book, any active account; date is not an input; fail-closed | §5.2 |
| Heat on → zero unprompted **and** zero analysis (asked analysis still rejects) | §5.2 · P3 |
| Extract-and-confirm: conversation SoR; confirmation **event** (no member message); same-txn write; closed field set | §6 |
| Drafts persist server-side; purge yes / export no | §7 |
| Fade is a **constant** `coach_posture_default=forward` until B-Journey-Feed | §4.4 |
| Placeholder speaker label; no name/greeting strings | B-Name |
| v0.6 surface, calendar, one-session-per-date, tags, closure, uploads **untouched** | §1 |

**Out of this program:** voice STT · star object · Portability v1.5 · Retro conversation-frame / chunks · Journey meter amendments · a third campaign table.

---

## 1. Authority chain (same-day, J7-0)

```
Coach GO (this plan v1.1 + rev 3 spec)
    │
    ▼
Lima — two DL entries same day
    1. B-Agent override — land docs/DL-Entry-Draft-B-Agent-Coach-Override-2026-08-13_1.md
       VERBATIM (request-time derived open book already in the draft; do not re-edit)
    2. Spec §16 fold entry (Journal Session v0.7 BUILD AUTHORITY)
    │
    ▼
Juliet — promote spec file off DRAFT, freeze board, fire J7-1
```

Until those DLs exist, v0.6 §8.2/§9 remain as-built authority. **No quiet behavior change.**

---

## 2. As-built substrate (honest)

v0.6 program is **shipped** (`agents/p-journal-session-v06/` · JS6-9-G). This board **amends** the agent, it does not rebuild the Journal.

| Piece | As-built | v0.7 change |
|-------|----------|-------------|
| One session / date, calendar, thread, tags, interview bar | Landed | **Do not touch** |
| `journal_session_agent.py` | **RTH quiet** unless member wrote; member-first; silent “Noted.” | **Replace** RTH-as-silence with heat-as-silence; guide may speak first at open moments |
| Guardrail validator | Phrase/P&L bans | Keep; add heat + extract + unknown-key + asked-analysis |
| `GET /api/me/trade-log/opens` | Current unmatched opens, optional `account_id` | **Reuse** — identity-wide any-account boolean for the gate. **No** `open_positions` table |
| `member_notify` | `retrospective.material_ready` | Add `coach_day_open` / `coach_day_close` |
| Structured keys | `journal_session_structured.py` `TAG_FIELD_SPECS` | Closed extract set = **union of those keys** (P1). Do not restore v0.2 required-for-complete |
| Agent display name | `"Journal"` (v0.6 lock) | Stay placeholder until B-Name — do **not** ship “Coach” |
| Idle timeout | 30 / 15–60 | Motive for drafts; already shipped |

**v0.6 tests that will go red on purpose:** J2-3 “member always first” and “RTH silent unless asked.” Those fixtures are **rewritten** in J7-2/J7-3, not kept as regressions against the old charter.

---

## 3. Phase graph

```
J7-0  Lima DLs + spec BUILD + board freeze
  │
  ├──► J7-1  Draft persistence          (independent; land first or parallel)
  │
  └──► J7-2  Open-book signal + heat gate     ◄── blocks any agent behavior change
           │
           ▼
         J7-3  Guide agent + extract-and-confirm + placeholder name
           │
           ▼
         J7-4  Notify kinds + presence/entrance
           │
           ▼
         J7-G  Charter Delta gate (J7-0…J7-4)
           │
           ⋮  later, same spec
         J7-5 voice · J7-6 star · J7-7 Portability v1.5
```

**Critical path:** `J7-0 → J7-2 → J7-3 → J7-4 → J7-G`  
**Safety path:** `J7-0 → J7-1` (can overlap J7-2)

---

## 4. Sacred invariants (all seeds)

1. Overrule, not waive — v0.7 is the only lawful agent change.  
2. Config fail-loud: calendar, `coach_posture_default`, `coach_model_*`, `coach_effort_map` (closed keys `{day_open, surface, extract, mechanical_turn}`).  
3. Heat SoR = request-time derived unmatched opens, **any active account**; fail toward restraint.  
3a. **One surfacing ledger** per `(identity, date, kind)` — fired or consumed — shared by in-thread guide and notify (B-P1).  
4. Extract: member-authored messages only; closed key set; confirmation event in the **same transaction**; no member message minted.  
5. Family B on drafts and confirmations. Drafts: purge yes, export no.  
6. B-Name: grep rendered copy — placeholder only.  
7. No pillar-read fade path while B-Journey-Feed is open.  
8. No campaign object created; no-campaign day-open is lawful.  
9. No profit claims; no diagnosis; no tone.  
10. Evidence over assertion. No waived Delta gates.  
11. Declare exact files before touch.

---

## 5. Seed catalog

Every seed: project · agent · depends · intent · files · invariants · completion · gate.

### PHASE J7-0 — GO lock + DL + board

| Seed | Agent | Intent | Completion | Gate |
|------|-------|--------|------------|------|
| **J7-0-0** | **Lima** | Land B-Agent DL from `_1.md` **verbatim** + spec §16 entry. Promote rev 3 to BUILD AUTHORITY filename (retire `_DRAFT` / `_1` split). | Two DL numbers in `Architecture/00-decision-log.md`; spec header BUILD AUTHORITY | pre-impl |
| **J7-0-1** | **Juliet** | Board freeze; seed index; mark v0.6 agent tests to be rewritten (do not leave as accidental CI red) | `ORCHESTRATOR.md` current | pre-impl |
| **J7-0-2** | **India** | Sign heat API shape (identity-wide boolean over existing opens matcher) + confirmation event model + **one surfacing ledger** (B-P1) + closed field-key union. APPROVED note: **code `TAG_FIELD_SPECS` union is SoR**; verified identical to the P1 list on the sign-off date. | Written APPROVED | J7-0-G |
| **J7-0-G** | **Delta** | Spec+DL+plan consistency; charter scope = J7-0…J7-4 only | `J7-0-G` PASS | **J7-0-G** |

**J7-0 exit:** BUILD AUTHORITY · DLs · J7-1/J7-2 unblocked.

---

### PHASE J7-1 — Draft persistence (§7)

| Seed | Agent | Reviewer | Intent | Files (declare) | Gate |
|------|-------|----------|--------|-----------------|------|
| **J7-1-1** | Alpha | India · Mike | Migration `member_journal_drafts` PK `(identity_id, journal_date)`; Family B | `migrations/NNN_journal_drafts.sql` (**next free NNN** — do not hardcode) | J7-1-G |
| **J7-1-2** | Alpha | Mike | PUT/GET/DELETE draft; restore on session open; clear on send. **Closed date: PUT 409 with reason; GET still returns the draft flagged read-only** (not silently discarded). Never in agent context. | `server/routes/` journal · domain | J7-1-G |
| **J7-1-3** | Charlie | Echo | Composer debounce autosave; restore on remount; no thread render | `web/components/journal/SessionInterviewChat.tsx` | J7-1-G |
| **J7-1-4** | Alpha | Mike | Purge deletes drafts; **export omits** them | purge/export paths | J7-1-G |
| **J7-1-5** | Kilo | — | Cookie-kill restore; send clears; purge yes / export no; closed draft read-only; drafts absent from agent fixtures | `server/tests/` · web if needed | **J7-1-G** |

---

### PHASE J7-2 — Open-book signal + heat gate (§5.2) — **blocks agent change**

| Seed | Agent | Reviewer | Intent | Files (declare) | Gate |
|------|-------|----------|--------|-----------------|------|
| **J7-2-1** | Alpha | India | Identity-wide “has unmatched open?” over existing `match_open_close` / `GET /api/me/trade-log/opens`. Any **active** account. Date **not** a parameter. Do not add a stored positions table. | `server/routes/trade_log/trades.py` · `trade_log_domain/matching.py` · thin journal-facing helper | J7-2-G |
| **J7-2-2** | Alpha | Hotel | Wire heat into `journal_session_agent.py` **before** any turn renders. Heat on → quiet/non-analytic; **asked analysis hard-reject** (P3). Fail-closed if signal errors (restrain + admin log, member sees nothing). Mid-conversation flip on next turn. | `server/journal_session_agent.py` | J7-2-G |
| **J7-2-3** | Alpha | Hotel | **Remove** v0.6 RTH-as-blanket-silence (intraday + no member write → quiet). Heat replaces that clock. Off-session unprompted still never fires (calendar, J7-4). | same + tests that currently encode RTH-quiet | J7-2-G |
| **J7-2-4** | Kilo | Hotel | Fixtures: unmatched open any account → unprompted rejected; “what do you think of this trade?” rejected; book flat after morning round-trip → released; backdated `journal_date` + live open **now** → restrained; signal down → restrained + admin log; second account open restrains | `server/tests/test_journal_heat_gate.py` | **J7-2-G** |

---

### PHASE J7-3 — Guide agent + extract-and-confirm (§4, §6)

| Seed | Agent | Reviewer | Intent | Files (declare) | Gate |
|------|-------|----------|--------|-----------------|------|
| **J7-3-1** | Alpha | India | `member_journal_confirmations` + `structured_provenance_json`. Write law: no `structured_json` mutation without confirmation row **same txn**. `field_key` ∈ **code** `TAG_FIELD_SPECS` union (SoR; P1 list is the documented snapshot). Unknown key → hard reject. Interview path uses same event law (`method=interview`). | `migrations/NNN_journal_confirmations.sql` (**next free NNN**) · domain | J7-3-G |
| **J7-3-2** | Alpha | Hotel · Tango | Extract pass: member-authored messages only; agent turns never a source; drafts never a source. Confirmation event creates **no member message** (no Week-view dot). | agent + structured domain | J7-3-G |
| **J7-3-3** | Charlie | Echo · Tango | In-thread confirmation card: field, value, cited member words. Confirm / edit / decline. Card is chrome or agent-turn presentation — **not** a member message. Copy Tango-gated; no name strings. | journal chat components | J7-3-G |
| **J7-3-4** | Alpha | Tango · India | Guide posture: may open at lawful moments. **B-P1:** any in-thread day-open writes the **same per-(identity, date, kind) surfacing ledger** J7-4 will read (fired or consumed). No second channel with a private counter. Until J7-4, on-session opens still hit that ledger (a `member_notify` row even for in-thread fires is a lawful shape). Once-only absences survive. Tone canary: no 3+ question stacks. Placeholder speaker label only. Sessions still stamp `prompt_version_id`; admin prompt edit still functions (v0.6 §8.3 inherited). | `journal_session_agent.py` · prompts · ledger helper | J7-3-G |
| **J7-3-5** | Alpha | Mike | Fail-loud config: `coach_posture_default` (ship `forward`) · `coach_model_provider` / `coach_model` · `coach_effort_map` closed keys. Missing/unknown key **aborts boot**. No pillar-read code path (feature flag off / absent). | config / boot | J7-3-G |
| **J7-3-6** | Alpha | Tango | Lawful empties: no campaign → no loaded-rules block, no season nag; empty digest → silent, never narrated. Current playbook may be quoted reference-only; snapshot-at-load only if a campaign is active. | agent context builder | J7-3-G |
| **J7-3-7** | Kilo | India · Hotel · Tango | Same-txn write; decline → absent; unknown key reject; agent-turn as source reject; closed date 409; no Week-view dot on confirm; boot abort fixtures; no pillar-read; no-campaign grep; **tone canary (no 3+ question stack)**; **prompt_version_id stamped** on guide sessions + admin edit surface still works | tests | **J7-3-G** |

**Closed field set:** SoR is the **code** union of `TAG_FIELD_SPECS` in `journal_session_structured.py`. Documented snapshot (P1; India verifies identical at J7-0-2):  
`instrument` · `thesis_direction` · `trigger_level` · `size_risk` · `invalidation` · `watching` · `plan_diff` · `deviations` · `what_worked` · `open_thread` · `differed_from_plan` · `note`  
If code and list diverge, **code wins** and the list is updated the same day. Do **not** restore `required_for_complete` seal gates. Absent remains lawful.

---

### PHASE J7-4 — Notify kinds + presence (§4.3)

| Seed | Agent | Reviewer | Intent | Files (declare) | Gate |
|------|-------|----------|--------|-----------------|------|
| **J7-4-1** | Alpha | Mike | Kinds `coach_day_open` · `coach_day_close` on `member_notify`. Family B in-app (same channel policy as retro material). ≤1 per kind per date. | `server/member_notify.py` · journal notify job | J7-4-G |
| **J7-4-2** | Alpha | Hotel · India | Implement the **kind × state matrix** against the **shared surfacing ledger** (B-P1), not a notify-private counter: heat on → day_open **consumed not deferred** (ledger = consumed); overnight unmatched open suppresses day_open; heat on suppresses day_close; when book empties **post-close**, day_close may fire once; never dump day_open at 15:00. Off-session / closed date: never. Journal focused: notify no-ops (ledger still authoritative). In-thread day-open in J7-3-4 counts as the same fire. | notify scheduler + heat helper + ledger | J7-4-G |
| **J7-4-3** | Charlie | Echo · Tango | Presence element + entrance animation. Dismiss kills **animation only**. Welcome, never nag. **No** “Coach” / greeting strings (placeholder). | journal chrome | J7-4-G |
| **J7-4-4** | Kilo | Tango · Echo | Once-per-kind **across channels**; consumed-not-deferred; overnight hold through RTH close → flatten after hours → `coach_day_close` once, no late day_open; focus no-op; dismiss keeps presence; grep no name strings; agent turns still mint no Week dots. **Cross-channel (B-P1):** notify fired → member visits → no second in-thread day-open; heat-consumed → book empties **intraday** → member visits → no in-thread day-open either. | tests + e2e if needed | **J7-4-G** |

---

### PHASE J7-G — Charter close

| Seed | Agent | Intent | Gate |
|------|-------|--------|------|
| **J7-G-1** | Kilo | Full charter fixture pack green (heat + extract + drafts + notify + posture fail-loud + **tone canary** + **prompt_version_id** + **cross-channel ledger**) | J7-G |
| **J7-G-2** | Lima | As-built honesty: spec status, DL pointers, v0.6 agent tests retired; **`docs/ADMIN-GUIDE.md`** updated for notify kinds, model/effort config, prompt edit under the guide charter | J7-G |
| **J7-G** | **Delta** | Evidence: curl/API + tests + no name-string grep + no pillar-read + no third campaign table | **J7-G PASS** |

**Charter exit:** guide agent live behind heat + extract-and-confirm + drafts + day-boundary notify/presence. Voice/star/portability **not** required.

---

## 6. Trailing slices (same spec — do not pull into charter GO)

| Slice | Lands | Depends |
|-------|-------|---------|
| **J7-5** | Voice: fail-loud STT, Family B audio, member-correctable transcript, transcript-only analysis | Mike GO |
| **J7-6** | Star mark only (`member_journal_stars`). References stay Retro-owned | India split-or-keep |
| **J7-7** | Practice Portability **v1.5**: export confirmations + provenance + (later) stars/voice; **exclude drafts** | After stores exist |

---

## 7. Definition of Done (charter)

1. B-Agent DL (`_1.md` landed verbatim) + v0.7 §16 DL landed; spec **BUILD AUTHORITY**.  
2. Drafts survive idle logout; PUT on closed date 409; GET still returns read-only; export omits; purge removes.  
3. Unmatched open on any active account → no unprompted turn, no analytic turn (including asked). Signal down → restrain.  
4. Backdated journal + live open now → restrained.  
5. Overnight open suppresses `coach_day_open` (consumed). Flatten after hours → at most one `coach_day_close`. **One ledger** per (identity, date, kind) across in-thread and notify.  
6. No `structured_json` write without a confirmation event in the same transaction. Confirm mints no member message / no Week dot.  
7. Unknown extract key rejected. Closed key set = P1 list.  
8. No campaign → day-open (heat off) with no season nag. Empty digest silent.  
9. `coach_posture_default` / effort map fail-loud; no pillar-read path.  
10. Rendered copy has no B-Name strings.  
11. v0.6 surface invariants still green (one session/date, calendar, tags, closure).  
12. **J7-G PASS.**

---

## 8. Bench seating (charter)

| Callsign | Role |
|----------|------|
| **Coach** | GO, ship/no-ship, arbiter |
| **Juliet** | Board, seeds, sequencing — never executes packets |
| **Lima** | Two DLs same day; as-built honesty |
| **India** | Open-book API, confirmation SoR, **surfacing ledger**, no third campaign, no second progress store |
| **Alpha** | Migrations, heat helper, agent rewrite, notify, drafts API |
| **Charlie** | Draft autosave, confirmation card, presence/entrance |
| **Mike** | Family B, notify channel, model/effort config authority |
| **Hotel** | Heat semantics (asked analysis), closed field set, no state keys |
| **Tango** | Entrance character, card copy, no-season-nag, B-Name grep, tone canary |
| **Echo** | Presence dismiss, card in-thread, draft restore |
| **Kilo** | Characterization + rewritten v0.6 agent tests |
| **Delta** | J7-0-G · J7-1-G · J7-2-G · J7-3-G · J7-4-G · J7-G |

Victor optional on “once-only / fade later.” Sierra: no journal leakage. Foxtrot only if new fail-loud env must land on MiniTwo.

---

## 9. Risks (named)

| Risk | Mitigation |
|------|------------|
| v0.6 RTH tests fail the suite mid-J7-2 | J7-0-1 marks them; J7-2-3 rewrites in the same slice as the agent change |
| `/opens` is account-scoped in the UI | Journal helper loads **all active accounts**; do not trust a single `account_id` query |
| In-thread day-open + notify double-count | **B-P1 one ledger** (J7-3-4 / J7-4-2 / J7-4-4) |
| Presence + inbox double-nag | Focused Journal → notify no-op (J7-4-2); ledger still authoritative |
| Fade-too-soon | No pillar-read until B-Journey-Feed; constant `forward` |
| Extract invents v0.2 seal pressure | Closed keys + absent-is-lawful in J7-3-1 |

---

## 10. Revision

| Rev | Date | Notes |
|-----|------|-------|
| **v1.0** | 2026-08-13 | Charter plan J7-0…J7-4 from spec rev 3 + Architecture v0.3 + B-Agent DL draft. Voice/star/v1.5 fenced. |
| **v1.1** | 2026-08-13 | Advisor review of plan v1.0 folded: **B-P1** one surfacing ledger (J7-3-4 / J7-4-2 / J7-4-4); **B-P2** Lima lands `_1.md` DL draft verbatim (no edit-on-land). Advisories: next-free NNN migrations; code union is field SoR; tone canary + prompt_version_id in J7-3-7 / J7-G-1; draft GET vs PUT closed-date; ADMIN-GUIDE in J7-G-2. |
