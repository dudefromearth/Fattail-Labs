# Sessions (Global Session Clock) — Full Agent Bench Plan v1.2

**Date:** 2026-09-09  
**Plan revision:** **v1.2** (v1.1 fold review: N1 · N2 · N3 · N4 · minors)  
**Canonical filename:** `docs/Sessions-Global-Session-Clock-Full-Agent-Bench-Plan-v1.2.md`  
**v1.0 and v1.1 paths** are stub pointers — do not hash them.  
**Owner (orchestration):** Juliet  
**Authority:** Coach (GO / ship)  
**W0 artifact:** [`agents/go/GSC-W0.md`](../agents/go/GSC-W0.md) — Delta reads **this file**, not chat (**DL-328**).  
**Board:** [`agents/p-sessions/`](../agents/p-sessions/)  
**Reviews:** v1.0 Amend-before-GO (B1–B3) · v1.1 **Fold accepted, GO-ready after N1** (`agents/p-sessions/evidence/plan-v1.1-fold-review-2026-09-09.md`)  
**Governance:** [`agents/bench/doctrine.md`](../agents/bench/doctrine.md) · [`AGENTS.md`](../AGENTS.md) · spec-create-review-workflow

**Primary law:**

| Doc | Path | Status |
|-----|------|--------|
| **Sessions (Global Session Clock)** | [`Specs/FatTail-Labs-Sessions (Global Session Clock).md`](../Specs/FatTail-Labs-Sessions%20(Global%20Session%20Clock).md) | Coach **Build Spec** 2026-09-08 · **not BUILD AUTHORITY until GSC0-0** · whole-file sha1 `81984ba9f2394d52aa359cefcdb108451fdec9e3` |
| Human Interface Spec v1.0 | [`Specs/FatTail-Labs-Human-Interface-Spec-v1.0.md`](../Specs/FatTail-Labs-Human-Interface-Spec-v1.0.md) | Tokens · ≥44 pt · focus · reduced-motion |
| Resource Spec v1.0 | [`Specs/FatTail-Labs-Resource-Spec-v1.0.md`](../Specs/FatTail-Labs-Resource-Spec-v1.0.md) | Hub exists; Sessions is **not** a versioned Resource card |
| Arch 10 | [`Architecture/10-resources-design.md`](../Architecture/10-resources-design.md) | Resources hub IA (as-built route is `/resource`, not `/resources`) |
| Tag Manager §9a | Tag Manager Spec v0.2 | Resources sub-nav = Practice-style pills (`ResourcesSubNav`) |
| North star | [`Specs/FatTail-Labs-North-Star-Member-Ethos-Spec-v1.2.md`](../Specs/FatTail-Labs-North-Star-Member-Ethos-Spec-v1.2.md) | Process copy; no profit theater |

**Spec status:** Build Spec on disk. **No product code until GSC0-0 GO and GSC0-G.** Specialists execute **only** via seeds. Coordination only through **Coach** or **Juliet**.  
Delta gates: **PASS / FAIL / BLOCKED** with evidence — **never waived**.  
**Coach may overrule** a specialist finding via **DL entry with reasoning** — that is **not** a gate waive.

Coach Content Law (doctrine §11): nothing of Coach’s is removed from the Spec. Objections sit **beside** the text. Open decisions below are **not** silent edits.

### v1.1 fold (2026-09-09 review)

Nothing of the review is discarded. Plan defects amended here:

| ID | Defect | Amendment |
|----|--------|-----------|
| **B1** | GSC0-G blocked GSC1/GSC2 on `session-clock.html` | HTML is a **GSC4 entry condition only**. GSC0-G records OD-S4 as a carried block. OD-S4 **(c)** reconstruct-from-Spec |
| **B2** | §8.3 ATs had no module | `web/lib/sessions/sessionView.ts` created in **GSC2-view**. AT-GSC-20/21/22 are tsx against a pure function |
| **B3** | AT-GSC-30 vs `/api/auth/me` | Measurement window pinned: after auth leaves `loading`; `/api/auth/me` only, **exactly once** |
| **S1** | AT-GSC-02 is Canadian Thanksgiving | Pin Toronto normal-open + §11 disclosure on that date |
| **S2** | Single-offset-per-day unstated | L3 note + AT-GSC-06; OD-S7 Spec one-liner beside §6.2 |
| **S3** | No July-3 early-close year | AT-GSC-18 · 2028-07-03 in GSC0-2 |
| **S4** | AT-GSC-17 / 41 mixed test + review | Split 17a/17b · 41a/41b |
| **S5** | GSC1-G grep too weak | Primary: `npx tsx` under bare Node (no DOM). Grep secondary |
| **S6** | DoD row 1 hardcoded `/resources/sessions` | Stamped path only |
| **S7** | No now-line cleanup AT | AT-GSC-36 |
| **M1–M5** | allowlist DL · CSR · rollback · parallel write trees · invariant 5 wording | Folded below |

Independent recompute of §8.1–§8.2: **zero errors**. TSE close is **15:30** (post-Nov-2024) — pin in GSC2-0, not only in the AT.

### v1.2 fold (2026-09-09 fold review)

| ID | Defect | Amendment |
|----|--------|-----------|
| **N1** | `GSC2-axis-G` cited, does not exist | **(a)** Dropped. GSC2-view **must not write** `timeAxis.ts` / `exchanges.ts` at all. Single gate remains **GSC2-G** |
| **N2** | AT-GSC-06 only US spring-forward | Split **06a / 06b / 06c**. Assertion: one 12:00 UTC sample for the whole window; **does not error**. Not “no split exists” |
| **N3** | AT-GSC-30 vs Next.js chunks/RSC | Application requests only. No `next/dynamic` / dynamic `import()` in the Sessions **route tree** (AT-GSC-41c) |
| **N4** | Override array vs “no holiday table” | Override = **unscheduled only**, ships **empty**. Intersection with rules dates is a FAIL (AT-GSC-19 · GSC6-2) |
| **m1** | `sessionView` cited to Spec §8.4 | Cite **plan §7 GSC2-2 · review B2** |
| **m2** | Early-close hours unowned | GSC2-2: derived per-exchange from the cash early close, not stored per date |
| **m3** | §13 mixed Coach ticks with fold assertions | Split: Coach decides / Juliet asserts |
| **m4** | AT-GSC-36 class `pw / unit` | Locked **`pw`** |
| **m5** | AT-GSC-22 is Labor Day weekend | Keep the date; Tango copy must not imply an unmodified Monday after Globex Sunday 18:00 |

---

## 0. Mission (one screen)

Ship a **read-only** Labs page that answers *what is trading right now, and what opens next* on **one CME trading day** (18:00 → 17:00 ET), with IANA-derived offsets and a **rules-derived** NYSE calendar.

```text
Resources suite pill "Sessions"
  → stamped path (OD-S1)
      → SessionControls (date · Today · Focus/Fit)
      → StatusBanner (open / early / closed / weekend)
      → SessionMap (sticky gutter · 23-hour axis · bars · now-line)
      → ClosuresList
      → §11 disclosures
```

| Pillar | Spec | Ship meaning |
|--------|------|----------------|
| Placement | §3 | Child of **Resources**, label exactly `Sessions` |
| Time model | §6 | `SPAN = 1380`, `ORIGIN = 1080`; IANA offset at **12:00 UTC** on the selected date |
| Calendar | §7 | Rules, not a table. New Year's **Saturday exception** is law |
| View-model | plan §7 GSC2-2 · review B2 | `sessionView`: calendar × exchange row → banner kind, per-row state, band end |
| Chart | §8 | Sticky gutter ~232px; no page-body sideways scroll; Focus/Fit; 20s now-line |
| Honesty | §11 | Four DST calendars; Toronto unmodified; foreign holidays omitted; CME halt |
| Zero I/O | §1 · §9.4 | No persist, no server SoR, no market data. After auth resolves: `/api/auth/me` once, then zero network |

**First smoke after GSC1 + GSC2 + GSC3 + GSC4:**  
(1) Resources pills include **Sessions**; it is the active child on the page.  
(2) 2026-09-08 New York / London / Tokyo / Sydney ET ranges match §9.1.  
(3) `statusFor("2021-12-31").kind === "open"`.  
(4) Thanksgiving 2026-11-26: US cash `closed`, Toronto live, ES `modified`.  
(5) After auth resolves: `/api/auth/me` exactly once; then zero network; zero storage writes.

---

## 1. As-built honesty (2026-09-08, this checkout)

### 1.1 Keep (do not rebuild)

| Area | Path | Note |
|------|------|------|
| Resources hub | `web/app/resource/page.tsx` · `ResourcesPageClient.tsx` | Public SEO collection at **`/resource`** (singular) |
| Resources pills | `web/components/resources/ResourcesHub.tsx` `ResourcesSubNav` | In-page tabs **Library \| Tags** — Practice pill chrome, **not** Links |
| Practice nav (pattern only) | `web/components/practice/PracticeSuiteNav.tsx` · `web/lib/practiceSuite.ts` | **Import the pattern. Do not edit Practice.** |
| Design tokens | `web/styles/tokens.css` | Semantic only; light `:root` + dark. **Additive** region tokens in GSC5 |
| Member sign-in gate | `/app/trade-log` `state === "anon"` → `/login` | Lowest authenticated guard. **Reuse. No new policy.** Client-rendered. |
| Unit test runner | `npx --yes tsx path/to/file.test.ts` + `node:assert/strict` | Existing (e.g. `web/lib/ikiSuite.test.ts`). **No Vitest.** Bare Node, no DOM. |
| Playwright | `web/e2e/` | GSC5 runtime + GSC4 screenshot geometry only |
| Redis / Market Bus / OPF | Arch 28 · OPF | **Out.** This page has no live quotes |

### 1.2 Build (this program)

| Gap | Spec | Phase |
|-----|------|--------|
| Spec GO · OD-S* · sha1 in DL | §10 · §0 | **GSC0** |
| `marketCalendar` pure module + §9.2 | §7 | **GSC1** |
| `zoneOffset` / `toAxis` / exchanges + §9.1 | §5–§6 | **GSC2-axis** (∥ GSC1) |
| `sessionView` + §8.3 ATs as tsx | plan §7 GSC2-2 · review B2 | **GSC2-view** (after GSC1-G) |
| Route · Resources child · title · auth · **CSR** | §3 | **GSC3** |
| Chart · controls · now-line · copy · hatch | §8 · §11 | **GSC4** (OD-S4 entry) |
| Tokens both themes · a11y · runtime · three widths | §8.5 · §9.4 · §10.4 | **GSC5** |
| Staging Mini Two · prod host confirm · rollback · DL · close | §0 · §10.3 · §10.6 | **GSC6** |

### 1.3 Conflicts Coach must dispose (not Juliet)

These are **on disk today**. They are not plan law until GSC0-0.

| ID | Coach wrote | As-built | Why it cannot be silently “fixed” |
|----|-------------|----------|-----------------------------------|
| **OD-S1** | Route `/resources/sessions` | Hub is `/resource` (singular). Arch 10 also says `/resources`. Appearance allowlist has `/resources`, not `/resource`. | Spec §3.4 says discover and **conform**. Spec §3.3 names a **literal path**. Both sentences stay. |
| **OD-S2** | “Child item” of Resources menu | `ResourcesSubNav` is **buttons/tabs**, not suite Links | Sessions is a full page. Promoting Tags to a route is extra scope. |
| **OD-S3** | Authenticated, Observer included, no tier gate | Hub `/resource` is **public SEO** | A member-only child on a public hub. Pill visibility vs route guard. |
| **OD-S4** | Reference `session-clock.html` (37 KB) | **Not in this repo**, Desktop, Downloads, or home (2026-09-08 search) | Charlie cannot port a file that is not pinned. **Not a GSC0-G stop.** |
| **OD-S0** | Filename `FatTail-Labs-Sessions (Global Session Clock).md`, no version, no BUILD header | Specs/ law is versioned `*-Spec-vX_Y.md` | Do not delete Coach’s file. Versioning is a GO tick. |

### 1.4 Neighbor boards (India artifact-quote required)

This program **does not assert** another board’s PASS/FAIL. Isolation:

| Neighbor | Assertion | Quote |
|----------|-----------|--------|
| `p-resources` | CLOSED v1.0 | `agents/p-resources/ORCHESTRATOR.md`: “Project status: **CLOSED (v1.0)**” · close gate `gate-reports/R7-project-close.md` |
| `p-tag-manager` | Resources pills exist (Library \| Tags) | As-built `ResourcesSubNav` in `web/components/resources/ResourcesHub.tsx` — **read**; this board **adds** a Sessions child, does not reopen Tag Manager |
| Options Lab / Runner / Market Bus / Quant / LIM | **Frozen (DL-539)** | Not in the allowlist. No three-OK. Do not open those trees. |

Shared file named: **`web/styles/tokens.css`** — Echo **adds** session region/status tokens at `:root` **and** dark. No other board owns those names today. Overlap is additive tokens only.

---

## 2. Product locks (law at GSC0-0 — provisional until then)

These are **Coach’s Spec**. They become L-locks when the GO token is ticked. Until then, seeds must call them **provisional**.

| ID | Lock | Spec |
|----|------|------|
| **L1** | Read-only reference. No persist, no server SoR, no live quotes | §1 · §2 out |
| **L2** | Axis is **one CME day** 18:00→17:00 ET. `SPAN=1380`, `ORIGIN=1080`. Not a calendar day | §6.1 |
| **L3** | Offsets from the **browser IANA** database, sampled at **12:00 UTC** on the selected date. Bare `"GMT"` → `0`. No stored UTC-offset summer/winter pairs. **One sample per selected date** is sound for *this* zone set because 2026–2027 DST transitions fall on Sundays when these markets are closed — a property of the zone set, not a general construction. Re-derive if a mid-week-transition zone is added | §6.2 · §6.4 · review S2 |
| **L4** | NYSE/Nasdaq/Cboe calendar from **rules**. Saturday→Friday **does not** apply to New Year's Day. The override array holds **unscheduled** closures only (state funeral, weather). It **ships empty**. A rules-derivable date in the override array is a FAIL, not a fix | §7.2 · §7.4 · review N4 |
| **L5** | Row order Americas → Futures → Europe → Asia-Pacific; APAC descending by ET start. **TSE regular close is 15:30** (post-Nov-2024). 15:00 is wrong | §5 |
| **L6** | Sub-nav label **`Sessions`** — exactly, no suffix. Title uses the existing Labs template | §3 |
| **L7** | US full close: cash rows `closed`; Toronto **unmodified**; ES `modified` (do not invent hours) | §8.4 |
| **L8** | Foreign holidays omitted **and disclosed**. Toronto Canadian calendar disclosed | §2 · §11 |
| **L9** | `marketCalendar` **and** `web/lib/sessions/*` are **pure** modules: no view-layer imports; reusable. Proven by `npx tsx` under bare Node | §4 |
| **L10** | Do not detect user pan via the `scroll` event | §8.3 |
| **L11** | Per-row holiday state and banner kind are computed only in `sessionView`. Components do not re-derive them | plan §7 GSC2-2 · review B2 |

**Juliet recommendations (Coach disposes at the same stamp; default if silent = recommended):**

| Rec | Default if Coach silent at GO |
|-----|-------------------------------|
| **JR1** | Implemented path **`/resource/sessions`**. Spec’s `/resources/sessions` remains Coach text; do not also invent `/resources`. Redirect optional **only** if Coach ticks it. |
| **JR2** | Sessions is a **Link** pill. Library \| Tags stay in-page tabs on `/resource`. **Do not** promote Tags to a route. |
| **JR3** | Unauthenticated: existing **sign-in** prompt (Trade Log pattern). Sessions pill **hidden** when anonymous. No new membership slug. Observer trial uses existing `access_role` elevation. |
| **JR4** | `marketCalendar` at `web/lib/marketCalendar/`. Time-axis, exchanges, **`sessionView`** at `web/lib/sessions/`. Page/components under the stamped path + `web/components/resources/sessions/`. |
| **JR5** | Tests: `npx tsx` + `node:assert/strict` under **bare Node** (no DOM). No new runner. Playwright for GSC5 runtime and GSC4 geometry screenshots only. |
| **JR6** | **Do not** add Sessions to `SiteHeader` `NAV`. Do not add a new `ALLOWED_MEMBER_HREFS` top-level unless Mike GSC0-6 names it as required (then one-line Alpha, still not a policy). |
| **JR7** | Region/status tokens `--color-session-*` defined on `:root` **and** redefined in dark. Never dark-only. |
| **JR8** | OD-S4 **(a)** pin HTML before GSC4, **or (c)** reconstruct from Spec with Echo owning the visual contract. GSC1/GSC2 do not wait. |
| **JR9** | Guide + `server/help_reference/sessions.md` at GSC6 (docs-parity). Spec DoD does not name them — **skip** if Coach ticks skip. |
| **JR10** | Alpha **not seated**. No migration. No API. |
| **JR11** | AT-GSC-30 window (B3 + N3 wording below) is GO law. |
| **JR12** | Override array ships empty; unscheduled only (N4). |

---

## 3. Open decisions (OD-S*) — Coach Accept / Override at GSC0-0

| # | Question | Spec / Juliet recommendation |
|---|---------|------------------------------|
| **OD-S0** | Spec filename / BUILD header | Keep Coach file. At GO, Lima records sha1 + **BUILD AUTHORITY** in DL. Optional pointer `Specs/FatTail-Labs-Sessions-Global-Session-Clock-Spec-v0_1.md` **without deleting** the original. |
| **OD-S1** | URL | **(a) recommended:** `/resource/sessions`. **(b)** literal `/resources/sessions`. **(c)** both with redirect from the unused one. |
| **OD-S2** | Nav shape | **(a) recommended:** Sessions = Link; Library/Tags stay tabs. **(b)** promote all three to Links (`/resource`, `/resource/tags`, sessions). |
| **OD-S3** | Auth vs public hub | **(a) recommended:** route gated; pill hidden when anonymous. **(b)** pill always visible, page still gated. |
| **OD-S4** | Reference HTML | **(a)** pin path+sha1 under `docs/evidence/sessions/` before GSC4. **(c) recommended if file is gone:** reconstruct from Spec; Echo owns the visual contract; GSC4-1 is a longer pass. **(stop)** is also lawful. GSC1/GSC2 **do not wait.** |
| **OD-S5** | Help / Guide | **(a) recommended:** short Guide + help_reference at GSC6. **(b)** skip; Spec DoD does not require it. |
| **OD-S6** | Production host | Foxtrot **confirms** Mini Two vs Dude Two from **DL-683 / DL-684** at GSC6. Not a product OD — an ops tick. Staging first, always. |
| **OD-S7** | Spec one-liner for L3 | **(a) recommended:** Lima places one sentence **beside** Spec §6.2 at stamp: the 12:00 UTC sample is valid for this zone set because 2026–2027 transitions fall on Sundays when these markets are closed. Do not delete Coach text. **(b)** plan-only; Spec unchanged. |

Juliet does **not** pick (a)/(b)/(c). The GO token has the ticks.

**AT-GSC-30 window (GO law — B3 · N3):**  
*AT-GSC-30 measures from the moment the auth state resolves to a non-`loading` value. **Application** requests only: `/api/auth/me` is the only permitted application request and must fire exactly once. Framework chunk loads and RSC payloads are excluded from the count.* Date change must not re-fire `/api/auth/me`.  
*The Sessions route tree (stamped page + `web/components/resources/sessions/`) has no `next/dynamic` and no dynamic `import()`* — AT-GSC-41c. That keeps the exclusion narrow.

---

## 4. Roster & seating

### 4.1 Authority & orchestration

| Callsign | Role |
|----------|------|
| **Coach** | GSC0-0 GO · OD-S* · JR* · ship / no-ship · prod host confirm |
| **Juliet** | Board · seeds · DAG — **never executes packets** |
| **India** | Spec integrity · route vs as-built · L9 purity (41b · 17b) · DL-539 allowlist · hash procedure · neighbor quotes |

### 4.2 Platform execution

| Callsign | Role |
|----------|------|
| **Charlie** | Calendar · time-axis · `sessionView` · page · chart · nav child · runtime |
| **Echo** | Tokens · sticky gutter · Focus/Fit · hatch · light/dark · 1440/1024/390 · reduced-motion · OD-S4(c) visual contract if ticked |
| **Foxtrot** | **GSC6 only** — staging Mini Two, then production host named in writing, rollback named |
| **Mike** | W0: existing auth guard only. No new policy. Appearance allowlist only if required |

**Alpha is not seated.** No schema, no route on the API, no entitlement table.

### 4.3 Quality, member, trading, memory

| Callsign | Role |
|----------|------|
| **Delta** | All gates; ternary; evidence class per AT (tsx vs grep vs screenshot vs Playwright) |
| **Kilo** | AT-GSC-* · tsx suites · runtime no-fetch · timer cleanup |
| **Hotel** | NYSE rules vs §9.2 + **2028 Jul-3 early close**; Good Friday computus; New Year's Saturday; ES `modified` honesty; TSE 15:30 |
| **Tango** | Banner / disclosure copy; AT-GSC-02 Toronto instance; no “opportunity” language |
| **Lima** | DL at GO and close; Spec status; OD-S7 beside-note; `/resource` vs `/resources` known-divergence DL; optional Guide / help |

### 4.4 Not seated

Golf · Quebec/Bravo/November/Romeo/Papa · Sierra (member-only page, no public catalog claim) · Victor / Whiskey / Yankee unless Coach asks a lineage pass. **Sierra seats only if OD-S3 makes the page public.**

---

## 5. Sacred invariants (all seeds)

1. **Standalone repo** — no MSC imports.  
2. **No live market data** — no Massive, no Market Bus, no OPF chain, no WebSocket.  
3. **No persist** — no `localStorage` / `sessionStorage` / IDB / cookie writes from this route.  
4. **No server SoR** — the page computes in the browser.  
5. **IANA, not offset tables** — any stored **UTC-offset** summer/winter pair is a FAIL. **Local-time session constants are permitted** (08:00 LSE, 09:00/15:30 TSE). Only UTC-offset pairs are forbidden.  
6. **Calendar from rules** — any holiday lookup table is a FAIL. The override array is **not** a rules table: it holds **unscheduled** closures only, ships **empty**, and must not contain a date `nyseHolidays`/`earlyCloses` would already produce.  
7. **New Year's Saturday exception** — `2021-12-31` is **open**.  
8. **CME axis** — do not “fix” it to midnight–midnight.  
9. **Toronto unmodified** on US closures **and** on Canadian holidays this page does not model.  
10. **ES `modified`** — do not invent Globex hours on a US holiday.  
11. **DL-539** — do not touch Options Lab / Runner / Market Bus / Quant / LIM.  
12. **Change control** — seed lists files before touch. `git diff --stat` ⊆ allowlist.  
13. **Evidence over assertion.** No waived Delta gates.  
14. **Process copy** — no profit / “best session to trade” theater (Tango).  
15. **Machines** — Spec §0. Dev here. Staging Mini Two. Production only after Foxtrot names the live host. Never Dude One.  
16. **`sessionView` is the only SoR** for per-row holiday state and banner kind.

---

## 6. Critical path

```text
GSC0  Spec lock · OD-S*   (HTML is NOT a GSC0-G condition)
  → GSC1  marketCalendar + §9.2                     ─┐  write tree: web/lib/marketCalendar/
  → GSC2-axis  time-axis + exchanges + §9.1          ─┘  write tree: web/lib/sessions/{timeAxis,exchanges}.ts
  → GSC2-view  sessionView + §8.3 tsx   (after GSC1-G; writes sessionView.ts only)
  → GSC2-G
  → GSC3  route + Resources child + auth (CSR shell; chart may be stub)
  → GSC4  chart + controls + hatch + §11 copy     (OD-S4 entry)
  → GSC5  tokens both themes · a11y · runtime · three widths
  → GSC6  staging · prod host · rollback · DL · close
```

**Parallelism (GSC1 ∥ GSC2-axis):** two concurrent Charlie instances **are allowed**. They must not share a write tree:

| Instance | May write | Must not write |
|----------|-----------|----------------|
| GSC1 | `web/lib/marketCalendar/` only | `web/lib/sessions/` |
| GSC2-axis | `web/lib/sessions/timeAxis.ts`, `web/lib/sessions/exchanges.ts` | `web/lib/marketCalendar/`, `sessionView.ts` |
| GSC2-view | `web/lib/sessions/sessionView.ts` (+ its tests) | `web/lib/marketCalendar/`; **`timeAxis.ts` / `exchanges.ts` — full stop (N1)** |

Sequential Charlie (one instance, GSC1 then GSC2-axis then GSC2-view) is also lawful. Independent gates still apply. The DAG’s schedule benefit is optional; the write-tree split is not.

**GSC3 must not paint bars** until GSC2-G. Shell + nav may land.  
**GSC4 entry:** OD-S4 **(a)** sha1 on the board **or** OD-S4 **(c)** Echo visual-contract note on the board. Missing HTML does **not** fail GSC0-G.

```text
GSC0-G ─┬─ GSC1-G ──────────────┐
        └─ GSC2-axis ───────────┴─ GSC2-view ─ GSC2-G ─ GSC3-G ─ GSC4-G ─ GSC5-G ─ GSC6-G
```

---

## 7. Phases, seeds, gates

### GSC0 — Program lock (no product code)

| Seed | Agent | Intent |
|------|-------|--------|
| **GSC0-0** | **Coach** | Stamp `agents/go/GSC-W0.md`: GO / Amend / Stop · OD-S0…S7 · JR1–12 |
| **GSC0-1** | **India** | Spec vs as-built; L-locks provisional until stamp; hash procedure; neighbor quotes; allowlist; `india-checklist.md` |
| **GSC0-2** | **Hotel** | Independently recompute §9.2 (2026, 2027, **2028**, 2031, 2021-12-31, 2020-07-03). **2028-07-03 is a 13:00 early close** (Jul 4 Tuesday). Confirm Good Friday computus. TSE **15:30**. Write `hotel-calendar.md`. **Block** if Spec dates are wrong — do not silently “fix” the Spec; flag beside Coach text |
| **GSC0-3** | **Echo** | Token map for §8.5 roles; sticky gutter; Focus/Fit; hatch; reduced-motion; 1440/1024/390 notes. If OD-S4(c) likely: name the visual contract Echo will own. `echo-ia.md` |
| **GSC0-4** | **Tango** | Banner strings, §11 disclosures, ClosuresList tone. **AT-GSC-02 instance:** Toronto normal-open on 2026-10-12 (Canadian Thanksgiving) + disclosure copy. **AT-GSC-22 instance:** 2026-09-05 is the Saturday before Labor Day (Mon 2026-09-07). Globex Sunday 18:00 ET is true; copy must **not** imply an unmodified Monday cash/futures session. No “best hours to trade.” `tango-copy.md` |
| **GSC0-5** | **Charlie** | Feasibility: file tree (JR4), **`sessionView.ts`**, nav extension, CSR auth reuse (`/api/auth/me` once), locate `session-clock.html`. Missing HTML → record for OD-S4, **do not block GSC0**. `charlie-feasibility.md`. No code |
| **GSC0-6** | **Mike** | Confirm existing session cookie + `/api/auth/me` is enough. Observer trial via `access_role`. No new policy. Appearance allowlist: only if OD-S1 path is not already covered as a child of `/resource`. `mike-boundary.md` |
| **GSC0-7** | **Kilo** | Lock AT-GSC matrix (§8 of this plan) into `characterization-list.md`. Name **evidence class** per AT: tsx / grep / Playwright / screenshot / static. GSC2 evidence **must** include `TZ=UTC` and `TZ=Asia/Tokyo` |
| **GSC0-8** | **Juliet** | After GO: materialize GSC1–GSC6 seeds from this plan §7. Board NEXT = GSC1 ∥ GSC2-axis |
| **GSC0-9** | **Lima** | DL draft for GO (sha1, BUILD AUTHORITY, OD ticks). OD-S7 beside-note draft. Language: **ratified for build**, not “shipped” |
| **GSC0-G** | **Delta** | Ternary: GO token stamped · reviews on disk · AT list locked · **OD-S4 recorded as a carried GSC4 block** (a, c, or stop). Unlock GSC1 / GSC2-axis |

**Out of scope:** Implementation. MiniTwo. DudeTwo. Options Lab.

**GSC0-G cannot PASS if:** GO token unticked · L-locks cited as stamped before GSC0-0.  
**GSC0-G does not fail** because `session-clock.html` is missing. That is GSC4.

---

### GSC1 — `marketCalendar` (pure)

| Seed | Agent | Intent |
|------|-------|--------|
| **GSC1-0** | **Charlie** | `web/lib/marketCalendar/` — `statusFor` · `nyseHolidays` · `earlyCloses` · `upcomingClosures` · override array. Override **ships empty**; unscheduled only (L4 · N4). **Zero React / Next imports.** Weekend-shift + New Year's exception exact |
| **GSC1-1** | **Kilo** | tsx tests AT-GSC-10…16, **17a**, **18**, **19a**. Run `npx tsx` under bare Node |
| **GSC1-2** | **Hotel** | Golden match to `hotel-calendar.md`. FAIL on any date drift |
| **GSC1-G** | **Delta** | Module exists; tests green under bare Node (**primary L9 evidence**). Grep for year-table literals is **secondary** (AT-GSC-17b lands at GSC6-2 / India, may run here as a note) |

**Out of scope:** UI, time-axis, nav, `sessionView`.

---

### GSC2 — Time model, exchanges, view-model (pure)

| Seed | Agent | Intent |
|------|-------|--------|
| **GSC2-0** | **Charlie** | `zoneOffset` (Spec §6.2 **verbatim including `!m → 0`**), `toAxis`, `SPAN`/`ORIGIN`, wrap `b <= a → b = SPAN`. Exchange table §5 **row order preserved**. **TSE close 15:30** (not 15:00). Two-segment lunch as two intervals. Files: `timeAxis.ts`, `exchanges.ts` only |
| **GSC2-1** | **Kilo** | tsx tests AT-GSC-01…05, **06a**, **06b**, **06c**. **ET range strings**, not just minutes. `TZ=UTC` and `TZ=Asia/Tokyo`. Assertion: one 12:00 UTC sample for the window; **does not error** |
| **GSC2-2** | **Charlie** | **`sessionView.ts`** — depends on **GSC1-G**. Input: iso date + calendar status + exchange table. Output: banner kind, per-row state (`open` / `closed` / `modified` / early-shifted labels), RTH band end (or absent). **Early-close row times are derived per-exchange from the cash early close (13:00 ET), not stored per date** (SPX regular / ES → 13:15). **Must not write** `timeAxis.ts` / `exchanges.ts`. **Zero React** |
| **GSC2-3** | **Kilo** | tsx AT-GSC-20, 21, 22, and AT-GSC-02 Toronto-normal + disclosure flag. Bare Node |
| **GSC2-G** | **Delta** | Axis tests green under two process TZs. View-model tests green. No hardcoded UTC offsets. `npx tsx` of `web/lib/sessions/*.test.ts` is the purity proof |

**Out of scope:** UI. Calendar module writes (GSC1).

---

### GSC3 — Route, nav, entitlement, shell

| Seed | Agent | Intent |
|------|-------|--------|
| **GSC3-0** | **Charlie** | Page at the **stamped** path. **Client-rendered** member route (`"use client"`) — not SSG / not `revalidate`. `<title>` `Sessions` in the existing template. Lift `ResourcesSubNav` so the Sessions child is a Link (OD-S2). Active state when on the sessions route. Auth gate (OD-S3). `/api/auth/me` **exactly once**. **No `next/dynamic` and no dynamic `import()`** in this page. Chart may be a labelled stub |
| **GSC3-1** | **Echo** | Chrome review: pill placement, focus rings, hit target ≥44 pt |
| **GSC3-2** | **Mike** | Confirm no new policy landed. If allowlist edit was required, it is the one line named in GSC0-6 |
| **GSC3-G** | **Delta** | Browser evidence: signed-in member sees Sessions active; anonymous hits the stamped gate; Library/Tags still work on `/resource` |

**Out of scope:** Bar geometry, holiday hatch, now-line. **No paint of session bars.**

---

### GSC4 — Chart, controls, copy, hatch

| Seed | Agent | Intent |
|------|-------|--------|
| **GSC4-0** | **Charlie** | Render `sessionView` output: `SessionMap` · `SessionControls` · `StatusBanner` · `ClosuresList`. Sticky gutter; group-heading inner label sticky; hour grid + 17:00 tick; RTH band from view-model; Focus/Fit; pan suspend **not** via `scroll`; now-line 20s, hidden in 17:00–18:00 halt and on non-today; badge flip at 20% from right; lunch hairline; **recomputed** labels (not hardcoded `5:00 PM` on ES). Interval must be clearable (AT-GSC-36). **No `next/dynamic` and no dynamic `import()`** in `web/components/resources/sessions/` |
| **GSC4-1** | **Echo** | Visual pass vs reference **or** vs OD-S4(c) contract + HIG. Hatch, warning color for shifted times, band shortening, sticky gutter, band geometry |
| **GSC4-2** | **Tango** | Wire §11 disclosures and banner copy from `tango-copy.md`, including the 2026-10-12 Toronto instance |
| **GSC4-3** | **Kilo** | Screenshot / Playwright **geometry only** (hatch, color, sticky, band). Row-state ATs already passed in GSC2-3 — do not re-gate them as screenshots |
| **GSC4-G** | **Delta** | Geometry evidence on the **development machine**. View-model already green |

**GSC4 entry condition (not GSC0-G):** OD-S4 **(a)** `docs/evidence/sessions/session-clock.html` sha1 on the board, **or** OD-S4 **(c)** Echo visual-contract note on the board. If neither: **BLOCKED**, not a waived gate.

---

### GSC5 — Theme, a11y, runtime, widths

| Seed | Agent | Intent |
|------|-------|--------|
| **GSC5-0** | **Echo** | Map §8.5 roles onto tokens (JR7). Light **and** dark. Review 1440 / 1024 / 390. `prefers-reduced-motion: reduce` → **no smooth scroll** |
| **GSC5-1** | **Charlie** | Keyboard: date field + both toggles reachable, visible focus. Horizontal scroll **inside** the chart container only. Timer cleanup |
| **GSC5-2** | **Kilo** | AT-GSC-30 (B3 window) · 31 · 32 · 33 · 34 · 35 · **36**. Date change must not re-fetch `/api/auth/me` |
| **GSC5-G** | **Delta** | §9.4 + §10.4 evidence pack. AT-GSC-30 uses the stamped window — do not argue it at the gate |

---

### GSC6 — Staging, docs, production, close

| Seed | Agent | Intent |
|------|-------|--------|
| **GSC6-0** | **Foxtrot** | Deploy **staging (Mini Two)** first. Re-run AT pack. **Write the live production hostname** (Mini Two or Dude Two — DL-683/684; Spec §0). Promote only after staging PASS. **Not** Dude One. **Rollback:** prior build reference + launchd restart path per `infra/deploy.md`, named in the gate report before promote |
| **GSC6-1** | **Lima** | DL close · Spec as-built note · AGENTS.md row · Arch 10 one-line (Sessions child) · Guide / help if OD-S5 (a) · **known divergence DL:** appearance allowlist `/resources` vs as-built `/resource` (not repaired this ship) · OD-S7 beside-note if ticked |
| **GSC6-2** | **India** | Diff ⊆ allowlist; AT-GSC-17b · 19b · 41b · **41c**. Spec hash unchanged unless OD-S0 pointer |
| **GSC6-G** | **Delta** | Program PASS. DoD §14 |

---

## 8. Acceptance pack (Delta-checkable)

IDs are this plan’s. Spec §9 text is the **oracle**. Do not drop a Spec row.

**Evidence classes:** `tsx` = `npx tsx` bare Node · `grep` = static · `pw` = Playwright · `shot` = screenshot · `ops` = Foxtrot log.

### 8.1 DST (Spec §9.1) — GSC2-axis

| ID | Date | Assertion | Owner | Class |
|----|------|-----------|-------|-------|
| **AT-GSC-01** | 2026-09-08 | NY `9:30 AM – 4:00 PM`; London `3:00 AM – 11:30 AM`; Tokyo `8:00 PM – 2:30 AM`; Sydney `8:00 PM – 2:00 AM` | Kilo | tsx |
| **AT-GSC-02** | 2026-10-12 | Sydney `7:00 PM – 1:00 AM`; Tokyo `8:00 PM`; London `3:00 AM`. **Toronto renders normal-open; §11 foreign-holiday disclosure present** (Canadian Thanksgiving — known omission, pinned) | Kilo · Tango | tsx |
| **AT-GSC-03** | 2026-10-27 | London `4:00 AM – 12:30 PM`; Sydney `7:00 PM – 1:00 AM` | Kilo | tsx |
| **AT-GSC-04** | 2026-12-07 | Tokyo `7:00 PM – 1:30 AM`; Sydney `6:00 PM – 12:00 AM`; London `3:00 AM – 11:30 AM` | Kilo | tsx |
| **AT-GSC-05** | 2027-03-16 | London `4:00 AM – 12:30 PM`; Sydney `7:00 PM – 1:00 AM` | Kilo | tsx |
| **AT-GSC-06a** | 2026-03-08 | US spring-forward **Sunday**. One 12:00 UTC sample for the whole window; **does not error**; banner weekend/closed | Kilo | tsx |
| **AT-GSC-06b** | 2026-10-25 | London DST-end **Sunday** (transition 2026-10-24 21:00 ET). London offset from the 12:00 UTC sample; **does not error**; banner weekend/closed | Kilo | tsx |
| **AT-GSC-06c** | 2026-10-03 | Sydney DST-start **Saturday**, transition 12:00 ET **mid-window**. One sample for the window; **does not error**; banner weekend/closed | Kilo | tsx |

Tokyo assertions require **TSE 15:30**. A 15:00 close fails every Tokyo row by 30 minutes.

### 8.2 Calendar (Spec §9.2) — GSC1

| ID | Assertion | Owner | Class |
|----|-----------|-------|-------|
| **AT-GSC-10** | `nyseHolidays(2026)` exactly 01-01, 01-19, 02-16, 04-03, 05-25, 06-19, 07-03, 09-07, 11-26, 12-25 | Kilo · Hotel | tsx |
| **AT-GSC-11** | `nyseHolidays(2027)` exactly 01-01, 01-18, 02-15, 03-26, 05-31, 06-18, 07-05, 09-06, 11-25, 12-24 | Kilo · Hotel | tsx |
| **AT-GSC-12** | `earlyCloses(2026)` exactly 11-27, 12-24 | Kilo · Hotel | tsx |
| **AT-GSC-13** | `earlyCloses(2027)` exactly 11-26 | Kilo · Hotel | tsx |
| **AT-GSC-14** | Good Friday 2026-04-03 and 2027-03-26 | Kilo · Hotel | tsx |
| **AT-GSC-15** | `statusFor("2021-12-31").kind === "open"` | Kilo · Hotel | tsx |
| **AT-GSC-16** | `statusFor("2020-07-03").kind === "closed"` | Kilo · Hotel | tsx |
| **AT-GSC-17a** | `nyseHolidays(2031)` returns **10** dates | Kilo | tsx |
| **AT-GSC-17b** | Module has **no** year table — grep `20\d\d-\d\d-\d\d` literals **outside** `*.test.ts` | India | grep |
| **AT-GSC-18** | `earlyCloses(2028)` is exactly `07-03`, `11-24` — Jul 4 2028 is Tuesday, so Jul 3 Monday is a 13:00 close | Kilo · Hotel | tsx |
| **AT-GSC-19a** | Override array **ships empty** (length 0 in the shipped module) | Kilo | tsx |
| **AT-GSC-19b** | Every override entry (if any ever added) ∩ `nyseHolidays`/`earlyCloses` for the same year is empty — a rules-derivable date in override is a FAIL | India | grep |

### 8.3 Holiday rendering (Spec §9.3) — GSC2-view (tsx) + GSC4 (geometry)

| ID | Date | Assertion | Owner | Class |
|----|------|-----------|-------|-------|
| **AT-GSC-20** | 2026-11-26 | Banner CLOSED / Thanksgiving. NY + both SPX `closed`. Toronto normal. ES `modified`. RTH band absent | Kilo | tsx (`sessionView`) |
| **AT-GSC-21** | 2026-11-27 | Banner EARLY CLOSE. NY `9:30 AM – 1:00 PM`; SPX regular `9:30 AM – 1:15 PM`; ES `6:00 PM – 1:15 PM` **not** hardcoded 5:00 PM. Band ends 13:00 | Kilo | tsx (`sessionView`) |
| **AT-GSC-22** | 2026-09-05 | Weekend banner; US rows closed; Globex Sunday 18:00 ET named. **Copy must not imply Monday 2026-09-07 is an unmodified session** (Labor Day — Tango GSC0-4) | Kilo · Tango | tsx (`sessionView`) |

GSC4 screenshots cover hatch, color, sticky gutter, band geometry **only**. They do not re-prove 20–22.

### 8.4 Runtime (Spec §9.4) — GSC5

| ID | Assertion | Owner | Class |
|----|-----------|-------|-------|
| **AT-GSC-30** | From the moment auth state is non-`loading`: the only **application** request is `/api/auth/me`, and it fires **exactly once**. Framework chunk and RSC payload fetches are excluded. Date change must not re-fire `/api/auth/me`. No app-level `fetch` / XHR / WS / EventSource after that | Kilo | pw |
| **AT-GSC-31** | No `localStorage` / `sessionStorage` / IDB / cookie **writes** from this route | Kilo | pw |
| **AT-GSC-32** | No console errors/warnings on mount, date change, theme switch | Kilo | pw |
| **AT-GSC-33** | Correct when process/viewer TZ ≠ America/New_York | Kilo | tsx |
| **AT-GSC-34** | Date field + both toggles keyboard operable; visible focus | Echo · Kilo | pw |
| **AT-GSC-35** | `prefers-reduced-motion: reduce` — no smooth scroll animation | Echo · Kilo | pw |
| **AT-GSC-36** | Now-line interval cleared on unmount; **exactly one** live interval after three date changes | Kilo | pw |

### 8.5 Placement / DoD (Spec §3 · §10)

| ID | Assertion | Owner | Class |
|----|-----------|-------|-------|
| **AT-GSC-40** | **Stamped path** inside Labs shell; **Sessions** active in Resources sub-nav | Charlie · Delta | pw |
| **AT-GSC-41a** | `marketCalendar` unit tests exist and pass under bare `npx tsx` (no DOM) | Kilo | tsx |
| **AT-GSC-41b** | No view-layer imports (`react`, `next/*`, `components/`, `app/`, dynamic `import()`) in `web/lib/marketCalendar/` or `web/lib/sessions/` | India | grep |
| **AT-GSC-41c** | No `next/dynamic` and no dynamic `import()` in the Sessions **route tree** (stamped page + `web/components/resources/sessions/`) | India | grep |
| **AT-GSC-42** | Light and dark at 1440 / 1024 / 390 | Echo | shot |
| **AT-GSC-43** | Staging Mini Two re-verified | Foxtrot · Delta | ops |
| **AT-GSC-44** | Production host **named** (Mini Two or Dude Two) then promoted; rollback named | Foxtrot · Coach | ops |
| **AT-GSC-45** | Entitlement = existing authenticated floor; Observer included; no new policy | Mike · Delta | pw |

---

## 9. File allowlist

Indicative until GSC0-5 / GSC0-1 lock the list. After GO, seeds **name exact files**.

### 9.1 Create (expected)

| Path | Agent | Phase |
|------|-------|--------|
| `web/lib/marketCalendar/index.ts` (+ tests) | Charlie · Kilo | GSC1 |
| `web/lib/sessions/timeAxis.ts` | Charlie | GSC2-axis |
| `web/lib/sessions/exchanges.ts` | Charlie | GSC2-axis |
| `web/lib/sessions/sessionView.ts` | Charlie | GSC2-view |
| `web/lib/sessions/*.test.ts` | Kilo | GSC2 |
| `web/app/resource/sessions/page.tsx` **or stamped path** | Charlie | GSC3 |
| `web/components/resources/sessions/SessionMap.tsx` | Charlie | GSC4 |
| `web/components/resources/sessions/SessionControls.tsx` | Charlie | GSC4 |
| `web/components/resources/sessions/StatusBanner.tsx` | Charlie | GSC4 |
| `web/components/resources/sessions/ClosuresList.tsx` | Charlie | GSC4 |
| `docs/evidence/sessions/session-clock.html` | Charlie (copy) | GSC4 if OD-S4 (a) |
| `server/help_reference/sessions.md` | Lima | GSC6 if OD-S5 (a) |

### 9.2 Edit (expected)

| Path | Agent | Touch |
|------|-------|--------|
| `web/components/resources/ResourcesHub.tsx` | Charlie | Sessions child on `ResourcesSubNav` |
| `web/app/resource/ResourcesPageClient.tsx` | Charlie | Keep Library/Tags working |
| `web/styles/tokens.css` | Echo | `--color-session-*` on `:root` **and** dark |
| `web/app/guide/page.tsx` · `web/lib/guide.ts` | Lima / Charlie | OD-S5 (a) only |
| `Architecture/00-decision-log.md` | Lima | GO + close + known `/resource` vs `/resources` divergence |
| `Architecture/10-resources-design.md` | Lima | One-line Sessions child at close |
| `AGENTS.md` | Lima | Program row at GO / close |
| `agents/README.md` | Juliet | This board (now) |

### 9.3 Forbidden

`web/lib/market/**` · `web/components/options-lab/**` · `web/lib/runner/**` · `server/routes/**` · `server/market_data/**` · `migrations/**` · Practice suite files · SiteHeader `NAV` (JR6) · Dude One.

`git diff --stat` vs parent of the phase commit **must** be the allowlist that phase named, plus this board’s seeds/plan/evidence.

---

## 10. Seed inventory

```text
agents/p-sessions/
  CHARTER.md
  ORCHESTRATOR.md
  evidence/plan-v1.0-review-2026-09-09.md
  seeds/
    README.md
    GSC0-1-india-spec-law.md
    GSC0-2-hotel-calendar.md
    GSC0-3-echo-ia.md
    GSC0-4-tango-copy.md
    GSC0-5-charlie-feasibility.md
    GSC0-6-mike-boundary.md
    GSC0-7-kilo-at-matrix.md
    GSC0-8-juliet-seeds.md
    GSC0-9-lima-dl-draft.md
    GSC0-G-delta.md
    # GSC1–GSC6 materialized by Juliet after GSC0-0 (GSC0-8)
  gate-reports/
    README.md
agents/go/GSC-W0.md
```

GSC0 seeds are written at program open. **GSC1+ seeds are not an invitation to code.** Juliet GSC0-8 writes them after the stamp.

---

## 11. Risk register

| Risk | Mitigation |
|------|------------|
| Route `/resources` vs `/resource` silent “fix” | OD-S1 on the GO token. India FAILs a path that is neither stamped nor the recommended default after silent GO |
| Lost HTML stops the whole program | **B1:** GSC0-G does not wait. OD-S4(c) reconstruct. GSC4 entry only |
| §8.3 ATs degrade to screenshots | **B2:** `sessionView` + tsx in GSC2-view |
| AT-GSC-30 argued into a waive at GSC5-G | **B3 · N3:** window is GO law; application requests only |
| Rules date stuffed into override | **N4:** ships empty; 19a/19b |
| `GSC2-axis-G` phantom gate | **N1:** dropped; GSC2-view write ban is absolute |
| Canadian Thanksgiving looks “wrong” | **S1:** AT-GSC-02 pins Toronto open + disclosure |
| Hardcoded DST pairs that “pass” September and fail October | AT-GSC-01…05; TZ=UTC and TZ=Asia/Tokyo |
| TSE 15:00 (pre-2024) | L5; every Tokyo AT |
| July-3 early close never exercised | **S3:** AT-GSC-18 / 2028 |
| New Year's Saturday implemented as a normal weekend-shift | AT-GSC-15 is a **gate** |
| ES hours invented on Thanksgiving | L7; AT-GSC-20 `modified` only |
| `scroll` event used to detect pan | L10 |
| Leaked 20s interval | AT-GSC-36 |
| Tokens only in dark mode | JR7; AT-GSC-42 |
| Two Charlies colliding on `web/lib/sessions/` | §6 write-tree split |
| Deploy straight to production / no back-out | GSC6-0 staging first; rollback named |
| Seating Alpha “just in case” | JR10 |

---

## 12. Ideas inventory (Phase 0)

From the Spec. Nothing discarded.

| Idea | Disposition |
|------|-------------|
| Native Labs port of `session-clock.html` | **IN-SCOPE** (or reconstruct under OD-S4(c)) |
| Rules-derived NYSE calendar, reusable module | **IN-SCOPE** |
| Resources child `Sessions` | **IN-SCOPE** |
| Live quotes / prices | **OUT** (Spec §2) |
| Foreign market holidays | **OUT** — disclosed on page (L8); AT-GSC-02 pins one instance |
| Toronto/TSX holiday handling | **OUT** — unmodified (L7) |
| Persist date / zoom | **OUT** (Spec §2) |
| Promote Tags to a real route | **FLAGGED** — OD-S2 (b); not required |
| `/resources` vs `/resource` prefix repair site-wide | **FLAGGED** — not this ship; Lima records known divergence at GSC6-1 |
| Help / Guide | **FLAGGED** — OD-S5 |
| Add Sessions to global header | **OUT** (JR6) unless Coach overrides |
| Appearance allowlist new href | **FLAGGED** — Mike GSC0-6 |
| Reconstruct visual without HTML | **IN-SCOPE** if OD-S4(c) |

---

## 13. Coach GO checklist (GSC0-0)

Stamp **`agents/go/GSC-W0.md`**. Chat “go” is not the stamp (**DL-328**).

### Coach decides

- [ ] Spec sha1 `81984ba9f2394d52aa359cefcdb108451fdec9e3` (re-hash if the file moved)  
- [ ] Plan **v1.2** (this file)  
- [ ] OD-S0…S7 ticked  
- [ ] JR1–12 Accept or Override  
- [ ] L1–L11 become **LOCKED** (L4 includes override-empty / unscheduled-only)  
- [ ] OD-S4 **(a)** path+sha1, **(c)** reconstruct, or **stop** — GSC1/GSC2 do not wait  
- [ ] AT-GSC-30 window (B3 · N3): application requests only; `/api/auth/me` exactly once; framework chunks/RSC excluded  
- [ ] One of: **GO** (fire GSC1 ∥ GSC2-axis) · **Amend** · **Stop**

### v1.2 fold verification — Juliet asserts, Delta confirms at GSC0-G

These are not Coach product ticks. They record that the fold is on disk.

- [ ] **N1** No citation to `GSC2-axis-G`. GSC2-view must not write `timeAxis.ts` / `exchanges.ts`  
- [ ] **N2** AT-GSC-06a / 06b / 06c present; assertion is one sample, does not error  
- [ ] **N3** AT-GSC-30 application-only + AT-GSC-41c  
- [ ] **N4** L4 / invariant 6 override-empty; AT-GSC-19a / 19b  
- [ ] **B1–B3 / S1–S7** still on disk from v1.1 (HTML is GSC4-only; `sessionView`; stamped-path DoD)

**Next after GO:** Juliet GSC0-8 writes GSC1–GSC6 seeds → Delta GSC0-G → Charlie GSC1-0 and GSC2-0 (separate write trees).

---

## 14. Definition of done (maps Spec §10)

| # | Spec | Gate |
|---|------|------|
| 1 | **Stamped path** in Labs shell; Sessions active | GSC3-G · GSC4-G |
| 2 | All §9 tests on the **development machine** | GSC1-G … GSC5-G |
| 3 | Staging (Mini Two) re-verified | GSC6-G |
| 4 | Light and dark at 1440 / 1024 / 390 | GSC5-G |
| 5 | `marketCalendar` (+ `sessions` libs) unit tests under bare Node; no view imports | GSC1-G · GSC2-G · GSC6-2 |
| 6 | Production — host confirmed Mini Two or Dude Two; rollback named | GSC6-0 · Coach |

Program **PASS** is **GSC6-G**. Not earlier.
