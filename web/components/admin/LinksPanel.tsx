"use client";

// Links / QR — admin list + create (LK-1.1, W3 minimal surface).

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import SegmentedControl from "@/components/ui/SegmentedControl";

type LinkRow = {
  slug: string;
  short_url: string;
  destination: string;
  label: string;
  active: boolean;
  static: boolean;
  scans: number | null;
  last_scan: string | null;
  created_at: string;
};

export default function LinksPanel() {
  const [state, setState] = useState<"loading" | "denied" | "ready">("loading");
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [destination, setDestination] = useState("");
  const [label, setLabel] = useState("");
  const [isStatic, setIsStatic] = useState(false);
  const [creating, setCreating] = useState(false);

  const [pageSize, setPageSize] = useState<"10" | "25" | "50">("10");
  const [page, setPage] = useState(0);

  const load = useCallback(() => {
    fetch("/api/admin/links", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) {
          setState("denied");
          return;
        }
        setLinks(d.links || []);
        setState("ready");
      })
      .catch(() => setState("denied"));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Live reporting: scan counts update without a manual refresh.
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") {
        load();
      }
    }, 5000);
    return () => clearInterval(id);
  }, [load]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCreating(true);
    try {
      const res = await fetch("/api/admin/links", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ destination, label, static: isStatic }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.detail ? String(data.detail) : `create failed (${res.status})`);
      }
      setDestination("");
      setLabel("");
      setIsStatic(false);
      setPage(0);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "create failed");
    } finally {
      setCreating(false);
    }
  }

  if (state === "loading") {
    return <main className="p-8 text-[var(--color-label-secondary)]">Loading links…</main>;
  }
  if (state === "denied") {
    return (
      <main className="p-8" data-testid="links-denied">
        <h1 className="text-[length:var(--text-title-1)] font-semibold text-[var(--color-label)]">Links / QR</h1>
        <p className="mt-2 text-[var(--color-destructive)]">Administrator sign-in required.</p>
      </main>
    );
  }

  const size = Number(pageSize);
  const totalPages = Math.max(1, Math.ceil(links.length / size));
  const pageClamped = Math.min(page, totalPages - 1);
  const pageLinks = links.slice(pageClamped * size, pageClamped * size + size);

  return (
    <main className="mx-auto max-w-4xl p-6" data-testid="links-panel">
      <nav className="mb-4 text-[length:var(--text-footnote)]">
        <Link href="/admin" className="text-[var(--color-label-secondary)] hover:underline">
          ← Admin
        </Link>
      </nav>
      <header className="mb-6">
        <h1 className="text-[length:var(--text-title-1)] font-semibold tracking-tight text-[var(--color-label)]">
          Links / QR
        </h1>
        <p className="mt-1 text-[length:var(--text-subheadline)] text-[var(--color-label-secondary)]">
          Dynamic short links on{" "}
          <code className="rounded-[var(--radius-sm)] bg-[var(--color-fill)] px-1 text-[length:var(--text-caption)]">
            labs.fattail.ai/q/&lt;slug&gt;
          </code>
          . Edit the destination without reprinting; scans are logged per link.
        </p>
      </header>

      <form
        onSubmit={onCreate}
        className="mb-8 rounded-[var(--radius-xl)] bg-[var(--color-surface)] p-5 shadow-[var(--elevation-1)]"
        data-testid="links-create-form"
      >
        <h2 className="mb-3 text-[length:var(--text-footnote)] font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
          New link
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-[length:var(--text-caption)] text-[var(--color-label-secondary)]">
            Label
            <input
              className="mt-1 w-full rounded-[var(--radius-md)] border border-[var(--color-separator)] bg-[var(--color-surface)] px-3 py-2 text-[length:var(--text-subheadline)] text-[var(--color-label)]"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="6 Week Trial"
              required
              data-testid="links-label-input"
            />
          </label>
          <label className="text-[length:var(--text-caption)] text-[var(--color-label-secondary)]">
            Destination URL (https only)
            <input
              className="mt-1 w-full rounded-[var(--radius-md)] border border-[var(--color-separator)] bg-[var(--color-surface)] px-3 py-2 text-[length:var(--text-subheadline)] text-[var(--color-label)]"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="https://fattail.ai/..."
              required
              data-testid="links-destination-input"
            />
          </label>
        </div>
        <label className="mt-3 flex items-center gap-2 text-[length:var(--text-caption)] text-[var(--color-label-secondary)]">
          <input type="checkbox" checked={isStatic} onChange={(e) => setIsStatic(e.target.checked)} />
          Static (image encodes the destination directly — not tracked)
        </label>
        {error && <p className="mt-2 text-[length:var(--text-footnote)] text-[var(--color-destructive)]">{error}</p>}
        <div className="mt-3">
          <Button type="submit" variant="primary" disabled={creating} data-testid="links-create-submit">
            {creating ? "Creating…" : "Create link"}
          </Button>
        </div>
      </form>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[length:var(--text-caption)] text-[var(--color-label-tertiary)]">
          {links.length} link{links.length === 1 ? "" : "s"}
        </p>
        <div className="flex items-center gap-3">
          <div className="w-40">
            <SegmentedControl
              value={pageSize}
              onChange={(v) => {
                setPageSize(v);
                setPage(0);
              }}
              ariaLabel="Links per page"
              options={[
                { id: "10", label: "10" },
                { id: "25", label: "25" },
                { id: "50", label: "50" },
              ]}
            />
          </div>
          <Button variant="secondary" onClick={() => load()}>
            Refresh
          </Button>
        </div>
      </div>

      <ul className="space-y-3">
        {pageLinks.map((l) => (
          <li
            key={l.slug}
            className="flex items-center gap-4 rounded-[var(--radius-xl)] bg-[var(--color-surface)] p-4 shadow-[var(--elevation-1)]"
            data-testid={`link-row-${l.slug}`}
          >
            {!l.static && (
              <Link href={`/admin/links/${l.slug}`} className="flex-none">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/admin/links/${l.slug}/qr.svg`}
                  alt=""
                  className="h-16 w-16 rounded-[var(--radius-md)] border border-[var(--color-separator)]"
                />
              </Link>
            )}
            <div className="min-w-0 flex-1">
              <Link
                href={`/admin/links/${l.slug}`}
                className="text-[length:var(--text-subheadline)] font-semibold text-[var(--color-label)] hover:underline"
              >
                {l.label}
              </Link>
              <p className="truncate text-[length:var(--text-footnote)] text-[var(--color-label-secondary)]">
                {l.destination}
              </p>
              <p className="font-[var(--font-mono)] text-[length:var(--text-caption)] text-[var(--color-label-tertiary)]">
                {l.short_url}
              </p>
            </div>
            <div className="flex-none text-right text-[length:var(--text-footnote)] text-[var(--color-label-secondary)]">
              {l.static ? (
                <span className="text-[var(--color-label-tertiary)]">static — not tracked</span>
              ) : (
                <>
                  <div className="text-[length:var(--text-title-3)] font-semibold text-[var(--color-label)]">
                    {l.scans ?? 0}
                  </div>
                  <div>scans</div>
                </>
              )}
              {!l.active && <div className="mt-1 text-[var(--color-destructive)]">inactive</div>}
              <Link
                href={`/admin/links/${l.slug}`}
                className="mt-2 inline-block rounded-[var(--radius-full)] bg-[var(--color-fill)] px-2.5 py-1 text-[length:var(--text-caption)] font-medium text-[var(--color-label)]"
                data-testid={`link-view-report-${l.slug}`}
              >
                View reporting →
              </Link>
            </div>
          </li>
        ))}
        {!links.length && (
          <li className="rounded-[var(--radius-xl)] border border-dashed border-[var(--color-separator)] p-6 text-center text-[length:var(--text-subheadline)] text-[var(--color-label-secondary)]">
            No links yet. Create one above.
          </li>
        )}
      </ul>

      {links.length > size && (
        <div className="mt-4 flex items-center justify-between text-[length:var(--text-caption)] text-[var(--color-label-secondary)]">
          <span>
            Page {pageClamped + 1} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              disabled={pageClamped === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              disabled={pageClamped >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}
