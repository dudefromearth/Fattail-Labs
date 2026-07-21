# FatTail Labs — Course Trailer Spec v1.0

**Status:** Approved as built (2026-07-21)
**Parent spec:** §5.2 (hero with centered trailer play button)
**Sibling:** YouTube spec (provider model; trailers are public/unsigned by design)

---

## 1. Behavior

- Courses with a `trailer_video_id` render a centered **▶ play button** over the
  hero. Clicking swaps the hero area for the trailer player **in place** (no modal —
  same direct-manipulation principle as editing). A close control restores the hero.
- Trailers are public: no session required (they are marketing).
- Embed URL is built server-side exactly like lessons (allowlist base params,
  youtube-nocookie): the public course payload carries
  `trailer: {provider, embed_url} | null` and never the raw ID.

## 2. Authoring

- `trailer_video_id` joins the course field allowlist: admins set it in edit mode via
  a **Trailer chip** in the hero (paste URL or ID; server normalizes to bare ID —
  same normalization as lessons). Clearing the field removes the trailer.
- Admin course payload includes the raw `trailer_video_id` for editing.

## 3. Invariants

1. Raw video IDs never appear in public payloads — embed config only.
2. The play button renders only when a trailer exists; static pages bake this at
   publish time.
