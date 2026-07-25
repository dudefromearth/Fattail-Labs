# Seed — H5 Appearance API (Alpha)

**Project:** p-hig  
**Spec:** Human Interface Spec v1.0 §10  

## Scope

- Migration `025_site_appearance.sql`  
- `server/appearance.py` validate + defaults  
- Routes public + admin draft/publish/discard/schema  
- Admin UI `/admin/appearance`  
- Client `AppearanceRoot` applies data-theme / data-tint / data-density  

## Invariants

- Unknown keys → 422  
- No freeform CSS  
- Tint enum only; font system only  
- Draft preview only for administrators (`?appearance=draft`)  

## Completion

- [ ] Migration applies  
- [ ] Characterization tests for validate + API  
- [ ] Admin can publish tint change  
