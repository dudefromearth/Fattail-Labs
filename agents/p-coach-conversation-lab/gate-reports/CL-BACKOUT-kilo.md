# CL-BACKOUT — Kilo (Test & Quality Engineer)

**Date:** 2026-08-13  
**Agent:** Kilo  
**Scope:** Prove Coach Conversation Lab **solo implementation is fully backed out**; product characterization still green.  
**Mode:** Tests and greps only. No feature work. No restore.

**Verdict:** **PASS**

Implementation source files listed in the backout contract are absent. Admin nav and `server/main.py` have no Coach Lab wiring. Required journal / AI characterization tests are green. Broader-suite `test_live_bravo_research_pack_smoke` failed on missing `XAI_API_KEY` (pre-existing; not a lab-revert regression). No leftover **runtime source** references in `web/` or `server/`.

---

## 1. Listed implementation paths — ABSENT

Command (repo root):

```bash
for p in \
  web/components/conversation/ConversationSurface.tsx \
  web/components/admin/CoachLabPage.tsx \
  web/app/admin/coach-lab/page.tsx \
  web/lib/coachLabApi.ts \
  server/routes/coach_lab.py \
  server/coach_lab_domain.py \
  server/coach_lab_config.py \
  server/tests/test_coach_lab.py \
  migrations/128_coach_lab.sql
do
  if [ -e "$p" ]; then echo "EXISTS: $p"; else echo "ABSENT: $p"; fi
done
```

Output:

```
ABSENT: web/components/conversation/ConversationSurface.tsx
ABSENT: web/components/admin/CoachLabPage.tsx
ABSENT: web/app/admin/coach-lab/page.tsx
ABSENT: web/lib/coachLabApi.ts
ABSENT: server/routes/coach_lab.py
ABSENT: server/coach_lab_domain.py
ABSENT: server/coach_lab_config.py
ABSENT: server/tests/test_coach_lab.py
ABSENT: migrations/128_coach_lab.sql
```

Extra path probes:

```
ls: web/app/admin/coach-lab: No such file or directory
ls: web/components/conversation: No such file or directory
ls: web/components/admin/CoachLabPage.tsx: No such file or directory
ls: server/coach_lab_config.py: No such file or directory
ls: server/coach_lab_domain.py: No such file or directory
ls: server/routes/coach_lab.py: No such file or directory
```

Migrations around 128: `125_apps_highlighted.sql`, `126_retrospective_one_thing.sql`, `127_journal_v07_charter.sql` — **no `128_coach_lab.sql`**. Next numbered files continue after 127 without a coach-lab migration.

---

## 2. Wiring files — clean

### `web/app/admin/layout.tsx`

```bash
rg -n -i "Coach Lab|/admin/coach-lab" web/app/admin/layout.tsx
# → NO MATCH in web/app/admin/layout.tsx
```

File exists (`-rw-r--r-- … Aug 13 23:53`). `NAV` has Overview, Board, Cast, Media, Tags, Market universe, Journal prompts, AI workbench, Agent keys, Appearance, Gates, Access, Users, Flow, Help, Community. **No “Coach Lab” label. No `/admin/coach-lab` href.**

### `server/main.py`

```bash
rg -n "coach_lab" server/main.py
# → NO MATCH in server/main.py
```

Imports and `include_router` calls cover existing Labs routers only. **No `coach_lab` import. No coach-lab router registration.**

Python import probe (source gone; `__pycache__` does not resurrect the modules):

```
NOT IMPORTABLE: coach_lab_config (ModuleNotFoundError: No module named 'coach_lab_config')
NOT IMPORTABLE: coach_lab_domain (ModuleNotFoundError: No module named 'coach_lab_domain')
NOT IMPORTABLE: routes.coach_lab (ModuleNotFoundError: No module named 'routes.coach_lab')
```

`pytest --collect-only` collected **no** `coach_lab` / `coach-lab` / `CoachLab` tests.

---

## 3. Characterization tests — green (required set)

Command:

```bash
cd server && .venv/bin/python -m pytest tests/test_journal_v07.py tests/test_journal_sessions.py tests/test_ai_models.py -q --tb=short
```

Output (exit 0):

```
........................................................................ [ 88%]
.........                                                                [100%]
=============================== warnings summary ===============================
.venv/lib/python3.14/site-packages/fastapi/testclient.py:1
  … StarletteDeprecationWarning: Using `httpx` with `starlette.testclient` is deprecated; install `httpx2` instead.

tests/test_journal_v07.py: 21 warnings
tests/test_journal_sessions.py: 112 warnings
  … DeprecationWarning: Setting per-request cookies=<...> is being deprecated …

81 passed, 134 warnings in 2.34s
```

**81 passed.** Failures: none. Warnings are pre-existing Starlette/httpx cookie deprecations, not lab-revert.

---

## 4. Broader suite (allowed) — Bravo smoke noted; not a backout regression

Command:

```bash
cd server && .venv/bin/python -m pytest tests -q --tb=line
```

Headline:

```
33 failed, 884 passed, 2 skipped, 1164 warnings, 10 errors in 169.77s (0:02:49)
```

**Known allowed exception:**

```
FAILED tests/test_agent_tasks.py::test_live_bravo_research_pack_smoke
E   ai.types.AiConfigError: XAI_API_KEY is required for primary (Grok) completions
/Users/ernie/Fattail-Labs/server/ai/providers/xai.py:20
```

Treated as **pre-existing live Bravo smoke** (env key absent). Not a Coach Lab revert regression.

Remaining full-suite failures/errors are **outside this backout contract** (catalog slugs vs live DB, help validation, strategy-lab curation-phase full, thinkorswim export, lesson `modules` KeyError, etc.). None mention `coach_lab`, `ConversationSurface`, `LABS_COACH_LAB`, or `/admin/coach-lab`. They do not fail this gate.

---

## 5. Leftover **runtime source** grep — none

Targets: `ConversationSurface` · `LABS_COACH_LAB` · `/admin/coach-lab` · `coach_lab_`  
Trees: `web/` and `server/` (Specs / docs / agents / Architecture excluded).

```
web/     — No matches
server/  — No matches
migrations/ — No matches
```

Broader identifier hunt (`coach.?lab|CoachLab|coachLab|coach_lab|LABS_COACH_LAB|ConversationSurface`, case-insensitive) in `web/` and `server/` source: **No matches.**

---

## 6. Residual artifacts (not runtime source; do not fail this gate)

Stale **bytecode / Next build cache** still on disk after source delete. Python will not import the modules (probe above). A stale `next start` **without rebuild** could still serve old compiled chunks until the next `npm run build`.

| Kind | Paths |
|------|--------|
| Python `__pycache__` | `server/__pycache__/coach_lab_config.cpython-314.pyc` · `server/__pycache__/coach_lab_domain.cpython-314.pyc` · `server/routes/__pycache__/coach_lab.cpython-314.pyc` · `server/tests/__pycache__/test_coach_lab.cpython-314-pytest-9.1.1.pyc` |
| Next.js `.next` | `web/.next/server/app/admin/coach-lab` · `web/.next/server/chunks/ssr/components_admin_CoachLabPage_tsx_*.js` (+ maps) · `web/.next/server/chunks/ssr/app_admin_coach-lab_layout_tsx_*.js` (+ maps) · `web/.next/server/chunks/ssr/_next-internal_server_app_admin_coach-lab_page_actions_*.js` (+ maps) |

**Hygiene (not this packet):** `find server -name '*coach_lab*' -path '*__pycache__*' -delete` and rebuild Next before any deploy that would serve `web/.next`.

Not listed as FAIL: these are not the contracted implementation files, not importable modules, and not live source references.

---

## Verdict rationale

| Contract | Result |
|----------|--------|
| Nine implementation paths gone | **Met** |
| `layout.tsx` has no Coach Lab / `/admin/coach-lab` | **Met** |
| `server/main.py` does not import `coach_lab` | **Met** |
| `test_journal_v07` + `test_journal_sessions` + `test_ai_models` green | **Met** (81 passed) |
| Bravo live smoke if present treated as pre-existing | **Noted** (`XAI_API_KEY`) |
| No leftover runtime source refs in web+server | **Met** |

**PASS.** Solo Coach Conversation Lab implementation is backed out of source and wiring. Required characterization suite is green.

Kilo does not restore lab code and does not delete cache as part of this gate.
