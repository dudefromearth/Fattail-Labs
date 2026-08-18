# W0-4 — Foxtrot watchdog / launchd

**Project:** SSR Collector Hardening  
**Agent:** Foxtrot  
**Date:** 2026-08-18  
**Spec:** `Specs/FatTail-Labs-SSR-Collector-Hardening-Spec-v1.0.md` §0 item 3 · **SSR-H3** · **SSR-H-L7** · **SSR-H-L8** · §11 · §18  
**Seed:** `agents/p-ssr-collector-hardening/seeds/W0-4-foxtrot.md`  
**Depends:** W0-1 spec  

**Verdict:** **APPROVED** + **GO**  
**Live plane:** **NO-GO** tonight for any `launchctl` on `ai.fattail.labs.ssr-live-capture` (already **`gth`**).

This packet is **design only**. No code. No plist installed. No kickstart. No bootout.

---

## 0. What I did / did not do

| Did | Did not |
|-----|---------|
| Read Foxtrot charter, Spec v1.0 DRAFT, W0-4 seed, as-built tap/dash/plist/wrapper | Implement heartbeat, watchdog module, or plist |
| Lock heartbeat path, launchd label, KeepAlive, cutover | `launchctl` bootstrap / bootout / kickstart / enable / disable |
| Design how the watchdog reads session map + `phase_at` **without living in the tap** | Invent Slack / email / SMS / Discord / PagerDuty / Notification Center |
| Read-only `curl` of the existing dash | Touch MiniTwo. Touch StudioTwo as a writer. Change cadence. Change `.env` |

**Evidence I did not mutate the tap** (read-only, this host → StudioOne dash):

```text
$ curl -sS -m 4 http://studioone.local:5055/api/status
{
  "now": "2026-08-18T00:25:24.948287-04:00",
  "phase": "gth",
  "day": "2026-08-18",
  "wake": "2026-08-18T00:25:24.948287-04:00",
  "chain_every_s": 2.0,
  "data_root": "/Volumes/FatTail2TB/fattail-market-data",
  ...
}
```

Plane is **`gth`**. Next lawful tap-process windows remain **04:00 ET** (`gth` → `pre`) and **09:25–09:30 ET** (GTH → RTH). Spec L8.

---

## 1. Seed checklist

| # | Item | Verdict |
|---|------|---------|
| 1 | Independent process (not a thread in the tap) | **PASS** — §3 |
| 2 | Heartbeat every cycle; path locked | **PASS** — §2 |
| 3 | Alert if silent **> 60s** during any **live** phase for any **scheduled** symbol | **PASS** — §4 |
| 4 | Alert channel **OPEN** (not invented) | **PASS** — §5 |
| 5 | Fail loud | **PASS** — §5 |
| 6 | StudioOne only | **PASS** — §3.2 |
| 7 | Flag + between-phase cutover | **PASS** — §6 |
| 8 | Watchdog reads session map + phase **without being inside the tap** | **PASS** — §4 |
| 9 | KeepAlive rules | **PASS** — §3.4 |
| 10 | Did not kickstart / bootout `ai.fattail.labs.ssr-live-capture` | **PASS** — §0 |

---

## 2. Heartbeat (tap emits · watchdog only reads)

### 2.1 Path (Foxtrot lock — not gold)

Juliet’s §11.1 proposal is **accepted as law for P2**:

```text
{LABS_SSR_CACHE_ROOT}/ssr/live_capture/heartbeat.json
```

Default `LABS_SSR_CACHE_ROOT` = `~/Library/Caches/fattail-ssr` (as-built tap).

Resolved default on StudioOne:

```text
/Users/ernie/Library/Caches/fattail-ssr/ssr/live_capture/heartbeat.json
```

| Rule | Why |
|------|-----|
| **SSD cache only** | Gold `/Volumes/FatTail2TB` `open()` is stalled. Heartbeat must not sit on that path. Same reason live snaps already go to cache. |
| **Sibling of `day=`**, not inside `day=YYYY-MM-DD/` | Watchdog must not guess the calendar folder. Weekend → Sunday GTH still has one file. |
| **Overwrite allowed** | Not the archive. Not write-once. Do **not** use tap `_write_text` / `write_snap` (those refuse overwrite and can stall). |
| **Atomic replace** | Write `heartbeat.json.partial` → `os.replace` onto `heartbeat.json`. Watchdog never parses a torn file as a fresh beat. |
| **Authority is JSON `at`**, not `mtime` | Spec §11.1. A copy or Time Machine touch must not look alive. |
| **One collector heartbeat**, not 18 files | Coach: the collector emits a heartbeat every **cycle**. “Any scheduled symbol” scopes **when** the 60s rule is armed (see §4.3), not 18 switches. |

### 2.2 Minimum document (Spec §11.1 + Foxtrot)

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

| Field | Role for the watchdog |
|-------|------------------------|
| `at` | **Liveness.** America/New_York ISO with offset. Age vs `now_ny()` is the 60s test. |
| `phase` | Corroboration only. **Not** the live-phase authority (stale if the tap is dead). |
| `day` | Operator / dash. |
| `scheduled` | Last set the tap believed it was polling. Corroboration. |
| `cycle_snaps` | Operator. Not used for dead-man math. |
| `pid` | Optional `os.kill(pid, 0)` corroboration. **Never** sufficient. A wedged PID with a stale `at` is still **SILENT**. |

**When the tap writes:** at the **end** of every chain cycle (`capture_chain` today — the 2s loop). Not on the 15s interest tick, not on the 5s mark tick, not on the 60s status tick. If `capture_chain` hangs, `at` freezes — that is the point.

**Flag off:** heartbeat **may / should** still be written (Spec §9.5) so P2 can prove the switch before H1/H2 scheduling is on.

**Lawful sleep:** `sleep_if_closed` does **not** keep writing a live-looking beat. Watchdog uses its **own** clock (§4) so Friday 20:00 → Sunday 20:15 is **LAWFUL_SLEEP**, not silence.

### 2.3 Watchdog state file (dash-readable · same tree)

```text
{LABS_SSR_CACHE_ROOT}/ssr/live_capture/watchdog.json
```

Overwrite, atomic replace, not the archive. Named states (fail loud, no blank):

| `state` | Meaning |
|---------|---------|
| `OK` | Live phase, scheduled non-empty, `now - heartbeat.at` ≤ 60s |
| `SILENT` | Live phase, scheduled non-empty, missing beat **or** age **> 60s** |
| `LAWFUL_SLEEP` | Clock phase is `closed` or `weekend` (Friday 20:00 → Sunday 20:15) |
| `NO_SESSION` | Clock phase is live **and** hardening flag **on** **and** session map schedules **no** symbol — not a dead-man |
| `WAITING` | Watchdog just started and has never seen a well-formed heartbeat (first 60s only; then `SILENT` if still missing in a live scheduled phase) |
| `CONFIG_FAIL` | Required config missing / unreadable / unknown `LABS_SSR_ALERT_CHANNEL` value |

Dash (`:5055` only) may show heartbeat age + this state. **Echo owns chrome.** Foxtrot does not add a second port.

---

## 3. Independent process + launchd

### 3.1 Label (Foxtrot lock)

```text
ai.fattail.labs.ssr-watchdog
```

Matches `ai.fattail.labs.ssr-live-capture` and `ai.fattail.labs.ssr-snapshot-dash`. Juliet’s example name is **accepted**, not left as opinion.

**gui LaunchAgent** for user `ernie` — same domain as the tap. Not a LaunchDaemon. Not root. Cache and `.env` live in the user home.

Repo example (P2, not tonight):

```text
infra/launchd/ai.fattail.labs.ssr-watchdog.plist.example
```

On-machine (StudioOne only):

```text
~/Library/LaunchAgents/ai.fattail.labs.ssr-watchdog.plist
```

### 3.2 Host

**StudioOne only.** Not MiniTwo. Not StudioTwo as a writer.

Fail-loud boot gate: process runs only if `LABS_SSR_WATCHDOG=1` is **set in the StudioOne plist / `.env`**. Unset → `CONFIG_FAIL` (stay up, yell). Do **not** ship this plist to MiniTwo. Do **not** bootstrap it on StudioTwo.

**Foxtrot opinion (not a block):** also refuse if the host looks like MiniTwo. Label only.

### 3.3 Process identity (fate isolation)

| Piece | Value |
|-------|--------|
| Module (Alpha names; Foxtrot owns the process) | `python -m market_data.ssr_watchdog` |
| Wrapper | `scripts/ssr-watchdog-run.sh` |
| WorkingDirectory | `~/Fattail-Labs/server` |
| Interpreter | `server/.venv/bin/python` (same as tap) |
| Logs | `~/Library/Logs/fattail-labs/ssr-watchdog.out.log` and `.err.log` |
| `ThrottleInterval` | **10** |

The wrapper:

1. Sources `~/Fattail-Labs/.env` (same pattern as `ssr-live-capture-run.sh` / dash).
2. Requires `LABS_SSR_WATCHDOG=1`.
3. `exec`s the watchdog module.

The wrapper **must not**:

- start `sym_feed` / `chain_feed`
- start or `kickstart` the tap
- live inside `scripts/ssr-live-capture-run.sh`
- import or run `LiveTap`

As-built tap wrapper backgrounds feeds then `exec`s the tap — those feeds already share a fate with the tap PID. The dead-man **must not** join that process group. Separate launchd label is the isolation.

```text
launchd gui/ernie
├── ai.fattail.labs.ssr-live-capture     ← writes heartbeat
├── ai.fattail.labs.ssr-snapshot-dash    ← :5055 reads cache
└── ai.fattail.labs.ssr-watchdog         ← NEW; reads heartbeat + map + clock
```

Three KeepAlive domains. A tap crash must leave the watchdog running.

**Watchdog never kickstarts, bootouts, or SIGKILLs the tap.** It observes and yells. Auto-recover is **not** in Coach’s packet; inventing it would be a mid-phase restart policy. Operator restart stays a **between-phase** act unless the tap is already dead (the hole is already happening) — that call stays with Coach / the operator, not this process.

### 3.4 KeepAlive rules (Foxtrot lock)

Same dictionary as the standing tap / dash examples:

```xml
<key>RunAtLoad</key>
<true/>
<key>KeepAlive</key>
<dict>
  <key>SuccessfulExit</key>
  <false/>
  <key>Crashed</key>
  <true/>
</dict>
<key>ThrottleInterval</key>
<integer>10</integer>
```

| Rule | Meaning |
|------|---------|
| `RunAtLoad` | Comes up at login / bootstrap. GTH is overnight Sun–Thu; a Mon–Fri 04:00 `StartCalendarInterval` would **miss** Sunday 20:15. **No calendar start.** |
| `SuccessfulExit = false` | Clean `exit 0` (operator bootout / intentional stop) stays down. |
| `Crashed = true` | Signal death / crash comes back. |
| Always-on loop | Watchdog stays resident through `closed` / `weekend` so Friday night is **quiet on purpose**, not “job unloaded.” |
| Config errors | **Do not `exit 1`.** Stay up in `CONFIG_FAIL`, rewrite `watchdog.json`, log every poll. A crash-loop is not fail-loud; a named state is. |
| Unconditional `KeepAlive: true` | **Rejected.** That restarts a deliberate `exit 0` and fights `bootout`. |

**Not used:** `WatchPaths` on the tap binary, `StartInterval` (that would be a cron, not a supervisor), `KeepAlive` keyed on the tap path (that couples fate).

Tap KeepAlive stays **as-built**. This packet does not retune `ai.fattail.labs.ssr-live-capture`.

---

## 4. How the watchdog knows session map + phase **without being inside the tap**

Coach: alert if silent **> 60s** during **any live phase** for **any scheduled symbol**.  
Spec L7: lawful sleep is not silence. Watchdog must know the **same** clock.

The watchdog is a **reader of files + a pure clock**. It is not a second tap.

### 4.1 Clock — shared library, not a tap import

**Do not** `import market_data.ssr_live_capture`. That module runs `chain_every_s()` and `wings()` at import time. Future module-level I/O would stall the dead-man. That is “inside the tap.”

**Foxtrot lock for P2:** extract a **pure** module (no env, no Redis, no disk, no Massive, no DB):

```text
server/market_data/ssr_phase.py
```

Contents: `NY`, `now_ny`, `phase_at`, `next_wake`, and the existing DL-431 constants (`PRE_START` 04:00, `PRE_END` 09:30, `RTH_END` 16:00, `EXT_END` 20:00, `GTH_START` 20:15).

| Consumer | When it picks up the extract |
|----------|------------------------------|
| Watchdog | On first watchdog start (new process) |
| Tap | On the **between-phase** tap restart that also ships the heartbeat write |

Kilo: one characterization that `phase_at` on a fixture of timestamps matches today’s function. Two copies of the clock are a **NO** unless that lockstep test exists; prefer the extract.

`heartbeat.phase` is **not** the authority for “are we live now?” Example: tap dies Friday 19:59:50 (`extended`). At 20:01 the beat is stale but the clock is `closed` → **LAWFUL_SLEEP**, not `SILENT`. Only an independent `phase_at(now)` gets that right.

**Live phase** (Spec L7, Foxtrot restates): `phase_at(now) not in ("closed", "weekend")`.

### 4.2 Session map — same file, independent load

| Source | Path |
|--------|------|
| Override | `LABS_SSR_SESSION_MAP` (absolute). If set and missing/unreadable → `CONFIG_FAIL`. |
| Default | `{repo}/data/ssr/session-map.json` |

Reload **every watchdog poll** (5s). A map edit is not a process cutover (Spec §9.2).

Token map is Spec §9.3 (`premarket`/`pre` → `pre`, `postmarket`/`post`/`extended` → `extended`). `closed` / `weekend` are never scheduled.

Watchdog **does not** query MySQL `market_symbol_universe`. Watchdog **does not** read Redis. Watchdog **does not** call Massive. Watchdog **does not** `stat`/`open` the gold volume.

### 4.3 “Any scheduled symbol” (one beat, armed by the map)

One heartbeat covers the cycle. The 60s rule is **armed** when the scheduled set for **now** is non-empty.

| Flag | How watchdog computes `scheduled` |
|------|-----------------------------------|
| `LABS_SSR_HARDENING` **off** (P2 proof) | Poll-all world. If clock phase is live → treat scheduled as **non-empty**. Last `heartbeat.scheduled` is corroboration only. Missing map is **not** `CONFIG_FAIL`. |
| **on** | Names whose session-map phases include the current clock token. Empty set → `NO_SESSION`, not `SILENT`. Missing default map → `CONFIG_FAIL`. |

A single-symbol empty generation while the cycle still runs is a **hole** (H2), not a dead-man. Dead-man = the **cycle** stopped.

### 4.4 Decision loop (every **5s**)

```text
now    = now_ny()                          # ssr_phase
phase  = phase_at(now)                     # ssr_phase — NOT heartbeat.phase
map    = load_session_map()                # file; fail → CONFIG_FAIL when required
sched  = scheduled_for(phase, map, flag)
hb     = read_json(heartbeat.json)         # missing / torn → no at
age    = now - parse(hb.at)                # if no at → +inf

if CONFIG_FAIL:                         state = CONFIG_FAIL
elif phase in (closed, weekend):        state = LAWFUL_SLEEP
elif hardening on and sched empty:      state = NO_SESSION
elif no well-formed beat yet
     and watchdog_uptime ≤ 60s:         state = WAITING
elif age > 60s or no at:                state = SILENT   → fail loud
else:                                   state = OK
```

`WAITING` exists so a first bootstrap next to a live tap does not flash `SILENT` for one poll. After 60s with no beat in a live scheduled phase, it **is** `SILENT`. That is Coach’s number, not a grace we invented.

**Poll seconds:** `LABS_SSR_WATCHDOG_POLL_S`, default **5**, fail-loud outside **[1, 15]**. A 90s poll would miss a 60s SLA.

**Silence seconds:** Coach law is **> 60s**. Config key `LABS_SSR_WATCHDOG_SILENCE_S` may exist (config-over-code). Unset → **60**. Set to 0 / negative / non-numeric → `CONFIG_FAIL`. Do not ship a different default.

At live 2s, 60s is ~30 missed cycles; at band-max 5s, ~12. Lima’s cadence pick does not change this law.

### 4.5 Torn / missing file

`JSONDecodeError` or empty file this tick: treat as **no `at`**. Do not crash. Two consecutive torn reads in a live scheduled phase → `SILENT`. Fail loud, stay up.

---

## 5. Fail loud · alert channel **OPEN**

| Allowed now | Forbidden (channel **OPEN** — OD-SSR-H-1) |
|-------------|-------------------------------------------|
| Line on watchdog stderr / launchd log: `event=deadman` + `age_s` + `phase` + `scheduled` | Slack, email, SMS, Discord, PagerDuty, SMTP, `osascript`, Notification Center, any off-box sender |
| `watchdog.json` `state=SILENT` (dash may read it) | A second dashboard or port |
| `logger` to unified log (local) | Treating `LABS_SSR_ALERT_CHANNEL` as Slack/email because it “seems obvious” |

`LABS_SSR_ALERT_CHANNEL` stays **unset**. If someone sets an **unknown** value, `CONFIG_FAIL` — do not guess a sender. When Coach names a channel, a later packet wires it. Summary line for H4 uses the same rule.

Local fail-loud **cannot** survive StudioOne sleep or power-off. That is why the channel is still Coach’s to name. Not a spec-review block.

---

## 6. Flag + between-phase cutover

### 6.1 Two different mutations

| Mutation | Mid-`gth`? | When |
|----------|------------|------|
| **Tap** process restart (heartbeat write, `ssr_phase` import, `LABS_SSR_HARDENING=1`) | **NO** | Named windows only: **04:00 ET** or **09:25–09:30 ET** |
| **Watchdog** first `bootstrap` / later `kickstart` | Yes, **after** heartbeat exists | New label; does not share fate with the tap |
| Session-map **file** edit | Yes | Next cycle / next watchdog poll |
| Load watchdog **tonight** (no heartbeat file yet) | **NO** | Would `SILENT` for a switch that is not shipped |

Git pull on StudioOne does **not** restart launchd jobs. Code can land on disk mid-phase. **Processes** that already run keep old images until a lawful window.

### 6.2 P2 sequence (after W0-G **and** Coach GO — not tonight)

Preferred window: **04:00 ET** `gth` → `pre` (Juliet opinion; Foxtrot agrees — premarket then already has a beat). Fallback: **09:25–09:30 ET**.

```text
# 0. Confirm the window. Do not proceed while phase is gth unless it is the 09:25 flip.
curl -sS -m 4 http://studioone.local:5055/api/status   # phase must be the named cut

# 1. Code already on disk (flag OFF). Heartbeat write + ssr_phase extract + watchdog module + plist example.

# 2. Restart TAP only — picks up heartbeat write.
launchctl kickstart -k gui/$(id -u)/ai.fattail.labs.ssr-live-capture

# 3. Prove beat (SSD cache, not gold).
test -f ~/Library/Caches/fattail-ssr/ssr/live_capture/heartbeat.json
# `at` age < 10s; pid matches the new tap

# 4. Load watchdog ONCE (does not touch the tap).
cp ~/Fattail-Labs/infra/launchd/ai.fattail.labs.ssr-watchdog.plist.example \
   ~/Library/LaunchAgents/ai.fattail.labs.ssr-watchdog.plist
# plist EnvironmentVariables: LABS_SSR_WATCHDOG=1
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/ai.fattail.labs.ssr-watchdog.plist
launchctl enable gui/$(id -u)/ai.fattail.labs.ssr-watchdog

# 5. Prove watchdog.
# watchdog.json state=OK (or WAITING then OK)
# launchctl print gui/$(id -u)/ai.fattail.labs.ssr-watchdog
# Do NOT kickstart the tap again to "help" the watchdog.

# 6. LABS_SSR_HARDENING=1 is a later, separate tap restart at a later named window (H1/H2).
```

A kickstart hole of a few seconds is a **true hole**. Do not hide it. Do not invent a multi-minute watchdog hold file.

### 6.3 Tonight (2026-08-18, already `gth`)

- **NO** `bootout` / `kickstart` / `enable` / `disable` of `ai.fattail.labs.ssr-live-capture`.
- **NO** bootstrap of the watchdog (no beat to read).
- Flag stays **off**. Cadence stays **2s**. Gold copy stays **off**.

### 6.4 Rollback

| Step | Action |
|------|--------|
| Watchdog only | `launchctl bootout gui/$(id -u)/ai.fattail.labs.ssr-watchdog` — tap keeps writing. Archive untouched. |
| Tap image after a bad P2 window | `kickstart -k` the tap **only at the next named window** onto the previous revision. Friday **2026-08-14** is never rewritten. |
| Flag | `LABS_SSR_HARDENING` unset / off → today’s poll-all. Heartbeat may remain. |

---

## 7. Config surface (watchdog)

| Key | Role | Fail loud |
|-----|------|-----------|
| `LABS_SSR_WATCHDOG` | Must be `1` for the process to arm | Unset → `CONFIG_FAIL`, stay up |
| `LABS_SSR_CACHE_ROOT` | Heartbeat + state tree | Same default as tap if unset |
| `LABS_SSR_SESSION_MAP` | Optional absolute map | If set, file must exist |
| `LABS_SSR_HARDENING` | Off = poll-all arming; on = map arming | Default **off** |
| `LABS_SSR_WATCHDOG_SILENCE_S` | Optional; unset = **60** (Coach) | 0 / negative / NaN → `CONFIG_FAIL` |
| `LABS_SSR_WATCHDOG_POLL_S` | Optional; unset = **5**; legal **[1, 15]** | Outside band → `CONFIG_FAIL` |
| `LABS_SSR_ALERT_CHANNEL` | **OPEN** / unset | Unknown value → `CONFIG_FAIL`; do not send |
| `LABS_SSR_GOLD_COPY` | Irrelevant to watchdog | Watchdog never opens gold |

Missing config does **not** silently poll-none or disable the switch.

---

## 8. Tests Foxtrot needs on Kilo’s list (not implemented here)

Coach **AT-SSR-H-B** already: heartbeat silence → local alert.

Add (edges, not new product law):

| ID (proposed) | Case |
|---------------|------|
| **AT-SSR-H-B2** | Friday `extended` → `closed`: stale beat is **LAWFUL_SLEEP**, not `SILENT` |
| **AT-SSR-H-B3** | Watchdog process still runs after the tap PID is killed; `SILENT` after 60s |
| **AT-SSR-H-B4** | Watchdog does not import `ssr_live_capture` / does not start feeds |
| **AT-SSR-H-B5** | Flag off + live phase + no map file → still arms (poll-all); not `CONFIG_FAIL` |

---

## 9. Out of scope this packet (labeled)

| Item | Disposition |
|------|-------------|
| OD-SSR-H-1 alert channel | **OPEN.** Local fail-loud only. |
| OD-SSR-H-2 cadence pick | Lima W0-6. Not watchdog law. |
| OD-SSR-H-5 gold volume / H6 | Not H3. Watchdog never opens FatTail2TB. |
| OD-SSR-H-8 weeknight vs Friday audit trigger | H4 later. India + Foxtrot. Not a W0-4 block. |
| Auto-restart of a wedged tap | **Not** Coach. Watchdog does not kickstart. |
| Per-symbol heartbeat files | **Not** Coach. One cycle beat. |
| Retuning tap KeepAlive / feed children | As-built. Do not hitchhike. |
| MiniTwo / member UI | Out. |

**Flagged ideas:** none discarded. Inventory intact.

---

## 10. Spec gaps I closed (ops contract, not Coach edits)

The DRAFT is enough to implement H3 without inventing product. Foxtrot locks what §11 left as example / opinion:

1. Heartbeat path = cache `…/ssr/live_capture/heartbeat.json` (Juliet proposal **accepted**).
2. Label = `ai.fattail.labs.ssr-watchdog`.
3. Clock = `ssr_phase.py` extract; **no** tap-module import.
4. KeepAlive = tap-style `{SuccessfulExit:false, Crashed:true}`, `RunAtLoad`, no calendar, stay up in `CONFIG_FAIL`.
5. Flag-off arming = live clock phase ⇒ scheduled non-empty.
6. Watchdog `bootstrap` may happen mid-phase **after** a beat exists; tap restart stays between phases.

Nothing in §0 was removed or reshaped.

---

## 11. Verdict

| Stamp | Value |
|-------|--------|
| Spec H3 / L7 / L8 / §11 (watchdog + launchd + cutover) | **APPROVED** |
| W0-G (this review) | **GO** |
| Alert channel | **OPEN** — does **not** block spec review or local fail-loud; **does** block inventing a sender |
| `launchctl` on `ai.fattail.labs.ssr-live-capture` tonight | **NO-GO** (plane is `gth`) |
| Bootstrap watchdog tonight | **NO-GO** (no heartbeat yet) |
| P1–P3 implementation | Still **blocked** until W0-G **PASS** + Coach **BUILD AUTHORITY** |

**GO** means: the dead-man is designed, fate-isolated, StudioOne-only, flag-safe, and implementable after Coach GO without a mid-phase tap restart. It does **not** mean start the job.

---

**Coach content intact?** Yes. Channel left **OPEN**. Cadence not touched. Archive not touched. Tap not restarted.

**Changed or dropped from Coach?** Nothing.
)