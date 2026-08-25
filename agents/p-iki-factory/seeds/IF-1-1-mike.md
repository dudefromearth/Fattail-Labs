# IF-1-1 — Admin-only Factory API (Mike)

**GO IF-1.** Depends on IF-1-0.

## In scope

`server/routes/iki_factory_admin.py` prefix `/api/admin/iki-factory`.  
Human Admin: `require_admin` / `require_human_admin_actor` for create.  
Move: human admin **or** agent with `factory:operate` (Gemba tests).  
`server/agent_auth.py` — add scope `factory:operate` only.  
Non-admin session → **403**. No cookie → **401**.  
Page `/admin/iki-factory` lives behind admin layout (no member Factory API).  
Member `/app/iki/factory` **unchanged**.

## Out of scope

`gemba` principal mint (IF-2). AppChrome. Wiki portal.

## Completion

Kilo proves 403 / 401 / agent Research→Spec 422.  
