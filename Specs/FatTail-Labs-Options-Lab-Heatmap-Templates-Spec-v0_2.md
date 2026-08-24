# FatTail Labs — Options Lab Heatmap Templates Spec v0.2

**Status:** **DRAFT** — product / architecture authority for live options-chain **view templates**  
**Date:** 2026-08-10  
**Current revision:** **v0.2.1** (filename remains `…-v0_2.md`) · **HM21** 2026-08-24  
**Supersedes:** [v0.1 / v0.1.1](./FatTail-Labs-Options-Lab-Heatmap-Templates-Spec-v0_1.md)  
**Canonical filename:** `Specs/FatTail-Labs-Options-Lab-Heatmap-Templates-Spec-v0_2.md`  
**Type:** Product + client view-plane Spec — switchable analytical panels over **one** dual-side live chain model  

**Short name:** **Heatmap Templates** / **HM**

**Content hash (v0.2.1):** recompute at Coach GO:  
`shasum -a 1 Specs/FatTail-Labs-Options-Lab-Heatmap-Templates-Spec-v0_2.md` → record in DL.

**External review folded:** Claude advisor 2026-08-10 (H1–H12).  
**H1 RESOLVED** in v0.1.1 (dual-side HM15–HM17). **H2–H12** folded here.

**Architecture companion:** [`Architecture/29-options-lab-heatmap-templates.md`](../Architecture/29-options-lab-heatmap-templates.md)  
**Full-agent bench plan:** [`docs/Options-Lab-Heatmap-Templates-Full-Agent-Bench-Plan-v1.0.md`](../docs/Options-Lab-Heatmap-Templates-Full-Agent-Bench-Plan-v1.0.md) · board `agents/p-options-lab-heatmap/`

---

## 0. Mission

On Options Lab **Heatmap** (`/app/options-lab/heatmap`), give members a **registry of templates** that each define:

1. **UI layout** for a panel over the options chain (table, matrix tiles, or profile).  
2. **Logic** that rearranges live quotes and greeks into that panel (flies, verticals, GEX, raw ladder, …).  
3. Optional **value modes** (debit, R2R, % change, GEX net/call/put, …).  

All templates share **one** chain data plane:

- Massive options **chain snapshot** for one underlier + one expiry + strike window — **always both calls and puts** (no `contract_type` on the pull)  
- Labs generation → **server push** (WebSocket) of `full` | `diff` | `unchanged`  
- Client dual-side model; templates **recompute locally**  

**Near real time:** as fast as the next chain generation (~few seconds RTH).  
**Efficiency:** chain diffed **once**; template / side / value-mode switches do **not** re-fetch Massive.  
**After close:** hold last prices; empty UI → **one-shot hydrate** (not continuous poll).

**What this is not:** MSC convexity heatmap (no MSC **code/schemas** — see §0.2); per-template Massive clients; browser→Redis; underlier VP bins; profit-claim marketing chrome.

---

## 0.1 Surface naming

| Name | Meaning |
|------|---------|
| **Heatmap app** | As-built route `/app/options-lab/heatmap` |
| **“Options Lab”** | As-built suite string — not catalog ratification until OD-nav DL entry |
| **Template** | Named view + pure compute over the dual-side chain model |
| **Width** | Distance from **body/center strike to each long wing** (course doctrine). **Not** wing-to-wing. Same quantity previously called “half-width” in v0.1 — **renamed to Width** (H4). |
| **Chain model** | Dual books `calls` + `puts` by strike + spot + meta |

---

## 0.2 Reference image vs MSC (H7)

Visual reference for the first matrix (`sym-fly`) may resemble Coach’s prior convexity heatmap look (`hm.png` or equivalent).  

**Law:** Resemblance of **look** (dark tiles, gold figures, blue↔red heat) is **lawful**.  
**Forbidden (HM10 / OC13):** MSC shared code, MSC Redis schemas, copied MSC UI implementation, or MarketSwarm imports. Architecture gate tests **provenance of code**, not whether Coach’s own product look reappears.

---

## 0.3 Payoff math vs profit claims (H8)

**Structural payoff arithmetic is lawful tool function** (debit, max structural profit/loss of a defined-risk structure, R2R ratio of those quantities).  

**Forbidden:** marketing or chrome that **promises member P&L** or performance outcomes (FatTail “no profit theater”).  

UI may show labels such as “max structural profit” / “R2R” as **structure descriptors**, not promised member results.

---

## 1. Parents / companions (H3)

| Spec / doc | File (repo) | Role |
|------------|-------------|------|
| Options Chain Picker **v1.0.2** | `Specs/FatTail-Labs-Options-Chain-Picker-Spec-v1.0.2.md` (canonical path uses **dots** in this filename as landed) | Universe · OC2 · OC6/OC6a · **OC13** |
| Massive Market Bus **content rev v1.0.1** | `Specs/FatTail-Labs-Massive-Market-Bus-Shared-Client-Spec-v1.0.md` (**filename** v1.0; **Current revision** field = v1.0.1) | One WS/tab · generation store |
| Volume Profile Histogram **v0.2** | `Specs/FatTail-Labs-Volume-Profile-Histogram-Spec-v0_2.md` | Sibling app; **not** this SoR |
| Human Interface **v1.0** | `Specs/FatTail-Labs-Human-Interface-Spec-v1.0.md` | Tokens · ≥44pt |
| Arch 28 / 29 | `Architecture/28-massive-market-bus.md` · `29-options-lab-heatmap-templates.md` | Transport · design topology |

**Landing-order note:** Picker v1.0.2 and VP Histogram v0.2 are **cited as landed** at the paths above. Bus product law is **v1.0.1 content** inside the v1.0 filename. Future parent renames to underscore convention do not change HM laws. If a parent is temporarily missing at clone time, **do not invent weaker law** — block Heatmap GO until parent path exists.

---

## 2. Laws

| ID | Law |
|----|-----|
| **HM1 — Single dual-side chain model** | All templates read the **same** model for `(symbol, expiration, wings)`. Model always holds **calls and puts**. No per-template Massive or steady-state HTTP poll. |
| **HM2 — Diff once, paint many** | Efficiency at generation boundary. Template / **side filter** / value-mode switches **must not** multiply snapshot traffic. |
| **HM3 — Push, not UI poll** | Steady state = server **push** on market WS. No `setInterval` ladder poll. |
| **HM4 — Hydrate-if-empty** | Empty model + loadable data → **one** dual-side HTTP full inject. Not continuous poll. Required for post-close last print. |
| **HM5 — Session hold** | Session not open → stop continuous push; hold last model and grids. |
| **HM6 — Pure template compute** | Pure functions of context + params + valueMode. |
| **HM7 — Fail loud cells** | Missing legs, null mid, null γ/OI → invalid “—”, never silent zero. Includes vendor deep-ITM missing greeks. |
| **HM8 — Exact listed strikes; no snap** | Centers and legs **must** be listed strikes. Where \(K±w\) (or vertical offsets) **do not exist as listed strikes**, cell is **invalid**. **Forbidden:** snap to nearest listed strike. |
| **HM9 — Universe SoR** | Enabled `market_symbol_universe` only. |
| **HM10 — No MSC code** | No MSC imports, schemas, or copied implementation (look may match Coach reference — §0.2). |
| **HM11 — Near real time** | Recompute on each applied chain update while live. |
| **HM12 — GEX honesty** | Label **“Chain GEX (estimate)”**; not true dealer GEX. |
| **HM13 — Access** | Session + tool-member read. |
| **HM14 — HIG chrome** | Tokens; ≥44pt; focus; reduced-motion for flash. Color-scale policy §5.2.2 (H6). |
| **HM15 — Always both sides** | Upstream pull **omits** `contract_type`. Both books in one snapshot. |
| **HM16 — Side is view filter only** | Calls/Puts UI does **not** re-fetch Massive or open a side-only generation. |
| **HM17 — Strike window ≤ 250 contracts** | \((\text{distinct strikes}) × 2 ≤ 250\) ⇒ ≤125 strikes. One page for Heatmap v1. Wings 10/25/50 OK; wings=100 → clamp or fail-loud (OD8). |
| **HM18 — Truncation fail-loud** | If Massive response includes **`next_url`** (or equivalent more-pages signal) for a Heatmap generation, treat as **hard error**: **do not** publish a partial dual-side model. Fail loud; zero rows to stream/HTTP full for that generation. |
| **HM19 — Standard contracts only** | At row construction, include **standard** contracts only for key `(side, strike)`. **Exclude** adjusted / non-standard OCC contracts (post-split, special dividend, etc.) that share strike+expiry. Record `excluded_adjusted_count` (or equivalent) on generation **meta**. Never silently overwrite a standard row with an adjusted one. |
| **HM20 — Modal strike step** | `strikeStep` on `ChainContext` is the **modal inter-strike gap** among loaded **standard** strikes in the current wing band (most common consecutive difference). Recomputed per generation. Not a single hard-coded global for all underliers forever. |
| **HM21 — Inspector tab-session** | Heatmap **inspector selections** persist for **this browser tab** (`sessionStorage` key `ft_labs_heatmap_session`). Leave Heatmap for other apps/suites and return in the same tab → restore. A new tab or a new browsing session starts from product defaults. Not server SoR. Not Redis. **Not** HM5 (market-session hold of last chain). **Not** §5.2.2 (color-scale hysteresis). **Not** TR14 (RAM stream book of OPF generations). Glance / hover / pin / ToS copy are not persisted. Expiration restores only if still **listed** on the fetched expiry pack. |

---

## 3. Data plane

### 3.1 Geometry

| Control | Role |
|---------|------|
| Symbol | Universe product |
| Expiration | One listed expiry |
| Wings | Band for **both** sides (10\|25\|50\|100) |
| Side | **View / single-side structure filter only** |

**Generation key:** `(symbol, expiration, wings)` — **not** side.  
**View key:** generation + `viewSide` + `templateId` + `valueMode` + params.

### 3.2 Dual-side Massive pull

| Rule | Law |
|------|-----|
| Endpoint | `GET /v3/snapshot/options/{underlying}` |
| `contract_type` | **Omit** |
| Filters | `expiration_date` + strike gte/lte from wings |
| `limit` | ≤250; target one page (HM17) |
| `next_url` | If present → **HM18 hard error** (H11) |

| Wings (≈ strikes/side) | Both sides | One page? |
|------------------------|------------|-----------|
| ±10 (~21) | ~42 | Yes |
| ±25 (~51) | ~102 | Yes |
| ±50 (~101) | ~202 | Yes |
| ±100 (~201) | ~402 | No — OD8 |

### 3.3 Chain model shape

```
{
  symbol, expiration, wings, spot, strikeStep,  // strikeStep = modal (HM20)
  asOf, contentHash,
  calls: Map<strike, LadderRow>,  // standard contracts only (HM19)
  puts:  Map<strike, LadderRow>,
  meta: { excluded_adjusted_count: number, ... }
}
```

Diff identity: `(side, strike)` among **standard** contracts only.

### 3.4 Row fields

| Field | Use |
|-------|-----|
| `strike`, `side` | Identity |
| `mid`, `bid`, `ask` | Price templates |
| `open_interest`, `gamma` | GEX (null allowed → HM7) |
| `delta`, `iv`, … | Optional |
| `is_spot` | ATM emphasis |

### 3.5 Stream modes

`full` → replace dual model · `diff` → patch by (side, strike) · `unchanged` → no row work.

### 3.6 Efficiency

Templates / side / value mode: **zero** extra Massive. Redis = multi-worker generation; browser never reads Redis.

---

## 4. Template framework

### 4.1 Registry

Stable `id` → template. Unknown id → fail loud in dev; prod fall back to `ladder`.

### 4.2 Contract

| Member | Requirement |
|--------|-------------|
| `id`, `label`, `description` | Required |
| `layout` | `table` \| `matrix` \| `profile` |
| `valueModes[]`, `defaultValueMode` | Non-empty |
| `resolveColumns` / `resolveRows` | Required |
| `computeCell` | `{ display, value, valid, tooltip? }` without color |
| `assignColors` | After full grid (neighbors for RoC / hysteresis) |

### 4.3 Chain context

```
symbol, viewSide, spot, strikeStep, wings,
calls, puts, asOf, contentHash, meta
```

### 4.4 Params

`valueMode`, `widthMode` (`step_multiples` \| `fixed_points`), width list, `bwShort`/`bwLong`, `gexAlgoVersion`.

Inspector params persist per **HM21** / §6.4 (`sessionStorage`; not server SoR). v0.1 already required this; v0.2.1 names the key and the tab-lifetime rule.

### 4.5 Renderers

v0.2 must ship `table` + `matrix`. `profile` optional.

---

## 5. Template catalog

### 5.1 `ladder`

Table of contracts for **viewSide** (or dual columns later). Spot emphasis. No RoC matrix.

### 5.2 `sym-fly` — symmetric butterfly matrix (priority 1)

**Structure:** +1 @ \(K-w\), −2 @ \(K\), +1 @ \(K+w\) on **viewSide** book.

**Width (H4):** Column header **Width** = course **width** = center-to-wing distance (points or \(n ×\) modal step).

**Columns:**

- Default `widthMode = step_multiples`: \(w = n · \texttt{strikeStep}\) for \(n = 1..N\) (default N=7), with `strikeStep` = **modal** step in band (HM20).  
- Optional `fixed_points`: explicit point list; legs **must** land on listed strikes or cell invalid (HM8 — **no snap**).

**Non-uniform regions (H2):** If \(K±w\) not listed → `valid=false`. Never snap.

**Debit (mid) v1:**

\[
D(K,w) = m(K-w) + m(K+w) - 2\,m(K)
\]

**Value modes:**

| Mode | Definition |
|------|------------|
| `debit` | \(D\) (**default**) |
| `pct_change` | \((D_j - D_{j-1}) / |D_{j-1}|\) if \(D_{j-1} ≠ 0\); else **invalid** (not ∞/NaN) |
| `r2r` | Only after §5.2.1 frozen and OD Accept |

**§5.2.1 R2R (long fly, mid):**  
Width \(w\) in points (center-to-wing).  
max structural loss ≈ debit \(D\) (when \(D>0\)).  
max structural profit ≈ \(w - D\) (standard long fly).  
\(\mathrm{R2R} = \mathrm{maxProfit}/\mathrm{maxLoss}\) when maxLoss > 0.  

These are **structure descriptors** (§0.3), not promised member P&L.

**Color RoC (v1):**

1. \(s_{i,j} = D_{i,j} - D_{i,j-1}\) (\(j≥1\); \(s_{i,0}=0\)).  
2. \(S\) = p95 of \(\{|s|\}\) over valid \(j≥1\), or 1.  
3. \(t = \mathrm{clamp}(s/S, -1, 1)\).  
4. Map: light blue → dark blue → dark red → light red.

**§5.2.2 Color scale temporal stability (H6):**  
p95 (or active scale \(S\)) **must not** be free to rewrite every generation without hysteresis.  
**v0.2 freeze:** keep a **session sticky** \(S_{\mathrm{sticky}}\). Recompute raw p95 each generation; update sticky only if  
\(|S_{\mathrm{new}} - S_{\mathrm{sticky}}| / S_{\mathrm{sticky}} > 0.25\) (25%) or on member **Reset color scale**.  
Use \(S_{\mathrm{sticky}}\) for \(t\). First generation initializes sticky. Aligns with reduced-motion spirit (HM14).

### 5.3 `vertical`

Matrix; width columns; debit/credit; RoC color on active value. Orientation table + golden tests before ship.

### 5.4 `bw-fly`

Asymmetric \(w_s\), \(w_l\); debit/R2R with explicit max-loss definition.

### 5.5 `gex` — chain GEX estimate

**Label:** “Chain GEX (estimate)” always (HM12).

**`gex_v1` units basis (H5) — frozen:**

| Item | Law |
|------|-----|
| Inputs | Per-side Γ, OI from standard contracts; spot \(S\) |
| Formula | \(\mathrm{GEX}_c = +\Gamma_c·\mathrm{OI}_c·S^2\); \(\mathrm{GEX}_p = -\Gamma_p·\mathrm{OI}_p·S^2\); net = sum |
| Multiplier | **Not** multiplied by 100 in the stored `value` (per **share** of underlying, not per contract). Display may format with a **documented divisor** (e.g. 1e9) separate from the raw value. |
| Move basis | \(S^2\) term as written — **not** “per 1% move” unless a future `gex_v2` freezes that. |
| Null γ | Vendor may omit greeks (e.g. deep ITM) → invalid cell (HM7); golden fixture required |

**Net mode:** `gex_net` **requires** both call and put γ/OI present at that strike for a valid net cell; else invalid (AT-HM13). Dual-side model (HM15) makes this meaningful.

**Color:** diverging on signed GEX with same hysteresis policy as §5.2.2 using p95 \|GEX\|.

---

## 6. UI law

### 6.1 Workspace

Top: compact suite nav. Left ~1/5: controls including **template**, **value mode**, **width** settings, symbol, expiry, side filter, wings, spot, stream status. Right ~4/5: full-height template view.

### 6.2 Stream status

Live stream · Held · market closed · Error / connecting.

### 6.3 Switchers

Template / value mode / side: recompute local only; **zero** chain HTTP while stream healthy (AT-HM3, AT-HM3b, AT-HM11).

### 6.4 Inspector session prefs (HM21)

**Store:** browser `sessionStorage` key `ft_labs_heatmap_session`. JSON blob. Client hydrate in `useEffect` (no SSR mismatch). Quota / private-mode write failure → stay on defaults; do not throw.

**Persisted (inspector):** `symbol`, `expiration`, `side`, `wings`, `templateId`, `valueMode`, `rocSensitivity`, `bwStrikeCount`, `bwWingSide`, `widthFitWeights`, `widthFitExpanded`, `wfIface` (heatmap \| ranking), `wfTime` (live \| average), `wfWindow` (10/20/50/100), `cacheBudgetMib` (4/8/16/32).

**Not persisted:** hover tip, pinned inspect, selected tile, ToS copy buffer, color-scale \(S_{\mathrm{sticky}}\), TR14 generation slots (those live in RAM until the tab dies).

**Restore**
- After mount, apply the blob before writes (`sessionReady`).
- Suite symbol also lives in `options-lab-symbol`; when the blob’s symbol matches, **skip one** per-symbol profile apply (do not overwrite sticky wings / side / template with profile defaults).
- Expiration: keep only if that date is still in the listed expiry pack; else server default (including skip expired 0DTE after RTH close).
- `valueMode` not in the restored template’s modes → that template’s default. Unknown `templateId` → ignore blob.

**Write:** after hydrate, whenever a persisted field changes.

**Legacy:** if the session key is empty, a one-time read of old Width Fit `localStorage` keys (`ft_labs_width_fit_time`, `ft_labs_width_fit_interface`, `ft_labs_width_fit_avg_window`, `ft_labs_runner_cache_budget_mb`) may seed the blob. Those keys are not a second SoR.

**Cache budget detent** is an inspector pref (this blob). **Cached generations** are TR14 RAM. Closing the tab drops both.

**Member help:** `server/help_reference/options-lab-heatmap-session.md` (**DL-576**).

---

## 7. Client paths

| Module | Role |
|--------|------|
| `MarketSocket` | One WS/tab |
| `useOptionChainBus` (or successor dual-side hook) | Push apply; hydrate-if-empty; no steady poll |
| `web/lib/options-lab/templates/*` | Registry + pure templates |
| `web/lib/options-lab/heatmapSession.ts` | HM21 inspector blob (`ft_labs_heatmap_session`) |
| `HeatmapChainPanel` | Workspace host |

---

## 8. Server paths

| Piece | Role |
|-------|------|
| Ladder generation | Dual-side standard contracts; modal step; exclude adjusted + meta count; **reject if `next_url`** |
| Stream | Push full/diff/unchanged while open |
| Session | Stop push when closed |
| Redis | Generation cache — not template matrices |

**v0.2:** Matrices client-derived only.

**As-built gap:** Code may still filter `contract_type=side`. **Must flip to HM15–HM20** before dual-side templates / GEX net are production-true.

---

## 9. Agent export (staged)

Grid + `template_id`, `value_mode`, `algo` ids (`sym_fly_debit_v1`, `gex_v1`), `content_hash`, `as_of`, `excluded_adjusted_count`.

---

## 10. Non-goals

- MSC code/schemas  
- Multi-expiry matrix in first ship  
- Tick options tape for v1 structure prices  
- True dealer GEX  
- Continuous HTTP poll  
- Per-template Massive subs  
- Snapping structure legs to nearest strike  
- Publishing partial chains when `next_url` present  
- Inspector prefs that survive tab close or roam devices (that would be `localStorage` / server SoR — Coach: **current tab session** only)  
- Persisting glance chrome or TR14 generation bytes in `sessionStorage`  

**Payoff math lawful** (§0.3); profit **claims** banned.

---

## 11. Phases

| Phase | Deliverable |
|-------|-------------|
| **H0** | Arch 29 + Spec v0.2 DRAFT |
| **H1** | Registry + matrix shell + switcher |
| **H2** | Dual-side generation + `sym-fly` debit + RoC + modal step + no-snap |
| **H3** | pct_change (+ r2r if frozen) |
| **H4** | `gex` estimate dual-book |
| **H5** | `vertical` |
| **H6** | `bw-fly` |
| **H7** | Agent export |

---

## 12. Acceptance tests

| ID | Test |
|----|------|
| **AT-HM1** | No steady `setInterval` HTTP chain poll |
| **AT-HM2** | Diff patches without full replace of untouched contracts |
| **AT-HM3** | Template switch → zero extra chain HTTP (stream healthy) |
| **AT-HM3b** | Calls↔Puts → zero Massive re-fetch |
| **AT-HM3c** | Upstream omits `contract_type`; both sides in window |
| **AT-HM3d** | Wings 10/25/50 → contracts ≤250 |
| **AT-HM3e** | Mock Massive page with `next_url` → hard error; **zero** rows published (H11) |
| **AT-HM4** | Closed + empty → one hydrate dual-side; no repeating poll |
| **AT-HM5** | Closed + rows → hold |
| **AT-HM6** | sym-fly debit formula; missing leg invalid |
| **AT-HM7** | Color RoC not debit level alone |
| **AT-HM8** | GEX invalid if γ or OI null (incl. deep-ITM null greeks fixture) |
| **AT-HM9** | Cent-exact strikes |
| **AT-HM10** | Stream full then mid diff updates fly cell |
| **AT-HM11** | Value-mode switch → zero extra chain HTTP (H9) |
| **AT-HM12** | Step-boundary fixture: modal step; boundary cells invalid; **no** snapped legs (H2) |
| **AT-HM13** | No valid `gex_net` cell from single-side-only model; both sides required (H1 residual) |
| **AT-HM14** | `pct_change` with \(D_{j-1}=0\) → invalid, not ∞/NaN (H9) |
| **AT-HM15** | Standard + adjusted at same strike → standard wins; `excluded_adjusted_count ≥ 1` (H12) |
| **AT-HM16** | Color sticky scale: small mid moves do not re-normalize if p95 within 25% (H6) |
| **AT-HM17** | Inspector blob round-trips in `sessionStorage` `ft_labs_heatmap_session`; missing/invalid `templateId` rejected; invalid `valueMode` → template default; empty key → product defaults; glance / hover / pin fields absent from the blob; listed expiration restores only if still in the expiry pack (HM21) |

---

## 13. Open decisions — Accept / Override

| # | Topic | Recommendation | Accept / Override |
|---|--------|----------------|-------------------|
| OD1 | Default widthMode | `step_multiples` | _pending_ |
| OD2 | Default N width columns | 7 | _pending_ |
| OD3 | R2R in H3 | Only after §5.2.1 + Accept | _pending_ |
| OD4 | GEX display divisor | e.g. 1e9 documented | _pending_ |
| OD5 | Bid/ask fill | Mid until Accept | _pending_ |
| OD6 | OD-nav “Options Lab” | One DL ratification | _pending_ |
| OD7 | Profile layout for GEX | After matrix | _pending_ |
| OD8 | Wings=100 dual-side | Clamp ≤125 strikes or fail-loud | _pending_ |
| OD9 | Color hysteresis threshold | 25% as §5.2.2 | _pending_ |

---

## 14. Document control

| Version | Date | Notes |
|---------|------|--------|
| **v0.1** | 2026-08-10 | Initial DRAFT |
| **v0.1.1** | 2026-08-10 | Dual-side HM15–HM17 (H1 resolved) |
| **v0.2** | 2026-08-10 | External review H2–H12: modal step + no-snap; parent citations; Width vocabulary; gex_v1 units; color hysteresis; MSC look vs code; payoff-math sentence; AT extensions; next_url hard error; standard-contracts-only; filename `v0_2` |
| **v0.2.1** | 2026-08-24 | **HM21** inspector tab-session (`sessionStorage` `ft_labs_heatmap_session`). Restores v0.1 §4.4 sessionStorage intent with Coach’s tab-lifetime rule. Distinct from HM5, §5.2.2, TR14. **AT-HM17**. **DL-575**. |

**Review disposition map:**

| Finding | Fold |
|---------|------|
| H1 | Already in v0.1.1; retained dual-side + AT-HM13 |
| H2 | HM8 no-snap · HM20 modal step · AT-HM12 |
| H3 | §1 parent table + landing-order |
| H4 | Width = course width |
| H5 | §5.5 gex_v1 units |
| H6 | §5.2.2 sticky scale · AT-HM16 |
| H7 | §0.2 |
| H8 | §0.3 · §10 |
| H9 | AT-HM11–14 |
| H10 | Canonical `v0_2` filename · hash procedure |
| H11 | HM18 · AT-HM3e |
| H12 | HM19 · AT-HM15 |

**One-line law:**  
**One dual-side, standard-contract chain under a complete (non-truncated) wing band; pushed and diffed once; pure templates recompute every snapshot — Width is center-to-wing; GEX is a labeled estimate with explicit units; last print held when closed; inspector selections stick for this tab (HM21).**
