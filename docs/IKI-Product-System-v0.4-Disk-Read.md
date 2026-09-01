# IKI Product System Design v0.4 — the disk read

**For:** Coach · **Date:** 2026-08-30 · **Tree:** `origin/main` @ `650bdf9e`

v0.4 §9 names four `[unverified]` facts and says **"Nothing should be planned before it."**
This is that read. v0.4's own rule applies throughout: **where the design and the tree
disagree, the tree wins.**

**Headline: three of the four are in better shape than the design assumes. The fourth
is worse — §5 re-introduces a deadlock Coach already ruled on four days earlier.**

---

## 1. What a template declares today

**The design assumes one template system. There are two.**

| | `HeatmapTemplate` | `RunnerTemplate` |
|---|---|---|
| Where | `web/lib/options-lab/templates/types.ts` | `web/lib/runner/registry.ts` |
| Registered | 6 — sym-fly, width-fit, bw-fly, vertical, ladder, gex | 3 — sym-fly, spread-tax, width-fit |
| Registration | static array, `HEATMAP_TEMPLATES` | `register()` into a `Map` keyed `id@version` |

`RunnerTemplate` is much closer to the §2.1 contract than the design expects:

| §2.1 declaration | `HeatmapTemplate` | `RunnerTemplate` |
|---|---|---|
| **Needs** | ✗ nothing — chain implicit in the `ChainContext` argument type | ✅ **`inputs: string[]`**, e.g. `inputs: ["chain"]` |
| **Produces** | ~ `layout: "table"\|"matrix"\|"profile"` — a render style, not a return | ✅ `outputKind: "visual/heatmap"` + `sinks: ["render"]`, **enforced** (`UNDECLARED_SINK`) |
| **Shape** | ✗ nothing | ✗ **nothing** — no minimum, no aspect ratio, no responsive flag |
| **Identity** | ~ `id`, `label` only | ✅ `id` + **`version`**; ✗ no author, no credentials |
| **Faces (§2.2)** | ✗ one presentation | ✗ one — but `sinks` is the same idea, already enforced |

**§1b is already half-solved.** The design says *"today every template assumes chain, so
naming the kind is a change to every one of them."* **Not on the Runner path** —
`inputs: ["chain"]` already names the kind explicitly, on every registered template. The
remaining work is widening two types (`RunnerStreams` has only a `chain` field;
`RunnerOutputKind` has one literal), not re-declaring every part.

**A bonus the design does not know it has.** `honesty`, `framing` and `nonClaim` are
**required fields** on every `RunnerTemplate`. §8's no-profit-claims boundary is already
enforced at registration, not only at review. Width Fit's reads:
*"Not a signal, fill, or recommendation. Observation only."*

**The migration path is proven, not hypothetical.** `runner/templates/heatmap.ts` is a
wrapper: *"Registration only — wraps the existing HM v0.2 Advanced Fly template. Do not
copy or edit web/lib/options-lab/templates/*."* An old template gains the new contract by
adaptation. Done three times.

**Verdict — genuinely missing: `shape` and `faces`.** Everything else exists or is a type
widening. This is not "the single largest unknown in the design"; it is the smallest of
the four.

---

## 2. How the Runner loads a template now

`web/lib/runner/registry.ts` + `host.ts`.

| §4 requirement | State |
|---|---|
| **Load** | ✅ `register()` → `Map` keyed `id@version` |
| **Versioned** | ✅ `get(id, version)`, `UNKNOWN_TEMPLATE` when absent |
| **Unload** | ✅ `host.ts` exposes `dispose()` |
| **Installed** | ✗ **registration happens at import time** |
| Validation | ✅ control defaults enforced at registration (`CONTROL_DEFAULT`) |
| Isolation | ✅ sinks declared and enforced (`UNDECLARED_SINK`) |
| Gating | behind `NEXT_PUBLIC_LABS_RUNNER_SHELL=1` |

**So §4's own sentence still stands, but narrowly.** *"A template that only ever exists
because the host imported it cannot be bought or removed."* True: the registry is
in-memory and populated by static import, so a part cannot be **installed** at runtime
without a rebuild. But load, version and unload — the other three-quarters — are built.

**The gap is distribution, not lifecycle.** That is a smaller problem than a rewrite, and
it is the same problem the store program has to solve anyway (a bought part must arrive
from somewhere).

---

## 3. Can the wiki agent answer "is this done"?

**Yes — and it will always answer "no" before publication, by design.**

`wiki_store.py`: `VALID_STATUS = {"draft", "published"}`, per-page status, counts queryable.
So the question is *askable*.

But Wiki Spec v1.2 **WK15 — "File at publish"**: the wiki row is written **on the board's
publish event**. Nothing exists before it.

### 3.1 Therefore §5's completeness gate deadlocks

§5 puts **Wiki page** inside the constellation and the gate **before staging**. A page
that is only filed *at publish* can never be present *before staging*. Nothing reaches
Staged, ever.

**Coach already found and ruled on exactly this, four days before v0.4.** Factory Spec
v1.1 §0.1 records it:

> *"§7.6 as previously written made Live unreachable. It required a wiki page before Live,
> and the Factory does not produce one."*

Ruling (**DL-583**): *"A wiki page is not a Live precondition. Product publishes, then goes
noisy until one exists."* v1.1 §7.3 accordingly ships **four** Staged artifacts — product,
landing page, store placement, help guide — and states *"The wiki page is not among them.
It is Oscar's, composed after publication from the published help guide."*

**v0.4 §5 reverses DL-583 without naming it.** Most likely unintentional — v0.4 was written
without a disk read. Fixing it is one line: drop the wiki page from the constellation, or
say the gate checks *intent declared* rather than *page exists*.

**This is the one finding that changes the design rather than confirming it.**

---

## 4. How the help system attaches to a feature

**Reuse, not new work — and per-product help already exists.**

- `server/help_reference/*.md`, discovered by glob, parsed into `## `-headed sections
  (`help_ai.py:110`).
- **`options-lab-heatmap-width-fit.md` is a per-template guide** — the exact per-product
  case §5 needs, already shipped for a template.
- Attachment is by **file presence**. No registry, no code change to add a guide.

**One caveat for the gate.** `help_ai.py:160`: *"Published help guides: every `*.md` present
in `help_reference/`. **No draft flag.**"* A guide is published the instant the file exists.
So "is the help guide done?" is checkable only as "does the file exist" — weaker than the
approval state the Factory now carries on Staged artifacts (migration 147), where an
artifact is produced, then explicitly approved by a human.

If the completeness gate is to mean anything for help, the Staged `help_page` artifact —
which does have produced/approved/blocked states — is the better thing to check than the
file.

---

## 5. Summary

| # | Item | Verdict |
|---|---|---|
| 1 | What a template declares | **Better than assumed.** Needs/produces/identity/version exist on `RunnerTemplate`. Missing: **shape**, **faces** |
| 2 | How the Runner loads | **Better than assumed.** Load, version, unload built. Missing: runtime **install** |
| 3 | Wiki "is this done" | **Askable — but §5 deadlocks.** Reverses DL-583. **Needs a ruling** |
| 4 | Help attachment | **Reuse.** Per-product help already proven. Caveat: no draft state |

**Sequencing note.** §5 places the completeness gate *before* staging. Factory v1.1 §7.3
(BUILD AUTHORITY) produces artifacts *in* Staged. These are incompatible orderings of the
same pipeline, independent of the wiki question, and only Coach can settle which stands.

**Not verified here** (out of §9's scope, flagged for honesty): `DRAFT-FatTail-Labs-IKI-
Product-System-Spec-v0_2.md` — the parent spec v0.4 is written against — **is not in the
repo**, so every `spec §…` cross-reference in v0.4 is unchecked.
