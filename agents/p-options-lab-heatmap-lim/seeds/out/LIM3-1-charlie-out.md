# LIM3-1 — Registry + panel (out)

**Agent:** Charlie  
**Date:** 2026-09-02

- `types.ts`: `ValueModeId` += `"lim"`; `TemplateLayout` += `"quadrant"`.
- `registry.ts`: one entry `limTemplate` (`GEX lean (window)`). No `session-volume`. Default remains `sym-fly`.
- `HeatmapChainPanel.tsx`: `layout === "quadrant"` branch before the table fallback. Profile and matrix predicates unchanged. C2: `LimConfigError` → named unavailable. Trail hooked from LIM2. Zero new fetch.
