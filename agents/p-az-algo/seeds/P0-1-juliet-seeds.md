# Seed P0-1 — Juliet seeds on disk

**Project:** p-az-algo  
**Agent:** Juliet  
**Phase:** P0  
**Depends:** P0-0 GO  
**Law:** AZ-ALGO v2.2.2 sha1 `b757ba3f4b3816fcaebae857aeda70dff488ecdc` · plan v2.0  
**Gate it feeds:** P0-G

## Intent

Write **P0–P6** seeds. Cite spec v2.2.2, goldens path, E17 P5 isolation in every later seed. v1 W0–W6 seeds stay as W1–W4 record — do not fire them for v2.

## Files in scope

`agents/p-az-algo/seeds/P*.md` · this README

## Out of scope

`web/` · `algoEval.ts` · P1 implementation

## Done when

Every packet in plan v2.0 §8 has a seed. P5 seeds name **AT-ALGO-18 as the only exit**. P1–P4 seeds list `algoEval.ts` as **out of scope (NX13)**.

## Status (2026-09-03)

**DONE** with this landing.
