"use client";

// Status bar only — fields autosave on blur/Done. No whole-page Save.

import { useHubEdit } from "./HubEditContext";

function relativeSaved(iso: string | null): string | null {
  if (!iso) return null;
  const sec = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 3) return "just now";
  if (sec < 60) return `${sec}s ago`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  return new Date(iso).toLocaleTimeString();
}

export default function HubEditBar() {
  const edit = useHubEdit();
  if (!edit?.isAdmin) return null;

  if (!edit.editMode) {
    return (
      <button
        type="button"
        onClick={() => edit.setEditMode(true)}
        title="Click any field to edit — each saves on its own"
        className="fixed bottom-6 left-6 z-50 rounded-full bg-zinc-900 px-5 py-2.5 font-medium text-white shadow-lg transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
      >
        ✎ Edit
      </button>
    );
  }

  const dirtyCount = Object.keys(edit.dirty).length;
  const savedLabel = relativeSaved(edit.lastSavedAt);

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-200 bg-white/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-3 px-6 py-3">
        <span className="text-sm font-semibold">Editing hub</span>
        <span className="text-xs text-zinc-500">
          Each field saves on its own (blur / Done) — video never waits on FAQ
        </span>
        {edit.error && (
          <span
            className="max-w-lg break-words text-xs font-medium text-red-600"
            title={edit.error}
            role="alert"
          >
            {edit.error}
          </span>
        )}
        {!edit.error && edit.saving && (
          <span className="text-xs text-zinc-500">Saving…</span>
        )}
        {!edit.error && !edit.saving && savedLabel && (
          <span className="text-xs text-emerald-600">Saved {savedLabel}</span>
        )}
        <span className="ml-auto flex items-center gap-2">
          {dirtyCount > 0 && (
            <span className="text-xs text-amber-600">
              {dirtyCount} unsaved local {dirtyCount === 1 ? "edit" : "edits"}
            </span>
          )}
          {dirtyCount > 0 && (
            <button
              type="button"
              onClick={edit.discard}
              disabled={edit.saving}
              className="chip"
            >
              Discard local
            </button>
          )}
          <button
            type="button"
            onClick={() => edit.setEditMode(false)}
            disabled={edit.saving}
            className="rounded-full bg-zinc-900 px-5 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
          >
            Exit
          </button>
        </span>
      </div>
    </div>
  );
}
