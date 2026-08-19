# Seed W0-5 — Hotel trading honesty

**Project:** p-az-what-if-tm  
**Agent:** Hotel  
**Phase:** W0  
**Depends:** W0-2 APPROVED  
**Law:** Hotel charter · OPF §3.7 / §6.7 · OT-EF · Spec TM-B1/B2 fold  
**Gate it feeds:** W0-G

## Intent

Would a wrong Time or Vol story make a member **worse** if they believed it?

## Asks

1. Last-trade 16:15 vs τ 16:00: if the member thinks the model is still “live” in the last 15 minutes of index 0DTE, is that reckless? Caption needed?  
2. Additive parallel IV pts (OD-1 B) vs ratio (OD-1 A): either is a model. Is the **display** of measured ATM enough honesty?  
3. IV NO vs a fake 16% — block if the spec still allows a placeholder.  
4. AT-TM-13 (15:30 still moves) — 1-hour floor would be reckless on 0DTE.

## Files in scope

Spec §1–§3 · §7. OPF §3.7 / §6.7. Read only.

## Out of scope

Changing OPF29. Implementing. Killing Coach measured-IV.

## Done when

`gate-reports/W0-5-hotel.md` — workflow verdict. Block **only** if the story would teach a false lift or a false last hour.

## Invariants

Hotel blocks false/reckless trading education. Opinions labeled. Coach Content Law.
