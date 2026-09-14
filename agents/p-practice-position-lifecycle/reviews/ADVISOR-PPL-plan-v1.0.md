# Practice B0 Bench Plan — Advisor Review v1.0

**Status:** Review. Advisory, not a GO, not an authority document.
**Date:** 2026-09-14
**Reviews:** `Practice-Position-Lifecycle-Full-Agent-Bench-Plan-v1.0` (Juliet).
**Against:** `Practice-Position-Lifecycle-B0-Focused-Audit-v1_1.md` (the analysis law), the audit
invariants, and the W0 stamp series.
**Reviewer:** Advisor (Claude). Third seat in the pipeline Coach named: Grok opined → Juliet + bench
drafted → this review.

**Filed:** 2026-09-14 StudioTwo. Juliet fold: plan **v1.1** + `PPL3-4` caller-audit seed. Not a stamp.

---

## 0. Verdict

**SOUND — ready to stamp PPL0, with five items to decide consciously (§2) and one limit on this
review (§1).**

The plan carries the audit's spine faithfully, freezes the matcher correctly, sequences the cheap
fix first, and — importantly — **Grok's amendments genuinely improved the analysis**, they are not
cosmetic. Two of them (§3) correct my own audit. Nothing in the plan contradicts a stamp or breaks a
sacred invariant. The governance and isolation discipline is real, not theater.

This is a plan I would put my name on. The items below are for your judgment, not defects that block
the stamp.

---

## 1. The limit on this review — stated plainly

**I reviewed the plan; I did not see the two artifacts upstream of it.** The plan cites a
`Practice-Position-Lifecycle-Spec-v0.1 DRAFT` it executes, and a Grok opinion "SOUND WITH AMENDMENTS"
it folds as `PPL0-A*`. **Neither reached me** — I generated the Grok *review prompt* last turn but
never saw Grok's actual reply or the spec.

So I can vouch for the plan's **internal coherence and its fidelity to the audit**. I cannot vouch
that it faithfully reflects the spec or quotes Grok correctly. Before PPL0-G, **India or Coach should
confirm the plan matches the spec v0.1** — the plan itself asks for spec v0.1.1 in PPL0-1, so that
check fits naturally there. This is the pre-flight-by-content rule: two reviewers on two files with
the same name is exactly the drift the process exists to stop.

**Juliet / India (StudioTwo, same session):** spec v0.1 is on disk at
`Specs/FatTail-Labs-Practice-Position-Lifecycle-Spec-v0.1.md`. Grok opinion was given in-session
(SOUND WITH AMENDMENTS). Plan v1.1 records the fidelity check in §Advisor-A3: the spec does **not**
bake “accounts are highest / registry naming open.” Campaigns appear only as Trade Log **passive
stamp** (`practice_campaign_id`), same as Trade Log §17.

---

## 2. Decide consciously before you stamp

None of these blocks the stamp. Each is a choice the plan made *for* you with a sensible default —
you should make it knowingly.

### 2.1 A fourth concurrent active tree (governance)

§3 seats PPL as a **candidate fourth active program beside LIM, QFRIC, and XS**, firing when
`PPL0-W0` is stamped **and** the AGENTS.md active-program line is reassigned in the same stamp —
"Juliet rec, not three-OK theater."

That is a legitimate mechanism, but it is a real decision, and it sits against an older doctrine line
(the LIM spec quotes AGENTS.md: *"IKI Lab is the only active program"*). Either that line is already
superseded — LIM/QFRIC/XS are apparently all active — or there is drift in how many concurrent trees
the bench actually runs. **You are being asked to accept four concurrent active trees.** Fine if you
intend it; worth a beat if you did not. The alternative is to sequence PPL behind one of the three,
which costs calendar time but lowers the isolation-defect surface.

### 2.2 PPL3 can break existing close-posting callers (the one real gap)

Moving the four close gates to the API as **422** (PPL-3) means any *current* caller that posts a
close violating a gate, without the override flag, starts getting rejected. The plan handles the
obvious one — **import commit is exempted (OD-25)**. It does **not** call for a caller audit of
everything else that POSTs a close: seed scripts, demo-data builders, any bench tooling,
`duplicate-as-new`. If one of those legitimately posts an ungated close today, PPL3 breaks it silently.

**Recommend:** add a one-line task to PPL3 — *enumerate every current writer of a `TO_CLOSE` fill and
confirm each either carries the override or is exempted* — before AT-PPL-6 is inverted. Cheap; closes
the only genuine hole I found.

**Folded:** plan v1.1 · seed `PPL3-4-alpha-close-writer-audit.md`. PPL3-G cannot PASS without the inventory.

### 2.3 Hard delete stays (OD-19 default)

The plan defaults OD-19 to **hard delete + kit dialog**, soft-trash "not this board." The kit dialog
removes the *mis-click* risk that my audit flagged — but the act is still **irreversible**. My C1-4
finding raised close-vs-delete precisely because destroying a fill is unrecoverable. The kit dialog
addresses half of that; deferring soft-trash leaves the other half. Defensible scoping — just accept
it knowingly, since a member who confirms a delete they misunderstood has no undo.

### 2.4 The three genuinely-blocked gates (affirm the call)

The plan gives **no silent default** to **OD-9** (coverage window), **OD-22** (declarations store),
and **FI-PPL-1** (day-book/blotter hold disagreement) — the PPL4 packets that need them **do not
start**. This is the correct line: these are structural and irreversible, so they block rather than
default. I affirm it. The reversible ones (OD-21/23/24/25/19) correctly get defaults you can override.
This is exactly the "decide what you can, block on what needs the human" discipline.

### 2.5 The truth-model reconcile does not block this — but check the spec

Good news: this plan lives **below** the account/campaign/registry layer. It touches fills, the
matcher's read models, the API, and the import table — none of the hierarchy the stamp still has
stale (accounts-vs-campaigns highest, registry naming open). **So the unreconciled stamp does not
block PPL.** The one caveat: the **spec v0.1** it executes might reference the truth model in its
framing. Since I could not read the spec, flag for India: confirm spec v0.1 does not bake in the stale
"accounts are highest / registry naming open" framing. The plan itself is clean.

**India/Juliet fidelity (StudioTwo):** confirmed. Spec v0.1 has no “accounts are highest,” no
Position Registry naming, no campaign-as-SoR. `practice_campaign_id` is the existing Trade Log
passive host (parent §17). Plan and spec agree on that seam.

---

## 3. Where Grok/Juliet improved on my audit — record so it stands

Two corrections that are better than what I filed, and should not be walked back:

- **PPL0-A1 — "one grain, three call-site families," not "one function change."** My audit said one
  read-model change closes three findings. Grok sharpened it: one **SoR** (the match slot), consumed
  by **three families** of call sites (close-fill pairing · remaining-qty/still-open · delete guard).
  Same truth, more honest about the work. The plan's PPL2 names all three. Correct.
- **PPL0-A4 — two predicates, not one absorbing word.** I folded partial-residual and the
  truncated-import orphan under one "unfinished cycle." That was wrong. **A partial-residual (closed 1
  of 5, 4 still genuinely open) is not an unfinished cycle (an imported orphan with no known open).**
  Collapsing them would have mis-modeled the member's book. The plan splits them — partial-residual
  (C1) vs unfinished cycle (C2) — and that split should hold. This is the single best catch in the
  amendment set.

Also right, and worth affirming: **PPL0-A8** distinguishes synthetic / member / imported closes from
existing fields (`synthetic` + `entry_source`) rather than adding a `close_kind` column — build on
what exists, no migration. Good.

---

## 4. What the plan got right (so it is not re-litigated)

- **The spine is verbatim from the audit** and the matcher is frozen; `blotter_status_by_id` living
  in `matching.py` is correctly called a read model, not part of the frozen loop. That subtlety is
  exactly where a careless packet would have "rewritten the matcher" by accident.
- **PPL1 characterization locks the lie, then PPL2/PPL3 invert it.** AT-PPL-2…9 pass on current main
  and fail once fixed — the invert is the evidence. This is the right TDD spine and it protects
  `test_partial_close_leaves_remaining_units_open` from being broken by accident.
- **Parent-amend discipline (§8)** lands each stale-parent fix in the *same body of work* as the
  packet — documentation parity (invariant 6), not "later."
- **Isolation (§3)** names the frozen trees, fails any diff touching `AnalyzerPositionsList.tsx`, and
  keeps MiniTwo/DudeTwo out. Machine named (StudioTwo), ports named, `git add -A` forbidden.
- **PPL2 carries no OD** — the highest-leverage fix can run the moment PPL1 is green, with no Coach
  decision in its way. Front-loading the cheap honest fix is the right call.

---

## 5. Recommendation

Stamp `PPL0-W0` when ready. Before or in PPL0-1, fold in:

1. The **PPL3 caller audit** (§2.2) — the one substantive add.
2. India confirms **plan ⟷ spec v0.1 fidelity** and that the spec carries no stale truth-model
   framing (§1, §2.5).
3. A conscious tick on the **fourth-active-tree** question (§2.1) and the **hard-delete** default
   (§2.3).

Everything else is sound as written. This is ready.

---

## Document history

| Ver | Date | Note |
|-----|------|------|
| 1.0 | 2026-09-14 | Advisor review of Bench Plan v1.0. Verdict SOUND; five conscious-decision items; PPL3 caller-audit gap; two Grok amendments affirmed as improvements over the audit |
| 1.0 filed | 2026-09-14 | StudioTwo. Juliet: plan v1.1 · PPL3-4 seed · token ticks for §2.1 / §2.3. Spec fidelity check recorded. Still not GO. |
