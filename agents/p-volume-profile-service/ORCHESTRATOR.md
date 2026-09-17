# Orchestrator — Volume Profile Service

**Instance:** **GROK BUILD — INFRA** (**DL-720**). Sole owner of `VPS*` / `VPSB*` tokens, VP data end (collectors, Engine, mapping, API), all StudioOne acts, tonight’s chain (VPS2 ACT 3 → futures migration).

**Does not execute:** `SADEV*` (GROK BUILD — APPS — reads collector store **READ-ONLY**, never writes it). **Does not self-review specs** — VP v0.6 and SA v0.3 reviews route to **GROK ADVISOR**.

**Contention:** on StudioTwo, **collector wins**; apps throttle. Cross-instance conflict → **STOP, report to Coach**.

**Juliet** runs this board. Specialists only via seeds. Gates via **Delta** ternary.

**Working spec (INFRA):** [`Specs/Volume-Profile-Service-Spec-v0_6.md`](../../Specs/Volume-Profile-Service-Spec-v0_6.md) **v0.6** sha1 `a438f9d636e40d4c95feb87874daf8c603344aac` · **DL-722** (bytes **DL-721**). Git identity **DL-724** `e1cdaf2a` on `vp/seated-law-v0.6`.  
**App-end spec (APPS):** SA Service **v0.4** **SA-L11** · **DL-725** (detection baseline remains v0.3 sha1 `4638ce958a81e24980ed6fd2e7618aaec51f4cfd` · **DL-721**).  
**Plan:** [`docs/Volume-Profile-Service-Full-Agent-Bench-Plan-v1.2.md`](../../docs/Volume-Profile-Service-Full-Agent-Bench-Plan-v1.2.md) **v1.2** (INFRA execution plan; spec pair is v0.6/v0.3).  
**Token:** [`agents/go/VPS0-W0.md`](../go/VPS0-W0.md) **STAMPED GO** · **DL-706** · VPS0 **CLOSED**  
**Law:** **CP-1** Chain primacy · **DL-707**  
**Q2:** [`agents/go/VPS-Q2-W0.md`](../go/VPS-Q2-W0.md) — GO named; **HELD** until after 16:00 ET (CP-1)

### Critical path

```text
VPS0 CLOSED ──► Q2 StudioOne (own GO + CP-1, outside RTH) ──► later VPS1-W0
```

| Phase | State |
|-------|--------|
| **GATE 0** | **PASS** `gate-reports/VPS0-G.md` |
| **VPS0 stamp** | **CLOSED** · `VPS0-W0` STAMPED **DL-706** |
| **CP-1** | **standing** · **DL-707** |
| **Q2** | **DONE** 20:00 ET — quotes-only; chain_feed 538 unchanged. `gate-reports/VPS-Q2.md`. **VPS1 NO-GO** |
| **VPS1** | **PASS mechanics** `VPS1-G.md` · install **live** on StudioOne (`LABS_VP_SPY_TRADES=1`) · chain_feed 538 · carry: full-RTH after tomorrow close |
| **VPSB** | **ACT A LIVE on StudioTwo** · store `/Users/ernie/fattail-market-data` · ES+MES prints landing · **ACT B HOLD** until after 16:00 (`VPSB-ACT-A.md`) |
| **Q10** | **Ticked (b)** · **DL-714** — SA objects only; bins internal. AZ-VP-9 + SA-Q5 next authoring rounds. |
| **Q5** | **Ticked EXCLUDE** · **DL-715** — Engine eligibility; capture still stores odd lots. |
| **SADEV*** | **APPS-owned** · token [`agents/go/SA-DEV-W0.md`](../go/SA-DEV-W0.md) **STAMPED GO** **DL-723** · INFRA does not execute |
| **Tonight (INFRA)** | **unchanged:** VPS2 ACT 3 → futures migration (after 16:00 ET) |

### Pending list (standing)

- **`VPS2-W0` stamp** (only remaining VPS2 *blocker* after ACT 1)
- **VPS1-G carry** (clock-gated: on/after **2026-09-17 16:00 ET**) — first full-RTH capture verify
- **Q4** Engine proposal (after that carry; not law this packet)
- **SA-Q1 / SA-Q2** calibrations (SA, not VPS2 blockers)

### Do not

- SSH StudioOne / MiniTwo / DudeTwo in this packet.  
- Fire VPS1.  
- Disrupt `chain_feed`.  
- Stop `:3000` / `:4000`.
