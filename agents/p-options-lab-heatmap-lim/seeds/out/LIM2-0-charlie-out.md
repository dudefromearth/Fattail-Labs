# LIM2-0 — Trail buffer (out)

**Agent:** Charlie  
**Law:** Spec v0.4.3 LIM19–22 · LIM33 · E13 · seed G1/G2  
**Date:** 2026-09-02

## Files

| Path | Touch |
|------|--------|
| `web/lib/options-lab/templates/limTrail.ts` | **New** |
| `web/lib/options-lab/templates/limTrail.test.ts` | **New** |
| `seeds/LIM2-0-charlie-trail.md` | G1/G2 settled |

**Out of scope (honored):** renderer · registry · panel · `gex.ts` · chrome · LIM3.

## Gaps

**G1.** `tradingDateFromAsOf` = leading `YYYY-MM-DD` of `asOf` as written. No calendar, no TZ key. Ladder `as_of` is UTC ISO — prefix is stable. **No token finding.**

**G2.** `createLimTrail({ now })`. Tests drive a mutable `t`. Zero `setTimeout` / sleeps.

## Behaviour

- Emit at most once per `observe`, when `now − lastEmit ≥ interval`. Not on distance.
- Buffer `(xUnclamped, y)`. Uniform `size`. Opacity `1 − age/window`.
- Reset frame (symbol / expiration / asOf-date) returns `[]` and arms the new interval. No emit on that frame.
- `computeLimTransition({ show: false })` → `null`.

## Evidence

```
cd web && npx --yes tsx lib/options-lab/templates/limTrail.test.ts
limTrail.test.ts ok
```
