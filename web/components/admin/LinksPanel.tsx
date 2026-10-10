"use client";

// Links / QR — admin list + create (LK-1.1, W3 minimal surface, plus
// search/filter, campaign tagging, and bulk activate/deactivate).

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import SegmentedControl from "@/components/ui/SegmentedControl";

type LinkRow = {
  slug: string;
  short_url: string;
  destination: string;
  label: string;
  active: boolean;
  static: boolean;
  source: string | null;
  medium: string | null;
  campaign: string | null;
  placement: string | null;
  scans: number | null;
  last_scan: string | null;
  created_at: string;
};

const ALL_CAMPAIGNS = "__all__";
const NO_CAMPAIGN = "__none__";

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

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [campaignFilter, setCampaignFilter] = useState(ALL_CAMPAIGNS);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkWorking, setBulkWorking] = useState(false);

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

  const campaigns = useMemo(() => {
    const set = new Set<string>();
    for (const l of links) {
      if (l.campaign) set.add(l.campaign);
    }
    return Array.from(set).sort();
  }, [links]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return links.filter((l) => {
      if (q && !l.label.toLowerCase().includes(q) && !l.destination.toLowerCase().includes(q)) {
        return false;
      }
      if (statusFilter === "active" && !l.active) return false;
      if (statusFilter === "inactive" && l.active) return false;
      if (campaignFilter === NO_CAMPAIGN && l.campaign) return false;
      if (campaignFilter !== ALL_CAMPAIGNS && campaignFilter !== NO_CAMPAIGN && l.campaign !== campaignFilter) {
        return false;
      }
      return true;
    });
  }, [links, search, statusFilter, campaignFilter]);

  function resetToFirstPage() {
    setPage(0);
  }

  function toggleSelected(slug: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  async function bulkSetActive(active: boolean) {
    if (!selected.size) return;
    setBulkWorking(true);
    try {
      await Promise.all(
        Array.from(selected).map((slug) =>
          fetch(`/api/admin/links/${slug}`, {
            method: "PATCH",
            credentials: "same-origin",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ active }),
          }),
        ),
      );
      setSelected(new Set());
      load();
    } finally {
      setBulkWorking(false);
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
  const totalPages = Math.max(1, Math.ceil(filtered.length / size));
  const pageClamped = Math.min(page, totalPages - 1);
  const pageLinks = filtered.slice(pageClamped * size, pageClamped * size + size);
  const pageSlugs = pageLinks.map((l) => l.slug);
  const allOnPageSelected = pageSlugs.length > 0 && pageSlugs.every((s) => selected.has(s));

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

      <div className="mb-3 flex flex-wrap items-center gap-3">
        <input
          className="min-w-[12rem] flex-1 rounded-[var(--radius-md)] border border-[var(--color-separator)] bg-[var(--color-surface)] px-3 py-2 text-[length:var(--text-subheadline)] text-[var(--color-label)]"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            resetToFirstPage();
          }}
          placeholder="Search label or destination…"
          data-testid="links-search-input"
        />
        <select
          className="rounded-[var(--radius-md)] border border-[var(--color-separator)] bg-[var(--color-surface)] px-3 py-2 text-[length:var(--text-footnote)] text-[var(--color-label)]"
          value={campaignFilter}
          onChange={(e) => {
            setCampaignFilter(e.target.value);
            resetToFirstPage();
          }}
          data-testid="links-campaign-filter"
        >
          <option value={ALL_CAMPAIGNS}>All campaigns</option>
          <option value={NO_CAMPAIGN}>No campaign</option>
          {campaigns.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <div className="w-44">
          <SegmentedControl
            value={statusFilter}
            onChange={(v) => {
              setStatusFilter(v);
              resetToFirstPage();
            }}
            ariaLabel="Status filter"
            options={[
              { id: "all", label: "All" },
              { id: "active", label: "Active" },
              { id: "inactive", label: "Inactive" },
            ]}
          />
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[length:var(--text-caption)] text-[var(--color-label-tertiary)]">
          {filtered.length} of {links.length} link{links.length === 1 ? "" : "s"}
          {selected.size > 0 ? ` · ${selected.size} selected` : ""}
        </p>
        <div className="flex items-center gap-3">
          {selected.size > 0 && (
            <>
              <Button variant="secondary" disabled={bulkWorking} onClick={() => bulkSetActive(false)}>
                Deactivate selected
              </Button>
              <Button variant="secondary" disabled={bulkWorking} onClick={() => bulkSetActive(true)}>
                Reactivate selected
              </Button>
            </>
          )}
          <div className="w-40">
            <SegmentedControl
              value={pageSize}
              onChange={(v) => {
                setPageSize(v);
                resetToFirstPage();
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

      {pageLinks.length > 0 && (
        <label className="mb-2 flex items-center gap-2 text-[length:var(--text-caption)] text-[var(--color-label-tertiary)]">
          <input
            type="checkbox"
            checked={allOnPageSelected}
            onChange={(e) => {
              setSelected((prev) => {
                const next = new Set(prev);
                if (e.target.checked) pageSlugs.forEach((s) => next.add(s));
                else pageSlugs.forEach((s) => next.delete(s));
                return next;
              });
            }}
          />
          Select all on this page
        </label>
      )}

      <ul className="space-y-3">
        {pageLinks.map((l) => (
          <li
            key={l.slug}
            className="flex items-center gap-4 rounded-[var(--radius-xl)] bg-[var(--color-surface)] p-4 shadow-[var(--elevation-1)]"
            data-testid={`link-row-${l.slug}`}
          >
            <input
              type="checkbox"
              className="flex-none"
              checked={selected.has(l.slug)}
              onChange={() => toggleSelected(l.slug)}
              aria-label={`Select ${l.label}`}
            />
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
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/admin/links/${l.slug}`}
                  className="text-[length:var(--text-subheadline)] font-semibold text-[var(--color-label)] hover:underline"
                >
                  {l.label}
                </Link>
                {l.campaign && (
                  <span className="rounded-[var(--radius-full)] bg-[var(--color-tint-soft)] px-2 py-0.5 text-[length:var(--text-caption)] font-medium text-[var(--color-tint-emphasis)]">
                    {l.campaign}
                  </span>
                )}
              </div>
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
        {!pageLinks.length && (
          <li className="rounded-[var(--radius-xl)] border border-dashed border-[var(--color-separator)] p-6 text-center text-[length:var(--text-subheadline)] text-[var(--color-label-secondary)]">
            {links.length ? "No links match these filters." : "No links yet. Create one above."}
          </li>
        )}
      </ul>

      {filtered.length > size && (
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
