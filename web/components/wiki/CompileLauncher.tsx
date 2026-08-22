"use client";

// Operator chrome — "Compile this into Wiki" (Admin Interface v0.1.2 §3).
// Not the member HelpLauncher corner. Visible mark (OD-WA3 W1). Administrator only.

import { usePathname } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import {
  captureCompileContext,
  surfaceForPath,
} from "@/lib/wiki/compileSurfaces";

export default function CompileLauncher() {
  const pathname = usePathname() || "";
  const [admin, setAdmin] = useState(false);
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const surface = surfaceForPath(pathname);

  useEffect(() => {
    let alive = true;
    fetch("/api/auth/me", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (alive) setAdmin(d?.role === "administrator");
      })
      .catch(() => {
        if (alive) setAdmin(false);
      });
    return () => {
      alive = false;
    };
  }, [pathname]);

  if (!admin || !surface) return null;

  async function submit(compileNow: boolean) {
    const cap = captureCompileContext(pathname, window.location.search);
    if (!cap) return;
    setBusy(true);
    setMsg(null);
    try {
      const r = await fetch("/api/wiki/compile-candidates", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...cap,
          note: note.trim() || undefined,
          compile_now: compileNow,
          target: "wiki",
        }),
      });
      const body = await r.json().catch(() => ({}));
      if (!r.ok) {
        setMsg(typeof body.detail === "string" ? body.detail : "Could not save");
        return;
      }
      setMsg(compileNow ? "Compiling…" : "Added to inbox");
      setNote("");
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  function onSheet(e: FormEvent) {
    e.preventDefault();
  }

  return (
    <div
      className="pointer-events-none fixed right-4 top-[5.5rem] z-40 flex flex-col items-end gap-2"
      data-testid="wiki-compile-launcher"
    >
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          setMsg(null);
        }}
        className="pointer-events-auto min-h-[var(--hit-min)] rounded-full border border-[var(--color-separator)] bg-[var(--color-surface)] px-4 text-sm font-medium text-[var(--color-label)] shadow-[var(--elevation-1)] hover:border-[var(--color-tint)]"
      >
        Compile this into Wiki
      </button>
      {msg && !open && (
        <p className="pointer-events-auto text-xs text-[var(--color-label-secondary)]">
          {msg}
        </p>
      )}
      {open && (
        <form
          onSubmit={onSheet}
          className="pointer-events-auto w-[min(92vw,20rem)] rounded-2xl border border-[var(--color-separator)] bg-[var(--color-surface)] p-4 shadow-[var(--elevation-2)]"
          data-testid="wiki-compile-sheet"
        >
          <p className="text-sm font-medium text-[var(--color-label)]">
            Compile this into Wiki
          </p>
          <p className="mt-1 text-xs text-[var(--color-label-tertiary)]">
            {surface}
          </p>
          <fieldset className="mt-3">
            <legend className="text-xs text-[var(--color-label-secondary)]">
              Target
            </legend>
            <label className="mt-1 flex min-h-[var(--hit-min)] items-center gap-2 text-sm">
              <input type="radio" name="target" checked readOnly />
              Wiki
            </label>
            <label className="flex min-h-[var(--hit-min)] items-center gap-2 text-sm text-[var(--color-label-tertiary)]">
              <input type="radio" name="help" disabled />
              Help (not yet)
            </label>
            <label className="flex min-h-[var(--hit-min)] items-center gap-2 text-sm text-[var(--color-label-tertiary)]">
              <input type="radio" name="both" disabled />
              Both (not yet)
            </label>
          </fieldset>
          <label className="mt-2 block text-xs text-[var(--color-label-secondary)]">
            Note
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[var(--color-separator)] bg-[var(--color-fill)] px-3 py-2 text-sm text-[var(--color-label)]"
            />
          </label>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => submit(true)}
              className="min-h-[var(--hit-min)] rounded-full bg-[var(--color-tint)] px-4 text-sm font-medium text-[var(--color-on-tint)] disabled:opacity-50"
            >
              Compile now
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => submit(false)}
              className="min-h-[var(--hit-min)] rounded-full border border-[var(--color-separator)] px-4 text-sm font-medium text-[var(--color-label)] disabled:opacity-50"
            >
              Add to inbox
            </button>
          </div>
        </form>
      )}
    </div>
  );
}