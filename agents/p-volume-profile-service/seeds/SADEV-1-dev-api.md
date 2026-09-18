# SADEV-1 — Dev API over the local store

**Namespace:** `SADEV*` · **Owner:** GROK BUILD — APPS  
**Token:** `agents/go/SA-DEV-W0.md` (Coach stamp required)  
**INFRA:** do not execute.

## Intent

DEV-ONLY **mock** of frozen VP API Contract v1.1
(`Specs/VP-API-Contract-v1_1.md`, sha1 `d01b3dd9bfbac3bbcafb34110ef7d06cd6650915`) on StudioTwo. Fixture-faithful
(F1, F2, F5, F8, GAPPED, STALE, 403). Paths are the contract paths
(`/v1/profile…`, `/v1/health`). Flip `LABS_SA_DEV_VP_API_BASE` to the
live dev API when real bins serve. No shim. Collector store READ-ONLY
and not this mock’s SoR. Do not stop `:3000`/`:4000`.
