# Rader Trader — Gamma trading user guide

**Source:** [Gamma Trading: The Edge Market Makers Wished You Didn't Know](https://youtu.be/WBqxiVthqEk) (43:03)  
**Channel:** Rader Trader  
**Captured from:** captions only (2026-08-29). No frames — this is spoken method, not a reading of his charts.  
**Note:** This is **his** playbook (net gamma / “JEX flip” / proprietary OVI / expiration timing). It is not a FatTail Labs product spec. OVI lives behind [The Rader Report](https://theraderreport.com/) (he pitches a free trial at the end).

**His claim frame:** Option volumes are now large enough that **dealer hedging is a primary driver of day-to-day price**. If you can map dealer gamma, you can map how they must buy and sell the underlying. Trade the **regime** (positive vs negative gamma), not a gamma number on a brokerage screen.

He says “JEX flip” throughout. That is the **GEX / gamma-flip** level (where net dealer gamma changes sign). This guide uses **JEX flip** as he says it, and **GEX** when stating the industry term.

---

## How to use this guide

1. Draw three lines on **SPY or SPX** every session (section 3).
2. Classify the open: **above the flip = positive gamma**, **below = negative gamma**.
3. Pick the **playbook that matches the regime** (section 4–5), then the **named strategy** if the setup is there (section 6).
4. Do not run the index-short waterfall on a random down day. The filter is **first close/open into negative gamma after a stretch of positive-gamma closes**.

---

## End-to-end pipeline

```text
MAP SPX/SPY NET GAMMA (open interest)
  → MARK: JEX/GEX FLIP + largest +G + largest −G
  → CLASSIFY: price vs flip (positive vs negative regime)
  → CHOOSE VENUE:
        positive gamma  → single names, daily breakouts (avoid index)
        negative gamma  → index / high-beta, breakdowns + range/vol
  → IF SETUP:
        (A) first flip to −γ after 5–20 +γ days  → waterfall shorts
        (B) live flow vs stale OI                  → OVI (his tool)
        (C) mania / overextension into Fri expiry  → fade Thu–Fri
  → INTO QUARTERLY OPEX: shakeout (trend) → max-pain window (pin/chop)
  → AFTER EXPIRY CLEARS: look for the next trend
```

---

## 1. What he means by gamma (~01:12–07:18)

Gamma is a **second-order Greek**: the acceleration of **delta**. Delta is how much the option price moves per $1 in the underlying. Gamma peaks **at the money** and slows as the option goes in the money.

He does **not** stare at a gamma column in the brokerage. The use-case is **dealer inventory**:

- Market makers take the other side of public order flow and try to stay **delta-neutral**.
- A sold 0.30-delta call → they buy ~30 shares as the initial hedge.
- As the underlying moves, delta changes. **Gamma tells them how fast they must adjust the hedge.**
- Since ~1973 (listed options + Black–Scholes) volumes have compounded. He argues we are in a regime where **MM hedging is one of the biggest day-to-day forces**.

**Edge, as he states it:** if you know their positioning, you know what they **must** buy or sell to stay balanced. They will not choose to blow up.

---

## 2. Two dealer environments (~07:18–10:50)

Public **buys** options → dealer is **short** the option → **negative gamma**.  
Public **sells** options → dealer is **long** the option → **positive gamma**.

| Regime | How it is created | Dealer hedge | Price behavior |
|---|---|---|---|
| **Positive gamma** | Dealers long options | Sell rallies, buy dips | Compresses range, chop, grind, “equilibrium” |
| **Negative gamma** | Dealers short options | Buy rallies, sell dips | Amplifies the move; feedback / “reflexive cycle” |

Negative-gamma down-move, in his words: stock drops → dealer sells more → drop continues until sellers exhaust → then they buy **with** the bounce. “Death spiral until it doesn’t.”

He uses that to explain “staircase up, elevator down”: walk up in +γ, puke in −γ.

---

## 3. How to draw levels (the daily checklist) (~10:50–14:27)

**Chart:** net gamma by strike. Bars up = net **positive** gamma at that strike; bars down = net **negative**. Values from **open interest, not volume** — how many contracts are held at the strike.

**Always on the chart (SPY or SPX):**

1. **JEX / GEX flip** — the divider between +γ and −γ. Character-change level. Example he drew: **752.25** on the index complex that day.
2. **Largest positive-gamma strike**
3. **Largest negative-gamma strike**

Bigger bar = theoretically stronger reaction. The flip is “important 100% of the time” because **the market’s personality changes** when you cross it.

**Where to draw (don’t spam 1,000 names):**

- S&P complex **dominates** dollar delta / dealer positioning vs the rest of the market.
- Draw flip + major nodes on **SPX or SPY**. Everything else “kind of follows.”
- Then **read whether spot is above or below the flip** and apply the regime assumptions below.

**Staleness (he admits this):** OI updates **the next day**. Index major levels often don’t jump around day to day. Breaking news and **intraday** breakouts are where stale GEX fails — that is why he built OVI (section 6.2).

---

## 4. Positive-gamma playbook (~14:27–16:12)

Assumptions when **spot is above the flip**:

1. **More stable.** Dealers buy dips / sell pops → more liquid, harder to dump, a “rigid” grind higher.
2. **Do not trade the index.** SPY / SPX / ETF ranges are compressed. Focus **individual tickers** (they still have room to move). Index in +γ is, in his view, underperformance.
3. **The trade it rewards: daily breakouts** on those names. Especially after a hard patch that has **just flipped back to +γ** (he cites the post-ceasefire tape as a cluster of breakouts).

---

## 5. Negative-gamma playbook (~16:12–18:39)

Assumptions when **spot is below the flip**:

1. **Less stable, more violent.** Reflexive selling loop.
2. **Do trade the index.** A −2% / −3% SPX day is a huge dollar move; “the biggest assets are now in play.” Short-dated options can pay a lot.
3. **The trades it rewards: daily breakdowns, range/vol, reversals.** Those two (breakdown + range/vol) are his **core** in −γ.

---

## 6. Three named strategies (~18:39–41:07)

He presents three. All “rigorously backtested” **by him** — treat that as his claim, not a Labs result.

### 6.1 JEX-flip waterfall (index / high-beta short)

**Filter (recite this before you click):**

- **5–20 consecutive positive-gamma closes** on the index (he also says 10 / 20 / 30 days in extreme ramps).
- Then the **first** trip into negative gamma.
- Best: **pre-market gap that cannot reclaim** the flip before the cash open.
- Catalyst helps (does **not** have to be bad news — his June 5 example was a **good** jobs number).
- Invalid if price **chops back above the JEX flip**.

**Two shorts, same day:**

| Trade | Trigger | Notes |
|---|---|---|
| **Opening-drive short** | Opening-range break, **pre-market low break**, or first pop then **break of low of day** | First time in −γ, dealers will press lows |
| **Afternoon roll** | First dump, then bounce that **stays below the flip**, chop into **11:00–13:00 ET**, short the rollover | He said “11:00 p.m.” once; the rest of the talk is **11:00–1:00 p.m.** Treat as late morning. Equity short or **short-dated puts** (he likes put R:R after the morning decay). Example name that day: **SOXL**. |

**If the flip happens intraday** (not a gap): same idea — short **through** the flip or a **hold under** it, time-of-day dependent. He still prefers the **open already under**.

**Worked examples he showed:** SPY June 5 (first −γ close in weeks, reclaim failed, jobs catalyst); QQQ on “the 25th” (open under −γ, pre-market low, then 11:00–13:00 roll). Dates are as spoken; verify on a chart before you treat them as gospel.

### 6.2 Option Volume Imbalance (OVI) — live flow overlay

**Problem it solves:** GEX is **OI, T+1**. Unusual-options tape (Unusual Whales, BlackBox, etc.) is too many tickets to score by hand.

**What OVI is (his description, proprietary):**

- Bucket **all** live call and put volume.
- Weight each by estimated **dealer-gamma / price-impact**.
- Ratio of weighted calls vs weighted puts = **OVI**.
- Rank that ratio vs **that name’s history** (percentile).
- Higher OVI ≈ higher theoretical MM price impact **right now**.

**How he trades a breakout with it:**

1. A **real level** is in play (NVDA example: 204–205, tight coil, ATH attempt, 4/24).
2. As price coils into the level, look for a **historically extreme OVI print** (P80 / P90+; he flagged a **1-year high** on that timeframe).
3. Demand **quality and quantity**. A 10:1 call/put ratio on tiny size is a fake. Best breaks = **high OVI percentile + high dollar quantity**.
4. **Stay with the move while OVI stays elevated.** When the dots **capitulate / fall off**, momentum often dies even if **equity volume is still high** — that’s the tell you don’t get from price+volume alone.
5. Same pattern on **IREN** (4/23): 5-minute OVI in the 97–100th percentile, quantity high, then fade as flows fade.

He says the paid PDF has **five** OVI setups. This video only walks the **breakout-with-supporting-flow** one.

**Without OVI:** you can still use the *idea* — don’t trust a breakout that has no **live options flow** behind it, and don’t ignore flow dying while the stock is still printing volume. You cannot reproduce his percentile score from public GEX.

### 6.3 Time, expiration, and overextension fades (~31:56–41:07)

Gamma vs time: a $5 move barely moves 6-month gamma; it **cranks** 1-month / 0DTE gamma. Into expiry, dealers must hedge **more shares per dollar**. Two outcomes:

- **Pin:** huge weights on both sides; stock can’t go anywhere (max-pain / chop).
- **Waterfall if something snaps:** positioning built on mania collapses, hedge size is enormous.

**Overextension / capitulation overlay** (not a full strategy in this video — he treats it as a separate playbook with a gamma clock):

- Move is **detached from anything fundamental** (his examples: silver melt-up, CAR ~700% “on nothing,” MSTR, UNH liquidation).
- **Ultra-high IV** = symptom of “unprecedented option demand.”
- His sample: these **top or bottom on Thursday or Friday ~70–73% of the time**, **n > 25**, “statistically significant” **by his research**. Not independently checked here.
- He will still take the fade other days; he **presses size** when the fade lines up with **Thu/Fri expiry**.
- Mechanics: pin is the base case into expiry; if the move **does** break, Mon/Tue don’t get the same dealer-forced magnitude.

**Index / “real” market — quarterly OPEX cycle** (do not confuse with +γ/−γ):

- Map **quarterly** expirations: third Friday of **March, June, September, December**.
- Mark **30 calendar days before** and **14 calendar days before**.
- **Shakeout (~30d window):** more **trend-friendly**.
- **Max-pain phase (~2 weeks in):** more **reversal, two-way, pin**. He cites Jim Carson (as captioned) on expirations as **pivot / character-change** dates. Last quarterly he quoted: **~$8.5T notional** on the SPDR complex.
- Use as **expectation**, not a mandate. If it goes sideways on no news into expiry, assume **pin** until proven otherwise. If you want a directional trend, he would **wait until expiry clears and books reposition**.

### 6.4 IPO add-on (~41:07–42:22)

Not one of the three, but the “public bit” he wants reused:

- Name IPOs, rips (SpaceX **>50%** in his telling) **into the first day listed options exist**.
- Managers who are up huge buy **puts** as insurance.
- Morning: some call buying. Afternoon+: **heavy put buying**.
- Dealers short those puts → **sell underlying as it drops** → bid not there → cascade.
- He will look for **future IPOs with a big run-up into options-list day**.

Treat SpaceX as **his** narrative of that session, not a reconstructed tape.

---

## 7. One-page cheatsheet

| If you see… | Do this |
|---|---|
| Spot **above** JEX flip | +γ. Skip index. Hunt **single-name daily breakouts**. |
| Spot **below** JEX flip | −γ. Index and high-beta are in play. Breakdowns, range, vol. |
| First **open/close under flip** after 5–20 +γ days, preferably a gap that **doesn’t reclaim** | Waterfall: **ORB / pre-market-low short**, then **11:00–13:00 ET roll** if still under the flip. |
| Chop **back above** the flip | Kill the waterfall short. |
| Coil at a key level + **extreme live call/put imbalance** (OVI P80+ **and** size) | Breakout continuation while flow holds; fade conviction when **flow dies**. |
| Mania / vertical / liquidation + **ultra-high IV** into **Thu/Fri** | Press the overextension fade; don’t require that weekday, but size up if it is. |
| 30d → 14d into **quarterly OPEX** | Trend more OK early; expect pin/chop late. Don’t force a trend through the pin. Wait for the clear. |
| IPO that is **up huge into first options listing** | Watch for afternoon **put** flow and a dealer-led unwind. |

---

## 8. Analysis (FatTail / method lint)

This is the useful part. His tape is a **regime + character** map. It is not a substitute for payoff geometry.

**What is actually transferable**

- **Flip as a personality change**, not a magic magnet. That matches how serious GEX users (including Trading Litt’s 0DTE map) treat **N1 / AG / flip**: wait for the **regime**, then require price to interact.
- **OI is yesterday.** Anyone using a morning GEX snapshot for 0DTE already knows this. His OVI is one answer; **live tape + the tent** is another.
- **Expiry increases hedge intensity.** That is real. It explains both **pins** and **violent post-break** moves without needing a story.
- **Don’t run the same trade in +γ and −γ.** Venue (index vs name) and pattern (breakout vs breakdown) should change with the sign of dealer gamma.

**Where it fights FatTail doctrine**

- He is mostly **directional**: equity/ETF short, short-dated long puts, breakout longs. FatTail 0DTE is **defined-risk, positive-skew, ~1:9 payoff**. A waterfall short can be expressed as a **cheap put or put fly**; it should not be expressed as undefined futures size “because gamma.”
- **Win-rate vs distribution:** his opening-drive / afternoon-roll shorts are **timing** trades. They can still be **negative-skew** if the stop is wide and the target is a scalp. Map them onto a **tent** before they become a process.
- **“Do not trade SPX in positive gamma.”** That is a **range** claim, not a 0DTE-fly claim. A compressed index is exactly when a **wide, cheap fly** can be the right structure — opposite of “go pick stocks.” Translate, don’t copy.
- **Trading Litt vs Rader:** Litt plots **0DTE P1/P2/N1/N2/AG ~2 minutes after the open**, sits on hands, needs **hammer + volume**. Rader plots **multi-expiry OI GEX**, trades **first flip** and **ORB breaks**. Same family of map; **different trigger**. Ernie’s “scale to the level, don’t wait for the breach” is **stricter** than Rader’s pre-market-low break.

**Claims to keep in brackets**

- “In 2026 gamma almost entirely controls the market” — rhetoric.
- OVI “five setups,” 1-year high prints, “rigorously backtested” — behind the paywall; not auditable from this video.
- **73% Thu/Fri** on n>25 overextensions — interesting, **small n**, selection on “stupid” moves. Do not promote as a law.
- **$8.5T** quarterly notional — his figure for one expiry; verify before citing.
- Speech-to-text garbles: **JEX = GEX**; “11:00 p.m.” afternoon roll = **11:00 a.m. ET**; SPY line “72.52.25” is a mis-hear of **752.25**.

**Practical Labs overlay (if you steal this)**

```text
Morning:    SPX/SPY GEX flip + max +γ + max −γ  (OI, accept T+1)
            0DTE GEX snapshot after the open     (Litt / QTA style)
Classify:   above flip → +γ character; below → −γ character
Filter:     first −γ day after a +γ streak is a *risk-on for downside convexity*
Express:    defined-risk structure (put / put fly) with 1:9-class payoff
Do not:     chase ORB shorts with undefined size because “dealers will press”
OVI-shaped: if you lack OVI, require *some* live options confirmation
            and treat dying call/put flow as a reason to stop adding
Expiry:     last two weeks of quarterly = pin-first; trend after the clear
```

---

## Chapters (source video)

| Time | Chapter |
|---|---|
| 00:00 | Intro |
| 01:12 | What is gamma? |
| 02:25 | Market makers |
| 07:18 | Net gamma chart / how to exploit positioning |
| 14:27 | Positive-gamma characteristics |
| 16:12 | Negative-gamma characteristics |
| 18:39 | Three strategies (flip waterfall, OVI, time/expiry) |
| 41:07 | IPO + gamma |
| 42:22 | Outro (Rader Report trial) |

---

*User guide compiled from captions of the source video. Not trading advice. Not a Labs implementation spec.*
