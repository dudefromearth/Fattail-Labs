"use client";

// Same floating Edit / bottom bar language as course AdminEditBar.

import { useEffect, useState } from "react";
import { useApplySlotsEdit } from "./ApplySlotsEditContext";

function relativeSaved(iso: string | null): string | null {
  if (!iso) return null;
  const sec = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 3) return "just now";
  if (sec < 60) return `${sec}s ago`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  return new Date(iso).toLocaleTimeString();
}

export default function ApplySlotsEditBar() {
  const edit = useApplySlotsEdit();
  const [, tick] = useState(0);

  useEffect(() => {
    if (!edit?.editMode || !edit.lastSavedAt) return;
    const id = window.setInterval(() => tick((n) => n + 1), 5000);
    return () => window.clearInterval(id);
  }, [edit?.editMode, edit?.lastSavedAt]);

  if (!edit?.isAdmin) return null;

  if (!edit.editMode) {
    return (
      <button
        type="button"
        onClick={() => edit.setEditMode(true)}
        title="Or ⌥-click any question or time"
        className="fixed bottom-6 left-6 z-50 rounded-full bg-zinc-900 px-5 py-2.5 font-medium text-white shadow-lg transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
      >
        Edit
      </button>
    );
  }

  const savedLabel = relativeSaved(edit.lastSavedAt);

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-200 bg-white/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-3 px-6 py-3">
        <span className="text-sm font-semibold">Editing</span>
        <span className="text-xs text-zinc-500">
          Questions, types, and times save when you leave a field
        </span>
        {edit.error && (
          <span className="max-w-md truncate text-xs text-red-600">
            {edit.error}
          </span>
        )}
        <span className="ml-auto flex items-center gap-2">
          <span
            className={`min-w-[7rem] text-xs ${
              edit.error
                ? "text-red-600"
                : edit.saving
                  ? "text-amber-600"
                  : "text-emerald-600"
            }`}
            aria-live="polite"
          >
            {edit.saving
              ? "Saving…"
              : edit.error
                ? "Save failed"
                : savedLabel
                  ? `Saved · ${savedLabel}`
                  : "Autosave on"}
          </span>
          <button
            type="button"
            onClick={() => edit.setEditMode(false)}
            disabled={edit.saving}
            className="chip"
          >
            Exit
          </button>
        </span>
      </div>
    </div>
  );
}
