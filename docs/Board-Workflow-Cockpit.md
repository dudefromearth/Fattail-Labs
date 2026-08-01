# Board workflow cockpit (operator guide)

**Normative spec:** [`Specs/FatTail-Labs-Production-Process-Visibility-Copilot-Spec-v1.0.md`](../Specs/FatTail-Labs-Production-Process-Visibility-Copilot-Spec-v1.0.md)

**Why this exists:** Adding artifacts and dragging columns felt opaque — no clear “where am I / what’s next / did that work?” loop. The **Workflow cockpit** on course cards makes the factory talk back; the **Process co-pilot** is the always-on AI peer for the full card lifecycle.

## Open a course card

`/admin/board` → click the card. At the **top** of the drawer:

0. **Process co-pilot** — AI peer for the **entire** lifecycle (any column). Ask where you are, diagnose RED, draft missing artifacts, one-click **Apply** when it proposes a fenced artifact.  
1. **Readiness** — GREEN / RED / IDLE in plain language  
2. **Where this card is** — column + sub-stage + cast + what that column means  
3. **Course factory path** — numbered steps (Blueprint → Research → … → Package approve)  
4. **Package checklist** — human labels + stage keys  
5. **What to do next** — single primary CTA when possible  
6. **Add package artifact** — attach script/research/etc. and get feedback on what is still missing  
7. **Recent process activity** — transitions  

### Process co-pilot (all product lines)

- **API:** `GET/POST /api/admin/board/items/{id}/process-chat`  
- **Storage:** `content_item_process_chat` (migration 063)  
- **Context:** live card JSON (status, checklist, artifacts preview, flags, blueprint)  
- **Not** blueprint chat — that remains for Header+Outline structure only  
- **Fixtures:** checkbox for offline demos without API keys  

Quick prompts: “Where am I?”, “Is anything stuck?”, “What’s missing?”, “Draft the next stage.”  

## Mental model

| Concept | Meaning |
|---|---|
| **Board column** | Human process state (draft → queued → … → published) |
| **Package stages** | Evidence the course is buildable (research, plan, script, video, placement, vision) |
| **Blueprint approve** | **First gate** — freezes outline before expensive work |
| **Package approve** | **Second gate** — human accepts full package → draft course |

Script alone ≠ done. Script is **one** required stage. The cockpit shows the rest.

## Recommended path after “Stop the Bleed” script

1. **Approve Blueprint** if not already (structure first).  
2. Ensure **research_pack** + **lesson_plan** artifacts exist (or Tick + produce fixtures).  
3. **script** artifact (you added this) — cockpit should show ✓ Scripts.  
4. Optional **script_edit_brief** for live HeyGen.  
5. Assign **cast** → Produce HeyGen or map YouTube ids → **video_package**.  
6. **placement_proposal** + **vision_alignment**.  
7. **Submit for approval** → human Approve.

## Controls that still live elsewhere in the drawer

- Blueprint co-pilot chat  
- Cast + HeyGen produce / YouTube map  
- Flags, raw artifact list, column buttons at bottom  

## Not yet (WFM Phase later)

- Full Workflow Manager run records  
- Email on every Red edge  
- Auto-orchestration without Tick  

The cockpit is the **human control surface** until WFM owns step execution.
