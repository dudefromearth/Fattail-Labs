# FatTail Labs — Platform Email + Intent Auth Gate v0.1

**Scope statement (doctrine, 2026-08-22)**
- **Home:** platform identity (Identity-Access / Accounts & Capital). **Not IKI Lab.**
- **Touches:** this spec (new); **DL-543**; cites **DL-540** (IKI has zero auth).
- **Touches outside this spec:** **NONE seeded.** No IKI code, no `iki_public`, no IKI middleware, no IKI-specific WebSocket door.

**Status:** DRAFT v0.1 — **named gate, not seated for implementation.** Coach (2026-08-22): email + intent “will be taken care of at a completely different level.”
**Date:** 2026-08-22
**Canonical filename:** `Specs/FatTail-Labs-Platform-Email-Intent-Auth-Gate-Spec-v0_1.md`
**Parents:** Identity-Access Spec v1.0 · Public Data Service / IKI PDS (contact + declared intent as *price*, not as an IKI session mint)

---

## 0. Coach's intent (verbatim in intent)

> OD-TR4: auth is correct.

IKI-P1 (withdrawn as an IKI packet, **DL-540** / **DL-537**): email + structured intent · consent recorded · no dark patterns · one-click unsubscribe · no anonymous WS.

This spec **keeps that gate**. It does not keep it as IKI Lab identity.

---

## 1. What this gate is

A **platform authentication gate**: email + **structured intent** (a choice, not free text) mints a Labs session the same way other auth paths do — `ft_session`, Identity-Access roles/plans, one identity per email.

It is the door public IKI *views* (when OD-WK7 / OD-PDS10 exist) and any other public Labs surface will consume. IKI Lab **does not** implement, mint, or special-case it. IKI consumes the shared `/app/*` guard only (**DL-540**).

| This gate | Not this gate |
|-----------|----------------|
| Platform identity | IKI Lab feature |
| Email + structured intent | Free-text intent |
| Consent recorded; one-click unsubscribe | Dark patterns |
| Session the WS door already accepts | Anonymous WS |
| Identity-Access roles (no `iki_public`) | A new IKI role |

## 2. Laws

1. **Not IKI.** No `iki_public`. No IKI-specific magic link. No IKI middleware.
2. **Intent is structured** — segmentation key, not a comment box (PDS).
3. **Consent is recorded.** One-click unsubscribe. No dark patterns.
4. **No anonymous WS.** A session exists, or the socket does not.
5. **Implementation is a later Identity-Access packet**, not Wiki W1 and not IKI-P1.

## 3. Open

Owner: Identity-Access / Accounts & Capital. Not seeded on `agents/p-wiki-v12/` or `agents/p-iki-lab/`.
