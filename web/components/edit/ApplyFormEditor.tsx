"use client";

// Apply questions + slots — the element IS the editor.

import { appConfirm } from "@/lib/dialogs";
import {
  APPLY_OUTCOME_OPTIONS,
  APPLY_TYPE_OPTIONS,
  endingsLive,
} from "@/lib/applyFields";
import { EditableSelect, EditableText } from "./Editable";
import ApplySlotsEditor from "./ApplySlotsEditor";
import { useApplySlotsEdit } from "./ApplySlotsEditContext";

export default function ApplyFormEditor({
  variant = "apply",
}: {
  variant?: "apply" | "admin";
}) {
  const edit = useApplySlotsEdit();
  if (!edit) return null;
  const rows = edit.editMode || edit.isAdmin ? edit.adminQuestions : edit.questions;
  const admin = variant === "admin";

  return (
    <div className={admin ? "mx-auto max-w-2xl px-4 py-8" : "apply-slots-editor"}>
      {admin ? (
        <>
          <h1 className="text-2xl font-semibold tracking-tight">Apply form</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Same in-place editor as{" "}
            <a href="/apply?edit=1" className="underline underline-offset-2">
              /apply
            </a>
            . Click a field. Leave it to save. Do not invent AC ids.
          </p>
        </>
      ) : (
        <>
          <h1 className="apply-question">Apply questions</h1>
          <p className="apply-hint">
            Click the ask, hint, type, outcome, or choices. Changes save when
            you leave the field. Applicants see this order, plus follow-ons.
          </p>
        </>
      )}

      <div className={admin ? "mt-6 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800" : "apply-admin-question"}>
        <h2 className={admin ? "text-lg font-semibold" : "apply-admin-slot-time"}>
          Scoring map
        </h2>
        <p className={admin ? "mt-2 text-sm text-zinc-500" : "apply-hint"}>
          No Typeform sheet was imported. Tag an answer Coach, Lakesia, or
          Trial. Plurality wins. A tie is Trial — no meeting. Until you tag an
          answer, Review + Accept stays the ending.
        </p>
        <p className={admin ? "mt-2 text-xs text-zinc-400" : "apply-admin-q-ac"}>
          {endingsLive(rows)
            ? "Endings are live. Review shows Coach slots, Lakesia slots, or the Observer trial."
            : "No outcomes tagged yet. Ending stays Review + Accept."}
        </p>
        <div className={admin ? "mt-4 space-y-3" : "apply-admin-q-meta"}>
          {edit.hosts.map((h) => (
            <div key={h.slug} className={admin ? "flex flex-wrap items-center gap-2" : "apply-admin-q-row"}>
              <span className={admin ? "text-xs text-zinc-500 w-28" : "apply-admin-q-label"}>
                {h.display_name}
              </span>
              <EditableText
                field={`host.${h.slug}.organizer_name`}
                value={h.organizer_name || ""}
                placeholder="Organizer name"
              />
              <EditableText
                field={`host.${h.slug}.organizer_email`}
                value={h.organizer_email || ""}
                placeholder="Organizer email (required for ICS)"
              />
            </div>
          ))}
        </div>
      </div>

      <ol
        className={
          admin ? "mt-6 space-y-4" : "apply-admin-slot-list"
        }
      >
        {rows.length === 0 ? (
          <li className={admin ? "text-sm text-zinc-500" : "apply-error"}>
            No questions yet. Add one.
          </li>
        ) : (
          rows.map((q, i) => (
            <li
              key={q.id}
              className={
                admin
                  ? "rounded-xl border border-zinc-200 px-4 py-4 dark:border-zinc-800"
                  : "apply-admin-question"
              }
            >
              <EditableText
                field={`question.${q.id}.ask`}
                value={q.ask}
                className={
                  admin
                    ? "text-lg font-semibold"
                    : "apply-admin-slot-time"
                }
                placeholder="Click to write the question…"
              />
              <div className={admin ? "mt-2" : "apply-admin-q-hint"}>
                <EditableText
                  field={`question.${q.id}.hint`}
                  value={q.hint}
                  className={admin ? "text-sm text-zinc-500" : "apply-hint"}
                  placeholder="Hint (optional)"
                />
              </div>
              <div className={admin ? "mt-3 flex flex-wrap items-center gap-3" : "apply-admin-q-meta"}>
                <span className={admin ? "text-xs text-zinc-500" : "apply-admin-q-label"}>
                  Type
                </span>
                <EditableSelect
                  field={`question.${q.id}.qtype`}
                  value={q.qtype}
                  options={APPLY_TYPE_OPTIONS}
                />
                {q.qtype === "free_text" ? (
                  <>
                    <span className={admin ? "text-xs text-zinc-500" : "apply-admin-q-label"}>
                      Email
                    </span>
                    <EditableSelect
                      field={`question.${q.id}.is_email`}
                      value={q.is_email ? "yes" : "no"}
                      options={[
                        { value: "no", label: "No" },
                        { value: "yes", label: "Yes" },
                      ]}
                    />
                  </>
                ) : null}
                <span className={admin ? "text-xs text-zinc-500" : "apply-admin-q-label"}>
                  On path
                </span>
                <EditableSelect
                  field={`question.${q.id}.on_path`}
                  value={q.on_path ? "yes" : "no"}
                  options={[
                    { value: "yes", label: "Default walk" },
                    { value: "no", label: "Follow-on only" },
                  ]}
                />
                {q.ac_field_id ? (
                  <span className={admin ? "text-xs text-zinc-400" : "apply-admin-q-ac"}>
                    AC {q.ac_field_id} · {q.ac_key}
                  </span>
                ) : (
                  <span className={admin ? "text-xs text-zinc-400" : "apply-admin-q-ac"}>
                    Server only
                  </span>
                )}
              </div>

              {q.qtype === "binary" || q.qtype === "radio" ? (
                <ul className={admin ? "mt-3 space-y-2" : "apply-admin-options"}>
                  {q.options.map((opt, idx) => (
                    <li key={`${q.id}-${idx}`} className={admin ? "space-y-1" : "apply-admin-q-row"}>
                      <div className="flex flex-wrap items-center gap-2">
                      <EditableText
                        field={`question.${q.id}.option.${idx}`}
                        value={opt.label}
                        placeholder="Choice"
                      />
                      <EditableSelect
                        field={`question.${q.id}.option.${idx}.outcome`}
                        value={opt.outcome}
                        options={APPLY_OUTCOME_OPTIONS}
                      />
                      <EditableText
                        field={`question.${q.id}.option.${idx}.reveal`}
                        value={opt.reveal.join(", ")}
                        placeholder="Then ask (slugs)"
                      />
                      {edit.editMode && q.qtype === "radio" ? (
                        <button
                          type="button"
                          className={
                            admin
                              ? "text-xs text-zinc-500 underline-offset-2 hover:underline"
                              : "apply-admin-slot-remove"
                          }
                          onClick={() => void edit.removeOption(q.id, idx)}
                        >
                          Remove
                        </button>
                      ) : null}
                      </div>
                    </li>
                  ))}
                  {edit.editMode && q.qtype === "radio" ? (
                    <li>
                      <button
                        type="button"
                        className={admin ? "text-sm text-emerald-700" : "apply-admin-slot-add"}
                        onClick={() => void edit.addOption(q.id)}
                      >
                        + Add choice
                      </button>
                    </li>
                  ) : null}
                </ul>
              ) : null}

              {edit.editMode ? (
                <div className={admin ? "mt-3 flex gap-3 text-sm text-zinc-500" : "apply-admin-q-ops"}>
                  <button
                    type="button"
                    disabled={i === 0}
                    onClick={() => void edit.moveQuestion(q.id, "up")}
                  >
                    Up
                  </button>
                  <button
                    type="button"
                    disabled={i === rows.length - 1}
                    onClick={() => void edit.moveQuestion(q.id, "down")}
                  >
                    Down
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void (async () => {
                        const ok = await appConfirm({
                          title: "Remove this question?",
                          message:
                            "Applicants will no longer see it. Mapped AC fields are not invented.",
                          confirmLabel: "Remove",
                        });
                        if (ok) await edit.removeQuestion(q.id);
                      })();
                    }}
                  >
                    Remove
                  </button>
                </div>
              ) : null}
            </li>
          ))
        )}
      </ol>

      {edit.editMode ? (
        <button
          type="button"
          onClick={() => void edit.addQuestion()}
          disabled={edit.saving}
          className={
            admin
              ? "mt-4 w-full rounded-2xl border-2 border-dashed border-emerald-400/40 py-4 font-medium text-emerald-700 hover:bg-emerald-50/50 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
              : "apply-admin-slot-add"
          }
        >
          + Add question
        </button>
      ) : null}

      <div className={admin ? "mt-10" : "apply-admin-slots-block"}>
        <ApplySlotsEditor variant={variant} embedded />
      </div>
    </div>
  );
}
