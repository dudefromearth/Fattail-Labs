# Term Mass — characterization list (GC5-G)

Canonical ATs: Spec §12 · plan §9. Kilo owns evidence on disk.

| Id | Assert |
|----|--------|
| **AT-GC1** | One expiration in the pack → one column. Cells = `gexNet` at that expiry. Matches frozen `gex` profile **per strike** (same formula, different chrome). |
| **AT-GC2** | Two expirations → two columns. NET = column sum of valid cells. Profile bar at K = sum of valid cells at K. |
| **AT-GC3** | Spot row `isSpot` on nearest listed strike. Gutter on grid and profile. |
| **AT-GC4** | Peak = max \|profile\|. Gold on that strike. Sticky-scale update does not flip sign colors. |
| **AT-GC5** | Missing contract → `valid: false`, blank cell, not a zero that paints cyan/magenta. |
| **AT-GC6** | After GO / flag: switcher includes **Term Mass**. Frozen `gex` and `lim` still render as before (byte check on **their** compute). |
| **AT-GC7** | No string `ITMatrix` / `itmatrix` in member chrome, ids, or help. |
| **AT-GC8** | Empty pack / pack not available → empty grid + named empty state, not a repeated single-expiry fake calendar. |
| **AT-GC9** | Relabeling one book as N expirations is refused. |
| **AT-GC10** | `gex_net` with only one side present → invalid (AT-HM13). |
| **AT-GC11** | Color hysteresis: max \|value\| within 25% across generations → no re-normalize. |
| **AT-GC12** | Template / value-mode switch → zero extra Massive. |
| **AT-GC13** | Compact display: actual zero → `$0` (or `$0K`); invalid → blank. |
| **AT-GC14** | Registry append does not reorder frozen `gex` / `lim` / `sym-fly` / `width-fit`. Frozen `gex` SHA1 / byte check unchanged. |
