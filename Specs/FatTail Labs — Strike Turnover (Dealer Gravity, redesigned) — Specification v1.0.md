# FatTail Labs — Strike Turnover (Dealer Gravity, redesigned) — Specification v1.0

**Status:** DRAFT for review. **Not a port.** A new design on a different data source.
**Date:** 2026-09-01
**Repo:** Fattail-Labs · **Scope:** one Options Lab Heatmap reading, client-side only.
**Sibling:** `FatTail-Labs-Heatmap-LIM-Template-Spec-v0_4.md` — independent, never fused.

**Supersedes in concept:** `Dealer-Gravity-Spec-v1.0.md` (MSC, retired). Shares no data source,
no metric and no vocabulary with it. See §0.

**Labs law:** `Options-Lab-Heatmap-Templates-Spec-v0_3` · `Architecture/29-options-lab-heatmap-templates.md`
**Invariants:** 2 · 4 · 5 · 6 · 10.

---

## 0. What changed from MSC's Dealer Gravity, and why

MSC's DG was an **underlier volume-by-price** profile built from Polygon SPY 1-minute and 1-second
bars, mapped `spx = spy × 10`. Its own §17 lists *"use SPX options OI or the chain"* as an explicit
**non-goal**.

That design cannot come to the Heatmap:

- The chain snapshot holds no underlier prints, so it needs a second data plane.
- SPX has no volume — an index cannot be traded — so any underlier profile for it is necessarily a
  proxy.
- A proxy's prices are not the chain's prices. A `proxy_label` disclosing that does not make the
  axes coincide.

**This design uses option volume from the ladder Labs already receives.** It is natively on the
strike axis, needs no second plane, no proxy and no reconciliation.

**And the name does not survive.** MSC's §1 conceded that *"dealer"* was a gravitational metaphor
and that the tool read no dealer activity. On option volume there is no gravity **and** no dealer:
volume says contracts changed hands, never who took which side. Working title is **Strike
Turnover**; the display name is Echo's (§13.2).

---

## 1. Purpose

> **Where is today's trading concentrated, and is the standing structure being rewritten?**

GEX is computed from **open interest** — the book as it settled last night. Turnover says whether
that book is being rebuilt today.

| Reading | Means |
|---|---|
| Large GEX, low turnover | A **stale** concentration. Standing positions nobody is touching. |
| Large GEX, high turnover | A **contested** concentration. The structure is changing under you. |

Every GEX chart in the category renders those identically. They are not the same thing.

This is the two-lens design from the GEX Tool Family Source Note: *"Two lenses everywhere: OI
structure and Δvolume today. If they disagree, that disagreement is the information."*

**TN1 — the primary misreading, stated first.** **Option volume at a strike is not where price
traded.** A strike can carry enormous volume while spot never approaches it. Nothing in this
reading is a statement about price occupancy, and no price-occupancy vocabulary is used (§12).

---

## 2. What already exists — do not rebuild

| Requirement | Already in Labs |
|---|---|
| Per-contract volume and OI | `LADDER_FIELDS` (`chain_ladder.py:18`) — `mid, bid, ask, volume, open_interest, delta, iv` |
| Dual-side contract map | `ChainContext.contracts`, keys `call:K` / `put:K` |
| Strike axis, spot, wings | `ChainContext` |
| Per-strike bar render | `gex.ts` → `buildGexProfile` |

No server module, no endpoint, no Redis, no `server/config.py`, no §8 allowlist file. **DL-539 does
not gate this.**

---

## 3. Input

**TN2.** Per strike `K`, from `ctx.contracts`: `callVolume`, `putVolume`, `callOi`, `putOi`.

**TN3.** One expiration — the Heatmap's. No aggregation across expirations.

**TN4.** The wings window, not the chain. Every share and ratio in §4 is **window-relative** and is
labelled as such.

---

## 4. Metrics

### 4.1 Per strike

```
volume = callVolume + putVolume
oi     = callOi + putOi

turnover  = oi > 0 ? volume / oi : null
sideSkew  = (callVolume − putVolume) / (callVolume + putVolume)      // ∈ [−1,+1], null if 0
volShare  = volume / Σ volume across the window                       // window-relative
```

**TN5 — the four states of `turnover`, none of which is zero-by-default:**

| `oi` | `volume` | Result |
|---|---|---|
| > 0 | > 0 | `turnover` computed |
| > 0 | 0 | `turnover = 0` — untouched today |
| **0** | **> 0** | `turnover = null`, **`newStrike = true`** — interest with no prior book |
| 0 | 0 | `valid = false` |

The third row is a real reading and must not be collapsed into null-as-missing. A strike that
carried no open interest and traded today is new interest, and that is information GEX cannot see
at all, because GEX is `Γ·OI·S²` and its OI is zero.

### 4.2 Relative turnover — the comparable number

**TN6.** Raw turnover is not comparable across expirations. A 0DTE contract turns over its entire
book in a session; a monthly barely moves. An absolute threshold would be wrong on one of them.

```
medianTurnover = median(turnover) over strikes in the window with oi >= TN_MIN_OI
turnoverRatio  = turnover / medianTurnover
```

**Turnover is judged against the window's own median**, so the reading is comparable across
expirations, symbols and days.

**TN7 — classification** (thresholds are config, §7):

| Condition | State |
|---|---|
| `turnoverRatio >= TN_CONTESTED_RATIO` | **contested** |
| `turnoverRatio <= TN_QUIET_RATIO` | **quiet** |
| otherwise | ordinary |
| `newStrike` | **new** — reported separately, not on the ratio scale |

### 4.3 Why MSC's structure detection does not transfer

**TN8.** MSC detected nodes, wells and crevasses by percentile of the volume bins. That works on
underlier volume-by-price because price occupancy is **multi-modal** — price visits many levels and
leaves genuine gaps.

**Option volume by strike is strongly unimodal.** It peaks near the money and decays hard both
ways. A 70th-percentile threshold on that shape rediscovers "near ATM," which is not a finding.

**Turnover removes the shape for free**, because open interest is *also* peaked at the money.
Dividing by it normalises the decay out, so what remains is genuine departure from the strike's own
baseline — a far strike with anomalous activity stands out instead of drowning.

**Nodes, wells and crevasses are not computed and the vocabulary is not used** (§12).

---

## 5. Result

```ts
type StrikeTurnover = {
  strike: number;
  callVolume: number;  putVolume: number;  volume: number;
  callOi: number;      putOi: number;      oi: number;
  turnover: number | null;         // null when oi == 0
  turnoverRatio: number | null;    // vs window median
  state: "contested" | "quiet" | "ordinary" | "new";
  sideSkew: number | null;
  volShare: number;                // window-relative
  newStrike: boolean;
  valid: boolean;
};

type TurnoverProfile = {
  rows: StrikeTurnover[];
  windowVolume: number;
  medianTurnover: number | null;
  expiration: string;
  wings: number;
  valid: boolean;
};
```

---

## 6. Render

**TN9 — modulate the existing GEX bar. Do not add a rail.** Turnover state is carried on the bar
already drawn, by **outline weight or hatch density**. A contested strike reads as a bright-edged
bar; a quiet one as flat.

- **Not glow** — that channel is LIM's spot-line signature and a signature only works while rare.
- **Not fill colour** — the GEX bar's fill already encodes side and sign.

**TN10 — `new` strikes get a distinct mark**, not a position on the ratio scale. Their GEX bar is
zero-height by construction (`OI = 0`), so without a mark they are invisible.

**TN11 — absence is never zero** (GXF33). A strike with no contract data renders an invalid marker.
`turnover = null` renders as *undefined*, never as `0`. Only `oi > 0, volume == 0` renders as zero,
and it means *untouched today*.

**TN12 — tooltip** per strike: volume and OI by side, `turnover`, `turnoverRatio`, `sideSkew`,
state, and the window caveat.

**TN13 — optional volume rail**, behind `TN_SHOW_VOLUME_RAIL`, default **off**. A thin `volShare`
histogram beside the GEX rail. The default reading is the modulated bar; the rail is the study
layer.

**TN14 — chrome** states the expiration, the wing count, and two standing lines:
*Window-relative — turnover is judged against this window's median.* and
*Volume does not state side, opening or closing.*

---

## 7. Configuration — Invariant 2

Every key required; missing or invalid **aborts boot**.

| Key | Value | Governs |
|---|---|---|
| `LABS_TN_MIN_OI` | 1 | TN6 median sample |
| `LABS_TN_CONTESTED_RATIO` | 2.0 | TN7 |
| `LABS_TN_QUIET_RATIO` | 0.25 | TN7 |
| `LABS_TN_SHOW_VOLUME_RAIL` | `false` | TN13 |

Values are proposals, not findings. **They are the two thresholds most likely to need tuning after
a live tape**, and any change to them is breaking (§14).

---

## 8. Acceptance

| ID | Case | Expect |
|---|---|---|
| **AT-TN1** | `oi > 0`, `volume > 0` | `turnover = volume / oi` |
| **AT-TN2** | `oi > 0`, `volume == 0` | `turnover = 0`, state `quiet`, **renders as zero, not invalid** |
| **AT-TN3** | `oi == 0`, `volume > 0` | `turnover = null`, `newStrike = true`, state `new`, marked despite a zero-height GEX bar |
| **AT-TN4** | `oi == 0`, `volume == 0` | `valid = false`, invalid marker |
| **AT-TN5** | Same absolute turnover, 0DTE vs monthly window | `turnoverRatio` comparable; raw `turnover` is not |
| **AT-TN6** | One strike at 5× the window median | state `contested` |
| **AT-TN7** | Uniform turnover across the window | every `turnoverRatio ≈ 1`, all `ordinary` — no false structure |
| **AT-TN8** | Unimodal volume, flat turnover | **no strike classified by proximity to ATM** (TN8) |
| **AT-TN9** | `callVolume == putVolume` | `sideSkew = 0` |
| **AT-TN10** | Strikes with no contract data | invalid marker, never a zero bar |
| **AT-TN11** | Any config key absent | boot aborts |
| **AT-TN12** | Grep of every output string and field name | contains none of: *gravity, dealer, magnet, pin, wall, node, well, crevasse, POC, VAH, VAL, value area, HVN, LVN* |
| **AT-TN13** | Median sample excludes `oi < TN_MIN_OI` | confirmed |

Characterization suite green before each commit; tests land in the same change.

---

## 9. Pairing with LIM and GEX — reading, not computation

**TN15.** Strike Turnover publishes no composite and is never blended with LIM or with GEX. The
pairing is a reading a member performs, not a number the system emits.

| GEX | Turnover | Reading |
|---|---|---|
| Large | contested | The structure here is being rebuilt today |
| Large | quiet | Standing book, nobody trading it |
| Small | contested | Activity where there is little standing structure |
| — | new | Interest at a strike GEX cannot see, because its OI is zero |

The last row is the one nothing else in the category can show: **GEX is blind to a strike with no
open interest, however much it trades today.** Tomorrow that strike has OI and appears in the
profile. Turnover sees it a day early.

---

## 10. Known caveats (contractual, and on the chrome)

1. **`volume` is the vendor's `day.volume`** — the field under investigation in P-SV10–17, which
   sat 22.84% above the aggregates on 2026-08-19 and matched exactly on 2026-09-01, mechanism
   unknown. Turnover is a **ratio**, so a uniform level error largely cancels; a **strike-dependent**
   error would not. Whether the residual is strike-dependent is the one open question that bears on
   this reading, and it is narrower than waiting for P-SV1 to close (§13.5).
2. **Volume never states side.** Not bought, sold, opened or closed (GXF38) — including in field
   names. High turnover can be positions being **closed**.
3. **Multi-leg trades post volume on every leg.** One butterfly prints across three or four strikes
   and is indistinguishable from three separate trades.
4. **Turnover compares today's volume to yesterday's open interest.** OI settles T+1. A strike that
   opened heavily yesterday carries large OI today and reads quiet even if it is still busy.
5. **Window-relative.** `turnoverRatio` and `volShare` are computed over the wings window. Two
   windows are not comparable bin-for-bin.
6. **One expiration.** No term structure.
7. **Option volume is not price occupancy** (TN1).

---

## 11. Non-goals

Strike Turnover does not: read underlier volume, bars or any second data plane · detect nodes,
wells or crevasses · assert price occupancy · state side, opening or closing · forecast direction ·
gate orders · fuse with LIM or GEX into a score · publish a "gravity", "magnet" or "dealer"
quantity.

---

## 12. Vocabulary

**Permitted:** turnover · contested · quiet · new · side skew · window-relative · volume · open
interest.

**Not used**, in copy, chrome, tooltips, field names or agent tool descriptions: *gravity, dealer,
magnet, pin, wall, support, resistance, node, well, crevasse, POC, VAH, VAL, value area, HVN, LVN.*
Enforced by AT-TN12.

The first group is banned by GXF35 or by TN1; the second group is price-occupancy vocabulary that
does not apply to an option-volume reading.

---

## 13. Open decisions

| # | Item | Owner |
|---|---|---|
| 1 | Approve into `Specs/` | **Coach** |
| 2 | Display name. *Dealer Gravity* does not survive the redesign — no gravity, no dealer | **Echo** |
| 3 | `TN_CONTESTED_RATIO` / `TN_QUIET_RATIO` after a live tape | **Hotel** |
| 4 | Whether `new` strikes earn a mark on the main surface or the study layer | **Echo · Tango** |
| 5 | **Is the P-SV residual strike-dependent?** If uniform, turnover is usable now; if it varies by strike, the ratio is contaminated. Narrower than closing P-SV1 and answerable from the existing P-SV12/16 tapes | **Coach → Grok Build** |
| 6 | Does this supersede the SVP session-volume rail, or sit beside it | **Juliet** |

---

## 14. Change control

Any change to `TN_CONTESTED_RATIO`, `TN_QUIET_RATIO`, `TN_MIN_OI`, the median baseline, or the
turnover definition is a **breaking change** to every reading a member has seen. Do not retune
silently. Version and record old versus new.

---

## 15. Files in scope

```
web/lib/options-lab/templates/turnover.ts        (new)
web/lib/options-lab/templates/turnover.test.ts   (new)
web/lib/options-lab/templates/gex.ts             (bar modulation; optional volume rail)
Architecture/29-options-lab-heatmap-templates.md
Architecture/00-decision-log.md                   (same day)
```

**Out:** any MSC import · server/ · underlier bars · `market_ohlc_bars` · a second data plane · any
composite with LIM.

---

## 16. Document control

| Version | Date | Notes |
|---|---|---|
| **v1.0** | 2026-09-01 | New design. Option volume from the ladder replaces MSC's SPY underlier profile. Turnover (`volume / OI`) against the window median replaces percentile node/well/crevasse detection, which does not transfer to a unimodal axis. `new` strikes surfaced — GEX is blind to them. Renders as modulation of the existing GEX bar rather than a second rail. Name retired pending Echo. **No law created.** |