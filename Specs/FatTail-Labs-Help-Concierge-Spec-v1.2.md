# FatTail Labs — AI Help Concierge Spec v1.2 (delta over v1.1)

**Status:** Implemented (2026-08-09, DL-273).
**Builds on:** v1.0 (whitelisted knowledge, guardrails, fail-open escalation) and v1.1
(inactivity close, proactive human, feedback). This version changes **how the model gets
its knowledge** — from a single embedded doc to a lean prompt + on-demand search over a
reference library. Guardrails, escalation, and the answer contract are unchanged.

---

## 1. Why

The v1.0/v1.1 concierge was fed one static file (`help_concierge_kb.md`) embedded whole in
every call. It described the platform only in general terms, so detailed questions ("what
do I learn from each course?", "what does area X do?") had no source and escalated. We want
the bot to answer those without dumping an ever-growing KB into every request.

## 2. Reference library

`server/help_reference/*.md`, each split into `## `-headed sections:
- **overview.md** — what Labs is, membership/tiers, account/sign-in, getting help, limits.
- **app-areas.md** — one section per area of the app (Home/Hub, Courses, Lessons, Live,
  Resources, Pathway, Guide, Profile, Trade Log, Campaigns, Find and Badge, Journal,
  Retrospective, Reports, Journey, Strategy Lab, Practice, Toughness, Community, Wiki,
  Membership, Notifications, Help).
- **courses.md** — the published courses distilled from their real descriptions + a
  recommended learning order.

All member-facing. Adding/editing a doc changes what the bot knows — no code change.

## 3. Retrieval flow (`server/help_ai.py`)

1. **Lean system prompt** — identity, style, the HARD guardrails, and a compact **index**
   (`doc: section; section; …`) so the model knows what's searchable. The reference *text*
   is not included.
2. **Round 1** — the model replies with one JSON object: either
   `{"action":"search","queries":[…]}` or `{"action":"answer","reply","resolved","topic"}`.
   Bare greetings can answer directly.
3. **Search** — for a search action, `_search(queries)` keyword-scores the reference
   sections (heading hits weighted; whole-heading mentions bonus) and returns the top
   `_MAX_SEARCH_SECTIONS` (capped at `_MAX_REF_CHARS`). **Scoped in code to the reference
   folder** — the model can only ever read whitelisted content.
4. **Round 2** — the returned sections are injected and the model answers from them.
   At most one search round (cost/latency).

## 4. Invariants (unchanged + new)

- **Whitelist by construction:** search only ever reads `help_reference/*.md`; the model is
  never handed repo/db/infra/secrets. "Search the database"-style asks can only hit the
  reference docs.
- Read-only; fail-open to a human on any error, unconfigured AI, empty reference, or
  unparseable output. **Unstructured (non-JSON) model output now escalates** rather than
  being shown raw (was shown in v1.0) — safer against hallucination.
- Answer contract unchanged: `{reply, resolved, topic}`; `topic ∈ {bug,struggling,general}`
  always set (auto-classified per v1.1/DL-271).
- May recommend a **learning path**; never personalised financial/trading advice.

## 5. Verification

`server/tests/test_help_ai.py` — reference loads + is searchable, index lists docs, prompt
carries guardrails + index, `_search` matches relevant sections and never dumps on empty,
the **search→answer loop** runs two passes, and every failure path escalates. Live-verified
against Grok locally: the exact member question that used to escalate ("Where is resources?
What do I learn from each course? What do you recommend?") now answers with the Resources
location, course pointers, and a recommended order; course-specific and infra-probe /
prompt-injection cases behave correctly.

## 6. Deploy

Server-only: ships `help_ai.py` + `help_reference/` (removes `help_concierge_kb.md`). **No
migration, no web build.** Apply + restart the API.

## 7. Deferred to v1.3+

- Self-improving loop (admin Questions dashboard: most-asked / unanswered / escalation-rate
  / 👎'd → curated answers fed back into the reference).
- Populate the courses' structured fields (`short_description`, `learning_outcomes_json`)
  and optionally retrieve them live instead of the hand-distilled `courses.md`.
- Pass the member's tier so recommendations are tier-aware.
- Streaming replies; image-aware bug reports.
