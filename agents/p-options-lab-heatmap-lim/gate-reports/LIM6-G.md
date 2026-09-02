# LIM6-G — Docs close

**Gate:** LIM6-G  
**Delta · India · Lima** ternary  
**Date:** 2026-09-02

## Verdict

**PASS**

Parent Heatmap Templates **v0.2.4** catalogs `quadrant` + `lim`. LIM Spec v0.4.3 sha1 **unchanged** `01f638f590492520236b3607edde487b949d6016`. **DL-653**. Help + member guide quote Appendix B. K1/K2 closures on disk.

---

## K1 / K2 (before LIM6-0)

```
npx --yes tsx lib/options-lab/templates/lim.test.ts
lim.test.ts ok

npx --yes tsx lib/options-lab/templates/lim.c2.test.ts
C2 control  gex_points=5 af_rows=5 wf_display=null
C2 missing  gex_points=5 af_rows=5 wf_display=null
lim.c2.test.ts ok
C2 missing_key=LABS_LIM_BAND_CLOSE_PCT
C2 lim_html_named_key=1
```

Identical control vs missing → C2 scoping. `nearSpotMix` assignment has no `clamp(`.

```
shasum -a 1 "Specs/FatTail Labs — Heatmap LIM Template — Specification v0.4.3.md"
01f638f590492520236b3607edde487b949d6016
```

## Landed

- Parent `…-Templates-Spec-v0_2.md` **v0.2.4**
- Merge DRAFT marked **LANDED**
- Arch 29 as-built LIM row
- DL-653
- `docs/Options-Lab-Heatmap-LIM-User-Guide.md`
- `server/help_reference/options-lab-heatmap-lim.md`

## Does not

MiniTwo · `session-volume` · LIM Spec body edit (hash stays).
