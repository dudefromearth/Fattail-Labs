"use client";

// Edit-mode toggle + floating edit bar (spec v1.1 §2).
// Fields autosave on blur — the bar shows status, not a required Save click.
// Canonical Course Model: Export package downloads course.json (C3).

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useEdit } from "./EditContext";

function relativeSaved(iso: string | null): string | null {
  if (!iso) return null;
  const sec = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 3) return "just now";
  if (sec < 60) return `${sec}s ago`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  return new Date(iso).toLocaleTimeString();
}

export default function AdminEditBar() {
  const edit = useEdit();
  const params = useParams();
  const slugFromRoute = typeof params?.slug === "string" ? params.slug : "";
  const [exportError, setExportError] = useState<string | null>(null);
  const [, tick] = useState(0);

  // Refresh "Saved Xs ago" while the bar is open.
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
        title="Or ⌥-click any editable field (title, description, …)"
        className="fixed bottom-6 right-6 z-50 rounded-full bg-zinc-900 px-5 py-2.5 font-medium text-white shadow-lg transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
      >
        Edit
      </button>
    );
  }

  async function exportPackage() {
    if (!slugFromRoute) return;
    setExportError(null);
    try {
      const r = await fetch(`/api/admin/courses/${slugFromRoute}/canonical`, {
        credentials: "same-origin",
      });
      if (!r.ok) {
        const t = await r.text();
        setExportError(`Export failed: ${r.status} ${t}`);
        return;
      }
      const doc = await r.json();
      const blob = new Blob([JSON.stringify(doc, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${slugFromRoute}.course.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setExportError(e instanceof Error ? e.message : "Export failed");
    }
  }

  const savedLabel = relativeSaved(edit.lastSavedAt);
  const dirtyCount = Object.keys(edit.dirty).length;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-200 bg-white/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-3 px-6 py-3">
        <span className="text-sm font-semibold">Editing</span>
        <span className="text-xs text-zinc-500">
          Changes save when you leave a field
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
        {(edit.error || exportError) && (
          <span className="max-w-md truncate text-xs text-red-600">
            {edit.error || exportError}
          </span>
        )}
        <span className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={exportPackage}
            disabled={edit.saving || !slugFromRoute}
            className="chip"
            title="Download Canonical Course package (.course.json)"
          >
            Export package
          </button>
          <span
            className={`min-w-[7rem] text-xs ${
              edit.error
                ? "text-red-600"
                : edit.saving
                  ? "text-amber-600"
                  : dirtyCount > 0
                    ? "text-zinc-500"
                    : "text-emerald-600"
            }`}
            aria-live="polite"
          >
            {edit.saving
              ? "Saving…"
              : edit.error
                ? "Save failed"
                : dirtyCount > 0
                  ? "Editing…"
                  : savedLabel
                    ? `Saved · ${savedLabel}`
                    : "Autosave on"}
          </span>
          <button
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
