# Amendment AZ-VP-9-A22 — Settings Survive Everything

**Date:** 2026-09-18
**Authority:** Coach directive: all defaults and settings survive
sessions and browser resets.
**Extends:** A8.2/A9.5/A11.2/A21.2 — pins WHERE persistence lives.
Nothing struck.

## The law

1. **Server-side is the home of record:** every user setting,
   object default, mode-preset override, layer state, and dialog
   value persists in the member's Labs profile store, keyed to the
   ACCOUNT — never solely in the browser. A new browser, a cleared
   cache, or a different machine restores the member's exact
   surface on sign-in.
2. **Browser storage is a cache only** (fast rehydration per the
   A14 refresh budget): writes go through to the server (debounced
   batch is fine); the server copy wins any conflict; losing the
   browser copy loses nothing.
3. **Versioned schema:** the settings document carries a schema
   version; surface updates migrate old documents forward — a
   layout change never strands or silently discards a member's
   saved state.
4. House defaults remain versioned config on the platform side,
   not member documents (A21.2).
5. Dev/admin surfaces follow the same mechanism against the dev
   profile store — one code path, no fork (A18 spirit).

## Standing

Citable law until folded into the SA spec's next authored version.
Surface and platform work bind to A22 from this date.
