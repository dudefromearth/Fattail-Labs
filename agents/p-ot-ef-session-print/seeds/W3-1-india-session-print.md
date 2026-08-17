# W3-1 — India Session/Print spec review

**Agent:** India  
**Depends on:** W0-G  
**Plan phase:** W3  
**Law:** `Specs/FatTail-Labs-OPF-Session-and-Print-Authority-Spec-v0.1.md`  
**Workflow:** `agents/bench/spec-create-review-workflow.md` Phase 2  
**Parents:** OPF v0.2.1 · Arch 28 · Arch 30 · OT-EF v1.1 Law C · Analyzer B2

## Intent

**HOW** review of Session/Print v0.1. **WHETHER is already BUILD** (Coach W3-0 2026-08-16 · DL-397): build the market-state feed — that is why this program exists. India’s review **shapes HOW**. It does **not** gate WHETHER. A RETURNED verdict means “amend the envelope / writer / OD-SESS before W4,” not “do not build.”

Objections sit **beside** Coach text (Coach Content Law).

## Asks

1. Is **OPF** the right SoR for session + print quality (vs bus vs client clock)?  
2. Envelope-on-payload vs cited session object (OD-SESS-1) — recommendation labeled **opinion**.  
3. Who writes `mb:session:*` (OD-SESS-2) — opinion.  
4. Clash with Analyzer B2 (market-plane session) or Arch 28 (one WS, no client Massive)?  
5. Two clocks: does this spec accidentally change **τ / OPF29**? It must not.  
6. Invariant clash with last-print-as-held (OT-EF B1)?

## Files in scope

Session/Print spec (comments / reviewer section). Do not silently rewrite Coach Phase 0. Do not implement.

## Out of scope

Envelope **code** (W4). Deleting `/session-status`. Chrome. Vetoing WHETHER.

## Done when

Verdict **APPROVED** or **RETURNED** for **HOW** (envelope shape, writer, OD-SESS, parent clash), plus § Flagged ideas and § Bench delta. File: `gate-reports/W3-1-india.md`. Do not write RETURNED as a WHETHER block.

## Gate

Feeds W3-2 · W3-3 · **W3-G**.
