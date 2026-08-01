# FatTail Labs — Handoff Contract v1.0

**Status:** Active  
**Schema:** `Specs/schemas/handoff-v1.json`  
**Parents:** Production skills · Content Board · `docs/CGE-Skills-Course-Integration-Plan.md`  
**Decisions:** DL-handoff-v1 (docs-first; board persistence later)

---

## 1. Purpose

A **handoff** is the structured message between skills (and humans) that says:

- What finished  
- What the next skill must have  
- What is still missing  
- What constraints never bend  

Chat and long threads are **not** handoffs. After **Approve Blueprint**, the factory advances by **skills + handoffs + package stages**, not by “continue the conversation.”

---

## 2. Two representations

| Form | Role |
|---|---|
| **JSON** (`handoff_version: "1.0"`) | Normative; verify checklists; future board/API |
| **Markdown fence** | Human/agent readable twin; same fields |

Skills **must** document both: emit JSON when writing package metadata; MD is fine in artifacts and Grok sessions.

### 2.1 Markdown twin (canonical layout)

```text
---
HANDOFF → <to_skill>
from: <from_skill>
card_id: <id or TBD>
product_line: course
blueprint_version: <n or null>
inputs_resolved:
  <key>: <ref or value>
inputs_missing: []
constraints: [plan_locked, process_outcomes_only, ...]
voice_profile_ref: <optional>
artifacts_out_expected: [<stage or name>]
human_gate: <null | Approve Blueprint | Approve Package | …>
notes: <one line optional>
---
```

---

## 3. Normative fields

| Field | Required | Meaning |
|---|---|---|
| `handoff_version` | yes | `"1.0"` |
| `from_skill` | yes | Skill that completed work |
| `to_skill` | yes | Next skill (or `human` / `none`) |
| `card_id` | yes if board run | Content board item id |
| `product_line` | yes | `course` \| `tutorial` \| `youtube_long` \| `campaign` |
| `blueprint_version` | course after BP | Integer or null pre-approve |
| `timestamp` | recommended | ISO-8601 |
| `inputs_resolved` | yes | Map of keys the **receiver** can rely on |
| `inputs_missing` | yes | Array; **empty** to proceed; non-empty → **Red** / fail loud |
| `constraints` | yes | String tags (see §5) |
| `voice_profile_ref` | no | Package artifact id/path for VO craft |
| `artifacts_out_expected` | yes | What receiver must produce |
| `human_gate` | no | If set, factory waits; not a failure |
| `notes_md` | no | Short context only — not structure |

---

## 4. Hard rules

1. **Fail loud** if `inputs_missing.length > 0` — do not invent inputs.  
2. **No chat as structure** — modules/lessons/claims come from approved blueprint, `lesson_plan`, `research_pack`, not scrollback.  
3. **Constraints are inherited** unless an explicit later handoff removes one (document why).  
4. **Never silent-publish** — `no_silent_publish` is always implied for course factory.  
5. **One primary consumer** per handoff (`to_skill`); fan-out = multiple handoff objects.  

---

## 5. Standard constraints (course)

| Tag | Meaning |
|---|---|
| `process_outcomes_only` | No profit guarantees / get-rich framing |
| `plan_locked` | VO must map to plan beats |
| `claims_trace_to_research` | Trading assertions → research claim ids or FILL IN |
| `one_primary_idea_per_lesson` | No whole-course dumps |
| `no_silent_publish` | Human publish only |
| `blueprint_approved` | Expensive stages only after gate 1 |
| `no_performance_porn` | No equity-as-proof flex |
| `edit_brief_optional` | Video may run without edit brief |
| `edit_brief_preferred_live` | Prefer edit pass before live HeyGen |

---

## 6. Course pipeline map (emit → consume)

| From | To | Critical `inputs_resolved` |
|---|---|---|
| `course-blueprint` (approved) | research / KC / resources / script | `blueprint_version`, outline ref |
| `course-research` | plan polish / script | `research_pack_ref` |
| `course-lesson-plan` | script | `lesson_plan_ref`, `lesson_slugs[]` |
| `course-lesson-script` | `course-lesson-edit` or `course-lesson-video` | `script_ref`, `lesson_slugs[]`, `voice_profile_ref?` |
| `course-lesson-edit` | `course-lesson-video` | `script_ref`, `script_edit_brief_ref` |
| `course-lesson-video` | placement | `video_package_ref` |
| `course-placement` | vision / package | `placement_proposal_ref` |
| `course-package` | human | full stages; `human_gate: Approve Package` |

---

## 7. Example — plan → script

```json
{
  "handoff_version": "1.0",
  "from_skill": "course-lesson-plan",
  "to_skill": "course-lesson-script",
  "card_id": "item_123",
  "product_line": "course",
  "blueprint_version": 2,
  "timestamp": "2026-08-01T12:00:00Z",
  "inputs_resolved": {
    "lesson_plan_ref": "artifact://lesson_plan",
    "research_pack_ref": "artifact://research_pack",
    "lesson_slugs": ["tent-whisper", "take-the-runner"]
  },
  "inputs_missing": [],
  "constraints": [
    "blueprint_approved",
    "plan_locked",
    "claims_trace_to_research",
    "one_primary_idea_per_lesson",
    "process_outcomes_only",
    "no_silent_publish"
  ],
  "voice_profile_ref": "artifact://voice_profile",
  "artifacts_out_expected": ["script"],
  "human_gate": null,
  "notes_md": "Pilot module: stop the bleed"
}
```

---

## 8. Verify (any skill)

- [ ] Emits handoff with `handoff_version`, `from_skill`, `to_skill`  
- [ ] `inputs_missing` empty before claiming Green  
- [ ] `inputs_resolved` keys match receiver’s SKILL.md required inputs  
- [ ] Constraints include `no_silent_publish` for member-bound work  

---

## 9. Out of scope v1.0

- DB table / board UI for handoff history (Phase 5)  
- Cross-card handoffs  
- Automatic idea-finder → blueprint (forbidden by integration plan)  
