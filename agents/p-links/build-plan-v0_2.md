# Links — Phase 1 build plan v0.2 — seated LK-1; awaiting stamp

**Plan:** v0.2
**Supersedes:** `agents/p-links/build-plan-v0_1.md` (left on disk). v0.1 is pre-seat and cites `Specs/Links-Spec-v0_3.md`. Do not dispatch from v0.1.
**Spec:** `Specs/LK-1.md`. Source draft `Specs/Links-Spec-v0_4.md` is unchanged (21665 bytes) and is not the seated copy.
**BUILD AUTHORITY:** none. This document does not execute. Phase 1 executes only after Coach stamps LK-1.
**Machine:** prove on StudioTwo; promote to MiniTwo (`labs.fattail.ai`) at W5.
**Orchestrator:** dispatches seats and does not implement. No seat implements outside its component.
**Gate reports:** `agents/p-links/gate-reports/`. W0-G is filed.
**Phases 2–4:** scoped in the spec. Not in this plan. Later-phase questions are not used.

## What changed v0.1 → v0.2

| Area | v0.1 | v0.2 |
|---|---|---|
| Spec | `Specs/Links-Spec-v0_3.md`, pre-seat | `Specs/LK-1.md` |
| Q1–Q6 | open | ruled in LK-1 §9.1. This plan does not re-open them |
| W0 | not run; stamp would release it | filed: `agents/p-links/gate-reports/W0-G.md`, GO on the exemption question |
| Allowlists | unbound until W0 | still unbound. The census did not name a product tree |
| Session cookie and access log | unknown | reported in W0-G. Not planned |
| Dispatch on stamp | W0 only | W0 is already filed. Stamp does not dispatch W1 |

---

## 1. Scope

Phase 1 is the QR front-end: link store with placement fields present but optional; public redirect with scan log; QR renderer; admin app (create, edit destination, deactivate, scan history, export). Components C1–C7 only.

Touches named in the spec header:

- one public, unauthenticated route on the Labs host, `GET /q/<slug>`
- the Labs app registry (one admin-role entry)
- the admin app

Q4 is ruled: events go to the app's own store (C2), not to `page_views` or `landing_events`.

The file tree is still unnamed. W0-G records where a public GET is served and where an `apps` row lands. It does not choose. Product allowlists stay empty until a later document names the paths. That document is not this plan.

### Recorded by W0-G, not planned

- No auth exemption is required for a cookieless GET to be answered.
- If C3 is a route on the FastAPI app, `rolling_session_middleware` reads `ft_session` when the cookie is present and may reissue it, and uvicorn's default access log records `client_addr`. RD-L1, RD-L2, AT-11a, and RD-L3 are the laws those facts meet. This plan does not exempt the path and does not move the route.
- `apps` has no role column. The admin overview is a hardcoded card list. This plan does not pick which surface C6 uses.
- There is no WordPress tree in the repo. W6 drafts the disclosure paragraph. This version does not place it (§11).

### Open for Coach, not planned

LK-L4 contains both "default H with a center logo" and "off by default (ruled Q5)". §9.1 Q5 says the mark is off by default. This plan does not pick the clause. W2 does not dispatch while both clauses are in the law.

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

G-A, G-P, W4-G, and W5-G are Coach's. The orchestrator never auto-GOs them. G-D is Echo's record, not an implementer gate, and is not auto-GOed.

---

## 3. Packets W0–W6

Nothing dispatches until G-A is GO. W0 is filed and is not re-dispatched. W1 does not dispatch on the stamp alone: its product allowlist is unbound, and the LK-L4 logo clauses are both still in the law. Later packets wait on the blockers named on them.

Evidence at every gate: screenshots and logs pinned to machine, origin, and time. Machine is StudioTwo through W4 and MiniTwo at W5. Origin is the git SHA of the tree under test. Time is that machine's clock. AT-10 also requires a network capture.

Allowlists are checked line by line against `git diff --stat` at the gate. A path not on that packet's allowlist stops the gate. Product paths are unbound. Until a list exists, any product-tree diff is outside the allowlist.

Each gate report records, under the heading **Unmeasured**, what that gate's tests did not measure. The orchestrator does not fill that heading in advance. W0-G has written its own.

### W0 — Census (G-0)

Filed. `agents/p-links/gate-reports/W0-G.md`. Verdict GO on the exemption question. Reviewer of record: Delta, not yet run.

**Allowlist:** `agents/p-links/gate-reports/W0-G.md` only. Matched: that file is the census. No product diff belongs to W0.

### W1 — Stores + route (C1, C2, C3, C7)

Alpha owns C1, C2, and C3. Kilo owns C7. Neither edits the other's files once an allowlist has split them. Reviewer: Delta.

**Requires:** G-A. G-H (Q1), G-S (Q4), and G-L (Q6) are closed by LK-1 §9.1. W0-G is GO and no auth exemption is outstanding. Also required before dispatch, and not yet true: a named file tree and a bound allowlist for C1, C2, C3, and C7.

**Gate W1-G:** AT-1, AT-4, AT-5, AT-6, AT-10, AT-11a. No other test. AT-1 includes the header set and the post-edit rescan, and it measures latency against the bar RD-L1 already states. This plan adds no target.

**Allowlist:** unbound.

### W2 — Renderer + geo (C4, C5)

Alpha. Reviewer: Delta.

**Requires:** G-G (Q2) and G-I (Q3), closed by LK-1 §9.1, and W1-G GO. Also: Coach's pick on the two LK-L4 logo clauses. Until that pick is in a new spec version, W2 stays undispatched.

**Gate W2-G:** AT-2, AT-3. No other test. IP handling is the ruled one (discarded after lookup). AT-3's grep is the evidence.

**Allowlist:** unbound.

### W3 — Admin app (C6)

Charlie. Reviewer: Delta.

**Requires:** G-D, and W2-G GO. Q5's ruling text is in §9.1; the LK-L4 clash is the W2 blocker above.

**Gate W3-G:** AT-7, AT-8, AT-11b. No other test. One screenshot per view, pinned to machine, origin, and time.

**Allowlist:** unbound.

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

Juliet drafts the decision-log entry. India runs the drift check. Lima runs the Help-doc check. None of them edit the app. Reviewer: Delta. Auto-GO only when the four artifacts below exist and the diff matches the allowlist.

**Gate W6-G:** close-out. No numbered AT is added.

**Close-out artifacts:**

- a DL-### entry, number assigned when the entry is written, not by this plan
- the disclosure paragraph for fattail.ai, drafted for Coach's approval. Placing it is outside this repo. This version does not place it
- an amendment to the architecture document the census cites for public routes and the data model: the new public route, and the link/event model with `member_id`, `marker_id`, and `owner` documented as reserved
- India's drift check, filed in the gate report
- Lima's Help-doc check, filed in the gate report

**Allowlist:** the decision log, the one architecture document named when the route exists, the Help document Lima's check names, and `agents/p-links/gate-reports/W6-G.md`. No WordPress path.

---

## 4. Gate discipline

The orchestrator auto-GOes a clean implementer gate and stops on any problem. Clean means: every listed test green, evidence pinned, allowlist matched, blockers ruled, and the **Unmeasured** heading written. The verdict is explicit GO or NO-GO. A problem is NO-GO. There is no waiver.

Auto-GO applies only to W1-G, W2-G, W3-G, and W6-G once each packet is actually dispatchable. W0-G is already GO on the exemption question and is not a build GO.

Never auto-GO: G-A, G-P, G-D, W4-G, W5-G.

At every gate, the reviewer asks what the acceptance tests did not measure and records the answer under **Unmeasured**.

---

## 5. Stop conditions

From the spec:

> Nothing dispatches until G-0 and G-A are GO. W1 requires G-H, G-S, G-L. Coach gates: G-A, G-P, W4-G, W5-G — never auto-GO.

G-0 is GO. G-H, G-S, and G-L are closed by §9.1. G-A is still open.

> The Phase 1 redirect reads no cookie, no session, and no identity of any kind, even when the phone carries a Labs session cookie because Q1 chose the Labs host; it writes nothing into those two columns.

> **owner** (`partner` / `member` id) — **present and not settable in Phase 1**: no form, API, or import writes it until Phase 3

> No channel report in Phase 1 (LK-L5).

> Phase 3 adds a WordPress tree on fattail.ai (order marker, affiliate ledger) and is a separate three-OK when it is authorized.

> **P4-R1 Rules.** … evaluation never sits on the redirect path.

> Phase 2, 3, and 4 build; member-created links; vCard/Wi-Fi payloads; unique-visitor counting; deletion; any market-data path; any WordPress change.

Added by this plan:

- any session or cookie read on the route
- any channel report
- any `owner` write
- any WordPress touch
- any rule engine
- any file outside a packet's allowlist
- an auth exemption: W0-G found none is required. Do not add one
- a product diff while the allowlist is unbound
- W2 or W3 work while LK-L4 still says both "with a center logo" and "off by default"

Q1–Q6 are ruled in LK-1 §9.1. This plan stores no further default for them.

---

## 6. Dispatch

W0 is filed. Do not dispatch it again.

On Coach's stamp, W1 stays undispatched until a document names the C1–C7 paths and binds their allowlists, and until the LK-L4 logo clauses are a single instruction in a spec version. The orchestrator does not implement.
