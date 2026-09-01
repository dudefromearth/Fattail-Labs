# Seed P2-3 — Kilo P2 ATs

**Project:** OPF Generation Plane  
**Agent:** Kilo  
**Depends:** P2-1 · P2-2 · P1b-G for live AT-GP1  
**Law:** AT-GP1–11, 15a–c, 17, **19**, 20, 21 · AT-GP20  

## Ask

Characterization in `server/tests/test_opf_generation_plane.py` (and keep `test_opf_foundation.py` green).

AT-GP1 must be **live** on the P1a host (Redis + a `mb:ladder:*` write → owned store, hydrator Massive counter = 0). A fixture does not close AT-GP1. AT-GP19 (multi-worker fail loud) is gated here.

AT-GP21: two members + bus → three entries; health counts 1.

## Done when

Command + output. Delta P2-G.
