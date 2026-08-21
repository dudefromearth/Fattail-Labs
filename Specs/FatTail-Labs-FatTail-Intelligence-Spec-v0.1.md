# FatTail Labs — FatTail Intelligence Spec v0.1

**Status:** DRAFT — Coach 2026-08-20. **v0.1.2** trail floor inherits AZ-ALGO v1.0.2 / DL-482. **v0.1.1** FTI-B1 session-scaled σ · FTI-A1 exit-fill retry · FTI-A2 ATM=calls. StudioOne **research** project. Not BUILD AUTHORITY until Coach Phase 5.  
**Type:** Method Spec — 0DTE butterfly grid on gold chain snapshots; successor **method** to Structure Surface Replay for this research.  
**Short name:** **FTI**  
**Host:** **StudioOne** (research). Not a member suite page in v0.1.  
**Filename:** `FatTail-Labs-FatTail-Intelligence-Spec-v0.1.md`

**Successor note:** This spec **succeeds the Structure Surface Replay method** for the snapshot-grid research. It **preserves SSR §A1 lock** (cite, do not rewrite). It **names which residuals the snapshot plane retires**.

**Parents:**

| Doc | Role |
|-----|------|
| [SSR Spec v0.1](./FatTail-Labs-Structure-Surface-Replay-Spec-v0_1.md) **§A1** | Coach lock **preserved** |
| [AZ-ALGO Spec v1.0.2](./FatTail-Labs-Options-Lab-Analyzer-Algo-Alert-Spec-v1.0.md) **§7** | **Normative exit math** — **cite, do not restate** · **DL-472** · **DL-473** · **DL-482** · **DL-488** |
| [OPF Spec v0.2.1](./FatTail-Labs-Options-Pricing-Foundation-Spec-v0_2.md) | Engines / τ / listed IV — **OD-FTI-OPF open** |
| OT-EF · **DL-309** | No invented strikes |
| **DL-400** | StudioOne gold chain snapshots **3–5s**, full greeks, from 2026-08-17 open |

### OD-FTI-OPF (open — header, unresolved)

**Coach:** consumes OPF over HTTP vs declared research infrastructure **outside the governed suite**. **Do not resolve** in this spec. Strategy Lab side still in work.

Until Coach stamps: every run **names** which plane it used (`opf_http` \| `research_infra`). Silence is not a choice.

**Review protocol:** **BLOCKING** vs **ADVISORY** only. Hypothesis in §8 is **not a claim**.

---

## 0. Coach intent (do not drop)

1. **StudioOne research project**, successor to the Structure Surface Replay method — **preserve SSR §A1 lock**, mark which residuals the snapshot plane retires.  
2. **Data plane:** StudioOne 0DTE chain snapshots per **DL-400** (3–5s, full greeks, 18–20 symbols).  
3. **Model** = `(symbol, day, entry minute, body strike)`. Butterfly at **every strike every minute from open**, **390** entry minutes, tracked to close.  
4. **Width:** fixed per the regime table — Zombieland <17 → 20–30, Goldilocks 1 17–24.5 → 30–40, Goldilocks 2 24.5–32 → 40–50, Chaos >32 → 50–60. **Not a fifth axis in v1.**  
5. **Strike range:** **±2.5σ** from spot at entry, not full chain.  
6. **Exit policy:** the **AZ-ALGO trail is the exit law** — cite AZ-ALGO Spec **§7** (v1.0.2, DL-472/DL-473/DL-482/DL-488) as normative math: arm / trail / `f` **per member knobs** (defaults 75%→25%, DL-482), monotone (running min), near/far re-invert through the body, exit on trail violation with `exit_side` recorded; else hold to close. **Do not restate the math — cite it.** One law, two implementations: the spec requires a **shared conformance fixture set** parameterized on knob inputs (`entry_pct`, `trail_start_pct`, `trail_floor_pct`) — same inputs → same `f(t)`, same exit, same `exit_side` — between `algoTrailMath.ts` and the sim’s implementation. Sim consumes knobs as inputs, not baked defaults.  
7. **Monte Carlo:** 100–500 draws per cell; fill friction equation returns **`p_fill` only** (spread, liquidity, volatility) — **no fill-price distribution**. Fills at **observed mid marks**; the **systematic optimism on cost is a named residual, not a defect — record it**.  
8. **Design law:** **walk once, sample many** — path computed once per cell, draws re-sample **fill events only**.  
9. **OPF boundary:** open OD in the header — consumes OPF over HTTP vs declared research infrastructure outside the governed suite. Do not resolve.  
10. **Expected finding to record as a hypothesis, not a claim:** trail exits **rare in low-vol regimes, more frequent in high-vol**.

---

## 1. Job

Measure, on gold 0DTE snapshots, what a **listed butterfly at every eligible body, every RTH minute** does under **one** exit law (AZ-ALGO §7) and a **Bernoulli fill** at **observed mids**.

Output is a **distribution per cell** (and pooled by regime), not an equity line, not a stub, not a profit claim.

This is **research infrastructure** (StudioOne). It is **not** the Analyzer Algo UI and **not** a member backtest button until a later spec.

---

## 2. SSR §A1 lock (preserved)

**Normative:** [SSR Spec v0.1 §A1](./FatTail-Labs-Structure-Surface-Replay-Spec-v0_1.md) is **not rewritten**. Formal projection still includes:

| Lock | Stands |
|------|--------|
| **A1.1** | VP bins ≠ options simulation. Do not collapse. |
| **A1.2** | Options method = changing curve through the session; easier equivalent was the sheet. FTI uses **snapshots** as the curve’s evidence. |
| **A1.3** | Path is on the model the whole day; events are crossings + height, not “found the sheet?” |
| **A1.5** | Touch ≠ fill · Monte Carlo · **distribution** (shape matters). |
| **A1.6** | Reasonable, not perfect; residuals **named**. |
| **A1.7** | No stub as measurement; no inventing option prints from SPY tape; no single unseeded equity line. |
| **A1.8** | Single day first, inspect the distribution, then several days, then dials — **still the research sequence** unless Coach opens a different slice for FTI. |
| **A1.9** | Forward walk is the **same** method on holdout days, not a second engine. |

FTI does **not** delete SSR. It is the snapshot-grid **successor method** for this research.

---

## 3. Residuals the snapshot plane retires

DL-400 gold snaps (3–5s, **full greeks**, 18–20 symbols) **retire** these SSR residuals **inside the snap universe**:

| Residual (SSR) | Snapshot plane |
|----------------|----------------|
| **SSR13** invent option prices from underlier tape and call them the market | **Retired** — contract marks/greeks come from the snap. |
| **SSR11** silent 0.20 / unlabeled VIX when a listed cell is on the snap | **Retired** for that cell. Hole in the snap → **named** IV NO / NOT TRADED, still no silent 20%. |
| **A1.7 harder movie** (full vicinity-minute OPRA) for gold 0DTE symbols | **Retired as a blocker** — the snap **is** the vicinity chain at 3–5s. |
| OPF `surface_reconstruct` VIX-flat weak sheet | **Not used** for FTI cells. |

**Not retired** (still named):

| Residual | Law |
|----------|-----|
| **SSR7** touch ≠ fill | In. Friction → **`p_fill` only**. |
| **SSR12** open is a fill | In. |
| **SSR8 / SSR10** distribution is SoR | In. |
| **SSR14** no stub | In. |
| **SSR15** SPX/SPY honesty | In. Never center SPX strikes on SPY. |
| **SSR1** VP ≠ this sim | In. |
| **Mid-fill optimism** | **Named residual, not a defect** (§6). Record it on every run. |
| No fill-**price** distribution | Coach: **out** of v1. |
| Width as a search axis | **Out** of v1 (§5). |
| **OD-FTI-OPF** | Open. |

---

## 4. Data plane

| Law | |
|-----|--|
| Host | StudioOne |
| Cadence | **3–5s** chain snapshots, full greeks (**DL-400**). Friday 2026-08-14 stays labeled 5-min. |
| Universe | **18–20 symbols** as captured on StudioOne. This spec does **not** invent the ticker list. |
| Product | **0DTE** chain for that symbol-day. |
| Time | RTH **open → close**. **390** entry minutes (09:30–16:00 ET inclusive of the open minute; last-trade honesty per product if a symbol’s cash close is 16:00 vs 16:15 — **do not invent**; snap clock is the SoR). |

Missing snap / missing listed body → **skip the cell** with a named reason. Do not interpolate a fly that was not listed.

---

## 5. Model and geometry

**Cell key:** `(symbol, day, entry_minute, body_strike)`.

At each entry minute, for each **listed** body in **±2.5σ_entry of spot at that minute**.

**FTI-B1:** \(\sigma\) is **not** annualized ATM IV × spot (that would be ~±50% of spot at 20% IV — the full chain, which defeats the ruling). Scale to **remaining session**:

\[
\sigma_{\mathrm{entry}} = S \times \mathrm{IV}_{\mathrm{ATM}} \times \sqrt{\tau_{\mathrm{rem}}}
\]

- \(S\) = spot at the entry minute  
- \(\mathrm{IV}_{\mathrm{ATM}}\) = listed ATM IV **decimal** on the snap at that minute  
- \(\tau_{\mathrm{rem}}\) = years from that minute to **that symbol-day’s expiry instant** (same τ basis as OPF for that product). Band **tightens** as τ burns — a 15:30 entry must not scan the morning’s range.  

Order of magnitude (characterization, not a second formula): 20% IV, SPX 6000, near the open → **± ~190 points**, not ±3000. Unmeasured ATM IV → **skip the cell**, named — do not invent σ. Do not invent a VIX-only σ if the snap has ATM IV.

Place a **listed butterfly** (+1 / −2 / +1, same right as the OTM side of that body vs spot; OT-EF listed strikes only). **FTI-A2:** at **exactly ATM** (body = listed strike nearest spot, no OTM side), default **calls** so the grid is deterministic.

**Width** is **fixed by regime**, not a fifth axis:

| Regime | Input | Width (points) |
|--------|-------|----------------|
| Zombieland | < 17 | 20–30 |
| Goldilocks 1 | 17–24.5 | 30–40 |
| Goldilocks 2 | 24.5–32 | 40–50 |
| Chaos | > 32 | 50–60 |

**Input** is the Coach table as written (typical reading: VIX or ATM-IV **percent** at **entry**). v1 **does not search** width. Pick a **listed** width **inside the band** (nearest listed span to the band midpoint is lawful until Coach names a pick). Record `regime`, `width_pts`, `regime_input` on the cell.

OTM vs ATM: body vs spot at entry. ATM body may still be a cell; FTI is a **grid**, not Analyzer eligibility. Analyzer Algo UI eligibility (`isOtmDebitButterfly`) is **not** this grid filter unless a later OD says so.

Track each placed fly **to session close** or **trail exit**, whichever first.

---

## 6. Exit law (cite, do not restate)

**Normative math:** [AZ-ALGO Spec v1.0.2 §7](./FatTail-Labs-Options-Lab-Analyzer-Algo-Alert-Spec-v1.0.md) · **DL-472** · **DL-473** · **DL-482** · **DL-488**.

Coach summary (not a second formula): `f` **per member knobs** (defaults 75%→25%, DL-482); **monotone running min**; near/far **re-invert** through the body; exit on trail violation with **`exit_side`**; else **hold to close**.

The **shared conformance fixture set** is parameterized on `entry_pct`, `trail_start_pct`, `trail_floor_pct`. Defaults are placeholders. Sim implementation **consumes knobs as inputs**.

**Do not restate §7 in this file.** A drift between files is a **spec break**.

**One law, two implementations:**

| Implementation | When |
|----------------|------|
| `web/lib/options-lab/algoTrailMath.ts` | Analyzer Algo (when that packet lands) |
| FTI sim | StudioOne research |

**Required:** a **shared conformance fixture set**. Same inputs → same `f(t)`, same exit boolean, same `exit_side`. Both implementations **must** consume it. Adding a fixture that one side fails is a **FAIL** of that side, not a “research exception.”

---

## 7. Monte Carlo and fill

| Law | |
|-----|--|
| **N** | **100–500** draws **per cell**. Record `N`. |
| **Walk once, sample many** | Compute the **path** (underlier + package mark vs time) **once** per cell from snaps. Draws re-sample **fill events only** — not a second path. |
| **Friction** | Returns **`p_fill` only** from **spread, liquidity, volatility**. **No** fill-price distribution. |
| **Entry fill** | Draw `p_fill` at the entry snap. Open is a fill (SSR12) subject to that draw. Fill price = **observed mid**. |
| **Exit fill (FTI-A1)** | When AZ-ALGO §7 **fires a trail exit**, the exit is **not** guaranteed at the line. Draw `p_fill` from the **same** friction equation at that snap. **Failure retries each subsequent snap** until filled or session **close**. A failed exit in Chaos can ride a collapsing fly to the bell — that shape is in the distribution. Record attempts. |
| **Fill price** | **Observed mid** on the snap that fills (entry or exit). |
| **Optimism residual** | Filling at mid is **systematically optimistic on cost** — **entry and exit**. **Named residual, not a defect.** Every run records `fill_price=observed_mid` and `residual=mid_fill_optimism`. |
| **Touch ≠ fill** | SSR7 stands. |
| **SoR** | Per-cell **distribution** (draw outcomes: hold-to-close vs `exit_side=near|far`, marks at exit/close). Shape matters. A mean is a derivative. |

Do not vary the **path** per draw. Do not invent mids.

---

## 8. Hypothesis (not a claim)

**Record as hypothesis:**

> trail exits rare in low-vol regimes, more frequent in high-vol.

Not a finding until a labeled run says so. Member-facing copy (if any later) **must not** quote this as a result (Invariant #8). Research notes may say **hypothesis**.

---

## 9. Ideas inventory

| Idea | Seat |
|------|------|
| StudioOne gold snaps DL-400 | **IN-SCOPE** |
| Cell `(symbol, day, minute, body)` · 390 minutes · ±2.5σ_entry with \(\sqrt{\tau_{\mathrm{rem}}}\) | **IN-SCOPE** · **FTI-B1** |
| ATM body default **calls** | **IN-SCOPE** · **FTI-A2** |
| Exit fill: `p_fill` + retry each snap until fill or close | **IN-SCOPE** · **FTI-A1** |
| Regime width table, not a fifth axis | **IN-SCOPE** |
| AZ-ALGO §7 exit + shared fixtures | **IN-SCOPE** |
| Walk once, sample many · p_fill only · mid fill · named optimism | **IN-SCOPE** |
| Preserve SSR §A1 · retire snapshot-solved residuals | **IN-SCOPE** |
| Hypothesis low-vol vs high-vol exits | **IN-SCOPE** as hypothesis |
| OD-FTI-OPF | **OPEN** |
| Width search / fifth axis | **OUT** v1 |
| Fill-price distribution | **OUT** v1 |
| Member UI / Analyzer | **OUT** v1 |
| Stub metrics | **OUT** (SSR14) |
| Inventing the 18–20 ticker list in this spec | **OUT** — StudioOne capture is SoR |

---

## 10. Out of scope

- Implementation plan until Phase 5.  
- Resolving OD-FTI-OPF.  
- Shipping a member Intelligence app.  
- Restating AZ-ALGO math.  
- VP bins as this sim.  
- MiniTwo product deploy.

---

## 11. Acceptance (when BUILD)

| AT | Criterion |
|----|-----------|
| **AT-FTI-1** | Cell grid: 390 entry minutes × listed bodies in **±2.5σ_entry**; \(\sigma_{\mathrm{entry}} = S \times \mathrm{IV}_{\mathrm{ATM}} \times \sqrt{\tau_{\mathrm{rem}}}\). Annualized \(S\times\mathrm{IV}\) alone is **FAIL**. Band tightens with τ. Listed flies only. |
| **AT-FTI-2** | Width from regime table only; not searched. |
| **AT-FTI-3** | Exit uses AZ-ALGO §7 via shared fixtures — same `f(t)` / exit / `exit_side` as `algoTrailMath`. |
| **AT-FTI-4** | Path once per cell; N draws resample fills only; `p_fill` only; fill at snap mid; `residual=mid_fill_optimism` recorded. **Exit fill:** same `p_fill`; miss retries next snap until fill or close (FTI-A1). |
| **AT-FTI-5** | SSR13-class invention of option prices from tape **absent**. Holes named. |
| **AT-FTI-6** | Hypothesis is labeled hypothesis, not a claim. |
| **AT-FTI-7** | Run names `opf_http` or `research_infra` (OD open). |

---

## 12. Changelog

| Ver | Date | Notes |
|-----|------|--------|
| **v0.1.2** | 2026-08-20 | Exit summary inherits AZ-ALGO v1.0.2: `f` per member knobs (defaults 75%→25%, DL-482). Conformance set parameterized; sim consumes knobs as inputs. **DL-488**. |
| **v0.1.1** | 2026-08-20 | **FTI-B1:** \(\sigma_{\mathrm{entry}}=S\cdot\mathrm{IV}_{\mathrm{ATM}}\cdot\sqrt{\tau_{\mathrm{rem}}}\). **FTI-A1:** exit `p_fill` + retry to close. **FTI-A2:** ATM default calls. |
| **v0.1** | 2026-08-20 | Coach: snapshot-grid successor to SSR method; A1 preserved; residuals retired named; AZ-ALGO §7 cite; walk once sample many; OD-FTI-OPF open. |
