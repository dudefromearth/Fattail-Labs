# FatTail Labs — Options Lab Heatmap GEX Calendar Spec v0.1.1

**Status:** **BUILD AUTHORITY** upon stamp of [`agents/go/GC0-W0.md`](../agents/go/GC0-W0.md) (**GC0-0**, Coach 2026-09-18). Effective when that file is written (DL-328). Until then, treat as DRAFT.
**Date:** 2026-09-18
**Current revision:** **v0.1.1**
**Supersedes:** [`FatTail-Labs-Options-Lab-Heatmap-GEX-Calendar-Spec-v0_1.md`](./FatTail-Labs-Options-Lab-Heatmap-GEX-Calendar-Spec-v0_1.md) — **baseline freeze; leave on disk.**
**Parent:** Heatmap Templates Spec v0.2.4 (**HM1–HM21** live; **HM21 = inspector tab-session**, DL-575). Frozen `gex` (§5.5 `gex_v1`) ·
LIM Spec v0.4.7 (sibling, never fused). Templates v0.3 DRAFT auxiliary-plane amendment is **not** this template’s plane.
**Canonical filename:** `Specs/FatTail-Labs-Options-Lab-Heatmap-GEX-Calendar-Spec-v0_1_1.md`
**Short name:** **GEX Calendar** / **GC** (law IDs). **Member picker:** **Term Mass** (**OD-GC4** ACCEPT, Coach 2026-09-18).
**Type:** Heatmap **template** (`gex-cal`) — sibling of frozen `gex` (profile) and
`lim` (quadrant). Columns are **listed expirations**, not widths.
**Bench plan:** [`docs/Options-Lab-Heatmap-Term-Mass-Full-Agent-Bench-Plan-v1.1.md`](../docs/Options-Lab-Heatmap-Term-Mass-Full-Agent-Bench-Plan-v1.1.md) · board `agents/p-options-lab-heatmap-gex-calendar/` · token `agents/go/GC0-W0.md`.
**Architecture companion:** [`Architecture/29-options-lab-heatmap-templates.md`](../Architecture/29-options-lab-heatmap-templates.md)

**Origin:** Rewrite of Coach’s Grok Build prompt
`/Users/ernie/Documents/Options-Lab-Heatmap-GEX-Calendar-Spec-from-ITMatrix.md`
(derived from the ITMatrix Breakdown chapter of *Gamma Exposure Guide For Beginners
(Simple)*, tape ~16:20–18:57 live and ~24:02–24:30 historical) into a form fully
compliant with the Heatmap Templates contract so an implementation plan can be drawn
directly from this document.

**Content hash:** whole-file sha1 recorded in the decision log at Coach GO (not in-file).

**Nothing of Coach’s is removed.** Tape notes, AT-GC1…8, the four open questions, the
honesty line, the vendor ban, the fail-loud pack rule, and the non-goals are carried.
Conversion notes (§0.0) only add house form and parent-law citations.

---

## 0.0 Conversion notes (up front)

The source file was an **implementation prompt**. This file is the Labs **specification**.
Product intent is unchanged. Form changes:

| # | What changed in form | Coach text |
|---|----------------------|------------|
| 1 | Prompt → Spec header, laws, parents, ODs, ideas inventory | Kept |
| 2 | Source named Collector Multi-Expiration (SSR-MEXP) as the pack parent | **Kept as a citation.** Live Heatmap columns are N chain-bus / OPF generations for listed expirations (ME-shaped consumer). MEXP is archive capture for Time Machine, not the live pack. Both sit beside **GC3**. Historical replay remains Time Machine — not this packet. |
| 3 | Source honesty: “GEX is dealer positioning at this snapshot, not a direction.” | **Kept as the member-facing sentence.** Parent **HM12** is stricter: chrome also says **Chain GEX (estimate)**, not true dealer GEX. Both apply. |
| 4 | ME Spec v0.1 already reserved id `calendar` for a **structure** (long back / short front) | This template is **`gex-cal`**. It is not that template. Do not fuse. |
| 5 | Tape green/red outliers, 3D, vendor replay | Carried in **Appendix A** and **§11**. v1 chrome is gold-only peak (**GC7**, **OD-GC3**). |
| 6 | Originating picker placeholder `GEX calendar` | **Kept in this note.** Coach 2026-09-18 named the Template list **Term Mass** (**OD-GC4** LOCKED). Internal id stays `gex-cal`. |

---

## 0. Mission

A Heatmap template that answers:

> At this underlier, where is chain GEX **by strike and by expiration**, and what does
> that look like as a **profile** next to the grid?

**Output**

| Pane | What |
|------|------|
| Left | Heatmap. **Rows = strikes** (high at top). **Columns = expirations** (near-dated left). Each cell is **net GEX** (`gex_v1`) in dollars for that strike × expiry. |
| Right | Companion **horizontal-bar profile** by strike. Same strike axis. One signed bar per strike (net across the **visible** expirations). |
| Footer | **NET** per expiration (sum of valid cells in the column). |

**Absolute doctrine constraints**

- Observation-only (Heatmap Templates §0.3). No platform recommendation, no signal, no profit theater.
- GEX is **not** a directional signal. Do not label cells support / resistance / buy / sell. Peak highlight is “largest \|mass\| in this window,” not a trade cue.
- Representable or named failure (HM7). Missing contracts are blank, not silent zeros.

**Vendor derivation (lawful look, forbidden copy)**

Resemblance of **view** (strike × expiry matrix of signed GEX, companion profile, NET
footer, diverging cyan/magenta, gold peak) is **lawful** (HM10 / §0.2 look-vs-code).
**Forbidden:** the vendor name in member chrome, ids, or help; their logo; 3D mode;
their replay / STEP / SPEED widget. Replay, if any, is Time Machine
(`p-options-lab-tm`) — do not fork a second scrubber.

---

## 0.1 Surface naming

| Name | Meaning |
|------|---------|
| **Heatmap app** | Route `/app/options-lab/heatmap` |
| **Template** | Named view + pure compute over the dual-side chain model |
| **GEX Calendar** | This template’s spec / law name (`gex-cal`, GC*). |
| **Term Mass** | Member Template-list string (**OD-GC4** LOCKED, Coach 2026-09-18). |
| **Frozen `gex`** | Existing template id `gex`, `layout: "profile"`, one expiration. Byte-identical. |
| **LIM** | Template id `lim`, `layout: "quadrant"`. Window lean / mix. Not a calendar. |
| **ME `calendar`** | Multi-Expiry Spec v0.1 structure (long back / short front). **Not this.** |
| **Pack** | N dual-side books for one underlier, same wings, listed expirations. |
| **Visible columns** | The expirations on screen, not the whole listed universe. |

---

## 1. What already exists — do not rebuild

| Already there | Why this is not that |
|---------------|----------------------|
| Frozen GEX template `gex`, `layout: "profile"` | One expiration. Vertical profile only. Byte-identical; **do not restyle.** |
| LIM `lim`, `layout: "quadrant"` | Window lean / mix. Not a calendar. LIM4 companion GEX is a LIM link, not this pane. |
| Fly / Width Fit / Verticals | Structure furniture. Columns are **widths**, not expirations. |
| ME Spec `calendar` / `term-spine` / `fly-roll` | Structure / IV term templates over N books. Different question. DRAFT, not BUILD. |
| `gex_v1` in `pricing.ts` | **Reuse.** Call `gexSide` / `gexNet` / `gexAbs`. Do not duplicate. Do not port `gamma × OI × 100`. |
| Heatmap expiration strip / chain picker | Listed expirations for the underlier (typically ~5–10). Candidate column set (**OD-GC2**). |
| Time Machine | Owns historical / replay. This packet maps “live” to current generations only. |
| Collector Multi-Expiration (SSR-MEXP) v0.8 | Archive capture. **Not BUILD AUTHORITY.** Not the live pack. Cited because Coach named it. |

No server matrix SoR. No Redis template store. No `AnalyzerPositionsList`. No MiniTwo.
No LIM file restyle. No frozen-`gex` SHA1 change.

---

## 2. Parent laws

All of Heatmap Templates Spec v0.2.4 laws **HM1–HM21** apply. Critical reminders for
this template:

| ID | How it binds here |
|----|-------------------|
| **HM1** | Each **column** is one dual-side generation keyed `(symbol, expiration, wings)`. The **view** shows N columns. Do not invent a second Massive client per cell. |
| **HM2** | Joining N books must not multiply snapshot traffic. Subscribe by interest / attach to generations already on the strip. Template switch is local recompute. |
| **HM6** | Pure functions of pack + params + valueMode. |
| **HM7** | Missing γ/OI / missing contract → invalid, never silent zero. |
| **HM8** | Listed strikes only. No snap. |
| **HM9** | `market_symbol_universe` only. One underlier. |
| **HM10** | No MSC code. Look may match the derived view. |
| **HM12** | Label **Chain GEX (estimate)**. Not true dealer GEX. |
| **HM14** | HIG tokens, ≥44 pt, reduced-motion. Color hysteresis §5.2.2. |
| **HM15–HM20** | Apply **independently per expiration book** (dual-side, one page, `next_url` hard error, standard contracts, modal step). |
| **HM21** | Inspector tab-session (**v0.2.4 live law** · **DL-575** · `sessionStorage` `ft_labs_heatmap_session`). `templateId` restores only if this template is **in the production switcher**. **GC14:** no production switcher until GC4-G. Templates v0.3 DRAFT §2.4 reused the id **HM21** for an auxiliary read plane — **not live**; not this template. |
| **§0.3** | Structure / observation descriptors only. No profit claims. |
| **§5.2.2** | Sticky scale. Do not rewrite every generation. |
| **§5.5** | `gex_v1` units frozen. This template does not unfreeze them. |

**HM1 tension (named, not waived):** today’s `ChainContext` is one underlier + **one**
expiry. Fly / Width Fit / frozen GEX / LIM all assume that. This template’s columns
**are** expirations. The resolution is **GC1–GC3** (a pack of N books, or fail loud) —
not a rewrite of single-expiry templates, and not fake columns.

---

## 3. GEX Calendar laws

| ID | Law |
|----|-----|
| **GC1 — Pack of listed books** | Input is N dual-side books for **one** underlier, **same wings**, listed expirations. Rows share a strike window. Columns are those expirations, near-dated left. |
| **GC2 — Frozen formula** | Cell math is existing `gex_v1`. Call GEX \(+\Gamma·OI·S^2\); put GEX \(-\Gamma·OI·S^2\); net = sum. **Not** `gamma × OI × 100`. **No volume.** Call `gexSide` / `gexNet` / `gexAbs` in `pricing.ts`. Do not duplicate. |
| **GC3 — Fail loud, never fake** | Empty pack / pack not available → empty grid + **named** empty state. **Forbidden:** repeating one expiry as N columns. A genuine one-expiry pack is **one column** (AT-GC1), not a fake calendar. |
| **GC4 — Cell identity** | Default cell (`gex_net`) = call + put at that strike **for that expiration**. `valid` false if **any required side** is missing (AT-GC10 / AT-HM13). For `gex_net` and `gex_abs` both sides are required. Invalid display is **blank**, not `$0`, and does not paint cyan/magenta. `$0` only when the value is actually zero. |
| **GC5 — NET footer** | Per column: sum of **valid** cells. Invalid cells are omitted, not treated as zero. Sticky footer. |
| **GC6 — Companion profile** | Bar at strike \(K\) = sum of valid net GEX at \(K\) across **visible columns** (the expirations on screen, not the whole universe). Same strike scroll as the grid. Spot gutter on both panes. |
| **GC7 — One peak** | Peak = \(\mathrm{argmax}\,|profile\ bar|\) in the visible strike window. Gold on that strike (outline on the grid row is enough; gold fill on the profile bar). Not a trade cue. v1 does **not** ship green/red secondary outliers (**OD-GC3 ACCEPT**, Coach GC0-0). Changing sticky scale does not flip sign colors. |
| **GC8 — Spot row** | `isSpot` on the listed strike nearest live (or Time Machine) spot. Gutter on grid **and** profile. |
| **GC9 — This template’s scale** | Diverging cyan (negative) ↔ near-black (0) ↔ magenta (positive). Sticky scale = max \(\|cell.value\|\) in the current visible grid, hysteresis as HM §5.2.2. Frozen `gex` and LIM colors stay byte-identical. |
| **GC10 — Observation-only chrome** | No magnet / pin / air pocket / support / resistance / buy / sell in chrome, tooltips, or help. Peak copy: largest \|mass\| in this window. |
| **GC11 — No vendor string** | No string `ITMatrix` / `itmatrix` in member chrome, ids, or help. |
| **GC12 — Time is not this packet** | Live = current chain generations. Historical / replay = Time Machine later. No 3D. No vendor STEP / SPEED. |
| **GC13 — Isolation** | Do not restyle frozen `gex` or LIM. Do not open `AnalyzerPositionsList`. Append the registry; do not reorder frozen entries. StudioTwo only. |
| **GC14 — Flag until switcher** | **OD-GC1…GC5** are stamped at **GC0-0**. Until **GC4-G**, ship behind a flag, AT pack on fixtures, **no production switcher entry**. |
| **GC15 — Layout** | `layout: "matrix-profile"` (**OD-GC5 ACCEPT**, Coach GC0-0). Grid is primary; profile is a companion pane. Do not stuff a profile into fly-matrix chrome. Do not overload `"matrix"`. |
| **GC16 — Compact dollars** | Cell `display` = compact currency of the raw `gex_v1` `value` (`$12.4M`, `-$159.5M`). Do not reuse frozen `gex` `GEX_DISPLAY_DIV` (÷1e9) for this chrome. AT-GC1 compares **formula values** to frozen `gexNet` per strike, not display strings. |
| **GC17 — Dual-side per book** | Net GEX always uses both sides of that book. Side filter (HM16) does not drop the other side from the cell. |
| **GC18 — One underlier** | One symbol. No cross-fill SPY→SPX. Spot from the live underlier pattern / TM spot, bound to the product key. |

**Honesty line (member-facing, one sentence, not a disclaimer wall):**

> Chain GEX (estimate) at this snapshot, not a direction.

---

## 4. Registration

```ts
{
  id: "gex-cal",                          // code identifier — never "itmatrix"
  label: "Term Mass",                     // OD-GC4 LOCKED — Coach 2026-09-18; not a vendor name
  description:
    "Strike × expiration matrix of chain GEX (estimate) · companion profile · NET footer",
  layout: "matrix-profile",               // GC15 · OD-GC5 ACCEPT — new TemplateLayout value
  valueModes: [
    { id: "gex_net", label: "Net" },      // default
    { id: "gex_abs", label: "Absolute" },
    { id: "gex_all", label: "Call / Put" },
  ],
  defaultValueMode: "gex_net",
}
```

`ValueModeId` already has `gex_net` / `gex_abs` / `gex_all`. Do not add a fourth GEX
mode. `TemplateLayout` gains `"matrix-profile"` (**OD-GC5 ACCEPT**).

**Switcher:** append `gex-cal` after frozen `gex` / `lim` **only** when **GC14** lifts.
Member string is **Term Mass**. Until then the registry may include the template
behind the flag, but the member switcher must not show it (LIM37 / E14 precedent:
a switcher entry that renders nothing is a bug report).

---

## 5. Input / pack

### 5.1 Pack shape (consumer)

Until ME Spec `ChainContext.books` (ME2) is BUILD AUTHORITY, this template may take a
**local pack** rather than rewriting every template’s context in the same packet:

```
GexCalPack {
  symbol: string
  wings: number
  spot: number | null                 // live or TM underlier mid (product key only)
  visibleExpirations: string[]        // YYYY-MM-DD, near-dated first — the columns
  books: Map<expiration, ChainContext>  // each book is dual-side, own asOf / hash
}
```

Each `ChainContext` in `books` is today’s one-expiry dual-side model. Frozen `gex` /
LIM / flies keep reading the front (or currently selected) book unchanged.

**Forbidden:** constructing N columns from one `ChainContext` by relabeling the same
expiry. That is the AT-GC8 fake.

### 5.2 Where the books come from (**OD-GC1 ACCEPT**)

Coach GC0-0 **ACCEPT:** join live generations already listed on the Heatmap strip.

Two sources were on the table; the stamped one is the first:

| Option | Meaning |
|--------|---------|
| **Join live generations now** | The Heatmap expiration strip already lists N expirations. Each is its own generation under HM1. Attach / hydrate those books client-side. Zero extra Massive per cell (HM2). |
| **Wait for a pack GO** | Do not join. Flag on, empty state (GC3) until a named data-plane packet (live multi-book and/or MEXP archive) is BUILD AUTHORITY. |

Suggested **N** for v1 (**OD-GC2**): the expirations already on the Heatmap expiration
strip / chain picker (typically ~5–10), **not** the entire listed calendar.

### 5.3 Epoch honesty

Each cell is computed from **one** book. Cells do not mix two expirations.

NET and the profile **sum** visible columns. Those books may have different `asOf`.
Do not invent a blended timestamp for the grid. Tooltip may show that column’s `asOf`.
If a book is missing, held-error, or unpublished, that column is empty / invalid —
never stale-filled from a neighbor.

### 5.4 Strike window

Listed strikes in the wings window of the pack. Intersection across visible books is
**not** required for a row to exist: a strike listed on some columns and missing on
others is a row with blank cells (GC4), not a snapped substitute (HM8).

---

## 6. Geometry and compute

### 6.1 Rows

Listed strikes in the window, **high at top**. `isSpot` on the strike nearest
live / TM spot (**GC8**).

### 6.2 Columns

Listed expirations in `visibleExpirations`, **near-dated left**.

| Field | Law |
|-------|-----|
| Column id | Expiration date `YYYY-MM-DD` |
| Column label | Member date `MM/DD/YY` |

### 6.3 Cell (default `gex_net`)

For expiration \(E\), strike \(K\):

\[
\mathrm{GEX}_c = +\Gamma_c·OI_c·S^2,\quad
\mathrm{GEX}_p = -\Gamma_p·OI_p·S^2,\quad
\mathrm{net} = \mathrm{GEX}_c + \mathrm{GEX}_p
\]

Spot \(S\) is that book’s / pack’s underlier mid (product key). Null γ, null OI, or
missing contract on a required side → `valid: false` (HM7, AT-HM13 for net).

| Field | Law |
|-------|-----|
| `value` | net GEX (number) or `null` |
| `display` | compact dollars (**GC16**) or `null` when invalid |
| `valid` | false if **any required side** is missing (GC4 · AT-GC10) |

**`gex_abs`:** \(|C|+|P|\) at that \((K,E)\); both sides required (same as `gexAbs`).
**`gex_all`:** expose call and put (combined), still one cell per \((K,E)\). Default
chrome is net. Do not invent a fourth mode.

### 6.4 NET footer

\[
\mathrm{NET}(E) = \sum_{K \in \text{valid cells of } E} \mathrm{net}(K,E)
\]

Invalid cells omitted. Display compact dollars. Sticky.

### 6.5 Profile bar

\[
\mathrm{bar}(K) = \sum_{E \in \text{visible}} \mathrm{net}(K,E)
\quad\text{(valid cells only)}
\]

Signed bars. Gold on the peak strike. Spot tick / gutter.

### 6.6 Peak

\[
K^\star = \arg\max_K \lvert \mathrm{bar}(K) \rvert
\]

Ties: lowest strike in the visible window (deterministic; do not flicker). Gold
outline on grid cells in that row **and** gold fill on the profile bar. Outline-only
on the grid is enough if fill would read as a trade mark.

Safer v1: **one** peak (profile), no green/red cell outliers (**OD-GC3**).

---

## 7. Color

Reuse heatmap `assignColors` pattern. This template has **its own** scale.

| Input | Law |
|-------|-----|
| `colorT` | \([-1,+1]\): signed net / sticky scale |
| Sticky scale | \(\max |cell.value|\) in the current **visible** grid; update only if relative change > 25% or member Reset (HM §5.2.2) |
| `bgCss` | cyan at \(-1\), near-black at \(0\), magenta at \(+1\) |
| Peak | gold outline (grid) and gold fill (profile bar) — Labs heatmap gold, not a new token family |

LIM / frozen `gex` colors stay byte-identical. Do not use the tape’s green/red in v1.

Sign colors do not flip when the sticky scale updates (**AT-GC4**).

---

## 8. Chrome

Keep Options Lab Heatmap chrome: template switcher, expiration / wings as today,
inspector (**HM21** = tab-session, v0.2.4).

**This template adds:**

- Split: grid left (~60–70%), profile right (~30–40%). Same strike scroll. Spot
  gutter on both.
- Diverging cyan (negative) ↔ magenta (positive). Peak gold.
- Compact `$` labels in cells. Empty/invalid: blank, not `$0` unless the value is
  actually zero.
- Footer NET row, sticky.
- Tooltip: strike, expiration, net, call GEX, put GEX, OI if already on the row,
  column `asOf` if present. No “support” / “resistance” copy.
- Companion profile: signed bars, gold on the peak, spot tick.
- Honesty line (one sentence) — §3.

**Do not add in this packet:**

- 3D view
- Vendor replay / STEP / SPEED (Time Machine owns time)
- Vendor logo, “GEX data as of” their watermark
- Volume
- Forecast / magnet / pin / air copy in chrome

Empty state (GC3), named, calm (elegant failure): the pack is not available — not
“the app is broken,” not a single-expiry grid wearing calendar clothes.

---

## 9. Vocabulary (Hotel / Tango)

| Allowed | Forbidden |
|---------|-----------|
| Chain GEX (estimate) | True dealer GEX, “the dealers will…” |
| Net / call / put GEX | Support, resistance, magnet, pin, air pocket |
| Largest \|mass\| in this window | Buy, sell, “expect pin,” trade cue |
| Snapshot / this generation | Forecast, prediction |
| Blank / not available | Silent `$0`, fake columns |

**Sign convention (help / spec, not cell labels)** — carried from the source tape’s
earlier chapter:

- Customer **buys** options → dealer **short gamma** → hedge **amplifies** the move
  (positive feedback). Negative net GEX (cyan) is that regime in this estimate.
- Customer **sells** options → dealer **long gamma** → hedge **dampens** the move
  (stabilize). Positive net GEX (magenta) is that regime in this estimate.

GEX is **not** a directional signal. Help may teach the convention. Chrome must not
turn it into a call.

---

## 10. Files (expected — Arch 29)

Follow Arch 29. Do not open `AnalyzerPositionsList`. Do not restyle frozen `gex` or LIM.

| Piece | Path |
|-------|------|
| Template compute | `web/lib/options-lab/templates/gexCal.ts` (**new**) |
| Registry | `web/lib/options-lab/templates/registry.ts` — **append**, do not reorder frozen entries |
| Types | `web/lib/options-lab/templates/types.ts` — `TemplateLayout` += `"matrix-profile"`; `ValueModeId` unchanged |
| Panel split | `web/components/options-lab/HeatmapChainPanel.tsx` **or** a `HeatmapGexCalendar.tsx` sibling of `HeatmapLimQuadrant.tsx` |
| Tests | `web/lib/options-lab/templates/gexCal.test.ts` — sign, NET, peak, empty expiry, one-expiry pack, fake-pack refusal |
| Help | `server/help_reference/options-lab-heatmap-term-mass.md` — **after** the view works, not before |

Formula stays in `pricing.ts`. Call those per (expiration, strike).

---

## 11. Non-goals

- Not a LIM replacement
- Not a rewrite of `gex_v1`
- Not Time Machine (replay is a later join)
- Not 3D
- Not volume
- Not “magnet / pin / air pocket” as official labels (member may think it; chrome must not)
- Not MSC heatmap
- Not MiniTwo
- Not ME Spec `calendar` / `term-spine` / `fly-roll`
- Not a restyle of frozen `gex` or LIM
- Not true dealer GEX
- Not the entire listed calendar in v1 (OD-GC2)

---

## 12. Acceptance tests (write tests first)

| ID | Test |
|----|------|
| **AT-GC1** | One expiration in the pack → one column. Cells = `gexNet` at that expiry. Matches frozen `gex` profile **per strike** for that expiry (**same formula**, different chrome). |
| **AT-GC2** | Two expirations → two columns. NET footer = column sum of valid cells. Profile bar at \(K\) = sum of the two valid cells at \(K\). |
| **AT-GC3** | Spot row `isSpot` on nearest listed strike. Gutter on grid and profile. |
| **AT-GC4** | Peak = max \(\lvert profile\rvert\). Gold on that strike. Changing sticky scale does not flip sign colors. |
| **AT-GC5** | Missing contract → `valid: false`, blank cell, not a zero that paints cyan/magenta. |
| **AT-GC6** | When the flag is on **and** ODs stamped: switcher includes **Term Mass**. Frozen `gex` and `lim` still render as before (screenshot or byte check on **their** compute, not this chrome). |
| **AT-GC7** | No string `ITMatrix` / `itmatrix` in member chrome, ids, or help. |
| **AT-GC8** | Empty pack / pack not available → empty grid + loud named empty state, **not** a repeated single-expiry fake calendar. |
| **AT-GC9** | Constructing columns by relabeling one book as N expirations is refused (same as AT-GC8). |
| **AT-GC10** | `gex_net` with only one side present → invalid (AT-HM13 inherited). |
| **AT-GC11** | Color hysteresis: max \(\lvert value\rvert\) within 25% across generations → no re-normalize (GC9 · AT-HM16 pattern). |
| **AT-GC12** | Template / value-mode switch → zero extra Massive (HM2). |
| **AT-GC13** | Compact display: actual zero → `$0` (or `$0K`); invalid → blank. |
| **AT-GC14** | Registry append does not reorder frozen `gex` / `lim` / `sym-fly` / `width-fit` entries. Frozen `gex` SHA1 / byte check unchanged. |

---

## 13. Open decisions — Accept / Override

**GC0-0 (Coach 2026-09-18): OD-GC1…GC5 ACCEPT.** **GC14** is now “flag until GC4-G,” not “until ODs.”

| ID | Topic | Source question | Disposition |
|----|-------|-----------------|-------------|
| **OD-GC1** | **Pack** | Wait for a multi-book / MEXP GO, or join N live chain generations now if the picker already has them? | **ACCEPT.** Join the expirations **already listed** on the Heatmap strip (HM2 attach). Do not wait for SSR-MEXP. Fail loud (GC3) when a listed expiry has no book. |
| **OD-GC2** | **N columns** | All listed on the strip, or a fixed 5–7? | **ACCEPT.** Visible = listed on the strip, typical ~5–10, **not** the entire calendar. A later cap is a param, not a second template. |
| **OD-GC3** | **Peak chrome** | Gold only, or also green/red outliers like the tape? | **ACCEPT.** Gold only in v1. Green/red = FI-GC1. |
| **OD-GC4** | **Member label** | `GEX calendar` vs Echo’s name? | **ACCEPT — Term Mass** (Coach 2026-09-18). Echo does not rename. No vendor name. Originating placeholder “GEX calendar” kept in conversion notes. |
| **OD-GC5** | **Layout enum** | Add `"matrix-profile"` or overload `"matrix"`? | **ACCEPT.** `TemplateLayout` gains `"matrix-profile"`. Do not overload `"matrix"`. |

---

## 14. Ideas inventory

| ID | Idea | Disposition |
|----|------|-------------|
| Picker name **Term Mass** | **IN-SCOPE** · **OD-GC4 LOCKED** | |
| Strike × expiry GEX matrix | **IN-SCOPE** | |
| Companion signed profile | **IN-SCOPE** | |
| NET footer per expiry | **IN-SCOPE** | |
| `gex_v1` reuse | **IN-SCOPE** | |
| Cyan / magenta diverging + gold peak | **IN-SCOPE** | |
| Compact `$` cell labels | **IN-SCOPE** | |
| Honesty line | **IN-SCOPE** | |
| Fail-loud empty pack | **IN-SCOPE** | |
| Flag until ODs | **IN-SCOPE** | |
| `gex_abs` / `gex_all` value modes | **IN-SCOPE** (default remains `gex_net`) | |
| Tape green/red secondary outliers | **FLAGGED** FI-GC1 | v1 gold-only (**OD-GC3**) |
| 3D view | **DEFERRED** | Non-goal this packet |
| Vendor replay / STEP / SPEED | **DEFERRED** | Time Machine owns time |
| Time Machine historical join | **DEFERRED** | Later packet; same template |
| SSR-MEXP archive as historical pack | **DEFERRED** | Archive, not live |
| Magnet / pin / air as official labels | **PARKED** | Member may think it; chrome must not |
| Entire listed calendar as columns | **DEFERRED** | OD-GC2 |
| ME Spec `calendar` structure | **OUT OF SCOPE** (other spec) | Not dropped from ME inventory |

Flagged ideas: see also `Architecture/flagged-ideas.md` at Coach disposition.

---

## 15. Implementation sequence (ready for plan derivation — not a board)

**BUILD AUTHORITY** upon `GC0-W0` stamp (**GC0-0**). Product code starts at **GC1**.

| Phase | Deliverable |
|-------|-------------|
| **GC0** | This spec + Coach stamp on **OD-GC1…GC4**. India / Hotel / Echo+Tango review. Lima DL. |
| **GC1** | Pack type + AT-GC1 / AT-GC8 / AT-GC9 on fixtures. Flag on. No switcher. |
| **GC2** | Pure `gexCal.ts`: cells, NET, profile, peak. AT-GC2, AT-GC4, AT-GC5, AT-GC10, AT-GC13. |
| **GC3** | `matrix-profile` chrome: split, cyan/magenta, gold peak, compact `$`, honesty line. AT-GC3, AT-GC7, AT-GC11. |
| **GC4** | Switcher entry (flag off / production) only after ODs + GC1–GC3 green. AT-GC6, AT-GC12, AT-GC14. Help file after the view works. |

Tests first. Frozen `gex` / LIM byte checks on every phase.

---

## 16. Decision-log entry (paste-ready — not filed until GO)

> **DL-xxx — Heatmap Term Mass (`gex-cal`).** New Heatmap template `gex-cal`
> (`layout: "matrix-profile"`), picker **Term Mass**: strike × listed-expiration
> matrix of frozen `gex_v1` net GEX, companion signed profile, NET footer,
> cyan/magenta diverging, gold peak. Observation-only. Not true dealer GEX (HM12).
> Not ME `calendar`. Not a restyle of frozen `gex` or LIM. No vendor name. Replay
> stays Time Machine. Empty pack fails loud (no fake columns). Hash of Spec v0.1.1
> recorded at GO. **OD-GC4** Term Mass. **OD-GC1…GC3 · OD-GC5** as stamped.

---

## 17. Document control

| Version | Date | Notes |
|---------|------|-------|
| **v0.1.1** | 2026-09-18 | Advisor F1–F2 fork. GC4 = invalid if **any required side** missing. AT-GC11 drops “p95 /”. GC7 / GC15 / §4 note OD-GC3 / OD-GC5 stamped. §13 lead-in: ODs ACCEPT; GC14 = flag until GC4-G. Header **GC0-0**. **OD-GC1…GC5 ACCEPT.** v0_1 remains baseline. |
| **v0.1** | 2026-09-18 | Initial DRAFT. Conversion of Coach’s Grok prompt (ITMatrix-derived view) into Heatmap Templates form. Baseline freeze. |

**One-line law**

Add Heatmap template `gex-cal`, picker **Term Mass**: strike × expiration matrix of
`gex_v1` net GEX dollars, cyan/magenta diverging, gold peak, NET footer, companion
signed profile of the same strikes. Same Options Lab Heatmap switcher. Do not name
the vendor. Do not touch frozen GEX or LIM compute. Do not invent a second replay.
If the pack is not there, fail loud (AT-GC8) instead of drawing fake columns. Tests
first.

---

## Appendix A — Derivation notes (reference only, not chrome)

Source tape (frames only; no captions). **Do not ship this appendix as member copy.**

### A.1 Live SPY (~16:20–18:42)

- Header: LIVE 9:30 AM · INTRADAY REPLAY · STEP 5m/10m/15m/30m · SPEED 0.5x/1x/2x ·
  3D toggle. **Ignore 3D and their replay.** Map “live” to current chain generation.
  Map “historical / replay” to Time Machine later — not this packet.
- Underlier + last: e.g. SPY **752.38 −3.67 (−0.49%)**. Spot row marked **752** with
  a teal gutter on the strike label.
- Columns: listed expirations `06/05/26 … 06/12/26` (0DTE out about a week).
- Rows: strikes ~760 down through ~736 (and NVDA example 221 down through 194).
- Cell text: signed dollars, compact (`$30.468M`, `-$159.524M`, `$8.596M`,
  `-$37.195M`, `$0K`).
- Right profile: same strikes; cyan bars below spot (negative net), magenta above
  (positive net), **one yellow bar** at the largest \|net\| (~$100M at 750 on SPY).
- Footer NET: e.g. `-$521.431M` under 06/05, smaller nets on later columns.

### A.2 Color language on tape (do not invent a fourth meaning)

| Color | Meaning on the tape |
|-------|---------------------|
| Magenta / purple | Positive net GEX (dealers long gamma at that strike × expiry) |
| Cyan / teal | Negative net GEX (dealers short gamma) |
| Darker cell | Smaller \|GEX\| |
| Brighter cell | Larger \|GEX\| |
| Yellow | Peak \|GEX\| in the visible window (the “magnet” they point at — SPY 750 −$159.5M on 0DTE; NVDA 217 +$68.4M; historical SPY 700 +$157.8M on 04/17) |
| Green | Secondary large **positive** outlier |
| Red | Secondary large **negative** outlier |

v1 ships magenta / cyan / gold only. Green/red = **FI-GC1**.

### A.3 Historical (~24:02)

Same grid, HISTORICAL REPLAY 04/15/2026 09:30. Mostly magenta (positive). Yellow peak
+$157.8M at 700 on 04/17. One red hole −$145.5M at 694 on 04/15. Spot 694.71. Profile
almost all magenta with one cyan bar. This is the “positive-GEX / pin” regime next to
the live “negative-GEX / air” regime. Same template, different day. **Chrome must not
print pin / air.** Time Machine later supplies the day.
