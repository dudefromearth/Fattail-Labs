# Charter — p-resources

**Project:** First-class versioned Resources (Resource Spec v1.0)  
**Product:** FatTail Labs (`labs.fattail.ai`)  
**Coach intent:** Materials that change often (trade logs, process infographics,
worksheets) are first-class library objects with immutable versions, a single
published cut for the member hub, and course pins that stay stable until the
creator changes them.

## Authority

| Role | Agent |
|------|--------|
| Final approval | **Coach** |
| Orchestration | **Juliet** |
| Architecture / domain | **India** |
| Backend / migrations | **Alpha** |
| Tests | **Kilo** |
| Security / download gates | **Mike** |
| Member + admin UI | **Charlie** |
| Design polish / HIG | **Echo** |
| Member honesty / labels | **Tango** |
| Gates | **Delta** |
| Decision log / docs | **Lima** |
| Deploy / private storage | **Foxtrot** (as needed) |
| Canonical package wiring | **Alpha** (CCM integration) |

## Specs & docs of record

| Doc | Path |
|-----|------|
| Spec | `Specs/FatTail-Labs-Resource-Spec-v1.0.md` |
| Prior library (as-built until cutover) | `Specs/FatTail-Labs-Resource-Library-Spec-v1.0–v1.2.md` |
| Canonical Course Model | `Specs/FatTail-Labs-Canonical-Course-Model-Spec-v1.0.md` |
| Decisions | DL-062 (+ implement approval entry when Coach green-lights build) |
| Plan | `agents/p-resources/IMPLEMENTATION-PLAN.md` |
| Board | `agents/p-resources/ORCHESTRATOR.md` |
| Design | `Architecture/10-resources-design.md` (R0 deliverable) |

## Invariants (non-negotiable)

1. **Resource** is first-class; courses **link**, they do not solely own the object.  
2. Versions are **immutable**; edit → new version.  
3. **At most one published** version; **slug → published only**.  
4. Course **always** shows linked resources at **pinned** version.  
5. Library hub lists **published only** (member-wide discovery control).  
6. **free_preview** = access; **publish** = discovery — never conflate.  
7. Private files only via gated download; fail loud on missing config/auth.  
8. No MarketSwarm code import.  
9. Evidence over assertion at every Delta gate.  
10. Change control: seeds declare exact files before touch.

## Success

- Admin and course creator can create, version, pin, and publish resources.  
- Members browse published library; courses show pins reliably after new publishes.  
- Existing attachments migrated without loss.  
- Canonical course packages use slug + optional pin.
