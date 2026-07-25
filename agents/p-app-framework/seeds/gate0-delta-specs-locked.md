# Gate 0 — Delta: Specs Locked

**Project:** p-app-framework · **Agent:** Delta · **Wave:** W0  
**Depends on:** w0-coach-lima-approve PASS  
**Read first:** `agents/bench/delta.md`, both specs status headers, decision log

## Objective

Ternary gate: are the framework and privacy specs **approved and logged** such that W1 may begin?

## Evidence required

1. Spec status = Approved for build (date + Coach) — quote headers.  
2. Decision-log entries for F-D1 and T-D1 at minimum; list open D-* that block W2.  
3. Confirm no agent started W1 implementation commits before this gate (git log / status).  
4. CHARTER + ORCHESTRATOR exist and match approved T-D2 cut.

## Verdict

- **PASS** — W1 unblocked.  
- **FAIL** — missing approval or log; do not advance.  
- **BLOCKED** — external dependency (e.g. counsel required before any Family B wording in product).

## Report

Write `agents/p-app-framework/gate-reports/gate-0.md` with verdict + evidence. Delta does **not** modify specs under review.
