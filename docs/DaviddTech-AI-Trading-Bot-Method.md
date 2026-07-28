# Condensed method — How to Build an INSANELY Profitable AI Trading Bot

**Source:** [Trading with DaviddTech — YouTube](https://youtu.be/86AlV6174KI) (~33 min)  
**Channel:** Trading with DaviddTech  
**Captured from:** captions + frames (2026-07-28)  
**Note:** This is the creator’s crypto / TradingView / AI-bot workflow as taught in the video—not a universal quant standard.

**His claim frame:** ~2,000 strategies backtested over ~5 years → currently trading **7**. Most “amazing” backtests die live; the process is a **filter funnel**, not a one-shot optimizer.

---

## End-to-end pipeline

```text
IDEA → CODE (boilerplate + AI) → BACKTEST → OPTIMIZE → WALK-FORWARD / OOS
     → (optional full re-test) → INCUBATE / FORWARD-TEST → SMALL LIVE → PORTFOLIO
```

---

## 1. Create a strategy (idea → code)

### 1.1 Source an idea

Don’t invent from scratch every time. Ranked idea sources (~09:26–12:00):

| Rank | Source | How he uses it |
|------|--------|----------------|
| 1 | **TradingView** community scripts/strategies | Prefer **open-source** → paste into Claude |
| 2 | **Stonehill Forex** | Indicator library + methodology (e.g. NNFX-style confirmation + baseline) |
| 3 | **QuantConnect** | Ideas, backtests, code samples for Claude |
| 4 | **Quantpedia** | Strategy writeups / backtests (“Quipedia” in captions) |
| 5 | **YouTube** | Idea mining (high noise; still where he found his main strategy) |
| + | His channel’s AI / TradingView strategies section | Self-promo add-on |

### 1.2 Wrap every strategy in a fixed “boilerplate” (~14:00–16:30)

Shared shell for **risk, structure, and realism**, not just entry logic:

- Fees + slippage assumptions  
- Stops / take-profits / extra risk rules  
- Consistent stats surface so bots are comparable  
- Goal: test **100 strategies with real risk management**, not 100 naked signals  

### 1.3 Code with AI in plain English

- Prefer **Claude Code** (desktop) over plain chat so coding + backtesting stay in one loop  
- Prompt flow: idea → Pine/strategy code → backtest → optional optimize  
- Keep artifacts (code, trades, results) so you can return later  

### 1.4 First smoke test (~07:54)

e.g. simple strategy on **BTCUSDT 1H** just to prove the backtester works (even if net profit is negative).

---

## 2. Backtesting

### Where it runs in his stack

| Layer | Role |
|-------|------|
| **AI Trading Kit / tradingkit.com** | Community + automated backtests; can emit **Pine Script** for TradingView |
| **Claude Code + MCP/plugin** | Claude runs backtests without manual round-trips |
| **TradingView** | Final chart/strategy tester + alerts (Pine) |

### How he backtests (rules)

| Rule | Why |
|------|-----|
| Always include **fees** (even 0.05% compounds and kills edge) | Live realism |
| Always include **slippage** (overestimate; TV is weak here) | Avoid “perfect fill” fantasy |
| Prefer **single-timeframe** strategies | Multi-TF often **repaints / look-ahead**; TV entries vanish live (~29:26) |
| Read **max drawdown** and **profit factor** harder than win rate | Win rate is a “shiny object” (~30:52–31:31) |
| Compare vs a **benchmark** (e.g. buy-and-hold BTC) | Edge must beat doing nothing smart (~16:53) |
| Volume: many tests; expect **~99% failure** before live (~32:29) | Funnel, not hope |

### Optimization (~17:50–19:00)

- Use the kit’s **optimizer** (runs on a server; doesn’t burn Claude tokens for every trial)  
- AI/Claude proposes variable ranges; optimizer sweeps them  
- Goal: best settings that still look honest under fees/slippage  

---

## 3. Walk-forward (out-of-sample) validation

What he describes as the optimizer’s validation path (~18:45–19:15):

1. **In-sample (IS)** — optimize parameters on a training window  
2. **Walk-forward / OOS** — re-test those **fixed** settings on a held-out later period  
3. **Full-period check** — if it still holds across the whole sample, treat as stronger  
4. Only then treat it as a candidate for the next stage  

**Purpose:** prove the strategy can work on data it **wasn’t tuned on**—closer to “will it work on live markets.”

**Caveat:** He later blurs “forward testing” language with incubation. The IS→OOS optimizer step is the formal walk-forward piece. Classic multi-window walk-forward research is more formal than what he demos on screen.

---

## 4. Incubation / forward testing (pre-scale live)

He treats **incubation ≈ forward testing** as the critical boring step (~19:19–22:00, ~32:11):

1. Strategy leaves pure history after a good backtest + walk-forward  
2. Run **weeks to months** on **paper or tiny capital**  
3. Keep a **trading journal / incubation lab** (e.g. “Segments Trade Lab” style vault of candidates)  
4. Check whether the **equity curve continues** after the backtest end date (live/incubation segment after the historical curve)  
5. Confirm live fills/behavior still resemble the backtest (not only headline stats)  
6. **Kill rate is high** — incubated thousands; few survive; he trades ~**7** of **~2,000** backtested  

Only after incubation: scale capital and fully automate.

---

## 5. After incubation (brief)

- **Live automation path:** TradingView strategy → **alerts (order fills only)** → webhook middleman (**TriggerTrade**) → **Telegram** and/or exchange/broker  
- **Portfolio rule:** diversify **uncorrelated** bots/timeframes/pairs; don’t stack multiple bots on the same coin (e.g. only one on BTC) (~27:41–28:31)  
- Prefer strategy-owned SL/TP in code over ad-hoc manual overrides when wiring bots  

---

## Tools used in the method

| Tool | Role in the method |
|------|---------------------|
| **Claude / Claude Desktop** | Primary AI; plain-English strategy building |
| **Claude Code** | Preferred coding surface; local projects + backtest loop |
| **Claude Co-work / chat modes** | Part of Desktop suite |
| **ChatGPT** | Acceptable AI alternative; free tier possible (he prefers Claude) |
| **AI Trading Kit / tradingkit.com** | Community + strategy library + **backtester + optimizer** + Pine export |
| **MCP / kit plugin for Claude** | Connects Claude → kit so backtests run from the AI session |
| **TradingView** | Charts, **Pine Script**, strategy tester, **alerts** for live signals |
| **Pine Script** | Language of TV strategies/automation |
| **Quantpedia** | Strategy encyclopedia / ideas + backtests |
| **QuantConnect** | Free ideas, research, code samples for Claude |
| **Stonehill Forex** | Indicator library + methodology (e.g. confirmation/baseline style) |
| **YouTube** | Idea mining (high noise) |
| **TriggerTrade** (Trigger Traders “My One”) | Webhook bridge: TV alerts → Telegram / broker routing |
| **Telegram** (+ helper bots, e.g. API bot / user-info bot for UID) | Alerts & optional semi-manual path |
| **Crypto exchange / broker APIs** | Execution (direct connection preferred when available) |
| **Segments / incubation trade lab** (his vault UI) | Track incubated strategies, equity after backtest end |
| **Trading journal** | Manual review during incubation |
| **Boilerplate template + risk checklist + prompts** | His free giveaways; structure every strategy |

---

## One-page mental model

| Stage | Question it answers | Kill if… |
|-------|---------------------|----------|
| **Create** | Is the idea coherent and coded with real risk rules? | No structure / no fees / multi-TF magic |
| **Backtest** | Did it make money historically *with* costs? | Ugly DD, PF, or loses to buy-hold |
| **Walk-forward** | Did optimized params work **out of sample**? | IS pretty, OOS dies |
| **Incubate** | Does the equity curve **continue** in near-live conditions? | Live path diverges; curve flatlines/breaks |
| **Live small → portfolio** | Can it run automated without babysitting? | Needs constant discretionary rescue |

---

## Hard rules he stresses at the end (~29:19–32:34)

1. **Avoid multi-timeframe strategies** — repaint / look-ahead; live collapses.  
2. **Always backtest with fees and slippage** — overestimate slippage.  
3. **Learn the stats** — prioritize max drawdown and profit factor over win rate; use AI to explain metrics if needed.  
4. **Build and cherish a boilerplate** — throughput with real risk management.  
5. **Do the boring forward test / incubation** — most pretty backtests fail in real markets.
