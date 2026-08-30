# tastylive — Broken Wing Butterfly strategy

**Source:** [Why Are Broken Wing Butterflies Actually "Broken"?](https://youtu.be/aA4nUtl49Sw) (8:56)  
**Channel:** tastylive  
**Segment:** Deep Dive with TP (TP + Liz), aired Oct 21, 2025  
**Captured from:** captions + frames (2026-08-27)  
**Note:** This is tastylive’s component analysis of the broken wing butterfly (BWB) as taught in the video — not a FatTail Labs product spec. Not financial advice.

**Their claim frame:** A BWB is not a mysterious four-legged animal. It is a **1×2×1 equidistant long butterfly plus an extra short vertical**, executed as **one trade**. The **short vertical drives** delta, theta, and most of the risk. “Broken” means one wing is wider, which **kills risk on one side** (if you take a credit) and leaves defined risk on the other.

---

## End-to-end pipeline

```text
STRUCTURE  →  BWB = long 1×2×1 fly  +  extra short vertical  (one ticket)
           →  PUT BWB is neutral-to-bullish; CALL BWB is the mirror
           →  CREDIT on the package is what zeros one side
           →  ENTRY: cheap fly + rich vertical (more common in high IV)
           →  MANAGE: buy back the embedded short vertical for less than
                      the original BWB credit → leftover long fly on for
                      a small credit → theoretically can't lose
           →  SAME LOGIC for call BWBs and skewed / uneven iron condors
```

---

## 1. What a BWB actually is

On-screen identity (~00:54–02:23, slide 1 of 4):

> **Broken Wing Butterfly = Long Butterfly + Short Vertical**  
> *(but BWB executed as one trade)*

| Piece | Construction | Shape |
|---|---|---|
| **Long butterfly** | 1×2×1, **equidistant** strikes | Peak at the body; **can lose on both sides** |
| **Short vertical** | Extra short spread stacked on the “broken” wing | Credit; **zeros one side** |
| **BWB (net)** | Three strikes, one ticket | Same peak as the fly; **no risk on the protected side** if the package is a credit |

TP: the BWB “acts like its own little animal,” but the useful story is **what makes it broken** — the extra short vertical, not a new species of option.

Liz: three options, layered synthetically, create a fly **plus** a vertical. People don’t see that when they look at the P/L tent.

Same decomposition applies to:

- Call broken wing butterflies
- Put broken wing butterflies
- Uneven / skewed iron condors (“broken-wing iron condors”)

The extra short vertical is the general trick for all of these “unorthodox” spreads (~02:00–02:22).

---

## 2. Why it is “broken” (the risk graph)

A **standard fly** can lose on **both** sides of the peak.

A **BWB** keeps the fly’s peak, then the extra vertical **eliminates risk on one side** (~02:24–03:13).

For the **put BWB** they walk:

- **No upside risk** if opened for a **credit** — all puts expire worthless, keep the credit.
- **Defined downside risk** on the wider (broken) wing.
- Directional character: **neutral to bullish**.

Liz: the credit is why people put these on — “that credit protects you in one direction.” You can still lose on the other side.

Call BWB is the mirror (neutral to bearish; risk lives on the upside wing).

---

## 3. Worked example — TSLA 400 / 415 / 425 put BWB

Underlier in the clip: TSLA around **~$430–450**. They go **OTM on the puts** for a put BWB (~03:34–04:09).

### Net ticket (what you trade)

| Leg | Qty |
|---|---|
| 400 put | +1 |
| 415 put | −2 |
| 425 put | +1 |

Body at **415**. Wings: 425 is **10** points above the body; 400 is **15** points below. That extra 5 points is the broken wing.

### Synthetic split (how they want you to think about it)

| Book | Legs | Role |
|---|---|---|
| **Long fly** | +1 405 put / −2 415 puts / +1 425 put | Equidistant **10-point** 405/415/425 fly (debit) |
| **Short put vertical** | +1 400 put / −1 405 put | 400/405 **bull put spread** (credit) |
| **Net** | +1 400 / −2 415 / +1 425 | The 405s cancel |

TP (~04:13–04:32): the BWB **is** a long 405/415/425 put fly plus that extra short 400/405 vertical.

Liz (~04:34–04:47): you **pay** for a regular butterfly; you **take a credit** for the BWB. The credit **adds risk on the side you chose to have risk on**.

The credit **comes from the short vertical**, not from the fly (~04:50–05:02).

---

## 4. Greeks — the short vertical drives the trade

On-screen table (~06:15–07:32, slide 3 of 4). Header: **BWB Greeks = Bfly Greeks + Vertical Greeks**.

| Book | Price | Delta | Theta | Risk |
|---|---|---|---|---|
| 400/405 short put vertical | **1.75 credit** | **2.33** | **1.14** | **$325** |
| 405/415/425 long put fly | **0.55 debit** | **−0.18** | **0.47** | **$55** |
| **400/415/425 put BWB** | **1.20 credit** | **2.15** | **1.61** | **$380** |

Checks (as Liz reads them):

- Price: 1.75 − 0.55 = **1.20 credit**
- Delta: 2.33 + (−0.18) = **2.15**
- Theta: 1.14 + 0.47 = **1.61**
- Risk: 325 + 55 = **$380**

Liz (~07:06–07:15): “X + Y = Z.”

TP (~07:20–07:36): **most of the BWB’s Greeks are the short vertical.** That is why “the short vertical drives the trade.”

In this example the vertical is ~**6×** the fly’s risk ($325 vs $55) and almost all of the delta.

---

## 5. Entry rule

Slide 4 + TP (~08:03–08:32):

**Want: cheap long butterfly + rich short vertical.**

That pairing shows up **more often when IV is high**, because high IV:

- **Reduces** the price of the long fly (high IV is a **threat** to long butterflies)
- **Increases** the price of the short vertical

So the BWB is a way to **harvest rich verticals** while the fly is on sale — not a “set it in any vol regime” toy.

They park the deeper “why high IV does that” discussion for another segment.

---

## 6. Management — buy back the embedded vertical

This is the operational method they highlight (~05:16–06:05).

1. Open the **BWB as one trade** (credit).
2. Mentally keep the **embedded short vertical** as a separate object.
3. If the underlier moves the **right** way, the short vertical cheapens.
4. **Buy that short put spread back** for a debit **less than the original BWB credit**.
5. What remains is the **long fly on for a small credit** → **they can’t lose** on the leftover book (max loss of a long fly is the debit; here the leftover debit is more than offset by leftover credit).

Constraints they are explicit about:

- The underlier **must move in the appropriate direction** for that buyback to print.
- If it goes **against** you, you **sit on it** (you do not get to lift the risk for free).

TP’s closer (~08:34–08:50): the same play — **manage the embedded short verticals to leave a better risk/reward** — works on **calls, puts, and broken / skewed iron condors**.

---

## 7. Bottom line (their slide 4, verbatim)

- The short vertical component **“drives”** the trade.
- Short vertical has **larger delta and theta** than the butterfly, and comprises **most of the risk** of the BWB.
- BWB **benefits from high IV** that reduces the price of the long butterfly and increases the price of the short vertical.

---

## 8. Rules of thumb from the segment

| Do | Don’t |
|---|---|
| Trade the BWB as **one ticket** | Pretend it is a new product with no internals |
| Read it as **fly + short vertical** for Greeks, risk, and management | Size it as if it were a cheap long fly ($55 risk here vs **$380** package) |
| Prefer **credit** BWBs so one side is protected | Assume “no upside risk” if you **paid** a debit |
| Put BWB = **neutral/bullish**; call BWB = the mirror | Mix up which wing is broken |
| Hunt **cheap fly + rich vertical**, usually **high IV** | Treat high IV as automatically good for a long fly |
| If it goes your way: **buy back the embedded vertical** cheaper than the original credit | Force that management when the market is going against you |

---

## 9. Worked numbers to keep

TSLA put BWB from the show (illustrative, not a live quote):

```text
Ticket:     +1 400p  /  −2 415p  /  +1 425p
Split:      405/415/425 long fly @ 0.55 debit
            + 400/405 short put vertical @ 1.75 credit
Net:        1.20 credit
Delta:      2.15   (almost all from the vertical)
Theta:      1.61
Max risk:   $380   ($325 vertical + $55 fly)
Character:  credit put BWB → upside “can’t lose the credit”;
            risk lives on the wider downside wing
```

---

## Source notes

- Four slides: (1) component identity, (2) TSLA 400/415/425 split, (3) Greeks addition table, (4) bottom line.
- Tape date on the lower-third: **Oct 21, 2025**, ~10:28–10:36am CDT. ESZ5 last ~6780, monthly IV 18%, IVR 20% on the open card — market context only; the example is TSLA puts.
- Speakers: **TP** (structure, Greeks, management) and **Liz** (risk-graph and “credit zeros one side”).
- YouTube description matches the teaching: component analysis, which element drives the position, management, high-IV setup.
