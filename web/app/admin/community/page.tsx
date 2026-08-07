"use client";

/**
 * Admin Community / Discord channel map (C1d-lite).
 * Spec §5.3 — map Labs channels to FatTail AI Discord snowflakes.
 */

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Channel = {
  id: string;
  slug: string;
  title: string;
  description: string;
  kind: string;
  app_key: string | null;
  discord_guild_id: string | null;
  discord_channel_id: string | null;
  sort_order: number;
  archived_at: string | null;
  mapped: boolean;
};

type Overview = {
  channels: Channel[];
  stats: { active: number; mapped: number; unmapped: number };
  default_guild_id: string | null;
  bridge_enabled: boolean;
  connect_url: string | null;
  note: string;
};

type EditState = {
  title: string;
  description: string;
  discord_guild_id: string;
  discord_channel_id: string;
  sort_order: string;
};

function editFrom(ch: Channel): EditState {
  return {
    title: ch.title,
    description: ch.description || "",
    discord_guild_id: ch.discord_guild_id || "",
    discord_channel_id: ch.discord_channel_id || "",
    sort_order: String(ch.sort_order ?? 0),
  };
}

export default function AdminCommunityPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, EditState>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newChannelId, setNewChannelId] = useState("");
  const [newGuildId, setNewGuildId] = useState("");
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    const r = await fetch("/api/admin/community", { credentials: "same-origin" });
    if (!r.ok) {
      setError(
        r.status === 401 || r.status === 403
          ? "Administrator sign-in required."
          : `Failed to load (${r.status})`,
      );
      setData(null);
      return;
    }
    const d = (await r.json()) as Overview;
    setData(d);
    const next: Record<string, EditState> = {};
    for (const ch of d.channels) {
      next[ch.id] = editFrom(ch);
    }
    setEdits(next);
    if (d.default_guild_id && !newGuildId) {
      setNewGuildId(d.default_guild_id);
    }
  }, [newGuildId]);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount once
  }, []);

  async function saveChannel(ch: Channel) {
    const e = edits[ch.id];
    if (!e) return;
    setSaving(ch.id);
    setMsg(null);
    setError(null);
    try {
      const r = await fetch(`/api/admin/community/channels/${ch.id}`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: e.title,
          description: e.description,
          discord_guild_id: e.discord_guild_id.trim() || null,
          discord_channel_id: e.discord_channel_id.trim() || null,
          sort_order: Number(e.sort_order) || 0,
        }),
      });
      if (!r.ok) {
        const t = await r.text();
        setError(t || `Save failed (${r.status})`);
        return;
      }
      setMsg(`Saved ${e.title}`);
      await load();
    } finally {
      setSaving(null);
    }
  }

  async function createChannel() {
    if (!newTitle.trim()) {
      setError("Title required for new channel");
      return;
    }
    setCreating(true);
    setError(null);
    setMsg(null);
    try {
      const r = await fetch("/api/admin/community/channels", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          kind: "topic",
          discord_guild_id: newGuildId.trim() || null,
          discord_channel_id: newChannelId.trim() || null,
        }),
      });
      if (!r.ok) {
        setError((await r.text()) || `Create failed (${r.status})`);
        return;
      }
      setNewTitle("");
      setNewChannelId("");
      setMsg("Channel created");
      await load();
    } finally {
      setCreating(false);
    }
  }

  async function archiveChannel(ch: Channel) {
    if (
      !confirm(
        `Archive “${ch.title}”? Members will no longer see it in Community.`,
      )
    ) {
      return;
    }
    setError(null);
    const r = await fetch(`/api/admin/community/channels/${ch.id}/archive`, {
      method: "POST",
      credentials: "same-origin",
    });
    if (!r.ok) {
      setError((await r.text()) || `Archive failed (${r.status})`);
      return;
    }
    setMsg(`Archived ${ch.title}`);
    await load();
  }

  async function applyDefaultGuild() {
    setError(null);
    setMsg(null);
    const r = await fetch("/api/admin/community/apply-default-guild", {
      method: "POST",
      credentials: "same-origin",
    });
    if (!r.ok) {
      setError(
        (await r.text()) ||
          "Could not apply default guild (set LABS_DISCORD_GUILD_ID on the API host).",
      );
      return;
    }
    setMsg("Default guild applied to channels missing a guild id");
    await load();
  }

  const active = data?.channels.filter((c) => !c.archived_at) ?? [];
  const archived = data?.channels.filter((c) => c.archived_at) ?? [];

  return (
    <main className="space-y-8 p-8" data-testid="admin-community">
      <header className="max-w-3xl">
        <h1 className="text-2xl font-semibold">Community · Discord map</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Map Labs Community channels to Discord channels on the{" "}
          <strong>FatTail AI</strong> guild. Member connect stays on{" "}
          <strong>fattail.ai</strong> (WordPress plugin) — this page only maps
          rooms for the second window.
        </p>
        {data?.note ? (
          <p className="mt-2 text-xs text-zinc-400">{data.note}</p>
        ) : null}
        <p className="mt-3 text-sm">
          <Link
            href="/app/community"
            className="text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
          >
            Open member Community →
          </Link>
        </p>
      </header>

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200" role="alert">
          {error}
        </p>
      ) : null}
      {msg ? (
        <p className="text-sm text-emerald-700 dark:text-emerald-400">{msg}</p>
      ) : null}

      {data ? (
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-xs uppercase text-zinc-400">Active channels</p>
            <p className="mt-1 text-2xl font-semibold">{data.stats.active}</p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-xs uppercase text-zinc-400">Mapped to Discord</p>
            <p className="mt-1 text-2xl font-semibold">{data.stats.mapped}</p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-xs uppercase text-zinc-400">Unmapped</p>
            <p className="mt-1 text-2xl font-semibold">{data.stats.unmapped}</p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-xs uppercase text-zinc-400">Bridge flag</p>
            <p className="mt-1 text-sm font-medium">
              {data.bridge_enabled ? "LABS_DISCORD_BRIDGE=1" : "off (C1c later)"}
            </p>
            <p className="mt-1 break-all text-xs text-zinc-400">
              Guild env: {data.default_guild_id || "— not set —"}
            </p>
          </div>
        </section>
      ) : !error ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : null}

      {data ? (
        <>
          <section className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void applyDefaultGuild()}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              Apply default guild to empty guild fields
            </button>
            <button
              type="button"
              onClick={() => void load()}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              Refresh
            </button>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Channels</h2>
            <p className="text-xs text-zinc-500">
              Discord channel ID: right-click channel in Discord (Developer Mode
              on) → Copy Channel ID. Snowflakes are digits only.
            </p>
            <ul className="space-y-4">
              {active.map((ch) => {
                const e = edits[ch.id] || editFrom(ch);
                return (
                  <li
                    key={ch.id}
                    className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
                    data-testid={`admin-community-channel-${ch.slug}`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{ch.slug}</span>
                      <span
                        className={
                          ch.mapped
                            ? "rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-emerald-700"
                            : "rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-800"
                        }
                      >
                        {ch.mapped ? "Mapped" : "Unmapped"}
                      </span>
                      {ch.app_key ? (
                        <span className="text-xs text-zinc-400">
                          app: {ch.app_key}
                        </span>
                      ) : null}
                      <span className="text-xs text-zinc-400">{ch.kind}</span>
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <label className="block text-xs">
                        Title
                        <input
                          className="mt-1 w-full rounded border border-zinc-300 bg-transparent px-2 py-1.5 text-sm dark:border-zinc-700"
                          value={e.title}
                          onChange={(ev) =>
                            setEdits((prev) => ({
                              ...prev,
                              [ch.id]: { ...e, title: ev.target.value },
                            }))
                          }
                        />
                      </label>
                      <label className="block text-xs">
                        Sort order
                        <input
                          className="mt-1 w-full rounded border border-zinc-300 bg-transparent px-2 py-1.5 text-sm dark:border-zinc-700"
                          value={e.sort_order}
                          onChange={(ev) =>
                            setEdits((prev) => ({
                              ...prev,
                              [ch.id]: { ...e, sort_order: ev.target.value },
                            }))
                          }
                        />
                      </label>
                      <label className="block text-xs sm:col-span-2">
                        Description
                        <input
                          className="mt-1 w-full rounded border border-zinc-300 bg-transparent px-2 py-1.5 text-sm dark:border-zinc-700"
                          value={e.description}
                          onChange={(ev) =>
                            setEdits((prev) => ({
                              ...prev,
                              [ch.id]: { ...e, description: ev.target.value },
                            }))
                          }
                        />
                      </label>
                      <label className="block text-xs">
                        Discord guild ID
                        <input
                          className="mt-1 w-full rounded border border-zinc-300 bg-transparent px-2 py-1.5 font-mono text-sm dark:border-zinc-700"
                          placeholder={data.default_guild_id || "snowflake"}
                          value={e.discord_guild_id}
                          onChange={(ev) =>
                            setEdits((prev) => ({
                              ...prev,
                              [ch.id]: {
                                ...e,
                                discord_guild_id: ev.target.value,
                              },
                            }))
                          }
                        />
                      </label>
                      <label className="block text-xs">
                        Discord channel ID
                        <input
                          className="mt-1 w-full rounded border border-zinc-300 bg-transparent px-2 py-1.5 font-mono text-sm dark:border-zinc-700"
                          placeholder="channel snowflake"
                          value={e.discord_channel_id}
                          onChange={(ev) =>
                            setEdits((prev) => ({
                              ...prev,
                              [ch.id]: {
                                ...e,
                                discord_channel_id: ev.target.value,
                              },
                            }))
                          }
                        />
                      </label>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={saving === ch.id}
                        onClick={() => void saveChannel(ch)}
                        className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
                      >
                        {saving === ch.id ? "Saving…" : "Save map"}
                      </button>
                      <button
                        type="button"
                        onClick={() => void archiveChannel(ch)}
                        className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-600 dark:border-zinc-700"
                      >
                        Archive
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold">Add channel</h2>
            <p className="mt-1 text-xs text-zinc-500">
              Creates a Labs topic channel. Map a Discord channel ID to include
              it in sync later.
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <label className="block text-xs">
                Title
                <input
                  className="mt-1 w-full rounded border border-zinc-300 bg-transparent px-2 py-1.5 text-sm dark:border-zinc-700"
                  value={newTitle}
                  onChange={(ev) => setNewTitle(ev.target.value)}
                  placeholder="e.g. Announcements"
                />
              </label>
              <label className="block text-xs">
                Discord guild ID
                <input
                  className="mt-1 w-full rounded border border-zinc-300 bg-transparent px-2 py-1.5 font-mono text-sm dark:border-zinc-700"
                  value={newGuildId}
                  onChange={(ev) => setNewGuildId(ev.target.value)}
                />
              </label>
              <label className="block text-xs">
                Discord channel ID
                <input
                  className="mt-1 w-full rounded border border-zinc-300 bg-transparent px-2 py-1.5 font-mono text-sm dark:border-zinc-700"
                  value={newChannelId}
                  onChange={(ev) => setNewChannelId(ev.target.value)}
                />
              </label>
            </div>
            <button
              type="button"
              disabled={creating}
              onClick={() => void createChannel()}
              className="mt-3 rounded-md bg-emerald-700 px-3 py-1.5 text-sm text-white disabled:opacity-50"
            >
              {creating ? "Creating…" : "Create channel"}
            </button>
          </section>

          {archived.length > 0 ? (
            <section>
              <h2 className="text-sm font-semibold text-zinc-500">Archived</h2>
              <ul className="mt-2 text-sm text-zinc-400">
                {archived.map((ch) => (
                  <li key={ch.id}>
                    {ch.slug} · {ch.title}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      ) : null}
    </main>
  );
}
