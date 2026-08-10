# W0-2 — India: schema map on 116 + adoption

**Agent:** India  
**Gate:** W0-G

## Task

1. Map migration `116_campaign_definition_fields.sql` columns to Spec:  
   `charter_version` · `max_drawdown_pct` · `strategy_codes` · `capital_allocation_mode` · `capital_allocation_note` · `retrospective_id`.  
2. Note dual **116** collision with `116_journal_day_net_map_pref.sql` — renumber plan if runner is ambiguous.  
3. Same-bet storage sketch (JSON nullable; dormant until set).  
4. Version bump rules: post-sign adopt/un-adopt → amendment + `charter_version++`.  
5. No dual truth with capital composition tables.

## Out of scope

Ship code. Correlation full Spec formulas.

## Completion

Schema map note + OD list for S1-0.
