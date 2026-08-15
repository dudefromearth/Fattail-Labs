# DECLARATION — P1 retro work-in-progress

**Status:** WAITING — Coach yes required. No files from the pile have been applied.

**Coach instruction (verbatim):**
> re-admission from the pile, one piece at a time, conformance rules
> on. Piece 1: my retro work-in-progress (workspace, domain, API, tests).
> Declare what's in it, which files, what it won't touch. My yes, then
> build with banners, suite green + zero warnings after, show me the retro
> on dev. Then stop. journalBeats.ts never comes back.

## What this piece is

Pile `pile-2026-08-14` retro compile: Retrospective **reads Journal** for the
four questions (said / in the way / worked / next) and asks only for **the
fix** (`one_thing_md`). Workspace “From your journal”; gather emits
`journal_compile`. Pile called this DL-324; that number is already **VP fold**
on `main`. On land we will file a **new** DL number (next free on this
branch), not reuse 324.

## Files to touch (from pile, retro only)

| Path | Change |
|------|--------|
| `server/retrospective_domain.py` | `build_journal_compile`; gather emits `journal_compile`; serialize `one_thing_md` |
| `server/routes/retrospectives.py` | SELECT/INSERT/PATCH `one_thing_md` |
| `server/tests/test_retrospectives.py` | compile + one-thing characterization |
| `web/components/retrospective/RetrospectiveWorkspace.tsx` | compile tiles + one-thing field |
| `web/components/retrospective/RetroPeriodWindow.tsx` | small workspace hook |
| `web/lib/retrospectiveApi.ts` | `one_thing_md` on the client type |
| `migrations/126_retrospective_one_thing.sql` | restore column we dropped in item 3 |
| `Specs/FatTail-Labs-Journal-Retrospective-Spec-v0.7.1.md` | §5.3 only if the pile hunk is that section |
| `Architecture/00-decision-log.md` | new DL for this land (not pile’s 324) |

## What this piece will NOT touch

- `web/lib/journalBeats.ts` — **never comes back**
- Journal v0.7 charter: drafts, confirmations, surfacing, `structured_provenance_json`, `127_journal_v07_charter.sql`
- `server/journal_*.py` other than what compile **reads** (`member_journal_sessions.structured_json` already on main)
- `server/routes/journal_sessions.py`, journal UI, `SessionInterviewChat.tsx`
- Conversation Lab / ConversationSurface
- MiniTwo / production deploy
- Trade-log tables
- Other pile pieces (VP, options, GO process, health was already landed)

## Steps after Coach yes (banners)

1. Alpha — restore mig 126 + domain/API + tests
2. Charlie — workspace + API client
3. Kilo — suite `pytest tests -q` → 913+ passed, 0 warnings
4. Lima — DL entry
5. Show retro on StudioTwo `/app/retrospective` (dev)
6. **STOP**

## Stop and report

After the suite is green and Coach can see the retro on dev. No journal
readmit. No MiniTwo.
