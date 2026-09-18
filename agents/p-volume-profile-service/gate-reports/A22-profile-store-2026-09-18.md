# A22 profile store — settings-document path (2026-09-18)

**Machine:** StudioTwo (land) · MiniTwo read-only column check. No deploy. No bounce.

## What exists (account-keyed)

| Surface | Path | Schema version? | VP settings? |
|---------|------|-----------------|--------------|
| Options Lab Surface inspect (saved views) | `identities.surface_inspect_json` via `GET`/`PATCH /api/me/profile` (`surface_inspect`) · migration `130_surface_inspect.sql` | **No** | **No** — inspect defaults + ≤12 named views |
| Member Settings appearance/alerts | `web/lib/memberSettings.ts` `ftl.memberSettings.v1` | n/a | **No** — Spec v1.0 law is **this-device localStorage**, no API |
| VP/SA layer prefs (A8–A11) | `web/lib/saLayerStore.ts` `ft_sa_lwc_prefs_v4` | n/a | **localStorage only** |

**Dev:** route live (`server/routes/member.py`). **MiniTwo production (read-only):** column `identities.surface_inspect_json` **present** (JSON, nullable); **3** identities non-null. Unauthenticated `https://labs.fattail.ai/api/me/profile` → **401** (route is deployed).

## Gap (platform item — not a browser workaround)

A22 requires a **schema-versioned settings document** in the member Labs profile store covering object defaults, mode-preset overrides, layer state, and dialog values. That document **does not exist**.

- `surface_inspect` is a sibling (Surface inspect views). Overloading it with VP settings would fork the inspect contract and still lacks `schema_version`.
- Member Settings v1.0 and `saLayerStore` are browser-home by construction — A22 forbids that as the home of record.

**Finding:** ship a member-keyed, schema-versioned VP/SA settings document (new column or a versioned profile-store endpoint) on Labs API, same path on StudioTwo and MiniTwo. Do not treat localStorage as the SoR.

**Does not.** MiniTwo migrate/restart. Invent a client-only key. Stop StudioTwo `:3000`/`:4000`.
