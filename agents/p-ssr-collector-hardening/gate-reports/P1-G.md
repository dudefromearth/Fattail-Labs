# P1-G — Delta session map + hole semantics gate

**Project:** SSR Collector Hardening  
**Agent:** Delta  
**Date:** 2026-08-18 00:39 ET  
**Packet:** [`seeds/P1-1-alpha-session-map.md`](../seeds/P1-1-alpha-session-map.md)  
**Spec:** [`Specs/FatTail-Labs-SSR-Collector-Hardening-Spec-v1.0.md`](../../../Specs/FatTail-Labs-SSR-Collector-Hardening-Spec-v1.0.md) v1.0 **BUILD AUTHORITY** (DL-433)  
**Characterization:** [`characterization-list.md`](../characterization-list.md) — **AT-SSR-H-A / D / E / G** (seed law for this packet)

**Did not:** modify code under review · restart / unload / kickstart any StudioOne job · set `LABS_SSR_HARDENING=1` · change cadence · rewrite Friday.

---

## Criteria (restated)

1. `cd /Users/ernie/Fattail-Labs/server && .venv/bin/python -m pytest tests/test_ssr_session_map.py tests/test_ssr_hardening_schedule.py tests/test_ssr_live_capture_cadence.py -q --tb=short` is green.
2. `data/ssr/session-map.json` has **18** symbols; **only** SPX, XSP, IWM, USO have `gth`.
3. `hardening_on()` default is **false** (read the function).
4. `curl http://studioone.local:5055/api/status` still returns a **phase** (collector uninterrupted).

Delta ternary **PASS / FAIL / BLOCKED** plus **GO / NO-GO**.

Assigned tonight: **NO-GO** for enabling the flag or kickstarting the tap.

---

## Verdict

| Stamp | Value |
|-------|--------|
| **Ternary** | **PASS** |
| **P1 land** (flag-off code + A/D/E/G tests + checked-in map) | **GO** |
| **`LABS_SSR_HARDENING=1` tonight** | **NO-GO** |
| **`launchctl` / tap restart / kickstart tonight** | **NO-GO** |
| **W1-G / between-phase cutover** | **not this gate** — still **`gth`** |

Flag remains default **0**. Live tap pid **21268** is the same process W0-G measured. Plane is **`gth`**. Cadence still **2.0**.

---

## 1. Pytest — A / D / E / G + cadence regression

**PASS.**

```text
$ cd /Users/ernie/Fattail-Labs/server && .venv/bin/python -m pytest \
    tests/test_ssr_session_map.py \
    tests/test_ssr_hardening_schedule.py \
    tests/test_ssr_live_capture_cadence.py -q --tb=short
.............................                                            [100%]
29 passed in 0.06s
```

| File | Nodeids | Rows |
|------|--------:|------|
| `tests/test_ssr_session_map.py` | 5 | **G** (4 fail-loud cases) + flag-off missing-map contrast (**E**) |
| `tests/test_ssr_hardening_schedule.py` | 4 | **A**, **D**, **E** × `{unset, 0}` |
| `tests/test_ssr_live_capture_cadence.py` | 20 | Existing cadence / Friday / phase-clock regression |

Coach / seed rows for this packet:

| ID | Test | Result |
|----|------|--------|
| **AT-SSR-H-A** | `test_at_ssr_h_a_gth_no_session_not_polled_not_hole` | PASS — GTH AAPL: no `touch_interest`, no snap, not in `holes`; SPX polled (product + `I:SPX`) and not a hole |
| **AT-SSR-H-D** | `test_at_ssr_h_d_one_no_session_per_phase_occupancy` | PASS — one `"no session"` AAPL line across 5 GTH cycles; AAPL polled on `pre`; one new line on next GTH occupancy |
| **AT-SSR-H-E** | `test_at_ssr_h_e_flag_off_is_poll_all[None]` and `[0]` | PASS — unset and `=0` both poll AAPL and count `NO CHAIN AAPL` as a hole |
| **AT-SSR-H-G** | four flag-on missing/unreadable/invalid-JSON cases | PASS — `RuntimeError`, zero polls, zero snaps |
| **AT-SSR-H-F** (adjacent, same command) | `test_friday_5min_day_is_not_rewritten` | PASS — `FRIDAY_5MIN_DAY == 2026-08-14` |

Flag-off characterization is still poll-all (seed completion).

---

## 2. Session map — 18 names, GTH only the four

**PASS.**

Path: [`data/ssr/session-map.json`](../../../data/ssr/session-map.json)

```text
version: 1
timezone: America/New_York
default_phases: ['premarket', 'rth', 'postmarket']
symbol_count: 18
gth_symbols: ['SPX', 'XSP', 'IWM', 'USO']
only_coach_gth: True
non_gth_count: 14
non_gth: AAPL, AMZN, NVDA, TSLA, META, MSFT, GOOGL, SPY, QQQ, GLD, TLT, SLV, XLF, UNG
non_gth_not_default: []
```

| Check | Result |
|-------|--------|
| Symbol count | **18** |
| `gth` present | **SPX, XSP, IWM, USO** only |
| Other 14 | inherit `default_phases` (no `gth`) |
| Schema | `version=1`, `timezone=America/New_York` |

Coach GTH observation (2026-08-18) is the map. The fourteen non-GTH names are listed as explicit keys with the default phase list — they are not given overnight sessions.

---

## 3. `hardening_on()` default is false

**PASS.**

[`server/market_data/ssr_session_map.py`](../../../server/market_data/ssr_session_map.py) L29–30:

```python
def hardening_on() -> bool:
    return (os.environ.get("LABS_SSR_HARDENING") or "").strip() == "1"
```

Only the exact string `"1"` is on. Unset, empty, and `"0"` are off.

| Env | `hardening_on()` |
|-----|------------------|
| unset | **False** |
| `0` | **False** |
| empty | **False** |
| `1` | True |

This shell: `LABS_SSR_HARDENING` unset. Live tap pid **21268** environ has `LABS_SSR_CHAIN_EVERY_S=2` and **no** `LABS_SSR_HARDENING` key (poll-all, as designed until a between-phase cutover).

---

## 4. Collector still serving a phase

**PASS.** Read-only. Nothing restarted.

```text
$ curl -sS -m 4 http://studioone.local:5055/api/status
{
  "now": "2026-08-18T00:37:43.521518-04:00",
  "phase": "gth",
  "day": "2026-08-18",
  "wake": "2026-08-18T00:37:43.521518-04:00",
  "chain_every_s": 2.0,
  "data_root": "/Volumes/FatTail2TB/fattail-market-data",
  "days": [],
  "processes": {},
  "today": {}
}
```

Re-read at 00:38:37 ET: `phase=gth`, `chain_every_s=2.0`, `day=2026-08-18`.

Same tap W0-G recorded:

```text
$ ssh studioone 'ps -ax -o pid,lstart,command | grep ssr_'
21268 Tue Aug 18 00:00:10 2026  ... Python -m market_data.ssr_live_capture
21492 Tue Aug 18 00:06:16 2026  ... Python -m market_data.ssr_snapshot_dash
```

`launchctl print …/ai.fattail.labs.ssr-live-capture`: `state = running`, `pid = 21268`. Plist mtime **Aug 17 23:32** (pre-P1). This gate did not kickstart, bootout, or unload.

---

## 5. Collateral

| Adjacent | Result |
|----------|--------|
| `tests/test_ssr_snapshot_dash.py` | **8 passed** in 0.54s (not in the assigned command; swept) |
| Live cadence | **2.0** — `LABS_SSR_CHAIN_EVERY_S` unchanged |
| Flag on the running process | **absent** — poll-all continues |
| Friday `2026-08-14` | Constant still locked; this gate did not open gold |
| Tap is still a Redis reader | Unchanged. Arch 28 intact |
| `scheduled_chain_rows()` | Flag off → full `chain_rows`. Flag on → `smap.in_session` only |
| Hole vs no-session | Unscheduled names get `_note_no_session` + one log line per occupancy; they are not passed to `capture_chain`, so no `NO CHAIN {SYM}` snap |
| Alert channel | Still **OPEN**. P1 did not invent Slack/email |
| Companion P1 rows **H–T** | Not all shipped as dedicated pytest. Seed for this packet named **A, D, E, G**. **Not a FAIL** of P1-G. W1-G still owns the fuller list + P2 **B** |

---

## 6. What this GO is not

- **Not** permission to set `LABS_SSR_HARDENING=1` tonight.
- **Not** permission to unload, kickstart, or bootout `ai.fattail.labs.ssr-live-capture` while phase is **`gth`**.
- **Not** a cadence env change.
- **Not** W1-G (P1–P3 + between-phase cutover).
- **Not** an alert-channel pick.

Named cutover windows remain: **04:00 ET** (`gth` → `pre`) or **09:25–09:30 ET** (GTH → RTH).

---

## Defects

**None.** No FAIL items. No BLOCKED dependency.

OPEN items that **do not** fail this gate:

| ID | Item | Blocks |
|----|------|--------|
| OD-SSR-H-1 | Alert channel | Watchdog **remote** notify (P2) |
| OD-SSR-H-2 | Cadence pick | Changing `LABS_SSR_CHAIN_EVERY_S` |
| Companion P1 **H–T** as standalone tests | Completeness of W1-G, not A/D/E/G land | W1-G if Juliet requires the full P1 list green |

---

## Next action (Coach / Juliet)

1. Land stays on `main` **behind flag=0**. Do **not** enable the flag or kickstart the tap while phase is **`gth`**.
2. Foxtrot / Coach: cut over **between phases** only (04:00 ET or 09:25–09:30 ET) if/when flag-on is wanted.
3. P2 (heartbeat + watchdog) may land flag-off. **B** is still required before a honest W1-G cutover.
4. Lima: no new DL required from this gate unless Coach wants P1 land recorded separately from DL-433.

---

**PASS** + **GO** (P1 flag-off land).  
**NO-GO** — enable flag tonight.  
**NO-GO** — kickstart the tap tonight.

Delta → Coach / Juliet / Lima.
