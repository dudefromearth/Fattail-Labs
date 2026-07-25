"use client";

// Course Discussion tab (Course Discussion Spec v1.0 §3): public thread list,
// inline thread expansion with comments, posting for signed-in users, admin
// moderation. All markdown through the sanitizing site renderer.

import { useCallback, useEffect, useState } from "react";
import Markdown from "@/components/Markdown";

type ThreadSummary = {
  id: number;
  title: string;
  status: string;
  author: string;
  author_is_admin: boolean;
  comment_count: number;
  created_at: string;
};

type ThreadDetail = ThreadSummary & {
  body: string;
  comments: {
    id: number;
    body: string;
    status: string;
    author: string;
    author_is_admin: boolean;
    created_at: string;
  }[];
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function AuthorBadge({ name, isAdmin }: { name: string; isAdmin: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="font-medium">{name}</span>
      {isAdmin && (
        <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
          Admin
        </span>
      )}
    </span>
  );
}

export default function DiscussionSection({ slug }: { slug: string }) {
  const [threads, setThreads] = useState<ThreadSummary[] | null>(null);
  const [viewer, setViewer] = useState<{ can_post: boolean; is_admin: boolean }>({
    can_post: false,
    is_admin: false,
  });
  const [openThread, setOpenThread] = useState<ThreadDetail | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    fetch(`/api/courses/${slug}/threads`, { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) {
          setThreads(d.threads);
          setViewer(d.viewer);
        }
      })
      .catch(() => {});
  }, [slug]);

  useEffect(load, [load]);

  async function openDetail(id: number) {
    const d = await fetch(`/api/threads/${id}`, { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);
    if (d) setOpenThread(d);
  }

  async function postThread() {
    setBusy(true);
    const res = await fetch(`/api/courses/${slug}/threads`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle, body: newBody }),
    });
    setBusy(false);
    if (res.ok) {
      setNewTitle("");
      setNewBody("");
      load();
    }
  }

  async function postReply() {
    if (!openThread) return;
    setBusy(true);
    const res = await fetch(`/api/threads/${openThread.id}/comments`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: reply }),
    });
    setBusy(false);
    if (res.ok) {
      setReply("");
      openDetail(openThread.id);
      load();
    }
  }

  async function moderate(kind: "threads" | "comments", id: number, status: string) {
    await fetch(`/api/admin/${kind}/${id}/moderate`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (openThread) openDetail(openThread.id);
    load();
  }

  if (threads === null)
    return <p className="text-sm text-[var(--color-label-tertiary)]">Loading…</p>;

  // Thread detail view
  if (openThread) {
    return (
      <div>
        <button
          onClick={() => setOpenThread(null)}
          className="text-sm text-[var(--color-label-secondary)] hover:underline"
        >
          ← All discussions
        </button>
        <div className="mt-4 rounded-[var(--radius-lg)] border border-[var(--color-separator)] bg-[var(--color-surface-secondary)] p-6">
          <h3 className="text-lg font-semibold text-[var(--color-label)]">
            {openThread.title}
          </h3>
          <p className="mt-1 text-xs text-[var(--color-label-secondary)]">
            <AuthorBadge
              name={openThread.author}
              isAdmin={openThread.author_is_admin}
            />{" "}
            · {fmtDate(openThread.created_at)}
          </p>
          {openThread.body && (
            <div className="mt-3 text-sm">
              <Markdown>{openThread.body}</Markdown>
            </div>
          )}
        </div>

        <ul className="mt-4 space-y-3">
          {openThread.comments.map((c) => (
            <li
              key={c.id}
              className={`rounded-[var(--radius-md)] border border-[var(--color-separator)] bg-[var(--color-surface-secondary)] p-4 ${c.status === "held" ? "opacity-50" : ""}`}
            >
              <p className="text-xs text-zinc-500">
                <AuthorBadge name={c.author} isAdmin={c.author_is_admin} /> ·{" "}
                {fmtDate(c.created_at)}
                {viewer.is_admin && (
                  <button
                    onClick={() =>
                      moderate(
                        "comments",
                        c.id,
                        c.status === "held" ? "visible" : "held",
                      )
                    }
                    className="ml-3 text-zinc-400 hover:text-zinc-600"
                  >
                    {c.status === "held" ? "Show" : "Hide"}
                  </button>
                )}
              </p>
              <div className="mt-2 text-sm">
                <Markdown>{c.body}</Markdown>
              </div>
            </li>
          ))}
          {openThread.comments.length === 0 && (
            <p className="text-sm text-zinc-500">No replies yet.</p>
          )}
        </ul>

        {viewer.can_post ? (
          <div className="mt-4">
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Write a reply (markdown supported)…"
              rows={3}
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-950"
            />
            <button
              onClick={postReply}
              disabled={busy || !reply.trim()}
              className="mt-2 rounded-full bg-emerald-500 px-5 py-1.5 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
            >
              Reply
            </button>
          </div>
        ) : (
          <p className="mt-4 text-sm text-zinc-500">
            <a href="/login" className="text-emerald-600 hover:underline">
              Sign in
            </a>{" "}
            to join the discussion.
          </p>
        )}
      </div>
    );
  }

  // Thread list view
  return (
    <div>
      {viewer.can_post && (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-separator)] bg-[var(--color-surface-secondary)] p-5">
          <p className="text-sm font-medium text-[var(--color-label)]">
            Start a discussion
          </p>
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Title"
            className="mt-2 w-full rounded-[var(--radius-md)] border border-[var(--color-separator)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--color-tint)]"
          />
          <textarea
            value={newBody}
            onChange={(e) => setNewBody(e.target.value)}
            placeholder="What's on your mind? (markdown supported)"
            rows={3}
            className="mt-2 w-full rounded-[var(--radius-md)] border border-[var(--color-separator)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--color-tint)]"
          />
          <button
            onClick={postThread}
            disabled={busy || !newTitle.trim()}
            className="mt-2 rounded-full bg-[var(--color-tint)] px-5 py-1.5 text-sm font-medium text-[var(--color-on-tint)] hover:bg-[var(--color-tint-emphasis)] disabled:opacity-50"
          >
            Post
          </button>
        </div>
      )}
      {!viewer.can_post && (
        <p className="text-sm text-[var(--color-label-secondary)]">
          <a href="/login" className="text-[var(--color-tint)] hover:underline">
            Sign in
          </a>{" "}
          to start a discussion.
        </p>
      )}

      <ul className="mt-4 divide-y divide-[var(--color-separator)] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-separator)] bg-[var(--color-surface-secondary)]">
        {threads.map((t) => (
          <li key={t.id} className={t.status === "held" ? "opacity-50" : ""}>
            <button
              onClick={() => openDetail(t.id)}
              className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-[var(--color-fill)]"
            >
              <span className="flex-1">
                <span className="block font-medium">{t.title}</span>
                <span className="mt-0.5 block text-xs text-zinc-500">
                  <AuthorBadge name={t.author} isAdmin={t.author_is_admin} /> ·{" "}
                  {fmtDate(t.created_at)}
                </span>
              </span>
              {viewer.is_admin && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    moderate(
                      "threads",
                      t.id,
                      t.status === "held" ? "visible" : "held",
                    );
                  }}
                  className="text-xs text-zinc-400 hover:text-zinc-600"
                >
                  {t.status === "held" ? "Show" : "Hide"}
                </span>
              )}
              <span className="text-xs text-zinc-500">
                {t.comment_count} {t.comment_count === 1 ? "reply" : "replies"}
              </span>
            </button>
          </li>
        ))}
        {threads.length === 0 && (
          <li className="px-5 py-6 text-center text-sm text-zinc-500">
            No discussions yet — start the first one.
          </li>
        )}
      </ul>
    </div>
  );
}
