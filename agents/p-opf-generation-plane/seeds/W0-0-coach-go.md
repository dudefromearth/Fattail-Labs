# Seed W0-0 — Coach GO SPEC

**Project:** OPF Generation Plane  
**Agent:** Coach  
**Depends:** none  
**Law:** spec v0.2.2 INDIA-SIGNED · plan **v1.1 + errata E1–E3** · GP21 erratum  
**Gate it feeds:** W0-1

## Ask

1. Read:
   - `Specs/FatTail-Labs-OPF-Generation-Plane-Spec-v0_2_2.md`
   - `docs/OPF-Generation-Plane-Spec-v0.2.2-Full-Agent-Bench-Plan-v1.1.md` (errata applied)
   - `docs/OPF-Generation-Plane-Bench-Plan-v1.1-Errata.md`
2. Stamp **v1.1 + errata**, the way India signed spec v0.2 + v0.2.1.
3. **GP21 erratum:** plane interest is **wings-only**. Listed pairs are not registered as interest. Accept on the token.
4. Tick **OD-GP3** (StudioTwo recommended — Redis already `PONG`).
5. Tick **AT-GP22 ownership** (plan default: `keys.py` as P2-0).
6. Start or complete **three successive DL-539 OKs**. P2-0 cannot start without three. P1a (infra) may run after W0-G without them.
7. Env discipline (belt-and-braces): P1b ships with `LABS_OPF_LISTED_PAIRS` unset.
8. No product code until that stamp **and** W0-G.

## Done when

`GP-W0.md` has W0-0 STAMP of **plan v1.1 + errata** and **GP21 erratum**. Implementation still waits on W0-G.
