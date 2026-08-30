# Trading Litt — 0DTE SPX GEX method

**Source:** [How to Day Trade Using 0dte SPX GEX Levels + Workshop](https://youtu.be/Yo8mIrIuy0M) (28:32)  
**Channel:** Trading Litt (Bryant)  
**Walkthrough date in video:** Tuesday, August 5, 2025  
**Captured from:** captions only (2026-08-24). YouTube blocked the video file (HTTP 403), so this is from spoken content, not from reading the charts.  
**Note:** This is the creator’s Quant Trading App (QTA) workflow as taught in the video — not a FatTail Labs product spec.

**His claim frame:** 0DTE SPX gamma exposure is a **map, not a prediction**. Plot the early-day GEX levels, wait for price to hit them, then trade only if candles, volume, and other tools agree. **Confluence is the whole method.**

---

## End-to-end pipeline

```text
OPEN (~2 min) → SNAPSHOT 0DTE SPX GEX (P1/P2, N1/N2, AG)
             → PLOT LEVELS ON SPY / SPX / ES
             → SIT ON HANDS UNTIL PRICE HITS A KEY STRIKE
             → REQUIRE CANDLE + VOLUME (+ stacked maps)
             → EXPRESS THE TRADE IN YOUR STYLE
             → TARGET EXPECTED MOVE / MAX PAIN / NEXT GEX NODE
```

Weekly layer (Monday): combine Mon–Fri expirations → plot P1/P2/N1/N2 + AG → leave them up all week.

---

## 1. Setup

He trades **SPX options and ES futures**, but **SPY is the main price-action chart**. He uses SPY / SPX / ES interchangeably.

On the chart he layers:

- QTA **intraday** and **weekly** levels
- VWAP (gray) and **2-day anchored VWAP** from yesterday’s open
- QTA **intraday zone**
- Friday **max pain** (pre-market, dashed blue)

### When he pulls GEX

- **Not pre-market.** For SPX he wants the open print plus live options data.
- He used to wait **15 minutes**; QTA now caches the profile **~2–2.5 minutes after the open** (Eastern).
- He loads **today’s 0DTE**, not Friday/weekly, unless he explicitly wants the weekly.
- GEX is dynamic all day, but he **locks the open snapshot as the day’s framework** so he isn’t chasing a moving profile.

---

## 2. How he reads the profile

| Label | Meaning |
|---|---|
| **P1 / P2** | Largest and 2nd-largest **positive** gamma strikes |
| **N1 / N2** | Largest and 2nd-largest **negative** gamma strikes |
| **AG** | **Absolute gamma** — the biggest “purple spike” in the background |
| Green vs blue/red | Green = positive gamma. Negative is deep blue while **net GEX is still green**; the chart **turns red when net GEX flips negative** (he parks that flip for another video) |

Example from the open that day: N1 **6295**, N2 **6290**, P1/P2 **6360 / 6355**. Dual spikes on both sides of spot, roughly even, is a common shape.

### The “hill” model (absolute gamma)

- Price **moves freely through low AG**.
- At **high AG**, it has to **work harder to cross the hump**.
- Those humps are where he expects **stickiness** → support or resistance.
- If price is at a big AG node and **below it net GEX goes toward zero and AG is almost empty**, he treats that as **little fuel to keep going** — likely **holds as support**.

Two minutes after the open he already has a **range from AG**, but **not a direction**. First 15–30 minutes is often a **coin flip**. Slight early upside bias on this day; GEX is only one input.

---

## 3. The actual method: wait, then confirm

He refuses to predict. Four choices after the open:

1. Risk a move **up**
2. Risk a move **down**
3. Risk a **range** between the two AG clusters
4. **Sit on hands** until price hits a key strike

If it reaches a plotted level, he wants **price-action confirmation**:

- **Rejection / hammer candle** at the strike (example: after a 21-point 15-minute dump, first green 15-min candle was a **hammer on N1 6295**)
- **Volume spike** on that same bar (SPY volume is his tell; SPX has no volume)
- **Do not buy the dump.** The strong red candles on the way down are not the long. The reversal **at a known GEX strike** is.

**N1 often acts as support after an accelerated selloff.** He still won’t assume it will hold until the candle + volume say so.

How you express the long is style-dependent: **buy a call, buy ES, sell a put, broken-wing butterfly**, etc. The video is about **where** to act, not which structure.

---

## 4. Confluence stack (the playbook)

He only wants **A+ setups** where several maps land on the same zone.

### Weekly GEX (Monday prep)

Combine **Mon–Fri expirations**, plot P1/P2/N1/N2 + AG, **leave them up all week**. Consecutive high-gamma nodes get shaded as a **zone** (on this week, a green block of high positive-gamma nodes). If price later **arrives** there, he has a **long bias in that zone** — he did not need to know it would sell off into it.

### Aug 5, 2025 long-zone stack

- **0DTE SPX** N1/N2 ~ **6295 / 6290**
- **Weekly SPY GEX** cluster ~ **628–627** (626 as extra, never quite tagged)
- **QTA intraday zone**
- **ES** last-week range / supply-demand (breakout, then return)
- **Volume-profile HVNs**
- Later, QTA’s engine: **AG migrated to 295**, proprietary **6300 “power strike”**, cluster **6300–6290** by ~10:50 ET — extra confirmation of what the **2-minute-after-open** profile already said

He is explicit: you did **not** need to forecast the drop. Once price is there, **that is the setup**.

---

## 5. Targets and “too far”

QTA trade engine also plots **±1 expected move from the open** (~**23.5 points** this day).

Once price **overshoots** that expected move and holds the GEX/support cluster:

- Mean-revert at least back to **expected move from the open**
- Possible calls around **6315**, or **max pain** as target (**6320**)
- Or **short puts under the low of day**
- **0DTE max pain** as S/R, especially with another strike on it

What actually happened in the replay: hold at 295/6300 → bounce → first real rejection at **expected move from open** → dip to **6300** → grind back to expected move → tag **max pain 6320** and reject.

Non-directional: an **ATM iron butterfly** at the cluster also fit; he likes butterflies there with **no directional risk**. Morning profile shape can hint at **butterfly vs sell puts vs iron condor** before the open even plays out.

---

## 6. Discipline he keeps repeating

- Don’t trade in **empty GEX / no-volume** areas
- Throw **“predict”** out of the vocabulary
- Wait for **key levels + a pattern you already recognize**
- Only take the trade when confluence is thick enough that **the risk is worth it**

He later pitches an in-person GEX workshop; that’s promo, not method.

---

## One-line summary

Snapshot 0DTE GEX ~2 minutes after the open (plus weekly GEX from Monday), treat high **absolute-gamma** strikes as sticky S/R, **do nothing until price gets there**, then require **hammer/rejection + volume** and as many stacked maps as you can get before you put risk on.

---

## Chapters (source video)

| Time | Chapter |
|---|---|
| 00:00 | Intro |
| 02:02 | 0DTE SPX GEX levels |
| 06:27 | Absolute GEX |
| 08:25 | Hammer candlestick |
| 11:47 | The playbook confluence |
| 12:43 | SPY GEX confluence |
| 15:22 | QTA trade engine |
| 21:52 | NYC GEX workshop |
| 25:22 | Conclusion |
