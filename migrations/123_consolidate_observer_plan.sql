-- 123_consolidate_observer_plan.sql
-- Fix: every FatTail/0-DTE Observer member was landing on a stale 'observer' plan
-- (grants_role=observer → no Journal/Trade Log/Retrospective tools), so 37 paying
-- Observers were denied the tools the product sells them. Root cause: the SSO sends the
-- WooCommerce plan NAME "Observer Access", and a stale provider_plan_map row
-- 'Observer Access' -> observer shadowed the correct 'observer-access' -> observer-trial
-- (exact-name match wins first). seed_dev is the intended state: it has ONLY
-- observer-trial (grants navigator = full tools) and maps every observer key to it.
--
-- Bring prod in line with the seed — one consolidated Observer tier (observer-trial):
--   1. repoint every provider_plan_map row off the stale observer plan → observer-trial
--   2. move every membership off the stale observer plan → observer-trial (full access)
--   3. remove the now-unreferenced stale observer plan
-- Env-safe (matched by slug) + idempotent; a no-op where the observer plan doesn't exist
-- (e.g. local/seeded envs already have only observer-trial). memberships keep their
-- status/dates/external_ref — only the plan pointer changes. No member currently holds an
-- observer-trial membership, so repointing cannot collide.

UPDATE provider_plan_map ppm
  JOIN plans obs   ON obs.slug   = 'observer'
  JOIN plans trial ON trial.slug = 'observer-trial'
  SET ppm.plan_id = trial.id
  WHERE ppm.plan_id = obs.id;

UPDATE memberships m
  JOIN plans obs   ON obs.slug   = 'observer'
  JOIN plans trial ON trial.slug = 'observer-trial'
  SET m.plan_id = trial.id
  WHERE m.plan_id = obs.id;

DELETE p FROM plans p
  WHERE p.slug = 'observer'
    AND NOT EXISTS (SELECT 1 FROM memberships mm       WHERE mm.plan_id = p.id)
    AND NOT EXISTS (SELECT 1 FROM provider_plan_map pp WHERE pp.plan_id = p.id);
