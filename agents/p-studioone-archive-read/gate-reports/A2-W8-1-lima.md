# A2-W8-1 Lima — leftover honesty (not a reissue)

**Agent:** Lima  
**Date:** 2026-08-29  
**Law:** A1 leftover list · doctrine §11 · Coach this turn: flag leftovers rather than follow them

Repaired **in place** on `Specs/FatTail-Labs-StudioOne-Archive-Read-API-Spec-v0_8.md` (the four A1 leftovers):

1. §8 reconstruction-retired line — withdrawn. Reconstruction by tap window stays in §1.
2. §1 Seek `sorted` / `i % 64` — replaced with reconstructed-`t` + derived `S`.
3. §4.2 / §4.3 `expiration` (required) — optional assertion (§2).
4. §7 coverage `no-store` cell — `must-revalidate`.

**Flagged, not followed:**

| Leftover | Ruling |
|----------|--------|
| §3 `TODAY_LIVE` fetch refusal | TMI-85. TMOS W1 lifts the reader. |
| §4.7 `within_dl400` **[3, 5]** | **DL-609** **[2, 5]**. Stats emit both. |
| Dash `Cache-Control: no-store` | Resolved spec is `must-revalidate`. As-built until a bounce. **No bounce this wave.** |
| launchd 02:00 from SSH | Plist in `~/Library/LaunchAgents`. `bootstrap user/503` I/O error 5. First backfill ran by hand. |

Did not fold A1 into a reissued spec. Did not call the store gold.
