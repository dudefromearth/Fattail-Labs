# W2-1 — Delta characterization list (no code)

**Agent:** Delta  
**Depends on:** W0-G  
**Plan phase:** W2  
**Law:** OT-EF v1.1 §10 #4 · §11 · Session/Print §9 AT-SESS-1…7 · SL-GD39–41  
**Advise:** Kilo may comment. Hotel may add honesty rows. Delta **authors** the list.

## Intent

Write the contract that later code and W8 tests must satisfy. **No tests in the repo. No product code.**

## Deliverable

`agents/p-ot-ef-session-print/characterization-list.md`

Start from plan §6 W2 table **CL-1…CL-17**. For each row:

| Field | Required |
|-------|----------|
| ID | CL-n |
| Fact | One sentence |
| Suggested test home | file or module (existing characterization preferred) |
| Litmus / AT map | OT-EF §11 # or AT-SESS-n |
| Blocked on | W4 / W5 / none (W3-0 is already BUILD — do not block rows on W3-0) |

Add rows if the litmus or AT-SESS set is not covered. Do not drop Coach facts.

## Files in scope

The deliverable. Read existing tests only: `optionBind`, `cardDisplayState`, `analyzerBook.pointer`, `otEfDoctrine.proof`, `builderAtomicState` — to **name** homes, not to edit them.

## Out of scope

Writing or changing tests. Envelope implementation. Chrome.

## Invariants

Prefer bind + display-state characterization. Severity high if a later ship invents strikes or a live claim in the Held window.

## Done when

Every OT-EF §11 item (1–9) maps to ≥1 row. Every AT-SESS-1…7 maps to ≥1 row or is explicitly “blocked on W4/W5”. SL-GD39–41 have rows. W3-0 is already BUILD — do not list it as a block.

## Gate

Feeds **W2-G**.
