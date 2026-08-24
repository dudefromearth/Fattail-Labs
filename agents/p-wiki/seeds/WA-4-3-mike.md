# WA-4-3 — Mike admin-only both layers

**Plan:** Wiki Agent v0.1.3 · **GO WA-4** · Rider 3  
**Isolation:** session endpoints + panel render gate.

## In scope

(a) Member session: panel does not render (source/DOM proof) AND session open
returns 403/404. (b) Agent bearer rejected (`session_requires_human`) on open
and accrete even with an admin cookie. (c) Admin session: full path works.
Family B URLs in `context.entity` still `family_b_ref`. Affordance GET is 404
for non-admin (do not advertise).

## Out of scope

Public read (WA-6). Changing SSO.

## Completion

Characterization tests for (a)(b)(c).
