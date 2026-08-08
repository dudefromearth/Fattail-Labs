"use client";

// Playbook library — scrapbook covers (Spec v1.1a · DL-255)

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import PracticeSuiteChrome from "@/components/practice/PracticeSuiteChrome";
import { Button } from "@/components/ui";
import {
  createPlaybookEntry,
  fetchPlaybookEntries,
  patchPlaybookEntry,
  type PlaybookEntry,
} from "@/lib/practiceSpineApi";

export default function PlaybookLibraryPage() {
  const [entries, setEntries] = useState<PlaybookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await fetchPlaybookEntries(showArchived);
      setEntries(d.entries || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load playbooks");
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [showArchived]);

  useEffect(() => {
    void load();
  }, [load]);

  async function createBook() {
    if (!title.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const book = await createPlaybookEntry({
        title: title.trim(),
        subtitle: subtitle.trim() || undefined,
      });
      setCreating(false);
      setTitle("");
      setSubtitle("");
      window.location.href = `/app/playbook/${book.id}`;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Create failed");
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
        hideStoryStrip
        hideToughness
        breadcrumbUnderTitle
        subtitle="Your scrapbook for how you trade under risk — not a performance report."
      >
        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="primary"
              onClick={() => setCreating(true)}
              data-testid="playbook-new"
            >
              New book
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

          {creating && (
            <div
              className="surface-card border border-[var(--color-separator)] p-4 sm:p-5"
              data-testid="playbook-create"
            >
              <h2 className="text-sm font-semibold text-[var(--color-label)]">
                New scrapbook
              </h2>
              <label className="mt-3 block text-xs font-medium text-[var(--color-label-secondary)]">
                Title
                <input
                  className="mt-1 w-full rounded-lg border border-[var(--color-separator)] bg-[var(--color-canvas)] px-3 py-2 text-sm"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Classic OTM 0DTE Butterfly"
                  data-testid="playbook-title"
                />
              </label>
              <label className="mt-3 block text-xs font-medium text-[var(--color-label-secondary)]">
                Subtitle (optional)
                <input
                  className="mt-1 w-full rounded-lg border border-[var(--color-separator)] bg-[var(--color-canvas)] px-3 py-2 text-sm"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Cover line for the book"
                />
              </label>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="primary"
                  disabled={busy || !title.trim()}
                  onClick={() => void createBook()}
                >
                  {busy ? "Creating…" : "Open book"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={busy}
                  onClick={() => setCreating(false)}
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
                No books yet
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm text-[var(--color-label-secondary)]">
                This is your scrapbook for how you trade under risk — rules,
                regimes, and evidence you staple in. Not a performance report.
              </p>
              <div className="mt-4">
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => setCreating(true)}
                >
                  Write first book
                </Button>
              </div>
            </div>
          )}

          <ul
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            data-testid="playbook-library"
          >
            {entries.map((e) => (
              <li key={e.id}>
                <article
                  className="surface-card flex h-full flex-col border border-[var(--color-separator)] p-4 transition hover:border-[var(--color-tint)]"
                  data-testid={`playbook-entry-${e.id}`}
                >
                  <Link
                    href={`/app/playbook/${e.id}`}
                    className="flex flex-1 flex-col focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-tint)]"
                  >
                    <div
                      className="mb-3 aspect-video w-full rounded-[var(--radius-md)] bg-[var(--color-fill)] flex items-center justify-center px-3 text-center"
                      aria-hidden
                    >
                      <span className="text-xs font-medium text-[var(--color-label-tertiary)]">
                        16:9 cover
                      </span>
                    </div>
                    <h3 className="font-semibold text-[var(--color-label)]">
                      {e.title}
                    </h3>
                    {e.subtitle && (
                      <p className="mt-0.5 text-sm text-[var(--color-label-secondary)]">
                        {e.subtitle}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {e.is_draft && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                          Draft
                        </span>
                      )}
                      {!e.is_draft && (e.version_count ?? 0) > 0 && (
                        <span className="rounded-full bg-[var(--color-tint-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-label)]">
                          v{e.latest_version_n ?? e.version_count}
                        </span>
                      )}
                      {e.status === "archived" && (
                        <span className="rounded-full bg-[var(--color-fill)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-label-secondary)]">
                          Archived
                        </span>
                      )}
                    </div>
                    {e.body_md && (
                      <p className="mt-2 line-clamp-3 text-xs text-[var(--color-label-tertiary)]">
                        {e.body_md}
                      </p>
                    )}
                  </Link>
                  {e.status === "active" && (
                    <div className="mt-3 flex gap-2 border-t border-[var(--color-separator)] pt-3">
                      <Link
                        href={`/app/playbook/${e.id}`}
                        className="text-xs font-medium text-[var(--color-tint)] hover:underline"
                      >
                        Open
                      </Link>
                      <Link
                        href={`/app/playbook/${e.id}/present`}
                        className="text-xs font-medium text-[var(--color-label-secondary)] hover:underline"
                      >
                        Present
                      </Link>
                      <button
                        type="button"
                        className="ml-auto text-xs text-[var(--color-label-tertiary)] hover:underline"
                        onClick={() => void archive(e)}
                      >
                        Archive
                      </button>
                    </div>
                  )}
                </article>
              </li>
            ))}
          </ul>
        </div>
      </PracticeSuiteChrome>
    </main>
  );
}
