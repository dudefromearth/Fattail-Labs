# W0-2 — India persistence + lock handoff

**Project:** p-az-viewport-return  
**Agent:** India  
**Date:** 2026-08-19  
**Depends:** W0-1 PASS  
**Verdict:** **APPROVED**

## Splitter

This defect is **process persistence** (Options Lab `layout.tsx` provider, module `let`, native listeners, possible bfcache). Not Market Bus. Not Packet B. Not T8 Autofit as **this** splitter (analysis R10). Arch 28 and OT-EF hold.

## RH-B1 lock handoff (W-G absence)

Cited from Lima W0-1: **no** `p-az-viewport-2d` `W-G.md`; `W1-G.md` pending W2/W3/W-G; ORCHESTRATOR W-G BLOCKED.

**Handoff (named, not “lock over”):**

| File | Who |
|------|-----|
| `web/components/options-lab/risk-graph/PnLChart.tsx` | **Shared until Packet A W-G files.** Packet A follow-on (autofit/pan/wheel) stays `p-az-viewport-2d`. This program may edit it **only after W0-BA**, and only for the W0-M survivor. No parallel Packet A Charlie fire. |
| `web/components/options-lab/OpfRiskAnalyzer.tsx` | **This program after W0-BA** if W0-M points at pane/inert/Surface mount. Packet A original lock never included this file (VP-B1). Follow-on uncommitted keep-2D work on this file is **not** Packet A W-G. |
| `web/e2e/analyzer-viewport-*.spec.ts` | This program (measurement). Not exclusive with Packet A. |

Two boards must not run Charlie on `PnLChart.tsx` at the same time. Packet A W2/W3/W-G stay **BLOCKED** on `p-az-viewport-2d` until Coach sequences them; they do **not** edit `PnLChart.tsx` while this program’s W1 is open.

W0-M still names the *survivor*. This report names *who may edit which file*.
