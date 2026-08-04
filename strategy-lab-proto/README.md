# Strategy Lab Prototype

**Development → Curation → Deployment · Bin** · foundation-first life cycle · Massive API (plugins)

Local Streamlit app for Strategy Lab.  
**Architecture & design (canonical):** [`../Specs/Strategy-Lab-Architecture-Design-v1.0.md`](../Specs/Strategy-Lab-Architecture-Design-v1.0.md)  
**Process source:** Strategy Life Cycle Big Picture (`LifeCycle.pdf`).

## Setup

```bash
cd strategy-lab-proto
cp .env.example .env
# Put your key in .env:
# MASSIVE_API_KEY=your_key_here
#
# Do NOT commit .env. Do NOT paste the key into chat.

# Use Labs server venv or create one:
../server/.venv/bin/pip install -r requirements.txt
```

## Run

```bash
cd strategy-lab-proto
set -a && source .env && set +a
../server/.venv/bin/streamlit run app.py
```

Open the URL Streamlit prints (usually http://localhost:8501).

## What works

| Feature | Status |
|---------|--------|
| Basic / Pro mode toggle | Yes |
| Board (Design / Curation / Deployment) | Yes |
| New idea from template | Yes |
| Spec + Risk Shell + plain-English summary | Yes |
| Massive connectivity test | Yes |
| 0DTE IC / credit spread backtest (daily proxy) | Yes |
| 5 metrics + holdout verdict | Yes |
| Kill / Send to Curation / Campaign shell | Yes |

## Backtest honesty

This prototype prices legs from **Massive daily option bars** (open ≈ entry, close ≈ exit).  
It does **not** yet use minute chains at 14:30. Good enough to validate process UX + API wiring; not institutional fill fidelity.

Keep **max sessions** around 20–40 to avoid hammering the API.

## Key location

```bash
# strategy-lab-proto/.env
MASSIVE_API_KEY=...
```

Or export in the shell before `streamlit run`.

## Related Labs code

- `server/market_data/massive_client.py` — chain snapshot client  
- `server/market_data/chain_collector.py` — forward archive for higher-fidelity tests  
- `docs/Strategy-Lab-First-Pass.md` — product design  
