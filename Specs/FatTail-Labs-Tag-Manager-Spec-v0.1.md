# FatTail Labs — Tag Manager Spec v0.1

**Status:** **SUPERSEDED** by [`FatTail-Labs-Tag-Manager-Spec-v0.2.md`](./FatTail-Labs-Tag-Manager-Spec-v0.2.md).
Do not use for GO or implementation.
**Historical:** DRAFT advisor output (single shared vocabulary — insufficient).
**Level:** **Platform.** One vocabulary for the whole system — not a per-app feature.
**Phase:** P1 (the platform hosts and structures content; routing test, INSTRUCTIONS §4).
**Supersedes:** the tag vocabulary defined inline in Journal Session Spec v0.4 §5, which becomes a
pointer to this document.

---

## 1. Intent

**Define the traders' lexicon once, and let it apply everywhere.**

A tag is a word from the vocabulary the platform teaches — the language a trader uses to describe
what they did and what they were thinking. Naming a thing consistently is part of the practice, so
the lexicon is a teaching artifact, not a filing convenience.

Applicable across courses, every Practice app (Trade Log, Journal, Retrospective, Playbook,
Reports), and — pending confirmation that the surface exists — the wiki.

**A tag is context. It is never a gate.** It does not control access, does not select a script, does
not change what is required of a member, and does not drive agent behavior as instruction (§8). This
constraint is the reason a shared vocabulary is safe to put at platform level: nothing depends on it
for correctness, so it can grow without breaking anything.

---

## 2. What a tag is and is not

| A tag is | A tag is not |
|---|---|
| A word in a curated shared vocabulary | A permission, entitlement, or feature flag |
| Descriptive metadata on a thing | A workflow trigger or script selector |
| Optional, multi-valued, removable | Required to create, save, or complete anything |
| Context supplied to an agent | An instruction to an agent |
| Cross-app by design | A second categorization scheme for courses (§5) |

---

## 3. Two layers, and the boundary between them

This separation is the whole architectural point.

| Layer | What it is | Family |
|---|---|---|
| **Definition** | The tag itself: id, label, description, status, relationships | Platform data. Not member data |
| **Assignment** | *This* tag on *that* object | **Inherits the family of the object tagged** |

So `butterfly` as a word is platform vocabulary. `butterfly` on a member's journal entry is
**Family B** — as private as the entry itself, because the set of tags a member applies to their own
practice is a description of their trading.

**Consequences that must hold:**

- A tag's usage count across the platform may be shown to admins. A tag's usage **by an identifiable
  member** is Family B and never appears on a community surface, a leaderboard, a profile, or in
  analytics that name the member.
- Assignments on public objects (a course) are public. Assignments on Family B objects are private.
  Same vocabulary, different exposure, decided by the target — never by the tag.
- Deleting a member's practice data (Practice Portability v1.1 §6) removes their assignments and
  leaves the vocabulary untouched.
- Tag assignments travel in member export alongside the objects they annotate.

---

## 4. Surfaces

| Surface | Assignment exposure | Owner |
|---|---|---|
| Courses, lessons | Public | Sierra (§5) |
| Resources | Public | Sierra |
| Journal sessions | Family B | Member |
| Trade Log trades | Family B | Member |
| Retrospectives | Family B | Member |
| Playbook entries | Family B | Member |
| Reports | Derived; follows source | — |
| Wiki | **Unconfirmed surface** — listed as intent, not designed here | Coach |

---

## 5. Reconciliation with existing taxonomies (blocking)

The platform already has two categorization systems, and a third must not quietly become a rival.

1. **Course categories** — public taxonomy, hub pages, SEO/AEO surface. Tags must not become a
   second way to categorize a course. Either tags are strictly additive descriptive vocabulary with
   categories remaining the structural taxonomy, or the two are deliberately merged in one decision.
   **India + Sierra.**
2. **Live session categories** — the P1 charter is explicit that a live-session category is an
   *audience contract*, not role plumbing. Tags are descriptive and carry no audience semantics.
   They may not be used to express who content is for. **India.**

**Public tag pages are an SEO decision, not a side effect.** If public tag assignments render
browsable pages, that creates indexable surface area, thin-content risk, and overlap with hub pages.
Default here is **no public tag index in v1** — assignments are visible on the object, not as their
own destination. Reversing that is Sierra's call with a spec bump.

---

## 6. Lifecycle

A lexicon that cannot be corrected becomes a mess of near-duplicates, so definitions need an
editable life while assignments stay stable.

| Operation | Behavior |
|---|---|
| **Create** | New definition enters the vocabulary |
| **Rename** | Label changes; the **id is stable**, so no assignment breaks and no member loses an annotation |
| **Merge** | Duplicate folds into a canonical tag; assignments are re-pointed, never deleted |
| **Retire** | Tag stops being offered for new assignment; existing assignments remain readable |
| **Delete** | Only when a tag has zero assignments anywhere. Otherwise retire |

Retire rather than delete is the rule: deleting a tag with assignments silently edits Family B
records, which the audit posture forbids.

Merges and retirements are admin actions and are audited.

---

## 7. Authorship — open

Two coherent models, and the choice shapes the product:

- **Curated only.** Admin defines the lexicon; members select from it. Teaches shared professional
  vocabulary, keeps the lexicon clean, and makes cross-member aggregate insight possible later.
  Members will hit words they want and cannot have.
- **Curated plus member-private tags.** Members add their own, which stay Family B and never enter
  the shared vocabulary. More expressive; the platform loses vocabulary consistency, and personal
  tags can never be aggregated or taught.

A middle path exists: members propose, admin promotes. That adds a queue and a review burden.

**Recommendation deferred to Coach** — this is a teaching-philosophy question more than a technical
one, and "define the traders' lexicon" reads as curated. **Tango** on how a member experiences
wanting a word that does not exist.

---

## 8. Agents and tags

**Tags are supplied to an agent as context, never as instruction.**

Permitted: "The member tagged this entry Pre-Market." That tells the agent what the conversation is
probably about.

Forbidden: anything that reads as a directive — running a sequence, walking a field set, adopting a
persona, or changing what the agent may ask. That is the script selector rebuilt inside the prompt
instead of the UI, where nothing on screen would reveal it.

Selected tags may appear in the assembled context of an agent prompt (Journal Session v0.4 §10). The
prompt template's handling of them is reviewable like the rest of the prompt.

---

## 9. Schema sketch

```
tags
  id, slug, label, description NULL,
  status (active|retired),
  merged_into_tag_id NULL,
  created_at, updated_at

tag_assignments
  tag_id, object_type, object_id, identity_id NULL,
  created_at
  PK (tag_id, object_type, object_id)
  -- identity_id set when the tagged object is member-owned; drives Family B scoping
```

One vocabulary table, one assignment table, polymorphic by `object_type`. No per-app tag tables —
that would be the second store of truth the doctrine forbids.

`identity_id` on the assignment is what makes the family boundary in §3 enforceable in a query
rather than in convention.

---

## 10. Capabilities required

Described as capabilities rather than endpoints; contracts belong to India and Alpha.

- List the active vocabulary, for pickers across every app.
- Assign and unassign tags on an object the caller may write.
- Read assignments for an object, scoped by that object's family.
- Admin: create, rename, merge, retire; view platform-wide usage counts.
- Member export includes assignments on member-owned objects.

---

## 11. Non-goals (v1)

Tag-driven scripts, workflows, or agent instruction · tags as permissions or entitlements ·
required tags anywhere · public tag index pages · tags as a replacement for course categories or
live-session audience contracts · scoring, gamifying, or leaderboarding tag usage · cross-member
visibility of who tagged what · per-app private tag tables · auto-tagging by model in v1.

---

## 12. Open decisions

| # | Decision | Owner |
|---|---|---|
| 1 | Authorship model: curated only, curated plus member-private, or propose-and-promote (§7) | Coach + Tango |
| 2 | Tags versus course categories — additive or merged (§5) | India + Sierra |
| 3 | Public tag index: confirm **no** in v1 (§5) | Sierra |
| 4 | Whether the wiki exists as a surface, and whether it is in scope (§4) | Coach |
| 5 | Seed vocabulary: which words ship, and who authors them | Coach + Hotel |
| 6 | Whether admin sees per-member tag usage at all, or aggregate only (§3) | Mike |
| 7 | Migration of Journal Session v0.4 §5's inline vocabulary into this table | India |

---

## 13. Verification

1. One vocabulary table serves every app; no per-app tag store exists.
2. Renaming a tag breaks no assignment and changes no member's annotation.
3. Merging re-points assignments; none are deleted; the count is preserved.
4. A tag with assignments cannot be deleted, only retired; a retired tag stops appearing in pickers
   and remains readable on existing objects.
5. Family B: an assignment on a member-owned object is unreadable by another member and absent from
   community surfaces, leaderboard, journey visibility, and named analytics.
6. Public assignments on a course render on the course and produce no standalone tag page.
7. Purging practice data removes that member's assignments and leaves the vocabulary intact.
8. Member export includes assignments on member-owned objects; additive import never duplicates them.
9. No surface requires a tag to create, save, or complete anything.
10. Agent context contains tags as description; assert no directive phrasing reaches the model, and
    that a tag cannot change the required-field set or open the structured pass.
11. Admin merge, rename, and retire are audited and attributable.

---

## 14. Decision-log entry (draft, on approval)

> **Tags are a platform-level shared lexicon, context only.** One vocabulary table and one polymorphic
> assignment table serve courses, every Practice app, and any later surface — no per-app tag stores.
> Tag **definitions** are platform data; tag **assignments** inherit the family of the object tagged,
> so the same word is public on a course and Family B on a journal entry, with member-identifiable
> usage never appearing on community surfaces. Tags never gate access, never select scripts, never
> alter required fields, and reach agents as context rather than instruction. Ids are stable across
> rename; merge re-points assignments; tags with assignments are retired rather than deleted. No
> public tag index in v1. Course categories and live-session audience contracts remain the structural
> taxonomies and are not replaced. Supersedes the inline vocabulary in Journal Session v0.4 §5. No
> profit claims. Family B isolation unchanged.
