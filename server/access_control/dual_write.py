"""Dual-write free_preview ↔ lesson access policy (Spec §9 / §13)."""

from __future__ import annotations

import json
from typing import Optional


def dual_write_lesson_free_preview(
    cur,
    lesson_id: int,
    free_preview: bool,
    *,
    actor_id: Optional[int] = None,
) -> None:
    """When free_preview flips, keep policy row in sync.

    free_preview True  → policy: signed-in, no plan/role constraints (any session).
    free_preview False → delete policy for lesson:{id} so type-default member gate applies.
    """
    target = f"lesson:{int(lesson_id)}"
    if free_preview:
        cur.execute(
            """INSERT INTO access_policies (
                 target_key, enabled, mode, min_role,
                 selected_plans_json, exact_plans_only, all_plans_json, deny_plans_json,
                 plan_role_combine, require_signed_in, close_behavior,
                 grandfather_enrollments, label, notes, version, updated_by
               ) VALUES (
                 %s, 1, 'hard', NULL,
                 NULL, 0, NULL, NULL,
                 'or', 1, 'default',
                 1, 'dual:free_preview', 'AC dual-write free_preview=true', 1, %s
               )
               ON DUPLICATE KEY UPDATE
                 enabled=1,
                 mode='hard',
                 min_role=NULL,
                 selected_plans_json=NULL,
                 exact_plans_only=0,
                 all_plans_json=NULL,
                 deny_plans_json=NULL,
                 require_signed_in=1,
                 label='dual:free_preview',
                 notes='AC dual-write free_preview=true',
                 version=version+1,
                 updated_by=VALUES(updated_by)""",
            (target, actor_id),
        )
        cur.execute(
            """INSERT INTO access_policy_audit
                 (target_key, actor_id, action, before_json, after_json)
               VALUES (%s, %s, 'dual_write', NULL, %s)""",
            (
                target,
                actor_id,
                json.dumps({"free_preview": True, "target_key": target}),
            ),
        )
    else:
        cur.execute("SELECT * FROM access_policies WHERE target_key = %s", (target,))
        before = cur.fetchone()
        # Only auto-delete dual-write rows; leave custom campaign policies alone
        if before and (
            (before.get("label") or "").startswith("dual:")
            or (before.get("notes") or "").startswith("AC dual-write")
        ):
            cur.execute("DELETE FROM access_policies WHERE target_key = %s", (target,))
            cur.execute(
                """INSERT INTO access_policy_audit
                     (target_key, actor_id, action, before_json, after_json)
                   VALUES (%s, %s, 'dual_write_clear', %s, NULL)""",
                (
                    target,
                    actor_id,
                    json.dumps({"free_preview": False}, default=str),
                ),
            )
