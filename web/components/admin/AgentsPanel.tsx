"use client";

import { useCallback, useEffect, useState } from "react";

type KeyMeta = {
  id: number;
  name: string;
  prefix: string;
  scopes: string[];
  active: boolean;
  created_at?: string;
  revoked_at?: string | null;
};

type Principal = {
  id: number;
  callsign: string;
  display_name: string;
  status: string;
  keys: KeyMeta[];
};

export default function AgentsPanel() {
  const [state, setState] = useState<"loading" | "denied" | "ready">("loading");
  const [principals, setPrincipals] = useState<Principal[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [minted, setMinted] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    fetch("/api/admin/agents/principals", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) {
          setState("denied");
          return;
        }
        setPrincipals(d.principals || []);
        setState("ready");
      })
      .catch(() => setState("denied"));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const mint = async (principalId: number, callsign: string) => {
    setBusy(true);
    setError(null);
    setMinted(null);
    try {
      const r = await fetch(
        `/api/admin/agents/principals/${principalId}/keys`,
        {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "workbench",
            scopes: ["ai:run", "ai:status"],
          }),
        },
      );
      const body = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(body.detail || `Mint failed (${r.status})`);
        setBusy(false);
        return;
      }
      setMinted(
        `${callsign}: ${body.credential.key}\n\nCopy now — it will not be shown again.`,
      );
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    }
    setBusy(false);
  };

  const revoke = async (keyId: number) => {
    setBusy(true);
    setError(null);
    const r = await fetch(`/api/admin/agents/keys/${keyId}/revoke`, {
      method: "POST",
      credentials: "same-origin",
    });
    if (!r.ok) {
      const body = await r.json().catch(() => ({}));
      setError(body.detail || `Revoke failed (${r.status})`);
    }
    load();
    setBusy(false);
  };

  if (state === "loading") {
    return <main className="p-8 text-zinc-500">Loading agents…</main>;
  }
  if (state === "denied") {
    return (
      <main className="p-8" data-testid="agents-denied">
        <h1 className="text-xl font-semibold">Agent keys</h1>
        <p className="mt-2 text-red-600">Administrator sign-in required.</p>
      </main>
    );
  }

  return (
    <main className="space-y-6 p-8" data-testid="agents-panel">
      <header>
        <h1 className="text-2xl font-semibold">Agent principals</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Phase A: agents authenticate with API keys (not human cookies). Mint a key
          for machine use:{" "}
          <code className="text-xs">Authorization: Bearer ftl_ag_…</code>
        </p>
      </header>

      {error && (
        <p className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800" role="alert">
          {error}
        </p>
      )}
      {minted && (
        <pre
          className="overflow-auto rounded border border-amber-300 bg-amber-50 p-3 text-xs"
          data-testid="agents-minted-key"
        >
          {minted}
        </pre>
      )}

      <div className="overflow-x-auto rounded border border-zinc-200 dark:border-zinc-700">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-100 text-xs uppercase text-zinc-500 dark:bg-zinc-800">
            <tr>
              <th className="px-3 py-2">Callsign</th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Keys</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {principals.map((p) => (
              <tr
                key={p.id}
                className="border-t border-zinc-100 dark:border-zinc-800"
                data-testid={`agent-row-${p.callsign}`}
              >
                <td className="px-3 py-2 font-mono font-medium">{p.callsign}</td>
                <td className="px-3 py-2">{p.display_name}</td>
                <td className="px-3 py-2">{p.status}</td>
                <td className="px-3 py-2">
                  <ul className="space-y-1 text-xs">
                    {(p.keys || []).map((k) => (
                      <li key={k.id}>
                        <span className="font-mono">{k.prefix}</span> · {k.name} ·{" "}
                        {k.active ? (
                          <span className="text-emerald-600">active</span>
                        ) : (
                          <span className="text-zinc-400">revoked</span>
                        )}{" "}
                        · [{k.scopes.join(", ")}]
                        {k.active && (
                          <button
                            type="button"
                            className="ml-2 underline"
                            disabled={busy}
                            onClick={() => void revoke(k.id)}
                          >
                            revoke
                          </button>
                        )}
                      </li>
                    ))}
                    {!p.keys?.length && (
                      <li className="text-zinc-400">No keys</li>
                    )}
                  </ul>
                </td>
                <td className="px-3 py-2">
                  <button
                    type="button"
                    className="rounded bg-zinc-900 px-2 py-1 text-xs text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
                    disabled={busy || p.status !== "active"}
                    data-testid={`agent-mint-${p.callsign}`}
                    onClick={() => void mint(p.id, p.callsign)}
                  >
                    Mint key
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
