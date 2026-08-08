# W0-J — Journey doctrine pins

**Agents:** Hotel · India · Echo  
**Phase:** W0  
**Blocked by:** W0-0 v1.2  

## Intent

Pin before J1:

1. **T0** = `COALESCE(signed_at date, first fill exec day on campaign)` — signature wins when present  
2. **Alignment decay** — pure function (both-side OOB); unit tests  
3. **Scrub density** — one sample per calendar day with fills (or daily grid T0→present, empty days hold last shape) — Hotel default: **fill-days only** for samples; slider interpolates between samples  
4. **ProcessMeter** — Echo: prefer extract scrub/spider primitives; fork only if extract is unsafe  

## Done when

Write-up accepted + J0 pure tests green for decay.

## Gate

Feeds J0-0 / J1-0.
