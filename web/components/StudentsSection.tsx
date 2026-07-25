"use client";

// Students tab (Students Tab Spec v1.0): roster for signed-in accounts,
// count + sign-in prompt for visitors.

import { useEffect, useState } from "react";

type Student = {
  name: string;
  is_admin: boolean;
  enrolled_at: string;
  completed: boolean;
};

type Payload = { count: number; students: Student[] | null };

function initials(name: string): string {
  const parts = name.split(/[\s._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "?") + (parts[1]?.[0] ?? "")).toUpperCase();
}

export default function StudentsSection({ slug }: { slug: string }) {
  const [data, setData] = useState<Payload | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/courses/${slug}/students`, { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (!data)
    return <p className="text-sm text-[var(--color-label-tertiary)]">Loading…</p>;

  if (data.students === null) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-separator)] bg-[var(--color-surface-secondary)] p-8 text-center">
        <p className="font-medium text-[var(--color-label)]">
          {data.count} student{data.count === 1 ? "" : "s"} enrolled
        </p>
        <p className="mt-1 text-sm text-[var(--color-label-secondary)]">
          Sign in to see who is learning alongside you.
        </p>
        <a
          href="/login"
          className="mt-4 inline-block rounded-full bg-[var(--color-tint)] px-5 py-2 text-sm font-medium text-[var(--color-on-tint)] hover:bg-[var(--color-tint-emphasis)]"
        >
          Sign In
        </a>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-[var(--color-label-secondary)]">
        {data.count} student{data.count === 1 ? "" : "s"} enrolled
      </p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data.students.map((s, i) => (
          <li
            key={i}
            className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-separator)] bg-[var(--color-surface-secondary)] p-4"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-tint)] text-sm font-semibold text-[var(--color-on-tint)]">
              {initials(s.name)}
            </span>
            <span className="min-w-0">
              <span className="flex items-center gap-1.5">
                <span className="truncate font-medium text-[var(--color-label)]">
                  {s.name}
                </span>
                {s.is_admin && (
                  <span className="rounded-full bg-[var(--color-tint-soft)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--color-tint)]">
                    Admin
                  </span>
                )}
                {s.completed && (
                  <span
                    title="Completed the course"
                    className="text-[var(--color-tint)]"
                  >
                    ✓
                  </span>
                )}
              </span>
              <span className="block text-xs text-[var(--color-label-secondary)]">
                Joined{" "}
                {new Date(s.enrolled_at).toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </span>
          </li>
        ))}
        {data.students.length === 0 && (
          <li className="col-span-full py-6 text-center text-sm text-zinc-500">
            No students yet — be the first to enroll.
          </li>
        )}
      </ul>
    </div>
  );
}
