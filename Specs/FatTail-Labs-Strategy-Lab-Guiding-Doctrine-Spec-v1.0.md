# FatTail Labs — Strategy Lab Guiding Doctrine Spec v1.0

**Status:** **NORMATIVE — Coach doctrine lock** (2026-08-16)  
**Short name:** **SL-GD** / Guiding Light  
**Type:** Product Spec — process law for every Strategy Lab phase, surface, and bot  
**Date:** 2026-08-16  
**Product:** FatTail Strategy Lab (`/app/strategy-lab`)  
**Decision:** **DL-382** · engine **DL-383** · resolution **DL-384** · VP trigger grammar **DL-385** · market memory **DL-386** · primary metric shape **DL-387** · convexity RoC **DL-388** · entry warrant + dynamic trail **DL-389** · OT-EF join **DL-396** (SL-GD39–41)

**This document is the guiding light.** Life-cycle specs, pack schema, Design tabs, Curate, Deploy, backtest, forward walk, and copy **must** be readable as implementations of this law. Where an older spec is silent, this document speaks. Where an older spec **conflicts** with a lock below, **this document wins** and the older file is amended in the same body of work — Coach text is **not** deleted (Coach Content Law).

**Parents / siblings (do not replace; sit beside):**

| Document | Role |
|----------|------|
| [`Strategy-Lab-Architecture-Design-v1.0.md`](./Strategy-Lab-Architecture-Design-v1.0.md) | Life-cycle spine, bins |
| [`Strategy-Lab-Development-Phase-Spec-v1.0.md`](./Strategy-Lab-Development-Phase-Spec-v1.0.md) | Design validation (back test · forward walk) |
| [`Strategy-Lab-Strategy-Pack-Architecture-v1.0.md`](./Strategy-Lab-Strategy-Pack-Architecture-v1.0.md) | Packs / Butterfly |
| [`Strategy-Lab-Curate-and-Deploy-Surface-Spec-v1.0.md`](./Strategy-Lab-Curate-and-Deploy-Surface-Spec-v1.0.md) | Curate / Deploy surface |
| [`FatTail-Labs-North-Star-Member-Ethos-Spec-v1.2.md`](./FatTail-Labs-North-Star-Member-Ethos-Spec-v1.2.md) | Stop the bleeding · process outcomes |
| Advanced Fly Spec **v0.2.1** | Heatmap tiles (debit · R:R · curvature) |
| OPF Truth Doctrine **v1.1** · **DL-309** · **DL-396** | Listed chain is instrument truth; two clocks; BT/FW is a Law A consumer (SL-GD39–41) |
| Arch **16** | Same OA-class *service*, opposite *direction* |
| Arch **32** | As-built map of this doctrine |
| Position paper | [`docs/Strategy-Lab-Position-We-Position-We-Dont-Predict.md`](../docs/Strategy-Lab-Position-We-Position-We-Dont-Predict.md) |
| Config Resolution Standard v0.1 | [`docs/FatTail-Labs-Strategy-Lab-Config-Resolution-Standard-v0_1.md`](../docs/FatTail-Labs-Strategy-Lab-Config-Resolution-Standard-v0_1.md) — **folded here §16** (DL-384) |
| VP Timing & Entry trigger grammar | [`docs/VP-Structural-Analysis-Timing-Entry-Trigger-Grammar.md`](../docs/VP-Structural-Analysis-Timing-Entry-Trigger-Grammar.md) — **folded here §17** (DL-385 grammar · **DL-386** market memory). Full Coach text: [`docs/VP-Structural-Analysis-Trigger-Grammar-Reference_1.md`](../docs/VP-Structural-Analysis-Trigger-Grammar-Reference_1.md) · PDF `docs/VP Structural Analysis — Reference for the Timing & Entry Trigger Grammar.pdf` |

**Coach Content Law:** Nothing of Coach’s in this file is removed. Reviewer objections sit **beside**, labeled.

**Hotel / Tango (copy):** Percents and multiples below are **process frequencies and mark examples**, never marketing targets or typical-return claims.

---

## 0. One-line laws (member-facing)

1. **We position, we don’t predict.**  
2. **We must have skin in the game to harvest the fruit.**  
3. **We enter and embrace the roundabout** (Mises · Austrian capital · Spitznagel, *The Dao of Capital*).  
4. Strategy Lab does **not** hunt a **single winning strategy**. It **curates okay strategies** into **clusters of non-correlated** seats that **together** produce the valued **distribution**, then **deploys** the cluster — and **keeps curating**.  
5. **The arrows are the strategy. The structure they point at remembers.**

Ossification is: one deterministic backtest winner, one hero bot, the expected-move box, win rate as sacred cow, a **daily-redrawn** volume profile that throws the memory away.

**Engine (locked):** R2R is **potential at design/entry**, never result. A **trade is one atomic position** — never a leg. See **§15**.  
**A strategy is not a trade; it is a rule that resolves to a trade against whatever surface it meets.** See **§16**.

---

## 1. Mission

Strategy Lab is the machine for a **defined-risk fly book** that **sits** on **market probabilities** and the **expected-move zeitgeist**, not a machine that **forecasts** the next tick.

It **takes advantage** of those realities by:

- sitting where **win-rate money will not** (the **bad lands** just **beyond expected move**);  
- sizing so the **50% against** cannot kill the account (**2–6% designed max drawdown**);  
- **binding listed tiles** (OPF-held chain) rather than inventing strikes;  
- **managing** from the **shape of the remaining P&L curve**, not from hope;  
- **combining okay bots** so the **book** — not a star — has a **short left tail** and a **long right tail**.

**What this is not:** a win-rate optimizer; a one-path backtest shrine; a promise that the 12.5% tail prints; Option Alpha with different paint; a second Massive or a second heatmap.

---

## 2. Market realities (working prior)

### 2.1 Landing law (normal picture — Coach’s table)

These are **market** probabilities of **where price lands**, not Strategy Lab win rates.

| Share | Landing | Process name |
|-------|---------|----------------|
| **50%** | Other side of the distribution | Expected losers |
| **37.5%** | Favorable, not extreme (~inside ~1σ of “our” side) | **Opportunistic** take or **scalp** |
| **10%** | Further (~1–2σ) | **Very large** — often **late tent**, **steep** last-day curve |
| **2.5%** | Beyond ~2σ (textbook one-tail) | **Big kahuna** — **pinned** in the tent |

**50 + 37.5 + 10 + 2.5 = 100.**

The **12.5%** (10% + 2.5%) is an **average**: what most analysts treat as **expected move**, and the share they assign to an option **finishing with intrinsic**.

**Reality (Coach):** the band **beyond expected move** is **touched far more often** than that expiry average. Those walks come in **cycles and clusters**, not i.i.d. sprinkles. **Pins happen more often in high-VIX regimes than low.**

### 2.2 How the book maps onto that law

| Layer | Bucket | Role |
|-------|--------|------|
| Cover expected losers | **37.5%** opportunistic / scalp | **Pays for the 50% against** |
| Wipe remainder | **Clusters / touches** on **asymmetric** setups (**weighted coins**) | Clear what the 37.5% did not fully cover |
| Advance the account | **10% + 2.5% pin** | What **moves the book forward** after the hole is covered |

**Weighted coin** = payoff **shape** (small defined debit, large tent) — not a loaded RNG.

### 2.3 Expected-move zeitgeist (why the discount exists)

The **average trader has no interest** in the **bad lands beyond expected move**, and **never will**, as long as **win rate is their sacred cow**.

That leaves **convex** listed flies **just past the EM fence** **under-bid**. **Same move still pays the same tent**; the member paid a **discount** because they chose the **convexity play**. That is the **frosting**.

**Hotel:** discount = **this listed mid is cheap vs a similar-width neighbor**, from the **OPF book**. Not a promised fill. If win-rate money crowds the bad lands, the frosting thins.

---

## 3. Decision dimensions (in order)

These are **vectors of the trade**, not filters on a single dropdown.

### 3.1 Premarket plan (not the night before)

**When:** **Premarket** — after the overnight / VOX picture is visible, **before** usual economic prints and **before** the cash open.

**Not:** the night before as default.

**Special case:** **European open** — the relevant open is earlier; the plan is set on **that** clock.

**From volatility regime and local IV** (these determine **decay rate**):

- which **strategy** (species)  
- how **wide** (strikes)  
- **directional bias**

Vol / local IV are **not** “off” at longer DTE — they still **price** the fly through decay — but they are **not** the lead lens there (§4).

### 3.2 Session (after the cash open)

**Session windows** (trigger grammar, §17 — finer than morning/afternoon/close):

overnight · **premarket** · **open** · mid-morning · midday · early-afternoon · late-afternoon · **close** · **T−N to close**

**Special case — 1 DTE Batman:** **T−N to close** (house ~15:45 ET). Not “sometime in the afternoon.”

Pack field `timing` today is only `morning` | `before_close` | `any`. The windows above are **doctrine**; encode as `session_window` on the trigger.

### 3.3 Structure (in-session)

**Whether this moment is a take:** expansion, compression, **structural level**, and further conditions Coach adds.

**Structure is read from volume profile** — **HVN top / HVN bottom / LVN / intranode / retracement** (§17). Especially as DTE lengthens, placement is **HVN/LVN topology**.

**Amendment (Coach 2026-08-16):** VP levels are also **entry events for 0DTE**, not only a 3–5 DTE placement lens. The **cyan arrows** on the morning chart **are the strategy**.

**Market memory (Coach 2026-08-16 · §17.7 · DL-386):** the structural analysis does **not** require daily updating. Nodes carry memory across weeks, months, years, even decades. Mature regions refresh as little as every **3–4 weeks** (minor edge / shelf / LVN). Frequent updates only where history is thin (ATH / untraded) — structure still **forming**. The profile is a **cumulative composite over the full tape**, not a rolling window. VP is a **slow layer**. See SL-GD30–34.

**GEX is not the placement map.** **GEX comes into play during management** — after the seat is on.

### 3.4 Tile (listed bind)

**Advanced Flies** (`sym-fly` on Options Lab Heatmap): one listed fly \((K, w)\) on the **OPF-held** dual-side chain.

The tile supplies **debit / credit, R:R** \((w-D)/D\) when \(D>0\), **curvature** (convexity of the fly surface), slope, Δ / velocity (decay of **that cell**), C/P asym.

**R2R is not typed in Position Builder.** It is **chosen by finding the tile** on the convexity heatmap grid. Other calculations assigned to tiles (convexity, debit, …) come from the **same** grid.

**OPF Truth (DL-309):** no invented strikes. Invalid cell stays a **named** failure.

---

## 4. Horizon (DTE) changes the lead lens

| Horizon | Lead | Still in play |
|---------|------|----------------|
| **0–1 DTE** | Vol regime + **local IV** → species and width | Structure, session, tile |
| **3–5 DTE and further** (campaigns) | **VP HVN/LVN topology** → **where to sit** | Vol still prices decay; GEX still manages |

**Any** strategy that **arrives in the final days** of expiration uses **0–1-class intense management**, regardless of how it was entered.

---

## 5. Management (two curves)

### 5.1 Opportunistic profit taking (locked name)

**Not** “optimistic.” Coach misspoke; **opportunistic** is law.

**When:** still **days** from expiry (including **3 DTE**), a **sharp overnight / open** (e.g. **~1.25–1.5σ**) parks **spot on the center strikes**, **inside the tent**. Mark is already a **gift** (Coach examples: **~300%**; range **100–400%** unrealized).

**Why:** remaining decay is **small**, **gamma is low**, the **real-time profit curve is flat**. The gift is the **move**, not the last days of theta. Holding is a bet the **same gift prints again**. Price action plus remaining decay make that **less likely**.

**Do not** wait three days to see if **300%** becomes **1500%**.

### 5.2 Intense last-day / last-days management

**When:** 0–1 DTE by design, **or** any longer book in its **final days**.

**Complementary picture:** **5 DTE** on, **underwater four days**, **last day** walks into the tent. Mark can print something like **800%** because risk was **tiny** and **almost all decay has already happened** — the curve is now **steep**.

Same family, **opposite clock**, **opposite curve**.

| Case | Tent arrives | Curve | Action |
|------|----------------|-------|--------|
| Opportunistic | Early, gift **in hand**, not near a “wait for 0DTE” story | **Flat** | **Take it** |
| Last-day | Late, decay **spent** | **Steep** | **Intense management** |

### 5.3 GEX

Informs **management** while the seat is on — not premarket species, not HVN placement.

---

## 6. Capital band (antifragile sizing)

**Designed max drawdown: 2–6%.**

From **that floor**, **one big win** (10% tent or 2.5% pin) **or a few ok wins** (opportunistic / scalp) can deliver a **new equity high**.

This **creates** the **right-skewed, long-right-tail distribution of *account* returns** by keeping the **left tail short**. It does **not** invent fat tails in the market.

**Crash:** defined small debit + convex seat = a crash **cannot take more than the band**. It is **more likely to help** (gift / pin) than to ruin **if** the book stays long the tent and inside 2–6%. **“No crash can hurt us”** is law only as **capped convex payoff**, not as “every crash profits.”

**Dim / prolonged low vol:** **reduce exposure to match** — fewer seats, smaller size, structure-led longer DTE. Dead tape must not grind the band.

**Skin in the game:** the 50%, the 2–6%, the small debit past EM. No seat, no fruit.

**Roundabout:** enter the path that looks worse now (bad lands, expected losers, underwater days) so the account is **on** when stress **leans**. The detour **has a cost** (Spitznagel). Dim vol → cut size is part of that cost.

---

## 7. Monte Carlo, not ossification

Backtest and forward walk are **not** a hunt for a **deterministic one-off winner**. That is **ossification**.

Read the **Monte Carlo**: near-infinite other orders, the **shape** of the distribution — **right-skewed, long right tail, short left tail**.

Success question: **Would the 50% still be affordable? Would a gift still make a new high from designed max DD?**

A single lucky equity line is **prediction in hindsight**.

---

## 8. Lab phases (catalog law)

Strategy Lab does **not** look for a **single winning strategy**.

It **curates okay strategies**, seeks **clusters of non-correlated** seats that **when combined** produce the distribution in §6–§7, **then deploys** them.

It **keeps curating** as many as it can:

- more that **cluster** with the live book;  
- more that **maintain** deployed seats (support, hedge, replace) so the **book shape** holds.

| Phase (UI) | Job under this doctrine |
|------------|-------------------------|
| **Design** | Specify an **okay** seat (species, strikes, schedule, capital band, exits). Prove **shape** (MC), not a hero path. |
| **Curate** | Does this seat **belong in a cluster**? Paper / process evidence. Multi-member Curate remains absolute (DL-252). |
| **Deploy** | Run the **combination**, not the star. Member Deploy UX except real-broker real-money until admin proves Tradier (DL-251/252). |
| **Archive** | Retire without erasing learning. |

---

## 9. Design tabs (builder maps the doctrine)

| Tab (as-built id) | Doctrine it must serve |
|-------------------|------------------------|
| **Position Builder** (`identity`) | Species (fly book first, Other fully supported), long/short (debit/credit icon), widths in **strikes**. Dual **definition + risk graph**. **No typed R2R.** |
| **Expiration Schedule** (`structure`) | 0DTE / 1DTE / Next + weekday book (daily vs Mon/Wed/Fri). Horizon **changes the lead lens** (§4). |
| **Risk & Capital** (`risk`) | **2–6%** designed DD band; primary metric is **return distribution shape** or a risk-adjusted ratio. Never win rate or raw return. |
| **Convexity & Debit** (`edge`) | Host **Advanced Flies** (same `sym-fly` / OPF / Market Bus). Hunt **convexity just beyond EM**. **Find** band = debit-to-width / debit-to-payoff. **Change** band = convexity RoC (tick-% magnitude, e.g. >20 / >30 / <40). Tile writes R:R, debit, curvature, listed \(K,w\). |
| **Timing & Entry** (`timing`) | A **warrant**, not a clock. The set is wide — hence **pseudo-code**. **OTM butterflies** lead with **VP structural levels + price action**. **GEX**, **order flow**, and others **may** also be criteria that an entry is warranted. VP trigger grammar (§17) when VP is on. Premarket regime still admits the day. 1DTE Batman **T−N to close**. **No clock without a condition; no price in the config.** |
| **Exit Rules** (`exits`) | Same wide-range grammar (pseudo-code). **Generally a dynamic trailing stop.** The dynamic part is **time**, **premium decay**, and whatever else the pseudo-code names. Opportunistic vs intense last-day still name the *curve*. GEX remains the **manage-time** lens once on; it may also have been an entry warrant. **ExitPolicy** is **potential-denominated** and **structure-agnostic** (§15.1). |
| **Review** | MC **shape**, not one winner. |

**Fly book (Butterflies — primary):** Symmetric Batman · Broken Far Wing Batman · ATM Symmetric Fly · OTM Symmetric Call Fly · OTM Symmetric Put Fly · OTM Broken Far Wing Call Fly · OTM Broken Near Wing Call Fly. Source: Coach fly plates `Pictures/flies`.

**Other:** Vertical, Single, Condor, Straddle, Strangle, Iron Fly, Iron Condor, Calendar, Diagonal — fully supported, used less.

**Widths** are **strike counts** (3 = three strikes). Not points.

**Batman:** two butterflies mirrored OTM about spot (ears). Symmetric or broken-**far** ears. 1DTE Batman close special case.

---

## 10. Surfaces we reuse (no fourth path)

| Job | Surface (already law) |
|-----|------------------------|
| Decay **rate** (species / width) | **Vol regime + local IV** |
| **Structure** (placement) | **Volume profile** HVN/LVN (lead at 3–5 DTE+) |
| **Management** map | **GEX** template |
| **Tile** / frosting / R:R / fly-surface convexity | **Advanced Flies** (`sym-fly`) |
| Instrument truth | **OPF-held** dual-side chain · Market Bus · one WS/tab |

Do **not** invent a second Massive client, a second heatmap, or a typed R2R that pretends to be a tile.

---

## 11. Copy and marketing (normative)

**Allowed (process):** defined small debit; expected losers; opportunistic take; last-day intensity; 2–6% band; we position, we don’t predict; skin in the game; the roundabout; okay strategies in clusters; beyond-EM discount because win-rate money stays home.

**Forbidden:** profit targets; typical 300% / 800% / 1500%; “12.5% lottery”; “no crash can hurt us” as a **guarantee of profit**; win-rate bragging; treating 50% against as a defect.

Coach examples (**300%**, **100–400%**, **800%**, **1500%**) stay in **this spec** as **mark illustrations**. They **must not** become UI targets or ads.

---

## 12. Laws (checklist)

| ID | Law |
|----|-----|
| **SL-GD1** | Position, don’t predict. |
| **SL-GD2** | Skin in the game to harvest the fruit. |
| **SL-GD3** | Enter and embrace the roundabout. |
| **SL-GD4** | Curate okay strategies; cluster non-correlated; deploy the book; keep curating. |
| **SL-GD5** | Landing law 50 / 37.5 / 10 / 2.5 is **market** prior; 12.5% is the analyst EM **average**. |
| **SL-GD6** | Beyond-EM is touched more than that average; walks **cluster**. Pins more in high VIX. |
| **SL-GD7** | 37.5% funds 50%; clusters wipe remainder; 10%+2.5% advance. |
| **SL-GD8** | Frosting = convexity **just beyond EM** = discount, nearly same payoff. |
| **SL-GD9** | Bad lands stay cheap while win rate is sacred. |
| **SL-GD10** | Premarket plan (not night-before default); EU-open special. |
| **SL-GD11** | Session windows: overnight · premarket · open · mid-morning · midday · early-afternoon · late-afternoon · close · T−N to close. 1DTE Batman = **T−N to close**. |
| **SL-GD12** | Structure from **VP** (HVN top/bottom, LVN, intranode, retracement). **GEX = management**. VP levels are **0DTE entry events**, not only a 3–5 DTE lens. |
| **SL-GD13** | 0–1 DTE vol-led; 3–5 DTE+ structure-led. Last days always intense. |
| **SL-GD14** | Opportunistic (flat early gift) vs intense last-day (steep spent decay). |
| **SL-GD15** | Designed max DD **2–6%** so a gift or pin can make a new high. |
| **SL-GD16** | Crash: capped, more likely to help if convex and inside the band. Dim vol: cut exposure. |
| **SL-GD17** | MC shape, not one-path winner. Review UI must not ossify. |
| **SL-GD18** | R2R and tile math from Advanced Flies on OPF chain. No invented strikes. |
| **SL-GD19** | Widths in **strikes**. Fly book primary. |
| **SL-GD20** | Process copy only. Coach multiples are examples, not targets. |
| **SL-GD21** | R2R = **potential** at design/entry (max payoff vs defined risk **as placed**). Never on result. ExitPolicy fields are **potential-denominated** and **structure-agnostic**. |
| **SL-GD22** | A trade is **one atomic position** regardless of leg count. Log, backtest, orders, exits, and outcome buckets address the **position**. One idempotency key per attempted **position** fill or exit; retry resubmits the **position** under that key; **log both**. |
| **SL-GD23** | A strategy is **not a trade**. It is a **rule** that **resolves** to a trade against the **surface it meets**. No absolute in the config that the surface will move. |
| **SL-GD24** | Placement is a **selector**, not a strike. One selector, two callers: heatmap preview and the bot. |
| **SL-GD25** | Resolution order: regime → window → surface read → selector → scope test → attempt (retry 3–5, abandon out-of-scope) → hold/manage → record. Config is fixed; only the surface moves. |
| **SL-GD26** | MC varies fills, retry geometry, operator friction — not the tape or the config. Shape out; never a path. |
| **SL-GD27** | Two-truth: a human can preview the selector; a machine can resolve it with no human. Designer done when every tab is machine-grade. |
| **SL-GD28** | Every resolved position carries provenance (config hash, surface tier, tick, score, geometry, R2R at potential, **VP classifier version**, **`profile_version`**, **`structure_maturity`**, …). Same trade shape for BT / FW / sim / live. |
| **SL-GD29** | Timing trigger = `level_class × interaction × session_window → travel_target`. The **arrows are the strategy**. Never a hard price; never a clock without a condition. |
| **SL-GD30** | The profile is a **cumulative composite over the full tape**, not a rolling window. A 30-day profile discards the memory the doctrine says is the point. Recency is *one* weight among volume mass, confirmation count, and age. The 2004–2026 SPY tape already on disk *is* the composite's foundation. |
| **SL-GD31** | VP is a **slow layer**, not a tick stream. The classified level set is a versioned artifact refreshed on a **memory-driven cadence**, never recomputed at 3–5s beside greeks. On replay a day resolves against the profile version in force that day: **`profile_version`** on every trade — one classifier output serves a month of backtests. |
| **SL-GD32** | Cadence is a **function of memory**, not a schedule. Mature region → weeks between refreshes (house: as little as every **3–4 weeks**, and then only minor edge / shelf / LVN); forming region (ATH / untraded) → frequent until volume hardens the structure. Surface context carries **`structure_maturity`** (`mature` / `forming`). A fly against a forming node is a different bet than one against a decade-old HVN; the strategy may say which it accepts. |
| **SL-GD33** | Node **age** and **confirmation count** are level attributes. A ten-year-old HVN top that has held four times is a different reaction zone than a three-week shelf. `level_class` gains age + confirmations as continuous attributes; the trigger grammar may filter on them. |
| **SL-GD34** | The VP-AI project learns **change-detection**, not daily generation. The judgment Coach exercises every morning is "has memory changed enough to warrant a redraw?" — a far more tractable target than redrawing structure daily. Near-future VP-AI trains on the labeled mornings + tape; its first job is detecting when the composite needs a new version. |
| **SL-GD35** | Primary optimization metric may be **return distribution shape** (MC: right-skewed, long right tail, short left tail) or a risk-adjusted ratio (Sharpe / Sortino / Calmar / return÷avg DD). Never win rate. Never raw return. Shape is the doctrine-aligned primary. |
| **SL-GD36** | Convexity & Debit names two bands. **Find** = debit-to-width / debit-to-payoff (where the cheap convex ticket lives). **Change** = RoC of the tile as **tick-% magnitude** (Advanced Flies `pct_change`) — min and/or max, e.g. >20%, >30%, <40%, 20–40%. Omit a side for open-ended. Never a dollar debit. Never a substitute for the find band. Uncomputable until the live tile has a tick % — honest, no silent fake. |
| **SL-GD37** | Timing & Entry is a **warrant**. The range is wide — the **pseudo-code** field holds what the chips cannot. **OTM butterflies** use **VP structural levels and price action**. **GEX**, **order flow**, and the rest **might** also be criteria that an entry is warranted — optional chips, not the lead. VP trigger = `level_class × interaction × session_window → travel_target`. Never a price. Never a clock without a condition. GEX as an *entry* warrant does not retire GEX as **management** once the seat is on (SL-GD12). |
| **SL-GD38** | Exits are **similar** (wide range, pseudo-code) but **generally a dynamic trailing stop**. The dynamic part is **time**, **premium decay**, and whatever else the pseudo-code names. Trail remains required (`dynamic_premium_decay_trailing.enabled`). Drivers ⊂ {`premium_decay`, `time`}. |
| **SL-GD39** | Backtest and forward-walk are **Law A consumers** (OT-EF v1.1). Same OPF-held listed universe. No invented strikes on gold or silver. |
| **SL-GD40** | A trade is **one atomic position** regardless of leg count — restates **SL-GD22** for the OT-EF join. BT/FW events, exits, and buckets address the **position**, never a leg. |
| **SL-GD41** | **Tier is a state** (gold \| silver), same honesty class as live \| last print \| expired. Never render silver as gold. |

---

## 13. As-built vs not yet (honesty)

**As-built (2026-08-16):** Design / Curate / Deploy bins; Position Builder fly dropdown + debit/credit icon + strike widths + risk graph; Expiration Schedule (0/1/next + daily vs MWF); seven Design tabs; validation cards with MC/structure graphics; pack `timing` morning/before_close/any; Advanced Flies live on **Options Lab** Heatmap; VP and GEX live on Options Lab; Market Bus + OPF.

**Doctrine, not yet encoded:** 2–6% lock; session_window enum; T−N; EU-open; opportunistic / last-day named exits; Advanced Flies **hosted in** Convexity & Debit; VP/GEX as Design lenses; **Timing trigger UI**; VP classifier + ES tape; **`profile_version` / `structure_maturity` / node age + confirmations**; VP-AI **change-detection** (not daily generation); cluster correlation in Curate; book-level MC + **live `expectedDistributionShape` score**; ExitPolicy tent-relative / frac-of-debit in pack UI; O-6 live path; **one selector**; provenance blob.

**As-built this fold:** Risk & Capital `primary_metric` includes `distribution_shape`. Convexity RoC band is optional. Timing & Entry is warrant chips + VP trigger + **pseudo-code** (OTM default VP + price action). Exit Rules is a **dynamic trailing stop** with time + premium decay drivers + **pseudo-code**. Live GEX/order-flow fire and classifier are encode-next.

---

## 14. Acceptance (doctrine)

A change to Strategy Lab **fails** this spec if it:

1. Optimizes **win rate** or a **single** backtest path as success.  
2. Types **R2R** in Position Builder or invents strikes for a cheaper curve.  
3. Treats **GEX** as the placement map or **VP** as the decay-rate meter.  
4. Ships **profit-claim** copy (targets, typical multiples, crash-profit guarantee).  
5. Hunts a **hero bot** instead of an **okay** seat in a **cluster**.  
6. Adds a **second** live-chain path (per-widget Massive / extra WS) for the heatmap.  
7. Computes R2R from **realized P&amp;L** or **win rate**.  
8. Treats a **leg** as a trade, exit target, outcome bucket, or order-dedupe key.  
9. Puts a **hard strike** or a **dollar-only debit** in the config as if it were the strategy.  
10. Uses a **different** picker for the heatmap preview than the bot uses to resolve.  
11. Puts a **price** or a **bare clock** in Timing & Entry, or cannot write a Coach arrow as `level_class × interaction × session_window`.  
12. Treats the profile as a **rolling window** (e.g. 30-day) or **regenerates classified VP daily / at greeks cadence** as if nodes had no memory.  
13. Omits **`profile_version`** or **`structure_maturity`** from provenance, or treats a fly on a **forming** node as the same bet as one on a decade-old HVN.  
14. Omits **`distribution_shape`** from the primary-metric set, or ranks Design by **win rate** or **raw return**.  
15. Treats debit-to-width as if it were the **magnitude of convex change**, or invents a RoC from a single path when tick % is missing.  
16. Makes Timing a **bare clock**, stores a **price** as the entry, or treats GEX as the only OTM-fly warrant.  
17. Ships Exit Rules without a **dynamic trailing stop**, or makes the dynamic part a fixed dollar target.  
18. Invents strikes on a backtest or forward-walk (gold or silver) that the OPF-held listed chain does not have (SL-GD39).  
19. Treats a **leg** as the BT/FW event, exit, or outcome bucket (SL-GD40 / SL-GD22).  
20. Draws a **silver** result as **gold**, or a last print / residual as **live** (SL-GD41).

---

## 15. Engine rulings (Coach 2026-08-16 · **DL-383**)

Normative for the Strategy Lab **engine**: Design bind, Curate/Deploy runtime, backtest/forward-walk events, Trade Log, and broker submit. Complements Process Runtime **ExitPolicy** (§2.7) and **O-1…O-5** (§21.4); **wins** where those are silent or looser.

### 15.1 R2R and ExitPolicy are potential, never result

**R2R** is measured on trade **POTENTIAL** at **design / entry**:

\[
\mathrm{R2R} = \frac{\text{max potential payoff of the structure as placed}}{\text{defined risk of the structure as placed}}
\]

Same spirit as Trade Log `entry_r2r` (risk at open; max potential = width − risk on the usual debit fly). **Never** from how the trade **ended**. **Never** from win rate. Outcome buckets (§2.1) classify **how the position resolved**; they do **not** rewrite the entry R2R.

The **tile** (Advanced Flies) that sets `otm_r2r` is a **potential** number from the **placed** listed structure (mids at bind/entry) — SL-GD18.

**ExitPolicy** fields are **potential-denominated** and **structure-agnostic**. Allowed denominations:

| Denomination | Meaning |
|--------------|---------|
| **Fraction of max profit** | `frac ×` theoretical max profit **at open** (already `take_profit_frac_of_max_profit`) |
| **Fraction of debit** | `frac ×` net debit **paid** (defined risk on a debit structure) |
| **Tent-relative** | Position on the **expiration tent** (e.g. fraction of width remaining to the body / wing) — same language for Batman, single fly, vertical |

**Forbidden:** credit-only field names as the universal language (`take_profit_frac_of_credit`, …). **Forbidden:** exit thresholds denominated in **realized R2R** or **result**.

The **trigger** may still compare **live mark P&amp;L** to those **open potentials**. That is not “R2R on result.” The **policy number** is always a piece of the **as-placed** tent.

Opportunistic vs last-day (§5) **read the curve** against that **same** potential tent.

### 15.2 One trade = one atomic position

A **trade** is **one atomic position** **regardless of leg count**. Batman (six legs), a 3-leg fly, a 2-leg vertical — **one** position.

| Surface | Addresses |
|---------|-----------|
| Trade Log | The **position** |
| Backtest / forward-walk **events** | The **position** |
| Broker **orders** (open / exit) | The **position** (multi-leg package) |
| **Exits** / ExitPolicy | The **position** |
| **Outcome buckets** (50 / 37.5 / 10 / 2.5) | The **position** |

**Never** a leg. Do not score, bucket, or “close” a Batman **call ear** as if it were the trade. Do not key dedupe per OCC line.

**Order dedup keys the position:**

- **One idempotency key** per **attempted position fill** (open).  
- **One idempotency key** per **attempted position exit**.  
- The **retry loop resubmits the position** under **that** key (not new keys per leg, not a new key per retry).  
- **Log both:** the **attempt** and the **broker result** (fill, working, reject, or `order_dedupe_hit`) under the same key.

This **tightens** O-1…O-5: `client_order_tag` is a **position** tag. “Advanced exit legs” in O-1 means **broker package lines that implement the position exit**, not a separate trade identity per line.

---

## 16. Config resolution (Coach standard · folded from Design v0.1 · **DL-384**)

Source draft: [`docs/FatTail-Labs-Strategy-Lab-Config-Resolution-Standard-v0_1.md`](../docs/FatTail-Labs-Strategy-Lab-Config-Resolution-Standard-v0_1.md). Coach asked it folded here. **Coach text kept.** This section is **normative**.

### 16.1 Principle

**A strategy is not a trade; it is a rule that resolves to a trade against whatever surface it meets.** The config describes the *shape of the seat* relative to the market. The market supplies the concrete strikes, debit, and marks — and it supplies different ones every day and every minute, because the surface moves.

**Corollary:** **no absolute value in a config that the surface will move.** A config with a hard strike in it cannot be backtested, only replayed; it cannot be run live tomorrow, only remembered.

### 16.2 The surface is a moving object

The 3D per-leg vol surface (strike × time × vol → price, greeks) is rebuilt for the day and updated every tick (3–5s gold, per bar silver). It changes shape with:

| Driver | What moves |
|--------|------------|
| **Underlying track** | Spot walks; the tent's center relative to strikes shifts; EM-relative zones slide with it |
| **Per-leg vol** | Skew and term change leg by leg; the same fly reprices, its curvature and debit change, its R2R at potential changes |
| **Time decay** | The curve steepens through the day; a flat morning curve becomes the steep last-day curve (§5 — two curves) |
| **Regime** | VIX / VIX1D shift the decay rate and the width that makes sense (premarket vector) |
| **Liquidity** | Spreads and sizes change what fills and at what friction |

The same config meets a different surface at 9:35, 11:00, 15:45 — and on Monday vs a CPI Thursday. That is not noise to be smoothed; it is the thing being tested.

### 16.3 Config vocabulary — surface-relative by law

Every strategy field is a **rule the surface resolves**, never a value the surface will move.

| Tab | Field class | Written as (surface-relative) | Never written as |
|-----|-------------|-------------------------------|------------------|
| Position Builder | species, family, direction | fly / BWB / Batman; call / put / both; long / short | a specific listed strike |
| Expiration Schedule | DTE, width days | DTE class (0 / 1 / 3–5+); weekday book | a specific expiry date as the strategy |
| Risk & Capital | max at risk, band | fraction of capital; **2–6% designed max DD** | a dollar strike price |
| Convexity & Debit | placement, debit, R2R, RoC | **zone** relative to expected move (e.g. “just beyond EM,” delta band, σ band); debit as **fraction of width** or a range; **R2R at potential** floor; curvature preference; **RoC tick-% magnitude** band | a strike; a debit in dollars alone |
| Timing & Entry | when | premarket regime → **session_window** (§17) → **VP trigger** (`level_class × interaction`) → optional `travel_target` | a clock time with no condition; a **price** |
| Exit Rules | how it comes off | fraction of **max profit** (potential); tent-relative levels; decay-trail; **opportunistic** vs **intense last-day**; stop as fraction of debit; hold-to-expiry | a dollar target |
| Review | evidence | MC distribution shape acceptance | a single path |

**Widths** remain **strike counts** (SL-GD19) — relative to the listed step, not a frozen point width that the surface will move.

**Placement is a selector, not a strike.** The Convexity & Debit rule defines the *eligible region* on any chain (zone × width × debit range × R2R floor × curvature preference × **RoC band**). The heatmap shows that region on today's chain for the member to preview. The bot runs the **identical selector** automatically. **One selector, two callers.**

### 16.4 Resolution — how a config becomes a position

At every candidate moment the engine performs the same act, in order:

1. **Regime check** (premarket vector) — does today's vol regime admit this seat at all? If not, no attempts today.  
2. **Window check** — is the **session_window** open (§17)?  
3. **Surface read** — take the current surface (this tick's chain, per-leg vol, spot) **and today’s VP profile with classified levels** (HVN top/bottom, LVN, intranode, retracement).  
3b. **Trigger fire** — has `level_class × interaction` occurred **inside** this window? If the config requires a structural event and it has not fired → **no selector this moment**.  
4. **Selector** — only after the trigger (if any) has fired: apply the placement rule to the *listed* chain: eligible zone → eligible widths → candidate structures; price each on the surface; rank by the config's convexity score (R2R at potential / curvature per debit — one function, the same the heatmap displays); pick the top eligible tile. **Only listed strikes; no invented geometry.** Optional `travel_target` feeds where the tent sits relative to the next level.  
5. **Scope test** — is the chosen structure inside all config bounds (debit range, R2R floor, band, width)? If nothing eligible → **no trade this moment**, recorded as an event.  
6. **Attempt** — submit the **atomic position** (SL-GD22) at the config's price rule; fill friction rolls; **retry until filled**, each retry re-running steps 3–5 on the *next* surface under the **same idempotency key**; **abandon on out-of-scope** (Method v0.2).  
7. **Hold and manage** — the position marks on the moving surface every tick; exit rules evaluate against **potential** (SL-GD21); GEX as manage-time lens; exits obey the same retry/scope loop (one key per position exit).  
8. **Record** — one atomic trade event: resolved geometry, debit, R2R at potential at entry, fill path, marks, exit path, outcome bucket.

The config never changes during resolution. Only the surface does. **Same config, different day, different fly, same seat.**

### 16.5 What the Monte Carlo varies, and what it does not

| Fixed across runs | Varies across runs |
|-------------------|--------------------|
| The tape (surface track for the day) | Fill outcomes and prices (market friction) |
| The config | Retry timing → resolved geometry drift → entry debit |
| The selector function | Operator-friction events (late/missed/oversized), when dialed above 0 |
| Listed strikes | Which eligible tile wins when friction moves the ranking between retries |

Result: a **distribution of resolved trades** for the same seat on the same day — the honest range of what “this strategy on this day” means once fills are real and humans are human. Shape out; never a path. (SL-GD17, SL-GD26.)

### 16.6 Two-curve law inside resolution

Because the surface's *shape* changes with time, the same config must know which curve it is on (§5):

- **Flat curve** (days out, opened inside the tent): the mark is a gift; the **opportunistic** exit rule governs — fraction of max profit reached → take.  
- **Steep curve** (last day, decay spent): **intense** management; tent-relative and decay-trail exits, T-minus discipline.

The exit config names both; the engine selects by **where the surface's curve is**, not by a clock alone. This is why exits are written as *potential-relative*: Coach’s **300%** on a flat curve and **800%** on a steep one are both “fractions of what this tent can pay right now” — **mark illustrations**, not UI targets (SL-GD20).

### 16.7 Two-truth law for the designer

For the designer to be complete, the config it emits must satisfy both:

1. **A human can preview it** — the heatmap shows what the selector picks on today's chain; the risk graph shows the resolved structure on the current surface.  
2. **A machine can resolve it with no human in the loop** — on any surface, any day, the same selector produces a position or a recorded “no eligible structure.”

A config that only satisfies (1) is a **sketch**. A config that satisfies (2) is a **strategy**. The designer is done when every tab's output is (2)-grade.

### 16.8 Provenance on every resolved trade

Each resolved position carries: config version + hash, surface tier (gold/silver), tick timestamp of resolution, selector score at pick, listed geometry, R2R at potential, per-leg vol at entry, friction model version, operator-friction level, MC seed, **VP classifier name + version**, **`profile_version`**, **`structure_maturity`** (mature / forming), node age + confirmation count of the firing level, trigger event that fired (class × interaction × window). Same record for backtest, forward walk, sim, and live — one trade shape, four contexts (Method §6, “the bot is a member”).

---

## 17. VP trigger grammar (Timing & Entry · **DL-385**) + market memory (**DL-386**)

Source: Coach PDF *VP Structural Analysis — Reference for the Timing & Entry Trigger Grammar* (2026-08-16, updated same day with **§7 Market memory** and peer-reviewed long-memory grounding). Searchable extract: [`docs/VP-Structural-Analysis-Timing-Entry-Trigger-Grammar.md`](../docs/VP-Structural-Analysis-Timing-Entry-Trigger-Grammar.md). Full Coach text: [`docs/VP-Structural-Analysis-Trigger-Grammar-Reference_1.md`](../docs/VP-Structural-Analysis-Trigger-Grammar-Reference_1.md). **Coach text kept.** Chart companion: ES1! 5-minute Aug 12–14 2026 morning analysis. **Lineage seat for §17.7:** Yankee (Mandelbrot channel).

### 17.1 The arrows are the strategy

Coach’s morning chart is not decoration. It is the **human version of a strategy trigger**: structural levels, session boundaries, and **cyan arrows**. Members trade the **interactions**. **The cyan arrows are the strategy.** Timing & Entry must **write what the arrows say**. The backtester must **fire the same events** on replay.

### 17.2 Level classes (topology, not importance)

Colors describe *where the level sits in the volume structure*:

| Class | Chart color | Meaning |
|-------|-------------|---------|
| **HVN bottom** | Green | Lower edge of a high-volume node |
| **HVN top** | Red | Upper edge of a high-volume node |
| **LVN** | Yellow | Structure **between** nodes (thin travel) |
| **Intranode** | Blue | Levels **inside** a node |
| **Retracement** | Fib ladder | 0 / 0.25 / 0.33 / 0.5 / 0.68 / 0.75 / 1 / 1.25 / 1.5 of the prior swing |

A red and a green **bracket an HVN**. Yellow is the gap between nodes — price **moves fast through yellow** and **stalls at red/green**. **Never store a price** in the config; today’s profile supplies the price for that class.

### 17.3 Grammar

```
TRIGGER = level_class × interaction × session_window  →  (optional) travel_target
```

| Field | Values (surface-relative) |
|-------|---------------------------|
| **level_class** | HVN top · HVN bottom · LVN · intranode · retracement |
| **interaction** | test · hold · break · retest · reject |
| **session_window** | overnight · premarket · open · mid-morning · midday · early-afternoon · late-afternoon · close · T−N to close |
| **travel_target** (optional) | next level of class X · N ticks · tent placement relative to next level |

**travel_target** feeds Convexity & Debit (where the fly is placed) and can inform the **opportunistic** exit.

A seat may require **all three:** regime admits · window open · **structural event fires** → then the selector places the fly.

### 17.4 0DTE amendment

VP levels are **entry events for 0DTE**, not only a 3–5 DTE placement lens. Same grammar at every horizon.

### 17.5 Capture / replay

VP is derived on replay from the tape (frozen-geometry) and captured going forward. **Source labeled:** SPY tape now; **ES when wired** — Coach’s chart is **ES**, where the structure actually forms. ES-sourced VP is the target.

The **classifier** (this is an HVN top vs the LVN between these two nodes) is **versioned and named** on every resolved trade. Coach’s morning-analysis classification is the **reference implementation** — replay must reproduce those lines from the Aug 12–14 tape before it is trusted.

### 17.6 Acceptance (Timing & Entry tab)

1. A member can express **every arrow** on the chart as a config trigger — **no hard price**.  
2. The same trigger, on the gold-day replay, fires at the moments Coach’s arrows mark.  
3. Heatmap preview shows where the selector would place the fly **when** the trigger fires — **one selector, two callers**.  
4. Nothing in the tab is a **clock without a condition**; nothing is a **price**.

### 17.7 Market memory — why structure persists, and what that dictates (Yankee lane · **DL-386**)

**Coach (2026-08-16):** the structural analysis does *not* require daily updating. Nodes carry memory across weeks, months, years, even decades. In a mature price region, the levels are refreshed as little as every 3–4 weeks — and then only minor things: an edge shifts, a shelf appears, an LVN thins. Updates are frequent only where history is thin — near all-time highs or after a break into untraded territory — where structure is still *forming* because no memory exists there yet.

**Grounding.** This is the operational face of long memory in financial series — the Mandelbrot lineage (fractional Brownian motion, Hurst exponent, *The (Mis)Behavior of Markets*) and a substantial peer-reviewed literature confirming long-range dependence, especially in the magnitude of returns and in volatility: Lo's modified R/S work, Ding–Granger–Engle on long memory in absolute returns, the fractional-integration family (ARFIMA / FIGARCH), Peters' Hurst work in markets, the econophysics multiscaling results. **Not one man's claim — a documented statistical property.**

*(Bench: cite from a real reference pass before any of these names appear member-facing; this list is from memory.)*

**What it dictates for the platform (SL-GD30–34):**

| Consequence | Law |
|---|---|
| **The profile is a cumulative composite over the full tape**, not a rolling window. A 30-day profile discards the memory the doctrine says is the point. Recency is *one* weight among volume mass, confirmation count, and age. | The 2004–2026 SPY tape already on disk *is* the composite's foundation. |
| **VP is a slow layer, not a tick stream.** The classified level set is a versioned artifact refreshed on a memory-driven cadence, never recomputed at 3–5s beside greeks. | On replay a day resolves against the profile version in force that day: `profile_version` on every trade — one classifier output serves a month of backtests. |
| **Cadence is a function of memory, not a schedule.** Mature region → weeks between refreshes; forming region → frequent until enough volume hardens the structure. | The surface context carries `structure_maturity` (mature / forming). A fly against a forming node is a different bet than one against a decade-old HVN; the strategy may say which it accepts. |
| **Node age and confirmation count are level attributes.** A ten-year-old HVN top that has held four times is a different reaction zone than a three-week shelf. | `level_class` gains age + confirmations as continuous attributes; the trigger grammar may filter on them. |
| **The AI project learns change-detection, not daily generation.** The judgment Coach exercises every morning is "has memory changed enough to warrant a redraw?" — a far more tractable target than redrawing structure daily. | The near-future VP-AI trains on the labeled mornings + tape; its first job is detecting when the composite needs a new version. |

**Reception history — the thesis, illustrated (Coach, 2026-08-16).** Mandelbrot did not keep this in the academy. After developing long memory and fractal geometry he took the ideas to Wall Street — decades at IBM, consulting to institutions, and *The (Mis)Behavior of Markets* written explicitly to make the finance industry take the non-Gaussian, long-memory picture seriously. **The crowd largely ignored it** — not because it was wrong, but because it was inconvenient: it breaks Black–Scholes assumptions, forces risk models to admit uncertainty they would rather not, and fits no quarterly incentive. **Some of the most successful practitioners used it** — the documented lineage runs through Taleb (Empirica, Universa advisor), Spitznagel (Universa's public tail-hedge record), Thorp (Princeton-Newport, the Kelly/survive-first discipline), and the mathematical tradition Simons drew on at Renaissance; the Mandelbrot–Fisher–Calvet multifractal model was adopted into serious volatility modeling. **Used by some of the most successful, ignored by the crowd — another illustration of the thesis:** the position paper's "we sit there *because* they will not" has a forty-year precedent in how the Street treated the man who explained why.

*(Bench: source the biographical specifics before member-facing use — Mandelbrot's memoir* The Fractalist *(2012), Taleb's* Incerto, *Spitznagel's* Safe Haven, *Thorp's* A Man for All Markets, *Zuckerman's* The Man Who Solved the Market. *Frame as documented practitioners of the lineage — never as performance claims the platform makes.)*

**Lineage seat:** this subsection is Yankee's lane (Mandelbrot channel) — the first packet in that lane. Yankee gates the framing: fat tails and long memory as **documented properties**, never as a slogan; math matched to the audience.

*The arrows are the strategy. Make the tab able to write what the arrows say. The structure they point at remembers.*

---

## 18. OT-EF join — three amendments (Coach 2026-08-16 · **DL-396**)

Folded so Law A is not Options-Lab-only. Same three lines live in [OT-EF v1.1](./FatTail-Labs-Options-Lab-OPF-Truth-and-Elegant-Failure-Doctrine-v1.1.md) §6.

| ID | Amendment |
|----|-----------|
| **SL-GD39** | Backtest and forward-walk are **Law A consumers**. Same OPF-held listed universe. No invented strikes on gold or silver. |
| **SL-GD40** | A trade is **one atomic position** (restates SL-GD22). BT/FW events, exits, and buckets address the position. |
| **SL-GD41** | **Tier is a state** (gold \| silver), same honesty as live \| last print \| expired. Never render silver as gold. |

**Doctrine only in this fold.** No chrome. No BT/FW engine rewrite in this amendment. Characterization and any later code wait for the OT-EF / Session-Print bench plan gates (Echo labels · Delta characterization list · Session/Print Coach GO).

---

**End of Guiding Doctrine Spec v1.0.**
