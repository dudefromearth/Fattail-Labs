# Seed W0-G — Delta

**Project:** OPF Generation Plane  
**Agent:** Delta  
**Depends:** W0-0…W0-6  
**Law:** plan v1.0 §5 · ternary PASS/FAIL/BLOCKED · never waived  
**Out:** product code · stamping BUILD without Coach W0-0

## Ask

Evidence-only:

1. `GP-W0.md` has W0-0 STAMP (spec BUILD **with GP21 erratum** + plan **v1.1 + errata E1–E3**) or this is BLOCKED.
2. India / Mike / Hotel / Foxtrot / Tango / Lima reviews exist.
3. OD-GP3 ticked if P1a is in the GO; else P1a stays blocked (not a W0 fail).
4. AT-GP22 ownership ticked.
5. DL-539 OK count recorded. **P2-0** remains blocked until 3/3. P1a may proceed without them.
6. **No product code** in this phase (P1b is later).
7. Fail-closed list of plan v1.1 + E3 is acknowledged, not edited.

Verdict in `agents/p-opf-generation-plane/gate-reports/W0-G.md`.

## Done when

PASS / FAIL / BLOCKED with evidence. PASS unblocks P0 only.
