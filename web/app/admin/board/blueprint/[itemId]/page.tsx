"use client";

// Full-page Course outline workspace — chat-first for modules & lessons.
// Route: /admin/board/blueprint/{itemId}

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import CourseBlueprintPanel from "@/components/admin/CourseBlueprintPanel";

export default function BlueprintWorkspacePage() {
  const params = useParams();
  const raw = params?.itemId;
  const itemId = Number(Array.isArray(raw) ? raw[0] : raw);
  const [title, setTitle] = useState<string | undefined>();
  const [denied, setDenied] = useState(false);
  const [wrongLine, setWrongLine] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(itemId) || itemId < 1) return;
    fetch(`/api/admin/board/items/${itemId}`, { credentials: "same-origin" })
      .then(async (r) => {
        if (!r.ok) {
          setDenied(true);
          return;
        }
        const body = await r.json();
        const item = body.item;
        setTitle(item?.title);
        if (item?.product_line && item.product_line !== "course") {
          setWrongLine(item.product_line);
        }
      })
      .catch(() => setDenied(true));
  }, [itemId]);

  if (!Number.isFinite(itemId) || itemId < 1) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <p className="text-sm text-red-600">Invalid item id.</p>
        <Link href="/admin/board" className="text-sm underline">
          Back to board
        </Link>
      </main>
    );
  }

  if (denied) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <p className="text-sm text-red-600">
          Could not load card (auth or missing item).
        </p>
        <Link href="/admin/board" className="text-sm underline">
          Back to board
        </Link>
      </main>
    );
  }

  if (wrongLine) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <p className="text-sm text-amber-800 dark:text-amber-200">
          Blueprint workspace is for <strong>course</strong> cards. This item is{" "}
          <code>{wrongLine}</code>.
        </p>
        <Link
          href={`/admin/board?item=${itemId}`}
          className="mt-2 inline-block text-sm underline"
        >
          Back to board card
        </Link>
      </main>
    );
  }

  return (
    <main
      className="mx-auto w-full max-w-[1600px] flex-1 px-3 py-2 sm:px-4"
      data-testid="blueprint-workspace-page"
    >
      <CourseBlueprintPanel
        itemId={itemId}
        layout="workspace"
        cardTitle={title}
      />
    </main>
  );
}
