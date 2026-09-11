# Position Control Bench Plan v1.0 — Review Disposition

**Date:** 2026-09-11
**Reviewer:** Advisor (Claude), acting as reviewer only — this program's plan is Grok Build's
**Subject:** Grok Build's `Options Lab Position Control — Full Agent Bench Plan v1.0`
**Second input:** Grok Advisor's review of that plan
**Purpose:** Tell Grok Build which findings to act on and which to disregard, with evidence for each.

**MACHINE — verification below was run on COACH'S MACBOOK (dev)** against
`/Users/ernie/Fattail-Labs` at `34b84a7`. Nothing was modified.

**Headline:** the plan is sound and was written from the repo. Take **four** findings. Disregard
**six** — they are artifacts of the reviewer holding a stale Spec. One hash problem is the Advisor's,
not the plan's.

---

## 0. Evidence — the review was run against a stale Spec

Grok Advisor's P0-2 states the plan "cites vapor," that the Spec "ended at AT-PC-51," and that
PC-SYM-9, PC-STRAT-13, PC-TOS-5 and AT-PC-52…59 return nothing on repo search. Run on Coach's
MacBook, against the file whose hash the plan pins:

```
$ shasum -a 1 Specs/FatTail-Labs-Options-Lab-Position-Control-Spec-v1_0.md
f6c2d9b440cbf3a1a80ced7d2fbf98f0f8a90420      ← identical to the plan's pinned hash

PC-SYM-9      present        AT-PC-52     present
PC-STRAT-13   present        AT-PC-53     present
PC-TOS-5      present        AT-PC-59     present
last AT in file: AT-PC-59

"two serialisations"            present   (PC-TOS-5)
"strike distance in points"     present   (§4.4 wing-equality unit)
"rewrites every leg"            present   (PC-LOCK-14)
"instant of the Log gesture"    present   (PC-LIFE-7)
```

Grok Advisor reports holding files that hash to `0115c909…` and `fdd8d06b…`. Neither is on disk.
Those are pre-correction drafts.

**Grok Build planned against the correct file.** No citation in the plan is vapor.

**The procedure Grok Advisor prescribes is still correct and is retained in §4 below:** W0-0's first
act is to hash the Spec and grep every citation. That discipline is what would have caught this
error, and it stays in the token.

---

## 1. ACCEPT — four findings

### A1 — Undo moves ahead of the record model. **PC4 after PC1, before PC2.**

**This is the most important finding in the review and it is correct.**

The Advisor's argument holds and the plan's footnote ("card inline writers wait until PC4-G PASS")
does not close it:

- The card is **already** a live writer today — `shiftCardStrikes` is wired to
  `analyzer-pos-strike-up/down`. There is no "becomes a writer" moment to gate on.
- PC2 task 4 ships the **POS stepper**, which writes every leg in one action. New gesture, larger
  blast radius, no Cmd-Z.
- A mistyped per-leg quantity silently re-derives the name to CUSTOM (PC-QTY-4). New gesture,
  one-way.
- PC2-G's exit walkthrough has Coach performing exactly those gestures on his machine.

**PC4's dependency on PC3 is invented.** The undo stack is a bounded ring of book snapshots. It needs
immutable whole-array writes, which exist today. It does not need the structure signal. Moving PC4
earlier is close to free.

**Advisor note on the source constraint.** Spec §6 constraint 1 reads *"Undo lands before the card
becomes a live writer."* That wording is imprecise — the card already is one — and the plan's reading
was defensible against it. The constraint should read:

> **Undo lands before any packet expands what a single gesture can destroy.**

That sentence is the Advisor's to fix in the Spec, not Grok Build's to work around.

**Do not take the fallback** (freeze member gestures through PC2, make PC2-G programmatic-only). It
costs the walkthrough that proves the quantity model against real chain data, which is the most
valuable evidence in that gate.

**One seam:** PC-UNDO-7 (undo-across-Submit reopens Create bound to that draft) is a PC5 behavior.
PC4 lands the stack; that wire finishes at PC5. Split **AT-PC-50** across PC4 / PC5 the way AT-PC-26
is already split.

**Also align the ASCII tree to the phase table.** The table says PC5 depends on PC4; the tree draws
them as siblings. The table is right.

### A2 — Split PC9. Three seams behind one gate.

PC9 currently carries autofit + AF-L5 amend, the promotion mapper + snapshot + migration, and a
persistence restatement. Only the middle one has a schema dependency.

| New phase | Contents | Depends |
|---|---|---|
| **PC9a** | Autofit on the structure signal · AF-L5 amend | PC3 |
| **PC9b** | Mapper rewrite · promotion snapshot · migration · TM gates | PC6 |

Neither needs PC8. As drawn, the Trade Log work queues behind symbol groups and hit targets.

**AT-PC-47** (`rehearsal` / `visible` survive a persistence round-trip) sits on both PC0 and PC9.
Persistence belongs with **PC0** — that is where the preserve-list defect is closed. Drop it from PC9.

### A3 — Name the tick-band source path.

PC1 says the table is authored "from published contract specs." That is not a path, and PC-CHAIN-7
forbids an invented default. PC1 will reconstruct SPX's bands from memory unless the seed either
names the source file or attaches the table as a fixture to transcribe.

The Spec's fail-loud requirement is satisfied either way; what is missing is provenance.

### A4 — Four gate and seating corrections.

| Item | Correction |
|---|---|
| **PC2-G cannot demo "lock stands"** | CHECK PRICE does not exist until PC6. At PC2, assert only that a programmatic POS scale leaves the lock **field** untouched. The chip assertion is PC6-G. AT-PC-26 is already split — keep it that way |
| **Tango at PC5-G and PC6-G** | Cancel-vs-Close copy ships in PC5; CHECK PRICE Keep / Unlock copy ships in PC6. S6 already assigns Tango that copy. PC8 keeps the grid and the respect question |
| **New AT at PC6** | *The CHECK PRICE numeral renders visibly not-current* — marked, never styled as a live BASIS. AT-PC-44 covers the chip, the two exits and the canvas, but not this. It is what stops a member copying a script believing it carries the kept number |
| **Allowlist** | Fine that W0-2 names exact files. PC2 must not start against §8.2 as a bag of hosts — PC2 touching `PositionBuilder.tsx` while declaring dialog chrome out of scope will drift. Seeds subset; Delta fails extra files |

---

## 2. DISREGARD — six findings, already closed

Each was true of the Spec draft the Advisor holds and is false of the Spec on disk.

| Finding | Disposition |
|---|---|
| **P0-2 "cites vapor"** — PC-SYM-9, PC-STRAT-13, PC-TOS-5, AT-PC-52…59 absent | **All present.** §0 evidence. The plan cites the hashed file correctly |
| **P0-3 hash fidelity / TOS-2 collision** | The disk file at `f6c2d9b4…` **contains** the TOS-2 current-price rewrite. L11 matches it. There is no colliding sentence to stamp |
| **P1-4 mapper / script sentence missing** | **PC-TOS-5** is on disk: the script and the Trade Log row are two serialisations of one number; script always `@LMT`; `order_type` derives from `lockSource`. Coach stamped this 2026-09-10. PC9's LIFE-10 wording is correct |
| **P1-7 wing equality undefined** | Defined in §4.4: **strike distance in points**, equivalently listed-grid steps; not percent, not premium |
| **P1-12 Buy/Sell vs per-leg side** | **PC-LOCK-14** already states package Buy/Sell rewrites every leg's side and is the only package-level side control |
| **P1-13 basis at Log instant** | **PC-LIFE-7** already states the captured basis is the current price at the instant of the Log gesture — the same number a script copy would have carried |

**One residual worth keeping from P1-7.** The unit is defined, but the Advisor's *migration* concern
is independently valid: a stored 1-2-1 whose wings differ by a floating-point hair would re-label as
BWB. PC2's migration should compare wing distance on the listed grid with a tolerance, not by raw
float equality. Add it to the PC2 seed; it is not a Spec change.

---

## 3. Advisor's own defect — the live hash problem

Not the plan's, not Grok Advisor's. Mine.

The persistence law in the Spec was wrong about the as-built. `analyzerBook.ts` dual-writes
`sessionStorage` and `localStorage` and **reads `localStorage` first** (line 398) — the un-logged book
survives a browser restart today. PC-PERSIST-1 said "session-scoped," and the plan's §1.1 listed that
under **Keep**. Implementing it literally would have destroyed positions Coach was holding.

Corrected 2026-09-11, Coach stamped: the book is **local-durable** — survives a restart on this
machine and browser, still not a system of record. **AT-PC-60** added. The gap-map row is reversed and
now warns against "fixing" it to session-only.

**Consequence for the plan:**

| Line | Change |
|---|---|
| Plan line 16 — hash | `f6c2d9b440cbf3a1a80ced7d2fbf98f0f8a90420` → **`cde65d2e0cc9a3cfb738a7394fcfa129e545ed8b`** |
| Plan line 16 — path | `Specs/…Spec-v1.0.md` → **`Specs/…Spec-v1_0.md`** (the disk filename uses an underscore; this is the one link in the plan that does not resolve) |
| §1.1 Keep table | "Persist key … Session-scoped" → **local-durable; survives restart; the defect is only the dropped `rehearsal`** |
| §7 matrix | Add **AT-PC-60** at PC0 |

The corrected Spec must replace the copy in `Specs/` before W0-0 hashes it.

---

## 4. What W0-0 must do

Retained from Grok Advisor's review — the procedure is right even though its own run used the wrong
file.

1. `shasum -a 1` the Spec on disk; compare to the plan's pinned hash. Mismatch = **BLOCKED**.
2. India greps **every** L1–L21 citation and every `AT-PC-*` against that file. Missing IDs are
   folded into the Spec (new hash) or struck from the plan.
3. Fix **L16** — it cites "PC-LIFE-1 · 4 · 57." There is no PC-LIFE-57; that is AT-PC-57. Typo
   regardless of the staleness question.
4. Hotel's W0-4 confirm covers the classifier table **including** the side-pattern predicates, the
   wing-equality unit, and all-long 1-2-1 → CUSTOM.
5. Name the tick-band source path in the PC1 seed (A3).
6. Then, and only then, tick BUILD AUTHORITY and lock L1–L21.

---

## 5. Verified sound — do not re-litigate

Checked on Coach's MacBook at `34b84a7`:

- **All sixteen source files** the plan names exist at the paths given.
- **No Vitest** in `web/package.json` — Playwright only. The `npx tsx` + `node:assert/strict` runner
  call is correct.
- **Persist key** `ft_options_lab_analyzer_positions_v2` is real.
- **The import-cycle prescription is derived, not repeated.** `optionBind.ts` value-imports
  `isOptionPointerExpired` from `analyzerBook.ts`, so the merge leaf is genuinely required.
- **Every document link resolves** except the plan's own primary-law path (§3 above).
- **PC0-after-GO** corrects the Advisor's earlier bench plan, which proposed pulling it ahead of the
  stamp in contradiction of the Spec's own sentence. Grok Build was right to refuse it.

---

*Disposition v1.0. Four accepts, six disregards, one Advisor defect. No product code before W0-0 GO.*
