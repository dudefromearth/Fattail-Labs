# FatTail Labs — Practice Position Lifecycle B1 Spec

**Version:** v0.4 — D-B1-1 **STAMPED 2026-09-14**; D-B1-2…D-B1-9 decided-in-draft, **block stamp requested (§5)**. Authority for B1 build planning. **Build start remains gated on PPL3 + PPL4 PASS (§0).**
**Date:** 2026-09-14
**Supersedes:** `FatTail-Labs-Practice-Position-Lifecycle-B1-Spec-v0_3.md` (baseline; leave on disk, do not plan or build against). v0_2 and v0_1 are earlier baselines.
**Target location:** `Specs/FatTail-Labs-Practice-Position-Lifecycle-B1-Spec-v0_4.md` in the FatTail Labs repo on **StudioTwo**
**Cites (inbound authority):**
- `Specs/FatTail-Labs-Practice-Position-Lifecycle-Spec-v0.1.md` (v0.1.1, sha1 `84601fd3…`) — B0 BUILD AUTHORITY
- `claude/Practice-Lifecycle-W0-Draft-Stamp-v1_3.md` — program stamp
- `claude/Practice-Position-Lifecycle-B0-Focused-Audit-v1_1.md` — B0 evidence base
- Grok review of B1 v0.1 (2026-09-14) — findings G-1…G-6, disposed below
- Grok review of B1 v0.3 (2026-09-14) — findings G2-1…G2-5 + bias note, disposed below

## Changes since v0.3

| # | Change | Driven by |
|---|---|---|
| 1 | New D-B1-9: the wizard act is **Roll only** (strike/expiry moves, incl. rolling wings wider/narrower); deliberate species restructure has no B1 gesture — manual path only; manual link action renamed **Link** | G2-1 |
| 2 | §1 non-goal added: **B1 ships no leg-out control** — leg-level closes arrive via import or manual fill entry only; AT-B1-7 names its producer | G2-2 |
| 3 | Mid-chain unlink rule written into UC-T5: revoking A→B in A→B→C yields two lineages, never a fabricated skip; AT-B1-13 | G2-3 |
| 4 | Unlink idempotency (409 on re-revoke) and re-link to a different successor specified; AT-B1-14 | G2-4 |
| 5 | Partial-ticket grain AT added: same underlying, close-set ≠ full remaining legs → no proposal; AT-B1-15 | G2-5 |
| 6 | "No open decisions remain" replaced with an honest block-stamp request for D-B1-2…9 | Bias note |

(Earlier change tables live in the superseded files.)

## Grok review disposition (v0.1 findings; all carried, none dropped)

| Finding | Disposition |
|---|---|
| G-1 acknowledgment gate fights truth-on-every-surface | **Carried → now stamped.** D-B1-1: auto-switch + informational badge (§5) |
| G-2 partial roll undefined | **Carried.** D-B1-6 locks whole-remaining transform; AT-B1-10 added |
| G-3 vocabulary load vs OD-21 | **Carried.** §4a surface-copy table; "transmutation" off the glass |
| G-4 unlink unspecified on append-only stream | **Carried.** D-B1-8 compensating event; AT-B1-11 |
| G-5 lineage delete half-told | **Carried.** Explicit non-goal + delete-order statement (§1, §3.2) |
| G-6 UC-T3 heuristic under-constrained | **Carried.** Same-underlying required, expiry may differ (rolling out in time is a roll), close-set must match an open position's full remaining legs, proposal-first (§3.2) |
| Bias note: don't collapse PPL5+PPL6 | **Carried.** §7 states phases never combine |

---

## 0. Sequencing gate

**Planning may proceed now. Build does not start until PPL3 (API gates) and PPL4 (import end-state) are PASS.**
Rationale: transformation builds lineages out of close/open events. On an unguarded close API, lineages can be constructed from illegal states. PPL3's 422/409 gates and PPL4's import end-state resolution are preconditions to any B1 product code, not parallel work. A build plan produced ahead of the gate must state the gate as its first entry.

Nothing in this document re-opens B0 decisions. OD-19 (permanent delete + kit dialog), OD-21 (two-word vocabulary), OD-23 (30-day hold), OD-24 (show consumed open, no lot picker), OD-25 (imports not hard-422'd) all stand.

---

## 1. Scope

Three lifecycle concepts beyond binary open/closed:

1. **Partial Residual** — a *state*: quantity reduced, structure unchanged. Mechanics shipped in PPL2; B1 ships the semantics and drawer surface.
2. **Transformed** — a *terminal state with a successor*: the position ends by intent (a Roll — strike and/or expiry moves; deliberate species restructure is manual-path only, D-B1-9) and a linked successor position begins. New derived relationship: the **lineage**.
3. **Emergent transmutation** — *not a state*: after leg-level closes, the residual fills re-resolve to a different known structure. Detected by re-recognition, surfaced by badge. ("Transmutation" appears in this spec only; it never appears on the glass — §4a.)

Out of scope (non-goals): order execution/automation, lot-picker close selection (OD-24 stands), trash-bin/undo delete, cross-account lineages (D-B1-2), **lineage forking** (D-B1-6), **lineage-level delete** (delete remains per-position, successor-first, each under OD-19's kit dialog), **any leg-out control** — B1 ships no gesture that closes an individual leg; leg-level closes arrive via import or manual fill entry only, and that is UC-X1's producer — and any change to the FIFO matcher.

---

## 2. Truth-model conformance

The truth model is unchanged and is the constraint every section below is checked against:

- Fills are the atoms. The registry is append-only. Positions remain **one canonical derived read model** — no sub-models, no temp holders.
- **Partial Residual** is already a derived read state (PPL2). B1 adds no storage for it.
- **Transformation** adds one new stored record type: the **transformation event** — a registry event linking a set of closing fills on the predecessor to a set of opening fills on the successor. It is an event on the fill stream, not a position store and not a mutation of any position.
- **Unlink** (D-B1-8) adds a second record type of the same species: a **link-revocation event** referencing a prior transformation event. Nothing is deleted; the derived lineage recomputes without the revoked link. This is the append-only answer to a wrong link — the alternative is a trash-bin by another name, which B0 forbade.
- **Transmutation** adds nothing stored. Current-structure is a derived property of the residual fills, resolved against the structure catalog (the same recognizer the import grouper uses). Birth-structure is derivable from the opening fill set and surfaced on the lineage/origin record.

State machine (derived):

```
Open ──────────────► Closed
  │  ▲                 ▲
  │  │ (partial close) │
  ▼  │                 │
Partial Residual ──────┘
  │
  ├──► Transformed ──(successor pointer)──► [new position: Open]
  └──► Expired / Assigned (synthetic-Complete per B0 rules)
```

`Partial Residual` annotates the open side; `Transformed` is terminal-with-successor; `Closed`/`Expired`/`Assigned` are terminal. Emergent transmutation is orthogonal — a change in the derived current-structure, possible in any open state.

---

## 3. Use cases and implementation

Every state ships only with its use cases. Findings carried from the 2026-09-14 working session and the Grok review of v0.1 — by list, none dropped.

### 3.1 Partial Residual

**UC-P1 — Scale out, keep the runner.** The doctrine case: take 100–200% on part of the position, let the runner work.
*Implementation:* **Scale Out** action in the drawer's lifecycle group, with a quantity picker. Posts TO_CLOSE fills; FIFO consumes (matcher untouched); position reads `partial_residual`.
*Status:* mechanics shipped (PPL2); the drawer action is new — today's close flow is all-or-nothing.

**UC-P2 — Truth on every surface.** A 1-of-5 close reads qty 4 on Positions, partial badge on Trade Log, valuation 4.0, `remaining_units: 4` on GET /opens.
*Implementation:* shipped and verified (PPL2); marquee test in `Practice-B0-Human-Acceptance-Walkthrough-v1_0.md`. Listed here as the acceptance baseline B1 must not regress.

**UC-P3 — Round-trip pairing, N closes.** Clicking the position shows the open plus **all** closing events stacked in the drawer's top form, each with consumed quantity. The persistent highlight covers the whole set.
*Implementation:* drawer render change. Data exists — OD-24 already surfaces which open each close consumed.

**UC-P4 — Delete protection.** A partially closed open cannot be deleted while matched closes exist.
*Implementation:* `canDeleteTrade` ok:false shipped; PPL3 server-side 409 makes it not-UI-only. B1 inherits, adds nothing.

### 3.2 Transformed

**UC-T1 — Roll the position.** User ends the current strikes and opens new ones as one intentional act. **The wizard act is Roll only: strike and/or expiry moves, including rolling wings wider or narrower (D-B1-9).** A deliberate species restructure has no B1 wizard — manual path only. **Transform consumes the entire remaining position (D-B1-6).** To roll only part of a runner: Scale Out the part that ends, then Roll the remainder — composed from existing primitives, no forked lineages.
*Implementation:* **Roll** wizard in the drawer: composes closing fills + opening fills + one transformation event in a single gesture. Manual path (per the manual-and-wizard rule): the same fills entered separately, then explicitly linked via **Link**. Both paths emit the identical event record — this is the invariant that keeps the feature from forking.

**UC-T2 — Lineage P&L.** "What did this whole idea make, entry to final exit," across N rolls.
*Implementation:* derived aggregation walking successor pointers, summing per-position P&L. Surfaces in the drawer's lineage view and as an optional grain in Reports (default per D-B1-3). Revoked links (D-B1-8) drop out of the walk. No new storage.

**UC-T3 — Import a combo roll ticket.**
*Constraints (tightened per G-6):* same ticket; **same underlying (required)**; expiry may differ — rolling out in time is a roll; the close-set must fully match an existing open position's remaining legs (D-B1-6 grain). Same-ticket close+open pairs failing these constraints import as unrelated positions.
*Implementation:* the import agent **proposes** the transformation; **the lineage does not exist until the member confirms.** This is deliberately stricter than the dangling-fill pattern (assume-then-badge): a wrong synthetic fill mis-states one position, but a wrong link glues two unrelated ideas and pollutes lineage P&L — so links are proposal-first. Unconfirmed proposals render as a proposed-link badge, not a lineage.

**UC-T4 — Journal and retrospective context.** The journal day and the retrospective see a lineage as one continuing idea.
*Implementation:* the journal's trade list groups by lineage where one exists; the retrospective agent receives lineage in context. Read-side only.

**UC-T5 — Undo a wrong link.** A member (or the import confirm flow) linked the wrong positions.
*Implementation:* **Unlink** action in the drawer's lifecycle group appends a link-revocation event (D-B1-8). Positions are untouched; the predecessor re-reads as Closed (its fills already say so); lineage and lineage P&L recompute without the link. Nothing deleted, no trash-bin.
*Mid-chain rule:* in A→B→C, revoking A→B yields **two lineages, [A] and [B→C]** — revocation severs; it never fabricates a skip link nobody made. *Idempotency:* revoking an already-revoked link is refused (409). *Re-link:* after unlink, **Link** to a different successor is allowed and emits a new transformation event — wrong-link recovery is the point of D-B1-8.

### 3.3 Emergent transmutation

**UC-X1 — Leg out a wing; residual becomes a vertical.** No declaration by the user.
*Implementation:* on any fill event touching a position, re-resolve the residual legs against the structure catalog. If the species changed, the derived position's current-structure updates **immediately** and the drawer badges: *"now a \<structure\>"* — informational, not a gate (D-B1-1, stamped).

**UC-X2 — Manage the residual as what it now is.** The Analyzer risk graph and drawer render the residual's actual structure, not the birth structure.
*Implementation:* the derived position carries **current-structure**; birth-structure is surfaced on the lineage/origin record. Analyzer consumes current-structure. (Boundary note: IKI reaches Practice only through the Analyzer, one-directional — unchanged.)

---

## 4. Features shipping on this layer

| Feature | Uses | Surface |
|---|---|---|
| Scale Out action + quantity picker | UC-P1 | Drawer lifecycle group |
| N-close pairing stack | UC-P3 | Drawer top form |
| Roll wizard (strike/expiry moves) | UC-T1 | Drawer lifecycle group |
| Link (manual) | UC-T1, UC-T5 | Drawer |
| Unlink | UC-T5 | Drawer lifecycle group |
| Lineage view (chain of positions) | UC-T2 | Drawer |
| Lineage grain | UC-T2 | Reports (optional grain) |
| Roll-ticket recognition, proposal-first | UC-T3 | Import agent |
| Lineage grouping | UC-T4 | Journal, Retrospective context |
| Current-structure re-recognition + badge | UC-X1, UC-X2 | Read model, Drawer, Analyzer |

The drawer's lifecycle group (the framed, labeled cluster per the 2026-09-14 UI decision) is the single home for Scale Out, Close, Roll, Link, Unlink, and Delete — state-aware, consistent look and feel.

### 4a. Surface vocabulary (G-3)

OD-21 held member vocabulary to two words; this layer must not blow that budget. On the glass, exactly three surface terms:

| On the glass | Meaning | Never on the glass |
|---|---|---|
| **Roll** | the act of moving strikes and/or expiry (wizard, or manual **Link**) | "transform", "transformation event", any act word for species change |
| **Transformed** | the terminal state of the predecessor | — |
| **now a \<structure\>** | the re-recognition badge | "transmutation", "current-structure", "birth-structure" |

Spec-language terms (transmutation, lineage internals, event names) live in documents and code, not member surfaces. "Lineage" on the glass renders as the visual chain in the drawer, unlabeled or labeled "History of this idea" — final copy is a PPL6 concern, not a new noun budget.

---

## 5. Decisions

**Stamped by Coach:**

- **D-B1-1 (STAMPED 2026-09-14) — Immediate current-structure switch; badge is informational, not a gate.** An acknowledgment gate would make the Analyzer draw a structure that no longer exists — a lie held on screen until a click. Truth-on-every-surface (the UC-P2 doctrine) decides it. Birth-structure remains visible on the lineage record.

**Decided here, with rationale — Coach can override:**

- **D-B1-2 — Lineages are per-account.** A registry is per-account; a transformation links fills within one registry. A cross-account "roll" is two positions in one campaign, not one lineage.
- **D-B1-3 — Reports default grain stays per-position; lineage is an explicit toggle.** Changing the default silently would change every existing number a member sees.
- **D-B1-4 — Successor inherits the predecessor's campaign, overridable at roll time.** A roll is the same idea continuing; inheritance assigns exactly one campaign, preserving the one-campaign rule.
- **D-B1-5 — State name is `Transformed`**, aligning the data model with the Transformation Doctrine vocabulary members already learn. Surface copy per §4a.
- **D-B1-6 — Transform consumes the entire remaining position.** No partial-quantity roll, no forked lineages this round. Partial intent composes: Scale Out, then Roll the remainder. Rationale: a forked lineage explodes P&L attribution and the drawer's chain view for a case the primitives already cover.
- **D-B1-7 — Surface vocabulary per §4a.** Three terms on the glass; spec-language stays off it.
- **D-B1-8 — Unlink is a compensating link-revocation event.** Append-only stream, nothing deleted, lineage recomputes. The alternative — silence — becomes a trash-bin later, which B0 forbade.
- **D-B1-9 — The wizard act is Roll only: strike and/or expiry moves, including rolling wings wider or narrower.** A deliberate species restructure (fly → condor by intent) ships no B1 gesture: it is reachable via the manual path (close + open + **Link**), and the successor is whatever its fills resolve to — the recognizer and the "now a \<structure\>" badge tell that truth, so the glass never carries an act word for species change. Rationale: "Roll" covering restructure teaches members a lie; a "Change structure" button spends a fourth noun on a rare act the primitives already cover.

**Block stamp requested:** D-B1-2 through D-B1-9 are decided-in-draft with rationale — legitimate working status, said plainly. Coach stamps the block or names the ones to change. Until stamped, planning handoffs shield them via the DO-NOT-RE-OPEN list, not via silence.

---

## 6. Acceptance tests (sketch — build plan expands)

- **AT-B1-1** Scale 2 of 5 out of a fly via the drawer: position reads `partial_residual`; UC-P2 surfaces all agree; drawer stacks one open + one close with qty 2.
- **AT-B1-2** Close the remaining 3 in two further events: drawer stacks three closes; position reads Closed; highlight persisted throughout.
- **AT-B1-3** Roll via wizard: predecessor reads `Transformed` with successor pointer; successor reads Open; one transformation event on the stream; matcher untouched.
- **AT-B1-4** Manual close + open, then **Link**: event semantics identical to AT-B1-3.
- **AT-B1-5** Lineage P&L over a 3-link chain equals the sum of the three per-position P&Ls; Reports per-position grain unchanged by default (D-B1-3).
- **AT-B1-6** Import a ToS combo roll ticket meeting the §3.2 constraints: rendered as a **proposal** with proposed-link badge; no lineage exists pre-confirm; on confirm, output indistinguishable from AT-B1-3.
- **AT-B1-7** Leg out one wing of a fly **via manual fill entry or import** (B1 ships no leg-out control — §1): current-structure reads vertical immediately; "now a vertical" badge shown; Analyzer renders the vertical (D-B1-1).
- **AT-B1-8** Delete attempted on a `Transformed` predecessor while the successor exists: refused (409). Deleting the lineage requires per-position deletes, successor-first, each under OD-19's kit dialog — no lineage-level delete verb exists.
- **AT-B1-9** Regression: `test_partial_close_leaves_remaining_units_open` and the 44 PPL1 lock tests stay green; known asterisk (`test_ai_run_bravo_live_via_api` hang) noted per packet as before.
- **AT-B1-10** Attempt to Roll a partial quantity of a `partial_residual` position: refused with guidance (Scale Out first, then Roll); Roll of the full remaining quantity from `partial_residual` succeeds (D-B1-6).
- **AT-B1-11** Unlink a confirmed roll: link-revocation event appended; predecessor re-reads Closed; lineage P&L recomputes to per-position values; no record deleted.
- **AT-B1-12** Import a same-ticket close+open pair on **different underlyings**: imports as unrelated positions; no proposal raised (§3.2 constraints).
- **AT-B1-13** Mid-chain unlink: lineage A→B→C, revoke the A→B link: result is **two lineages, [A] and [B→C]** — never a fabricated A→C skip; both lineage P&Ls recompute accordingly.
- **AT-B1-14** Revoke an already-revoked link: refused (409, idempotent). Then **Link** the freed predecessor to a different successor: allowed; new transformation event; lineage recomputes. Wrong-link recovery round-trips.
- **AT-B1-15** Import a same-ticket, **same-underlying** close+open pair whose close-set does **not** match the full remaining legs of any open position: imports as unrelated positions; no proposal raised (§3.2, D-B1-6 grain).

---

## 7. Phase order (proposal)

**PPL5** transformation + revocation events, derived lineage, AT-B1-3/4/8/10/11/13/14 · **PPL6** drawer surfaces (Scale Out, N-close stack, Roll wizard, Link, Unlink, lineage view, §4a copy) · **PPL7** re-recognition + current-structure + Analyzer consumption · **PPL8** import roll recognition (proposal-first) + journal/retrospective grouping.

Each phase is its own GO packet; **PPL5 and PPL6 are never combined** (the event layer lands and proves before any chrome consumes it), and no phase combines with a chrome/sequence packet (S-1 stands).
