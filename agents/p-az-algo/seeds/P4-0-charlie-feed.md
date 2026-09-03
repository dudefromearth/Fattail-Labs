# Seed P4-0 — Charlie Trader Feed allowlist

**Project:** p-az-algo  
**Agent:** Charlie  
**Phase:** P4  
**Depends:** P3-G  
**Law:** E12 · E16 · TF host `algo-reason` · AT-ALGO-R1…R8 · AT-ALGO-32  
**Gate it feeds:** P4-G

## Intent

Mount TF host `algo-reason`. Model receives **only** Spec §10.1 allowlist fields. No recommendation, target, or probability.

## Out of scope

`algoEval.ts` (**NX13**). Hold/fold advice. AT-ALGO-18.

A Feed post is not live-eval evidence.
