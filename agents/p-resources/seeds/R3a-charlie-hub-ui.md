# Seed R3a — Charlie: Resources hub UI (member + admin)

**Project:** p-resources  
**Agent:** Charlie (+ Echo polish, Tango labels)  
**Phase:** R3a  
**Prerequisite:** R2  

## Files in scope

- `web/components/ResourceLibrary.tsx`  
- `web/app/resources/**` if needed  
- Small API helpers if any  

## Out of scope

- Course attach modal (R3b)  
- Migration  

## Work

### Member

1. Consume new `GET /api/resources` (published only).  
2. Cards: type, version, description, free/members, **course chips**, download.  
3. Preserve sign-in and 403 upsell patterns.  

### Admin

1. **New resource** form: slug, title, description, type, category, file/link, publish default off.  
2. Row actions: edit head, **New version**, **Publish/Unpublish**, free toggle, version history.  
3. Show linked courses; do not overwrite version payloads in place.  
4. Stay-put updates (reload list without losing scroll if reasonable).  

### Echo / Tango

- Badge copy: Published vs Course only vs Free vs Members.  

## Completion

- [ ] U1, U2, U3, U7, U8, U10 from plan matrix  
- [ ] No emoji chrome (emoji on card OK as data)  

## Gate

Feeds R3b / R4.