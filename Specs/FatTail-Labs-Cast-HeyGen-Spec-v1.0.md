# FatTail Labs — Cast Registry & HeyGen Production Spec v1.0

**Status:** Approved as built (Phase G1 + G2a, 2026-07-23)  
**Superseded for later slices by:** [Cast-HeyGen Spec v1.1](./FatTail-Labs-Cast-HeyGen-Spec-v1.1.md) (G2b–G5)  
**Parents:** P2 charter, `docs/P2-Cast-and-HeyGen-Production.md`, Production Package Spec v1.0  
**Decision log:** 2026-07-23 "Phase G1 cast + G2a HeyGen kick"

---

## 1. Purpose

**G1 — Cast registry:** Named HeyGen presenters are product assets. The in-repo
files under `docs/studio/cast/AVATAR-<NAME>.md` are the source of truth. Admins
view the registry at `/admin/cast` and assign `cast_id` on board cards.

**G2a — HeyGen kick:** From a board card with cast + script, an admin can produce
a `video_package` artifact (dry-run or live Video Agent submit). Placement still
requires human upload to YouTube/CDN and Phase D place — HeyGen is production
intermediate, not learner playback.

---

## 2. Cast model

| Field | Meaning |
|---|---|
| `cast_id` | Uppercase name matching `AVATAR-<cast_id>.md` (e.g. `DUDE-PRIMARY`) |
| Group ID | Stable HeyGen group identity |
| Voice ID | Stable HeyGen voice for the member |
| Role | Product role (`primary_coach`, `specialist_host`, …) |
| Orientation default | `landscape` or `portrait` (shorts override by product_line) |

**Invariants**

1. Named cast only for member course masters (no random stock presenters unless Coach waives).  
2. Resolve `look_id` at render time from `group_id` — never treat look IDs as permanent primary keys.  
3. New cast members require Coach approval + AVATAR file + registry table update.  
4. Registry is **files**, not a DB table of avatars. DB only stores assignment `content_items.cast_id`.

---

## 3. Data model

Migration `020_cast_heygen.sql`:

```sql
ALTER TABLE content_items
  ADD COLUMN cast_id VARCHAR(64) NULL AFTER product_line;
```

---

## 4. API

| Method | Path | Behavior |
|---|---|---|
| GET | `/api/admin/cast` | List cast members from registry |
| GET | `/api/admin/cast/{cast_id}` | One member |
| POST | `/api/admin/board/items` | Optional `cast_id` |
| PATCH | `/api/admin/board/items/{id}` | Set/clear `cast_id` |
| POST | `/api/admin/board/items/{id}/produce-heygen` | Kick production |

### Produce body

```json
{ "dry_run": true, "orientation": "landscape" }
```

| Field | Default |
|---|---|
| `dry_run` | If omitted: `true` when `LABS_HEYGEN_DRY_RUN=1`, else live submit |
| `orientation` | Shorts → portrait; else cast default / landscape |

### Preconditions (fail loud)

- Card exists  
- `cast_id` set and registry-ready  
- Latest `script` artifact non-empty  
- Product line in `course | youtube_long | coaching_short | thematic_short`  
- Live submit: `HEYGEN_API_KEY` + `heygen` CLI on PATH  

### Artifact shape (`stage=video_package`)

```json
{
  "provider": "heygen",
  "status": "dry_run|submitted|failed",
  "cast_id": "DUDE-PRIMARY",
  "group_id": "…",
  "voice_id": "…",
  "look_id": "… or null",
  "orientation": "landscape",
  "renders": [
    {
      "slug": "lesson-1",
      "session_id": "…",
      "heygen_video_id": null,
      "status": "dry_run|submitted|failed",
      "session_url": "https://app.heygen.com/video-agent/…"
    }
  ],
  "videos": {},
  "trailer_video_id": null,
  "notes": "…"
}
```

After human YouTube upload, operators (or a later phase) fill `videos` /
`trailer_video_id` for Phase D placement. Existing placement merge still reads
`videos` map when present.

---

## 5. Admin UI

| Surface | Behavior |
|---|---|
| `/admin/cast` | List members, group/voice ids, roles |
| Board card badge | Shows `cast_id` when set |
| Board drawer | Cast select; **Produce HeyGen (dry-run)** and **(live)** |
| Admin nav | **Cast** link |

---

## 6. Config

| Env | Role |
|---|---|
| `HEYGEN_API_KEY` | Optional until live produce; required for live submit |
| `LABS_HEYGEN_DRY_RUN=1` | Force dry-run when `dry_run` omitted |
| `LABS_CAST_DIR` | Optional override of cast directory (tests) |

Platform boot does **not** require HeyGen (same pattern as optional AI keys).

---

## 7. Out of scope (later G slices)

**Shipped in v1.1:** G2b batch, G3 budgets, G4 Quebec tick, G5 refresh + YouTube map.  

Still out of scope (post-G):

- YouTube upload automation  
- Continuous background HeyGen poller  


---

## 8. Verification

Characterization: `server/tests/test_cast_heygen.py`

- List cast ≥ registered members with group/voice  
- Assign / clear cast_id  
- Invalid cast → 422  
- Produce without script or cast → 422  
- Dry-run produce writes `video_package` and completes package stage  

---

## 9. Related

| Doc | Role |
|---|---|
| `docs/P2-Cast-and-HeyGen-Production.md` | Product cast model |
| `docs/studio/cast/README.md` | Operator registry |
| `Specs/FatTail-Labs-Production-Package-Spec-v1.0.md` | Package stages |
| `agents/bench/papa.md` | Video producer ownership |
