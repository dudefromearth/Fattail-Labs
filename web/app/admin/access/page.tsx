"use client";

/**
 * Access Control cockpit — Spec v0.4 §7 / AC5.
 * Lists policies, simple editor, audit tab. Expansion preview is display-only.
 */

import { useCallback, useEffect, useMemo, useState } from "react";

type Policy = {
  target_key: string;
  enabled: boolean;
  mode: string;
  min_role: string | null;
  selected_plans: string[] | null;
  exact_plans_only: boolean;
  label: string;
  updated_at?: string | null;
};

type AuditRow = {
  id: number;
  target_key: string;
  actor_id: number | null;
  action: string;
  created_at: string | null;
};

const PLAN_CHIPS = [
  "observer-trial",
  "activator",
  "labs-membership",
  "navigator",
  "coaching",
  "courses-alumni",
];

/** Client-side display of evaluate-time commercial expansion (not stored). */
function expansionPreview(selected: string[] | null, exact: boolean): string[] {
  if (!selected?.length) return [];
  if (exact) return [...selected];
  const s = new Set(selected);
  if (s.has("observer-trial")) {
    ["activator", "labs-membership", "navigator", "coaching"].forEach((x) => s.add(x));
  }
  if (s.has("activator") || s.has("labs-membership")) {
    ["navigator", "coaching"].forEach((x) => s.add(x));
  }
  if (s.has("navigator")) s.add("coaching");
  return [...s].sort();
}

export default function AdminAccessPage() {
  const [tab, setTab] = useState<"policies" | "audit">("policies");
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [targetKey, setTargetKey] = useState("lesson:");
  const [mode, setMode] = useState("hard");
  const [minRole, setMinRole] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [exact, setExact] = useState(false);
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);

  const loadPolicies = useCallback(async () => {
    setError(null);
    const r = await fetch("/api/admin/access/policies", { credentials: "same-origin" });
    if (!r.ok) {
      setError(await r.text());
      return;
    }
    const d = await r.json();
    setPolicies(d.policies || []);
  }, []);

  const loadAudit = useCallback(async () => {
    const r = await fetch("/api/admin/access/audit?limit=50", { credentials: "same-origin" });
    if (!r.ok) return;
    const d = await r.json();
    setAudit(d.audit || []);
  }, []);

  useEffect(() => {
    void loadPolicies();
    void loadAudit();
  }, [loadPolicies, loadAudit]);

  const preview = useMemo(
    () => expansionPreview(selected, exact),
    [selected, exact],
  );

  async function save() {
    setSaving(true);
    setMsg(null);
    setError(null);
    try {
      const r = await fetch(
        `/api/admin/access/policies/${encodeURIComponent(targetKey)}`,
        {
          method: "PUT",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode,
            min_role: minRole || null,
            selected_plans: selected.length ? selected : null,
            exact_plans_only: exact,
            label,
            enabled: true,
          }),
        },
      );
      if (!r.ok) {
        setError(await r.text());
        return;
      }
      setMsg("Saved (intent stored; expand at evaluate).");
      await loadPolicies();
      await loadAudit();
    } finally {
      setSaving(false);
    }
  }

  function togglePlan(slug: string) {
    setSelected((prev) =>
      prev.includes(slug) ? prev.filter((x) => x !== slug) : [...prev, slug],
    );
  }

  function loadIntoForm(p: Policy) {
    setTargetKey(p.target_key);
    setMode(p.mode);
    setMinRole(p.min_role || "");
    setSelected(p.selected_plans || []);
    setExact(!!p.exact_plans_only);
    setLabel(p.label || "");
  }

  return (
    <main className="space-y-6 p-6" data-testid="admin-access">
      <header>
        <h1 className="text-2xl font-semibold">Access Control</h1>
        <p className="mt-1 max-w-3xl text-sm text-zinc-500">
          Gate surfaces, apps, and course elements by role/plan without deploys.
          Commercial plan expansion happens at evaluate time — the form stores
          your selection only. Course Alumni is non-commercial (use Min role).
        </p>
      </header>

      <div className="flex gap-3 text-sm">
        <button
          type="button"
          className={tab === "policies" ? "font-semibold underline" : ""}
          onClick={() => setTab("policies")}
        >
          Policies
        </button>
        <button
          type="button"
          className={tab === "audit" ? "font-semibold underline" : ""}
          onClick={() => setTab("audit")}
        >
          Audit
        </button>
      </div>

      {error && (
        <pre className="overflow-auto rounded border border-red-300 bg-red-50 p-3 text-xs text-red-800">
          {error}
        </pre>
      )}
      {msg && <p className="text-sm text-emerald-700">{msg}</p>}

      {tab === "policies" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="space-y-3 rounded border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-sm font-semibold">Editor</h2>
            <label className="block text-xs">
              Target key
              <input
                className="mt-1 w-full rounded border px-2 py-1 font-mono text-sm"
                value={targetKey}
                onChange={(e) => setTargetKey(e.target.value)}
                placeholder="lesson:123"
              />
            </label>
            <label className="block text-xs">
              Label
              <input
                className="mt-1 w-full rounded border px-2 py-1 text-sm"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </label>
            <label className="block text-xs">
              Mode
              <select
                className="mt-1 w-full rounded border px-2 py-1 text-sm"
                value={mode}
                onChange={(e) => setMode(e.target.value)}
              >
                <option value="hard">hard</option>
                <option value="soft">soft</option>
                <option value="hide">hide</option>
                <option value="redirect">redirect</option>
              </select>
            </label>
            <label className="block text-xs">
              Min role
              <select
                className="mt-1 w-full rounded border px-2 py-1 text-sm"
                value={minRole}
                onChange={(e) => setMinRole(e.target.value)}
              >
                <option value="">(none)</option>
                <option value="observer">observer</option>
                <option value="alumni">alumni</option>
                <option value="activator">activator</option>
                <option value="navigator">navigator</option>
                <option value="administrator">administrator</option>
              </select>
            </label>
            <fieldset className="text-xs">
              <legend className="font-medium">Selected plans (intent)</legend>
              <p className="mb-2 text-zinc-500">
                Commercial plans expand to higher paid tiers at access time.
                Course Alumni is separate — use Min role ≥ alumni.
              </p>
              <div className="flex flex-wrap gap-2">
                {PLAN_CHIPS.map((slug) => (
                  <label key={slug} className="flex items-center gap-1 rounded border px-2 py-1">
                    <input
                      type="checkbox"
                      checked={selected.includes(slug)}
                      onChange={() => togglePlan(slug)}
                    />
                    {slug}
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={exact}
                onChange={(e) => setExact(e.target.checked)}
              />
              Exact plans only (no commercial expansion)
            </label>
            {preview.length > 0 && (
              <p className="text-xs text-zinc-500">
                Also admits at evaluate (display only):{" "}
                <span className="font-mono text-zinc-700">{preview.join(", ")}</span>
              </p>
            )}
            <button
              type="button"
              disabled={saving || !targetKey.includes(":")}
              onClick={() => void save()}
              className="rounded bg-zinc-900 px-3 py-1.5 text-sm text-white disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save policy"}
            </button>
          </section>

          <section className="rounded border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-2 text-sm font-semibold">Policies</h2>
            <ul className="max-h-[28rem] space-y-2 overflow-auto text-sm">
              {policies.map((p) => (
                <li key={p.target_key}>
                  <button
                    type="button"
                    className="w-full rounded border px-2 py-1 text-left hover:bg-zinc-50"
                    onClick={() => loadIntoForm(p)}
                  >
                    <span className="font-mono text-xs">{p.target_key}</span>
                    <span className="ml-2 text-zinc-500">{p.mode}</span>
                    {p.label ? (
                      <span className="ml-2 text-zinc-400">{p.label}</span>
                    ) : null}
                  </button>
                </li>
              ))}
              {!policies.length && (
                <li className="text-zinc-400">No policies yet.</li>
              )}
            </ul>
          </section>
        </div>
      )}

      {tab === "audit" && (
        <section className="rounded border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-2 text-sm font-semibold">Recent audit</h2>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b text-zinc-500">
                <th className="py-1">When</th>
                <th>Target</th>
                <th>Action</th>
                <th>Actor</th>
              </tr>
            </thead>
            <tbody>
              {audit.map((a) => (
                <tr key={a.id} className="border-b border-zinc-100">
                  <td className="py-1 font-mono">{a.created_at}</td>
                  <td className="font-mono">{a.target_key}</td>
                  <td>{a.action}</td>
                  <td>{a.actor_id ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </main>
  );
}
