# Seed W0-2 — India parents / canonical draft / C2 lock

**Project:** p-alerts  
**Agent:** India  
**Phase:** W0  
**Depends:** W0-1  
**Gate it feeds:** W0-3…6 · W0-G

## Intent

Confirm the two-plane architecture, one wire dialect, Arch 28 scope, and C2 sequencing against **artifacts**, not this plan’s parent table.

## Asks (blocking if failed)

1. **Canonical draft:** ALM §3.2 is the only draft table. AZ-ALB §2.2 **cites** it. `suite` and `severity` always required. Analyzer filling: `suite: options_lab`, named default `medium`. APPROVE or RETURN.  
2. **ALB-A2 (first paragraph of the report):** Arch 28 one-socket law is **market data** (`WS /api/me/market/stream` · `MarketSocket`). `/api/me/alerts/stream` is a member-identity stream — lawful, **not** a second market socket, not precedent for one. Quote Arch 28 §4.3 scope note.  
3. **C2 lock (ALB-B1):** File lock is `web/components/options-lab/risk-graph/HostPnLChart.tsx` + `web/lib/risk-graph/hostAlertMenu.ts`. Quote **both**:
   - `agents/p-az-viewport-2d/` W-G artifact (or state **unfiled**), **and**
   - `agents/p-az-viewport-return/` W-G artifact (or state **unfiled**).  
   If either W-G is unfiled, C2 stays **BLOCKED**. Do not invent “lock over.” Name the handoff: C2-0 fires only when both PASS. Viewport docs say `PnLChart.tsx`; as-built is `HostPnLChart.tsx` (**DL-458**). Unfiled is unfiled — the rename is not a W-G. C2-0 will cite DL-458 next to the W-G excerpts (AL-A2).  
4. Registry rejects unregistered `source_system` (AT-ALM-3). Settings is not a second builder.  
5. Packet M and C1 may BUILD without `HostPnLChart`. Packet S after M-G.

## Files in scope (read)

Both specs · this plan · DL-464 · Arch 28 §4.3 · both viewport boards (`ORCHESTRATOR.md`, `gate-reports/`) · `git log` for any named W-G commit.

## Out of scope

Code. Treating this plan’s “W-G unfiled” sentence as the artifact (quote the boards). Inventing Manager-side live evaluation.

## Done when

`gate-reports/W0-2-india.md` — workflow verdict. **First paragraph is ALB-A2. Second paragraph quotes both viewport W-G artifacts (or unfiled).** Block only invariant / law / system.

## Invariants

India blocks unsafe architecture. Opinions labeled. Coach two-plane intent stays.
