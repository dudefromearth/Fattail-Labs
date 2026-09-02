# FatTail Labs — Options Lab Heatmap Templates — LIM merge DRAFT

**Status:** **DRAFT** — not BUILD AUTHORITY. **Not a second live parent.**  
**Date:** 2026-09-02  
**Opened by:** India · LIM0-1 · **OD-LIM6**  
**Canonical filename (this draft):** `Specs/FatTail-Labs-Options-Lab-Heatmap-Templates-LIM-merge-DRAFT.md`

**Against live parent:** [`Specs/FatTail-Labs-Options-Lab-Heatmap-Templates-Spec-v0_2.md`](./FatTail-Labs-Options-Lab-Heatmap-Templates-Spec-v0_2.md)  
**Parent header:** Current revision **v0.2.3** · HM21 inspector · **DL-579** · **DL-594**

**Does not replace:** the live parent on disk. Land is **LIM6** (India LIM6-1) after Coach Accept of OD-LIM6 on `OLLIM-W0.md`. Until then, product law remains **v0_2.md**.

**LIM law:** [`Specs/FatTail Labs — Heatmap LIM Template — Specification v0.4.2.md`](./FatTail%20Labs%20%E2%80%94%20Heatmap%20LIM%20Template%20%E2%80%94%20Specification%20v0.4.2.md) (DRAFT; E1–E14). Geometry and compute stay in that Spec. This document only amends the **Heatmap Templates contract** (layout enum + catalog).

**SVP companion (prose only):** [`Specs/FatTail-Labs-Options-Lab-Heatmap-Templates-Spec-v0_3.md`](./FatTail-Labs-Options-Lab-Heatmap-Templates-Spec-v0_3.md) — DRAFT amendment, **not** the live parent. Auxiliary-plane clauses from its **§2** are carried here as **text law**. **No** `session-volume` catalog row. **No** `ValueModeId: "session-volume"` (**E14** · LIM37 · AT-LIM27).

**Architecture companion (update at LIM6, not now):** `Architecture/29-options-lab-heatmap-templates.md`

**Short name:** Heatmap Templates / **HM** — LIM merge DRAFT

---

## 0. What this is

One document so two packets do not fork the same parent (LIM Spec §14).

This DRAFT proposes, for a **single later parent bump**:

1. `TemplateLayout` gains **`"quadrant"`**.
2. Catalog gains template id **`"lim"`** only, with `ValueModeId` **`"lim"`** only.
3. Dual-side **HM15–HM20** remain in force (unchanged).
4. v0.2.3 **HM21** (inspector tab-session) remains in force (unchanged).
5. SVP **auxiliary-plane** law from v0.3 §2 is preserved as **text**, so a future SVP packet does not have to reopen this parent for the seam — and so this packet does **not** ship an unbuilt mode in the switcher.

Everything else in v0.2.3 stands. This file is not executable product law until LIM6 land.

---

## 1. Live parent (OD-LIM9)

India LIM0-1: the live Heatmap Templates parent is

**`Specs/FatTail-Labs-Options-Lab-Heatmap-Templates-Spec-v0_2.md`**

(current revision **v0.2.3**).

There is **no** `Specs/FatTail-Labs-Options-Lab-Heatmap-Templates-Spec-v0_2_1.md`. v0.2.1 is a **content** row inside that file’s §14 (HM21 inspector, 2026-08-24).

`Specs/FatTail-Labs-Options-Lab-Heatmap-Templates-Spec-v0_3.md` is a DRAFT SVP amendment. It is **not** BUILD AUTHORITY. An amendment written against it would silently fork the registry.

---

## 2. Not reopened

This DRAFT does **not** touch, and may not be cited to revisit:

- HM1 live dual-side chain model (except the **added sentence** in §4.5, which does not grant LIM a fetch)
- HM2 diff-once · HM3 push-not-poll · HM4 hydrate-if-empty · HM5 session hold
- HM6 pure compute · HM7 fail-loud cells
- HM8 no-snap · HM9 universe · HM10 no MSC
- HM11 near real time · HM12 GEX honesty · `gex_v1` formula and units (v0.2 §5.5)
- HM13 access · HM14 HIG · §5.2.2 colour hysteresis
- **HM15 / HM16** dual-side identity — side remains a view filter
- **HM17 / HM18** live-generation 250-contract clamp and `next_url` hard error (scoped in §4.5 for a future batch writer; **not** relaxed on the live path)
- **HM19** standard contracts only · **HM20** modal strike step
- **HM21 inspector tab-session** (v0.2.3 · `sessionStorage` `ft_labs_heatmap_session` · AT-HM17 · DL-575 · DL-594)
- Advanced Fly (Spec v0.2.1, DL-311) · Width Fit (WF Spec v0.1.1, DL-525…)
- Frozen Heatmap template `gex`
- Strike Turnover (sibling; never fused)
- MSC code / schemas

**Also not in this DRAFT:**

- A `ValueModeId` or catalog id `session-volume` (**E14**)
- Making `profile` required (v0.3 §2.7 — that clause is for an unbuilt SVP template)
- `gex_v2` units freeze
- Server module, endpoint, Redis, or Heatmap-owned storage
- Quadrant cell names · friction-axis skin

---

## 3. Dual-side HM15–HM20 (restated — still in force)

Copied from the live parent so this DRAFT cannot be read as dropping them.

| ID | Law |
|----|-----|
| **HM15 — Always both sides** | Upstream pull **omits** `contract_type`. Both books in one snapshot. |
| **HM16 — Side is view filter only** | Calls/Puts UI does **not** re-fetch Massive or open a side-only generation. |
| **HM17 — Strike window ≤ 250 contracts** | \((\text{distinct strikes}) × 2 ≤ 250\) ⇒ ≤125 strikes. One page for Heatmap v1. Wings 10/25/50 OK; wings=100 → clamp or fail-loud (OD8). **Live generation path** (see §4.5). |
| **HM18 — Truncation fail-loud** | If Massive response includes **`next_url`** (or equivalent) for a Heatmap generation, treat as **hard error**: **do not** publish a partial dual-side model. **Live generation path** (see §4.5). |
| **HM19 — Standard contracts only** | At row construction, include **standard** contracts only for key `(side, strike)`. Exclude adjusted / non-standard OCC contracts. Record `excluded_adjusted_count` on generation **meta**. |
| **HM20 — Modal strike step** | `strikeStep` on `ChainContext` is the **modal inter-strike gap** among loaded **standard** strikes in the current wing band. Recomputed per generation. |

LIM (`gex_net` over both books, window read, no fetch) is a consumer of this plane. It does not own a second chain.

---

## 4. Amendments (proposed · land at LIM6)

### 4.1 §4.2 Template contract — `TemplateLayout`

Live parent:

```text
layout: "table" | "matrix" | "profile"
```

**This DRAFT:**

```text
layout: "table" | "matrix" | "profile" | "quadrant"
```

v0.2 still ships `table` + `matrix`. `profile` remains **optional** in this packet (see §2). **`quadrant` is required of template `lim`** and is used by no other catalog id in this DRAFT.

A `quadrant` template may stub `resolveColumns` / `resolveRows` / `computeCell` / `assignColors` (return empty / `{ valid: false }`). The plane is not a grid. Grid renderers must ignore `layout === "quadrant"` rather than coerce it to `matrix`.

### 4.2 `ValueModeId` — `"lim"` only

`ValueModeId` gains **exactly one** new string: `"lim"`.

**Forbidden in this bump:** `session-volume`, placeholder modes, disabled switcher stubs, reserved names for unbuilt templates (**LIM37 · E14 · AT-LIM27**).

A relationship to a future session-volume mode, if any, is **prose in this file and in the LIM Spec / plan** — never a shipped enum member.

### 4.3 §5 Template catalog — new entry `lim` only

| ID | Label (placeholder) | Layout | Plane | Product law |
|----|---------------------|--------|-------|-------------|
| `lim` | GEX lean (window) *(OD-LIM2 / Echo owns the member label)* | `quadrant` | *none — chain model only* | LIM Spec v0.4.2 |

Registration shape (LIM Spec §3):

```ts
{
  id: "lim",                                   // code identifier, not member-facing
  label: "GEX lean (window)",                  // E7 — placeholder, Echo owns
  layout: "quadrant",
  valueModes: [{ id: "lim", label: "Lean / near-spot mix" }],
  defaultValueMode: "lim",
  resolveColumns: () => [],
  resolveRows: () => [],
  computeCell: () => ({ display: null, value: null, valid: false }),
  assignColors: () => ({ stickyScale: 1 }),
}
```

**LIM35** — the picker label carries neither *intent* nor *friction*.  
**LIM37** — the registry ships `lim` and nothing else from this packet.

Geometry, factors, crossings, trail, chrome, config keys, and AT-LIM1…28 belong to the **LIM Spec**. This document does not restate them. Where the two disagree about LIM behaviour, **LIM Spec v0.4.2 wins**.

Existing catalog ids (`ladder`, `sym-fly`, `vertical`, `bw-fly`, `gex`, and as-built `width-fit`) are **unchanged**. Frozen `gex` stays.

### 4.4 Inspector HM21 (v0.2.3) — unchanged

**HM21 — Inspector tab-session** remains the v0.2.3 law: browser `sessionStorage` key `ft_labs_heatmap_session`; tab lifetime; not server SoR; not Redis; not HM5; not §5.2.2; not TR14.

`templateId: "lim"` and `valueMode: "lim"` persist like any other template. LIM does not add inspector keys in this DRAFT. Glance / hover / pin / ToS copy remain not persisted.

### 4.5 Auxiliary read plane — text law from v0.3 §2 (not a switcher entry)

**Source:** Heatmap Templates Spec v0.3 §2.1–§2.4.  
**Status here:** **text law**, so the seam is not lost. **Not** a catalog template. **Not** a `ValueModeId`. **Not** assigned the id **HM21** (that id is inspector — §4.4).

India does not mint a replacement HM number in this DRAFT (doctrine §14). Numbering a free id is a LIM6 land task if Coach still wants this seam in the parent.

#### 4.5.1 HM1 — added sentence (v0.3 §2.1)

Live HM1 stands. **Added:**

A template **may** additionally declare a **server-owned auxiliary read plane**. Declaring one does not grant it a fetch: the host performs the read, and the auxiliary data is delivered to the template as an input, exactly as the chain model is.

**LIM does not declare a plane.** LIM reads `gamma`, `open_interest`, and `spot` from the dual-side chain only (LIM6).

#### 4.5.2 HM17 / HM18 — scoped (v0.3 §2.2–§2.3)

**HM17 added scope:** the 250-contract clamp binds the **live generation path** — the request/stream path that feeds `ChainContext`. It does **not** bind a batch producer writing an auxiliary artifact.

**HM18 added scope:** `next_url` remains a **hard error** on the live generation path — no partial dual-side model is ever published. A **batch producer** for an auxiliary plane **must follow** pagination and record the page count in its artifact metadata. Two callers, two laws, and neither may be given the other's.

LIM is not a batch producer and does not paginate.

#### 4.5.3 Auxiliary-plane clauses (v0.3 §2.4 a–g) — unnumbered text

| Clause | Law |
|--------|-----|
| **a. Server-owned** | The plane is produced and owned by a server-side data plane. The Heatmap surface is a **reader**. Storage never lands under the Heatmap. |
| **b. Template owns no fetch** | The template may declare a plane; the **host** resolves and reads it. No `fetch` in template code. HM6 purity is unchanged — compute stays a pure function of its inputs. |
| **c. Read-only** | A template may not write, enqueue, rebuild, or backfill through this plane. |
| **d. Never merged into the chain model** | Auxiliary rows are delivered **alongside** `ChainContext`, never merged into `calls` / `puts`. Provenance stays separable. |
| **e. One plane per template** | A template declares at most one. A template needing two planes is two templates, or a plane that has not been designed yet. |
| **f. Switching costs at most one read** | The host caches a resolved plane by key. **Template, side and value-mode switches must not re-read it** — HM2 discipline applies to the auxiliary plane as it does to the chain. |
| **g. Failure is loud and local** | A plane that fails to resolve renders an explicit error state for that template. It never falls back to the live chain and calls the result the same thing, and it never takes down the workspace. |

A template that omits a plane (every current catalog id, including **`lim`**) is unchanged: `plane` is `undefined`.

**Not carried as catalog or enum:** v0.3 §2.9 row `session-volume`. That row would be a switcher entry for an unbuilt mode (**E14**). SVP geometry, measurement, chrome, and AT-HM17–22 remain in the SVP Spec / v0.3 file until an SVP program is GO.

**Not carried in this packet:** v0.3 §2.5 (`day_volume` on `LadderRow`) and §2.6 (coverage required of auxiliary-plane templates). Those bind a plane-reading template. LIM has none. They stay in v0.3 until SVP lands.

---

## 5. As-built contract (read-only note)

Today `web/lib/options-lab/templates/types.ts`:

```ts
TemplateLayout = "table" | "matrix" | "profile"
ValueModeId    = /* debit, credit, r2r, … gex_*, quote, width_fit — no "lim", no "session-volume" */
```

Registry (`registry.ts`) has no `lim` entry. **No product edit in LIM0.** Implementation is LIM3 (`types.ts` += `"quadrant"`; `ValueModeId` += `"lim"` **only**; one registry row).

---

## 6. Acceptance (additions at parent land)

v0.2 ends at AT-HM17 (inspector). This DRAFT does not replace those tests.

| ID | Test | When |
|----|------|------|
| **AT-LIM27** | Registry enumeration: exactly one new `ValueModeId` (`lim`); **no** `session-volume` entry | LIM5 (LIM Spec §10) |
| **AT-HM3** (existing) | Template switch → zero extra chain HTTP while stream healthy | still binds `lim` |
| **AT-HM3b** (existing) | Calls↔Puts → zero Massive re-fetch | still binds; LIM uses both books |

Auxiliary-plane tests AT-HM17–22 in **v0.3** are **not** this program. They fire if/when an auxiliary-plane template ships. Do not implement a plane to pass them for LIM.

---

## 7. Open / land

| Item | Owner | When |
|------|-------|------|
| Coach Accept OD-LIM6 (this DRAFT exists) | Coach | LIM0-0 |
| Echo member label (OD-LIM2) | Echo | LIM0-3 / LIM3 |
| Parent bump lands (filename / rev Coach picks) | India · Lima | **LIM6-1 / LIM6-0** |
| Arch 29 row for `quadrant` + `lim` | Lima | LIM6 |
| Free id for §4.5.3 clauses, if still merging SVP seam | Coach · Juliet | LIM6 land — not this packet |

**Opinion (India, not law):** prefer a content revision on `…-v0_2.md` (e.g. v0.2.4) over promoting unstamped v0.3. Coach disposes.

---

## 8. Document control

| Version | Date | Notes |
|---------|------|--------|
| **DRAFT** | 2026-09-02 | India LIM0-1. Against live parent **v0_2.md** (rev **v0.2.3**). Adds `layout: "quadrant"` + catalog **`lim`** only. Carries v0.3 §2 auxiliary-plane **prose** (not HM21, not a switcher). Dual-side HM15–HM20 kept. **Not BUILD AUTHORITY. Not a second live parent.** |

**One-line law (this DRAFT):**  
**One new layout (`quadrant`) and one new catalog id (`lim`) over the existing dual-side chain; no `session-volume` enum; SVP auxiliary-plane seam preserved as text; inspector HM21 untouched.**
