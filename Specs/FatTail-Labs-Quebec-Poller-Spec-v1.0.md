# FatTail Labs — Quebec Poller Spec v1.0

**Status:** Approved as built (2026-07-23)  
**Parents:** Content Board Spec v1.0 · Production Package Spec v1.0 · Cast-HeyGen v1.1  
**Process owner:** Quebec (ops) — **human still owns publish/reject**

---

## 1. Purpose

Provide an **automatic poller** that keeps production board cards moving forward
without requiring a human to click **Quebec tick** after every step.

| Does | Does not |
|---|---|
| Claim queued → scheduled → in_production | Create backlog inventing work |
| Advance sub-stages when artifacts exist | **Publish** or **reject** cards |
| Optionally **produce next missing package stage** | Spend HeyGen unless explicitly enabled |
| Submit to awaiting_approval when package complete | Skip guardian block flags |
| Record status + transitions | Replace human Approve → place |

---

## 2. Process

### 2.1 Tick cycle (`forward_progress`)

Every poll interval:

1. **Column advance** (existing Quebec tick logic).  
2. If `LABS_QUEBEC_AUTO_PRODUCE` enabled: for each `in_production` card (priority order),
   produce **at most one** missing required stage (see §3).  
3. Re-run column/sub-stage advance + attempt `awaiting_approval`.  
4. Persist status to `quebec_poller_status` (id=1).  
5. Emit `actor_events` / board transitions as today.

### 2.2 Poller process

```bash
cd server && set -a && source ../.env && set +a
.venv/bin/python quebec_poller.py
```

Loop: sleep `LABS_QUEBEC_POLL_INTERVAL_SECONDS` → `forward_progress` as actor
`quebec-poller` (agent principal `quebec`, scopes board:operate + ai:run).

**Enabled only when** `LABS_QUEBEC_POLLER=1`. Otherwise process exits immediately (fail loud).

launchd (MiniTwo): `ai.fattail.labs.quebec-poller` — KeepAlive, same `.env` as API.

---

## 3. Auto-produce (next missing stage)

Order follows product_line required stages (course example):

| Stage | Producer |
|---|---|
| `research_pack` | AI bravo/`research_pack` |
| `lesson_plan` | AI november/`lesson_plan` |
| `script` | AI romeo/`lesson_script` (or short script for short product lines) |
| `video_package` | Stub JSON **or** HeyGen dry-run if `LABS_QUEBEC_AUTO_HEYGEN=1` |
| `placement_proposal` | AI papa/`placement_proposal` **or** minimal JSON from title |
| `vision_alignment` | Deterministic markdown (no LLM required) |

**Mode `LABS_QUEBEC_AUTO_PRODUCE_MODE`:**

| Value | Behavior |
|---|---|
| `fixtures` | Synthetic valid task bodies (no LLM keys required) — safe default for poller |
| `live` | Real model via `run_agent_task` (needs XAI/Anthropic keys) |
| `auto` | `live` if primary AI key present, else `fixtures` |

One stage per card per cycle (bounded by `LABS_QUEBEC_MAX_ACTIONS`).

---

## 4. Config

| Env | Default | Meaning |
|---|---|---|
| `LABS_QUEBEC_POLLER` | off | Must be `1` to run poller process |
| `LABS_QUEBEC_POLL_INTERVAL_SECONDS` | 60 | Sleep between cycles (min 15) |
| `LABS_QUEBEC_AUTO_PRODUCE` | off | Fill next missing stage |
| `LABS_QUEBEC_AUTO_PRODUCE_MODE` | `fixtures` | fixtures \| live \| auto |
| `LABS_QUEBEC_AUTO_HEYGEN` | off | Allow dry-run HeyGen for video_package |
| `LABS_QUEBEC_MAX_ACTIONS` | 20 | Cap actions per cycle |
| `LABS_QUEBEC_AUTO` | off | Still required for *non-poller* agent API ticks |

Poller actor is authorized as system operator (does not require `LABS_QUEBEC_AUTO`).

---

## 5. API

| Method | Path | Behavior |
|---|---|---|
| GET | `/api/admin/board/quebec/status` | Poller status row + config flags |
| POST | `/api/admin/board/quebec/tick` | Manual cycle; body `{ force, max_actions, produce? }` |

---

## 6. UI

Board header shows poller chip: **Quebec poller on/off · last run · N actions**  
(from status endpoint). Manual **Quebec tick** remains.

---

## 7. Invariants

1. **Never** transition to `published` or `rejected`.  
2. Open **block** flags stop produce + awaiting_approval for that card.  
3. Evidence: transitions + optional AI invocations + poller status JSON.  
4. Config fail-loud: invalid interval/mode raises at poller start.  
5. Standalone: poller off → board still fully manual.

---

## 8. Verification

`server/tests/test_quebec_poller.py`

- Queued card → after forward_progress → scheduled or in_production  
- With produce=fixtures → research_pack artifact appears  
- Full course package can reach awaiting_approval without human stage paste  
- Publish still requires human  
