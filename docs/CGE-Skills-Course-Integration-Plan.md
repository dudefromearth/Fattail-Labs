# Plan: CGE Skill Upgrades × Course Builder Integration

**Status:** **Accepted** (defaults 2026-08-01) · Phases 1–4 docs/skills landed  
**Parents:**  
- FatTail Labs course skill pack — `skills/course/`  
- CGE Grok YouTube pack — `/Users/ernie/YouTube/CGE Grok Skill Bundle Full/`  
- Content Types Taxonomy (frozen) — Course · Tutorial · YouTube Long · Campaign  
- **Production Process Visibility & Co-pilot Spec v1.0** — board cockpit + process AI  
**Owners (proposed):** Quebec (orchestration / handoffs) · Romeo (script) · Papa (video/edit brief) · Coach (gates, voice, doctrine)

---

## 1. Intent

Upgrade production skills so that:

1. **Course factory** gains better lesson VO craft and production blueprints without importing acquisition packaging.  
2. **Handoff structure** becomes a shared contract across course skills (and later all product lines).  
3. **CGE YouTube skills** stay excellent for public channel work, with clear boundaries so they never bypass Labs gates.

### 1.1 Decisions already locked (this plan assumes)

| Decision | Rationale |
|---|---|
| **Do not** integrate `video-idea-finder` or `holy-trifecta` into `course-create` | Acquisition/packaging contracts conflict with plan-locked curriculum |
| **Do** mine `scriptwriter` + `editor-notes` for course script/video stages | Same stage family: VO → production brief → video |
| **Do** generalize CGE-style **HANDOFF blocks** into Labs | Portable, fail-closed, multi-skill pipeline utility |
| Chat remains co-pilot; **approved blueprint + package stages** remain SoR | Existing Labs doctrine |

### 1.2 Non-goals (v1 of this plan)

- Porting full CGE pack into Labs as-is  
- Auto-generating course blueprints from YouTube Icahn research  
- Auto-publishing YT or member content  
- Replacing HeyGen / cast registry / CCM  
- Building full `youtube_long` skill pack (optional phase later)  
- Changing Observer pricing or trial length product policy (only how CTAs appear in VO)

---

## 2. Target architecture

```text
┌─────────────────────────────────────────────────────────────────┐
│  SHARED: handoff_v1 envelope (+ optional human-readable MD)     │
│  from / to / inputs_resolved / inputs_missing / artifacts[]     │
│  human_gate? / constraints[] / voice_profile_ref?               │
└────────────────────────────┬────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
 course-create          (later) tutorial     (later) youtube_long
        │
        ├─ blueprint ★ human
        ├─ research
        ├─ KC / resources
        ├─ course-lesson-script  ←── upgraded (CGE scriptwriter patterns)
        ├─ course-lesson-edit    ←── NEW optional (CGE editor-notes patterns)
        ├─ course-lesson-video
        ├─ placement → vision → package ★ human
        └─ never silent publish
```

**Public CGE pack** (YouTube workspace / optional future `skills/youtube-long/`):

```text
idea-finder → holy-trifecta → scriptwriter → editor-notes
            → retention → post-upload → launch-opt
            (monetization parallel)
```

No arrow from idea-finder/trifecta into `course-create`. Optional **manual** seed only: Coach pastes process themes into card `intent_md` / blueprint chat — never automated from Icahn titles.

---

## 3. Workstreams

### Workstream A — Shared handoff contract (`handoff_v1`)

**Problem:** Skills document handoffs in prose; workers and humans re-parse chat; missing inputs are soft-failed.

**Solution:** One envelope shape used by every course skill (then other types).

#### A.1 Schema (normative draft)

```json
{
  "handoff_version": "1.0",
  "from_skill": "course-lesson-plan",
  "to_skill": "course-lesson-script",
  "card_id": "string",
  "product_line": "course",
  "blueprint_version": 1,
  "timestamp": "ISO-8601",
  "inputs_resolved": {
    "lesson_plan_ref": "artifact://…",
    "research_pack_ref": "artifact://…",
    "lesson_slugs": ["…"]
  },
  "inputs_missing": [],
  "constraints": [
    "process_outcomes_only",
    "plan_locked",
    "claims_trace_to_research",
    "one_primary_idea_per_lesson",
    "no_silent_publish"
  ],
  "voice_profile_ref": "optional://coach-ernie-v1",
  "artifacts_out_expected": ["script"],
  "human_gate": null,
  "notes_md": "optional short context"
}
```

**Rules:**

1. If `inputs_missing` non-empty → **Red** / fail loud; do not invent.  
2. Downstream skills **must not** read chat logs for structure.  
3. Human-readable twin allowed:

```text
---
HANDOFF → course-lesson-script
from: course-lesson-plan
card_id: …
lesson_slugs: […]
constraints: plan_locked, claims_traced, one_primary_idea
voice_profile_ref: coach-ernie-v1
---
```

4. Board/package stores JSON; MD is export/view for agents and Coach.

#### A.2 Deliverables

| # | Deliverable | Location (proposed) |
|---|---|---|
| A1 | Spec: Handoff Contract v1.0 | `Specs/FatTail-Labs-Handoff-Contract-v1.0.md` |
| A2 | JSON Schema | `Specs/schemas/handoff-v1.json` (+ `server/schemas/` if validated in API) |
| A3 | Update every `skills/course/*/SKILL.md` **Handoff** section to emit/consume `handoff_v1` | `skills/course/` |
| A4 | `course-create` sequence diagram with envelopes | `skills/course/course-create/SKILL.md` |
| A5 | Optional: board artifact type `handoff` or stage metadata field | migration only if persisting on card |

#### A.3 Verify

- [ ] Each course skill documents required `inputs_resolved` keys  
- [ ] Fixture: mock plan → script handoff fails when `lesson_plan_ref` missing  
- [ ] No skill claims “continue chat” as handoff mechanism after blueprint approve  

---

### Workstream B — Upgrade `course-lesson-script` (from CGE scriptwriter)

**Problem:** Course VO is plan-locked and claims-safe, but under-specified for *voice*, FILL IN discipline, and human seasoning (sous-chef).

**Solution:** Keep Labs invariants; import craft patterns only.

#### B.1 Patterns to import

| Pattern | Source | Course adaptation |
|---|---|---|
| **Voice profile** | CGE scriptwriter | One reusable profile artifact per cast/instructor; confirm-or-extract once |
| **Sous-chef / v1** | CGE | Script is proposal-state until Hotel/Tango/Coach gate; creator stories via FILL IN |
| **FILL IN markers** | CGE | No invented stats/names/dollars; `[FILL IN: …]` or research claim id |
| **Anti-fragile lists** | CGE | If plan asks for N examples, draft ~1.5N labeled “human cuts to N” |
| **Spoken voice rules** | CGE | Numeric always; no coaching clichés; no year stamps in VO; complete sentences |
| **Section labels** | CGE | Teleprompter navigation headers matching plan beats |
| **Coverage matrix** | Labs (keep) | Plan beat → script section (existing; make mandatory in verify) |

#### B.2 Patterns to reject in course VO

| Reject | Why |
|---|---|
| Full YT cold-open trifecta (number-shock / myth-attack package) as required | Packaging, not lesson pedagogy |
| Mid-roll monetization CTA as default | Course = capacity pathway; CTA in header/resources/placement, not every lesson |
| Multi-point 12-minute “whole module” scripts | Violates one primary idea per lesson |
| YAP as claim authority | YAP = voice/story color only; claims → research |

#### B.3 Optional input: external script seed

Allow **map/reference** of an existing public script (e.g. Stop the Bleed YT cut) as:

- `voice_reference_md` or path in `inputs_md`  
- **Not** a substitute for plan beats  
- Romeo extracts tone + examples; rewrites plan-locked lessons  

#### B.4 Deliverables

| # | Deliverable |
|---|---|
| B1 | Revise `skills/course/course-lesson-script/SKILL.md` (inputs, steps, verify, handoff_v1) |
| B2 | Template: `script` artifact layout (per-lesson VO + callouts slot + coverage matrix + doctrine lint) |
| B3 | Voice profile template + storage note (`docs/studio/` or package artifact `voice_profile`) |
| B4 | Pilot: rewrite **one** lesson from “Stop the Bleed” doctrine as plan-locked sample (artifact in `docs/studio/` or exports) |
| B5 | Romeo bench note / agent checklist update if bench docs reference script stage |

#### B.5 Verify

- [ ] Script without plan → fail  
- [ ] Script with new trading claim without research id → fail / Hotel flag  
- [ ] Voice profile present or explicit “generic cast voice”  
- [ ] Coverage matrix complete  
- [ ] FILL IN list exported for Coach before video  

---

### Workstream C — Optional `course-lesson-edit` (from CGE editor-notes)

**Problem:** On-screen/B-roll callouts are a single line in script skill; Papa still guesses retention-critical moments.

**Solution:** Optional second pass on **locked** VO before `course-lesson-video`.

#### C.1 Skill sketch

| Field | Value |
|---|---|
| Name | `course-lesson-edit` |
| Owner | Papa (or Romeo→Papa) |
| Package stage | still `script` enrichment **or** sub-artifact `script_edit_brief` |
| When | After script proposal accepted / Coach “lock VO”; before live render |
| Skip | Map-only video path; fixture mode |

**Outputs (per lesson):**

- Inline notes: `[TEXT ON SCREEN]`, `[CUT]`, `[EMPHASIS]`, `[B-ROLL]` (simple/clean only)  
- `RETENTION RISK` per section (low/medium/high + why)  
- Editor summary: pacing, priority sections, tools (HeyGen vs human)  
- No dialogue rewrites unless `[SUGGEST TIGHTENING]` (human accepts)

**Priority rule (from CGE):** densest notes on (1) first 30s of lesson, (2) any assessment/CTA-adjacent beats, (3) high retention-risk sections.

#### C.2 Deliverables

| # | Deliverable |
|---|---|
| C1 | New `skills/course/course-lesson-edit/SKILL.md` |
| C2 | Wire into `course-create` as **optional** step 5b (default on for live HeyGen; off for map-only) |
| C3 | Handoff: `course-lesson-script` → `course-lesson-edit` → `course-lesson-video` |
| C4 | Update `course-lesson-video` inputs: prefer `script` + `script_edit_brief` when present |
| C5 | Pilot edit brief on Stop the Bleed–derived lesson |

#### C.3 Verify

- [ ] Edit brief does not invent claims  
- [ ] B-roll suggestions executable without stock spam  
- [ ] Summary lists high-risk sections  
- [ ] Video skill accepts script-only if edit skipped  

---

### Workstream D — CGE YouTube pack upgrades (channel-side only)

Keep pack in YouTube workspace; tighten boundaries and handoffs so future Labs `youtube_long` can reuse cleanly.

#### D.1 Scope

| Skill | Action |
|---|---|
| `video-idea-finder` | **No course integration.** Optional: export “theme seed” MD for Coach paste into intent only |
| `holy-trifecta` | **No course integration.** Stays YT packaging |
| `scriptwriter` | Align handoff_v1 MD; add optional “course_seed_stub” *out* only if Coach enables (module title ideas — not auto-import) |
| `editor-notes` | Align output section names with `course-lesson-edit` for copy-paste reuse |
| `retention-pass` / `post-upload` / `launch-optimization` / `monetization` | Unchanged for course; remain YT ops |

#### D.2 Deliverables

| # | Deliverable |
|---|---|
| D1 | `CGE Grok Skill Bundle Full/INTEGRATION.md` — boundary map + handoff_v1 MD subset |
| D2 | Normalize all CGE skill **HANDOFF** blocks to same field order |
| D3 | `scriptwriter` / `editor-notes`: add “Labs course mode” appendix (plan-lock, no trifecta, no Icahn) for dual use in Grok when cwd is Labs |
| D4 | README: explicit “not for course-create stages 1–2” |

#### D.3 Verify

- [ ] New operator can see which skills are YT-only vs course-shared craft  
- [ ] No CGE skill claims to approve blueprints or place courses  

---

### Workstream E — Pipeline orchestration (course-create + WFM)

#### E.1 Sequence (target)

```text
course-create
  1  course-blueprint          ★ human Approve Blueprint
  2  course-research
  3  course-knowledge-check
  4  course-resources
  5  course-lesson-script       (upgraded)
  5b course-lesson-edit        (optional)
  6  course-lesson-video
  7  course-placement
  8  course-vision
  9  course-package             ★ human Approve Package
```

Each arrow carries `handoff_v1`.

#### E.2 Deliverables

| # | Deliverable |
|---|---|
| E1 | Update `course-create/SKILL.md` sequence + optional 5b |
| E2 | Update `skills/course/README.md` inventory table |
| E3 | Note in WFM / Production Package spec if stage list gains `script_edit_brief` |
| E4 | Board UX (later): show last handoff + missing inputs on card |

---

### Workstream F — Optional later: `youtube_long` skill pack

**Not required for course upgrade.** When ready:

- New pack under `skills/youtube-long/`  
- Port CGE idea-finder, holy-trifecta, scriptwriter, editor-notes, post-upload as Labs-formatted skills  
- Reuse `handoff_v1`, `course-research` (claims), `course-vision`  
- Placement = YT metadata + optional library card — **not** multi-module course  

Gate: taxonomy already frozen; no new card type.

---

## 4. Phased rollout

### Phase 0 — Align (0.5–1 day)

- Coach signs non-goals (no idea-finder/trifecta in course-create).  
- Confirm optional vs required for `course-lesson-edit`.  
- Confirm voice profile storage preference (package artifact vs `docs/studio/`).

**Exit:** This plan marked Accepted (or revised).

### Phase 1 — Handoff contract (foundation)

**Workstream A** complete enough that script skill can implement it.

**Exit:** Spec + schema + at least `course-lesson-plan` → `course-lesson-script` documented against schema.

### Phase 2 — Script skill upgrade + pilot

**Workstream B** + pilot lesson from Stop the Bleed doctrine.

**Exit:** Upgraded SKILL.md; one sample script artifact with coverage matrix + FILL INs; Romeo can run without CGE pack.

### Phase 3 — Edit brief skill + video input

**Workstream C** + wire optional 5b + video skill input.

**Exit:** One sample edit brief; Papa checklist uses retention priorities.

### Phase 4 — CGE pack hygiene

**Workstream D** in YouTube bundle.

**Exit:** INTEGRATION.md + consistent handoffs; dual-mode appendix on scriptwriter/editor-notes.

### Phase 5 — Orchestration docs + light board (as capacity allows)

**Workstream E**; board display of handoff state if engineering slot exists.

**Exit:** course-create README accurate; no dead references.

### Phase 6 — (Optional) youtube_long pack

**Workstream F** when channel factory should live inside Labs board.

---

## 5. File / skill inventory (expected end state)

### FatTail Labs

| Path | Action |
|---|---|
| `Specs/FatTail-Labs-Handoff-Contract-v1.0.md` | **Create** |
| `Specs/schemas/handoff-v1.json` | **Create** |
| `skills/course/course-lesson-script/SKILL.md` | **Upgrade** |
| `skills/course/course-lesson-edit/SKILL.md` | **Create** |
| `skills/course/course-lesson-video/SKILL.md` | **Update inputs** |
| `skills/course/course-create/SKILL.md` | **Update sequence** |
| `skills/course/README.md` | **Update inventory** |
| `skills/course/course-*/SKILL.md` (others) | **Handoff sections** |
| `docs/CGE-Skills-Course-Integration-Plan.md` | **This plan** |
| `docs/studio/…` pilot artifacts | **Create** (sample script + edit brief) |

### CGE Grok bundle (`YouTube/CGE Grok Skill Bundle Full/`)

| Path | Action |
|---|---|
| `INTEGRATION.md` | **Create** (boundary + handoff mirror) |
| `src/scriptwriter/SKILL.md` | **Appendix: Labs course mode** |
| `src/editor-notes/SKILL.md` | **Appendix: Labs lesson-edit parity** |
| All `src/*/SKILL.md` | **Normalize HANDOFF blocks** |
| Project `.grok/skills/` copies | **Re-install / sync after edits** |

### Explicitly unchanged for course-create

- `video-idea-finder`, `holy-trifecta`  
- Blueprint gate, CCM, resources domain, HeyGen budget ledger  

---

## 6. Pilot: Stop the Bleed bridge (validation story)

Use the existing public cut as **doctrine source**, not auto-course:

1. Coach / November: blueprint module e.g. **Profit management — stop the bleed** with 3–5 lesson stubs (one idea each).  
2. Approve Blueprint.  
3. Research: claim-map tent frequency, debit=max, process language only.  
4. Upgraded script skill: one lesson VO (e.g. “The tent whisper”) plan-locked + voice profile from Coach scripts.  
5. Optional edit brief from editor-notes patterns.  
6. Video: HeyGen **or** map existing YT id for free-preview lesson.  
7. Resources: runner checklist PDF from editor graphics list.  
8. Vision + package gates.

**Success:** Member lesson teaches the habit; public YT remains acquisition; no Icahn title in catalog.

---

## 7. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Scriptwriter patterns dilute plan-lock | Coverage matrix mandatory; fail without plan |
| Edit brief becomes rewrite desk | Only `[SUGGEST TIGHTENING]`; no silent dialogue change |
| Handoff schema ignored in practice | Start with skill docs + verify checklists; API validation in phase 5 |
| Dual CGE/Labs copies drift | Single “craft source” note: course skills are SoR for Labs; CGE appendix points to Labs skill names |
| CTA / monetization leaks into lessons | Constraint list on handoff; Tango lint |
| Scope creep into youtube_long | Phase 6 optional; do not block Phases 1–4 |

---

## 8. Success metrics

| Metric | Target |
|---|---|
| Course script stage runnable with voice + FILL IN + coverage | Phase 2 exit |
| Optional edit brief used on ≥1 live HeyGen lesson | Phase 3 exit |
| All course skills document handoff_v1 fields | Phase 1–5 |
| Zero automation path from idea-finder → blueprint | Ongoing |
| Operator clarity: YT skills vs course skills | INTEGRATION.md exists; Coach can explain in one minute |

---

## 9. Decisions (Coach: defaults accepted 2026-08-01)

| # | Question | **Locked default** |
|---|---|---|
| 1 | `course-lesson-edit` required? | **Optional** skill. **Default ON** for live HeyGen renders; **OFF** for map-only / fixture video paths. |
| 2 | Voice profile storage | **Package artifact** `voice_profile` (markdown/JSON on card/package). Studio cast registry remains for face/voice IDs only. |
| 3 | Stop the Bleed pilot free_preview? | **Yes, preferred** for pilot free-preview lesson + YT description link; not a product-wide rule. |
| 4 | Persist handoffs on board in v1? | **Docs + schema first.** Skill verify uses `handoff_v1` shape. Board persistence / API validation = later (Phase 5). |
| 5 | Map existing YT into member lessons? | **Allowed** (existing `course-lesson-video` map-only path). Re-render cast preferred when branding/consistency matters; not banned. |

**Status:** Plan **Accepted** with defaults above.

---

## 10. Immediate next actions

1. ~~Answer open questions (§9).~~ **Done — defaults locked.**  
2. Author **Handoff Contract v1.0** spec + schema (Phase 1).  
3. Patch **`course-lesson-script`** + create **`course-lesson-edit`** (Phases 2–3).  
4. Sync CGE `INTEGRATION.md` + skill handoffs (Phase 4).  
5. Wire `course-create` / course README sequence.

---

## 11. Revision history

| Date | Change |
|---|---|
| 2026-08-01 | Initial draft from CGE pack trial + course skill pack review |
| 2026-08-01 | Defaults accepted; plan Accepted; implementation started |
