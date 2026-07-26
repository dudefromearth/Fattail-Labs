# Seed R6 — Alpha: Cutover off attachments library path

**Project:** p-resources  
**Agent:** Alpha · Delta  
**Phase:** R6  
**Prerequisite:** R4 + R3a/R3b  

## Files in scope

- Admin attachment create used by library/course  
- `GET /api/resources` legacy branch removal  
- Dead code paths  

## Work

1. Stop writing new library resources as raw course attachments.  
2. Member + admin hub only new tables.  
3. Document residual attachment use if any (none preferred).  
4. Delta evidence: single source of truth.  

## Completion

- [ ] No dual list merge in production path  
- [ ] pytest green  

## Gate

Feeds R7.