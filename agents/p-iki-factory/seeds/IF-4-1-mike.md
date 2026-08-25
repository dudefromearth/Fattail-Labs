# IF-4-1 — Woo product create (Mike)

**GO IF-4.**

Labs → WP **POST** `/products` using `LABS_WOO_API_URL` + consumer key/secret Basic auth (same store as Progress GET). Fail-loud if config missing **at Deploy** (card failed/blocked; do not abort API boot). Write scope required for Factory; Progress remains GET. No Stripe. No HMAC invention on outbound REST — inbound webhooks stay HMAC.

Idempotent SKU `ftl-iki-{card_id}`. Status `publish`, `catalog_visibility=visible`. Type `subscription`. Free → price `0`. Paid → do **not** invent a dollar amount; send type/tier/paid as meta. Woo 4xx/5xx stops the belt with the reason. No `contracts:deliver`.

## Out of scope

Wiki. Runner. MiniTwo secrets rotation unless Coach names it.
