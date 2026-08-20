# Labs Alerts — Full Agent Bench Plan v1.0

**Date:** 2026-08-20  
**Plan revision:** **v1.0.3** (HIG conversion is C1/M2/C2 deliverable — ATs, lint, Delta fail-closed)  
**Canonical filename:** `docs/Labs-Alerts-Full-Agent-Bench-Plan-v1.0.md`  
**Owner (orchestration):** Juliet  
**Authority:** Coach (GO / ship)  
**Board:** [`agents/p-alerts/`](../agents/p-alerts/)  
**Governance:** [`agents/bench/doctrine.md`](../agents/bench/doctrine.md) · [`AGENTS.md`](../AGENTS.md) · [`spec-create-review-workflow.md`](../agents/bench/spec-create-review-workflow.md)

**Primary law:**

| Doc | Path | Status |
|-----|------|--------|
| **Alerts Manager Spec v1.0.3** (ALM) | [`Specs/FatTail-Labs-Alerts-Manager-Spec-v1.0.md`](../Specs/FatTail-Labs-Alerts-Manager-Spec-v1.0.md) | Parent contract · canonical draft **§3.2** · **DL-464** · Member dialect · **AT-ALM-12…13** |
| **Analyzer Alert Builder Spec v1.0.3** (AZ-ALB) | [`Specs/FatTail-Labs-Options-Lab-Analyzer-Alert-Builder-Spec-v1.0.md`](../Specs/FatTail-Labs-Options-Lab-Analyzer-Alert-Builder-Spec-v1.0.md) | First client · cites §3.2 · **DL-463** · **AT-ALB-11…15** HIG conversion |
| Analyzer Spec v0.2 | [`Specs/FatTail-Labs-Options-Lab-Analyzer-Spec-v0_2.md`](../Specs/FatTail-Labs-Options-Lab-Analyzer-Spec-v0_2.md) | Parent surface · **§1.14 still MSC-era** (ack/dismiss/list-under) — Lima rewrites to AZ-ALB in Packet C1 |
| Member Settings Spec v1.0 §3.4 | `Specs/FatTail-Labs-Member-Settings-Spec-v1.0.md` | Delivery prefs already drafted; **no second builder** |
| Human Interface Spec v1.0 | `Specs/FatTail-Labs-Human-Interface-Spec-v1.0.md` | Dialog · 44pt · holder |
| OT-EF · DL-309 | Doctrine | Listed instruments only |
| Arch 28 | [`Architecture/28-massive-market-bus.md`](../Architecture/28-massive-market-bus.md) §4.3 | One **market** WS/tab. Alerts stream is **not** that law (ALB-A2) |

**Parents (do not re-litigate):**

| Doc / board | Role |
|-------------|------|
| **DL-464** (India fold same-day) | Two planes · canonical draft · delete unshipped v1 · unbound `local_ref` · Tango threshold-copy · adapter-swap AT · C2 sequencing |
| `p-az-viewport-2d` | Packet A: left-click pans, **alerts on right-click**. **W-G unfiled.** |
| `p-az-viewport-return` | Attach/life of `HostPnLChart`. **W-G unfiled.** India names **C2 lock handoff**. |
| Market Bus · Arch 28 | No second **market** socket. No client Massive. |
| Analyzer residual | Layout / inspector rail stay **there**; this program owns Alerts **holder + Builder + hook**, not the rest of Analyzer |

Specialists execute **only** via seeds. Coordination only through **Coach** or **Juliet**.  
Delta gates: **PASS / FAIL / BLOCKED** — **never waived**.  
Coach overrule of a specialist finding is a **DL with reasoning**, not a waived gate.

**Juliet does not invent WHAT.** Coach stated two planes (authorship in the app; identity/delivery/settings/stats in the Manager; every suite hooks with its own types). India folded ALB-B1/B2 · A1–A4 into both specs and DL-464. This plan only **sequences**.

---

## 0. Why this program exists

Coach (verbatim, compressed):

1. Analyzer alerts are **Canvas** or **Position**, applied MSC-style on the Risk graph (right-click; left-click still pans). Holder is the **left inspector** (header **+**, info + Active/Idle). **+** / canvas apply open **Alert Builder**.
2. Labs will have an **Alerts Manager + API**. Instances stay **in the app they belong to**. Settings, configuration, and stats live in the Manager (`/app/alerts` and/or Settings). **Every App Suite** registers a hook with **its own types**. Analyzer is the first client.

India review (folded, not reopened): two-plane cut is right. Blocking were **sequencing** (C2 vs viewport boards on `HostPnLChart`) and **hook contract** (`suite` + `severity` on every draft). Advisories: unbound `position_id`, Arch 28 stream scope, Tango threshold-copy, adapter-swap AT. Delete deliberately unshipped v1.

---

## 1. Mission

```text
W0   Review both specs as law (India · Echo · Tango · Hotel · Mike · Delta)
       → Coach W0-BA names Packet M and/or C1 (C2 is a later BA)
M    Alerts Manager: flag · registry · /api/me/alerts* · /app/alerts · Settings wire
C1   Analyzer Builder + adapter + inspector holder + **HIG conversion**
C2   Canvas apply on HostPnLChart + **menu HIG**      (AFTER both viewport W-G)
S    Adapter swap: session stub → Manager HTTP       (AFTER M-G; AT-ALB-9)
```

**No product code in W0.** Local prototype files already in the tree are **as-built honesty**, not Packet C2 GO.

**First smoke (after the packet that claims it):**

| After | Smoke |
|-------|--------|
| **C1-G** | Analyzer **+** opens Alert Builder (Price, value = Spot). Save goes through the hook with `suite=options_lab` and `severity=medium`. Holder card appears. No delete chrome. **Builder is kit Modal / xmark / 44pt chips; no `bg-[#2c2c2e]` / close-dot. Empty holder stays empty.** |
| **C2-G** | Right-click **blank plot** → Canvas menu → Builder. Right-click **tent** → Shown strike labels → Builder bound to that card. Left-drag still pans. **Menu rows 44pt; a11y path is +.** |
| **M-G** | User menu **Alerts** → `/app/alerts`. Settings → Alerts has **no** + Add Rule. `POST` without registered `source_system` or without `suite`/`severity` → 4xx. **Member dialect, kit List/Banner, lint clean.** |
| **S-G** | AT-ALB-1…4 still PASS with the adapter pointed at the manager. |

---

## 2. Hard gates

| Gate | Rule | Unblocks |
|------|------|----------|
| **W0-2 India** | ALM §3.2 is the **only** draft table. AZ-ALB cites it (`suite` + named `severity: medium`). Arch 28 one-socket law is **market data**; alerts stream is member-identity (ALB-A2) — **first paragraph of the report**. C2 file lock is `HostPnLChart.tsx` + `hostAlertMenu.ts`; quote both viewport boards’ **W-G status**. If either W-G is unfiled, C2 stays **BLOCKED** (do not invent “lock over”). | Echo · Tango · Hotel · Mike · W0-G |
| **W0-3 Echo** | Builder + holder grammar. Manager index is **read-only** (deep link back). Settings has **no** second builder. Canvas gesture grammar is Packet A’s (right-click alerts); Echo reviews C2 **after** C2-1, not here. **Named section: HIG / tokens-and-primitives** (kit Modal/`IconButton`/`xmark`, `radius.lg`, 44pt sweep including chips/steppers, dark-pinned dialect declared, empty-holder Coach deviation, **+** = canvas a11y, `/app/alerts` Member dialect). | W0-G · Charlie C1 |
| **W0-4 Tango** | Stamp ALB-A3: “P&L above 200 is a number, not a promise.” Empty holder: **no** helper essay. Unbound copy is calm, not broken. | W0-G |
| **W0-5 Hotel** | Held: no live-fire theater. Threshold copy ≠ payoff promise. No invented package P&L. | W0-G |
| **W0-6 Mike** | `/api/me/alerts*` is session-cookie member API. Alerts stream **must not** share `MarketSocket` or `/api/me/market/stream`. No MSC alert bus. | W0-G |
| **W0-G Delta** | Specs **v1.0.3** + this plan **v1.0.3** + board on disk; India A2 paragraph present; Echo W0-3 assigns **§8.5 H1–H9** to packets; **no new product code in the W0 fold**. Local prototype may exist — Delta **names** it (including MSC chrome debt), does not treat it as C2 GO. **AL-B1:** record canvas-apply **reachability**. `unknown` → **BLOCKED**. `reachable` is not C2 GO — Coach disposes at W0-BA. | W0-BA |
| **W0-BA Coach** | BUILD AUTHORITY on **Packet M** and/or **Packet C1**, named. **C2 is not in this stamp.** If W0-G named **reachable**, this stamp **must** choose: **keep dark until C2-G**, or **accept as-built** with a DL saying so. Silent omit is not lawful. | M1 and/or C1-1 · D0 if keep-dark |
| **C2-0 India** | Quotes `p-az-viewport-2d` **W-G PASS** **and** `p-az-viewport-return` **W-G PASS** (paths + excerpt or commit). Names the lock handoff. **Cite DL-458** (`PnLChart.tsx` → `HostPnLChart.tsx`) alongside those excerpts so the lock chain reads across the rename. | C2-BA |
| **C2-BA Coach** | Own BUILD AUTHORITY for canvas apply. Does **not** inherit W0-BA. | C2-1 |
| **M-G** | AT-ALM-1…13 evidence. Echo M3 **HIG / tokens-and-primitives** section APPROVED. Kilo chrome lint PASS. Missing Echo section or lint → **FAIL** (not a note). | Packet S (and ship when Coach asks) |
| **C1-G** | AT-ALB-1, 5, 6, 7, 10 **and AT-ALB-11…14**. Echo C1-2 HIG section APPROVED. Kilo chrome lint PASS. Prototype MSC chrome (`bg-[#2c2c2e]`, close-dot) **gone**. Missing any of these → **FAIL**. | C2 may proceed once C2-0+BA (C1-G is not a C2 substitute) |
| **C2-G** | AT-ALB-2, 3, 4, 8 **and AT-ALB-15**. Echo C2-2 HIG section APPROVED (no invented keyboard nav). Kilo chrome lint PASS (`CURVE_HIT_DISTANCE` exempt). | Canvas apply closed |
| **S-G** | **AT-ALB-9** (1…4 still PASS on manager adapter) | Program close when Coach asks MiniTwo |

---

## 3. Locked (not ODs)

| ID | Decision | Source |
|----|----------|--------|
| **FP1** | Two planes. Authorship/holder/canvas stay in the originating app. Manager is identity, delivery, settings, stats. | Coach · DL-464 |
| **FP2** | ALM §3.2 is the **canonical draft**. Every draft **always** includes `suite` and `severity`. Analyzer: `suite: options_lab`, named default **`medium`**. Builder v1 has **no** severity field. | ALB-B2 |
| **FP3** | Delete is **deliberately unshipped in v1**. Missing chrome is not a gap. | DL-464 |
| **FP4** | Packet **C2** (canvas apply) is downstream of `p-az-viewport-2d` W-G **and** `p-az-viewport-return` W-G. India names the lock. Do not open a third board on `HostPnLChart` until that handoff. | ALB-B1 |
| **FP5** | Packet **C1** (Builder, adapter, holder) and Packet **M** (Manager API/app) **may BUILD** independent of C2. | ALB-B1 · ALM §8 |
| **FP6** | Card gone → alert stays listed, **Unbound**, never Active; member edits or it expires. Hidden is still bound. | ALB-A1 |
| **FP7** | Arch 28 one-socket law = **market data**. `/api/me/alerts/stream` is lawful member-identity WS/SSE, **not** precedent for a second market socket. | ALB-A2 |
| **FP8** | Tango: member-authored threshold is process telemetry. Labs copy invariants govern what **Labs** says, not what members set. | ALB-A3 |
| **FP9** | Adapter swap is **AT-ALB-9**, not an assertion. | ALB-A4 |
| **FP10** | **Position**, never strategy. DL-309 listed instruments. No MSC import. | Coach · OT-EF |
| **FP11** | Notifications are **events**, not a second copy of the rule. Settings has **no** + Add Rule for Analyzer canvases. | ALM |
| **FP12** | Active-only-while-the-surface-is-alive until an OD lets Manager evaluate underlier from Market Bus without the Analyzer tab. Honest, not theater. | ALM §5.3 |
| **FP13** | Juliet does not invent WHAT. Coach Content Law. Delta ternary. | Doctrine |
| **FP14** | All Alerts surfaces build from HI Spec v1.0 tokens and `web/components/ui/*` primitives — no raw hex/px/`zinc` in feature chrome. Deviations (**empty holder**, **dark-pinned work-surface**) are **named in the spec**. **HIG conversion is packet work**, not a later polish pass: C1-G / M-G / C2-G **FAIL** without AT-ALB-11…15 / AT-ALM-12…13, Echo’s named HIG section, and Kilo lint. | HI Spec · AZ-ALB v1.0.3 · ALM v1.0.3 |

**Coach still disposes at W0-BA (silent if nothing said):**

| OD | Silent default |
|----|----------------|
| **OD-ALM-eval** | Underlier price evaluation stays **in-tab** (adapter) until a later OD. Do not build manager-side live fire in Packet M v1. |
| **OD-stream-transport** | SSE is acceptable for `/api/me/alerts/stream` v1. WS is allowed if it is **not** `MarketSocket`. Mike W0-6 stamps. |
| **OD-delete** | Stay unshipped. |
| **OD-C2-reach** | **No silent default.** If W0-G named reachable, W0-BA must choose keep-dark until C2-G **or** accept-as-built + DL. |

---

## 4. DAG

```text
W0-0 Coach plan stamp
  → W0-1 Lima hash (+ DL-465 plan cite)
  → W0-2 India (canonical draft · A2 · C2 lock vs viewport W-G)
       ├── W0-3 Echo
       ├── W0-4 Tango
       ├── W0-5 Hotel
       └── W0-6 Mike
  → W0-G Delta
  → W0-BA Coach   ← names Packet M and/or C1; never C2
                    if reachable: keep-dark (D0) | accept-as-built + DL

       ┌── Packet M (Manager) ──────────────────────────── M-G
W0-BA ─┤                                                      │
       └── Packet C1 (Builder + adapter + holder + HIG H1–H7 + §1.14) ── C1-G  │
                                                              │
C2-0 India lock (both viewport W-G PASS)                      │
  → C2-BA Coach                                               │
  → Packet C2 (HostPnLChart apply) ────────────── C2-G        │
                                                              ▼
                         M-G + C1-G ──► Packet S (adapter swap) ──► S-G
```

W0-3 · W0-4 · W0-5 · W0-6 may run **in parallel** after W0-2 APPROVED.  
Packet **M** and Packet **C1** may run **in parallel** after W0-BA names them.  
Packet **C2** is independent of M-G (canvas can speak the stub adapter) but **must not** start before C2-0 + C2-BA.  
Packet **S** requires **M-G PASS** (there is a manager to point at) and **C1-G PASS** (there is a client grammar to keep).

---

## 5. Packets

| Seed | Agent | Fire | Code? |
|------|-------|------|-------|
| `W0-0-coach-plan-stamp.md` | Coach | First | No |
| `W0-1-lima-hash.md` | Lima | After W0-0 | No (DL-465 cite) |
| `W0-2-india-parents.md` | India | After W0-1 | No |
| `W0-3-echo.md` | Echo | After W0-2 | No |
| `W0-4-tango.md` | Tango | After W0-2 | No |
| `W0-5-hotel.md` | Hotel | After W0-2 | No |
| `W0-6-mike.md` | Mike | After W0-2 | No |
| `W0-G-delta.md` | Delta | After W0-2…6 | No |
| `W0-BA-coach-build-authority.md` | Coach | After W0-G | No |
| `D0-1-charlie-dark-gate.md` | Charlie | **Only if** W0-BA chose keep-dark | Yes · flag or unhook menu |
| `M1-1-alpha-api.md` | Alpha | After W0-BA names **M** | **Yes · server** |
| `M2-1-charlie-app.md` | Charlie | After M1 (or ∥ settings chrome if contract frozen) | **Yes · `/app/alerts`** |
| `M3-1-echo-review.md` | Echo | After M2 | Review |
| `M4-1-kilo-at.md` | Kilo | After M1+M2 | Tests |
| `M5-1-lima-docs.md` | Lima | After M1 (∥ M4) | Spec honesty |
| `MG-delta.md` | Delta | After M3+M4+M5 | No |
| `C1-1-charlie-builder.md` | Charlie | After W0-BA names **C1** | **Yes · new files + holder** |
| `C1-2-echo-review.md` | Echo | After C1-1 | Review |
| `C1-3-kilo-at.md` | Kilo | After C1-1 | Tests |
| `C1-4-lima-analyzer-spec.md` | Lima | After C1-1 (∥ C1-3) | Analyzer §1.14 rewrite |
| `C1-G-delta.md` | Delta | After C1-2+C1-3+C1-4 | No |
| `C2-0-india-lock.md` | India | When both viewport W-G exist | No |
| `C2-BA-coach.md` | Coach | After C2-0 | No |
| `C2-1-charlie-canvas.md` | Charlie | After C2-BA | **Yes · HostPnLChart + hostAlertMenu** |
| `C2-2-echo-review.md` | Echo | After C2-1 | Review |
| `C2-3-kilo-at.md` | Kilo | After C2-1 | Tests |
| `C2-G-delta.md` | Delta | After C2-2+C2-3 | No |
| `S-1-charlie-adapter-swap.md` | Charlie | After M-G **and** C1-G | Adapter only |
| `S-2-kilo-at-alb-9.md` | Kilo | After S-1 | Tests |
| `S-G-delta.md` | Delta | After S-2 | No |

---

## 6. As-built honesty

### 6.1 Keep (already landed; do not rebuild)

| Area | Status |
|------|--------|
| Settings → Alerts pane (delivery / severity / quiet hours / classes) | Landed · delivery **not live** (honest banner when Manager GO’s) |
| Member Settings `AlertSettings` types | Landed |
| Analyzer session alerts model (`createPriceAlert`, `alertConditionMet`) | Landed stub · **severity: medium** already on the book type |
| Inspector Alerts holder + header **+** (local) | Prototype in tree — **HIG debt** (44pt / kit **+** still C1) |
| `AlertBuilderDialog.tsx` | Prototype in tree — **HIG debt** (MSC `#2c2c2e`, close-dot, hex chips, ad-hoc buttons). **C1 must convert.** |
| `analyzerAlertsAdapter.ts` | Prototype · **now emits `suite` + `severity`** (ALB-B2 fold) |
| `hostAlertMenu.ts` + HostPnLChart context menu | Prototype in tree — **C2 owns this; do not “finish” it on the viewport boards**. **Governance ≠ reachability** (AL-B1): W0-G names whether a member in the **built app** can right-click-apply today. |
| Specs v1.0.3 + DL-463/464 | Landed this session |

### 6.2 Build (this program)

| Gap | Packet |
|-----|--------|
| `LABS_ALERTS_MANAGER` flag · fail loud · registry of `source_system` / `suite` | **M** |
| `/api/me/alerts*` + stream + events + stats | **M** |
| `/app/alerts` · user-menu item · Settings: remove any second builder; honest delivery banner · **Member dialect + AT-ALM-12…13** | **M** |
| Builder/holder/adapter brought to AZ-ALB law (unbound, no delete, hook names) | **C1** |
| **HIG conversion of Builder + holder** (kit Modal/`xmark`/44pt; kill MSC hex/close-dot; AT-ALB-11…14) | **C1** (required, not polish) |
| **HIG conversion of canvas menu** (44pt rows, token chrome, **+** a11y; AT-ALB-15) | **C2** |
| Analyzer Spec §1.14 rewrite to AZ-ALB (drop ack/dismiss/list-under as product law) | **C1** Lima |
| Canvas apply reconciled on `HostPnLChart` after viewport lock | **C2** |
| Adapter HTTP swap + AT-ALB-9 | **S** |

### 6.3 Local prototype rule

Charlie **may keep the file and the feature grammar** in C1. Charlie **must not keep MSC chrome**. C1 is “make law true,” including **HIG conversion**. Shipping the current `AlertBuilderDialog` (`bg-[#2c2c2e]`, `h-3 w-3` close-dot, raw `COLORS` hex as chip UI, ad-hoc Cancel/Save) as C1-G is a **FAIL**.

**C2 files stay frozen for this board** until C2-BA. Viewport packets must not take further alert-menu scope. India C2-0 names the handoff; until then, extra `HostPnLChart` work is a doctrine collision (same shape as VP-B1 / ALB-B1). After C2-BA, canvas **menu chrome** is converted under AT-ALB-15 (grammar stays MSC; paint is kit).

**AL-B1 reachability (not the same as frozen):** W0-G Delta records whether canvas apply is **reachable** in the built member app (right-click menu live vs dead / flagged off). Prove from: `HostPnLChart` `contextmenu` listener; `OpfRiskAnalyzer` `onCanvasAlert` / `onPositionAlert`; any off-switch flag; which host git_sha is running. If **reachable**, canvas apply has effectively shipped without a gate — invariant #5 and draft→publish both care, and viewport harnesses are probing a chart with an ungated menu. Coach disposes at W0-BA: **keep dark until C2-G**, or **accept as-built** with a DL. Either is lawful once it is on the record.

---

## 7. File locks

| Packet | May touch | Must not touch |
|--------|-----------|----------------|
| **M** | `server/routes/alerts.py` (new) · migrations · `web/app/app/alerts/` (new) · `web/lib/alerts/` registry · Settings Alerts pane (wire, **remove** second builder if present) · `SiteHeader` user menu | `HostPnLChart.tsx` · `OpfRiskAnalyzer.tsx` · Market Bus · Massive |
| **C1** | `AlertBuilderDialog.tsx` · `analyzerAlertsAdapter.ts` · inspector Alerts holder · `analyzerBook.ts` (unbound / no delete) · Analyzer Spec §1.14 | `HostPnLChart.tsx` · `hostAlertMenu.ts` · Manager HTTP (stub only) |
| **C2** | `HostPnLChart.tsx` · `hostAlertMenu.ts` (+ tests) | Viewport Autofit / wheel / attach policy (those boards own them) · `OpfRiskAnalyzer` except wiring the menu callbacks already specified |
| **S** | `analyzerAlertsAdapter.ts` only (plus tests) | Builder/canvas member grammar |

As-built chart path is **`web/components/options-lab/risk-graph/HostPnLChart.tsx`** (legacy `PnLChart.tsx` removed · DL-458). Seeds say **HostPnLChart**, not the old name.

---

## 8. Implementation notes (specialists — not a second WHAT)

### 8.1 Packet M (Alpha)

- Flag `LABS_ALERTS_MANAGER`. Missing when adapter mode is `manager` = **abort**. `0` = adapters stay on stubs.
- Registry table (or frozen module) of `(suite, source_system, types[])`. Unregistered `source_system` → 4xx (**AT-ALM-3**). Missing `suite`/`severity` → 4xx (**AT-ALM-9**).
- Record shape ALM §5.5 including `unbound`.
- `DELETE` may exist in the route table **unexposed in UI** (FP3). Do not build Manager-index delete chrome.
- Stream: member-identity SSE or WS. **Not** `MarketSocket`. **Not** `/api/me/market/stream`.
- Evaluation v1: persist records; `GET …/state` may be “unknown / idle” unless the originating surface pushed a sample. Do **not** subscribe Market Bus inside the manager for live fire in v1 (OD-ALM-eval silent default).
- In-app delivery reuses `member_notifications` with `kind` prefixed `alert:` when delivery is flipped live; until then, Settings banner stays honest.

### 8.2 Packet C1 (Charlie)

- Adapter constants: `ALERTS_SOURCE_SYSTEM = analyzer_risk_graph`, `ALERTS_SUITE = options_lab`, `ALERTS_SEVERITY_DEFAULT = medium`.
- Builder: Price / Position / Greeks live; Algo / Break-Even / Trailing / 0DTE visible, **Save off**.
- **HIG conversion is in this packet** — see §8.5. Not a follow-on.
- Holder: ~3–4 cards, scroll, **+** tint disc, info + Active/Idle, **Unbound** when §2.5, **no** helper copy, **no** delete. Empty holder is a **named Coach deviation** from `EmptyState`.
- Session stub until Packet S. Honesty: do not claim OS/SMS delivery.
- **Position**, never strategy. Strike labels `6700C/6720C/6740C`.

### 8.3 Packet C2 (Charlie)

- `resolveAlertMenuKind`: blank plot vs tent ≤ 8px (`CURVE_HIT_DISTANCE`).
- Left-click **pans**. Context menu **right-click** only.
- Canvas: three price conditions → open Builder seeded. Position: Shown cards, strike labels, skip picker if one Shown.
- Vertical line for underlier-price alerts; Idle dashed, Active solid. No fake line for P&L/greeks.
- **HIG:** menu rows 44pt; token chrome; **do not** add keyboard nav for the menu (**+** is the path). AT-ALB-15.
- Do not reopen Autofit, wheel, attach, or handle proximity.

### 8.4 Packet S (Charlie)

- Point `upsertAlert` / `listAlerts` / `subscribeAlerts` at `/api/me/alerts*`.
- Same Builder and canvas. Kilo re-runs AT-ALB-1…4 (**AT-ALB-9**).

### 8.5 HIG conversion checklist (Charlie — packet-scoped; Delta fail-closed)

Prototype debt that **must leave** the tree in the named packet. Echo reviews it; Kilo lints it; Delta **FAIL**s the packet gate if any row is open.

| # | Debt (as-built) | Law | Packet | Done when |
|---|-----------------|-----|--------|-----------|
| **H1** | `AlertBuilderDialog` `bg-[#2c2c2e]`, white/15 borders, ad-hoc fields | Dark-pinned **HI tokens** + kit `Modal` | **C1** | No `#2c2c2e` / raw zinc in the dialog. `radius.lg` · `elevation.3`. |
| **H2** | Close control is `h-3 w-3 rounded-full bg-[#ff5f57]` (traffic-light dot) | Kit `IconButton` + `xmark`, name **Close** | **C1** | Dot gone. 44×44 hit target. |
| **H3** | Cancel/Save are raw `<button>` | Kit `Button` plain / primary | **C1** | Kit only. |
| **H4** | Type is ad-hoc chips | Kit `SegmentedControl` (4) | **C1** | 2–5 enum. 44pt segments. |
| **H5** | Tag chips / ±1 steppers / Position sub-tabs undersized; hex `COLORS` as chrome | 44pt; chip **UI** from tokens; stored `color` may stay data | **C1** | AT-ALB-12. Lint allows payload hex, not chip className hex. |
| **H6** | Holder **+** / cards may be <44pt | 44pt including **+** | **C1** | AT-ALB-12. |
| **H7** | Temptation to add EmptyState copy | Named Coach deviation | **C1** | AT-ALB-13. Echo RETURN if essay appears. |
| **H8** | `/app/alerts` will drift dense | Member dialect, kit `List`/`Banner` | **M2** | AT-ALM-12. |
| **H9** | Canvas menu raw paint / tiny rows / invented keyboard nav | 44pt rows; tokens; **+** is a11y | **C2** | AT-ALB-15. |

**Lint command (Kilo, each packet):** ripgrep feature files for `bg-zinc-`, `text-zinc-`, `bg-[#`, `text-[#`, `from-[#` and for close-dot classes `h-3 w-3`. **Exempt:** `CURVE_HIT_DISTANCE`, stored alert `color` JSON, plot geometry. **Fail** the packet if chrome hits remain.

**Echo named section** must tick H1–H7 (C1-2), H8 (M3), H9 (C2-2). A review that only says “HIG looks fine” is **RETURNED**.

---

## 9. Acceptance map

| AT | Packet |
|----|--------|
| AT-ALB-1, 5, 6, 7, 10 | **C1** |
| **AT-ALB-11, 12, 13, 14** | **C1** (HIG — C1-G fail-closed) |
| AT-ALB-2, 3, 4, 8 | **C2** |
| **AT-ALB-15** | **C2** (HIG — C2-G fail-closed) |
| AT-ALB-9 | **S** |
| AT-ALM-1…11 | **M** |
| **AT-ALM-12, 13** | **M** (HIG — M-G fail-closed) |

---

## 10. Non-goals (NX)

| ID | Out |
|----|-----|
| **NX1** | SMS, email digest going live |
| **NX2** | Delete chrome (holder or Manager index) |
| **NX3** | Practice / Strategy Lab / Journey / … type catalogs |
| **NX4** | Heatmap / VP / Surface alerts (types empty until those surface specs) |
| **NX5** | Second **market** WebSocket or per-widget Massive |
| **NX6** | MSC Alert Center / MSC Redis / MSC strategy ids |
| **NX7** | Manager-side live underlier evaluation (OD-ALM-eval) |
| **NX8** | MiniTwo / production until Coach asks |
| **NX9** | Packet C2 before both viewport W-G + India C2-0 + C2-BA |
| **NX10** | Product code in W0 |
| **NX11** | Settings + Add Rule (second builder) |
| **NX12** | Profit claims in titles, stats, or notifications |
| **NX13** | Invented strikes / silent false package prices (DL-309) |
| **NX14** | Admin broadcast “alerts” |

---

## 11. Roster / seating

| Callsign | Role |
|----------|------|
| **Coach** | W0 stamp, W0-BA (M and/or C1), C2-BA, ship/MiniTwo |
| **Juliet** | This plan, board, seeds, C2 vs viewport order |
| **India** | Canonical draft · Arch 28 A2 · C2 lock handoff · registry |
| **Alpha** | Packet M API / schema / flag |
| **Charlie** | C1 · C2 · M2 app · S adapter |
| **Echo** | W0 grammar · M3 · C1-2 · C2-2 — each with named **HIG / tokens-and-primitives** section (FP14) |
| **Tango** | W0-4 A3 · empty holder · Unbound |
| **Hotel** | W0-5 Held / threshold honesty |
| **Mike** | W0-6 auth · stream ≠ market socket |
| **Kilo** | M4 · C1-3 · C2-3 · S-2 · **HIG lint + AT-ALB-11…15 / AT-ALM-12…13** |
| **Lima** | W0-1 hash · M5 · Analyzer §1.14 rewrite · DLs |
| **Delta** | W0-G · M-G · C1-G · C2-G · S-G |
| **Foxtrot** | **Not seated until Coach asks MiniTwo** |

---

## 12. Review verdict shape (W0-2…6)

Per `spec-create-review-workflow.md`:

- Up front if Coach content changed  
- Bench delta  
- Coach content intact?  
- Blocks (invariant / law / system only)  
- Opinions labeled  
- Flagged ideas table (or none)  
- Build disposition: APPROVED \| RETURNED  

India **must** lead with ALB-A2 (Arch 28 scope) and C2 lock vs the two viewport W-G artifacts.  
Echo **must** include a named section **HIG / tokens-and-primitives** (FP14) in W0-3, M3, C1-2, and C2-2. Delta cites that section; do not assume HIG. Echo does **not** dispose canvas Autofit (wrong board). C2-2 does **not** invent keyboard nav for the context menu (**+** is the a11y path).  
Hotel blocks only if a wrong Active/P&L story would make a member **worse**.  
Tango RETURN helper-essay / profit-claim copy; do not delete Coach holder laws.

---

## 13. Documentation parity (Lima)

| When | What |
|------|------|
| W0-1 | Hash both specs + this plan; **DL-465** “Alerts bench plan landed / board `p-alerts`”; quote **AT-ALB-1…15** and **AT-ALM-1…13** from disk |
| C1 | Analyzer Spec §1.14 = AZ-ALB (holder left inspector, Builder, hook, no ack/dismiss as law) |
| M | ALM as-built notes; Settings spec: second builder removed |
| C2 | Analyzer §1.14.3 canvas apply as-built |
| S | Adapter path in AZ-ALB §2.3 |
| Ship | User guide + help_reference Alerts section — **only if Coach asks**; not a silent MiniTwo |

---

## 14. First packet to fire

**W0-0 Coach plan stamp.** Juliet does not fire Lima until that file exists.

If Coach stamps this plan **and** names bypassed W0 packets in a DL, that is the lawful alternate (same shape as viewport DL-457) — not a silent waive.

---

## 15. Changelog

| Ver | Date | Notes |
|-----|------|--------|
| **v1.0.3** | 2026-08-20 | HIG conversion is packet deliverable: §8.5 checklist H1–H9; AT-ALB-11…15 / AT-ALM-12…13; C1-G/M-G/C2-G fail-closed on Echo HIG section + Kilo lint; prototype MSC chrome named as C1 debt. |
| **v1.0.2** | 2026-08-20 | HIG: FP14 tokens/primitives; Echo named HIG section on W0-3/M3/C1-2/C2-2; AZ-ALB v1.0.2 · ALM v1.0.2 folds. |
| **v1.0.1** | 2026-08-20 | Review AL-B1/A1/A2: W0-G records canvas-apply reachability; W0-BA disposes keep-dark \| accept-as-built+DL; Lima W0-1 confirms AT-ALM-1…11 on disk; C2-0 cites DL-458 rename. |
| **v1.0** | 2026-08-20 | Juliet: two-plane program; Packet M ∥ C1; C2 after viewport W-G; S after M-G; India-folded ALB-B1/B2 · A1–A4 as FPs. |
