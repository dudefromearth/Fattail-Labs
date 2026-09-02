# LIM0-5 — Charlie feasibility

**Project:** Options Lab Heatmap LIM  
**Agent:** Charlie  
**Seed:** `seeds/LIM0-5-charlie-feasibility.md`  
**Feeds:** LIM0-G · JR1  
**Spec:** [`Specs/FatTail Labs — Heatmap LIM Template — Specification v0.4.2.md`](../../Specs/FatTail%20Labs%20%E2%80%94%20Heatmap%20LIM%20Template%20%E2%80%94%20Specification%20v0.4.2.md) §3 · §8 · LIM21 · E8 · E13 · Appendix A  
**Plan:** [`docs/Options-Lab-Heatmap-LIM-Full-Agent-Bench-Plan-v1.1.md`](../../docs/Options-Lab-Heatmap-LIM-Full-Agent-Bench-Plan-v1.1.md) §6  
**GO token:** [`agents/go/OLLIM-W0.md`](../go/OLLIM-W0.md) — **not stamped by this note**

**Out of scope (honored):** implementation; rewrite of `gex.ts` math; panel code; GO stamp.

**Verdict:** Feasible on the as-built Heatmap. `buildGexProfile(ctx, "gex_net")` is sufficient input. File split matches plan §6.1. No `yUnclamped`. Trail is `(xUnclamped, y)` with three immediate resets. Quadrant is a **new** panel branch; frozen `gex` and `DEFAULT_HEATMAP_TEMPLATE_ID = "sym-fly"` stay. **C2 can be scoped** — parse on first LIM activation; do not throw at heatmap module load. AT-LIM17 is not softened.

---

## 1. `buildGexProfile(ctx, "gex_net")` is sufficient

As-built (`web/lib/options-lab/templates/gex.ts`):

```ts
export function buildGexProfile(ctx: ChainContext, mode: ValueModeId): GexProfilePoint[]
```

`GexProfilePoint` is `{ strike, label, isSpot, value, valid, call, put }`.  
Mode `"gex_net"` sets `value = gexNet(ctx, k)` (`pricing.ts`, `Γ·OI·S²`, both sides required) and `valid = value != null`. `call` / `put` are always filled from `gexSide`.

Spec LIM2 wants `StrikeNet[] = { strike, call, put, net }`. Map at the LIM call site:

| Spec field | From `GexProfilePoint` on `"gex_net"` |
|------------|----------------------------------------|
| `strike` | `p.strike` |
| `call` | `p.call` |
| `put` | `p.put` |
| `net` | `p.value` (null when either side missing) |

Plus `ctx.spot` (LIM2). Wings window is already the OPF-held `ctx.contracts` map the bus bound. No second GEX store. No rewrite of `gex_v1`. Plan §6.2 step 1–8 can consume this array as-is.

Do **not** dump LIM math into `gex.ts`. Glow / COG / interval ticks are LIM4, a hook on the companion profile, not a formula change.

**Small seam (not a blocker):** `ChainContext` has `symbol`, `spot`, `wings`, `contracts`, `asOf`, `contentHash` — **not** `expiration`. Expiration is panel state (`HeatmapChainPanel` `expiration`). Do not widen `ChainContext` (every template would feel it). `computeLim` takes `ctx` plus a LIM-only extra (expiration) stamped onto `LimResult.expiration`. `ctx.asOf` is the generation clock, **not** OI settlement (JR3); `oiAsOf` stays `null` / named hole until a real OI date exists. Ladder rows today expose `open_interest`, not an as-of date.

---

## 2. File split (plan §6.1)

| Path | Action | When |
|------|--------|------|
| `web/lib/options-lab/templates/limConfig.ts` | **New** — parse Appendix A; throw if missing/invalid; `W_*` sum to 1.0; floors 0/100 | LIM1 |
| `web/lib/options-lab/templates/lim.ts` | **New** — `computeLim(ctx, …) → LimResult` (**no `yUnclamped`**); optional thin `limTemplate` descriptor (stubs, like `gex` / `ladder`) | LIM1 · registry object LIM3 |
| `web/lib/options-lab/templates/lim.test.ts` | AT-LIM1–13, 16–20, 17b, 26, 28 | LIM1 |
| `web/lib/options-lab/templates/limTrail.ts` | **New** — interval push of `(xUnclamped, y)`; window; `clear()` | LIM2 |
| `web/lib/options-lab/templates/limTrail.test.ts` | AT-LIM13–15 · AT-LIM25 | LIM2 |
| `web/lib/options-lab/templates/types.ts` | `TemplateLayout` += `"quadrant"`; `ValueModeId` += `"lim"` **only** | LIM1/LIM3 |
| `web/lib/options-lab/templates/registry.ts` | **One** entry `id: "lim"`. **Do not** change `DEFAULT_HEATMAP_TEMPLATE_ID` | LIM3 |
| `web/components/options-lab/HeatmapLimQuadrant.tsx` | **New** — plane, crosshairs, dot, ring, chip, trail, chrome | LIM3 |
| `web/components/options-lab/HeatmapChainPanel.tsx` | `layout === "quadrant"` **new** branch; matrix / profile / table untouched | LIM3 |
| `web/lib/options-lab/templates/gex.ts` | Glow hook + optional annotations **default off** | LIM4 — not this packet |

`lim.ts` is the pure module. One compute call site. Registry entry uses stub `computeCell` (`valid: false`); the quadrant does not use the grid (plan §6.2).

---

## 3. No `yUnclamped` · trail uses `(xUnclamped, y)` · three resets

**E8 / LIM38 / L13.** Spec §8 `LimResult` has `x`, `y`, `xUnclamped` — **no** `yUnclamped`. Y is a convex combination of `[0, 100]` terms (weights sum 1.0, AT-LIM17b). Bound is **AT-LIM26**, not a runtime clamp. Trail and transition (LIM33): X = `xUnclamped`, Y = `y`.

**LIM21 · E13 · L15 · AT-LIM25.** Buffer clears **immediately**, no fade, on all three:

| Trigger | As-built hook in `HeatmapChainPanel` | LIM2 use |
|---------|--------------------------------------|----------|
| **Session open** | `bus.sessionOpen` false→true already seamed for the fly pipeline (`prevSessionOpenRef`) | same edge → `trail.clear()` |
| **Expiration change** | panel `expiration` | `useEffect` on `expiration` → `clear()` |
| **Symbol change** | `useOptionsLab().symbol` | `useEffect` on `symbol` → `clear()` |

Ghosts may plot past the plane edge (AT-LIM13). No distance threshold, no smoothing.

---

## 4. `NEXT_PUBLIC_` seam (JR1)

`HeatmapChainPanel` is `"use client"`. Next inlines **only** `process.env.NEXT_PUBLIC_*` (and `NODE_ENV`) into the browser bundle. Bare `process.env.LABS_LIM_*` is `undefined` in the client — every key would look missing.

**Bundler requires a prefix.** Record it as a DL seam, not a second constant set.

| Layer | Name | Law |
|-------|------|-----|
| Logical environment key | `LABS_LIM_CENTRE_SCALE_PTS` (etc.) | Spec **Appendix A** — the only key list. AT-LIM28: grep `LIM_CONF_` = 0 |
| In-code constant | `LIM_CENTRE_SCALE_PTS` | Appendix A column 2 |
| Bundler spelling | `NEXT_PUBLIC_` **concatenated onto** the Appendix A key, e.g. `NEXT_PUBLIC_LABS_LIM_CENTRE_SCALE_PTS` | Implementation seam. Not a rename. Not `LIM_CONF_*` |

`limConfig` reads the prefixed process key; **throws and chrome name the Appendix A key** (`LABS_LIM_*`). Mike LIM0-6: do not dump `process.env`. Map values are JSON. No `server/config.py`.

Do **not** maintain a parallel list in `next.config.ts` `env { }` — that is a second key set and will drift from Appendix A.

These tunables are not secrets (Mike). Prefix is visibility of non-secrets, not a new secret class.

---

## 5. Panel branch · frozen GEX · default template

As-built `TemplateLayout = "table" | "matrix" | "profile"`. Body in `HeatmapChainPanel.tsx` is:

1. `tpl.layout === "profile" && gexProfile` → frozen GEX (`data-testid="heatmap-gex-profile"`)  
2. Width Fit ranking (template id, not layout)  
3. `tpl.layout === "matrix" && displayMatrix` → fly / width-fit grid  
4. **else** → ladder `table`

`gexProfile` memo is already gated: `tpl.layout !== "profile" || tpl.id !== "gex"` → `null`. A `"quadrant"` layout never enters it.

**LIM3:** insert `tpl.layout === "quadrant"` **before** the table fallback. Do not edit the profile or matrix predicates. Do not change the frozen GEX strings or `buildGexProfile(chainCtx, valueMode)` call. Companion GEX for LIM28 is a **separate** `buildGexProfile(ctx, "gex_net")` inside the LIM branch (same generation, JR2) — not a reuse of the frozen-profile memo.

**Default template — do not change:**

- `registry.ts`: `DEFAULT_HEATMAP_TEMPLATE_ID = "sym-fly"`
- `symbolProfile.ts`: `heatmap_default_template: "sym-fly"`
- Panel `useState(DEFAULT_HEATMAP_TEMPLATE_ID)`

Registry adds **one** entry `id: "lim"`. `ValueModeId` gains **exactly** `"lim"` (E14 / AT-LIM27). No `session-volume`.

Header subtitle today: matrix vs `"Vertical profile"` vs `null`. Quadrant subtitle is LIM3 chrome (Echo / Tango), not a LIM0 change.

---

## 6. C2 — fail-loud blast radius (**required finding**)

### 6.1 The defect if JR1 is read as “throw at import”

`HeatmapChainPanel` statically imports `registry` (and `gex`) at module load. `registry.ts` statically imports every template module (`symFly`, `widthFitTemplate`, `bwFly`, `vertical`, `gex`).

If `limConfig.ts` throws at **module evaluation**, and either:

- `registry.ts` imports `lim.ts` which imports `limConfig.ts`, or  
- the panel statically imports `HeatmapLimQuadrant` which imports `limConfig.ts`,

then **one missing `LABS_LIM_*` key unmounts the entire Heatmap** — frozen GEX, Width Fit, Advanced Fly, verticals, ladder. That is Invariant 2 (fail-loud) implemented so that it **violates Invariant 16** (frozen `gex` / AF / Width Fit byte-identical and still render). It is also a DL-539 hit on existing work.

JR1 as written: *“Parsed at module load; … throws.”* That reading is the blast.

Spec §9 / AT-LIM17 “aborts boot” means **LIM does not silently run with a default**. It does not mean Next process boot or `HeatmapChainPanel` evaluation is the unit of boot. Mike LIM0-6 §7 states the same. **Do not soften AT-LIM17** (still throws, still names the key, still no default, still no fallback scale).

### 6.2 Can this be scoped? **Yes.**

Required pattern (no code; LIM1 / LIM3 implement this):

1. **`limConfig.ts` does not throw at import evaluation.** Export `loadLimConfig()` (name is implementer-local). Parse + validate Appendix A **inside that function**, cache the result, throw on missing/invalid/`W_* ≠ 1.0` with the **Appendix A key named**. No silent default, no catch inside the parser, no scale fallback.

2. **`computeLim` is the first activation.** First call (template id `lim` / layout `quadrant`) calls `loadLimConfig()`. `lim.ts` may import `limConfig.ts` only if that import is side-effect-free at eval.

3. **Registry stays eager and cheap.** The `lim` `HeatmapTemplate` object is metadata + stubs (`computeCell` invalid, like `ladder` / `gex`). It must **not** call `loadLimConfig()` at module load. Switcher can list LIM while keys are absent.

4. **Panel catch at the template boundary only.** When `tpl.layout === "quadrant"`, the branch `try`s `loadLimConfig` / `computeLim` / quadrant mount. `catch` renders **LIM unavailable**, copy includes the **missing/invalid Appendix A key**. Other layouts never enter the `try`. Do not swallow. Do not substitute a default blend. Do not log `process.env`.

5. **Optional belt (LIM3):** `import()` `HeatmapLimQuadrant` from the quadrant branch so the LIM chunk is not in the main heatmap graph. Not required if (1)–(4) hold. Required if Coach keeps a literal “throw at module load” inside `limConfig.ts` — then that module may live **only** in the dynamically imported chunk, never in `registry.ts`’s static graph.

**Unscoped anti-pattern (do not ship):** top-level throw in `limConfig.ts` **and** static import of that module from `registry.ts` or from `HeatmapChainPanel`. If Coach insisted on that pair, C2 would **fail** and it would be an **OLLIM-W0 finding**, not a softened AT-LIM17. Charlie does not need that finding: the lazy-parse (or dynamic-chunk) pattern scopes it.

### 6.3 W0 disposal (not a code change)

| Item | Charlie rec |
|------|-------------|
| JR1 “parsed at module load” | **Amend** to: parse on **first LIM activation**; throw there; panel catches at template boundary. Logical keys stay Appendix A. |
| AT-LIM17 / AT-LIM17b | **Unchanged.** Missing or invalid key, or `W_*` not summing to 1.0, **throws**. No default. Isolation: other templates still render (LIM0-7 / LIM5-0). |
| Spec §9 “aborts boot” | Boot unit = **LIM activation**, not Next / heatmap module load. |

---

## 7. Feasibility summary

| Seed item | Result |
|-----------|--------|
| `buildGexProfile(ctx, "gex_net")` sufficient | **Yes.** Map `net ← value`. Do not rewrite `gex.ts`. |
| File split | **Yes.** Paths in §2. |
| No `yUnclamped` | **Yes.** Trail `(xUnclamped, y)`. |
| Three trail resets | **Yes.** Session open (existing `sessionOpen` edge) + expiration + symbol. |
| `NEXT_PUBLIC_` | **Required** for client inlining. Prefix is a DL seam. Logical names = Appendix A. Never `LIM_CONF_*`. |
| New `layout === "quadrant"` branch | **Yes.** Frozen GEX path untouched. Default remains `sym-fly`. |
| C2 scoped | **Yes.** Lazy `loadLimConfig()` on first LIM activation; panel catch names the key; other templates unaffected. AT-LIM17 not softened. |

No implementation. No GO stamp.
