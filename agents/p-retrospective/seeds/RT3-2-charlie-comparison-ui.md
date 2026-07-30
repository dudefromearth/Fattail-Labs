# Seed RT3-2 — Charlie: Comparison UI

**Project:** p-retrospective  
**Primary:** Charlie  
**Reviewers:** Tango  
**Phase:** R3b  
**Prerequisite:** RT3-1  

## Goal

Render comparison with **"This window (X weeks) vs previous (Y weeks)"**;  
suppress delta/arrows when `comparable=false`.

## Completion criteria

- [x] Tango APPROVED  
- [x] Maiden: baseline copy only  

## Feeds

→ RT3-G  

---

## Evidence (2026-07-29 — Charlie RT3-2)

### Shipped

`web/components/retrospective/RetrospectiveWorkspace.tsx` comparison section:

| Behavior | Implementation |
|----------|----------------|
| Heading | API `comparison.label` (This window … vs previous …) as section title |
| Maiden | Title **Baseline**; body = baseline copy only (`retro-comparison-maiden`) |
| Metrics | Side-by-side This window / Previous with window_days + n |
| Not comparable | Badge + plain reason; **no** arrows or delta pts |
| Grades | Labels only (“this window X; previous Y”) — no “→” trend |
| Direction | Only if API sent comparable integrity delta |

### Tango: **APPROVED**

No success/fail or scorecard language; “Not comparable” is factual; side-by-side respects dignity when windows don’t match.

### Verify

- `tsc --noEmit` clean  
- pytest retro suite green (24)  
