# R1-1 — Hotel · Alpha: free margin

**Agents:** Hotel · Alpha  
**Gate:** R1-G  
**Depends:** R1-0 inputs

## Task

1. `free_margin = declared_buying_power − structure_risk_open` when BP set.  
2. Null (omit) when BP unset — never fabricate 0.  
3. `structure_risk_open` = sum defined max loss of open structures.  
4. **Forbid** API field name `margin_at_risk`.

## Invariants

CP9 · P8 · Spec §6.2

## Acceptance

Spec §10 #9

## Completion

pytest field names + null path.
