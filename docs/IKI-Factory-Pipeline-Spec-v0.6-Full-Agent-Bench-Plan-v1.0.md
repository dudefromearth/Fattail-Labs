# IKI Factory Pipeline Spec (DRAFT v0.6) — Full Agent Bench Plan v1.0

**Program:** IKI Lab (suite) · IKI Factory (inner app) · board `agents/p-iki-factory/` (existing).
**Draft of record:** [`Specs/DRAFT-IKI-Factory-Pipeline-Spec-v0_6.md`](../Specs/DRAFT-IKI-Factory-Pipeline-Spec-v0_6.md) — header: **Status: DRAFT — advisor draft**. Not build authority. Filename and version are the draft's own words: *"Provisional filename and version. Coach names the real ones before this lands."*
**Supersedes (as a draft, not as law):** DRAFT v0.5, v0.4, v0.3, v0.2, v0.1 of this same pipeline document (all 2026-08-24).
**Relationship to `Specs/FatTail Labs — IKI Factory Spec v0.1.5` (BUILD AUTHORITY, DL-556):** **undecided — the draft's own open item #2.** Not assumed here in either direction.
**Charter referenced:** `agents/bench/gemba.md` — currently itself a *"Draft revision reconciling the charter to the pull model. Coach lands it; the advisor does not."* Also not yet landed as law.
**Existing shipped state on this board:** `agents/p-iki-factory/ORCHESTRATOR.md` shows **GO IF-1 through GO IF-5 all granted and PASS-gated** (DL-559, 567, 569, 577, 578) under the **conveyor** model — auto-advance on stated preconditions. This draft's §3 replaces that model with **pull**. See **B1** below before assuming any of this is a green field.
**Juliet.** Sequencing plan only. No product code, no seed, and no GO token is authorized by this document. It exists so Coach can disposition the draft's nine open items and three drafting-stage blockers in one pass, and so implementation can start immediately once BUILD lands — not to pre-empt Phase 2–5 review.

---

## Up front (Coach Content Law)

Nothing in `DRAFT-IKI-Factory-Pipeline-Spec-v0_6.md` is altered, trimmed, or reinterpreted below. §12's nine open items are reproduced verbatim in §3. Every blocking item in §2 is a **sequencing** concern — evidence that something in the draft collides with already-shipped, gate-PASSed work or an unresolved neighbor boundary — not an edit to Coach's or the advisor's text. Where this plan disagrees or adds caution, it is labeled as this plan's opinion and Coach may discard it.

This draft has **not** been through Phase 2 (India), Phase 3 (Echo + Tango), or Phase 4 (Mike, Hotel) of `agents/bench/spec-create-review-workflow.md`. Per doctrine, Phase 6 execution planning (seeds, gates, GO tokens) does not begin until Phase 5 Coach stamp. Everything under §5 (Proposed phases) is therefore **pre-staged, not authorized** — it exists to compress the time between Coach's Phase 5 stamp and the first line of code, not to substitute for the reviews.

---

## 0. What this plan is / is not

| Is | Is not |
|---|---|
| A map from the draft's sections to a phase/seed/gate structure, ready to execute the moment BUILD lands | BUILD AUTHORITY for the pipeline draft |
| A single surface listing every open item Coach must disposition, plus three more this plan found | A GO token for any phase |
| A flag on where the draft's pull model collides with already-shipped, PASS-gated conveyor code | License to touch `agents/bench/gemba.md`, the shipped IF-1…IF-5 code, or the Wiki tree |
| Continuity with the existing `agents/p-iki-factory/` board and its IF-numbering | A second Factory board or a new archetype |

---

## 1. Spec status snapshot

| Fact | Evidence |
|---|---|
| Status | **DRAFT — advisor draft.** Not BUILD AUTHORITY. |
| Reviewers run so far | **None** of India / Mike / Echo+Tango / Hotel / Delta per the sequential workflow. The draft is a working-session capture with "two Grok reviews folded" — that is not a bench gate. |
| Relationship to `v0.1.5` | **Undecided** (draft's own open item #2: "Does this close the Factory's job description, or amend v0.1.5?"). |
| Charter state | `agents/bench/gemba.md` carries the same "draft revision... Coach lands it" caveat. Two unlanded drafts referencing each other. |
| Open items outstanding | **9**, reproduced in §3, none dispositioned. |
| In-tree relationship (draft's own words) | "Advisor does **not** hold `IKI Factory Spec v0.1.5` or `agents/bench/gemba.md`. This is not a diff against either. Reconciliation is Coach's call." |
| Scope touch outside the Factory | §8 only — the Wiki, "Flagged, not written past." |

---

## 2. Blocking items (sequencing only)

### B1 — Movement-model reversal touches already-shipped, PASS-gated work (DL-539)

`agents/p-iki-factory/ORCHESTRATOR.md` records **IF-1-G, IF-3-G, IF-4-G: PASS** under a conveyor model where Backlog(Ideas)→Research is auto-pickup, Spec→Build auto-fires on plan attachment, and Build→Deploy auto-fires on product-spec presence. Draft §3.1–3.3 replaces every one of those with an explicit pull: *"Nothing advances itself... An item moves when someone takes it."*

This is not an additive feature. It is a behavioral rewrite of code that already shipped and already passed a Delta gate under the opposite rule. Doctrine §15 / DL-539 requires **three successive Coach OKs recorded on the GO token before the first edit** to existing work outside declared drift. A draft spec — however thorough — is not itself the three OKs.

**Disposition needed:** Coach records three successive OKs specifically for retraining the IF-1/IF-3/IF-4 state machine, separate from and in addition to Phase 5 BUILD on the draft itself. Until then, **IF-7 (§5) does not get a GO.**

### B2 — Wiki boundary reopened, and the two live documents contradict each other

Draft §8.3 and the charter's rewritten invariant 9 have Gemba author **"the wiki page"** directly, dark, in Staged. But `IF-4-G`'s own PASS evidence (quoted in `docs/IKI-Factory-Spec-v0.1.5-Full-Agent-Bench-Plan-v1.1.md` §"Gates") required **"zero wiki page files and zero Wiki envelopes from Factory tests"** — built against Source Contract v0.1.4 (SC-0, DL-560/562), whose entire premise is that the Factory exposes a **signal only** and the Wiki Agent composes Wiki-side.

Both cannot be true at once. The draft itself flags this territory as "touches outside program... flagged, not written past" (§8, scope statement) but does not reconcile it — Coach's ruling closed *who writes the copy* (§0.1 item 1), not *whether that copy becomes a Factory-owned git write into the Wiki's tree*.

**Disposition needed:** India reads this draft against the current Wiki Source Contract (`FatTail-Labs-Wiki-Source-Contract-Spec-v0_1_4.md`) and Wiki Spec (`v1_2`) and reports one of:
- "the wiki page" means Gemba drafts page **content** that the Wiki Agent still composes/commits (Source Contract intact, no git write from Factory), or
- the Source Contract itself is being amended by this draft (then that amendment is the Wiki program's to review, not this board's to assume).

Until that read lands, **the wiki-page sub-scope of IF-8 (§5) does not proceed**, and definitely not by having Gemba write git wiki files. Product / landing / store-placement / help-page production do not touch the Wiki tree and are not blocked by this.

### B3 — Amend-vs-supersede is unresolved (draft's own open item #2)

No file allowlist, no phase numbering, and no answer to "is `v0.1.5`'s job description still the law for anything this draft doesn't mention" can be fixed until Coach answers this. §5 below numbers phases as continuations of the existing `IF-` sequence on the assumption that Coach will choose "amend, same board" — the lower-disruption default — but that is this plan's opinion, not a ruling. If Coach instead treats this as a close-and-replace, the existing IF-1…IF-5 gate evidence would need to be re-read against the new model rather than extended.

### B4 (opinion) — Filename/version is provisional; canonicalize at Phase 5, not before

The on-disk file is `Specs/DRAFT-IKI-Factory-Pipeline-Spec-v0_6.md`; the in-document title reads "IKI Factory — Pipeline Specification (DRAFT v0.6)." The draft says outright that both are placeholders. Lima renames once, at the Phase 5 stamp — matching the existing pattern (`v0.1.5`'s own plan flagged the same class of problem as opinion O4). Not a blocker to review; a blocker to any packet that hardcodes today's filename.

---

## 3. Coach disposition — the draft's own open items (§12, verbatim) plus this plan's three additions

| # | Item | § | Source | Coach tick |
|---|---|---|---|---|
| 1 | Where a raw idea gets worked up, if the backlog holds only ready items | 2.1 | Draft | ☐ |
| 2 | Does this close the Factory's job description, or amend `v0.1.5`? | header, 3.8 | Draft | ☐ |
| 3 | Admin-only floor — confirm, and what it means for the suite pill | 1.2 | Draft | ☐ |
| 4 | Level / use-mode fields — confirm the cited law and they go in | 2.2 | Draft | ☐ |
| 5 | Priority signal — "sell," or usage + intent + paid where priced | 4.6 | Draft | ☐ |
| 6 | Priority as rank number or ordered list | 4.5 | Draft | ☐ |
| 7 | Opening an item — panel beside the board, or leave the board | 2.5 | Draft | ☐ |
| 8 | Staged cohort — finished product or explicit early access | 8.2 | Draft | ☐ |
| 9 | Should size return as a plain optional label | 2.2 | Draft | ☐ |
| **10** | **Three successive OKs to retrain the shipped IF-1/IF-3/IF-4 conveyor to pull (B1)** | 3 | This plan | ☐ ☐ ☐ *(record each separately — one is not three)* |
| **11** | **Is "Gemba writes the wiki page" a Factory-side git write, or Wiki-composed content Gemba drafts (B2)** | 8.3 | This plan | ☐ |
| **12** | **Canonical filename/version for this draft, assigned at Phase 5 (B4)** | header | This plan | ☐ |

Closed since v0.5 (draft's own record, not reopened here): Gemba's charter vs. the pull model; Live authority; wiki and help authorship *(authorship — see B2 for the narrower git-write question, which remains open)*.

---

## 4. What does not change (confirmed against the draft, not re-litigated)

- **Gemba is still the sole seat.** No new archetype; the draft names Gemba throughout §3, §7, §8 and explicitly rules out substitution.
- **WooCommerce-only commerce**, still a stub pending real API (§9.7) — unchanged from the shipped IF-4 design.
- **No invention; fail loud on the card.** §7.4, §8.1 restate the existing charter invariant.
- **Hold remains sacred at every lane** (§3.7) — matches shipped behavior.
- **Hotel and Tango still gate sales-surface strings**, now named explicitly at Staged (§8.5) rather than only at Live — a location shift, not a removal of the gate.
- **Live is still Coach's one-act switch** (§9): product type, tier, free-vs-paid entered by Coach *is* the promotion. The fields and the "Coach's hands, not any administrator's" rule are unchanged from the shipped IF-4 design. What changes is what precedes it — Staged, not Build, directly.
- **No profit claims** — invariant #8 restated at §8.5.

---

## 5. Proposed phases (pre-staged; each needs its own GO after BUILD)

Numbered as continuations of the existing `agents/p-iki-factory/` board (IF-1…IF-5 already shipped and PASSed). This numbering assumes Coach disposes open item #2 as "amend" (this plan's opinion, §2 B3) — Coach may renumber.

### IF-6 — Vocabulary & work-item rework (lowest risk; does not touch movement semantics)

Maps to draft §2, §11. Independent of B1/B2 — may proceed as soon as BUILD lands on this slice alone, if Coach wants to decouple it.

| Agent | Job |
|---|---|
| **Alpha** | Migration: `description`, `notes`, `attachments` (link + upload), `originator` (required, enum: Coach / system / named agent / outside source), `created_date` provenance pairing. Cut fields confirmed absent: owner, size, category, ready-flag (size returns only if Coach ticks open item 9). |
| **Charlie** | Item detail panel (open item 7 default: panel beside the board) carrying Back/Advance/Hold/Rework off the card face (§2.5). Card reduced to title, priority, originator (§2.4) — no attachment count. |
| **Echo** | Panel HIG: priority chip, attachment list (link vs upload distinguished), originator field, ≥44pt controls moved off the card. |
| **Tango** | Replacement board copy for the dead conveyor line quoted at §11 ("Deposit an idea; the factory picks it up...") — shape is Coach's per the draft; Tango reviews tone only, not word choice. |
| **Kilo** | Originator required at intake (no silent default); attachments round-trip (link and upload); panel fully replaces inline card controls; old copy is gone, not just hidden. |
| **Lima** | DL entry; spec-status note on the draft (still DRAFT elsewhere) scoped to this slice only if Coach approves partial BUILD. |

### IF-7 — Movement retrain: conveyor → pull  ⚠ gated on B1 (three OKs, not zero)

Maps to draft §3, §7.

**Does not get a GO until Coach disposition #10 (§3) shows three recorded OKs**, separate from Phase 5 BUILD on the draft.

| Agent | Job |
|---|---|
| **India** | Quote the exact IF-1/IF-3/IF-4 state-machine code and its passing test names before anything is touched; confirm no other program depends on the auto-advance behavior being retrained; RETURN if a real contradiction remains after the three OKs are recorded (not before). |
| **Alpha** | Replace auto-advance triggers with explicit pull endpoints per the pull table (draft §3.3): Backlog→Research (Gemba or human), Research→Spec (admin, unchanged), Spec→Build (admin, "ready for Build" evidence rule unchanged: spec(s) + build plan attached, no blockers), Build→Staged (Gemba as build agent). Every move stamped with actor + reason on the card (§3.5). |
| **Charlie** | Replace "auto-move" banner UI with pull affordances ("take this") per lane. |
| **Kilo** | Full regression: nothing advances anywhere without an explicit pull actor recorded, across every existing IF-1/IF-3/IF-4 test path. Retired auto-advance tests are re-authored with a stated reason, never silently deleted (doctrine: evidence over assertion). |
| **Lima** | DL entry naming the reversal explicitly — it revises the behavior logged under DL-559 / DL-569 / DL-577, and that supersession must be visible in the log, not just in code. |

### IF-8 — Staged lane (new)  ⚠ product/landing/store/help may proceed; wiki-page sub-scope gated on B2

Maps to draft §8.

| Agent | Job |
|---|---|
| **Alpha** | New Staged lane schema + artifact records (product, landing draft, store placement, help page, wiki page — status per artifact, all dark/unpublished per §8.1, §8.3). |
| **Charlie** | Staged board chrome: dual-track view — agent production status alongside client-trial visibility (existing clients only, §8.2; non-engagement rendered as a data point, never a verdict). |
| **Gemba (runtime) / Alpha** | Artifact-generation skills for product, landing draft, store placement, help page. **Wiki-page generation is out of this packet until B2 resolves** — do not wire a git write in the interim. |
| **Hotel + Tango** | Gate the sales surfaces — landing page and product copy — for invariant #8 (no profit claims) and process-not-P&L framing, before or at Live, **never inside Gemba** (§8.5). Confirm help/wiki pages carry no market/outcome claims and therefore do not need this same gate (§8.5) — verify the boundary is enforced in code, not assumed. |
| **Kilo** | Client-trial non-obligation is not silently coerced into a gate (§8.2: "clients approve nothing"); Staged artifacts stay dark until Live; help/wiki-page changes correctly skip the Hotel/Tango gate while landing/product copy correctly requires it. |
| **Lima** | Flags the loose end the draft itself names at §8.7: `Specs/FatTail-Labs-Options-Lab-Template-Help-Package-Spec-v0_1.md` is superseded but still on disk *without* a superseded banner, and was edited after its supersession. Recommend a superseded-banner addition as a small, separately-approvable doc-hygiene fix — not bundled into this build packet. |

### IF-9 — Live boundary retrain

Maps to draft §9. Lower risk than IF-7/IF-8 — the fields and the actor (Coach) are unchanged from the shipped IF-4 design; only what precedes the switch changes.

| Agent | Job |
|---|---|
| **Alpha** | Move the Live-trigger precondition from "Built-ready" to "Staged-complete-per-item's-needed-artifacts" (§8.4: which artifacts an item needs is declarative, same venue-inference the wiki agent performs elsewhere). Order unchanged: Live write first, then Woo stub (§9.5); `Published` state after the Live write, independent of Woo outcome (§9.8, matches existing IF-4-G evidence). |
| **Kilo** | Regression of the existing IF-4-G matrix under the new precondition: Live still rejects non-Staged-complete items; Woo-stub failure still leaves `Published`; non-Live items never member-listed. |

### IF-10 — Priority ordering, earned-weight tracking, hardening

Maps to draft §4, §6, §11 residual gaps.

| Agent | Job |
|---|---|
| **Alpha** | Priority as a **maintained ordering** across the lane (§4.4) — rank number or dragged list per Coach's disposition of open item 6. Earned-weight tracking: originator + outcome fields only (§6.2), explicitly **no scoring model** (§6.1–6.3). |
| **Charlie** | Ordering UI matching Coach's choice; no round counters, no cycle metrics anywhere on the board (§7.4). |
| **Kilo** | Full IF-6…IF-10 regression matrix under the pull model; confirm every §11 gap the draft names is closed or explicitly deferred with a reason. |
| **Lima** | Final DL; flips the draft's Status header once Coach stamps; updates `agents/p-iki-factory/ORCHESTRATOR.md` critical path to show the IF-6…IF-10 extension (does not silently overwrite the IF-1…IF-5 PASS history). |

---

## 6. File allowlists (proposed direction only — exact list is India's W-phase output at each GO)

| Area | Likely paths | When | Note |
|---|---|---|---|
| Admin UI | `web/app/admin/iki-factory/`, Factory panel components | IF-6, IF-8 | Extends existing IF-1 board, does not fork it |
| Domain | `server/` Factory domain, conveyor→pull state module, Staged artifact module | IF-6…IF-9 | IF-7's module edit is the one gated on B1 |
| Schema | `migrations/NNN_iki_factory_*.sql` | IF-6, IF-8, IF-10 | Additive columns/tables; no destructive migration on shipped Factory tables |
| Tests | `server/tests/test_iki_factory*.py` | every slice | IF-7 explicitly re-authors, never deletes, existing conveyor tests |
| Docs | this plan, Lima DL, `agents/p-iki-factory/ORCHESTRATOR.md`, spec status flip | GO SPEC / each phase close | |
| **Never in these packets unless named** | `agents/bench/gemba.md` (Coach's landing, not a packet target); any Wiki git-write path (blocked on B2); `web/lib/runner/**`; Options Lab; Market Bus; Trade Log; `AppChrome`; WooCommerce real API (still not granted — see `v0.1.5` plan) | — | |

---

## 7. Gates

| Gate | Evidence required |
|---|---|
| **R0 / BUILD (this draft)** | India / Mike / Echo+Tango / Hotel sequential notes (currently absent) + Coach Phase 5 stamp + Lima DL + open items §3 dispositioned (or explicitly left OPEN per workflow doc) |
| **IF-6-G** | Originator required and captured; attachments round-trip; panel replaces inline controls; dead board copy confirmed gone |
| **IF-7-G** | **Three OKs recorded on the GO token (not fewer)**; every existing auto-advance path now requires an explicit pull actor; no shipped test silently deleted; card shows actor + reason on every move |
| **IF-8-G** | Staged artifacts dark until Live; client-trial non-engagement never renders as a verdict; Hotel/Tango PASS on landing/product copy; help/wiki pages confirmed exempt from that same gate; **wiki-page generation absent from the packet unless B2 is separately resolved and cited** |
| **IF-9-G** | Live rejects non-Staged-complete items; Woo-stub failure still yields `Published`; non-Live never member-listed |
| **IF-10-G** | Priority ordering matches Coach's chosen mechanism; no scoring model introduced; full regression clean; ORCHESTRATOR.md updated without erasing IF-1…IF-5 history |

Delta never modifies work under review. Verdicts: **PASS / FAIL / BLOCKED**. A waived gate is a doctrine violation.

---

## 8. Out of scope until Coach names it

- Any Wiki git write from the Factory (B2).
- Retraining IF-1/IF-3/IF-4 conveyor logic without three recorded OKs (B1).
- Real WooCommerce API / store — still not granted, unchanged from the `v0.1.5` plan.
- Member-facing Factory surface, unless open item #3's disposition says otherwise.
- Size as a card field, unless open item #9 says otherwise.
- Level / use-mode fields, unless Coach confirms the cited law behind open item #4 — the draft explicitly declines to add these on a secondhand citation, and so does this plan.
- Runner registry writes, Options Lab, Market Bus, Trade Log, `AppChrome` — unrelated trees, no reason surfaced here to enter them.
- Rewriting `agents/bench/gemba.md` inside any implementation packet — it is Coach's document to land, not a build target.

---

## 9. GO checklist (Coach) — nothing stamped yet

- [ ] Open items §3 (#1–9, draft's own) dispositioned or explicitly left OPEN
- [ ] Open item #2 (supersede vs amend `v0.1.5`) answered — determines whether §5's IF-numbering stands or this becomes a fresh sequence
- [ ] **Three successive OKs** recorded for retraining IF-1/IF-3/IF-4 to pull (B1) — separate from BUILD on the draft itself
- [ ] Wiki boundary reconciliation (B2) — India's read against Source Contract v0.1.4 and Wiki Spec v1.2, disposed with the Wiki program
- [ ] Sequential reviews run: India (Phase 2), Echo + Tango (Phase 3), Mike + Hotel (Phase 4)
- [ ] Phase 5 **BUILD AUTHORITY** stamp + canonical filename/version (B4) + Lima DL
- [ ] **GO IF-6**
- [ ] **GO IF-7** (requires the three OKs above, in addition to this GO)
- [ ] **GO IF-8** (wiki-page sub-scope requires B2 resolved; rest of the lane does not)
- [ ] **GO IF-9**
- [ ] **GO IF-10**
- [ ] Amend
- [ ] Stop

**Signed:** Juliet (plan **v1.0**). Draft status: **DRAFT — not build authority**. No GO stamped.
**Date:** 2026-08-24

---

## Bench delta

What the next invocation gains:

1. A single disposition surface for all nine of the draft's open items plus three this plan found (B1 three-OKs requirement, B2 Wiki-boundary contradiction, B4 filename/version), so Coach can clear them in one pass instead of across scattered conversations.
2. A named, evidenced contradiction (B1) between this draft and the PASS-gated `IF-1-G` / `IF-3-G` / `IF-4-G` evidence — caught before any code was touched, not after a regression.
3. A named, evidenced contradiction (B2) between the charter's rewritten invariant 9 and the Source Contract v0.1.4 boundary that `IF-4-G` was built and gated against — flagged to both this board and the Wiki program rather than silently resolved in one direction.
4. A phase skeleton (IF-6…IF-10) ready to seed the moment BUILD and the relevant OKs land, sequenced from lowest risk (vocabulary, additive) to highest (conveyor retrain, Wiki-adjacent Staged lane).
5. A carried-forward doc-hygiene flag (the still-unbannered superseded Help Package spec at §8.7) so it doesn't get cited as live authority downstream in the meantime.

## Coach content intact?

Yes — all of the draft's text is retained and, where load-bearing, quoted verbatim (§3's nine items). This plan's additions (§2, and rows 10–12 of §3) are labeled as this plan's findings, not attributed to the draft or the charter.

## Blocks (invariant | law | system only)

- **B1** — DL-539: three-OK requirement not met for retraining shipped conveyor behavior.
- **B2** — Source Contract v0.1.4 boundary (SC-0, DL-560/562) contradicts the charter's rewritten invariant 9 as currently worded; needs India's read, not this plan's assumption.

## Opinions / recommendations (not blocks — Coach may discard)

- Numbering §5 as `IF-6…IF-10` (continuing the existing board) rather than a fresh sequence, pending Coach's answer to open item #2.
- Decoupling IF-6 (vocabulary) from the B1/B2-gated phases so low-risk work isn't stuck behind the harder dispositions.
- Treating the Help Package superseded-banner fix (§8.7) as a small standalone doc-hygiene item rather than bundling it into IF-8.

## Flagged ideas

| ID | Idea | Why flagged | Discuss with |
|---|---|---|---|
| FI-IKI-P1 | Add a `level` (Knowledge/Intelligence) and `use-mode` field per Grok's proposal (draft §2.2, open item #4) | Draft declines on a secondhand citation of law the advisor doesn't hold; needs Coach to confirm the citation before it becomes a field | Coach, India |
| FI-IKI-P2 | Read priority as usage + declared intent + paid-where-priced rather than "sell" (draft §4.6, open item #5) | Grok's reasoning is sound per the draft, but "templates that actually sell" is Coach's verbatim phrase; reinterpreting it isn't a build call | Coach |

## Build disposition

**RETURNED for build readiness** — not a rejection of the draft's content, a statement that Phase 2–5 review has not run and three specific dispositions (B1, B2, B3/open item #2) are outstanding. Re-submit through Phase 2 (India) once Coach has had a first pass at §3's disposition table.

---

## Changelog

| Ver | Date | Notes |
|---|---|---|
| **v1.0** | 2026-08-24 | First Juliet plan against `DRAFT-IKI-Factory-Pipeline-Spec-v0_6.md`. Flags B1 (conveyor→pull retrain touches PASS-gated IF-1/IF-3/IF-4 work, needs three OKs), B2 (Wiki-page authorship contradicts Source Contract v0.1.4 boundary IF-4-G was gated against), B3 (amend-vs-supersede undecided), B4 (filename/version provisional). Phases IF-6…IF-10 pre-staged, no GO granted. |
