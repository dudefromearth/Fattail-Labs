"use client";

import { useHubEdit } from "./HubEditContext";

export default function HubEditBar() {
  const edit = useHubEdit();
  if (!edit?.isAdmin) return null;

  if (!edit.editMode) {
    return (
      <button
        type="button"
        onClick={() => edit.setEditMode(true)}
        className="fixed bottom-6 right-6 z-50 rounded-full bg-zinc-900 px-5 py-2.5 font-medium text-white shadow-lg transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
      >
        ✎ Edit
      </button>
    );
  }

  const dirtyCount = Object.keys(edit.dirty).length;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-200 bg-white/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-3 px-6 py-3">
        <span className="text-sm font-semibold">Editing hub</span>
        <span className="text-xs text-zinc-500">
          Click title, description, video, or FAQ items to edit
        </span>
        {edit.error && (
          <span className="max-w-md truncate text-xs text-red-600">
            {edit.error}
          </span>
        )}
        <span className="ml-auto flex items-center gap-2">
          <span className="text-xs text-zinc-500">
            {dirtyCount} pending {dirtyCount === 1 ? "change" : "changes"}
          </span>
          <button
            type="button"
            onClick={edit.discard}
            disabled={edit.saving}
            className="rounded-full border border-zinc-300 px-4 py-1.5 text-sm dark:border-zinc-700"
          >
            Discard
          </button>
          <button
            type="button"
            onClick={() => edit.setEditMode(false)}
            disabled={edit.saving}
            className="rounded-full border border-zinc-300 px-4 py-1.5 text-sm dark:border-zinc-700"
          >
            Exit
          </button>
          <button
            type="button"
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
