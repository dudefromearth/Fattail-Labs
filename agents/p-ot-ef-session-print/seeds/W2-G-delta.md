# W2-G — Delta characterization-list gate

**Agent:** Delta  
**Depends on:** W2-1  
**Plan phase:** W2

## Evidence

| Check | Pass if |
|-------|---------|
| List on disk | `characterization-list.md` |
| Coverage | §11 1–9 · AT-SESS-1…7 · SL-GD39–41 · CL-1…17 minimum |
| No code | W2 diff does not add product tests or `web/`/`server/` behavior |
| Homes named | Each row has a suggested module |

Self-gate is allowed (Delta authored W2-1) but the report must be written as if a second pair of eyes: list the mappings, do not say “looks good.”

## Deliverable

`gate-reports/W2-G.md`

## Next if PASS

W7/W8 may use the list. **W4 fires** when this gate **and** W1-G **and** W3-G have all passed (third gate wins). W3-0 is already BUILD.
