# Seed PH1-0 — India: Domain single-source design (collaboration kickoff)

**Project:** p-practice-harden  
**Primary:** India  
**Reviewers (required):** Alpha · Charlie · Coach  
**Phase:** H1  
**Prerequisite:** H0 PASS  

## Goal

Produce a short **domain design note** (in this folder or `Architecture/`) defining:

1. Server module layout for structure key / open-on-day / realized series  
2. API contract (new routes vs enriched trade payload)  
3. Deprecation plan for client `enrichTradesWithSyntheticPnl` / dual matching  
4. What stays client-only (presentation)  

**No code** in this seed unless Coach allows a sketch.

## Collaboration / review protocol

1. India drafts design.  
2. **Alpha** feasibility APPROVED/RETURNED.  
3. **Charlie** client impact APPROVED/RETURNED.  
4. **Coach** approves any behavior/metric change surface.  
5. All three APPROVED before PH1-1 starts.  

## Completion criteria

- [x] Written design with explicit DTOs and file map  
- [x] Alpha · Charlie · Coach APPROVED  
- [x] Juliet updates board  

## Evidence (2026-07-29)

- Design: `Architecture/11-practice-domain-single-source.md`  
- Reviews: `gate-reports/PH1-0-review.md`  
- Behavior: **freeze** current client formulas (no intentional metric change)  

## Feeds

→ PH1-1 … PH1-5  

