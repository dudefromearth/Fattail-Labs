"use client";

// Admin-only Wiki Agent session (WA-4 · WU-1 ruling B).
// Keep/evolve this panel — one orb on wiki-owned layout. Members never see it.
// Do not import AppChrome. Do not clone Help's emerald FAB.

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useIsAdmin } from "@/lib/useIsAdmin";

type Turn = { role: string; content: string };
type Entity = { kind: string; id: string; canonical_url: string };

function surfaceFor(path: string): string {
  const p = path.replace(/\/$/, "") || "/";
  if (p === "/app") return "hub";
  if (path.startsWith("/app/strategy-lab")) return "strategy-lab";
  if (path.startsWith("/app/options-lab")) return "options-lab";
  if (path.startsWith("/app/wiki")) return "wiki";
  if (path.startsWith("/app/iki")) return "iki-lab";
  if (path.startsWith("/course")) return "courses";
  return "wiki";
}

export default function WikiAgentPanel() {
  const isAdmin = useIsAdmin();
  const pathname = usePathname() || "/app/wiki";
  const [open, setOpen] = useState(false);
  const [surface, setSurface] = useState("wiki");
  const [route, setRoute] = useState("/app/wiki");
  const [entityKind, setEntityKind] = useState("");
  const [entityId, setEntityId] = useState("");
  const [entityUrl, setEntityUrl] = useState("");
  const [contractId, setContractId] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState("");
  const [queued, setQueued] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [artifact, setArtifact] = useState("");
  const [intent, setIntent] = useState("");

  useEffect(() => {
    setSurface(surfaceFor(pathname));
    setRoute(pathname);
  }, [pathname]);

  useEffect(() => {
    if (!isAdmin || !open || !route) return;
    let cancelled = false;
    fetch(
      `/api/wiki-agent/context?route=${encodeURIComponent(route)}`,
      { credentials: "same-origin" },
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        if (data.registered && data.entity) {
          setEntityKind(String(data.entity.kind || ""));
          setEntityId(String(data.entity.id || ""));
          setEntityUrl(String(data.entity.canonical_url || ""));
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [isAdmin, open, route]);

  const loadQueue = useCallback(() => {
    fetch("/api/wiki-agent/linkage-queue", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && typeof data.queued === "number") setQueued(data.queued);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (isAdmin && open) loadQueue();
  }, [isAdmin, open, loadQueue]);

  if (!isAdmin) return null;

  function entity(): Entity | null {
    if (!entityKind.trim() || !entityId.trim() || !entityUrl.trim()) return null;
    return {
      kind: entityKind.trim(),
      id: entityId.trim(),
      canonical_url: entityUrl.trim(),
    };
  }

  async function postJson(url: string, body?: unknown) {
    const r = await fetch(url, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      const reason =
        (data && data.detail && data.detail.reject_reason) ||
        (typeof data.detail === "string" ? data.detail : r.statusText);
      throw new Error(String(reason));
    }
    return data;
  }

  async function openSession() {
    setBusy(true);
    setNotice("");
    try {
      const data = await postJson("/api/wiki-agent/contracts", {
        contract_version: "1",
        kind: "session",
        source: "admin-session",
        refs: [],
        payload: {
          context: {
            surface,
            route,
            entity: entity(),
          },
        },
      });
      setContractId(data.contract_id);
      setTurns(data.payload?.transcript || []);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "open failed");
    } finally {
      setBusy(false);
    }
  }

  async function sendTurn() {
    if (!contractId || !draft.trim()) return;
    setBusy(true);
    setNotice("");
    try {
      const data = await postJson(
        `/api/wiki-agent/contracts/${contractId}/turns`,
        { content: draft.trim() },
      );
      setTurns(data.payload?.transcript || []);
      setDraft("");
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "send failed");
    } finally {
      setBusy(false);
    }
  }

  async function draftToBoard() {
    if (!contractId) return;
    setBusy(true);
    setNotice("");
    try {
      await postJson(`/api/wiki-agent/contracts/${contractId}/draft`);
      setNotice("Draft on the board — you still approve.");
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "draft failed");
    } finally {
      setBusy(false);
    }
  }

  async function sealSession() {
    if (!contractId) return;
    setBusy(true);
    setNotice("");
    try {
      await postJson(`/api/wiki-agent/contracts/${contractId}/seal`);
      setNotice("Session sealed.");
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "seal failed");
    } finally {
      setBusy(false);
    }
  }

  async function handOff() {
    if (!artifact.trim() || !intent.trim()) {
      setNotice("Paste the finished page and one-line intent.");
      return;
    }
    setBusy(true);
    setNotice("");
    try {
      const data = await postJson("/api/wiki-agent/push", {
        artifact: artifact.trim(),
        intent: intent.trim(),
      });
      if (data.status === "accepted") {
        setArtifact("");
        setIntent("");
        setNotice("Draft on the board — you still approve.");
      } else {
        setNotice(String(data.reason || data.status));
      }
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "handoff failed");
    } finally {
      setBusy(false);
    }
  }

  async function drainQueue() {
    setBusy(true);
    setNotice("");
    try {
      const data = await postJson("/api/wiki-agent/linkage-queue/drain");
      setQueued(data.queued_remaining ?? 0);
      setNotice(
        `Drained ${data.drained ?? 0} to the board — you still approve.`,
      );
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "drain failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {open ? (
        <div
          className="fixed bottom-20 left-6 z-50 flex w-[min(28rem,calc(100vw-3rem))] flex-col rounded-2xl border border-[var(--color-separator)] bg-[var(--color-surface)] shadow-[var(--elevation-2)]"
          data-testid="wiki-agent-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="wiki-agent-title"
        >
          <div className="flex items-center justify-between gap-3 border-b border-[var(--color-separator)] px-4 py-2.5">
            <h2
              id="wiki-agent-title"
              className="text-sm font-semibold text-[var(--color-label)]"
            >
              Wiki agent
            </h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-lg leading-none text-[var(--color-label-secondary)] hover:bg-[var(--color-fill)]"
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <div className="flex max-h-[70vh] flex-col gap-3 overflow-y-auto p-4 text-sm">
            <p className="text-[var(--color-label-secondary)]">
              Calling context becomes the page. Proposals stay in this window
              until you draft to the board — you still approve. Nothing files
              itself.
            </p>
            <div
              className="flex flex-col gap-2 rounded-xl border border-[var(--color-separator)] p-3"
              data-testid="wiki-agent-handoff"
            >
              <p className="text-[var(--color-label)]">
                Finished, publishable material only. Delivery point — nothing
                is held here.
              </p>
              <textarea
                data-testid="wiki-agent-artifact"
                className="min-h-[6rem] w-full rounded-md border border-[var(--color-separator)] px-2 py-1"
                placeholder="Paste the finished page"
                value={artifact}
                onChange={(e) => setArtifact(e.target.value)}
              />
              <input
                data-testid="wiki-agent-intent"
                className="w-full rounded-md border border-[var(--color-separator)] px-2 py-1"
                placeholder="What this is for (one line)"
                value={intent}
                onChange={(e) => setIntent(e.target.value)}
              />
              <button
                type="button"
                data-testid="wiki-agent-handoff-submit"
                disabled={busy}
                onClick={() => void handOff()}
                className="rounded-full bg-[var(--color-label)] px-4 py-2 text-[var(--color-surface)]"
              >
                Hand off
              </button>
            </div>
            <label className="block text-[var(--color-label-secondary)]">
              Surface
              <input
                className="mt-1 w-full rounded-md border border-[var(--color-separator)] bg-[var(--color-surface)] px-2 py-1 text-[var(--color-label)]"
                value={surface}
                onChange={(e) => setSurface(e.target.value)}
              />
            </label>
            <label className="block text-[var(--color-label-secondary)]">
              Route
              <input
                className="mt-1 w-full rounded-md border border-[var(--color-separator)] bg-[var(--color-surface)] px-2 py-1 text-[var(--color-label)]"
                value={route}
                onChange={(e) => setRoute(e.target.value)}
              />
            </label>
            <div className="grid grid-cols-3 gap-2">
              <input
                placeholder="entity kind"
                className="rounded-md border border-[var(--color-separator)] px-2 py-1"
                value={entityKind}
                onChange={(e) => setEntityKind(e.target.value)}
              />
              <input
                placeholder="entity id"
                className="rounded-md border border-[var(--color-separator)] px-2 py-1"
                value={entityId}
                onChange={(e) => setEntityId(e.target.value)}
              />
              <input
                placeholder="canonical url"
                className="rounded-md border border-[var(--color-separator)] px-2 py-1"
                value={entityUrl}
                onChange={(e) => setEntityUrl(e.target.value)}
              />
            </div>
            {!contractId ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => void openSession()}
                className="rounded-full bg-[var(--color-label)] px-4 py-2 text-[var(--color-surface)]"
              >
                Open session
              </button>
            ) : (
              <>
                <ol className="space-y-2">
                  {turns.map((t, i) => (
                    <li
                      key={`${t.role}-${i}`}
                      className="rounded-md bg-[var(--color-fill)] px-3 py-2 text-[var(--color-label)]"
                    >
                      <span className="block text-xs uppercase tracking-wide text-[var(--color-label-secondary)]">
                        {t.role}
                      </span>
                      {t.content}
                    </li>
                  ))}
                </ol>
                <textarea
                  className="min-h-[4.5rem] w-full rounded-md border border-[var(--color-separator)] px-2 py-1"
                  placeholder="What should the wiki page cover?"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void sendTurn()}
                    className="rounded-full border border-[var(--color-separator)] px-3 py-1.5"
                  >
                    Send
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void draftToBoard()}
                    className="rounded-full border border-[var(--color-separator)] px-3 py-1.5"
                  >
                    Draft to board
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void sealSession()}
                    className="rounded-full border border-[var(--color-separator)] px-3 py-1.5"
                  >
                    Seal session
                  </button>
                </div>
              </>
            )}
            <div className="border-t border-[var(--color-separator)] pt-3">
              <p className="text-[var(--color-label-secondary)]">
                Linkage queue{queued === null ? "" : `: ${queued}`}
              </p>
              <button
                type="button"
                disabled={busy}
                onClick={() => void drainQueue()}
                className="mt-2 rounded-full border border-[var(--color-separator)] px-3 py-1.5"
              >
                Drain queued revisions
              </button>
            </div>
            {notice ? (
              <p className="text-[var(--color-label)]" role="status">
                {notice}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Wiki agent"
        data-testid="wiki-agent-admin-open"
        className="fixed bottom-6 left-6 z-50 rounded-full bg-zinc-900 px-5 py-2.5 font-medium text-white shadow-lg transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
      >
        Wiki agent
      </button>
    </>
  );
}
