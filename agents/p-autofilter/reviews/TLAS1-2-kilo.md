# TLAS1-2 — Kilo

**Date:** 2026-08-25

```
cd web && npx --yes tsx lib/autofilter/apply.test.ts
→ ok
cd web && npx --yes tsx lib/tradeLogAutofilter.test.ts
→ ok  (order, S2, S3, O2 labels)
cd web && npx --yes tsx lib/tradeLogAutofilter.tlf2.test.ts
→ ok  (strategy key present; expiry/account/adherence/right/entry_source absent)

npx playwright test e2e/trade-log-autofilter.spec.ts e2e/trade-log-find.spec.ts
→ 5 passed  (S1 order Exec time · Campaign · Strategy · Symbol · Status; S5 Find and Badge)
```

S6 Help not this packet.
