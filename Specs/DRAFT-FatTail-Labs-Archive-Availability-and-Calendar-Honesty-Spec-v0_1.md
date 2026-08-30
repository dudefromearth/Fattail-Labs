# FatTail Labs — Archive Availability and Calendar Honesty Spec v0.1

**Status:** **DRAFT** — **SUPERSEDED by v0.2.** Not BUILD AUTHORITY. Kept as the design read.
**Filename:** `DRAFT-FatTail-Labs-Archive-Availability-and-Calendar-Honesty-Spec-v0_1.md`
**Type:** Product + technical spec — Time Machine calendar · StudioOne availability
**Parents:** Time Machine Spec **v0.7.4 BUILD AUTHORITY** (ATM-C1 · ATM-C3 · AT-TM-C4) · Time Machine One Source Spec **v0.4 BUILD AUTHORITY** (AT-TM-OS-6) · StudioOne Archive Read API Spec **v0.8** + A1 + A2_1 (§4.1 coverage · §6.3 health · §7 stats)
**Law-ID prefix:** **AV-1…**
**Routes (proposed):** StudioOne `GET /api/availability` · Labs `GET /api/me/options-lab/archive/availability`
**Does not replace:** coverage, index, fetch, marks, cadence, stats. Those remain what they are.

---

## Scope statement (DL-539)

**Active program:** Options Lab — Time Machine calendar honesty.

**Touches (when stamped):** Time Machine date control (`TmDateField`) on Analyzer, Heatmap, and Surface; a new StudioOne availability read; Labs pass-through of that read; help one-liner that grey means no path and is not clickable.

**Touches outside program:** **NONE.** MiniTwo until asked. Tap write. Coverage hours/gaps/hash. Admin corpus panel (already `/api/stats`). Month-coverage reconstruct leftover is **this** design's reason for existing, not a second program.

**Does not:** AT-SOAR-45 · OS-1 late-tab (Monday, live, not faked) · §13a items 2–3 · HOLD Basic / TPO / 1× / Record · dash bounce · MiniTwo · a second coverage endpoint · trade counts, gaps, cadence per day.

---

## 0. Coach intent (verbatim — do not drop)

Spoken, this session, 2026-08-29:

1. **The calendar has to tell the truth about what it can load.**
2. **Day greying is already in the spec as ATM-C1 and AT-TM-OS-6. The navigation half — previous month and previous year disabled when nothing is behind them — was in my verbal request and never got written down. That is a gap, not a new feature, and the spec records it as one.**
3. **Design only this round. No plan, no code.**
4. **Read the disk before proposing anything. If COUNTS and the nightly STATS cannot answer availability without touching reconstruct_book, say so. That changes the design rather than being found in the build.**
5. **Give me the response shape, how the marker is computed, where it is served, and the 304 path.**
6. **Answer §7 while you design:** all symbols in one response, or the symbol in view; what the calendar shows before any marker exists; response size across the corpus today, and projected at one day a day for a year; whether Labs re-serves it the way it re-serves the archive routes.
7. **Evaluate three possible additions to the same call.** Symbol universe — what the tap intends to collect, not only what it holds. Today a symbol that stopped collecting looks identical to one that never started, and SPCX is on the Practice symbols page but is not one of the eighteen chain names. Health — store mounted, tap running, API version. The calendar needs it on open anyway, and one round trip closes the window where availability says a day exists while the drive is unmounted. Corpus totals — days, bytes, growth. Already computed for the nightly stats and already wanted by the admin panel.
8. **Not anything about content — trade counts, gaps, cadence per day. Availability answers whether a day can be loaded. The moment it answers what is in a day it becomes a second coverage endpoint and the two drift.**
9. **AV-6 is the law that makes the rest work: no unknown state is ever visible to a member. The current defect is not that greying is wrong, it is that an unresolved day paints as selectable and can be clicked.**
10. **Nothing else fires. AT-SOAR-45 and the OS-1 late-tab are still Monday, live, not faked.**

---

## 1. Why this document exists

ATM-C1 and AT-TM-OS-6 already require the calendar to highlight what is retrievable and grey the rest. One Source OS-6: today with `count > 0` is dotted, not grey-because-live; uncovered is grey + NO PATH. AT-TM-C4: a day not covered is not selectable.

That law is not what is on the glass.

As-built (`TmDateField.tsx`): a cell whose coverage flag is `undefined` paints at `text-white/45`, stays enabled, and is titled "Coverage not loaded yet". `data-tm-covered="unknown"`. Click calls `onDay`. The month `‹` / `›` never disable. There is no year control; rolling January `‹` is how a year changes, and it is also never disabled.

Coverage is the call that was asked to feed those dots. `book_coverage` **always** calls `reconstruct_book` (every snap filename, reconstructed `t`, cadence, gaps) per symbol per day. Opening August with `from`/`to` is why empty days stay `unknown` long enough to click. That is the defect AV-6 names.

The navigation disable was spoken with the greying and never written. This file records it.

---

## 2. Disk read (2026-08-29, StudioOne gold)

Store: `/Volumes/FatTail2TB/fattail-market-data/ssr/live_capture`. Fourteen `day=` folders: 2026-08-14, then 08-17…08-29.

| Artifact | What it actually holds | Reconstruct_book? |
|----------|------------------------|-------------------|
| **COUNTS.json** beside the day | Tap-written, O(1) per snap. Keys: `day`, `updated_at`, `snaps`, `symbols`, `source`. Per symbol: `snaps`, `expiration`, `not_today`, `last`, hole/phase. ~7.8 KB. **Missing** on 08-14 and 08-17. Present from 08-18. Weekend 08-22/23/29: eighteen names, `snaps: 0`, `not_today: true` for index names. | **No.** |
| **Per-day STATS.json** | Nightly. `books[].symbol` + `books[].count` plus cadence, gaps, histogram, by_hour. Present on **all fourteen** days. 08-14: SPY 129. 08-17: eighteen names × 2. Dense day 08-28 is **1.7 MB** because of gaps; 08-27 is 45 KB. | **Not at read.** The nightly **wrote** it with `cadence_stats` / `reconstruct_book`. Reading the file does not walk snaps. |
| **Store STATS.json** | Roll-up: `days_collected=14`, `bytes_total` (marks tapes today — leftover vs chain bytes), `last_run_at`, `medians_by_day` (145 rows). 32 KB. | No. |
| **`GET /api/coverage` as-built** | `book_coverage` → `reconstruct_book` for every requested symbol-day. | **Yes. This is the calendar stall.** |
| **Leftover `GET /api/available`** | Wraps coverage. Same reconstruct. Do not follow. | Yes. |

**Can COUNTS and nightly STATS answer availability without `reconstruct_book`?**

**Yes, at read time.** Loadable for symbol S on date D is:

1. If `COUNTS.json` exists: `symbols[S].snaps > 0`. (`not_today` or missing/zero → not loadable.)
2. Else if that day's `STATS.json` exists: `books[]` where `symbol=S` and `count > 0`.
3. Else: not loadable. Folder existence is not a day (SO-AR §4.1).

Today / an unfinalized session **must** use COUNTS, not last night's STATS. COUNTS is the live increment. STATS is the 02:00 pass.

Caveat, named so it is not found in a build: STATS on a dense day is a **cadence document** (up to ~1.7 MB). Pulling `count` out of it does not reconstruct, but it is the wrong shape to parse for a calendar. After 08-18, COUNTS exists and is 8 KB. Only 08-14 and 08-17 lack COUNTS; those two STATS files are small. Going forward, COUNTS is the read. A compact sidecar from the nightly (`count` per symbol, no gaps) is an improvement, not a requirement for this answer.

Compact JSON of loadable symbol names per day across today's corpus: **1,100 bytes** measured from this rule.

Chain names on 08-27 disk: the **eighteen** session-map tradeables (AAPL AMZN GLD GOOGL IWM META MSFT NVDA QQQ SLV SPX SPY TLT TSLA UNG USO XLF XSP). VIX / VIX1D are marks tapes, not chain folders. **SPCX is not in that eighteen** (DL-623).

---

## 3. Law

| ID | Law |
|----|-----|
| **AV-1** | The calendar tells the truth about **what it can load**. A dotted day can be raised. A grey day cannot. There is no third paint a member can click. |
| **AV-2** | Day greying is **ATM-C1** and **AT-TM-OS-6**, restated, not invented. `count > 0` for the symbol in view → dotted (today included; not grey-because-live). Else grey + NO PATH. Partial sessions are still loadable — they are dotted. Hours, gaps, and cadence are **coverage**, not this answer. |
| **AV-3** | **Navigation gap, now written.** Previous month is disabled when no loadable day for the symbol in view exists before that month. Previous year is disabled when none exists before that year. Rolling January ‹ is a year change and obeys the same rule. Next month / year never pass today. This was spoken with the greying. It is not a new feature. |
| **AV-4** | Availability is computed from **COUNTS** (preferred) and nightly **STATS `books[].count`** (fallback when COUNTS is absent). **Never `reconstruct_book`.** Never envelope open. Never coverage-as-calendar. |
| **AV-5** | Availability answers **whether a day can be loaded**. It does not answer what is in a day. Trade counts, gaps, cadence, first_at, last_at, hash, rth_complete vs partial **do not travel on this call**. The moment they do, this is a second coverage endpoint and the two drift. |
| **AV-6** | **No unknown state is ever visible to a member.** An unresolved day does not paint as selectable. Before the availability document is in hand, every cell that is not a future date is grey and disabled — the same paint as NO PATH. After a 200, every in-range date is either loadable or not. Dates omitted from the document are not loadable. Unreachable / store missing / auth: named hole, same grey, not clickable. |
| **AV-7** | Labs **re-serves** this the way it re-serves the other archive reads: session cookie, Bearer to StudioOne, gzip, `Cache-Control: max-age=0, must-revalidate`, ETag / 304. The browser never calls `studioone.local:5055`. |
| **AV-8** | **304 path.** ETag is the hash of the compact availability document (inputs: COUNTS `updated_at` for today if present, store STATS `last_run_at`, universe fingerprint). `If-None-Match` match → **304**, empty body, same ETag, `must-revalidate`. Settled bits do not change; today can. A 304 is not "unknown." The client keeps the prior document. |

---

## 4. Response shape

StudioOne `GET /api/availability`. Optional query: none required. The document is the whole corpus of **loadable chain days**, all tap symbols, plus the additions in §8 that earn their place.

```json
{
  "api_version": 1,
  "from": "2026-08-14",
  "to": "2026-08-29",
  "days": {
    "2026-08-14": ["SPY"],
    "2026-08-17": ["AAPL", "AMZN", "GLD", "GOOGL", "IWM", "META", "MSFT", "NVDA", "QQQ", "SLV", "SPX", "SPY", "TLT", "TSLA", "UNG", "USO", "XLF", "XSP"],
    "2026-08-27": ["…symbols with snaps > 0…"]
  },
  "universe": {
    "chain": ["AAPL", "AMZN", "GLD", "GOOGL", "IWM", "META", "MSFT", "NVDA", "QQQ", "SLV", "SPX", "SPY", "TLT", "TSLA", "UNG", "USO", "XLF", "XSP"],
    "marks": ["VIX", "VIX1D"],
    "source": "session-map"
  },
  "health": {
    "store_missing": false,
    "tap_running": true,
    "api_version": 1
  },
  "hash": "<etag material>",
  "hole": null
}
```

`days` lists **only loadable** dates. A date with a folder and zero snaps (weekend 08-29) is **absent**, not present-with-empty. The client treats absence as not loadable (AV-6).

`from` / `to` are the inclusive NY-date span of the document (earliest loadable calendar date through today, even if today is not loadable). Navigation uses `from`. Dots use `days[date]` containing the symbol in view.

`hole`: `null` | `STORE MISSING` | `STATS STALE` is **not** a reason to invent dots; if COUNTS can still answer today and STATS answers the rest, `hole` stays null. Store unmounted → `STORE MISSING`, `days: {}`, calendar greys.

No `books[]`. No `count`. No `gaps`. No `cadence_s`. No `bytes_total`.

---

## 5. How the marker is computed

For each `day=` folder, for each chain symbol S in the tap universe:

| Priority | Source | Loadable |
|----------|--------|----------|
| 1 | `COUNTS.json` present | `symbols[S].snaps > 0` |
| 2 | else `STATS.json` | some `books[]` with `symbol=S` and `count > 0` |
| 3 | else | no |

Today: step 1 only. Do not use last night's STATS for a growing day.

Emit S under `days[D]` iff loadable. Do not emit D if no symbol is loadable.

**Not a marker:** folder exists; CHECKLIST.CHAIN; coverage `status`; `live: true`; STATS STALE on the roll-up when COUNTS still answers.

As-built leftover: `dayIsCovered` uses coverage `books[].count > 0` after reconstruct. This spec's marker is the same **predicate** (`count > 0`) on a **cheap document**.

---

## 6. Where it is served, and the 304 path

| Hop | Path | Auth | Notes |
|-----|------|------|--------|
| StudioOne | `GET /api/availability` | Bearer, same as coverage | Filenames + two JSON sidecars. Not in the §4.4 reconstruct pool for this reason: it must not wait behind a 36k-file book. Health does not take a pool slot today; this call is the same class. |
| Labs | `GET /api/me/options-lab/archive/availability` | Session | Pass-through. Gzip. `must-revalidate`. ETag from `hash`. 401 archive auth named, not empty dots. 501 if archive not configured. Unreachable → 200 with a named hole and empty `days` (same shape as coverage UNREACHABLE), **not** a painted unknown. |
| Browser | that Labs URL, credentials same-origin | Cookie | One fetch on calendar open (and on symbol change it does not re-fetch — §7). |

**304:** client sends `If-None-Match: "<hash>"`. StudioOne (and Labs, if it still holds the body) answers 304 when the compact document has not changed. The member's previous `days` map stays. That is a resolved state, not AV-6 unknown.

Labs **may** disk-cache the compact body keyed by hash the way it caches settled fetch. The body is ~1 KB today. Caching is optional; 304 is not.

Do **not** mount this on `/api/coverage`. Do **not** reuse leftover `/api/available`.

---

## 7. Answers (required of this design)

### All symbols in one response, or the symbol in view

**All tap chain symbols in one response.** Measured compact body today is 1,100 bytes for every loadable name on every collected day. Switching the desk symbol is a local filter (`days[date]` contains the view symbol). A per-symbol fetch would re-enter the network on every ticker change and would re-create unknown cells while it ran (AV-6).

Navigation (`from`) is interpreted **for the symbol in view**: previous month disabled if that symbol has no loadable date before the displayed month. The document still carries every symbol so SPX and SPY do not share a first day (08-14 is SPY-only).

### What the calendar shows before any marker exists

**Grey, disabled, same as NO PATH.** Not `unknown`. Not "Coverage not loaded yet." Not clickable.

The date **field** may still show today (TMI-64 / ATM-C1: control present, today default). Opening the grid without a document does not offer a selectable cell. `‹` `›` disabled until `from` is known. After 200 or 304-with-body-already-held: dots and greys from AV-2; navigation from AV-3.

Future dates remain disabled as now (`max` = today).

### Response size

| Horizon | Compact JSON (`days` map of loadable names) | Packed bits (optional later) |
|---------|---------------------------------------------|------------------------------|
| **Corpus today** (14 folders, 16 calendar dates 08-14…08-29, 18 names) | **1,100 bytes** measured | 16 × 18 bits ≈ 36 bytes + keys |
| **One day a day for a year** (~252 session days × 18 names, ISO dates only for loadable) | ~50–80 KB uncompressed | 365 × 18 bits ≈ 822 bytes + keys |

Either is fine on the LAN. Ship the JSON map. A bitset is not required at this size. Do not ship STATS-shaped cadence (1.7 MB/day) as "availability."

### Whether Labs re-serves it

**Yes.** Same class as coverage / index / fetch / marks / stats: Labs proxy, session, Bearer to StudioOne, gzip, `must-revalidate`, ETag 304, named holes. Browser never talks to StudioOne. AV-7.

---

## 8. Three possible additions — which earn their place

Evaluated for **this same call**, not as separate programs.

### Symbol universe — **in**

Coach's case is real on disk: a name with `snaps: 0` in COUNTS (stopped, or not_today) looks like a name that was never a tap symbol if the document only lists what it holds. **SPCX** is on Practice and is **not** one of the eighteen chain names (DL-623). The eighteen live in `data/ssr/session-map.json`. VIX / VIX1D are marks, not chain.

`universe.chain` / `universe.marks` / `universe.source: "session-map"` is tens of bytes. The calendar greys SPCX as **not a collected symbol**, not as a hole in August. A symbol in `universe.chain` with no dates in `days` **did not load that range**; it is still a tap name. That is the distinction.

This is not a second `market_symbol_universe` SoR. It is what the **tap intends**, from the session map the tap already reloads.

### Health — **in**

`GET /api/health` already exists, no snap walk: mount, version, tap bit, `STORE MISSING`. The calendar needs it on open. If availability were cached without health, a dotted day could outlive an unmounted drive — Coach's window.

Putting `health` on this call is one round trip. Empty `days` + `store_missing: true` is grey (AV-6), not stale dots. `api_version` mismatch is `VERSION MISMATCH`, not a painted month.

Do not walk snaps for health. Do not replace the 60 s Labs health poll for the dash; this is the calendar's open.

### Corpus totals — **out**

Days collected, bytes, growth already live on nightly STATS and on `GET /api/admin/options-lab/archive/stats` for `/admin/archive`. They do not tell a member whether Tuesday is loadable. Putting them here mixes the admin corpus row into a member calendar fetch. Leave them on stats.

(Opinion, labeled: `bytes_total` today sums marks tapes, not chain snaps. That leftover stays on the stats document, not this one.)

---

## 9. Member experience (when built — not this round)

- Dot = loadable for the symbol in view. Dim = no path. Click on dim does not load; it does not open WAITING on a guess.
- `‹` disabled when the previous month (and, at January, the previous year) has no loadable day for this symbol. `›` disabled at the month that contains today.
- No "unknown" title. No third opacity.
- Same control on Analyzer, Heatmap, Surface (one host).

Chrome labels are Echo's when this is BUILD. Copy honesty: grey is no archive, not "loading."

---

## 10. Ideas inventory

| Idea | Disposition |
|------|-------------|
| Calendar greying (ATM-C1, OS-6) | **IN-SCOPE** — already law; this file supplies the cheap marker |
| Prev month / prev year disable | **IN-SCOPE** — spoken gap, now written (AV-3) |
| COUNTS + STATS count, no reconstruct | **IN-SCOPE** — disk says yes (AV-4) |
| All symbols, one body | **IN-SCOPE** — §7 |
| AV-6 no unknown | **IN-SCOPE** |
| Universe on the same call | **IN-SCOPE** — earns its place (§8) |
| Health on the same call | **IN-SCOPE** — earns its place (§8) |
| Corpus totals on the same call | **OUT** — stays on stats / admin panel |
| Content (gaps, cadence, trade counts) | **OUT** — coverage / stats |
| Compact nightly AVAIL sidecar | **FLAGGED** — not required; COUNTS is enough going forward |
| Bitset encoding | **DEFERRED** — JSON map is 1.1 KB today |
| ATM-C1 hours on the cell (`partial` vs `rth_complete`) | **DEFERRED** — that is coverage, not loadability. Partial is dotted. |
| Leftover `/api/available` | **Do not follow** — reconstructs |
| AT-SOAR-45, OS-1 | **Not this spec** — Monday, live, not faked |

---

## 11. Acceptance (when this becomes BUILD AUTHORITY — not a plan)

| ID | Criterion |
|----|-----------|
| **AT-AV-1** | Opening the calendar never shows `data-tm-covered="unknown"`. Cells are dotted, grey, or future. Grey is not clickable. |
| **AT-AV-2** | A day with COUNTS `snaps > 0` for the view symbol is dotted. 08-14 SPY dotted, SPX grey. 08-29 all grey. Today dotted iff count > 0, never grey-because-live. |
| **AT-AV-3** | In August 2026, previous month is disabled (nothing in July). For SPX, 08-14 is grey. |
| **AT-AV-4** | The availability handler does not call `reconstruct_book`. Evidence: a month open returns 200 in well under the time coverage currently stalls. |
| **AT-AV-5** | Response has no `gaps`, `cadence_s`, `delta_*`, or per-day trade counts. |
| **AT-AV-6** | Before the first 200, no cell is enabled except that future remains disabled. |
| **AT-AV-7** | Labs session route; no-bearer StudioOne is 401; 304 on matching ETag. |
| **AT-AV-8** | SPCX is not in `universe.chain`. A tap name with zero dates in range still appears in `universe.chain`. |

HOLD from parent TM: Basic / TPO / 1× / Record. Not this stamp.

Fail-closed: reconstruct_book on this path; unknown paint; clickable unresolved day; coverage-as-calendar; faking AT-SOAR-45 or OS-1; MiniTwo; dash bounce; answering §13a items 2–3.

---

## 12. As-built (honesty — not this spec's law)

| As-built | Honesty |
|----------|---------|
| `TmDateField` `unknown` + clickable | The AV-6 defect |
| Month `‹` `›` never disabled | The AV-3 gap |
| `tmNeedMonth` → `GET .../coverage?from&to` | Reconstruct per day; stall |
| `book_coverage` → `reconstruct_book` | Even when COUNTS exists |
| Leftover `/api/available` | Same reconstruct; do not reuse |
| Coverage Labs ETag from `doc.hash` | Pattern to copy, not the document to copy |
| Dash `Cache-Control: no-store` | Leftover vs spec `must-revalidate` until a bounce. Availability on Labs is `must-revalidate` regardless |
| COUNTS missing 08-14, 08-17 | STATS fallback for those two |
| Store `bytes_total` = marks tapes | Admin leftover; not this call |

---

## 13. Document control

| Version | Date | Notes |
|---------|------|-------|
| **v0.1 DRAFT** | 2026-08-29 | Coach intent. Disk read: COUNTS + STATS count answer availability without reconstruct_book at read time. AV-6 no unknown. Navigation gap written. Universe and health in; corpus totals out. Not BUILD AUTHORITY. |

**Next:** SUPERSEDED. See v0.2 + plan v1.0. Monday still owns AT-SOAR-45 and OS-1.
