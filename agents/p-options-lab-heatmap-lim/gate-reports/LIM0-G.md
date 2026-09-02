# LIM0-G — Spec GO / board lock

**Gate:** LIM0-G  
**Delta** ternary  
**Date:** 2026-09-02  
**Plan:** `docs/Options-Lab-Heatmap-LIM-Full-Agent-Bench-Plan-v1.1.md` v1.1  
**Spec:** LIM v0.4.2 DRAFT  
**Token:** `agents/go/OLLIM-W0.md` — **UNSTAMPED** (this file is not LIM0-0)

## Verdict

**PASS**

Every LIM0-1…9 seat has a new file under `seeds/out/` with byte count > 8k. Merged Templates DRAFT exists in `Specs/`. Spec sha1 matches. No `web/` or `server/` edits from this fire (`web/next.config.ts` dirty from an earlier StudioTwo session, not LIM0). LIM1 did not start. Stamp / OD / JR / three-OK log **not** pre-filled.

---

## Command that produced the listing

```bash
cd /Users/ernie/FatTail-Labs
ls -la agents/p-options-lab-heatmap-lim/seeds/out/LIM0-*-out.md Specs/FatTail-Labs-Options-Lab-Heatmap-Templates-LIM-merge-DRAFT.md
for f in \
  agents/p-options-lab-heatmap-lim/seeds/out/LIM0-1-india-out.md \
  agents/p-options-lab-heatmap-lim/seeds/out/LIM0-2-hotel-out.md \
  agents/p-options-lab-heatmap-lim/seeds/out/LIM0-3-echo-out.md \
  agents/p-options-lab-heatmap-lim/seeds/out/LIM0-4-tango-out.md \
  agents/p-options-lab-heatmap-lim/seeds/out/LIM0-5-charlie-out.md \
  agents/p-options-lab-heatmap-lim/seeds/out/LIM0-6-mike-out.md \
  agents/p-options-lab-heatmap-lim/seeds/out/LIM0-7-delta-out.md \
  agents/p-options-lab-heatmap-lim/seeds/out/LIM0-8-juliet-out.md \
  agents/p-options-lab-heatmap-lim/seeds/out/LIM0-9-lima-out.md \
  Specs/FatTail-Labs-Options-Lab-Heatmap-Templates-LIM-merge-DRAFT.md
do
  printf 'FILE=%s\n' "$f"
  printf 'BYTES=%s\n' "$(wc -c < "$f" | tr -d ' ')"
  printf 'FIRST=%s\n' "$(head -n 1 "$f")"
  echo
done
shasum -a 1 "Specs/FatTail Labs — Heatmap LIM Template — Specification v0.4.2.md"
```

## Listing (verbatim)

```
-rw-r--r--  1 ernie  staff  18676 Sep  2 08:16 agents/p-options-lab-heatmap-lim/seeds/out/LIM0-1-india-out.md
-rw-r--r--  1 ernie  staff  22770 Sep  2 08:16 agents/p-options-lab-heatmap-lim/seeds/out/LIM0-2-hotel-out.md
-rw-r--r--  1 ernie  staff  22219 Sep  2 08:16 agents/p-options-lab-heatmap-lim/seeds/out/LIM0-3-echo-out.md
-rw-r--r--  1 ernie  staff   8685 Sep  2 08:16 agents/p-options-lab-heatmap-lim/seeds/out/LIM0-4-tango-out.md
-rw-r--r--  1 ernie  staff  12491 Sep  2 08:16 agents/p-options-lab-heatmap-lim/seeds/out/LIM0-5-charlie-out.md
-rw-r--r--  1 ernie  staff   9854 Sep  2 08:16 agents/p-options-lab-heatmap-lim/seeds/out/LIM0-6-mike-out.md
-rw-r--r--  1 ernie  staff   8386 Sep  2 08:16 agents/p-options-lab-heatmap-lim/seeds/out/LIM0-7-delta-out.md
-rw-r--r--  1 ernie  staff   8128 Sep  2 08:16 agents/p-options-lab-heatmap-lim/seeds/out/LIM0-8-juliet-out.md
-rw-r--r--  1 ernie  staff   8564 Sep  2 08:16 agents/p-options-lab-heatmap-lim/seeds/out/LIM0-9-lima-out.md
-rw-r--r--  1 ernie  staff  14324 Sep  2 07:45 Specs/FatTail-Labs-Options-Lab-Heatmap-Templates-LIM-merge-DRAFT.md

FILE=agents/p-options-lab-heatmap-lim/seeds/out/LIM0-1-india-out.md
BYTES=18676
FIRST=# India checklist — Options Lab Heatmap LIM (LIM0-1)

FILE=agents/p-options-lab-heatmap-lim/seeds/out/LIM0-2-hotel-out.md
BYTES=22770
FIRST=# Hotel goldens — Heatmap LIM (LIM0-2)

FILE=agents/p-options-lab-heatmap-lim/seeds/out/LIM0-3-echo-out.md
BYTES=22219
FIRST=# LIM0-3 — Echo IA: quadrant plane

FILE=agents/p-options-lab-heatmap-lim/seeds/out/LIM0-4-tango-out.md
BYTES=8685
FIRST=# LIM0-4 — Tango copy lock (Heatmap LIM)

FILE=agents/p-options-lab-heatmap-lim/seeds/out/LIM0-5-charlie-out.md
BYTES=12491
FIRST=# LIM0-5 — Charlie feasibility

FILE=agents/p-options-lab-heatmap-lim/seeds/out/LIM0-6-mike-out.md
BYTES=9854
FIRST=# LIM0-6 — Trust boundary (Mike)

FILE=agents/p-options-lab-heatmap-lim/seeds/out/LIM0-7-delta-out.md
BYTES=8386
FIRST=# LIM AT ownership matrix — LIM0-7

FILE=agents/p-options-lab-heatmap-lim/seeds/out/LIM0-8-juliet-out.md
BYTES=8128
FIRST=# LIM0-8 — Juliet seed inventory + isolation + E12/JR8

FILE=agents/p-options-lab-heatmap-lim/seeds/out/LIM0-9-lima-out.md
BYTES=8564
FIRST=# Lima DL draft (LIM0-9) — not landed

FILE=Specs/FatTail-Labs-Options-Lab-Heatmap-Templates-LIM-merge-DRAFT.md
BYTES=14324
FIRST=# FatTail Labs — Options Lab Heatmap Templates — LIM merge DRAFT

41dad04f06f7f2a43b80af4becb9153bf6f4f88a  Specs/FatTail Labs — Heatmap LIM Template — Specification v0.4.2.md
```

---

## Seat checks (not a substitute for the listing)

| Seat | Path | Bytes | Notes |
|------|------|------:|-------|
| LIM0-1 India | `seeds/out/LIM0-1-india-out.md` | 18676 | Live parent **`Specs/FatTail-Labs-Options-Lab-Heatmap-Templates-Spec-v0_2.md`** (rev **v0.2.3**) |
| LIM0-2 Hotel | `seeds/out/LIM0-2-hotel-out.md` | 22770 | Summary table rows 1–8 with x, y, netRatio, concF, magF, crossingCount |
| LIM0-3 Echo | `seeds/out/LIM0-3-echo-out.md` | 22219 | Compact keeps the ring |
| LIM0-4 Tango | `seeds/out/LIM0-4-tango-out.md` | 8685 | Appendix B verbatim |
| LIM0-5 Charlie | `seeds/out/LIM0-5-charlie-out.md` | 12491 | C2 scoped: first LIM activation, not panel module load |
| LIM0-6 Mike | `seeds/out/LIM0-6-mike-out.md` | 9854 | Client-only |
| LIM0-7 Delta | `seeds/out/LIM0-7-delta-out.md` | 8386 | AT-LIM1…28; AT-LIM17 isolation |
| LIM0-8 Juliet | `seeds/out/LIM0-8-juliet-out.md` | 8128 | Seeds cite v0.4.2; three-OK log empty |
| LIM0-9 Lima | `seeds/out/LIM0-9-lima-out.md` | 8564 | DL draft; Arch 00 not appended |
| India merge | `Specs/FatTail-Labs-Options-Lab-Heatmap-Templates-LIM-merge-DRAFT.md` | 14324 | Parent named `…-v0_2.md` rev v0.2.3; no `session-volume` enum |

L1–L17 remain **PROVISIONAL**. LIM1 blocked until Coach stamps `OLLIM-W0.md`.
