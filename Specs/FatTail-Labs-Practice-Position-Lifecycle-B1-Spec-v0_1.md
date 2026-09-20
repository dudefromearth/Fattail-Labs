# FatTail Labs — Practice Position Lifecycle B1 Spec

**Version:** v0.1 (DRAFT — unstamped; not build authority until Coach stamps)
**Date:** 2026-09-14
**Supersedes:** none — new document
**Target location:** `Specs/FatTail-Labs-Practice-Position-Lifecycle-B1-Spec-v0_1.md` in the FatTail Labs repo on **StudioTwo**
**Cites (inbound authority):**
- `Specs/FatTail-Labs-Practice-Position-Lifecycle-Spec-v0.1.md` (v0.1.1, sha1 `84601fd3…`) — B0 BUILD AUTHORITY
- `claude/Practice-Lifecycle-W0-Draft-Stamp-v1_3.md` — program stamp
- `claude/Practice-Position-Lifecycle-B0-Focused-Audit-v1_1.md` — B0 evidence base
- PPL2 shipped state (read-model grain fix, verified live)

---

## 0. Sequencing gate

**B1 does not start until PPL3 (API gates) and PPL4 (import end-state) are PASS.**
Rationale: transformation builds lineages out of close/open events. On an unguarded close API, lineages can be constructed from illegal states. PPL3's 422/409 gates and PPL4's import end-state resolution are preconditions, not parallel work.

Nothing in this document re-opens B0 decisions. OD-19 (permanent delete + kit dialog), OD-21 (two-word vocabulary), OD-23 (30-day hold), OD-24 (show consumed open, no lot picker), OD-25 (imports not hard-422'd) all stand.

---

## 1. Scope

Three lifecycle concepts beyond binary open/closed:

1. **Partial Residual** — a *state*: quantity reduced, structure unchanged. Mechanics shipped in PPL2; B1 ships the semantics and drawer surface.
2. **Transformed** — a *terminal state with a successor*: the position ends by intent (roll, widen, restructure) and a linked successor position begins. New derived relationship: the **lineage**.
3. **Emergent transmutation** — *not a state*: after leg-level closes, the residual fills re-resolve to a different known structure. Detected by re-recognition, surfaced by badge.

Out of scope (non-goals): order execution/automation, lot-picker close selection (OD-24 stands), trash-bin/undo delete, cross-account lineages (see D-B1-2), any change to the FIFO matcher.

---

## 2. Truth-model conformance

The truth model is unchanged and is the constraint every section below is checked against:

- Fills are the atoms. The registry is append-only. Positions remain **one canonical derived read model** — no sub-models, no temp holders.
- **Partial Residual** is already a derived read state (PPL2). B1 adds no storage for it.
- **Transformation** adds exactly one new stored record type: the **transformation event** — a registry event linking a set of closing fills on the predecessor to a set of opening fills on the successor. It is an event on the fill stream, not a position store and not a mutation of any position. Positions, lineages, and lineage P&L all remain derived.
- **Transmutation** adds nothing stored. Current-structure is a derived property of the residual fills, resolved against the structure catalog (the same recognizer the import grouper uses). Birth-structure is derivable from the opening fill set; the lineage record is where it is surfaced.

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

Every state ships only with its use cases. Findings below are carried from the working session of 2026-09-14 (Rule 4 — by list, none dropped).

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

**UC-T1 — Roll the position.** User ends the current strikes and opens new ones as one intentional act.
*Implementation:* **Transform / Roll** wizard in the drawer: composes closing fills + opening fills + one transformation event in a single gesture. Manual path (per the manual-and-wizard rule): the same fills entered separately, then explicitly linked via a **Link as transformation** action. Both paths produce the identical event record.

**UC-T2 — Lineage P&L.** "What did this whole idea make, entry to final exit," across N rolls.
*Implementation:* derived aggregation walking successor pointers, summing per-position P&L. Surfaces in the drawer's lineage view and as an optional grain in Reports (default per D-B1-3). No new storage.

**UC-T3 — Import a combo roll ticket.** Broker emits one batch closing old strikes and opening new on the same underlying/expiry.
*Implementation:* the import agent's grouping heuristic gains one pattern: close-set + open-set in the same ticket → propose a transformation, badged **inferred-until-confirmed** (same pattern as dangling-fill assumptions). Without this, lineages fragment on import for exactly the users who need them.

**UC-T4 — Journal and retrospective context.** The journal day and the retrospective see a lineage as one continuing idea.
*Implementation:* the journal's trade list groups by lineage where one exists; the retrospective agent receives lineage in context. Read-side only.

### 3.3 Emergent transmutation

**UC-X1 — Leg out a wing; residual becomes a vertical.** No declaration by the user.
*Implementation:* on any fill event touching a position, re-resolve the residual legs against the structure catalog. If the species changed, badge: *"residual is now a \<structure\>."* Acknowledgment behavior is D-B1-1 (open — see §5); the badge itself ships either way.

**UC-X2 — Manage the residual as what it now is.** Analyzer risk graph and drawer render the residual's actual structure, not the birth structure.
*Implementation:* the derived position carries **current-structure**; birth-structure is surfaced on the lineage/origin record. Analyzer consumes current-structure. (Boundary note: IKI reaches Practice only through the Analyzer, one-directional — unchanged.)

---

## 4. Features shipping on this layer

| Feature | Uses | Surface |
|---|---|---|
| Scale Out action + quantity picker | UC-P1 | Drawer lifecycle group |
| N-close pairing stack | UC-P3 | Drawer top form |
| Transform / Roll wizard | UC-T1 | Drawer lifecycle group |
| Link-as-transformation (manual) | UC-T1 | Drawer |
| Lineage view (chain of positions) | UC-T2 | Drawer |
| Lineage grain | UC-T2 | Reports (optional grain) |
| Roll-ticket recognition | UC-T3 | Import agent |
| Lineage grouping | UC-T4 | Journal, Retrospective context |
| Current-structure re-recognition + badge | UC-X1, UC-X2 | Read model, Drawer, Analyzer |

The drawer's lifecycle group (the framed, labeled cluster per the 2026-09-14 UI decision) is the single home for Scale Out, Close, Transform/Roll, and Delete — state-aware, consistent look and feel.

---

## 5. Decisions

**Decided here, with rationale — Coach can override:**

- **D-B1-2 — Lineages are per-account.** A registry is per-account; a transformation links fills within one registry. A cross-account "roll" is two positions in one campaign, not one lineage. Rationale: keeps lineage derivable from a single registry and avoids cross-registry event semantics.
- **D-B1-3 — Reports default grain stays per-position; lineage is an explicit toggle.** Rationale: per-position is the shipped, understood grain; changing the default silently would change every existing number a member sees.
- **D-B1-4 — Successor inherits the predecessor's campaign, overridable at transform time.** Rationale: a roll is the same idea continuing, and campaign P&L continuity is the point of campaigns; the one-campaign-per-position rule is preserved because inheritance assigns exactly one. Override covers the genuine cases where the roll starts a new intent.
- **D-B1-5 — State name is `Transformed`**, aligning the data model with the Transformation Doctrine vocabulary members already learn.

**Open — needs Coach (asked in plain language, no codes, in the handoff):**

- **D-B1-1 —** When the system detects that a position's residual has become a different structure, must the member acknowledge it before the app treats and renders it as that structure — or does the app switch immediately and the badge is informational only?

No acceptance test below presumes an answer to D-B1-1.

---

## 6. Acceptance tests (sketch — bench plan expands)

- **AT-B1-1** Scale 2 of 5 out of a fly via the drawer: position reads `partial_residual`; UC-P2 surfaces all agree; drawer stacks one open + one close with qty 2.
- **AT-B1-2** Close the remaining 3 in two further events: drawer stacks three closes; position reads Closed; highlight persisted throughout.
- **AT-B1-3** Roll via wizard: predecessor reads `Transformed` with successor pointer; successor reads Open; one transformation event on the stream; matcher untouched.
- **AT-B1-4** Manual close + open, then Link as transformation: byte-identical event semantics to AT-B1-3.
- **AT-B1-5** Lineage P&L over a 3-link chain equals the sum of the three per-position P&Ls; Reports per-position grain unchanged by default (D-B1-3).
- **AT-B1-6** Import a ToS combo roll ticket: proposed as one transformation, badged inferred; on confirm, indistinguishable from AT-B1-3 output.
- **AT-B1-7** Leg out one wing of a fly: residual re-resolves to a vertical; badge shown; Analyzer renders the vertical. (Acknowledgment path pending D-B1-1.)
- **AT-B1-8** Delete attempted on a `Transformed` predecessor: refused (409) while the successor exists.
- **AT-B1-9** Regression: `test_partial_close_leaves_remaining_units_open` and the 44 PPL1 lock tests stay green; known asterisk (`test_ai_run_bravo_live_via_api` hang) noted per packet as before.

---

## 7. Phase order (proposal)

**PPL5** transformation event + derived lineage + AT-B1-3/4/8 · **PPL6** drawer surfaces (Scale Out, N-close stack, wizard, lineage view) · **PPL7** re-recognition + current-structure + Analyzer consumption · **PPL8** import roll recognition + journal/retrospective grouping.

Each phase is its own GO packet; never combined with a chrome/sequence packet (S-1 stands).
