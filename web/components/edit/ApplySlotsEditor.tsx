"use client";

// Slot list as the editor — same language as course sections.
// Click the time → dashed affordance → datetime → blur commits.

import { appConfirm } from "@/lib/dialogs";
import { APPLY_HOST_OPTIONS } from "@/lib/applyFields";
import { EditableDatetime, EditableSelect } from "./Editable";
import { useApplySlotsEdit } from "./ApplySlotsEditContext";

export default function ApplySlotsEditor({
  variant = "apply",
  embedded = false,
}: {
  variant?: "apply" | "admin";
  embedded?: boolean;
}) {
  const edit = useApplySlotsEdit();
  if (!edit) return null;

  const rows = edit.editMode || edit.isAdmin ? edit.slots : edit.liveSlots;
  const adminPage = variant === "admin" && !embedded;

  return (
    <div
      className={
        adminPage
          ? "mx-auto max-w-2xl px-4 py-8"
          : variant === "admin"
            ? undefined
            : "apply-slots-editor"
      }
    >
      {variant === "admin" ? (
        <>
          <h1 className="text-2xl font-semibold tracking-tight">
            {embedded ? "Conversation times" : "Apply conversation times"}
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Same in-place editor as{" "}
            <a href="/apply?edit=1" className="underline underline-offset-2">
              /apply
            </a>
            . Applicants pick one live time. Empty times stay hidden.
          </p>
        </>
      ) : (
        <>
          <h1 className="apply-question">Conversation times</h1>
          <p className="apply-hint">
            Coach times and Lakesia times are separate. Applicants only see
            the list for the ending they earned. Empty times stay hidden.
          </p>
        </>
      )}

      <ul
        className={
          variant === "admin" ? "mt-6 space-y-3" : "apply-admin-slot-list"
        }
      >
        {rows.length === 0 ? (
          <li
            className={
              variant === "admin"
                ? "text-sm text-zinc-500"
                : "apply-error"
            }
            role="status"
          >
            No times yet. Add one.
          </li>
        ) : (
          rows.map((slot) => {
            const field = `slot.${slot.id}.starts_et`;
            return (
              <li
                key={slot.id}
                className={
                  variant === "admin"
                    ? "flex items-center gap-3 rounded-xl border border-zinc-200 px-4 py-3 dark:border-zinc-800"
                    : "apply-admin-slot-row"
                }
              >
                <EditableDatetime
                  field={field}
                  value={slot.starts_et}
                  className={
                    variant === "admin"
                      ? "text-lg font-medium"
                      : "apply-admin-slot-time"
                  }
                />
                <EditableSelect
                  field={`slot.${slot.id}.host`}
                  value={slot.host}
                  options={APPLY_HOST_OPTIONS}
                />
                {edit.editMode ? (
                  <button
                    type="button"
                    className={
                      variant === "admin"
                        ? "ml-auto text-sm text-zinc-500 underline-offset-2 hover:underline"
                        : "apply-admin-slot-remove"
                    }
                    onClick={() => {
                      void (async () => {
                        const ok = await appConfirm({
                          title: "Remove this time?",
                          message:
                            "Applicants will no longer see it. This does not invent a replacement.",
                          confirmLabel: "Remove",
                        });
                        if (ok) await edit.removeSlot(slot.id);
                      })();
                    }}
                  >
                    Remove
                  </button>
                ) : null}
              </li>
            );
          })
        )}
      </ul>

      {edit.editMode ? (
        <div className={variant === "admin" ? "mt-4 flex gap-3" : "apply-admin-q-ops"}>
          <button
            type="button"
            onClick={() => void edit.addSlot("coach")}
            disabled={edit.saving}
            className={
              variant === "admin"
                ? "flex-1 rounded-2xl border-2 border-dashed border-emerald-400/40 py-4 font-medium text-emerald-700 hover:bg-emerald-50/50 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                : "apply-admin-slot-add"
            }
          >
            + Coach time
          </button>
          <button
            type="button"
            onClick={() => void edit.addSlot("lakesia")}
            disabled={edit.saving}
            className={
              variant === "admin"
                ? "flex-1 rounded-2xl border-2 border-dashed border-emerald-400/40 py-4 font-medium text-emerald-700 hover:bg-emerald-50/50 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                : "apply-admin-slot-add"
            }
          >
            + Lakesia time
          </button>
        </div>
      ) : null}
    </div>
  );
}
