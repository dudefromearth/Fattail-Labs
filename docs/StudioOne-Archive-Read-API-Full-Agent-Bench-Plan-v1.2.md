# StudioOne Archive Read API — Full Agent Bench Plan v1.2

**SUPERSEDED** by [`docs/StudioOne-Archive-Read-API-Full-Agent-Bench-Plan-v1.3.md`](./StudioOne-Archive-Read-API-Full-Agent-Bench-Plan-v1.3.md). Do not stamp this revision.

**Date:** 2026-08-27  
**Plan revision:** **v1.2** (superseded)  
**Canonical filename:** `docs/StudioOne-Archive-Read-API-Full-Agent-Bench-Plan-v1.2.md`  
**Supersedes:** plan v1.1 (spec v0.7) · v1.0 (spec v0.3)  
**Owner (orchestration):** Juliet  
**Authority:** Coach (GO / ship)  
**W0 artifact:** [`agents/go/SOAR-W0.md`](../agents/go/SOAR-W0.md) — Delta reads **this file**, not chat (**DL-328**).  
**Board:** [`agents/p-studioone-archive-read/`](../agents/p-studioone-archive-read/)  
**Governance:** [`agents/bench/doctrine.md`](../agents/bench/doctrine.md) · [`AGENTS.md`](../AGENTS.md) · [`spec-create-review-workflow.md`](../agents/bench/spec-create-review-workflow.md)

**Primary law:**

| Doc | Path | Status |
|-----|------|--------|
| **SO-AR Spec v0.8** | [`Specs/FatTail-Labs-StudioOne-Archive-Read-API-Spec-v0_8.md`](../Specs/FatTail-Labs-StudioOne-Archive-Read-API-Spec-v0_8.md) | **DRAFT · buildable** · **not BUILD** until **W0-BA** |
| Supercedes | v0.7 … v0.1 | Reconstruction **restored** (window, not local-date). Store root **confirmed**. `DATE MISMATCH` → `OUT OF WINDOW`. **§9b** ordering. |
| **DL-597** | Store = FatTail2TB | **Law in spec §1** |
| **DL-596** | Archive Read DRAFT | Lima retargets to **v0.8** at W0-1 |
| **DL-400** | 3–5 s fail-loud | Settled by **§4.7**, not recollection |
| Arch **28** | One WS | Browser never calls StudioOne |
| OT-EF / **DL-309** | Named holes | Fetch payloads |

**Juliet does not invent WHAT.** Advisor-set numbers are law unless Coach overrules in one line. Coach ticks on `SOAR-W0.md`: **spec-C**, **§9.1–4**, **§9b**.

Delta: **PASS / FAIL / BLOCKED**, never waived. Coach Content Law: §0 is not erased; later sections sit beside it.

**No product code in W0.** W1+ after **W0-BA**. StudioOne dash bounce on **Coach W5-GO** (not a three-OK count).

---

## 0. Evaluation of Spec v0.8

### 0.1 What v0.8 fixes

v0.8 is the spec that matches the disk:

| Claim | v0.7 | v0.8 |
|-------|------|------|
| Filenames | “carry their own date” (wrong) | **Time-of-day only, confirmed 2026-08-27:** `snap-HHMMSSmmmZ.json` / Friday `snap-HHMMSSZ.json` |
| `t` | From a date in the name | **Reconstruct:** UTC clock on D or D+1; take the candidate inside the folder’s **UTC tap window**. Local-date test is forbidden (24h late on prior-evening snaps). |
| `DATE MISMATCH` | Named | **Retired.** Replaced by **`OUT OF WINDOW`**. |
| Store root | Await confirm | **`/Volumes/FatTail2TB/fattail-market-data/ssr/live_capture` (DL-597)** |
| Sort = time? | Assumed | **§9b blocking.** Name-sort equals time only inside one UTC date. |

**Juliet rec for `t`:** implement the window rule as written. Window = same interval the tap uses (`GTH_START` 20:15 ET through the session; India quotes `ssr_live_capture.py`). Config, fail loud if absent.

### 0.2 §9b is not hypothetical — measured 2026-08-27

Spec test: any folder with clocks **≥22:00Z and ≤05:00Z**?

| Folder | ≥22:00Z | ≤05:00Z | Wrap |
|--------|--------:|--------:|------|
| 2026-08-14 | 25 | 0 | no (Friday 5-min RTH) |
| 2026-08-17 | 0 | 36 | no (almost empty) |
| 2026-08-18 … 08-26 | yes | yes | **yes** |

**Name-sort is not time order on every dense day we have.** Spec’s safe rule is law for this plan: **order by reconstructed `t` unconditionally.** Name-sort is not an optimization we will ship.

Coach ticks **§9b Accept** (that rule) or Override. W2 does not fire a name-sorted ladder.

### 0.3 Leftovers India must quote (do not silent-edit the spec)

| Leftover | Later law |
|----------|-----------|
| §0.11 missing URL aborts boot | **§6.1** absent is supported |
| §0.16 three OKs | **Scope v0.7+** — Coach designated StudioOne; bounce on Coach’s word |
| §4.2 / §4.3 “`expiration` (required)” | **§2** optional assertion. Tick **spec-C**. Implement §2. |
| §1 index cell / §4.2 `t` “filename carries its own date” | **§1 reconstruction** (v0.8). Editorial. |
| §8 “Reconstructing a date from the folder (retired)” | **Wrong after v0.8.** Reconstruction is restored. Lima repairs after W0-BA. |
| §7 member table `Cache-Control: no-store` | **§9** `max-age=0, must-revalidate` |
| §4.4 “pool of 2 is the only lever” | Pool is **4** |
| §9 intro still “filenames carry their own date” as unconfirmed | **§1 CONFIRMED time-of-day only** |

### 0.4 Still law from v0.7 (unchanged)

0DTE only · band ratchet is OPF · same rack/LAN · corpus home · everyone gets replay · collection outranks reads (pool 4 / queue 8) · derived stride · 8 MB / 512 continuation · Labs 20 GB whole-day LRU · stats on StudioOne 02:00 ET · session-only member routes · admin stats administrator-only · §7.4 panel **content** here, **mount** on admin spec.

### 0.5 Prior art

`server/market_data/ssr_archive_read.py` + proxy + tests exist; StudioOne dash **does not** ship the module. W1 characterizes. Index-open of JSON must not survive W2.

---

## 1. Mission

```text
W0     Review + ticks (spec-C · §9.1–4 · §9b)
W0-BA  BUILD AUTHORITY
W1     Characterize prior art
W2     Alpha reader — window reconstruction · order by t · derived stride · holes
W3     Alpha Labs proxy + 20 GB disk cache
W4     Mike Bearer
W5-GO  Coach word → StudioOne dash bounce
W6     Nightly stats launchd
W7     Kilo
W8     Lima (leftover table · §9a pointers · admin-spec one-liner)
W-G    Delta
```

Admin panel **code** is out of this board.

---

## 2. Hard gates

| Gate | Rule | Unblocks |
|------|------|----------|
| **W0-2 India** | Quote tap window constants, filename glob, wrap evidence, `front_expiration`, prior-art envelope opens. **spec-C and §9b BLOCKING until ticked.** | specialists · W0-G |
| **W0-3 Mike** | Bearer on archive routes only. Absent Labs env → 501 not 401. Session-only replay. | W0-G · W4 |
| **W0-4 Hotel** | No filled GAP. 0DTE named. TAP RESTART keeps both. `OUT OF WINDOW` not forced. | W0-G |
| **W0-5 Echo** | Four silences distinguishable. No admin chrome. | W0-G |
| **W0-6 Tango** | Empty calendar ≠ no days. 0DTE named (pointer). | W0-G |
| **W0-G** | `SOAR-W0.md` complete. No product code. | W0-BA |
| **W0-BA** | Coach BUILD | W1 |
| **W2-G** | Order by reconstructed `t`. Window rule. No JSON open on index. Today 409. Optional expiration. `S`/`k` returned. `next_index`. | W3 |
| **W3-G** | 501 unconfigured. Malformed abort. Disk cache whole-day. Admin stats administrator. Member session-only. | W4 |
| **W4-G** | 401 ≠ empty coverage. `/` open. | W5 |
| **W5-GO** | Coach word to bounce | W5 |
| **W5-G** | Live routes + tap still collecting | W6 |
| **W6-G** | Stats pass; no envelope opens; pool worker | W7 |
| **W-G** | Fail-closed: name-sorted ladder, sidecar, today-as-archive, invented print, collapsed silences, tool-gate, admin-tree edits | ship |

---

## 3. Locked

| ID | Decision | Source |
|----|----------|--------|
| **FP1** | Reconstruct `t` via UTC tap window, not NY local-date | v0.8 §1 |
| **FP2** | Order index/ladder by reconstructed `t`, never by filename | §9b · measured wrap |
| **FP3** | `OUT OF WINDOW` named, never snapped to an edge | §1 · §5 |
| **FP4** | Store root FatTail2TB path | §1 · DL-597 |
| **FP5** | 0DTE; `expiration` optional assertion; 404 WRONG BOOK | §2 · HTTP table |
| **FP6** | Today 409 TODAY_LIVE | §3 · HTTP table |
| **FP7** | Pool 4 / queue 8 / 30 s / Retry-After 2 / nice below tap | §4.4 |
| **FP8** | Bound 8 MB or 512; `next_index` | §4.5 |
| **FP9** | Derived stride `S`,`k` | §4.3 |
| **FP10** | Labs boots if archive env absent | §6.1 |
| **FP11** | Coverage ETag + must-revalidate | §9 |
| **FP12** | Member session-only; admin stats administrator | §7 |
| **FP13** | Labs disk cache 20 GB whole-day LRU | §7.1 |
| **FP14** | GAP 2.5× and 15 s floor | §4.1 |
| **FP15** | Stats 02:00 ET on StudioOne; files win | §7.2 |
| **FP16** | No sidecar, no MiniTwo until asked, no TM chrome | §8 |

**Coach ticks (W0-BA).** Juliet recs are opinion.

| # | Question | Juliet rec |
|---|---------|------------|
| **spec-C** | §4.2 required expiration vs §2 | **Implement §2** (optional assertion) |
| **§9b** | Name-sort vs `t`-order | **Accept spec:** order by reconstructed `t` always. Evidence: wrap on 08-18…08-26 |
| **§9.1** | Retention | Accept: keep; revisit 100 GB |
| **§9.2** | `marks/` | Accept: unserved |
| **§9.3** | TAP RESTART | Accept: keep both; flag day |
| **§9.4** | Symbols | Accept: honest per symbol-date |

Advisor-set numbers stand unless overridden on `SOAR-W0.md`.

---

## 4. DAG

```text
W0-0 Coach ticks
  → W0-1 Lima (sha1 · DL → v0.8)
  → W0-2 India
       ├── Mike · Hotel · Echo · Tango
  → W0-G → W0-BA
       → W1 → W2 → W3 → W4 → W5-GO → W5 → W6
       → W7 Kilo → W8 Lima → W-G
```

---

## 5. Packets

W0 seeds already on the board; retarget law to v0.8 / plan v1.2 (this revision). New/changed emphasis only:

| Seed | Change vs v1.1 |
|------|----------------|
| W0-0 | Ticks: spec-C, §9b, §9.1–4. **disk-A/B closed in spec.** |
| W0-2 | Quote tap window (`GTH_START`/`EXT_END`). Quote wrap evidence. Quote leftover “carries its own date” cells. |
| W2-1 | Reconstruct by **window**. Sort by **`t`**. Hole `OUT OF WINDOW`. No `DATE MISMATCH`. |
| W8 | Lima repairs leftover table/§8 reconstruction line **after** ticks. |

W1–W8 packet list otherwise matches plan v1.1 (reader → proxy → bearer → dash → stats → kilo → lima).

---

## 6. Acceptance tests — deltas from v1.1

Keep AT-SOAR-1…40 from plan v1.1 **except**:

| ID | v1.2 change |
|----|-------------|
| **AT-SOAR-8** | Today → **409** `TODAY_LIVE` |
| **AT-SOAR-9** | Expiration omitted → that day’s 0DTE book |
| **AT-SOAR-17** | **Replace DATE MISMATCH** with **OUT OF WINDOW** (200, named row) |
| **AT-SOAR-41** | Prior-evening clock `001730Z` in folder D reconstructs to **D-1 20:17 ET**, not D 20:17 ET |
| **AT-SOAR-42** | A folder with both `23xxxxZ` and `00xxxxZ` is indexed in **`t` order**, not name order (level 0 follows that sequence) |
| **AT-SOAR-43** | Cadence deltas use reconstructed `t`, so they do not go negative across 00:00Z |

---

## 7. Non-goals

Same as plan v1.1 NX1–NX15, plus:

| ID | Out |
|----|-----|
| **NX16** | Shipping a name-sorted ladder “because RTH is safe” |
| **NX17** | NY local-date candidate test for `t` |

---

## 8. Document control

| Version | Date | Notes |
|---------|------|-------|
| **v1.2** | 2026-08-27 | Spec **v0.8**. Reconstruction + window. Store confirmed. Wrap **measured** on gold days 08-18…26. Order by `t`. |
| **v1.1** | 2026-08-27 | Spec v0.7. SUPERSEDED. |
| **v1.0** | 2026-08-27 | Spec v0.3 opens. SUPERSEDED. |

**One-line law:**  
**W0 ticks leftover expiration, four corpus positions, and §9b; W2 places every clock inside the tap window and orders by that instant; the dash bounces on Coach’s word.**
