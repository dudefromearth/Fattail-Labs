# P2 Capabilities for P1

**Status:** Active (aligned with shipped Phases A–G, 2026-07-23)  
**Audience:** Coach, Juliet, platform specialists (Alpha/Charlie/Mike), content studio  
**Relationship:** P1 is the load-bearing **product platform**
([`agents/p1-foundation/CHARTER.md`](../agents/p1-foundation/CHARTER.md)). P2 is the
**operating and production layer** that feeds and runs it. P2 does not replace P1.

---

## 1. One sentence

**P2 gives P1 a governed way to fill, maintain, and grow the course platform — and the public channel that points at it — using agent capacity, while humans only seed intent and approve publish.**

P1 remains the system of record for members, courses, progress, admin, and delivery.  
P2 is how content and operations get *produced at scale* without dual APIs or silent automation.

---

## 2. Division of labor

| Layer | Project | Job |
|---|---|---|
| **Product platform** | **P1** | Host, gate, play, enroll, progress, admin UI, SEO pages, media library, resources, live listing surfaces |
| **Operating + production layer** | **P2** | Backlog, agent identity, skills/workflows, research → instructional design → scripts → video, dual packaging (Labs + YouTube), lineage and educational gates |

```text
                    human: seed intent + approve publish
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  P2 — Agentic operating layer + content studio              │
│  research · lesson plans · scripts · renders · packages     │
│  backlog · skills · workflows · audit · agent credentials   │
└────────────────────────────┬────────────────────────────────┘
                             │ same governed admin/API surface
                             │ (draft/proposal → human gate)
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  P1 — FatTail Labs platform                                 │
│  courses · lessons · notes · resources · hub · SEO · live   │
│  member playback · progress · entitlements · in-place admin │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
              learners on labs.fattail.ai (+ public YT)
```

**Inversion:** P1 was built as *human operates the UI; API serves the UI*. P2 makes the **API the operating surface**; the UI is one client. Agents are first-class operators of P1, not a side integration.

---

## 3. Capabilities P2 provides *to* P1

Each capability below is something P1 **receives or can rely on** once P2 is built. P1 surfaces already exist (or will exist on the platform); P2 is how they stay full, correct, and current.

### 3.1 Content production capacity

| Capability | What P1 gets |
|---|---|
| **Course bundles** | Draft courses with modules, lessons, notes, video IDs, free-preview flags — produced as educational packages, not ad-hoc uploads |
| **Lesson plans (upstream of P1)** | Instructional design that P1 does not store as a first-class model today, but that governs quality of what is placed into P1 lessons |
| **Resource downloads** | Job aids, templates, worksheets authored with the course and attached via P1 resource/attachment flows |
| **Trailers & hub intros** | YouTube-backed marketing video slots filled with doctrine-safe, on-brand takes |
| **Catalog / hub copy support** | Research- and outcome-backed copy candidates for categories, hub, and course public fields (Sierra-aligned; still human-gated) |

P1 remains the **delivery** system (player, progress, entitlements). P2 is the **factory** that prepares what the delivery system hosts.

### 3.2 Multi-format studio (feeds P1 and the channel)

| Product line | How it helps P1 |
|---|---|
| **Educational courses** | Primary fill of the library; educational guidelines mandatory (outcomes, practice, resources) |
| **YouTube long-form** | Top-of-funnel and trust; companions can deep-link or theme-align with Labs courses |
| **Coaching shorts** | High-frequency process coaching; can promote pathway/flagship without becoming the course |
| **Thematic short-form series** | Narrative continuity (stop-the-bleeding, defined risk, etc.) that reinforces P1 pathway positioning |

Dual destination is intentional: **one production system**, two publish surfaces (Labs via P1 APIs; YouTube via package + human/channel gate).

### 3.2b Cast presenters (HeyGen) — **shipped Phase G**

| Capability | What P1 gets |
|---|---|
| **Stable cast** | Named HeyGen avatars as course/media **actors** — consistent face and voice across the library |
| **Registry + board assignment** | `docs/studio/cast/AVATAR-*.md`; `/admin/cast`; `content_items.cast_id` |
| **Batch produce** | Board kick → multi-lesson `video_package` (dry-run or live Video Agent) |
| **Budgets + Quebec** | Daily/monthly live job caps; Quebec tick advances pipeline without publishing |
| **Refresh + YouTube map** | Poll sessions; human maps slug→YouTube id for Phase D placement |
| **No runtime HeyGen** | Learners only see YouTube (or Bunny CDN) via P1; HeyGen is production-only |

Specs: `Specs/FatTail-Labs-Cast-HeyGen-Spec-v1.0.md`, `v1.1.md`.  
Model narrative: `docs/P2-Cast-and-HeyGen-Production.md`.

### 3.3 Quality gates that protect P1 members

P2 does not only produce volume; it **filters** what is allowed to land on P1:

| Gate | Protects P1 from… |
|---|---|
| **Educational guidelines (November)** | Video playlists without outcomes, practice, or resources |
| **Trading accuracy (Hotel)** | False or reckless structure/risk teaching |
| **Member psychology (Tango)** | Dependency mechanics, humiliating paywalls, profit-claim culture |
| **Taleb lineage (Victor)** | Cargo-cult “antifragile” slogans and prophecy theater |
| **Spitznagel lineage (Whiskey)** | Free-lunch hedges, panic-hedge folklore, preservation sold as profit engine |
| **Mandelbrot lineage (Yankee)** | Mild-Gaussian risk stories dressed as fat-tail education |
| **Draft-first + human publish** | Unreviewed content going live on the member product |

So P1’s public and member surfaces stay coherent with FatTail doctrine even as production scales.

### 3.4 Operating capabilities (run P1 without living in the UI)

| Capability | What P1 operators gain |
|---|---|
| **Agent identity** | Mutations attributable to agents (not shared admin cookies); scoped credentials |
| **Backlog** | Intent enters as work items (seed → claim → produce → validate → publish/reject) |
| **Skills** | Checkable procedures for “place lesson video,” “refresh hub copy,” “attach resource,” etc., derived from the Admin Guide |
| **Workflows** | Multi-step, resumable production (e.g. transcript → course pack → review → place on Labs) |
| **Audit spine** | Who produced what, who gated it, what was verified — institutional memory mechanized |

P1’s Admin Guide sections become **proto-skills**; P2 makes them executable by agents against the same endpoints humans use.

### 3.5 Throughput without dual systems

| P1 constraint | P2 capability |
|---|---|
| Human admin time is the bottleneck for authoring | Agents claim backlog items and produce proposals 24/7 |
| Every surface must stay consistent (draft, SEO, notes, video) | Workflows produce **placement packages** that hit all required fields together |
| Fail-loud API already rejects bad payloads | Agent loops self-correct against validation errors |
| Characterization suite defines “platform still works” | Studio packets can require suite green before/after placement |

**Non-capability (explicit):** no parallel agent-only write path. If it is not on the P1 governed surface, P2 does not invent it.

---

## 4. What lands on which P1 surfaces

| P2 work product | P1 surface (examples) |
|---|---|
| Course structure + copy | Catalog, course detail, modules/lessons (admin API / in-place model) |
| Lesson VO video | `lessons.video_id` + params (YouTube provider) |
| Lesson notes | Lesson notes markdown (member + free-preview rules) |
| Free-preview decisions | Lesson free-preview flags + public SEO/AEO implications |
| Resources | Resource library / course attachments |
| Trailer | Course trailer video fields |
| Hub intro | Hub CMS intro video + lead copy |
| Category / hub refresh | Category descriptions, hub FAQ/content fields |
| Live descriptions (when in workflow scope) | Live sessions admin surfaces |
| SEO fields | Titles, meta, structured-data inputs already owned by P1/Sierra |

P2 **proposes**; P1 **stores and serves**. Human publish on P1 remains the member-visible gate unless doctrine later relaxes a specific surface.

---

## 5. Pipeline → P1 handoff

Default **course** path:

```text
Intent (human seed)
  → Bravo research pack
  → Hotel (+ Victor / Whiskey / Yankee as frame requires)
  → November learning design + lesson plans + resource list
  → Romeo scripts (plan-locked)
  → Hotel / Tango / lineage re-check
  → Papa render + dual package
  → Human validate
  → Place on P1 as drafts (same admin/API as humans)
  → Human publish on P1
```

**Shorts** may skip November when no course bundle is in scope; they still require research (or an approved moment list), doctrine gates, and human publish policy.

**Handoff contract to P1 (conceptual):**

1. All claims sourced (Bravo) and accuracy-checked when trading (Hotel)  
2. Courses: lesson plans + resources exist before video is treated as “complete”  
3. Scripts approved before render  
4. Placement uses real IDs/fields P1 already validates  
5. Nothing member-visible without human publish (default)

---

## 6. What P2 does *not* provide to P1

| Out of P2’s gift to P1 | Owner |
|---|---|
| Member auth, entitlements, billing | P1 (Mike/Alpha) |
| Player, progress, enrollment mechanics | P1 |
| Design tokens / UI chrome | Echo / Charlie |
| Infrastructure, deploys, nginx | Foxtrot |
| A second CMS or shadow database of “real” courses | **Forbidden** — P1 DB remains source of truth for published product |
| Autonomous publish that skips human judgment | **Forbidden** by default (charter non-goal) |
| Import of MarketSwarm-Canonical code | **Forbidden** — API-only product boundary |

P2 may **use** P1 APIs; it does not **become** a second Labs.

---

## 7. Bench roles that deliver these capabilities

| Capability area | Agents |
|---|---|
| Research | **Bravo** |
| Instructional design & resources | **November** |
| Scripts (all formats) | **Romeo** |
| Video & packages | **Papa** |
| Trading accuracy | **Hotel** |
| Lineage philosophy/strategy | **Victor**, **Whiskey**, **Yankee** |
| Member dignity / capacity | **Tango** |
| Public acquisition copy | **Sierra** (P1 surface; studio feeds candidates) |
| Platform placement implementation | **Alpha** / **Charlie** when APIs or UI gaps appear |
| Orchestration | **Juliet** |
| Evidence gates | **Delta** |

Full charters: `agents/bench/<callsign>.md`.

---

## 8. Success from P1’s point of view

P2 is successful for P1 when:

1. **Library growth** — new modules and resources appear as drafts on Labs without the founder living in the in-place editor for every field.  
2. **Quality holds** — educational, doctrine, accuracy, and lineage gates leave fewer bad lessons on the member path than unaided human rush.  
3. **One operating surface** — every agent mutation is explainable as an admin-capable action on P1 (or an explicit channel publish), with attribution.  
4. **Channel and product align** — shorts and long-form reinforce the same pathway and “stop the bleeding” thesis as the course library.  
5. **Operating week test** — humans only seed the backlog and press approve; P1 still receives complete, placeable content packages.

---

## 9. Dependencies P2 places *on* P1

P2 is not free of requirements back onto the platform:

| P1 must continue to provide | Why P2 needs it |
|---|---|
| Complete admin/API for operator actions | Agents use the same surface as the UI |
| Draft → publish lifecycle | Proposal/validation gate |
| Fail-loud validation | Agent self-correction |
| Domain-speaking contracts (categories, intents, allowlists) | Agents reason in product language |
| Characterization suite | Regression bar after placement |
| Spec + decision-log culture | Agents and humans share doctrine |
| Media / revalidation pipelines | Assets and public pages stay coherent |

Gaps P2 is expected to close on the platform side (pillar work, not a rewrite):

- **Agent identity & scoped credentials** (beyond shared admin session cookies)  
- **Backlog** (work-product model + UI/API)  
- **Mechanized audit** of agent actions  

---

## 10. Related documents

| Doc | Role |
|---|---|
| `agents/p2-foundation/CHARTER.md` | P2 purpose, pillars, non-goals, success criterion |
| `Specs/FatTail-Labs-Course-Hosting-Spec-v1.0.md` | P1 product spine and original phase table |
| `docs/ADMIN-GUIDE.md` | Human operator procedures → proto-skills for P2 |
| `docs/P1-Foundations-Review.md` | What P1 already shipped |
| `agents/bench/*.md` | Archetypes that execute and gate studio work |
| `Architecture/00-decision-log.md` | Binding decisions as they land |

---

*This document describes capabilities P2 is designed to provide to P1. Implementation lands via ratified pillar specs, seeds, and Delta gates — not by this narrative alone.*
