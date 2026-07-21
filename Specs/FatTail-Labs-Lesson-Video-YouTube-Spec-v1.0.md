# FatTail Labs — Lesson Video: YouTube Provider Spec v1.0

**Status:** Approved as built (2026-07-21) · implemented in migration `002`,
`server/video.py`, `server/routes/lessons.py`, `web/app/courses/[slug]/lessons/[lessonSlug]/`
**Parent spec:** `FatTail-Labs-Course-Hosting-Spec-v1.0.md` (§5.3 player, §7.4 video pipeline)
**Decision log:** 2026-07-21 "Lesson video: YouTube embeds with per-lesson player parameters"

---

## 1. Purpose

Lessons play video hosted on YouTube, with per-lesson control over the YouTube IFrame
player's behavior (start point, clip window, captions, mute, autoplay, etc.). The system
must render nothing the server did not validate: player URLs are built server-side from
an allowlist; the client only embeds what the API returns.

## 2. Data Model

Migration `002_lesson_video_provider.sql`:

| Column | Table | Type | Meaning |
|---|---|---|---|
| `video_provider` | lessons | VARCHAR(16), default `'youtube'` | Provider discriminator. `youtube` is the only valid value in v1.0 |
| `video_id` | lessons | VARCHAR(255) | The YouTube video ID (e.g. `aqz-KE-bpKQ`), NOT a URL |
| `video_params` | lessons | JSON NULL | Flat object of player parameters for this lesson, e.g. `{"start": "60", "end": "120"}` |
| `trailer_provider` | courses | VARCHAR(16), default `'youtube'` | Same discriminator for course trailers (trailer embed UI arrives with course-page polish) |

Rules:

- `video_id` stores the bare ID. Full URLs are rejected at authoring time (admin builder,
  P1d, must parse/strip pasted URLs down to the ID).
- `video_params` values are strings (YouTube's parameters are all string/int-like).
- A lesson with `video_id = NULL` has no video (e.g. `download` / `text` kinds); the
  API returns `video: null`.

## 3. Parameter Allowlist

`server/video.py :: YOUTUBE_PARAMS` — the ONLY parameters a lesson may configure:

| Param | Values | Use |
|---|---|---|
| `autoplay` | 0/1 | Autoplay on load (browsers require `mute=1` alongside) |
| `cc_load_policy` | 1 | Force closed captions on |
| `controls` | 0/1 | Hide/show player controls |
| `start` | seconds | Begin playback at offset |
| `end` | seconds | Stop playback at offset (clip windows) |
| `fs` | 0 | Disable fullscreen button |
| `hl` | lang code | Player UI language |
| `loop` | 1 | Loop playback (server auto-adds required `playlist=<video_id>`) |
| `mute` | 0/1 | Start muted |
| `playsinline` | 1 | Inline playback on iOS |
| `rel` | 0 | Restrict related videos to the same channel |

Baseline applied to every embed regardless of lesson config (`YOUTUBE_BASE`):
`rel=0`, `playsinline=1`. Lesson params override the baseline where they overlap.

**Unknown parameters are a hard error** (`VideoConfigError` → 500 at the API), not a
silent drop — misconfigured lessons fail loudly per doctrine.

## 4. Embed URL Construction (server-side only)

`video.embed_config(provider, video_id, raw_params)` returns:

```json
{ "provider": "youtube",
  "embed_url": "https://www.youtube-nocookie.com/embed/<id>?rel=0&playsinline=1&start=60&end=120" }
```

- Host is **`youtube-nocookie.com`** (privacy-enhanced mode) — never `youtube.com`.
- The client NEVER assembles player URLs from raw DB values; it renders `embed_url`
  verbatim in an iframe. This is the injection boundary: params are allowlisted,
  URL-encoded, and joined server-side.
- `loop=1` automatically gains `playlist=<video_id>` (YouTube requirement for
  single-video looping).

## 5. API Behavior

`GET /api/courses/{course_slug}/lessons/{lesson_slug}`:

| Condition | Response |
|---|---|
| Lesson in a **published** course, `free_preview = 1` | 200 with lesson payload incl. `video` embed config |
| Lesson in a published course, gated | **401** ("Members only") — becomes session-aware with the member path (P1c); members then receive the same payload shape |
| Course draft/unknown, or lesson unknown | **404** |

Payload: `slug, title, kind, duration_seconds, free_preview, module_title, course_slug,
course_title, body_md, video{provider, embed_url} | null`.

Course-detail public payloads (parent spec) continue to exclude `video_id` and
`video_params` — the lesson endpoint is the only place embed config leaves the server.

## 6. Player UI

`/courses/{slug}/lessons/{lessonSlug}` (dynamic, per-request render):

- Free preview: breadcrumb (All Courses › course › lesson), title, module context,
  16:9 iframe (`allow`: autoplay, encrypted-media, PiP, fullscreen…), `body_md` below,
  join CTA under the video.
- Gated (401): "This lesson is for members" page with Join + Back-to-course actions —
  never an error surface.
- Course page Modules tab: free-preview lesson rows link to the player; gated rows are
  inert with a lock.

## 7. Authoring (P1d admin builder requirements)

- Video field accepts a pasted YouTube URL or bare ID; stored as bare ID.
- Params editable as labeled controls (start/end/captions/mute/…), not raw JSON;
  serialized to `video_params`. Validation mirrors the server allowlist.
- Preview button renders the exact embed the API would emit.

## 8. Accepted Tradeoff & Future Path

Parent spec §7.4 rejected YouTube for gated content (unlisted links are leakable,
no real access control at the video layer). **Coach accepted this tradeoff for launch
speed** (decision log, 2026-07-21). Consequences and mitigations:

- Gating is enforced at the page/API layer, not the video layer. A member who extracts
  a video ID can share it. Acceptable at current scale.
- Migration path stays open by design: `video_provider` discriminates, and adding a
  `bunny`/`mux` provider later means new entries in `VALID_PROVIDERS` + a signed-URL
  builder in `video.py` + per-lesson re-pointing — no schema or client changes.
- Watch-progress tracking (P1c) uses player-position polling; the YouTube IFrame API
  supports this via `postMessage` — the member player upgrades the plain iframe to the
  JS API client-side without changing this spec's server contract.

## 9. Out of Scope (v1.0)

Member playback + progress reporting (P1c) · trailer embed UI on course pages ·
non-YouTube providers · downloadable video.
