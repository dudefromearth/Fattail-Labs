# Project: Help Watch + Wiki Follow

**Board:** `agents/p-help-watch/`  
**Orchestrator:** Juliet  
**Help Watch seat:** **Sierra** (`HW-W0` 2026-09-15)  
**Authority:** Coach  
**Token:** [`agents/go/HW-W0.md`](../go/HW-W0.md) **STAMPED GO** · **DL-704**

## Plans / specs

| Doc | Path |
|-----|------|
| **Spec v0.3 BUILD AUTHORITY** | [`Specs/FatTail-Labs-Help-Watch-and-Wiki-Follow-Spec-v0.3.md`](../../Specs/FatTail-Labs-Help-Watch-and-Wiki-Follow-Spec-v0.3.md) |
| Spec v0.2 baseline freeze | [`Specs/FatTail-Labs-Help-Watch-and-Wiki-Follow-Spec-v0.2.md`](../../Specs/FatTail-Labs-Help-Watch-and-Wiki-Follow-Spec-v0.2.md) |
| Spec v0.1 baseline freeze | [`Specs/FatTail-Labs-Help-Watch-and-Wiki-Follow-Spec-v0.1.md`](../../Specs/FatTail-Labs-Help-Watch-and-Wiki-Follow-Spec-v0.1.md) |

## Mission

Help Watch knows app changes on `origin/main`, decodes whether member Help must change, and **writes** `server/help_reference/*.md`. **First job:** retrospective sweep (as-built vs Help, one PR per app area). Wiki Follow is the existing S1 poller: it watches published Help and updates Wiki pages. Two jobs, not one seat for both.

Sierra’s curriculum charter (`agents/bench/sierra.md`) is **unchanged**. This board is an additional write job: member Help markdown only.

## Invariants

- **HW-G0:** stamp required ticks marked; straight-to-main stays blank until sweep close + precision
- **HW-1:** PR-first = sweep PRs; straight-to-main earned later
- **HW-4:** live-loop Help commit is follow-on, same day, never the product SHA
- **HW-5:** StudioTwo only
- DL-572: file in `help_reference/` on `main` = published. Branch is the draft
- L4 / L9 / L11 / L12 · poll≠subscribe · concierge whitelist · standing freezes
- Never `git add -A`. Do not stop `:3000` / `:4000`

## Out of scope

- Product trees, Specs rewrite, Wiki poller changes, MiniTwo, matcher, Analyzer, LIM/QFRIC/XS
