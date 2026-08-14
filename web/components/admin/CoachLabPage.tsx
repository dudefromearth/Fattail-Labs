"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ConversationSurface, {
  type ConversationMessage,
} from "@/components/conversation/ConversationSurface";
import {
  contrastRatio,
  CS_TOKENS,
} from "@/components/conversation/conversationTokens";
import {
  chatLab,
  exportAllHref,
  exportMdHref,
  getLabConfig,
  greetLab,
  listLabConversations,
  getLabConversation,
  putLabConfig,
  resetLab,
  type LabConfig,
  type LabConversation,
  type LabEffort,
} from "@/lib/coachLabApi";

const SENDER = { name: "Coach · Lab", avatarUrl: "/admin/coach-lab-mark.svg" };
const CONTROLS_KEY = "ftl-coach-lab-controls";
const UNAVAILABLE = "Coach is unavailable — check the lab config";
const PLUS_NOTE = "coming soon";

function toMessages(conv: LabConversation | null): ConversationMessage[] {
  return (conv?.messages || []).map((m) => ({
    id: m.id,
    direction: m.role === "trader" ? "outgoing" : "incoming",
    body: m.body_md,
    at: m.at || new Date().toISOString(),
  }));
}

export default function CoachLabPage() {
  const [config, setConfig] = useState<LabConfig | null>(null);
  const [conv, setConv] = useState<LabConversation | null>(null);
  const [past, setPast] = useState<LabConversation[]>([]);
  const [viewing, setViewing] = useState<LabConversation | null>(null);
  const [typing, setTyping] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [instruction, setInstruction] = useState("");
  const [plusNote, setPlusNote] = useState(false);

  useEffect(() => {
    try {
      setControlsOpen(localStorage.getItem(CONTROLS_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  const persistControls = (open: boolean) => {
    setControlsOpen(open);
    try {
      localStorage.setItem(CONTROLS_KEY, open ? "1" : "0");
    } catch {
      /* ignore */
    }
  };

  const applyPayload = useCallback(
    (data: { conversation: LabConversation; unavailable?: boolean }) => {
      setConv(data.conversation);
      setViewing(null);
      setUnavailable(Boolean(data.unavailable));
    },
    [],
  );

  const loadPast = useCallback(async () => {
    try {
      setPast(await listLabConversations());
    } catch {
      /* list is secondary */
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cfg = await getLabConfig();
        if (cancelled) return;
        setConfig(cfg);
        setInstruction(cfg.instruction_text);
        setTyping(true);
        const greeted = await greetLab();
        if (cancelled) return;
        applyPayload(greeted);
        await loadPast();
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Lab failed to load");
        }
      } finally {
        if (!cancelled) setTyping(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applyPayload, loadPast]);

  async function onSend(text: string) {
    setTyping(true);
    setUnavailable(false);
    setError(null);
    try {
      applyPayload(await chatLab(text));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Send failed");
    } finally {
      setTyping(false);
    }
  }

  async function onReset() {
    setTyping(true);
    setUnavailable(false);
    setError(null);
    try {
      applyPayload(await resetLab());
      await loadPast();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Reset failed");
    } finally {
      setTyping(false);
    }
  }

  async function saveInstruction() {
    if (!config) return;
    const next = await putLabConfig({ instruction_text: instruction });
    setConfig(next);
  }

  async function patchConfig(partial: Partial<LabConfig>) {
    const next = await putLabConfig(partial);
    setConfig(next);
    if (partial.instruction_text != null) setInstruction(next.instruction_text);
  }

  const shown = viewing || conv;
  const appearance = config
    ? {
        incomingBg: config.coach_bubble_bg,
        incomingText: config.coach_bubble_text,
        outgoingBg: config.trader_bubble_bg,
        outgoingText: config.trader_bubble_text,
      }
    : undefined;

  const contrastWarn = useMemo(() => {
    if (!config) return false;
    const a = contrastRatio(config.coach_bubble_bg, config.coach_bubble_text);
    const b = contrastRatio(config.trader_bubble_bg, config.trader_bubble_text);
    return a < 4.5 || b < 4.5;
  }, [config]);

  if (error && !conv) {
    return (
      <div className="px-6 py-10 text-sm text-zinc-600" data-testid="coach-lab-error">
        {error}
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col gap-4 px-4 py-4 md:flex-row">
      <div className="flex min-h-0 flex-1 flex-col items-center">
        <div className="mb-2 flex w-full max-w-[420px] items-center justify-between">
          <h1 className="text-sm font-semibold tracking-tight">Coach Lab</h1>
          <button
            type="button"
            className="text-sm text-zinc-600 underline-offset-2 hover:underline"
            onClick={() => void onReset()}
          >
            Reset conversation
          </button>
        </div>
        <div
          className="w-full overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm"
          style={{
            maxWidth: CS_TOKENS.threadColumnMax,
            minWidth: CS_TOKENS.threadColumnMin,
            height: "min(720px, calc(100vh - 12rem))",
          }}
          data-testid="coach-lab-thread"
        >
          <ConversationSurface
            messages={toMessages(shown)}
            senderIdentity={SENDER}
            onSend={viewing ? () => undefined : onSend}
            typing={typing && !viewing}
            sendKey="enter"
            startedAt={shown?.started_at}
            appearance={appearance}
            unavailableCopy={unavailable ? UNAVAILABLE : null}
            onPlusTap={() => {
              setPlusNote(true);
              window.setTimeout(() => setPlusNote(false), 1600);
            }}
          />
        </div>
        {plusNote ? (
          <p className="mt-1 text-xs text-zinc-400">{PLUS_NOTE}</p>
        ) : null}
      </div>

      <aside className="w-full shrink-0 md:w-80">
        <button
          type="button"
          className="mb-2 text-sm font-medium text-zinc-700"
          onClick={() => persistControls(!controlsOpen)}
        >
          Lab controls {controlsOpen ? "▾" : "▸"}
        </button>
        {controlsOpen && config ? (
          <div className="space-y-4 rounded-lg border border-zinc-200 bg-white p-3 text-sm">
            <label className="block">
              <span className="text-xs uppercase tracking-wide text-zinc-500">
                Instruction v{config.instruction_version}
              </span>
              <textarea
                className="mt-1 h-32 w-full rounded border border-zinc-200 p-2 font-mono text-xs"
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
              />
            </label>
            <button
              type="button"
              className="rounded bg-zinc-900 px-3 py-1 text-xs text-white"
              onClick={() => void saveInstruction()}
            >
              Save instruction
            </button>
            <p className="text-xs text-zinc-500">Applies on next Reset.</p>

            <label className="block">
              <span className="text-xs uppercase tracking-wide text-zinc-500">
                Model
              </span>
              <select
                className="mt-1 w-full rounded border border-zinc-200 p-1"
                value={config.model}
                onChange={(e) => void patchConfig({ model: e.target.value })}
              >
                {config.models.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs uppercase tracking-wide text-zinc-500">
                Effort
              </span>
              <select
                className="mt-1 w-full rounded border border-zinc-200 p-1"
                value={config.effort}
                onChange={(e) =>
                  void patchConfig({ effort: e.target.value as LabEffort })
                }
              >
                {config.efforts.map((e) => (
                  <option key={e} value={e}>
                    {e === "xhigh" ? "x-high" : e}
                  </option>
                ))}
              </select>
            </label>
            <p className="text-xs text-zinc-500">
              On the multi-agent model, effort sets the agent-collaboration
              ceiling — low/medium ≈ 4 agents, high/x-high ≈ 16, allocated
              dynamically.
            </p>

            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ["coach_bubble_bg", "Coach bubble"],
                  ["coach_bubble_text", "Coach text"],
                  ["trader_bubble_bg", "Trader bubble"],
                  ["trader_bubble_text", "Trader text"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="block text-xs">
                  {label}
                  <input
                    type="color"
                    className="mt-1 h-8 w-full"
                    value={config[key]}
                    onChange={(e) => void patchConfig({ [key]: e.target.value })}
                  />
                </label>
              ))}
            </div>
            {contrastWarn ? (
              <p className="text-xs text-amber-700">
                low contrast — hard to read
              </p>
            ) : null}
            <button
              type="button"
              className="text-xs text-zinc-600 underline"
              onClick={() =>
                void patchConfig({
                  coach_bubble_bg: CS_TOKENS.incomingBg,
                  coach_bubble_text: CS_TOKENS.incomingFg,
                  trader_bubble_bg: CS_TOKENS.outgoingBg,
                  trader_bubble_text: CS_TOKENS.outgoingFg,
                })
              }
            >
              Reset to reference
            </button>

            <label className="flex items-center gap-2 text-xs text-zinc-500">
              <input type="checkbox" disabled checked={false} />
              Voice (voice not configured)
            </label>
          </div>
        ) : null}

        <div className="mt-4">
          <h2 className="mb-2 text-xs uppercase tracking-wide text-zinc-500">
            Past conversations
          </h2>
          <ul className="space-y-1 text-sm">
            {past.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  className="w-full truncate text-left text-zinc-700 hover:underline"
                  onClick={async () => {
                    setViewing(await getLabConversation(p.id));
                  }}
                >
                  {p.started_at} — {p.first_line || "(empty)"}
                </button>
              </li>
            ))}
          </ul>
          {shown ? (
            <div className="mt-3 flex gap-3 text-xs">
              <a
                className="underline"
                href={exportMdHref(shown.id)}
                target="_blank"
                rel="noreferrer"
              >
                Markdown
              </a>
              <a
                className="underline"
                href={exportAllHref()}
                target="_blank"
                rel="noreferrer"
              >
                Export all JSON
              </a>
              {viewing ? (
                <button
                  type="button"
                  className="underline"
                  onClick={() => setViewing(null)}
                >
                  Back to current
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
