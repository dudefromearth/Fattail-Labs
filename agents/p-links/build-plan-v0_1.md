# Links — Phase 1 build plan v0.1 — pre-seat; re-bind to the series ID at stamp

**Plan:** v0.1
**Spec:** `Specs/Links-Spec-v0_3.md` (DRAFT — GO for intake 2026-10-04). Juliet has not seated a series ID. The only seated series file in `Specs/` is `CT-1.md`. This plan binds to v0.3. At stamp, replace this header, the filename citation, and every "v0.3" pointer with the seated ID. Do not dispatch against a stale pointer.
**BUILD AUTHORITY:** none. This document does not execute. Phase 1 executes only after Coach stamps the spec (G-A) and Q1–Q6 are ruled.
**Machine:** prove on StudioTwo; promote to MiniTwo (`labs.fattail.ai`) at W5.
**Orchestrator:** dispatches seats and does not implement. No seat implements outside its component.
**Gate reports:** `agents/p-links/gate-reports/`. The directory is created with the first report, not by this document.
**Phases 2–4:** scoped in the spec. Not in this plan. Q7–Q12 are not ruled here and are not used.

---

## 1. Scope

Phase 1 is the QR front-end: link store with placement fields present but optional; public redirect with scan log; QR renderer; admin app (create, edit destination, deactivate, scan history, export). Components C1–C7 only.

Touches named in the spec header, and no others:

- one public, unauthenticated route on the Labs host, `GET /q/<slug>`
- the Labs app registry (one admin-role entry)
- the instrumentation store, if events are written there (Q4)
- the admin app

Touches outside: pending W0. Trees are a hypothesis until W0.

### Raised to Coach, not planned

The spec does not name a file tree. This plan does not choose one.

- `GET /q/<slug>` is named; the file that serves it is not. `web/next.config.ts` rewrites only `/api/:path*`. Which tree holds the public route?
- The admin app is named; its URL is not. Which path is the admin app?

---

## 2. Seat roster

| Component / packet | Implements | Does not implement | Reviewer at the gate |
|---|---|---|---|
| W0 census | India, Juliet (read-only) | C1–C7, any exemption | Delta |
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

Nothing dispatches until G-A is GO. W0 is the only packet stamp alone can release. W1 does not dispatch until W0-G is GO, no auth exemption is outstanding, and Q1, Q4, and Q6 are ruled. Later packets wait on the blockers named on them.

Evidence at every gate: screenshots and logs pinned to machine, origin, and time. Machine is StudioTwo through W4 and MiniTwo at W5. Origin is the git SHA of the tree under test. Time is that machine's clock. AT-10 also requires a network capture.

Allowlists are checked line by line against `git diff --stat` at the gate. A path not on that packet's allowlist stops the gate. Product paths are unbound until W0-G writes them. Until that list exists, any product-tree diff is outside the allowlist.

Each gate report records, under the heading **Unmeasured**, what that gate's tests did not measure. The orchestrator does not fill that heading in advance.

### W0 — Census (G-0)

Read-only. India and Juliet. Reviewer: Delta.

**Census, in this order:**

1. Auth middleware. Open `server/main.py` (what is registered on every request), `server/session_refresh.py`, `server/csrf.py`, and `server/guards.py` (`require_session`, `require_role`, `require_admin`). Report the file path, whether the gate is global or per-route, and the routes that already answer with no session. Report whether a `GET` with no cookie is refused before a handler runs.
2. Public route on the Labs host. Report where a non-`/api` GET is served today, and whether `/q/` can exist without a new exemption. `web/next.config.ts` is one file in that census, not a conclusion.
3. App registry. Open the `apps` insert pattern (`server/routes/apps.py` and the migrations that insert into `apps`) and the admin shell that lists those rows. Report the pattern. Do not add a row.
4. Instrumentation. Open `migrations/039_user_activity.sql` (`page_views`), `migrations/125_landing_events.sql`, and `server/activity.py`. Report the schema. Do not choose it. Q4 is still open.
5. Any tree this program would touch that the spec does not name. Raise it to Coach in one line. Do not add it to a later allowlist.

**Acceptance tests:** none. W0-G is GO / NO-GO on the census itself.

**Allowlist:** `agents/p-links/gate-reports/W0-G.md` only.

**Blockers:** none ahead of the census. G-A (Coach's stamp) before dispatch.

**Stop inside W0:** if `/q/` needs an auth exemption, W0-G is NO-GO. The plan stops. The exemption is reported, not planned, and is not added to any later allowlist.

### W1 — Stores + route (C1, C2, C3, C7)

Alpha owns C1, C2, and C3. Kilo owns C7. Neither edits the other's files once W0-G has split the allowlist. Reviewer: Delta.

**Requires:** G-H (Q1), G-S (Q4), G-L (Q6), and W0-G GO with no exemption outstanding. The event store is not written before Q6 is ruled.

**Gate W1-G:** AT-1, AT-4, AT-5, AT-6, AT-10, AT-11a. No other test. AT-1 includes the header set and the post-edit rescan, and it measures latency against the bar RD-L1 already states. This plan adds no target.

**Allowlist:** unbound. W0-G binds the C1, C2, C3, and C7 paths before this packet is dispatchable. Kilo's D4 fixture file is on Kilo's lines. Alpha does not edit it.

**Blockers this plan does not answer:** Q1 (short-link host), Q4 (event store), Q6 (location granularity and disclosure).

### W2 — Renderer + geo (C4, C5)

Alpha. Reviewer: Delta.

**Requires:** G-G (Q2), G-I (Q3), and W1-G GO.

**Gate W2-G:** AT-2, AT-3. No other test. IP handling per Q3 is shown in the code under review, not chosen by this plan.

**Allowlist:** unbound. W0-G binds the C4 and C5 paths.

**Blockers this plan does not answer:** Q2 (geo source), Q3 (IP retention).

### W3 — Admin app (C6)

Charlie. Reviewer: Delta.

**Requires:** G-D, and W2-G GO.

**Gate W3-G:** AT-7, AT-8, AT-11b. No other test. One screenshot per view, pinned to machine, origin, and time.

**Allowlist:** unbound. W0-G binds the C6 paths, including the admin-registry entry if the census put that entry on C6.

**Blockers this plan does not answer:** Q5 (center logo), and the G-D mockup (not started). Echo records G-D. W3 does not start from an unapproved mockup.

### W4 — Live acceptance

No implementer. Reviewer: Coach. Never auto-GO.

Coach scans a dev-hosted QR from his phone, edits the destination, and rescans the same image.

**Gate W4-G:** Coach. Evidence pinned to machine, origin, and time. No numbered AT is added.

**Allowlist:** no product diff. Evidence files only, under `agents/p-links/gate-reports/`.

**Blockers:** W3-G GO, then Coach.

### W5 — Promotion to MiniTwo

No implementer. Reviewer: Coach. Never auto-GO.

**Requires:** G-P (W4-G GO with evidence, rollback named). Market-closed window. Rollback named before the promotion starts. This plan does not name the rollback steps; W4-G's evidence packet names them, and G-P is Coach's.

**Gate W5-G:** AT-9, Coach. AT-9 is AT-1 and AT-7 on production from Coach's phone. No other test.

**Allowlist:** the promotion diff W0-G bound for MiniTwo, or no product diff if promotion ships the already-gated tree. A file that appears only at promotion and was not on a prior allowlist stops the gate.

### W6 — Close-out

Juliet drafts the decision-log entry. India runs the drift check. Lima runs the Help-doc check. None of them edit the app. Reviewer: Delta. Auto-GO only when the four artifacts below exist and the diff matches the allowlist.

**Gate W6-G:** close-out. No numbered AT is added.

**Close-out artifacts:**

- a DL-### entry, number assigned when the entry is written, not by this plan
- an amendment to the architecture document W0 cites for public routes and the data model: the new public route, and the link/event model with `member_id`, `marker_id`, and `owner` documented as reserved
- India's drift check, filed in the gate report
- Lima's Help-doc check, filed in the gate report

**Allowlist:** the decision log, the one architecture document W0 named, the Help document Lima's check names, and `agents/p-links/gate-reports/W6-G.md`.

---

## 4. Gate discipline

The orchestrator auto-GOes a clean implementer gate and stops on any problem. Clean means: every listed test green, evidence pinned, allowlist matched, blockers ruled, and the **Unmeasured** heading written. The verdict is explicit GO or NO-GO. A problem is NO-GO. There is no waiver.

Auto-GO applies only to W0-G, W1-G, W2-G, W3-G, and W6-G, and W0-G is not auto-GOed when an exemption is required.

Never auto-GO: G-A, G-P, G-D, W4-G, W5-G.

At every gate, the reviewer asks what the acceptance tests did not measure and records the answer under **Unmeasured**.

---

## 5. Stop conditions

From the spec, verbatim:

> Nothing dispatches until G-0 and G-A are GO. W1 requires G-H, G-S, G-L. Coach gates: G-A, G-P, W4-G, W5-G — never auto-GO.

> if the host's auth middleware is global, exempting `/q/` is an auth-tree touch raised at W0-G

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
- an auth exemption: stop at W0-G and report; do not plan the exemption

Silence on Q1–Q6 does not decide them. This plan stores no default for any of them.

---

## 6. Dispatch

On Coach's stamp, re-bind this plan to the series ID, then dispatch W0 only. W1–W6 stay un-dispatched until their blockers are ruled and their allowlists are bound. The orchestrator does not implement.
