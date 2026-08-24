# WA-2-1 — Pointer registry + GET-only pollers (Alpha)

**Plan:** GO WA-2 · depends on WA-2-0  
**Isolation:** GET existing course/help catalog HTTP APIs only. No writes to those trees.

## In scope

Migration `wiki_pointers`. Pollers synthesize `source_change` (`created`/`updated`/`retired`) with `principal=wiki-poller`. HTTP client refuses non-GET.

## Out of scope

`wiki_refs`, session API, IKI registration, MiniTwo.

## Completion

Pointer rows reconcile with poller observations. Rider 3: enumerate GET calls; diff-stat wiki-only.
