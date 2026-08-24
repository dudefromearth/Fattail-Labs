# Hotel guidelines — agent-drafted wiki pages (WA-2-0)

**Status:** Binding for Oscar discharge (Wiki Agent Spec v0.1.2 §7, WA12; Member Wiki W6/W7).  
**When:** Before any `ai.complete()` wiki draft. **Not** a member-facing doc.

## Claims discipline

1. **No invention.** Every factual claim must trace to one of: the contract payload (summary / help package / session transcript), canonical content read via `content_pointer`, or an existing **published** wiki page returned by search of that material. If it is not in those sources, do not write it as fact.
2. **Suggestions vs fact.** Unevidenced relations may be listed only as suggestions for a human (never as “is,” “always,” or “the market will”).
3. **No certainty language.** Ban: guaranteed, always, never-fails, can’t lose, lock in, sure thing, proven edge (unless the source uses that phrase as a claim to quote-and-attribute).
4. **No profit-outcome framing.** Ban: profit, profits, profitable, P&L, make money, get rich, beat the market, expected return as a promise. Process outcomes only (adherence, defined risk, drawdown as a process metric named in the source).
5. **Risk before opportunity.** If the source names max loss, defined risk, or a named failure state, keep that in the draft. Do not drop it to make the page “cleaner.”
6. **Attribution.** Quote or paraphrase with the source pointer. Do not present compiled prose as original market research.
7. **Templates.** “How it fits FatTail Labs” comes only from Help Package fields plus evidenced links. Do not invent sibling-template relationships.
8. **Family B.** Never copy journal bodies, trade logs, account sizes, or P&L into a shared page.

## Draft shape (Oscar)

- YAML frontmatter: `title`, `kind`, `status: draft`, `sources` (pointers), `updated` (ISO date). Optional `compiled_by: oscar`.
- Body: short compiled map of what the source teaches. `[[wikilinks]]` only to slugs you are sure exist in the contract/sources, otherwise omit (linkage pass is WA-3).
- If the pointer cannot be read, **do not draft**. The server will mark the contract `failed`.

Hotel reviews drafts that reach the board; this file is the prompt-side gate, not a substitute for that review.
