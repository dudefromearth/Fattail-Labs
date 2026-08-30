# Orchestrator — StudioOne Archive Read (SO-AR)

**Juliet** runs this board. Specialists only via seeds. Gates via **Delta** ternary.

---

## A2 strip (active — W0-0 STAMP · W0-BA GO)

**Plan:** [`docs/StudioOne-Archive-Read-API-Amendment-A2-Full-Agent-Bench-Plan-v1.0.md`](../../docs/StudioOne-Archive-Read-API-Amendment-A2-Full-Agent-Bench-Plan-v1.0.md) **v1.0**  
**Law:** v0.8 + A1 + **Amendment A2_1** (`Specs/FatTail-Labs-StudioOne-Archive-Read-API-Spec-v0_8-Amendment-A2_1.md`)  
**W0 token:** [`agents/go/SOAR-A2-W0.md`](../go/SOAR-A2-W0.md) — **W0-0 STAMP · W0-BA GO 2026-08-29**

```text
A2-W0 STAMP → W0-G (files) → W0-BA GO → W1 characterize → W2 marks+flat-day → W3 proxy → W4 bearer → W5-GO → W5 dash → W6 Kilo 50…59 → W7 Lima → W-G
```

| Phase | Name | State |
|-------|------|--------|
| **A2-W0** | Coach ticks | **W0-0 STAMP 2026-08-29.** A2_1 Accept. §9.2 reverse. Near = **15 s GAP floor**. COUNTS carve-out accepted as written. Bounce stays **W5-GO**. |
| **A2-W0-BA** | BUILD AUTHORITY | **GO 2026-08-29** (Coach, same word as W0-0) |
| **A2-W0-2…G** | India · Mike · Hotel · Echo · Tango · Delta | file; do **not** re-block W1 |
| **A2-W1** | Characterize | **W1-G PASS 2026-08-29.** AT-SOAR-50 and 55 **fail** on the live dash. No module write. |
| **A2-W2** | Alpha reader | **W2-G PASS 2026-08-29.** Live **store** 50/55 pass. Live **dash HTTP** still 404 until **W5-GO**. Module lock released. |
| **A2-W3** | Labs proxy | **W3-G PASS 2026-08-29.** `GET /api/me/options-lab/archive/marks`. Session-only. 501 / unreachable / 404-not-found honest. |
| **A2-W4** | Bearer | **W4-G PASS 2026-08-29.** Token set (len 64). No-bearer `/api/marks` **401** `ARCHIVE AUTH`, not empty tape. `/` and `/api/status` open. |
| **A2-W5** | Dash bounce | **W5-G PASS 2026-08-29.** HTTP 50/55 green. Tap PID 21649 unchanged. phase=weekend, wake 2026-08-30 20:15 ET. AT-SOAR-45 not scored (Monday). |
| **A2-W6** | Kilo ATs | **W6-G PASS 2026-08-29.** 50 live 08-27 mid 17.855. 55 live 08-14 SPY 129. 45 not scored. 56 holds A2-2 (08-17 nested UNKNOWN). |
| **A2-W7** | Lima | **done 2026-08-29.** §9 item 2 closed. TMOS pointer: tape is served; TM consumes next. |
| **A2-W8** | Lima leftovers | **done 2026-08-29.** Four A1 leftovers repaired in place. Not a v0.9 reissue. |
| **A2-W-G** | GO | **PASS 2026-08-29.** One carry: **AT-SOAR-45** Monday. Stats backfill 14 days. |

**SO-AR module lock (Coach 2026-08-29):** one at a time. A2 first (W1 characterize, then W2 reader). **TMOS W1 (`TODAY_LIVE` lift) does not start until A2 W2-G PASS.** Same file: `server/market_data/ssr_archive_read.py`. A2 owns it through W2-G. TMOS takes it after. Delta fail-closed on a concurrent edit or a silent merge. Dash bounce stays Coach at **A2 W5-GO**.

**Do not (A2):** TMOS W1 on this file before W2-G · tap write · bounce without **W5-GO** · LOCF · wait on `generation.vix` · rewrite 08-14 · waive AT-SOAR-50/55 · fixture closing 50 · stamp `…-Amendment-A2.md` instead of **A2_1** · wait on v2.1 W6–W8 · read a proxied VIX as native

---

## v2.1 GO (not this program)

**Plan:** [`docs/StudioOne-Archive-Read-API-Full-Agent-Bench-Plan-v2.1.md`](../../docs/StudioOne-Archive-Read-API-Full-Agent-Bench-Plan-v2.1.md) **v2.1**  
**Law:** spec **v0.8** + **Amendment A1**  
**W0 token:** [`agents/go/SOAR-W0.md`](../go/SOAR-W0.md) — **W0-0 stamped · W0-BA GO 2026-08-27**

```text
W0 → W0-BA → W1 → W2 → W3 → W4 → W5-GO → W5 → W6 → W7 → W8 → W-G
```

| Phase | Name | State |
|-------|------|--------|
| **W0** | Review + ticks | **Stamped** (plan v2.1 · v0.8 + A1) |
| **W0-BA** | BUILD AUTHORITY | **GO 2026-08-27** |
| **W1** | Prior-art characterize | **W1-G PASS** |
| **W2** | Reader | **W2-G PASS** |
| **W3** | Labs proxy + cache | **W3-G PASS** |
| **W4** | Bearer | **W4-G PASS** |
| **W5** | StudioOne dash bounce | **Bounced 2026-08-27 13:12 ET.** Token length 64. AT-SOAR-45 scheduled **Friday 09:32 ET**. W5-G waits on those numbers. |
| **W6–W8** | See plan **v2.1** | Blocked on W5-G |

### Coach reminders (2026-08-27)

- **W2:** order by reconstructed `t`, never by filename. No name-sorted ladder. No local-date candidate test.
- **Envelope open:** named branch for two-in-window files only. Never a quiet `json.loads` on the hot path.
- **W5-G** is not green on AT-SOAR-45. A tap that is running and dropping snaps does not pass. Cadence evidence, not process liveness.
- **W5** does not fire without Coach’s word. **Same bounce as the secret.** Absent token is **501 ARCHIVE NOT CONFIGURED**, never 200.
- **W8 leftover (exactly four):** §8 reconstruction-retired; §1 Seek paragraph; the two expiration-required query lines; §7 `no-store` cell.

### Do not

Name-sorted ladder · local-date candidate test · quiet envelope-open on index · tool-gate replay · three-OK on designated StudioOne work · abort Labs boot on **absent** archive env · starve the tap · admin-tree edits · say “gold” for the store · bounce the dash without **W5-GO**.
