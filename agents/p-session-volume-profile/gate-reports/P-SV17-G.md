# P-SV17-G — Delta

**Date:** 2026-09-01  
**Agent:** Delta  
**GO:** P-SV17 (close P-SV1 with the decomposition)  
**Authority:** P-SV16 · probe request 7 outcome row 1  
**Work under review:** `docs/evidence/session-volume-profile/P-SV1-decomposition.md`  
**Verdict:** **PASS**

Delta did not modify the decomposition or the tap.

---

## Criteria (restated)

1. Decomposition lands at `P-SV1-decomposition.md` with a–f, numbers, and fixture counts.
2. Sample base is **15 contracts / 3 sessions**, stated wherever a bound is quoted.
3. SVP options (i) snapshot · (ii) eligible-tape reconstruct · (iii) both — with measured divergence beside each. **No choice.**
4. Labelling recommendation is Hotel’s; ship decision is Coach’s. Coverage strip declares whatever is chosen.
5. Tap restarted under usual discipline; `day.last_updated` lands on new rows.
6. On PASS: P-SV1 closes; `svp_v1` freeze question goes to Coach; Hotel stays blocked until labelling.

---

## Checks

| # | Criterion | Result | Evidence |
|---|-----------|:------:|----------|
| 1 | File exists; a–f present | **PASS** | `docs/evidence/session-volume-profile/P-SV1-decomposition.md` — sections a–f, outcome table, 15-row eligible=aggs=oc table, 09-01 five residual 0, named +2930/+4665/+3854, four negatives, P-SV10 −10 @ 16:13:02, Labs-side five closed |
| 2 | Sample base 15 / 3 | **PASS** | Banner line and every bound. Subset tests (truncation 1 contract / 4 pulls; tap 5 contracts / 3 instants; lag 2 contracts) quote their own fixture count |
| 3 | 1-lot not hidden | **PASS** | 08-19 ATM put tape_eligible **122945** vs aggs/open-close **122944**. Coach’s “exact” sits beside the miss. 14/15 |
| 4 | Two of three reconcile | **PASS** | Eligible tape = aggs = open-close on 14/15. Snapshot equals those on 09-01 five only |
| 5 | Positive side: no mechanism | **PASS** | §e states it. Five Labs hypotheses named and killed; sixth (raw tape) labelled wrong comparator. No sixth story invented |
| 6 | Options, no choice | **PASS** | (i) residual_eligible **−975 … +4665** (−38.30% … +22.84%) on this sample; (ii) 14/15 exact, not intraday; (iii) the difference is residual_eligible. “Do not choose here.” Hotel / Coach table |
| 7 | Coverage strip | **PASS** | “Whatever is chosen, the coverage strip declares it.” Anomalies doctrine named |
| 8 | No spec fold / no freeze / no Hotel unblock | **PASS** | Status table: P-SV1 closed on this PASS; freeze to Coach; Hotel blocked; spec fold not this GO |
| 9 | Tap restart | **PASS** | See below |
| 10 | `last_updated` on new rows | **PASS** | See below |

---

## Tap restart (criterion 5)

**Host:** StudioOne (`StudioOne.local`). Coach remote.  
**Not:** a full `git pull`. StudioOne HEAD is **`4b3045a`**. `origin/main` is **`3801c0d`**. Five tracked files on the host already differ from HEAD (`ssr_live_capture.py` +431/−, dash, `massive_client.py`, `sym_feed.py`). Incoming ∩ local is those five. A pull would have fought the live tap. The capture fix is **four lines** in `chain_ladder.py` (`3801c0d`). Those four lines were applied onto the running file. Backup `/tmp/chain_ladder.py.pre-psv17`. Product patch signature / `LADDER_FIELDS` / `_row_signature` untouched.

**Launch (recorded before kickstart):**

```
launchd: user/503/ai.fattail.labs.ssr-live-capture
ProgramArguments: /bin/zsh /Users/ernie/Fattail-Labs/scripts/ssr-live-capture-run.sh
WorkingDirectory: /Users/ernie/Fattail-Labs/server
LimitLoadToSessionType: Background Aqua StandardIO
KeepAlive: Crashed=true SuccessfulExit=false RunAtLoad=true
```

**`.env` (tap-relevant):**

```
LABS_MARKET_BUS=1
REDIS_URL=redis://127.0.0.1:6379/0
LABS_MARKET_DATA_ROOT=/Volumes/FatTail2TB/fattail-market-data
LABS_MARKET_DATA_MOUNTS=raw-primary:/Volumes/FatTail2TB
LABS_SSR_CHAIN_EVERY_S=2
LABS_SSR_WINGS=15
MASSIVE_API_KEY is set
```

`gui/` print from SSH is unavailable (domain 125). Job is in **`user/503`**, `state=running`.

**Before:** tap **21649** / chain_feed **21657** since 2026-08-27 08:14. `last_updated` key **0 / 62** on 20:20 snaps.

**Command:** `launchctl kickstart -k user/503/ai.fattail.labs.ssr-live-capture`  
**When:** 2026-09-01 **20:23:49 EDT**. Exit **0**.

**After:**

| | before | after |
|--|--------|-------|
| tap PID | 21649 (Aug 27 08:14) | **66452** (Sep 1 20:23:49) |
| chain_feed PID | 21657 (child of 21649) | **66456** (child of 66452) |
| sym_feed PID | 95845 (Aug 29 00:37) | 95845 unchanged |
| launchd `runs` | 4 | **5** |
| `state` | running | running |
| `--status` | phase `gth`, snaps_on_disk 184539 | phase `gth`, start tick 20:23:49.840, holes `[]` |

Nothing was left down. No restore.

**`last_updated` on new rows** (post-restart SPX snaps; gold path `day=2026-09-01/chain/SPX`):

| file | captured_at | rows | `last_updated` key | nonzero |
|------|-------------|-----:|-------------------:|--------:|
| snap-002442398Z.json | 2026-09-01T20:24:42.398-04:00 | 62 | **62** | **62** |
| snap-002439695Z.json | 2026-09-01T20:24:39.695-04:00 | 62 | **62** | **62** |
| snap-002437158Z.json | 2026-09-01T20:24:37.158-04:00 | 62 | **62** | **62** |

Sample row: ticker `O:SPXW260901C07705000`, volume 11358, `last_updated` **1788292622196000000** = **2026-09-01T15:57:02.196-04:00**. That is the vendor field, not the capture clock. Keys include `last_updated`. Pre-restart 20:20 snaps had the key **absent**.

Wider post-restart walk (newest 8 snaps × 18 chain symbols, `captured_at` ≥ 20:23:49): **56 / 56** snaps with rows have the key; **56 / 56** have at least one nonzero. IWM `wings=25` rows are 102 key / 100 nonzero on two snaps — two contracts carry `last_updated` as empty; the field is still on the row.

Cadence after restart ~2.3 s (20:24:37 / :39 / :42). `ssr-live-capture.err.log` mtime **Aug 27 01:17** — no new stderr from PID 66452. Historical PermissionError for `day=2026-08-27` is old; not this restart.

---

## Fail-closed (none tripped)

- Spec not folded.
- `svp_v1` not frozen.
- Hotel not unblocked.
- No choice among (i)/(ii)/(iii).
- Gold not rewritten except the live tap’s ordinary GTH snaps.
- StudioOne local capture/dash patches not overwritten by a pull.
- DL-539: no product tree outside this program.

---

## Unblocks

| Item | State |
|------|-------|
| **P-SV1** | **Closed** |
| **`svp_v1` freeze** | Goes to **Coach** |
| **Hotel** | **Blocked** until the labelling decision — a decision, not a defect |
| **SVP0** | Still waits P-SV1 (now closed) **and** P-SV4 (already closed) **and** Coach GO |

Ternary: **PASS**.
