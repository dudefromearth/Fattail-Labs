# Seed PH4-1 — Charlie: Blotter virtualization / pagination (if GO)

**Project:** p-practice-harden  
**Primary:** Charlie  
**Reviewers (required):** Echo · Kilo  
**Phase:** H4  
**Prerequisite:** PH4-0 GO  

## Goal

Virtualize or paginate Trade Log blotter **without wrong data** (selection, deep link
scroll-to-id still correct).

## Files in scope

- Trade Log table components  
- Possibly API client page params  

## Behavior change

Yes — load pattern may change; must preserve visible correctness of open books.

## Collaboration / review protocol

1. Charlie implements.  
2. **Echo** — HIG scroll/selection.  
3. **Kilo** — correctness under partial load.  

## Completion criteria

- [ ] Deep link still selects/scrolls  
- [ ] Echo · Kilo APPROVED  
- [ ] Evidence of improved load without wrong rows  

## Feeds

→ PH4-G  
