# Options Chain Picker — Full Agent Bench Plan v1.0

**Date:** 2026-08-10  
**Owner (orchestration):** Juliet  
**Authority:** Coach (GO / ship) — Spec **v1.0.1 DRAFT** ready for ratification  
**Board:** [`agents/p-options-chain-picker/`](../agents/p-options-chain-picker/)  
**Governance:** [`agents/bench/doctrine.md`](../agents/bench/doctrine.md)

Specialists execute **only** via seeds. Coordination only through **Coach** or **Juliet**.  
Delta gates: **PASS / FAIL / BLOCKED** with evidence — **never waived**.

**Human interface (non-negotiable, including prelim design):**  
Every member-facing control and layout in this program complies with  
[`Specs/FatTail-Labs-Human-Interface-Spec-v1.0.md`](../Specs/FatTail-Labs-Human-Interface-Spec-v1.0.md)  
(**Apple HIG for Labs web** — clarity, deference, depth, consistency, feedback,  
≥44×44 pt targets, keyboard, focus, reduced motion, WCAG AA). Echo owns HIG;  
Charlie implements kit primitives only; **no ad-hoc chrome**. Preliminary wireframes  
and production UI both go through Echo HIG review before Delta UI gates.

---

## 0. Product law (in scope)

| Spec / doc | Path | Role |
|------------|------|------|
| **Options Chain Picker Spec v1.0.1** | [`Specs/FatTail-Labs-Options-Chain-Picker-Spec-v1.0.md`](../Specs/FatTail-Labs-Options-Chain-Picker-Spec-v1.0.md) | **Primary law** — OC1–OC15, pickers, ladder, diff, proxy-safe spot/vol, shared fetch, preform v1.1 |
| **Human Interface Spec v1.0** | [`Specs/FatTail-Labs-Human-Interface-Spec-v1.0.md`](../Specs/FatTail-Labs-Human-Interface-Spec-v1.0.md) | **HIG constitution** — tokens, controls, density, a11y; member dialect |
| Architecture/18 Shared live marks | [`Architecture/18-shared-live-marks-stream.md`](../Architecture/18-shared-live-marks-stream.md) | Proxy doctrine · S-3 shared generation · VIX1D |
| Architecture/09 (Tradier / chain-store doctrine) | as cited in Spec | ChainStore / `chain_collector` reuse — no orphan fourth process |

**Companions (consume, do not re-open):** Admin market universe · live marks stream · Positions marks doctrine · Curate universe patterns · Visualize Massive client discipline  

**Related boards (do not re-litigate):**

| Board | Use |
|-------|-----|
| [`p-hig`](../agents/p-hig/) | Tokens / primitives / HIG gates — **consume kit**; do not invent a second design system |
| [`p-accounts-capital`](../agents/p-accounts-capital/) | Marks consumers pattern — passive |
| Strategy Lab / universe admin as-built | Admin CRUD + `/api/me/market/universe` |

**Queued out of this program:**

- MSC convexity heatmap / butterfly tiles  
- Dual call+put columns (unless Spec amend)  
- Broker order ticket from cells  
- Silent SPY×10 / VIXY-as-VIX scaling  
- Practice suite pill for this surface (DL-232)  
- Full smile / term-structure analyzer (later surfaces under Market/Analyzer parent)

---

## 1. Mission

Ship (heal → harden → preform) the **Options Chain Picker**: Admin-universe symbol,  
**next three distinct listed expirations** with DTE, vertical ±σ ladder,  
**proxy-safe** spot and vol, **shared Massive generation**, **strike-level diffs only**  
— all under **Apple HIG for Labs web** so even preliminary UI is calm, clear, and kit-native.

| Pillar | Spec | Ship meaning |
|--------|------|----------------|
| **Universe SoR** | OC1 | Enabled Admin symbols only |
| **Proxy-safe spot/vol** | OC2 · OC5a | Chain underlying first; no proxy σ; VIX1D 0–1 DTE; √T floor |
| **Next-3 contracts** | OC3 · OC4 | Distinct listed dates; default nearest; DTE auto |
| **Ladder + fields** | OC5 · OC6 | Vertical; spot highlight; mid/bid/ask/vol/OI/Δ/IV |
| **Diff updates** | OC7–OC9 | No page reload; row-level patches only |
| **Shared fetch** | OC15 | One upstream per (feed, expiry) generation |
| **Preform calendar** | OC11 · OC12 | v1.1 **required** — store-first expiries; quotes stay live |
| **HIG** | HI Spec | Kit controls · 44pt · clarity/deference · a11y |

**Design invariant:** *Pick a name from Admin. Pick one of the next three listed expiries. Spot and σ use true scale. Only strikes that moved change. Chrome recedes; the chain is the content (HIG deference).*

---

## 2. As-built honesty

### 2.1 Keep (landed)

| Area | Status |
|------|--------|
| Route `/app/market/chain-ladder` | Landed |
| Universe symbol picker API consumer | Landed |
| Next-3 expirations + DTE labels (live discovery) | Landed |
| Ladder full / diff / unchanged poll protocol | Landed |
| Domain `chain_ladder.py` + unit tests | Landed |
| OC2/OC5a heal path (chain underlying · proxy ban) | Landed partial — **prove with Kilo** |
| Shared TTL cache (in-process) | Landed partial vs OC15 multi-member generation |

### 2.2 Build / fix (this program)

| Gap | Spec | Action |
|-----|------|--------|
| Spec not Coach-ratified | W0 | GO + DL + content hash |
| Hotel OC5a sign | OC5a | Explicit Hotel seed |
| Proxy spot/vol proof + spot_source | OC2 · OC5a · §7.12–14 | Kilo characterization |
| Shared generation hardened | OC15 | Alpha: generation key, singleflight, metrics |
| HIG pass on controls | HI Spec | Echo prelim + production review; 44pt selects; focus rings |
| Nav parent / Market chrome | Spec §0 | Echo + Charlie: analyzer home, not suite pill |
| Access matrix evidence | Spec §0 | Mike: tool-member / observer trial / free deny |
| Preformed calendar | OC11 | v1.1 phase P* — store + job + store-first read |
| Volume thrash note | OC9 | Document only unless OD changes |

### 2.3 Gap map (acceptance → phase)

| Spec acceptance cluster | Phase |
|-------------------------|--------|
| Spec ratify · Hotel OC5a · HIG prelim · DL · seeds | **W0** |
| Proxy-safe spot/vol + band + shared generation | **H*** (heal / harden domain) |
| Expirations next-3 · universe · access | **E*** (expiry + identity) |
| Ladder UI HIG · pickers · row memo · poll | **U*** (UI) |
| Kilo §7 pack + a11y smoke | **K*** (proof) |
| Preform calendar schema + Admin/job + store-first | **P*** (v1.1 preform — **required**) |
| Deploy + as-built + program close | **Z*** |

---

## 3. Locked decisions (program)

| ID | Decision |
|----|----------|
| **OP1** | Spec v1.0.1 is product law on Coach GO (W0-0). |
| **OP2** | OC2: chain `underlying_asset.value` first; never proxy mark for strike math; 503 if unusable. |
| **OP3** | OC5a: proxy vol never σ input; VIX1D for 0–1 DTE when native; √T uses max(1,dte). |
| **OP4** | OC15: shared Massive generation per (feed_symbol, expiration) per TTL — legislated v1.0. |
| **OP5** | Next **3 distinct listed** expirations; default nearest; DTE auto on symbol. |
| **OP6** | Diff-on-change only; no full page refresh; no full-table rewrite on quiet poll. |
| **OP7** | Symbol list = enabled Admin universe only. |
| **OP8** | OC11 preform is **mandatory for v1.1** — Delta does not hedge “if built.” |
| **OP9** | **Apple HIG for Labs web** (Human Interface Spec v1.0) binds all UI seeds — prelim and final. |
| **OP10** | Nav parent = Market / options analyzer area (default); not Practice suite pill. |
| **OP11** | No MSC. |
| **OP12** | Prefer `chain_collector` / `massive_client` for calendar jobs — no orphan process without India sign. |

### 3.1 Residual ODs (W0 — defaults if Coach silent)

| OD | Default for ship | Owner |
|----|------------------|--------|
| **OD-nav** Market vs Analyzer label | **Market** parent path `/app/market/*` | Echo · Coach |
| **OD-poll-ms** Client poll interval | **2000** ms | Alpha · Echo |
| **OD-ttl** Shared generation TTL | **1.5–2.0** s server window | Alpha |
| **OD-vol-tier** Volume/OI on OC9 | Keep on change set v1 (accept thrash) | Hotel · Coach |
| **OD-preform-ttl** Calendar stale after | **1 session day** | India · Foxtrot |
| **OD-strike-step** Index vs equity | SPX/NDX/RUT **5**; XSP **1**; equity **1** | India · Hotel |

### 3.2 Seating

| ID | Rule |
|----|------|
| **S1** | Kilo on every testable seed. |
| **S2** | Guide as-built only until gates say otherwise. |
| **S3** | Mike: access matrix + Family B if pack fields. |
| **S4** | Seeds on disk before phase gate. |
| **S5** | Tango: 503 copy; 0 DTE; no shame empty states. |
| **S6** | Hotel: OC5a sign; band math; proxy vol ban. |
| **S7** | India: universe SoR; preform schema; dual-truth ban. |
| **S8** | Echo: HIG + IA; pickers; deference (chain is content). |
| **S9** | Charlie: UI kit only; memoized rows; no invent tokens. |
| **S10** | Alpha: domain/API; OC2/OC15; spot_source. |
| **S11** | **HIG board:** material UI reviews also cite Human Interface Spec; light/dark + 3 viewports at U-G / Z-G when UI ships. |

---

## 4. Roster

| Callsign | Role |
|----------|------|
| **Coach** | GO, residual ODs, Spec ratify, ship/no-ship |
| **Juliet** | Board, seeds, sequence |
| **India** | Schema preform; universe resolution; generation keys |
| **Alpha** | Domain/API; Massive; shared fetch; spot_source |
| **Charlie** | Ladder page; kit controls; row memo; a11y wiring |
| **Echo** | **HIG authority** · IA · picker density · Market parent |
| **Hotel** | OC5a band · VIX1D · √T floor · proxy vol ban |
| **Tango** | Copy: errors, 0 DTE, empty states |
| **Mike** | Access matrix; isolation if multi-tenant touch |
| **Kilo** | Spec §7 acceptance (incl. 12–15) |
| **Delta** | Gates ternary — never waive OC2/OC5a/OC11 |
| **Lima** | DL: Spec ratify · OC2/OC5a/OC15 · HIG binding · preform |
| **Foxtrot** | Migrate/deploy; calendar job schedule |

**Not seated:** Golf · MSC · Marketing Campaign Workflow · full Correlation program · Visualize tool catalog rewrite.

---

## 5. Sacred invariants (this program)

1. Standalone repo — **no MSC**.  
2. Config fail-loud.  
3. Family B where data export applies.  
4. **Proxy marks never drive strike center or σ** (OC2 · OC5a).  
5. **No silent scale** (SPY×10 forbidden).  
6. **Shared generation** — no per-member Massive hammer design (OC15).  
7. Diff updates only — no page reload for quotes.  
8. Universe SoR — no parallel symbol list.  
9. **Apple HIG for Labs web** — kit primitives; ≥44×44 pt hit targets; keyboard; focus; reduced motion; AA contrast.  
10. Deference: chain content is the hero; chrome recedes.  
11. No profit theater / valence P&L coloring on chain cells.  
12. Evidence over assertion; no waived Delta gates.  
13. Documentation parity with ship.  
14. OC11 preform gate is **mandatory** for v1.1 program close.

---

## 6. Phases, seeds, gates

### Phase W0 — Plan lock + Spec ratification + HIG prelim

| Seed | Agent | Intent |
|------|-------|--------|
| **W0-0** | Coach | **GO** on Spec v1.0.1 + this plan; OP1–OP12; residual ODs; content-hash Spec record |
| **W0-1** | Hotel | **Sign OC5a** in writing: proxy vol ban · VIX1D 0–1 · max(1,dte) · fallback band formula |
| **W0-2** | India | Schema map for preform (columns vs meta table); dual-truth ban; strike_step OD |
| **W0-3** | Tango | Vocabulary: Contract (next 3) · 0 DTE · 503 proxy/missing spot · empty chain |
| **W0-4** | Lima | DL: Spec ratify · OC2/OC5a/OC15 · HIG binding · Market parent · OC11 mandatory |
| **W0-5** | Juliet | Materialize board + all seeds cold-start |
| **W0-6** | Echo | **HIG prelim design pack:** pickers, ladder, hierarchy, 44pt targets, empty/error states, light/dark notes — **before** production chrome ships |
| **W0-7** | Mike | Access matrix note (tool-member / trial observer / free deny) |
| **W0-G** | Delta | GO written; Hotel sign; HIG prelim on file; seeds on disk; ODs recorded |

### Phase H — Heal / harden domain (OC2 · OC5a · OC15)

| Seed | Agent | Intent |
|------|-------|--------|
| **H1-0** | Alpha · **Kilo** | Prove spot: chain `underlying_asset.value` preferred; proxy product mark never centers band; 503 path |
| **H1-1** | Alpha · Hotel · **Kilo** | Prove vol: ignore proxy VIX/VIXY; VIX1D when DTE≤1 and native; 0DTE band non-empty |
| **H1-2** | Alpha · India · **Kilo** | Shared generation per (feed_symbol, expiration); singleflight; N readers share; spot_source on payload |
| **H1-G** | Delta · Kilo · Hotel | §7.12–14 green; OC15 evidence |

### Phase E — Expirations + identity

| Seed | Agent | Intent |
|------|-------|--------|
| **E1-0** | Alpha · **Kilo** | Next-3 distinct listed expiries API; default nearest; DTE; no invented weekdays |
| **E1-1** | Alpha · **Kilo** | Symbol resolve via universe; 422 disabled/unknown |
| **E1-2** | Mike · **Kilo** | Access: free denied; paid/tool-member allowed |
| **E1-G** | Delta · Kilo | OC1 · OC3 · OC4 · access |

### Phase U — Member UI (HIG production)

| Seed | Agent | Intent |
|------|-------|--------|
| **U1-0** | Echo · Charlie | Wire W0-6 HIG into production: Symbol · Contract · Side · Sigma using **kit** selects/inputs; labels; spacing tokens |
| **U1-1** | Charlie · **Kilo** | Vertical ladder; spot highlight; fields OC6; memoized rows; apply diff only |
| **U1-2** | Charlie · Tango | Empty / error / 503 states — honest, no silent blank hero |
| **U1-3** | Echo | HIG review pass: clarity, deference, 44pt, focus rings, reduced-motion friendly flash |
| **U1-G** | Delta · Echo · Kilo | UI acceptance + HIG checklist; light/dark smoke if kit requires |

### Phase K — Characterization pack (v1 close-ready)

| Seed | Agent | Intent |
|------|-------|--------|
| **K1-0** | Kilo | Full Spec §7 cases 1–11 + 12–14 (proxy/0DTE) |
| **K1-G** | Delta · Kilo | v1 heal/harden ternary PASS (preform still pending for full program Z if split) |

### Phase P — Preformed calendar (v1.1 — **required**)

| Seed | Agent | Intent |
|------|-------|--------|
| **P1-0** | India · Mike | Migration: next_expirations + as_of (+ optional strike_step) on universe or meta table |
| **P1-1** | Alpha · India | Write path: on Admin validate/save and/or job using `massive_client` / align `chain_collector` |
| **P1-2** | Alpha · **Kilo** | Expirations endpoint **store-first**; live scan only if missing/stale; write-through |
| **P1-3** | Charlie · Echo | Admin affordance “Refresh chain calendar” (HIG operator density if on /admin) |
| **P1-G** | Delta · Kilo · India | **OC11 mandatory** — §7.15 evidence; **no optional hedge** |

### Phase Z — Close

| Seed | Agent | Intent |
|------|-------|--------|
| **Z1-0** | Kilo | Re-run full §7 pack including 15 after P1-G |
| **Z1-1** | Lima | As-built notes; Spec status RATIFIED if Coach signed; content hash |
| **Z1-2** | Foxtrot | Deploy / migrate checklist; calendar job if any |
| **Z1-3** | Echo · Charlie | Final HIG/a11y smoke: keyboard through pickers; focus visible; AA |
| **Z-G** | Delta | Program PASS: H-G · E-G · U-G · K-G · **P1-G** · Z evidence |

---

## 7. Critical path

```
W0-G → H1-G → E1-G → U1-G → K1-G → P1-G → Z-G
```

- **H** before **U** production polish (heal spot/vol first).  
- **E** may parallel **H** after W0 if identity-only.  
- **P** may start schema after W0-2 but **P1-G after K1-G** preferred so v1 proof lands first.  
- **Never waive** H1-G (proxy) or P1-G (preform).

---

## 8. Apple HIG application (this surface)

Even as a **preliminary** design, Echo’s W0-6 pack and U seeds must satisfy:

| HIG / HI Spec pillar | Chain picker requirement |
|----------------------|---------------------------|
| **Clarity** | One primary region (ladder); pickers labeled; DTE in plain language |
| **Deference** | Chrome thin; table is the hero; no emoji chrome |
| **Depth** | Canvas → card/controls → scrollable table; no competing layers |
| **Consistency** | Only design-system selects, inputs, links, type ramp |
| **Feedback** | Loading / error / 503 / “no change” honest; flash only on changed rows |
| **Direct manipulation** | Selectors ≥ **44×44 pt** hit area; clear focus rings |
| **User control** | Symbol/expiry/side/sigma always cancelable by re-select; no modal traps |
| **Accessibility** | Keyboard order Symbol → Contract → Side → Sigma → table; `aria`/labels; reduced motion softens flash; WCAG AA |

**Anti-patterns banned:** browser `prompt()`/`alert()`; unlabeled icons-only controls; rainbow P&L cells; custom CSS that bypasses tokens; MSC-skinned chrome.

---

## 9. Seed file convention

```
agents/p-options-chain-picker/
  CHARTER.md
  ORCHESTRATOR.md
  IMPLEMENTATION-PLAN.md   # points to this doc
  seeds/
    README.md
    W0-0-coach-go.md
    …
  gate-reports/
    README.md
```

Each seed: agent · phase · intent · Spec IDs (OC* · HI Spec) · invariants · out of scope · completion = evidence in `gate-reports/`.

---

## 10. Gate evidence standard

| Gate | Evidence |
|------|----------|
| **PASS** | Spec IDs cited; pytest and/or UI proof; HIG checklist for UI gates |
| **FAIL** | Gap named; re-seed |
| **BLOCKED** | External OD named; no fake green |

**Never waive:** H1-G (OC2/OC5a) · P1-G (OC11) · Z-G without Kilo pack.

---

## 11. Spec §7 acceptance → seed map (Kilo)

| # | Acceptance (abbrev) | Primary seed(s) | Gate |
|---|---------------------|-----------------|------|
| 1 | Enabled universe symbols only | E1-1 · U1-0 | E1-G · U1-G |
| 2 | Unknown/disabled → 422 | E1-1 | E1-G |
| 3 | Next 3 distinct listed dates | E1-0 | E1-G |
| 4 | Default nearest + DTE math | E1-0 · U1-0 | E1-G · U1-G |
| 5 | Symbol change reloads three + DTE | U1-0 | U1-G |
| 6 | Vertical + spot highlight | U1-1 · H1-0 | U1-G · H1-G |
| 7 | Field set mid/bid/ask/vol/OI/Δ/IV | U1-1 | U1-G |
| 8 | Quiet → unchanged | H1-2 · U1-1 | H1-G · U1-G |
| 9 | One strike move → diff only | U1-1 · K1-0 | U1-G · K1-G |
| 10 | No full page reload | U1-1 | U1-G |
| 11 | No MSC | W0 · Z | Z-G |
| 12 | Proxy SPX mark → 503 or chain underlying | H1-0 | H1-G |
| 13 | Proxy VIXY never σ | H1-1 | H1-G |
| 14 | 0 DTE band non-empty | H1-1 | H1-G |
| 15 | Preform store-first | P1-2 | **P1-G** |

---

## 12. Risks

| Risk | Mitigation |
|------|------------|
| Proxy mid used for SPX ladder | H1-0; OC2; 503 |
| VIXY as VIX% | H1-1; Hotel W0-1 |
| Per-member Massive thrash | OC15 · H1-2 |
| HIG skipped “because prelim” | W0-6 mandatory; U1-3 Echo; S11 |
| Preform quietly deferred | OP8 · P1-G never optional |
| Fourth orphan calendar process | OP12 · India · chain_collector align |
| Suite-pill nav regression | OP10 · Echo W0-6 |

---

## 13. Board materialization checklist

| Artifact | Path |
|----------|------|
| Charter | `agents/p-options-chain-picker/CHARTER.md` |
| Orchestrator | `agents/p-options-chain-picker/ORCHESTRATOR.md` |
| Plan pointer | `agents/p-options-chain-picker/IMPLEMENTATION-PLAN.md` |
| Seeds | `agents/p-options-chain-picker/seeds/*.md` |
| Gates | `agents/p-options-chain-picker/gate-reports/` |

**Next after this plan lands:** Coach **W0-0 GO** (Spec v1.0.1 + HIG binding). No production UI chrome without **W0-6** Echo HIG prelim on file.

---

## 14. Document history

| Version | Date | Change |
|---------|------|--------|
| **v1.0** | 2026-08-10 | Initial full bench plan for Spec v1.0.1 — heal/harden/UI/preform; OP1–OP12; **Apple HIG / Human Interface Spec binding** for prelim and production; critical path W0→H→E→U→K→P→Z. |

---

*Pick from Admin. Pick one of the next three listed expiries. True scale only. Diff only. HIG always — even when the drawing is still a sketch.*
