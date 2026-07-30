# Seed JS0-3 — Mike: Private media + agent attribution

**Project:** p-journal-session  
**Primary:** Mike  
**Reviewers:** India  
**Phase:** J0  
**Prerequisite:** none (JS0-1 schema context helpful)

## Goal

1. **D4** private media contract: store path, auth, no public URL, export+purge, Family B.  
2. **D7** service attribution `agent_service=labs-journal-session` until full P2 principals.  
3. Isolation: session cookie owns writes; never body identity_id.

## Files in scope

- `Specs/FatTail-Labs-Journal-Session-Spec-v0.2.md` (§3 D4/D7, §11.2–11.3, §14 attachments)  
- `Architecture/00-decision-log.md`  

## Out of scope

Implementation code (J5/J3); D5 demo; Foxtrot ops detail beyond config-root fail-loud (JS5-1).

## Invariants

- Family B isolation · `identity_id` only · no MSC · PD-8 no admin back door.  
- Config fail loud for media root when routes enabled.  
- Secrets never in export JSON or client bundles.

## Completion criteria

- [x] D4 APPROVED | RETURNED with required design  
- [x] D7 APPROVED  
- [x] Attack notes for J1/J3/J5 tests listed  

## Feeds

→ JS0-G · JS1-1 · JS3-1 · JS5-1 · JS5-2 · JS6-*  

---

## Evidence (2026-07-29 — Mike JS0-3 · India co-sign)

### Verdict: **APPROVED**

### D4 — private media contract: **LOCKED · APPROVED**

Normative Spec **§11.2**. Summary:

| Concern | Decision |
|---------|----------|
| Store | **Separate** Family B root (`LABS_JOURNAL_MEDIA_DIR` or equiv); **not** course `uploads/private` / `private:` / `/api/media/` |
| Layout | `{root}/{identity_id}/{uuid_or_hash}{ext}`; DB `storage_key` opaque |
| Auth | `ft_session` only; `identity_id` from claims **never** body; owner match or **404** |
| Public URL | **Forbidden** permanent URL; v1 = cookie-authenticated stream; optional HMAC later |
| Types/size/cap | png/jpeg/webp; config max bytes; ≤5 per entry |
| Closed/sealed | **409** new attachments |
| Export | binaries + metadata via `export_ref`; no filesystem paths |
| Purge | DB rows + unlink binaries; membership kept |
| Journey | never public / never aggregate raw media |
| Admin | PD-8 — no Family A back door |

**As-built reuse check:** course private tier (`admin.upload_media?private=true`) is **wrong ACL family** — documented separation table in §11.2.

### D7 — agent attribution: **LOCKED · APPROVED**

Normative Spec **§11.3**.

| Rule | Value |
|------|--------|
| `author=agent` | `agent_service` **must** be `labs-journal-session` |
| `author=member` | `agent_service` **must** be NULL |
| ACL | Member `session.identity_id` always |
| Client | Cannot self-assert agent author to escalate |
| Audit | Every agent turn audited (subject + session + service) |
| P2 | Add principals later without re-keying service string |

Coach owns product agent enablement config; D7 owns attribution shape only.

### Isolation (writes)

- Session cookie is sole subject authority for session/message/attachment writes.  
- Body `identity_id` ignored or rejected if present (domain must not trust it).  
- Cross-member `session_id` → 404.

### India co-sign (reviewer)

| Check | Verdict |
|-------|---------|
| Family B vs course private tier separation | **APPROVED** — no wrong-store reuse |
| Schema §14 attachments SoR for J5 | **APPROVED** — J1 may omit table |
| D7 columns already in messages sketch | **APPROVED** — constraints clarified |
| Product boundary (no MSC media) | **PASS** |
| Dual-read / D1–D3 unaffected | **PASS** |

### Attack notes (tests — Kilo/Alpha · J1 / J3 / J5)

**J1 (sessions/messages)**

1. Create session without cookie → **401**.  
2. Free no-plan create → **403**.  
3. Body supplies another member’s `identity_id` → ignored; row is caller’s only.  
4. GET/PATCH other identity’s `session_id` → **404**.  
5. Client POSTs `author=agent` on member message path → server rejects or forces `member` (no agent escalate).  
6. After seal, append message → **409**.

**J3 (agent)**

7. Agent mode off / missing config → fail loud (no silent mock agent).  
8. Agent turn written with wrong/missing `agent_service` → domain rejects.  
9. Forged client body `author=agent` without server agent path → **403/422**.  
10. Agent turn for session owned by identity B while cookie is A → **404**.  
11. Audit row exists per agent turn (characterization).  
12. Validator double-fail → form path; no agent-filled required fields.

**J5 (media)**

13. Unauthenticated GET bytes → **401**.  
14. Authenticated GET other member’s attachment id → **404**.  
15. Upload to other’s session_id → **404**.  
16. No `public` URL in JSON; `storage_key` not returned to client (or not usable as URL).  
17. Admin session cannot stream journal binary (PD-8) → **403/404**.  
18. Wrong content-type → **422**; oversize → **422**; 6th attachment → **422**.  
19. Upload on sealed session / closed date → **409**.  
20. Purge removes DB + file; export zip contains bytes; re-import additive new keys.  
21. Path traversal / `../` in storage_key handling → rejected.  
22. Object under course `uploads/private` never used as journal store.

### Spec edits this seed

1. D4 / D7 → LOCKED  
2. §11.2 private media contract  
3. §11.3 agent attribution  
4. §14 attachments expanded  
5. §19 draft: D1–D4 · D7 locked; D5 open  

### Required follow-ons (not RETURN)

| Item | Owner seed |
|------|------------|
| Implement store + routes | JS5-1 Mike·Foxtrot · JS5-2 Alpha |
| Agent write path + constant | JS3-1 Alpha·Mike |
| Purge/export binaries | JS6-1 · JS6-2 |
| D5 is_demo | JS0-4 |
| Characterization of attack list | JS1-5 · JS3-4 · JS5-4 |
