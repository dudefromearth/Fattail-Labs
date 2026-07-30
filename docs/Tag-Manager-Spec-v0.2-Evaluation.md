# Tag Manager Spec v0.2 — Evaluation

**Date:** 2026-07-30  
**Spec:** [`Specs/FatTail-Labs-Tag-Manager-Spec-v0.2.md`](../Specs/FatTail-Labs-Tag-Manager-Spec-v0.2.md)  
**Supersedes:** Tag Manager Spec v0.1  
**Status of this note:** Advisory. Spec is DRAFT — not BUILD AUTHORITY.

**Related:**  
[`docs/Journal-Session-v0.5-and-Tag-Manager-v0.1-Evaluation-and-Plan.md`](./Journal-Session-v0.5-and-Tag-Manager-v0.1-Evaluation-and-Plan.md)  
(boards should now track **v0.2** for tags, **as amended by Coach locks below**)

---

## 0. Coach product locks (2026-07-30) — supersede parts of Spec v0.2

| Lock | Decision |
|------|----------|
| **Ownership** | Tags are a **system-wide resource Coach/admin controls**. Not a member-owned vocabulary. |
| **CRUD** | **Admin function only** — create, rename, merge, retire, delete, seed, categories. |
| **No `/me` tags** | No member vocabulary manager surface. Members do **not** create, rename, merge, or delete tags. |
| **Member role** | Members **select/assign/unassign** tags from the admin vocabulary on objects they own (journal, trades, …) — optional, multi-valued, never required. |
| **Auto-create from typed label** | **Off** unless Coach later re-opens — free-text would reintroduce member-created tags. Picker only (or typeahead against existing labels). |
| **Surfaces** | **Admin:** full Tag Manager lifecycle. **Member:** Resources hub (or equivalent) may **browse/learn** the lexicon + pickers on Practice surfaces. **Not** a personal tag CRUD app. |
| **Two-tier personal tags** | **Withdrawn for v1.** Spec v0.2 §§2, 5–6, 9 (`/me`), `member_tags` personal ownership model **do not ship** under this lock. |

**Implication for Spec:** Needs **v0.2.1 or v0.3** amendment (or GO note that voids personal-tier CRUD). Until then, **this section is product authority over conflicting v0.2 text.**

---

## 1. Executive verdict

| Dimension | Verdict |
|-----------|---------|
| Product direction (Coach locks) | **Clear.** One admin-curated system lexicon; members assign only. |
| Spec v0.2 as written | **Partially wrong for Labs now** — personal tier + auto-create + `/me` CRUD conflict with Coach. |
| What still holds from v0.2 | Context never gates; no P&L; no public tag index; categories teaching frame; merge/retire lifecycle; agent context-only; Family B on **assignments** to private objects; MSC as design not code. |
| Architecture under locks | **Simpler:** platform `tags` (lexicon) + polymorphic `tag_assignments`. No `member_tags` ownership layer in v1. |
| Placement | **Admin** CRUD · **Resources hub** for lexicon discovery (optional) · **pickers** on Practice · no `/me` tags |
| Ready for GO? | After Spec amend to match locks + taxonomy/Sierra + Mike aggregates |

**Recommendation:** Amend Spec to **admin-curated single lexicon + member assign-only**. Do **not** implement personal vocabulary CRUD.

---

## 2. What changed from v0.1 → v0.2

| Topic | v0.1 | v0.2 |
|-------|------|------|
| Vocabulary model | Single shared table | **Two tiers:** platform **lexicon** + **personal** tags |
| Identity across rename | Unclear | Immutable **`lexicon_key`** on seeded/adopted personal tags |
| Categories | Implicit | Four teaching categories (behavior / context / process / insight) + member categories |
| Seed | Open decision | **Seeded at account creation** + adopt-from-lexicon later |
| Capture | Assign only | **Auto-create** label on submit + near-duplicate **hint** |
| Sprawl | Retire/delete | **Merge** is primary sprawl control |
| Authorship | Coach open (curated vs private) | **Resolved in product:** curated lexicon *and* personal ownership of copies |
| Surfaces | Not fully specified | **`/me`** member vocab · **`/admin`** lexicon · picker elsewhere |
| Anti-features | Good list | Explicit **no P&L correlation**, no gamification (MSC cut) |
| MSC | N/A | Design ancestry; **HTTP vs independent** is open (§13.1) |
| Schema | `tags` + `tag_assignments` | `tag_lexicon`, `member_tags`, `member_tag_categories`, `tag_assignments` |

v0.1 is **insufficient** as the Spec says — one shared vocab cannot tag both courses and private journals honestly.

---

## 3. Strengths

1. **Governing idea** — “Trader labels; system mirrors.” Aligns with capacity over dependency and process integrity.  
2. **Two tiers** — Correct answer to public course vs Family B practice.  
3. **`lexicon_key`** — Enables teaching continuity and safe aggregates without owning member labels.  
4. **Seed + re-adopt** — Empty picker is the enemy; deletion is not permanent exile from the lexicon.  
5. **Auto-create for chat** — Required if Journal composer tags in the moment.  
6. **Hint not block** — Respects member language.  
7. **Merge** — Real sprawl control (v0.1 underweighted this).  
8. **No P&L on tags** — Correct cut from MSC; protects process-first.  
9. **Agent rule** — Context not instruction (kills tag-as-script).  
10. **Schema honesty** — Case-insensitive uniqueness as invariant; config-driven thresholds fail loud.  
11. **Standalone-repo awareness** — MSC as thinking only; HTTP optional decision.

---

## 4. Gaps and risks

| # | Issue | Severity | Owner |
|---|--------|----------|-------|
| 1 | **Surface placement:** Spec says `/me` + `/admin`. Coach preference was **Resources hub** (Library \| Lexicon). | **High (product IA)** | Coach · Echo · Sierra |
| 2 | **§13.1 MSC HTTP vs independent Labs** — blocks schema ownership and ops | **Blocking GO** | Coach · India |
| 3 | Seed content/descriptions not final | High for quality | Hotel · Tango |
| 4 | Aggregate counts + minimum population | Medium (privacy) | Mike |
| 5 | Course recommendation from `lexicon_key` usage (§13.5) — easy to drift into “system acts on labels” | High if built casually | Coach · Tango |
| 6 | Assignment row: exactly one of `tag_id` / `lexicon_id` — course vs member rules need crisp ACL matrix | Medium | India · Alpha · Mike |
| 7 | Seeding at **account creation** vs first Practice open — when, and for which identities (free/planless)? | Medium | India · Mike |
| 8 | Journal Session v0.5 still points at “Tag Manager” generically — pin **v0.2** and personal tags for Practice | Medium | Lima · Juliet |
| 9 | Migration of legacy journal tags / join tables | High at build | India |
| 10 | Near-duplicate algorithm undefined (Levenshtein? embedding?) | Medium | Alpha · Tango |
| 11 | `UNIQUE (tag_id, lexicon_id, object_type, object_id)` with NULLs — MySQL UNIQUE + NULL behavior must be designed carefully | Medium | Alpha · India |

---

## 5. Placement (locked by Coach 2026-07-30)

| Surface | Role |
|---------|------|
| **`/admin` (Tag Manager)** | **Only** place for tag/category **CRUD**, merge, retire, seed content |
| **Resources hub** (`/resource`) | Optional **Library \| Lexicon** — browse/learn admin vocabulary; no create |
| **Practice apps** (Journal, Trade Log, …) | **Picker** to assign/unassign existing tags only |
| **`/me`** | **No tag manager** |

No “My tags” lifecycle UI. No auto-create of new labels from free text.

---

## 6. Process-integrity checklist

| Invariant | v0.2 |
|-----------|------|
| System never labels for the member | §1, §8 |
| Tags never gates / scripts / required | §1, §8 |
| Agent: context not instruction | §8 |
| No P&L / win-rate on tags | §8, verification 13 |
| Family B personal tags + member assignments | §3 |
| Aggregates only via `lexicon_key`, never pure personal tags | §3 |
| Audit: no silent delete of tagged history | §7 merge/retire |

---

## 7. Impact on Journal Session v0.5

| Journal need | Tag Manager v0.2 |
|--------------|------------------|
| Optional chips / frame | Personal vocabulary + assign |
| Type-a-tag in chat | Auto-create (§6.1) |
| Agent context | Description only; personal labels + optional lexicon_key |
| No tag scripts | Explicit |
| Vocabulary not in Journal schema | Correct — assignments only |

**Build order remains:** Tag Manager core (member tags + assign) before Journal J4 chips. Lexicon admin can parallel. Seeding may couple to identity/onboarding (Mike/India).

---

## 8. Implementation slices (under Coach locks — admin lexicon only)

| Slice | Deliverable |
|-------|-------------|
| **TM0** | GO: Spec amend to admin-only CRUD; MSC HTTP decision; Resources hub lexicon browse |
| **TM1** | Schema: platform `tags` (+ categories) + `tag_assignments`; **no** member-owned tag definitions table |
| **TM2** | Admin seed + list active vocabulary API |
| **TM3** | Assign/unassign + read by object (family-scoped); **picker only** — no resolve-or-create new labels |
| **TM4** | Admin Tag Manager UI (CRUD, merge, retire) under `/admin` |
| **TM5** | Resources hub: Library \| Lexicon (read/browse only for members) |
| **TM6** | Export/purge **assignments** (not member tag defs) + Journal J4 picker |
| **TM7** | Characterization + Delta program gate |

**Critical path:** TM0 → TM1 → TM2 → TM3 → Journal J4  
**Parallel:** TM4 admin UI · TM5 Resources hub  

**Killed under this lock:** member_tags ownership · auto-create · personal merge · `/me` tags · seed-into-personal-copy model.

---

## 9. Bench review gates (v0.2)

| Gate | Agent | Focus |
|------|-------|--------|
| TM-R1 | **India** | Two-tier model, schema, taxonomies, MSC decision, NULL unique, seeding when |
| TM-R2 | **Mike** | Family B, aggregates, export/purge, planless seed |
| TM-R3 | **Hotel** | Seed terms + descriptions accuracy |
| TM-R4 | **Tango** | Seed tone; near-dup UX; adopt/delete; no shame |
| TM-R5 | **Sierra** | No public tag index; categories vs tags; **Resources hub if GO** |
| TM-R6 | **Echo** | `/me` vs Resources hub chrome |
| TM-R7 | **Charlie** | Picker, auto-create, merge UI |
| TM-R8 | **Alpha** | Schema, APIs, config fail-loud |
| TM-R9 | **Delta** | Spec-lock evidence |
| TM-R0 | **Coach** | GO + placement + MSC + §13.5 course suggest |

---

## 10. Coach locks (updated)

| Decision | Status |
|----------|--------|
| Admin-only tag **CRUD** | **LOCKED** (this message) |
| No `/me` tag manager | **LOCKED** |
| Member assign-only from system vocabulary | **LOCKED** |
| No free-text auto-create of new tags | **LOCKED** (unless Coach re-opens) |
| Resources hub for lexicon browse | **Preferred** (with Library) |
| MSC | Still open — default Labs-native |
| Aggregates min-N | Still open — Mike |
| Course suggest from tag usage | Still open — default **off** v1 |
| Seed list | Hotel + Tango content under admin seed |

---

## 11. Decision-log draft (on GO)

Use Spec §15, plus:

> Surface placement: …  
> Implementation: Labs-native (or MSC HTTP …).  
> Supersedes Tag Manager v0.1 and any single-table design in prior Session Specs.

---

## 12. Document history

| Date | Note |
|------|------|
| 2026-07-30 | v0.2 evaluation; boards retargeted from v0.1 |
| 2026-07-30 | **Coach lock:** system-wide admin-controlled tags only; no `/me` CRUD; assign-only for members |
