# AC1-1 — India + Alpha: Target model constants

**Project:** p-access-control  
**Agents:** Alpha (impl) · India (sign-off)  
**Date:** 2026-08-02  
**Seed:** `seeds/AC1-1-india-alpha-model.md`  
**Spec:** Access Control v0.4 BUILD AUTHORITY  

---

## Verdict: **APPROVED**

---

## Deliverables

| Item | Path / result |
|------|----------------|
| Package | `server/access_control/` |
| Constants | `constants.py` — plan buckets, ungateable, data-bearing, `expand_plans` |
| Keys | `keys.py` — parse / validate / build |
| Defaults | `defaults.py` — TYPE_DEFAULTS per TargetKind |
| Tests | `server/tests/test_access_control_keys.py` — **13 passed** |
| Decision log | DL-199 |

### Target key grammar (locked)

| Kind | Pattern |
|------|---------|
| surface | `surface:{name}` |
| app | `app:{slug}` |
| course / module / lesson / resource | `{kind}:{positive_int_id}` |
| campaign | `campaign:{slug}:{part}` |

### Plan buckets

| Bucket | Slugs | In expand? |
|--------|-------|------------|
| Observer | `observer-trial` | commercial chain |
| Activator | `activator`, `labs-membership` | commercial |
| Navigator | `navigator` | commercial |
| Coaching | `coaching` | commercial |
| Alumni | `courses-alumni` | **never** via expand |

### Type defaults (§6.3)

Surfaces open + feature_gate compat; course/module open; lesson/resource as-built (session + free_preview / member content); app as-built + data floor flag; campaign **fail_closed**.

---

## Evidence

```text
$ cd server && .venv/bin/python -m pytest tests/test_access_control_keys.py -q
.............                                                            [100%]
13 passed, 1 warning in 0.02s
```

Import check: `import access_control` OK; `expand_plans({"observer-trial"})` includes navigator/coaching/activator.

---

## India sign-off

1. Grammar matches AC0-1 binding note — **APPROVED**  
2. Expand-at-eval pure function; alumni non-commercial — **APPROVED**  
3. Type default kinds cover all TargetKind with fail-loud `default_for_kind` — **APPROVED**  
4. No DDL / HTTP / MSC — in scope — **APPROVED**  

**India: APPROVED** → feeds AC1-2 schema.

---

## Completion checklist

- [x] Package imports cleanly under `server/`  
- [x] India APPROVED on keys + defaults + plan buckets  
- [x] Unit-testable pure functions (no DB)  
