"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

/** Search-first widget (Wiki Interface §2). Same control on About and Wiki home. */
export default function WikiSearchWidget({ inputId = "wiki-search" }: { inputId?: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [isMac, setIsMac] = useState(true);

  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent));
  }, []);

  function onSearch(e: FormEvent) {
    e.preventDefault();
    const term = q.trim();
    if (!term) {
      inputRef.current?.focus();
      return;
    }
    router.push(`/app/wiki/search?q=${encodeURIComponent(term)}`);
  }

  return (
    <form onSubmit={onSearch} data-testid="wiki-search-widget">
      <label htmlFor={inputId} className="sr-only">
        Search topics, transcripts, lessons
      </label>
      <div className="relative">
        <input
          id={inputId}
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search topics, transcripts, lessons…"
          autoComplete="off"
          className="w-full rounded-2xl border border-[var(--color-separator)] bg-[var(--color-surface)] px-5 py-4 text-base text-[var(--color-label)] shadow-[var(--elevation-1)] outline-none ring-[var(--color-tint)] placeholder:text-[var(--color-label-tertiary)] focus:ring-2"
        />
        <span className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 text-xs text-[var(--color-label-tertiary)] sm:inline">
          {isMac ? "⌘K" : "Ctrl K"}
        </span>
      </div>
      <button
        type="submit"
        className="mt-3 rounded-full bg-[var(--color-tint)] px-5 py-2 text-sm font-medium text-[var(--color-on-tint)] hover:bg-[var(--color-tint-emphasis)]"
      >
        Search
      </button>
    </form>
  );
}
