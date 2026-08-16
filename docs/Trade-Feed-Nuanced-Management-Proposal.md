# Trade Feed — proposal for nuanced management of the trade

**Status:** PROPOSAL (Coach 2026-08-15). Not BUILD AUTHORITY.  
**Source paper:** [`Specs/references/TradeFeed.pdf`](../Specs/references/TradeFeed.pdf)  
**Joins:** Batman PM (Method Spec v0.2.2 §1a.1 · DL-375) — the **%’s are a rule of thumb**; this paper is the proposed **nuance**.  
**Coach Content Law:** the paper is the source. This note arranges. Nothing of the paper is removed.

---

## What the paper is

**Trade Feed** is an AI **market-structure coach** that continuously interprets the **entire FatTail platform** in the context of the trader’s **actual open position**.

Once the trader enters, they give Trade Feed the strategy, strikes, expiration, entry price, and other relevant trade information. Trade Feed then evaluates that position against Heatmap, Volume Profile, gamma/GEX, gamma walls, regime classification, and surface metrics:

Gradient · Curvature · Call/Put Asymmetry · Width Efficiency · Surface Velocity · Surface Acceleration · Time Decay · Regime Stability · Anomaly Detection

**The problem it solves is interpretation.** The platform can expose an enormous amount of useful information. The more sophisticated it becomes, the harder it is for a human to watch dozens of changing variables, see the relationships, and know which ones matter to **this** position.

From:

> Here are all the metrics. Figure out what they mean.

To:

> Here is what matters to your trade right now, why it matters, what has changed, and what you should be watching next.

Job in five words: **Observe · Prioritize · Relate · Explain · Confirm.**

It is **not** simply an alert system and **not** simply a chatbot. It is a **persistent AI conversation** following the life of the trade from entry through management — watching the platform, deciding what matters, explaining why, answering questions, then following up as the market provides the answer.

**It does not tell the trader to buy, sell, or exit.** The trader retains the decision. Trade Feed improves the evidence.

---

## Position-aware intelligence

The trade is the context.

Trade Feed understands where price is relative to the position’s **strikes, profit area, center/pin, breakevens, and risk areas**. It overlays the market’s structural levels and asks how they relate to **this** position.

Not: “Gamma wall at 7780.”

Instead: the **7780 center** is aligned with a significant gamma concentration and a high-volume node — multiple independent measures identify the same area as structurally important **to your position**.

As price moves it can name: approaching · testing · stalling · breaking · rejecting · establishing **acceptance** beyond. Then it checks whether the expected **confirmation** actually occurred.

---

## Event-driven coaching

Not constant noise. Prioritize meaningful change. Manage attention.

**INFO · WATCH · IMPORTANT · RED ALERT**

Events the paper names: price approaching a structural level; entry into an important area of the position; stall at a gamma wall or VP boundary; gamma-wall create / disappear / migrate; multiple metrics converging at one price; breaks, retests, rejection, confirmation; Gradient or Curvature change; Call/Put Asymmetry change; Surface Velocity or Acceleration increasing; Regime Stability deteriorating; positive gamma transitioning toward negative; structural conditions **materially different from entry**; anomalous behavior.

Example RED ALERT (paper): the market has transitioned from the **positive-gamma environment present at entry** toward negative gamma. Surface Velocity and Acceleration are increasing. Price may behave differently around levels that previously contained it. **The position was entered under materially different conditions than currently exist.**

---

## Structural memory

Trade Feed remembers the **state of the market when the trade was entered**.

The important question is not only “What is happening?” It is:

> What has changed since I entered?

It tracks gamma-wall migration, regime transitions, changing Volume Profile, surface behavior, and the evolving relationship of those to the position. A continuous structural **history of the trade**, not disconnected snapshots.

---

## Two-way conversation

Every post is interactive. The trader can ask: why does this matter to my trade? what would confirm a break? have we confirmed yet? which metrics agree / disagree? where is the next important level? what changed since I entered? what should I watch right now?

If the trader names confirmation conditions, Trade Feed monitors them and later reports: **the confirmation conditions we discussed have now occurred.**

The larger product: FatTail’s API is the **market-intelligence engine**; the LLM is the **interface**. The trader does not have to watch every Heatmap cell, gamma level, VP feature, and surface metric. The AI watches them simultaneously.

---

## The example scenario (as in the paper)

This is a **worked example** of nuanced management. It is **not** the Batman 3:45 / $2 package lock.

| | Paper example |
|--|----------------|
| Product | **SPX 0DTE LIVE** |
| Position | **7750 / 7770 / 7790 CALL butterfly** (20 wide, body 7770) |
| Entry | **$4.85** at **11:07 CT** |
| Spot at entry | SPX 7762.40 |
| Regime at entry | POSITIVE GAMMA · STABLE |
| Structural alignment | HIGH |

**Clock (as written — CT in the header, clock stamps 11:07…12:12):**

| Time | Class | What happened |
|------|--------|----------------|
| 11:07 | TRADE ENTERED | Baseline: 7770 center near gamma + developing VP node. Primary watch **7770–7775**. Confluence. |
| 11:09 | Ask | Why 7770? Position center + gamma 7770–7775 + VP. Confluence > any one. |
| 11:17 | WATCH | Approaching profit area, ~3 pts from 7770. First test of 7770. Regime still stable. |
| 11:18 | Ask | Watch whether price **stalls, rejects, or establishes acceptance** through 7770–7775. Distinguish **test / break / confirmed acceptance**. |
| 11:22 | IMPORTANT | **PRICE STALL** — 7769–7772 for ~four minutes. Velocity down. Inside profit area, near center. |
| 11:23 | Ask | Structure relatively well aligned. A **gamma-wall migration, regime change, or confirmed move through 7775** would change the reading. |
| 11:31 | IMPORTANT | **7775 BROKEN — CONFIRMATION PENDING.** SPX 7777.10. A **break, not confirmation**. |
| 11:32 | Ask | Confirmation = remain above 7775, especially a successful retest — not a temporary trade-through. |
| 11:37 | IMPORTANT | **7775 CONFIRMED.** Held above, retested ~7775.50, held, moved higher. Next area **7785–7790** (upper portion of the position). |
| 11:38 | Ask | 7775 is behind price. Priority is **7785–7790**. |
| 11:46 | IMPORTANT | **GAMMA WALL SHIFT.** Concentration migrated: at entry near **7770 center**, now ~**7780–7785**. One component of original alignment with the center has weakened. Broader +γ still intact. |
| 11:47 | Ask | Does this increase risk? Feed: it changes the **structural relationship** more than a simple higher/lower. Center and dominant gamma no longer aligned. Broader +γ and VP still support below. Watch: further gamma migration; **acceptance above 7785**. |
| 11:48 | | Trader: tell me if that happens. Feed prioritizes: further gamma-wall migration · acceptance above 7785 · material regime change. |
| 11:56 | **RED ALERT** | **REGIME CHANGE.** SPX 7787.60. Away from stable +γ toward **neutral/negative gamma**. Velocity, Acceleration, Curvature, Regime Stability. Position entered under a **materially different structural environment**. Price testing **7785–7790**. |
| 11:57–11:58 | Ask | Should I get out? **No. The data does not make that decision for you.** Evidence changed. Question: does 7785–7790 **reject or become accepted** under the new regime. |
| 12:04 | WATCH | **7790 TEST · NO CONFIRMATION.** Insufficient evidence of acceptance above 7790. Acceleration no longer increasing. Confirmation: **NOT YET.** |
| 12:05 | Ask | Mixed: γ weaker than entry; VP 7790 still a boundary; Velocity elevated not increasing; Acceleration flattening; Curvature elevated; no acceptance above 7790. |
| 12:11 | IMPORTANT | **REJECTION DEVELOPING.** Failed acceptance above 7790, back below 7785. Favors **rejection of 7785–7790**. Outcome of the test followed since 11:38. |
| 12:12 | Ask | Big picture vs entry. **AT ENTRY:** +γ, stable, γ near center, VP aligned, low Velocity. **SINCE:** 7775 tested, broken, confirmed; γ migrated; regime weakened; V/A up; 7785–7790 tested and rejected. **NOW:** still in the broader area of the position; structure around it is **materially different**. Next: rejection develops toward 7775, or another attempt to accept above 7790. |

---

## Join to Batman profit management (this bench)

| Already locked (mechanical rule of thumb) | This paper (nuance) |
|-------------------------------------------|---------------------|
| PM on at >$75 unrealized / side | Does not replace the trigger |
| 75% trail → 60% @ 11:00 → 50% @ 12:30 | %’s are a **rule of thumb** (DL-375) |
| Tent walls when inside the tent | Feed names **profit area, center, breakevens** and whether price is **inside** |
| Curve steepens; healthy pullback can jump you | Feed watches **Time Decay, Velocity, Acceleration, regime vs entry** |
| Bot / backtest needs checkable sentences | Feed is **human (or later AI) interpretation** — **does not exit for you** |

**India (labeled):** The example is a **single 20-wide SPX 0DTE call fly** (7750/7770/7790) entered **$4.85** mid-morning. The first **test strategy** is **Batman**, next-expiration, 3:45 ET, **$2** package. Same **width** (20), different **when / underlier clock / debit**. The **scenario teaches the nuance grammar** (test vs break vs confirmation, alignment with center, regime vs entry). It is not a silent rewrite of the Batman entry lock.

**Coach (2026-08-15):** It depends **which side price attaches** — call fly or put fly is the **subject of PM**. The paper’s call-fly walk is the grammar **when price attached to the call**. A put attach is the same grammar on the other tent.

**Tango (labeled):** “Are you saying I should get out? **No.**” matches capacity-over-dependency. Trade Feed must not become a dependency machine that exits for the member.

**Hotel (labeled):** Acceptance / rejection / confirmation language is about **structure vs the position**, not a profit claim.

---

## What this is not (yet)

- Not a backtester exit algorithm.  
- Not BUILD AUTHORITY for a Trade Feed product.  
- Not a replacement of §1a.1 percent thumb-rules.  
- Not permission to invent gamma-wall formulas in this note.

If Coach later wants the **bot** to consume Trade Feed events (regime change, tent acceptance, rejection of the upper wall), that is a **new lock**. Until then the paper is the **human nuance** beside the mechanical thumb-rules.
