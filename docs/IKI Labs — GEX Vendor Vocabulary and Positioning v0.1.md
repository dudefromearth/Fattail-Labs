# IKI Labs — GEX Vendor Vocabulary and Positioning v0.1

**Status:** DRAFT. Reference document. **No law created.**
**Purpose:** Compare the member-facing vocabulary of seven GEX vendors against how IKI Labs
positions the six GEX tools. Feeds **OD-GXF2** (Echo names the tools) and any member-facing
positioning copy.
**Requested by:** Coach, 2026-09-01. Intended use: member-facing positioning copy.
**Gates required before any member-facing use:** Sierra (SEO/AEO, catalog copy) · Tango (member
psychology) · Echo (naming) · Hotel (trading accuracy). This document is input to those gates,
not a product of them.
**Evidence:** all vendor quotes captured 2026-09-01 from public pages, verbatim, with URLs.

---

## 0. Three findings that change existing law

### F1 — GXF40 misattributes two of the five terms it protects *(spec defect)*

Foundation Spec §13, GXF40 names *Control Node*, *King / Queen*, *Defense Lines*, *GEX1–GEX5*
and *TRACE* as other companies' product names. Verified against source:

| Term | Actual owner | Status |
|---|---|---|
| **TRACE** | SpotGamma | ✅ correctly attributed |
| **Defense Lines** | Trade Echo (DealerEdge) | ✅ correctly attributed |
| **control node** | ITMatrix — **lowercase, in social copy, not a branded level** | ⚠️ weaker claim than the spec implies |
| **King Nodes** | **Heatseeker / Skylit** — not on our duplication map | ❌ misattributed |
| **GEX Levels 1–10** | **MenthorQ** — not on our duplication map | ❌ misattributed (and the range is 1–10, not 1–5) |
| **Queen** | **not located at any vendor** | ❌ unsourced |

Two vendors we never mapped own two of the five protected terms. The rule is still right —
don't ship other companies' names — but its examples are wrong, and Echo will read those
examples as the boundary.

**Recommended:** erratum to GXF40 correcting attribution, and adding Heatseeker/Skylit and
MenthorQ to the vendor field even though we copy no transform from them.

### F2 — "They predict, we don't" is false for three of the seven

| Vendor | Says GEX does not predict direction | Discloses dealer-sign is an assumption |
|---|---|---|
| **ITMatrix** | **Yes — most forcefully of anyone, including us** | No |
| **GEXBoard** | Yes — "structural maps, not trade signals" | **Yes, explicitly** |
| **SpotGamma** | Yes — "GEX is not a directional predictor" | Partly — "model assumptions" |
| QuantWheel | No | No |
| Unusual Whales | No | **Yes — as an attack on rivals** |
| Trade Echo | No | **Denies** — "nothing is estimated" |
| Quant Data | No (hedged modals throughout) | No |

ITMatrix, verbatim: *"GEX is NOT a directional signal, guaranteed support or resistance, or a
timing tool."* That is stronger than GXF36.

Any positioning built on "we're the honest ones and they aren't" fails on contact with three
of the seven.

### F3 — The real gap is between their caveats and their charts

The defensible observation is not that they lack disclaimers. It is that the disclaimer and
the chart live on different pages and say different things.

- **GEXBoard** discloses the dealer-sign assumption at `/learn/what-is-gamma-exposure`, then
  the homepage says *"Know where support and resistance really are."*
- **Trade Echo** says *"Nothing is back-filled, nothing is estimated"* on the DealerEdge
  product page, and *"nobody outside a dealer's risk system observes true inventory, so every
  tool relies on assumptions"* on its own comparison page. Same domain.
- **SpotGamma** labels estimates in-product and states GEX is not a directional predictor —
  then the TRACE landing page sells *"where moves are likely to stall, break, or reverse —
  before price gets there."*

The Labs claim that survives scrutiny is about **where the caveat lives**: on the surface, in
the payload, at the moment of reading — not in a help article a member never opens. That is
GXF31's three-layer declaration and GXF33's invalid-marker rule, and it is a design claim
about our product, not an accusation about theirs.

---

## 1. The vocabulary field

### 1.1 Branded terms by vendor

| Vendor | Branded terms |
|---|---|
| **GEXBoard** | Call Wall · Put Wall · Gamma Flip · Zero Gamma level · Dealer Mode · Net GEX · Gamma Pressure gauge · GEX Histogram · GEX Heatmap · Wall Migration · Chart Lab · Premium Map · GEX History · Real-time GEX Radar · AI Analyst |
| **QuantWheel** | GEX Dashboard · GEX Screener · GEX Calculator · GEX Heatmap · Gamma Flows · Max Pain Calculator · QW Intelligence · Roll Assistant · Call Wall · Put Wall · Gamma Flip · Zone |
| **SpotGamma** | TRACE · Gamma Heatmap · HIRO · Key Levels · Strike Plot · Stability Gauge · Charm Pressure Heatmap · Delta Pressure Heatmap · Call Wall · Put Wall · Gamma Flip · Volatility Trigger · Absolute Gamma Strike · **Options Inventory Model** · Blue Zones · Red Zones · Equity Hub · Compass |
| **ITMatrix** | ITMatrix · Zero Gamma · control node · GEX Cheat Sheet *(site body inaccessible; list incomplete)* |
| **Unusual Whales** | Zero Gamma Level · Flip Point · Greek Exposure · DEX · Periscope SPX MM GEX |
| **Trade Echo** | DealerEdge · **Anchor Point** · Flip Point · **HVL (High Volume Level)** · Call Wall · Put Wall · **Defense Lines** · **GEX Rating** · OptionFlow · AlgoEdge · Cortex |
| **Quant Data** | **Interval Map** · Net Drift · Volatility Drift · Dark Flow · Market Map · Options Heat Map · GEX · DEX · VEX · CHEX |
| *(not on our map)* | **Heatseeker / Skylit:** King Nodes · Pika and Barney nodes · Gatekeepers · Air Pockets · Trinity Mode · Velocity Mode. **MenthorQ:** GEX Levels 1–10 |

**Observation.** *Call Wall*, *Put Wall* and *Gamma Flip* are used by four or more vendors
each and function as category vocabulary, not brands. They are still banned for Labs — not on
trademark grounds but by **GXF35**, because each embeds an outcome claim in the noun.

### 1.2 Metaphor vocabulary — who uses what

| Word | GEXBoard | QuantWheel | SpotGamma | ITMatrix | UW | Trade Echo | Quant Data |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| wall | ✓ | ✓ | ✓ | | | ✓ | |
| magnet | ✓ | ✓ | ✓ | | | ✓ | ✓ |
| pin / pinning | ✓ | | ✓ | ✓ | | ✓ | ✓ |
| gravitate | | | ✓ | | | ✓ | ✓ |
| support | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| resistance | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| barrier | ✓ | ✓ | ✓ | | | ✓ | |
| ceiling / floor | ✓ | ✓ | | | | | ✓ |
| flip / flip point | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | |
| zero gamma | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | |
| dealer gamma | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| dampen | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | |
| amplify | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| supply / demand zone | | | | | | | ✓ |
| defend / defense | ✓ | | | | | ✓ | |
| gravity wells · safety net · rubber band | ✓ | | | | | | |
| explosive | | | ✓ | | ✓ | | |

**Every word in the GXF35 ban list is in active use by at least four vendors.** The ban is not
a stylistic preference — it removes Labs from the entire shared vocabulary of the category.
That is the cost, and it is deliberate.

---

## 2. The claims ladder — verbatim

Ordered by how far each travels from mechanism to outcome. These are the sentences GXF36
forbids Labs from writing.

| # | Vendor | Claim | Source |
|---|---|---|---|
| 1 | GEXBoard | "Price tends to pin near the Call Wall before expiration as dealers have zero incentive to let it blow through their largest gamma position." | `/learn/what-is-gamma-exposure` |
| 2 | Trade Echo | "The strike with the most dealer exposure on the board. **Price gravitates here.**" | `/features/dealeredge` |
| 3 | Trade Echo | "A tight cluster of gamma where **price tends to pin** for stretches of the session." | `/features/dealeredge` |
| 4 | GEXBoard | "This selling acts as a **structural ceiling** — price tends to decelerate, and often reverses, near the Call Wall." | `/learn/gex-levels-explained` |
| 5 | SpotGamma | "TRACE reveals S&P 500 support and resistance levels so you can see **where moves are likely to stall, break, or reverse** — before price gets there" | `/trace-lp/` |
| 6 | SpotGamma | "Price tends to move swiftly through areas where Market Makers hold neutral to negative gamma, and **find support or resistance** at areas where Market Makers hold positive gamma." | Gamma Heatmap support article |
| 7 | Quant Data | "As Call exposure increases on a particular strike, **the underlying tends to gravitate towards** the strike with the greatest exposure." | help centre, What is GEX |
| 8 | Quant Data | "**works as a magnet and pins** the underlying around a certain price range" | help centre, What is GEX |
| 9 | Quant Data | "This selling pressure can lead to a **sharp price rejection** at that level." | help centre, Interval Map |
| 10 | Unusual Whales | "Crossing this level **often triggers explosive moves**" | `/lp/gamma-exposure-gex-data-tool` |
| 11 | QuantWheel | "Price tends to **magnetize toward or repel from** these concentrations" | `/how-to/read-gex-heatmap` |
| 12 | Trade Echo | "When dealers are short gamma… **Result:** a move-amplifying, trending, high-volatility session." | `/features/dealeredge` |
| 13 | ITMatrix | "the control node started **pulling price back into balance** at the close" | X, 2026 |
| 14 | GEXBoard | "dealers buy dips and sell rallies… **pulling price toward** large gamma concentrations." | homepage |

**Structural note.** In items 2, 3 and 12 the outcome claim is inside the **definition of the
level itself**. "Anchor Point" is not a name with a claim attached — the claim *is* the
definition. This is precisely what GXF35 means by banning outcome language in **payload field
labels**: the moment Labs names a level "Anchor," the claim ships whether or not any copy
states it.

---

## 3. Vocabulary map — their term → what it asserts → what Labs shows

This is the core deliverable. It is also the working brief for **OD-GXF2**: every Labs column
below is a *description*, not a name. Names are Echo's.

| Their term | Vendors | What the term asserts | What Labs shows instead | Law |
|---|---|---|---|---|
| **Call Wall** | GEXBoard, QuantWheel, SpotGamma, Trade Echo | Price stops or reverses here | The strike with the largest positive net gamma, its magnitude, and its fixture count | GXF35, GXF39 |
| **Put Wall** | same four | Price is supported here | The strike with the largest negative net gamma, magnitude, fixture count | GXF35, GXF39 |
| **Anchor Point / HVL / control node** | Trade Echo, ITMatrix | Price pins or gravitates here | The largest \|GEX\| strike for the session, ranked, with migration over time | GXF35 |
| **Defense Lines** | Trade Echo | Market makers will defend these | Secondary concentration strikes, ranked by magnitude, no defence claim | GXF35, GXF36 |
| ***The* Gamma Flip / Zero Gamma** | six of seven | One regime boundary exists | **All** cumulative sign crossings, **counted** — because there is frequently more than one | GXF35 (bans *the* gamma flip), Foundation §4 |
| **Blue / Red Zones** | SpotGamma | Expected volatility is lower/higher here | Sign and magnitude by strike. No volatility forecast | GXF36 |
| **GEX Rating (1–5)** | Trade Echo | A single composite dealer bias | No composite score. A composite hides its own coverage | GXF39 |
| **Interval Map** | Quant Data | *(descriptive — the least loaded term in the field)* | Node Tape: top-k concentrations per bucket, plus king-change and sign-flip **events** | — |
| **Dealer gamma** *(unqualified)* | all seven | Observed dealer inventory | **"Chain GEX (estimate)"**, always, plus the stated sign convention as an assumption | GXF35, SV41 |
| **Magnet · pin · gravitate · support · resistance** | four to seven each | Price behaviour | *Nothing.* There is no Labs equivalent, by design | GXF35, GXF36 |

### 3.1 Where Labs is materially different, not just quieter

Three of these are **capability** differences, defensible without naming anyone:

1. **All sign crossings, counted.** Every vendor writes *the* flip point, singular. Foundation
   §4 requires Labs to report **every** cumulative sign change with a count. When a book has
   two or three crossings, six vendors show one number and Labs shows the truth. This is a
   correctness claim, and it is checkable.
2. **Absence is never zero (GXF33).** A null gamma or dropped row renders an invalid marker,
   never a zero-length bar. A zero draws a level that does not exist. No vendor examined
   documents this behaviour.
3. **Coverage on every response and artifact (GXF31/§12).** The scope and completeness of the
   session travels *with* the data, on the surface, not in a help article. Members are tested
   on recalling it in ten seconds (Execution Plan §4).

Plus one honesty claim shared with SpotGamma alone: **the estimate stays labelled an estimate**
(SV41), and the dealer sign is stated as a modelling choice Labs cannot verify from a chain.
Trade Echo asserts the opposite. That contrast is real, but see §4 before using it.

---

## 4. Positioning options

### Option A — Named comparison
A member-facing page naming vendors and quoting their claims against ours.

**Against it, honestly:**
- **F2 makes it partly false.** Three of the seven already publish the disclaimers we would
  claim to uniquely hold. ITMatrix's is stronger than ours.
- **GXF40's trademark adjacency.** Reproducing *TRACE*, *DealerEdge*, *Anchor Point* in Labs
  marketing sits next to live FAT TAIL trademark work.
- **Tango's question.** *"Would a bleeding trader, short on trust and time, feel respected and
  taught by this?"* A member arriving from a drawdown, reading a page about competitors, has
  not been taught anything about their own risk.
- **Invariant 9, capacity over dependency.** A member who leaves knowing why our chart says
  less has capacity. One who leaves knowing our competitors are bad has an opinion.
- It invites a reply, and the reply writes itself: *we say the same thing on our own site.*

### Option B — Teach the vocabulary, name no one *(recommended)*
A member-facing explainer: here are the words this category uses, here is the claim inside
each word, here is what our chart shows in its place, and here is why. §3's table **is** that
page, with the vendor column deleted.

- Every claim in it is about our product and survives scrutiny.
- It is genuinely useful to a member who arrives holding another vendor's vocabulary — which
  most will, since four to seven vendors share each of these words.
- It is durable. Vendor copy changes; the claim embedded in the word "wall" does not.
- It is strong AEO material (Sierra): *"what does call wall mean"* is a real query, and an
  answerable, extractable, non-promotional answer is exactly the catalog's public purpose.
- It doubles as the member-facing half of the misread gate in Execution Plan §4 — a member who
  has read it is measurably less likely to produce a "wall/magnet/pin" misread, which is the
  gate GX8 is held behind.

### Option C — Internal only
§§1–3 as an Echo/Sierra working reference; nothing ships.

**Recommendation: B, with this document retained internally as its source.** The vendor
columns, verbatim claims and F1–F3 stay here for Echo, Sierra and Hotel. The member-facing
page is §3 with vendors removed and §3.1 as its spine.

---

## 5. Open items

| # | Item | Owner |
|---|---|---|
| 1 | **GXF40 erratum** — correct attribution per F1; add Heatseeker/Skylit and MenthorQ to the vendor field | Lima, on Coach's word |
| 2 | **OD-GXF2** — name the six tools against §3. Still unresolved; every borrowed term in the specs is a placeholder | Echo |
| 3 | **Acceptance test for the naming law** — grep member-facing copy and payload labels for the borrowed set, as GXF35 already does for banned strings. Nothing currently enforces GXF40 at ship time | Kilo |
| 4 | Positioning option A / B / C | **Coach** |
| 5 | ITMatrix and Unusual Whales product pages are client-rendered and were not retrievable; their term lists are incomplete | — |
| 6 | GEX product work remains **frozen** behind the OPF Generation Plane program. Naming and copy touch no compute and can proceed under the freeze | Juliet |

---

## Document control

| Version | Date | Notes |
|---|---|---|
| **v0.1** | 2026-09-01 | Seven-vendor vocabulary capture, verbatim claims with URLs, Labs mapping, positioning options. F1 raises a GXF40 spec defect. **No law created.** |