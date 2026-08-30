# Massive.com — Totality of Available Data

**Date:** 2026-08-24  
**Source:** [massive.com](https://massive.com/), [API docs](https://massive.com/docs/), [llms.txt catalog](https://massive.com/docs/llms.txt), [Data Coverage FAQs](https://massive.com/knowledge-base/categories/data-coverage)  
**Related Labs:** [`Massive-Market-Bus-Full-Agent-Bench-Plan-v1.0.md`](./Massive-Market-Bus-Full-Agent-Bench-Plan-v1.0.md) · [`Specs/FatTail-Labs-Massive-Market-Bus-Shared-Client-Spec-v1.0.md`](../Specs/FatTail-Labs-Massive-Market-Bus-Shared-Client-Spec-v1.0.md)

Massive is a US market-data API (Polygon.io product, rebranded). Data is sourced from SIPs, direct exchange cross-connects, FINRA TRF / ATS / OTC, OPRA, and CME Group venues. Not a GEX or dealer-positioning product — that layer is computed or bought elsewhere.

---

## How you take data

| Channel | Use |
|---|---|
| **REST** | On-demand history, snapshots, fundamentals, filings, partner feeds |
| **WebSocket** | Live trades, quotes, second/minute aggregates, FMV, NOI, LULD, index values |
| **Flat files (S3)** | Daily bulk CSV/JSON dumps for backtests and ML |
| **SQL** | Query interface (request access) |
| **MCP / AI tools** | Claude Code, Cursor, ChatGPT, Codex, Copilot, Gemini CLI |

Formats: JSON and CSV. Clients: Python, JavaScript, Go, Java.

Five subscriptions: **Stocks, Options, Indices, Currencies (forex + crypto), Futures**. Tiers run from free end-of-day to real-time tick-level data. Redistribution requires a business product.

---

## Universe (homepage claims)

| Asset | Universe | History | Rows |
|---|---|---|---|
| **Stocks** | 32,345+ US tickers — all US exchanges, dark pools, OTC | Since **2003** (tick-level from ~2004) | 350B+ |
| **Options** | 1.67M+ contracts — all US options + dark pools; **index options + Greeks** | Since **2014** | 722B+ |
| **Indices** | 11,409+ (S&P, Dow, FTSE, Nasdaq, VIX, …) | Since **2023** | 20M+ |
| **Currencies** | 1,750+ forex + crypto pairs | Since **2009** | 2B+ |
| **Futures** | 361K+ contracts — **CME, CBOT, NYMEX, COMEX** (ES, GC, CL, …) | Since **2017** | 260M+ |

**Hours:** stocks trades **4 AM–8 PM ET**. Options: full US tape; some ETF options to **4:15 PM ET**. Cboe is adding GTH **7:30–9:25 AM** and Curb **4:00–4:15 PM** for select single-stock equity options (from mid-August 2026). Dark-pool stock prints: `exchange:4` plus `trf_id`.

---

## 1. Market microstructure (live + history)

Shape varies by asset class. Available for stocks, options, futures, forex, crypto unless noted.

- **Trades** — tick-level, nanosecond timestamps
- **Quotes** — stocks = **NBBO**; options / futures / forex = top of book / BBO
- **Aggregates** — custom bars, minute, second (WebSocket), daily, previous-day, session (futures)
- **Snapshots** — one ticker, full market, top movers, **unified snapshot** across asset classes
- **Fair Market Value** (WebSocket) — stocks, options, forex, crypto
- **Stocks WebSocket only:** Net Order Imbalance (NOI), Limit Up / Limit Down (LULD)
- **Indices:** live **value** stream + OHLC

**Technical indicators (REST):** SMA, EMA, MACD, RSI.

---

## 2. Options (0DTE-relevant)

- Full chain + **contract overview** (type, style, expiry, strike, multiplier, underlying, exchange)
- Active **and expired** contracts
- **Chain snapshot** and **contract snapshot** (Greeks, IV, trade-level)
- Index options **and** Greeks for those index contracts
- Tick trades + quotes; minute/day bars; second/minute WebSocket

---

## 3. Stocks reference, corporate actions, fundamentals, filings

- Tickers, types, related tickers, overview
- **Dividends, splits, IPOs** (IPOs from 2008), **ticker events**
- **Income statements, balance sheets, cash flow, ratios, float**
- **Short interest** (biweekly FINRA) and **short volume** (daily ATS / off-exchange)
- **News** (summaries + sentiment)
- Filings: **SEC EDGAR index, 10-K sections, 8-K text + AI event tags, 13-F, Form 3, Form 4**, risk-factor taxonomy

---

## 4. Economy

- Inflation (realized)
- Inflation **expectations**
- Labor market (unemployment, participation, hourly earnings, openings)
- **Treasury yields**

---

## 5. Alternative

- **European consumer spending** (Fable Data): merchant aggregates + merchant → ticker hierarchy

---

## 6. Partner / third-party feeds (REST)

**Benzinga**

- Analyst details, insights, ratings, consensus
- Bulls / bears summaries
- Corporate guidance, earnings
- Firm details
- Real-time news

**ETF Global**

- Analytics, constituents, fund flows
- Profiles / exposure, taxonomies

**TMX / Wall Street Horizon**

- Corporate events calendar (earnings, dividends, conferences, splits)

---

## 7. Ops / reference

Exchanges, condition codes, market holidays, market status, futures products / contracts / schedules.

---

## 8. Flat files (S3 daily dumps)

| Class | Files |
|---|---|
| **Stocks** | Day aggs, minute aggs, quotes, trades |
| **Options** | Day aggs, minute aggs, quotes, trades |
| **Futures** | Per venue (CME / CBOT / NYMEX / COMEX): minute aggs, session aggs, quotes, trades |
| **Indices** | Day aggs, minute aggs, tick values |
| **Forex** | Day aggs, minute aggs, quotes |
| **Crypto** | Day aggs, minute aggs, trades |

---

## 9. WebSocket streams

| Class | Streams |
|---|---|
| **Stocks** | Trades, NBBO quotes, second/minute aggs, FMV, NOI, LULD |
| **Options** | Trades, quotes, second/minute aggs, FMV |
| **Futures** | Trades, BBO quotes, second/minute aggs |
| **Indices** | Value, second/minute aggs |
| **Forex** | BBO quotes, second/minute aggs, FMV |
| **Crypto** | Trades, quotes, second/minute aggs, FMV |

---

## What they do **not** offer

| Gap | Their note |
|---|---|
| **International stocks** | US only, for now |
| **Level 2 / book depth** | Not offered for stocks |
| **Commodities cash tape** | No general commodities; gold/silver via **forex**; futures cover CME metals/energy |
| **GEX / dealer positioning** | Not in the catalog — compute or buy elsewhere |
| **Redistribution** | Business product, not a retail key |

---

## Labs relevance

Useful totality for FatTail: US equities + **full OPRA options (including index, Greeks, IV, ticks)** + **CME futures (ES)** + indices / VIX + treasury / inflation. That is SIP / OPRA / CME institutional tape. Volume profile, GEX walls, and σ√T conversion stay Labs-side on top of trades, quotes, and bars.

Signup / keys: [massive.com/dashboard](https://massive.com/dashboard). Catalog for agents: [massive.com/docs/llms.txt](https://massive.com/docs/llms.txt).
