"use client";

/**
 * Community board — Discord second window + FatTail/member shelves.
 * Echo C0-4 · Tango C0-2 · Spec v1.0.2
 */

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  fetchChannelMessages,
  fetchCommunityBoard,
  postChannelMessage,
  type CommunityBoard,
  type CommunityChannel,
  type CommunityMessage,
  type HouseShelfItem,
  type MemberShare,
} from "@/lib/communityApi";

function ChannelList({
  channels,
  activeSlug,
  onSelect,
}: {
  channels: CommunityChannel[];
  activeSlug: string;
  onSelect: (slug: string) => void;
}) {
  return (
    <nav
      className="flex flex-col gap-0.5"
      aria-label="Community channels"
      data-testid="community-channel-list"
    >
      {channels.map((ch) => {
        const selected = ch.slug === activeSlug;
        return (
          <button
            key={ch.slug}
            type="button"
            onClick={() => onSelect(ch.slug)}
            className={[
              "min-h-[44px] rounded-lg px-3 py-2 text-left text-sm transition-colors",
              selected
                ? "bg-[color-mix(in_srgb,var(--color-tint)_12%,transparent)] font-medium text-[var(--color-label)]"
                : "text-[var(--color-label-secondary)] hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-label)]",
            ].join(" ")}
            aria-current={selected ? "true" : undefined}
          >
            <span className="block">{ch.title}</span>
            {ch.app_key ? (
              <span className="mt-0.5 block text-xs text-[var(--color-label-tertiary)]">
                {ch.app_key}
              </span>
            ) : null}
          </button>
        );
      })}
    </nav>
  );
}

function HouseCard({ h }: { h: HouseShelfItem }) {
  return (
    <article
      className="rounded-lg border border-[var(--color-separator)] bg-[var(--color-surface-secondary)] p-3"
      data-testid="community-house-card"
    >
      <h3 className="text-sm font-medium text-[var(--color-label)]">{h.name}</h3>
      <p className="mt-0.5 text-xs text-[var(--color-label-tertiary)]">
        {h.key}@{h.version}
        {h.dte_label ? ` · ${h.dte_label}` : ""}
      </p>
      <p className="mt-2 line-clamp-3 text-xs text-[var(--color-label-secondary)]">
        {h.summary}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href="/app/strategy-lab"
          className="inline-flex min-h-[36px] items-center rounded-md bg-[var(--color-tint)] px-3 text-xs font-medium text-white"
        >
          Apply to Design
        </Link>
        <Link
          href="/app/strategy-lab"
          className="inline-flex min-h-[36px] items-center rounded-md border border-[var(--color-separator)] px-3 text-xs text-[var(--color-label-secondary)]"
        >
          Copy &amp; rebuild
        </Link>
      </div>
    </article>
  );
}

function ShareCard({ s }: { s: MemberShare }) {
  return (
    <article className="rounded-lg border border-[var(--color-separator)] p-3">
      <h3 className="text-sm font-medium text-[var(--color-label)]">
        {s.bot_name || "Shared bot"}
      </h3>
      {s.provenance ? (
        <p className="mt-0.5 text-xs text-[var(--color-label-tertiary)]">
          {s.provenance.label}
        </p>
      ) : null}
      {s.summary_md ? (
        <p className="mt-2 line-clamp-2 text-xs text-[var(--color-label-secondary)]">
          {s.summary_md}
        </p>
      ) : null}
    </article>
  );
}

function MessageStream({
  channel,
  messages,
  syncEnabled,
  canPost,
  connectUrl,
  linked,
  discordName,
  draft,
  setDraft,
  sending,
  sendError,
  onSend,
  loadingMsgs,
}: {
  channel: CommunityChannel | undefined;
  messages: CommunityMessage[];
  syncEnabled: boolean;
  canPost: boolean;
  connectUrl: string | null;
  linked: boolean;
  discordName: string | null;
  draft: string;
  setDraft: (v: string) => void;
  sending: boolean;
  sendError: string | null;
  onSend: () => void;
  loadingMsgs: boolean;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, channel?.slug]);

  return (
    <div
      className="flex min-h-[280px] flex-1 flex-col"
      data-testid="community-stream"
    >
      <header className="border-b border-[var(--color-separator)] px-4 py-3">
        <h2 className="text-base font-semibold text-[var(--color-label)]">
          {channel?.title ?? "Channel"}
        </h2>
        <p className="mt-0.5 text-xs text-[var(--color-label-secondary)]">
          Same conversation as FatTail Discord
          {!channel?.mapped
            ? " · not mapped yet (Admin → Community)"
            : syncEnabled
              ? " · sync on"
              : " · bridge off"}
          {linked && discordName ? ` · you: ${discordName}` : null}
        </p>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {loadingMsgs && messages.length === 0 ? (
          <p className="text-sm text-[var(--color-label-secondary)]">
            Loading messages…
          </p>
        ) : null}
        {!loadingMsgs && messages.length === 0 ? (
          <p className="text-sm text-[var(--color-label-secondary)]">
            {channel?.mapped
              ? "No messages in the Labs mirror yet — they appear when Discord sync runs."
              : "Map this channel to Discord in Admin → Community to sync chat."}
          </p>
        ) : null}
        {messages.map((m) => (
          <div key={m.id} className="flex gap-2" data-testid="community-message">
            {m.author_avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={m.author_avatar_url}
                alt=""
                className="mt-0.5 h-8 w-8 shrink-0 rounded-full"
              />
            ) : (
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-secondary)] text-xs text-[var(--color-label-tertiary)]">
                {(m.author_display_name || "?")[0]}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-sm font-medium text-[var(--color-label)]">
                  {m.author_display_name || "Member"}
                </span>
                {m.via_labs || m.source === "labs" ? (
                  <span className="rounded bg-[var(--color-surface-secondary)] px-1.5 py-0.5 text-[10px] text-[var(--color-label-tertiary)]">
                    via Labs
                  </span>
                ) : null}
              </div>
              <p className="whitespace-pre-wrap break-words text-sm text-[var(--color-label-secondary)]">
                {m.body}
              </p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-[var(--color-separator)] bg-[var(--color-surface-secondary)] px-4 py-3">
        {!linked ? (
          <div className="mb-2 rounded-md border border-[var(--color-separator)] bg-[var(--color-surface)] px-3 py-2 text-xs text-[var(--color-label-secondary)]">
            <p className="font-medium text-[var(--color-label)]">
              Connect Discord to post
            </p>
            <p className="mt-1">
              You can read the same room as Discord. To post with your Discord
              name, connect on fattail.ai (you may already be connected from
              enrollment — re-enter Labs via SSO after connect).
            </p>
            {connectUrl ? (
              <a
                href={connectUrl}
                className="mt-2 inline-flex text-[var(--color-tint)] underline"
                target="_blank"
                rel="noreferrer"
              >
                Connect on fattail.ai
              </a>
            ) : null}
          </div>
        ) : null}
        {sendError ? (
          <p className="mb-2 text-xs text-red-600" role="alert">
            {sendError}
          </p>
        ) : null}
        <div className="flex gap-2">
          <textarea
            className="min-h-[44px] flex-1 resize-y rounded-md border border-[var(--color-separator)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-label)] disabled:opacity-50"
            placeholder={
              canPost
                ? "Message the community…"
                : channel?.mapped
                  ? "Posting requires Discord link + bridge"
                  : "Channel not mapped"
            }
            value={draft}
            disabled={!canPost || sending}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (canPost && !sending && draft.trim()) onSend();
              }
            }}
            rows={2}
          />
          <button
            type="button"
            disabled={!canPost || sending || !draft.trim()}
            onClick={onSend}
            className="min-h-[44px] shrink-0 rounded-md bg-[var(--color-tint)] px-4 text-sm font-medium text-white disabled:opacity-40"
          >
            {sending ? "…" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CommunityApp({
  initialChannel,
}: {
  initialChannel?: string;
}) {
  const [board, setBoard] = useState<CommunityBoard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSlug, setActiveSlug] = useState(initialChannel || "general");
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [canPost, setCanPost] = useState(false);
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const loadBoard = useCallback(async () => {
    setLoading(true);
    setError(null);
    setErrorStatus(null);
    try {
      const result = await fetchCommunityBoard();
      if (!result.ok) {
        setBoard(null);
        setError(result.message);
        setErrorStatus(result.status);
        return;
      }
      setBoard(result.board);
      if (
        result.board.channels.length &&
        !result.board.channels.some((c) => c.slug === activeSlug)
      ) {
        setActiveSlug(result.board.channels[0].slug);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Community");
    } finally {
      setLoading(false);
    }
  }, [activeSlug]);

  const loadMessages = useCallback(async (slug: string) => {
    setLoadingMsgs(true);
    setSendError(null);
    try {
      const r = await fetchChannelMessages(slug);
      if (!r.ok) {
        setMessages([]);
        setCanPost(false);
        return;
      }
      setMessages(r.messages);
      setCanPost(r.can_post);
      setSyncEnabled(r.sync_enabled);
      if (board) {
        setBoard({ ...board, discord: r.discord });
      }
    } finally {
      setLoadingMsgs(false);
    }
  }, [board]);

  useEffect(() => {
    void loadBoard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!board) return;
    void loadMessages(activeSlug);
    const t = window.setInterval(() => {
      void loadMessages(activeSlug);
    }, 8000);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- poll active channel
  }, [activeSlug, board?.channels.length]);

  const active = useMemo(
    () => board?.channels.find((c) => c.slug === activeSlug),
    [board, activeSlug],
  );

  async function handleSend() {
    if (!draft.trim()) return;
    setSending(true);
    setSendError(null);
    const r = await postChannelMessage(activeSlug, draft.trim());
    setSending(false);
    if (!r.ok) {
      setSendError(r.message);
      return;
    }
    setDraft("");
    setMessages((prev) => [...prev, r.message]);
  }

  if (loading && !board) {
    return (
      <main className="mx-auto w-full max-w-[1200px] px-4 py-6">
        <p className="text-sm text-[var(--color-label-secondary)]">
          Loading Community…
        </p>
      </main>
    );
  }

  if (error && !board) {
    const needSignIn = errorStatus === 401;
    return (
      <main className="mx-auto w-full max-w-[1200px] px-4 py-6">
        <h1 className="text-xl font-semibold text-[var(--color-label)]">
          Community
        </h1>
        <p
          className="mt-3 text-sm text-[var(--color-label-secondary)]"
          role="alert"
        >
          {error}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {needSignIn ? (
            <Link
              href={`/login?next=${encodeURIComponent("/app/community")}`}
              className="inline-flex min-h-[44px] items-center rounded-md bg-[var(--color-tint)] px-4 text-sm font-medium text-white"
            >
              Sign in
            </Link>
          ) : null}
          <button
            type="button"
            className="text-sm text-[var(--color-tint)] underline"
            onClick={() => void loadBoard()}
          >
            Retry
          </button>
        </div>
      </main>
    );
  }

  if (!board) return null;

  const house = board.fattail_shelf?.house ?? [];
  const shares = board.member_shares ?? [];

  return (
    <main
      className="bg-canvas mx-auto w-full max-w-[1280px] px-4 py-6"
      data-testid="community-app"
    >
      <header className="mb-4">
        <h1 className="text-xl font-semibold text-[var(--color-label)]">
          Community
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--color-label-secondary)]">
          Extension of FatTail Discord — same rooms, process peers, FatTail bots.
          No P&amp;L theater.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[220px_minmax(0,1fr)_minmax(260px,320px)]">
        <aside className="surface-card border border-[var(--color-separator)] p-3">
          <p className="mb-2 px-1 text-xs font-medium uppercase tracking-wide text-[var(--color-label-tertiary)]">
            Channels
          </p>
          <ChannelList
            channels={board.channels}
            activeSlug={activeSlug}
            onSelect={setActiveSlug}
          />
        </aside>

        <section className="surface-card flex min-h-[420px] flex-col border border-[var(--color-separator)]">
          <MessageStream
            channel={active}
            messages={messages}
            syncEnabled={syncEnabled}
            canPost={canPost}
            connectUrl={board.discord?.connect_url ?? null}
            linked={!!board.discord?.linked}
            discordName={board.discord?.display_name ?? null}
            draft={draft}
            setDraft={setDraft}
            sending={sending}
            sendError={sendError}
            onSend={() => void handleSend()}
            loadingMsgs={loadingMsgs}
          />
        </section>

        <aside className="flex flex-col gap-4">
          <div
            className="surface-card border border-[var(--color-separator)] p-3"
            data-testid="community-fattail-shelf"
          >
            <h2 className="text-sm font-semibold text-[var(--color-label)]">
              FatTail Bots
            </h2>
            <p className="mt-1 text-xs text-[var(--color-label-tertiary)]">
              House designs · process only
            </p>
            <div className="mt-3 flex max-h-[50vh] flex-col gap-2 overflow-y-auto">
              {house.map((h) => (
                <HouseCard key={`${h.key}@${h.version}`} h={h} />
              ))}
            </div>
          </div>

          <div
            className="surface-card border border-[var(--color-separator)] p-3"
            data-testid="community-member-shares"
          >
            <h2 className="text-sm font-semibold text-[var(--color-label)]">
              Member shares
            </h2>
            <div className="mt-3 flex flex-col gap-2">
              {shares.length === 0 ? (
                <p className="text-xs text-[var(--color-label-secondary)]">
                  No member designs published yet.
                </p>
              ) : (
                shares.map((s) => <ShareCard key={s.id} s={s} />)
              )}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
