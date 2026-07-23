# P2 Cast & HeyGen Production

**Status:** Draft — product intent recorded 2026-07-23  
**Parent:** `agents/p2-foundation/CHARTER.md`, `docs/P2-Capabilities-for-P1.md`  
**Producer agent:** **Papa** (`agents/bench/papa.md`)  
**Skills (external / operator tooling):** `heygen-avatar`, `heygen-video` (and related HeyGen skills)

---

## 1. Purpose

FatTail Labs course video and short-form media are produced with a **stable cast of
HeyGen avatars** — reusable face + voice identities that act as presenters across
lessons, trailers, hub intros, coaching shorts, and thematic series.

The HeyGen skills are the **scene and (where quality allows) finished-lesson**
production path. P1 remains the placement and playback surface (YouTube IDs on lessons,
trailers, hub). P2 owns cast consistency, script → scene → package, and human gates.

---

## 2. Cast model

| Concept | Meaning |
|---|---|
| **Cast member** | A named presenter identity (digital twin or designed character) with a stable HeyGen **group_id** + **voice_id** |
| **Look** | Orientation/outfit variant under the same group (landscape vs portrait, wardrobe). Looks are ephemeral at the API layer — resolve from group_id at render time |
| **Role** | How the member is used in content (e.g. primary coach, specialist guest, short-form host) — product language, not HeyGen plumbing |
| **Cast registry** | Source of truth in-repo for which identities the studio may use |

**Coach intent:** several avatars will be created over time; **two already exist** on
HeyGen. They become the **actors** for courses and other media the system produces.
New cast members are added deliberately (human approval), not invented per video.

### 2.1 Registry convention

Each cast member gets a durable identity file (HeyGen skill format):

```text
AVATAR-<NAME>.md     # group_id, voice_id, looks notes, appearance, voice
```

**Preferred Labs location (product cast):** `docs/studio/cast/AVATAR-<NAME>.md`

When operating with the stock HeyGen skills (which default to **workspace root**
`AVATAR-*.md`), either:

- copy/symlink the cast file to the workspace root for that session, or  
- point the producer packet at the registry path explicitly.

Do **not** hardcode ephemeral `look_id`s as the primary reference — always resolve
looks from `group_id` at render time (HeyGen skill invariant).

### 2.2 Roles (examples — refine as cast grows)

| Role | Typical use |
|---|---|
| **Primary coach** | Flagship pathway lessons, hub intros, doctrine-forward pieces |
| **Specialist host** | Topic series (e.g. structures, psychology) when multi-presenter is desired |
| **Short-form host** | Coaching shorts / thematic verticals (may be same avatar, portrait look) |

Cast assignment is a **lesson-plan / package field**, not an afterthought in post.

---

## 3. Production units

| Unit | What it is | Typical HeyGen path |
|---|---|---|
| **Scene** | One continuous presenter beat (hook, teach beat, CFU, CTA) | `heygen-video` (Video Agent) from an approved script beat |
| **Lesson video** | Ordered scenes for one lesson — single long take **or** stitched multi-scene package | Prefer one Video Agent job when length/quality allow; otherwise scene renders + assemble |
| **Short** | Single-beat coaching or thematic piece | One portrait Video Agent job |
| **Trailer / hub intro** | Marketing orientation | Short landscape job from approved VO |

**Target ambition:** the HeyGen skill path produces **usable scenes** and, where the
script and duration fit, a **finished lesson master** that only needs human review,
captions check, YouTube upload, and Labs placement — not a full traditional edit bay.

When a single Video Agent run cannot hold educational quality (length, multi-resource
B-roll, chaptering), **degrade gracefully**: scene-level renders → human or tooling
assembly → still the same gates and provenance.

---

## 4. Pipeline (cast-aware)

```text
November: lesson plan  (+ cast role per lesson / series)
Romeo:    script       (plan-locked; cast name on package)
   │
   ▼
Papa:     resolve AVATAR-<NAME> → group_id + voice_id
          resolve look_id for orientation (16:9 lesson / 9:16 short)
          heygen-video: scene(s) or full lesson prompt
          package: YT metadata + Labs placement proposal
   │
   ▼
Human:    watch / approve  →  YouTube  →  P1 lesson video_id (draft then publish)
```

Upstream gates (Bravo, Hotel, lineage, Tango) are unchanged. **Cast does not bypass
doctrine or educational design.**

---

## 5. Papa + HeyGen skills

| Skill | Use in P2 |
|---|---|
| **heygen-avatar** | Create/update cast members; write `AVATAR-<NAME>.md`; new looks under existing group |
| **heygen-video** | Scene and lesson generation via Video Agent v3; Frame Check; orientation; style |
| **heygen-translate** (optional) | Later localization — not required for v1 English production |

**Papa owns:** cast resolution, render jobs, provenance (which avatar, script version,
session/video IDs), distribution packages, placement proposals.  
**Papa does not:** invent scripts, rewrite teaching in post, silent-publish to Labs or
YouTube, or create cast members without Coach approval.

### 5.1 Prompt / production invariants (HeyGen-aware)

1. **Approved script only** — no render from draft research notes.  
2. **Named cast only** — production packets cite `AVATAR-<NAME>`; no random stock
   presenters for member courses unless Coach waives for a named experiment.  
3. **“Selected presenter” rule** — when `avatar_id` is set, prompts must not re-describe
   the face (HeyGen mismatch class).  
4. **Orientation** — course/hub landscape; coaching/thematic shorts portrait unless
   specified.  
5. **Provenance** — store HeyGen `session_id` / `video_id`, cast name, script version,
   lesson plan ID on the work product.  
6. **Human gate** — cast video is still a proposal until approved.

---

## 6. What this gives P1

| P1 need | Cast + HeyGen capability |
|---|---|
| Consistent teacher face across the library | Fixed cast, not a new random presenter per lesson |
| Lesson `video_id` fill | Render → YT → attach via admin/API |
| Trailers / hub intro | Same cast, short packages |
| Shorts that match brand | Same cast, portrait pipeline |
| Scale without founder on camera every take | Digital presenters; founder judgment stays on seed + approve |

P1 does **not** need to embed HeyGen. It only stores validated YouTube (or future CDN)
IDs and metadata. HeyGen is a **P2 production dependency**, not a runtime dependency
for learners.

---

## 7. Open items (Coach)

1. **Name and register** the two existing HeyGen avatars into `docs/studio/cast/`.  
2. **Role map** — who is primary coach vs specialist vs short-form default.  
3. **Visual style default** for FatTail (HeyGen style_id and/or prompt STYLE block) —
   brand tokens should not drift lesson-to-lesson.  
4. **Finished-lesson vs multi-scene policy** — duration thresholds and when assembly is
   required.  
5. **YouTube channel ops** — upload account, unlisted vs public for course masters,
   naming conventions.

---

## 8. Related

| Doc / agent | Role |
|---|---|
| `agents/bench/papa.md` | Video producer archetype |
| `agents/bench/romeo.md` | Scripts that name cast + timing |
| `agents/bench/november.md` | Lesson plans; cast role per lesson |
| `docs/P2-Capabilities-for-P1.md` | What P2 delivers into the platform |
| `docs/scripts/hub-intro-30s.md` | Early HeyGen-oriented script example |
| HeyGen skills | `heygen-avatar`, `heygen-video` (operator environment) |

---

*Cast members are product assets. Treat them like brand: deliberate, versioned, and
reused — never disposable per render.*
