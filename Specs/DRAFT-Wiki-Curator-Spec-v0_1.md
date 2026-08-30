# Wiki Curator — Specification (DRAFT)

**Provisional filename and version. Coach names the real ones before this lands.**

| | |
|---|---|
| Status | DRAFT — advisor draft for bench review |
| Source | Spoken outline, working session 2026-08-24 |
| Program | Wiki |
| Relationship | Distinct agent from the Wiki Authoring Agent. See §5 for the boundary. |

**Scope statement.** Active program: Wiki. Files/trees this document describes:
the curator's charter, acquisition duties, and maintenance duties.
Touches outside program: **NONE** — source systems are named as poll targets
only and remain read-only.

---

## 1. The charter

1.1 The curator's charter is **continuous improvement of the wiki**.

1.2 Everything in §2 through §4 is an **instance of that duty, not the
definition of it**. Coach's framing:

> "When I first started this, the curator's job generally was to continuously
> improve the wiki, and these are some of the ways that it will improve it.
> There may be future additions to this rule set."

1.3 Therefore: **the rule set is expected to grow, and adding a rule is not a
change of mission.** A new improvement duty does not require re-chartering the
agent.

---

## 2. Acquisition

2.1 The curator polls for newly published material and adds it to the wiki
automatically.

2.2 Named endpoints so far — **four**:

- Courses
- Help files
- Templates
- Products

2.3 More endpoints follow as other surfaces expose publication signals. The list
above is current, not closed.

2.4 Acquisition is **poll**, per the existing ruling. Source systems remain
read-only and are asked for nothing.

---

## 3. Link hygiene

3.1 **Validate that links resolve.** Dead links are a defect and the sweep finds
them.

3.2 **Prune duplication within a page.** Five links from one page to the same
target adds nothing after the first, and it makes the page read like SEO spam
rather than a reference. The sweep collapses duplicates to the most useful
mention.

3.3 **Reciprocal links between pages are legitimate and stay.** If two pages are
genuinely related, both should point at each other; that is how a corpus becomes
navigable rather than a tree. The defect is duplication *within* a page, not
reciprocity *between* pages.

3.4 The sweep is **periodic, not one-time**. The corpus is expected to grow and
stay optimized as it does.

---

## 4. Outward weaving

4.1 The curator explores beyond the platform to build links. Named sources:

| Source | Nature |
|---|---|
| Coach's YouTube | Own property — trusted |
| Coach's Instagram | Own property — trusted |
| The blog | Own property — trusted |
| The sitemap | Own property — establishes the true public surface so URLs are known, not guessed |
| Relevant external sources | Third-party — see §4.3 |

4.2 **The asymmetry is real.** Own properties are trusted and stable. External
third-party sources rot, and a bad outbound link on a public wiki page is a
credibility hit.

4.3 **External sources are handled by a validation skill, not an approval
queue.** Coach's ruling: the judgment is encoded once, not asked every time.
The skill checks:

- the link resolves and is not dead
- the domain is credible rather than a content farm
- the content carries nothing that would embarrass the platform by association
  — including profit claims

4.4 External links are **re-validated on the periodic sweep**. A good link today
can rot in six months.

---

## 5. Boundary with the authoring agent

5.1 **The creator owns linkage at publish time**, or names the links it could
not make (`failed-partial`). See the Wiki Authoring Agent spec §7.

5.2 The curator's sweep is a **safety net, not the primary mechanism**. An
unlinked new page is an authoring defect that the curator catches — it is not
the curator's job to be the reason linkage happens.

---

## 6. Open items for Coach

| # | Item |
|---|---|
| 1 | Is an unlinked page at publish a *failed* contract or a *flagged* one? (Advisor read is flagged / `failed-partial`, but Coach has not ruled.) |
| 2 | Sweep cadence — undirected, no default written here |
| 3 | Whether the curator reports its sweep findings to the admin channel, or acts silently |
