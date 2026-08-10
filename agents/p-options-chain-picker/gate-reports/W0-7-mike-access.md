# W0-7 — Mike access matrix

**Status:** PASS  

| Caller | Chain ladder |
|--------|----------------|
| Session + tool-member read | **Allow** (`_require_tool_member`) |
| Observer trial (same tool gate as other member tools) | **Allow** when gate passes |
| Free / no plan / no session | **Deny** 401/403 |

No new role invent; same matrix as other `/api/me/*` tool surfaces (DL-194 spirit).
