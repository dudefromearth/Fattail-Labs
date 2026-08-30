# IKI Research — Symbol Entity Maps v1.0

**Scope:** IKI Lab — Factory research bot, skill `symbol-entity-map` run by hand on Coach's 20 supported symbols (2026-08-22 screenshot, with strike step). Touches nothing. Reference document for `iki-opportunity-finder`.
**Honesty:** holdings, weights, settlement details, and calendar items marked `[UNCONFIRMED]` were not verified this cycle; the bot verifies per run. Nothing here is a forecast.

**Universe (20):** SPX · XSP · VIX1D · VIX · SPY · QQQ · IWM · GLD · TLT · SLV · USO · XLF · UNG · AAPL · AMZN · NVDA · TSLA · GOOGL · META · MSFT

**Audience key:** 🎯 = options trader — **the wedge; first cycles serve this row only** (Coach 2026-08-22, Factory F10). Every other row is retained for later activation; none is dropped.

---

## Group A — Broad US equity: SPX · XSP · SPY

| | SPX | XSP | SPY |
|---|---|---|---|
| Instrument | index, cash-settled | index (1/10 SPX), cash-settled | ETF, physical |
| Settlement | AM monthly / PM weekly `[UNCONFIRMED which expiries]` | PM | PM |
| Strike step | 5 | 1 | 1 |

**Entities / markets:** the 500 largest US companies by cap — ~30% technology `[UNCONFIRMED]`; the US economy's earnings stream; the world's reference risk asset. Moves with: rates (TLT), the dollar, credit spreads, oil at extremes.
**Sectors:** all; tech-heavy. **Cycles:** business cycle, earnings cycle, Fed cycle, risk-on/risk-off.
**Calendar:** quarterly earnings seasons, FOMC (8/yr), CPI/PCE, jobs Friday, quad witching, index rebalances.

**Audiences**
1. 🎯 0DTE/weekly index options trader — needs width, decay, fills; beachhead
2. **401(k) / pension participant** — "should I be worried" — uses headlines — chain: how big a move is priced, vs history
3. **Corporate FP&A / CFO** — budget assumptions on equity-linked comp, market-sensitive revenue — uses consensus strategist targets — chain: the market's own distribution for the quarter
4. **Financial journalist / newsletter writer** — daily "what's the market expecting" — uses VIX headline — chain: term structure, event premium
5. **RIA / wealth advisor** — client-calming, rebalance timing — uses trailing vol — chain: implied vs realized, skew
6. **Macro student / economist** — reads SPX as growth expectation proxy
7. **Risk manager at a non-financial firm** — hedging cost for equity exposure — chain: spread tax, put cost map

**Keywords:** "is the stock market going to crash" · "what is the market expecting from the Fed" · "S&P 500 outlook" · "how to hedge my 401k" · "why is the market down today" · "VIX vs SPX explained" · "market priced in rate cut" · "expected move this week"

---

## Group B — Volatility: VIX · VIX1D

| | VIX | VIX1D |
|---|---|---|
| Instrument | index (30-day implied vol of SPX), cash | index (1-day implied vol of SPX) |
| Options | listed; AM Wednesday settlement `[UNCONFIRMED]`; proxy VIXY (DL-223) | options listing `[UNCONFIRMED]` — may be data-only |
| Strike step | 5 | 5 |

**Entities / markets:** fear itself — the price of SPX insurance. Moves inversely with SPX most days; structurally tied to 0DTE flow (VIX1D) and to the vol-selling/ETN complex.
**Cycles:** risk regime; vol-of-vol; term-structure contango/backwardation as a regime read.
**Calendar:** FOMC, CPI, jobs, monthly VIX expiration Wednesday, any geopolitical shock.

**Audiences**
1. 🎯 Vol trader / vol-seller — beachhead
2. **Every retail investor who has heard "fear gauge"** — "what does VIX 20 mean" — uses the number — chain: VIX's own option surface (how scared is the fear gauge), VIX1D vs VIX (today vs the month)
3. **Journalist** — VIX is the one derivative they quote daily — chain: term structure in plain words
4. **Asset allocator / CIO** — regime classification — uses VIX level — chain: VIX1D/VIX ratio, skew on VIX
5. **Options educator / content creator** — explaining vol — source of honest visuals
6. **Event planner (corporate / IR)** — "is this a bad week to announce" — chain: event premium embedded

**Keywords:** "what is the VIX" · "VIX explained" · "is VIX high" · "market fear index today" · "VIX1D" · "0DTE volatility" · "vol crush earnings" · "VIX term structure"

---

## Group C — Style / size: QQQ · IWM

| | QQQ | IWM |
|---|---|---|
| Instrument | ETF, Nasdaq-100, physical | ETF, Russell 2000, physical |
| Strike step | 1 | 1 |

**QQQ entities:** the 100 largest non-financial Nasdaq names — Mag7 are ~40% `[UNCONFIRMED]`; AI capex, semis, software, platforms. **Cycles:** tech capex, rates (long-duration growth), AI sentiment.
**IWM entities:** 2,000 small-caps — regional banks, biotech, industrials, consumer; the most rate- and credit-sensitive equity proxy; domestic economy.
**Cycles:** credit cycle, rate cuts (IWM), domestic growth, "broadening out."
**Calendar:** earnings, FOMC, Russell reconstitution (June), Nasdaq rebalance.

**Audiences**
1. 🎯 ETF options trader — beachhead
2. **Tech employee with RSUs** (QQQ proxy) — "should I diversify" — chain: concentration-implied move
3. **Small-business owner / regional banker** (IWM) — reads IWM as "my economy" — uses local news — chain: credit stress priced into small caps
4. **Growth vs value allocator** — QQQ/IWM rotation — uses trailing returns — chain: relative implied moves, relative skew
5. **VC / startup founder** — exit window — uses IPO headlines — chain: small-cap risk appetite (IWM skew)
6. **Journalist covering AI** (QQQ) — "is AI a bubble" — chain: is QQQ priced for perfection (IV rank, event premium)

**Keywords:** "QQQ vs SPY" · "small caps rate cuts" · "is tech a bubble" · "Russell 2000 recession" · "should I sell my RSUs" · "IWM outlook" · "Nasdaq expected move"

---

## Group D — Metals: GLD · SLV

| | GLD | SLV |
|---|---|---|
| Instrument | ETF, physical gold bullion trust | ETF, physical silver trust |
| Strike step | 0.5 | 0.5 |

**Entities / markets:** spot gold / spot silver; central-bank buying (gold); industrial demand — solar, EVs, electronics (silver ~50% industrial `[UNCONFIRMED]`); mining equities (GDX, SILJ); the dollar; real yields (TLT-linked).
**Cycles:** inflation, real rates, dollar cycle, geopolitical stress, industrial cycle (silver), retail mania cycles (silver squeezes).
**Calendar:** CPI, FOMC, central-bank reserve reports `[UNCONFIRMED cadence]`, India/China festival demand seasons, mining supply reports.

**Audiences**
1. 🎯 Metals options trader — beachhead
2. **Retail gold buyer / coin buyer / "prepper"** — "is gold going to $3,000" — uses YouTube gurus — chain: what is priced, how sure
3. **Jeweler / bullion dealer** — inventory and hedging — uses spot — chain: implied range for the season
4. **Solar / EV manufacturer procurement** (silver) — input cost — chain: implied silver range, cost to hedge
5. **Central-bank / sovereign watcher, macro journalist** — gold as dollar alternative
6. **Miner CFO / investor** — hedging program — chain: skew, term structure
7. **Inflation-worried saver** — gold as "insurance" — chain: gold's implied move vs SPX's

**Keywords:** "is gold a good investment right now" · "gold price prediction" · "silver squeeze" · "silver industrial demand solar" · "should I buy gold or silver" · "gold vs dollar" · "why is gold going up" · "silver to $50"

---

## Group E — Rates: TLT

| Instrument | ETF, 20+yr US Treasuries, physical | Strike step 0.5 |

**Entities / markets:** the long end of the US yield curve; Treasury auctions; the Fed; fiscal deficits; mortgage rates (via MBS spreads); the dollar; every long-duration asset.
**Cycles:** Fed cycle, inflation cycle, fiscal/issuance cycle, recession expectations.
**Calendar:** FOMC, CPI/PCE, jobs, Treasury refunding (quarterly), auction dates, debt-ceiling episodes.

**Audiences**
1. 🎯 Rates options trader — beachhead
2. **Homebuyer / refinancer** — "will mortgage rates fall" — uses rate-lock anxiety — chain: implied range for long rates, how sure
3. **Corporate treasurer** — issuance timing, hedging — uses forward curve — chain: optionality priced around FOMC
4. **Pension / insurance CIO** — duration matching — chain: tail cost on the long bond
5. **Real-estate developer / REIT** — cap rates — chain: rate volatility regime
6. **Retiree building a bond ladder** — "lock in now or wait" — chain: implied move vs history
7. **Mortgage broker / loan officer** — content for clients

**Keywords:** "will mortgage rates go down" · "TLT outlook" · "should I buy bonds now" · "Fed rate cut when" · "bond market crash" · "long bond yields" · "best time to refinance"

---

## Group F — Energy: USO · UNG

| | USO | UNG |
|---|---|---|
| Instrument | ETF, WTI crude futures (front/near months, rolls) | ETF, Henry Hub nat-gas futures (rolls; decay) |
| Strike step | 0.5 | 0.5 |

**Entities / markets:** WTI/Brent; OPEC+; US shale; SPR; refiners; airlines and trucking (fuel); petrochemicals. **UNG:** Henry Hub; LNG export terminals; utilities; weather; storage; Europe/Asia gas links.
**Cycles:** commodity supercycle, OPEC decisions, inventory cycle, hurricane season, heating/cooling seasons, geopolitical supply shocks.
**Calendar:** OPEC+ meetings, weekly EIA inventories (Wed oil / Thu gas), hurricane season (Jun–Nov), winter withdrawal season, futures roll dates (structural to these ETFs — a template honesty item).

**Audiences**
1. 🎯 Energy options trader — beachhead
2. **Airline / trucking / logistics fuel buyer** — hedge timing — uses strip + gut — chain: implied range, cost to hedge, skew
3. **Farmer / agribusiness** (diesel, fertilizer ↔ nat gas) — input cost
4. **Utility planner / industrial energy buyer** (UNG) — procurement — chain: winter implied range
5. **Homeowner facing heating bills** — "will gas prices spike this winter" — chain: priced seasonal move
6. **Energy journalist / policy analyst** — OPEC, SPR — chain: event premium around OPEC
7. **Shale operator / E&P CFO** — hedging program
8. **Commuter / driver** — "why is gas expensive" — widest audience, lowest depth

**Keywords:** "oil price forecast" · "will gas prices go up" · "OPEC meeting oil" · "natural gas winter 2026" · "USO vs oil price" · "how to hedge fuel cost" · "hurricane oil prices" · "LNG exports natural gas price"

---

## Group G — Financials: XLF

| Instrument | ETF, S&P financials sector, physical | Strike step 0.5 |

**Entities / markets:** JPM, BAC, WFC, GS, MS, BRK.B `[UNCONFIRMED weights]`; banks, insurers, asset managers, exchanges, payments. Net interest margin; credit; regulation; deal flow.
**Cycles:** credit cycle, yield-curve shape, regulatory cycle, M&A/IPO cycle, regional-bank stress episodes.
**Calendar:** bank earnings open each season (mid-Jan/Apr/Jul/Oct), Fed stress tests (June), FOMC, Basel/regulatory dates.

**Audiences**
1. 🎯 Sector options trader — beachhead
2. **Bank depositor / small-business owner** — "is my bank safe" — chain: stress priced into financials, skew
3. **Bank employee / compensation planner** — bonus season
4. **Fintech founder / investor** — sector risk appetite
5. **Credit analyst / lender** — chain: financials' implied move vs SPX as a credit-stress read
6. **Journalist covering banking** — earnings-season expected moves

**Keywords:** "are banks safe" · "bank earnings preview" · "regional bank crisis" · "XLF outlook" · "yield curve banks" · "financial sector ETF"

---

## Group H — Mega-cap equities: AAPL · AMZN · NVDA · TSLA · GOOGL · META · MSFT

| Symbol | Step | What it is behind the ticker | Distinct cycles / calendar |
|---|---|---|---|
| **AAPL** | 1 | iPhone/Mac/services; China supply chain; consumer discretionary; TSMC; app-store regulation | product events (Sep), WWDC (Jun), China sales, tariffs |
| **AMZN** | 2.5 | e-commerce; AWS (cloud capex proxy); logistics/labor; advertising; consumer health | Prime Day, holiday quarter, AWS re:Invent, labor disputes |
| **NVDA** | 2.5 | AI accelerators; data-center capex; TSMC/CoWoS; export controls; hyperscaler spend | earnings (the AI bellwether), GTC (Mar), export-control rulings |
| **TSLA** | 2.5 | EVs; batteries; energy storage; robotaxi/FSD; China; Musk news flow; retail cult flow | deliveries (quarterly), robotaxi events, regulatory rulings |
| **GOOGL** | 2.5 | search/ads; YouTube; cloud; AI (Gemini); antitrust | antitrust rulings, I/O (May), ad-market seasonality |
| **META** | 2.5 | social ads; Reality Labs capex; AI capex; regulation | earnings, Connect (Sep), EU regulation |
| **MSFT** | 1 | Azure; Office/enterprise; OpenAI exposure; enterprise IT budgets | earnings, Build (May), enterprise budget cycles |

**Shared cycles:** AI capex cycle (NVDA at the center; MSFT/GOOGL/META/AMZN as spenders), consumer cycle (AAPL/AMZN/TSLA), regulatory/antitrust cycle, China exposure (AAPL/TSLA/NVDA).

**Audiences (per name; the bot expands)**
1. 🎯 Single-name options trader — beachhead
2. **Employee with RSUs/ESPP** at the company or a supplier — "should I sell" — chain: implied move into earnings vs history
3. **Supplier / partner procurement** (TSMC chain, auto parts, logistics) — planning on the customer's outlook
4. **Tech journalist / AI journalist** — "is NVDA priced for perfection" — chain: IV rank, event premium, skew
5. **Retail investor with a concentrated position** — anxiety around earnings — chain: expected move, honestly
6. **Enterprise IT buyer** (MSFT/AMZN/GOOGL) — vendor health read
7. **EV buyer / dealer / charging operator** (TSLA) — product-cycle read
8. **Policy analyst** (export controls, antitrust) — event premium around rulings

**Keywords:** "NVDA earnings expected move" · "should I sell my Apple stock" · "is Tesla overvalued" · "AI bubble" · "Amazon earnings preview" · "Google antitrust stock" · "Meta capex" · "Microsoft OpenAI stock" · "[company] stock prediction" · "[company] earnings play"

---

## Cross-symbol ideas the maps surface (for `iki-idea-combiner`, not ranked)

- **Fear across the 20** — one implied-move / skew view, all symbols, one screen. The walk's "newly available with 18 names."
- **AI capex chain** — NVDA (seller) vs MSFT/GOOGL/META/AMZN (spenders): relative implied moves around each other's earnings.
- **Rates → everything** — TLT implied range vs IWM, XLF, GLD, QQQ: who is most sensitive, by the chain's own pricing.
- **Energy → cost** — USO/UNG implied ranges translated for fuel buyers, utilities, farmers.
- **Fear gauge's own fear** — VIX and VIX1D surfaces; today vs the month.
- **Event calendar, priced** — FOMC / CPI / OPEC / earnings: event premium per symbol on one timeline.
- **Cost-to-hedge map** — spread tax and put-cost across all 20, for anyone who must hedge and doesn't trade.

## Honesty items for templates (from settlement / structure)
- SPX AM-settled expiries break the 16:00 expiry instant (known OD).
- XSP = SPX/10, PM-settled — different surface, same underlying; label.
- VIX / VIX1D: index feeds may 403; VIXY proxy labeled (DL-223); VIX1D option availability `[UNCONFIRMED]`.
- USO / UNG: futures-roll ETFs — the ETF is not the commodity; decay and roll dates are part of any honest view.
- GLD / SLV: trust ETFs track spot minus fees; label.
