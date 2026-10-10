"use client";

// Links / QR — admin detail + reporting (LK-1.1, W3 minimal surface).
// Columns shown match AD-L3 exactly: timestamp, kind, device_class,
// os_family, referrer, country, region, bot. No member_id/marker_id/owner.
// No "unique scans" claim (LK-L5, D5) — no cookies or retained IP (Q3), so
// scan/click (RD-L2's kind heuristic) replaces it as the honest second number.

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import SegmentedControl from "@/components/ui/SegmentedControl";

type LinkRow = {
  slug: string;
  short_url: string;
  destination: string;
  label: string;
  active: boolean;
  static: boolean;
  source: string | null;
  medium: string | null;
  campaign: string | null;
  placement: string | null;
  created_at: string;
  updated_at: string;
};

type EventRow = {
  occurred_at: string;
  kind: string;
  device_class: string;
  os_family: string;
  referrer: string;
  country: string;
  region: string;
  bot: boolean;
};

type BreakdownBucket = {
  top: { key: string; count: number; pct: number }[];
  total_count: number;
  distinct: number;
  has_more: boolean;
};

type DailyPoint = { day: string; scan: number; click: number; count: number };

type Detail = {
  link: LinkRow;
  tracked: boolean;
  days: number;
  total_scans: number | null;
  scan_count: number | null;
  click_count: number | null;
  last_scan: string | null;
  daily: DailyPoint[];
  breakdowns: Record<string, BreakdownBucket>;
  events: EventRow[];
};

const RANGE_OPTIONS = [
  { id: "7", label: "7d" },
  { id: "30", label: "30d" },
  { id: "90", label: "90d" },
  { id: "0", label: "All" },
] as const;

function daysSince(iso: string): number {
  const created = new Date(iso).getTime();
  if (Number.isNaN(created)) return 0;
  return Math.max(0, Math.floor((Date.now() - created) / 86_400_000));
}

function Pill({ tone, children }: { tone: "tint" | "neutral" | "destructive"; children: React.ReactNode }) {
  const toneClass =
    tone === "tint"
      ? "bg-[var(--color-tint-soft)] text-[var(--color-tint-emphasis)]"
      : tone === "destructive"
        ? "bg-[var(--color-destructive-soft)] text-[var(--color-destructive)]"
        : "bg-[var(--color-fill)] text-[var(--color-label-secondary)]";
  return (
    <span
      className={`inline-flex items-center rounded-[var(--radius-full)] px-2.5 py-1 text-[length:var(--text-caption)] font-semibold ${toneClass}`}
    >
      {children}
    </span>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-[var(--radius-xl)] bg-[var(--color-surface)] p-5 shadow-[var(--elevation-1)] ${className}`}
    >
      {children}
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[length:var(--text-caption)] font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
      {children}
    </h3>
  );
}

function StatTile({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <Card className="p-4">
      <Eyebrow>{label}</Eyebrow>
      <div className="mt-1.5 text-[length:var(--text-title-1)] font-semibold text-[var(--color-label)]">
        {value}
      </div>
      {hint && <div className="mt-0.5 text-[length:var(--text-caption)] text-[var(--color-label-tertiary)]">{hint}</div>}
    </Card>
  );
}

function BreakdownPanel({
  dim,
  title,
  data,
  slug,
  days,
}: {
  dim: string;
  title: string;
  data: BreakdownBucket | undefined;
  slug: string;
  days: number;
}) {
  const rows = data?.top ?? [];
  return (
    <Card>
      <div className="mb-3 flex items-baseline justify-between">
        <Eyebrow>{title}</Eyebrow>
        {data?.has_more && (
          <Link
            href={`/admin/links/${slug}/${dim}?days=${days}`}
            className="text-[length:var(--text-footnote)] font-medium text-[var(--color-tint)] hover:underline"
          >
            View all {data.distinct} →
          </Link>
        )}
      </div>
      {rows.length === 0 ? (
        <p className="text-[length:var(--text-footnote)] text-[var(--color-label-tertiary)]">No scans yet.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.key} className="flex items-center gap-3">
              <span className="w-28 flex-none truncate text-[length:var(--text-footnote)] text-[var(--color-label)]">
                {r.key}
              </span>
              <span className="h-2 flex-1 overflow-hidden rounded-[var(--radius-full)] bg-[var(--color-fill)]">
                <span
                  className="block h-full rounded-[var(--radius-full)] bg-[var(--color-tint)]"
                  style={{ width: `${Math.max(4, r.pct)}%` }}
                />
              </span>
              <span className="w-10 flex-none text-right text-[length:var(--text-footnote)] font-medium text-[var(--color-label)]">
                {r.count}
              </span>
              <span className="w-12 flex-none text-right text-[length:var(--text-footnote)] text-[var(--color-label-tertiary)]">
                {r.pct}%
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function DailyChart({ daily }: { daily: DailyPoint[] }) {
  const max = Math.max(1, ...daily.map((d) => d.count));
  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <Eyebrow>Over time</Eyebrow>
        <div className="flex items-center gap-3 text-[length:var(--text-caption)] text-[var(--color-label-secondary)]">
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[var(--color-tint)]" /> Camera scan
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[var(--color-label-tertiary)]" /> Link click
          </span>
        </div>
      </div>
      {daily.length === 0 ? (
        <p className="text-[length:var(--text-footnote)] text-[var(--color-label-tertiary)]">No scans yet.</p>
      ) : (
        <div className="flex h-28 items-end gap-1">
          {daily.map((d) => (
            <div
              key={d.day}
              className="flex flex-1 flex-col-reverse"
              title={`${d.day}: ${d.scan} scan · ${d.click} click`}
            >
              <div
                className="w-full rounded-t-[3px] bg-[var(--color-tint)]"
                style={{ height: `${Math.max(d.scan ? 2 : 0, (d.scan / max) * 96)}px` }}
              />
              <div
                className="w-full bg-[var(--color-label-tertiary)]"
                style={{ height: `${Math.max(d.click ? 2 : 0, (d.click / max) * 96)}px` }}
              />
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export default function LinkDetailPanel({ slug }: { slug: string }) {
  const [state, setState] = useState<"loading" | "denied" | "notfound" | "ready">("loading");
  const [data, setData] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState<"7" | "30" | "90" | "0">("7");

  const [destination, setDestination] = useState("");
  const [label, setLabel] = useState("");
  const [source, setSource] = useState("");
  const [medium, setMedium] = useState("");
  const [campaign, setCampaign] = useState("");
  const [placement, setPlacement] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(
    (opts: { resetForm?: boolean } = {}) => {
      const resetForm = opts.resetForm ?? true;
      fetch(`/api/admin/links/${slug}?days=${days}`, { credentials: "same-origin", cache: "no-store" })
        .then((r) => {
          if (r.status === 404) return "notfound" as const;
          return r.ok ? r.json() : ("denied" as const);
        })
        .then((d) => {
          if (d === "denied") {
            setState("denied");
            return;
          }
          if (d === "notfound") {
            setState("notfound");
            return;
          }
          setData(d);
          if (resetForm) {
            setDestination(d.link.destination);
            setLabel(d.link.label);
            setSource(d.link.source ?? "");
            setMedium(d.link.medium ?? "");
            setCampaign(d.link.campaign ?? "");
            setPlacement(d.link.placement ?? "");
          }
          setState("ready");
        })
        .catch(() => setState("denied"));
    },
    [slug, days],
  );

  useEffect(() => {
    load();
  }, [load]);

  // Live reporting: poll in the background so scans show up without a
  // manual refresh. Never touches the edit form's in-progress values.
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") {
        load({ resetForm: false });
      }
    }, 5000);
    return () => clearInterval(id);
  }, [load]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/links/${slug}`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ destination, label, source, medium, campaign, placement }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.detail ? String(body.detail) : `save failed (${res.status})`);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "save failed");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive() {
    if (!data) return;
    await fetch(`/api/admin/links/${slug}`, {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ active: !data.link.active }),
    });
    load();
  }

  if (state === "loading")
    return <main className="p-8 text-[var(--color-label-secondary)]">Loading…</main>;
  if (state === "denied") {
    return (
      <main className="p-8">
        <p className="text-[var(--color-destructive)]">Administrator sign-in required.</p>
      </main>
    );
  }
  if (state === "notfound" || !data) {
    return (
      <main className="p-8">
        <p className="text-[var(--color-label-secondary)]">Unknown link.</p>
      </main>
    );
  }

  const cacheBust = encodeURIComponent(data.link.updated_at);

  return (
    <main className="mx-auto max-w-5xl p-6" data-testid="link-detail-panel">
      <nav className="mb-4 flex gap-2 text-[length:var(--text-footnote)] text-[var(--color-label-secondary)]">
        <Link href="/admin" className="hover:underline">
          Admin
        </Link>
        <span>/</span>
        <Link href="/admin/links" className="hover:underline" data-testid="link-back-to-list">
          Links / QR
        </Link>
        <span>/</span>
        <span className="text-[var(--color-label)]">{data.link.label}</span>
      </nav>

      <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_auto]">
        <Card>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Pill tone="neutral">Website</Pill>
            {data.link.static ? (
              <Pill tone="neutral">Static — not tracked</Pill>
            ) : data.link.active ? (
              <Pill tone="tint">Active for {daysSince(data.link.created_at)} days</Pill>
            ) : (
              <Pill tone="destructive">Inactive</Pill>
            )}
            <div className="ml-auto flex gap-2">
              <Button variant="secondary" onClick={toggleActive}>
                {data.link.active ? "Deactivate" : "Reactivate"}
              </Button>
              <a
                href={`/api/admin/links/${slug}/qr-card.png?v=${cacheBust}`}
                download
                className="inline-flex min-h-[var(--hit-min)] items-center justify-center gap-2 rounded-[var(--radius-full)] bg-[var(--color-tint)] px-4 text-sm font-medium text-[var(--color-on-tint)] hover:bg-[var(--color-tint-emphasis)]"
              >
                Download QR
              </a>
            </div>
          </div>
          <h1
            className="truncate text-[length:var(--text-title-1)] font-semibold text-[var(--color-label)]"
            title={data.link.destination}
          >
            {data.link.destination}
          </h1>
          <p className="mt-1 font-[var(--font-mono)] text-[length:var(--text-footnote)] text-[var(--color-label-secondary)]">
            {data.link.short_url}
          </p>
          <p className="mt-1 text-[length:var(--text-caption)] text-[var(--color-label-tertiary)]">
            Created {new Date(data.link.created_at).toLocaleDateString()}
          </p>

          <div className="mt-4 grid grid-cols-2 gap-4 border-t border-[var(--color-separator)] pt-4 sm:grid-cols-4">
            {[
              { k: "Source", v: data.link.source },
              { k: "Medium", v: data.link.medium },
              { k: "Campaign", v: data.link.campaign },
              { k: "Placement", v: data.link.placement },
            ].map((f) => (
              <div key={f.k}>
                <div className="text-[length:var(--text-caption)] font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
                  {f.k}
                </div>
                <div className="mt-0.5 text-[length:var(--text-subheadline)] text-[var(--color-label)]">
                  {f.v || <span className="text-[var(--color-tint)]">Not set</span>}
                </div>
              </div>
            ))}
          </div>

        </Card>

        {!data.link.static && (
          <Card className="flex w-full flex-col items-center gap-2 lg:w-56">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/admin/links/${slug}/qr-card.png?v=${cacheBust}`}
              alt={`QR code labeled "${data.link.label}"`}
              className="h-auto w-full max-w-[12rem] rounded-[var(--radius-md)]"
            />
            <div className="flex gap-2 text-[length:var(--text-caption)]">
              <a className="text-[var(--color-tint)] hover:underline" href={`/api/admin/links/${slug}/qr.svg?v=${cacheBust}`} download={`${slug}.svg`}>
                Plain SVG
              </a>
              <a className="text-[var(--color-tint)] hover:underline" href={`/api/admin/links/${slug}/qr.png?v=${cacheBust}`} download={`${slug}.png`}>
                Plain PNG
              </a>
            </div>
          </Card>
        )}
      </div>

      {!data.tracked ? (
        <Card>
          <p className="text-[length:var(--text-subheadline)] text-[var(--color-label-secondary)]">
            Static link — scans are not recorded (LK-L3).
          </p>
        </Card>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-3 gap-4">
            <StatTile label="Total scans" value={data.total_scans ?? 0} hint="bots excluded, all time" />
            <StatTile label="Camera scans" value={data.scan_count ?? 0} hint="no referrer, mobile" />
            <StatTile label="Link clicks" value={data.click_count ?? 0} hint="shared / tapped link" />
          </div>

          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[length:var(--text-title-3)] font-semibold text-[var(--color-label)]">Scans</h2>
            <div className="flex items-center gap-3">
              <div className="w-48">
                <SegmentedControl
                  value={days}
                  onChange={(v) => setDays(v)}
                  ariaLabel="Date range"
                  options={RANGE_OPTIONS as unknown as { id: "7" | "30" | "90" | "0"; label: string }[]}
                />
              </div>
              <a
                href={`/api/admin/links/${slug}/events.csv?days=${days}`}
                className="inline-flex min-h-[var(--hit-min)] items-center justify-center gap-2 rounded-[var(--radius-full)] bg-[var(--color-fill)] px-4 text-sm font-medium text-[var(--color-label)] hover:opacity-90"
              >
                Download CSV ({days === "0" ? "all time" : `${days}d`})
              </a>
            </div>
          </div>

          <div className="mb-4 grid gap-4 lg:grid-cols-2">
            <DailyChart daily={data.daily} />
            <BreakdownPanel dim="os_family" title="Operating system" data={data.breakdowns.os_family} slug={slug} days={Number(days)} />
          </div>

          <div className="mb-4 grid gap-4 md:grid-cols-2">
            <BreakdownPanel dim="country" title="Top countries" data={data.breakdowns.country} slug={slug} days={Number(days)} />
            <BreakdownPanel dim="region" title="Top regions" data={data.breakdowns.region} slug={slug} days={Number(days)} />
          </div>

          <div className="mb-6 grid gap-4 md:grid-cols-2">
            <BreakdownPanel dim="device_class" title="Device" data={data.breakdowns.device_class} slug={slug} days={Number(days)} />
            <BreakdownPanel dim="source" title="Traffic sources" data={data.breakdowns.source} slug={slug} days={Number(days)} />
          </div>

          <Card className="mb-6">
            <Eyebrow>Recent scans</Eyebrow>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-[length:var(--text-footnote)]">
                <thead>
                  <tr className="text-left text-[var(--color-label-tertiary)]">
                    <th className="py-1 pr-3 font-medium">Time (UTC)</th>
                    <th className="py-1 pr-3 font-medium">Kind</th>
                    <th className="py-1 pr-3 font-medium">Device</th>
                    <th className="py-1 pr-3 font-medium">OS</th>
                    <th className="py-1 pr-3 font-medium">Referrer</th>
                    <th className="py-1 font-medium">Location</th>
                  </tr>
                </thead>
                <tbody>
                  {data.events.map((e, i) => (
                    <tr key={i} className="border-t border-[var(--color-separator)]">
                      <td className="py-1.5 pr-3 font-[var(--font-mono)] text-[var(--color-label)]">{e.occurred_at}</td>
                      <td className="py-1.5 pr-3 text-[var(--color-label)]">{e.kind}</td>
                      <td className="py-1.5 pr-3 text-[var(--color-label)]">{e.device_class}</td>
                      <td className="py-1.5 pr-3 text-[var(--color-label)]">{e.os_family}</td>
                      <td className="py-1.5 pr-3 text-[var(--color-label)]">{e.referrer}</td>
                      <td className="py-1.5 text-[var(--color-label)]">
                        {e.country}
                        {e.region !== "unknown" ? ` / ${e.region}` : ""}
                      </td>
                    </tr>
                  ))}
                  {!data.events.length && (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-[var(--color-label-tertiary)]">
                        No scans yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      <Card>
        <Eyebrow>Edit</Eyebrow>
        <form onSubmit={onSave} className="mt-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-[length:var(--text-caption)] text-[var(--color-label-secondary)]">
              Label
              <input
                className="mt-1 w-full rounded-[var(--radius-md)] border border-[var(--color-separator)] bg-[var(--color-surface)] px-3 py-2 text-[length:var(--text-subheadline)] text-[var(--color-label)]"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </label>
            <label className="text-[length:var(--text-caption)] text-[var(--color-label-secondary)]">
              Destination
              <input
                className="mt-1 w-full rounded-[var(--radius-md)] border border-[var(--color-separator)] bg-[var(--color-surface)] px-3 py-2 text-[length:var(--text-subheadline)] text-[var(--color-label)]"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              />
            </label>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-4">
            {[
              { v: source, set: setSource, ph: "Source" },
              { v: medium, set: setMedium, ph: "Medium" },
              { v: campaign, set: setCampaign, ph: "Campaign" },
              { v: placement, set: setPlacement, ph: "Placement" },
            ].map((f) => (
              <label key={f.ph} className="text-[length:var(--text-caption)] text-[var(--color-label-secondary)]">
                {f.ph}
                <input
                  className="mt-1 w-full rounded-[var(--radius-md)] border border-[var(--color-separator)] bg-[var(--color-surface)] px-3 py-2 text-[length:var(--text-subheadline)] text-[var(--color-label)]"
                  value={f.v}
                  onChange={(e) => f.set(e.target.value)}
                  placeholder={f.ph}
                />
              </label>
            ))}
          </div>
          {error && <p className="mt-2 text-[length:var(--text-footnote)] text-[var(--color-destructive)]">{error}</p>}
          <div className="mt-4">
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? "Saving…" : "Save (no reprint needed)"}
            </Button>
          </div>
        </form>
      </Card>
    </main>
  );
}
