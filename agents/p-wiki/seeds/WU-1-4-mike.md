# WU-1-4 — Mike admin-only both layers

**Plan:** Wiki Spec v0.2.1 III.3 · **GO WU-1**  
**Isolation:** session endpoints + panel render gate.

## Proof

(a) Non-admin: panel `return null`; affordance GET 404; session open 403/404.  
(b) Agent bearer `session_requires_human` on open and accrete.  
(c) Admin: full path. Launcher ≠ Help. Family B still rejected.
