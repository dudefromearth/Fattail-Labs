# Strategy Lab Prototype — Step-by-Step User Guide

**App URL:** http://localhost:8501  
**Life cycle:** **Design → Curation → Deployment**  
**Modes:** **Basic** (default, simple) · **Pro** (extra friction controls + denser metrics)

This guide matches the current Streamlit prototype (`strategy-lab-proto/app.py`).

---

## Before you start

### 1. Start the app (if it is not running)

```bash
cd /Users/ernie/Fattail-Labs/strategy-lab-proto
set -a && source .env && set +a
../server/.venv/bin/streamlit run app.py --server.port 8501
```

Open **http://localhost:8501** and hard-refresh (Cmd+Shift+R) if the page looks stale.

### 2. Confirm Massive

1. At the top, expand **1 · Check Massive connection**.  
2. Click **Ping Massive now**.  
3. You should see a green success and JSON with `"ok": true`.

If that fails, fix `strategy-lab-proto/.env` (`MASSIVE_API_KEY=...`) and restart Streamlit.

### 3. Pick a mode

| Mode | Use when |
|------|----------|
| **Basic** | Learning the path; one strategy in the book; fixed $0.05 slip |
| **Pro** | Custom open/close slip; IS/OOS metrics shown after a run |

Same three steps in both modes. Pro does **not** skip honesty gates.

---

## The big picture (one screen)

Scroll the page top to bottom:

```
Board (Design | Curation | Deployment)
    ↓
2 · Design Spec   (rules for the selected strategy)
    ↓
3 · Run test      (Massive backtest)
    ↓
Results + gate actions
    ↓
Curation / Deployment panels (when the card is in that stage)
```

**Select a strategy** by clicking its name under Design, Curation, or Deployment. The rest of the page edits/tests **that** card.

---

# Path A — Create a new strategy end-to-end

## Step A1 — Create

1. Scroll to **Create another strategy** (under the Board).  
2. Enter a short **Hypothesis** (required later if you rewrite Spec). Example:  
   *“Sell defined-risk 0DTE iron condors when the day is established.”*  
3. Choose a **Template**:  
   - Iron Condor  
   - Put Credit  
   - Call Credit  
4. Click **Create**.  
5. The new card appears under **Design** and becomes selected (▶).

> First launch also auto-seeds one sample IC so the board is never empty.

---

## Step A2 — Design (write the rules)

With the strategy selected:

1. In **2 · Design Spec**, set:  
   - **Name**  
   - **Hypothesis** (must be non-empty to save)  
   - **Underlying** (SPY / QQQ / IWM)  
   - **Structure**  
   - **Wing width ($)**  
   - **Contracts**  
   - **Capital context** (for context only in this prototype)  
   - **Skip FOMC** (recommended on)  
   - Optional: **Only trade small open moves** + max %  
   - **Exit**: Hold to expiry **or** 50% profit  
2. Check **I will not retune rules mid-campaign**.  
3. Read the blue **plain-English** sentence — if it’s wrong, fix the fields.  
4. Click **Save Spec**.

**Basic vs Pro here**

- Basic: slip fixed at $0.05.  
- Pro: set **Open slip** / **Close slip** yourself.

---

## Step A3 — Test (backtest on Massive)

1. Scroll to **3 · Run test (Massive backtest)**.  
2. Set **Start** / **End** dates (defaults are fine).  
3. Set **Max sessions** low first:  
   - Basic: **10–12**  
   - Pro: **15–20**  
   Each day can call Massive several times; large windows are slow.  
4. Click **▶ Run backtest now**.  
5. Wait for completion (often 30s–2 min for ~12 sessions).

### Read the results

| Metric | Meaning |
|--------|---------|
| **Total P/L** | Sum of simulated trade P/L (after slip) |
| **Max drawdown** | Worst peak-to-trough on the trade sequence |
| **Win rate** | Share of trades with P/L > 0 |
| **Trades** | Count of days that entered |
| **Holdout** | `ok` / `weaker` / `broken` / `too_few_trades` (last ~30% of trades) |

Read the **Verdict** sentence. Open **Skipped days** if trades = 0 (FOMC, no contracts, API issues, etc.).

### Honest limits of this prototype

- Entry **time** (e.g. 14:30) is a **label**; pricing uses **daily** option open/close, not minute chains.  
- Good for process + API wiring; not institutional fill fidelity.

---

## Step A4 — Gate after the test

Three buttons under **4 · Gate actions**:

### Keep designing

- Stay in Design.  
- Change Spec → **Save Spec** → **Run backtest** again.

### Send to Curation

Moves the card from Design → **Curation** (the book).

Blocked if:

- Holdout is **broken**  
- Too few trades (&lt; 3 in this prototype)  
- **Basic** already has 1 strategy in Curation  
- **Pro** already has 3 in Curation  

### Kill strategy

1. Type a **Kill reason** (required), e.g. *holdout weak* or *not my style*.  
2. Click **Kill strategy**.  
3. Card moves to the **Killed** expander — that is a **process win**, not a failure of nerve.

---

## Step A5 — Curation (the book)

When the selected card’s stage is **curation**:

1. Confirm it shows under the **Curation** column on the Board.  
2. Scroll to **Curation · start campaign**.  
3. Set **Campaign start** and **Campaign end** (end date required in spirit — campaigns end on purpose).  
4. Click **Start paper Deployment**.  
5. Card moves to **Deployment**.

Curation meaning: *this Spec earned a book slot* — not “live money yet” in this prototype (paper campaign only).

**Basic:** focus on **one** curated strategy.  
**Pro:** up to **three** in the book.

---

## Step A6 — Deployment (campaign)

When the card is in **Deployment**:

1. Review the campaign JSON (start / end / paper flag).  
2. (In a full product you would log trades here; this prototype links the *idea* of a campaign.)  
3. When done, write **one process lesson** in the retrospective box.  
4. Click **End campaign → back to Design**.  
5. Card returns to **Design** for the next version; lesson is stored on the card.

**Rule:** do not silently rewrite rules mid-campaign. New idea = new Spec version (re-test in Design, then re-curate).

---

# Path B — Run and test an *existing* strategy

Use this when a card is already on the Board (sample seed, previous create, or after a campaign ends).

## B1 — Select it

1. On the **Board**, click the strategy name under **Design**, **Curation**, or **Deployment**.  
2. The button shows **▶** when it is active.  
3. Everything below edits/tests **that** id (`2 · Design Spec — \`xxxxxxxx\``).

## B2 — If it is in Design

1. Review / edit Spec → **Save Spec**.  
2. **Run backtest now**.  
3. Act on the gate: Keep designing / Curation / Kill.

## B3 — If it is already in Curation

1. Select it under **Curation**.  
2. You do **not** need to re-create it.  
3. Optionally go back: only by killing or (after deploy) ending a campaign into Design.  
4. To re-test rules:  
   - Best practice: treat a material rule change as a **new Design cycle** (clone via **Create** with same hypothesis, or edit only if still in Design).  
   - In this prototype, if you need a fresh test after curation, prefer **Create** a new card so book history stays clear.  
5. When ready: **Start paper Deployment**.

## B4 — Re-test without losing the card (recommended workflow)

| Goal | What to do |
|------|------------|
| Tweak and re-run while still designing | Edit Spec → Save → Run test (same Design card) |
| Test a variation side by side | **Create** a second strategy (new template/hypothesis), run test, compare verdicts |
| Strategy failed holdout | **Kill** with reason; create a cleaner Design |
| Strategy already curated | Start campaign, **or** end campaign later and redesign |
| After a live/paper campaign lesson | End campaign → Design → change Spec → test again → re-curate |

## B5 — Quick “validate what I already trade”

1. **Create** with template closest to what you trade.  
2. Rewrite **Hypothesis** and Spec to match **your real rules** (not the template defaults).  
3. **Save Spec**.  
4. **Run backtest** with an honest window.  
5. Decision:  
   - **Send to Curation** only if holdout is not broken and trade count is usable.  
   - Else **Kill** with a written reason or Keep designing.

---

# Path C — Full cycle checklist (print this)

```
[ ] App running on :8501
[ ] Massive ping OK
[ ] Mode chosen (Basic / Pro)

DESIGN
[ ] Create strategy (or select existing Design card)
[ ] Hypothesis + Spec complete
[ ] Risk shell acknowledgment checked
[ ] Save Spec
[ ] Run backtest (small max sessions first)
[ ] Read P/L, DD, trades, holdout, verdict
[ ] Inspect skipped days if needed
[ ] Decide: Keep designing | Curation | Kill

CURATION
[ ] Card appears under Curation
[ ] Book limit respected (Basic 1 / Pro 3)
[ ] Set campaign dates
[ ] Start paper Deployment

DEPLOYMENT
[ ] Card under Deployment
[ ] Run the window (paper discipline)
[ ] Write one retrospective lesson
[ ] End campaign → Design (next cycle)
```

---

# Troubleshooting

| Symptom | What to do |
|---------|------------|
| Page looks empty / old | Hard-refresh Cmd+Shift+R; confirm Streamlit is on 8501 |
| No strategies | Click **Create** or reload — app auto-seeds one IC if empty |
| Ping fails | Check `.env` key; restart Streamlit from `strategy-lab-proto` with `source .env` |
| Backtest 0 trades | Open **Skipped days**; try SPY, fewer filters, different date range |
| Backtest very slow | Lower **Max sessions** to 8–12 |
| Cannot Send to Curation | Holdout broken, too few trades, or book limit full |
| Cannot Kill | Enter a non-empty kill reason |

---

# What “done” looks like for one cycle

1. **Design:** Spec saved, backtest finished, verdict read.  
2. **Curation:** Survivor sits in the book (not every idea).  
3. **Deployment:** Time-boxed paper campaign with an end date and one written lesson.  
4. **Loop:** Lesson feeds the next Design — most new ideas still die early.

---

*Prototype guide. Not investment advice. Process metrics only — no profit promises.*
