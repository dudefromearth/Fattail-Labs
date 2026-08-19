# Option Alpha bot management — features as described (Day 2 Masterclass)

**Source:** [Option Alpha Autotrading Masterclass, Day 2](https://www.youtube.com/live/NQY8hIH02dM) (Kirk, Option Alpha). Duration **3:22:59**. Was live; captions used (no frame pass — too long for a full visual sample).  
**Watched:** 2026-08-17 · captions only.  
**Scope of this note:** Bot **management and construction** as Kirk walked it that day — not a current product-page audit, not FatTail comparison.

Day 2 was “100% on bot building”: recipes, automations, reuse, and **custom inputs**. Kirk framed it as a multi-month Elite beta; many combinations, no single “right” bot.

---

## 1. What a bot is (Kirk’s model)

A bot is **not** the whole account. People “assume wrongly that one bot controls everything.” He treats bots as **sliced allocations** — many bots, each with a **manual dollar allocation**, each running a process on a slice (he used examples like 1–6% of the account).

A bot needs **three jobs** to close the loop (~10:31–13:03):

| Job | What he showed |
|-----|----------------|
| **Find** | Scanners + filters — what to look for and what to exclude |
| **Decide** | Nested yes/no decisions (market environment, symbol state, size) |
| **Manage** | Dynamic management after entry (profit, stop, trend, time-in-trade) |

Bots “literally just go through the process — whatever you tell them to do they do.” They amplify a process you already researched; they do not invent the process.

**Modes he named (~19:49–20:20):**

- Full auto (scan + enter + manage)  
- **Hybrid:** you open; the bot **only manages**  
- Manual trading still exists alongside bots  

Existing broker positions are **not** managed unless you **open (or attach) them inside that bot** (~3:19:38).

---

## 2. Bot list and dashboard

From the platform walk (~17:41–19:22):

- List of **running bots** with **tabs**  
- **Dashboard** of performance  
- Per-bot **activity** for the day (what the bot already did that morning)  
- Later: dashboard can get **buttons** you add (~2:27:02) so actions sit on the home surface  

**Browser / cloud:** “everything is browser-based”; log in, start bots; they **keep running in the cloud after logout** (~3:15:04–3:16:56).

---

## 3. Capital and risk controls on the bot

| Control | As described |
|---------|----------------|
| **Allocation** | **Typed dollars**, not a silent %. “Tell us exactly how much money that bot has allocation to.” (~20:43–21:29) |
| **Change anytime** | Mid-flight edits on the same screen (~24:16) |
| **Entries per day** | e.g. one position per day, or a cap like four (~22:29–23:45) |
| **One-at-a-time** | Optional: no new entry until a position is closed (~23:11) |
| **Day-trade guard** | Can monitor so it does not exit same-day if you do not want PDT-style churn (~21:59) |
| **Net liquidity / available to trade** | Shown against allocation (~2:54:01) |
| **Clone / replicate** | Copy a bot, change ticker or slice, reuse (~24:00, ~3:17:44) |

First-level risk management is **these bot settings**, not the broker.

---

## 4. Automations (the instruction manual)

Automations are the **instruction list** the bot follows (~07:06, ~27:24). They are a **series of decisions**, not a black box.

### 4.1 Types

| Type | Role |
|------|------|
| **Scanner** | Recurring **search for entries**. “Look for possibilities to enter positions.” Triggers on a **schedule**. (~27:43–28:02) |
| **Monitor** | Watches **open positions** of the types you specify; runs close / adjust decisions. Can be **strategy-specific** (different monitor per strategy in the bot). (~41:58–42:19) |

Scanners look for **new** positions. Monitors fire **after** something is open (~48:23).

### 4.2 When they run

- Recurring **schedule**  
- **Continuously**  
- On **events** (~13:42–13:47)  
- Optional: only on a certain schedule (e.g. a named scan like “honey badger”) (~2:33–2:36)  

When a scanner’s entry **limits are full**, that scanner can go into **hibernation**; **monitors keep watching** (~48:40–49:03).

### 4.3 Library vs scratch

- Pick an existing automation  
- Save into **My automations**  
- Build **from scratch** (he named one `automation123`) (~28:32–29:21)  
- **Reuse and tweak** the same automation across bots; swap **inputs** instead of rewriting (~51:06–51:24, ~2:58:38)  

---

## 5. Recipes (the “cards”)

Recipes are **small, specific decision cards** you combine — deck-of-52 analogy (~15:13–16:37). There is **no public “black market” of bots/recipes** in this talk; sharing is optional (~18:05–18:15).

Examples he walked or listed (~1:06–1:18, later Q&A):

- Simple **trend** (e.g. S&P vs 200-day MA; multi-timeframe)  
- **VIX** above/below a level (e.g. below 40)  
- Symbol **price change** since a lookback (e.g. up 2% vs a week ago)  
- **Volume** filter (then **different share size** on yes vs no)  
- **Time in trade** (position open N days)  
- **Days to expiration** (30 / 45 / 90, or a custom horizon)  
- **Profit** since open (e.g. premium +5%)  
- **Stop** on position value (e.g. −10%) or combined take-profit / stop  
- **Market-crash check** as a prefix before other automations (~03:52)  
- Implied vol / “high IV” style filters  
- Mention of **probabilities / expected value** recipes as a later stack (~1:24)  
- Named community-style scans (e.g. honey badger) as a **scheduled** run  

You can **nest** recipes: AND/OR, “either of these must be true,” yes-path vs no-path with **different size** (~1:00:41–1:02:06).

Kirk: if a combo should be its **own** recipe, Elite beta is how they add it (~02:57–03:05).

---

## 6. Inputs (make automations reusable)

**Custom inputs** were a Day 2 focus (~01:25–01:33).

- An **input** is a field you fill **later** (ticker, threshold, lookback) (~51:06)  
- **Link + input** so one control feeds the automation (~33:00)  
- Same automation, different bots: change ticker / parameters without cloning the whole decision tree  
- Ticker universe must be **explicit** — “hard code exactly what tickers you want” / define the list (~54:00, ~2:58:12). He pushed back on “random ticker from a watchlist” for legal/control reasons.  
- One bot **can** scan **multiple tickers**; or clone one-ticker bots (~3:17:14–3:17:44)  
- Combining **multiple scanners** in one bot (~2:24:01, ~2:12:00)

---

## 7. Smart pricing (orders)

**Smart pricing** (~37:45–40:16):

- Entry: works its way **into** the market (he described walking toward a fill)  
- Exit: works the **opposite** direction (backs down)  
- **Separate aggressiveness** for enter vs exit  
- Optional; you can still use fixed limits  

GTC / leftover limit behavior: he noted you sometimes have to **guess** leftover working orders (~2:48:00).

---

## 8. Position management (monitors)

Once in a trade, monitors can:

- Check **profit** then **trend** (keep or close)  
- **Stop** on −X% value regardless of trend  
- Combined: −10% **or** +15% → close (~1:04:04–1:04:23)  
- Time-based (open for N days)  
- Different monitor stacks **per strategy** inside one bot  
- Skip when conditions are not met (e.g. RSI not overbought — **skip**, wait for a tradable event) (~2:52:05–2:52:30)

He previewed “how you could manage” short put, iron condor, long call, adjustments as **future / example stacks**, not all fully built in that demo (~2:56:48–2:57:11).

**Manual entry inside a bot:** you can open a position **in the bot** so the same monitors own it (~3:10:17–3:10:28).

**Delete rules:** you **cannot delete a bot that still has positions** — close them first (~2:51:16–2:51:29).

---

## 9. Templates, tags, community

- **Templates:** add a bot from a template; someone can modify it and **add the template back** (~2:45:00)  
- Optional **share** of recipes/bots/performance; default is private (~2:49:41–2:50:58)  
- **Tags** referenced as organization (see caption hits); not a deep tag-manager walk on Day 2  
- Community comments / Elite feedback as the recipe backlog  

---

## 10. Paper vs live

- Option Alpha built **its own paper engine** — works **without a broker connection** (~3:10:52–3:11:16)  
- Elite: up to **100 bots**; you can **split** e.g. 50 paper / 50 live (~3:15:19, ~1:59:53)  
- “If you think you have it down, **paper trade it** so you are sure” (~3:02:54)  
- Bots execute the **sequence you wrote**; foolproof = they follow instructions (including “off” and “max 10 entries”), not that the strategy cannot lose (~3:04:01–3:04:10)

---

## 11. Brokers, accounts, limits (as of this video)

| Topic | Stated |
|-------|--------|
| **Integrated then** | TD Ameritrade / thinkorswim |
| **Tastytrade** | Agreement + API not ready; “first quarter next year” rumor, unknown |
| **Futures / options on futures** | Not on the roadmap then; brokers would need API support |
| **OA commissions** | None on top of the broker; **no volume kickback** from brokers (~3:18:02–3:18:28) |
| **Multiple accounts** | Yes — e.g. one bot on IRA, another on margin, same or different brokers (~3:08:36–3:08:50) |
| **Bot cap** | **100 running** at Elite; “if you need more, let’s talk” |
| **One bot triggering another** | **No** — avoid circular references; keep related logic **inside one bot** (~3:07:26–3:07:48) |
| **Performance export** | **Not yet**; they said they were building it (~2:54:16) |

---

## 12. Future he floated (not shipped in the demo)

- Third-party **data into bots** (“boost a bot” / power-up, extra monthly fee for faster/heavier compute) (~3:12:53–3:13:57)  
- More named management recipes (condor, vertical, long call, adjustments)  
- Official docs site when the new website is ready  
- Watchlist-driven entry **only if you define the ticker list**  

---

## 13. Day-2 build sequence (what he actually assembled)

Rough arc of the live build:

1. Explain bots as allocation slices, not “one bot = the account.”  
2. Open the bot list / dashboard.  
3. Set **manual allocation** and **entry caps**.  
4. Add a **scanner** on a schedule (trend / MA example).  
5. Add **inputs** (ticker, lookbacks).  
6. Add **smart pricing** on the entry.  
7. Add a **monitor** for open positions.  
8. Nest profit / stop / trend on the monitor.  
9. Show **scanner hibernation** vs always-on monitors.  
10. Combine scanners, dashboard buttons, templates.  
11. Q&A: paper engine, 100-bot cap, TOS vs tasty, no bot-to-bot triggers.

---

## Honesty notes

- This is **Kirk’s Day 2 walkthrough**, not Option Alpha’s current marketing site and not a live click-through of today’s product.  
- Features marked “we’ll have” / “not yet” / “roadmap” were **not claimed as shipped** in the video.  
- Captions are auto-style (duplicates, “baht” = bot). Meaning taken from surrounding context.  
- No frame review (3h23). Visual chrome (exact tab names, card UI) is from speech, not screenshots.

**Work artifact:** captions from `NQY8hIH02dM` (en-orig).  
