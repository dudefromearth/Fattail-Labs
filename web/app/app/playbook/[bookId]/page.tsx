"use client";

// Playbook scrapbook — chapters · 16:9 stage · evidence · archive (v1.1a)

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import PracticeSuiteChrome from "@/components/practice/PracticeSuiteChrome";
import PlaybookStage from "@/components/playbook/PlaybookStage";

import { Button } from "@/components/ui";
import TagPicker from "@/components/tags/TagPicker";
import {
  createPlaybookChapter,
  createPlaybookPage,
  deletePlaybookPage,
  discardPlaybookBook,
  fetchPlaybookArchive,
  fetchPlaybookBook,
  patchPlaybookEntry,
  patchPlaybookPage,
  removePlaybookArchive,
  savePlaybookBook,
  downloadPlaybookBook,
  uploadPlaybookArchive,
  type PlaybookAttachment,
  type PlaybookChapter,
  type PlaybookEntry,
  type PlaybookPage,
} from "@/lib/practiceSpineApi";
type FlatPage = {
  chapter: PlaybookChapter;
  page: PlaybookPage;
  index: number;
};

function flatten(book: PlaybookEntry | null): FlatPage[] {
  if (!book?.chapters) return [];
  const out: FlatPage[] = [];
  let i = 0;
  for (const ch of book.chapters) {
    for (const page of ch.pages || []) {
      out.push({ chapter: ch, page, index: i++ });
    }
  }
  return out;
}

export default function PlaybookBookPage() {
  const params = useParams();
  const router = useRouter();
  const bookId = Number(params?.bookId);
  const [book, setBook] = useState<PlaybookEntry | null>(null);
  const [archive, setArchive] = useState<PlaybookAttachment[]>([]);
  const [pageIx, setPageIx] = useState(0);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [archiveOpen, setArchiveOpen] = useState(false);

  const load = useCallback(async () => {
    if (!bookId || Number.isNaN(bookId)) return;
    setLoading(true);
    setError(null);
    try {
      const [b, ar] = await Promise.all([
        fetchPlaybookBook(bookId, true),
        fetchPlaybookArchive(bookId),
      ]);
      setBook(b);
      setArchive(ar);
      setDirty(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load book");
      setBook(null);
    } finally {
      setLoading(false);
    }
  }, [bookId]);

  useEffect(() => {
    void load();
  }, [load]);

  const flat = useMemo(() => flatten(book), [book]);
  const current = flat[pageIx] ?? flat[0];

  useEffect(() => {
    if (pageIx >= flat.length && flat.length > 0) setPageIx(0);
  }, [flat.length, pageIx]);

  useEffect(() => {
    if (current && !editing) {
      setDraft(current.page.body_md || "");
    }
  }, [current?.page.id, current?.page.body_md, editing]);

  function applyBook(b: PlaybookEntry) {
    setBook(b);
    setDirty(true);
  }

  async function persistPage() {
    if (!current || busy) return;
    setBusy(true);
    setError(null);
    try {
      const b = await patchPlaybookPage(current.page.id, { body_md: draft });
      applyBook(b);
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Page save failed");
    } finally {
      setBusy(false);
    }
  }

  async function onSaveVersion() {
    if (!book || busy) return;
    if (editing) await persistPage();
    setBusy(true);
    setError(null);
    try {
      const out = await savePlaybookBook(book.id);
      setBook(out.book);
      setDirty(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Version save failed");
    } finally {
      setBusy(false);
    }
  }

  async function onDiscard() {
    if (!book || busy) return;
    const msg = book.is_draft
      ? "Discard this draft book permanently?"
      : "Discard uncommitted changes and restore last Save?";
    if (!window.confirm(msg)) return;
    setBusy(true);
    try {
      const out = await discardPlaybookBook(book.id);
      if (out.deleted) {
        router.push("/app/playbook");
        return;
      }
      if (out.book) {
        setBook(out.book);
        setDirty(false);
        setEditing(false);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Discard failed");
    } finally {
      setBusy(false);
    }
  }

  async function addChapter() {
    if (!book || !newChapterTitle.trim() || busy) return;
    setBusy(true);
    try {
      const b = await createPlaybookChapter(book.id, {
        title: newChapterTitle.trim(),
      });
      applyBook(b);
      setNewChapterTitle("");
      const f = flatten(b);
      setPageIx(Math.max(0, f.length - 1));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chapter failed");
    } finally {
      setBusy(false);
    }
  }

  async function addPage() {
    if (!current || busy) return;
    setBusy(true);
    try {
      const b = await createPlaybookPage(current.chapter.id, {
        body_md: "",
      });
      applyBook(b);
      const f = flatten(b);
      const lastInCh = f
        .map((x, i) => ({ x, i }))
        .filter(({ x }) => x.chapter.id === current.chapter.id)
        .pop();
      if (lastInCh) setPageIx(lastInCh.i);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Page failed");
    } finally {
      setBusy(false);
    }
  }

  async function removePage() {
    if (!current || busy) return;
    const pageLabel =
      current.page.title?.trim() ||
      `page ${(current.page.sort_order ?? 0) + 1} in “${current.chapter.title}”`;
    const ok = window.confirm(
      `Delete ${pageLabel}?\n\n` +
        "This removes the page from the working copy. " +
        "It is not gone from book history until you Save a new version " +
        "(or it was never versioned). This cannot be undone with Discard " +
        "if this is a draft with no Save yet.\n\n" +
        "Continue?",
    );
    if (!ok) return;
    setBusy(true);
    setError(null);
    try {
      const removedIx = pageIx;
      const b = await deletePlaybookPage(current.page.id);
      applyBook(b);
      setEditing(false);
      const f = flatten(b);
      if (f.length === 0) {
        setPageIx(0);
      } else {
        setPageIx(Math.min(removedIx, f.length - 1));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete page");
    } finally {
      setBusy(false);
    }
  }

  async function onUpload(file: File) {
    if (!book || busy) return;
    setBusy(true);
    try {
      await uploadPlaybookArchive(book.id, file);
      setArchive(await fetchPlaybookArchive(book.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  if (!bookId || Number.isNaN(bookId)) {
    return (
      <main className="p-6">
        <p>Invalid book.</p>
        <Link href="/app/playbook">← Library</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[1400px] px-4 py-4 pb-20 sm:px-6">
      <PracticeSuiteChrome
        active="playbook"
        hideStoryStrip
        hideToughness
        hideTitle
        breadcrumbUnderTitle
      >
        <div className="mt-4 space-y-3" data-testid="playbook-book">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/app/playbook"
              className="text-sm text-[var(--color-label-secondary)] hover:underline"
            >
              ← Library
            </Link>
            {book && (
              <>
                <h1 className="text-lg font-semibold text-[var(--color-label)] sm:text-xl">
                  {book.title}
                </h1>
                <button
                  type="button"
                  disabled={busy}
                  data-testid="playbook-export-book"
                  className="rounded-full border border-[var(--color-separator)] px-3 py-1 text-xs font-medium text-[var(--color-label)] hover:bg-[var(--color-fill)] disabled:opacity-50"
                  title="Download this book (chapters, pages, archive files)"
                  onClick={() => {
                    setBusy(true);
                    setError(null);
                    void downloadPlaybookBook(book.id, "zip")
                      .catch((e) =>
                        setError(
                          e instanceof Error ? e.message : "Export failed",
                        ),
                      )
                      .finally(() => setBusy(false));
                  }}
                >
                  Export book
                </button>
                {book.is_draft && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                    Draft
                  </span>
                )}
                {dirty && !book.is_draft && (
                  <span className="rounded-full bg-[var(--color-fill)] px-2 py-0.5 text-[10px] font-semibold uppercase text-[var(--color-label-secondary)]">
                    Unsaved changes
                  </span>
                )}
                {/* HIG capsule — related book actions (same pattern as PracticeSuiteNav) */}
                <div
                  className="ml-auto inline-flex max-w-full flex-wrap items-center gap-0.5 rounded-full bg-[var(--color-fill)] p-1"
                  role="group"
                  aria-label="Book actions"
                  data-testid="playbook-book-actions"
                >
                  <Link
                    href={`/app/playbook/${book.id}/present`}
                    data-testid="playbook-present-link"
                    className={[
                      "inline-flex min-h-9 items-center justify-center rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors sm:px-4",
                      "text-[var(--color-label-secondary)] hover:text-[var(--color-label)]",
                      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-tint)]",
                    ].join(" ")}
                  >
                    Present
                  </Link>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void onSaveVersion()}
                    data-testid="playbook-version-save"
                    className={[
                      "inline-flex min-h-9 items-center justify-center rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors sm:px-4",
                      "bg-[var(--color-tint)] text-[var(--color-on-tint)] shadow-[var(--elevation-1)]",
                      "hover:bg-[var(--color-tint-emphasis)]",
                      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-tint)]",
                      "disabled:pointer-events-none disabled:opacity-45",
                    ].join(" ")}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void onDiscard()}
                    className={[
                      "inline-flex min-h-9 items-center justify-center rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors sm:px-4",
                      "text-[var(--color-label-secondary)] hover:bg-[var(--color-surface)] hover:text-[var(--color-label)] hover:shadow-[var(--elevation-1)]",
                      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-tint)]",
                      "disabled:pointer-events-none disabled:opacity-45",
                    ].join(" ")}
                  >
                    Discard
                  </button>
                  {book.status === "active" && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        void patchPlaybookEntry(book.id, {
                          status: "archived",
                        }).then(load)
                      }
                      className={[
                        "inline-flex min-h-9 items-center justify-center rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors sm:px-4",
                        "text-[var(--color-label-secondary)] hover:bg-[var(--color-surface)] hover:text-[var(--color-label)] hover:shadow-[var(--elevation-1)]",
                        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-tint)]",
                        "disabled:pointer-events-none disabled:opacity-45",
                      ].join(" ")}
                    >
                      Archive
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          {loading && (
            <p className="text-sm text-[var(--color-label-tertiary)]">Loading…</p>
          )}

          {book && !loading && (
            <div className="grid gap-4 lg:grid-cols-[12rem_minmax(0,1fr)]">
              {/* Chapters + edit + compact archive */}
              <aside className="space-y-2 lg:max-w-[12rem]" data-testid="playbook-chapters">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
                  Chapters
                </p>
                <nav className="flex flex-col gap-1">
                  {book.chapters?.map((ch) => (
                    <div key={ch.id} className="space-y-0.5">
                      <p className="text-xs font-medium text-[var(--color-label)]">
                        {ch.title}
                      </p>
                      {ch.blurb && (
                        <p className="text-[10px] text-[var(--color-label-tertiary)]">
                          {ch.blurb}
                        </p>
                      )}
                      {(ch.pages || []).map((pg) => {
                        const ix = flat.findIndex((f) => f.page.id === pg.id);
                        const active = ix === pageIx;
                        return (
                          <button
                            key={pg.id}
                            type="button"
                            onClick={() => {
                              setPageIx(ix);
                              setEditing(false);
                            }}
                            className={`block w-full rounded-lg px-2 py-1.5 text-left text-xs ${
                              active
                                ? "bg-[var(--color-tint-soft)] font-medium text-[var(--color-label)]"
                                : "text-[var(--color-label-secondary)] hover:bg-[var(--color-fill)]"
                            }`}
                          >
                            {pg.title || `Page ${(pg.sort_order ?? 0) + 1}`}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </nav>
                {/* Apple HIG-style inset grouped controls for structure edits */}
                <div
                  className="mt-2 rounded-[var(--radius-lg)] border border-[var(--color-separator)] bg-[var(--color-surface)] p-2 shadow-[var(--elevation-1)]"
                  role="group"
                  aria-label="Edit book structure"
                  data-testid="playbook-edit-controls"
                >
                  <p className="px-2 pb-1.5 pt-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
                    Edit
                  </p>
                  <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-separator)] bg-[var(--color-fill)]/40">
                    <label className="block border-b border-[var(--color-separator)] px-2.5 py-2">
                      <span className="sr-only">New chapter title</span>
                      <input
                        className="w-full border-0 bg-transparent text-xs text-[var(--color-label)] outline-none placeholder:text-[var(--color-label-tertiary)]"
                        placeholder="New chapter title"
                        value={newChapterTitle}
                        onChange={(e) => setNewChapterTitle(e.target.value)}
                      />
                    </label>
                    <button
                      type="button"
                      disabled={busy || !newChapterTitle.trim()}
                      onClick={() => void addChapter()}
                      className="flex min-h-9 w-full items-center justify-center border-b border-[var(--color-separator)] px-2.5 text-xs font-medium text-[var(--color-label)] transition-colors hover:bg-[var(--color-fill)] disabled:pointer-events-none disabled:opacity-45"
                    >
                      Add chapter
                    </button>
                    <button
                      type="button"
                      disabled={busy || !current}
                      onClick={() => void addPage()}
                      className="flex min-h-9 w-full items-center justify-center border-b border-[var(--color-separator)] px-2.5 text-xs font-medium text-[var(--color-label)] transition-colors hover:bg-[var(--color-fill)] disabled:pointer-events-none disabled:opacity-45"
                    >
                      Add page
                    </button>
                    {!editing ? (
                      <button
                        type="button"
                        disabled={!current || busy}
                        onClick={() => {
                          setDraft(current?.page.body_md || "");
                          setEditing(true);
                        }}
                        data-testid="playbook-edit-page"
                        className="flex min-h-9 w-full items-center justify-center border-b border-[var(--color-separator)] px-2.5 text-xs font-medium text-[var(--color-tint)] transition-colors hover:bg-[var(--color-fill)] disabled:pointer-events-none disabled:opacity-45"
                      >
                        Edit page
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void persistPage()}
                          data-testid="playbook-apply-page"
                          className="flex min-h-9 w-full items-center justify-center border-b border-[var(--color-separator)] bg-[var(--color-tint)] px-2.5 text-xs font-semibold text-[var(--color-on-tint)] transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-45"
                        >
                          Apply page
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditing(false);
                            setDraft(current?.page.body_md || "");
                          }}
                          className="flex min-h-9 w-full items-center justify-center border-b border-[var(--color-separator)] px-2.5 text-xs font-medium text-[var(--color-label-secondary)] transition-colors hover:bg-[var(--color-fill)]"
                        >
                          Cancel edit
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      disabled={busy || !current}
                      onClick={() => void removePage()}
                      data-testid="playbook-delete-page"
                      className="flex min-h-9 w-full items-center justify-center px-2.5 text-xs font-medium text-red-600 transition-colors hover:bg-[var(--color-fill)] disabled:pointer-events-none disabled:opacity-45 dark:text-red-400"
                    >
                      Delete page
                    </button>
                  </div>
                </div>

                {/* Archive — compact under edit (no third column; better responsive) */}
                <div
                  className="mt-2 rounded-[var(--radius-lg)] border border-[var(--color-separator)] bg-[var(--color-surface)] p-2 shadow-[var(--elevation-1)]"
                  data-testid="playbook-archive"
                >
                  <button
                    type="button"
                    className="flex w-full items-center justify-between px-1 py-1 text-left"
                    onClick={() => setArchiveOpen((o) => !o)}
                    aria-expanded={archiveOpen}
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
                      Archive{archive.length ? ` (${archive.length})` : ""}
                    </span>
                    <span className="text-[10px] text-[var(--color-label-tertiary)]">
                      {archiveOpen ? "Hide" : "Show"}
                    </span>
                  </button>
                  {archiveOpen && (
                    <div className="mt-1 space-y-1.5 border-t border-[var(--color-separator)] pt-2">
                      <label className="flex cursor-pointer items-center justify-center rounded-[var(--radius-md)] border border-dashed border-[var(--color-separator)] px-2 py-1.5 text-[10px] font-medium text-[var(--color-tint)] hover:bg-[var(--color-fill)]">
                        Upload file
                        <input
                          type="file"
                          className="sr-only"
                          accept="image/*,application/pdf"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) void onUpload(f);
                            e.target.value = "";
                          }}
                        />
                      </label>
                      {archive.length === 0 && (
                        <p className="px-1 text-[10px] text-[var(--color-label-tertiary)]">
                          Staple charts/PDFs here. Link journals from Journal.
                        </p>
                      )}
                      <ul className="max-h-40 space-y-1 overflow-y-auto">
                        {archive.map((a) => (
                          <li
                            key={a.id}
                            className="rounded-md border border-[var(--color-separator)] px-1.5 py-1 text-[10px]"
                          >
                            <div className="flex justify-between gap-1">
                              <a
                                href={a.download_path}
                                className="truncate font-medium text-[var(--color-tint)] hover:underline"
                                target="_blank"
                                rel="noreferrer"
                              >
                                {a.original_name || `file-${a.id}`}
                              </a>
                              <button
                                type="button"
                                className="shrink-0 text-[var(--color-label-tertiary)] hover:underline"
                                onClick={() =>
                                  void removePlaybookArchive(book.id, a.id).then(
                                    setArchive,
                                  )
                                }
                              >
                                ×
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </aside>

              {/* Stage — full remaining width */}
              <section className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs text-[var(--color-label-tertiary)]">
                    {current
                      ? `${current.chapter.title} · page ${pageIx + 1} of ${flat.length}`
                      : "No pages"}
                  </p>
                  <div className="ml-auto flex gap-1">
                    <Button
                      type="button"
                      variant="secondary"
                      className="!min-h-8 !px-2 !text-xs"
                      disabled={pageIx <= 0}
                      onClick={() => setPageIx((i) => Math.max(0, i - 1))}
                      aria-label="Previous page"
                    >
                      ←
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      className="!min-h-8 !px-2 !text-xs"
                      disabled={pageIx >= flat.length - 1}
                      onClick={() =>
                        setPageIx((i) => Math.min(flat.length - 1, i + 1))
                      }
                      aria-label="Next page"
                    >
                      →
                    </Button>
                  </div>
                </div>
                {current && (
                  <PlaybookStage
                    title={current.page.title || current.chapter.title}
                    bodyMd={current.page.body_md}
                    editing={editing}
                    draft={draft}
                    onDraftChange={(v) => {
                      setDraft(v);
                      setDirty(true);
                    }}
                  />
                )}
                <div className="pt-2">
                  <p className="mb-1 text-xs font-medium text-[var(--color-label-secondary)]">
                    Tags
                  </p>
                  <TagPicker objectType="playbook_entry" objectId={book.id} />
                </div>
              </section>
            </div>
          )}
        </div>
      </PracticeSuiteChrome>
    </main>
  );
}
