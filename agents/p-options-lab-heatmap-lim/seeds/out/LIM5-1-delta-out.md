# LIM5-1 — Zero-fetch (out)

**Agent:** Delta · Kilo  
**Date:** 2026-09-02

Captured counts from `lim.zeroFetch.test.ts` (instrumented `globalThis.fetch`; subscribe counter never incremented by LIM compute):

```
LIM5-1 template_switch fetch=0 subscribe=0
LIM5-1 expiration_switch fetch=0 subscribe=0
```

`useOptionChainBus` is keyed `symbol, expiration, side, wings` — not `templateId`. LIM modules contain no `pollChainLadder` / `fetch(` / `setChainInterest`.
