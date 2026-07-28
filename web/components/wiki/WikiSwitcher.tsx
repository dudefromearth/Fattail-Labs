"use client";

// ⌘K quick switcher — Wiki Interface Spec (WI8). Mounted by the wiki layout
// so it is live on every wiki route. Fuzzy match via /api/wiki/search.

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type SwitcherResult = {
  slug: string;
  title: string;
  kind: string;
};

export default function WikiSwitcher() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SwitcherResult[]>([]);
  const [selected, setSelected] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const close = useCallback(() => {
    setOpen(false);
    setQ("");
    setResults([]);
    setSelected(0);
  }, []);

  // Global ⌘K / Ctrl+K toggle.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      } else if (e.key === "Escape" && open) {
        e.preventDefault();
        close();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Debounced search.
  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const term = q.trim();
    if (!term) {
      setResults([]);
      setSelected(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(() => {
      fetch(`/api/wiki/search?q=${encodeURIComponent(term)}`, {
        credentials: "same-origin",
      })
        .then((r) => (r.ok ? r.json() : { results: [] }))
        .then((data) => {
          setResults(
            (data.results || []).map((r: SwitcherResult) => ({
              slug: r.slug,
              title: r.title,
              kind: r.kind,
            })),
          );
          setSelected(0);
          setLoading(false);
        })
        .catch(() => {
          setResults([]);
          setLoading(false);
        });
    }, 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [q, open]);

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, Math.max(results.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const hit = results[selected];
      if (hit) {
        close();
        router.push(`/app/wiki/${encodeURIComponent(hit.slug)}`);
      }
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-[var(--color-overlay)] px-4 pt-[15vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Quick switcher"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="surface-card w-full max-w-lg overflow-hidden rounded-2xl border border-[var(--color-separator)] shadow-[var(--elevation-1)]">
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={onInputKeyDown}
          placeholder="Jump to a page…"
          autoComplete="off"
          className="w-full border-b border-[var(--color-separator)] bg-transparent px-5 py-4 text-base text-[var(--color-label)] outline-none placeholder:text-[var(--color-label-tertiary)]"
        />
        <ul className="max-h-72 overflow-y-auto py-2" role="listbox">
          {results.map((r, i) => (
            <li key={r.slug} role="option" aria-selected={i === selected}>
              <button
                type="button"
                onMouseEnter={() => setSelected(i)}
                onClick={() => {
                  close();
                  router.push(`/app/wiki/${encodeURIComponent(r.slug)}`);
                }}
                className={`flex w-full items-baseline justify-between gap-3 px-5 py-2 text-left text-sm ${
                  i === selected
                    ? "bg-[var(--color-tint-soft)] text-[var(--color-label)]"
                    : "text-[var(--color-label-secondary)]"
                }`}
              >
                <span className="truncate">{r.title}</span>
                <span className="shrink-0 text-xs uppercase tracking-wide text-[var(--color-label-tertiary)]">
                  {r.kind}
                </span>
              </button>
            </li>
          ))}
          {!loading && q.trim() && results.length === 0 && (
            <li className="px-5 py-3 text-sm text-[var(--color-label-secondary)]">
              No matches for “{q.trim()}”
            </li>
          )}
          {!q.trim() && (
            <li className="px-5 py-3 text-sm text-[var(--color-label-tertiary)]">
              Type to search pages · Enter opens · Esc closes
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
