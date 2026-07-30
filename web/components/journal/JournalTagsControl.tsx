"use client";

/**
 * Spec v0.5 §5.0 — compact tags control; full list in a window (not a chip wall).
 */

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui";
import {
  fetchObjectAssignments,
  fetchTags,
  setObjectTags,
  type Tag,
} from "@/lib/tagsApi";

type Props = {
  sessionId: number;
  disabled?: boolean;
  onError?: (msg: string | null) => void;
};

export default function JournalTagsControl({
  sessionId,
  disabled = false,
  onError,
}: Props) {
  const [open, setOpen] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [draft, setDraft] = useState<Set<number>>(new Set());
  const [labels, setLabels] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    onError?.(null);
    try {
      const [vocab, assigns] = await Promise.all([
        fetchTags(),
        fetchObjectAssignments("journal_session", sessionId),
      ]);
      setTags(vocab.tags || []);
      const ids = new Set(assigns.map((a) => a.tag_id));
      setSelected(ids);
      setDraft(new Set(ids));
      setLabels(
        assigns
          .map((a) => a.tag?.label)
          .filter((x): x is string => Boolean(x)),
      );
    } catch (e) {
      onError?.(e instanceof Error ? e.message : "Could not load tags");
    }
  }, [sessionId, onError]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (open) {
      setDraft(new Set(selected));
      setQ("");
    }
  }, [open, selected]);

  const filtered = tags.filter((t) => {
    if (!q.trim()) return true;
    const n = q.trim().toLowerCase();
    return (
      t.label.toLowerCase().includes(n) ||
      (t.description || "").toLowerCase().includes(n)
    );
  });

  function toggleDraft(id: number) {
    setDraft((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function save() {
    if (disabled || busy) return;
    setBusy(true);
    onError?.(null);
    try {
      const assigns = await setObjectTags(
        "journal_session",
        sessionId,
        Array.from(draft),
      );
      const ids = new Set(assigns.map((a) => a.tag_id));
      setSelected(ids);
      setLabels(
        assigns
          .map((a) => a.tag?.label)
          .filter((x): x is string => Boolean(x)),
      );
      setOpen(false);
    } catch (e) {
      onError?.(e instanceof Error ? e.message : "Could not save tags");
    } finally {
      setBusy(false);
    }
  }

  const summary =
    labels.length === 0
      ? "No tags"
      : labels.length <= 2
        ? labels.join(" · ")
        : `${labels.slice(0, 2).join(" · ")} +${labels.length - 2}`;

  return (
    <div className="relative" data-testid="journal-tags-control">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen(true)}
          className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-[var(--color-separator)] bg-[var(--color-surface)] px-3 text-xs font-medium text-[var(--color-label)] hover:bg-[var(--color-fill)] disabled:opacity-40"
          data-testid="journal-tags-open"
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          Tags
          {selected.size > 0 && (
            <span className="rounded-full bg-[var(--color-fill)] px-1.5 tabular-nums text-[10px] text-[var(--color-label-secondary)]">
              {selected.size}
            </span>
          )}
        </button>
        <span className="min-w-0 flex-1 truncate text-xs text-[var(--color-label-tertiary)]">
          {summary}
        </span>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-4 sm:items-center"
          role="presentation"
          onClick={() => !busy && setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Select tags"
            data-testid="journal-tags-window"
            className="flex max-h-[min(28rem,80vh)] w-full max-w-md flex-col rounded-[var(--radius-lg)] border border-[var(--color-separator)] bg-[var(--color-surface)] shadow-[var(--elevation-2)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-[var(--color-separator)] px-4 py-3">
              <h3 className="text-sm font-semibold text-[var(--color-label)]">
                Tags
              </h3>
              <p className="mt-0.5 text-xs text-[var(--color-label-tertiary)]">
                Optional framing from the system lexicon. Does not change the
                interview.
              </p>
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search…"
                className="mt-2 w-full rounded-[var(--radius-md)] border border-[var(--color-separator)] bg-[var(--color-surface)] px-3 py-2 text-sm"
                aria-label="Search tags"
                autoFocus
              />
            </div>
            <ul className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
              {filtered.map((t) => {
                const on = draft.has(t.id);
                return (
                  <li key={t.id}>
                    <button
                      type="button"
                      disabled={busy || disabled}
                      onClick={() => toggleDraft(t.id)}
                      className={[
                        "flex w-full items-start gap-2 rounded-[var(--radius-md)] px-2 py-2 text-left text-sm",
                        on
                          ? "bg-[var(--color-tint-soft)]"
                          : "hover:bg-[var(--color-fill)]",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px]",
                          on
                            ? "border-[var(--color-tint)] bg-[var(--color-tint)] text-[var(--color-on-tint)]"
                            : "border-[var(--color-separator)]",
                        ].join(" ")}
                        aria-hidden
                      >
                        {on ? "✓" : ""}
                      </span>
                      <span className="min-w-0">
                        <span className="font-medium text-[var(--color-label)]">
                          {t.label}
                        </span>
                        {t.description && (
                          <span className="mt-0.5 block text-xs text-[var(--color-label-tertiary)]">
                            {t.description}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
              {filtered.length === 0 && (
                <li className="px-2 py-4 text-center text-sm text-[var(--color-label-tertiary)]">
                  No tags match.
                </li>
              )}
            </ul>
            <div className="flex justify-end gap-2 border-t border-[var(--color-separator)] px-4 py-3">
              <Button
                type="button"
                variant="secondary"
                disabled={busy}
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                disabled={busy || disabled}
                onClick={() => void save()}
                data-testid="journal-tags-save"
              >
                {busy ? "Saving…" : "Done"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
