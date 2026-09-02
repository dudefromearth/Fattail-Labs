# Options Lab Heatmap — LIM Full Agent Bench Plan v1.0

**Date:** 2026-09-02  
**Plan revision:** **v1.0**  
**Canonical filename:** `docs/Options-Lab-Heatmap-LIM-Full-Agent-Bench-Plan-v1.0.md`  
**Owner (orchestration):** Juliet  
**Authority:** Coach (GO / ship)  
**W0 artifact:** [`agents/go/OLLIM-W0.md`](../agents/go/OLLIM-W0.md) — Delta reads **this file**, not chat (**DL-328**).  
**Board:** [`agents/p-options-lab-heatmap-lim/`](../agents/p-options-lab-heatmap-lim/)  
**Governance:** [`agents/bench/doctrine.md`](../agents/bench/doctrine.md) · [`AGENTS.md`](../AGENTS.md)

**Primary law:**

| Doc | Path | Status |
|-----|------|--------|
| **Heatmap LIM Template Spec v0.4.1** | [`Specs/FatTail Labs — Heatmap LIM Template — Specification v0.4.1.md`](../Specs/FatTail%20Labs%20%E2%80%94%20Heatmap%20LIM%20Template%20%E2%80%94%20Specification%20v0.4.1.md) | **DRAFT for build planning.** Errata E1–E7. Geometry unchanged from v0.4. Not BUILD AUTHORITY until **LIM0-0**. Whole-file sha1 at plan land: `e5aa6fdc7305add72e02dc57b62f87665d348820` |
| Heatmap Templates Spec **v0.2.1** | [`Specs/FatTail-Labs-Options-Lab-Heatmap-Templates-Spec-v0_2.md`](../Specs/FatTail-Labs-Options-Lab-Heatmap-Templates-Spec-v0_2.md) | HM1–HM20 apply. Live generation path. |
| Heatmap Templates Spec **v0.3** | [`Specs/FatTail-Labs-Options-Lab-Heatmap-Templates-Spec-v0_3.md`](../Specs/FatTail-Labs-Options-Lab-Heatmap-Templates-Spec-v0_3.md) | **DRAFT amendment** for SVP auxiliary plane. sha1 `31e985b6ab7b5fb41016fd0c3380fac114bde352`. LIM adds `layout: "quadrant"` + `ValueModeId: "lim"` — **one merged parent bump (OD-LIM6)**, not a second parallel edit. |
| Arch **29** | [`Architecture/29-options-lab-heatmap-templates.md`](../Architecture/29-options-lab-heatmap-templates.md) | As-built heatmap. Update at LIM6. |
| OPF Truth · **DL-309** | [`Specs/FatTail-Labs-Options-Lab-OPF-Truth-and-Elegant-Failure-Doctrine-v1.1.md`](../Specs/FatTail-Labs-Options-Lab-OPF-Truth-and-Elegant-Failure-Doctrine-v1.1.md) | Dual-side chain the OPF holds. |
| Human Interface Spec v1.0 | [`Specs/FatTail-Labs-Human-Interface-Spec-v1.0.md`](../Specs/FatTail-Labs-Human-Interface-Spec-v1.0.md) | HIG · ≥44 pt |
| Strike Turnover v1.0 | [`Specs/FatTail Labs — Strike Turnover (Dealer Gravity, redesigned) — Specification v1.0.md`](../Specs/FatTail%20Labs%20%E2%80%94%20Strike%20Turnover%20(Dealer%20Gravity,%20redesigned)%20%E2%80%94%20Specification%20v1.0.md) | **Sibling. Independent. Never fused.** |
| IKI GEX vocab (reference) | [`docs/IKI Labs — GEX Vendor Vocabulary and Positioning v0.1.md`](./IKI%20Labs%20%E2%80%94%20GEX%20Vendor%20Vocabulary%20and%20Positioning%20v0.1.md) | Positioning input. No law. LIM does not ship vendor product names. |
| Parent heatmap boards | [`docs/Options-Lab-Heatmap-Templates-Full-Agent-Bench-Plan-v1.0.md`](./Options-Lab-Heatmap-Templates-Full-Agent-Bench-Plan-v1.0.md) · Advanced Fly v1.1 · Width Fit v1.1 | **Closed.** Do not reopen. |

**Spec status:** v0.4.1 **DRAFT**. **LIM0-0 GO** is the stamp. Do not fire LIM1 until `OLLIM-W0.md` is GO.

Specialists execute **only** via seeds. Coordination only through **Coach** or **Juliet**.  
Delta gates: **PASS / FAIL / BLOCKED** with evidence — **never waived**.  
**Coach may overrule** a specialist finding via **DL entry with reasoning** — that is **not** a gate waive.

---

## 0. Product decisions (this program)

**L1–L12 PROVISIONAL until LIM0-0.** Spec §15 ODs and Juliet recs are disposed on the GO token.

| ID | Decision | Source | State |
|----|----------|--------|--------|
| **L1** | New Heatmap template `id: "lim"`, `layout: "quadrant"`. **Not** a value mode on `gex`. Frozen `gex` template stays. | Spec §3 · §13 | PROVISIONAL |
| **L2** | X = lean only (`leanRaw` then clamp). Y = `nearSpotMix` blend. Publish `netRatio`, `concF`, `magF` first-class (LIM10). | LIM7–11 · E1 · E4 | PROVISIONAL |
| **L3** | Crossings are **intervals** `{lo, hi, …}`. No `(lo+hi)/2` in any field or chrome (D16 · AT-LIM20). | LIM12–15 | PROVISIONAL |
| **L4** | `crossingProximity` is a **distance channel**. It never moves the dot. It is a ring + numeric chip, **never opacity** (E2 · E3). | LIM16–18 · LIM24 | PROVISIONAL |
| **L5** | Colour is identity: one blue + edge glow. Not valence. Not red/green. | LIM25 · D13 | PROVISIONAL |
| **L6** | Empty / never-hydrated / `Σ|net|==0` → **centre** `x=0, y=50`, full opacity. | LIM7–8 · LIM26 | PROVISIONAL |
| **L7** | Config fail-loud. Missing key aborts. Symbol absent from `LIM_CENTRE_SCALE_PTS` → `valid: false`. **No fallback scale.** | LIM34 · §9 · AT-LIM17/19 | PROVISIONAL |
| **L8** | LIM reads **no volume**. Inputs are `gamma`, `open_interest`, `spot` via existing `gex_v1`. No MSC import. No server module. | LIM6 · §2 · §13 | PROVISIONAL |
| **L9** | Window read. Chrome says so. Never labelled chain GEX (GP7 · LIM5 · LIM27). | LIM5 · LIM27 | PROVISIONAL |
| **L10** | Forbidden member-facing strings (AT-LIM23): *wall, magnet, pin, gravity, intent, hostile, support, resistance, friction, muddy, slippery*. Picker label carries neither *intent* nor *friction* (LIM35). Quadrant ships **no cell names** (LIM36). | E4 · E7 · LIM35–36 | PROVISIONAL |
| **L11** | Parent Heatmap Templates amendment is **one merged draft** (SVP auxiliary plane already in v0.3 **plus** `quadrant` + `lim`). One PR. Two packets editing the parent in parallel is how invariants fork. | Spec §14 · §15.6 | PROVISIONAL |
| **L12** | Strike Turnover is a sibling. Never fused, never blended, never a composite score. | Spec §0 · TN15 | PROVISIONAL |

P-SV10–17 does **not** touch this board. LIM reads no volume.

**This plan does not re-open:** Market Bus Redis · dual-side HM15–20 · Advanced Fly Wave‑1 · Width Fit · Analyzer · Surface T Ortho · Time Machine · IKI Factory · SVP artifact writer · Strike Turnover implementation.

---

## 1. Mission

```text
OPF-held dual-side generation (existing)
  → buildGexProfile(ctx, "gex_net")     // existing gex_v1 Γ·OI·S²
  → lim.ts  (lean, nearSpotMix, factors, crossings, proximity)
  → limTrail.ts (fixed-interval ghosts on unclamped x,y)
  → quadrant renderer
       + ring/chip for crossingProximity
       + chrome (expiration, wings, crossingCount, four standing lines)
       + companion GEX profile whose spot line takes the dot's colour and glow
  → Heatmap switcher entry  id=lim  label=Echo (placeholder until then)
```

| Pillar | Spec | Ship meaning |
|--------|------|----------------|
| Question | §1 · LIM1 | Where is this expiration's GEX mass relative to spot, and what is the near-spot mix. Forecasts nothing. |
| Input | LIM2–6 | `StrikeNet[]` from existing GEX. One expiration. Wings window. No volume. |
| X | LIM7 · E1 | Lean from centre of \|net\|. `xUnclamped = leanRaw`. |
| Y | LIM8–11 · E4 | `nearSpotMix` blend; factors published. Book terms, not tape terms. |
| Crossings | LIM12–18 | Intervals + steepness. Proximity is a shelf-life channel. |
| Trail | LIM19–21 · LIM33 | Fixed interval, opacity by age, unclamped, may leave the plane. |
| Render | LIM23–27 · LIM36 | Crosshairs 0/50. Full-opacity blue dot. Ring + chip. Four chrome lines. No cell names. |
| GEX link | LIM28–32 | Spot line glows with the dot. Annotations default off. Compact density budget. |
| Config | §9 | Every key present or boot aborts. Per-symbol scale. |
| Honesty | §12 | Dealer sign assumed. Mix unmeasured vs tape. Window. OI T+1. |

**First smoke after LIM1 + LIM3:**

1. Heatmap switcher includes **LIM** (placeholder label). Frozen GEX template still there.  
2. Mass above spot → x > 0; mass below → x < 0; symmetric → x ≈ 0 regardless of gamma sign.  
3. All-positive near spot → y > 50; all-negative → y < 50; mass-above **and** negative-near-spot → x > 0 **and** y < 50.  
4. Empty book sits **centre**, full opacity — not bottom-centre.  
5. Spot inside a crossing: `crossingProximity = 0`; **x and y unchanged**; ring large; dot still full opacity.  
6. Chrome: expiration, wings, `crossingCount`, OI as-of **or a named hole**, same-day sentence, four standing lines. **No** single crossing price when count ≠ 1. **No** midpoint.  
7. Grep of UI strings: none of the AT-LIM23 words.  
8. Mode switch = **zero Massive**.

---

## 2. As-built honesty

### 2.1 Keep (do not rebuild)

| Area | Path |
|------|------|
| Dual-side bus · push/diff | Market Bus · `useOptionChainBus` |
| Template registry · types | `web/lib/options-lab/templates/{registry,types}.ts` |
| GEX math `gex_v1` | `pricing.ts` → `gexSide` / `gexNet` / `gexAbs` |
| GEX profile builder | `templates/gex.ts` → `buildGexProfile` · `gexTemplate` id `gex` |
| Heatmap panel · switcher | `HeatmapChainPanel.tsx` — today `layout` is `"table" \| "matrix" \| "profile"` |
| Frozen GEX chrome | `heatmap-gex-profile` vertical bars |
| Width Fit / Advanced Fly | Closed boards — byte-identical on fixture |

### 2.2 Build (this program)

| Gap | Spec | Phase |
|-----|------|--------|
| LIM0 GO · OD-LIM* · JR* · merged Templates draft · seeds · hash | §15 | **LIM0** |
| `limConfig.ts` fail-loud keys | §9 · AT-LIM17 | **LIM1** |
| `lim.ts` + `LimResult` | §5–6 · §8 | **LIM1** |
| `limTrail.ts` ring buffer | LIM19–22 · LIM33 | **LIM2** |
| `layout: "quadrant"` types + panel branch + renderer | §3 · §7.3 | **LIM3** |
| Registry entry | §3 | **LIM3** |
| Chrome, ring, chip, empty centre | LIM24–27 · LIM36 | **LIM3** |
| GEX spot-line glow · optional annotations | LIM28–32 | **LIM4** |
| AT-LIM1…23 | §10 | **LIM5** |
| DL · Arch 29 · parent amendment land · help · close | §14 · §16 | **LIM6** |

### 2.3 Explicit non-phases

| ID | Out |
|----|-----|
| **NX1** | Any MSC import / Liquidity-Intent Map port of `gamma × OI × 100` |
| **NX2** | Server module, endpoint, Redis, `server/config.py`, allowlist file |
| **NX3** | Volume of any kind · P-SV probes · Strike Turnover fusion |
| **NX4** | Second GEX store of truth · rewrite `gex_v1` |
| **NX5** | Replace or hide the frozen `gex` template |
| **NX6** | Crossing midpoint `(lo+hi)/2` as a published price |
| **NX7** | Move the dot with proximity, or fade it |
| **NX8** | Red/green valence palette |
| **NX9** | Quadrant cell names (*Pin / Air-Pocket / …*) in v1 |
| **NX10** | *Friction / muddy / slippery* on the axis until Coach/Hotel tape sitting (§15.3) |
| **NX11** | Transition ETA chrome (`LIM_SHOW_TRANSITION` stays false; compute may exist, UI does not) |
| **NX12** | Annotations on by default; compact + trail + ring + COG + ticks at once |
| **NX13** | Dock widgets · Analyzer · Surface · IKI Factory code |
| **NX14** | MiniTwo unless Coach asks a deploy |
| **NX15** | Silent scale fallback for a symbol missing from the map |
| **NX16** | Re-open Advanced Fly, Width Fit, SVP writer, Market Bus Redis |

---

## 3. Open decisions (OD-LIM*) — Coach Accept/Override at LIM0-0

Spec §15 (Coach disposes). **Not rulings until LIM0-0.**

| # | Question | Spec / Juliet recommendation |
|---|---------|------------------------------|
| **OD-LIM1** | Approve v0.4.1 into BUILD AUTHORITY | **Approve.** File already lives under `Specs/`. Stamp BUILD AUTHORITY on W0. Conditional on OD-LIM6 draft existing (India LIM0-1). |
| **OD-LIM2** | Display name | Placeholder **`GEX lean (window)`**. Echo owns the member label. *Liquidity-Intent* does not survive. Neither *intent* nor *friction* in the picker (LIM35). |
| **OD-LIM3** | Axis vocabulary | **Hold** *friction / muddy / slippery* off the axis. Payload field stays `nearSpotMix`. Tape sitting is a later program, not this DAG. |
| **OD-LIM4** | `LIM_CENTRE_SCALE_PTS` per symbol | Hotel proposes the map at LIM0-2. **Juliet default if silent:** `{"I:SPX": 50}` only. Every other symbol `valid: false` until listed. No silent 50. |
| **OD-LIM5** | LIM vs IKI GEX toolset | **Run beside.** Heatmap LIM is an Options Lab template. IKI GEX tools are a different door. Same `Γ·OI·S²` convention. LIM does not supersede IKI, does not rename IKI tools, and does not import IKI chrome. |
| **OD-LIM6** | Merged Heatmap Templates amendment | **India + Juliet draft in LIM0.** One document bump (v0.3 → v0.3.1 or v0.4): keep SVP HM21 auxiliary-plane clauses; add `TemplateLayout: "quadrant"`; catalog template `lim`. **Land the parent in LIM6 with this program**, even if SVP0 has not fired — `session-volume` stays catalogued, not implemented. |
| **OD-LIM7** | Quadrant cell names | **Not in v1** (LIM36). Echo · Hotel after §15.3, or never. |

Juliet recommendations (Coach disposes at the same stamp):

| Rec | Default if Coach silent at GO |
|-----|-------------------------------|
| **JR1** | Config lives in **`web/lib/options-lab/templates/limConfig.ts`**. Keys as Spec §9 (`LABS_LIM_*`). Parsed at module load; missing or invalid **throws** (AT-LIM17). Map values are JSON. **No** `server/config.py`. Next public-env prefix is Charlie's LIM0-5 note if the bundler requires `NEXT_PUBLIC_` — the **logical** names stay Spec §9; a prefix is an implementation seam, recorded in DL, not a second constant set. |
| **JR2** | LIM template **composes** the quadrant with a companion GEX profile of the **same** generation so LIM28 has a spot line to colour. It does not steal the frozen `gex` switcher entry. Compact density: LIM31. |
| **JR3** | `oiAsOf`: if the generation does not carry an OI settlement date, chrome **names the hole** (*OI as-of unknown — last night's open interest is not dated on this generation*). Never print `captured_at` / `asOf` as if it were OI settlement. |
| **JR4** | Trail interval / window / blend weights ship as Spec §9 starting points, labelled **not findings** (Spec §9 last sentence). Breaking change law §16. |
| **JR5** | Transition: compute behind `LIM_SHOW_TRANSITION=false`. **No member control** in v1. |
| **JR6** | Help + member guide at LIM6 (Width Fit precedent). Tango owns copy. |
| **JR7** | Spec filename stays as landed until India says otherwise. Hash is whole-file, in DL, not in the Spec. |
| **JR8** | **IKI-only vs this board.** `AGENTS.md` currently names IKI Lab as the only active program (DL-539). This plan **lands** now. **LIM1 does not fire** until `OLLIM-W0.md` is GO **and** that stamp either (a) reassigns the active program to LIM or (b) records **three successive Coach OKs** to touch heatmap files while IKI remains active. Spec §2's "DL-539 does not gate this" is Coach's intent for *scope* (no extra OKs to *edit listed files once GO*); it is not a silent bypass of the IKI-only line. Juliet will not start LIM1 on chat. |

---

## 4. Roster & seating

| Callsign | Role |
|----------|------|
| **Coach** | LIM0-0 GO · OD-LIM* · JR* · ship/no-ship · axis vocab |
| **Juliet** | Board · seeds · DAG · OD-LIM5 · parent-amendment merge · IKI isolation |
| **India** | Spec integrity · HM1–20 · merged Templates draft · hash procedure · L* still provisional until stamp |
| **Hotel** | Lean / mix / crossings golden · scale map · GEX sign convention · no invented relationship to tape |
| **Charlie** | `lim.ts` · `limTrail.ts` · `limConfig.ts` · registry · quadrant panel branch · gex.ts glow hook |
| **Echo** | Quadrant geometry · ring/chip · colour identity · compact vs comfort · picker label · no cell names |
| **Tango** | Chrome four lines · AT-LIM23 scan list · placeholder vs final name · no forecast copy |
| **Kilo** | AT-LIM1…23 · empty-centre · unclamped trail · vocab grep · GEX/Width Fit byte-identical |
| **Delta** | Phase gates ternary |
| **Lima** | DL GO + sha1 · Arch 29 · AGENTS pointer · help |
| **Mike** | Client-only; no new trust boundary |
| **Foxtrot** | Deploy only if Coach asks (usually N/A) |

| Seat | Rule |
|------|------|
| **S1** | Juliet owns DAG · NX · IKI isolation |
| **S2** | India Spec / parent merge / provisional L* |
| **S3** | Charlie pure modules + panel |
| **S4** | Hotel math golden · scale map |
| **S5** | Echo HIG (identity colour, not valence) |
| **S6** | Tango observation-only · forbidden list |
| **S7** | Kilo AT-LIM* |
| **S8** | Delta all gates |
| **S9** | Lima DL + hash |
| **S10** | Seeds on disk before phase gate |

---

## 5. Sacred invariants (this program)

1. No MSC heatmap / LIM code.  
2. **OPF-held dual-side chain only** (DL-309).  
3. Pure template — no fetch in LIM compute (HM6). Inputs are `ctx` + config.  
4. Mode switch = **zero Massive**.  
5. GEX formula is **existing** `Γ·OI·S²`. Do not port `gamma × OI × 100`.  
6. One expiration. Wings window, declared.  
7. No volume.  
8. X is lean; Y is mix; they stay independent (AT-LIM6).  
9. Crossings are intervals. No fabricated strike.  
10. Proximity does not move or fade the dot.  
11. Empty is centre, not a fake confident pole.  
12. Colour is identity.  
13. Config fail-loud. No silent scale fallback.  
14. Chrome states dealer-sign assumption, window, OI T+1, unmeasured mix.  
15. AT-LIM23 vocabulary. No cell names in v1.  
16. Frozen `gex` / Advanced Fly / Width Fit byte-identical on fixture.  
17. Strike Turnover not fused.  
18. Delta ternary; Coach overrule needs DL.  
19. Docs parity at LIM6.  
20. L1–L12 lock at LIM0-0.  
21. LIM1 does not fire without `OLLIM-W0.md` GO (JR8).

---

## 6. Technical design (implementers)

### 6.1 Expected files

| Path | Action |
|------|--------|
| `web/lib/options-lab/templates/limConfig.ts` | **New** — parse Spec §9 keys; throw if missing/invalid |
| `web/lib/options-lab/templates/lim.ts` | **New** — `computeLim(ctx) → LimResult` |
| `web/lib/options-lab/templates/lim.test.ts` | AT-LIM1–13, 16–20, 23 (field names) |
| `web/lib/options-lab/templates/limTrail.ts` | **New** — interval emission, window, unclamped |
| `web/lib/options-lab/templates/limTrail.test.ts` | AT-LIM14–15 · AT-LIM13 trail past edge |
| `web/lib/options-lab/templates/lim.vocab.test.ts` | AT-LIM23 grep of copy sources |
| `web/lib/options-lab/templates/types.ts` | `TemplateLayout` += `"quadrant"`; `ValueModeId` += `"lim"` |
| `web/lib/options-lab/templates/registry.ts` | One entry |
| `web/lib/options-lab/templates/gex.ts` | Spot-line glow hook + optional COG hairline / interval ticks (**default off**) |
| `web/components/options-lab/HeatmapLimQuadrant.tsx` | **New** — plane, crosshairs, dot, ring, chip, trail, chrome |
| `web/components/options-lab/HeatmapChainPanel.tsx` | `layout === "quadrant"` branch; do not disturb matrix/profile/table |
| Spec / Arch / DL / help | India · Lima at LIM0 / LIM6 |

**Do not** dump LIM math into `gex.ts`. First-principles: a pure module, one call site. `gex.ts` stays the profile + a glow/annotation hook.

### 6.2 `computeLim` (LIM1)

Pure `(ctx) → LimResult`. Uses `buildGexProfile(ctx, "gex_net")` → `{ strike, call, put, net }`.

1. Symbol in `LIM_CENTRE_SCALE_PTS` or `valid: false` (AT-LIM19).  
2. Empty or `Σ|net|==0` → x 0, y 50, crossings `[]`, `crossingProximity` 1, `nearestCrossing` null (AT-LIM9).  
3. `centrePts`, `leanRaw`, `lean = clamp(leanRaw, −100, +100)`, `xUnclamped = leanRaw` (E1).  
4. Bands as percent of spot. `netRatio`, `netF`, `concF`, `magF`, `nearSpotMix`, `yUnclamped`.  
5. Walk strikes ascending, skip `net==0`. Sign change → interval + `steepness`.  
6. `nearestCrossing`, `distanceToCrossing`, `spotBelowNearestCrossing`, `crossingProximity`.  
7. `oiAsOf` per JR3.  
8. **Never** adjust `x`/`y` by proximity (LIM17).

`computeCell` on the template remains a stub (`valid: false`) — the quadrant does not use the grid. That matches the `gex` and `ladder` precedent.

### 6.3 Trail (LIM2)

Fixed-interval push every `LIM_TRAIL_INTERVAL_S` of **unclamped** `(xUnclamped, yUnclamped)`. Window `LIM_TRAIL_WINDOW_MIN`. Uniform size, opacity by age. Reset at session open. Ghosts may plot past the plane edge (AT-LIM13). No distance threshold, no smoothing.

Transition label computed, gated by `LIM_SHOW_TRANSITION` default false — **no chrome**.

### 6.4 Quadrant UI (LIM3)

```
dotX = ((x + 100) / 200) × W
dotY = ((100 − y) / 100) × H
```

Crosshairs at x=0, y=50. Dot full opacity always. Ring radius scales with `1 − crossingProximity`. Numeric chip. One blue + edge glow.

Chrome: expiration, wing count, `crossingCount`, four standing lines (LIM27). AT-LIM18: no single crossing price when count ≠ 1. AT-LIM22: OI as-of or named hole + same-day sentence.

Empty / `valid: false` / never-hydrated: dead centre, full opacity (AT-LIM10).

Compact (LIM31): dot, expiration, wing count, chrome lines 1 and 3 — no trail, no annotations, no ring chip.

### 6.5 GEX link (LIM4)

Companion profile from the **same** `buildGexProfile` call. Spot line (price, not a strike bucket) takes the dot's colour and glow. **One** glow relationship.

Behind `LIM_SHOW_ANNOTATIONS` (default false): hairline at `spot + centrePts`; interval ticks at each crossing `lo`/`hi`. Never default all three.

Do not highlight a concentration bar as "the cause" of lean.

### 6.6 Sequence

```text
generation (bus)
  → ChainContext (existing)
  → buildGexProfile(ctx, "gex_net")
  → computeLim
  → trail buffer (unclamped)
  → quadrant + companion profile
```

Template or expiration change **does not** subscribe or fetch beyond the existing chain bus.

---

## 7. Phase DAG

```text
Critical path:

LIM0 ──► LIM1 ──► LIM2 ──► LIM3 ──► LIM4 ──► LIM5 ──► LIM6
                      │       │
                      └───────┴── (LIM3 may start chrome against LIM1 fixtures;
                                   trail wiring waits LIM2)

Off path (never drawn into LIM5):

ST   Strike Turnover implementation     — sibling spec; do not convene
SVP  Session volume artifact writer     — parent amendment only; no SVP code
IKI  IKI GEX toolset                    — beside, not this board
```

| Phase | Name | Depends | Exit |
|-------|------|---------|------|
| **LIM0** | Spec GO · OD-LIM* · JR* · merged Templates draft · seeds · hash | — | Coach LIM0-0 |
| **LIM1** | Config + `computeLim` | LIM0-0 | LIM1-G |
| **LIM2** | Trail (+ transition compute, UI off) | LIM1 | LIM2-G |
| **LIM3** | Quadrant renderer + chrome + registry | LIM1 (trail hook optional until LIM2) | LIM3-G |
| **LIM4** | GEX spot-line glow + annotations hook | LIM3 | LIM4-G |
| **LIM5** | AT-LIM1…23 | LIM1–4 | LIM5-G |
| **LIM6** | DL · Arch 29 · parent amendment land · help · close | LIM5 | LIM6-G · Coach close |

**LIM0-G + LIM0-0 block all code.** LIM1 is the first file-touching implementation phase.

---

## 8. Phases, seeds, gates

Seeds live under [`agents/p-options-lab-heatmap-lim/seeds/`](../agents/p-options-lab-heatmap-lim/seeds/).

### Phase LIM0 — Spec GO + board lock

| Seed | Agent | Intent |
|------|-------|--------|
| **LIM0-1** | India | Spec v0.4.1 exists · E1–E7 · HM1–20 apply · L* PROVISIONAL · sha1 procedure · **merged Templates draft** (OD-LIM6) started |
| **LIM0-2** | Hotel | Golden fixtures for AT-LIM1–13,16; scale-map proposal; dealer-sign caveat; no tape claim |
| **LIM0-3** | Echo | Quadrant IA · ring/chip · identity colour · compact vs comfort · picker-label rec · no cell names |
| **LIM0-4** | Tango | Four chrome lines · AT-LIM23 scan list · placeholder vs final name · no forecast |
| **LIM0-5** | Charlie | Feasibility: `lim.ts` + trail + quadrant branch + config; no `gex` rewrite; Next env prefix note |
| **LIM0-6** | Mike | Client-only; no new secrets / endpoints / trust boundary |
| **LIM0-7** | Delta | AT-LIM1…23 ownership matrix; ternary plan; gate names **LIM\*‑G** only |
| **LIM0-8** | Juliet | Seeds on disk; Strike Turnover / IKI / SVP isolation; JR8 IKI-only rule on the token |
| **LIM0-9** | Lima | DL draft: GO · OD-LIM* · sha1 procedure · Arch 29 outline |
| **LIM0-G** | Delta | All LIM0-* done; OD + JR table ready; L* still unlabeled as rulings; merged Templates **draft** exists; seeds on disk |
| **LIM0-0** | Coach | Stamp [`agents/go/OLLIM-W0.md`](../agents/go/OLLIM-W0.md) **after** LIM0-G. OD-LIM1…7. JR1–8. Spec sha1 → DL. Active-program / three-OK line. |

### Phase LIM1 — Pure calculation

| Seed | Agent | Intent |
|------|-------|--------|
| **LIM1-0** | Hotel · Charlie | `limConfig.ts` + `lim.ts` + types; `LimResult`; no UI |
| **LIM1-1** | Kilo | Empty, unclamped, missing scale, three crossings, cliff vs smear, factor recombine |
| **LIM1-2** | Hotel | Formulas match Spec §5–6; GEX only from `buildGexProfile`; no midpoint |
| **LIM1-G** | Delta · Hotel · Kilo | AT-LIM1–13,16,17,19,20 green on fixtures; existing GEX/Width Fit/AF byte-identical |

### Phase LIM2 — Trail

| Seed | Agent | Intent |
|------|-------|--------|
| **LIM2-0** | Charlie | `limTrail.ts`; interval emission; session-open reset; unclamped |
| **LIM2-1** | Kilo | AT-LIM13/14/15 |
| **LIM2-G** | Delta · Kilo | Clustered vs spread; trail past edge when `xUnclamped ≠ x` |

### Phase LIM3 — Quadrant surface

| Seed | Agent | Intent |
|------|-------|--------|
| **LIM3-0** | Echo · Charlie | Plane, crosshairs, mapping, empty centre, full opacity |
| **LIM3-1** | Charlie · Echo | Registry + `HeatmapChainPanel` `quadrant` branch; ring + chip; compact budget |
| **LIM3-2** | Tango · Charlie | Chrome four lines; AT-LIM18; AT-LIM22; vocab grep |
| **LIM3-G** | Delta · Echo · Tango | Member-usable quadrant; GEX/AF/Width Fit regression green; no forbidden vocab |

### Phase LIM4 — GEX link

| Seed | Agent | Intent |
|------|-------|--------|
| **LIM4-0** | Charlie · Echo | Spot-line colour + glow = dot; one glow relationship |
| **LIM4-1** | Charlie | Annotations hook default off; density budget |
| **LIM4-G** | Delta · Echo | Glow is the signature; annotations off; frozen GEX switcher entry unchanged |

### Phase LIM5 — Acceptance pack

| Seed | Agent | Intent |
|------|-------|--------|
| **LIM5-0** | Kilo | AT-LIM1…23 on disk with command evidence |
| **LIM5-1** | Delta · Kilo | Zero-fetch characterization (template switch) |
| **LIM5-G** | Delta | Full AT pack PASS |

### Phase LIM6 — Docs close

| Seed | Agent | Intent |
|------|-------|--------|
| **LIM6-0** | Lima | DL · Arch 29 as-built row · AGENTS pointer · help / member guide |
| **LIM6-1** | India | Parent Templates amendment **lands**; Spec changelog if as-built drifted; hash still matches GO or new DL |
| **LIM6-G** | Delta · Lima | Docs parity |

---

## 9. Characterization (LIM5-G is this set)

Copy: [`agents/p-options-lab-heatmap-lim/characterization-list.md`](../agents/p-options-lab-heatmap-lim/characterization-list.md).

| Id | Assert |
|----|--------|
| **AT-LIM1** | Mass above spot → x > 0 |
| **AT-LIM2** | Mass below spot → x < 0 |
| **AT-LIM3** | Mass symmetric about spot → x ≈ 0 regardless of gamma sign |
| **AT-LIM4** | All-positive net near spot → y > 50 |
| **AT-LIM5** | All-negative net near spot → y < 50 |
| **AT-LIM6** | Mass above spot **and** negative gamma near spot → x > 0 **and** y < 50 |
| **AT-LIM7** | Spot inside a crossing interval → `crossingProximity = 0`; **x and y unchanged** |
| **AT-LIM8** | Spot beyond `LIM_XPROX_CEIL_PCT` from nearest crossing → `crossingProximity = 1` |
| **AT-LIM9** | Empty strike map → x 0, y **50** |
| **AT-LIM10** | Never-hydrated render → centre, full opacity, not bottom-centre |
| **AT-LIM11** | Three crossings → `crossingCount = 3`; all intervals |
| **AT-LIM12** | Cliff vs smear at the same location → `steepness` differs |
| **AT-LIM13** | `lean` beyond ±100 → `xUnclamped ≠ x`; trail continues past the plane edge |
| **AT-LIM14** | State held still across the trail window → ghosts cluster |
| **AT-LIM15** | State moved fast across the window → ghosts spread |
| **AT-LIM16** | `netRatio`, `concF`, `magF` published and recombine to `nearSpotMix` |
| **AT-LIM17** | Any config key absent → boot / module load aborts |
| **AT-LIM18** | `crossingCount ≠ 1` → chrome prints **no** single crossing price |
| **AT-LIM19** | Symbol absent from the scale map → `valid: false`; no fallback |
| **AT-LIM20** | No midpoint anywhere — no `(lo+hi)/2` in any published field or chrome string |
| **AT-LIM21** | `crossingProximity` at any value → **dot opacity unchanged** |
| **AT-LIM22** | Chrome contains the OI as-of date **or named hole** and the same-day sentence |
| **AT-LIM23** | Grep of every output string, field name and label contains none of: *wall, magnet, pin, gravity, intent, hostile, support, resistance, friction, muddy, slippery* |

Hotel / India: no second pricer; no volume; no snap; no silent zero.

---

## 10. Out of this program

- MSC source, vendor, copy  
- Reopening `p-options-lab-heatmap` AF0–AF-Z or Width Fit  
- Strike Turnover implementation  
- SVP artifact writer / poller (parent amendment catalog only)  
- IKI GEX toolset / IKI Factory  
- Analyzer / Surface / T Ortho / Time Machine  
- MiniTwo unless Coach asks  
- Editing LIM Spec body except changelog + OD rulings at GO  
- Quadrant cell names · friction axis skin · transition chrome  

---

## 11. Status

Plan revision **v1.0**. Spec **v0.4.1 DRAFT**.  

**Next:** fire **LIM0-1…9** (read-only seats). **LIM0-G**. Coach stamps **LIM0-0** on `OLLIM-W0.md`. Then LIM1.

Code is **blocked** until that stamp.

### v1.0 changelog

| Id | Note |
|----|------|
| **v1.0** | First Juliet decomposition of LIM Spec v0.4.1. E1–E7 folded. OD-LIM1…7 · JR1–8. IKI-only / three-OK called on the token. |

---

## 12. First actions (Juliet)

1. This plan + board + seeds + `OLLIM-W0.md` (unstamped) land.  
2. Coach reads §3 and the token.  
3. Fire LIM0-1 India (merged Templates draft) **in parallel** with LIM0-2…9.  
4. Do **not** open `lim.ts` until LIM0-0.
