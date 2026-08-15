# FatTail Labs — Member AI Memory & Period Brief — Spec v1.0

**Status:** IN REVIEW (Coach) — shipped slices are **as-built**; remaining slices wait GO.  
**Date:** 2026-08-14  
**Family:** B (member-private)  
**Home:** Journal conversation · Retrospective gather/workspace · admin Journal Edit  
**Decision log:** DL-339 … DL-342  
**Parents:** Journal Session **v0.6** · Retrospective **v0.7.1** · Journey Experience **v1.0** · Trade Log **v1.1** · Member Data Privacy **v0.1** · North Star Ethos **v1.2**

This spec does **not** replace Journal Session or Retrospective. It is the product law for
**what the member-facing AI is allowed to know**, **how that knowledge is compiled**, and
**the standard period report** shown when a retrospective starts.

---

## 0. Coach intent (verbatim from discovery)

Nothing below is dropped. Implementation may sequence; it may not erase.

1. The AI should know the member’s name and address them by name, or at least be
   able to tell them their name if they ask.
2. That is not enough. A name-only inject is a parlor trick. The experience must
   be deeper.
3. The AI should know the member’s **Journey**, their **Trade Log**, their **past
   Journal** and **retrospective** entries.
4. It is possible — and wanted — that the AI maintain **member-by-member memory**
   and/or basic knowledge of their activity. Much of this is already in the
   database. If we have to rearrange it to make this happen, do it.
5. Architecture must make the AI **truly a personal assistant**, helping members
   **achieve their goals**.
6. Discovery: the maximal experience is what people get from desktop chats — it
   gets personal because the model remembers them. FatTail wants a **similar
   experience**. And it wants **speed**. Make it as performant as possible.
7. When a member **starts a retrospective**, the AI needs to **compile information
   since the last retrospective** into a **report** and construct a kind of
   **infographic**. We supply the interface so it is **standardized across all
   members**.
8. Admin AI Instructions are a **system-wide directive**, not local-mode probes.
   Lower-left **Edit** opens a markdown instructions window over the Journal
   message box. **Close** dismisses. Bottom border: **Reasoning** (low / medium /
   high) + **Save**.

---

## 1. Problem

Desktop assistants feel personal because they do not ask the member to
re-introduce themselves. FatTail already stores a richer record than a generic
chat (Journal, Retro, Trade Log, Journey, habits, campaign). Until this program,
the Journal agent saw only this session’s last lines, a trade **count**, and
(later) a name and six retros. Local mode ignored admin instructions entirely
once the one reflection probe was spent.

The gap is not “add a vector soul.” The gap is **compile the book we already
have**, show a **standard period picture** at retro start, and keep the turn
**fast**.

---

## 2. Product law

| Law | Rule |
|-----|------|
| **One memory: theirs** | The assistant reads the member’s records. It does not write a hidden biography. |
| **Compile, do not invent** | Context is assembled from tables. Missing text is missing. No inferred emotion, motive, or personality. |
| **Goals are already named** | Campaign charter, retro one-thing, habit plans, toughness rules. The assistant holds those. It does not invent a new goal system. |
| **Process, not P&L identity** | Trade Log in the pack is date / product / strategy / side / adherence. Profit is not who they are. Period brief tiles are process counts. |
| **Journey: activity, not a report card** | Courses, lessons completed, live check-ins, habit plans. Never recite grades, meters, streaks, or scores. |
| **Family B** | Pack, brief, and retrieve are identity-scoped. No cross-member memory. |
| **Admin instructions are system law** | `LABS_JOURNAL_AGENT_MODE=llm` for the live member experience. Local mode is test/offline only. Saved markdown + reasoning drive the model. |
| **Same infographic for everyone** | Retrospective start uses one layout. Data fills tiles. Empty is “—” or honest empty copy, not a missing tile. |
| **Speed is part of the product** | Precompute when possible. Cap tokens. Default chat reasoning is not stuck on high. Stream when we can. Do not block the turn on a full day-book. |

### What “second memory” means (and why it is refused)

A **second memory** is a shadow file the model writes about the member — moods they
never named, goals they never chose — that can contradict Journal and Retro.
That is forbidden.

**Member-by-member memory** in this spec means: a compile (and later a
member-visible brief) of **their** activity and **their** words. Rearranging
storage is allowed if it makes that compile correct and fast. Inventing a
second soul is not.

---

## 3. Member experience

### 3.1 Journal conversation

The member writes. The assistant already knows:

- Their **display name** (Profile). Uses it when natural. If asked their name,
  answers with that name. If unset, says it is not set on Profile. Never invents
  another name.
- **This session’s transcript.**
- **Journey activity** (path, not score).
- **Trade Log (last 14 days)** as process facts.
- **Past Journal days (last 21 days, other dates)** in their words.
- **Completed retrospectives** (period, title, body, one-thing).

It does not ask them to re-introduce themselves. If they ask what they committed
to last review, it answers from the last completed retro. If they ask what they
traded recently, it answers from the book — without making P&L the story.

### 3.2 Admin Edit (Journal)

Lower-left black **Edit** (Labs convention; site-wide app framework deferred).
Opens **AI Instructions** over the **message box**:

- Markdown editor (same window family as Playbook / Toughness: `MarkdownEditor`)
- **Close** dismisses (the only close)
- Bottom border: **Reasoning** low / medium / high + **Save**

Save writes the active prompt version and reasoning level. That is the
**system-wide** interview directive.

### 3.3 Retrospective start

Gather compiles the window **since the last completed review** (or maiden start)
into:

1. Existing ceremony DTO (`journal_compile`, process, carry-forward, …)
2. **`period_brief`** — the standard infographic

Every member sees the same six tiles:

| Tile | Meaning |
|------|---------|
| Days in window | Length of this period |
| Journal days | Days they wrote |
| Trades | Fill count (process, not P&L) |
| Plan followed+ | Followed + partial over tagged/total |
| Live check-ins | Live presence in the window |
| Lessons done | Lessons completed in the window |

Plus, when present: **last review’s fix** and a few **journal clips**.
Honest empty copy when a tile is zero. Not a P&L scoreboard.

The nine-step ceremony remains below. The brief is the picture at the top.

### 3.4 Desktop-chat maximal (intent)

The feeling of a desktop model that “remembers you” is **continuity + speed**:
name, last commitments, recent activity, this thread, first useful sentence
quickly. FatTail’s ceiling is that plus **structured goals**. Shipped pack +
period brief are the first slice. Visible brief, retrieve, stream, and hot
cache are the rest of the ceiling (§6).

---

## 4. As-built (2026-08-14)

### 4.1 Agent mode

Live StudioTwo: `LABS_JOURNAL_AGENT_MODE=llm`. Local is characterization /
offline only. LLM exceptions are logged (`labs.journal_session_agent`), not
swallowed silently.

### 4.2 Member context pack (Journal LLM turn)

`server/journal_session_agent.py` · `_member_context_pack`

| Block | Source | Limits |
|-------|--------|--------|
| Display name | `identities.display_name` | Fact only |
| Journey activity | enrollments, `lesson_progress`, `live_session_checkins`, `member_habit_plans` | No scores |
| Trade Log | `member_trade_log_trades` + first leg product | 14 days, 25 rows; no P&L / price-as-identity |
| Past journal | other sessions’ member messages | 21 days, ≤10 days, 2 clips/day |
| Completed retros | `member_retrospectives` status=complete | last 6; title / body / one_thing |

Attached to the system prompt after ethos + admin instructions. This session’s
last 12 messages remain the **transcript** (user turn).

### 4.3 Admin instructions

| Piece | As-built |
|-------|----------|
| Overlay | `JournalAiInstructionsChrome` · Edit · Close · markdown · Reasoning · Save |
| Store | `journal_session_prompt_versions.reasoning_level` (mig **128**) |
| API | `GET /api/admin/journal-prompts/active` · `PATCH /{id}` |
| Model | `complete(..., reasoning_effort=)` on xAI |

### 4.4 Period brief (Retro start)

| Piece | As-built |
|-------|----------|
| DTO | `build_period_brief` · gather emits `report.period_brief` |
| UI | `RetroPeriodBrief` at top of `RetrospectiveWorkspace` |
| Tests | `test_journal_compile_and_one_thing_patch` asserts tiles + preview |

### 4.5 Files

| Path | Role |
|------|------|
| `server/journal_session_agent.py` | Pack + LLM turn + name + retros + journey + book + past journal |
| `server/routes/journal_prompt_admin.py` | Active GET, PATCH, reasoning |
| `server/retrospective_domain.py` | `build_journal_compile` · `build_period_brief` |
| `web/components/journal/JournalAiInstructionsOverlay.tsx` | Edit / overlay |
| `web/components/ui/MarkdownEditor.tsx` | Shared markdown window |
| `web/components/retrospective/RetroPeriodBrief.tsx` | Standard infographic |
| `migrations/128_journal_prompt_reasoning.sql` | `reasoning_level` |

---

## 5. Architecture (one memory: theirs)

```
writes (journal / retro complete / habit / profile)
        │
        ▼
 compile  ──►  [hot brief — §6]  ──►  turn pack = brief + this transcript
        │
        └──►  period_brief at retro gather (standard tiles)
```

Journal, Retro, Trade Log, Journey stay the books. We **compile**. We do not
merge them into an AI blob.

Retrieve (“what did I say in June?”) is search over **their** messages/retros
when the pack is not enough — not a guessed trait.

---

## 6. Remaining slices (intent — not shipped)

Flagged, not erased. Ship only on Coach GO.

| Slice | Job | Speed note |
|-------|-----|------------|
| **Hot brief** | Persist compile on write (Redis or one-row `member_ai_brief`) | Turn path: 1 read + transcript |
| **Member-visible brief** | They can read and correct “what this assistant may remember” | Skin in the game; no hidden file |
| **Stream** | `complete_stream` on Journal replies | First token, not a late paragraph |
| **Reasoning default** | Daily chat low/medium; high for explicit review | High every turn is slow |
| **Retrieve** | Older journal/retro by question | Don’t dump life history every turn |
| **Shared pack** | Same compile for Journal, Retro, later Help | No per-app snowflakes |
| **Site-wide Edit chrome** | Every Labs app gets the lower-left Edit | Deferred (Coach) |

Typical budget when hot brief lands: load &lt; 20ms; first token as fast as the
model at low/medium; replies stay short (one beat).

---

## 7. Out of scope

- Hidden embeddings as source of truth
- Cross-member memory
- P&L or Journey grades as identity
- Invented emotion / motive
- Replacing the nine-step ceremony with the infographic
- Dual-host Practice vs Labs cutover
- Local-mode probes as the live interview

---

## 8. Acceptance

| # | Criterion | Evidence |
|---|-----------|----------|
| A1 | Admin Save persists instructions + reasoning; next LLM turn uses them | PATCH 200 · mode=`llm` · log |
| A2 | Name: addresses / answers from Profile display name | pack contains name |
| A3 | Pack includes Journey activity, Trade Log process, past journal, retros | `_member_context_pack` tests |
| A4 | Pack never includes P&L amounts or Journey scores | characterization |
| A5 | Retro gather emits `period_brief` with the six tiles + optional last fix + clips | `test_journal_compile_and_one_thing_patch` |
| A6 | Every member sees the same brief layout | `RetroPeriodBrief` |
| A7 | Family B: pack/brief/retrieve scoped to `identity_id` | queries |

---

## 9. Ideas inventory (Phase 0)

| Idea | Disposition |
|------|-------------|
| Desktop-chat personalization + speed | **IN-SCOPE** (ceiling §3.4 · §6) |
| Know Journey, Trade Log, past Journal, retros | **IN-SCOPE** (shipped pack §4.2) |
| Member-by-member memory of activity | **IN-SCOPE** as compile; **FLAGGED** as visible brief |
| Rearrange DB if needed | **IN-SCOPE** for compile/cache; not a merge of product tables |
| Personal assistant for goals | **IN-SCOPE** (hold named goals) |
| Retro start report + standard infographic | **IN-SCOPE** (shipped `period_brief`) |
| Admin instructions system-wide + reasoning | **IN-SCOPE** (shipped) |
| Name / address by name | **IN-SCOPE** (shipped) |
| Site-wide Edit framework | **DEFERRED** (Coach) |
| Vector “second soul” | **OUT** (§2) |

---

## 10. Document history

| Version | Date | Notes |
|---------|------|-------|
| v1.0 | 2026-08-14 | Discovery captured. Shipped pack + period brief + admin Edit. Remaining slices listed. |
