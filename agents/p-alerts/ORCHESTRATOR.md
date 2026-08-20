# ORCHESTRATOR — Labs Alerts

**Juliet** owns this board. Specialists fire only from seeds. No peer-to-peer tasking.

**Plan:** [`docs/Labs-Alerts-Full-Agent-Bench-Plan-v1.0.md`](../../docs/Labs-Alerts-Full-Agent-Bench-Plan-v1.0.md) **v1.0.3** (HIG conversion fail-closed)  
**Specs:** ALM v1.0.3 · AZ-ALB v1.0.3 · **DL-464…466**

W0 **PASS**. W0-BA names **M** and **C1**.  
**Do not fire C2 until C2-0 + C2-BA** (both viewport W-G PASS).

Silent if Coach fires W0-BA without override: **OD-ALM-eval** in-tab only · **OD-stream-transport** SSE OK · **OD-delete** unshipped.  
**OD-C2-reach has no silent default** — if W0-G names reachable, the stamp must choose keep-dark or accept-as-built+DL.

## DAG

```text
W0-0 … W0-BA          review (BA names M and/or C1; never C2)
Packet M              Manager API + /app/alerts + Settings
Packet C1             Builder + adapter + holder     ∥ M
C2-0 → C2-BA → C2     HostPnLChart apply             after viewport W-G
Packet S              adapter swap                   after M-G + C1-G
```

## Phase order

| Packet | Fire when | Board |
|--------|-----------|-------|
| W0-0 | Coach plan stamp | **STAMP** |
| W0-1 | After W0-0 | **PASS** |
| W0-2 … W0-6 | After W0-1 / W0-2 | **APPROVED** |
| W0-G | After W0-2…6 | **PASS** (reachable · local tree) |
| W0-BA | After W0-G | **M + C1** · accept-as-built **DL-466** |
| D0-1 | **Only if** W0-BA chose keep-dark | **NOT FIRED** |
| M1…M-G | W0-BA names **M** | **PASS** (`M-G.md`) |
| C1-1…C1-G | W0-BA names **C1** | **PASS** (`C1-G.md`) |
| C2-0 | Both viewport W-G PASS | BLOCKED (W-G unfiled on both boards) |
| C2-BA | After C2-0 | BLOCKED |
| C2-1…C2-G | After C2-BA | BLOCKED |
| S-1…S-G | After M-G **and** C1-G | BLOCKED |

## Seed protocol

1. Copy seed → agent with **both specs** + this plan + charter.  
2. PASS/FAIL/BLOCKED + evidence.  
3. Delta phase gate before the next packet.  
4. Lima DL same body as code (W0-1 = DL-465 plan cite).

## Coordination

- `p-az-viewport-2d`: W-G **not filed**. Packet A owns left-click pan / right-click alerts **gesture**. This board’s C2 **applies** alerts on that grammar after lock.  
- `p-az-viewport-return`: W-G **not filed**. Attach/life of `HostPnLChart`.  
- India C2-0 quotes **both** W-G artifacts. Do not assume lock over.  
- Analyzer residual board does not own Alerts anymore; Lima C1 rewrites Spec §1.14.

## Status (live)

| Packet | State |
|--------|--------|
| Specs | v1.0.3 |
| This plan | **v1.0.3 · W0-0 STAMP · W0-BA M+C1** |
| W0 | **PASS** |
| Packet M | **PASS** |
| Packet C1 | **PASS** |
| Packet C2 | Blocked on viewport W-G |
| Packet S | Blocked on M-G + C1-G |
