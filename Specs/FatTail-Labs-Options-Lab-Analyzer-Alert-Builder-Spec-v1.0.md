# FatTail Labs — Options Lab Analyzer Alert Builder Spec v1.0

**Status:** DRAFT — Coach 2026-08-20 (Analyzer canvas + builder). **v1.0.3** HIG ATs (conversion is C1/C2 law, not polish).  
**Type:** Product Spec — Analyzer **Alert Builder** and **canvas apply**.  
**Short name:** AZ-ALB  
**Route:** `/app/options-lab/analyzer`  
**Heritage:** MSC Risk Graph `AlertDesigner` + `PnLChart` context menu — Labs-typed (**position**, never strategy).  
**Does not:** implement the Labs-wide **Alerts Manager**. That plane is
[`FatTail-Labs-Alerts-Manager-Spec-v1.0.md`](./FatTail-Labs-Alerts-Manager-Spec-v1.0.md).
This document **hooks** Analyzer into that manager as the Options Lab client.

**Parents:** Analyzer Spec v0.2 · OPF Truth / Elegant Failure (DL-309) · Human Interface Spec v1.0 · Member Settings Spec v1.0 §3.4 (Alert Delivery prefs — destinations not live yet).

---

## 0. Coach intent (do not drop)

1. Alerts are **two kinds** on the Risk graph: **Canvas** and **Position**.  
2. How they are **applied on the canvas** and how **positions are selectable** follow **MSC**.  
3. The **only** Labs difference in the holder UI: Alerts live in the **left inspector** as a scrollable card list (header **+**, ~3–4 cards tall). Each card shows **info about the alert** and an **Active / Idle** indicator — not Ack/Dismiss chrome.  
4. **+** (and canvas apply) opens the **Alert Builder** dialog.  
5. **Heads-up:** Labs will have an **Alerts Manager and API**. Analyzer features must **interface** with that main manager — not become a second closed alert center.

---

## 1. Two planes (do not collapse)

| Plane | Owner | This spec |
|-------|--------|-----------|
| **Alerts Manager + API** | [`FatTail-Labs-Alerts-Manager-Spec-v1.0.md`](./FatTail-Labs-Alerts-Manager-Spec-v1.0.md) · **DL-464** | SoR for persistence, evaluation, delivery, identity, quiet hours, digest, **stats**. Every **App Suite** hooks in with **its own types**. |
| **Analyzer apply + Builder** | This spec | Member **create / edit / bind** UX on the Risk graph and the Alert Builder dialog. **Produces and consumes** manager records via a **stable hook**. |

Analyzer **must not** be the Labs-wide SoR. Session-local storage (today’s `sessionStorage` alerts) is a **temporary adapter** behind the hook until the manager ships. When the manager spec is GO, the adapter swaps; canvas + Builder **do not** change their member grammar. That swap is **AT-ALB-9** (same AT-ALB-1…4 with the adapter pointed at the manager) — verified, not asserted.

---

## 2. Hook to the Labs-wide Alerts Manager

### 2.1 Principle

Analyzer is a **work-surface client** of the Alerts Manager:

- **Create / patch / list** go through the hook. **Delete is unshipped in v1** (hook name exists; no holder/Manager chrome).  
- **Evaluate / Active** is reported by the manager (or a client evaluator the manager owns). Analyzer **displays** Active/Idle; it does not invent a second evaluation bus.  
- **Delivery** (OS, process surface, digest) is the manager + Member Settings Alerts pane — Analyzer does not send SMS/email itself.  
- **Identity / membership** of an alert is the manager’s `alert_id`. Analyzer may keep a session cache of records it cares about (this Analyzer tab, this symbol).

### 2.2 Hook surface (normative names)

**Canonical draft is Alerts Manager Spec §3.2** — one wire for every suite. This table is Analyzer’s **filling** of that contract, not a second dialect.

A single module (client today, HTTP later) exposes:

| Call | Meaning |
|------|---------|
| `listAlerts({ surface, symbol })` | Alerts this Analyzer should show (holder + canvas lines). |
| `upsertAlert(draft)` | Create or edit from Builder / canvas apply. Returns manager record. |
| `setEnabled(alertId, enabled)` | Optional later — not in the holder v1 (info + Active only). |
| `removeAlert(alertId)` | **Unshipped in v1** (deliberate — Coach did not ask delete). Holder has no delete chrome. Manager `DELETE` stays specified for when Coach adds it. |
| `subscribeAlerts(onChange)` | Live updates (manager SSE / poll). |

`draft` always includes (ALM §3.2 names on the wire; Analyzer-local aliases noted):

| Field | Required | Notes |
|-------|----------|--------|
| `source_system` | yes | `'analyzer_risk_graph'` |
| `suite` | yes | `'options_lab'` — adapter constant `ALERTS_SUITE`. Always. |
| `domain` | yes | `'work_surface'` |
| `alert_class` | yes | `'threshold'` \| `'algo'` \| `'prompt'` (system class is manager-only) |
| `kind` | yes | `'canvas'` \| `'position'` — Analyzer apply kind. **Wire name:** `surface_type`. |
| `symbol` | yes | Universe product key |
| `trigger` | yes | Typed payload (price / P&L / greek / placeholder algo) |
| `title` | yes | Member line — **no profit claims** (see §7 Tango) |
| `color` | yes | Tag color for canvas line + holder |
| `behavior` | yes | `once_only` \| `repeating` \| `persistent` |
| `severity` | yes | Named default **`medium`** (ALM §5.5). **Builder v1 has no severity field** — adapter stamps the default. Dialog field optional/deferred. |
| `position_id` | if kind=position | Analyzer book card id (not MSC strategy id). **Wire name:** `local_ref.position_id`. |
| `expires_at` | no | Builder expiration; omit if “no expiration” |
| `goal` | no | Member note |

Adapter maps `kind` → `surface_type` and `position_id` → `local_ref.position_id` on HTTP upsert. Do not fork Analyzer-only required fields at the API root.

### 2.3 Adapter until manager GO

| Today | Law |
|-------|-----|
| Implementation | `web/lib/alerts/analyzerAlertsAdapter.ts` (name stable) wrapping current session list |
| Persistence | Temporary; **not** the future SoR |
| Evaluation | Client `alertConditionMet` for Active/Idle until manager evaluation exists |
| Honesty | Holder and canvas must not claim Labs-wide delivery until Manager + Settings delivery are live |

When Manager GO’s: adapter talks HTTP/API; same Builder and canvas.

### 2.4 What Analyzer must not do

- Own a second delivery pipeline.  
- Use MSC alert IDs or MSC Redis.  
- Block Builder/canvas on Manager not existing — adapter fail-open to session stub.  
- Invent package prices or listed strikes (DL-309).

### 2.5 Unbound `position_id` (ALB-A1)

Manager records **outlive** Analyzer sessions. Book cards are deleted, hidden, or never restored.

| State | Law |
|-------|-----|
| **Bound** | `kind=position` and `local_ref.position_id` resolves to a card **in the current book** (Shown or Hidden). Hidden is still bound — Hide is not an orphan. |
| **Unbound** | `kind=position` and that id does **not** resolve (deleted, or book not restored). |

**Rule:** card gone → alert **stays listed** (holder + Manager index), marked **Unbound**, **never Active**, never fires. Member **edits** (rebind to a live card) or it **expires**. Canvas does not draw a line for an unbound record. Do not auto-delete. Session-stub era never lived long enough to orphan; write this **before** the adapter swap.

Holder card: same info row + **Unbound** in place of Active/Idle (not a third delivery state — it is not armed-evaluable).

### 2.6 BUILD sequencing (ALB-B1)

Canvas apply lives on `HostPnLChart` context menu (as-built path; legacy `PnLChart.tsx` removed · DL-458). That file is already in flight on **two** viewport boards. A third board must not fire canvas-apply until those land.

| Packet | Files | Lock |
|--------|-------|------|
| **Builder + adapter** | `AlertBuilderDialog.tsx`, `analyzerAlertsAdapter.ts` | **May BUILD now** — new files; no viewport collision. |
| **Holder** | Inspector Alerts chrome | Independent of canvas apply. |
| **Canvas apply** | `HostPnLChart.tsx` (+ host alert menu) | **Downstream of** `p-az-viewport-2d` **W-G** **and** `p-az-viewport-return` **W-G**. **India names the lock handoff.** Gesture grammar (left-click pans, alerts on right-click) is Packet A’s deliverable. |

Split the packet if Coach wants dialog first. Do not open canvas-apply as a blocked packet on `HostPnLChart` until both W-G reports exist.

---

## 3. Two apply kinds (MSC grammar, Labs-typed)

Left-click **pans**. Alerts are **right-click** (or **+** → Builder). Never steal handle drag.

### 3.1 Canvas alert

**Apply on canvas:** right-click **empty plot** (not within 8px of a tent, not in gutters).

**Menu (MSC):** header `Price alert at {price}` (underlier, no `$` required). Items:

1. Alert when price **rises above**  
2. Alert when price **falls below**  
3. Alert when price **touches**

**Then:** choosing an item **opens Alert Builder**, Type = **Price**, Value = click price, Condition = that item. Save goes through the hook (`kind: canvas`).

**Preview:** dashed vertical at click X while the menu is open (MSC).

### 3.2 Position alert

**Apply on canvas:** right-click **on the tent** (≤ **8px** from expiry or T+0 curve — MSC `CURVE_HIT_DISTANCE`).

**How positions are selectable (MSC):** menu header `Position alert`. List **Shown** cards only, label = listed strikes with C/P suffix, e.g. `6700C/6720C/6740C`, sorted left-to-right by leftmost strike. Click a row.

**Then:** **opens Alert Builder**, Type = **Position**, Position dropdown bound to that card, Value seeded from click underlier price (member may change to P&L / greeks in the dialog). Save: `kind: position`, `position_id` set.

Zero Shown cards: treat as Canvas (no empty Position menu).

One Shown card: may skip the picker and open Builder bound to that card.

### 3.3 Inspector **+**

Round **+** in the Alerts header (stands out: tint fill). **Opens Alert Builder** with Type = Price, Value = current Spot, no canvas click. Member can switch Type to Position/Greeks/Algo in the dialog.

**Accessibility:** a right-click canvas menu has no keyboard equivalent by nature. The header **+** **is** the accessible route to everything the canvas menu can author (Price, then Type → Position / Greeks / Algo in the Builder). C2 must not invent a keyboard nav layer for the context menu. Pointer users still apply on-canvas; keyboard / AT users use **+**.

### 3.4 Draw on canvas (after save)

| Record | Draw |
|--------|------|
| Canvas **price** (and Position alerts whose trigger is still an underlier price) | Vertical line at `target` on the plot. **Idle** = dashed; **Active** = solid + glow (MSC). Color = tag. |
| Position **P&L / profit** | No fake underlier line unless the member’s trigger is price. Active/Idle still in the holder. |
| Greeks / Algo placeholders | No invented geometry. |

Pan/zoom moves lines with the view.

---

## 4. Alert Builder dialog (MSC **feature range**, Labs chrome)

**Work-surface dialect (declared):** Analyzer (Risk graph, inspector, Builder) is a **dark-pinned work surface**. It consumes the **dark side of HI Spec v1.0 tokens**, not a hardcoded MSC theme and not raw hex/`zinc-*`/magic px in feature code. This is a named dialect decision (same standing as Member vs Operator density): light+dark tokens still exist in the kit; this surface **pins appearance to dark**. Do not smuggle MSC `#0a0a0e` / `12px` into the dialog.

**Chrome (HI Spec v1.0 primitives):** `Modal` (scrim, focus trap, Esc cancels non-critical); card width ~460px as a **layout note**, not a token; corners **`radius.lg`**; elevation **`elevation.3`**; **draggable** header; close = kit **`IconButton`** + `xmark` (accessible name **Close**) — **not** a “close dot” and **not** a new kit affordance; title; body scroll; footer **Cancel** (`Button` plain) · **Save** (`Button` filled / primary). Sentence case. Esc / scrim = Cancel without save.

**44pt:** every interactive control in Builder and holder is ≥ **44×44 pt** even when the visual glyph is smaller — Type segments, tag color chips, ±1 value steppers, Position sub-tabs, holder cards as tap targets, and the round **+**.

**Title:**

| Type | Title |
|------|--------|
| Price | `{SYMBOL} - Price Alert` |
| Position | `{SYMBOL} - {6700C/6720C/6740C}` |
| Greeks | `{SYMBOL} - Greeks Alert (Δ Γ Θ)` |
| Algo | `{SYMBOL} - Algo Alert` |

### 4.1 Type (segmented)

Kit `SegmentedControl` (4 segments, inside the 2–5 enum): **Price** · **Position** · **Greeks** · **Algo**

### 4.2 Price (Canvas kind default)

| Field | Law |
|-------|-----|
| Condition | Cross Above · Cross Below · Touches |
| Value | Underlier; stepper ±1; seed from canvas click or Spot |
| Trigger | Once Only · Repeating · Persistent |
| Expiration | datetime; optional none |
| Tags | Color chips (watch, urgent, warning, target, setup, caution, neutral, other) |

Save → hook `kind: canvas` (unless member switched Type to Position).

### 4.3 Position

**Position** dropdown: Shown book cards, same strike labels as the canvas menu.

**Sub-tabs (MSC):**

| Tab | Live in MSC | Labs v1 |
|-----|-------------|---------|
| P&L | yes | Live — condition Profit Above / Loss Below; value dollars at spot |
| Profit Target | yes | Live — same evaluator family as P&L dollars |
| Greeks | yes | Live — same as Type → Greeks (bound to this position) |
| Break-Even | placeholder | **Coming soon** — no save |
| Trailing | placeholder | **Coming soon** — no save |
| 0DTE | placeholder | **Coming soon** — no save |

Readout **Now:** live position P&L (signed dollars). Honest Held label when session is Held.

Save → hook `kind: position`, `position_id`, trigger P&L or greek.

### 4.4 Greeks

Reachable via Type → Greeks **or** Position → Greeks. Pick **Delta / Gamma / Theta**; seed threshold from live greek; Greater Than / Less Than; Trigger same as Price.

Save → hook `alert_class: threshold`, trigger greek. **Do not** invent greeks — OPF/book only; WAITING if unmeasured.

### 4.5 Algo (placeholder)

Subtypes: 0DTE Entry · Profit Mgmt · Prompt. Criteria **Coming soon**. **Save disabled.** Manager may later accept `alert_class: algo | prompt`.

### 4.6 Shared footer fields

Expiration + Tags as §4.2. Goal/note optional (no profit claims).

**Severity** is **not** a Builder v1 field. Adapter stamps `severity: 'medium'`. A later OD may add the picker; until then Manager delivery uses the named default (ALM severity minimums / quiet hours still key on the field).

**Save** calls `upsertAlert`. **Cancel** discards.

---

## 5. Holder (left inspector) — Labs difference

Not MSC’s left-rail Ack list.

| Law | |
|-----|--|
| Header | **Alerts** + round **+** (tint, stands off the header) |
| Body | Scrollable holder, default height **~3–4 cards** |
| Empty | **No instructional copy** — empty holder. **Coach deviation from HI `EmptyState`** (kit: icon + title + one action). Named so `p-hig` lint does not “fix” it. Tango: an empty alerts holder needing no essay is calm density. |
| Card | Title (info) · Canvas vs Position · **Active** / **Idle** only. **Unbound** replaces Active/Idle when §2.5 applies. |
| Active | Manager (or adapter evaluator) says the condition is **currently true** on the live mark / live P&L / live greek. Unbound is never Active. |
| Idle | Armed, condition not true (or Held: no “live fire” theater — still Idle unless Coach says Held-evaluate) |

Clicking a card **opens Builder** in edit mode (hook `upsertAlert` with id). **Delete is deliberately unshipped in v1** (Coach did not ask). Do not treat missing delete chrome as a spec gap.

---

## 6. Evaluation (until Manager)

Adapter may use:

| Kind / type | Active when |
|-------------|-------------|
| Price (canvas or position-bound price) | Spot vs target: ≥ above, ≤ below, \|spot−target\| ≤ tick (0.5 residual) |
| Position P&L / profit | Position P&L at spot vs target |
| Greeks | Live greek vs target |
| Placeholders | Never Active |

Raw underlier mark for price (not smoothed display). Held: do not claim live fire.

Once Manager owns evaluation, Analyzer **subscribes**; it does not keep a second bus.

---

## 7. Language and invariants

- **HIG.** HI Spec v1.0 tokens and `web/components/ui/*` primitives. No raw hex/px/`zinc` in feature code. Named deviations: dark-pinned work-surface (§4); empty holder (§5); **+** as canvas a11y path (§3.3).  
- **Position**, never strategy.  
- **Tango (ALB-A3):** “P&L above 200 is a number, not a promise.” A **member-authored** threshold is their own process telemetry. Invariant #8 (and ALM #5) govern what **Labs** says — titles, notifications, stats, Bob’s copy — not what members set in the Builder. Stamp this once; do not relitigate per suite type catalog.  
- Listed instruments only (DL-309).  
- One **market** WebSocket / no client Massive (Arch 28). Alerts Manager stream is a **member-identity** channel, not a second market socket (ALM §5.4 · ALB-A2).  
- No MSC code import.

---

## 8. Out of scope (this spec)

- Labs-wide Alerts Manager schema, auth, SSE, multi-device.  
- Member Settings delivery going live (already specified separately).  
- SMS, email digest, Journal inject.  
- Alert lines on Heatmap / VP / Surface (optional later).  
- Copying MSC Alert Center / Settings → Alerts.

---

## 9. Acceptance (Analyzer surface)

| AT | Criterion |
|----|-----------|
| **AT-ALB-1** | **+** opens Alert Builder (Price, value = Spot) |
| **AT-ALB-2** | Right-click blank plot → Canvas menu → item opens Builder with that price + condition |
| **AT-ALB-3** | Right-click tent → Position list (Shown, strike labels) → Builder bound to that position |
| **AT-ALB-4** | Save Price → holder card + vertical line; Active/Idle follows spot |
| **AT-ALB-5** | Save goes through the **hook** (`source_system: analyzer_risk_graph`) — not a third store |
| **AT-ALB-6** | Algo / Break-Even / Trailing / 0DTE: visible, Save off |
| **AT-ALB-7** | Holder: no helper essay; + visible; height ~3–4 cards; scroll |
| **AT-ALB-8** | Left-drag pan unaffected by right-click alerts |
| **AT-ALB-9** | **Adapter swap (ALB-A4).** When Manager GO’s: AT-ALB-1…4 still PASS with the adapter pointed at the manager instead of the session stub. Canvas + Builder member grammar unchanged. |
| **AT-ALB-10** | Position alert whose card is gone: listed, **Unbound**, never Active, no canvas line. Hidden card stays bound. |
| **AT-ALB-11** | Builder is kit `Modal` + `SegmentedControl` + `IconButton` `xmark` (accessible name Close) + `Button` Cancel/Save. **No** close-dot. Corners `radius.lg`. Dark-pinned **tokens**, not `bg-[#…]` / MSC hex chrome. |
| **AT-ALB-12** | Every interactive control in Builder and holder is ≥44×44 pt: Type segments, tag chips, ±1 steppers, Position sub-tabs, holder cards, round **+**. |
| **AT-ALB-13** | Empty holder has **no** copy and **no** kit `EmptyState` (named Coach deviation). |
| **AT-ALB-14** | Kilo lint: no raw hex / magic px / `zinc-*` in Builder/holder **chrome**. Alert `color` payload (data for the canvas line) may remain a stored value; chip **UI** still uses tokens. |
| **AT-ALB-15** | Canvas context-menu rows ≥44pt. No keyboard nav invented for the menu. Header **+** remains the a11y path (§3.3). Menu chrome uses tokens. `CURVE_HIT_DISTANCE = 8` is hit geometry, not a chrome token. |

---

## 10. Files (when BUILD)

| Path | Role | BUILD lock |
|------|------|------------|
| This spec | Law | — |
| `web/lib/alerts/analyzerAlertsAdapter.ts` | Hook / stub until Manager | **May BUILD now** (new file) |
| `web/components/options-lab/AlertBuilderDialog.tsx` | Dialog | **May BUILD now** (new file) |
| Inspector Alerts holder | List + **+** | Independent of canvas apply |
| `HostPnLChart.tsx` context menu + `hostAlertMenu.ts` | Canvas apply | **Downstream of** `p-az-viewport-2d` W-G **and** `p-az-viewport-return` W-G. **India names the lock handoff.** Do not fire a third board on these files until both W-G reports exist. |

---

## 11. Changelog

| Ver | Date | Notes |
|-----|------|--------|
| **v1.0.3** | 2026-08-20 | HIG conversion is acceptance: AT-ALB-11…15 (kit primitives, 44pt, empty-holder deviation, chrome lint, canvas menu a11y). |
| **v1.0.2** | 2026-08-20 | HIG fold: §4 kit tokens (`radius.lg`, `Modal`, `IconButton`/`xmark`); dark-pinned work-surface dialect declared; 44pt sweep; empty-holder Coach deviation from `EmptyState`; **+** is the canvas a11y path. |
| **v1.0.1** | 2026-08-20 | India review ALB-B1/B2 · A1–A4: canonical draft cites ALM §3.2 (`suite` + `severity: medium` default; dialog field deferred); canvas-apply lock vs viewport W-G; unbound `position_id`; adapter-swap AT-ALB-9; Tango threshold-copy; delete unshipped v1. |
| **v1.0** | 2026-08-20 | Coach: MSC canvas vs position; Builder; holder +/scroll; **hook to Labs-wide Alerts Manager + API**. |
