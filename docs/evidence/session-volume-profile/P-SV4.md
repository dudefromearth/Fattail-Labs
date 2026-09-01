# P-SV4 — archive inventory (Session Option Volume Profile)

**Probe:** Spec v0.2 §13 P-SV4 (also closes **OD-SV5**)  
**Host:** StudioOne (`StudioOne.local`) via SSH from StudioTwo  
**Store root (DL-597):** `/Volumes/FatTail2TB/fattail-market-data/ssr/live_capture`  
**When:** 2026-08-31 20:44–20:51 ET  
**Safety:** gold volume `du` **stalled** (SIGALRM at 20–25 s). Day-folder `ls` of the store root succeeded. JSON opens for this probe used **copies in `/tmp/svp-probe`** on StudioOne’s internal disk after `cp` of selected files. **No write to `/Volumes/FatTail2TB`.** Dash not bounced. No Massive call.

---

## Verdict

| Fact | Value |
|------|--------|
| Horizon (day folders) | **2026-08-14** … **2026-08-31**. Missing **2026-08-15** and **2026-08-16**. Then contiguous through 08-31 (weekend folders **08-22, 08-23, 08-29, 08-30 exist**) |
| “About two weeks” | **18 calendar days** of folders (14→31), **16 session folders**, **2 missing** (15–16). Not a constant. STATS.json last run **2026-08-29** lists **14** collected days and omits later folders |
| Bytes | Whole-tree `du -sh` **stalled** (alarm 25 s, exit 142). One-day `du` of 08-28 and 08-31 also **stalled** (alarm 20 s). **STATS.json `bytes_total` = 819288784** (~781 MiB) as of 2026-08-29 12:22 ET — **stale vs folders now on disk** |
| Latest folder | `day=2026-08-31` (still writing at probe time; COUNTS `phase=gth`, `captured_at` 20:47 ET). Top-level `ls \| wc -l` = **7** |
| Scope (SV8) | **Wing-banded, not full listed chain.** 10:00 ET SPX snap: `wings=25`, `listed_in_window=51`, `row_count=102` (dual-side), `strike_lo=7610` `strike_hi=7860` `spot=7736.33` `strike_step=5`. Topic `mb:ladder:SPX:2026-08-28:w25:dual`. No full-chain snapshot on this archive |
| Truncation at 250? | **`massive_page_limit=250` and `max_strikes_per_dte=250` are stored.** Copied RTH snaps are **62 or 102 rows** (30 or 51 strikes), never 250. **No `next_url` field** on envelope or generation |
| Cadence (RTH sample) | 20 consecutive SPX snaps from 10:00:04 ET: **median gap 2.408 s, max 9.545 s**. Day STATS SPX: `delta_median=2.394`, `delta_max=54.683` (GAP). RTH-clock GAPs in STATS: **7**, max **54.683 s** |
| Mount (OD-SV5) | StudioOne `.env`: `LABS_MARKET_DATA_MOUNTS=raw-primary:/Volumes/FatTail2TB` and `LABS_MARKET_DATA_ROOT=/Volumes/FatTail2TB/fattail-market-data`. Volume **is mounted on StudioOne**. MySQL table **`labs.market_storage_mount` does not exist** on the StudioTwo `labs` DB (migration 093 not applied). StudioTwo does **not** have `/Volumes/FatTail2TB` |

---

## 1. Day folders — the horizon

**Command:**

```
perl -e "alarm 20; exec @ARGV" ls -1 /Volumes/FatTail2TB/fattail-market-data/ssr/live_capture
```

**Output (verbatim):**

```
chain
day=2026-08-14
day=2026-08-17
day=2026-08-18
day=2026-08-19
day=2026-08-20
day=2026-08-21
day=2026-08-22
day=2026-08-23
day=2026-08-24
day=2026-08-25
day=2026-08-26
day=2026-08-27
day=2026-08-28
day=2026-08-29
day=2026-08-30
day=2026-08-31
logs
marks
STATS.json
```

**Shows:** earliest `day=2026-08-14`, latest `day=2026-08-31`. Gap: **no `day=2026-08-15` or `day=2026-08-16`**. Weekend folders 08-22/23 and 08-29/30 are present.

Confirm missing 15/16:

```
perl -e "alarm 10; exec @ARGV" ls -d .../day=2026-08-15 .../day=2026-08-16
```

```
ls: /Volumes/FatTail2TB/fattail-market-data/ssr/live_capture/day=2026-08-15: No such file or directory
ls: /Volumes/FatTail2TB/fattail-market-data/ssr/live_capture/day=2026-08-16: No such file or directory
```

08-22 folder exists (`COUNTS.json` listed).

STATS.json `medians_by_day` unique days (last_run 2026-08-29):  
`2026-08-14, 08-17 … 08-21, 08-24 … 08-28` — **14 days**. Does **not** include 08-22/23 weekend folders or 08-29+.

---

## 2. Bytes and file counts

### Whole tree

**Command:**

```
perl -e "alarm 25; exec @ARGV" du -sh /Volumes/FatTail2TB/fattail-market-data/ssr/live_capture
```

**Output:** empty stdout; process **killed, exit 142** (SIGALRM). Same SSH session had already listed the directory.

**Shows:** walking the gold tree for `du` stalls past 25 s. A stall **is** a finding (SVP reader constraint).

Fallback byte figure from `STATS.json` (not a live walk):

```
days_collected 14
bytes_total 819288784
last_run_at 2026-08-29T12:22:27.402042-04:00
last_run_status ok
```

### One complete RTH day and latest

```
perl -e "alarm 20; exec @ARGV" du -sh .../day=2026-08-28
# exit=142
perl -e "alarm 20; exec @ARGV" du -sh .../day=2026-08-31
# exit=142
```

```
perl -e "alarm 15; exec @ARGV" bash -c "ls -1 .../day=2026-08-31 | wc -l"
```

```
       7
```

**Latest top-level listing:**

```
CADENCE.json
chain
COUNTS.json
marks
PROVENANCE.json
status
```

No `STATS.json` on the live day (expected).

**COUNTS.json `day=2026-08-31` (read with 15 s alarm, succeeded):** `snaps=293632`, 18 symbols, SPX `snaps=25044`.

**COUNTS.json `day=2026-08-28`:** `snaps=286554`, SPX `snaps=23830` (matches `ls …/chain/SPX | wc -l` → `23830`).

**Copied 10:00 ET SPX snap size (local `/tmp`, not gold `du`):** `31901` bytes (`snap-140004073Z.json`).

---

## 3. One snapshot’s shape — scope test

Complete RTH day used: **2026-08-28**. Symbol **SPX**, expiration **2026-08-28** (0DTE; Archive Read v0.8: one expiration per symbol per NY date). File copied off gold: `snap-140004073Z.json` (`captured_at` 2026-08-28T10:00:04.073036-04:00). `t` reconstructed from filename `snap-140004073Z` = 14:00:04.073 UTC = 10:00:04.073 ET, ordered by reconstructed `t` not filename sort across UTC midnight.

**Generation scalars (verbatim):**

```
underlier: 'I:SPX'
expiration: '2026-08-28'
side: 'call'
dual_side: True
spot: 7736.33
dte: 0
band: 126.32999999999993
strike_lo: 7610.0
strike_hi: 7860.0
spot_strike: 7735.0
fields: ['mid', 'bid', 'ask', 'volume', 'open_interest', 'delta', 'iv']
rows: list len=102
row_count: 102
excluded_adjusted_count: 0
as_of: '2026-08-28T14:00:03.928524Z'
wings: 25
strike_step: 5.0
listed_in_window: 51
wings_requested: 25
wings_effective: 25
max_strikes_per_dte: 250
massive_page_limit: 250
topic (envelope): 'mb:ladder:SPX:2026-08-28:w25:dual'
```

**Distinct strikes in that snap:** count **51**, min **7610.0**, max **7860.0**. One expiration: `2026-08-28`. Dual-side: 102 rows = 51×2.

**COUNTS.json for the same book (verbatim excerpt):**

```
"SPX": {
  "snaps": 23830,
  "expiration": "2026-08-28",
  "topic": "mb:ladder:I:SPX:2026-08-28:w25:dual",
  "row_count": 102,
  ...
}
```

CADENCE.json / PROVENANCE.json: `"wings": 15` (envelope default); this SPX generation used **wings=25**.

**Listed chain comparison:** this archive does **not** store a full listed chain. Massive was **not** called (probe constraint). On-disk evidence of scope is the generation itself: `wings=25`, `listed_in_window=51`, 5-point grid around spot. That is a **band**, not the full 0DTE SPX strike file. **SV8 applies: `strike_scope` must be `band(w)`, never presented as full-chain.**

**Shows:** one 0DTE expiration; ~102 contracts / 51 strikes; band ±~125 points at 10:00 ET.

---

## 4. Truncation check

20 consecutive SPX snaps after 10:00:04 ET (reconstructed `t` order). Contract counts:

```
snap-140004073Z.json rows 102 listed 51
snap-140006335Z.json rows 62 listed 31
snap-140008743Z.json rows 62 listed 31
snap-140011110Z.json rows 62 listed 31
snap-140013448Z.json rows 62 listed 31
snap-140022796Z.json rows 102 listed 51
snap-140025207Z.json rows 102 listed 51
snap-140029940Z.json rows 102 listed 51
snap-140032348Z.json rows 62 listed 31
snap-140034719Z.json rows 62 listed 31
snap-140037095Z.json rows 62 listed 31
snap-140039516Z.json rows 62 listed 31
snap-140046644Z.json rows 102 listed 51
snap-140048973Z.json rows 102 listed 51
snap-140056176Z.json rows 62 listed 31
snap-140058524Z.json rows 62 listed 31
snap-140100910Z.json rows 62 listed 31
snap-140103332Z.json rows 60 listed 30
snap-140105711Z.json rows 60 listed 30
snap-140115256Z.json rows 102 listed 51
```

Every copied snap: `massive_page_limit=250`, `max_strikes_per_dte=250`.

```
generation has next_url key False
envelope next_url None
```

**Shows:** not a flat 250 ceiling. Counts oscillate **60 / 62 / 102** (30–51 strikes). Pagination token is **not stored**. 250 is a stored cap; this day’s SPX snaps sit **below** it.

---

## 5. Cadence actual

Same 20 snaps, reconstructed `t` (ET):

```
2026-08-28T10:00:04.073000-04:00 snap-140004073Z.json
2026-08-28T10:00:06.335000-04:00 snap-140006335Z.json
2026-08-28T10:00:08.743000-04:00 snap-140008743Z.json
2026-08-28T10:00:11.110000-04:00 snap-140011110Z.json
2026-08-28T10:00:13.448000-04:00 snap-140013448Z.json
2026-08-28T10:00:22.796000-04:00 snap-140022796Z.json
2026-08-28T10:00:25.207000-04:00 snap-140025207Z.json
2026-08-28T10:00:29.940000-04:00 snap-140029940Z.json
2026-08-28T10:00:32.348000-04:00 snap-140032348Z.json
2026-08-28T10:00:34.719000-04:00 snap-140034719Z.json
2026-08-28T10:00:37.095000-04:00 snap-140037095Z.json
2026-08-28T10:00:39.516000-04:00 snap-140039516Z.json
2026-08-28T10:00:46.644000-04:00 snap-140046644Z.json
2026-08-28T10:00:48.973000-04:00 snap-140048973Z.json
2026-08-28T10:00:56.176000-04:00 snap-140056176Z.json
2026-08-28T10:00:58.524000-04:00 snap-140058524Z.json
2026-08-28T10:01:00.910000-04:00 snap-140100910Z.json
2026-08-28T10:01:03.332000-04:00 snap-140103332Z.json
2026-08-28T10:01:05.711000-04:00 snap-140105711Z.json
2026-08-28T10:01:15.256000-04:00 snap-140115256Z.json
gaps [2.262, 2.329, 2.338, 2.348, 2.367, 2.371, 2.376, 2.379, 2.386, 2.408, 2.408, 2.411, 2.421, 2.422, 4.733, 7.128, 7.203, 9.348, 9.545]
median 2.408 max 9.545
```

Day STATS SPX (`day=2026-08-28/STATS.json`): `count=23830`, `delta_median=2.394`, `delta_p95=4.83`, `delta_max=54.683`. Gaps `count=12`. RTH-clock (filename hour 13–19 UTC) GAP rows: **7**, seconds `[18.898, 19.2, 28.235, 18.961, 33.443, 54.683, 35.671]`, max:

```
{"after_file": "snap-171541585Z.json", "until_file": "snap-171636268Z.json", "missing_s": 54.683, "hole": "GAP"}
```

**Shows:** typical gap ~2.4 s (inside 2–5 s). The 20-snap window’s max is 9.5 s; the day’s named RTH GAP max is **54.7 s**. SVP 1-minute buckets downsample this.

---

## 6. Mount registration (OD-SV5)

StudioOne `/Users/ernie/Fattail-Labs/.env` (and StudioTwo copy), verbatim:

```
LABS_MARKET_DATA_ROOT=/Volumes/FatTail2TB/fattail-market-data
LABS_MARKET_DATA_MOUNTS=raw-primary:/Volumes/FatTail2TB
```

`ls -ld /Volumes/FatTail2TB` on StudioOne: directory present. On StudioTwo: `No such file or directory`.

Labs DB (StudioTwo `labs`):

```
SHOW TABLES LIKE 'market_storage_mount'
# tables []
SELECT ... FROM market_storage_mount
# ProgrammingError: (1146, "Table 'labs.market_storage_mount' doesn't exist")
```

**Shows:** the gold disk is named in **env** as role **`raw-primary`**. The **catalog table is absent**. OD-SV5 still has to land a catalog row (existing role, no new role) if SVP jobs fail-loud on the mount map.

---

## Notes (not a spec fold)

- Filenames are `snap-HHMMSSmmmZ.json`. Ordering used reconstructed `t` in the NY session window. 08-31 last file `snap-004954277Z.json` reconstructs to **2026-09-01T00:49:54Z** = 20:49 ET 08-31 — filename sort ≠ session order across UTC midnight (§9b).
- 2026-08-14 remains the 5-min / 129-snap Friday (STATS median row `count=129`, `delta_median=300`).
- `du` stall on gold is independent of JSON copy size (~2.6M under `/tmp/svp-probe`).
