# FatTail Labs — Alerts Manager Spec v1.0

**Status:** DRAFT — Coach 2026-08-20. **v1.0.4** Analyzer holder Delete (ALB-D1). **v1.0.3** HIG ATs (Member dialect is M-G law).  
**Type:** Product + API Spec — Labs-wide **Alerts Manager**  
**Short name:** ALM  
**Member app:** `/app/alerts` (user menu)  
**Settings:** `/settings?section=alerts` (configuration already drafted · Member Settings Spec v1.0 §3.4)  
**Decision log:** DL-464  

**Does not:** replace Analyzer (or any suite) holders / builders / canvas apply. Those stay **in the app they belong to**. This spec is the **manager, API, notification settings, stats, and the hook every suite implements**.

**Parents:** Human Interface Spec v1.0 · Member Settings Spec v1.0 · Analyzer Alert Builder Spec v1.0 (first suite client) · member in-app notifications (`member_notifications` — delivery channel, not this SoR).

---

## 0. Coach intent (do not drop)

1. There is a Labs-wide **Alerts Manager and API**.  
2. **Alerts are managed locally** in the app they belong to (create, edit, bind, holder, canvas).  
3. **Settings, configuration, and stats** live in the **Manager** — a **user app**: user menu **and/or** Settings.  
4. **Every App Suite** has a **hook** into the Alerts Manager with **their own types** of alerts.  
5. Analyzer is the first client (canvas vs position · Builder). It must **not** become a second closed alert center.

---

## 1. Two planes (law)

| Plane | Who | What |
|-------|-----|------|
| **Work-surface (local)** | Each suite / surface | Create, edit, apply, list **in context**. Analyzer inspector holder, canvas right-click, Alert Builder. Practice/Journal/etc. when they spec their types. |
| **Manager** | Member Alerts app + Settings | Configuration, delivery, quiet hours, class enablement, **stats**. Read-only **index** of the member’s alerts (deep link back to the originating app). **Not** the place to draw a Risk-graph tent or Journal prompt. |

The Manager is SoR for **identity of an alert record**, **delivery**, **settings**, **stats**.  
The originating app is SoR for **how the alert is authored and shown in that product**.

---

## 2. Member surfaces

### 2.1 Alerts Manager app

| | |
|--|--|
| Route | `/app/alerts` |
| Entry | **User menu → Alerts** (alongside Profile, Settings). Optional Apps catalog card later — **not** required for v1. |
| Auth | Signed-in. Same posture as `/me` / `/settings`. |
| Chrome | **Member dialect** (HI Spec §2.3): iOS-like grouped content, calm, clear CTAs. **Not** Operator density of `/admin`. A stats-and-index page must not drift toward dashboard-dense. Tokens + `web/components/ui/*` only. Honesty banner = kit `Banner` (info). |
| Panes | **Overview (stats)** · **Index** (read-only list + “Open in {app}”) · link to **Settings → Alerts** for delivery/config |

Stats (v1, no profit theater):

| Stat | Meaning |
|------|---------|
| Armed | Enabled, not expired |
| Active now | Condition currently true (from manager evaluation) |
| Fired (period) | Trigger events in the selected window (day / week / month) |
| By suite | Counts per `suite` / `source_system` |
| By class | Threshold · Algo · Prompt · System |
| By destination | How many would have delivered (honest: delivery live vs not) |

### 2.2 Settings → Alerts

Existing pane (`/settings?section=alerts`) is the **configuration** home. This spec **activates** it when Manager GO’s (Member Settings v1.0 said delivery was not live).

| Block | Law |
|-------|-----|
| **Alert Delivery** | In-app · Process surface · OS notifications (member toggle). **SMS** and **Email digest** stay Coming soon until a later OD. Journal destination = min-severity for journal inject (when that OD exists). |
| **Severity minimums** | Per destination: Info · Low · Medium · High · Critical |
| **Alert classes** | Enable/disable Threshold · Algo · Prompt · System **member-wide** (a suite cannot deliver a class the member turned off) |
| **Quiet hours** | Start, End, min severity, timezone |
| **Digest** | Batch non-critical into periodic summaries |
| **Threshold rules (Settings)** | **Removed as a second builder.** Rules are authored **in the suite**. Settings does not + Add Rule for Analyzer canvases. |

Honest banner until delivery is live: *“Destinations are saved. Delivery is not live yet.”*

### 2.3 User menu

| Item | Target |
|------|--------|
| Alerts | `/app/alerts` (Manager app) |
| Settings | `/settings` (Alerts pane for config) |

Do not hide one behind the other — Coach: menu **or** Settings.

---

## 3. Every suite hooks in (with its own types)

### 3.1 Registry

Each **App Suite** (top-level Labs app) **must** register:

| Field | Example |
|-------|---------|
| `suite` | `options_lab` · `practice` · `strategy_lab` · `journey` · `toughness` · `community` · `wiki` |
| `source_system` values | Stable strings, e.g. `analyzer_risk_graph` |
| **Alert types** | Suite-owned vocabulary (Analyzer: `canvas` / `position` + trigger families). Practice may later spec `fill` / `campaign` / `journal_prompt`. Unknown types are **opaque payload** to the Manager. |
| Holder | Where the member sees that suite’s alerts **in the app** |
| Deep link | URL to open the originating surface with `alert_id` |

A suite that has no types yet still **registers** with `types: []` so the Manager index can stay honest. It does **not** invent alerts.

### 3.2 Hook (normative — all suites)

**This table is the canonical draft** for every suite. Analyzer Alert Builder Spec §2.2 **cites** it and maps Analyzer-local names (`kind` → `surface_type`, `position_id` → `local_ref.position_id`). Do not keep a second wire dialect.

Every suite adapter implements:

```
listAlerts({ suite?, source_system?, symbol? })
upsertAlert(draft)
removeAlert(alertId)           // Analyzer holder Delete is in (ALB-D1). Manager HTTP DELETE later.
setEnabled(alertId, enabled)   // optional in a given surface UI
subscribeAlerts(onChange)
```

`draft` **always**:

| Field | Law |
|-------|-----|
| `source_system` | Registered id for **that** surface |
| `suite` | Parent suite |
| `domain` | `work_surface` \| `practice_surface` \| `process_surface` \| `learning_surface` \| `community_surface` |
| `alert_class` | `threshold` \| `algo` \| `prompt` \| `system` |
| `surface_type` | **Suite-defined** string (Analyzer: `canvas` \| `position`). Manager stores, does not interpret. |
| `title` | Member line — **no profit claims** |
| `symbol` | Optional; required when the surface is market-bound |
| `trigger` | Opaque JSON **plus** a `family` the suite documents |
| `color` | Optional tag for drawing |
| `behavior` | `once_only` \| `repeating` \| `persistent` |
| `severity` | Info · Low · Medium · High · Critical. **Required on every draft.** Suites with no dialog field stamp a **named default** (Analyzer: `medium`). Delivery (severity minimums per destination, quiet-hours min severity) keys on this field. |
| `expires_at` | Optional |
| `local_ref` | Optional id in the originating app (position card id, journal session id, …) |

The Manager **must not** require Analyzer-only fields (`canvas`, strike labels) at the API root. Those live in `surface_type` + `trigger` + `local_ref`.

`POST`/`PATCH` without `suite` or `severity` → 4xx (same fail-loud as unregistered `source_system`).

### 3.2.1 Dangling `local_ref` (ALB-A1)

Manager records outlive originating sessions. When `local_ref` no longer resolves in the originating app (Analyzer: book card deleted or book not restored):

| Surface | Law |
|---------|-----|
| Originating holder | Stays listed, marked **Unbound**, **never Active**, never fires. Member edits (rebind) or it expires. Do not auto-delete. |
| Manager index | Stays listed. Honest **Unbound** (not Active). Deep link still opens the originating app. |
| Hidden (not deleted) | Still **bound** — Hide is not an orphan. |

Write this before any adapter swap: session-stub alerts never lived long enough to orphan. Each suite spec names what “resolves” means; Analyzer is AZ-ALB §2.5.

### 3.3 Suite type catalog (v1 named; others stub)

| Suite | Surfaces (v1) | Own alert types (v1) | Holder |
|-------|----------------|----------------------|--------|
| **Options Lab** | Analyzer Risk graph | `canvas` (underlier price) · `position` (bound card: price / P&L / greeks) · `algo` (OTM fly narrative trail — [AZ-ALGO](./FatTail-Labs-Options-Lab-Analyzer-Algo-Alert-Spec-v1.0.md)). Prompt **placeholder**. See [Alert Builder Spec](./FatTail-Labs-Options-Lab-Analyzer-Alert-Builder-Spec-v1.0.md) | Inspector Alerts holder |
| **Options Lab** | Heatmap · VP · Surface | **None until a surface spec** — hook registered, types empty | — |
| **Practice** | Trade Log · Journal · Reports · Campaigns | **None until a Practice alerts spec** | — |
| **Strategy Lab** | Design / Curate / Deploy | **None until a Strategy Lab alerts spec** | — |
| **Journey** | Pathway / enrollments | **None until spec** | — |
| **Toughness** | FatTail Hard / True 75 | **None until spec** | — |
| **Community** | Chat / Discord mirror | **None until spec** | — |
| **Wiki** | Map / search | **None until spec** | — |
| **System** | Manager only | `system` class (session, entitlement, delivery errors) — **not** authored in Analyzer | Manager index |

Adding a type = **version the suite’s surface spec** + append this catalog. Do not fork a second manager.

---

## 4. Alert classes and types

### 4.1 Classes (Labs-wide)

| Class | Who authors | Meaning |
|-------|-------------|---------|
| **threshold** | Suite Builder / canvas | Numeric / listed-mark condition (price, P&L $, greek, later fills) |
| **algo** | Suite when live | Process algorithm. Options Lab Analyzer: **AZ-ALGO** OTM-fly narrative trail. Other suites remain placeholder until their spec. |
| **prompt** | Suite / Coach later | Language or checklist prompt |
| **system** | Platform | Entitlement, session, delivery failure — never a fake market |

Member Settings can disable a **class** globally. Suite UI still **creates** locally but Manager **will not deliver** a disabled class.

### 4.2 Behavior

`once_only` · `repeating` · `persistent` (same as Analyzer Builder). Manager evaluation owns fire-count and re-arm.

### 4.3 Notification types (destinations)

| Destination | v1 when Manager GO | Notes |
|-------------|-------------------|--------|
| **In-app** | Yes | Reuse / extend `member_notifications` with `kind` prefixed `alert:` |
| **Process surface** | Yes if Process Copilot / Journey surface is live | No profit copy |
| **OS notifications** | Yes after permission | Browser Notification API; fail honest if denied |
| **SMS** | No — Coming soon | Settings control disabled |
| **Email digest** | No — Coming soon | Settings control disabled |
| **Journal** | Optional later OD | Min-severity inject; not a second journal SoR |

A **notification** is a **delivery of an alert event**. The **alert** is the armed rule. Do not conflate the two in the API.

---

## 5. API (member)

Base: `/api/me/alerts`. Session cookie. Fail loud if Manager flag off (`LABS_ALERTS_MANAGER` — missing when used = abort; when `0`, adapters stay on stubs).

### 5.1 Settings

| Method | Path | |
|--------|------|--|
| `GET` | `/api/me/alerts/settings` | Member delivery/class/quiet/digest document |
| `PUT` | `/api/me/alerts/settings` | Replace; validates enums |

Body matches Member Settings `AlertSettings` (minus Settings-local draft rules).

### 5.2 Records

| Method | Path | |
|--------|------|--|
| `GET` | `/api/me/alerts` | Query: `suite`, `source_system`, `symbol`, `class`, `armed=1` |
| `GET` | `/api/me/alerts/{alert_id}` | One record |
| `POST` | `/api/me/alerts` | `upsert` create — **called by suite adapters**, not by random clients |
| `PATCH` | `/api/me/alerts/{alert_id}` | Edit from originating Builder |
| `DELETE` | `/api/me/alerts/{alert_id}` | **Specified, unshipped.** Analyzer **holder Delete** is in (**ALB-D1** · **DL-493**). Manager index still has no delete control. HTTP `DELETE` waits on Manager GO. |

`POST`/`PATCH` **require** a registered `source_system` **and** `suite` + `severity`. Manager rejects unknown suites.

### 5.3 Evaluation / events

| Method | Path | |
|--------|------|--|
| `GET` | `/api/me/alerts/{alert_id}/state` | `{ active: boolean, last_fired_at }` |
| `GET` | `/api/me/alerts/events` | Recent fires (stats). Query `since`, `suite` |
| `GET` | `/api/me/alerts/stats` | Overview aggregates for `/app/alerts` |

Work surfaces may **push a sample** for evaluation (`POST /api/me/alerts/evaluate` with `{ alert_id, sample }`) when the condition lives only in that app (e.g. tent P&L). Price-on-underlier may be evaluated in the manager from Market Bus **without** the Analyzer tab open — **OD** when GO; until then Analyzer adapter evaluates while the tab is open (honest: Active only while the surface is alive).

### 5.4 Stream

`GET /api/me/alerts/stream` — same-auth WebSocket or SSE as other member streams.

**Arch 28 scope (ALB-A2):** Arch 28’s one-socket law is **market data** (`WS /api/me/market/stream` · `MarketSocket` tab singleton). The alerts stream is a **member-identity** channel (session, not Massive). It is **lawful** as a second WS/SSE. It is **not** precedent for a second **market** socket. India W0 on any Alerts Manager board restates this so “one WS/tab” is not read as forbidding `/api/me/alerts/stream`, and the alerts stream is not read as a second Massive path.

### 5.5 Record shape (JSON)

```json
{
  "alert_id": "al_…",
  "suite": "options_lab",
  "source_system": "analyzer_risk_graph",
  "domain": "work_surface",
  "alert_class": "threshold",
  "surface_type": "canvas",
  "symbol": "SPX",
  "title": "SPX rises above 5500",
  "severity": "medium",
  "color": "#22c55e",
  "behavior": "once_only",
  "enabled": true,
  "active": false,
  "unbound": false,
  "local_ref": { "position_id": null },
  "trigger": { "family": "price", "condition": "above", "target": 5500 },
  "expires_at": null,
  "created_at": "…",
  "updated_at": "…",
  "deep_link": "/app/options-lab/analyzer?alert=al_…"
}
```

---

## 6. Evaluation and Active/Idle

| Term | Meaning |
|------|---------|
| **Armed** | Enabled, not expired, class allowed in Settings |
| **Idle** | Armed, condition not true |
| **Active** | Armed, condition **currently** true. **Unbound** is never Active. |
| **Unbound** | `local_ref` does not resolve in the originating app (§3.2.1). Listed; not evaluable. |
| **Fired** | An event was recorded (once_only may stay fired) |

Originating holders show **Active / Idle** from `GET …/state` or subscribe. They do not invent delivery.

Held/closed market: no “live fire” theater for underlier prices unless the suite spec says Held-evaluate.

---

## 7. Invariants

1. **One manager.** No per-suite Redis/MSC alert bus.  
2. **Local authorship.** Analyzer (etc.) Builder/canvas/holder stay in that app.  
3. **Hook required.** New suite alerts = register + surface spec, then `upsertAlert`.  
4. **Opaque types.** Manager stores `surface_type` + `trigger`; only the suite interprets.  
5. **No profit claims** in titles, notifications, or stats. **Tango (ALB-A3):** “P&L above 200 is a number, not a promise.” A member-authored threshold is process telemetry; this invariant governs what **Labs** says (and Bob’s copy), not what members set in a suite Builder. Stamp once; do not relitigate per suite catalog.  
6. **No invented instruments** (DL-309) for Options Lab types.  
7. **Standalone repo.** HTTP only to anything outside Labs.  
8. **Fail loud** on Manager flag when a suite adapter is set to `manager` and config is missing.  
9. **Fail open** for UX: if Manager is down, adapter stub may keep the local holder painting; **do not** claim OS/SMS delivery.  
10. Notifications are **events**, not a second copy of the rule.  
11. **Arch 28** one-socket law is market data only. Alerts stream ≠ second market socket (ALB-A2).  
12. **Delete unshipped in v1** (deliberate).  
13. **HIG.** `/app/alerts` is **Member dialect** (HI Spec §2.3). Tokens + kit primitives. No raw hex/px/`zinc`. No Operator density.

---

## 8. Out of scope (v1.0)

- Implementing the HTTP service (BUILD after Coach GO). Manager **app shell, settings wiring, and API** may proceed independently of Analyzer viewport boards. Everything touching the Risk graph waits on AZ-ALB §2.6.  
- SMS, email digest going live.  
- Delete chrome (holder or Manager index) — unshipped v1.  
- Practice / Strategy Lab / Journey / … type catalogs (those suite specs).  
- Admin broadcast “alerts.”  
- MSC Alert Center import.

---

## 9. Acceptance (Manager plane)

| AT | Criterion |
|----|-----------|
| **AT-ALM-1** | User menu has **Alerts** → `/app/alerts` |
| **AT-ALM-2** | Settings → Alerts is configuration only (no second Analyzer builder) |
| **AT-ALM-3** | `POST /api/me/alerts` without registered `source_system` → 4xx |
| **AT-ALM-4** | Analyzer `upsert` through hook appears in Manager index with `suite=options_lab` |
| **AT-ALM-5** | Open in Analyzer deep link returns to Risk graph with that `alert_id` |
| **AT-ALM-6** | Stats pane shows counts by suite and class, no P&L |
| **AT-ALM-7** | Disabled class in Settings → no in-app/OS delivery |
| **AT-ALM-8** | Heatmap (types empty) cannot POST Analyzer `surface_type` values |
| **AT-ALM-9** | `POST` without `suite` or `severity` → 4xx |
| **AT-ALM-10** | Dangling `local_ref`: index lists the record **Unbound**, `active` is false |
| **AT-ALM-11** | Alerts stream is **not** `MarketSocket` / `/api/me/market/stream` (ALB-A2) |
| **AT-ALM-12** | `/app/alerts` is **Member dialect** (grouped, calm). Kit primitives (`List` / `Banner` / `Button`). **Not** `/admin` density. |
| **AT-ALM-13** | Kilo lint: no raw hex / magic px / `zinc-*` in Manager app or Settings Alerts pane chrome. |

India W0 (when a Manager board is seeded): restate ALB-A2 Arch 28 scope in the India packet so the one-socket law is not misread.

---

## 10. Files (when BUILD)

| Path | Role | BUILD lock |
|------|------|------------|
| This spec | Law | — |
| `web/app/app/alerts/page.tsx` | Manager app | **Independent of** Analyzer `HostPnLChart` / viewport boards |
| `web/lib/alerts/` | Client hook + registry | Independent (adapter swap is AT-ALB-9, after this GO) |
| `server/routes/alerts.py` | `/api/me/alerts*` | Independent |
| Settings Alerts pane | Config (already exists; wire live) | Independent |
| SiteHeader user menu | **Alerts** item | Independent |
| Analyzer canvas apply | **Not this spec** | AZ-ALB §2.6 — waits on viewport W-G |

---

## 11. Changelog

| Ver | Date | Notes |
|-----|------|--------|
| **v1.0.4** | 2026-08-20 | Analyzer holder **Delete** is in (**ALB-D1** · **DL-493**). Manager HTTP `DELETE` and index chrome still later. |
| **v1.0.3** | 2026-08-20 | HIG conversion is acceptance: AT-ALM-12…13. |
| **v1.0.2** | 2026-08-20 | HIG fold: `/app/alerts` is **Member dialect** (not `/admin` density). |
| **v1.0.1** | 2026-08-20 | India review ALB-B1/B2 · A1–A4: §3.2 is the canonical draft (`suite` + `severity` required); unbound `local_ref`; Arch 28 stream scope; Tango threshold-copy; delete unshipped v1; Manager BUILD independent of Risk graph. |
| **v1.0** | 2026-08-20 | Coach: Manager + API; local authorship; Settings/stats in Manager; **every suite hooks with its own types**. |
