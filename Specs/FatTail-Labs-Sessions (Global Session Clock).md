# Build Spec — Sessions (Global Session Clock)

**Version:** v0.3
**Target:** labs.fattail.ai
**Placement:** Resources → Sessions
**Route:** `/resources/sessions`
**Owner:** Coach (Ernie Varitimos)
**Spec date:** 2026-09-08 · addendum §12 2026-09-09 · GSC7 day-list axis 2026-09-09
**Reference implementation:** `session-clock.html` (standalone, 37 KB, self-contained). OD-S4 (c): HTML not found; Echo visual contract is the reference.

---

## 0. Machines — read before running anything

Every command below states the machine it runs on. Do not infer.

| Role | Machine | Notes |
|---|---|---|
| **Development** | Studio Two, Coach's MacBook, or Conor's Mac | All `npm`/`pnpm`, build, lint and test commands run here. Grok Build operates here. |
| **Staging** | Mini Two (M2 Mac mini) | Becomes the staging host for all production apps once Labs production moves off it. Deploy here first. |
| **Production** | Mini Two → cutting over to Dude Two (M4 Mac mini) | **Confirm the live production host before deploying.** The Mini Two → Dude Two cutover was scheduled for the week of 2026-09-07 and may already have happened. |
| **Not a target** | Dude One | FileVault-encrypted, requires a human at the keyboard after reboot. Excluded. |

**Rule:** never deploy straight to production. Staging first, verify the acceptance tests in §9, then promote.

---

## 1. Objective

Ship a reference page that shows every major global market open and close on a single 23-hour axis anchored to New York, so a member can answer "what is trading right now, and what opens next" without leaving Labs.

The page is **read-only reference material**. It has no inputs to persist, no user state, and no server dependency.

---

## 2. Scope

**In scope**

- New route under Resources with sub-nav label **Sessions**
- Port the reference implementation to a native Labs component using the Labs design system
- Replace the hardcoded holiday table with a rules-derived market calendar module
- Unit tests for the calendar and the time-axis math

**Out of scope**

- Live quotes, prices, or any market data feed
- Foreign market holidays (Lunar New Year, Golden Week, UK bank holidays) — noted on the page as a known omission
- Toronto/TSX holiday handling — TSX runs its own calendar and is deliberately shown unmodified
- Persisting the selected date or zoom preference

---

## 3. Navigation

1. Add a child item to the existing **Resources** menu.
2. Sub-nav label: `Sessions` — exactly this string, no suffix.
3. Route: `/resources/sessions`.
4. Match the existing Resources children for ordering, icon convention, and active-state styling. **Discover the existing pattern in the repo and conform to it — do not invent a new nav registration mechanism.**
5. Page `<title>` / document head: `Sessions` within whatever title template Labs already applies.

**Entitlement:** visible to every authenticated Labs member, Observer trial included. No tier gate. Use the existing lowest-tier authenticated guard rather than adding a new policy.

---

## 4. Component structure

Follow existing Labs conventions for file placement and naming. Indicative decomposition:

````
resources/sessions/
├── page                 route entry, Resources shell, page chrome
├── SessionMap           the chart: axis, rows, bars, bands, now-line
├── SessionControls      date picker + Today, Focus/Fit timescale toggle
├── StatusBanner         closed / early-close / full-session banner
├── ClosuresList         upcoming US market closures
├── data/exchanges       exchange session table (§5)
└── lib/marketCalendar   NYSE calendar, derived from rules (§7)
````

`marketCalendar` must be a **pure, dependency-free module** with no imports from the view layer. It will be reused elsewhere.

---

## 5. Exchange session data

Local clock times with the IANA zone. Times are local to each exchange; ET is always computed, never stored.

| Group | Name | Sub-label | IANA zone | Local session |
|---|---|---|---|---|
| Americas | US pre-market | — | America/New_York | 04:00–09:30 |
| Americas | New York | NYSE · Nasdaq | America/New_York | 09:30–16:00 |
| Americas | Toronto | TSX | America/New_York | 09:30–16:00 |
| Americas | US after-hours | — | America/New_York | 16:00–20:00 |
| Futures | ES futures | CME Globex | America/New_York | 18:00–17:00 (next day) |
| Futures | SPX options | Cboe GTH | America/New_York | 20:15–09:15 |
| Futures | SPX options | regular | America/New_York | 09:30–16:15 |
| Europe | London | LSE | Europe/London | 08:00–16:30 |
| Europe | Frankfurt | Xetra | Europe/Berlin | 09:00–17:30 |
| Europe | Paris · Amsterdam | Euronext | Europe/Paris | 09:00–17:30 |
| Asia-Pacific | Mumbai | NSE | Asia/Kolkata | 09:15–15:30 |
| Asia-Pacific | Hong Kong | HKEX | Asia/Hong_Kong | 09:30–12:00, 13:00–16:00 |
| Asia-Pacific | Shanghai | SSE | Asia/Shanghai | 09:30–11:30, 13:00–15:00 |
| Asia-Pacific | Singapore | SGX | Asia/Singapore | 09:00–17:00 |
| Asia-Pacific | Seoul | KRX | Asia/Seoul | 09:00–15:30 |
| Asia-Pacific | Tokyo | TSE | Asia/Tokyo | 09:00–11:30, 12:30–15:30 |
| Asia-Pacific | Sydney | ASX | Australia/Sydney | 10:00–16:00 |

**Row order is deliberate:** groups run Americas → Futures → Europe → Asia-Pacific, and within Asia-Pacific rows descend by ET start time so the bars cascade leftward. Preserve it.

Two-segment entries are lunch breaks and render as two bars joined by a hairline connector.

---

## 6. Time model — the core of the page

### 6.1 The axis

**L2 unlocked (GSC7).** The axis is an **ordered list of CME trading days**, not a fixed span. Each occupying day is 18:00 → 17:00 ET (1380 minutes, `ORIGIN = 1080`). `WINDOW_DAYS` is a parameter (default 7). `SPAN = dayCount × 1380`. `toAxis = (dayIndex × 1380) + minutes`.

Weekends are not days. Friday ends Fri 17:00; Monday begins Sun 18:00. Render the gap as a **marked seam**, not axis space. Full CME closures (Christmas Day, Good Friday) likewise collapse to a seam. Thanksgiving does **not** collapse — ES trades Wed 18:00 → Thu 13:00; it keeps its place. A day occupies axis space if any tracked venue trades on it.

The list is appendable. Extending forward = push more occupying days. Lazy scroll-append is a later increment — do not build it now, do not make it impossible.

The single-day 23-hour axis blocked forward scroll. Forward scroll is the planning use.

### 6.2 Offsets

Resolve every zone's UTC offset **from the browser's IANA database for the selected date**. Do not hardcode offsets and do not model DST by hand.

````ts
function zoneOffset(tz: string, when: Date): number {   // hours east of UTC
  const s = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "longOffset" }).format(when);
  const m = s.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  if (!m) return 0;                    // bare "GMT" means UTC+0 — London in winter
  return (m[1] === "-" ? -1 : 1) * (+m[2] + (+(m[3] || 0)) / 60);
}
````

Sample the offset at **12:00 UTC on the selected date**. Never sample at midnight — DST transitions occur at ~02:00–03:00 local and midnight sampling lands on the wrong side for some zones.

The `!m` branch returning `0` is required, not defensive padding: `longOffset` emits a bare `"GMT"` for UTC+0, so London in winter fails the regex by design.

**Lima / plan L3 (Coach OD-S7, GSC0-0):** The single 12:00 UTC offset sample for the whole 23-hour window is valid for this zone set in 2026–2027 because those DST transitions fall on Sundays when these cash markets are closed. Re-derive if a zone that transitions mid-week is added. Implementation uses one sample and must not error (AT-GSC-06a/b/c). Coach’s sampling paragraph above is not deleted.

**L3 amended (GSC7):** that Sunday-closed property is **false for a 7-day window** — any week containing 2026-10-25 (London) or 2026-10-03 (Sydney) holds a transition inside it. `zoneOffset` is sampled at 12:00 UTC **per day in the list**. Coach’s per-day sampling paragraph is unchanged; the “one sample for the whole window” claim no longer applies across days.

### 6.3 Projection onto the axis

````ts
function toAxis(localMin: number, localOffH: number, etOffH: number): number {
  const etMin = localMin - localOffH * 60 + etOffH * 60;
  return ((etMin - ORIGIN) % 1440 + 1440) % 1440;
}
````

For each segment, compute `a = toAxis(start)` and `b = toAxis(end)`. **If `b <= a`, set `b = SPAN`** — the session runs past the axis edge.

Position: `left = a / SPAN * 100%`, `width = (b - a) / SPAN * 100%`.

### 6.4 Why this matters

Asia, Europe, Australia and the US run four independent DST calendars that disagree for roughly eight weeks a year. Deriving offsets per date from IANA data handles every mismatch window automatically and never needs maintenance. Any implementation that stores summer/winter offset pairs is wrong and will be rejected.

---

## 7. Market calendar module

Derive NYSE/Nasdaq/Cboe closures from rules. **No lookup table.** The module must answer correctly for any year without edits.

### 7.1 Full closures

| Holiday | Rule |
|---|---|
| New Year's Day | Jan 1, weekend-shifted — **see exception below** |
| Martin Luther King Jr. Day | 3rd Monday in January |
| Presidents' Day | 3rd Monday in February |
| Good Friday | Easter Sunday − 2 days (Gregorian computus) |
| Memorial Day | Last Monday in May |
| Juneteenth | Jun 19, weekend-shifted (observed from 2022) |
| Independence Day | Jul 4, weekend-shifted |
| Labor Day | 1st Monday in September |
| Thanksgiving | 4th Thursday in November |
| Christmas | Dec 25, weekend-shifted |

### 7.2 Weekend shift rule — get this exactly right

- Holiday falls **Sunday** → observed the following **Monday**.
- Holiday falls **Saturday** → observed the preceding **Friday**.
- **Exception:** the Saturday→Friday shift does **not** apply to New Year's Day. When Jan 1 falls on a Saturday, the NYSE is **open** on Dec 31 of the prior year. This is the single most commonly mis-implemented rule in this module.

### 7.3 Early closes (cash 13:00 ET, SPX options and ES 13:15 ET)

| Day | Rule |
|---|---|
| Independence Day eve | Jul 3, when it is a weekday **and** is not itself the observed Jul 4 holiday |
| Day after Thanksgiving | Always — the Friday following the 4th Thursday of November |
| Christmas Eve | Dec 24, when it is a weekday **and** is not itself the observed Christmas holiday |

### 7.4 Overrides

Expose an override list for unscheduled closures — national days of mourning, weather, and similar. These are not derivable. A single exported array of `{ date, kind, reason }` that takes precedence over the computed result is sufficient.

### 7.5 Public surface

````ts
type DayStatus =
  | { kind: "open" }
  | { kind: "weekend"; name: "Saturday" | "Sunday" }
  | { kind: "closed"; name: string }
  | { kind: "early";  name: string };

statusFor(isoDate: string): DayStatus
nyseHolidays(year: number): Array<{ date: string; name: string }>
earlyCloses(year: number): Array<{ date: string; name: string }>
upcomingClosures(fromIso: string, limit: number): Array<{ date: string; kind: "closed" | "early"; name: string }>
````

---

## 8. Rendering requirements

### 8.1 Chart

- Sticky left gutter, ~232px, holding the exchange name, sub-label, and the computed ET range. It must stay pinned during horizontal scroll.
- Group headings (Americas / Futures & index options / Europe / Asia-Pacific) also stay pinned to the left edge when scrolled — the heading row spans the full width, so the **inner label** is the sticky element, not the row.
- Hour gridlines every hour; axis tick labels every two hours, plus an explicit terminal tick at 17:00.
- The regular-hours band is shaded behind all rows, spanning the actual cash session for the selected date.
- Wide content scrolls inside its own container. The page body must never scroll sideways.

### 8.2 Live marker

- A vertical marker at the current New York time, rendered only when the selected date is today and the time falls inside the axis (hidden during the 17:00–18:00 halt).
- Carries a small time badge, flipped to the opposite side when within 20% of the right edge.
- Refreshes on a 20-second interval.

### 8.3 Timescale

- **Focus on now** (default): axis widened to roughly 85px/hour. The window is always scrollable.
- **Fit** means **fit the current trading day** (one 1380-minute day in the viewport), not the whole window. Fit-the-window is unreadable at 7 × 1380 minutes.
- **Auto-center on the now-line is required** on load (and on Today / date / Focus / Fit until a deliberate pan). Seven days is several screens wide; without it the page opens on nothing useful. GSC4.1: now-line always present when “now” falls on the window or on a seam, and centered.
- A deliberate user pan (wheel, pointer, touch, or key) suspends auto-centering. Re-arm on any control interaction. **Do not detect user panning via the `scroll` event** — programmatic smooth scrolling fires it and the two become indistinguishable.

### 8.4 Holiday states

- **Full closure:** US cash rows (pre-market, New York, after-hours, both SPX rows) render as a dimmed hatched strip labelled `closed`. Toronto renders normally. ES renders hatched and labelled `modified` — CME holiday schedules vary by product, so do not assert specific hours.
- **Early close:** New York → 13:00, SPX regular → 13:15, ES → 13:15. The regular-hours band shortens to match. Shifted times are marked in the warning color. Hardcoded range labels must be recomputed, not reused.
- **Weekend:** treat as closed, with a banner noting Globex reopens Sunday 18:00 ET.
- **Banner** sits above the chart in all four states, including a plain "full session" state.

### 8.5 Theming

Map the reference implementation's CSS custom properties onto **Labs design tokens**. Do not import the standalone palette. Required semantic roles:

| Role | Use |
|---|---|
| Region — Americas | Americas bars; also the page accent |
| Region — Europe | Europe bars |
| Region — Asia-Pacific | Asia-Pacific bars |
| Region — Futures | Futures and index-option bars |
| Status — closed | Closure banner and hatch |
| Status — early | Early-close banner and shifted times |
| Marker — now | Live time marker |

Both light and dark must be correct. Every color is defined at the base token level and only redefined per theme — a color whose sole definition lives inside a dark-mode block will not render for viewers on the system default.

---

## 9. Acceptance tests

These are verified values from the reference implementation. All must pass.

### 9.1 DST correctness — the mismatch windows

| Selected date | Assertion |
|---|---|
| 2026-09-08 | New York `9:30 AM – 4:00 PM`; London `3:00 AM – 11:30 AM`; Tokyo `8:00 PM – 2:30 AM`; Sydney `8:00 PM – 2:00 AM` |
| 2026-10-12 | Sydney `7:00 PM – 1:00 AM` (AU on DST, US still EDT); Tokyo unchanged at `8:00 PM`; London unchanged at `3:00 AM` |
| 2026-10-27 | London `4:00 AM – 12:30 PM` (EU off DST, US still EDT); Sydney `7:00 PM – 1:00 AM` |
| 2026-12-07 | Tokyo `7:00 PM – 1:30 AM`; Sydney `6:00 PM – 12:00 AM`; London back to `3:00 AM – 11:30 AM` |
| 2027-03-16 | London `4:00 AM – 12:30 PM` (US on DST, EU not yet); Sydney `7:00 PM – 1:00 AM` |

### 9.2 Calendar

| Assertion |
|---|
| `nyseHolidays(2026)` returns exactly: 01-01, 01-19, 02-16, 04-03, 05-25, 06-19, 07-03, 09-07, 11-26, 12-25 |
| `nyseHolidays(2027)` returns exactly: 01-01, 01-18, 02-15, 03-26, 05-31, 06-18, 07-05, 09-06, 11-25, 12-24 |
| `earlyCloses(2026)` returns exactly: 11-27, 12-24 |
| `earlyCloses(2027)` returns exactly: 11-26 |
| Good Friday resolves to 2026-04-03 and 2027-03-26 |
| `statusFor("2021-12-31").kind === "open"` — New Year's Saturday exception |
| `statusFor("2020-07-03").kind === "closed"` — Independence Day Saturday shift |
| `nyseHolidays(2031)` returns 10 dates without any table edit |

### 9.3 Holiday rendering

| Selected date | Assertion |
|---|---|
| 2026-11-26 | Banner `CLOSED` / Thanksgiving. New York and both SPX rows show `closed`. Toronto renders normally. ES shows `modified`. Regular-hours band absent. |
| 2026-11-27 | Banner `EARLY CLOSE`. New York `9:30 AM – 1:00 PM`; SPX regular `9:30 AM – 1:15 PM`; ES label reads `6:00 PM – 1:15 PM`, not the hardcoded `5:00 PM`. Band ends at 13:00. |
| 2026-09-05 | Saturday → weekend banner, US rows closed. |

### 9.4 Runtime

| Assertion |
|---|
| Zero network requests after initial page load — no `fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource` |
| No `localStorage`, `sessionStorage`, `indexedDB`, or cookie writes from this route |
| No console errors or warnings on mount, date change, or theme switch |
| Correct rendering when the viewer's own timezone is not America/New_York — the page converts, it does not assume |
| Keyboard: date field and both toggles reachable and operable, with a visible focus state |
| `prefers-reduced-motion` honored — no smooth scroll animation |

---

## 10. Definition of done

1. `/resources/sessions` renders inside the Labs shell with `Sessions` active in the Resources sub-nav.
2. All §9 tests pass on the **development machine**.
3. Deployed and re-verified on **staging (Mini Two)**.
4. Light and dark both reviewed at 1440px, 1024px, and 390px widths.
5. `marketCalendar` has unit tests and no view-layer imports.
6. Promoted to **production** — confirm whether that is Mini Two or Dude Two before deploying.

---

## 11. Notes carried from the reference implementation

Preserve these as page copy; they are correctness disclosures, not decoration.

- Daylight saving is computed per exchange from its own zone, so the four regional calendars resolve exactly, including the weeks they disagree.
- Toronto keeps the Canadian calendar and trades through most US closures; it is shown unmodified.
- Foreign closures — Lunar New Year, Golden Week, China's national holidays — are not shown and can hollow out the overnight session even when New York is open.
- The axis omits 17:00–18:00 ET because that is the CME maintenance halt.
- Morning, Afternoon, and Closing are a FatTail teaching frame on the US cash session. They are not exchange hours. Nothing at the venue changes at 12:30 or 2:30 PM.

---

## 12. FatTail Intraday Segments

**Origin:** Coach, 2026-09-09 — *"My clock should be superimposed over the US market session."*  
**Stamp:** GSC-W0 2026-09-09 · OD-S8 (a) · §12.7 defaults ACCEPTED · OD-S4 (c).

### 12.1 What this adds

The global clock renders **exchange fact**: when venues are open. This section superimposes the **FatTail teaching frame** on the US cash session — the three named segments Coach uses to divide the trading day.

Three segments, ET clock times, over the US cash session:

| Segment | ET window |
|---------|-----------|
| **Morning** | 09:30 – 12:30 |
| **Afternoon** | 12:30 – 14:30 |
| **Closing** | 14:30 – 16:00 |

Boundaries are **wall-clock times, not proportional divisions**. They do not scale.

### 12.2 The honesty requirement (Hotel)

Everything else on this chart is an exchange fact. These three segments are **a FatTail framework, not market structure**. Nothing structural happens at 12:30 or 14:30 — no auction, no settlement, no change in venue behavior.

The rendering must make that distinction visible, and §11 carries a disclosure saying so in plain words. A member who comes away believing the market itself changes gears at 12:30 has been made worse by this page, which is the exact failure Hotel's gate exists to catch.

Practically: segments render as a distinct visual layer — a labeled ribbon aligned to the RTH band — not as bars, ticks or grid lines that read like the venue rows above them. Echo owns the treatment.

### 12.3 The copy requirement (Tango)

Segment names are **descriptive of the clock, never of opportunity**. No "prime hours," no "best window," no implication that one segment carries more edge than another. Invariant 14 applies with full force here — this is the single most likely place in the page for profit theater to enter, because naming parts of the day invites ranking them.

"Afternoon" says when. It must never say whether.

### 12.4 Behavior on non-standard days

| Day | Segments |
|-----|----------|
| Normal session | All three, at the stated ET boundaries |
| **Early close (13:00)** | **Truncate, do not compress.** Morning renders whole (09:30–12:30). Afternoon renders truncated (12:30–13:00). Closing is **absent** — not shrunk, not relabeled |
| US full close (holiday) | All segments absent. The RTH band is already absent; the ribbon follows it |
| Weekend | Absent |
| Non-today date | Rendered, but with no "current segment" state |

Truncation, not compression, follows from §12.1: the boundaries are wall-clock. A member who has learned that Afternoon starts at 12:30 must see 12:30 on a half day too.

### 12.5 State — belongs to `sessionView`

`sessionView` gains, alongside banner kind and per-row state:

- `segments`: the ordered list actually rendered for the selected date, each with label, axis start, axis end, and whether it was truncated.
- `currentSegment`: which segment contains "now" — **only when the selected date is today and the US cash session is open**. Otherwise `null`. It is never inferred on a closed day, a weekend, or a past date.

Components render these. **Components do not compute segment boundaries, do not compare the clock to 12:30, and do not decide truncation** (L11, invariant 16).

Segment definitions live in a new pure module, `web/lib/sessions/segments.ts` — same purity rules as its siblings: no React, no `next/*`, proven by `npx tsx` under bare Node.

### 12.6 StatusBanner

When `currentSegment` is non-null, the banner may name it — *"Open · Afternoon"* — in Tango's copy. When null, the banner is exactly the four-state table. Naming where the member is in their own frame is the highest-value part of this section; it is also the easiest place to slip into advice, so the string set is Tango's to write and Hotel's to check.

### 12.7 Boundaries, labels, truncation — ACCEPTED

Coach 2026-09-09:

- Boundaries **09:30 / 12:30 / 14:30 / 16:00** ET.
- Labels **Morning · Afternoon · Closing** — exactly these words on screen.
- Early close **truncates**, does not compress.

### 12.8 Acceptance additions

| ID | Date | Assertion | Owner | Class |
|----|------|-----------|-------|-------|
| **AT-GSC-50** | 2026-09-08 | Three segments at 09:30 / 12:30 / 14:30 / 16:00 ET; axis positions match `toAxis` of those times | Kilo | tsx |
| **AT-GSC-51** | 2026-11-27 | Early close. Morning whole; Afternoon truncated at 13:00 and flagged truncated; **Closing absent** | Kilo | tsx |
| **AT-GSC-52** | 2026-11-26 | Thanksgiving. `segments` empty; `currentSegment` null | Kilo | tsx |
| **AT-GSC-53** | 2026-09-05 | Weekend. `segments` empty; `currentSegment` null | Kilo | tsx |
| **AT-GSC-54** | — | `currentSegment` is null on any non-today date, including a past open day | Kilo | tsx |
| **AT-GSC-55** | — | Segment ribbon is visually distinct from venue rows; §11 framework disclosure present | Echo · Tango | shot |
| **AT-GSC-56** | — | No segment label or copy implies one part of the day is better to trade | Tango | static |

### 12.9 Execution

`sessionView` closed at GSC2-G, so this is **GSC2.5** (pure), then GSC4 paints the ribbon. `timeAxis.ts` and `exchanges.ts` stay closed.

### 12.10 Naming — OD-S8 (a)

Nav label stays **`Sessions`**. L6 stands. Collision with Live Sessions and Journal Sessions is noted, not renamed.