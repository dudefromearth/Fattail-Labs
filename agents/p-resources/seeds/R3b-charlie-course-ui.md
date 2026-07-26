# Seed R3b — Charlie: Course builder resource UI

**Project:** p-resources  
**Agent:** Charlie (+ Echo)  
**Phase:** R3b  
**Prerequisite:** R2 (can parallel R3a)  

## Files in scope

- `web/components/edit/EditorExtras.tsx` and/or new `CourseResourcesEditor.tsx`  
- `web/components/CourseTabs.tsx` (Resources tab member + admin)  
- `web/components/edit/EditContext.tsx` only if structure ops required  
- Draft course editor if needed  

## Out of scope

- Hub admin forms (R3a)  
- Canonical package (R5)  

## Work

1. Replace course **AttachmentsEditor** path with **CourseResourcesEditor**:  
   - list links at pin  
   - free toggle  
   - unlink (link only)  
2. **Attach existing** modal: search API, pin select, attach.  
3. **New resource** modal: create + auto-link pin=v1; publish default off.  
4. **Pin picker** per row (versions).  
5. Member course Resources tab: show pin version + download.  
6. Stay-put; Application Framework Family A.  

## Completion

- [ ] U4, U5, U6 from plan matrix  
- [ ] Unlink does not delete library resource  

## Gate

Feeds R4/R5.