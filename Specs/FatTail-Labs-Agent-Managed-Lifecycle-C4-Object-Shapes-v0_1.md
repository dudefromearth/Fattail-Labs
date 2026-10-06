# Agent-Managed Lifecycle — C-4 Object shapes v0.1

**Instance contract** under `FatTail-Labs-Agent-Managed-Lifecycle-Spec-v0_6.md` §19 C-4.  
Not doctrine. Not BUILD AUTHORITY for product code until the first-slice gating set is complete.  
**Emits into these shapes:** work-product detectors, C-1 presence, Populator, Guide.

Do not add a recipient, route, or “write to the help window.” Scope is an attribute. The bubble is a view.

---

## Envelope (every object)

| Field | Rule |
|-------|------|
| `type` | one of the types below |
| `id` | opaque string, unique in the space |
| `scope` | `{ "kind": "member", "identity_id": <int> }` — attribute, not a partition. Unscoped objects are out of this slice. |
| `created_at` | UTC instant |
| `updated_at` | UTC instant |

No `to`, `channel`, `agent_id` as dispatch. Claim fields, if any, belong to the Spaces claim-liveness contract, not here.

---

## Who may emit (first slice)

| `type` | Emitter | Presentable in the member view |
|--------|---------|--------------------------------|
| `live_loop_state` | Populator only | no |
| `first_login` | Populator only | no (Guide recognizes it) |
| `nudge` | Guide only | yes |
| `observation` | Guide only | yes |
| `question` | Guide only | yes |

One `live_loop_state` per member at a time: Populator updates in place (`updated_at`). It does not append a history of states in the space.

---

## `live_loop_state`

Populator output. Inputs are **work_ref**s from detectors, never visits.

```json
{
  "type": "live_loop_state",
  "id": "…",
  "scope": { "kind": "member", "identity_id": 0 },
  "created_at": "…",
  "updated_at": "…",
  "produced_today": {
    "analysis": null,
    "execution": null,
    "reflection": null
  },
  "presence": "unknown",
  "cycle_position": { "week": null, "cycle": null },
  "last_seen_at": null
}
```

**`produced_today`:** each slot is `null` or a `work_ref`. Filling a slot is the detector’s job. A visit must never appear here.

**`work_ref`** (opaque to C-4; detectors own the mapping):

```json
{
  "kind": "analysis" | "execution" | "reflection",
  "source": "string",
  "source_id": "string",
  "at": "UTC instant"
}
```

**`presence`:** `"unknown" | "present_idle" | "present_producing"`. C-1 owns the mapping. Until C-1 lands, Populator may leave `"unknown"`. Presence is never a loop step.

**`cycle_position`:** C-2 owns the clock. Until C-2 lands, both fields may be `null`.

---

## `first_login`

Populator emits when a member session starts and relationship memory for that `identity_id` is absent (not a load failure). Guide recognizes this type. Not presentable.

```json
{
  "type": "first_login",
  "id": "…",
  "scope": { "kind": "member", "identity_id": 0 },
  "created_at": "…"
}
```

A load failure of relationship memory is **not** this object. That path is the relationship-memory location contract.

---

## `nudge` · `observation` · `question`

Guide emits. These are the only first-slice types the help-bubble view may present.

```json
{
  "type": "nudge" | "observation" | "question",
  "id": "…",
  "scope": { "kind": "member", "identity_id": 0 },
  "created_at": "…",
  "body": "string",
  "about": null
}
```

**`about`:** `null` or a `work_ref` or `{ "type": "live_loop_state", "id": "…" }`. Not a person. Not a window.

Atrophy (TTL/merge) is the separate §19 line. Until that contract: objects of these three types do not survive past the member’s current Labs calendar date in `created_at`.

---

## Out of this contract

- Wire-level detectors (analysis / trade / journal). They **emit `work_ref`s** into `produced_today`.
- C-1 presence mapping.
- C-2 cycle clock.
- C-3 dial (not a space object in this slice).
- C-5 Analyzer → Practice seam.
- Relationship memory (not a space object; private store).
- Gesture map (reads state changes; writes no types here).
