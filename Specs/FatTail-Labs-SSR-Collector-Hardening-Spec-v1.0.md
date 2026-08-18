# FatTail Labs — SSR Collector Hardening Spec v1.0

**Status:** **BUILD AUTHORITY** (Coach auto-GO 2026-08-18 · W0-G PASS).  
**Date:** 2026-08-18  
**Current revision:** **v1.0** (draft)  
**Type:** Ops / gold-archive spec (**StudioOne**). **Not** a member product surface.  
**Short name:** **SSR Collector Hardening** · **SSR-H**  
**Canonical filename:** `Specs/FatTail-Labs-SSR-Collector-Hardening-Spec-v1.0.md`  
**Board:** [`agents/p-ssr-collector-hardening/`](../agents/p-ssr-collector-hardening/)  
**Coach stamp:** [`agents/p-ssr-collector-hardening/seeds/W0-0-coach-stamp.md`](../agents/p-ssr-collector-hardening/seeds/W0-0-coach-stamp.md)

**Host:** StudioOne gold archive. **Not** MiniTwo. **Not** StudioTwo as writer.  
**Audience:** Coach · India · Juliet · Foxtrot · Echo · Kilo · Lima · Alpha · Charlie · Delta

**Coach Content Law (doctrine §11 · DL-176):** Nothing of Coach’s is removed. Formal laws project the packet; they do not replace it. Reviewer objections sit **beside** the text, labeled as the reviewer’s, for Coach to accept or throw out.

---

## 0. Phase 0 — Coach intent (verbatim, nothing removed)

The following is the **full verbatim packet** from `agents/p-ssr-collector-hardening/seeds/W0-0-coach-stamp.md` after the seed chrome. Nothing below this heading is edited, shortened, or rephrased.

---

# Chain Snapshot Collector — Hardening Spec (Studio One)

Role: orchestrate this through the agent bench. Do NOT implement it yourself. Run the full gate sequence, auto-GO through clean gates, stop only on a problem, and every report carries an explicit GO / NO-GO verdict.

## Context
The collector on Studio One is live: 18 symbols, 2s cadence, gth phase, dashboard shows 3492 snaps and 14 "holes." Collection begins on premarket data tomorrow morning and must run every market day going forward. The archive is the product; gaps are permanent. Nothing here may risk the existing archive or interrupt tomorrow's premarket start.

## Problems observed
1. During GTH the collector polls all 18 symbols. Only SPX, XSP, IWM, USO have overnight chains. The other 14 return no chain and are recorded as holes. These are not holes; they are expected empties. This wastes 14 requests every cycle all night and makes the hole counter permanently red.
2. Cadence is 2s. Original spec was 3-5s. Confirm which is intended before RTH tomorrow and size disk + provider quota accordingly. Do not change cadence without reporting the storage and quota math.

## Required changes
### 1. Phase-aware symbol scheduling
- Maintain a per-symbol session map: which phases (gth / premarket / rth / postmarket) each symbol has a listed options chain in.
- Poll a symbol only during phases where it has a session. Log a single "no session" line per symbol per phase transition, not per cycle.
- Session map is config, not code. Editable without a redeploy.

### 2. Hole semantics
- Define hole = expected snap missing or interval exceeded. Empty response outside a symbol's session is NOT a hole.
- Dashboard "holes" counter reflects only true holes. Add a separate muted "no session" indicator if useful.

### 3. Dead-man's switch
- Collector emits a heartbeat every cycle.
- Independent watchdog (separate process, not inside the collector) alerts if heartbeat is silent > 60s during any live phase for any scheduled symbol. Alert channel: [Coach to specify]. Fail loud.

### 4. Post-close gap audit
- Runs after last phase closes each day. Per symbol, per phase: intended cadence vs actual, every interval that exceeded tolerance, with timestamps. Writes a dated report to the archive alongside the data. Summary line to the alert channel.

### 5. Quote sanity pass
- Per snap, flag: crossed or locked markets, stale quote timestamps relative to snap time, zero-bid deep ITM, missing greeks/IV where rows exist, schema drift from provider (new/missing fields).
- Flags are recorded, never dropped or "cleaned." Daily count in the gap audit report.

### 6. Retention + integrity
- Roll raw snaps into a compressed per-day, per-symbol archive after the audit. Checksum each. Verify checksum on read. Never delete raw until the compressed archive verifies.

### 7. Replay verifier (stub is acceptable now, full later)
- Read a day's archive, drive it through the same surface code path used live, diff against what was rendered live. Report divergence. This proves "replay as if live" before Strategy Lab depends on it.

## Constraints
- Zero downtime to the running collector. Deploy behind a flag; cut over between phases, not mid-phase.
- Config over code for session maps, cadence, tolerances, alert channel.
- Everything logs to the existing dashboard; no second dashboard.
- Tests must include: symbol with no session in GTH is not polled and not counted as a hole; heartbeat silence triggers alert; audit correctly flags a synthetic 30s gap.

## Deliverables
- Gate reports under the project's gate-reports/ path with GO / NO-GO.
- Cadence decision + storage/quota math as a single report before RTH tomorrow.
- Decision-log entry per approved change.

Priority order: 1, 2, 3 before tomorrow's open if possible. 4, 5, 6 this week. 7 stubbed.

---

**Open Coach inputs (do not invent):**

- Alert channel: **UNSPECIFIED**
- Cadence pick: **REPORT ONLY** until Coach chooses after the math

---

*(End of verbatim Phase 0 packet.)*

---

## 1. Authority and what this file is

| This file is | This file is **not** |
|--------------|----------------------|
| Juliet Phase 1 **DRAFT** of Coach’s hardening packet | **BUILD AUTHORITY** |
| Ops / gold-archive law for the StudioOne collector | A member Labs surface Spec |
| The Ideas inventory and sequencing for W0 → W2 | A cadence change |
| The hole / session / watchdog / audit contract | An alert-channel invention |

**Build may start only after** W0-G **PASS** and Coach stamps **BUILD AUTHORITY**. Until then: review, characterization lists, cadence **math**, and flag-off design only. **Do not** restart `ai.fattail.labs.ssr-live-capture` mid-phase.

**Juliet did not drop Coach scope.** Formal sections below **project** the packet. If a later reviewer wants something out, the packet in §0 stays and the objection is labeled beside it.

---

## 2. Ideas inventory (Phase 0 — complete)

Every required change and constraint from §0 is listed. Nothing is silently omitted. Disposition is **IN-SCOPE** unless Coach later disposes it.

| ID | Idea (Coach) | Disposition | Priority | Ship window |
|----|--------------|-------------|----------|-------------|
| **SSR-H1** | Phase-aware symbol scheduling — per-symbol session map; poll only in session; one “no session” log per symbol per phase transition; config not code | **IN-SCOPE** | **P0** | **1–3 before tomorrow’s open** if possible |
| **SSR-H2** | Hole = expected snap missing **or** interval exceeded. Empty outside session is **not** a hole. Dashboard holes = true holes only. Muted “no session” indicator if useful | **IN-SCOPE** | **P0** | **1–3 before open** |
| **SSR-H3** | Dead-man’s switch — heartbeat every cycle; **independent** watchdog process; alert if silent **> 60s** during any live phase for any scheduled symbol; fail loud | **IN-SCOPE** | **P0** | **1–3 before open** |
| **SSR-H4** | Post-close gap audit — after last phase closes; per symbol per phase; intended vs actual cadence; every interval over tolerance with timestamps; dated report in the archive; summary line to the alert channel | **IN-SCOPE** | **P1** | **This week** |
| **SSR-H5** | Quote sanity pass — per snap flags (crossed/locked, stale quote vs snap time, zero-bid deep ITM, missing greeks/IV where rows exist, schema drift). Flags recorded, never dropped or “cleaned.” Daily count in the gap audit | **IN-SCOPE** | **P1** | **This week** |
| **SSR-H6** | Retention + integrity — roll raw into compressed per-day, per-symbol archive after the audit; checksum each; verify on read; never delete raw until compressed archive verifies | **IN-SCOPE** | **P1** | **This week** |
| **SSR-H7** | Replay verifier — read a day’s archive, drive the same surface code path used live, diff vs what was rendered live, report divergence. **Stub is acceptable now, full later** | **IN-SCOPE** (stub now) | **P2** | **Stub this program**; full later |
| **SSR-H8** | Zero downtime. Deploy behind a flag. Cut over **between** phases, never mid-phase | **IN-SCOPE** | **P0** | Every cutover |
| **SSR-H9** | Config over code for session maps, cadence, tolerances, alert channel | **IN-SCOPE** | **P0** | With H1–H4 |
| **SSR-H10** | Everything logs to the **existing** Chain Snapshot dashboard; **no second dashboard** | **IN-SCOPE** | **P0** | With H2 / Echo |
| **SSR-H11** | Coach-required tests: (a) no-session GTH symbol not polled and not a hole; (b) heartbeat silence triggers alert; (c) audit flags a synthetic 30s gap | **IN-SCOPE** | **P0** | W0-5 list → implement with P1–P4 |
| **SSR-H12** | Gate reports with **GO / NO-GO**. Cadence decision + storage/quota math as **one report before RTH tomorrow**. DL entry per approved change | **IN-SCOPE** | **P0** | W0-6 Lima + W0-G + Lima on each ship |
| **SSR-H13** | Cadence confirmation before RTH. **Do not change cadence** without the storage + quota math | **IN-SCOPE** as **REPORT ONLY** | **P0 report** | Lima W0-6; **no number change until Coach picks** |
| **SSR-H14** | Alert channel: Coach to specify | **IN-SCOPE**, channel **OPEN** | blocks **delivery** of alerts, not spec review | Wait Coach |

**Not discarded. Not parked. Not reshaped.** Flagged-ideas: **none** — inventory intact.

---

## 3. As-built (StudioOne · 2026-08-18)

Honest snapshot of the live plane. Hardening builds on this. It does not rewrite Friday.

| Item | As-built |
|------|----------|
| Host | **StudioOne** (`studioone.local` · `192.168.1.111`). One writer. |
| Tap | `server/market_data/ssr_live_capture.py` · launchd `ai.fattail.labs.ssr-live-capture` |
| Dash | `server/market_data/ssr_snapshot_dash.py` · launchd `ai.fattail.labs.ssr-snapshot-dash` · **`:5055`** (LAN `0.0.0.0` or localhost; **DL-429**) |
| Writers of Massive | `chain_feed` + `sym_feed` only. The tap is a **reader**. It does **not** call Massive. Arch **28**. |
| Symbols | Enabled Admin universe tradeable set — **18** chain names (Coach). Reference marks (VIX / VIX1D) stay on the mark tape; they do not get a fake options chain (**DL-428**). |
| Cadence (live) | **2s** disk snaps (`LABS_SSR_CHAIN_EVERY_S` default **2**, fail-loud outside **[2, 5]**). |
| Phase clock | `phase_at`: **`gth` / `pre` / `rth` / `extended` / `closed` / `weekend`** |
| Published window | **DL-431:** Massive **4:00 AM–8:00 PM ET** (pre 4:00–9:30, RTH 9:30–4:00, after 4:00–8:00) **plus** Cboe overnight GTH **8:15 PM–9:25 AM ET** weeknights (Sun–Thu nights). Sleep **only** Friday **8:00 PM → Sunday 8:15 PM**. |
| GTH listed (Coach observation tonight) | **SPX, XSP, IWM, USO** have overnight chains. The other **14** return no chain. |
| Holes today | Dashboard **3492** snaps and **14** “holes” — those 14 are **expected GTH empties**, currently counted as holes. |
| Gold volume | `/Volumes/FatTail2TB/fattail-market-data` — **`open()` has stalled**. Must not sit on the live write or dash HTTP path. |
| Live writes | Local SSD cache **`~/Library/Caches/fattail-ssr`** (`LABS_SSR_CACHE_ROOT`). `LABS_SSR_GOLD_COPY=1` is opt-in after the disk is healthy. Dash `scan_roots()` reads the **cache only**. |
| Write-once | `snap-…json`; collision → `snap-…__N.json`. Friday **2026-08-14** is labeled **5-min** and is **not rewritten** (**DL-400 / DL-428**). |
| Interest | Tap `touch_interest` every **15s** on **every** chain topic. `chain_feed` fetches whatever interest is live (grace `LABS_MB_INTEREST_GRACE_S` default **45**). Polling all 18 in GTH therefore costs **14 extra Massive chain snapshots every cycle**. |
| Tonight | **2026-08-18 ~00:15 ET** — already **`gth`**. Do not cut over mid-phase. |
| Next cutover windows | **4:00 AM ET** (`gth` → `pre` start), or **9:25–9:30 AM ET** (GTH → RTH). |

Monday **2026-08-17** is a named hole (tap never started) — **DL-428**. Do not invent that day.

---

## 4. Cadence history (report only — not a pick)

**This Spec does not change the live 2s number.** Lima reports storage + quota math. Coach picks. Until that pick, as-built **2s** stays.

| When | Ruling | Band | Default | Fail-loud |
|------|--------|------|---------|-----------|
| **OD-6 / DL-400** (2026-08-16) | Gold chain cadence from **2026-08-17** open | **3–5s** | **4s** | outside [3, 5] |
| **DL-428** (2026-08-17) | Tighter gold disk cadence; all universe symbols; pre + extended | **2–5s** | **2s** | outside [2, 5]; **5-min forbidden** |
| **This Spec (DRAFT)** | Confirm which is intended before RTH **2026-08-18**; size disk + provider quota | **REPORT ONLY** | — | Do not change `LABS_SSR_CHAIN_EVERY_S` as law in this file |

Friday **2026-08-14** remains **5-min as captured** under both rulings. Not rewritten.

**Juliet opinion (not a block):** Lima’s report should show, for 18 names vs GTH-4 names, at 2s / 3s / 4s / 5s: snaps/day, GB/day on the SSD cache, and Massive chain-snapshot count/day. Coach then picks. Opinion only.

---

## 5. Problem (what we saw)

1. **False holes.** GTH polls 18 names. Fourteen have no listed overnight chain. Empty generations are written and counted as holes. The dash stays red. Those are **expected empties**, not archive gaps.
2. **Wasted Massive.** Those 14 topics stay warmed (`touch_interest` → `chain_feed` fetch) all night.
3. **No dead-man.** If the tap dies in a live phase, nothing independent yells. The archive is the product; a silent death is a permanent gap.
4. **No daily gap audit / quote flags / verified roll-up.** Raw JSON on cache is the whole story. Gold volume is sick; we must not pretend the Sabrant tree is the live SoR tonight.
5. **Cadence was moved** (3–5s → 2–5s default 2s) without a single storage/quota report in front of tomorrow’s RTH. Coach wants that report **before** any further change.

---

## 6. Success / acceptance

A later build is successful when:

1. In **GTH**, only session-mapped names are **polled** (interest touched + snap written). A no-session name is **not** a hole.
2. One `"no session"` log line per symbol **per phase transition**, not per cycle.
3. Dashboard **holes** = true holes only. Optional muted **no session** count (Echo).
4. Heartbeat every cycle. Independent watchdog alerts if silent **> 60s** in a live phase for any **scheduled** symbol. Fail loud. Channel still **OPEN**.
5. After last phase closes: dated per-symbol, per-phase gap report in the archive; summary line ready for the (still OPEN) alert channel.
6. Sanity flags persist on the snap; daily counts appear in that report; nothing is cleaned.
7. Raw is not deleted until the compressed per-day, per-symbol archive **checksum-verifies**.
8. Replay verifier **exists as a stub** (entry + “not implemented” / fixture path). Full replay later.
9. Zero downtime: flag off = today’s poll-all. Cut over only between phases.
10. Coach tests (a)(b)(c) green. Friday **2026-08-14** untouched.

---

## 7. Product boundary and non-goals

### 7.1 In

StudioOne collector, cache, gold archive, Chain Snapshot dash `:5055`, launchd, watchdog process, config files, characterization tests, Lima cadence report, decision-log entries.

### 7.2 Out (this Spec)

| Out | Why |
|-----|-----|
| Member Labs UI / Options Lab / Strategy Lab chrome | Not a member product surface |
| MiniTwo / production web | Different host; different job |
| StudioTwo as a second writer | One writer. Dual tap on the same `day=` breaks write-once |
| Calling Massive from the tap or the dash | Arch **28** — feeds only |
| Inventing an alert channel (Slack, email, SMS, Discord, …) | Coach **UNSPECIFIED** · **OPEN** |
| Changing live cadence in this file | **REPORT ONLY** |
| Restarting the live tap **mid-`gth`** | Zero downtime · tonight is already GTH |
| Rewriting Friday **2026-08-14** | Labeled 5-min; law |
| Inventing strikes or filling empty chains | OT-EF / DL-309 spirit for the archive — representable or named |
| A second dashboard | Coach: existing dash only |
| Structure Surface Replay **product** (Arch **31** / SSR thesis) | Adjacent consumer later; H7 stub is collector-side proof, not member Surface |

---

## 8. Laws (normative when this Spec is BUILD AUTHORITY)

Laws **project** §0. They do not replace it.

### SSR-H-L1 — The archive is the product

Gaps are permanent. Nothing in this program may risk the existing archive or interrupt tomorrow’s premarket start.

### SSR-H-L2 — Session map is config, not code

Per-symbol phases live in a file. Editable **without a redeploy**. See §9.

### SSR-H-L3 — Poll only in session

A symbol is **polled** in a phase only if the session map says that symbol has a listed options chain in that phase.

**Poll** means both:

1. Write a chain snap for that symbol, **and**
2. `touch_interest` on that symbol’s ladder topic(s).

Stopping the disk write but leaving interest warm **still wastes Massive** (`chain_feed` fetches live interest). That fails Coach’s “not polled.”

On a phase transition, drop interest for names leaving session (stop touching; let `LABS_MB_INTEREST_GRACE_S` expire). Touch only scheduled names.

### SSR-H-L4 — One “no session” line per symbol per phase transition

Not per cycle. Not a hole.

### SSR-H-L5 — Hole

**Hole** = **expected snap missing** **or** **interval exceeded**.

Empty / no-chain **outside** a symbol’s session is **not** a hole.

### SSR-H-L6 — Dashboard honesty

The existing **holes** counter counts **true holes only**. A separate muted **no session** indicator may be added **on this dash** if Echo finds it useful. **No second dashboard.**

### SSR-H-L7 — Heartbeat + independent watchdog

Collector emits a heartbeat **every cycle**. Watchdog is a **separate process**, not a thread inside the tap. Alert if heartbeat is silent **> 60s** during **any live phase** for **any scheduled symbol**. Fail loud.

**Live phase** = a clock phase that is not `closed` / `weekend`, **and** at least one symbol is scheduled. Lawful sleep (Friday 8:00 PM → Sunday 8:15 PM) is **not** silence.

**Alert channel: OPEN.** Do not invent Slack/email. Watchdog must still **fail loud locally** (log + non-zero / named state the dash can show) so the switch is real before the channel exists.

### SSR-H-L8 — Zero downtime, flag, between phases

Ship behind a flag. **Flag off** = today’s poll-all (including GTH empties-as-holes). Cut over **between** phases, never mid-phase.

Tonight (**2026-08-18**) is already **`gth`**. Do not unload or kickstart the tap until a named window:

| Window (America/New_York) | Meaning |
|---------------------------|---------|
| **4:00 AM ET** | `gth` → `pre` start |
| **9:25–9:30 AM ET** | GTH → RTH (Coach) |

**Juliet opinion (not a block):** prefer **4:00 AM ET** if W0-G + Coach GO land before then, so premarket tomorrow is already phase-aware. If not, hold the flag and take **9:25–9:30**. Opinion only.

### SSR-H-L9 — Config over code

Session map, cadence, tolerances, and alert channel are **config**. Missing required config **fails loud**. No silent defaults that change poll set or delete raw.

### SSR-H-L10 — Flags are recorded, never cleaned

Quote-sanity flags stay on the snap. We do not drop, rewrite, or “fix” provider rows.

### SSR-H-L11 — Never delete raw until the compressed archive verifies

After the day’s audit: roll raw → compressed per-day, per-symbol archive; checksum each; verify checksum on read. Delete raw **only** after that verify succeeds.

**Tonight:** gold volume `open()` is stalled. Rolling onto FatTail2TB must **not** block or stall the tap. Live raw stays on the SSD cache until gold is healthy enough to accept the roll. `LABS_SSR_GOLD_COPY` stays opt-in.

### SSR-H-L12 — Do not invent instruments

Empty GTH is **no session** or **NOT TRADED**, never a fabricated chain, never a silent debit/credit. Adjacent to **DL-309** / OT-EF for the archive.

### SSR-H-L13 — Cadence is report-only in this draft

Do not treat a new seconds value as law here. Lima math, then Coach.

---

## 9. Session map (config)

### 9.1 Paths (proposal)

| Kind | Path |
|------|------|
| **Repo / StudioOne default** | `data/ssr/session-map.json` (under the Labs checkout, typically `~/Fattail-Labs/data/ssr/session-map.json`) |
| **Override** | `LABS_SSR_SESSION_MAP` = absolute path to a JSON file |

If `LABS_SSR_SESSION_MAP` is **set** and the file is missing or unreadable → **fail loud** (do not silently poll-all, do not silently poll-none).

If the env is **unset**, load the default path. If the default file is missing **and** the hardening flag is **on** → fail loud. If the flag is **off**, ignore the map (today’s poll-all).

**Juliet opinion (not a block):** keep the file in git as the checked-in starting map; operators may point `LABS_SSR_SESSION_MAP` at a StudioOne-local copy they edit without a git pull. Opinion only.

### 9.2 Editable without redeploy

The tap **reloads** the map:

1. At every **phase transition**, and
2. At least once per minute while live (so an edit during a long phase is picked up **for the next cycle’s schedule** without a process restart).

A mid-phase edit that **adds** a symbol may start polling that symbol on the next cycle. A mid-phase edit that **removes** a symbol must **stop polling** it on the next cycle (and stop interest). That is a config edit, not a “cut over.” **Process** cut over (new binary / new flag) remains **between phases only** (L8).

### 9.3 Phase tokens

Coach names: **`gth` / `premarket` / `rth` / `postmarket`**.

As-built clock (`phase_at`): **`gth` / `pre` / `rth` / `extended` / `closed` / `weekend`**.

| Config token (accepted) | Clock token |
|-------------------------|-------------|
| `gth` | `gth` |
| `premarket`, `pre` | `pre` |
| `rth` | `rth` |
| `postmarket`, `post`, `extended` | `extended` |

`closed` and `weekend` are **never** scheduled sessions. Do not list them as having a chain.

### 9.4 Schema (v1)

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

| Field | Law |
|-------|-----|
| `version` | `1` for this Spec. Unknown version + flag on → fail loud. |
| `timezone` | Must be `America/New_York`. Anything else → fail loud. |
| `default_phases` | Used for any **enabled tradeable** universe symbol **not** listed under `symbols`. |
| `symbols` | Explicit per-name phase lists. Names are product symbols (SPX not `I:SPX`). |

**Initial GTH set is Coach’s observation (2026-08-18):** SPX, XSP, IWM, USO. The other fourteen inherit `default_phases` (no GTH).

**Full 18-name table:** **OPEN** — fill from Admin `market_symbol_universe` (enabled, role ≠ reference) plus the first week of evidence. Do not invent the fourteen names in this Spec.

### 9.5 Flag

| Env | Off (default) | On |
|-----|---------------|----|
| `LABS_SSR_HARDENING` | Today’s poll-all. Map ignored for scheduling. Holes stay as-built (empty = hole). Heartbeat **may** still be written (so watchdog can be proven flag-off). | L3–L6 session + hole laws apply. |

Granular later flags are allowed **in addition**, not instead, if India wants them — they must default **off**.

---

## 10. Hole semantics (detail)

| Event | Hole? | What we record |
|-------|-------|----------------|
| Scheduled symbol, no generation at expected snap time | **Yes** — expected snap missing | Named hole (`NO CHAIN {SYM}` or successor name) |
| Scheduled symbol, gap between consecutive snaps **exceeds tolerance** | **Yes** — interval exceeded | Hole + timestamps |
| Unscheduled symbol, empty / no chain | **No** | `no_session` (not a hole). At most one log line this phase. **Do not write** a hole-shaped snap that the dash will count red. |
| Unscheduled symbol, we did not poll | **No** | Same `no_session` |
| Gold volume stall on an **optional** gold copy | **No** (not a chain hole) | `gold_write_fail` log. Cache write is the live success. |
| Friday 2026-08-14 5-min labeled tape | n/a | Do not rewrite; do not re-audit into a 2s hole series |

**Tolerance** is config (`LABS_SSR_HOLE_TOLERANCE_S` or a field on the session map). Default seconds: **OPEN** (do not invent a number as law).

**Test law:** a **synthetic 30s gap** on a scheduled symbol **must** flag, at the live 2s cadence and at any cadence Coach later picks in [2, 5].

Dashboard:

- **Holes** = count of true holes (L5).
- **No session** = muted, optional (Echo W0-3). Must not use the hole “bad” color as the primary read.

---

## 11. Dead-man’s switch (detail)

### 11.1 Heartbeat (inside the tap)

Every chain cycle, write a small heartbeat document (overwrite is allowed; this is not the archive).

**Proposed path (Juliet, not Coach):**

`{LABS_SSR_CACHE_ROOT}/ssr/live_capture/heartbeat.json`

Minimum fields:

```json
{
  "at": "2026-08-18T00:15:00-04:00",
  "phase": "gth",
  "day": "2026-08-18",
  "scheduled": ["SPX", "XSP", "IWM", "USO"],
  "cycle_snaps": 4,
  "pid": 1234
}
```

`at` is America/New_York ISO. Watchdog keys off `at` age, not file mtime alone (mtime can lie after a copy).

### 11.2 Watchdog (separate process)

- Own launchd label (Foxtrot designs; example name `ai.fattail.labs.ssr-watchdog` — **opinion**).
- Must **not** live in `ssr_live_capture.py`.
- Must **not** share a fate with the tap (a tap crash must not take the watchdog).
- If `now - heartbeat.at > 60s` **and** current phase is live **and** `scheduled` is non-empty → **alert**.
- Fail loud: process log + a dash-readable state file (same cache tree).
- **Alert channel: OPEN.** The “alert” until Coach specifies is: loud local log + named dash state. **Do not** add Slack, email, PagerDuty, or Discord in this program.

### 11.3 Closed / weekend

Collector lawful sleep is not a dead-man event. Watchdog must know the same clock (`phase_at` / session map) so Friday night is quiet.

---

## 12. Post-close gap audit (this week · H4)

Runs after the **last phase of the weekday** closes (as-built: Friday `extended` → `closed` at 20:00 ET; weeknights the “day” rolls — **OPEN** exact trigger: last `extended` of the calendar day vs Friday-only; India + Foxtrot settle without shrinking Coach’s “after last phase closes each day”).

Per **symbol**, per **phase** in that symbol’s map:

- Intended cadence (`LABS_SSR_CHAIN_EVERY_S` as written that day)
- Actual intervals
- Every interval that **exceeded tolerance**, with timestamps

Writes a **dated report** next to the day’s data, e.g.:

`day=YYYY-MM-DD/AUDIT.json` (and/or `AUDIT.md`) on the **cache** day tree; copy to gold when gold is healthy.

Summary line is formatted for the alert channel. Channel **OPEN** → write the summary into the report and the dash; do not invent a sender.

---

## 13. Quote sanity (this week · H5)

Per snap, **flag** (do not repair):

| Flag | Meaning |
|------|---------|
| `crossed` | Bid > ask on a row |
| `locked` | Bid == ask on a row |
| `stale_quote` | Quote timestamp older than snap time by more than the stale tolerance |
| `zero_bid_deep_itm` | Deep ITM row with bid 0 |
| `missing_iv` | Row exists, IV missing |
| `missing_greeks` | Row exists, delta/gamma/theta/vega missing |
| `schema_drift` | Provider fields new or missing vs the last known schema |

Stale tolerance and “deep ITM” definition: **OPEN** (config; Hotel/India may propose; not invented as law here).

Flags live **on the snap** (or a sibling `flags` object). Daily counts roll into **H4** `AUDIT.json`. Never dropped, never cleaned.

---

## 14. Retention + integrity (this week · H6)

After H4 audit for that day:

1. Compress raw snaps **per day, per symbol**.
2. Checksum each archive (algorithm **OPEN** — sha256 is the obvious choice; Juliet opinion, not law).
3. Verify checksum **on read**.
4. **Never delete raw** until that verify succeeds.

Source of raw tonight = **SSD cache**. Destination of compressed gold = FatTail2TB **when `open()` is healthy**. A stalled gold `open()` **aborts the roll**, leaves raw, and is a named ops state — not a silent skip that later deletes cache.

---

## 15. Replay verifier (stub now · H7)

**Full later.** Stub **now** is in-scope.

Stub minimum:

- A module or CLI entry that **names** the day, reads that day’s archive (cache or verified compressed), and **refuses** with a named `NOT IMPLEMENTED` / `STUB` until the full path exists.
- Characterization test: stub is reachable and does not pretend to have diffed.
- Design note (not code in W0): “same surface code path used live” means the **collector’s** snap → whatever Strategy Lab / Surface will consume — **not** a second pricer. Adjacent to Arch **31**; do not implement SSR product from this stub.

Full (later): drive the day through that path; diff against what was rendered live; report divergence. That proof is required **before** Strategy Lab depends on the archive as if-live.

---

## 16. Dashboard (existing Chain Snapshot only)

Extend `ssr_snapshot_dash` (`:5055`) only.

| Add (when flag on) | Do not |
|--------------------|--------|
| True-hole count (L5/L6) | A second app, port, or member route |
| Muted no-session count/indicator if Echo says useful | MiniTwo bind |
| Watchdog / heartbeat age (operator) | Polling Massive |
| Link or embed of today’s `AUDIT.json` summary when present | Gold-volume `stat`/`open` on the request path |

Echo owns operator HIG: holes stay alarming; no-session is muted. Not member chrome.

---

## 17. Tests (Coach-required + edges)

Kilo lists in W0-5. Implementation tests ship with P1–P4, not in W0.

### 17.1 Coach-required (must be in the list and later green)

| ID | Test |
|----|------|
| **AT-SSR-H-A** | Symbol with **no session in GTH** is **not polled** (no interest touch, no snap) and is **not counted as a hole**. |
| **AT-SSR-H-B** | Heartbeat **silence** triggers the watchdog **alert** (local fail-loud; channel still OPEN). |
| **AT-SSR-H-C** | Audit correctly flags a **synthetic 30s gap**. |

### 17.2 Required edges (Kilo seed)

| ID | Test |
|----|------|
| **AT-SSR-H-D** | Phase transition: a single `"no session"` log line per unscheduled symbol, not per cycle. |
| **AT-SSR-H-E** | Flag **off**: current poll-all unchanged (GTH empties still behave as today). |
| **AT-SSR-H-F** | Cutover / this program does **not** rewrite Friday **2026-08-14**. |

---

## 18. Deploy / sequencing

```text
W0 spec lock ──► P1 session map + holes (flag off)
             ──► P2 heartbeat + watchdog (flag off)
             ──► P3 cadence report (no code unless Coach picks a number)
                      │
                      ▼
                 W1-G ── cut over between phases
                      │
                      ▼
                 P4 daily gap audit
                 P5 quote sanity
                 P6 retain + checksum
                 P7 replay verifier stub
                      │
                      ▼
                 W2-G
```

| Wave | Items | Gate |
|------|-------|------|
| **Before tomorrow’s open if possible** | H1 session map · H2 hole semantics · H3 dead-man | **W1-G** then between-phase cutover |
| **This week** | H4 audit · H5 sanity · H6 retain | **W2-G** |
| **Stub now** | H7 replay verifier | **W2-G** (stub exists) |

P1–P3 stay **blocked** until **W0-G + Coach GO**.

**Auto-GO (this run):** clean gates **GO**. Stop only on invariant break, archive risk, or a missing Coach input that **blocks build**. Alert channel **OPEN** does **not** block spec review or local fail-loud watchdog. It **does** block inventing Slack/email.

---

## 19. Config surface (fail loud when flag on)

| Key | Role | Notes |
|-----|------|-------|
| `LABS_SSR_HARDENING` | Master flag | Default **off**. Cut over between phases. |
| `LABS_SSR_SESSION_MAP` | Absolute path to session map | Optional override; if set, file must exist. |
| *(default file)* | `data/ssr/session-map.json` | Used when env unset. |
| `LABS_SSR_CHAIN_EVERY_S` | Disk cadence | As-built **[2, 5]**, default **2**. **Do not change** until Coach picks after Lima. |
| `LABS_SSR_HOLE_TOLERANCE_S` | Interval-exceeded threshold | **OPEN** default. 30s synthetic must still flag. |
| `LABS_SSR_STALE_QUOTE_S` | Sanity stale threshold | **OPEN** |
| `LABS_SSR_ALERT_CHANNEL` | Alert channel | **OPEN** / unset. Do not invent a value. |
| `LABS_SSR_CACHE_ROOT` | Live write root | Default `~/Library/Caches/fattail-ssr` |
| `LABS_MARKET_DATA_ROOT` | Gold root | `/Volumes/FatTail2TB/fattail-market-data` |
| `LABS_SSR_GOLD_COPY` | Opt-in live gold copy | Must stay off while `open()` stalls |
| `LABS_MB_INTEREST_GRACE_S` | Interest TTL | As-built **45**. Unscheduled names must stop being touched. |

Cadence, tolerances, session map, alert channel: **config over code** (Coach).

---

## 20. Open items (labeled OPEN)

Do not invent a close. Coach or a named later packet disposes these.

| ID | Item | Owner to dispose | Blocks |
|----|------|------------------|--------|
| **OD-SSR-H-1** | **Alert channel** | Coach | Delivery of off-box alerts. **Not** spec review. **Not** local fail-loud. |
| **OD-SSR-H-2** | **Cadence pick** (stay 2s vs 3–5s vs other in-band) | Coach after Lima W0-6 math | Changing `LABS_SSR_CHAIN_EVERY_S`. **Not** H1–H3 design. |
| **OD-SSR-H-3** | Default `LABS_SSR_HOLE_TOLERANCE_S` | Coach / India after Lima | A numeric default only. 30s synthetic still flags. |
| **OD-SSR-H-4** | Full 18-name session table | Alpha + evidence; Coach if a name is wrong | Shipping a guessed GTH set beyond SPX/XSP/IWM/USO |
| **OD-SSR-H-5** | Gold volume healthy → when to set `LABS_SSR_GOLD_COPY=1` and run H6 onto FatTail2TB | Foxtrot + Coach | H6 **delete raw**; not H1–H3 |
| **OD-SSR-H-6** | Stale-quote seconds; “deep ITM” definition | Hotel / India propose; Coach if it becomes law | H5 numeric defaults |
| **OD-SSR-H-7** | Exact “same surface code path used live” entry for full H7 | India + later SSR product | Full verifier only. Stub does not need it. |
| **OD-SSR-H-8** | Weeknight vs Friday “last phase closes each day” audit trigger | India + Foxtrot | H4 schedule, not H1–H3 |
| **OD-SSR-H-9** | Checksum algorithm | India (sha256 is the obvious opinion) | H6 implementation |

**Juliet did not fill OD-SSR-H-1 or OD-SSR-H-2.** Those stay Coach’s.

---

## 21. Parents / companions

| Doc | Role |
|-----|------|
| This file §0 | **Coach packet** — supreme for this program |
| [DL-400](../Architecture/00-decision-log.md) | OD-6 gold cadence **3–5s** (superseded **band** by DL-428) |
| [DL-428](../Architecture/00-decision-log.md) | Gold tap **2–5s** default **2s**; all universe symbols; pre + extended |
| [DL-429](../Architecture/00-decision-log.md) | Chain Snapshot dash StudioOne `:5055` |
| [DL-430](../Architecture/00-decision-log.md) | 8:00 AM–8:00 PM (superseded **clock** by DL-431) |
| [DL-431](../Architecture/00-decision-log.md) | **Max published window** — Massive 4:00 AM–8:00 PM ET + Cboe overnight GTH 8:15 PM–9:25 AM weeknights |
| [Arch 28](../Architecture/28-massive-market-bus.md) | Sole Massive writers = feeds; tap is a reader; one bus |
| [Market Bus Spec v1.0](./FatTail-Labs-Massive-Market-Bus-Shared-Client-Spec-v1.0.md) | Interest / chain_feed idle when no topics |
| [OT-EF Doctrine v1.1](./FatTail-Labs-Options-Lab-OPF-Truth-and-Elegant-Failure-Doctrine-v1.1.md) · **DL-309** · **DL-396** | Do not invent instruments; named states |
| [Arch 31](../Architecture/31-structure-surface-replay.md) · [SSR method Spec v0.1](./FatTail-Labs-Structure-Surface-Replay-Spec-v0_1.md) | Future consumer of this archive — **not** this ops surface |
| [`docs/ops/StudioOne-SSR-Live-Capture.md`](../docs/ops/StudioOne-SSR-Live-Capture.md) | Host runbook (cadence lines there still mention DL-400 3–5s — Lima updates when this Spec is GO) |
| [`data/ssr-capture-plan.md`](../data/ssr-capture-plan.md) | Standing archive intent |

---

## 22. Review gates (W0) — required before Coach BUILD AUTHORITY

| Packet | Agent | Looks at | Verdict shape |
|--------|-------|----------|---------------|
| W0-2 | **India** | Domain, archive invariants, Massive interest, DL-428/431, OT-EF adjacency, config-over-code | APPROVED / RETURNED + **GO / NO-GO** |
| W0-3 | **Echo** | Existing dash only; hole vs muted no-session | APPROVED / RETURNED + **GO / NO-GO** |
| W0-4 | **Foxtrot** | Watchdog process + launchd; no mid-gth restart; channel OPEN | APPROVED / RETURNED + **GO / NO-GO** |
| W0-5 | **Kilo** | Characterization list includes Coach (a)(b)(c) + edges | GO / NO-GO (list complete) |
| W0-6 | **Lima** | Cadence **math** + DL draft; **no cadence change** | Report exists + **GO / NO-GO** |
| W0-G | **Delta** | Evidence the spec is review-complete; Coach text intact; OPEN items labeled | PASS / FAIL / BLOCKED + **GO / NO-GO** |

Tango / Hotel: **not** seated for a member-surface review. Hotel may be asked later on H5 “deep ITM” (OD-SSR-H-6). This is operator archive honesty, not a trader-learner chrome change.

---

## 23. Juliet bench delta (this draft)

What the next invocation can do that it could not this morning:

- Read one Spec that holds Coach’s packet **verbatim** and projects H1–H7 without dropping priority.
- Review against named OPEN items instead of inventing Slack or a new cadence.
- Cut over against two named windows (4:00 AM ET, 9:25–9:30 AM ET) with the plane already in `gth`.
- Treat GTH empties as a **session-map** problem, not a hole-counter bug.

**Coach content intact?** Yes — §0 is the stamp packet unedited.

**Changed or dropped from Coach?** Nothing. Juliet **added** as-built, laws, config path proposal, OPEN table, and labeled opinions.

---

## 24. Document control

| Version | Date | Notes |
|---------|------|-------|
| v1.0 DRAFT | 2026-08-18 | Juliet Phase 1. Coach packet verbatim. Not BUILD AUTHORITY. |

**Promotion:** Status line becomes **BUILD AUTHORITY** only after W0-G PASS **and** Coach stamp. Lima files a DL the same day.

---

## 25. Approval

| Role | Stamp | Date |
|------|-------|------|
| Juliet (draft) | This file | 2026-08-18 |
| India | *pending W0-2* | |
| Echo | *pending W0-3* | |
| Foxtrot | *pending W0-4* | |
| Kilo | *pending W0-5* | |
| Lima (cadence report) | *pending W0-6* | |
| Delta W0-G | *pending* | |
| Coach BUILD AUTHORITY | *pending* | |
