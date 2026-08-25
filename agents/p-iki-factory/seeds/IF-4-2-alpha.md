# IF-4-2 — Deploy transaction (Alpha)

**GO IF-4.** **B5** = Factory Live record (not Runner).

Conveyor Build→Live when Built-ready + product type/tier/free-vs-paid + not Hold. Missing product spec → stay Build, `waiting for product spec`. Hold skip/resume.

On Deploy (conveyor or Admin Advance): Live record + Woo create + store visibility + publication hash + `live_at`. Notify owner. Visible auto-move reason.

`GET /api/iki-factory/publication-signal` — Live only; `id`, `title`, `live_at`, `content_hash`. No `source_kind`, no envelope, no wiki contract id.

Member `GET /api/iki-factory/live` — Live only. Non-Live 404 / omitted.

No Wiki import. No `web/lib/runner/**`.

## Completion

Kilo: missing spec stays; Hold; Live + Woo mock + signal; Woo fail stays Build; non-Live not member-listed; zero wiki files / envelopes.
