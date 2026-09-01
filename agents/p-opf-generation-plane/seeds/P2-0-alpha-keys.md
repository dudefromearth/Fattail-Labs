# Seed P2-0 — Alpha listed key parse (gated alone)

**Project:** OPF Generation Plane  
**Agent:** Alpha  
**Depends:** W0-G · **three DL-539 OKs** · P1b-G not required  
**Law:** GP18 · GP18a · AT-GP22 · errata E3  
**Files:** `server/opf/keys.py` · tests  
**Out:** hydrator · listed writer · `w0` as listed marker · breaking `I:SPX` parse · changing legacy single-side · inline f-strings in new call sites

## Ask

```
LadderTopic += book: "wings" | "listed"
               wings: int | None   # None when listed
```

`bus_ladder_key(..., book=)`. End-anchored. `mb:ladder:I:SPX:2026-09-01:listed:dual` → listed, wings None. `…:w15:dual` still parses with `I:SPX` intact. Non-ladder → None. `w0` rejected as a listed marker.

**Gated before any hydrator work.** A silent `None` from `parse_ladder_topic` would hide listed keys from the hydrator.

## Done when

Kilo P2-0. Delta P2-0-G on **AT-GP22 alone**.
