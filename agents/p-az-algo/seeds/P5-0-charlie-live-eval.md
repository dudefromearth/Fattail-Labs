# Seed P5-0 — Charlie LIVE EVAL

**Project:** p-az-algo  
**Agent:** Charlie  
**Phase:** P5  
**Depends:** P2-G (math) · P3-G (surface that would tick)  
**Law:** E17 · **AT-ALGO-18**  
**Gate it feeds:** P5-G

## Intent

This phase **owns** `algoEval.ts` / `tickAlgoAlert`. Evaluate on the **live raw mark** when `algo.demo === false`. Demo remains a clock. Non-demo no-op is a **fail**.

## Files in scope

`web/lib/options-lab/algoEval.ts` (and the live tick call site it already has)

## Out of scope

Every other AT. Folding this work into P1–P4. A unit test of a stub. §14.

## Done when

P5-1 can take a **live-session transcript**.
