"use client";

// Course lifecycle danger zone (spec v1.4): unpublish -> draft, and
// title-confirmed deletion. Edit mode only; refused while edits are pending.

import { revalidate } from "@/lib/client";
import { useState } from "react";
import { useEdit } from "./EditContext";

export default function DangerZone({
  slug,
  title,
  status,
}: {
  slug: string;
  title: string;
  status: "draft" | "published" | "archived";
}) {
  const edit = useEdit();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!edit?.editMode) return null;

  function guardDirty(): boolean {
    if (Object.keys(edit!.dirty).length > 0) {
      alert("Save or discard your pending edits first.");
      return false;
    }
    return true;
  }

  async function unpublish() {
    if (!guardDirty()) return;
    if (!confirm("Unpublish this course? It disappears from the catalog and its public page until republished."))
      return;
    setBusy(true);
    setError(null);
    const r = await fetch(`/api/admin/courses/${slug}`, {
      method: "PUT",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "draft" }),
    });
    if (!r.ok) {
      setError(`Unpublish failed (${r.status})`);
      setBusy(false);
      return;
    }
    await revalidate([`/courses/${slug}`]).catch(() => {});
    window.location.href = `/admin/courses/${slug}`;
  }

  async function destroy() {
    if (!guardDirty()) return;
    const typed = prompt(
      `This permanently deletes the course, all its modules, lessons, quizzes, member progress, reviews, and discussions.\n\nType the course title to confirm:\n${title}`,
    );
    if (typed === null) return;
    if (typed.trim() !== title.trim()) {
      alert("Title did not match — nothing was deleted.");
      return;
    }
    setBusy(true);
    setError(null);
    const r = await fetch(`/api/admin/courses/${slug}`, {
      method: "DELETE",
      credentials: "same-origin",
    });
    if (!r.ok) {
      setError(`Delete failed (${r.status}): ${await r.text()}`);
      setBusy(false);
      return;
    }
    await revalidate(["/courses"]).catch(() => {});
    window.location.href = "/courses";
  }

  return (
    <div className="mt-12 rounded-2xl border border-red-200 p-5 dark:border-red-900">
      <p className="text-xs font-semibold uppercase tracking-wide text-red-500">
        Danger zone
      </p>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        {status === "published" && (
          <button
            onClick={unpublish}
            disabled={busy}
            className="rounded-full border border-amber-400 px-5 py-2 text-sm font-medium text-amber-600 hover:bg-amber-50 disabled:opacity-50 dark:hover:bg-amber-950/30"
          >
            Unpublish — return to draft
          </button>
        )}
        <button
          onClick={destroy}
          disabled={busy}
          className="rounded-full border border-red-400 px-5 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-950/30"
        >
          Delete course…
        </button>
        <span className="text-xs text-zinc-400">
          Deletion asks you to type the course title. There is no undo.
        </span>
      </div>
    </div>
  );
}
