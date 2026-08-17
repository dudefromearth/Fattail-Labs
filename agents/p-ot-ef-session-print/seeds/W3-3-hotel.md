# W3-3 — Hotel Session/Print trading honesty

**Agent:** Hotel  
**Depends on:** W3-1  
**Plan phase:** W3  
**Workflow:** spec-create-review Phase 4 (trading-domain)

## Intent

A member who believed a **wrong** reading of live vs last print vs residual would be **worse**. Block that.

## Asks

1. `print_quality=live` only when a defendable NBBO mid exists?  
2. `extended` cannot be misread as RTH NBBO?  
3. `last_print` cannot be misread as a quote they can lift now?  
4. Held/residual window (Law C) cannot be claimed live by this spec?  
5. Any sentence that sounds like a trading recommendation?

## Files in scope

Session/Print spec. OT-EF Law C. Reviewer notes beside Coach text.

## Out of scope

Implementation. Changing settlement (OPF29). Profit-claim marketing (Tango’s lane unless it leaks here).

## Done when

`gate-reports/W3-3-hotel.md` — APPROVED / RETURNED. Block only for a false lift or reckless claim.

## Gate

Feeds **W3-G**.
