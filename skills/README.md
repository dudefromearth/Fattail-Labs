# FatTail Labs — Production Skills

**Status:** Active (Course first, 2026-07-23)  
**Parents:** P2 Charter · [Content Types Taxonomy](../docs/Content-Types-Taxonomy.md) · WFM Architecture  

---

## What a skill is

A **skill** is a documented, executable operating procedure:

| Field | Meaning |
|---|---|
| **Inputs** | What must exist before the skill runs |
| **Outputs** | Artifacts / shape fields produced |
| **Owner** | Bench callsign primarily responsible |
| **Invariants** | Never break these |
| **Steps** | Ordered procedure |
| **Verify** | Evidence that the skill completed correctly |
| **Handoff** | Next skill / agent |

Skills compose into **workflows** (e.g. `course-create`).  
Workflows are orchestrated by WFM / Quebec; skills are the work units.

---

## Types → skill packs

| Type | Skill pack | Status |
|---|---|---|
| **Course** | [`skills/course/`](./course/) | **In progress** (defines the pattern) |
| Tutorial | `skills/tutorial/` | Later — subset of Course, single-lesson shape |
| YouTube Long | `skills/youtube-long/` | Later — header + video |
| YouTube Long · **Thematic Movie** treatment | [`skills/thematic-movie/`](./thematic-movie/) | **Active** — cinematic doctrine essay (script + video; research/vision/placement reused from Course) |
| Campaign | `skills/campaign/` | Later — funnel + lander + mail list |

**Why Course first:** most complex shape (header + modules + lessons + resources + video).  
Tutorial, YT Long, and Campaign **reuse or slim** Course skills where components match.

---

## Conventions

1. One directory per skill: `skills/<type>/<skill-name>/SKILL.md`  
2. Name: lowercase, hyphenated, type-prefixed (`course-lesson-plan`)  
3. Package stage key (if any) documented in the skill front matter table  
4. Skills never silent-publish member content  
5. Process outcomes only; capacity over dependency; pathway flagship-first where relevant  
6. Evidence over assertion — verify section must be checkable  

---

## Loading

- **Agents / humans:** read `SKILL.md` for the procedure; cite skill name in board transitions and artifacts.  
- **Grok TUI (optional):** copy or symlink into `.grok/skills/` when you want slash-command invocation.  
- **WFM steps:** `handler` maps to a skill name (or callsign + skill).  
