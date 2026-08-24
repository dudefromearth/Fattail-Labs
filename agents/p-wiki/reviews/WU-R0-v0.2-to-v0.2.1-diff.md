# Landing diff — Wiki Spec v0.2 (advisor draft) → in-tree v0_2_1

**Charge:** Coach 2026-08-23 additional R0 deliverable. India’s R0-1 verdict
covers this file.  
**Sources:** `Specs/FatTail-Labs-Wiki-Spec-v0_2.md` (2026-08-23 15:18) ·
`Specs/FatTail-Labs-Wiki-Spec-v0_2_1.md` (2026-08-23 15:29).  
**Command:** `diff -u Specs/FatTail-Labs-Wiki-Spec-v0_2.md Specs/FatTail-Labs-Wiki-Spec-v0_2_1.md`  
**Neither file’s title line changed** — both still read `# FatTail Labs — Wiki Spec v0.2 (Unified)`. Filename is `v0_2_1`; body title is still v0.2.

India classifies each hunk: **RECON** (IV.6 dispositions, version/header) vs
**BEYOND** (new product or process law, even if labeled Coach). Silent
unlabeled body edits: none found.

---

## Hunk 1 — Contents TOC (after doctrine paragraph)

**Class: RECON (version/header).** Adds a contents map of Parts I–IV. No
normative sentence changes.

---

## Hunk 2 — I.1 Always reachable

Advisor v0.2:

> Absence of the launcher on an admin surface is a defect, not a default.

In-tree v0.2.1 appends:

> — where mounting is lawful: the principle directs rollout priority across
> program-owned and three-OK'd surfaces; it never licenses touching a frozen
> tree (DL-539 always governs the mount, never the other way around).

**Class: BEYOND recon.** Coach-dated clarification, not silent, not IV.6.
New binding: standing presence does not punch DL-539.

---

## Hunk 3 — II.1 `registration`

Advisor v0.2 ended at “extending the package is a source-side obligation.
Page is a consequence of registration (OD-4)… Version bumps = new contract.”

In-tree v0.2.1 adds (Coach 2026-08-23):

1. Factory Deploy gate requires a complete Help Package; wiki rejection is
   defense against any other source.
2. **New-vs-update declaration:** agent determines from template identity +
   version against ledger and existing pages; the drafted page **declares
   which**.
3. Factory **emits** the registration contract as a Deploy side-effect
   (after Live).
4. Until that hook: wiki-side poller on the Factory registration path
   (OD-5; “the Wiki is prompted, or it monitors the Factory”).

**Class: BEYOND recon.** New product law for WU-3. Not IV.6. Not silent.

---

## Hunk 4 — IV.5.1 first-seed discovery

Advisor v0.2: floating agent slice includes owed WA-4 record checks.

In-tree v0.2.1 inserts: discovery report (Help bot mount: exact file, tree,
frozen/open) is a **named deliverable of the first seed, gated by India
before any chrome-adjacent code.**

**Class: BEYOND recon.** Process law for WU-1-0. Not IV.6. Not silent.

---

## Not in the diff (IV.6 items)

| IV.6 item | In this landing diff? |
|-----------|------------------------|
| (a) Agent spec v0.1.3 §7 carve exact wording folded into II.5 | **No.** II.5 is identical in v0.2 and v0.2.1. Carve review is R0-1 vs v0.1.3, not this diff. |
| (b) Member Wiki v0.1 9-line edit | **No.** Lives in `Specs/FatTail-Labs-Member-Wiki-Spec-v0.1.md` (WA-4). Disposition in the bench plan. |

No other hunks. No MSC, no store-of-truth change, no deleted Coach sentences.

## India GO-SPEC test

Plan/Coach: GO SPEC only if the landing diff is **reconciliation-only**.

**Result: FAIL the grant condition.** Hunks 2, 3, 4 are Coach-visible product
or process law beyond IV.6 / version-header. They are not silent. They still
exceed the stated test.

**India does not treat them as architecture BLOCKING** if Coach confirms they
*are* the v0.2.1 bump. Until that confirmation, **do not proceed to GO SPEC.**
