# Template Runner Stream Book — Full Agent Bench Plan v1.0

**Date:** 2026-08-24  
**Plan revision:** **v1.0.4** — Advisor v1.0.3 verification (clean fold). SB-13/SB-14: Hotel confirms median ∈ [0,1] and min-stability. Filename finding **withdrawn**. Reviews: [`reviews/SB-advisor-v1.0.2.md`](../agents/p-template-runner-stream-book/reviews/SB-advisor-v1.0.2.md) · [`reviews/SB-advisor-v1.0.3.md`](../agents/p-template-runner-stream-book/reviews/SB-advisor-v1.0.3.md). Nothing of Coach’s is dropped.  
**Canonical filename (this repo, landed):** `docs/Template-Runner-Stream-Book-Full-Agent-Bench-Plan-v1.0.md` (**dot** `v1.0`, same as Width Fit `v1.1.md` and HI Spec `v1.0.md` in this tree). Do not rename for an underscore copy. Delta reads **this path**.  
**Owner (orchestration):** Juliet  
**Authority:** Coach (GO / ship)  
**W0 artifact:** [`agents/go/TRSB-W0.md`](../agents/go/TRSB-W0.md) — **not stamped**. Delta reads **this file**, not chat (**DL-328**).  
**Board:** [`agents/p-template-runner-stream-book/`](../agents/p-template-runner-stream-book/)  
**Governance:** [`agents/bench/doctrine.md`](../agents/bench/doctrine.md) · [`AGENTS.md`](../AGENTS.md)  
**HIG:** Echo owns chrome. Charlie does not invent. Human Interface Spec v1.0 + this plan **§4**.

**Coach intent (verbatim in meaning, nothing dropped):**

1. Width Fit tile color as a **moving average** of the last **10 / 20 / 50 / 100** intervals, via a **slider that detents** on those four values. Separate from real time; the member **sets that mode**.  
2. Caching those intervals belongs at the **Template Runner**, not inside a template.  
3. The cache is **system-wide**, available for **any template** provisioned. Average is one use; another is a **scrubber to replay previous seconds and minutes**.  
4. Store on the **client** so it **relieves the server**. **Limit** how much a client stores so it does not burden that client. A **member-expressed limit** on how much cache the client will allow is a feature.  
5. Ranking sheet looks like [`agents/p-template-runner-stream-book/evidence/width-fit-ui.png`](../agents/p-template-runner-stream-book/evidence/width-fit-ui.png) — hero width, ranked bars, best / runner-up / confidence. **Not a replacement for the heatmap.**  
6. *“It should be possible to create any interface. The information is all there.”*  
7. **“I want the MA Heatmap as well as the Ranking view.”** This packet ships **both** sinks: Average (and Live) **K×w heatmap**, and the ranking sheet, over the same book + Width Fit aggregates.

Earlier informal GO, then **Hold**, then this bench. **SB0-0 is the code GO.** Informal GO does not fire SB1.

---

## Primary law

| Doc | Path | Status |
|-----|------|--------|
| **Template Runner Spec** | [`Specs/FatTail-Labs-Template-Runner-Spec-v0_1.md`](../Specs/FatTail-Labs-Template-Runner-Spec-v0_1.md) | **v0.1.2** as-built TR-P1…P3. This program adds **TR14** (stream book). **TR13** is already IKI host chrome (**IKI-P3**) — **do not reuse that number**. |
| Width Fit Spec v0.1.1 | [`Specs/FatTail-Labs-Options-Lab-Heatmap-Width-Fit-Spec-v0_1.md`](../Specs/FatTail-Labs-Options-Lab-Heatmap-Width-Fit-Spec-v0_1.md) | **BUILD AUTHORITY** · **WF4** restated: Average / Replay are **runner views**, not template state |
| Heatmap Templates v0.2 | [`Specs/FatTail-Labs-Options-Lab-Heatmap-Templates-Spec-v0_2.md`](../Specs/FatTail-Labs-Options-Lab-Heatmap-Templates-Spec-v0_2.md) | HM6 purity · HM14 HIG · §6 inspector |
| **Human Interface Spec v1.0** | [`Specs/FatTail-Labs-Human-Interface-Spec-v1.0.md`](../Specs/FatTail-Labs-Human-Interface-Spec-v1.0.md) | **Binding for all chrome in this program** |
| OPF Truth · DL-309 | [`Specs/FatTail-Labs-Options-Lab-OPF-Truth-and-Elegant-Failure-Doctrine-v1.1.md`](../Specs/FatTail-Labs-Options-Lab-OPF-Truth-and-Elegant-Failure-Doctrine-v1.1.md) | No invented strikes; named states |
| Arch 28 / 34 | Market Bus · Redis vs subscribe plane | One WS; no client Massive |
| Arch 31 SSR | Structure Surface Replay | **Not this board** |
| Parent boards | Width Fit · Template Runner TR-P* · IKI-P3 | Consume; do not reopen |

Specialists execute **only** via seeds. Coordination only through **Coach** or **Juliet**.  
Delta gates: **PASS / FAIL / BLOCKED** — **never waived**.  
**Every chrome seed requires Echo before Charlie implements, and Echo review before that phase’s Delta gate.** Tango sits on copy and cognitive load.

---

## 0. Product decisions (Coach — lock at SB0-0)

**Advisor SB-1 (doctrine):** *“Silent = A” is forbidden.* Juliet’s A column is a **recommendation only**. **SB0-0 cannot be stamped while any open L is unanswered.** Each open L carries an explicit Coach **A** or **B** (or C where listed) on `TRSB-W0.md`. Silence is undirected, not an Accept.

### 0.1 Already said by Coach (locked — not forks)

| ID | Lock |
|----|------|
| **L1** | Cache SoR = **client** runner stream book (relieves the server) |
| **L2** | Available for **any** provisioned template |
| **L8** | **Slider that detents** (not a silent swap to SegmentedControl) |
| **L9** | Member **sets** Average; default remains Live |
| **L19** | **MA heatmap and ranking view** (both) |

### 0.2 Open — Coach ticks A or B on the stamp (A = Juliet rec)

| ID | Decision | A (recommendation) | B |
|----|----------|-------------------|---|
| **L3** | Member budget stops | **4 · 8 · 16 · 32 MiB**, default **8**, floor 4, ceiling 32 — **re-derived after SB0-5 byte measure** if 100 intervals cannot fit | Other set after the measure |
| **L4** | Snapshots | **RAM this tab**; preference in `localStorage` | IndexedDB |
| **L5** | Record when | **Whenever subscribed** | Only after Average/Scrubber on |
| **L6** | Partial Average | **Mean of available n**, show `n of W` | WAITING until `n === W` |
| **L7** | First ship | **Book + budget + both Width Fit sinks + Average**, then Scrubber | All in one packet |
| **L10** | Inapplicable chrome | **Hide like Heatmap** | Disable-don’t-hide |
| **L20** | How both appear | **SegmentedControl `Heatmap` \| `Ranking`**. Default **Heatmap** | B: stacked. C: default Ranking |
| **L22** | Later interfaces | Allowed as further Echo sinks (TR9), not this packet | Block |
| **L23** | What Coach’s **interval** is | **A: distinct `content_hash`** (repeats collapse — change-weighted) | **B: capture tick** (repeats count — time-weighted). Advisor SB-6: plan must not choose silently. |
| **L24** | **Confidence** on the ranking sheet | **A: observation of** (i) valid \(n\) on #1 and #2 vs `min_valid_n`, (ii) #1−#2 median gap, (iii) #1 stability — High / Moderate / Low named from those three, Hotel writes the cut in SB0-2 | B: Coach names a different L21 mapping |
| **L25** | Evict which key when over budget | **A: global oldest** | **B: viewed `symbol\|expiration` protected first** |
| **L26** | DL-539 | **See §0.3** — not Juliet’s to grant | |

### 0.3 DL-539 (Advisor SB-2) — Coach only

The allowlist writes `HeatmapChainPanel.tsx` and `HeatmapControlsColumn.tsx` (Options Lab / Heatmap tree). **DL-539:** existing work is frozen; three successive OKs on the GO token, or Coach declares these files in-program. **This plan is not the exemption.**

SB0-0 records **one**:

- [ ] Three successive OKs for those two files (and `web/components/ui/DetentSlider.tsx`) **on `TRSB-W0.md`**, or  
- [ ] Coach written grant: TRSB program includes those paths.

Until one box is ticked, **SB1 does not start.** Juliet does not seed implementation into a frozen tree.

**L-law (not forks):**

| ID | Law |
|----|-----|
| **L11** | Templates stay **pure** (TR5 / WF4 / HM6). They do not read the book. |
| **L12** | **Drop-oldest** (per L25) until `bytesUsed ≤ min(memberBudget, platformCeiling)`. Never silent growth. Unit: **1 budget “MB” = 1 MiB (2²⁰ bytes)** — member caption says MB; law and clamps are MiB. |
| **L13** | Same `content_hash` never adds a second slot (fill-in updates). What *counts* as an Average **interval** is **L23** (Coach). No interpolated ticks (DL-309). |
| **L14** | **Heatmap Average:** mean of **`colorT`**, then existing `widthFitFill`. **Do not** re-normalize / re-rank that mean against today’s min/max (Advisor SB-4). **Ranking Average:** arithmetic mean of each width’s **per-width median** over gens in the window that have a valid median. Display score = `round(mean × 100)` clamped 0–100 **because that median is a unit-interval fit score** (as-built `assignColors` scored ∈ [0,1]; Spec §7 footer median of those scores). **Hotel SB0-2 confirms the range** (Advisor SB-13) — if it were ever not [0,1], ×100 is forbidden until a named map exists. **n** on a ranked width = count of those valid gens. **Stability** for Confidence = **min** of per-gen stability in the window. That min is **Hotel’s conservative reading at SB0-2** (Advisor SB-14), not a quiet Juliet law. Not RGB. Not a second formula. Gaps skipped, not 0. |
| **L15** | Scrubber seeks **nearest stored generation** by `asOf` / `receivedAt`. Label **Replay**, not Live. |
| **L16** | Do **not** raise `FLY_HISTORY_DEPTH` (debit lag, depth 4). |
| **L17** | **TR14** is this law number. **TR13** remains IKI-P3 host chrome. |
| **L18** | Observation-only copy. No optimizer / signal / forecast / pin. Mock words (Ranking, Best, Higher = better) **stay until Coach throws them out** (doctrine §11). Tango may object beside the mock. |
| **L21** | Information SoR for the ranking sheet = existing Width Fit **per-width median**, \(n\), stability, components (Live, Average per L14, or Replay). **No second ranking formula.** **Confidence** is L24 (must map to these fields — never an undefined number). |

---

## 1. Mission

```text
Market Bus (one WS)
  → Runner subscribe (live held chain)
  → Stream book.push  (client RAM ≤ member budget)
       ├── Live      → current gen → template.compute
       ├── Average   → last W gens → mean colorT (Width Fit first)
       └── Scrubber  → seek asOf → template.compute (any template)
  → render sinks (rail + **Heatmap** and **Ranking**; later any Echo interface)
```

Relieve the **server**. Bound the **client**. Honor **Apple HIG**. Width Fit this version = **MA heatmap and ranking sheet**.

**First smoke after SB1 + SB2 + SB3 + SB4** (book is filled by SB4 push; Kilo may use a **synthetic book** at SB3 and must say so in SB3-2):

1a. Live Width Fit **heatmap** with a full book is **byte-identical** to empty-book Live on the same current gen (Advisor SB-4).  
1b. Heatmap \| Ranking switcher; both panes work on Live and on Average.  
2a. Average heatmap: mean `colorT` → `widthFitFill` with **no** re-rank vs today’s min/max; detent 10 / 20 / 50 / 100; `n of W` if short.  
2b. Ranking Average: mean of per-width **median**; mock structure; **no second formula**.  
3. Cache slider only 4 / 8 / 16 / 32; readout `used / budget · n gens · span`.  
4. At budget: **Cache at your limit**; Live heatmap still paints.  
5. Zero extra Massive / extra WS on mode, sink, budget, or window change.  
6. Hit targets ≥ 44 pt; tokens; reduced-motion.  
7. Mock copy on Ranking unless Coach threw it out; no new forecast language.

---

## 2. As-built honesty

### 2.1 Keep

| Area | Path |
|------|------|
| Runner registry / `run` purity guard | `web/lib/runner/{registry,run}.ts` |
| Runner host session | `web/lib/runner/host.ts` |
| Subscribe / one MarketSocket | `web/lib/runner/subscribe.ts` · `web/lib/market/MarketSocket.ts` |
| Width Fit compute + fill | `web/lib/options-lab/templates/widthFit.ts` — **do not put MA here** |
| Heatmap inspector kit | `inspectorChrome` · `HeatmapControlsColumn.tsx` (rail only) |
| Width Fit footer stats | per-width median · \(n\) · stability — **information for the ranking sink** |
| AF debit history depth 4 | `flySurfacePipeline.ts` `FLY_HISTORY_DEPTH` — **untouched** |

### 2.2 Build (this program)

| Gap | Phase |
|-----|--------|
| TR14 in Runner spec + WF4 restatement | **SB0** |
| Echo HIG labels + ranking-sheet sink (`echo-labels.md` · mock PNG) | **SB0** · **SB3** |
| `streamBook.ts` + measured bytes + budget evict | **SB1** |
| `DetentSlider` kit primitive + HI Spec §6.2 row (Advisor SB-3) | **SB0** Echo/Lima · **SB2** Charlie |
| Cache budget chrome (HIG detent slider) | **SB2** |
| Width Fit heatmap **and** ranking + Average | **SB3** |
| Push from HeatmapChainPanel + runner host | **SB4** |
| Scrubber chrome (any template) | **SB5** (after L7 A) |
| DL · help · member guide · AGENTS | **SB6** |

### 2.3 Non-phases (NX)

NX1 second Massive / extra WS · NX2 server interval archive · NX3 Redis client book · NX4 SSR / parquet · NX5 interpolate unlisted ticks · NX6 RGB color mix · NX7 MA inside `widthFit.ts` · NX8 raise `FLY_HISTORY_DEPTH` · NX9 MiniTwo unless asked · NX10 reopen IKI-P3 TR13 · NX11 IndexedDB in v1 · NX12 traffic-light bars · NX13 new token set · NX14 a **second** ranking formula beside Width Fit aggregates · NX15 dropping either the MA heatmap or the ranking sheet.

---

## 3. Technical design (implementers)

### 3.1 Stream book

`web/lib/runner/streamBook.ts` — system-wide, not under `options-lab/templates/`.

```
setBudgetBytes(n)              // clamp [4 MiB, 32 MiB]
push(interestKey, heldClone, meta)  // idempotent on content_hash; then evict
bytesUsed() / budgetBytes() / size() / span()
atHash / atTime / window(n)
clear(key)
```

**Interest key:** `symbol|expiration` (dual-side snapshot; side is view filter).  
**Slot:** contracts clone + spot + `content_hash` + `asOf` + `receivedAt` + `epoch_quality` + `stale`.  
**Bytes:** measured serialized size (1 MB on the slider = 2²⁰ bytes). Optional derived memo is **per-slot `colorT` + per-width median**, keyed `(content_hash, weightsFingerprint)` — a new gen costs **one** template run, not a hundred (Advisor SB-5). Memo counts toward the **same** budget.  
**Evict:** per **L25** (Coach). One gen larger than budget: keep that gen only; named **Cache oversize generation**.  
**Seam:** symbol / expiration / unsubscribe. **Weights do not seam the book** (Advisor SB-8); they invalidate the memo only.

`run.ts` I/O trap **unchanged**. Host: `push` then select stream(s) then `run()`.

### 3.2 Average (one formula, two sinks)

**No “and/or.”** (Advisor SB-7.)

| Sink | Over the last W intervals (L23) |
|------|----------------------------------|
| **Heatmap** | Mean of finite per-cell `colorT` → `widthFitFill(mean)`. Do **not** min/max against the current gen. All-null cell → dark / invalid. |
| **Ranking** | For each width: mean of that width’s **median** on gens where median is valid. Score = `round(mean×100)`. Bar length = score/100. Rank descending. Widths with no valid sample are not a fake #1. |

**n** (ranked width) = count of gens with a valid median.  
**Stability** for L24 = **min** of those gens’ per-width stability.  
Memo: `(hash, weightsFingerprint)` → `{ colorT[][], widthMedian[] }`. Miss → one `run(width-fit)` for that hash.

### 3.3 Scrubber (SB5)

Thumb → nearest gen → `run(current template, current controls, that stream)`. Subscribe continues to `push`. Leaving mode → Live. Copy: Replay.

### 3.4 Files (when SB0-0)

| Path | Action |
|------|--------|
| `web/lib/runner/streamBook.ts` | **New** |
| `web/lib/runner/__tests__/stream-book.test.ts` | **New** |
| `web/lib/runner/templates/width-fit.ts` | Register wrap; no compute fork |
| `web/lib/runner/host.ts` | push + view select |
| `web/components/ui/DetentSlider.tsx` + test | **New kit primitive** (HI §6.2; Advisor SB-3). Required **before** chrome. |
| `Specs/FatTail-Labs-Human-Interface-Spec-v1.0.md` | Echo/Lima: add `DetentSlider` to the closed enum (patch version or DL — they pick) |
| `HeatmapChainPanel.tsx` | push on `bus.hash`; Width Fit pane = **Heatmap or Ranking**. **DL-539: only after §0.3 tick.** |
| `web/components/options-lab/WidthFitRanking.tsx` (name Echo/Charlie) | New sink: mock layout, tokens |
| `HeatmapControlsColumn.tsx` | Cache + Heatmap\|Ranking + Live\|Average **per Echo labels**. **DL-539: only after §0.3 tick.** |
| `web/components/ui/SegmentedControl.tsx` | **Keep** — already landed (`role="radiogroup"`). Use it; do not fork a rail-only segmented. |
| Runner spec | **TR14** |
| Width Fit spec | WF4 sentence |
| help + member guide | Lima SB6 |

Do not edit `widthFit.ts` compute except exporting `widthFitFill` if the host remaps.

---

## 4. Apple HIG (Echo — binding)

**Owner:** Echo. **Implementer:** Charlie from `echo-labels.md` + this section. **Review:** Echo before each chrome Delta gate. **Copy:** Tango.

Normative: Human Interface Spec v1.0 §2 (clarity, deference, depth, consistency, feedback, direct manipulation, user control, a11y) · §4 tokens · §5 no emoji chrome · §6 primitives · HM14 · hit **≥ 44×44 pt** · `prefers-reduced-motion`.

### 4.0 Two sinks (Coach: heatmap **and** ranking)

| Sink | What it is |
|------|------------|
| **Heatmap** | Existing Width Fit K×w color matrix. In Average: MA of `colorT` (L14). |
| **Ranking** | Coach mock PNG — hero width, ranked bars, three cards, footnote. |

Same book, same Width Fit aggregates, same Live \| Average (and later Replay). SegmentedControl **Heatmap \| Ranking** (L20 A) chooses which fills the right pane. Default Heatmap.

Echo labels: [`echo-labels.md`](../agents/p-template-runner-stream-book/echo-labels.md). Mock: [`evidence/width-fit-ui.png`](../agents/p-template-runner-stream-book/evidence/width-fit-ui.png).

*“Any interface”* = further Echo sinks later. This packet ships these two.

### 4.1 Placement (deference)

**Rail** (left): template, weights, **Heatmap \| Ranking**, **Live \| Average**, Average window (if Average), cache, chain. Two segmented rows is HIG-legal (≤5 segments each). Do not merge into one three-way control (time × sink is two axes).

**View** (right): the selected sink. No overlay HUD.

**Hide like Heatmap** (L10 A): Cache visible. Average window **only** when Average. Ranking-only copy **only** on the Ranking pane.

### 4.2 Mode — SegmentedControl

**Live | Average** (Width Fit inspector). Use landed `web/components/ui/SegmentedControl.tsx` (`role="radiogroup"` — not `aria-pressed` as a toggle; Advisor SB-12). Default Live. Switching to Live immediately shows the current generation (no fade that looks like a signal).

Do not combine Live / Average / Replay as three segments in SB3. Replay is SB5; Echo may then promote a third segment **or** a separate Replay control — **SB0-3 / SB5-0 decide**; Charlie does not guess.

### 4.3 Detent sliders (Coach: slider, not a silent segmented swap)

Two instances, **same primitive** (Echo names it `DetentSlider` in labels):

| Control | Stops | `aria-valuetext` |
|---------|-------|------------------|
| **Cache** | 4 · 8 · 16 · 32 (MB) | `8 megabytes` |
| **Average window** | 10 · 20 · 50 · 100 (intervals) | `20 intervals` |

HIG rules for this primitive:

1. Visual **track** + **thumb**; thumb hit target ≥ 44 pt (padding around a smaller knob is allowed).  
2. **Tick marks and numeric labels under the track** at every stop. The value is not mystery-thumb-only.  
3. `min=0 max=3 step=1` (four stops). Pointer/keyboard snaps to a stop — **no in-between values**.  
4. Tokens only: track `--color-fill`, fill to thumb `--color-tint`, labels `--color-label-secondary`, type `--text-caption` / `--text-subheadline`.  
5. Caption **above** the track (Cache / Average window), never placeholder-as-label.  
6. Keyboard: Left/Right, Home/End. Focus ring `--color-tint`.  
7. Reduced motion: thumb does not animate between stops.  
8. Not the Advanced Fly − / + RoC slider (that control stays hidden on Width Fit).

Echo **may** recommend L8 B (SegmentedControl) in SB0-3. Until Coach Override, Charlie implements the detent slider.

### 4.4 Cache honesty (caption, not a dashboard)

One caption line under the Cache slider, `--text-caption`, `--color-label-secondary`:

`5.2 / 8 MB · 47 gens · 1m 32s`

At cap: same line + **Cache at your limit** (`--color-label`, not destructive red unless oversize generation). Oversize generation: Banner `warning`, not a toast-only.

Live generation is **not** this meter. Do not flash the matrix when evicting.

### 4.5 Average window caption

`n of 20` when `n < W`. When `n === W`, omit the fraction (quiet). No progress bar that looks like a download.

### 4.6 Scrubber (SB5 — Echo draws before Charlie)

Playhead on a **time track** spanning the book’s `t0…t1`. Current `asOf` as `Replay · 14:32:08` (or Held clock the chain already uses). Snap to nearest generation. Returning to Live is a named control (segment or explicit Live), not a hidden click. Reduced motion: no kinetic scrub inertia required.

### 4.7 Color / motion

Heatmap tiles: existing Width Fit teal→amber (`widthFitFill`), including Average MA. Ranking bars: mock muted fill on a dark track — **not** debit red/green. `motion.fast`, or instant if reduced-motion.

### 4.8 Density / type

View pane uses HI type ramp. Hero score uses **`--text-title-1`** (Echo SB-12: no “large numeral” token — map, don’t invent). Ranking “cards” are **grouped surface rows** (`radius.md`, `elevation.1`), not HI §6.4 marketing `Card`. List rows ≥ 44 pt. Bars: muted fill that works in **light and dark** (HI §4.1).

### 4.9 Charlie forbidden without Echo

New z-layer, custom tooltip skin, emoji, hex outside tokens, `<input type=range>` without ticks/labels, hiding Live while Average is on, using RoC − / + for window or budget, a second ranking formula, Batman kicker on a non-Batman template.

---

## 5. Sacred invariants (this program)

1. No MSC. No client Massive. One MarketSocket.  
2. OPF-held dual-side only (DL-309). No invented strikes on Replay.  
3. Template purity (TR5 / HM6 / WF4).  
4. Client book only; member budget binds; drop-oldest.  
5. TR14 ≠ TR13.  
6. Observation-only. Invariant #8.  
7. HIG: tokens, ≥44 pt, Echo before chrome ship.  
8. Delta ternary. Docs parity at SB6.  
9. **DL-539:** this plan does **not** exempt itself. §0.3 must be ticked on `TRSB-W0.md` before any edit to Heatmap files or new `DetentSlider` kit (Advisor SB-2).

---

## 6. Phase DAG

```text
SB0 ──► SB1 ──► SB2 ──► SB3 ──► SB4 ──► SB6
                         │                ▲
                         └── SB5 ─────────┘  (after L7 A: Scrubber after Average)

SB0-G + SB0-0 block all code.
Echo labels (SB0-3) block SB2 / SB3 / SB5 Charlie.
```

| Phase | Name | Depends | Exit |
|-------|------|---------|------|
| **SB0** | Spec TR14 · ODs · Echo HIG · seeds | — | Coach **SB0-0** |
| **SB1** | `streamBook` + tests (no chrome) | SB0-0 | SB1-G |
| **SB2** | Cache budget chrome (HIG) | SB1 · Echo labels | SB2-G **Echo + Tango** |
| **SB3** | Width Fit **heatmap + ranking** + Average + window detent | SB2 | SB3-G **Echo + Tango** |
| **SB4** | Wire panel + runner host | SB1 · SB3 | SB4-G |
| **SB5** | Scrubber | SB4 · Echo SB5-0 | SB5-G **Echo + Tango** |
| **SB6** | DL · spec hash · help · guide | SB4 (SB5 if shipped) | SB6-G · Coach close |

If L7 B (one packet), SB5 is on the critical path before SB6.

---

## 7. Phases, seeds, gates

Seeds: [`agents/p-template-runner-stream-book/seeds/`](../agents/p-template-runner-stream-book/seeds/).

### SB0 — Spec GO + HIG lock

| Seed | Agent | Intent |
|------|-------|--------|
| **SB0-1** | India | TR14 on Runner spec (not TR13). WF4 restatement. Open L table **L3–L7, L10, L20, L22–L26**. Locked L1/L2/L8/L9/L19. Boundary vs SSR / FLY_HISTORY / IKI-P3. |
| **SB0-2** | Hotel | (1) **Median range:** as-built per-width median is a **unit-interval fit score** [0,1] so `round(mean×100)` is honest (SB-13). (2) **Min-over-window stability** is the conservative Confidence input — Hotel stamps that sentence (SB-14). (3) L24 cuts from \(n\), #1−#2 gap, that min stability. No interpolated tape. Average is not a forecast. |
| **SB0-3** | Echo | Stamp `echo-labels.md` + **add `DetentSlider` to HI kit** (SB-3, SB-12): Card composition for ranking; large numeral mapping; both color schemes; SegmentedControl = radio/tab not aria-pressed. |
| **SB0-4** | Tango | Caption copy; cognitive load of Heatmap\|Ranking + Live\|Average + window + cache; mock words kept unless Coach throws them out. |
| **SB0-5** | Charlie | Feasibility + **byte measure** (Advisor SB-5): serialize one SPX weekly dual-side held gen (full greeks); report bytes/gen and gens that fit in 8 MiB / 32 MiB at 10/20/50/100. Confirm `SegmentedControl` is landed (`web/components/ui/SegmentedControl.tsx`, `role="radiogroup"`). `DetentSlider` must live in `web/components/ui/`. No `widthFit.ts` MA. |
| **SB0-6** | Mike | Client RAM only; no new endpoint/secret; localStorage preference not a session-elevation; budget cannot be used to exfiltrate. |
| **SB0-7** | Delta | AT-SB* ownership; ternary; SB0-G name only. |
| **SB0-8** | Juliet | Seeds on disk (this board). |
| **SB0-9** | Lima | DL draft: TR14 · member budget · client-only · HIG · sha1 procedure. |
| **SB0-G** | Delta | SB0-* done; Echo labels exist; OD table ready. |
| **SB0-0** | Coach | Stamp `TRSB-W0.md`: **every open L ticked**; **§0.3 DL-539**; spec sha1. No silent A. |

### SB1 — Book (no chrome)

| Seed | Agent | Intent |
|------|-------|--------|
| **SB1-0** | Charlie | `streamBook.ts`: push, hash idempotence, measured bytes, evict, floor/ceiling. |
| **SB1-1** | Kilo | AT-SB1…7 (hash, budget, lower-slider evict, ceiling, oversize gen, window n, live independence). |
| **SB1-G** | Delta · Kilo | Bytes never exceed budget; no UI required. |

### SB2 — Cache chrome

| Seed | Agent | Intent |
|------|-------|--------|
| **SB2-0** | Echo · Charlie | DetentSlider Cache 4/8/16/32; caption; at-limit; persist preference. |
| **SB2-1** | Tango | Copy on the meter. |
| **SB2-G** | Delta · **Echo** · Tango | HIG: ticks, 44 pt, tokens, reduced-motion. |

### SB3 — Width Fit Average

| Seed | Agent | Intent |
|------|-------|--------|
| **SB3-0** | Echo · Charlie | Heatmap \| Ranking; Live \| Average; window detent; MA heatmap + ranking from same aggregates. |
| **SB3-1** | Charlie · Hotel | Heatmap: mean `colorT` → `widthFitFill` (no re-rank). Ranking: mean of per-width median → 0–100. Skip nulls. |
| **SB3-2** | Kilo | AT-SB7a/7b · 8a/8b · 9…12 · **AT-SB16**. Synthetic book allowed if SB4 push is not yet wired — say so. |
| **SB3-3** | Tango | Average captions; non-claim. |
| **SB3-G** | Delta · **Echo** · Tango · Hotel | Mode is explicit; colors honest; HIG. |

### SB4 — Wire hosts

| Seed | Agent | Intent |
|------|-------|--------|
| **SB4-0** | Charlie | HeatmapChainPanel `push` on hash; Average uses book; register `width-fit`. |
| **SB4-1** | Charlie | Runner `host.ts` same book (TR8). |
| **SB4-G** | Delta | Both hosts; one book; socket still 1. |

### SB5 — Scrubber

| Seed | Agent | Intent |
|------|-------|--------|
| **SB5-0** | Echo | Replay playhead IA (before code). |
| **SB5-1** | Charlie | `atTime` → `run` current template. |
| **SB5-2** | Tango · Kilo | Replay copy; nearest-gen only; AT-SB13…15. |
| **SB5-G** | Delta · **Echo** · Tango | Any template; not Live; no interpolation. |

### SB6 — Close

| Seed | Agent | Intent |
|------|-------|--------|
| **SB6-0** | Lima | DL · Arch 34/29 pointer · AGENTS · help · Width Fit member guide. |
| **SB6-1** | India | Spec hash vs GO; TR14 vs TR13 no collision. |
| **SB6-G** | Delta · Lima | Docs parity. |

---

## 8. Characterization (SB4-G / SB5-G)

| Id | Assert |
|----|--------|
| **AT-SB1** | Same `content_hash` does not add a slot; fill-in updates. |
| **AT-SB2** | After many pushes, `bytesUsed ≤ budget`. |
| **AT-SB3** | Lowering 16→4 MB evicts immediately to ≤ 4 MiB. |
| **AT-SB4** | Slider cannot select outside {4,8,16,32}. |
| **AT-SB5** | Platform ceiling 32 MiB cannot be exceeded. |
| **AT-SB6** | `window(10)` with 4 snaps returns 4. |
| **AT-SB7a** | Live **heatmap** with a full book matches empty-book Live on the same current gen (tile `colorT` / `bgCss` byte-identical). |
| **AT-SB7b** | Live **ranking** with a full book matches empty-book Live (same leading width / scores). |
| **AT-SB8a** | Average heatmap: mean `colorT` skips nulls; all-null cell → invalid/dark; **no** re-rank vs current min/max. |
| **AT-SB8b** | Average ranking: mean of per-width median skips nulls; all-null width → not ranked as a high score. |
| **AT-SB9** | Average window only {10,20,50,100}. |
| **AT-SB10** | Mode / budget / window change → **zero** extra Massive, still one WS. |
| **AT-SB11** | Symbol / expiration / unsubscribe **seams the book**. Weight change **invalidates the derived memo only** (book tape kept). |
| **AT-SB12** | Forbidden vocab absent (optimizer, signal, forecast, pin as claim). |
| **AT-SB13** | Scrubber nearest gen only; no synthetic contracts. |
| **AT-SB14** | Template switch on a scrubbed gen paints the **new** template. |
| **AT-SB15** | Replay label ≠ Live. |
| **AT-SB-HIG** | Heatmap \| Ranking switcher; ranking structure matches mock; Average heatmap still a matrix. Cache/window: ticks + labels, ≥44 pt, tokens, reduced-motion. Echo evidence. |
| **AT-SB16** | Ranking scores equal a documented map of Width Fit per-width median (or Average thereof). No parallel “efficiency” math. |

---

## 9. Copy (Tango — draft until SB0-4)

| Surface | Copy |
|---------|------|
| Segment (time) | Live · Average |
| Segment (sink) | Heatmap · Ranking |
| Cache | Cache |
| At limit | Cache at your limit |
| Oversize | This generation is larger than your cache budget. Only it is kept. |
| Window | Average window |
| Short window | n of 20 |
| Replay | Replay · {time} |
| Ranking title | Width Ranking *(Coach mock — Tango may object)* |
| Hero eyebrow | MOST ASYMMETRICALLY EFFICIENT WIDTH *(mock)* |
| Score label | EFFICIENCY SCORE *(mock)* |
| List | Ranked Widths · Higher = better *(mock)* |
| Cards | BEST WIDTH · RUNNER-UP · CONFIDENCE / SEPARATION *(mock)* |
| Confidence values | High · Moderate · Low *(L24 maps these to n + gap + min stability)* |
| Ranking footnote | Production scores from the current heat-map mathematics at the selected time. |
| Non-claim | Average of listed fit colors / per-width medians on held generations. Not a forecast. |

Forbidden: Optimizer, BOS, signal, pin, magnet, buy, recommendation, smoother edge.

---

## 10. Proposed DL (Lima SB0-9 / SB6)

Template Runner **TR14** — client stream book, member cache budget (MB = MiB), HIG `DetentSlider` kit primitive, Width Fit **MA heatmap and ranking sheet** (L19), Live \| Average, Heatmap \| Ranking (L20), interval = L23, Confidence = L24, eviction = L25, DL-539 grant on Heatmap files + DetentSlider (L26). Scrubber later. **TR13 unchanged** (IKI-P3 host chrome). WF4: temporal views are runner, not template. Advisor fold v1.0.3.

---

## 11. First actions (Juliet)

1. **Do not write `streamBook.ts` until SB0-0.**  
2. Fire **SB0-1** (India) · **SB0-3** (Echo + DetentSlider kit) · **SB0-5** (Charlie **byte measure**) in parallel with SB0-2/4/6.  
3. Coach stamps `TRSB-W0.md` only with **every open L ticked** and **§0.3 DL-539**.  
4. Then SB1-0.

**Hold** from Coach on implementation remains in force until **SB0-0**.
