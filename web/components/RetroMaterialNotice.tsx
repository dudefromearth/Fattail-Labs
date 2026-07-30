"use client";

/**
 * Spec v0.7.1 §14 — material-ready retrospective notification (R7).
 * In-app only. Material preview — never a chore/due reminder.
 * Once-per-period enforced server-side.
 */

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui";

type MemberNotification = {
  id: number;
  kind: string;
  title: string;
  body: string;
  href: string;
  channel?: string;
  period_key?: string;
  read_at?: string | null;
};

export default function RetroMaterialNotice({
  className = "",
}: {
  className?: string;
}) {
  const [item, setItem] = useState<MemberNotification | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const load = useCallback(async () => {
    try {
      // Evaluate once (idempotent); may create in-app notice outside RTH
      await fetch("/api/me/retrospectives/notify-eval", {
        method: "POST",
        credentials: "same-origin",
      });
      const r = await fetch(
        "/api/me/notifications?kind=retrospective.material_ready&unread_only=1&limit=1",
        { credentials: "same-origin" },
      );
      if (!r.ok) return;
      const d = await r.json();
      const list = (d.notifications || []) as MemberNotification[];
      setItem(list[0] || null);
    } catch {
      /* non-fatal */
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!item || dismissed) return null;

  async function dismiss() {
    try {
      await fetch(`/api/me/notifications/${item!.id}/read`, {
        method: "POST",
        credentials: "same-origin",
      });
    } catch {
      /* ignore */
    }
    setDismissed(true);
  }

  return (
    <aside
      className={`rounded-[var(--radius-md)] border border-[var(--color-separator)] bg-[var(--color-surface)] px-4 py-3 shadow-[var(--elevation-1)] ${className}`}
      data-testid="retro-material-notice"
      data-channel={item.channel || "in_app"}
      data-kind={item.kind}
      role="status"
    >
      <p className="text-sm font-medium text-[var(--color-label)]">
        {item.title}
      </p>
      <p className="mt-1 text-sm text-[var(--color-label-secondary)]">
        {item.body}
      </p>
      <p className="mt-1 text-[11px] text-[var(--color-label-tertiary)]">
        In-app only — practice detail stays in Labs.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Link
          href={item.href || "/app/retrospective"}
          className="inline-flex items-center rounded-[var(--radius-md)] bg-[var(--color-tint)] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
          data-testid="retro-material-notice-open"
        >
          Open retrospectives
        </Link>
        <Button
          type="button"
          variant="plain"
          className="text-xs"
          onClick={dismiss}
          data-testid="retro-material-notice-dismiss"
        >
          Dismiss
        </Button>
      </div>
    </aside>
  );
}
