"use client";

/**
 * J3 agent interview chat — Spec v0.2 §8 · JS3-3.
 * Intraday silent; clean_day one turn; form fallback UX (Tango Appendix B).
 * Product primary path — always available while the entry is open.
 * Form is additive (same sitting), not an either/or mode switch.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui";
import {
  displayMessageBody,
  fetchAgentStatus,
  postAgentTurn,
  type AgentDepth,
  type JournalMessage,
  type JournalSession,
} from "@/lib/journalSessionApi";

type Props = {
  session: JournalSession;
  busy?: boolean;
  onBusy?: (v: boolean) => void;
  onError?: (msg: string | null) => void;
  onUpdated: (session: JournalSession) => void;
  /** When agent has no more probes (or soft fallback), parent may highlight form fields */
  onFormFallback?: () => void;
};

export default function SessionInterviewChat({
  session,
  busy = false,
  onBusy,
  onError,
  onUpdated,
  onFormFallback,
}: Props) {
  const mutable =
    session.status === "open" || session.status === "partial";
  const [depth, setDepth] = useState<AgentDepth | null>(null);
  const [statusLoad, setStatusLoad] = useState<"loading" | "ok" | "err">(
    "loading",
  );
  const [statusNote, setStatusNote] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [formFallback, setFormFallback] = useState(false);
  const [phaseHint, setPhaseHint] = useState<string | null>(null);
  const [bootstrapped, setBootstrapped] = useState(false);
  /** Local send/bootstrap lock — never stuck when effect cleans up. */
  const [chatBusy, setChatBusy] = useState(false);
  const bootstrapGen = useRef(0);

  const msgs: JournalMessage[] = session.messages || [];
  const agentOff = depth != null && !depth.configured;
  const notEntitled = depth != null && depth.configured && !depth.entitled;
  const depthDone =
    depth != null && depth.depth_remaining <= 0 && depth.configured;
  const blocked = busy || chatBusy;

  const refreshStatus = useCallback(async () => {
    setStatusLoad("loading");
    try {
      const s = await fetchAgentStatus(session.id);
      setDepth(s.agent);
      setStatusLoad("ok");
      if (!s.agent.configured) {
        setStatusNote(
          "Chat interview isn't configured right now. Structured fields below still work.",
        );
      } else if (!s.agent.entitled) {
        setStatusNote("Chat interview requires an active Practice membership.");
      } else {
        setStatusNote(null);
      }
      return s.agent;
    } catch (e) {
      setDepth(null);
      setStatusLoad("err");
      const msg = e instanceof Error ? e.message : "Chat interview unavailable";
      setStatusNote(
        msg.includes("not configured") || msg.includes("LABS_JOURNAL")
          ? "Chat interview isn't configured right now. Structured fields below still work."
          : `Chat interview isn't available right now (${msg}). Structured fields below still work.`,
      );
      return null;
    }
  }, [session.id]);

  useEffect(() => {
    setFormFallback(false);
    setPhaseHint(null);
    setBootstrapped(false);
    setDraft("");
    setChatBusy(false);
    bootstrapGen.current += 1;
    void refreshStatus();
  }, [session.id, refreshStatus]);

  // Auto first probe when agent on, entitled, open session, no agent msgs yet
  useEffect(() => {
    if (!mutable || bootstrapped) return;
    if (!depth?.configured || !depth.entitled) return;
    const hasAgent = msgs.some((m) => m.author === "agent");
    if (hasAgent) {
      setBootstrapped(true);
      return;
    }

    const gen = ++bootstrapGen.current;
    let cancelled = false;

    (async () => {
      setChatBusy(true);
      onBusy?.(true);
      onError?.(null);
      try {
        const res = await postAgentTurn(session.id, {});
        if (cancelled || gen !== bootstrapGen.current) return;
        onUpdated(res.session);
        setDepth(res.turn.depth || null);
        if (res.turn.kind === "silent") {
          setPhaseHint(
            "Market hours — interview stays quiet. You can still write notes; questions resume after the close.",
          );
        } else if (res.turn.form_fallback) {
          setFormFallback(true);
          setStatusNote(
            res.turn.detail ||
              "No further guided questions right now. Chat stays open — use the fields below anytime.",
          );
          onFormFallback?.();
        } else if (res.turn.phase === "intraday") {
          setPhaseHint(
            "Market hours — interview stays quiet. You can still write notes.",
          );
        }
        setBootstrapped(true);
      } catch (e) {
        if (cancelled || gen !== bootstrapGen.current) return;
        const msg = e instanceof Error ? e.message : "Interview unavailable";
        setStatusNote(
          msg.includes("not configured") || msg.includes("LABS_JOURNAL")
            ? "Chat interview isn't configured right now. Structured fields below still work."
            : msg,
        );
        if (msg.includes("not configured") || msg.includes("form")) {
          setFormFallback(true);
          onFormFallback?.();
        }
        setBootstrapped(true);
      } finally {
        // Always release locks — even on cancel — so chat never freezes.
        setChatBusy(false);
        onBusy?.(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // msgs length only: avoid re-bootstrap on every parent re-render of message array identity
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    session.id,
    mutable,
    depth?.configured,
    depth?.entitled,
    bootstrapped,
    msgs.some((m) => m.author === "agent"),
  ]);

  async function sendTurn() {
    if (!mutable || !draft.trim() || agentOff || notEntitled) return;
    setChatBusy(true);
    onBusy?.(true);
    onError?.(null);
    setPhaseHint(null);
    try {
      const res = await postAgentTurn(session.id, { body_md: draft.trim() });
      setDraft("");
      onUpdated(res.session);
      if (res.turn.depth) setDepth(res.turn.depth);

      if (res.turn.kind === "silent") {
        setPhaseHint(
          "Market hours — interview stays quiet. Your note was received.",
        );
      } else if (res.turn.form_fallback || res.turn.kind === "form_fallback") {
        setFormFallback(true);
        setStatusNote(
          res.turn.detail ||
            "No further guided questions right now. Chat stays open — use structured fields anytime.",
        );
        onFormFallback?.();
      } else if (res.turn.kind === "done") {
        setFormFallback(true);
        setStatusNote(
          "No further guided questions. Chat stays open — add notes, edit fields below, or seal when ready.",
        );
        onFormFallback?.();
      }

      if (
        session.tag === "clean_day" &&
        res.turn.depth &&
        res.turn.depth.depth_remaining <= 0
      ) {
        setStatusNote(
          "Clean day uses one check. Chat stays open; you can also use the fields below or seal — or start a post-session entry if something differed.",
        );
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not continue interview";
      if (msg.toLowerCase().includes("form") || msg.includes("depth")) {
        setFormFallback(true);
        setStatusNote(
          "Question budget for this sitting is used. Chat stays open for notes; structured fields below still work.",
        );
        onFormFallback?.();
      } else {
        onError?.(msg);
      }
    } finally {
      setChatBusy(false);
      onBusy?.(false);
    }
  }

  // Composer stays up for any open entry unless agent is explicitly off.
  // Loading / entitled states never remove the primary chat surface.
  const showComposer = mutable && !agentOff;

  return (
    <div className="space-y-3" data-testid="journal-interview-chat">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-[var(--color-label)]">
          Chat interview
        </h4>
        {depth?.configured && depth.entitled && (
          <span className="text-[10px] uppercase tracking-wide text-[var(--color-label-tertiary)]">
            {depth.depth_used}/{depth.depth_cap} questions
            {session.tag === "clean_day" ? " · clean day (max 1)" : ""}
          </span>
        )}
        {statusLoad === "loading" && (
          <span className="text-[10px] uppercase tracking-wide text-[var(--color-label-tertiary)]">
            connecting…
          </span>
        )}
      </div>

      <p className="text-xs text-[var(--color-label-tertiary)]">
        Interviewer only — not a coach. Primary way to journal this sitting.
        Structured fields below stay available at the same time — not either/or.
      </p>

      {!mutable && (
        <p
          className="text-sm text-[var(--color-label-secondary)]"
          data-testid="journal-interview-sealed"
        >
          This entry is closed — transcript is read-only.
        </p>
      )}

      {(statusNote ||
        agentOff ||
        notEntitled ||
        (formFallback && mutable) ||
        depthDone) && (
        <div
          className="rounded-[var(--radius-md)] border border-[var(--color-separator)] bg-[var(--color-fill)]/40 px-3 py-2 text-sm text-[var(--color-label-secondary)]"
          data-testid="journal-interview-fallback"
          role="status"
        >
          <p>
            {statusNote ||
              (agentOff
                ? "Chat interview isn't configured right now. You can still use the structured fields below."
                : notEntitled
                  ? "Chat interview requires an active Practice membership."
                  : depthDone
                    ? "Question budget for this sitting is used. You can still write here, edit structured fields, or seal when ready."
                    : formFallback
                      ? "No further guided questions right now. Chat stays open — add notes anytime, or use the fields below."
                      : null)}
          </p>
          {statusLoad === "err" && (
            <button
              type="button"
              className="mt-2 text-xs font-medium text-[var(--color-tint)] underline underline-offset-2"
              onClick={() => void refreshStatus()}
              data-testid="journal-interview-retry"
            >
              Retry chat
            </button>
          )}
          {(formFallback || depthDone) && mutable && (
            <p className="mt-1 text-xs text-[var(--color-label-tertiary)]">
              Chat remains available. Form fields are the same checklist — use
              both as you like.
            </p>
          )}
        </div>
      )}

      {phaseHint && (
        <p
          className="text-xs text-[var(--color-label-secondary)]"
          data-testid="journal-interview-phase-hint"
        >
          {phaseHint}
        </p>
      )}

      <div
        className="max-h-56 space-y-2 overflow-y-auto rounded-[var(--radius-md)] border border-[var(--color-separator)] bg-[var(--color-surface-secondary)]/50 p-3"
        data-testid="journal-interview-transcript"
      >
        {msgs.length === 0 && (
          <p className="text-sm text-[var(--color-label-tertiary)]">
            {statusLoad === "loading"
              ? "Starting interview…"
              : "No interview turns yet."}
          </p>
        )}
        {msgs.map((m) => {
          const isAgent = m.author === "agent";
          const body = displayMessageBody(m.body_md, m.author);
          return (
            <div
              key={m.id}
              className={[
                "rounded-[var(--radius-md)] px-3 py-2 text-sm",
                isAgent
                  ? "bg-[var(--color-surface)] text-[var(--color-label)]"
                  : "bg-[var(--color-tint-soft)] text-[var(--color-label)]",
              ].join(" ")}
              data-author={m.author}
            >
              <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
                {isAgent ? "Interviewer" : "You"}
                {m.phase ? ` · ${m.phase}` : ""}
              </p>
              <p className="whitespace-pre-wrap">{body}</p>
            </div>
          );
        })}
      </div>

      {showComposer && (
        <div className="relative">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            placeholder={
              notEntitled
                ? "Membership required to use chat…"
                : statusLoad === "loading"
                  ? "Connecting interview…"
                  : phaseHint?.includes("quiet")
                    ? "Note for the record (no interview questions during the open)…"
                    : depthDone || formFallback
                      ? "Add more in your words — chat stays open…"
                      : "Answer in your words…"
            }
            className="w-full resize-y rounded-[var(--radius-lg)] border border-[var(--color-separator)] bg-[var(--color-surface)] px-4 py-3 pr-24 text-sm text-[var(--color-label)] placeholder:text-[var(--color-label-tertiary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-tint)]"
            aria-label="Interview reply"
            data-testid="journal-interview-draft"
            disabled={blocked || notEntitled || statusLoad === "loading"}
          />
          <div className="absolute bottom-3 right-3 flex gap-1.5">
            <Button
              type="button"
              variant="primary"
              className="!min-h-8 !px-3 !text-xs"
              disabled={
                blocked ||
                notEntitled ||
                statusLoad === "loading" ||
                !draft.trim()
              }
              onClick={() => void sendTurn()}
              data-testid="journal-interview-send"
            >
              Send
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
