# SODP0-W0 — StudioOne Data Plane · GO token (intake / review)

**Machine:** StudioTwo (documents, Advisor). StudioOne only when a later packet names it **and** carries **CP-1**. MiniTwo not this tree until SODP4.  
**Board:** `agents/p-studioone-data-plane/`  
**Date:** 2026-09-19  
**Status:** **STAMPED for intake review** — Coach directed a full-bench plan plus architecture and design of the entire system (2026-09-19). Spec remains **DRAFT**. **Not** a data-plane build GO. **Not** a fill repair.

## Authority

- Plan: `docs/StudioOne-Data-Plane-Full-Agent-Bench-Plan-v1.0.md`
- Spec: `Specs/FatTail-Labs-StudioOne-Data-Plane-Spec-v0_1.md`
- Arch: `Architecture/36-studioone-data-plane.md`
- Design: `Architecture/36-studioone-data-plane-design.md`

## First gate (SODP0-G)

India → Echo+Tango → Foxtrot → Mike on the review object. Juliet does not start SODP2 (StudioOne history) until Coach stamps BUILD and `SODP2-W0`.

## Hard holds

- TS-1: do not repair `_aggs_price_fill`.
- CP-1 on every StudioOne packet.
- D6 / D7 / D8 stay open.
- ES/MES model ACTIVE blocked on VPS Q1.
- Product Labs (MySQL/SSO/courses) stays MiniTwo until Coach stamps SODP-LABS.
- REQ-001 / 002 / 003 OPEN. No "done" before AP-1.
- Hardening (SODP-H) is **after** the move + AP-1. Do not streamline SODP2–6.
