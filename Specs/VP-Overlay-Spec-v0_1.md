# Volume Profile — Contract Overlay Construction — Spec v0.1 (DRAFT)

Supersedes: none — first version of this document.
Status: DRAFT for bench review. No DL number assigned; Lima assigns on Coach stamp.
Program: Options Lab — Volume Profile (the one unfinished app).
Source: Coach's 2026-09-18 session on reconciling long-term futures charts with volume profile.
Date: 2026-09-18.

---

## §0 Scope

Active program: Options Lab — Volume Profile.
Files/trees touched by this document: NONE — specification only. This document defines the model-side construction for futures input to the volume profile. It is a companion to the capture-mechanism spec Coach asked for (the download, the binning, the ongoing upkeep of the bin, the API). If that spec is not yet drafted as a file, this document stands alone and folds into it later; nothing here assumes it exists on disk.
Touches outside program: NONE.

---

## §1 Purpose

Define how futures data enters the structural model when the same structural region spans more than one contract. The problem: every continuous-contract construction — splice, back-adjustment, ratio adjustment — moves prices away from where volume actually transacted, and where volume transacted is precisely the thing the model reads. The resolution: no continuous contract at all. All contracts overlapped, each in its own native prices.

---

## §2 Doctrine — why continuous contracts are rejected for structure

This section is source material for Help and Wiki content, per the standing rule that doctrine arguments live in the specification.

### §2.1 The basis

ES trades above SPX by the cost of carry — financing minus expected dividends over the remaining contract life. In Coach's observation the front contract can open its life as much as 60–70 points above SPX and converges roughly linearly to parity at expiration. The basis is a known, observable number at every moment; it is not modeled here, and per this spec it is never subtracted either.

### §2.2 What back-adjustment actually does (the difference method)

At each roll, the adjustment coefficient is the difference between the closing prices of the new and old contracts at the nearest daily bar to the switch. The entire prior history — every bar of the expiring contract and everything older — shifts rigidly by that one amount. Offsets accumulate backward across rolls, which is why a long back-adjusted history can show prices the instrument never traded at, including negative prices on long contango-heavy histories. Volume is not touched: it rides along at the shifted prices, so within a contract the profile shape is perfectly preserved while its address is falsified. The within-contract carry decay is left in, unremoved. TradingView's B-ADJ toggle works this way.

### §2.3 What ratio adjustment does

The alternative in the quant literature multiplies prior history by the ratio of the new contract to the old at the roll. Percentage returns are preserved exactly; absolute point spacing between levels stretches and shrinks going back. It cannot produce negative prices, which is why the literature prefers it for long-horizon returns work.

### §2.4 The conclusion

Both methods distort structure, in opposite ways: additive preserves spacing but falsifies addresses; ratio preserves percentages but distorts spacing. Where traders actually transacted is only true in each contract's own native prices. Any adjustment is a view convenience — it never enters the model. This is the same doctrine as the existing rollover-as-user-setting rule, now stated from the model side.

### §2.5 Why the structure survives roll seams anyway — the emergent-level thesis

Levels are emergent artifacts, not drawn coordinates: institution and market-maker inventory is booked at prices, algorithms trigger off historic prices, and millions of disparate participants trading around these things resolve into persistent levels — no coordination and no chart-watching required. The level is what fails to cancel. Mandelbrot's long-memory work is the frame: dependence decays slowly, so a year-old level still mattering is expected behavior, not an anomaly. This is consistent with Coach's decades of screen time — basis smearing has never been visible in practice; structural levels read accurately even on year-old levels and on three months of single-contract data at all-time highs. The distortion is below reading resolution in most regimes.

### §2.6 Scope of the problem

Within a single contract there is no reconciliation problem at all — the basis only drifts slowly as carry decays, well inside node width. The machinery in this spec exists for one case: long consolidation or retracement spanning multiple contracts, where the same structural region is revisited across rolls and each visit lands at a different futures price.

---

## §3 Construction — laws

**VP-OVL-1 — Native prices only.** The structural model consumes per-contract series in each contract's own native prices. No back-adjustment, ratio adjustment, splice, or basis subtraction is ever applied to model input.

**VP-OVL-2 — Two stored layers.** The store keeps a RAW layer — per-contract bins, contract-tagged, with prints timestamped at maximum granularity per the resolution doctrine — and a CONSOLIDATED layer built from it.

**VP-OVL-3 — Time is the alignment axis.** Bins from different contracts are merged on co-occurrence in time — the one axis every contract genuinely shares. No price-axis mapping is used to align contracts.

**VP-OVL-4 — Consolidation is reversible.** Every consolidated bin retains references to its contributing per-contract bins, so it is always answerable why a node is heavy and which contracts contributed. The raw layer is never discarded.

**VP-OVL-5 — Maximum granularity, view-only coarsening.** Consolidation operates at print-timestamp resolution. Any coarsening happens at render time only, inheriting the standing resolution doctrine: downsampling is for view purposes only, never for calculation of the model. (Decided with rationale, Coach may override: the doctrine already mandates it for bins; consolidation is bins.)

**VP-OVL-6 — The read is an event, not an address.** The model detects agreement: two or more participating contract profiles indicating structure at the same moment. It reports when structure is being tested; the cash price at that moment is read live off the SPX (or XSP) chart itself. No anchor to cash is computed anywhere, consistent with the 2026-09-15 ruling — contact, not price; a notification, not an overlay. This law defines the model read only; on-screen presentation of the consolidated layer is an open question (§8, Q3).

**VP-OVL-7 — Single-contributor identity.** Consolidation with one contributing contract is the identity operation. Single-contract spans pass through unchanged; nothing about the existing single-contract profile behavior is altered by this spec.

**VP-OVL-8 — Rollover settings stay view-only.** The user-facing rollover configuration (vendor-named presets, TradeStation-style manual configuration, sane silent default) affects charts only and never reaches this model. Restated here against the overlay so no reviewer reads the overlay as replacing that surface.

**VP-OVL-9 — Divergence is signal.** Where overlapping contracts fail to move together after time alignment, the divergence is logged, not suppressed — a spread move (rates, dividends) is information, and the disagreement log is a first-class output of consolidation.

MES fronts XSP in the same relationship as ES fronts SPX; the construction applies unchanged, no bin scaling.

---

## §4 What this refines — explicit alterations

Nothing of Coach's is removed by this document. Two prior notes are affected, stated openly:

1. The 2026-09-17 note that long-term structural analysis "requires marrying up the contracts across the offset" is **superseded** by this spec. There is no offset marriage: contracts are overlaid in native prices and aligned in time. The concern that note expressed — continuity of structure across rolls — is answered by VP-OVL-2/3 rather than by adjustment.
2. The 2026-09-15 ruling — ES rollover/basis immaterial; the signal is contact, not price; notification on the SPX chart — is **unchanged and generalized**: the overlay makes contact detection multi-contract.

The TradeStation-style continuous-contract interface and vendor presets remain fully in scope as chart features (VP-OVL-8); they are simply fenced off from the model.

---

## §5 Phase 0 — the overlap screen

Coach's decision from the session: skip the detailed analytical study; run the cheap screen instead.

**What it is.** Identify the windows where more than one contract occupied the same price range — both concurrently-trading contracts and sequential contracts revisiting a range during long consolidation. Plot the contracts overlaid in native prices for those windows. Look: do the structures align? Deliverable: the window list, the overlay plots, and a one-page read. Log divergences per VP-OVL-9.

**What it answers.** If the structures already align raw, the consolidation layer is confirmed cheap; if they are offset by roughly the basis difference, the time-alignment construction is doing real work. Either answer is useful; neither requires the big study.

**Gating.** Proposed as a gate before build, with rationale Coach may override: it is an afternoon of work against data that must be acquired anyway, and it validates the construction before anything is built on it. Running it in parallel instead is Coach's call.

**Prerequisite.** Per-contract ES history (individual expirations, native prices, per-print timestamps and volume — not a vendor continuous series). As of 2026-09-15 the ES subscription is not yet in hand; Coach said it could be gotten the next day. SPY (from Massive) has no expirations and does not participate in this screen.

MACHINE: StudioOne. The screen is read-only against the raw store and must not disrupt capture; per prior sizing, overnight is free on StudioOne.

---

## §6 Studies enabled by the same capture — inventory, preserved

None of these is build scope in this spec; all are Coach's stated wants and none may be dropped. One capture feeds all of them.

**§6.1 Gamma wall lead-lag.** Observation (2026-09-18): big gamma walls tend to align with the edges of large nodes and with deep crevices — tightening the honeybees/honeycomb relationship between GEX and the profile. The open question, unresolvable by eye: which leads — does the wall form where the node edge already was, or does the edge form around the wall? Method: lead-lag measurement against the timestamped bins and GEX history.

**§6.2 Order clustering at levels.** Whether there is a correlation between structural levels and order activity — the probability of an order occurring around one of these levels. This is a clustering question answerable from depth snapshots; it is explicitly narrower than the parked order-flow build and requires no aggressor classification. Note for the study design: deceptive orders cluster at the same levels precisely because that is where they will be believed, so spoofs and bona fide orders both confirm that the level matters — for a clustering test they need not be separated. The order-flow build itself remains parked with its recorded reason; this study does not reopen it.

**§6.3 Tick-count versus futures-volume profiles.** Run both in parallel on the same axis — a profile built from tick counts and one from actual ES volume — and log where they diverge. Coach's experience: tick-data profiles run about 93% of a futures profile; the divergences are the interesting output.

**§6.4 SPY volume combined with ES.** Scale SPY to the E-mini and overlay: SPY carries retail and ETF flow, ES the institutional side; the combination may show levels one crowd sees and the other doesn't.

---

## §7 Data prerequisites

Per-contract futures series — individual expirations in native prices, prints with timestamps and volume, for ES (and MES for the XSP side). Vendor continuous series do not satisfy this spec. ES subscription: pending. SPY history: Massive, already easy, unaffected by this spec except as §6 study input.

---

## §8 Open questions to Coach

These are undirected dimensions. No default is taken anywhere in this document on any of them; they stay open until answered.

**Q1 — Participation set.** Which contracts contribute bins: every listed expiration with any prints, or only contracts above a liquidity floor? Thin back months add noise votes to consolidation; excluding them risks missing early structure forming in the back. Consequence either way is a different consolidated layer.

**Q2 — Expired-contract participation.** Once a contract expires, its structure persists in the raw layer. Does it vote in current-moment events, and if so by what identity — time co-occurrence with the present no longer exists for it? This is the one place VP-OVL-3 does not answer by itself. Options include: expired structure is history only (events come solely from live contracts); or expired structure participates through the consolidated layer it already contributed to. These give different event streams during long consolidations, which is exactly the regime this spec exists for.

**Q3 — Consolidated-layer presentation.** The model needs no price anchor (VP-OVL-6), but anything rendered has to sit on some axis. The 2026-09-15 ruling covers the single-contract case: profile on the ES chart, hit marked there, notification on the SPX chart. For the multi-contract consolidated layer: render per-contract profiles only and surface consolidation purely as events and notifications; or render the consolidated layer on the front contract's axis; or another presentation Coach has in mind. The first keeps the doctrine purest; the second gives one picture but reintroduces an address.

Self-voting check performed: nothing in §§2–7 presumes an answer to Q1–Q3; VP-OVL-6 was scoped to the model read specifically so it does not vote on Q3.

---

## §9 Idea inventory from the 2026-09-18 session — nothing dropped

All contracts overlapped in native prices instead of a continuous contract · no SPX anchor — the profile tells you when, not where · time co-occurrence as the alignment · raw and consolidated layers, consolidation reversible · validation of consolidated nodes against SPX structure in time · scope limited to multi-contract consolidation · skip the analytical study, run the cheap overlap screen · divergence between overlapping contracts as signal · gamma-wall/node-edge alignment observation and its lead-lag question · order-clustering probability study · tick-count versus futures-volume parallel profiles · SPY-plus-ES combined view · emergent-level thesis and Mandelbrot long memory as the persistence frame.

---

Version: v0.1 (DRAFT) — header, filename, and this line must agree.
CONTENT-HASH (sha256 of all lines above this one): 32eceeadb9bd827411e1bb6cefc6cf43b4ceeea4d2c434b019d3eb44b5b8db34
