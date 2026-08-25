"use client";

import { useEffect, useState } from "react";

type LiveTemplate = {
  id: number;
  title: string;
  live_at: string | null;
  product_type: string | null;
  product_tier: string | null;
  free_vs_paid: string | null;
  published?: boolean;
  obtainable?: boolean;
};

export default function IkiFactoryLiveCatalog() {
  const [items, setItems] = useState<LiveTemplate[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/iki-factory/live", { credentials: "same-origin" })
      .then(async (r) => {
        if (!r.ok) {
          setError("Could not load Live templates.");
          setItems([]);
          return;
        }
        const data = (await r.json()) as { templates: LiveTemplate[] };
        setItems(data.templates ?? []);
      })
      .catch(() => {
        setError("Could not load Live templates.");
        setItems([]);
      });
  }, []);

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10" data-testid="iki-factory-live">
      <h1 className="text-3xl font-semibold tracking-tight text-[var(--color-label)]">
        IKI Factory
      </h1>
      <p className="mt-2 text-[var(--color-label-secondary)]">
        Published templates. The factory floor is admin-only. This is not a
        second Wiki, and it is not a results promise. Free templates here are
        obtainable. Paid templates are listed, not obtainable, until the store
        is attached.
      </p>
      {error ? (
        <p className="mt-6 text-sm text-red-700 dark:text-red-400" role="status">
          {error}
        </p>
      ) : null}
      {items === null ? (
        <p className="mt-8 text-sm text-[var(--color-label-tertiary)]">Loading…</p>
      ) : items.length === 0 ? (
        <p
          className="mt-8 text-sm text-[var(--color-label-tertiary)]"
          data-testid="iki-factory-live-empty"
        >
          No Published templates yet.
        </p>
      ) : (
        <ul className="mt-8 space-y-3" data-testid="iki-factory-live-list">
          {items.map((t) => (
            <li
              key={t.id}
              className="rounded-lg border border-[var(--color-separator)] bg-[var(--color-surface)] p-4 shadow-[var(--elevation-1)]"
              data-testid={`iki-factory-live-${t.id}`}
            >
              <p className="font-medium text-[var(--color-label)]">{t.title}</p>
              <p className="mt-1 text-xs text-[var(--color-label-secondary)]">
                {[t.product_type, t.product_tier, t.free_vs_paid]
                  .filter(Boolean)
                  .join(" · ")}
                {t.obtainable ? " · obtainable" : " · not obtainable"}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
