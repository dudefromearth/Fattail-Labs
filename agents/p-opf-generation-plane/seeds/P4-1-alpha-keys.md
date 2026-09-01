# Seed P4-1 — Alpha listed key parse

**Project:** OPF Generation Plane  
**Agent:** Alpha  
**Depends:** P2-G (three OKs already spent on `keys.py` allowlist)  
**Law:** GP18 · GP18a · AT-GP22  
**Files:** `server/opf/keys.py` · tests  
**Out:** `w0` as listed marker · breaking `I:SPX` parse · changing legacy single-side

## Ask

```
LadderTopic += book: "wings" | "listed"
               wings: int | None   # None when listed
```

`bus_ladder_key(..., book=)`. End-anchored. `mb:ladder:I:SPX:2026-09-01:listed:dual` → listed, wings None. `…:w15:dual` still parses with `I:SPX` intact. Non-ladder → None.

This is the one existing OPF module the spec modifies for the listed token.

## Done when

AT-GP22 green.
