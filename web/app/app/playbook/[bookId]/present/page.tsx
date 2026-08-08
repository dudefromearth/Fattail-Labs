"use client";

/**
 * Present mode — chrome-free 16:9 scrapbook (Spec v1.1a §3.2 / S4).
 * No product chrome, no identity chrome. Keyboard ← → Esc.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import PlaybookStage from "@/components/playbook/PlaybookStage";
import {
  fetchPlaybookBook,
  type PlaybookChapter,
  type PlaybookEntry,
  type PlaybookPage,
} from "@/lib/practiceSpineApi";

type FlatPage = {
  chapter: PlaybookChapter;
  page: PlaybookPage;
};

function flatten(book: PlaybookEntry | null): FlatPage[] {
  if (!book?.chapters) return [];
  const out: FlatPage[] = [];
  for (const ch of book.chapters) {
    for (const page of ch.pages || []) {
      out.push({ chapter: ch, page });
    }
  }
  return out;
}

export default function PlaybookPresentPage() {
  const params = useParams();
  const router = useRouter();
  const bookId = Number(params?.bookId);
  const [book, setBook] = useState<PlaybookEntry | null>(null);
  const [pageIx, setPageIx] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState(true);

  const load = useCallback(async () => {
    if (!bookId || Number.isNaN(bookId)) return;
    try {
      setBook(await fetchPlaybookBook(bookId, true));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    }
  }, [bookId]);

  useEffect(() => {
    void load();
  }, [load]);

  const flat = useMemo(() => flatten(book), [book]);
  const current = flat[pageIx] ?? flat[0];

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        setPageIx((i) => Math.min(flat.length - 1, i + 1));
        setHint(false);
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        setPageIx((i) => Math.max(0, i - 1));
        setHint(false);
      } else if (e.key === "Escape") {
        router.push(`/app/playbook/${bookId}`);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [bookId, flat.length, router]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-black p-6 text-white">
        <p>{error}</p>
        <Link href="/app/playbook" className="underline">
          Library
        </Link>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-zinc-950 text-zinc-50"
      data-testid="playbook-present"
      /* No site header / identity — intentional */
    >
      {/* Minimal exit only — no name/avatar */}
      <div className="flex shrink-0 items-center justify-between px-4 py-2 text-xs text-zinc-500">
        <button
          type="button"
          className="hover:text-zinc-300"
          onClick={() => router.push(`/app/playbook/${bookId}`)}
        >
          Esc · Exit present
        </button>
        <span className="tabular-nums">
          {flat.length ? `${pageIx + 1} / ${flat.length}` : "—"}
        </span>
        {book && (
          <span className="max-w-[40%] truncate text-zinc-600" title={book.title}>
            {book.title}
          </span>
        )}
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center p-4 md:p-8">
        <div className="aspect-video w-full max-w-6xl overflow-hidden rounded-lg bg-zinc-900 shadow-2xl">
          {current ? (
            <PlaybookStage
              present
              title={current.page.title || current.chapter.title}
              bodyMd={current.page.body_md}
            />
          ) : (
            <p className="flex h-full items-center justify-center text-zinc-500">
              No pages
            </p>
          )}
        </div>
      </div>

      {hint && (
        <p className="pb-4 text-center text-xs text-zinc-600">
          ← → navigate · Esc exit · screenshot-friendly frame
        </p>
      )}
    </div>
  );
}
