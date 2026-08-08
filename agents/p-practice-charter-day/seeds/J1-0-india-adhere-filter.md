# J1-0 — Adhere filter = meter complement (F2)

**Agents:** India · Alpha  
**Phase:** J (design lock before J1-1)  
**Blocked by:** W0-G  
**Blocks:** J1-1, J1-2

## Intent

Pin a **single definition** shared by Journey adherence meter and Trade Log deep-link filter.

## Meter law (as-built)

`journey_scores.adherence_raw_from_counts`:

- among **tagged** trades, **good** = `followed` + `partial`  
- tagged = adherence present and not empty/`unknown` (see SQL in `journey_scores.py`)

## Filter law (F2 — normative)

**Default “trades behind this” filter = meter complement:**

```
adherence NOT IN ('followed', 'partial')
```

i.e. show **`broke`** and **`unknown`** (and any other non-good values), **in the adherence meter window**.

- **Do not** include `partial` in the default drift set (partial already counts toward the meter).  
- Optional later UI may list partial **separately**, labeled **partial credit** — not mixed into default “behind drift” without label.  
- Filter **visible and clearable** on Trade Log.  
- No Reports destination.  
- **Kilo** will assert filter set ≡ complement of meter good set (seed J1-1 completion criteria).

## Deliverable

1. Written contract in this gate note / Spec touch if needed: query param name + values.  
2. Alpha implements list filter in J1-1 only after this seed PASS.  
3. Kilo will assert filter set equals complement of meter good set.

## Files (design only until J1-1)

Declare at J1-1: `server/routes/trade_log/*`, `web/lib/tradeLogApi.ts`, `web/app/app/trade-log/*`, `web/components/ProcessMeter.tsx` / Journey scores.

## Done when

India PASS written; Alpha ACKs param; Juliet unblocks J1-1.
