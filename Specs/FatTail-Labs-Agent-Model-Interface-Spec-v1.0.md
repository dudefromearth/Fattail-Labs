# FatTail Labs — Agent Model Interface Spec v1.0

**Status:** Approved as built (2026-07-23)  
**Context:** P2 agentic operating layer needs a single, config-driven way for agents and
workflows to call foundation models. Primary provider is **xAI Grok**; secondary is
**Anthropic Claude**.  
**Parent:** `agents/p2-foundation/CHARTER.md`  
**Decision log:** 2026-07-23 "Agent model interface: Grok primary, Claude secondary"

---

## 1. Purpose

Give the system a **governed LLM interface** so Quebec, specialists, and workflows can
invoke models without hardcoding vendor SDKs, keys, or model IDs in agent prompts.

This interface does **not** expose chat to members. It is for **operator / agent runtime**
use (research packs, lesson plans, scripts, board orchestration helpers).

---

## 2. Standard model policy

| Priority | Provider | Default model ID (env-overridable) | Env key |
|---|---|---|---|
| **Primary** | xAI (Grok) | `grok-4.5` | `XAI_API_KEY` |
| **Secondary** | Anthropic (Claude) | `claude-sonnet-4-5` | `ANTHROPIC_API_KEY` |

Rules:

1. **Default every completion** uses the primary (Grok) unless the caller asks for
   secondary or `prefer="auto"` falls back after a primary provider failure.
2. **No other vendors** in v1.0 (no OpenAI, Gemini, etc.). Adding a vendor is a new
   spec version.
3. **No silent defaults for keys.** Missing keys fail loud when a completion is attempted
   against that provider — not with a fabricated response.
4. **Boot does not require AI keys** (same pattern as optional Stripe). The platform
   boots without AI; the AI subsystem fails when used without configuration.
5. **Never log API keys** or full prompt bodies at info level in production paths that
   might ship to shared logs (errors may include provider message text only).

---

## 3. Public Python interface

Package: `server/ai/`

```python
from ai import complete, get_model_for, describe_ai_status, AiError

result = complete(
    messages=[
        {"role": "system", "content": "..."},
        {"role": "user", "content": "..."},
    ],
    *,
    agent="bravo",          # optional callsign → profile
    prefer="primary",       # primary | secondary | auto
    model=None,             # optional explicit model id (must be registered)
    temperature=0.2,
    max_tokens=4096,
)
# result.text, result.provider, result.model, result.usage
```

| Symbol | Behavior |
|---|---|
| `complete(...)` | Synchronous chat completion; returns `CompletionResult` |
| `get_model_for(agent=..., prefer=...)` | Resolves `{provider, model}` without calling the network |
| `describe_ai_status()` | Whether primary/secondary keys are present (booleans only) |
| `AiError` / `AiConfigError` / `AiProviderError` | Fail-loud hierarchy |

### 3.1 Message shape

```json
{ "role": "system" | "user" | "assistant", "content": "<string>" }
```

Unknown roles → `AiError` (422-class). Empty message list → `AiError`.

### 3.2 Prefer modes

| `prefer` | Resolution |
|---|---|
| `primary` (default) | Always primary provider/model |
| `secondary` | Always secondary |
| `auto` | Try primary; on transport/provider failure only, try secondary if configured |

`auto` does **not** fall back on application-level validation errors (empty messages,
unknown model id).

### 3.3 Agent → profile map

Optional `agent` callsign selects a **profile** (primary vs secondary preference default).
v1.0 defaults: **all seated studio agents use primary (Grok)** unless env overrides
exist:

| Env | Effect |
|---|---|
| `LABS_AI_AGENT_<CALLSIGN>_PREFER` | `primary` \| `secondary` for that callsign (e.g. `LABS_AI_AGENT_BRAVO_PREFER=secondary`) |

Unknown callsigns use primary. Callsign matching is case-insensitive.

---

## 4. Configuration (env)

| Variable | Required when | Meaning |
|---|---|---|
| `XAI_API_KEY` | Primary completion | xAI API key |
| `LABS_AI_PRIMARY_MODEL` | Optional | Default `grok-4.5` |
| `LABS_AI_XAI_BASE_URL` | Optional | Default `https://api.x.ai/v1` |
| `ANTHROPIC_API_KEY` | Secondary completion | Anthropic API key |
| `LABS_AI_SECONDARY_MODEL` | Optional | Default `claude-sonnet-4-5` |
| `LABS_AI_ANTHROPIC_BASE_URL` | Optional | Default `https://api.anthropic.com` |
| `LABS_AI_ANTHROPIC_VERSION` | Optional | Default `2023-06-01` |
| `LABS_AI_TIMEOUT_SECONDS` | Optional | Default `120` (integer) |

Fail loud:

- Non-integer timeout → `AiConfigError` at AI config load  
- Unknown `prefer` → `AiError` at call time  
- Provider key missing when that provider is selected → `AiConfigError`  
- Explicit `model=` not in the allowlist of primary/secondary model IDs → `AiError`

---

## 5. Provider contracts

### 5.1 xAI (primary)

- Protocol: OpenAI-compatible **Chat Completions**  
- `POST {base}/chat/completions`  
- Header: `Authorization: Bearer {XAI_API_KEY}`  
- Body: `model`, `messages`, `temperature`, `max_tokens`

### 5.2 Anthropic (secondary)

- Protocol: Anthropic **Messages** API  
- `POST {base}/v1/messages`  
- Headers: `x-api-key`, `anthropic-version`, `content-type: application/json`  
- System messages are folded into Anthropic `system`; remaining messages are user/assistant

### 5.3 Result

```json
{
  "text": "<assistant text>",
  "provider": "xai" | "anthropic",
  "model": "<model id used>",
  "usage": { "input_tokens": 0, "output_tokens": 0 }
}
```

Missing assistant text → `AiProviderError`.

---

## 6. Non-goals (v1.0)

- Streaming responses  
- Tool/function calling  
- Image/video generation (HeyGen remains separate)  
- Member-facing chat UI or public `/api/ai/*` routes  
- Storing prompts/completions in MySQL (audit spine is a later P2 pillar)  
- Automatic model routing by task type beyond agent prefer map  

---

## 7. Agent task runtime

Package module: `server/ai/agents.py`

| Symbol | Behavior |
|---|---|
| `run_agent_task(callsign, task_id, inputs)` | Load `agents/bench/<callsign>.md`, build system+user messages, call `complete`, validate required section markers |
| `list_seated_agents()` | Studio agents with charter file + task catalog |
| `list_tasks(callsign)` | Task ids for that agent |
| `load_charter(callsign)` | Charter markdown text |

Studio agents with task catalogs (v1): Quebec, Bravo, November, Romeo, Papa, Hotel,
Victor, Whiskey, Yankee, Tango.

Each task defines a user template (required input keys) and **required output markers**
(section headers). Empty or marker-missing output → `AiError` (fail loud).

Default fixtures (`default_fixture_inputs`) exist for characterization without live keys.

---

## 8. Admin HTTP surface (browser gateway)

Prefix: `/api/admin/ai` — **administrator** only.

| Method | Path | Behavior |
|---|---|---|
| GET | `/status` | Primary/secondary configured flags + seated agents |
| GET | `/agents` | Callsigns + task ids/descriptions |
| GET | `/agents/{callsign}/tasks/{task_id}/fixture` | Default fixture inputs |
| POST | `/agents/{callsign}/tasks/{task_id}/run` | Live model run; body: `{inputs?, use_fixtures?, prefer?, max_tokens?}` |

Errors: 401/403 auth; **503** missing key (`AiConfigError`); **502** provider;
**422** validation / incomplete agent output.

Browser UI: `/admin/ai` (`web/components/admin/AgentWorkbench.tsx`) — status panel,
agent/task selects, JSON inputs, Run, result text + markers.

## 9. Verification

- Unit/characterization tests with **injected fake providers** (no live keys required)  
- **Agent task tests:** every studio agent × task runs end-to-end via fake Grok; charters
  load from `agents/bench/`; pipeline order smoke (Quebec→…→Papa→guardians)  
- **Admin API tests:** auth gate, status, fixtures; live run when `XAI_API_KEY` set  
- **Browser (Playwright):** `web/e2e/agent-workbench.spec.ts` — workbench visible after
  dev-login; fixture load; **live** Bravo + November runs require `XAI_API_KEY` on the
  API process and a running web+API pair  
- Status helper returns configured flags without leaking secrets  
- Suite remains green when AI keys are absent  

### Browser test runbook

```bash
# API (with key)
export XAI_API_KEY=...
cd server && .venv/bin/uvicorn main:app --port 4000

# Web (separate terminal; env as usual)
cd web && npm run dev   # or build && start

# E2E
cd web && npm i && npx playwright install chromium
XAI_API_KEY=... LABS_WEB_BASE_URL=http://127.0.0.1:3000 npm run test:e2e:ai
```

---

## 10. Implementation map

| Path | Role |
|---|---|
| `server/ai/__init__.py` | Public exports |
| `server/ai/config.py` | Env load for AI subsystem |
| `server/ai/types.py` | Dataclasses / errors |
| `server/ai/registry.py` | Primary/secondary + agent prefer |
| `server/ai/client.py` | `complete` orchestration |
| `server/ai/agents.py` | Charter load + task catalog + `run_agent_task` |
| `server/ai/providers/xai.py` | Grok chat completions |
| `server/ai/providers/anthropic.py` | Claude messages |
| `server/routes/ai_admin.py` | Admin HTTP gateway for browser |
| `web/app/admin/ai/page.tsx` | Agent workbench route |
| `web/components/admin/AgentWorkbench.tsx` | Browser UI |
| `web/e2e/agent-workbench.spec.ts` | Playwright browser validation |
| `server/tests/test_ai_models.py` | Model interface characterization |
| `server/tests/test_agent_tasks.py` | Agent task performance characterization |
| `server/tests/test_ai_admin_api.py` | Admin AI API characterization |

---

*This is the interface that gives life to P2 agents and workflows: one door, two models,
Grok first.*
