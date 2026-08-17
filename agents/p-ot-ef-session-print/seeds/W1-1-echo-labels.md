# W1-1 — Echo seeds labels (no chrome)

**Agent:** Echo  
**Depends on:** W0-G  
**Plan phase:** W1  
**Law:** OT-EF v1.1 §2.2 · §8.3 · Session/Print §6 · Human Interface Spec v1.0

## Intent

Name the states the member will read. **Words only.** No components, no CSS, no string edits in `web/`.

## Deliverable

`agents/p-ot-ef-session-print/echo-labels.md`

Required table (fill every cell):

| State | Badge / plane (≤2 words) | Package / curve reads as | Must not say |
|-------|--------------------------|---------------------------|--------------|
| `open` + `live` | | | |
| `extended` + last print | | | |
| `closed` + last print | | | |
| Held / residual (after τ, before midnight ET) | | | |
| EXPIRED (after midnight ET) | | | |
| `print_quality=none` | | | |

Also:

- Confirm **Show** is the verb for the checkbox (not “focus”, not “select for graph”).  
- HIG: calm, elevation-honest, no pastel panic, no profit theater.  
- If W3-2 runs before this seed, W3-2 is **BLOCKED on W1**, not free to invent chrome.

## Files in scope

The deliverable only. Read OT-EF §2.2 and Session/Print §6. Do not edit product UI.

## Out of scope / NX

Chrome. Implementation. Renaming OPF envelope fields. Changing Law C.

## Invariants

Coach Content Law. Last print is not an outage. Held/residual is never “live”. EXPIRED is never a blank price.

## Done when

Every row has badge text + package reading + forbidden phrasing. Tango (W1-2) and Hotel (W1-3) can review the same file.

## Gate

Feeds **W1-G**.
