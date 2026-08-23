"use client";

// Article rail shell — Interface Spec v0.1 §3.2. Empty sections omit their
// heading (Related / In your practice hide until S4/S6 fill them). Desktop:
// aside. Mobile: collapsed <details> below the article.

import Link from "next/link";

export type WikiRailItem = {
  key: string;
  label: string;
  href?: string;
};

export type WikiRailSection = {
  id: string;
  title: string;
  items: WikiRailItem[];
};

function headingClass() {
  return "text-sm font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]";
}

function RailList({ items }: { items: WikiRailItem[] }) {
  return (
    <ul className="mt-3 space-y-1 text-sm">
      {items.map((item) => (
        <li
          key={item.key}
          className={item.href ? "" : "text-[var(--color-label-secondary)]"}
        >
          {item.href ? (
            <Link
              href={item.href}
              className="text-[var(--color-tint)] hover:underline"
            >
              {item.label}
            </Link>
          ) : (
            item.label
          )}
        </li>
      ))}
    </ul>
  );
}

export default function WikiArticleRail({
  sections,
  variant,
}: {
  sections: WikiRailSection[];
  variant: "desktop" | "mobile";
}) {
  const visible = sections.filter((s) => s.items.length > 0);
  if (visible.length === 0) return null;

  if (variant === "desktop") {
    return (
      <aside className="hidden space-y-8 lg:block" aria-label="Page connections">
        {visible.map((s) => (
          <section key={s.id} aria-labelledby={`wiki-rail-${s.id}`}>
            <h2 id={`wiki-rail-${s.id}`} className={headingClass()}>
              {s.title}
            </h2>
            <RailList items={s.items} />
          </section>
        ))}
      </aside>
    );
  }

  return (
    <div className="mt-10 space-y-3 lg:hidden">
      {visible.map((s) => (
        <details
          key={s.id}
          className="border-t border-[var(--color-separator)] pt-3"
        >
          <summary className={`cursor-pointer ${headingClass()}`}>
            {s.title}
          </summary>
          <RailList items={s.items} />
        </details>
      ))}
    </div>
  );
}
