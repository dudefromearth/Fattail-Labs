"use client";

// Feature gates admin — countdown / hide-until-ready / waitlist email capture.
// Spec intent: operator control plane on /admin only (not in-place on hubs).

import { useCallback, useEffect, useState } from "react";
import type { FeatureGateAdmin } from "@/lib/featureGates";

type GateForm = {
  label: string;
  enabled: boolean;
  opens_at: string;
  headline: string;
  body_md: string;
  cta_primary_label: string;
  cta_primary_href: string;
  cta_secondary_label: string;
  cta_secondary_href: string;
  collect_email: boolean;
  email_prompt: string;
  reveal_path: string;
  footer_note: string;
};

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso.endsWith("Z") ? iso : iso + "Z");
  if (Number.isNaN(d.getTime())) return "";
  // datetime-local wants YYYY-MM-DDTHH:mm in local time
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(local: string): string | null {
  if (!local.trim()) return null;
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function formFromGate(g: FeatureGateAdmin): GateForm {
  return {
    label: g.label || g.surface_key,
    enabled: g.enabled,
    opens_at: toLocalInput(g.opens_at),
    headline: g.headline || "",
    body_md: g.body_md || "",
    cta_primary_label: g.cta_primary_label || "",
    cta_primary_href: g.cta_primary_href || "",
    cta_secondary_label: g.cta_secondary_label || "",
    cta_secondary_href: g.cta_secondary_href || "",
    collect_email: g.collect_email,
    email_prompt: g.email_prompt || "",
    reveal_path: g.reveal_path || "/",
    footer_note: g.footer_note || "",
  };
}

export default function AdminGatesPage() {
  const [gates, setGates] = useState<FeatureGateAdmin[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [form, setForm] = useState<GateForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [emails, setEmails] = useState<
    { id: number; email: string; source: string; created_at: string | null }[]
  >([]);

  const load = useCallback(async () => {
    setError(null);
    const r = await fetch("/api/admin/feature-gates", {
      credentials: "same-origin",
    });
    if (!r.ok) {
      setError(await r.text());
      setGates([]);
      return;
    }
    const d = (await r.json()) as { gates: FeatureGateAdmin[] };
    setGates(d.gates || []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!selected) {
      setForm(null);
      setEmails([]);
      return;
    }
    const g = gates?.find((x) => x.surface_key === selected);
    if (g) setForm(formFromGate(g));
    void fetch(`/api/admin/feature-gates/${selected}/emails`, {
      credentials: "same-origin",
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setEmails(d?.emails || []))
      .catch(() => setEmails([]));
  }, [selected, gates]);

  async function save() {
    if (!selected || !form) return;
    setSaving(true);
    setMsg(null);
    const body = {
      label: form.label,
      enabled: form.enabled,
      opens_at: fromLocalInput(form.opens_at),
      headline: form.headline,
      body_md: form.body_md,
      cta_primary_label: form.cta_primary_label,
      cta_primary_href: form.cta_primary_href,
      cta_secondary_label: form.cta_secondary_label,
      cta_secondary_href: form.cta_secondary_href,
      collect_email: form.collect_email,
      email_prompt: form.email_prompt,
      reveal_path: form.reveal_path,
      footer_note: form.footer_note || null,
    };
    const r = await fetch(`/api/admin/feature-gates/${selected}`, {
      method: "PUT",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (!r.ok) {
      setMsg(await r.text());
      return;
    }
    setMsg("Saved");
    await load();
  }

  const field =
    "mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950";

  return (
    <main className="space-y-8 p-8" data-testid="admin-gates">
      <header>
        <h1 className="text-2xl font-semibold">Feature gates</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-500">
          Hide a public surface until it is ready, show a countdown for
          anticipation, and collect emails for your mail system. Managed only
          here — not on member pages.
        </p>
      </header>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {error}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <ul className="space-y-2">
          {(gates || []).map((g) => {
            const open =
              g.enabled &&
              (!g.opens_at ||
                new Date(
                  g.opens_at.endsWith("Z") ? g.opens_at : g.opens_at + "Z",
                ).getTime() > Date.now());
            return (
              <li key={g.surface_key}>
                <button
                  type="button"
                  onClick={() => setSelected(g.surface_key)}
                  className={`w-full rounded-lg border p-3 text-left text-sm transition ${
                    selected === g.surface_key
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40"
                      : "border-zinc-200 bg-white hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900"
                  }`}
                >
                  <span className="font-medium">{g.label}</span>
                  <span className="mt-1 flex flex-wrap gap-2 text-[11px] text-zinc-500">
                    <span
                      className={
                        open ? "font-semibold text-amber-700" : "text-zinc-400"
                      }
                    >
                      {open ? "GATING" : g.enabled ? "OPEN (time passed)" : "OFF"}
                    </span>
                    <span>{g.email_count} emails</span>
                  </span>
                </button>
              </li>
            );
          })}
          {gates?.length === 0 && (
            <li className="text-sm text-zinc-500">No gates — run migration 037.</li>
          )}
        </ul>

        <div className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900">
          {!form || !selected ? (
            <p className="text-sm text-zinc-500">
              Select a surface to configure its gate.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-semibold">
                  {form.label}{" "}
                  <span className="font-mono text-sm font-normal text-zinc-400">
                    ({selected})
                  </span>
                </h2>
                <a
                  href={`/api/admin/feature-gates/${selected}/emails.csv`}
                  className="text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400"
                >
                  Export emails CSV
                </a>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.enabled}
                  onChange={(e) =>
                    setForm({ ...form, enabled: e.target.checked })
                  }
                />
                <span className="font-medium">Gate enabled</span>
                <span className="text-zinc-500">
                  (visitors see countdown / waitlist instead of the real page)
                </span>
              </label>

              <label className="block text-sm">
                Label (admin only)
                <input
                  className={field}
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                />
              </label>

              <label className="block text-sm">
                Opens at (local time; empty = stay gated until you turn off)
                <input
                  type="datetime-local"
                  className={field}
                  value={form.opens_at}
                  onChange={(e) =>
                    setForm({ ...form, opens_at: e.target.value })
                  }
                />
              </label>

              <label className="block text-sm">
                Headline
                <input
                  className={field}
                  value={form.headline}
                  onChange={(e) =>
                    setForm({ ...form, headline: e.target.value })
                  }
                />
              </label>

              <label className="block text-sm">
                Body (markdown)
                <textarea
                  rows={5}
                  className={field}
                  value={form.body_md}
                  onChange={(e) =>
                    setForm({ ...form, body_md: e.target.value })
                  }
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm">
                  Primary CTA label
                  <input
                    className={field}
                    value={form.cta_primary_label}
                    onChange={(e) =>
                      setForm({ ...form, cta_primary_label: e.target.value })
                    }
                  />
                </label>
                <label className="block text-sm">
                  Primary CTA href
                  <input
                    className={field}
                    value={form.cta_primary_href}
                    onChange={(e) =>
                      setForm({ ...form, cta_primary_href: e.target.value })
                    }
                  />
                </label>
                <label className="block text-sm">
                  Secondary CTA label
                  <input
                    className={field}
                    value={form.cta_secondary_label}
                    onChange={(e) =>
                      setForm({ ...form, cta_secondary_label: e.target.value })
                    }
                  />
                </label>
                <label className="block text-sm">
                  Secondary CTA href
                  <input
                    className={field}
                    value={form.cta_secondary_href}
                    onChange={(e) =>
                      setForm({ ...form, cta_secondary_href: e.target.value })
                    }
                  />
                </label>
              </div>

              <label className="block text-sm">
                When open, send visitors to
                <input
                  className={field}
                  value={form.reveal_path}
                  onChange={(e) =>
                    setForm({ ...form, reveal_path: e.target.value })
                  }
                  placeholder="/hub"
                />
              </label>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.collect_email}
                  onChange={(e) =>
                    setForm({ ...form, collect_email: e.target.checked })
                  }
                />
                Collect emails for mail management
              </label>

              {form.collect_email && (
                <label className="block text-sm">
                  Email form prompt
                  <input
                    className={field}
                    value={form.email_prompt}
                    onChange={(e) =>
                      setForm({ ...form, email_prompt: e.target.value })
                    }
                  />
                </label>
              )}

              <label className="block text-sm">
                Footer note (plain text)
                <input
                  className={field}
                  value={form.footer_note}
                  onChange={(e) =>
                    setForm({ ...form, footer_note: e.target.value })
                  }
                />
              </label>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => void save()}
                  disabled={saving}
                  className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save gate"}
                </button>
                {msg && (
                  <span className="text-sm text-zinc-500">{msg}</span>
                )}
              </div>

              <section className="border-t border-zinc-200 pt-4 dark:border-zinc-700">
                <h3 className="text-sm font-semibold">
                  Waitlist emails ({emails.length})
                </h3>
                {emails.length === 0 ? (
                  <p className="mt-2 text-xs text-zinc-500">None yet.</p>
                ) : (
                  <ul className="mt-2 max-h-48 overflow-auto text-xs">
                    {emails.map((e) => (
                      <li
                        key={e.id}
                        className="flex justify-between gap-2 border-b border-zinc-100 py-1 dark:border-zinc-800"
                      >
                        <span className="font-mono">{e.email}</span>
                        <span className="text-zinc-400">
                          {e.created_at
                            ? new Date(e.created_at).toLocaleString()
                            : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
