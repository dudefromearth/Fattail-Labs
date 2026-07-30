# FatTail Labs — Tag Manager Spec v0.2

**Status:** **SUPERSEDED** by [`FatTail-Labs-Tag-Manager-Spec-v0.3.md`](./FatTail-Labs-Tag-Manager-Spec-v0.3.md)
(admin-only lexicon as-built). Personal vocabulary tier in this draft was withdrawn by Coach.
**Supersedes:** Tag Manager Spec v0.1 (Labs, single shared vocabulary — insufficient).
**Level:** Platform. One system for courses, every Practice app, and later surfaces.
**Phase:** P1 — the platform structures content (INSTRUCTIONS §4 routing test).

**Prior art.** The MarketSwarm Tag Manager v1.0 is the design ancestor of §§2, 4, 6, and 8.
Reused as *thinking*, not as code — invariant 1 stands, and nothing here imports, vendors, or
depends on MSC. Whether Labs should instead consume MSC's tag service over HTTP is a live question
and is §13 item 1.

---

## 1. The governing idea

> **The trader labels. The system mirrors.**

Tags are the trader's semantic vocabulary — how they name their own experience. The platform seeds
a starting vocabulary and teaches shared terms, but the trader owns, renames, extends, and retires
their own. The system never labels on their behalf and never interprets what a tag means.

Tags are **context, never gates**. They control no access, select no script, change no requirement,
and reach agents as description rather than instruction.

---

## 2. Two tiers, and why

v0.1 proposed a single shared vocabulary. That cannot work, because Labs tags must serve two
incompatible kinds of object: a **course**, which is one thing shared by everyone, and a **journal
entry**, which belongs to one member and is Family B. A shared vocabulary can't express personal
language; a personal vocabulary can't tag a course, because there is no answer to whose tag it is.

| Tier | What it is | Owner | Applies to |
|---|---|---|---|
| **Lexicon** | The curated shared vocabulary — the terms Labs teaches | Admin | Courses, lessons, resources, wiki. Also the seed source for tier 2 |
| **Personal vocabulary** | Each trader's own tags | The member | Journal, Trade Log, Retrospective, Playbook — all Family B |

### 2.1 The link between them

When a member's vocabulary is seeded, each seeded tag keeps an **immutable `lexicon_key`** pointing
at the term it came from. The member may rename, recolor, recategorize, or delete it freely — the key
survives renaming.

This is the piece that makes the two tiers one system:

- A member renames *early exit* to *premature exit*. It is still `early_exit` underneath.
- A course tagged `early_exit` and a member's private entry tagged `premature exit` are recognizably
  about the same concept, without either side owning the other.
- Aggregate counts by concept remain possible even after everyone has renamed things.

Tags the member creates themselves carry **no** `lexicon_key`. They are purely personal, never
aggregated, and never surface anywhere outside that member's own data.

*This extends MSC's `system_key`, which exists on categories but not on tags — so in that design a
renamed tag loses its identity while a renamed category keeps it.*

---

## 3. Family boundary

| Layer | Family |
|---|---|
| Lexicon terms | Platform data |
| A member's personal tag definitions | **Family B** — the vocabulary a trader builds describes their trading |
| Assignment on a public object (course) | Public |
| Assignment on a member-owned object | **Family B** |

Rules that follow, and must hold:

- Aggregate concept counts across the member base are admin-visible. **Usage by an identifiable
  member is never shown to anyone but that member** — not on a leaderboard, a profile, a community
  surface, or in named analytics.
- Aggregates key on `lexicon_key` only. Member-created tags are excluded entirely; a rare personal
  tag is identifying by itself.
- Purging practice data (Practice Portability v1.1 §6) removes the member's tags and assignments and
  leaves the lexicon untouched.
- Tags and assignments carry `export_key` and travel in member export with the objects they annotate.

*Gate: **Mike**.*

---

## 4. Categories

Four seeded categories, and they do teaching work rather than filing work — they make a trader
separate what *they* did from what the *market* did from what they *learned*:

| Category | `system_key` | Meaning |
|---|---|---|
| Behavior | `behavior` | How you acted — execution and decision patterns |
| Context | `context` | What the market was doing — regime, conditions, events |
| Process | `process` | How it played out relative to plan |
| Insight | `insight` | What you learned |

This is the same separation the Retrospective's render order is built on, which is not a coincidence
and is worth keeping aligned.

Labels are renameable; `system_key` is immutable. Members may add their own categories.

The same four apply to lexicon terms, so a course about revenge trading is Behavior and a course
about volatility regimes is Context.

---

## 5. Seed vocabulary

Seeded at account creation. The empty room is the enemy — a trader who opens a picker and finds
nothing writes nothing.

**Behavior:** early exit · impatience · late entry · overtrading · revenge trade · sized too large ·
hesitation · chased entry
**Context:** high VIX · FOMC day · compression · trending · low liquidity · earnings · macro shift
**Process:** worked as expected · followed plan · broke rules · adjusted mid-trade · held through
pain · cut early
**Insight:** lesson learned · pattern recognition · bias spotted · thesis validated · edge identified

Each carries a description — the trader's codebook entry for what the term means. Each is fully
editable, retirable, and deletable.

**A deleted seed tag is not re-seeded.** But unlike the MSC design, the member can **browse the
lexicon and adopt a term back** at any time. Deletion should be reversible by choice, not permanent
by accident.

Seed content is **Hotel's** — these are trading terms and their descriptions must be accurate — and
**Tango's** for tone.

---

## 6. Capture and sprawl

### 6.1 Auto-creation

Any consumer may submit a label. If it does not exist for that identity, the system creates it —
default category, default color, no description — and links it. The consumer never needs to know
whether the tag existed.

This is what makes tags usable from a chat composer: the trader types a word in the moment,
organization happens later.

### 6.2 Near-duplicate hint

Auto-creation without a counterweight produces *early exit*, *exited early*, and *cut it early*
inside a month — and the seed vocabulary makes it likelier, because members create variants of terms
they already have.

On creation, if the label is close to an existing tag, offer the existing one. **A hint, never a
block** — the trader may always create the word they want.

### 6.3 Merge

Fold a duplicate into a canonical tag. Assignments are **re-pointed, never deleted**.

Merge is what actually controls sprawl; retire and delete do not, since neither consolidates
history. *(Absent from the MSC design, which has auto-creation without it.)*

Members merge their own tags. Admin merges lexicon terms.

---

## 7. Lifecycle

| Operation | Behavior |
|---|---|
| Create | Enters the vocabulary |
| Rename | Label changes; **id and `lexicon_key` stable**; no assignment breaks |
| Recategorize | Free |
| Merge | Assignments re-pointed to the canonical tag |
| Retire | Stops appearing in pickers; existing assignments stay readable |
| Delete | Only at zero assignments. Otherwise retire |

Deleting a tag that has assignments would silently edit records a retrospective may have reviewed,
which the audit posture forbids.

Admin operations on the lexicon are audited.

---

## 8. What is deliberately absent

**No P&L correlation.** MSC's `performance_tracked` field and its tag-versus-expectancy analytics do
not come across. "Your *held through pain* tag has a 62% win rate" is outcome framing inside a
process tool, and invariant 8 does not bend for a feature. Tags may correlate with **process**
signals — adherence, deviation frequency, cadence — and never with money.

**No gamification.** No tag counts on profiles, no most-used badges, no streaks, no leaderboards.

**No required tags.** Nothing anywhere requires one to create, save, or complete.

**No system-generated tags.** The system does not label the member's experience. It may show them
what they labeled.

**No public tag index in v1.** Public assignments render on the object, not as their own browsable
destination — tag pages are indexable thin-content surface area and an SEO decision, not a side
effect. *Gate: **Sierra**.*

**No agent instruction.** Tags reach an agent as context — "the member tagged this Pre-Market" —
never as a directive. A tag that changes what the agent does is the script selector rebuilt inside
the prompt, where nothing on screen would reveal it.

---

## 9. Surfaces

| Where | What |
|---|---|
| `/me` | The member's vocabulary: create, rename, recategorize, describe, color, merge, retire, delete, adopt from lexicon |
| `/admin` | Lexicon management, seed content, merges, aggregate concept counts |
| Everywhere else | A shared picker component, and chips where a surface wants them |

Labs has no settings modal; placement follows existing Labs chrome.

*Gate: **Echo**, **Charlie**.*

---

## 10. Schema sketch

```
tag_lexicon                          -- platform vocabulary
  id, lexicon_key UNIQUE, category_system_key,
  label, description NULL,
  status (active|retired),
  created_at, updated_at

member_tag_categories
  id, identity_id, label, system_key NULL, sort_order, created_at
  UNIQUE (identity_id, label)        -- case-insensitive collation

member_tags
  id, identity_id, category_id,
  label, description NULL, color NULL,
  lexicon_key NULL,                  -- immutable; NULL for member-created
  source (seeded|member_created|adopted),
  status (active|retired),
  merged_into_tag_id NULL,
  export_key,
  created_at, updated_at
  UNIQUE (identity_id, label)        -- case-insensitive collation

tag_assignments
  id, tag_id NULL, lexicon_id NULL,  -- exactly one, by target family
  object_type, object_id,
  identity_id NULL,                  -- set when the object is member-owned
  export_key, created_at
  UNIQUE (tag_id, lexicon_id, object_type, object_id)
  INDEX (object_type, object_id)
```

**Case-insensitive uniqueness is a schema invariant, not a preference.** *Early Exit* and *early
exit* are one tag. If the collation is ever changed to a case-sensitive variant, the guarantee breaks
silently.

Labs id conventions apply — `BIGINT UNSIGNED AUTO_INCREMENT`, not CHAR(36) UUIDs.

Thresholds — label length, charset, max categories, max tags, default category, default color — are
**config, fail loud**. No hardcoded policy values.

*Gate: **India**, **Alpha**.*

---

## 11. Capabilities

Capabilities rather than endpoints; contracts belong to India and Alpha.

- List a member's active vocabulary, for pickers.
- Resolve-or-create a label on submission, returning the tag.
- Assign and unassign on any object the caller may write.
- Read assignments for an object, scoped by that object's family.
- Member: rename, describe, recolor, recategorize, merge, retire, delete, adopt a lexicon term.
- Admin: manage lexicon terms and categories, merge, view aggregate concept counts.
- Export and purge participate in Practice Portability.

---

## 12. Reconciliation with existing taxonomies (blocking)

1. **Course categories** already structure the catalog and hub pages and carry SEO weight. Tags are
   additive descriptive vocabulary; they do not become a second structural taxonomy for courses.
   *India + Sierra.*
2. **Live-session categories** are audience contracts per the P1 charter, not descriptions. Tags
   carry no audience semantics and may never be used to express who content is for. *India.*

---

## 13. Open decisions

| # | Decision | Owner |
|---|---|---|
| 1 | Independent Labs implementation, or consume MSC's tag service over HTTP so a trader who uses both has one vocabulary. Standalone-repo pillar cuts toward independent; trader experience cuts the other way | Coach + India |
| 2 | Seed vocabulary content and descriptions | Hotel + Tango |
| 3 | Wiki: confirm the surface exists and is in scope | Coach |
| 4 | Aggregate concept counts — admin-visible at all, and at what minimum population before a count is shown | Mike |
| 5 | Whether a member's repeated use of a concept may surface the course carrying the same `lexicon_key`. Real teaching payoff, but it is the system acting on tag usage — decide deliberately rather than by drift | Coach + Tango |
| 6 | Migration of Journal Session v0.5 §5's inline vocabulary | India |

---

## 14. Verification

1. One vocabulary system serves every app; no per-app tag tables exist.
2. Rename preserves id and `lexicon_key`; no assignment breaks; concept aggregates unchanged.
3. Merge re-points assignments and deletes none; counts are preserved.
4. A tag with assignments cannot be deleted, only retired; retired tags leave pickers and stay
   readable on existing objects.
5. Auto-creation from a submitted label creates and links in one step; the near-duplicate hint
   appears and can be ignored.
6. Family B: a member's tags and assignments are unreadable by another member and absent from
   leaderboard, journey visibility, and named analytics.
7. Aggregates exclude member-created tags entirely and key only on `lexicon_key`.
8. Public assignments render on the object and produce no standalone tag page.
9. Purge removes member tags and assignments; the lexicon is untouched. Export includes both;
   additive import never duplicates them.
10. No surface requires a tag for any action.
11. Agent context contains tags as description; assert no directive phrasing reaches the model and no
    tag changes agent behavior.
12. Case-insensitive uniqueness holds; a collation change breaks a test rather than production.
13. No surface anywhere associates a tag with P&L, win rate, or expectancy.

---

## 15. Decision-log entry (draft, on approval)

> **Tags are a two-tier vocabulary: a curated platform lexicon and each member's own language.** The
> lexicon is admin-owned, tags public objects, and seeds every member's vocabulary at account
> creation; the member then owns their copy outright — rename, recategorize, merge, retire, delete, or
> adopt more later. Seeded tags carry an immutable `lexicon_key` that survives renaming, so the same
> concept remains recognizable across a course and a private journal entry without either side owning
> the other; member-created tags carry no key and are never aggregated. Tag definitions and
> assignments on member-owned objects are Family B; assignments on public objects are public; exposure
> follows the target, never the tag. Labels auto-create on submission with a near-duplicate hint;
> merge re-points assignments and is the sprawl control. Tags gate nothing, require nothing, select no
> script, and reach agents as context rather than instruction. No P&L or expectancy correlation ever,
> no gamification, no public tag index in v1. Course categories and live-session audience contracts
> remain the structural taxonomies. Design ancestry is the MarketSwarm Tag Manager v1.0, reused as
> design only — no shared code. Supersedes Labs Tag Manager v0.1. No profit claims. Family B isolation
> unchanged.
