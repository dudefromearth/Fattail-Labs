"use client";

// Playbook — who you are under risk (Trader Development Phase 1).

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import PracticeSuiteChrome from "@/components/practice/PracticeSuiteChrome";
import { Button } from "@/components/ui";
import TagPicker from "@/components/tags/TagPicker";
import {
  createPlaybookEntry,
  fetchPlaybookEntries,
  patchPlaybookEntry,
  type PlaybookEntry,
} from "@/lib/practiceSpineApi";

export default function PlaybookPage() {
  const [entries, setEntries] = useState<PlaybookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [editing, setEditing] = useState<PlaybookEntry | null>(null);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await fetchPlaybookEntries(showArchived);
      setEntries(d.entries || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load playbook");
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [showArchived]);

  useEffect(() => {
    void load();
  }, [load]);

  function startCreate() {
    setCreating(true);
    setEditing(null);
    setTitle("");
    setBody("");
  }

  function startEdit(e: PlaybookEntry) {
    setEditing(e);
    setCreating(false);
    setTitle(e.title);
    setBody(e.body_md);
  }

  async function save() {
    if (!title.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      if (creating) {
        await createPlaybookEntry({ title: title.trim(), body_md: body });
      } else if (editing) {
        await patchPlaybookEntry(editing.id, {
          title: title.trim(),
          body_md: body,
        });
      }
      setCreating(false);
      setEditing(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function archive(e: PlaybookEntry) {
    if (busy) return;
    setBusy(true);
    try {
      await patchPlaybookEntry(e.id, { status: "archived" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Archive failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-[1100px] px-4 py-6 pb-24 sm:px-6">
      <PracticeSuiteChrome
        active="playbook"
        subtitle="Who you are under risk — the rules you will not break."
      >
        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="primary" onClick={startCreate}>
              New playbook entry
            </Button>
            <label className="flex items-center gap-2 text-sm text-[var(--color-label-secondary)]">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
              />
              Show archived
            </label>
            <Link
              href="/app/trade-log"
              className="ml-auto text-sm font-medium text-[var(--color-tint)] hover:underline"
            >
              Trade Log →
            </Link>
          </div>

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          {(creating || editing) && (
            <div
              className="surface-card border border-[var(--color-separator)] p-4 sm:p-5"
              data-testid="playbook-editor"
            >
              <h2 className="text-sm font-semibold text-[var(--color-label)]">
                {creating ? "New entry" : "Edit entry"}
              </h2>
              <label className="mt-3 block text-xs font-medium text-[var(--color-label-secondary)]">
                Title
                <input
                  className="mt-1 w-full rounded-lg border border-[var(--color-separator)] bg-[var(--color-canvas)] px-3 py-2 text-sm"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. 0DTE butterfly rules"
                  data-testid="playbook-title"
                />
              </label>
              <label className="mt-3 block text-xs font-medium text-[var(--color-label-secondary)]">
                Rules (markdown)
                <textarea
                  className="mt-1 w-full rounded-lg border border-[var(--color-separator)] bg-[var(--color-canvas)] px-3 py-2 text-sm"
                  rows={8}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Entry, size, exit, stop-the-bleeding constraints…"
                  data-testid="playbook-body"
                />
              </label>
              {editing && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-[var(--color-label-secondary)]">
                    Tags
                  </p>
                  <TagPicker objectType="playbook_entry" objectId={editing.id} />
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="primary"
                  disabled={busy || !title.trim()}
                  onClick={() => void save()}
                  data-testid="playbook-save"
                >
                  {busy ? "Saving…" : "Save"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={busy}
                  onClick={() => {
                    setCreating(false);
                    setEditing(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {loading && (
            <p className="text-sm text-[var(--color-label-tertiary)]">Loading…</p>
          )}

          {!loading && entries.length === 0 && !creating && (
            <div
              className="surface-card border border-[var(--color-separator)] px-5 py-8 text-center"
              data-testid="playbook-empty"
            >
              <p className="font-semibold text-[var(--color-label)]">
                Your playbook is empty
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm text-[var(--color-label-secondary)]">
                Write who you are under risk — the rules you will not break.
                Campaigns (seasons of practice) can scope to these entries.
              </p>
              <div className="mt-4">
                <Button type="button" variant="primary" onClick={startCreate}>
                  Write first entry
                </Button>
              </div>
            </div>
          )}

          <ul className="space-y-3">
            {entries.map((e) => (
              <li
                key={e.id}
                className="surface-card border border-[var(--color-separator)] p-4"
                data-testid={`playbook-entry-${e.id}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-[var(--color-label)]">
                      {e.title}
                    </h3>
                    <p className="mt-0.5 text-xs text-[var(--color-label-tertiary)]">
                      {e.status}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {e.status === "active" && (
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => startEdit(e)}
                      >
                        Edit
                      </Button>
                    )}
                    {e.status === "active" && (
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => void archive(e)}
                      >
                        Archive
                      </Button>
                    )}
                  </div>
                </div>
                {e.body_md && (
                  <pre className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap font-sans text-sm text-[var(--color-label-secondary)]">
                    {e.body_md}
                  </pre>
                )}
              </li>
            ))}
          </ul>
        </div>
      </PracticeSuiteChrome>
    </main>
  );
}
