"use client";

// /admin/media (Media Library spec v1.0): the public-tier upload store —
// upload banners here or from the course page, copy URLs, delete unused files.
// Deletion of a referenced file is refused by the server (409).

import { useCallback, useEffect, useState } from "react";
import { uploadMedia } from "@/lib/client";

type MediaItem = {
  name: string;
  url: string;
  bytes: number;
  modified: string;
};

function fmtBytes(n: number): string {
  if (n >= 1_048_576) return `${(n / 1_048_576).toFixed(1)} MB`;
  if (n >= 1024) return `${Math.round(n / 1024)} KB`;
  return `${n} B`;
}

export default function MediaLibrary() {
  const [state, setState] = useState<"loading" | "denied" | "ready">("loading");
  const [items, setItems] = useState<MediaItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch("/api/admin/media", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) {
          setItems(d.media);
          setState("ready");
        } else setState("denied");
      })
      .catch(() => setState("denied"));
  }, []);
  useEffect(load, [load]);

  async function upload(file: File) {
    setBusy(true);
    const url = await uploadMedia(file);
    setBusy(false);
    if (url) load();
    else alert("Upload failed");
  }

  async function remove(item: MediaItem) {
    if (!confirm(`Delete ${item.name}? This cannot be undone.`)) return;
    const r = await fetch(`/api/admin/media/${item.name}`, {
      method: "DELETE",
      credentials: "same-origin",
    });
    if (r.ok) load();
    else if (r.status === 409) alert(`Still in use: ${(await r.json()).detail}`);
    else alert(`Delete failed: ${await r.text()}`);
  }

  async function copy(url: string) {
    await navigator.clipboard.writeText(url);
    setCopied(url);
    setTimeout(() => setCopied(null), 1500);
  }

  if (state === "loading")
    return <main className="p-10 text-sm text-zinc-400">Loading…</main>;
  if (state === "denied")
    return (
      <main className="p-10 text-center">
        <p className="font-medium">Administrators only.</p>
      </main>
    );

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10 pb-24">
      <div className="flex flex-wrap items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Media Library</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Course banners and other public images. Upload here or from any
            course page — sharp on the card, blurred on the course header.
          </p>
        </div>
        <label className="ml-auto cursor-pointer rounded-full bg-emerald-500 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-600">
          {busy ? "Uploading…" : "Upload image…"}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            disabled={busy}
            onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
          />
        </label>
      </div>

      {items.length === 0 ? (
        <p className="mt-10 text-sm text-zinc-500">
          Nothing here yet — upload the first image.
        </p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((m) => (
            <div
              key={m.name}
              className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={m.url}
                alt={m.name}
                loading="lazy"
                className="aspect-video w-full bg-zinc-100 object-cover dark:bg-zinc-900"
              />
              <div className="p-3">
                <p className="truncate text-xs text-zinc-500" title={m.name}>
                  {m.name}
                </p>
                <p className="mt-0.5 text-[11px] text-zinc-400">
                  {fmtBytes(m.bytes)} ·{" "}
                  {new Date(m.modified).toLocaleDateString()}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    onClick={() => copy(m.url)}
                    className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium dark:border-zinc-700"
                  >
                    {copied === m.url ? "Copied ✓" : "Copy URL"}
                  </button>
                  <button
                    onClick={() => remove(m)}
                    className="ml-auto text-xs text-zinc-400 hover:text-red-500"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
