# FatTail Labs — Agent Identity & Authorization Spec v1.0

**Status:** Approved as built (Phase A, 2026-07-23)  
**Parent:** `agents/p2-foundation/CHARTER.md` (pillar 1 — agent identity)  
**Decision log:** 2026-07-23 "Phase A: agent principals + dual admin surface"

---

## 1. Purpose

Agents authenticate **as themselves**, not by sharing human administrator cookies.
Every privileged action records an **actor** (human identity or agent principal).
Humans retain exclusive authority over billing, principal minting/revocation, and
member-facing publish authority (unchanged in this phase).

---

## 2. Principals

### 2.1 Tables

**`agent_principals`**

| Column | Type | Notes |
|---|---|---|
| id | BIGINT PK | |
| callsign | VARCHAR(64) UNIQUE | e.g. `bravo`, `quebec` (lowercase) |
| display_name | VARCHAR(255) | |
| status | VARCHAR(16) | `active` \| `disabled` |
| created_at | TIMESTAMP | |

**`agent_api_keys`**

| Column | Type | Notes |
|---|---|---|
| id | BIGINT PK | |
| principal_id | FK → agent_principals | |
| name | VARCHAR(128) | label for ops |
| key_prefix | VARCHAR(16) UNIQUE | public lookup fragment |
| key_hash | VARCHAR(255) | scrypt hash of secret |
| scopes_json | JSON | string array |
| created_at | TIMESTAMP | |
| last_used_at | TIMESTAMP NULL | |
| revoked_at | TIMESTAMP NULL | |

**`actor_events`** (append-only attribution log)

| Column | Type | Notes |
|---|---|---|
| id | BIGINT PK | |
| actor_kind | VARCHAR(16) | `human` \| `agent` |
| actor_id | BIGINT | identity_id or principal_id |
| actor_label | VARCHAR(255) | email or callsign |
| action | VARCHAR(128) | e.g. `ai.task.run` |
| resource | VARCHAR(255) NULL | e.g. `bravo/research_pack` |
| detail_json | JSON NULL | non-secret metadata |
| created_at | TIMESTAMP | |

### 2.2 API key format

```text
ftl_ag_<prefix>_<secret>
```

- `prefix` — 8 hex chars, unique, stored plaintext for lookup  
- `secret` — 32+ bytes hex, **shown once** at creation, only `key_hash` retained  
- Transport: `Authorization: Bearer ftl_ag_...`  

### 2.3 Scopes (v1.0)

| Scope | Allows |
|---|---|
| `ai:run` | POST admin AI task run, fixtures read for tasks |
| `ai:status` | GET AI status / agents catalog |
| `admin:read` | Read-only admin GETs that opt in later (not blanket) |
| `admin:content` | Future content mutations (not granted by default seed) |
| `board:operate` | Claim/move pipeline columns on the production board (Phase B) |

**Never grant agents (v1.0):** billing, webhook secrets, principal key minting,
role_override changes, membership writes.

Seeded studio principals start with `["ai:run", "ai:status"]` when a key is minted
with default scopes; principals exist without keys until an administrator mints one.

---

## 3. Actor resolution

On each request, resolve **at most one** actor:

1. If `Authorization: Bearer ftl_ag_...` present → agent principal (if valid)  
2. Else if session cookie valid → human identity  
3. Else anonymous  

**Conflict:** Bearer agent key **wins** over cookie when both present (explicit machine auth).

Actor object (internal):

```json
{
  "kind": "human" | "agent",
  "id": 0,
  "label": "ernie@… | bravo",
  "role": "administrator | null",
  "scopes": ["ai:run"]
}
```

Humans with role administrator satisfy admin routes as today.
Agents satisfy a route only if **every required scope** is present and status is `active`.

---

## 4. HTTP API

All under `/api/admin/agents/*` — **human administrator only** (cookie session).

| Method | Path | Behavior |
|---|---|---|
| GET | `/principals` | List principals + key metadata (no secrets) |
| POST | `/principals` | Create principal `{callsign, display_name}` |
| PATCH | `/principals/{id}` | `{status}` active\|disabled |
| POST | `/principals/{id}/keys` | Mint key `{name?, scopes?}` → `{key, key_id, prefix, scopes}` **once** |
| POST | `/keys/{key_id}/revoke` | Set revoked_at |

AI workbench routes (`/api/admin/ai/*`):

| Route | Human admin | Agent scopes |
|---|---|---|
| GET status, agents, fixture | yes | `ai:status` (fixture: `ai:run`) |
| POST …/run | yes | `ai:run` |

On successful `…/run`, write `actor_events` row `ai.task.run`.

---

## 5. Non-goals (v1.0)

- Agent UI login / cookies for agents  
- OAuth for agents  
- Automatic key rotation  
- Scopes for every existing `/api/admin/*` content route (Phase D placement)  
- Replacing human publish authority  

---

## 6. Verification

- Tests: mint key, bearer auth runs AI with fake provider, revoked key 401, human-only mint, actor_events written  
- Browser: admin Agents page lists principals; workbench still works with human session  

---

## 7. Implementation map

| Path | Role |
|---|---|
| `migrations/016_agent_identity.sql` | Schema + seed principals |
| `server/agent_auth.py` | Keys, verify, scopes |
| `server/guards.py` | Actor resolution helpers |
| `server/routes/agents_admin.py` | Principal/key management |
| `server/routes/ai_admin.py` | Dual auth + event log |
| `web/app/admin/agents/page.tsx` | Operator UI |
| `server/tests/test_agent_identity.py` | Characterization |
