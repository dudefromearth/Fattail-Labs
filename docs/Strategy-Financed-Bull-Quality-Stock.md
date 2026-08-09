# Financed Bull — Quality Stock Strategy

**Type:** General options structure (any quality stock or ETF you’d hold for years)  
**Worked example:** TSLA  
**Source video:** [Google Stock: How to Own GOOGL 21% Cheaper and Get PAID to Wait](https://youtu.be/QiG9hGjkTVk) — BestStockStrategy (caption extract, ~8:35)  
**Video example underlier:** GOOGL (~$362 when the alert was sent)  
**Not financial advice.** Educational reconstruction of a structure for process / playbook use.

---

## 1. What this strategy is

A **financed bull** packages two ideas into one multi-leg order:

1. **Bullish participation with a cap** — a **call debit spread** (buy lower call, sell higher call).  
2. **Pay-for-entry / buy-the-dip mandate** — **short put(s)** at a strike you’d be **happy to own** the stock (often sized so the package opens for a **credit**).

Goal (as framed in the video):

- Prefer **owning quality** over predicting the next tick.  
- Prefer **being paid to wait** over paying full price for shares with no cushion.  
- Structure so **up / down / sideways** can all produce an acceptable outcome **if** the put strike is a true “I’d own it there” price.

Slogan used on-screen: *Win when you’re right. Win when you’re wrong. Never gamble.*

---

## 2. When to use it (suitability)

**Use only when all of these are true:**

| Rule | Why |
|------|-----|
| You **want to own** the underlier at your put strike for **years**, not days | Naked (or wide) short puts assign you stock; if you don’t want it, you’re gambling for premium |
| Underlier is **quality** (durable business, multiple cash engines, capital you can hold through drawdowns) | Assignment is a feature, not a bug |
| You can size **assignment** (100 shares × short puts) without blowing the account | Especially for undefined-risk version |
| You accept **capped upside** on the call spread | You give up gains above the short call |

**Do not use** on names you only want for a quick premium trade.

---

## 3. Structure (general)

### 3.1 Core package (undefined-risk financing — as in video’s main GOOGL example)

| Leg | Action | Role |
|-----|--------|------|
| **Call debit spread** | Buy 1× lower call, sell 1× higher call, **same expiry** | Capped upside if stock rallies |
| **Short puts** | Sell **2×** puts at “happy to own” strike, **same expiry** as the spread | Collect premium to finance the debit; path to own stock at a discount |

**Why 2 puts vs 1 call spread?**  
In the video package, two short puts fund one 25-wide call debit spread so the **net package can open for a credit** (they collected ~$105 with limit 1.05 credit on GOOGL).

**Net debit/credit of the package:**

- Prefer **net credit** to enter (edge frame: “paid to put the trade on”).  
- Max call-spread value = width × 100 × contracts (e.g. $25 wide × 1 = **$2,500** upside per unit).  
- Short-put risk: **undefined** if naked (stock can go to zero).

### 3.2 Defined-risk financing (video’s “smaller account” version)

Replace naked short puts with a **put credit spread** (same expiry):

| Leg | Action | Role |
|-----|--------|------|
| Call debit spread | Unchanged | Same upside participation |
| Short put | Sell higher put | Own-level / finance |
| Long put | Buy lower put | Cap loss on the put side |

Video GOOGL illustration of put side swap:

- Instead of **sell 2× 285 naked**,  
- **Sell 2× 320** and **buy 2× 250** (same Oct expiry).  
- Claimed max put-side risk ≈ **$70/share** between 320 and 250 (width of that vertical × size).  
- Shorting a **higher** put collects **more** premium so the long put can be paid for while still aiming for a package that makes sense.

---

## 4. How outcomes map (process)

| Path | What happens |
|------|----------------|
| **Stock up** | Call debit spread can work toward full width (capped at short call). Short puts expire worthless (or are bought back); you keep credit. |
| **Stock sideways** | Time decay + credit: call spread may lose value, but package was paid to enter; you keep credit if puts expire OTM. |
| **Stock down to put strike** | Assignment risk: you buy 100 shares × short put count at the strike; keep premium received. Effective cost basis ≈ strike − premium (net of package). |
| **Stock crashes** | Naked version: large loss on assigned shares (200 sh on 2 puts). Defined-risk version: loss limited by long put. |

**Video contrast to shares:**  
Buying shares only wins if price rises from entry. This structure is framed as:

- Paid to enter,  
- Discounted ownership path if sold off,  
- Participation if it runs (up to call-spread cap).

---

## 5. Parameter recipe (generalize from the GOOGL example)

Use **percentages of spot**, not fixed GOOGL strikes.

From the video’s GOOGL book (spot ≈ **$362** when alert sent):

| Parameter | GOOGL example | General rule of thumb |
|-----------|---------------|------------------------|
| Expiry | Oct 2026 (months out) | Longer-dated (weeks–months); same expiry for **all** legs |
| Short put (naked) | 285 ≈ **−21%** | **15–25%** below spot — only if you’d own there |
| Call long | 375 ≈ **+3.6%** | Slightly OTM call |
| Call short | 400 ≈ **+10.5%** | Cap; width was **$25** → max **$2,500** / unit |
| Put size | **2** short puts per **1** call spread | Scale so package is **credit** (or small debit) |
| Entry | Limit **credit 1.05** (~$105) | Prefer **net credit** package |
| Defined put short | 320 ≈ **−11.6%** | Higher short put for more premium |
| Defined put long | 250 ≈ **−31%** | Wide protective put |

**Discipline (from video):**

1. **Company first, strike second.**  
2. Short put strike = “thrilled to own,” not “max premium.”  
3. Don’t sell puts on names you wouldn’t hold for years.  
4. Accept capped upside above short call.

---

## 6. Worked example: TSLA

Illustrative only. **Re-price with live options.** Assume spot **S = $250** for the math template (replace with live TSLA).

### 6.1 Choose levels (using GOOGL-relative distances)

| Parameter | Formula (from GOOGL ratios) | Example at S = $250 |
|-----------|-----------------------------|----------------------|
| Short put (own level) | ≈ 0.79 × S (−21%) | **~197.5** → nearest liquid strike e.g. **195 or 200** |
| Call long | ≈ 1.036 × S | **~259** → e.g. **260** |
| Call short | ≈ 1.105 × S | **~276** → e.g. **275 or 280** |
| Call width | Short − long | e.g. **20** points → max **$2,000** / 1-lot spread |
| Defined short put | ≈ 0.88 × S | **~220** |
| Defined long put | ≈ 0.69 × S | **~172.5** → e.g. **170 or 175** |
| Expiry | Same for all legs | e.g. **~90–180 DTE** (match your process; video used multi-month) |

### 6.2 Undefined-risk package (mirrors video main structure)

**1 package unit:**

1. **Buy 1** TSLA call @ long strike (e.g. 260)  
2. **Sell 1** TSLA call @ short strike (e.g. 280)  
3. **Sell 2** TSLA puts @ own-level (e.g. 200)  
4. **Same expiration**  
5. Enter as **one multi-leg order**, prefer **net credit** (or minimal debit)

**If assigned on puts:** long **200 shares** at the put strike (2 puts). Only if that size is acceptable.

### 6.3 Defined-risk package (mirrors video small-account version)

Keep the **same call debit spread**.  
Replace naked puts with:

1. **Sell 2** TSLA puts @ higher strike (e.g. 220)  
2. **Buy 2** TSLA puts @ lower strike (e.g. 170)  
3. Same expiry as the call spread  

Max put-side risk ≈ (short put − long put) × 100 × 2 contracts (before premium).

### 6.4 Outcome sketch (TSLA)

| Path | Outcome sketch |
|------|----------------|
| TSLA rips higher | Call spread works toward width × 100; short puts expire (hopefully) |
| TSLA flat | Keep package credit if short puts expire OTM |
| TSLA tags short put | Assignment path: own shares at “happy” price + keep premium |
| TSLA crash | Naked: large equity risk on 200 sh; defined: capped by long put |

---

## 7. Order construction (process)

1. Confirm underlier is on your **own list** (quality + hold-for-years).  
2. Mark **own-level** put strike from chart + capital plan (not from max premium).  
3. Build **call debit spread** for desired upside band and max dollar value.  
4. Size short puts (or put vertical) so **package credit** is realistic.  
5. Send **one multi-leg limit** (credit preferred).  
6. Journal: why own, why this strike, max assignment size, defined vs naked.  
7. Manage:  
   - If assigned → stock plan (hold / scale / covered calls) is **pre-written**.  
   - If call spread near full value → take profit rules.  
   - If short put challenged → roll / defend only per playbook (no panic).

---

## 8. Risk summary

| Version | Upside | Downside |
|---------|--------|----------|
| **Naked short puts + call debit** | Call spread max = width × 100 × units | **Undefined** below short put (assignment on all short puts) |
| **Put credit spread + call debit** | Same call-spread max | **Defined** on put width × size |

**Hard rule:** undefined-risk version only if assignment size is intentional and survivable.

---

## 9. GOOGL reference (as shown in video)

| Item | Value |
|------|--------|
| Alert date | June 2, 2026 ~10:05 AM ET (per on-screen claim) |
| Spot at entry (approx.) | ~$362 |
| Buy | 1× Oct 2026 **375** call |
| Sell | 1× Oct 2026 **400** call |
| Sell | **2×** Oct 2026 **285** puts |
| Package | Limit **credit 1.05** (~**$105**) |
| Call-spread max | **$25** width → **$2,500** per unit |
| Defined alt puts | Sell **2× 320** / buy **2× 250** (same expiry); call spread unchanged |

---

## 10. Playbook one-liner

> **On a quality name I’d hold for years: buy a call debit spread for capped upside, finance it by selling puts (or a put vertical) at a strike I’m thrilled to own, prefer a package credit, and never sell puts on a stock I don’t want assigned.**

---

## 11. Source & caveats

- Reconstructed from **native captions + on-screen frames** of the linked YouTube video.  
- Numbers (spot, premiums, dates) are **as of the video**, not live markets.  
- Options involve substantial risk of loss; naked short puts can lose more than the credit received.  
- This is **not** a trade recommendation for GOOGL, TSLA, or any underlier.

---

*Written for FatTail Labs docs from video extract · 2026-08-09*
