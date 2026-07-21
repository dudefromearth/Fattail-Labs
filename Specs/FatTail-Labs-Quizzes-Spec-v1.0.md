# FatTail Labs — Quizzes Spec v1.0

**Status:** Approved as built (2026-07-21)
**Parent spec:** §5.3 (player) · Progress Tracking spec (completion) · `/me` page
reserved the Quiz Results home (Enrollment Records spec §5.3)

---

## 1. Model

- **A quiz is a lesson kind** (`lessons.kind = 'quiz'`) — it lives in a module, is
  ordered, access-gated, and completion-counted exactly like any lesson. No parallel
  container.
- Question kinds (migration 004, `quiz_questions`):
  - `multiple_choice` — prompt + 2..N options, one correct index
  - `binary` — prompt, True/False
  - `short_answer` — prompt + list of acceptable answers (server-graded:
    trimmed, case-insensitive match)
- Optional `explanation_md` per question, revealed after submission.
- Attempts (`quiz_attempts`): every submission is recorded (identity, lesson, answers,
  score/total, timestamp). Retakes allowed — each is a new attempt; the lesson
  completes on **first submission** (any score; pass thresholds are future scope).

## 2. Grading & Access

- Grading is **server-side only**: the public lesson payload carries questions WITHOUT
  correct answers; correctness + explanations return only in the grading response.
- Quiz lessons follow the standard access matrix (anonymous 401, preview vs member).

## 3. API

```
GET  /api/courses/{c}/lessons/{l}          kind=quiz → + questions[{id,kind,prompt_md,options}]
POST /api/courses/{c}/lessons/{l}/quiz     {answers:{question_id: value}} →
                                           {score,total,completed,results[{question_id,
                                            correct,correct_answer,explanation}]}
GET  /api/me/quiz-results                  attempt history for /me
Admin: GET/POST /api/admin/lessons/{id}/questions · PUT/DELETE /api/admin/questions/{id}
       (payloads include correct answers; per-kind validation)
```

## 4. UI

- **Player**: quiz lessons render the QuizPlayer — question forms (radio options /
  True-False / text input), Submit → score summary + per-question ✓/✗ with the correct
  answer and explanation; Retake starts fresh. Manual Mark-complete is hidden
  (submission completes).
- **Authoring**: admins see the Quiz Builder on the quiz lesson page — add/edit/delete
  questions in place (kind select, prompt, options editor, correct answer,
  explanation). Lesson rows in the course editor gain a **kind select** (video, text,
  download, external, replay, quiz).
- **/me**: the Quiz Results placeholder becomes the attempt history (quiz, course,
  score, date).

## 5. Invariants

1. Correct answers never leave the server before a submission is graded.
2. Every submission is an immutable attempt record.
3. Quiz completion feeds the same progress/completion machinery as all lessons —
   no parallel bookkeeping.
