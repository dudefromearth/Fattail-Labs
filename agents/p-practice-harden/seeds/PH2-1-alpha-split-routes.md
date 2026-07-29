# Seed PH2-1 — Alpha: Split trade_log routes (structure only)

**Project:** p-practice-harden  
**Primary:** Alpha  
**Reviewers (required):** India · Kilo  
**Phase:** H2  
**Prerequisite:** H1 PASS recommended; may start after PH1-2 if Juliet schedules  

## Goal

Split oversized `server/routes/trade_log.py` into packages (accounts / trades / io)
**without changing routes or JSON**. Behavior-identical refactor.

## Files in scope

- `server/routes/trade_log*.py` / package layout per India H1 design  
- Router registration in `main` / app include  
- Tests: existing suite still green  

## Out of scope

- New endpoints  
- Schema migrations unless strictly required for split (prefer zero)  

## Collaboration / review protocol

1. Alpha splits + full trade_log pytest.  
2. **India** — module boundaries clean.  
3. **Kilo** — no regression.  

## Completion criteria

- [ ] Same public routes  
- [ ] India · Kilo APPROVED  
- [ ] Evidence: pytest  

## Feeds

→ PH2-G  
