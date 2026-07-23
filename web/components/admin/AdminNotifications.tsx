"use client";

// In-app inbox + browser Notification API for admin action events.
// Spec: FatTail-Labs-Admin-Notifications-Spec-v1.0

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

type Note = {
  id: number;
  kind: string;
  title: string;
  body: string;
  href: string;
  unread: boolean;
  created_at: string | null;
};

export default function AdminNotifications() {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<Note[]>([]);
  const [perm, setPerm] = useState<NotificationPermission | "unsupported">(
    "default",
  );
  const prevCount = useRef(0);
  const knownIds = useRef<Set<number>>(new Set());

  const refresh = useCallback(async () => {
    try {
      const [cRes, lRes] = await Promise.all([
        fetch("/api/admin/notifications/unread-count", {
          credentials: "same-origin",
        }),
        fetch("/api/admin/notifications?limit=20", {
          credentials: "same-origin",
        }),
      ]);
      if (!cRes.ok || !lRes.ok) return;
      const cBody = (await cRes.json()) as { count: number };
      const lBody = (await lRes.json()) as { notifications: Note[] };
      const nextCount = cBody.count || 0;
      const notes = lBody.notifications || [];

      // Browser local notifications for newly seen unread items
      if (
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        for (const n of notes) {
          if (n.unread && !knownIds.current.has(n.id)) {
            try {
              const note = new Notification(n.title, {
                body: n.body.slice(0, 180),
                tag: `labs-${n.kind}-${n.id}`,
              });
              note.onclick = () => {
                window.focus();
                window.location.href = n.href;
              };
            } catch {
              /* ignore */
            }
          }
        }
      }
      for (const n of notes) knownIds.current.add(n.id);

      prevCount.current = nextCount;
      setCount(nextCount);
      setItems(notes);
    } catch {
      /* ignore poll errors */
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPerm(Notification.permission);
    } else {
      setPerm("unsupported");
    }
    void refresh();
    const t = window.setInterval(() => void refresh(), 30_000);
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(t);
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh]);

  const requestBrowserPermission = async () => {
    if (!("Notification" in window)) return;
    const p = await Notification.requestPermission();
    setPerm(p);
  };

  const markRead = async (id: number) => {
    await fetch(`/api/admin/notifications/${id}/read`, {
      method: "POST",
      credentials: "same-origin",
    });
    void refresh();
  };

  const markAll = async () => {
    await fetch("/api/admin/notifications/read-all", {
      method: "POST",
      credentials: "same-origin",
    });
    void refresh();
  };

  return (
    <div className="relative" data-testid="admin-notifications">
      <button
        type="button"
        className="relative rounded px-2 py-1 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        data-testid="admin-notify-bell"
      >
        Alerts
        {count > 0 && (
          <span
            className="ml-1 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white"
            data-testid="admin-notify-count"
          >
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 z-50 mt-1 w-80 rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
          data-testid="admin-notify-panel"
        >
          <div className="flex items-center justify-between border-b border-zinc-100 px-3 py-2 dark:border-zinc-800">
            <span className="text-xs font-semibold uppercase text-zinc-500">
              Notifications
            </span>
            <button
              type="button"
              className="text-xs text-zinc-500 underline"
              onClick={() => void markAll()}
            >
              Mark all read
            </button>
          </div>

          {perm === "default" && (
            <div className="border-b border-zinc-100 px-3 py-2 text-xs dark:border-zinc-800">
              <button
                type="button"
                className="text-sky-700 underline dark:text-sky-400"
                onClick={() => void requestBrowserPermission()}
                data-testid="admin-notify-enable-browser"
              >
                Enable browser notifications
              </button>
            </div>
          )}
          {perm === "granted" && (
            <div className="border-b border-zinc-100 px-3 py-1 text-[10px] text-emerald-600 dark:border-zinc-800">
              Browser notifications on
            </div>
          )}

          <ul className="max-h-80 overflow-y-auto">
            {items.map((n) => (
              <li
                key={n.id}
                className={`border-b border-zinc-50 px-3 py-2 text-sm dark:border-zinc-800 ${
                  n.unread ? "bg-sky-50/50 dark:bg-sky-950/20" : ""
                }`}
              >
                <Link
                  href={n.href}
                  className="font-medium text-zinc-900 hover:underline dark:text-zinc-100"
                  onClick={() => {
                    void markRead(n.id);
                    setOpen(false);
                  }}
                >
                  {n.title}
                </Link>
                <p className="mt-0.5 line-clamp-2 text-xs text-zinc-500">{n.body}</p>
              </li>
            ))}
            {!items.length && (
              <li className="px-3 py-4 text-center text-xs text-zinc-400">
                No notifications
                {typeof window !== "undefined" && (
                  <span className="mt-1 block text-[10px]">
                    (Dev login as identity 0 has no inbox — use a real admin account.)
                  </span>
                )}
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
