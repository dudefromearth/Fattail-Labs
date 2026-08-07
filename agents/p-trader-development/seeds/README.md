# Seeds — p-trader-development

Pasteable cold-start packets. **Juliet writes** full seed files after **TD0-0** (Coach GO / Spec BUILD AUTHORITY).

Until then, use the seed tables in:

- `Docs/Trader-Development-Full-Agent-Bench-Plan-v1.0.md` §5  
- `Docs/Trader-Development-Phase-*-Agent-Bench-Plan.md`

## Naming

```text
TD{phase}-{seq}-{callsign}-{slug}.md
TD{phase}-G-delta.md
```

Examples:

```text
TD0-0-coach-go.md
TD0-5-charlie-tags-chrome.md
TD0-G-delta.md
TD1-3-alpha-schema.md
TD2-5-alpha-sync-worker.md
TD3-3-charlie-journey-nudges.md
TD4-0-coach-expansion-go.md
```

## Seed template (required sections)

1. Project · agent · sequence  
2. Spec paths  
3. Files in scope / out of scope  
4. Invariants (program sacred list)  
5. Work steps  
6. Completion criteria (verifiable)  
7. Gate fed  

If a seed cannot execute from cold, it is not finished.
