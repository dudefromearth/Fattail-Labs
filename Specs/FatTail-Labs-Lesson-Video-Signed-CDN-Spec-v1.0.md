# FatTail Labs — Lesson Video: Signed CDN (Bunny Stream) Spec v1.0

**Status:** Approved as built (Phase F, 2026-07-23)  
**Parent:** Course-Hosting §7.4, Lesson-Video-YouTube-Spec-v1.0 (still valid for `youtube`)  
**Decision log:** 2026-07-23 "Phase F: Bunny signed embeds for gated lessons"

---

## 1. Purpose

Gated lesson video must not rely on durable public YouTube IDs. Phase F adds provider
**`bunny`** (Bunny Stream) with **time-limited signed embed URLs** built server-side.
**YouTube remains** for free-preview lessons, trailers, and hub intros (marketing / SEO).

---

## 2. Providers

| `video_provider` | Use | `video_id` stores |
|---|---|---|
| `youtube` | Free preview, trailers, hub | 11-char YouTube id |
| `bunny` | **Gated** member lessons (recommended) | Bunny Stream **video GUID** |

`VALID_PROVIDERS` = `{youtube, bunny}`.

Unknown provider → `VideoConfigError` (fail loud).

---

## 3. Configuration (optional until bunny is used)

| Env | Required when | Meaning |
|---|---|---|
| `LABS_BUNNY_LIBRARY_ID` | lesson uses `bunny` | Numeric library id |
| `LABS_BUNNY_TOKEN_KEY` | lesson uses `bunny` | Stream embed token security key |
| `LABS_BUNNY_EMBED_HOST` | optional | Default `https://iframe.mediadelivery.net` |
| `LABS_VIDEO_SIGNED_TTL_SECONDS` | optional | Default `3600` (1 hour), min 60 max 86400 |

If a `bunny` lesson is requested and keys are missing → 503 / VideoConfigError (fail loud).
YouTube lessons never require Bunny env.

---

## 4. Signed embed construction (Bunny Stream)

Per [Bunny Stream embed token authentication](https://docs.bunny.net/docs/stream-embed-token-authentication):

```text
expires = now + TTL   # unix seconds
token   = sha256_hex( TOKEN_KEY + video_id + str(expires) )
embed_url = {EMBED_HOST}/embed/{LIBRARY_ID}/{video_id}?token={token}&expires={expires}
```

Optional lesson `video_params` for bunny (allowlist): `autoplay` (0|1), `preload` (true|false),
`responsive` (true|false) — appended as query params after signature (unsigned cosmetic only).

---

## 5. API payload

`GET /api/courses/{course}/lessons/{lesson}` → `video`:

```json
{
  "provider": "bunny",
  "embed_url": "https://iframe.mediadelivery.net/embed/…",
  "expires_at": 1730000000,
  "video_id": "<guid>"
}
```

YouTube payload unchanged (`provider`, `embed_url` only; no long-lived leak beyond YT).

Public lesson landing **never** includes video fields (existing rule).

---

## 6. Authoring

Admin `PUT /api/admin/lessons/{id}` may set `video_provider` (`youtube`|`bunny`).

- `youtube` + `video_id`: normalize YouTube URL → 11-char id  
- `bunny` + `video_id`: accept UUID/GUID shape (strip whitespace); reject YouTube URLs  

Doctrine: **gated lessons should use `bunny`** when Stream is configured; free_preview
may stay `youtube`.

---

## 7. Player (web)

- `provider === "youtube"` → existing YT IFrame API progress bridge  
- `provider === "bunny"` → iframe with signed `embed_url`; progress via visibility-based
  heartbeat (wall-clock samples while tab visible) until Stream JS API is wired  

---

## 8. Non-goals

- Bunny **upload** API from Labs admin (operators upload in Bunny dashboard; paste GUID)  
- Mux provider (add later as `mux` if needed)  
- Replacing all existing seed YouTube lessons automatically  

---

## 9. Verification

- Unit: bunny token shape + expiry; missing config fails; youtube still works  
- Gating tests still pass for youtube free lessons  
- Characterization for bunny with env keys in test (or injected)  

---

## 10. Implementation map

| Path | Role |
|---|---|
| `server/video.py` | youtube + bunny embed builders |
| `server/config.py` | optional bunny settings |
| `server/routes/admin.py` | provider + id validation |
| `server/routes/lessons.py` | embed_config (unchanged call) |
| `web/components/LessonPlayer.tsx` | multi-provider |
| `server/tests/test_video_signed.py` | tests |
