# Native apply — ship path

**Spec:** `Specs/FatTail-Native-Apply-Form-Spec-v0.1.md`  
**Decision:** **DL-451** · **DL-452** · **DL-455**  
**Public URL (Coach):** `https://fattail.ai/apply`  
**Host:** **open** (OQ-1). This file is a way to ship, not a host lock.

---

## What is in the repo

| Piece | Path | Job |
|-------|------|-----|
| Page | `web/app/apply/page.tsx` | Native fattail invite. One question at a time. Quiet canvas. |
| Form | `web/components/ApplyForm.tsx` | Conversation invite (**DL-453**). Accept sits **next to the field** (**DL-454**): click / tap / Enter / Tab. Two motion beats. Last live question goes to **Review** (**DL-455**). POST `/api/apply` only from Review Accept. |
| Write | `server/apply_ac.py` | Upsert contact → write field ids **3–9** → tag **18** → read back. Raises on any miss. |
| HTTP | `POST /api/apply` | Public. 422 on missing email / missing Cole field. **503** if AC is unset, half-configured, or the seven write / tag 18 miss. |
| Waitlist | `server/activecampaign.py` `sync_lead()` | **Not** this path. Leave it alone. |

Live ids **3–9** stay. Keys stay `HELL`, `HEAVEN`, `MONEY_TIMING`, `COACHING_SKU`, `ELEVEN_AM_ET`, `TRIED`, `PARTNER_SUPPORT`. Fields 6/7/9 have empty option lists — the form is free text. Echo owns labels.

---

## Config (API host)

Same shared FatTail / 0-DTE account as waitlist. Apply **does not skip**.

```
LABS_AC_API_URL=https://0dte.api-us1.com
LABS_AC_API_TOKEN=<AC Settings → Developer → API Token>
```

Half-config fails loud. Unset fails the submit (503). Waitlist behavior is unchanged.

---

## After this PR is deployed

1. **Labs route exists:** `https://labs.fattail.ai/apply` is a real submit surface.
2. **Brand URL is still 404** until Foxtrot routes it: `https://fattail.ai/apply` (WordPress has no apply slug today).
3. Evidence of done is ActiveCampaign `fieldValues` on ids 3–9 **and** tag 18 on that contact — not a thank-you screenshot alone.

---

## Ways to put `/apply` on fattail.ai (pick later — OQ-1)

Any of these is a ship. None of them is locked here.

### A. MiniThree proxy (page + API same origin)

On the **fattail.ai** nginx server block, proxy the page and the write so the browser stays on fattail.ai:

```nginx
# Proposed only — Foxtrot applies. Not a host lock.
location = /apply {
    proxy_pass https://labs.fattail.ai/apply;
    proxy_set_header Host labs.fattail.ai;
    proxy_set_header X-Forwarded-Host $host;
    proxy_ssl_server_name on;
}
location = /api/apply {
    proxy_pass https://labs.fattail.ai/api/apply;
    proxy_set_header Host labs.fattail.ai;
    proxy_set_header X-Forwarded-Host $host;
    proxy_ssl_server_name on;
}
```

Add `https://fattail.ai` to `LABS_CSRF_ORIGINS` if the POST is cross-origin. Same-origin proxy (this snippet) does not need that.

### B. WordPress redirect

301 or 302 `https://fattail.ai/apply` → `https://labs.fattail.ai/apply`. The form still writes. The public URL is no longer 404. Coach’s URL then lands on Labs.

### C. Stay on Labs until Foxtrot picks

Ship the form at `labs.fattail.ai/apply` and point the desk there. Brand URL stays 404 until A or B.

---

## Verify (not “it should work”)

```bash
# After AC env is set on the API process:
curl -sS -X POST https://labs.fattail.ai/api/apply \
  -H 'Content-Type: application/json' \
  -d '{
    "email":"zztest-apply@fattail.test",
    "HELL":"probe hell",
    "HEAVEN":"probe heaven",
    "MONEY_TIMING":"probe timing",
    "COACHING_SKU":"probe sku",
    "ELEVEN_AM_ET":"yes",
    "TRIED":"probe tried",
    "PARTNER_SUPPORT":"probe partner"
  }'
# Expect: {"ok":true,"contact_id":"...","tag_id":"18"}
# Then read the contact in AC: fieldValues 3–9 non-empty + tag 18 Application Filled.
```

Forced miss (unset token, or mock tag miss) must **not** return `ok: true`.
