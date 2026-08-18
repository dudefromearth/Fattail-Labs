# Characterization list — SSR Collector Hardening

**Author:** Kilo (W0-5)  
**Status:** **CONTRACT** for P1–P7 implementers. Not a pytest suite. Not BUILD AUTHORITY.  
**Date:** 2026-08-18  
**Spec:** [`Specs/FatTail-Labs-SSR-Collector-Hardening-Spec-v1.0.md`](../../Specs/FatTail-Labs-SSR-Collector-Hardening-Spec-v1.0.md) §6 · §8–11 · §17  
**Seed:** [`seeds/W0-5-kilo.md`](./seeds/W0-5-kilo.md)  
**Gate:** [`gate-reports/W0-5-kilo.md`](./gate-reports/W0-5-kilo.md)

**Do not implement these tests in this packet.** Rows land as pytest with P1–P4 (H1–H4) and later packets for H5–H7. A row is not green because “it should work.”

Coach-required IDs **AT-SSR-H-A / B / C** are law (spec §17.1). Edges **D / E / F** are seed law (spec §17.2). **AT-SSR-H-G** is the flag-on missing-map fail-loud from spec §9.1 (Coach extra this packet).

---

## 0. How implementers use this list

Every row is a fact later code must satisfy. At implementation each row is a **deterministic test**, an **explicit handoff**, or an **NX**.

| Rule | Meaning |
|------|---------|
| Prefer | Pure functions + fake store + temp cache. Inject `now` / `phase`. Do **not** start launchd, Redis, Massive, or the StudioOne tap. |
| **Poll** | Spec **SSR-H-L3**: write a chain snap **and** `touch_interest` on that symbol’s ladder topic(s). Stopping the disk write but leaving interest warm **fails A**. |
| **Hole** | Spec **SSR-H-L5**: expected snap missing **or** interval exceeded. Empty / no-chain **outside** session is **not** a hole. |
| Severity **high** | Inventing a chain, writing a hole-shaped snap for an unscheduled name, rewriting Friday **2026-08-14**, or a silent poll-all when the map is missing and the flag is on. |
| `Blocked on` | `none` = list-ready now. `P4` / `P5` / `P6` / `P7` = ship the test with that packet, not earlier. |
| **Never** | Sleep 60s to prove the watchdog. Hit StudioOne. Invent Slack/email. Change `LABS_SSR_CHAIN_EVERY_S`. Invent a hole-tolerance default as law (30s synthetic still flags — **OD-SSR-H-3**). |
| Do not invent | The fourteen non-GTH names as a frozen table (**OD-SSR-H-4**). Fixtures name a small set. |
| Existing suite | Keep [`server/tests/test_ssr_live_capture_cadence.py`](../../server/tests/test_ssr_live_capture_cadence.py) and [`server/tests/test_ssr_snapshot_dash.py`](../../server/tests/test_ssr_snapshot_dash.py). Extend; do not delete Friday / cadence / dash bind tests. |

### 0.1 Determinism (Kilo invariant)

| Allowed | Forbidden |
|---------|-----------|
| `tmp_path` as `LABS_SSR_CACHE_ROOT` | Live `~/Library/Caches/fattail-ssr` |
| Fake store that records `touch_interest(topic)` and returns fixture generations | Real Redis / `LABS_MARKET_BUS` |
| Injected clock (`now=…`, `phase="gth"`) | `time.sleep(60)` / wall-clock 30s gaps |
| Fixture session-map JSON | Network, StudioOne SSH, gold-volume `open()` |
| Frozen heartbeat `at` ISO string | Asserting on file **mtime** as the silence clock |

Heartbeat silence is `now - heartbeat.at > 60s` (spec §11.1). Audit gaps are consecutive snap timestamps in the fixture. Both are **arithmetic**.

### 0.2 Suggested test homes (when implementation starts)

| Home | Rows |
|------|------|
| `server/tests/test_ssr_session_map.py` **(new)** | G, H, I, J, K, L |
| `server/tests/test_ssr_hardening_schedule.py` **(new)** | A, D, E, M, N, O, P, R, S, T |
| `server/tests/test_ssr_watchdog.py` **(new)** | B, U, V, W, X, Y |
| `server/tests/test_ssr_gap_audit.py` **(new)** | C, AA, AB, AC |
| `server/tests/test_ssr_snapshot_dash.py` **(extend)** | Q |
| `server/tests/test_ssr_live_capture_cadence.py` **(extend)** | F (constant already exists) |
| `server/tests/test_ssr_quote_sanity.py` **(new, P5)** | AD |
| `server/tests/test_ssr_retain.py` **(new, P6)** | AE, AF |
| `server/tests/test_ssr_replay_stub.py` **(new, P7)** | AG |

Module names are a suggestion. Facts are not.

### 0.3 Shared fixture (reuse; do not fork)

```json
{
  "version": 1,
  "timezone": "America/New_York",
  "default_phases": ["premarket", "rth", "postmarket"],
  "symbols": {
    "SPX": ["gth", "premarket", "rth", "postmarket"],
    "XSP": ["gth", "premarket", "rth", "postmarket"],
    "IWM": ["gth", "premarket", "rth", "postmarket"],
    "USO": ["gth", "premarket", "rth", "postmarket"]
  }
}
```

Universe fixture for schedule tests (small, not the live 18):

`SPX, XSP, IWM, USO, AAPL, SPY` — AAPL and SPY inherit `default_phases` (no GTH).

Coach GTH observation (2026-08-18) is the **starting map**, not a claim that QQQ/SPY never print overnight. Tests lock the **map**, not tonight’s Massive mix.

Phase clock tokens in code stay `gth / pre / rth / extended / closed / weekend`. Config aliases: spec §9.3.

---

## 1. Coach-required (must be in the list and later green)

These three are the only tests Coach named in the stamp. They are not optional and they are not “covered by” a nearby row.

### AT-SSR-H-A — GTH no-session is not polled and is not a hole

| Field | Value |
|-------|--------|
| **ID** | AT-SSR-H-A |
| **Fact** | With hardening **on**, a symbol that has **no session in GTH** is **not polled** (no `touch_interest` on its ladder topic(s), **no** chain snap written) and is **not counted as a hole**. |
| **Wave** | P1 |
| **Blocked on** | none (list) · implementation P1 |
| **Litmus** | Coach (a) · SSR-H-L3 · SSR-H-L5 · spec §17.1 |
| **Severity** | **high** |

**Given**

- `LABS_SSR_HARDENING=1`
- Session map = shared fixture (SPX/XSP/IWM/USO have `gth`; AAPL does not)
- Injected phase = `gth`
- Fake store: SPX has a generation; AAPL has none
- Temp cache root

**When** — one chain cycle (the unit that today’s `capture_chain` + `touch_interest` will become)

**Then**

1. `touch_interest` was **not** called for any AAPL ladder topic (`mb:ladder:AAPL:…`).
2. No file `…/chain/AAPL/snap-*.json` was created.
3. Tap hole list / status `holes` does **not** contain `NO CHAIN AAPL` (or any AAPL hole).
4. Dashboard day-summary **holes** counter (flag-on path) does **not** increment for AAPL.
5. Optional `no_session` record/count **may** include AAPL; it must **not** use the hole “bad” path as the only signal.

**And (positive twin, same cycle)**

6. SPX **is** polled: interest touched on its topic(s) (product and, if mapped, `I:SPX`) **and** a snap written under `chain/SPX/`.
7. If the SPX generation is present, that snap is **not** a hole.

**Negative / do-not**

- Writing a `hole: "NO CHAIN AAPL"` snap “for the archive” **fails this row**. Spec §10: do not write a hole-shaped snap the dash will count red.
- Touching interest “to keep the plane warm” for AAPL **fails this row** even if no snap is written.

---

### AT-SSR-H-B — Heartbeat silence triggers alert

| Field | Value |
|-------|--------|
| **ID** | AT-SSR-H-B |
| **Fact** | If the heartbeat is silent **> 60s** during a **live** phase for any **scheduled** symbol, the **independent** watchdog **alerts** (local fail-loud). Alert channel stays **OPEN** — no Slack/email/PagerDuty/Discord. |
| **Wave** | P2 |
| **Blocked on** | none (list) · implementation P2 |
| **Litmus** | Coach (b) · SSR-H-L7 · spec §11 · §17.1 |
| **Severity** | high if silence is quiet |

**Given**

- Heartbeat document with `"at"` = injected `now` minus **61s** (ISO America/New_York), `"phase": "gth"`, `"scheduled": ["SPX"]`
- Injected clock phase = `gth` (live)
- Watchdog invoked as its **own** entry (not `LiveTap.run`)

**When** — one watchdog tick

**Then**

1. Alert is raised: process log (named, loud) **and** a dash-readable state file under the cache tree.
2. No outbound sender is invoked (no Slack webhook, no SMTP, no Discord). Absence of those modules in the watchdog import graph is acceptable evidence.
3. Dash can read a **named** watchdog state (not a blank, not a stale “ok”).

**Negatives (same home)**

| Case | Expect |
|------|--------|
| `at` = now − **59s**, live, scheduled non-empty | **No** alert |
| `at` = now − 120s, phase = `closed` | **No** alert (lawful sleep) |
| `at` = now − 120s, phase = `weekend` | **No** alert |
| `at` = now − 120s, live, `"scheduled": []` | **No** alert (spec: “any scheduled symbol”) |
| Heartbeat file missing, live, scheduled would have been non-empty | **Alert** (silence includes missing heartbeat) |

**Clock law:** watchdog keys off heartbeat **`at`**, not file mtime. A fixture whose mtime is “now” but `at` is 61s stale **must** still alert.

---

### AT-SSR-H-C — Audit flags a synthetic 30s gap

| Field | Value |
|-------|--------|
| **ID** | AT-SSR-H-C |
| **Fact** | Post-close gap audit **correctly flags a synthetic 30s gap** on a **scheduled** symbol. Must flag at the live **2s** cadence **and** at any cadence Coach later picks in **[2, 5]**. |
| **Wave** | P4 |
| **Blocked on** | P4 (do not pretend a P1 unit is the audit) |
| **Litmus** | Coach (c) · spec §10 test law · §12 · §17.1 |
| **Severity** | high if a 30s hole is silent |

**Given** — fixture day tree for a scheduled symbol (e.g. SPY in `rth`), intended cadence **2s**:

| Snap `captured_at` (ET) | Interval from previous |
|-------------------------|------------------------:|
| 09:30:00 | — |
| 09:30:02 | 2s |
| 09:30:04 | 2s |
| 09:30:34 | **30s** |
| 09:30:36 | 2s |

**When** — audit runs for that day / symbol / phase

**Then**

1. The **30s** interval is listed as an exceeded interval **with both timestamps**.
2. The 2s intervals are **not** flagged as gaps.
3. Report is dated and written next to the day’s data (cache day tree; e.g. `AUDIT.json` and/or `AUDIT.md`).
4. Repeat the same fixture with intended cadence **3**, **4**, and **5** — the 30s interval **still flags**. Do **not** wait for `LABS_SSR_HOLE_TOLERANCE_S` to be closed (**OD-SSR-H-3**). A 30s synthetic is over any lawful tolerance in this program.

**Do not**

- Use Friday **2026-08-14** as this fixture (that day is 5-min labeled; see **F** / **AB**).
- Invent a tolerance of 30s as product law just to make the test pass. The test is “30s is a gap,” not “tolerance equals 30.”

---

## 2. Required edges (seed + Coach extra this packet)

### AT-SSR-H-D — Phase transition: one `"no session"` line

| Field | Value |
|-------|--------|
| **ID** | AT-SSR-H-D |
| **Fact** | On a phase transition, the tap logs a **single** `"no session"` line **per unscheduled symbol**, **not per cycle**. |
| **Wave** | P1 |
| **Blocked on** | none |
| **Litmus** | Coach required change 1 · SSR-H-L4 · spec §17.2 |
| **Severity** | medium (log flood is a lie about holes) |

**Given** — flag on, shared fixture, AAPL unscheduled in `gth`

**When**

1. Phase becomes `gth` (transition in).
2. Five chain cycles fire while phase stays `gth`.

**Then**

- Captured stdout / structured log contains **exactly one** `"no session"` record for `AAPL` in this `gth` occupancy.
- Cycles 2–5 add **zero** additional AAPL `"no session"` lines.

**When (next)** — phase transitions `gth` → `pre` (AAPL **is** scheduled in `premarket`)

**Then**

- No new AAPL `"no session"` line (AAPL is now in session).
- AAPL **starts** being polled on the first `pre` cycle.

**When (next night)** — phase transitions `extended` → `gth` again

**Then** — **one new** AAPL `"no session"` line for the new GTH occupancy.

Log match: the line **names** the symbol and the fact (`no session`), and is distinguishable from a hole line. Exact wording is implementer craft; the count and the “not a hole” type are law.

---

### AT-SSR-H-E — `LABS_SSR_HARDENING=0` is poll-all (current)

| Field | Value |
|-------|--------|
| **ID** | AT-SSR-H-E |
| **Fact** | Flag **off** (unset **or** `LABS_SSR_HARDENING=0`) is **today’s poll-all**. Session map is **ignored for scheduling**. GTH empties still behave as today: snap written, empty counted as a hole. |
| **Wave** | P1 (must stay green the day the flag lands) |
| **Blocked on** | none |
| **Litmus** | SSR-H-L8 · spec §9.5 · §17.2 |
| **Severity** | **high** (zero-downtime cutover) |

**Given**

- `LABS_SSR_HARDENING` **unset**, and a second case with `=0`
- Shared fixture on disk (would exclude AAPL from GTH **if** the flag were on)
- Phase = `gth`
- AAPL generation missing

**When** — one chain cycle

**Then**

1. AAPL **is** polled: interest touched **and** a snap written.
2. Snap carries a hole (`NO CHAIN AAPL` or as-built successor).
3. Hole list / dash holes **does** count AAPL (as-built red).
4. Map contents did not shrink the poll set.

Heartbeat **may** still be written flag-off (spec §9.5) so P2 can be proven before cutover. That is **not** a schedule change.

---

### AT-SSR-H-F — Friday 2026-08-14 is not rewritten

| Field | Value |
|-------|--------|
| **ID** | AT-SSR-H-F |
| **Fact** | This program does **not** rewrite Friday **2026-08-14**. That day stays labeled **5-min** as captured (DL-400 / DL-428). |
| **Wave** | P1 and every later write path (audit, retain, sanity) |
| **Blocked on** | none — extend the existing cadence test now; retain/audit cases with P4/P6 |
| **Litmus** | spec §3 · §7.2 · §10 · §17.2 · existing `FRIDAY_5MIN_DAY` |
| **Severity** | **high** (archive is the product) |

**Then (characterization, no gold volume)**

1. `FRIDAY_5MIN_DAY.isoformat() == "2026-08-14"` remains true (already in `test_friday_5min_day_is_not_rewritten`).
2. Hardening write helpers refuse to target `day=2026-08-14` as a live write destination (or: a fixture Friday tree’s snap bytes / mtime / checksum are unchanged after a capture/audit/retain call pointed at a sibling temp day).
3. No code path “backfills” Friday to 2s.

**Do not** open `/Volumes/FatTail2TB/.../day=2026-08-14` in CI. Use a temp tree whose day folder is named `day=2026-08-14` **or** assert the constant + a unit that skips that date.

---

### AT-SSR-H-G — Flag-on missing session map fail-loud

| Field | Value |
|-------|--------|
| **ID** | AT-SSR-H-G |
| **Fact** | With hardening **on**, a missing or unreadable session map **fails loud**. The tap does **not** silently poll-all and does **not** silently poll-none. |
| **Wave** | P1 |
| **Blocked on** | none |
| **Litmus** | spec §9.1 · SSR-H-L9 · Coach extra this packet |
| **Severity** | **high** |

**Cases (all flag on)**

| Setup | Expect |
|-------|--------|
| `LABS_SSR_SESSION_MAP` **unset** and default `data/ssr/session-map.json` **missing** | Abort / raise. Zero polls. Zero snaps. |
| `LABS_SSR_SESSION_MAP` **set** to a path that does not exist | Abort / raise. Zero polls. |
| `LABS_SSR_SESSION_MAP` set to unreadable / invalid JSON | Abort / raise. Zero polls. |

**Contrast (same home)** — flag **off**, default map missing: **do not** fail for the missing map; poll-all proceeds (**E**). That is today’s plane.

---

## 3. Additional rows — complete enough to implement P1–P4

These are not Coach-named, but P1–P4 cannot ship honestly without them. Implement with the named wave.

### AT-SSR-H-H — Override path set + missing file fail-loud (flag on)

| Field | Value |
|-------|--------|
| **ID** | AT-SSR-H-H |
| **Fact** | If `LABS_SSR_SESSION_MAP` is **set**, the file must exist and be readable. Missing/unreadable → fail loud. Same as G’s second case; keep as its own test so an override bug cannot hide behind “default path.” |
| **Wave** | P1 |
| **Blocked on** | none |
| **Litmus** | spec §9.1 |

Covered in the G table; ship as a distinct pytest so the env override cannot regress alone.

---

### AT-SSR-H-I — Flag-off ignores the map (including a present map)

| Field | Value |
|-------|--------|
| **ID** | AT-SSR-H-I |
| **Fact** | Flag off + a **valid** map that would exclude AAPL from GTH still **polls AAPL** in GTH. Map is ignored **for scheduling**. |
| **Wave** | P1 |
| **Blocked on** | none |
| **Litmus** | spec §9.5 |
| **Note** | Twin of **E** with the map **present**. E already requires this; keep an explicit case so “map file exists” cannot start leaking into flag-off. |

---

### AT-SSR-H-J — `default_phases` inheritance

| Field | Value |
|-------|--------|
| **ID** | AT-SSR-H-J |
| **Fact** | An enabled tradeable universe symbol **not** listed under `symbols` uses `default_phases`. With the shared fixture, SPY is scheduled in `pre` / `rth` / `extended` and **not** in `gth`. |
| **Wave** | P1 |
| **Blocked on** | none |
| **Litmus** | spec §9.4 |

---

### AT-SSR-H-K — Phase token aliases

| Field | Value |
|-------|--------|
| **ID** | AT-SSR-H-K |
| **Fact** | Config tokens `premarket`/`pre` → clock `pre`; `postmarket`/`post`/`extended` → clock `extended`; `gth` → `gth`; `rth` → `rth`. |
| **Wave** | P1 |
| **Blocked on** | none |
| **Litmus** | spec §9.3 |

Parametrize the accepted tokens. A map that only uses Coach names (`premarket`, `postmarket`) must schedule correctly against `phase_at` output (`pre`, `extended`).

---

### AT-SSR-H-L — Unknown version / wrong timezone fail-loud (flag on)

| Field | Value |
|-------|--------|
| **ID** | AT-SSR-H-L |
| **Fact** | Flag on + map `version` ≠ `1` → fail loud. Flag on + `timezone` ≠ `America/New_York` → fail loud. No silent poll-all. |
| **Wave** | P1 |
| **Blocked on** | none |
| **Litmus** | spec §9.4 · SSR-H-L9 |

---

### AT-SSR-H-M — Poll = snap + interest (both)

| Field | Value |
|-------|--------|
| **ID** | AT-SSR-H-M |
| **Fact** | A scheduled symbol is polled only if **both** the snap is written **and** interest is touched. An unscheduled symbol gets **neither**. |
| **Wave** | P1 |
| **Blocked on** | none |
| **Litmus** | SSR-H-L3 |
| **Note** | A is the GTH-empty case. M is the general definition so a future “write but don’t touch” split cannot ship. |

For SPX (scheduled, dual product+feed): both `mb:ladder:SPX:…` and `mb:ladder:I:SPX:…` are touched when the universe row has `feed_symbol=I:SPX` (as-built `ladder_topics`). Unscheduled AAPL: **neither** AAPL topic.

---

### AT-SSR-H-N — Drop interest when leaving session

| Field | Value |
|-------|--------|
| **ID** | AT-SSR-H-N |
| **Fact** | On a phase transition that **removes** a symbol from the scheduled set, the tap **stops touching** that symbol’s topics (grace `LABS_MB_INTEREST_GRACE_S` may then expire). Next cycle does not re-touch them. |
| **Wave** | P1 |
| **Blocked on** | none |
| **Litmus** | SSR-H-L3 |

**Given** — AAPL scheduled in `pre`, not in `gth`. Phase `pre` → `gth` (or inject a mid-phase map edit that removes AAPL).

**Then** — subsequent `touch_interest` calls omit AAPL topics.

---

### AT-SSR-H-O — Scheduled empty **is** a hole

| Field | Value |
|-------|--------|
| **ID** | AT-SSR-H-O |
| **Fact** | A **scheduled** symbol with no generation at the expected snap time **is** a hole (`NO CHAIN {SYM}` or successor). |
| **Wave** | P1 |
| **Blocked on** | none |
| **Litmus** | SSR-H-L5 · spec §10 row 1 |

GTH SPX with `generation: null` → hole. This is the twin of A (AAPL empty is **not**).

---

### AT-SSR-H-P — Unscheduled: no hole-shaped snap

| Field | Value |
|-------|--------|
| **ID** | AT-SSR-H-P |
| **Fact** | Unscheduled + empty (or unscheduled + we did not poll) records `no_session` only. **Do not write** a snap the dash will count as a red hole. |
| **Wave** | P1 |
| **Blocked on** | none |
| **Litmus** | spec §10 rows 3–4 · SSR-H-L12 |

A already requires this for GTH AAPL. P states the write prohibition so dash `summarize_day` cannot see a `hole` field on a no-session name.

---

### AT-SSR-H-Q — Dashboard holes = true holes only

| Field | Value |
|-------|--------|
| **ID** | AT-SSR-H-Q |
| **Fact** | On the **existing** Chain Snapshot dash (`:5055` / `summarize_day`), flag-on **holes** count only L5 holes. A muted **no session** indicator, if present, does not use the hole “bad” color as the primary read. **No second dashboard.** |
| **Wave** | P1 (count) · Echo chrome with W0-3 / Charlie |
| **Blocked on** | none for the count; chrome labels are Echo |
| **Litmus** | SSR-H-L6 · spec §16 |

**Given** — day tree: SPX latest snap `hole: "NO CHAIN SPX"` (scheduled miss); AAPL **absent** (not polled); optional `no_session` sidecar/status listing AAPL.

**Then** — `latest_holes == 1` (SPX only), not 2. No new port / app.

As-built `summarize_day` increments holes when `head.get("hole")` is truthy — that is why **P** forbids writing those files.

---

### AT-SSR-H-R — Mid-phase map reload (next cycle)

| Field | Value |
|-------|--------|
| **ID** | AT-SSR-H-R |
| **Fact** | The tap reloads the map at every phase transition **and** at least once per minute while live. A mid-phase **add** starts polling next cycle; a mid-phase **remove** stops polling (and interest) next cycle. Process cutover of the **flag / binary** remains between phases only. |
| **Wave** | P1 |
| **Blocked on** | none |
| **Litmus** | spec §9.2 |

Inject “minute elapsed” rather than sleeping 60s. Editing the JSON file in `tmp_path` is the fixture.

---

### AT-SSR-H-S — `closed` / `weekend` are never scheduled sessions

| Field | Value |
|-------|--------|
| **ID** | AT-SSR-H-S |
| **Fact** | `closed` and `weekend` are never scheduled. A map that lists them as having a chain is invalid (fail loud flag-on) **or** those tokens are ignored and the clock still does not poll. Pick one in implementation; the test asserts **zero polls** in `closed` / `weekend`. |
| **Wave** | P1 |
| **Blocked on** | none |
| **Litmus** | spec §9.3 · SSR-H-L7 lawful sleep |

Kilo **opinion (not a block):** fail loud if those tokens appear — config over silent ignore. India may pick ignore. The behavioral fact is: no poll, no hole series, no dead-man during lawful sleep.

---

### AT-SSR-H-T — Do not invent instruments

| Field | Value |
|-------|--------|
| **ID** | AT-SSR-H-T |
| **Fact** | Empty GTH is `no_session` or a named empty — **never** a fabricated chain, never a silent debit/credit, never invented strikes. |
| **Wave** | P1 |
| **Blocked on** | none |
| **Litmus** | SSR-H-L12 · DL-309 spirit for the archive |

Assert unscheduled AAPL produces no `generation` object invented by the tap. If a snap exists at all (it should not — **P**), it must not contain synthetic rows.

---

### AT-SSR-H-U — Heartbeat every cycle

| Field | Value |
|-------|--------|
| **ID** | AT-SSR-H-U |
| **Fact** | The collector emits / overwrites a heartbeat document **every chain cycle**. Minimum fields: `at` (America/New_York ISO), `phase`, `day`, `scheduled`, `cycle_snaps`, `pid`. |
| **Wave** | P2 |
| **Blocked on** | none |
| **Litmus** | spec §11.1 |

Flag-off **may** write this document (spec §9.5). Test both flag states if the writer is shared.

Proposed path (Juliet, not Coach): `{LABS_SSR_CACHE_ROOT}/ssr/live_capture/heartbeat.json`. Path may move; fields and “every cycle” may not.

---

### AT-SSR-H-V — Watchdog uses `at`, not mtime

| Field | Value |
|-------|--------|
| **ID** | AT-SSR-H-V |
| **Fact** | A heartbeat whose file mtime is fresh but `at` is > 60s stale **alerts**. A heartbeat whose mtime is old but `at` is fresh **does not**. |
| **Wave** | P2 |
| **Blocked on** | none |
| **Litmus** | spec §11.1 |

---

### AT-SSR-H-W — Lawful sleep is not silence

| Field | Value |
|-------|--------|
| **ID** | AT-SSR-H-W |
| **Fact** | Friday 20:00 ET → Sunday 20:15 ET (`closed` / `weekend`) is **not** a dead-man event even if the heartbeat is stale or the tap is sleeping. Watchdog uses the same `phase_at` clock. |
| **Wave** | P2 |
| **Blocked on** | none |
| **Litmus** | SSR-H-L7 · spec §11.3 · DL-431 |

Use injected Friday 21 Aug 2026 21:00 ET and Saturday noon. Align with existing `test_phase_at_max_published_window` / `test_next_wake_friday_night_is_sunday_gth`.

---

### AT-SSR-H-X — Watchdog is a separate process (not a tap thread)

| Field | Value |
|-------|--------|
| **ID** | AT-SSR-H-X |
| **Fact** | Watchdog code does **not** live in `ssr_live_capture.py` and is not started from `LiveTap.run`. A tap crash must not take the watchdog. |
| **Wave** | P2 |
| **Blocked on** | Foxtrot launchd design (W0-4); test is import / entry-point identity |
| **Litmus** | SSR-H-L7 |

Characterization: `ssr_live_capture` does not import the watchdog’s `main` loop; watchdog module path is distinct; launchd label is not the tap’s `ai.fattail.labs.ssr-live-capture`. Do **not** start launchd in pytest.

---

### AT-SSR-H-Y — No invented alert channel

| Field | Value |
|-------|--------|
| **ID** | AT-SSR-H-Y |
| **Fact** | `LABS_SSR_ALERT_CHANNEL` unset / OPEN. Watchdog and audit **do not** send Slack, email, SMS, Discord, or PagerDuty. Local log + named dash/report state **is** the alert until Coach specifies. |
| **Wave** | P2 · P4 summary line |
| **Blocked on** | none |
| **Litmus** | OD-SSR-H-1 · spec §7.2 · §11.2 · §12 |

P4 still **formats** a summary line into `AUDIT.json` / dash. Formatting is not sending.

---

### AT-SSR-H-AA — 30s synthetic flags at every in-band cadence

| Field | Value |
|-------|--------|
| **ID** | AT-SSR-H-AA |
| **Fact** | The C fixture’s 30s gap flags when intended cadence is 2, 3, 4, or 5. |
| **Wave** | P4 |
| **Blocked on** | P4 |
| **Litmus** | spec §10 test law |

Parametrize C. Ship as one test if C is already parametrized; keep the ID so Delta can tick it.

---

### AT-SSR-H-AB — Do not re-audit Friday into a 2s hole series

| Field | Value |
|-------|--------|
| **ID** | AT-SSR-H-AB |
| **Fact** | Running the gap audit against a labeled 5-min Friday **2026-08-14** fixture must **not** emit a 2s-cadence hole series and must **not** rewrite snaps. |
| **Wave** | P4 |
| **Blocked on** | P4 |
| **Litmus** | spec §10 last row · **F** |

Either skip that day with a named reason in the report, or audit it **as 5-min** (intervals ~300s are not holes). Do not treat ~300s Friday gaps as 2s failures.

---

### AT-SSR-H-AC — Dated audit report lives with the day

| Field | Value |
|-------|--------|
| **ID** | AT-SSR-H-AC |
| **Fact** | After last phase closes, audit writes a dated report on the **cache** day tree (`day=YYYY-MM-DD/AUDIT.json` and/or `AUDIT.md`). Per symbol, per phase: intended cadence, actual intervals, every exceeded interval + timestamps. Summary line in the report (channel OPEN → do not send). |
| **Wave** | P4 |
| **Blocked on** | P4 · OD-SSR-H-8 (exact weeknight trigger) does **not** block the fixture “run audit on this tree.” |
| **Litmus** | spec §12 · SSR-H4 |

---

## 4. Later-wave rows (list now; implement with the packet)

Named so H5–H7 do not invent a second contract. **Not** required green before W1-G.

### AT-SSR-H-AD — Quote-sanity flags recorded, never cleaned

| Field | Value |
|-------|--------|
| **ID** | AT-SSR-H-AD |
| **Fact** | Per snap, flags (`crossed`, `locked`, `stale_quote`, `zero_bid_deep_itm`, `missing_iv`, `missing_greeks`, `schema_drift`) persist on the snap (or sibling `flags`). Daily counts roll into H4 `AUDIT.json`. Nothing is dropped or “fixed.” |
| **Wave** | P5 |
| **Blocked on** | P5 · OD-SSR-H-6 (numeric stale / deep-ITM defaults) — tests may inject thresholds |
| **Litmus** | SSR-H-L10 · spec §13 |

One fixture row per flag. Assert the provider bid/ask/IV bytes are unchanged.

---

### AT-SSR-H-AE — Never delete raw until compressed archive verifies

| Field | Value |
|-------|--------|
| **ID** | AT-SSR-H-AE |
| **Fact** | After H4: compress per day per symbol; checksum each; verify on read; **delete raw only after verify succeeds**. Failed verify leaves raw. |
| **Wave** | P6 |
| **Blocked on** | P6 · OD-SSR-H-9 (algorithm; sha256 is opinion) |
| **Litmus** | SSR-H-L11 · spec §14 |

---

### AT-SSR-H-AF — Stalled gold aborts the roll

| Field | Value |
|-------|--------|
| **ID** | AT-SSR-H-AF |
| **Fact** | A stalled gold `open()` **aborts the roll**, leaves cache raw, named ops state. It is **not** a silent skip that later deletes cache. `LABS_SSR_GOLD_COPY` stays opt-in. |
| **Wave** | P6 |
| **Blocked on** | P6 · OD-SSR-H-5 |
| **Litmus** | SSR-H-L11 · spec §3 gold stall |

Simulate `open()` failure on the gold dest. Assert raw still on `LABS_SSR_CACHE_ROOT`.

---

### AT-SSR-H-AG — Replay verifier stub is reachable and honest

| Field | Value |
|-------|--------|
| **ID** | AT-SSR-H-AG |
| **Fact** | Stub CLI/module names a day, reads that day’s archive, and **refuses** with a named `NOT IMPLEMENTED` / `STUB`. It does **not** pretend to have diffed. |
| **Wave** | P7 |
| **Blocked on** | P7 · OD-SSR-H-7 (full path only) |
| **Litmus** | spec §15 · SSR-H7 |

---

## 5. Coverage map

| Spec / Coach | Rows |
|--------------|------|
| Coach (a) GTH no-session not polled, not a hole | **A** · M · O · P · Q · T |
| Coach (b) heartbeat silence alerts | **B** · U · V · W · X · Y |
| Coach (c) audit flags synthetic 30s gap | **C** · AA · AC |
| Phase-transition single `"no session"` line | **D** |
| `LABS_SSR_HARDENING=0` / unset = poll-all | **E** · I |
| Friday **2026-08-14** not rewritten | **F** · AB |
| Flag-on missing session map fail-loud | **G** · H · L |
| Session map config / aliases / defaults | J · K · L · R · S |
| Interest drop / Massive honesty | A · M · N |
| Dash honesty, existing port only | Q |
| Quote flags / retain / replay stub | AD · AE · AF · AG |

| OPEN item | Test posture |
|-----------|----------------|
| **OD-SSR-H-1** alert channel | **Y** — local fail-loud only; do not invent a sender |
| **OD-SSR-H-2** cadence pick | Out of this list as a change. Cadence tests stay in `test_ssr_live_capture_cadence.py`. |
| **OD-SSR-H-3** hole-tolerance default | **C** / **AA** still flag 30s without a frozen default |
| **OD-SSR-H-4** full 18-name table | Fixtures only; do not freeze the fourteen names |
| **OD-SSR-H-5…9** | Named on AD–AG; do not close here |

---

## 6. Explicit non-tests (do not add)

| Not a row | Why |
|-----------|-----|
| Live StudioOne SSH / launchd kickstart | Zero downtime; tonight is already `gth` |
| Hitting Massive or Redis | Tap is a reader; tests use a fake store |
| Inventing Slack/email to “complete” B | Channel **OPEN** |
| Changing `LABS_SSR_CHAIN_EVERY_S` | REPORT ONLY (Lima W0-6) |
| Member Labs / Options Lab / Strategy Lab UI | Wrong surface |
| Second dashboard / new port | SSR-H-L6 / SSR-H10 |
| Rewriting or re-cadencing Friday **2026-08-14** | Archive law |
| Full SSR product replay (Arch 31) | H7 is a stub |
| Sleeping to prove 60s or 30s | Non-deterministic |

---

## 7. Implementation order (tests travel with code)

```text
P1  A D E F G H I J K L M N O P Q R S T
P2  B U V W X Y          (heartbeat may already write in P1 flag-off)
P4  C AA AB AC
P5  AD
P6  AE AF
P7  AG
```

W1-G may go with **P1–P3** only if A, D, E, F, G and B are green (or B explicitly deferred with Coach — default is **B with P2 before cutover**). C waits for P4.

---

## 8. Kilo bench delta

What the next invocation can do that it could not before this file:

- Implement P1 session-map + hole tests from **A / D / E / F / G** without inventing poll or hole semantics.
- Prove the watchdog with a **frozen `at`**, not a 60s sleep.
- Prove the audit with a **synthetic 30s timestamp pair**, not a live wait.
- Fail-loud the missing map when `LABS_SSR_HARDENING=1` instead of silently returning to poll-all.

**Coach content intact?** Yes — (a)(b)(c) are **A/B/C**. Edges from the seed and this packet (phase-transition line, flag-off poll-all, Friday untouched, flag-on missing map fail-loud) are **D/E/F/G**.

**Changed or dropped from Coach?** Nothing. Kilo added implementable Given/When/Then, determinism rules, and P1–P7 companion rows so the list is complete enough to code against.

**Pytest added this packet?** **No.**
