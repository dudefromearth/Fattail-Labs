# FatTail Labs — Options Lab Analyzer Viewport Keep-Warm Spec v0.1

**Status:** **BUILD AUTHORITY** (Coach 2026-08-17 · **DL-418** promotes **DL-417**)  
**Content revision:** **v0.1.1** (filename stays `…-Spec-v0.1.md`)  
**Type:** Product Spec — Analyzer viewport poll · last paint · resource law  
**Short name:** **Analyzer Keep-Warm** · **AZ-KW**  
**Filename:** `FatTail-Labs-Options-Lab-Analyzer-Viewport-Keep-Warm-Spec-v0.1.md`  
**Date:** 2026-08-17  
**DL:** **DL-417** (filed) · **DL-418** (BUILD AUTHORITY · OD-KW Accept · v0.1.1 fold)  
**Parent:** [Analyzer Spec v0.2.1](./FatTail-Labs-Options-Lab-Analyzer-Spec-v0_2.md) · [OT-EF Doctrine v1.1](./FatTail-Labs-Options-Lab-OPF-Truth-and-Elegant-Failure-Doctrine-v1.1.md) · [Session/Print Spec v0.1](./FatTail-Labs-OPF-Session-and-Print-Authority-Spec-v0.1.md) · [OPF Spec v0.2.1](./FatTail-Labs-Options-Pricing-Foundation-Spec-v0_2.md) · [Market Bus Spec v1.0.1](./FatTail-Labs-Massive-Market-Bus-Shared-Client-Spec-v1.0.md) · Arch **28** · Arch **30**

**Audience:** Coach · India · Juliet · Charlie · Echo · Delta · Hotel · Foxtrot

**Coach Content Law:** Coach’s words below are product intent. Reviewer objections sit **beside** them, labeled as the reviewer’s.

---

## 0. Phase 0 — Coach intent (verbatim, preserved)

> When I leave the page I want the image to remain and polling to slow in order to conserve resources. When the user returns I want polling to return to the normal rate. That way the positions are always kept up to date and the user does not have to wait for a redraw.

> That also means that the polling is always going. But if there's no focus if the polling is slowed to only a second or maybe even 3-5 seconds, its resource draw on the entire system should be minimal.

> This way, whenever I open the analyzer, there is a recent rendering of the positions. If there are no positions with visibility on, and polling is still on, it should be at an interval that minimizes resources. The reason for having constant polling is because this will become the main working page, and users will spend a lot of time there, so we need to maximize their experience. Given that, I want to understand the draw on system resources when the page is not in view, and we can develop a strategy that maximizes user experience against system resources.

**Success (Coach):**

1. Opening Analyzer already shows a **recent** picture of the shown book — not a blank viewport that then redraws.  
2. Leaving (other suite page, other app, other tab) **does not erase** the last curves.  
3. Polling **never fully stops** while the plane is printing.  
4. Away / no-focus polling is **slow enough** that system draw is small.  
5. Return to Analyzer restores the **working** poll rate.  
6. If **no** card is shown, polling stays on at the **cheapest** lawful rate.

**Stamp (Coach 2026-08-17, verbatim):**

> Keep-Warm v0.1: stamp BUILD AUTHORITY. OD-KW-1 5s (revisit only after the aggregate row) · OD-KW-2 as-built no-resolve promoted to law, 30s constant = posture only · OD-KW-3 30 min. … Stale marker on return is honesty, not chrome — quiet as_of age or a hairline dim that clears on the first Working tick; nothing that reads as a reload or asks the member to wait. Echo gates it against that.

---

## 1. Why this is a working-page law

Analyzer is not a side tool. It is becoming the **main working page**. Members will sit on it for long stretches. UX while seated must be tight. Cost while they are *not* looking must stay small.

That is a **rate** problem, not a “tear down the chart” problem.

A blank viewport on return is a **failure**. A 2.5s-old curve on return is **success**.

---

## 2. Problem (what we saw)

Leaving Analyzer (Heatmap, Volume Profile, another app, or tab hide + remount) **destroyed the canvas**. The remount started with an empty book for a frame. Empty book → no trades → no curves → grid only. Then session storage loaded, OPF resolved, and the lines appeared. That wait felt like “focus stopped rendering.”

It was not “the chart is too expensive so we shut it off.” It was a **first-paint wipe** plus a cold resolve.

Polling at 2.5s while seated is the working-page rate. Away, that same full resolve is wasted if nobody is looking — unless we keep a **last paint** and a **slower tick** so the next open is still recent.

---

## 3. Law (normative)

### AZ-KW-1 — Last paint is sacred

The last successful OPF book curve **stays**. Leave, hide, remount: the member must see that picture immediately (from canvas if still mounted, from module cache if remounted). Never clear curves because the tab lost focus or the route unmounted.

Exception: the member **hid every card** or **deleted the book** — then the viewport is honestly empty (scales + grid). That is not a wipe; that is the book.

### AZ-KW-2 — Polling stays on while the plane is printing

While OPF says the plane is **printing** (Live or Extended — Session/Print), Analyzer keep-warm **ticks**. It does not fully stop because the member walked to Heatmap or another tab.

When the plane is **not printing**, do **not** invent live. Last print / held is enough (OT-EF · Session/Print).

### AZ-KW-3 — Three rates (UX vs cost)

| ID | State | Interval | Work |
|----|--------|----------|------|
| **Working** | Analyzer mounted, document **visible** ([Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API) `visibilityState === "visible"`), **≥1 shown** card | **2.5s** (`OPF_POLL_MS`) | Full tick — maximize seat UX |
| **Away** | Document **hidden** **or** Analyzer unmounted, still **≥1 shown** | **5s** (`OPF_AWAY_POLL_MS`) · **OD-KW-1 Accept** | Full tick, slower. Last paint stays current. |
| **Idle** | **No** card shown (all hidden or empty book) | **`OPF_IDLE_POLL_MS` = 30s = session posture only** · **OD-KW-2 law** | **No heavy resolve.** No 30s full tick of a hidden book. Posture (~10s as-built) notices Live vs Held. Last cache stays so Show-on paints at once. |
| **Held** | Plane not printing | **off** | Last print. No live invent. |

**1s away is forbidden.** It is *faster* than Working 2.5s. Coach’s “a second or 3–5 seconds” is **away in the 3–5s band**. Locked **5s**. Revisit **only after** reading §4 aggregate (OD-KW-1).

**Page Visibility API.** Away **5s** is the **target** interval the app arms. A hidden tab may have its timers **throttled** by the browser, so the real gap can be **longer** than 5s. That does **not** authorize blanking the canvas. The last paint stays; the next tick runs when the browser allows it.

### AZ-KW-4 — Shown means viewport Show

“Shown” = the independent **Show** checkbox is on (DL-394). Hidden cards do not get a package curve and do not justify Working/Away full ticks.

### AZ-KW-5 — Return is a rate change, not a redraw · last paint is aged

Coming back to Analyzer (or switching **Risk ↔ Surface**, AZ-VP-S2):

1. Last paint is already on screen (or painted from cache on the first frame). **No cold resolve.**  
2. Rate becomes **Working** (2.5s).  
3. One **soft** refresh may run. Soft failure **must not** blank the last curves.  
4. Until that first Working tick **lands**, last paint carries **`generation_as_of` age** and a **stale** honesty marker. This **restates** parent **AZ-DATA-5a** (cached paint labeled stale until soft-refresh completes).

**Honesty, not chrome (Coach):** quiet `as_of` age **or** a hairline dim that **clears on the first Working tick**. Nothing that reads as a reload. Nothing that asks the member to wait. **Echo gates** the marker against that bar before any chrome ships.

### AZ-KW-6 — One WebSocket, no second Massive

Keep-warm uses the existing Analyzer path: ladder HTTP + OPF resolve. **No** extra WebSocket. **No** client Massive. Market Bus one-socket law (Arch 28) is unchanged.

### AZ-KW-7 — Fail elegant

A failed away tick **keeps** the last good curves. Named failure on the card (OT-EF Law B) is allowed. A blank viewport is not.

### AZ-KW-8 — Risk ↔ Surface inherit this spec

Switching **Risk graph ↔ Surface** (parent **AZ-VP-S2**) inherits **AZ-KW-1** and **AZ-KW-5**. Same last paint. Same rate change. **No** cold resolve on the switch.

Surface 3D **reuses** `opfPollIntervalMs`. **No fourth rate.** An own Away rate is a **later packet** only if mesh density requires it (AZ-VP-S5).

### AZ-KW-9 — Keep-warm TTL

A **shown** book keep-warm after leaving Analyzer continues at Away 5s until **30 minutes** with no remount (`CACHE_TTL_MS`) · **OD-KW-3 Accept**. Then it stops. Cache of the last paint may still paint on a later open (soft-stale, AZ-KW-5).

---

## 4. What one full tick costs (resource truth)

The **canvas** is cheap. The **OPF resolve** is the bill.

| Piece | Per full tick | Notes |
|-------|----------------|-------|
| Chain ladder HTTP | 1 per **distinct expiration** in the shown book | Labs API → Redis generation. Not a new Massive hop from the browser. |
| OPF resolve | 1 per **shown** structure | 161-point curves, BSM/CRR. Dominates CPU. |
| React state + canvas | 1 draw | Hidden tab: browser **skips paint**. We still pay HTTP/CPU if we resolve. Visibility throttling may stretch Away past 5s. |
| Card package quotes | **0** on this loop | Atomic settle (definition change only). Not a poll. |
| Session posture | Separate ~**10s** | **This is Idle.** Light. Notices Live vs Held. |
| Market WebSocket | **1 per tab** | Shared. Not started per tick. |

**Per member, per shown structure, one expiration:**

| Rate | Ladder HTTP / min | OPF resolve / min |
|------|-------------------|-------------------|
| Working 2.5s | 24 | 24 |
| Away 5s | 12 | 12 |
| Idle (nothing shown) | 0 | 0 |

**Aggregate (same assumption — one shown structure, one exp per member):**

| Members | Seated (Working) resolve / min | Away resolve / min | Seated ladder / min | Away ladder / min |
|---------|--------------------------------|--------------------|---------------------|-------------------|
| **100** | 2,400 | 1,200 | 2,400 | 1,200 |
| **500** | 12,000 | 6,000 | 12,000 | 6,000 |

Multiply **resolves** by shown-structure count. Multiply **ladders** by distinct expirations. Away is about **half** of seated. OD-KW-1 (5s vs 3s) is revisited **only after** this row.

Away 5s with three shown calendars is still three resolves every 5s. That is why Idle must **not** price a book nobody can see.

---

## 5. Member experience

| Event | Member sees |
|-------|-------------|
| Sit on Analyzer, cards shown | Curves move with the market (~2.5s). |
| Switch to Heatmap / Courses / another tab | Last Analyzer picture is **not** thrown away. Away tick continues if anything is still shown. |
| Come back to Analyzer | Picture is already there. Quiet age / hairline dim until the first Working tick. Then Working rate. No “empty then draw.” No wait copy. |
| Risk ↔ Surface | Same book, same last paint, no cold resolve. |
| Un-Show every card | Viewport empty (honest). Heavy resolve **stops**. Show-on again uses last cache if that structure was priced before. |
| Market closed / not printing | Last print / held. No live theater. |

No profit theater. No “live” claim on a last print (OT-EF A6 · Session/Print).

---

## 6. As-built (honest)

| Concern | Location |
|---------|----------|
| Three-tier interval | `web/lib/options-lab/useOpfRiskGraph.ts` — `opfPollIntervalMs` · `OPF_POLL_MS` · `OPF_AWAY_POLL_MS` · `OPF_IDLE_POLL_MS` |
| Module cache + keep-warm after unmount | same file — `graphCache` · `attachKeepWarm` · `resolveAndCache` |
| Book on first paint | `OpfRiskAnalyzer` — `useState(() => loadPositions())` |
| Last paint not wiped on remount | `run` / `resolveAndCache` do not `setResult(null)` on a soft miss |
| Characterization | `web/lib/options-lab/opfPollInterval.test.ts` |
| Session posture | `OpfRiskAnalyzer` ~10s `fetchPlanePosture` — **Idle work** |
| Card quotes | `usePackageQuotes` — atomic, not this loop |
| Stale marker (AZ-KW-5 / AZ-DATA-5a) | **Not shipped.** Echo gate before chrome. |

**Idle (law, OD-KW-2):** when no card is shown, keep-warm **stops** the heavy resolve (`stopKeepWarm`). `OPF_IDLE_POLL_MS` (30s) is **posture only** — it is **not** a 30s full OPF tick. No light ladder ping unless a later OD reopens.

Keep-warm of a **shown** book after leaving Analyzer continues at Away 5s until **30 minutes** with no remount · **OD-KW-3**.

---

## 7. Scope

### In

- Risk-graph (2D) keep-warm and poll rates  
- Last-paint / module cache across suite nav and tab hide  
- Idle = posture only when no card is shown  
- Resource accounting of a tick **and** 100 / 500 aggregate  
- Risk ↔ Surface inherit (AZ-VP-S2)  
- Page Visibility target vs browser throttle  
- Stale honesty on return (Echo-gated chrome)  
- Acceptance including **AT-KW-9**

### Out

- Changing OPF29 / two clocks  
- Second WebSocket or client Massive  
- Card package-quote loop (stays atomic)  
- **Layout residual** (vertical stack · OD-AZ1/2) — **own packet**, top of the Analyzer residual board. Not this spec.  
- A **fourth** Surface Away rate (later packet only if mesh density requires)  
- Header marks UI  
- MiniTwo vs StudioOne capture (OD-6 gold chain is a different plane)

### Non-goals

Blanking the viewport to “save GPU.” MSC as SoR. 1s away poll. Reload/wait chrome on return.

---

## 8. Ideas inventory (Phase 0)

| Idea | Disposition |
|------|-------------|
| Image remains when leaving the page | **IN-SCOPE** (AZ-KW-1) |
| Poll slows away, returns to normal in seat | **IN-SCOPE** (AZ-KW-3, AZ-KW-5) |
| Polling always on while printing | **IN-SCOPE** (AZ-KW-2) |
| Away **5s** | **IN-SCOPE** · **OD-KW-1 Accept** — revisit only after §4 aggregate |
| Open Analyzer → recent picture | **IN-SCOPE** |
| No shown cards → minimize | **IN-SCOPE** — **no heavy resolve** (OD-KW-2 law) |
| Analyzer is the main working page | **IN-SCOPE** — Working 2.5s |
| Understand off-view resource draw | **IN-SCOPE** — §4 + aggregate |
| Quiet stale / as_of until first Working tick | **IN-SCOPE** (AZ-KW-5 · AZ-DATA-5a) · Echo gates chrome |
| Light 30s ladder ping with nothing shown | **OUT** — OD-KW-2 closed: posture only |
| Tighten away to 3s | **FLAGGED** — only after §4 aggregate |
| Keep Analyzer mounted (hidden CSS) | **FLAGGED** — cache + remount paint is current path |
| Layout vertical stack | **OUT** — residual board phase **L** |

---

## 9. Open decisions — **Accepted** (Coach 2026-08-17 · **DL-418**)

| ID | Question | **Accept** |
|----|----------|------------|
| **OD-KW-1** | Away 5s or 3s? | **5s.** Revisit only after §4 aggregate. Never 1s. |
| **OD-KW-2** | Idle no-resolve vs 30s ladder ping? | **No-resolve is law.** `OPF_IDLE_POLL_MS` 30s = **posture only**. |
| **OD-KW-3** | Keep-warm TTL? | **30 min**, then stop. |

---

## 10. Acceptance

| AT | Criterion |
|----|-----------|
| **AT-KW-1** | `opfPollIntervalMs` Working / Away / Idle / Held matches §3 |
| **AT-KW-2** | Leave Analyzer with ≥1 shown → remount paints from cache **without** waiting for a new resolve (first frame has curves) |
| **AT-KW-3** | Hidden tab does **not** clear `result` / last series. Canvas never blanks because Visibility fired. |
| **AT-KW-4** | Soft resolve failure keeps last curves |
| **AT-KW-5** | All cards hidden → **no** full OPF resolve loop |
| **AT-KW-6** | Show-on after hide uses last cache if that structure was priced |
| **AT-KW-7** | No extra WebSocket; no client Massive in the keep-warm path |
| **AT-KW-8** | Away interval is **5s** (target) and **> Working** |
| **AT-KW-9** | Risk ↔ Surface switch does **not** cold-resolve; last paint + AZ-KW-5 age/stale until the first Working tick |

---

## 11. Review gates

| Gate | Agent | Asks |
|------|-------|------|
| Spec / architecture | **India** | Cache vs bus; no second SoR; Idle = posture only |
| Stale honesty chrome | **Echo** | Quiet `as_of` or hairline dim. Clears on first Working tick. Not a reload. Not a wait. |
| Design / member | **Tango** | Blank-on-return is a trust failure; no panic on away |
| Trading honesty | **Hotel** | Away / stale picture must not read as a lift-now live book |
| Final | **Coach** | **Stamped** BUILD AUTHORITY · OD-KW-1…3 Accept (this revision) |

---

## 12. Success criterion (spec review)

A reviewer can validate, without reading implementation code:

1. Analyzer is treated as the **working page**.  
2. Last paint survives leave/return and Risk ↔ Surface.  
3. Three rates exist; 1s away is illegal; Idle is posture only.  
4. Visibility API is named: Away is the **target**; throttle may lengthen; canvas never blanks.  
5. §4 states 100- and 500-member seated vs away cost per shown structure.  
6. Stale on return is honesty, gated by Echo.

---

## 13. Document control

| Version | Date | Notes |
|---------|------|-------|
| **v0.1** | 2026-08-17 | Coach working-page keep-warm. DRAFT. DL-417. |
| **v0.1.1** | 2026-08-17 | **BUILD AUTHORITY.** OD-KW-1…3 Accept. AZ-KW-5 age/stale. Visibility API. §4 aggregate 100/500. AZ-KW-8 Surface inherit. AT-KW-9. Idle = posture only. DL-418. |

**End of Analyzer Viewport Keep-Warm Spec v0.1.1**
