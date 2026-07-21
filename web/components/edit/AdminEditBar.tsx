"use client";

// Edit-mode toggle + floating edit bar (spec v1.1 §2). Replaces the v1.0 modal.

import { useEdit } from "./EditContext";

export default function AdminEditBar() {
  const edit = useEdit();
  if (!edit?.isAdmin) return null;

  if (!edit.editMode) {
    return (
      <button
        onClick={() => edit.setEditMode(true)}
        className="fixed bottom-6 right-6 z-50 rounded-full bg-zinc-900 px-5 py-2.5 font-medium text-white shadow-lg transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
      >
        ✎ Edit
      </button>
    );
  }

  const dirtyCount =
    Object.keys(edit.dirty).length +
    (edit.status && edit.status !== null ? 0 : 0);

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-200 bg-white/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-3 px-6 py-3">
        <span className="text-sm font-semibold">Editing</span>
        <span className="text-xs text-zinc-500">
          Click any highlighted element to edit it in place
        </span>
        {edit.status !== null && (
          <label className="ml-2 flex items-center gap-1.5 text-sm">
            <span className="text-zinc-500">Status</span>
            <select
              value={edit.status}
              onChange={(e) => edit.setStatus(e.target.value)}
              className="rounded-lg border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            >
              <option value="draft">draft</option>
              <option value="published">published</option>
              <option value="archived">archived</option>
            </select>
          </label>
        )}
        {edit.error && (
          <span className="max-w-md truncate text-xs text-red-600">{edit.error}</span>
        )}
        <span className="ml-auto flex items-center gap-2">
          <span className="text-xs text-zinc-500">
            {dirtyCount} pending {dirtyCount === 1 ? "change" : "changes"}
          </span>
          <button
            onClick={edit.discard}
            disabled={edit.saving}
            className="rounded-full border border-zinc-300 px-4 py-1.5 text-sm dark:border-zinc-700"
          >
            Discard
          </button>
          <button
            onClick={() => edit.setEditMode(false)}
            disabled={edit.saving}
            className="rounded-full border border-zinc-300 px-4 py-1.5 text-sm dark:border-zinc-700"
          >
            Exit
          </button>
          <button
            onClick={edit.save}
            disabled={edit.saving}
            className="rounded-full bg-emerald-500 px-5 py-1.5 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
          >
            {edit.saving ? "Saving…" : "Save & Publish"}
          </button>
        </span>
      </div>
    </div>
  );
}
