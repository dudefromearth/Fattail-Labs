---
name: thematic-movie-video
description: >
  Produce a thematic movie from a plan-locked screenplay via HeyGen —
  scene-per-clip renders, b-roll assembly, score, derivative clips — into
  video_package for a youtube_long card. Use when a thematic movie card
  needs its video_package stage, or /thematic-movie-video.
---

# thematic-movie-video

**Type:** Thematic Movie component
**Owner:** Papa
**Package stage:** `video_package`
**Board sub_stage:** `produce`
**External skills:** `heygen-video` (~/.claude/skills/heygen-skills) · cast
registry · API reference at `docs/heygen/openapi-external.json` (79 endpoints)

---

## Purpose

Turn a **plan-locked screenplay** into the finished movie and its derivative
clips, with full provenance — without silent publish. The movie is assembled
from scene renders, not generated as one monolith: scenes re-render
individually when a claim, tool, or number changes.

## Inputs

| Required | Source |
|---|---|
| `script` artifact (plan-locked) | `thematic-movie-script` |
| Cast assignment | card `cast_id` → `docs/studio/cast/AVATAR-*.md` |
| Budget line | card; hard-stop, never soft |
| B-roll / screen captures | per script cue table; product footage obeys the adherence-not-P&L rule |

| Mode | |
|---|---|
| **Fixture / stub** | Dev/test: placeholder package + provenance notes |
| **Live HeyGen** | Keys + budget; scene-per-clip batch |

**Fail loud if:** script not plan-locked; live mode without cast; budget
exceeded (stop, flag, never trim scenes silently to fit).

## Procedure

1. **Cut list from script** — one render job per scene row (avatar-frame
   scenes only; pure b-roll rows are editor work, not renders).
2. **Lock the seam variables** across ALL jobs before job 1: avatar, voice,
   framing *including scale/position*, background, aspect (16:9). A cast
   mismatch at a seam cannot be fixed in the editor.
3. **Test render scene 1 first.** Listen for brand terms ("FatTail", "FAQ",
   any ticker) before committing the batch.
4. **Batch render** remaining scenes (HeyGen batch API; poll or webhook).
5. **Assemble**: hard cuts on cue phrases (no crossfades to screen capture);
   score under Acts I/III, out for product tour; **normalize all clips to one
   loudness target (−14 LUFS)** before export.
6. **Derivative clips**: run AI Clipping on the finished cut; each candidate
   clip becomes a child proposal on the movie card — never auto-posted.
7. **Package** with provenance.

## Output

Artifact stage `video_package` (JSON):

```json
{
  "movie": { "file": "…", "duration_s": 0, "youtube_id": "pendingOrId" },
  "scenes": [
    { "scene": 1, "heygen_video_id": "…", "cast": "NAME", "script_ref": "…" }
  ],
  "derivative_clips": [
    { "source_range": "…", "file": "…", "status": "proposed" }
  ],
  "provenance": { "seam_settings": "…", "loudness_lufs": -14, "budget_spent": 0 }
}
```

## Invariants

1. **No silent publish** — YouTube upload is a human act; the package carries
   files/ids, not a live URL, until Approve.
2. Cast registry only; consented likeness/voice only.
3. Product footage frame-checked edge-to-edge: no dollar figures, adherence
   views only.
4. Scene renders keep their `heygen_video_id` provenance — a movie that can't
   name its sources can't be revised, only redone.
5. Budget is a hard stop; partial batches flag `blocked`, never ship thin.

## Verify

- [ ] Seam check: play 2s across every scene boundary — no cast/loudness jump
- [ ] Brand-term pronunciation pass on final cut
- [ ] Runtime within ±15% of script target
- [ ] Claims ledger untouched since plan-lock (diff script artifact)
- [ ] Hotel + Tango flags resolved; no open block flags
- [ ] Budget line reconciled in provenance

## Handoff

→ `course-placement` (slimmed, youtube_long shape): YouTube metadata from
script's title/description drafts + optional Labs library placement. Card →
`awaiting_approval` only when the package checklist is green.
