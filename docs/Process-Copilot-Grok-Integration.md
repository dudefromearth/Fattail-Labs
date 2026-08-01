# Process Co-pilot × Grok — full knowledge integration

**Goal:** Grok reasons as a true production peer — taxonomy, workflow, package contracts, live card status, and operator direction — not a blank chatbot with a thin prompt.

**Related specs:**  
- `Specs/FatTail-Labs-Production-Process-Visibility-Copilot-Spec-v1.0.md`  
- `server/process_copilot_knowledge.py` (static pack)  
- `server/process_copilot.py` (runtime)

---

## 1. What “full knowledge” means

| Layer | Source | Role |
|---|---|---|
| **A. Taxonomy** | Curated pack from Content Types Taxonomy + legacy board lines | What each product *is for* |
| **B. Board workflow** | Content Board columns + transition meanings | Where the card sits in human process |
| **C. Package contracts** | `packages.REQUIRED_STAGES` (live import) | What must be complete to approve |
| **D. Course factory** | Skill sequence (blueprint → … → package) | How courses are built |
| **E. Live card** | Snapshot each turn | What *this* card has done / missing |
| **F. Operator playbook** | Stuck-state recipes + UI controls | How to direct *you* |
| **G. Doctrine / CGE bounds** | Process outcomes; no idea-finder in course | Guardrails |

Grok only shines when **A–F are in the prompt** every turn. Snapshot alone is not enough for “what is a coaching short?”

---

## 2. Architecture (target = mostly as-built)

```text
Operator message
      │
      ▼
┌─────────────────────────────────────┐
│ process_copilot.chat()              │
│  1. build LIVE snapshot (card)      │
│  2. load STATIC knowledge pack      │
│  3. focus slice for product_line    │
│  4. system + knowledge + live + history│
│  5. complete() via Grok (xAI)       │
│  6. persist turns; parse artifacts  │
└─────────────────────────────────────┘
      │
      ▼
UI: ProcessCopilotPanel (log + Apply)
```

**Not required for v1 full knowledge:** vector RAG over entire `Specs/` tree.  
**Preferred:** curated pack (A–F) that cannot drift from `REQUIRED_STAGES` (imported from code).

---

## 3. What we need to do (checklist)

### Done / in repo

| Item | Status |
|---|---|
| Process co-pilot API + UI | Done |
| Live card snapshot | Done |
| Auto-fallback if no API key | Done |
| **Static knowledge pack** (`process_copilot_knowledge.py`) | **Done (this pass)** |
| Inject pack + product_line focus into every Grok turn | **Done (this pass)** |
| Fixture answers for taxonomy questions | **Done (this pass)** |

### You / ops (required for full Grok reasoning)

| Item | Why |
|---|---|
| **Set `XAI_API_KEY` in `Fattail-Labs/.env`** | Without it, co-pilot uses local fallback (good guidance, not full Grok) |
| **Restart uvicorn** after key change | Config is read at runtime |
| **Hard-refresh board** | UI already rebuilt when you last restarted |

Optional: `LABS_AI_PRIMARY_MODEL=grok-4.5` (default).

### Engineering next (optional upgrades)

| Priority | Item | Value |
|---|---|---|
| P1 | Raise `max_tokens` default for co-pilot (e.g. 6k–8k) when answering long taxonomy+plan questions | Fuller answers |
| P1 | Streaming SSE (like blueprint chat) | Better UX while Grok thinks |
| P2 | “Refresh knowledge version” chip in UI showing pack version | Trust |
| P2 | Load Content Vision body into snapshot (already binding on board) | Vision-aware advice |
| P2 | Tool-calling: co-pilot proposes transition; UI confirm button | Tighter control loop |
| P3 | Light retrieval: attach 1–2 skill SKILL.md excerpts when operator asks “how does course-lesson-script work?” | Skill depth without full RAG |
| P3 | Persist handoff_v1 on card for co-pilot to narrate | Multi-agent evidence |
| P3 | Full WFM run/step records | True “workflow engine” status |

---

## 4. Prompt contract (what Grok sees)

Each live turn includes, in order:

1. **System role** — Process co-pilot instructions (reasoning style + output fences)  
2. **STATIC KNOWLEDGE PACK** — taxonomy, columns, package contracts, course factory, playbook  
3. **THIS PRODUCT LINE FOCUS** — entry + required stages for *this* card  
4. **LIVE CARD SNAPSHOT** — checklist, artifacts, flags, transitions  
5. **Recent chat turns** (last 16)  
6. **User message**

**Rules enforced in prompt:**

- Conceptual answers → knowledge pack  
- Done/missing → live snapshot only  
- Mismatch product_line vs intent → call out  
- No invented stage completion  

---

## 5. How you’ll know it’s working

| Ask | Expect |
|---|---|
| “What is the goal of a coaching short?” | Goal + shape + required stages + v1 legacy note |
| “What’s next on this card?” | Missing stages from checklist + one UI action |
| “Should this be a course instead?” | Compare intent to taxonomy; recommend product_line change if multi-module |
| “Draft the next missing stage” | ` ```artifact ` block with correct stage key |

If answers ignore the card’s missing list → snapshot bug.  
If answers don’t know taxonomy → knowledge pack not loaded (restart API).  
If always “fallback / XAI_API_KEY” → set key.

---

## 6. Maintenance rule

When you change:

- `packages.REQUIRED_STAGES` → pack picks it up automatically  
- Taxonomy / board meaning → edit `process_copilot_knowledge.py` and bump `KNOWLEDGE_VERSION`  
- Course skill order → update `COURSE_FACTORY` in that file  

Do **not** paste entire Specs folders into the prompt (noise, cost, drift).

---

## 7. Minimal path for you this week

1. Add `XAI_API_KEY=…` to Labs `.env`  
2. Restart API (`uvicorn` on :4000)  
3. Open Stop the bleeding → Process co-pilot  
4. Ask: *“What is a coaching short, and given this card’s checklist, what is my single next step?”*  

You should get taxonomy + this-card direction in one Grok answer.
