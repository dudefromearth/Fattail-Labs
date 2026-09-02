# LIM2-G — Trail

**Gate:** LIM2-G  
**Delta** ternary  
**Date:** 2026-09-02  
**Plan:** `docs/Options-Lab-Heatmap-LIM-Full-Agent-Bench-Plan-v1.2.md` v1.2  
**Spec:** LIM v0.4.3 **BUILD AUTHORITY** sha1 `01f638f590492520236b3607edde487b949d6016`  
**Token:** `agents/go/OLLIM-W0.md` — **GO** (DL-651 · DL-652)

## Verdict

**PASS**

`limTrail.ts` emits `(xUnclamped, y)` on a fixed interval against an injected `now()`. Session reset is the asOf `YYYY-MM-DD` prefix (G1). AT-LIM25 is three separate first-frame empties. No renderer, registry, panel, or `gex.ts`. LIM3 not started.

---

## Command evidence

```
cd /Users/ernie/Fattail-Labs/web
npx --yes tsx lib/options-lab/templates/limTrail.test.ts
limTrail.test.ts ok

npx --yes tsx lib/options-lab/templates/lim.test.ts
lim.test.ts ok
```

`rg yUnclamped web/lib/options-lab/templates/limTrail.ts` → zero hits.  
`rg 'Date.parse|America/New_York|setTimeout|setInterval' web/lib/options-lab/templates/limTrail.ts` → zero hits.

---

## Files

| Path | Bytes |
|------|------:|
| `web/lib/options-lab/templates/limTrail.ts` | 4720 |
| `web/lib/options-lab/templates/limTrail.test.ts` | 9287 |
| `seeds/LIM2-0-charlie-trail.md` | 2430 |
| `seeds/out/LIM2-0-charlie-out.md` | 1169 |
| `seeds/out/LIM2-1-kilo-out.md` | 771 |

## Gaps

| Id | Settlement |
|----|------------|
| **G1** | Leading `YYYY-MM-DD` of `ctx.asOf` as written. No TZ key. **No token finding** — ladder ISO yields a stable prefix. |
| **G2** | `now()` supplier. Tests mutate `t`. |

## AT share this gate

Green: **AT-LIM13, 14, 15, 25** (25 = expiration · symbol · session, separately).

## Does not

LIM3 · UI · registry · panel · `gex.ts` · chrome · MiniTwo.
