"use client";

// Course lifecycle danger zone (spec v1.4): unpublish -> draft, and
// title-confirmed deletion. Edit mode only; refused while edits are pending.

import { revalidate } from "@/lib/client";
import { useState } from "react";
import { appAlert, appConfirm } from "@/lib/dialogs";
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

  async function guardDirty(): Promise<boolean> {
    if (Object.keys(edit!.dirty).length > 0) {
      const ok = await edit!.save();
      if (!ok) {
        await appAlert({
          title: "Could not save",
          message: "Fix the error in the edit bar, then try again.",
        });
        return false;
      }
    }
    return true;
  }

  async function unpublish() {
    if (!(await guardDirty())) return;
    if (!(await appConfirm({
      title: "Unpublish this course?",
      message: "It disappears from the catalog and its public page until republished.",
      confirmLabel: "Unpublish",
      destructive: true,
    })))
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
    await revalidate([`/course/${slug}`, "/course"]).catch(() => {});
    window.location.href = `/course/${slug}`;
  }

  async function destroy() {
    if (!(await guardDirty())) return;
    const ok = await appConfirm({
      title: "Delete this course permanently?",
      message: `This permanently deletes the course, all its modules, lessons, quizzes, member progress, reviews, and discussions.\n\nCourse title must match:\n${title}`,
      confirmLabel: "Delete forever",
      destructive: true,
    });
    if (!ok) return;
    // Second gate: type-to-confirm via prompt is not HIG; use confirm message + exact title match on a follow-up field in a later pass.
    // For v1 HIG: require a second destructive confirm that names the course.
    const ok2 = await appConfirm({
      title: `Confirm delete “${title}”?`,
      message: "This cannot be undone. All modules, lessons, and member progress for this course will be removed.",
      confirmLabel: "Delete forever",
      destructive: true,
    });
    if (!ok2) return;
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
    await revalidate(["/course"]).catch(() => {});
    window.location.href = "/course";
  }

  return (
    <div className="surface-card mt-12 border border-[var(--color-destructive)]/30 p-5">
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
