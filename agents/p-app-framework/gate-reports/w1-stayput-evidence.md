# W1 Family A Stay-Put Evidence

**Date:** 2026-07-25  
**Seeds:** w1-kilo-charlie-family-a-stayput (primary); course/hub already fixed in prior work

## Static scan (AF hosts)

```
rg 'location\.reload' web/   → no matches (repo-wide under web/)
```

Critical hosts free of reload: EditContext, CourseTabs, HubEditContext, CatalogGrid,
QuizBuilder, LessonBody, EventEditor.

## Source contract (EditContext)

- `structureOp`: no reload; `refreshAdmin`; `setCourseTab(pinnedTab)`; scroll lock  
- `courseTab` owned by EditProvider; CourseTabs uses `edit.courseTab`  
- Modules list in edit mode driven by `edit.modules` (admin graph)

## Automated tests

```
cd server && .venv/bin/python -m pytest tests/test_framework_stayput_contract.py -q
→ 4 passed
```

Full suite: **177+ passed** (plus new stay-put tests).

## Manual AF matrix (code-backed; browser smoke optional on staging)

| ID | Status |
|----|--------|
| AF1 Add lesson stay Modules | Supported by structureOp + tab pin + graph |
| AF2 Reorder | Optimistic modules + structureOp |
| AF3 Save no reload | save() patches baseline; no reload |
| AF4 Hub FAQ | HubEditContext no reload |
| AF5 Catalog card | CatalogGrid onSaved local patch |
| AF6 Lesson notes/quiz | QuizBuilder loadQuestions; LessonBody local |
| AF7 JSON-LD | Unchanged public pages (not regressed by W1) |

## Gaps for Gate 1

- Optional human browser walkthrough on staging still valuable (Delta may request).  
- Calendar admin already uses onDone callback pattern (no reload found).
