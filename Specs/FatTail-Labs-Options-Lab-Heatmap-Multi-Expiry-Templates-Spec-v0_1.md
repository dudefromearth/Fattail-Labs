# FatTail Labs — Options Lab Heatmap Multi-Expiry Templates Spec v0.1

**Status:** **DRAFT** — advisor draft for Coach review. Not ratified. No seed fires from this file.  
**Date:** 2026-08-21  
**Current revision:** **v0.1**  
**Type:** Template Catalog Addendum to Heatmap Templates Spec v0.2 → proposes **HM v0.3**  
**Canonical filename:** `Specs/FatTail-Labs-Options-Lab-Heatmap-Multi-Expiry-Templates-Spec-v0_1.md`  
**Short name:** **Multi-Expiry Templates** / **ME**

**Content hash:** whole-file sha1 recorded in DL at Coach GO (per Advanced Fly L9 — not in-file).

**Coach rulings this draft rests on (2026-08-21):**
1. Multi-calendar positions are in scope. Supersedes HM v0.2 §10 non-goal "multi-expiry matrix in first ship."
2. OPF generates 0–5DTE dual-side chain snapshots continuously during RTH (Arch 30 L1 already holds this).

**Nothing of Coach's is removed or altered by this draft.** Ideas not in this wave (Spread Tax Map, Tent Drift, Skew Spine, Breakeven Ribbons, Implied-Move Fence, Put–Call Mirror, OI Tornado, Velocity Field, Theta Clock, Walk Strip, iron-fly, condor, fair-value residual, ratio spread held, diagonal, double calendar, theta ladder) are carried in §12 Ideas Inventory, not dropped.

---

## 0. Mission

Three templates that read **more than one expiration book** from the OPF-held generation store and answer, per strike, one question each:

| Template | Question | Layout |
|---|---|---|
| `calendar` | What does one more expiration of clock cost at this strike, and what decay differential does it buy? | matrix |
| `term-spine` | What is the chain's own term structure, and how does skew sit on it per expiry? | profile |
| `fly-roll` | What does moving this exact tent to the next expiration cost, strike by strike? | matrix |

All three are **observation-only** structure descriptors (HM §0.3). None ranks, recommends, or composites into a signal (OD-AF7 / NX4 untouched).

---

## 1. Parents / companions

| Spec / doc | Role |
|---|---|
| Heatmap Templates Spec **v0.2.1** | Parent contract. HM1–HM21 apply **per expiration book**. HM21 inspector tab-session is host chrome, not a second expiry book. |
| Advanced Fly Spec **v0.2.1** + Bench Plan v1.1 | Fly geometry, L6 Credit display, L7 slope/curvature, `flySurfaceHistory`, AF17 |
| OPF Spec **v0.2.1** · Arch 30 | τ per leg (§3.7 incl. `settlement: am\|pm`, 1-min floor); multi-exp generation store (L1); epoch skew `max_skew_ms` / `epoch_quality`; OD-PF8 |
| Options Chain Picker v1.0.2 | Universe SoR |
| Human Interface v1.0 | Tokens · ≥44pt · reduced motion |

**Landing-order note:** if Advanced Fly v0.2.1 is not at its cited path at clone time, block ME GO. Do not invent weaker fly law.

---

## 2. Laws (new — ME)

| ID | Law |
|---|---|
| **ME1 — Per-book identity** | Each expiration is its own generation under HM1 key `(symbol, expiration, wings)`. HM15–HM20 apply **independently** per book (own modal step, own `excluded_adjusted_count`, own HM17 one-page budget, own HM18 `next_url` hard error). No shared-budget multi-exp generation. |
| **ME2 — Context carries N books** | `ChainContext.books: Map<expiration, Book>` where `Book = { expiration, spot, strikeStep, asOf, contentHash, calls, puts, meta }`. `ChainContext.front` and `.back` are **views** onto `books`, selected by params — never copies. Single-expiry templates read `books.get(front)` unchanged; HM v0.2 templates are not modified. |
| **ME3 — Epoch skew inherited** | A cross-book cell is computed from legs on ≥2 books. Cell carries `max_skew_ms = max\|asOf_i − asOf_j\|` and `epoch_quality` per OPF Arch 30. If `max_skew_ms > LABS_OPF_MAX_SKEW_MS` (OD-PF8, default 3000) the cell is **invalid** "—" with tooltip "books out of epoch". No silent mixing of a stale front with a fresh back. Config, not constant. |
| **ME4 — Strike intersection, no snap** | A cross-book cell at strike K requires K to be a **listed standard strike on every book involved**. HM8 applies to every leg on every book. Forbidden: snapping a back-book leg to the nearest listed strike. |
| **ME5 — τ per leg from OPF** | Every leg's τ is `τ(exp_ℓ, clock, settlement_ℓ)` per OPF §3.7. Templates never compute τ locally. 0DTE front in the final hour follows last-minute truth (Surface §4.6a): 1-minute floor, no painting through 15:59. |
| **ME6 — Same side across books** | `calendar` and `fly-roll` legs are the **same option type** on both books (call calendar or put calendar). Mixed-type cross-book structures are out of scope (§10). |
| **ME7 — Credit/debit sign** | Debit-positive convention as HM §5.2. Where a structure nets to a credit, display per Advanced Fly L6 (magnitude + CR chip); signed value retained. |
| **ME8 — Term structure honesty** | `term-spine` draws ATM IV per book from the **listed** strike nearest spot on that book (HM8 — if no listed strike within one modal step of spot, that book's spine point is invalid, not interpolated). Missing IV on any book is a gap, never filled (IV NO). |
| **ME9 — Expiry set from OPF** | The available expiration list is read from the OPF interest/generation store, not hardcoded. Default front = nearest listed expiry (0DTE on trading days with one); default back = next listed. Symbol, DTE range, and defaults are config/params (Invariant 2). |
| **ME10 — Subscribe by interest** | Selecting a back expiry registers interest with OPF for that book (Arch 30 InterestManager). Switching back expiry **does not** open a second Massive pull; it attaches to or requests a generation through OPF. HM2/HM3 hold per book. |

---

## 3. ChainContext delta (HM §4.3 → v0.3)

```
ChainContext {
  symbol, viewSide, wings,
  books: Map<expiration, Book>,      // ME2
  front: expiration,                 // param-selected
  back:  expiration | null,          // param-selected; null for single-exp templates
  asOf: max(books[*].asOf),          // display only — cells use per-book asOf (ME3)
  meta: { skew: { max_skew_ms, epoch_quality } }
}
Book {
  expiration, spot, strikeStep, asOf, contentHash,
  calls: Map<strike, LadderRow>, puts: Map<strike, LadderRow>,
  meta: { excluded_adjusted_count, settlement: "am"|"pm", tau }
}
```

**Compatibility:** `spot`, `strikeStep`, `calls`, `puts` on the root context are **removed** in v0.3; existing templates are migrated to `books.get(front)` in the same change (Invariant 6, documentation parity). Kilo: characterization tests for `ladder`, `sym-fly`/Advanced Fly, `gex` must pass unchanged against the front book.

### 3.1 Params (HM §4.4 additions)

| Param | Values | Default |
|---|---|---|
| `frontExpiration` | listed expiry | nearest |
| `backExpiration` | listed expiry > front | next listed |
| `backMode` | `single` \| `column_sweep` | `single` |
| `calendarSide` | `call` \| `put` | `call` |
| `widthMode`, width list | as HM §4.4 (fly-roll) | step_multiples, N=7 |

`backMode = column_sweep` renders **all** back expiries in the OPF interest set as columns (0–5DTE → up to 5 columns). Each column is a cross-book cell against its own book; ME3 applies per column.

---

## 4. Template catalog (additions to HM §5)

### 4.1 `calendar` — same-strike calendar matrix

**Structure:** −1 @ K on `front`, +1 @ K on `back`, same side (`calendarSide`). Long calendar.

**Rows:** listed strikes in the **intersection** of front and back standard strikes within wings (ME4).  
**Columns:** `backMode = single` → one column per value mode sub-view; `column_sweep` → one column per back expiry.

**Debit (mid):**

\[
D_{cal}(K) = m_{back}(K) - m_{front}(K)
\]

Invalid if either mid null (HM7), either strike unlisted (ME4), or epoch skew exceeded (ME3).

**Value modes:**

| Mode | Definition | Notes |
|---|---|---|
| `debit` | \(D_{cal}\) | **default**; L6 display if negative |
| `theta_diff` | \(\theta_{front}(K) - \theta_{back}(K)\) | the decay differential the calendar holds; null θ on either leg → invalid |
| `vega_diff` | \(\nu_{back}(K) - \nu_{front}(K)\) | retained; null → invalid |
| `iv_spread` | \(IV_{back}(K) - IV_{front}(K)\) | in vol points; IV NO on either → invalid |
| `theta_per_debit` | \(\texttt{theta\_diff} / D_{cal}\) when \(D_{cal} > 0\); else invalid | descriptor only; not a score |

**Max structural loss / R2R:** for a long calendar, max loss ≈ \(D_{cal}\) **only** for hold-to-front-expiry with back held; no R2R mode ships in v0.1 (same gate as bw-fly: explicit max-loss definition + Coach Accept, OD-ME3).

**Color:** diverging on **`theta_diff`** regardless of active value mode (analogue of AT-HM7: color on rate, not level), with §5.2.2 sticky p95 hysteresis. Coach may override to color-on-active-mode (OD-ME2).

**Copy (Tango/Hotel gate):** header "Calendar — long back / short front, same strike". Never "cheap," "favorable," "opportunity." Tooltip shows both legs' `asOf` and `max_skew_ms`.

### 4.2 `term-spine` — term structure with skew ribs

**Layout:** `profile`. Horizontal axis = expiration (DTE order); vertical = IV.

**Spine:** for each book, ATM IV = IV at the listed strike nearest spot **on that book** (ME8). Calls and puts drawn as two spine points per expiry (no averaging; gap between them is the call/put ATM IV gap, drawn as a short vertical tick).

**Ribs:** for each book, IV at strikes spot ± k·strikeStep for k = 1..R (param `ribDepth`, default 4), drawn as thin ribs off the spine, calls one side, puts the other. Slope and curvature of each rib set reuse Advanced Fly L7 primitives (per-point FD, uniform triples only, edges invalid).

**Value modes (for the data table beneath the profile):**

| Mode | Definition |
|---|---|
| `atm_iv` | spine values per book |
| `term_slope` | \(IV_{i+1}^{ATM} - IV_i^{ATM}\) per adjacent pair, per side; invalid if either missing |
| `rib_skew` | per book: \(IV(spot - k\Delta) - IV(spot + k\Delta)\) at k = ribDepth, per side |

**Color:** none on the profile itself (HIG tokens, two-side line colors). Table cells single-hue on `term_slope` sign.

**Honesty:** no curve fitting, no interpolation between books, no "implied forward vol." A missing book is a gap in the spine.

### 4.3 `fly-roll` — tent roll cost matrix

**Structure:** the Advanced Fly long fly (K, w) priced on `front` and on `back`, same side, same legs.

**Rows:** center strikes in intersection (ME4) where K±w listed on **both** books.  
**Columns:** widths as Advanced Fly (`widthMode`).

\[
D_{front}(K,w) = m_f(K-w) + m_f(K+w) - 2m_f(K)
\]
\[
D_{back}(K,w)  = m_b(K-w) + m_b(K+w) - 2m_b(K)
\]
\[
\mathrm{Roll}(K,w) = D_{back} - D_{front}
\]

Any of six legs null/unlisted → invalid. Epoch skew → invalid.

**Value modes:**

| Mode | Definition |
|---|---|
| `roll` | \(\mathrm{Roll}\) — **default**; L6 display if negative |
| `roll_pct` | \(\mathrm{Roll}/\|D_{front}\|\) if \(D_{front} \ne 0\); else invalid (AT-HM14 pattern) |
| `back_debit` | \(D_{back}\) alone |
| `theta_diff_fly` | \(\Theta_{fly,front} - \Theta_{fly,back}\) (leg-sum θ); null → invalid |

**Color:** diverging on `roll_pct` with sticky hysteresis.

**Pairing note:** Tent Drift (future wave) and fly-roll are designed to share the (K,w) grid so a member can read "the clock is eating this tent" and "buying one more expiry of clock costs X here" on the same geometry.

---

## 5. UI law additions (HM §6)

- Controls gain **Back expiry** selector (and **Sweep** toggle) beneath Expiry. Front/back shown as two chips with each book's `asOf` age and `epoch_quality` badge.
- Stream status shows per-book state; a held or errored back book degrades cross-book cells to invalid, never stale-fills.
- Switching back expiry, side, value mode, or template: **zero** Massive HTTP (ME10; HM §6.3).

---

## 6. Client paths (HM §7 additions)

| Module | Role |
|---|---|
| `useOptionChainBus` | Multi-book apply; per-book hydrate-if-empty; interest registration for back book |
| `web/lib/options-lab/templates/calendar.ts` | New — pure |
| `web/lib/options-lab/templates/termSpine.ts` | New — pure; `profile` renderer |
| `web/lib/options-lab/templates/flyRoll.ts` | New — pure; reuses Advanced Fly leg resolver |
| `web/lib/options-lab/chainContext.ts` | `books` map; front/back views; skew meta |

## 7. Server paths (HM §8 additions)

No new server matrix SoR (NX2). Server changes limited to: interest registration endpoint already specified in Arch 30; per-book stream channels already keyed by `(underlier, expiration, wings)`. If either is not as-built, that is a **prerequisite gap** to record, not a template change.

---

## 8. Phases

| Phase | Deliverable | Gate |
|---|---|---|
| **ME0** | This spec folded + Coach GO; ChainContext v0.3 migration plan with Kilo regression set | India · Delta |
| **ME1** | `books` context + front/back views + existing templates green on front book | Delta |
| **ME2** | `calendar` debit + theta_diff color + ME3/ME4 invalids | Hotel math · Delta |
| **ME3** | `fly-roll` | Hotel · Delta |
| **ME4** | `term-spine` profile renderer | Echo · Hotel · Delta |
| **ME5** | `column_sweep` + agent export fields | Delta |

## 9. Acceptance tests

| ID | Test |
|---|---|
| **AT-ME1** | Two books loaded; `ladder`/Advanced Fly/`gex` output byte-identical to v0.2 against front book |
| **AT-ME2** | Back `asOf` − front `asOf` > threshold → all cross-book cells invalid; single-book cells unaffected |
| **AT-ME3** | Strike listed on front only → calendar row absent (not invalid-filled, not snapped) |
| **AT-ME4** | Back-book leg K+w unlisted → fly-roll cell invalid; no nearest-strike substitution |
| **AT-ME5** | Null θ on one leg → `theta_diff` invalid; `debit` still valid |
| **AT-ME6** | Calendar nets to credit → magnitude + CR chip; signed value retained in export |
| **AT-ME7** | `roll_pct` with \(D_{front}=0\) → invalid, not ∞/NaN |
| **AT-ME8** | term-spine: book with no listed strike within one step of spot → spine point invalid; no interpolation |
| **AT-ME9** | Switch back expiry → zero Massive HTTP; one OPF interest registration |
| **AT-ME10** | Front 0DTE at 15:58 ET → τ_front from OPF continues to decrease (AT-L0-τ4 inherited); calendar θ_diff recomputes |
| **AT-ME11** | AM-settled back book → τ_back uses SOQ instant (AT-L0-τ3 inherited) |
| **AT-ME12** | Color on `theta_diff` holds when value mode is `debit` (AT-HM7 analogue) |
| **AT-ME13** | Sticky scale: p95 within 25% across generations → no re-normalize (AT-HM16 inherited) |
| **AT-ME14** | Export carries per-leg `as_of`, `max_skew_ms`, `epoch_quality`, both `content_hash`es |

## 10. Non-goals (v0.1)

- Diagonals / mixed-strike cross-book (carried §12)
- Mixed call/put cross-book structures (ME6)
- R2R or max-loss modes for calendar (OD-ME3)
- Any composite, rank, or "preferred" output
- Server-side matrices or snapshot persistence (NX2; FatTail Intelligence boundary)
- Interpolated term structure or implied forward vol

## 11. Open decisions — Accept / Override

| # | Topic | Recommendation | Accept / Override |
|---|---|---|---|
| OD-ME1 | Context shape | ME2 `books` map + front/back views; v0.2 root fields removed with same-change migration | _pending_ |
| OD-ME2 | Calendar color basis | `theta_diff` always | _pending_ |
| OD-ME3 | Calendar R2R / max-loss mode | Defer; requires explicit max-loss definition + Accept | _pending_ |
| OD-ME4 | Default back expiry | next listed after front | _pending_ |
| OD-ME5 | `column_sweep` in first ship | ME5 (after single) | _pending_ |
| OD-ME6 | Skew threshold source | reuse `LABS_OPF_MAX_SKEW_MS` (OD-PF8); no HM-local threshold | _pending_ |
| OD-ME7 | term-spine rib depth default | 4 | _pending_ |
| OD-ME8 | Spec landing | fold into HM v0.3 vs. standalone ME spec under HM parent | fold | _pending_ |

## 12. Ideas inventory (carried, not dropped)

Single-expiry, next wave: Spread Tax Map · Tent Drift · Skew Spine · Breakeven Ribbons (`ribbon` renderer) · Implied-Move Fence (overlay) · Put–Call Mirror · OI Tornado · Velocity Field (`field` renderer) · Theta Clock · Walk Strip · `iron-fly` · `condor`/`iron-condor` · fair-value residual (OPF-bound) · ratio spread (held: undefined risk, advisor opinion) · Width Fit / BOS (pending OD-W1–W5).

Multi-expiry, next wave: `diagonal` (K_front × K_back, max-loss gated) · double calendar / calendar condor · theta ladder (strike × expiry table).

## 13. Decision-log entry (paste-ready)

> **DL-xxx — Multi-expiry heatmap templates.** Coach rules multi-calendar structures in scope for Options Lab heatmap templates, superseding Heatmap Templates Spec v0.2 §10 non-goal "multi-expiry matrix in first ship." Data plane unchanged: OPF L1 holds 0–5DTE dual-side generations per `(underlier, expiration, wings)` continuously during RTH. Consumer change only: `ChainContext` gains `books` map with front/back views (ME2); HM15–20 apply per book (ME1); cross-book cells inherit OPF epoch skew law and OD-PF8 threshold (ME3). First wave: `calendar`, `term-spine`, `fly-roll` per ME Spec v0.1. Observation-only; OD-AF7/NX4 untouched. HM Spec to version to v0.3 per OD-ME8. Hash recorded at GO.

## 14. Document control

| Version | Date | Notes |
|---|---|---|
| **v0.1** | 2026-08-21 | Initial advisor DRAFT from Coach rulings of 2026-08-21 |

**One-line law:**  
**N independent dual-side books from OPF, composed only where strikes intersect on every book and epochs agree; τ per leg from OPF; calendar colors on decay differential; term structure drawn from listed strikes with gaps left as gaps; nothing ranked, nothing recommended.**
