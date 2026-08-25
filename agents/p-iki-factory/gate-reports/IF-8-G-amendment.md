# IF-8-G — Amendment Addendum (wiki_page dropped)

**Gate:** IF-8-G, amendment delta only — not a full re-gate. Original verdict
**PASS** (`IF-8-G.md`) stands; nothing in this addendum reopens it. **Spec:**
`Specs/FatTail-Labs-IKI-Factory-Spec-v1_1.md` §7.3, §8.10 (supersedes v1.0).
**Decision log:** DL-583. **Baseline:** the uncommitted IF-8 build itself
(never committed before this amendment landed on top of it in the same
change). **Verdict: PASS.**

---

## 1. What changed and why

DL-583 reverses part of DL-580: the wiki page leaves Gemba's scope. It was
never the Factory's artifact to build — the general derivation rule (every
publishable thing has a wiki page, always Oscar's) already covered it before
DL-580 built an exception. IF-8's original build seeded `wiki_page` as a
fifth Staged artifact, permanently `blocked`, citing v1.0 §8.10 as a named,
visible gap. That gap is now closed by removing the slot it named, not by
finding a way to produce it.

## 2. Scope of this amendment

- `STAGED_ARTIFACT_KINDS` drops to four: `product`, `landing_page`,
  `store_placement`, `help_page`. `WIKI_PAGE_GAP_REASON` removed — dead
  once the kind it explained no longer exists.
- `_mark_staged` seeds four `pending` rows. No special-cased `blocked`
  insert; the branch is gone, not left unreachable.
- `list_staged_artifacts`'s `ORDER BY FIELD(...)` placeholder count
  corrected from five to four (a literal SQL string, not derived from the
  tuple length — verified by hand, not just by the tuple shrinking).
- `produce_staged_artifact` drops the explicit `wiki_page` rejection
  branch. Requesting it now fails the same way any unrecognized kind
  would (`"kind must be one of: ..."`), because it's no longer a member of
  the enum at all — not a narrower rejection message for the same case.
- Migration `145_iki_factory_if8_staged.sql`: comment-only correction (the
  `kind` column was always an unconstrained `VARCHAR(32)`, so no DDL
  change is needed — the enum lives in application code only). Edited in
  place rather than superseded by a new migration because this migration
  has never been committed; it is not yet shared history.
- `IkiFactoryItemPanel.tsx`: `StagedArtifact["kind"]` union and
  `STAGED_ARTIFACT_LABEL` both drop `wiki_page`. No other rendering logic
  referenced it by name — the blocked-status display path is generic and
  needed no change.
- Test file re-authored, not silently trimmed: `test_staged_seeds_five_
  artifacts_wiki_named_gap` → `test_staged_seeds_four_artifacts_no_
  wiki_page` (asserts the set of four, no blocked row anywhere).
  `test_wiki_page_cannot_be_produced` → `test_wiki_page_is_not_a_valid_
  kind` (asserts the generic enum-rejection message, not the retired
  Wiki-program-specific one). `test_staged_to_live_gated_on_staged_
  ready_and_product_not_artifacts`'s docstring updated to state that
  §7.6's rewrite *confirms* Live isn't gated on artifact completeness
  rather than leaving it as an open tension — the assertions themselves
  are unchanged, because judgment call (a) below was never about
  wiki_page specifically.

## 3. Judgment call (a) from the original gate — status

The original `IF-8-G.md` named its single biggest disposition as: §7.6
read literally would make Live permanently unreachable, since `wiki_page`
could never be produced, and I chose not to hard-gate Live on artifact
completeness rather than regress shipped Live-reachability. **DL-583
resolves this from the spec side, confirming the code's prior choice**:
§7.6 is rewritten so a wiki page is explicitly not a Live precondition — a
product publishes and goes visibly noisy until one exists. The code did
not need to change to conform; the reading it already implemented is now
the ruled one. Nothing else in the four remaining judgment calls
((b) product-spec fields enterable in `staged`, (c) no client-trial UI,
(d) admin can stand in for Gemba) is touched by this amendment.

## 4. Full suite

```
server: 62 passed (unchanged count — 5 renamed/re-authored within
        test_iki_factory_if8.py, none added or removed)
```

`tsc --noEmit` on `IkiFactoryItemPanel.tsx` / `IkiFactoryBoard.tsx`: clean.
Pre-existing, unrelated `tsc` failures in `lib/options-lab/**` test files
are untouched by this change and untouched by this amendment.

## 5. What this amendment does not do

- Does not touch Staged→Live's gate logic in any way — `staged_ready` +
  product-completeness, byte-for-byte the same code path as before.
- Does not clean up any `wiki_page` rows a local dev database may already
  hold from testing the original IF-8 build. No production data exists;
  this is dev-only residue, harmless (an orphaned row keyed to a card,
  never read by any surviving code path) and not worth a migration to
  chase.
- Does not touch `agents/bench/gemba.md` — Coach lands that charter edit
  himself.
- Does not propagate "Knowledge app" terminology into this report's own
  code-facing prose beyond what the spec itself uses, since the rename's
  reach is explicitly flagged, not actioned, outside `v1_1.md`.

---

**Signed:** Delta. Verdict **PASS** on the amendment delta. The original
`IF-8-G.md` PASS is unchanged and this addendum does not supersede it —
read together.
