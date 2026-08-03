# M7 — Membership webhook anti-replay

**Date:** 2026-08-03  
**Verdict:** **PASS**

## Delivered

- Required `timestamp` / `sent_at` in signed JSON body  
- Max age 300s (env `LABS_WEBHOOK_MAX_AGE_SECONDS`)  
- Exact raw-body replay → 409  
- Tests: 5 passed (`test_webhook_m7.py`)  
- Docs: WooCommerce SSO guide  

## WP glue note

Senders must add `timestamp` and re-sign the body. Old bodies without timestamp → 422.
