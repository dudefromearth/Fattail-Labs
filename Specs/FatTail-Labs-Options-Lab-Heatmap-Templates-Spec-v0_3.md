# FatTail Labs — Options Lab Heatmap Templates Spec v0.3

**Status:** **DRAFT** — amendment. Not build authority.
**Date:** 2026-09-01
**Current revision:** **v0.3**
**Supersedes:** [v0.2](./FatTail-Labs-Options-Lab-Heatmap-Templates-Spec-v0_2.md) — **only** in the clauses named in §2. Everything else in v0.2 stands unchanged.
**Canonical filename:** `Specs/FatTail-Labs-Options-Lab-Heatmap-Templates-Spec-v0_3.md`
**Type:** Amendment to the client view-plane Spec — admits a **server-owned auxiliary read plane**

**Short name:** **Heatmap Templates** / **HM**

**Content hash (v0.3):** recompute at Coach GO:
`shasum -a 1 Specs/FatTail-Labs-Options-Lab-Heatmap-Templates-Spec-v0_3.md` → record in DL.

**Why this exists:** required companion to
[`Specs/FatTail-Labs-Session-Option-Volume-Profile-Spec-v0_2.md`](./FatTail-Labs-Session-Option-Volume-Profile-Spec-v0_2.md)
(rev v0.2.2) **§15.1**. SVP adds a template that reads a session artifact, and three v0.2 laws
forbid that. Landing `session-volume` in the registry **without** this amendment is a spec
violation, not a feature (SVP §0.2). **Both documents go through SVP0 as one packet.**

**Architecture companion:** `Architecture/29-options-lab-heatmap-templates.md` — update in the same
body of work (documentation parity, invariant 6).

---

## 0. What changed and why

v0.2 is a **client view-plane** law: one shared chain model, pure templates, zero template-owned
data. That is correct and stays correct. It also means a template can only ever show **now** —
there is no lawful way to show a **past session**, because the only plane is the live generation.

SVP needs three things v0.2 refuses:

| Need | v0.2 law | v0.3 resolution |
|------|----------|-----------------|
| Read a prior session | **HM1** — one live model, no other plane | **HM21** — a template may *declare* a server-owned auxiliary read plane. It still owns no fetch |
| Full listed chain, not the wing band | **HM17** — ≤250 contracts | HM17 **scoped** to the live generation path; batch producers are not bound by it |
| Follow pagination | **HM18** — `next_url` ⇒ hard error | HM18 **scoped** the same way: hard error in the request/stream path, followed in a batch writer |

The amendment is the **seam**, and the seam is deliberately narrow: the template declares a need,
**the host fetches**, the plane is server-owned, and the live chain model is never adulterated.

---

## 1. Not reopened

This amendment does **not** touch, and may not be cited to revisit:

- HM15 / HM16 dual-side identity — side remains a view filter
- HM8 no-snap · HM19 standard contracts only · HM20 modal strike step
- HM12 GEX honesty · `gex_v1` formula and units (§5.5 of v0.2)
- §5.2.2 colour hysteresis · Advanced Fly (Spec v0.2.1, DL-311)
- HM3 push-not-poll · HM4 hydrate-if-empty · HM5 session hold
- The 250-contract clamp **on the live generation** — it is scoped, not relaxed

**Also not in this amendment:** the `gex_v2` units freeze. SVP §A.3.1 shows the derivation and
SVP SV60 assigns ownership **here**, but it lands as its own revision against OD4 — not smuggled
into an amendment whose job is the auxiliary plane. Keeping the packet narrow is the point.

---

## 2. Amendments

### 2.1 HM1 — amended

> **HM1 — Single dual-side chain model.** All templates read the **same** model for
> `(symbol, expiration, wings)`. Model always holds **calls and puts**. No per-template Massive or
> steady-state HTTP poll. ~~*(unchanged text)*~~
> **Added:** A template **may** additionally declare a **server-owned auxiliary read plane**
> (HM21). Declaring one does not grant it a fetch: the host performs the read, and the auxiliary
> data is delivered to the template as an input, exactly as the chain model is.

### 2.2 HM17 — scoped

> **HM17 — Strike window ≤ 250 contracts.** ~~*(unchanged text)*~~
> **Added scope:** this clamp binds the **live generation path** — the request/stream path that
> feeds `ChainContext`. It does **not** bind a batch producer writing an auxiliary artifact, which
> may cover the full listed chain for an expiration.

### 2.3 HM18 — scoped

> **HM18 — Truncation fail-loud.** ~~*(unchanged text)*~~
> **Added scope:** `next_url` remains a **hard error** on the live generation path — no partial
> dual-side model is ever published. A **batch producer** for an auxiliary plane **must follow**
> pagination and record the page count in its artifact metadata. Two callers, two laws, and
> neither may be given the other's.

### 2.4 HM21 — auxiliary read plane (new)

| Clause | Law |
|--------|-----|
| **a. Server-owned** | The plane is produced and owned by a server-side data plane (for SVP: the market-data plane). The Heatmap surface is a **reader**. Storage never lands under the Heatmap |
| **b. Template owns no fetch** | The template declares `dataPlane`; the **host** resolves and reads it. No `fetch` in template code. HM6 purity is unchanged — `computeCell` stays a pure function of its inputs |
| **c. Read-only** | A template may not write, enqueue, rebuild, or backfill through this plane (SVP SV16 parity) |
| **d. Never merged into the chain model** | Auxiliary rows are delivered **alongside** `ChainContext`, never merged into `calls` / `puts`. Provenance stays separable: a member and an agent must always be able to tell a live quote from an archive row |
| **e. One plane per template** | A template declares at most one. A template needing two planes is two templates, or a plane that has not been designed yet |
| **f. Switching costs at most one read** | The host caches a resolved plane by key. **Template, side and value-mode switches must not re-read it** — the HM2 discipline applies to the auxiliary plane as it does to the chain (**AT-HM19**) |
| **g. Failure is loud and local** | A plane that fails to resolve renders an explicit error state for that template. It never falls back to the live chain and calls the result the same thing, and it never takes down the workspace |

### 2.5 HM22 — `day_volume` is a first-class row field (new)

v0.2 §3.4 lists `mid`, `bid`, `ask`, `open_interest`, `gamma`, `delta`, `iv`, `is_spot`. The
ladder has always **displayed** volume; the contract never named it. It is named now:

| Clause | Law |
|--------|-----|
| `day_volume` is added to `LadderRow` and surfaced on `ChainContext` |
| Semantics: the vendor's **session-to-date cumulative** contract volume at generation time — not a Labs measurement, not a tape sum (SVP SV1) |
| `null` → **invalid cell**, never zero (HM7 parity, **AT-HM18**). Absence of a read is not absence of trading |

### 2.6 HM23 — coverage is required of any auxiliary-plane template (new)

A template reading an auxiliary plane **must** render that plane's coverage object, on the
surface, before its own values are legible.

| Clause | Law |
|--------|-----|
| Coverage travels with the data — a plane payload without coverage is malformed |
| The surface shows it as chrome, not a tooltip (SVP SV57) |
| At minimum: source, scope, completeness, and as-of. The plane's own Spec fixes the full field set |
| A template that renders auxiliary values **without** coverage fails its gate (**AT-HM20**) |

### 2.7 §4.5 Renderers — amended

> v0.2: *"v0.2 must ship `table` + `matrix`. `profile` optional."*
> **v0.3:** `profile` is **required** — `session-volume` uses it. Rows are strike-aligned to the
> shared row grid so a profile can sit beside a ladder or matrix without a second scroll context.

### 2.8 §4.2 Template contract — amended

```ts
type HeatmapTemplate = {
  id: string;
  label: string;
  description: string;
  layout: "table" | "matrix" | "profile";
  valueModes: { id: ValueModeId; label: string }[];
  defaultValueMode: ValueModeId;

  /** NEW (HM21). Omit for pure chain templates — ladder, sym-fly, gex are unchanged. */
  dataPlane?: {
    id: string;                    // e.g. "chain_session_volume"
    keyFrom: (ctx: ChainContext, params: TemplateParams) => PlaneKey;
    required: boolean;             // false ⇒ template still renders from chain alone
  };

  resolveColumns(ctx: ChainContext, params: TemplateParams, plane?: PlaneData): ColDef[];
  resolveRows(ctx: ChainContext, params: TemplateParams, plane?: PlaneData): RowDef[];
  computeCell(
    ctx: ChainContext, row: RowDef, col: ColDef,
    valueMode: ValueModeId, params: TemplateParams, plane?: PlaneData,
  ): Omit<GridCell, "colorT">;
  assignColors(grid: GridCell[][], valueMode: ValueModeId): void;
};

type PlaneData = {
  coverage: Record<string, unknown>;   // HM23 — required, opaque to the host
  rows: unknown;                        // shape owned by the plane's own Spec
  asOf: string | null;
};
```

`plane` is `undefined` for every existing template. **No existing template changes.**

### 2.9 §5 Template catalog — new entry

| ID | Label | Layout | Plane | Product law |
|----|-------|--------|-------|-------------|
| `session-volume` | Session volume *(OD-SV10 settles the member label)* | `profile` | `chain_session_volume` | SVP Spec v0.2 (rev v0.2.2) |

The Heatmap Spec defines **that the template exists and what plane it may read**. Its geometry,
value modes, measurement law, chrome and acceptance tests belong to the SVP Spec. This document
does not restate them, and where the two disagree about SVP behaviour, **SVP wins**.

---

## 3. Acceptance tests (additions)

v0.2 ends at AT-HM16. These are additions, not replacements.

| ID | Test |
|----|------|
| **AT-HM17** | A mocked Massive page carrying `next_url` still hard-errors on the **live generation** path (AT-HM3e unchanged), while a batch producer for an auxiliary plane follows it and records the page count |
| **AT-HM18** | `day_volume` null on a row → invalid cell, never zero (HM22) |
| **AT-HM19** | With a resolved plane cached: template switch, side switch and value-mode switch produce **zero** plane re-reads and **zero** chain HTTP (HM21f, HM2 parity) |
| **AT-HM20** | A template rendering auxiliary values without a coverage object fails validation (HM23) |
| **AT-HM21** | Auxiliary rows are never present in `ctx.calls` / `ctx.puts`; provenance is separable in the model and in agent export (HM21d) |
| **AT-HM22** | Plane resolution failure renders a local error state for that template only — no fallback to chain values under the same label, no workspace failure (HM21g) |

---

## 4. Open decisions

| # | Question | Recommendation |
|---|----------|----------------|
| **OD10** | May an auxiliary-plane template be a member's **default** template? | **Not in first ship.** A default that can fail to resolve makes an empty workspace the first impression |
| **OD11** | Coverage rendering: per-template strip, or one shared workspace strip? | **Per-template.** Two templates can hold planes with different as-of and scope; one shared strip would average two truths |
| **OD12** | Does the agent grid export carry plane coverage? | **Yes** — same honesty as the surface (v0.2 §9). An agent reading archive rows without scope and as-of is the same defect as a member doing it |

Existing OD1–OD9 from v0.2 remain as they stand.

---

## 5. Document control

| Version | Date | Notes |
|---------|------|-------|
| v0.1 / v0.1.1 | 2026-08-10 | Initial · dual-side HM15–HM17 |
| v0.2 | 2026-08-10 | External review H2–H12 fold |
| **v0.3** | **2026-09-01** | **Auxiliary read plane amendment.** HM1 amended; HM17/HM18 scoped to the live generation path; HM21 auxiliary plane; HM22 `day_volume`; HM23 coverage required; `profile` renderer required; `dataPlane` on the template contract; `session-volume` catalogued. AT-HM17–22 · OD10–12. Companion to SVP Spec v0.2.2 §15.1 — same packet, same gates |

**One-line law:**
**A template may read one server-owned, read-only auxiliary plane that the host resolves for it —
declared, cached, never merged into the live chain, never rendered without its coverage — and the
250-contract clamp and the `next_url` hard error bind the live generation path, not the batch
producer that fills that plane.**
