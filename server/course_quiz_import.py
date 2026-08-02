"""Import knowledge-check markdown into quiz_questions for a lesson.

Author format (Pure Options / course-knowledge-check packages)::

    ## Questions

    **1.** Prompt text…

    - A. option
    - B. option
    …

    ## Answers

    **1 — C. Label.**

    Explanation paragraph(s)…

    ---

Supports multiple_choice (A/B/C/D…) only for v1. Fail loud on unparseable items.
"""

from __future__ import annotations

import json
import re
from typing import Any

# **1.** at line start — only capture number so option lines stay in the chunk
_Q_HEAD = re.compile(r"^\*\*(\d+)\.\*\*\s*", re.MULTILINE)
# **1 — C. …**  or  **1 — C**
_A_HEAD = re.compile(
    r"^\*\*(\d+)\s*[—–\-.:]\s*([A-Za-z])(?:\.\s*(.*?))?\*\*\s*$",
    re.MULTILINE,
)
_OPT = re.compile(r"^[\-\*]\s*([A-Za-z])\.\s+(.*)$")


class QuizImportError(ValueError):
    """Parse or validation failure — map to 422."""


def _split_sections(md: str) -> tuple[str, str]:
    text = (md or "").replace("\r\n", "\n").strip()
    if not text:
        raise QuizImportError("Empty markdown")
    m_ans = re.search(r"^##\s+Answers\s*$", text, re.MULTILINE | re.IGNORECASE)
    m_q = re.search(r"^##\s+Questions\s*$", text, re.MULTILINE | re.IGNORECASE)
    if m_q and m_ans and m_ans.start() > m_q.start():
        q_body = text[m_q.end() : m_ans.start()].strip()
        a_body = text[m_ans.end() :].strip()
        return q_body, a_body
    if m_ans:
        return text[: m_ans.start()].strip(), text[m_ans.end() :].strip()
    raise QuizImportError(
        "Markdown must include an ## Answers section (and preferably ## Questions)"
    )


def _parse_questions_block(q_body: str) -> dict[int, dict[str, Any]]:
    # split: [preamble, num, chunk, num, chunk, ...]
    parts = _Q_HEAD.split(q_body)
    if len(parts) < 3:
        raise QuizImportError("No questions found (expected **1.** … style heads)")
    out: dict[int, dict[str, Any]] = {}
    i = 1
    while i + 1 < len(parts):
        num = int(parts[i])
        chunk = parts[i + 1]
        lines = chunk.split("\n")
        prompt_bits: list[str] = []
        options: list[str] = []
        for line in lines:
            raw = line.rstrip()
            stripped = raw.strip()
            if not stripped or stripped == "---":
                continue
            om = _OPT.match(stripped)
            if om:
                options.append(om.group(2).strip())
                continue
            if options:
                # continuation of last option
                options[-1] = (options[-1] + " " + stripped).strip()
            else:
                prompt_bits.append(stripped)
        prompt = "\n".join(prompt_bits).strip()
        if not prompt:
            raise QuizImportError(f"Question {num}: empty prompt")
        if len(options) < 2:
            raise QuizImportError(
                f"Question {num}: need ≥2 options (- A. …), found {len(options)}"
            )
        out[num] = {
            "kind": "multiple_choice",
            "prompt_md": prompt,
            "options": options,
            "sort_order": num - 1,
        }
        i += 2
    return out


def _parse_answers_block(a_body: str) -> dict[int, dict[str, Any]]:
    out: dict[int, dict[str, Any]] = {}
    for m in _A_HEAD.finditer(a_body):
        num = int(m.group(1))
        letter = m.group(2).upper()
        start = m.end()
        nxt = _A_HEAD.search(a_body, start)
        end = nxt.start() if nxt else len(a_body)
        expl = a_body[start:end].strip()
        expl = re.sub(r"^---\s*", "", expl).strip()
        expl = re.sub(r"\s*---\s*$", "", expl).strip()
        out[num] = {
            "correct_letter": letter,
            "explanation_md": expl or None,
            "answer_label": (m.group(3) or "").strip() or None,
        }
    if not out:
        raise QuizImportError(
            "No answers found (expected **1 — C. …** style heads under ## Answers)"
        )
    return out


def parse_knowledge_check_md(md: str) -> list[dict[str, Any]]:
    """Return list of question payloads ready for _validate_question / DB insert."""
    q_body, a_body = _split_sections(md)
    questions = _parse_questions_block(q_body)
    answers = _parse_answers_block(a_body)
    q_nums = sorted(questions.keys())
    a_nums = sorted(answers.keys())
    if q_nums != a_nums:
        raise QuizImportError(
            f"Question/answer number mismatch: questions={q_nums} answers={a_nums}"
        )
    result: list[dict[str, Any]] = []
    for n in q_nums:
        q = questions[n]
        a = answers[n]
        letter = a["correct_letter"]
        idx = ord(letter) - ord("A")
        if idx < 0 or idx >= len(q["options"]):
            raise QuizImportError(
                f"Question {n}: answer letter {letter} out of range "
                f"(options A–{chr(ord('A') + len(q['options']) - 1)})"
            )
        result.append(
            {
                "kind": "multiple_choice",
                "prompt_md": q["prompt_md"],
                "options": q["options"],
                "correct": idx,
                "explanation_md": a["explanation_md"],
                "sort_order": q["sort_order"],
            }
        )
    return result


def replace_lesson_questions(cur, lesson_id: int, questions: list[dict[str, Any]]) -> int:
    """Delete existing quiz_questions for lesson; insert new. Returns count."""
    cur.execute("SELECT id, kind FROM lessons WHERE id = %s", (lesson_id,))
    row = cur.fetchone()
    if not row:
        raise QuizImportError(f"Lesson {lesson_id} not found")
    if row["kind"] != "quiz":
        raise QuizImportError(
            f"Lesson {lesson_id} kind is {row['kind']!r}; must be 'quiz' to import questions"
        )
    cur.execute("DELETE FROM quiz_questions WHERE lesson_id = %s", (lesson_id,))
    for i, q in enumerate(questions):
        cur.execute(
            """INSERT INTO quiz_questions
                 (lesson_id, sort_order, kind, prompt_md, options_json,
                  correct_json, explanation_md)
               VALUES (%s, %s, %s, %s, %s, %s, %s)""",
            (
                lesson_id,
                int(q.get("sort_order", i)),
                q["kind"],
                q["prompt_md"],
                json.dumps(q["options"]) if q.get("options") is not None else None,
                json.dumps(q["correct"]),
                q.get("explanation_md"),
            ),
        )
    return len(questions)


def ensure_quiz_lesson(
    cur,
    *,
    module_id: int,
    title: str,
    slug: str,
    body_md: str | None = None,
) -> int:
    """Return lesson id; create quiz lesson if missing (by slug in module)."""
    cur.execute(
        "SELECT id, kind FROM lessons WHERE module_id = %s AND slug = %s",
        (module_id, slug),
    )
    row = cur.fetchone()
    if row:
        if row["kind"] != "quiz":
            cur.execute(
                "UPDATE lessons SET kind = 'quiz' WHERE id = %s",
                (row["id"],),
            )
        if body_md is not None:
            cur.execute(
                "UPDATE lessons SET body_md = %s WHERE id = %s",
                (body_md, row["id"]),
            )
        return int(row["id"])
    cur.execute(
        "SELECT COALESCE(MAX(sort_order), -1) + 1 AS nxt FROM lessons WHERE module_id = %s",
        (module_id,),
    )
    nxt = cur.fetchone()["nxt"]
    cur.execute(
        """INSERT INTO lessons
             (module_id, slug, title, sort_order, kind, free_preview, body_md)
           VALUES (%s, %s, %s, %s, 'quiz', 0, %s)""",
        (module_id, slug, title, nxt, body_md),
    )
    return int(cur.lastrowid)
