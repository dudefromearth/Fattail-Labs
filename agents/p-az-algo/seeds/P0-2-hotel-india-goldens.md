# Seed P0-2 — Goldens vs landed spec

**Project:** p-az-algo  
**Agent:** Hotel · India  
**Phase:** P0  
**Depends:** P0-0 GO  
**Law:** v2.2.2 sha1 `b757ba3f4b3816fcaebae857aeda70dff488ecdc` · v2.2.1 freeze `6f491ee8f240aa06418b8e813fdb3152ed60deb5`  
**Gate it feeds:** P0-G

## Intent

Confirm fixtures **1–16** still match the v2.2.1 freeze. Confirm E23/E24 did **not** move a value they depend on. Confirm **17–18** match v2.2.2 (floor (c), at-body max). Do not rewrite a number.

## Files in scope

- `agents/p-az-algo/evidence/ALGO-B-appendix-b-goldens.md` (read)  
- `agents/p-az-algo/evidence/P0-2-goldens-vs-landed-spec.md` (write)

## Out of scope

Any `web/` file. Recomputing 1–16 against v2.2.2.

## Done when

Evidence file records the freeze check and 17–18 vs E23/E24. E1 128 > 72 still holds.

## Status (2026-09-03)

**DONE.** See evidence. 1–16 arithmetic byte-identical to `596dc25`.
