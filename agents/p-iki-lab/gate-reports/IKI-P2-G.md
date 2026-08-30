# IKI-P2-G — IKI host mount (evidence)

**Date:** 2026-08-21  
**Token:** [`agents/go/IKI-P2.md`](../../go/IKI-P2.md) · **DL-538**  
**Delta verdict:** **PASS**

Mount: `/app/iki/runner` → `HeatmapRenderHost` (TR-P3, unchanged). Render sink only. Member session.

## Tests

```
npx --yes tsx lib/runner/__tests__/iki-p2-host.test.ts  → ok  IKI-P2 mounts HeatmapRenderHost
npx --yes tsx lib/runner/__tests__/p3.test.ts           → TR-P3 6 passed
```

## Cross-host hash pairs (Options Lab flag 1 vs `/app/iki/runner`)

Live capture `npx tsx lib/runner/__tests__/cross-host-hash.ts` against flag-1 Next + API `:4000` (dev-login). Both hosts wait until `data-symbol` matches the requested name, then pair on the same bus `content_hash` the shell ran. `HeatmapChainPanel` not mounted.

| Symbol | paired `content_hash` | OL tiles | IKI tiles | panel | same hash |
|--------|------------------------|----------|-----------|-------|-----------|
| SPX | `46066570e281f8ee` | 423 | 423 | 0 | yes |
| TSLA | `fd9406507c92831d` | 342 | 342 | 0 | yes |
| SPY | `8ccf6455af02aef7` | 279 | 279 | 0 | yes |

Pipeline `tilesHash` = through-`run()` on the HTTP snapshot for that symbol (not fixture). TSLA HTTP snapshot (`fb743087c38a3176`) is one live generation behind the paired WS/host hash; OL and IKI still share `fd9406507c92831d`.

Source: [`evidence/cross-host-hash-pairs.json`](../evidence/cross-host-hash-pairs.json). Screenshot: [`evidence/iki-p2-runner.png`](../evidence/iki-p2-runner.png).

## Live (member session)

| Check | Result |
|-------|--------|
| `iki-runner-host` | 1 |
| `runner-shell-host` | 1 |
| `options-lab-heatmap-panel` | **0** |
| Suite nav | Wiki · IKI Factory · Runner (`/app/iki/runner`) |
| Catalog card for Runner | **none** (OD-nav; IKI Lab card stays `/app/wiki`) |

TR8 across hosts: same `HeatmapRenderHost` / `run()`.

## IKI-P1

**Withdrawn (DL-540).** IKI Lab has zero auth responsibility. Shared `/app/*` guard only.

---

## Delta record

**Re-checked:** iki-p2-host import · p3 6 passed · cross-host-hash-pairs.json SPX/TSLA/SPY same `content_hash` + matching tile counts · panel 0 both hosts · no `iki_public` implementation.

**Recorded:** **PASS**  
**Does not:** MiniTwo; commit (Coach did not ask).
