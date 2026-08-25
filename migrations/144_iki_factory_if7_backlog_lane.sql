-- 144 — IKI Factory IF-7 (movement retrain: conveyor → pull)
-- Spec: Specs/FatTail-Labs-IKI-Factory-Pipeline-Spec-v1_0.md §2.1, §3, §7
-- GO token: agents/go/IKI-FACTORY-IF7.md — three OKs recorded, DL-539
--
-- Lane key rename deferred from IF-6: "ideas" -> "backlog" (v1.0 §2.1).
-- Data migration only — the LANES tuple and every reference live in
-- application code (server/iki_factory.py), not a DB enum/constraint.
-- Existing rows must move with the rename or they become invisible to
-- the renamed LANES tuple.

UPDATE iki_factory_cards SET lane = 'backlog' WHERE lane = 'ideas';
UPDATE iki_factory_transitions SET from_lane = 'backlog' WHERE from_lane = 'ideas';
UPDATE iki_factory_transitions SET to_lane = 'backlog' WHERE to_lane = 'ideas';

-- priority is cut as a work-item concept (v1.0 §2.2) but the column is left
-- in place, unused, at rest — dropping it is a destructive schema change
-- this GO's scope does not ask for. Existing values are harmless; no code
-- reads or writes this column anymore.
