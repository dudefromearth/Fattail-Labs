# LIM5-G — Acceptance pack

**Gate:** LIM5-G  
**Delta** ternary  
**Date:** 2026-09-02  
**Spec:** v0.4.3 §10 AT-LIM1–32  
**Map:** [`evidence/lim5-at-coverage.md`](../evidence/lim5-at-coverage.md)

## Verdict

**PASS**

Every AT-LIM1…32 has a coverage row pointing at an `assert`. C2 is a render test, not a registry claim. Zero-fetch counts are captured. Six FLAGS (hollow sibling lines) are named; they were not rewritten. LIM6 not started.

---

## Deliverable 1 — coverage map

33 rows (AT-LIM1–32 + **17b**) in `evidence/lim5-at-coverage.md`.

FLAGS (not FAIL): AT-LIM8 L279 constant≡constant; AT-LIM10/21 `LIM_DOT_OPACITY === 1`; AT-LIM20 interval tautology `lo !== (lo+hi)/2`; AT-LIM24 flags.ring by construction; AT-LIM26 range check does not prove no clamp. Live proofs sit on the same ids.

---

## Deliverable 2 — C2 command output

```
cd /Users/ernie/Fattail-Labs/web
npx --yes tsx lib/options-lab/templates/lim.c2.test.ts
lim.c2.test.ts ok
C2 missing_key=LABS_LIM_BAND_CLOSE_PCT
C2 gex_points=5 af_rows=5 wf_display=null
C2 lim_html_named_key=1
```

Missing `LABS_LIM_BAND_CLOSE_PCT`: frozen GEX still computes (5 points), Advanced Fly grid still builds (5 rows), Width Fit cell still computes, LIM unavailable HTML names the key (`lim_html_named_key=1`), no `process.env` dump, no `lim-dot`.

---

## Deliverable 3 — LIM5-1 zero-fetch command output

```
npx --yes tsx lib/options-lab/templates/lim.zeroFetch.test.ts
LIM5-1 template_switch fetch=0 subscribe=0
LIM5-1 expiration_switch fetch=0 subscribe=0
lim.zeroFetch.test.ts ok
```

Captured call counts, not “no fetch in the module” alone. `globalThis.fetch` instrumented; subscribe counter unused by LIM compute. Panel bus keys exclude `templateId`.

---

## Full pack (verbatim)

```
===== lim.test.ts =====
lim.test.ts ok
===== limTrail.test.ts =====
limTrail.test.ts ok
===== limQuadrant.test.ts =====
limQuadrant.test.ts ok
===== lim.vocab.test.ts =====
lim.vocab.test.ts ok
===== lim.c2.test.ts =====
lim.c2.test.ts ok
C2 missing_key=LABS_LIM_BAND_CLOSE_PCT
C2 gex_points=5 af_rows=5 wf_display=null
C2 lim_html_named_key=1
===== lim.zeroFetch.test.ts =====
LIM5-1 template_switch fetch=0 subscribe=0
LIM5-1 expiration_switch fetch=0 subscribe=0
lim.zeroFetch.test.ts ok
===== gex.limLink.test.ts =====
gex.limLink.test.ts ok
===== frozen =====
frozen gex snapshot written
panelBlock 8476169f89bfd159894a35f3018827ab8410a6e4
gexFrozenSrc c5395a14c7c4bdd64efd4306126cee8e1235b905
fixture d0f323b888c100f0d09f927316521245493a2210
diff vs e1c1ef1 BEFORE: empty
===== chainContext =====
chainContext GEX 10 tests passed
===== widthFit =====
widthFit.test.ts ok
===== AF =====
ok  advancedFly structure AT-AF1/5/16 + history pair
```

## Does not

LIM6 · quiet edits of hollow asserts · product source changes beyond tests.
