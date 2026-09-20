# Lima DL draft (LIM0-9) — not landed

**Status:** Draft only. Do **not** append `Architecture/00-decision-log.md` until Coach **LIM0-0** on `agents/go/OLLIM-W0.md`. Do **not** invent a DL number. Do **not** stamp the token. Hash is recomputed at stamp, not invented here.

Paste-ready body for LIM0-0 (fill **DL-XXX**, date, Coach Accept/Override, and stamp sha1 at that moment):

---

## YYYY-MM-DD — DL-XXX Options Lab Heatmap LIM (GO pending LIM0-0)

**Decision (Coach LIM0-0 — unstamped):** GO for Heatmap template **`lim`**, `layout: "quadrant"`. Spec **v0.4.2** becomes **BUILD AUTHORITY** only when `agents/go/OLLIM-W0.md` is stamped GO. Until then the spec is **DRAFT**. L1–L17, **OD-LIM1…9**, and **JR1–8** are **PROVISIONAL**. Delta reads the token, not chat (**DL-328**). Gate name **LIM0-G**. Plan **v1.1**.

**Spec:** [`Specs/FatTail Labs — Heatmap LIM Template — Specification v0.4.2.md`](../../Specs/FatTail%20Labs%20%E2%80%94%20Heatmap%20LIM%20Template%20%E2%80%94%20Specification%20v0.4.2.md)  
**Plan:** [`docs/Options-Lab-Heatmap-LIM-Full-Agent-Bench-Plan-v1.1.md`](../../docs/Options-Lab-Heatmap-LIM-Full-Agent-Bench-Plan-v1.1.md) **v1.1**  
**Board:** `agents/p-options-lab-heatmap-lim/`  
**Token:** [`agents/go/OLLIM-W0.md`](../go/OLLIM-W0.md) — unstamped. v1.0 of this token (Spec v0.4.1) is superseded.

### Spec sha1 procedure (JR7)

Hash is **whole-file**, recorded **in this DL** (and the token blank at stamp), **not** in the Spec body.

| When | sha1 |
|------|------|
| Plan land (v1.1) | `41dad04f06f7f2a43b80af4becb9153bf6f4f88a` |
| LIM0-0 stamp | **Recompute** whole-file sha1 of Spec v0.4.2 at stamp. Write that value here. Do not copy the plan-land hash unless it still matches. |

Command at stamp: `shasum -a 1 "Specs/FatTail Labs — Heatmap LIM Template — Specification v0.4.2.md"`

Stamp sha1: `________________`

### OD-LIM1…9 — PROVISIONAL until LIM0-0

Not rulings until Coach Accept/Override on the token.

| ID | Spec / Juliet recommendation | State |
|----|------------------------------|-------|
| **OD-LIM1** | Approve v0.4.2 BUILD AUTHORITY (file already in `Specs/`). Conditional on OD-LIM6 draft existing (India LIM0-1) **and** OD-LIM9 named. | PROVISIONAL |
| **OD-LIM2** | Picker placeholder **`GEX lean (window)`**. Echo owns the member label. *Liquidity-Intent* does not survive. Neither *intent* nor *friction* in the picker (LIM35). | PROVISIONAL |
| **OD-LIM3** | Hold *friction / muddy / slippery* off the axis. Payload field stays `nearSpotMix`. Tape sitting is a later program. | PROVISIONAL |
| **OD-LIM4** | Hotel proposes `LIM_CENTRE_SCALE_PTS` at LIM0-2. Silent default if Coach silent: `{"I:SPX": 50}` only. Every other symbol `valid: false` until listed. No silent 50. | PROVISIONAL |
| **OD-LIM5** | LIM runs **beside** IKI GEX toolset. Same `Γ·OI·S²`. LIM does not supersede IKI. | PROVISIONAL |
| **OD-LIM6** | One merged Heatmap Templates amendment: keep SVP **prose**; add `TemplateLayout: "quadrant"`; catalog template `lim` **only**. **No** `session-volume` `ValueModeId` (E14). Land the parent in LIM6 with this program. | PROVISIONAL |
| **OD-LIM7** | No quadrant cell names in v1 (LIM36). | PROVISIONAL |
| **OD-LIM8** | Y floors ship **0/100** (E9). Later tape sitting may reinstate a floor **as config**, versioned per Spec §16 — never a new compute packet. | PROVISIONAL |
| **OD-LIM9** | India names the live Heatmap Templates parent **by canonical filename** **before** the merged draft opens. Candidates: `Specs/FatTail-Labs-Options-Lab-Heatmap-Templates-Spec-v0_2.md` (header: current revision **v0.2.3**) **or** `Specs/FatTail-Labs-Options-Lab-Heatmap-Templates-Spec-v0_3.md`. **There is no v0.2.1 file.** An amendment against a superseded parent is a silent registry fork. | PROVISIONAL |

### JR1–8 — PROVISIONAL until LIM0-0

Coach disposes at the same stamp. Defaults below are Juliet recs if Coach is silent at GO.

| ID | Rec | State |
|----|-----|-------|
| **JR1** | Config lives in `web/lib/options-lab/templates/limConfig.ts`. Keys **exactly** Spec Appendix A (`LABS_LIM_*`). Missing, invalid, or `W_*` not summing to 1.0 **throws** (AT-LIM17 / AT-LIM17b). Map values are JSON. **No** `server/config.py`. If the bundler requires `NEXT_PUBLIC_`, that prefix is an implementation seam (Charlie LIM0-5); logical names stay Appendix A — not a second constant set. | PROVISIONAL |
| **JR2** | LIM template **composes** the quadrant with a companion GEX profile of the **same** generation so LIM28 has a spot line to colour. Compact density: LIM31 **including the ring** (E11). | PROVISIONAL |
| **JR3** | `oiAsOf`: if the generation does not carry an OI settlement date, chrome **names the hole** (Appendix B). Never print `captured_at` / `asOf` as if it were OI settlement. | PROVISIONAL |
| **JR4** | Trail interval / window / blend weights / **Y floors** ship as Spec §9 starting points, labelled **not findings**. Breaking change law §16. | PROVISIONAL |
| **JR5** | Transition: compute behind `LIM_SHOW_TRANSITION=false`. **No member control** in v1. | PROVISIONAL |
| **JR6** | Help + member guide at LIM6 (Width Fit precedent). Tango owns copy. Appendix B strings are contractual. | PROVISIONAL |
| **JR7** | Spec filename stays as landed until India says otherwise. Hash is whole-file, in DL, not in the Spec. | PROVISIONAL |
| **JR8** | **IKI-only vs this board. Spec law (E12), not optional.** LIM1 does not fire until `OLLIM-W0.md` is GO **and** that stamp either (a) reassigns the active program to LIM or (b) records **three successive Coach OKs** to touch heatmap files while IKI remains active. A break resets the count. Juliet will not start LIM1 on chat. | PROVISIONAL |

### C2 — config fail-loud blast radius

**JR1 throw is at first LIM activation, not Heatmap module load.**

`limConfig.ts` must **not** throw when `HeatmapChainPanel` (or any heatmap shared module) loads. Parse on **first LIM activation**; the panel catches at the template boundary; render LIM unavailable **with the missing key named**; other templates unaffected. No silent default. AT-LIM17 isolation: other templates still render with a LIM key absent (Delta LIM0-7 · Charlie LIM0-5). If this cannot be scoped, it is a finding for the token, not a softening of fail-loud.

### Parent-amendment pointer (OD-LIM6 · OD-LIM9)

**Path TBD by India LIM0-1.** Do not invent a filename.

India names the live parent (OD-LIM9) **then** opens one merged Heatmap Templates **DRAFT** against that file: `layout: "quadrant"` + `ValueModeId: "lim"` **only**; SVP auxiliary-plane **prose** preserved; **no** `session-volume` enum (E14). The draft lands with this program at **LIM6** (LIM6-1), not at GO.

Until LIM0-1 names it, candidates only:

- `Specs/FatTail-Labs-Options-Lab-Heatmap-Templates-Spec-v0_2.md` (current rev **v0.2.3**)
- `Specs/FatTail-Labs-Options-Lab-Heatmap-Templates-Spec-v0_3.md` (amendment)

Merged draft path (fill at LIM0-1): `________________`

### Arch 29 outline (LIM6 — not now)

[`Architecture/29-options-lab-heatmap-templates.md`](../../Architecture/29-options-lab-heatmap-templates.md) is as-built heatmap. **Do not edit at LIM0.** At **LIM6** (LIM6-0) add template **`lim`**, `layout: "quadrant"`:

| Arch 29 locus (today) | LIM6 add |
|------------------------|----------|
| §1.3 catalog (`ladder` · `sym-fly` · `bw-fly` · `vertical` · `gex`) | Row `lim` — quadrant plane; lean / near-spot mix; picker label per OD-LIM2 |
| `HeatmapTemplate.layout` union `"table" \| "matrix" \| "profile"` | `\| "quadrant"` |
| §4.3 renderer table (Matrix / Table / Profile) | Quadrant: crosshairs 0/50, identity-blue dot, proximity ring (comfort + compact), chrome |
| View-plane diagram (table / matrix / profile) | Quadrant branch; frozen `gex` profile stays |
| As-built code table | `lim.ts` · `limConfig.ts` · `limTrail.ts` · `HeatmapLimQuadrant.tsx` · panel `layout === "quadrant"` |

Value modes: parent amendment catalogs **`lim` only** (E14). No `session-volume` enum.

### L1–L17

Remain **PROVISIONAL** until LIM0-0; lock at stamp (plan §0.1 · invariant 20).

### Does not (until LIM0-0 GO)

Product code · MiniTwo · treating DRAFT as BUILD AUTHORITY · firing LIM1 · appending this row to `Architecture/00-decision-log.md` · stamping `OLLIM-W0.md` · editing Arch 29 · inventing a parent-amendment path · writing a stamp sha1 that was not recomputed · `yUnclamped` · Y runtime clamp · `session-volume` enum · `LIM_CONF_*` · volume · MSC · fusing Strike Turnover · hiding frozen `gex`.
