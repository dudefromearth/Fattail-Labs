# FatTail Labs — Options Lab Heatmap Templates Spec v0.1

**Status:** **SUPERSEDED** by [v0.2](./FatTail-Labs-Options-Lab-Heatmap-Templates-Spec-v0_2.md) (external review H2–H12 fold)  
**Date:** 2026-08-10  
**Current revision:** **v0.1.1** (historical — dual-side HM15–HM17)  
**Canonical filename:** `Specs/FatTail-Labs-Options-Lab-Heatmap-Templates-Spec-v0_1.md`  
**Type:** Product + client view-plane Spec — switchable analytical panels over **one** live chain model  

**Short name:** **Heatmap Templates** / **HM**

**v0.1.1 amend:** Dual-side Massive snapshot always (HM15–HM17); side is a **view filter**, not a fetch filter; wing band keeps total contracts ≤250.

**Content hash:** recompute at Coach GO / amend:  
`shasum -a 1 Specs/FatTail-Labs-Options-Lab-Heatmap-Templates-Spec-v0_1.md` → record in DL.

**Architecture companion:** [`Architecture/29-options-lab-heatmap-templates.md`](../Architecture/29-options-lab-heatmap-templates.md)  

---

## 0. Mission

On Options Lab **Heatmap** (`/app/options-lab/heatmap`), give members a **registry of templates** that each define:

1. **UI layout** for a panel over the options chain (table, matrix tiles, or profile).  
2. **Logic** that rearranges live quotes and greeks into that panel (flies, verticals, GEX, raw ladder, …).  
3. Optional **value modes** (debit, R2R, % change, GEX net/call/put, …).  

All templates share **one** chain data plane:

- Massive options **chain snapshot** for one underlier + one expiry + strike window — **always both calls and puts** (no `contract_type` filter on the pull)  
- Labs generation → **server push** (WebSocket) of `full` | `diff` | `unchanged`  
- Client applies patches into a single in-memory **dual-side chain model**  
- Templates **recompute locally** after each model update  

**Near real time:** views refresh as fast as the next chain generation (~few seconds while RTH open).  

**Efficiency:** chain is diffed **once** per generation; template count **must not** multiply Massive or stream traffic. Switching Calls/Puts or template **must not** re-fetch Massive.

**After close:** continuous push stops; UI **holds last prices**; if empty, **one-shot hydrate** (not continuous poll).

**What this is not:** MSC convexity heatmap; per-template Massive clients; browser→Redis; underlier volume-profile bins (VP Spec); profit-claim chrome; separate call-chain and put-chain snapshot pipelines.

---

## 0.1 Surface naming

| Name | Meaning |
|------|---------|
| **Heatmap app** | Options Lab app at as-built route `/app/options-lab/heatmap` |
| **“Options Lab”** | As-built suite string — not catalog ratification until OD-nav DL (same posture as Market Bus Spec §0.2) |
| **Template** | Named view + pure compute over the chain model |
| **Chain model** | Client dual-side books (call + put by strike) + spot + meta after stream apply |

---

## 1. Parents / companions

| Spec / doc | Role |
|------------|------|
| [Options Chain Picker Spec v1.0.2](./FatTail-Labs-Options-Chain-Picker-Spec-v1.0.2.md) | Universe SoR · OC2 · OC6/OC6a · **OC13 no MSC** · field set |
| [Massive Market Bus Spec v1.0](./FatTail-Labs-Massive-Market-Bus-Shared-Client-Spec-v1.0.md) | One WS/tab · shared client · generation store |
| [Human Interface Spec v1.0](./FatTail-Labs-Human-Interface-Spec-v1.0.md) | Tokens · ≥44pt · clarity/deference |
| [Volume Profile Histogram Spec v0.2](./FatTail-Labs-Volume-Profile-Histogram-Spec-v0_2.md) | Sibling app — **not** this SoR |
| Arch [29 Heatmap templates](../Architecture/29-options-lab-heatmap-templates.md) | Design topology · phases |
| Arch [28 Market Bus](../Architecture/28-massive-market-bus.md) | As-built transport |

**Doctrine:** Standalone repo · no MSC · config fail-loud · evidence over assertion · display never demand · fail loud on missing legs/greeks.

---

## 2. Laws

| ID | Law |
|----|-----|
| **HM1 — Single dual-side chain model** | All templates read the **same** client chain model for geometry `(symbol, expiration, wings)`. The model **always** contains **both call and put** books for that window. Templates **must not** open independent Massive calls or steady-state HTTP poll loops. |
| **HM2 — Diff once, paint many** | Network efficiency is at the **chain generation** boundary (`full` / `diff` / `unchanged`). Adding or switching templates **or** UI side filter **must not** multiply snapshot traffic. |
| **HM3 — Push, not UI poll** | Steady-state updates arrive via **server push** on the market stream (WebSocket). React surfaces **apply** messages; they **must not** `setInterval`-poll the ladder for continuous refresh. |
| **HM4 — Hydrate-if-empty (special)** | If the UI model is **empty** but data can be loaded (bootstrap, reconnect, **market closed**), the client **may** perform a **single** HTTP full dual-side ladder fetch and inject it. That is **hydration**, not continuous polling. After hours, members **must** be able to see last prices. |
| **HM5 — Session hold** | When US equities session is **not open** for chain push, continuous stream updates **stop**. Last chain model (and last computed template grid) **hold** until open. |
| **HM6 — Pure template compute** | Template `computeCell` / grid assembly are **pure** functions of chain context + template params + value mode. No fetch, no bus write, no random side effects. |
| **HM7 — Fail loud cells** | Missing strikes/legs, null mid (for price modes), or null γ/OI (for GEX) → **invalid** cell (display “—” or empty), **not** a silent zero that looks like a real market. |
| **HM8 — Exact listed strikes** | Centers and legs use **listed** strikes (OC6a). No rounding half-strikes to whole dollars. |
| **HM9 — Universe SoR** | Symbols from enabled `market_symbol_universe` only (OC1). |
| **HM10 — No MSC** | No MarketSwarm-Canonical heatmap code, Redis schemas, or MSC UI. |
| **HM11 — Near real time** | Template views **must** recompute on each applied chain update while the stream is live. Cadence ≈ server generation interval (~few seconds RTH). |
| **HM12 — GEX honesty** | GEX template **must** be labeled as a **chain estimate** (from snapshot γ and OI), not “true” dealer GEX. |
| **HM13 — Access** | Same tool-member read gate as chain ladder (`require_session` + `_require_tool_member(read)`). |
| **HM14 — HIG chrome** | Controls and panels use design tokens; targets ≥44×44 pt; focus visible; reduced-motion respected for flash animations. |
| **HM15 — Always both sides** | Labs **must** retrieve **calls and puts** on every Massive option-chain snapshot for Heatmap geometry. **Forbidden:** `contract_type=call` or `contract_type=put` on the upstream pull for this surface. Massive returns both sides in one chain snapshot when `contract_type` is omitted ([Option Chain Snapshot](https://massive.com/docs/rest/options/snapshots/option-chain-snapshot)). |
| **HM16 — Side is view filter only** | Member control **Calls / Puts** filters **display and single-side structure templates** against the dual-side model. It **must not** trigger a second Massive fetch or a side-specific generation key that re-pulls the other book. |
| **HM17 — Strike window ≤ 250 contracts** | Massive page limit is **250**. With both sides,  
  \((\text{distinct strikes in window}) × 2 ≤ 250\) ⇒ **≤ 125 strikes** in the band.  
  Implementers **must** choose wings / strike window so this holds in **one page** (no multi-page dependency for Heatmap v1). Default wings 10/25/50 are fine; **wings=100** may require clamping the dual-side band or rejecting that wing choice for dual-side generation with fail-loud copy. This is ordinary window management — **not** a reason to split call/put fetches. |

---

## 3. Data plane (normative inputs)

### 3.1 Geometry

Member controls (left rail):

| Control | Meaning |
|---------|---------|
| Symbol | Universe product |
| Expiration | One listed expiry (next-N picker as chain law) |
| Wings | Strikes above/below ATM in band (10\|25\|50\|100) — bounds **both** sides |
| Side | `call` \| `put` — **view / structure-side filter only** (HM16) |

**Generation geometry key (fetch / cache / stream interest):**  
`(symbol, expiration, wings)` — **not** side.

**View key (UI only):** generation key + `side` + `templateId` + `valueMode` + template params.

### 3.2 Dual-side Massive pull (normative)

| Rule | Law |
|------|-----|
| Endpoint | `GET /v3/snapshot/options/{underlying}` (Massive option chain snapshot) |
| `contract_type` | **Omit** — return calls **and** puts in `results[]` |
| `expiration_date` | Selected expiry |
| Strike filter | `strike_price.gte` / `.lte` (or equivalent) from wing window around spot |
| `limit` | ≤ **250** (Massive max); Heatmap v1 targets **one page** (HM17) |
| Pagination | Not required for Heatmap v1 if HM17 holds; if ever exceeded → fail loud or clamp wings, **do not** silently drop one side |

**Rough capacity (both sides, one page):**

| Wings (≈ strikes one side) | Both sides (contracts) | One page (250)? |
|----------------------------|------------------------|-----------------|
| ±10 (~21) | ~42 | Yes |
| ±25 (~51) | ~102 | Yes |
| ±50 (~101) | ~202 | Yes |
| ±100 (~201) | ~402 | **No** — clamp or reject (HM17) |

### 3.3 Chain model shape

Client (and generation payload) **must** expose both books:

```
{
  symbol, expiration, wings, spot, strikeStep, asOf, contentHash,
  calls: Map<strike, LadderRow>,   // or equivalent
  puts:  Map<strike, LadderRow>,
}
```

Each `LadderRow` is one contract (one side). Diff keys are at least  
`(side, strike)` so call and put at the same strike patch independently.

Templates that need one side (e.g. call flies) read `calls` or `puts` per view filter.  
Templates that need both (e.g. net GEX) read **both** maps always.

### 3.4 Chain row fields (minimum)

From ladder generation (snapshot), each contract row **must** be able to carry:

| Field | Required for |
|-------|----------------|
| `strike` | All |
| `side` | `call` \| `put` |
| `mid` (and ideally `bid`/`ask`) | Price templates |
| `open_interest` | GEX |
| `gamma` | GEX |
| `delta`, `iv`, … | Optional modes / tooltips |
| `is_spot` | ATM emphasis (shared across sides) |

When vendor omits a field → null → HM7.

### 3.5 Stream modes

| Mode | Client action |
|------|----------------|
| `full` | Replace dual-side chain model |
| `diff` | Upsert/remove contracts by `(side, strike)` |
| `unchanged` | No row work; may refresh as_of |

Server push while session open; see Arch 28 / `market_stream`.

### 3.6 Transport efficiency (product claim)

| Claim | Law |
|-------|-----|
| Templates share one dual-side model | HM1, HM2, HM15 |
| Steady state prefers **diff** after first full | Apply without remounting untouched contracts |
| Side toggle / template toggle | **Zero** extra Massive (HM16) |
| Redis generations (when bus on) | Multi-worker fan-out; browser never reads Redis |

---

## 4. View plane — template framework

### 4.1 Registry

Every template is registered by stable `id` string. Member UI lists **enabled** templates. Unknown id → fail loud in dev; fall back to `ladder` in prod with console error.

### 4.2 Template contract

A template **must** define:

| Member | Requirement |
|--------|-------------|
| `id`, `label`, `description` | Stable id; human label |
| `layout` | `table` \| `matrix` \| `profile` |
| `valueModes[]` | Non-empty; each `{ id, label }` |
| `defaultValueMode` | ∈ valueModes |
| `resolveColumns(ctx, params)` | Column headers + meta (e.g. width \(w\)) |
| `resolveRows(ctx, params)` | Usually body strikes |
| `computeCell(ctx, row, col, valueMode, params)` | Returns `{ display, value, valid, tooltip? }` **without** color |
| `assignColors(grid, valueMode, params)` | Fills per-cell color coordinate after full grid exists (neighbors available) |

### 4.3 Chain context

```
symbol, spot, strikeStep, asOf, contentHash, wings,
calls: Map<strike, LadderRow>,
puts:  Map<strike, LadderRow>,
viewSide: "call" | "put",   // UI filter for single-side structures
```

### 4.4 Template params (member)

| Param | Applies | Notes |
|-------|---------|--------|
| `valueMode` | All | Active metric |
| `widthMode` | matrix | `step_multiples` (default) \| `fixed_points` |
| `widthSteps` or `widthPoints` | matrix | See §5.1 |
| `bwShort`, `bwLong` | bw-fly | Asymmetric distances |
| `gexAlgoVersion` | gex | Sign/scale freeze |

Persist in sessionStorage (or equivalent) per member browser; not server SoR.

### 4.5 Renderers

| layout | Behavior |
|--------|----------|
| `table` | Classic strike table (ladder) |
| `matrix` | 2D tiles; sticky strike column + sticky header |
| `profile` | Optional strike → horizontal bar (GEX-friendly) |

v0.1 implementation **must** ship `table` + `matrix`. `profile` may follow.

---

## 5. Template catalog

### 5.1 `ladder` — raw chain (default until matrix ships)

| Item | Law |
|------|-----|
| layout | `table` |
| Columns | Strike, Mid, Bid, Ask, Vol, OI, Δ, IV (γ may be added; already in model) |
| valueModes | N/A or single `quote` |
| Color | Spot row emphasis only; no RoC matrix |

### 5.2 `sym-fly` — symmetric butterfly matrix (**first matrix template**)

| Item | Law |
|------|-----|
| layout | `matrix` |
| Structure | +1 @ \(K-w\), −2 @ \(K\), +1 @ \(K+w\) on **viewSide** (call book or put book from dual model) |
| Rows | Candidate body strikes \(K\) on that side such that \(K±w\) exist for at least one column |
| Columns | Half-width \(w\) |

**Width columns (F1 freeze for v0.1 implement):**

- **Default `widthMode = step_multiples`:** \(w = n · \texttt{strike\_step}\) for integers \(n = 1..N\) (N configurable; default 7 or enough to fill UI).  
- **Optional `fixed_points`:** explicit point list (e.g. 20, 25, …, 50) for index-style look; convert to strike distance using listed step (legs must land on listed strikes — HM8).

**Debit (mid) — frozen:**

\[
D(K,w) = m(K-w) + m(K+w) - 2\,m(K)
\]

If any of the three mids is null → `valid=false`.

**Value modes (v0.1 minimum):**

| Mode | Definition |
|------|------------|
| `debit` | \(D(K,w)\) as above (**default**) |
| `pct_change` | \((D_{j} - D_{j-1}) / \|D_{j-1}\|\) when \(D_{j-1} ≠ 0\); else invalid |
| `r2r` | **Staged:** define in §5.2.1 before enable in UI; until then omit from defaultModes |

**§5.2.1 R2R (sym-fly) — freeze when enabling mode:**  
Under mid marks: max loss ≈ debit paid for long fly; max profit ≈ (width in points) − debit (standard long fly).  
\(\mathrm{R2R} = \mathrm{maxProfit} / \mathrm{maxLoss}\) when maxLoss > 0. Document edge cases (credit flies) before ship.

**Color (v0.1 freeze — rate of change, not level):**

1. After all valid \(D_{i,j}\) computed:  
   \(s_{i,j} = D_{i,j} - D_{i,j-1}\) for \(j≥1\); \(s_{i,0} = 0\).  
2. Let \(S\) = p95 of \(\{|s|\}\) over valid cells with \(j≥1\), or 1 if degenerate.  
3. \(t_{i,j} = \mathrm{clamp}(s_{i,j}/S, -1, 1)\).  
4. Map \(t\) through diverging CSS stops:

| t | Color intent |
|---|--------------|
| −1 | Light blue |
| −0.35 | Mid blue |
| 0 | Dark blue / near-black blue |
| +0.35 | Dark red |
| +1 | Light red |

**Text:** high-contrast gold/amber figures on dark tiles (product look).  
**Spot/ATM:** emphasize body strike nearest spot (gold strike label).

### 5.3 `vertical` — vertical spreads

| Item | Law |
|------|-----|
| layout | `matrix` |
| Structure | Long one strike, short another at distance \(w\) (direction by side + debit/credit convention) |
| Columns | Width \(w\) (same widthMode rules as sym-fly) |
| valueModes | `debit`, `credit` (and `r2r` when frozen) |
| Color | Same RoC family on the active value field |

Exact long/short orientation table (call debit vertical vs put) **must** appear in implementer notes and golden tests before ship.

### 5.4 `bw-fly` — broken-wing butterfly

| Item | Law |
|------|-----|
| layout | `matrix` or param grid |
| Structure | +1 @ \(K-w_s\), −2 @ \(K\), +1 @ \(K+w_l\) with \(w_s ≠ w_l\) |
| Params | `bwShort`, `bwLong` (positive distances in steps or points) |
| valueModes | `debit`, `r2r` (R2R requires explicit max-loss definition for asymmetric) |
| Color | RoC on debit (default) |

### 5.5 `gex` — chain GEX estimate

| Item | Law |
|------|-----|
| layout | `matrix` (net / call / put columns) and/or `profile` |
| Label | **“Chain GEX (estimate)”** always visible (HM12) |
| Inputs | `gamma`, `open_interest`, spot \(S\) from chain model |

**Formula v1 (`gex_v1`) — frozen sketch:**

\[
\mathrm{GEX}_{\mathrm{call}}(K) = +\Gamma^{\mathrm{call}}_K · \mathrm{OI}^{\mathrm{call}}_K · S^2
\]
\[
\mathrm{GEX}_{\mathrm{put}}(K) = -\Gamma^{\mathrm{put}}_K · \mathrm{OI}^{\mathrm{put}}_K · S^2
\]
\[
\mathrm{GEX}_{\mathrm{net}}(K) = \mathrm{GEX}_{\mathrm{call}}(K) + \mathrm{GEX}_{\mathrm{put}}(K)
\]

Uses **both** books from the dual-side model (HM15).  
Scale constant optional (e.g. 1e-9 for display) — document as display divisor, not hidden in color only.

Null γ or OI → invalid (HM7).

**Color:** diverging scale on signed GEX (normalize by p95 \|GEX\| on grid).

**valueModes:** `gex_net`, `gex_call`, `gex_put` as applicable.

---

## 6. UI law

### 6.1 Workspace layout

| Region | Size | Content |
|--------|------|---------|
| Top | Full width | Compact breadcrumb + suite nav |
| Left | ~**1/5** width | Template, value mode, widths, symbol, expiry, side, wings, spot, stream status |
| Right | ~**4/5** width | Active template view; **full remaining height**; internal scroll |

Both columns span from under top chrome to bottom of viewport (`100dvh` minus site header).

### 6.2 Stream status copy

| State | Member-facing |
|-------|----------------|
| Live pushes | “Live stream” (or equivalent) |
| Closed hold | “Held · market closed” |
| Error | Fail loud; offer hydrate if empty |

### 6.3 Template switcher

Changing template or value mode:

- **Must not** resubscribe Massive  
- **Must** recompute from current chain model immediately  
- **May** keep scroll position on strike axis when row set unchanged  

---

## 7. Client architecture (normative paths)

| Module (target) | Role |
|-----------------|------|
| `web/lib/market/MarketSocket.ts` | One WS/tab |
| `web/lib/market/useOptionChainBus.ts` | Apply push; hydrate-if-empty; **no** steady poll |
| `web/lib/options-lab/templates/*` | Registry + pure templates |
| `web/components/options-lab/HeatmapChainPanel.tsx` | Workspace host + switchers + renderer |

---

## 8. Server architecture (normative)

| Piece | Role |
|-------|------|
| Ladder generation | Snapshot → rows + content_hash |
| Stream | Push full/diff/unchanged while session open |
| Session gate | Stop continuous push when closed |
| Redis (bus) | Generation cache / interest — **not** template storage |

**v0.1:** No server-side fly/GEX matrix persistence. Matrices are **client-derived** so templates stay flexible. Agents may recompute from chain DTO using the same formulas.

---

## 9. Agent export (staged)

When enabled:

```
GET semantics (client tool or future API):
  template_id, value_mode, params,
  content_hash, as_of,
  rows[], cols[], values[][], valid[][], colorT[][]
```

Must include formula/`algo` ids (`sym_fly_debit_v1`, `gex_v1`, …).

---

## 10. Non-goals (v0.1)

- MSC heatmap parity  
- Multi-expiry matrix in first ship (single expiry control)  
- Tick-level options tape for structure prices  
- True dealer GEX from order book  
- Continuous HTTP poll of ladder  
- Per-template Massive subscriptions  

---

## 11. Implementation phases

| Phase | Deliverable | Exit criteria |
|-------|-------------|----------------|
| **H0** | Arch 29 + this Spec DRAFT | Coach accept |
| **H1** | Template types, registry, matrix renderer shell, switcher | Can select template; ladder still default |
| **H2** | `sym-fly` debit + RoC color + width columns | Live update on chain push; HM5–HM8 sample tests |
| **H3** | `pct_change` (+ `r2r` if §5.2.1 frozen) | Mode switch, no new fetch |
| **H4** | `gex` estimate | γ/OI null → invalid; live on greeks/OI diff |
| **H5** | `vertical` | Golden tests for orientation |
| **H6** | `bw-fly` | Params short/long |
| **H7** | Agent grid export | Optional |

---

## 12. Acceptance tests

| ID | Test |
|----|------|
| **AT-HM1** | Steady state: no `setInterval` HTTP chain poll in Heatmap client path |
| **AT-HM2** | Chain `diff` updates model without requiring full ladder replace for unchanged strikes |
| **AT-HM3** | Switching templates produces **zero** additional chain HTTP while stream healthy |
| **AT-HM3b** | Switching Calls ↔ Puts produces **zero** Massive/upstream re-fetch; only view filter changes |
| **AT-HM3c** | Upstream generation for Heatmap **omits** `contract_type`; payload includes both call and put contracts in the strike window |
| **AT-HM3d** | With wings ∈ {10,25,50}, total contracts in generation ≤ 250 (one page) |
| **AT-HM4** | Market closed + empty UI → one hydrate → both sides present; no repeating poll |
| **AT-HM5** | Market closed + rows present → hold; no continuous push required to keep display |
| **AT-HM6** | `sym-fly` debit matches mid formula on fixture chain; missing leg → invalid |
| **AT-HM7** | `sym-fly` color uses RoC field, not raw debit rank alone (fixture where debit high but slope near 0 → not extreme red/blue solely from level) |
| **AT-HM8** | GEX net uses call and put books; invalid when γ or OI null on that side |
| **AT-HM9** | Strikes display cent-exact (OC6a) |
| **AT-HM10** | Live: after mock stream full then diff on one mid, matrix cell for affected fly updates |

---

## 13. Open decisions — Accept / Override

Ratification requires explicit Accept or Override per row.

| # | Topic | Recommendation (not automatic) | Accept / Override |
|---|--------|--------------------------------|-------------------|
| OD1 | Default widthMode | `step_multiples` | _pending_ |
| OD2 | Default N step columns | 7 | _pending_ |
| OD3 | R2R enable in H3 | Only after §5.2.1 text frozen | _pending_ |
| OD4 | GEX display scale divisor | Document in `gex_v1` | _pending_ |
| OD5 | Bid/ask fill model | Mid only until OD Accept | _pending_ |
| OD6 | OD-nav “Options Lab” | As-built disclaimer until DL | _pending_ |
| OD7 | Profile layout for GEX | Optional after matrix | _pending_ |
| OD8 | Wings=100 dual-side policy | Clamp band to ≤125 strikes or fail-loud disallow | _pending_ |

---

## 14. Document control

| Version | Date | Notes |
|---------|------|--------|
| **v0.1** | 2026-08-10 | Initial DRAFT: laws HM1–HM14; framework; catalog; push+diff+hydrate |
| **v0.1.1** | 2026-08-10 | **Always both sides** (HM15–HM17): omit Massive `contract_type`; generation key without side; side = view filter; ≤250 contracts via wing window; GEX net uses dual books; AT-HM3b–d |

**One-line law:**  
**One dual-side chain snapshot (calls + puts under a wing band ≤250 contracts), pushed and diffed once; templates recompute locally every generation — including flies and net GEX — with side as a view filter only and last print held when the market is closed.**
