"""Knowledge-check markdown → quiz_questions import."""

from __future__ import annotations

from pathlib import Path

import course_quiz_import as cqi
import db
import identity as identity_mod
from tests.conftest import cookie_for

SAMPLE = """
# Knowledge Check — Test

## Questions

**1.** Two plus two?

- A. 3
- B. 4
- C. 5
- D. 22

---

**2.** Sky colour?

- A. Green
- B. Blue

---

## Answers

**1 — B. 4.**

Because arithmetic.

---

**2 — B. Blue.**

Usually.
"""


def test_parse_sample():
    qs = cqi.parse_knowledge_check_md(SAMPLE)
    assert len(qs) == 2
    assert qs[0]["correct"] == 1
    assert qs[0]["options"][1] == "4"
    assert "arithmetic" in (qs[0]["explanation_md"] or "").lower()
    assert qs[1]["correct"] == 1


def test_parse_pure_options_m1_file():
    root = Path(__file__).resolve().parents[2]
    path = root / "docs/Courses/Pure Options/M1 knowledge/M1-knowledge-check.md"
    if not path.is_file():
        return  # optional in slim checkouts
    qs = cqi.parse_knowledge_check_md(path.read_text(encoding="utf-8"))
    assert len(qs) == 10
    assert qs[0]["correct"] == 2  # C. 18


def test_import_api_replace(client):
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = identity_mod.get_or_create_identity(
                cur, "zztest-quiz-import@labs.test", "Quiz Import"
            )
            cur.execute(
                "UPDATE identities SET role_override = 'administrator' "
                "WHERE identity_id = %s",
                (iid,),
            )
            cur.execute(
                """SELECT l.id FROM lessons l
                   JOIN modules m ON m.id = l.module_id
                   JOIN courses c ON c.id = m.course_id
                   WHERE c.slug = 'pure-options' AND m.slug = 'see-it'
                   ORDER BY l.sort_order LIMIT 1"""
            )
            row = cur.fetchone()
            if not row:
                return
            # use a dedicated throwaway quiz lesson
            mid = None
            cur.execute(
                """SELECT m.id FROM modules m
                   JOIN courses c ON c.id = m.course_id
                   WHERE c.slug = 'pure-options' AND m.slug = 'see-it'"""
            )
            mid = cur.fetchone()["id"]
            lid = cqi.ensure_quiz_lesson(
                cur,
                module_id=int(mid),
                title="ZZ Test Knowledge Check",
                slug="zz-test-knowledge-check",
                body_md="test",
            )
            cqi.replace_lesson_questions(
                cur, lid, cqi.parse_knowledge_check_md(SAMPLE)
            )

    cookies = cookie_for("administrator", iid)
    try:
        r = client.put(
            f"/api/admin/lessons/{lid}/questions/import",
            cookies=cookies,
            json={"markdown": SAMPLE, "replace": True},
        )
        assert r.status_code == 200, r.text
        assert r.json()["imported"] == 2

        r = client.get(
            f"/api/admin/lessons/{lid}/questions",
            cookies=cookies,
        )
        assert r.status_code == 200
        assert len(r.json()["questions"]) == 2
    finally:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM quiz_questions WHERE lesson_id = %s", (lid,))
                cur.execute("DELETE FROM lessons WHERE id = %s", (lid,))
                cur.execute(
                    "DELETE FROM identities WHERE identity_id = %s", (iid,)
                )
