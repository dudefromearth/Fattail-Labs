"use client";

// Admin agent workbench — browser validation of the P2 model interface.
// Runs live agent tasks via /api/admin/ai/* (Grok primary; requires API keys on server).

import { useCallback, useEffect, useMemo, useState } from "react";

type AgentTask = { id: string; description: string };
type AgentInfo = { callsign: string; tasks: AgentTask[] };
type AiStatus = {
  primary: { provider: string; model: string; configured: boolean };
  secondary: { provider: string; model: string; configured: boolean };
  agents?: string[];
};
type RunResult = {
  callsign: string;
  task_id: string;
  provider: string;
  model: string;
  text: string;
  markers_found: string[];
  usage?: { input_tokens?: number; output_tokens?: number };
};

export default function AgentWorkbench() {
  const [state, setState] = useState<"loading" | "denied" | "ready">("loading");
  const [status, setStatus] = useState<AiStatus | null>(null);
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [callsign, setCallsign] = useState("bravo");
  const [taskId, setTaskId] = useState("research_pack");
  const [inputsJson, setInputsJson] = useState("{}");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RunResult | null>(null);

  const load = useCallback(() => {
    Promise.all([
      fetch("/api/admin/ai/status", { credentials: "same-origin" }),
      fetch("/api/admin/ai/agents", { credentials: "same-origin" }),
    ])
      .then(async ([sRes, aRes]) => {
        if (!sRes.ok || !aRes.ok) {
          setState("denied");
          return;
        }
        const s = (await sRes.json()) as AiStatus;
        const a = (await aRes.json()) as { agents: AgentInfo[] };
        setStatus(s);
        setAgents(a.agents || []);
        if (a.agents?.length) {
          const first = a.agents[0];
          setCallsign(first.callsign);
          if (first.tasks[0]) setTaskId(first.tasks[0].id);
        }
        setState("ready");
      })
      .catch(() => setState("denied"));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const tasks = useMemo(() => {
    return agents.find((a) => a.callsign === callsign)?.tasks ?? [];
  }, [agents, callsign]);

  useEffect(() => {
    if (!tasks.find((t) => t.id === taskId) && tasks[0]) {
      setTaskId(tasks[0].id);
    }
  }, [tasks, taskId]);

  const loadFixture = useCallback(async () => {
    setError(null);
    const r = await fetch(
      `/api/admin/ai/agents/${callsign}/tasks/${taskId}/fixture`,
      { credentials: "same-origin" },
    );
    if (!r.ok) {
      setError((await r.json().catch(() => ({}))).detail || `Fixture ${r.status}`);
      return;
    }
    const d = (await r.json()) as { inputs: Record<string, string> };
    setInputsJson(JSON.stringify(d.inputs, null, 2));
  }, [callsign, taskId]);

  useEffect(() => {
    if (state === "ready") void loadFixture();
  }, [state, callsign, taskId, loadFixture]);

  const run = async () => {
    setBusy(true);
    setError(null);
    setResult(null);
    let inputs: Record<string, unknown> = {};
    try {
      inputs = JSON.parse(inputsJson) as Record<string, unknown>;
    } catch {
      setError("Inputs must be valid JSON");
      setBusy(false);
      return;
    }
    try {
      const r = await fetch(
        `/api/admin/ai/agents/${callsign}/tasks/${taskId}/run`,
        {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ inputs, prefer: "primary" }),
        },
      );
      const body = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(
          typeof body.detail === "string"
            ? body.detail
            : `Run failed (${r.status})`,
        );
        setBusy(false);
        return;
      }
      setResult(body as RunResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    }
    setBusy(false);
  };

  if (state === "loading") {
    return (
      <main className="mx-auto max-w-4xl p-8" data-testid="ai-workbench-loading">
        <p className="text-zinc-500">Loading agent workbench…</p>
      </main>
    );
  }

  if (state === "denied") {
    return (
      <main className="mx-auto max-w-4xl p-8" data-testid="ai-workbench-denied">
        <h1 className="text-2xl font-semibold">Agent workbench</h1>
        <p className="mt-2 text-red-600">
          Administrator sign-in required. In dev, use{" "}
          <a className="underline" href="/api/auth/dev-login">
            /api/auth/dev-login
          </a>
          .
        </p>
      </main>
    );
  }

  const primaryOk = status?.primary?.configured;
  const secondaryOk = status?.secondary?.configured;

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-8" data-testid="ai-workbench">
      <header>
        <h1 className="text-2xl font-semibold" data-testid="ai-workbench-title">
          Agent workbench
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Browser validation of P2 agents via Grok (primary) / Claude (secondary).
          Server keys required for live runs.
        </p>
      </header>

      <section
        className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700"
        data-testid="ai-status-panel"
      >
        <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          Model status
        </h2>
        <ul className="mt-2 space-y-1 text-sm">
          <li data-testid="ai-primary-status">
            Primary: {status?.primary?.provider}/{status?.primary?.model} —{" "}
            <span
              className={primaryOk ? "text-emerald-600" : "text-amber-600"}
              data-testid="ai-primary-configured"
            >
              {primaryOk ? "configured" : "not configured (set XAI_API_KEY)"}
            </span>
          </li>
          <li data-testid="ai-secondary-status">
            Secondary: {status?.secondary?.provider}/{status?.secondary?.model} —{" "}
            <span className={secondaryOk ? "text-emerald-600" : "text-zinc-500"}>
              {secondaryOk ? "configured" : "optional (ANTHROPIC_API_KEY)"}
            </span>
          </li>
        </ul>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium">Agent</span>
          <select
            className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-900"
            data-testid="ai-agent-select"
            value={callsign}
            onChange={(e) => setCallsign(e.target.value)}
          >
            {agents.map((a) => (
              <option key={a.callsign} value={a.callsign}>
                {a.callsign}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="font-medium">Task</span>
          <select
            className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-900"
            data-testid="ai-task-select"
            value={taskId}
            onChange={(e) => setTaskId(e.target.value)}
          >
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.id} — {t.description}
              </option>
            ))}
          </select>
        </label>
      </section>

      <label className="block text-sm">
        <span className="font-medium">Inputs (JSON)</span>
        <textarea
          className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 font-mono text-xs dark:border-zinc-600 dark:bg-zinc-900"
          data-testid="ai-inputs"
          rows={10}
          value={inputsJson}
          onChange={(e) => setInputsJson(e.target.value)}
        />
      </label>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          data-testid="ai-run-button"
          disabled={busy || !primaryOk}
          onClick={() => void run()}
        >
          {busy ? "Running…" : "Run task (live model)"}
        </button>
        <button
          type="button"
          className="rounded border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-600"
          data-testid="ai-fixture-button"
          disabled={busy}
          onClick={() => void loadFixture()}
        >
          Reload fixture
        </button>
      </div>

      {!primaryOk && (
        <p className="text-sm text-amber-700" data-testid="ai-key-warning">
          Set <code className="font-mono">XAI_API_KEY</code> on the API server and
          restart to enable live browser validation.
        </p>
      )}

      {error && (
        <div
          className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
          data-testid="ai-error"
          role="alert"
        >
          {error}
        </div>
      )}

      {result && (
        <section
          className="space-y-3 rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30"
          data-testid="ai-result"
        >
          <h2 className="font-medium">Result</h2>
          <p className="text-sm text-zinc-600" data-testid="ai-result-meta">
            {result.callsign}/{result.task_id} · {result.provider}/{result.model}
            {result.usage
              ? ` · tokens in=${result.usage.input_tokens ?? "?"} out=${result.usage.output_tokens ?? "?"}`
              : ""}
          </p>
          <p className="text-xs text-zinc-500" data-testid="ai-result-markers">
            Markers: {result.markers_found.join(", ")}
          </p>
          <pre
            className="max-h-[32rem] overflow-auto whitespace-pre-wrap rounded bg-white p-3 text-xs dark:bg-zinc-900"
            data-testid="ai-result-text"
          >
            {result.text}
          </pre>
        </section>
      )}
    </main>
  );
}
