# Strategy Lab — Position paper

**We position, we don’t predict.**  
**We must have skin in the game to harvest the fruit.**  
**We enter and embrace the roundabout.**

**Status:** Coach position (2026-08-16) · guiding light for members, coaches, and the bench  
**Normative twin:** [`Specs/FatTail-Labs-Strategy-Lab-Guiding-Doctrine-Spec-v1.0.md`](../Specs/FatTail-Labs-Strategy-Lab-Guiding-Doctrine-Spec-v1.0.md)  
**Architecture map:** [`Architecture/32-strategy-lab-guiding-doctrine.md`](../Architecture/32-strategy-lab-guiding-doctrine.md)  
**Decision:** **DL-382** · engine **DL-383** · resolution **DL-384** · VP grammar **DL-385** · market memory **DL-386**

This is **not** marketing. It is **why** Strategy Lab exists and **how** every phase is supposed to feel. Numbers below are **process frequencies and mark examples**, never targets.

---

## 1. The opposite of a winning-strategy lab

Most “bot” products hunt a **hero**: one backtest path, one high win rate, one system to marry.

That is **ossification**.

Strategy Lab **curates okay strategies** — small, defined, process-true **seats** — and looks for **clusters of non-correlated** ones. **Together** they produce a **right-skewed, long-right-tail** book with a **short left tail**. Then we **deploy the cluster**. We **keep curating**: more seats that **cluster**, and more that **maintain** what is already live.

We are not looking for a single winning strategy. We are building a **book**.

---

## 2. The market, not our batting average

Price landings, under a **normal** working picture:

| Share | What happened |
|-------|----------------|
| **50%** | Against you |
| **37.5%** | Close enough for an **opportunistic** take or a **scalp** |
| **10%** | Larger — often a **late** tent on a **steep** last-day curve |
| **2.5%** | **Pin / kahuna** (beyond ~2σ) |

That **12.5%** (10 + 2.5) is an **average** — what most analysts treat as **expected move**, and how often they think an option **finishes with intrinsic**.

**Reality:** the band **beyond expected move** is **touched much more often**. Those walks come in **cycles and clusters**. **Pins show up more in high VIX than in low.**

The **37.5%** is meant to **pay for the 50%**. **Clusters** on **asymmetric** structures (**weighted coins** — small debit, large tent) **wipe** what is left. The **remainder** of the bigger moves **advances** the account.

Win rate is the **sacred cow** of the **average trader**. They will **not** play in the **bad lands** beyond expected move. That is why a **convex** fly **just past that fence** is often a **discount** on **almost the same tent**. Same move, **same payoff**, **cheaper ticket**. That is the **frosting**.

We sit there **because** they will not — not because we predicted the tick.

---

## 3. How a trade is actually decided

**Vectors**, in order — not one slider.

**Premarket** (not the night before, unless you are playing the **European open**): **volatility regime and local IV** set the **decay rate**. From that you choose **strategy**, **width**, and **bias** — before the usual reports and before the cash open.

**After the open — session + structure as one trigger.** The morning chart’s **cyan arrows are the strategy**: price **interacts** (test / hold / break / retest / reject) with a **VP class** (HVN top / HVN bottom / LVN / inside the node / retracement) **inside a session window** (premarket, open, mid-morning, close, T−N to close, …), then **travels** toward the next level. That is Timing & Entry — **not a clock and not a price**. **0DTE uses the same arrows**, not only 3–5 DTE placement.

**The structure those arrows point at remembers.** Nodes are not redrawn every morning. They carry memory across weeks, months, years — even decades. In a **mature** price region the levels are refreshed as little as every **3–4 weeks**, and then only the small things: an edge shifts, a shelf appears, an LVN thins. Updates are frequent only where history is thin — near all-time highs, or after a break into untraded territory — where structure is still **forming** because no memory exists there yet. A fly against a forming node is a different bet than one against a decade-old high-volume edge.

That persistence is the operational face of **long memory** in markets: a documented statistical property, not a slogan and not one man's claim. The average model treats the tape as if yesterday barely matters. We sit on remembered structure **because they will not** — the same reason we sit just beyond expected move. The crowd ignored the long-memory picture for forty years because it was inconvenient. That is the thesis, illustrated.

**GEX is for management**, once you are on.

**Tile:** Advanced Flies on the live listed chain. That is **R:R**, debit, curvature. Not a number you type in Position Builder.

**Horizon:** **0–1 DTE** is **vol-led**. **3–5 DTE+** is **structure-led** (VP topology). Vol never disappears — it still **prices** decay — but it is no longer the main design lever. **Any** trade in its **last days** gets **0–1-class intense** management.

---

## 4. Two curves, one name each

**Opportunistic profit taking** (not “optimistic”).

You are still **days** out (even **3 DTE**). Overnight does **~1.25–1.5σ**. The open puts **spot on the center strikes**, **inside the tent**. The mark is already a **gift** (examples: **100–400%**, **~300%**). The **real-time curve is flat** — little decay left, **low gamma**. You **do not** wait three days to see if it becomes **1500%**. You **take the gift**.

**Intense last-day management.**

**5 DTE** on. Underwater **four days**. **Last day** you walk into the tent. The curve is now **steep** because **almost all the decay has already happened**. A tiny debit can mark like **800%**. That is **not** the early gift. That is the session you stayed for.

Know **which curve you are on**.

---

## 5. The 2–6% band (why the account can get stronger)

We design **max drawdown** inside **2–6%**. From that floor, **one** big win **or a few ok wins** can make a **new equity high**.

That **is** the **right-skewed, long-tail** *account* distribution: left tail **short** by design so the **right tail can post**.

A **crash** cannot take more than the band if the seat is **defined** and **convex**. It is **more likely to help** (gift / pin) than to kill. **Prolonged dim vol** cannot grind you if you **reduce exposure to match**.

**Skin in the game** is that small real debit. No seat, no fruit.

**The roundabout** (Mises, Austrian capital, Spitznagel): we **enter and embrace** the path that looks worse now — expected losers, bad lands, underwater days — so we are **on** when stress **leans**. The detour **has a cost**. We pay it.

---

## 6. Evidence

When we **backtest** and **forward walk**, we are **not** looking for a deterministic one-off winner. That is **ossification**.

We look at the **Monte Carlo** — the near-infinite other possibilities — the **shape**: right-skewed, long right tail, short left tail.

Would the **50%** still be affordable? Would a **gift** still make a **new high** from **2–6%** down?

**A strategy is not a trade.** It is a **rule** that **resolves** against the **surface it meets**. No hard strike in the config — the chain writes the fly. The **heatmap** and the **bot** use the **same selector**. A sketch you can only click is not a strategy.

**R2R** on a seat is **potential at entry** (max tent vs defined risk **as placed**) — never how the trade ended. **Exits** are fractions of that tent (max profit, debit, tent-relative), the same language for every structure.

A **trade is one position**, however many legs. Batman is not six trades. Dedup and retries key **that position**. Log the attempt and the result.

---

## 7. What Strategy Lab does all day

**Design** an okay seat.  
**Curate** it into a **cluster**.  
**Deploy** the **combination**.  
**Keep curating** — more that cluster, more that **maintain** the live book.

**Position. Don’t predict.**  
**Skin in the game.**  
**Embrace the roundabout.**  
**The arrows are the strategy. The structure they point at remembers.**

---

**End of position paper.**
