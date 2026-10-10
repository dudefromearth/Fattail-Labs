# Links — Phase 1 build plan v0.3 — LK-1 stamped; law is LK-1.1

**Plan:** v0.3
**Supersedes:** `agents/p-links/build-plan-v0_2.md` (left on disk; awaiting stamp, QR hold open). Do not dispatch from v0.1 or v0.2.
**Spec the build follows:** `Specs/LK-1.1.md`. Stamped baseline: `Specs/LK-1.md`, bytes unchanged, stamp `Specs/LK-1-STAMP.md`. Source draft `Specs/Links-Spec-v0_4.md` is unchanged (21665 bytes) and is not law.
**BUILD AUTHORITY:** Phase 1, by G-A on 2026-10-05. This document does not itself dispatch. Phases 2–4 are not authorized.
**Machine:** prove on StudioTwo; promote to MiniTwo (`labs.fattail.ai`) at W5.
**Orchestrator:** dispatches seats and does not implement. No seat implements outside its component.
**Gate reports:** `agents/p-links/gate-reports/`. W0-G is filed.

## What changed v0.2 → v0.3

| Area | v0.2 | v0.3 |
|---|---|---|
| Authority | none; awaiting stamp | Phase 1 BUILD AUTHORITY. Stamp is `Specs/LK-1-STAMP.md`. LK-1 bytes unchanged |
| Law | `Specs/LK-1.md` | `Specs/LK-1.1.md`. Only LK-L4 changed |
| QR hold | W2 blocked on two LK-L4 clauses | closed. Logo off unless an admin turns the FatTail mark on. A logo forces error-correction H |
| Redirect | tree unnamed | Next page at `/q/<slug>`. Never an `/api` route |
| Admin entry | surface unnamed | existing role derivation; one new card; no role column on `apps` |
| Disclosure | draft at W6, unplaced | same, now Coach's order |
| Allowlists | unbound | still unbound. Grok Build names the C1–C7 files and binds them in the next plan version |
| W1 | blocked on stamp, tree, and logo | blocked only on the named tree and the bound allowlist |

These three facts are plan constraints from W0-G plus Coach's order. They are not spec edits.

1. The redirect is a Next page at `/q/<slug>`. It is never an `/api` route and never a FastAPI route. The API path reads a Labs cookie when one is present and the process access log records the client address. RD-L2 and RD-L3 forbid both.
2. "Admin only" (AD-L1) comes from the existing role derivation on the page. No role column is added to the `apps` table. The hardcoded admin card list (`web/app/admin/page.tsx`) gains one card.
3. The disclosure paragraph is drafted at close-out. Nothing is placed on fattail.ai in this version. No WordPress path is on any allowlist.

---

## 1. Scope

Phase 1 is the QR front-end: link store with placement fields present but optional; public redirect with scan log; QR renderer; admin app (create, edit destination, deactivate, scan history, export). Components C1–C7 only.

Q1–Q6 are ruled in LK-1 §9.1 and carried unchanged into LK-1.1, except LK-L4, which LK-1.1 replaces. Events go to the app's own store (C2), not to `page_views` or `landing_events`.

The C1–C7 file tree is not named in this plan. Grok Build names it and binds the allowlists in a new plan version. That version has to satisfy the three constraints above. W1 may dispatch from that version. This version does not dispatch W1.

---

## 2. Seat roster

| Component / packet | Implements | Does not implement | Reviewer at the gate |
|---|---|---|---|
| W0 census | India, Juliet (read-only) — filed | C1–C7, any exemption | Delta |
| C1 Link store, C2 Event store, C3 Redirect route | Alpha (W1) | C4, C5, C6, C7 | Delta (W1-G) |
| C7 Fixtures | Kilo (W1) | C1–C6 | Delta (W1-G) |
| C4 QR renderer, C5 Geo lookup | Alpha (W2) | C1–C3, C6, C7 | Delta (W2-G) |
| C6 Admin app | Charlie (W3) | C1–C5, C7 | Delta (W3-G) |
| G-D mockup | Echo (UX seat) | app code | not auto-GO; W3 stays blocked until G-D is recorded GO |
| W4 live acceptance | — | — | Coach |
| W5 promotion | — | — | Coach |
| W6 close-out | Juliet drafts the DL entry; India runs the drift check; Lima runs the Help-doc check | app code | Delta |

G-A is GO by `Specs/LK-1-STAMP.md`. G-P, W4-G, and W5-G are Coach's. The orchestrator never auto-GOs them. G-D is Echo's record and is not auto-GOed.

---

## 3. Packets W0–W6

W0 is filed and is not re-dispatched. W1 dispatches only from the plan version that names the C1–C7 paths and binds their allowlists. Later packets wait on the blockers named on them.

Evidence at every gate: screenshots and logs pinned to machine, origin, and time. Machine is StudioTwo through W4 and MiniTwo at W5. Origin is the git SHA of the tree under test. Time is that machine's clock. AT-10 also requires a network capture.

Allowlists are checked line by line against `git diff --stat` at the gate. A path not on that packet's allowlist stops the gate. Product paths are unbound in this version. Until the next version binds them, any product-tree diff is outside the allowlist.

Each gate report records, under the heading **Unmeasured**, what that gate's tests did not measure. The orchestrator does not fill that heading in advance. W0-G has written its own.

### W0 — Census (G-0)

Filed. `agents/p-links/gate-reports/W0-G.md`. Verdict GO on the exemption question.

**Allowlist:** `agents/p-links/gate-reports/W0-G.md` only.

### W1 — Stores + route (C1, C2, C3, C7)

Alpha owns C1, C2, and C3. Kilo owns C7. Neither edits the other's files once an allowlist has split them. Reviewer: Delta.

**Requires:** G-A (GO). G-H (Q1), G-S (Q4), and G-L (Q6) are closed by §9.1. W0-G is GO and no auth exemption is outstanding. Also required before dispatch, and not yet true: the named file tree and the bound allowlist for C1, C2, C3, and C7. C3's path is a Next page at `/q/<slug>`, not an API route.

**Gate W1-G:** AT-1, AT-4, AT-5, AT-6, AT-10, AT-11a. No other test. AT-1 includes the header set and the post-edit rescan, and it measures latency against the bar RD-L1 already states. This plan adds no target.

**Allowlist:** unbound. The next plan version binds it.

### W2 — Renderer + geo (C4, C5)

Alpha. Reviewer: Delta.

**Requires:** G-G (Q2) and G-I (Q3), closed by §9.1, and W1-G GO. The LK-L4 hold is closed by LK-1.1.

**Gate W2-G:** AT-2, AT-3. No other test. IP handling is the ruled one (discarded after lookup). AT-3's grep is the evidence. AT-2 covers every error-correction level, and a center logo only at level H.

**Allowlist:** unbound. The next plan version binds it.

### W3 — Admin app (C6)

Charlie. Reviewer: Delta.

**Requires:** G-D, and W2-G GO. The admin card is the one new card on `web/app/admin/page.tsx`. Role is the existing derivation. No `apps` role column.

**Gate W3-G:** AT-7, AT-8, AT-11b. No other test. One screenshot per view, pinned to machine, origin, and time.

**Allowlist:** unbound, except the constraint that `web/app/admin/page.tsx` is the card-list file and that no migration adds a role column to `apps`. The next plan version binds the rest of C6.

### W4 — Live acceptance

No implementer. Reviewer: Coach. Never auto-GO.

Coach scans a dev-hosted QR from his phone, edits the destination, and rescans the same image.

**Gate W4-G:** Coach. Evidence pinned to machine, origin, and time. No numbered AT is added.

**Allowlist:** no product diff. Evidence files only, under `agents/p-links/gate-reports/`.

### W5 — Promotion to MiniTwo

No implementer. Reviewer: Coach. Never auto-GO.

**Requires:** G-P (W4-G GO with evidence, rollback named). Market-closed window. Rollback named before the promotion starts. This plan does not name the rollback steps; W4-G's evidence packet names them, and G-P is Coach's.

**Gate W5-G:** AT-9, Coach. AT-9 is AT-1 and AT-7 on production from Coach's phone. No other test.

**Allowlist:** the promotion diff bound before W5, or no product diff if promotion ships the already-gated tree. A file that appears only at promotion and was not on a prior allowlist stops the gate.

### W6 — Close-out

Juliet drafts the decision-log entry and the disclosure paragraph. India runs the drift check. Lima runs the Help-doc check. None of them edit the app. None of them place the paragraph on fattail.ai. Reviewer: Delta.

**Gate W6-G:** close-out. No numbered AT is added.

**Close-out artifacts:**

- a DL-### entry, number assigned when the entry is written, not by this plan
- the disclosure paragraph, drafted for Coach's approval, not placed
- an amendment to the architecture document the census cites for public routes and the data model: the new public route, and the link/event model with `member_id`, `marker_id`, and `owner` documented as reserved
- India's drift check, filed in the gate report
- Lima's Help-doc check, filed in the gate report

**Allowlist:** the decision log, the one architecture document named when the route exists, the Help document Lima's check names, and `agents/p-links/gate-reports/W6-G.md`. No WordPress path. No fattail.ai path.

---

## 4. Gate discipline

The orchestrator auto-GOes a clean implementer gate and stops on any problem. Clean means: every listed test green, evidence pinned, allowlist matched, blockers ruled, and the **Unmeasured** heading written. The verdict is explicit GO or NO-GO. A problem is NO-GO. There is no waiver.

Auto-GO applies only to W1-G, W2-G, W3-G, and W6-G once each packet is actually dispatchable. W0-G is already GO on the exemption question.

Never auto-GO: G-P, G-D, W4-G, W5-G. G-A is already GO by the stamp file.

At every gate, the reviewer asks what the acceptance tests did not measure and records the answer under **Unmeasured**.

---

## 5. Stop conditions

From the spec:

> Nothing dispatches until G-0 and G-A are GO. W1 requires G-H, G-S, G-L. Coach gates: G-A, G-P, W4-G, W5-G — never auto-GO.

G-0 is GO. G-A is GO by `Specs/LK-1-STAMP.md`. G-H, G-S, and G-L are closed by §9.1.

> The Phase 1 redirect reads no cookie, no session, and no identity of any kind, even when the phone carries a Labs session cookie because Q1 chose the Labs host; it writes nothing into those two columns.

> **owner** (`partner` / `member` id) — **present and not settable in Phase 1**: no form, API, or import writes it until Phase 3

> No channel report in Phase 1 (LK-L5).

> Phase 2, 3, and 4 build; member-created links; vCard/Wi-Fi payloads; unique-visitor counting; deletion; any market-data path; any WordPress change.

Added by this plan:

- any session or cookie read on the route
- mounting the redirect on the API
- any channel report
- any `owner` write
- any WordPress touch, including placing the disclosure paragraph
- a role column on `apps`
- any rule engine
- any file outside a packet's allowlist
- an auth exemption
- a product diff while the allowlist is unbound
- editing `Specs/LK-1.md`, `Specs/LK-1.1.md`, `Specs/LK-1-STAMP.md`, or this plan in place

---

## 6. Dispatch

W0 is filed. Do not dispatch it again.

Grok Build names the C1–C7 file tree and binds the allowlists in a new plan version. W1 may dispatch from that version. G-D, the phone test, and the MiniTwo promotion remain Coach's. The orchestrator does not implement.
