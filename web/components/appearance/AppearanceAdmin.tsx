"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui";
import { appAlert, appConfirm } from "@/lib/dialogs";

type Bundle = {
  draft: Record<string, unknown>;
  published: Record<string, unknown>;
  allowlists?: { tints?: string[] };
  draft_updated_at?: string | null;
  published_at?: string | null;
};

export default function AppearanceAdmin() {
  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [tint, setTint] = useState("emerald");
  const [scheme, setScheme] = useState("system");
  const [density, setDensity] = useState("comfortable");
  const [displayName, setDisplayName] = useState("FatTail Labs");
  const [announcementOn, setAnnouncementOn] = useState(false);
  const [announcementMsg, setAnnouncementMsg] = useState("");

  const load = useCallback(async () => {
    setError(null);
    const r = await fetch("/api/admin/appearance", { credentials: "same-origin" });
    if (!r.ok) {
      setError(`Load failed (${r.status})`);
      return;
    }
    const d = (await r.json()) as Bundle;
    setBundle(d);
    const brand = (d.draft.brand || {}) as Record<string, string>;
    const app = (d.draft.appearance || {}) as Record<string, string>;
    const ann = (d.draft.announcement || {}) as Record<string, unknown>;
    setTint(brand.tint || "emerald");
    setDisplayName(brand.display_name || "FatTail Labs");
    setScheme(app.color_scheme || "system");
    setDensity(app.density || "comfortable");
    setAnnouncementOn(!!ann.enabled);
    setAnnouncementMsg(String(ann.message || ""));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function buildDraft(): Record<string, unknown> {
    const base = { ...(bundle?.draft || {}) } as Record<string, unknown>;
    base.brand = {
      ...((base.brand as object) || {}),
      display_name: displayName,
      tint,
    };
    base.appearance = {
      ...((base.appearance as object) || {}),
      color_scheme: scheme,
      density,
      corner_style: "rounded",
      font: "system",
    };
    base.announcement = {
      ...((base.announcement as object) || {}),
      enabled: announcementOn,
      message: announcementMsg,
      severity: "info",
      dismissible: true,
    };
    return base;
  }

  async function saveDraft() {
    setBusy(true);
    setError(null);
    const r = await fetch("/api/admin/appearance/draft", {
      method: "PUT",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appearance: buildDraft() }),
    });
    setBusy(false);
    if (!r.ok) {
      setError(`Save draft failed: ${await r.text()}`);
      return;
    }
    await load();
    await appAlert({ title: "Draft saved", message: "Preview with ?appearance=draft on the member site." });
  }

  async function publish() {
    const ok = await appConfirm({
      title: "Publish appearance?",
      message: "Member site chrome and theme tokens will update immediately.",
      confirmLabel: "Publish",
    });
    if (!ok) return;
    setBusy(true);
    // save draft first
    const s = await fetch("/api/admin/appearance/draft", {
      method: "PUT",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appearance: buildDraft() }),
    });
    if (!s.ok) {
      setBusy(false);
      setError(`Save before publish failed: ${await s.text()}`);
      return;
    }
    const r = await fetch("/api/admin/appearance/publish", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: "admin UI publish" }),
    });
    setBusy(false);
    if (!r.ok) {
      setError(`Publish failed: ${await r.text()}`);
      return;
    }
    await load();
    await appAlert({ title: "Published", message: "Appearance is live on the member site." });
  }

  async function discard() {
    const ok = await appConfirm({
      title: "Discard draft?",
      message: "Draft will reset to the last published appearance.",
      confirmLabel: "Discard",
      destructive: true,
    });
    if (!ok) return;
    setBusy(true);
    const r = await fetch("/api/admin/appearance/discard", {
      method: "POST",
      credentials: "same-origin",
    });
    setBusy(false);
    if (!r.ok) {
      setError(`Discard failed: ${await r.text()}`);
      return;
    }
    await load();
  }

  const tints = bundle?.allowlists?.tints || ["emerald", "blue", "indigo", "orange"];

  return (
    <main className="mx-auto max-w-3xl space-y-8 p-8" data-testid="admin-appearance">
      <header>
        <h1 className="text-2xl font-semibold">Appearance & chrome</h1>
        <p className="mt-2 text-sm text-[var(--color-label-secondary)]">
          Control major interface elements without deploys (Human Interface Spec
          v1.0). Closed tint swatches; system font; draft/publish workflow.
        </p>
        {bundle && (
          <p className="mt-2 text-xs text-[var(--color-label-tertiary)]">
            Draft updated: {bundle.draft_updated_at || "—"} · Published:{" "}
            {bundle.published_at || "—"}
          </p>
        )}
      </header>

      {error && (
        <p className="rounded-[var(--radius-md)] bg-[var(--color-destructive-soft)] px-3 py-2 text-sm text-[var(--color-destructive)]">
          {error}
        </p>
      )}

      <section className="space-y-4 rounded-[var(--radius-lg)] border border-[var(--color-separator)] bg-[var(--color-surface)] p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-label-secondary)]">
          Brand
        </h2>
        <label className="block text-sm">
          <span className="font-medium">Display name</span>
          <input
            className="mt-1 w-full rounded-[var(--radius-md)] border border-[var(--color-separator)] bg-[var(--color-canvas)] px-3 py-2"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={64}
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium">Tint swatch</span>
          <select
            className="mt-1 w-full rounded-[var(--radius-md)] border border-[var(--color-separator)] bg-[var(--color-canvas)] px-3 py-2"
            value={tint}
            onChange={(e) => setTint(e.target.value)}
          >
            {tints.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="space-y-4 rounded-[var(--radius-lg)] border border-[var(--color-separator)] bg-[var(--color-surface)] p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-label-secondary)]">
          Appearance
        </h2>
        <label className="block text-sm">
          <span className="font-medium">Color scheme</span>
          <select
            className="mt-1 w-full rounded-[var(--radius-md)] border border-[var(--color-separator)] bg-[var(--color-canvas)] px-3 py-2"
            value={scheme}
            onChange={(e) => setScheme(e.target.value)}
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>
        <label className="block text-sm">
          <span className="font-medium">Density (admin-published)</span>
          <select
            className="mt-1 w-full rounded-[var(--radius-md)] border border-[var(--color-separator)] bg-[var(--color-canvas)] px-3 py-2"
            value={density}
            onChange={(e) => setDensity(e.target.value)}
          >
            <option value="comfortable">Comfortable</option>
            <option value="compact">Compact</option>
          </select>
        </label>
      </section>

      <section className="space-y-4 rounded-[var(--radius-lg)] border border-[var(--color-separator)] bg-[var(--color-surface)] p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-label-secondary)]">
          Announcement banner
        </h2>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={announcementOn}
            onChange={(e) => setAnnouncementOn(e.target.checked)}
          />
          Enabled
        </label>
        <label className="block text-sm">
          <span className="font-medium">Message</span>
          <textarea
            className="mt-1 w-full rounded-[var(--radius-md)] border border-[var(--color-separator)] bg-[var(--color-canvas)] px-3 py-2"
            rows={3}
            value={announcementMsg}
            onChange={(e) => setAnnouncementMsg(e.target.value)}
            maxLength={500}
          />
        </label>
      </section>

      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" disabled={busy} onClick={() => void saveDraft()}>
          Save draft
        </Button>
        <Button variant="primary" disabled={busy} onClick={() => void publish()}>
          Publish
        </Button>
        <Button variant="plain" disabled={busy} onClick={() => void discard()}>
          Discard draft
        </Button>
        <a
          href="/?appearance=draft"
          className="inline-flex min-h-[var(--hit-min)] items-center text-sm font-medium text-[var(--color-tint)]"
        >
          Preview draft →
        </a>
      </div>
    </main>
  );
}
