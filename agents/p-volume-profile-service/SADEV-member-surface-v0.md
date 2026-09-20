# SADEV member-surface v0 — artifact for MiniTwo deploy chain

**Tag:** `sa-dev-member-surface-v0` · **AZ-VP-9-A2** (`Specs/AZ-VP-9-A2.md` sha1 `b3fb5070…`) — histogram primary; SA overlay default off.  
**Machine:** StudioTwo demo first. INFRA MiniTwo only when Coach names production.  
**Gate:** **admin-flag only**. SA-L9 member ship-gate **untouched**. Members still get residual OHLC bins at the same route.

| | |
|--|--|
| Route | `/app/options-lab/volume-profile` (AZ-VP-9-A1 home) |
| Demo | **http://studiotwo:3000/app/options-lab/volume-profile** (administrator session) |
| Dev canvas | **http://studiotwo:3000/admin/sa-dev** |
| Law | SA spec v0.4 §8 · §7 viewport stub · SA-L10 · SA-L11 · AZ-VP-9-A1 |
| Nav name | **Volume Profile** · **PENDING-NAME** (Coach word outstanding) |
| Viewport | `STUBBED-AWAITING-SA-Q2` — widest detected span + margin; never a fake grouping |

Chrome law (Coach 2026-09-18): the chart owns the viewport; one utility bar (~56 px); SA-L11 compresses, never hides.

**Pixel budget (900 px desktop viewport, measured from layout):**

| Surface | Before (stacked) | After |
|---------|------------------|-------|
| `/admin/sa-dev` chrome above chart | ~356 px title+doctrine+buttons+caption (+280 px sidebar) | **56 px** utility bar (`h-14`) |
| Chart height | 560 px fixed SVG (~62% of viewport) | `100dvh − 7rem − 56px` ≈ **732 px (~81%)** |
| Member `/app/options-lab/volume-profile` (admin) | suite title+blurb+symbol card ~200 px + bins chart | workspace nav ~48 px + **56 px** bar; chart ≈ **796 px (~88%)** |

Chart ≥ 85% on the member workspace. Admin shell header/footer still take ~12% of `/admin/sa-dev`; iterate on Coach's eye.

