# GC5-G — AT-GC1…14

**Delta** · 2026-09-18 · **PASS**

```
cd web && npx --yes tsx lib/options-lab/templates/gexCal.test.ts
# gexCal.test.ts PASS
cd web && npx --yes tsx lib/options-lab/templates/gexCal.vocab.test.ts
# gexCal.vocab.test.ts PASS
cd web && npx --yes tsx lib/options-lab/templates/gex.frozenSnapshot.ts
# diff vs e1c1ef1 BEFORE: empty
cd web && npx --yes tsx lib/options-lab/templates/lim.c2.test.ts
# lim.c2.test.ts ok
```

AT-GC1…5, 8–10, 13, 14, 6 (flag off), 7, 11 on fixtures. AT-GC12 by construction (no new Massive module). AT-GC3 spot row. Chrome AT-GC6 live switcher requires flag=1 on StudioTwo — mechanism tested; production flag remains off until Coach sets env.
