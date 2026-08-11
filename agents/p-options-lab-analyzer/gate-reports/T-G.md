# T-G — What-if / override

**Status:** **PASS**  

- Enable gates **time · vol · spot%** (`disabled={!timeMachineEnabled}`; risk only applies offsets when enabled).  
- `data-testid="analyzer-override-banner"` when override or Held/Closed.  
- RECON chip → `override` when active.  
- Spot/VIX auto-fill does not trip override (dirty flags).
