# Seed W1c — Charlie: Hub FAQ List + Calendar Stay-Put

**Project:** p-app-framework · **Agent:** Charlie · **Gate:** feeds Gate 1  
**Depends on:** Gate 0 PASS  
**Read first:** Application Framework B4 (FAQ list), C4.2, C4.4; HubEditContext; live EventEditor

## Objective

1. Hub FAQ list: create/reorder/delete/save stay put (AF4) — no reload.  
2. Calendar/Live admin event editor: no full page reload on save (converge toward Family A stay-put).

## Task sequence

1. Confirm HubEditContext save has no `location.reload`; baseline applies in place.  
2. FAQ list graph = `edit.faqs`; + Add / ↑↓ / delete dirty until Save.  
3. Live sessions admin UI: remove or replace reload with local state refresh after PUT/POST.  
4. If Membership FAQ CMS is in T-D2 cut: note GAP only unless Coach ordered F-A1.

## Out of scope

New events model (T-D4 = extend live_sessions only) · Family B Journal

## Completion criteria

- [ ] AF4 evidence  
- [ ] Live admin save: no document reload (rg + manual)  
- [ ] pytest still green if server touched  

## Report

PASS / FAIL / BLOCKED.
