# Options Lab Heatmap — Term Mass Full Agent Bench Plan v1.0

**Date:** 2026-09-18  
**Plan revision:** **v1.0**  
**Canonical filename:** `docs/Options-Lab-Heatmap-Term-Mass-Full-Agent-Bench-Plan-v1.0.md`  
**Owner (orchestration):** Juliet  
**Authority:** Coach (GO / ship)  
**Instance:** **GROK BUILD — HEATMAP (GBH)** · **DL-747**  
**W0 artifact:** [`agents/go/GC0-W0.md`](../agents/go/GC0-W0.md) — Delta reads **this file**, not chat (**DL-328**). `GBH-W0` is instance seating, not the program GO.  
**Board:** [`agents/p-options-lab-heatmap-gex-calendar/`](../agents/p-options-lab-heatmap-gex-calendar/)  
**Governance:** [`agents/bench/doctrine.md`](../agents/bench/doctrine.md) · [`AGENTS.md`](../AGENTS.md)

**Machine:** StudioTwo only unless Coach names another. Next `:3000` · FastAPI `:4000`. **Do not stop them.** Never `git add -A`. MiniTwo out.

**Member name (Coach 2026-09-18):** **Term Mass** — that is the Template list string. Internal id stays `gex-cal`. Spec filename stays `…-GEX-Calendar-Spec-v0_1.md`. Law IDs stay **GC\***. Do not coin a second id.

**Primary law:**

| Doc | Path | Status |
|-----|------|--------|
| **GEX Calendar Spec v0.1** (content **v0.1.1** after Term Mass) | [`Specs/FatTail-Labs-Options-Lab-Heatmap-GEX-Calendar-Spec-v0_1.md`](../Specs/FatTail-Labs-Options-Lab-Heatmap-GEX-Calendar-Spec-v0_1.md) | **DRAFT.** sha1 `382a74acdf88d2e4f698203af864e8421df5b0cc`. **Not BUILD AUTHORITY until GC0-0.** OD-GC4 **LOCKED** Term Mass. OD-GC1…GC3 · OD-GC5 dispose on `GC0-W0`. |
| Heatmap Templates Spec **v0.2.4** | [`Specs/FatTail-Labs-Options-Lab-Heatmap-Templates-Spec-v0_2.md`](../Specs/FatTail-Labs-Options-Lab-Heatmap-Templates-Spec-v0_2.md) | HM1–HM21. Frozen `gex` §5.5 `gex_v1`. **There is no v0.2.1 file.** |
| LIM Spec v0.4.7 | [`Specs/FatTail Labs — Heatmap LIM Template — Specification v0.4.7.md`](../Specs/FatTail%20Labs%20%E2%80%94%20Heatmap%20LIM%20Template%20%E2%80%94%20Specification%20v0.4.7.md) | Sibling. Never fused. Frozen `gex` SHA1 stays. |
| Width Fit Spec v0.1 | [`Specs/FatTail-Labs-Options-Lab-Heatmap-Width-Fit-Spec-v0_1.md`](../Specs/FatTail-Labs-Options-Lab-Heatmap-Width-Fit-Spec-v0_1.md) | Closed WF1–WF5 · **DL-525**. Do not reopen. |
| Advanced Fly Spec v0.2 | [`Specs/FatTail-Labs-Options-Lab-Heatmap-Advanced-Fly-Spec-v0_2.md`](../Specs/FatTail-Labs-Options-Lab-Heatmap-Advanced-Fly-Spec-v0_2.md) | Closed Wave‑1. Do not reopen. |
| ME Spec v0.1 | [`Specs/FatTail-Labs-Options-Lab-Heatmap-Multi-Expiry-Templates-Spec-v0_1.md`](../Specs/FatTail-Labs-Options-Lab-Heatmap-Multi-Expiry-Templates-Spec-v0_1.md) | DRAFT. Id `calendar` is a **structure**. **Not this template.** Do not fuse. |
| Collector MEXP v0.8 | [`Specs/FatTail-Labs-Collector-Multi-Expiration-Capture-Spec-v0_8.md`](../Specs/FatTail-Labs-Collector-Multi-Expiration-Capture-Spec-v0_8.md) | Archive. **Not** the live pack. Not BUILD AUTHORITY. |
| Arch **29** | [`Architecture/29-options-lab-heatmap-templates.md`](../Architecture/29-options-lab-heatmap-templates.md) | As-built heatmap. Update at GC6. |
| OPF Truth · **DL-309** | [`Specs/FatTail-Labs-Options-Lab-OPF-Truth-and-Elegant-Failure-Doctrine-v1.1.md`](../Specs/FatTail-Labs-Options-Lab-OPF-Truth-and-Elegant-Failure-Doctrine-v1.1.md) | Dual-side chain the OPF holds. |
| Human Interface Spec v1.0 | [`Specs/FatTail-Labs-Human-Interface-Spec-v1.0.md`](../Specs/FatTail-Labs-Human-Interface-Spec-v1.0.md) | HIG · ≥44 pt |
| Time Machine v0.7.4 | [`Specs/FatTail-Labs-Options-Lab-Time-Machine-Spec-v0_7_4.md`](../Specs/FatTail-Labs-Options-Lab-Time-Machine-Spec-v0_7_4.md) | Owns replay. Do not fork a scrubber. |
| Instance split | **DL-747** · **DL-720** | GBH owns `HM*` / `OD-GC*` / frozen `gex_v1` generations. Not VPS* / SADEV* / volume-profile. |

**Neighbor artifact quotes (India — plan table vs neighbor board):**

- LIM close: `agents/p-options-lab-heatmap-lim/ORCHESTRATOR.md` — “LIM6-G PASS 2026-09-02.” Frozen `gex` stays.  
- Width Fit close: Arch 29 landed row — “Width Fit (template id `width-fit`) Landed **DL-525**.”  
- GBH seating: **DL-747** — board `agents/p-options-lab-heatmap-gex-calendar/`. Spec sha1 at seating `36a347185aaece5c4b900bf22e9683ad4ffbaf6f`.

**Spec status:** v0.1 **DRAFT**. **GC0-0 GO** is the stamp. Do not fire GC1 until `GC0-W0.md` is GO **and** JR8 isolation is satisfied.

Specialists execute **only** via seeds. Coordination only through **Coach** or **Juliet**.  
Reviews of spec and gates route to **GROK ADVISOR via Coach**.  
Delta gates: **PASS / FAIL / BLOCKED** with evidence — **never waived**.  
**Coach may overrule** a specialist finding via **DL entry with reasoning** — that is **not** a gate waive.

---

## 0. Product decisions (this program)

**L1–L12 PROVISIONAL until GC0-0**, except **L4** (Term Mass) which Coach named 2026-09-18.

| ID | Decision | Source | State |
|----|----------|--------|--------|
| **L1** | New Heatmap template `id: "gex-cal"`, `layout: "matrix-profile"`. **Not** a value mode on frozen `gex`. Frozen `gex` stays. | Spec GC15 · GC18 · §4 | PROVISIONAL (OD-GC5) |
| **L2** | Columns are **listed expirations**, near-dated left. Rows are listed strikes, high at top. Not widths. | Spec §6 | PROVISIONAL |
| **L3** | Formula is frozen `gex_v1` (`pricing.ts`). Call `gexSide` / `gexNet` / `gexAbs`. No `gamma × OI × 100`. No volume. | Spec GC2 | PROVISIONAL |
| **L4** | Picker label is **Term Mass**. Code id `gex-cal`. No vendor string. | Coach 2026-09-18 · **OD-GC4** | **LOCKED** |
| **L5** | Pack of N dual-side books, one underlier, same wings. Empty pack → named empty state. **Forbidden:** fake N columns from one book. One genuine expiry → one column (AT-GC1). | Spec GC1 · GC3 | PROVISIONAL (OD-GC1) |
| **L6** | Visible columns = expirations already on the Heatmap strip (typical ~5–10), not the entire listed calendar. | Spec OD-GC2 | PROVISIONAL |
| **L7** | Peak = argmax \|profile bar\|. Gold only in v1. Not a trade cue. | Spec GC7 · OD-GC3 | PROVISIONAL |
| **L8** | Cyan (negative) ↔ magenta (positive). This template’s own sticky scale. Frozen `gex` / LIM colors byte-identical. | Spec GC9 | PROVISIONAL |
| **L9** | Observation-only. Honesty line: *Chain GEX (estimate) at this snapshot, not a direction.* **Term Mass** is a name, not a claim of true dealer mass (HM12). | Spec GC10 · HM12 | PROVISIONAL |
| **L10** | Time Machine owns historical / replay. No 3D. No vendor STEP / SPEED. | Spec GC12 | PROVISIONAL |
| **L11** | Isolation: do not restyle frozen `gex` or LIM. Append registry. Prefer `HeatmapGexCalendar.tsx` sibling. Shared host (`HeatmapChainPanel`) only through Coach. | Spec GC13 · DL-747 | PROVISIONAL |
| **L12** | Until GO, flag + fixtures, **no production switcher**. After GO, switcher shows **Term Mass**. | Spec GC14 · AT-GC6 | PROVISIONAL |

**This plan does not re-open:** Market Bus Redis · dual-side HM15–20 · Advanced Fly Wave‑1 · Width Fit · LIM geometry · Analyzer · Surface T Ortho · Time Machine scrubber · IKI Factory · SVP writer · Strike Turnover · VPS* / VPSB* / SADEV* · volume-profile route · ME `calendar` / `term-spine` / `fly-roll` implementation.

---

## 1. Mission

```text
Heatmap expiration strip (listed dates)
  → N OPF-held dual-side generations   // one book per expiry; HM2 attach
  → GexCalPack                         // local pack; do not fake columns
  → gexCal.ts  (gex_v1 per strike × expiry)
       cells · NET footer · companion profile · peak
  → matrix-profile chrome
       grid left · profile right · cyan/magenta · gold peak
  → Heatmap switcher  id=gex-cal  label=Term Mass
```

The template answers:

> At this underlier, where is chain GEX **by strike and by expiration**, and what does that look like as a **profile** next to the grid?

| Pillar | Spec | Ship meaning |
|--------|------|----------------|
| Question | §0 | Strike × expiry GEX mass + companion profile. Forecasts nothing. |
| Formula | GC2 · HM §5.5 | Existing `Γ·OI·S²`. Dual-side net. |
| Pack | GC1 · GC3 | N listed books or fail loud. Never fake. |
| Cell | GC4 · GC16 | Compact `$`. Invalid blank, not `$0`. |
| NET | GC5 | Column sum of valid cells. Sticky footer. |
| Profile | GC6 | Sum across **visible** columns. Same strike scroll. |
| Peak | GC7 | One gold strike. Not a magnet label. |
| Color | GC9 · §5.2.2 | Own sticky scale. Cyan/magenta. |
| Name | L4 | **Term Mass** in the Template list. |
| Honesty | GC10 · HM12 | Estimate, not a direction, not true dealer GEX. |

**First smoke after GC2 + GC3 (flag on, no production switcher required):**

1. One-expiry fixture → one column; cell values match frozen `gexNet` per strike (AT-GC1).  
2. Two-expiry fixture → two columns; NET = column sum; profile at K = sum of cells at K (AT-GC2).  
3. Missing contract → blank, not a painted zero (AT-GC5).  
4. Relabeling one book as N expirations is refused (AT-GC9).  
5. Empty pack → named empty state (AT-GC8).  
6. Peak gold on argmax \|profile\|; scale update does not flip sign colors (AT-GC4).  
7. Grep: no `ITMatrix` / `itmatrix` (AT-GC7). No magnet / pin / air / support / resistance in chrome.  
8. Frozen `gex` / `lim` compute byte-identical.  
9. Mode / template switch among already-loaded books = **zero Massive** (AT-GC12).

---

## 2. As-built honesty

### 2.1 Keep (do not rebuild)

| Area | Path |
|------|------|
| Dual-side bus · push/diff | Market Bus · `useOptionChainBus` — today **one** `(symbol, expiration, wings)` |
| Heatmap expiry strip | `HeatmapChainPanel` `expiryContracts` — listed dates, typically ~5–10 |
| Template registry · types | `web/lib/options-lab/templates/{registry,types}.ts` |
| GEX math `gex_v1` | `pricing.ts` → `gexSide` / `gexNet` / `gexAbs` |
| Frozen GEX template | `templates/gex.ts` id `gex`, `layout: "profile"` — **byte-identical** |
| LIM | `lim.ts` · `HeatmapLimQuadrant.tsx` — **do not edit** |
| Width Fit / Advanced Fly / verticals | Closed boards — byte-identical on fixture |
| Inspector HM21 | `heatmapSession.ts` — restore `templateId` only if in the production switcher |
| Live underlier mid | `useLiveUnderlierMarks` · product key only (GC18) |

### 2.2 Build (this program)

| Gap | Spec | Phase |
|-----|------|--------|
| GC0 GO · OD-GC1…GC5 · JR* · Hotel goldens · seeds · hash | Spec §13 · §15 | **GC0** |
| `GexCalPack` + attach N strip expirations · fake-pack refusal | GC1 · GC3 · AT-GC1/8/9 | **GC1** |
| `gexCal.ts` cells · NET · profile · peak | §6 · AT-GC2/4/5/10/13 | **GC2** |
| `matrix-profile` chrome · sibling panel · cyan/magenta · gold · compact `$` · honesty | §7–8 · AT-GC3/7/11 | **GC3** |
| Flagged switcher **Term Mass** · registry append | §4 · AT-GC6/12/14 | **GC4** |
| Full AT-GC1…14 + frozen `gex` / LIM byte check | Spec §12 | **GC5** |
| DL · Arch 29 · AGENTS pointer · help / member guide · close | Spec §16 | **GC6** |

### 2.3 Explicit non-phases

| ID | Out |
|----|-----|
| **NX1** | MSC heatmap / vendor chrome / string `ITMatrix` |
| **NX2** | Rewrite `gex_v1` · restyle frozen `gex` or LIM |
| **NX3** | Volume of any kind · VP stores · volume-profile route · SADEV* / VPS* |
| **NX4** | Fake columns from one expiry |
| **NX5** | ME Spec `calendar` / `term-spine` / `fly-roll` |
| **NX6** | Time Machine scrubber fork · 3D · vendor STEP / SPEED |
| **NX7** | Magnet / pin / air / support / resistance as official labels |
| **NX8** | Green/red secondary outliers in v1 (FI-GC1) |
| **NX9** | Entire listed calendar as columns |
| **NX10** | `AnalyzerPositionsList.tsx` |
| **NX11** | MiniTwo unless Coach asks |
| **NX12** | Re-open Advanced Fly, Width Fit, LIM geometry |
| **NX13** | SSR-MEXP archive as a live-pack prerequisite |
| **NX14** | Production switcher before GC0-0 + GC1–GC3 green |
| **NX15** | Shared Labs host edits without Coach (`HeatmapChainPanel` beyond a layout branch; `OptionsLabChrome`) |

---

## 3. Open decisions (OD-GC*) — Coach Accept/Override at GC0-0

**OD-GC4 is already named.** Coach 2026-09-18: Template list = **Term Mass**. Record Accept on the token; do not reopen.

| # | Question | Spec / Juliet recommendation |
|---|---------|------------------------------|
| **OD-GC1** | Pack source | **Join live generations** already listed on the Heatmap strip (HM2 attach). Fail loud when a listed expiry has no book. Do **not** wait for SSR-MEXP. Historical days are Time Machine later. |
| **OD-GC2** | N columns | **All listed on the strip** (typical ~5–10), near-dated left. Not the entire calendar. A later cap is a param, not a second template. |
| **OD-GC3** | Peak chrome | **Gold only** in v1. Green/red = FI-GC1. |
| **OD-GC4** | Member label | **Term Mass** — Coach named. Echo does not rename. Chrome honesty line stays HM12. |
| **OD-GC5** | Layout enum | Add `TemplateLayout` `"matrix-profile"`. Do not overload `"matrix"`. |

Juliet recommendations (Coach disposes at the same stamp):

| Rec | Default if Coach silent at GO |
|-----|-------------------------------|
| **JR1** | Pack is a **local** `GexCalPack`. Do **not** rewrite every template to ME2 `ChainContext.books` in this program. Frozen `gex` / LIM / flies keep reading the selected book. |
| **JR2** | Feature flag, fail-loud when on and pack missing. Logical name `LABS_HEATMAP_TERM_MASS`. If the bundler requires `NEXT_PUBLIC_`, that prefix is an implementation seam recorded in DL — not a second constant. Flag **off** = no switcher entry (LIM37). |
| **JR3** | New `HeatmapGexCalendar.tsx` sibling of `HeatmapLimQuadrant.tsx`. `HeatmapChainPanel` gets a `layout === "matrix-profile"` branch **only** — Coach before any deeper host edit (**DL-747** shared-component rule). |
| **JR4** | Help `server/help_reference/options-lab-heatmap-term-mass.md` **and** member guide at **GC6**, after the view works. Filename uses **term-mass**, not a vendor string. Concierge whitelist follows Help law. |
| **JR5** | Hotel goldens **before** `gexCal.ts` exists. A golden computed by the implementation tests nothing. |
| **JR6** | Spec filename stays. Content row v0.1.1 records Term Mass. Hash is whole-file, in DL, not in the Spec. |
| **JR7** | Reviews and gates → **GROK ADVISOR via Coach**. GBH does not self-review the spec. |
| **JR8** | **Isolation (DL-539 / DL-747).** `AGENTS.md` still names LIM · QFRIC · XS · PPL as active product trees. This plan **lands** now. **GC1 does not fire** until `GC0-W0.md` is GO **and** that stamp either (a) adds Term Mass / GBH to the AGENTS.md current-state table **or** (b) records **three successive Coach OKs** to touch heatmap files. One “write the bench plan” is not three OKs and is not GO. |

---

## 4. Roster & seating

| Callsign | Role |
|----------|------|
| **Coach** | GC0-0 GO · OD-GC1…GC5 · JR* · ship/no-ship · Term Mass name (already given) |
| **Juliet** | Board · seeds · DAG · isolation · ADVISOR routing |
| **India** | Spec integrity · HM1 pack tension · live parent · hash · L* still provisional until stamp |
| **Hotel** | Sign convention · NET / profile / peak goldens · no magnet/pin/air as labels · Term Mass ≠ true dealer mass |
| **Charlie** | `gexCal.ts` · pack join · sibling panel · registry append · flag |
| **Echo** | Split pane · cyan/magenta · gold peak · compact `$` · Term Mass in the switcher (string is Coach’s) |
| **Tango** | Honesty line · AT-GC7 / forbidden vocab · empty-state copy · Term Mass does not read as a signal |
| **Kilo** | AT-GC1…14 · fake-pack · frozen `gex` / LIM byte-identical · vocab grep |
| **Delta** | Phase gates ternary. Reviews to ADVISOR via Coach |
| **Lima** | DL GO + sha1 · Arch 29 · AGENTS pointer · help |
| **Mike** | Client-only; no new trust boundary. Flag is not a secret |
| **Foxtrot** | Deploy only if Coach asks (usually N/A) |
| **GROK ADVISOR** | Spec and gate reviews, via Coach |

| Seat | Rule |
|------|------|
| **S1** | Juliet owns DAG · NX · isolation |
| **S2** | India Spec / pack architecture |
| **S3** | Charlie pack + compute + sibling panel |
| **S4** | Hotel math golden |
| **S5** | Echo HIG (diverging, not valence-as-trade) |
| **S6** | Tango observation-only · Term Mass |
| **S7** | Kilo AT-GC* |
| **S8** | Delta all gates |
| **S9** | Lima DL + hash |
| **S10** | Seeds on disk before phase gate |

---

## 5. Sacred invariants (this program)

1. No MSC heatmap code. No vendor name in chrome, ids, or help.  
2. **OPF-held dual-side chain only** (DL-309). One underlier. No SPY→SPX cross-fill.  
3. Pure template compute (HM6). Pack attach is interest, not per-cell Massive.  
4. Template / value-mode switch among loaded books = **zero Massive**.  
5. GEX formula is **existing** `Γ·OI·S²`. Do not duplicate. Do not port `gamma × OI × 100`.  
6. No volume.  
7. Never fake N columns from one book. Empty pack is a **named** state.  
8. Invalid cells are blank, not silent zeros, and do not paint.  
9. Peak is largest \|mass\| in the window — not a trade cue.  
10. **Term Mass** is the picker string. HM12 still labels **Chain GEX (estimate)**.  
11. Frozen `gex` / LIM / AF / Width Fit byte-identical on fixture.  
12. Time Machine owns replay.  
13. Shared Labs host changes only through Coach.  
14. VPS* / VPSB* / SADEV* / VP / volume-profile are **out**.  
15. Delta ternary; Coach overrule needs DL.  
16. Docs parity at GC6.  
17. L1–L12 lock at GC0-0 (L4 already locked).  
18. GC1 does not fire without `GC0-W0.md` GO **and** JR8.  
19. StudioTwo only. Never `git add -A`. Do not stop `:3000` / `:4000`.  
20. Conflict or missing dependency: **STOP and report to Coach**.

---

## 6. Technical design (implementers)

### 6.1 Expected files

| Path | Action |
|------|--------|
| `web/lib/options-lab/templates/gexCal.ts` | **New** — pack → grid, NET, profile, peak. Calls `pricing.ts`. |
| `web/lib/options-lab/templates/gexCal.test.ts` | AT-GC1,2,4,5,8,9,10,13 |
| `web/lib/options-lab/templates/gexCal.vocab.test.ts` | AT-GC7 grep |
| `web/lib/options-lab/templates/types.ts` | `TemplateLayout` += `"matrix-profile"` |
| `web/lib/options-lab/templates/registry.ts` | **Append** `gex-cal`. Do not reorder frozen entries. Switcher visibility gated (JR2). |
| `web/components/options-lab/HeatmapGexCalendar.tsx` | **New** — split grid + profile + NET footer |
| `web/components/options-lab/HeatmapChainPanel.tsx` | `layout === "matrix-profile"` branch **only** (Coach) |
| Flag / config | JR2 — named at GC1, fail-loud |
| Spec / Arch / DL / help | India · Lima at GC0 / GC6 |

**Do not** dump calendar math into `gex.ts`. Frozen profile stays. First-principles: a pure module, one call site.

### 6.2 Pack (GC1) — the real prerequisite

Today `useOptionChainBus` registers **one** interest `chain:{symbol}:{expiration}:w{wings}`. The strip already **lists** N expirations. Term Mass columns **are** those expirations.

**Lawful join (OD-GC1 rec):** when the template is active (flag on), register interest for each **visible** strip expiry and hold N `ChainContext` books in `GexCalPack`. Hydrate-if-empty per book (HM4). No per-cell Massive.

```
GexCalPack {
  symbol, wings, spot,
  visibleExpirations: string[]     // YYYY-MM-DD, near-dated first
  books: Map<expiration, ChainContext>
}
```

**India GC0-1 must quote as-built:** whether OPF already publishes those books when interest is registered, or whether Heatmap today never asks. That quote is the pack design. If interest-for-N is missing, **STOP and report** — do not fake columns, do not open a second Massive client.

One genuine book → one column (AT-GC1). Zero books / flag on and pack missing → named empty state (AT-GC8). Relabel one book as N dates → refuse (AT-GC9).

### 6.3 Compute (GC2)

Pure `(pack, params) → { rows, columns, cells, netFooter, profile, peakStrike }`.

For each visible expiry E and listed strike K:

- `gex_net` (default) = `gexNet(book_E, K)` — both sides required (AT-HM13).  
- `gex_abs` / `gex_all` already in `ValueModeId`; do not add a fourth mode.  
- Invalid → `valid: false`, `display: null`.  
- `display` = compact currency of the **raw** `gex_v1` value (**GC16**). Do not reuse frozen `GEX_DISPLAY_DIV` for this chrome. AT-GC1 compares **values**, not strings.

NET(E) = sum of valid cells in the column.  
bar(K) = sum of valid cells at K across visible columns.  
Peak = argmax \|bar\|; ties → lowest strike (deterministic).

Spot row: listed strike nearest live / TM spot (GC8). Product-key bind.

### 6.4 Chrome (GC3)

```
┌─────────────────────────────┬──────────────┐
│  grid  (strikes × expiries) │ profile bars │
│  high strike at top         │ same Y       │
│  near-dated left            │ gold = peak  │
├─────────────────────────────┴──────────────┤
│  NET footer (sticky, per column)           │
└────────────────────────────────────────────┘
```

Grid ~60–70% · profile ~30–40%. Same strike scroll. Spot gutter on both.  
Cyan negative · near-black zero · magenta positive. Gold outline on peak row; gold fill on peak bar.  
Tooltip: strike, expiration, net, call GEX, put GEX, OI if on the row, column `asOf`. No support/resistance.  
Honesty line visible without a disclaimer wall.

Empty state: named, calm — pack not available — not “the app is broken.”

### 6.5 Switcher (GC4)

Registry append after frozen `gex` / `lim`. Label **Term Mass**.  
Flag off → **no** switcher row (a row that renders nothing is a bug report).  
HM21: unknown `templateId` ignored; after GO, `gex-cal` restores in this tab if still listed.

### 6.6 Sequence

```text
strip listed expirations
  → interest per visible E          // GC1; HM2
  → GexCalPack
  → gexCal.ts
  → HeatmapGexCalendar
```

Expiration / template / value-mode change does **not** open a new Massive path beyond interest attach.

### 6.7 Hotel goldens (minimum six — before `gexCal.ts`)

Hand-recorded. A golden computed by the implementation tests nothing.

| # | Fixture | Must record by hand |
|---|---------|---------------------|
| 1 | One expiry, both sides present | per-strike `gexNet` matches frozen `gex` profile values |
| 2 | Two expiries | NET(E), bar(K), peak strike |
| 3 | Missing put at one (K,E) | that cell invalid; NET omits it |
| 4 | All-negative 0DTE, mixed later | cyan 0DTE column; profile sign = visible sum |
| 5 | Actual zero net | display `$0` / `$0K`, not blank |
| 6 | Empty pack | no cells; named empty; no painted zeros |

---

## 7. Phase DAG

```text
Critical path:

GC0 ──► GC1 ──► GC2 ──► GC3 ──► GC4 ──► GC5 ──► GC6
                      │
                      └── GC3 chrome may start against GC2 fixtures;
                          pack attach is GC1 (do not draw fake columns)

Off path (never drawn into GC5):

ME    Multi-expiry structure templates     — other spec; do not convene
MEXP  Collector archive                    — not the live pack
TM    Time Machine replay join             — later packet; same template
VP    VPS* / SADEV* / volume-profile       — other instances
LIM   LIM geometry                         — sibling; do not edit
```

| Phase | Name | Depends | Exit |
|-------|------|---------|------|
| **GC0** | Spec GO · OD-GC* · JR* · goldens · seeds · hash | — | Coach GC0-0 |
| **GC1** | Pack type + strip attach + fake-pack refusal | GC0-0 + JR8 | GC1-G |
| **GC2** | Pure `gexCal.ts` | GC1 | GC2-G |
| **GC3** | `matrix-profile` chrome | GC2 | GC3-G |
| **GC4** | Flagged switcher **Term Mass** | GC3 | GC4-G |
| **GC5** | AT-GC1…14 | GC1–4 | GC5-G |
| **GC6** | DL · Arch 29 · help · close | GC5 | GC6-G · Coach close |

**GC0-G + GC0-0 block all product code.** GC1 is the first file-touching implementation phase. **JR8** additionally blocks GC1 until three OKs or AGENTS.md reassignment.

---

## 8. Phases, seeds, gates

Seeds live under [`agents/p-options-lab-heatmap-gex-calendar/seeds/`](../agents/p-options-lab-heatmap-gex-calendar/seeds/). Juliet writes them in GC0. Do not invent a parallel tree under `p-options-lab-heatmap-gex-cal/` (that folder is a seating duplicate; **DL-747** board wins).

### Phase GC0 — Spec GO + board lock

| Seed | Agent | Intent |
|------|-------|--------|
| **GC0-1** | India | Spec v0.1 / v0.1.1 Term Mass · HM1 pack tension named · live parent `…-v0_2.md` rev v0.2.4 · L* PROVISIONAL except L4 · sha1 procedure · quote as-built one-interest bus |
| **GC0-2** | Hotel | Six goldens (§6.7) · dealer-sign caveat · Term Mass ≠ true dealer GEX · no tape claim · OD-GC3 gold-only |
| **GC0-3** | Echo | Split-pane IA · cyan/magenta · gold peak · compact `$` · picker string **Term Mass** (Coach; do not rename) |
| **GC0-4** | Tango | Honesty line · forbidden vocab · empty-state copy · Term Mass observation-only |
| **GC0-5** | Charlie | Feasibility: pack join of strip expirations · `gexCal.ts` · sibling panel · flag seam; no `gex.ts` rewrite |
| **GC0-6** | Mike | Client-only; no new secrets / endpoints / trust boundary |
| **GC0-7** | Delta | AT-GC1…14 ownership matrix; ternary plan; gate names **GC\*-G** only |
| **GC0-8** | Juliet | Seeds on disk; LIM / AF / WF / VP / ME isolation; **JR8** three-OK line on the token |
| **GC0-9** | Lima | DL draft: GO · OD-GC1…GC5 · Term Mass · sha1 procedure · Arch 29 outline |
| **GC0-G** | Delta | All GC0-* done; OD + JR table ready; goldens on disk; seeds on disk. Reviews to ADVISOR via Coach |
| **GC0-0** | Coach | Stamp [`agents/go/GC0-W0.md`](../agents/go/GC0-W0.md) **after** GC0-G. OD-GC1…GC5. JR1–8. Spec sha1 → DL. Active-program / three-OK line. |

### Phase GC1 — Pack

| Seed | Agent | Intent |
|------|-------|--------|
| **GC1-0** | Charlie · India | `GexCalPack`; attach visible strip expirations; fail loud; no fake columns |
| **GC1-1** | Kilo | AT-GC1 (one book → one column) · AT-GC8 · AT-GC9 |
| **GC1-G** | Delta · India · Kilo | Pack honest; one-expiry fixture green; fake-pack refused |

### Phase GC2 — Pure calculation

| Seed | Agent | Intent |
|------|-------|--------|
| **GC2-0** | Hotel · Charlie | `gexCal.ts` + types; call `pricing.ts` only |
| **GC2-1** | Kilo | AT-GC2,4,5,10,13 |
| **GC2-2** | Hotel | Values match hand goldens; match frozen `gexNet` on one-expiry fixture |
| **GC2-G** | Delta · Hotel · Kilo | Compute green; frozen `gex` / LIM byte-identical |

### Phase GC3 — Surface

| Seed | Agent | Intent |
|------|-------|--------|
| **GC3-0** | Echo · Charlie | `HeatmapGexCalendar.tsx`; split; spot gutter; NET sticky |
| **GC3-1** | Tango · Charlie | Honesty line; empty state; vocab grep AT-GC7 |
| **GC3-2** | Charlie | Color assign + sticky hysteresis AT-GC11; gold peak AT-GC3 |
| **GC3-G** | Delta · Echo · Tango | Member-usable matrix-profile; no forbidden vocab; host branch only |

### Phase GC4 — Switcher

| Seed | Agent | Intent |
|------|-------|--------|
| **GC4-0** | Charlie | Registry append; flag; label **Term Mass**; no reorder |
| **GC4-1** | Kilo | AT-GC6 · AT-GC12 · AT-GC14 · HM21 unknown-id ignore when flag off |
| **GC4-G** | Delta | Switcher shows Term Mass **only** when flag/GO allows; frozen templates unchanged |

### Phase GC5 — Acceptance pack

| Seed | Agent | Intent |
|------|-------|--------|
| **GC5-0** | Kilo | AT-GC1…14 on disk with command evidence |
| **GC5-1** | Delta · Kilo | Zero-fetch characterization |
| **GC5-G** | Delta | Full AT pack PASS |

### Phase GC6 — Docs close

| Seed | Agent | Intent |
|------|-------|--------|
| **GC6-0** | Lima | DL · Arch 29 as-built row · AGENTS pointer · help / member guide (JR4) |
| **GC6-1** | India | Parent Templates catalog row for `gex-cal` / Term Mass if required; hash matches GO or new DL |
| **GC6-G** | Delta · Lima | Docs parity |

---

## 9. Characterization (GC5-G is this set)

Copy: [`agents/p-options-lab-heatmap-gex-calendar/characterization-list.md`](../agents/p-options-lab-heatmap-gex-calendar/characterization-list.md).

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

Hotel / India: no second pricer; no volume; no snap; no silent zero; no fake columns.

---

## 10. Out of this program

- MSC source, vendor, copy  
- Reopening LIM / Advanced Fly / Width Fit boards  
- ME structure templates  
- SSR-MEXP live-pack wait  
- Time Machine replay join (later; same `gex-cal`)  
- VPS* / VPSB* / SADEV* / VP stores / volume-profile  
- `AnalyzerPositionsList.tsx`  
- MiniTwo unless Coach asks  
- Green/red outliers · 3D · magnet/pin/air labels  
- Production switcher before GC0-0  

---

## 11. Status

Plan revision **v1.0**. Spec **v0.1 DRAFT** (Term Mass = OD-GC4 LOCKED).  

**Next:** fire **GC0-1…9** (read-only seats). **GC0-G**. Coach stamps **GC0-0** on `GC0-W0.md` (OD-GC1…GC5 · JR1–8 · JR8 three-OK). Then GC1.

Code is **blocked** until that stamp.

### Changelog

| Id | Note |
|----|------|
| **v1.0** | First Juliet decomposition of GEX Calendar Spec v0.1. Coach names picker **Term Mass**. OD-GC4 LOCKED. OD-GC1…GC3 · OD-GC5 dispose at GC0-0. |

---

## 12. First actions (Juliet)

1. This plan + board pointer bump + characterization list + `GC0-W0.md` (unstamped) land. Spec content row records Term Mass.  
2. Coach reads §3 (OD-GC1…GC5) and the token. OD-GC4 is already **Term Mass**.  
3. Fire GC0-1 India **in parallel** with GC0-2…9.  
4. Do **not** open `gexCal.ts` until GC0-0 **and** JR8 is satisfied.

**One-line law**

Heatmap template `gex-cal`, picker **Term Mass**: strike × listed-expiration matrix of frozen `gex_v1`, companion profile, NET footer, cyan/magenta, gold peak. Fail loud if the pack is missing. Do not touch frozen GEX or LIM. Do not invent a second replay. Tests first.
