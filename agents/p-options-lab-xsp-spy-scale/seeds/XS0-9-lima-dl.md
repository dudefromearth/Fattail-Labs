# XS0-9 — GO DL + AGENTS reassignment (not outline)

**Project:** Options Lab XSP / SPY Scale  
**Agent:** Lima  
**Depends:** —  
**Feeds:** XS0-G · XS0-0 · PR 3 draft

## Intent

| Item | Pin |
|------|-----|
| **PR 1** | Land GO DL + `AGENTS.md` active-program line (third tree alongside LIM/QFRIC). QFRIC B1 pattern. Three-OK log unused |
| Plan hash | Whole-file sha1 of plan **v1.3** → DL. No Spec sha1 unless OD-XS5 Override |
| **Not this PR** | Scoped DL-435 reverse. That DL lands **in PR 3** with the helper, **only if OD-XS1 (a)** |
| XS-ETF | Flag QQQ / IWM $1-strike heatmap still 10…50 in `Architecture/flagged-ideas.md` **at this seed’s later execution** — not implemented here. Do not bless as non-regression |
| NX18 | A passing XS gate is not IKI progress |

## Draft — scoped DL-435 reverse (PR 3 only · do not file in PR 1)

Paste after the heatmap helper lands, **only if OD-XS1 (a)**:

```text
## YYYY-MM-DD — DL-XXX Heatmap XSP/SPY columns consume universe overlay (scoped DL-435 reverse)

**Decision.** Advanced Fly / Width Fit column lists for symbols whose universe
profile is `source === "market_symbol_universe"` and `fly_width_mode ===
"fixed_points"` consume that overlay list (today XSP and SPY: `[1..7]`).
SPX / NDX / RUT / VIX heatmap columns remain DL-435 `HEATMAP_FLY_WIDTHS`
`[10…50]` by 5. QQQ / IWM heatmap `[10…50]` is unchanged this packet and is
a named deferred defect (XS-ETF), not a non-regression Keep.

**Why.** WIDTH-1 (DL-699) overlayed XSP/SPY Create onto 1–7. Heatmap was
explicitly left on DL-435. Every 10…50 column on XSP sits in the 95.8–100%
bid-null region of the 2026-09-04 probe.

**Does not.** Mutate `HEATMAP_FLY_WIDTHS`. Change SPX-class heatmap.
Change `fetch_step_floor`. Edit `AnalyzerPositionsList.tsx`. Spec version bump
(changelog row only, OD-XS5). MiniTwo.
```

## Out of scope

Writing OD as Accept before Coach stamps (stamp is `XS0-W0.md` this PR). Product code. Filing the DL-435 reverse in this PR.

## XS0-9 done

GO + reassignment DL shape ready. PR 3 reverse text drafted, not filed.
