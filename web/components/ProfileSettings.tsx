"use client";

// Member Profile — display name, avatar, Journey presence visibility.
// Spec: Member Profile + Journey Visibility v1.0

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  HOME_QUICK_NAV_DEFAULT,
  HOME_QUICK_NAV_OPTIONS,
  normalizeHomeQuickNav,
  type HomeQuickNavId,
} from "@/lib/homeQuickNav";
import PracticePortabilityPanel from "@/components/practice/PracticePortabilityPanel";
import { downloadPracticeExport } from "@/lib/practicePortability";

type Profile = {
  identity_id: number;
  email: string;
  display_name: string;
  avatar_url: string | null;
  journey_visible: boolean;
  share_reputation: boolean;
  share_personal_growth: boolean;
  share_attendance: boolean;
  session_idle_minutes?: number;
  home_quick_nav?: HomeQuickNavId[] | string[];
  role: string;
};

const IDLE_OPTIONS = [15, 20, 30, 45, 60] as const;

function initials(p: Profile): string {
  const source = p.display_name || p.email;
  const parts = source.replace(/@.*/, "").split(/[\s._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "?") + (parts[1]?.[0] ?? "")).toUpperCase();
}

export default function ProfileSettings() {
  const [profile, setProfile] = useState<Profile | null | "anon" | "err">(null);
  const [name, setName] = useState("");
  const [visible, setVisible] = useState(false);
  const [shareRep, setShareRep] = useState(true);
  const [shareGrowth, setShareGrowth] = useState(false);
  const [shareAtt, setShareAtt] = useState(true);
  const [idleMinutes, setIdleMinutes] = useState(30);
  const [quickNav, setQuickNav] = useState<HomeQuickNavId[]>([
    ...HOME_QUICK_NAV_DEFAULT,
  ]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [purging, setPurging] = useState(false);
  const [purgeOpen, setPurgeOpen] = useState(false);
  const [purgeExported, setPurgeExported] = useState(false);
  const [purgeAck, setPurgeAck] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function downloadPracticeData(): Promise<boolean> {
    setExporting(true);
    setErr(null);
    try {
      await downloadPracticeExport(
        "/api/me/export?format=zip",
        "fattail-member-export.zip",
      );
      setMsg("Download started — keep that file if you may want your data later.");
      return true;
    } catch {
      setErr("Could not prepare your download. Try again.");
      return false;
    } finally {
      setExporting(false);
    }
  }

  function applyProfile(p: Profile) {
    setProfile(p);
    setName(p.display_name || "");
    setVisible(!!p.journey_visible);
    setShareRep(p.share_reputation !== false);
    setShareGrowth(!!p.share_personal_growth);
    setShareAtt(p.share_attendance !== false);
    const idle = p.session_idle_minutes ?? 30;
    setIdleMinutes(Math.min(60, Math.max(15, idle)));
    setQuickNav(normalizeHomeQuickNav(p.home_quick_nav));
  }

  function toggleQuickNav(id: HomeQuickNavId, on: boolean) {
    if (id === "journal") return; // always on
    setQuickNav((prev) => {
      const set = new Set(prev);
      if (on) set.add(id);
      else set.delete(id);
      return normalizeHomeQuickNav([...set]);
    });
  }

  const load = useCallback(() => {
    fetch("/api/me/profile", { credentials: "same-origin" })
      .then(async (r) => {
        if (r.status === 401) return "anon" as const;
        if (!r.ok) return "err" as const;
        return (await r.json()) as Profile;
      })
      .then((d) => {
        if (d && typeof d === "object") applyProfile(d);
        else setProfile(d);
      })
      .catch(() => setProfile("err"));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function savePrefs(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    setErr(null);
    try {
      const r = await fetch("/api/me/profile", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: name.trim(),
          journey_visible: visible,
          share_reputation: shareRep,
          share_personal_growth: shareGrowth,
          share_attendance: shareAtt,
          session_idle_minutes: idleMinutes,
          home_quick_nav: quickNav,
        }),
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        const detail = body?.detail;
        const msg =
          typeof detail === "string"
            ? detail
            : Array.isArray(detail)
              ? detail
                  .map((d: { msg?: string } | string) =>
                    typeof d === "string" ? d : d?.msg || JSON.stringify(d),
                  )
                  .join("; ")
              : `Save failed (${r.status})`;
        throw new Error(msg);
      }
      const p = (await r.json()) as Profile;
      applyProfile(p);
      const savedNav = normalizeHomeQuickNav(p.home_quick_nav);
      const labels = savedNav
        .map(
          (id) =>
            HOME_QUICK_NAV_OPTIONS.find((o) => o.id === id)?.label ?? id,
        )
        .join(" · ");
      setMsg(`Saved. Home quick nav: ${labels}`);
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function onAvatarChange(file: File | null) {
    if (!file) return;
    setMsg(null);
    setErr(null);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const r = await fetch("/api/me/profile/avatar", {
        method: "POST",
        credentials: "same-origin",
        body: fd,
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        throw new Error(
          typeof body.detail === "string"
            ? body.detail
            : `Upload failed (${r.status})`
        );
      }
      const p = (await r.json()) as Profile;
      setProfile(p);
      setMsg("Photo updated. Refresh the page if the header still shows initials.");
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Upload failed");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function clearAvatar() {
    setMsg(null);
    setErr(null);
    const r = await fetch("/api/me/profile/avatar", {
      method: "DELETE",
      credentials: "same-origin",
    });
    if (!r.ok) {
      setErr("Could not remove photo");
      return;
    }
    const p = (await r.json()) as Profile;
    setProfile(p);
    setMsg("Photo removed.");
  }

  async function manageBilling() {
    const r = await fetch("/api/billing/portal", {
      method: "POST",
      credentials: "same-origin",
    });
    if (r.ok) {
      const { url } = await r.json();
      window.location.href = url;
    }
  }

  if (profile === null) {
    return <p className="text-sm text-[var(--color-label-tertiary)]">Loading…</p>;
  }
  if (profile === "anon") {
    return (
      <div className="surface-card border border-[var(--color-separator)] p-8 text-center">
        <p className="font-medium">Sign in to manage your profile</p>
        <Link
          href="/login"
          className="mt-4 inline-block font-medium text-[var(--color-tint)]"
        >
          Log In
        </Link>
      </div>
    );
  }
  if (profile === "err") {
    return (
      <p className="text-sm text-red-600">
        Could not load profile. Restart the Labs API if migrations are pending.
      </p>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--color-label-secondary)]">
          {profile.email}
        </p>
        <button
          type="button"
          onClick={manageBilling}
          className="text-sm text-[var(--color-label-secondary)] hover:underline"
        >
          Manage billing
        </button>
      </div>

      {(msg || err) && (
        <p
          className={`text-sm ${err ? "text-red-600" : "text-[var(--color-tint)]"}`}
          role="status"
        >
          {err || msg}
        </p>
      )}

      {/* Data portability — Spec Member Practice Export/Import v1.1 */}
      <PracticePortabilityPanel variant="profile" />

      <section className="surface-card border border-[var(--color-separator)] p-6">
        <h2 className="text-lg font-semibold">Delete Practice data</h2>
        <p className="mt-1 text-sm text-[var(--color-label-secondary)]">
          Permanently remove Practice activity from this account. Membership and
          course progress stay. Download a backup first if you may want the data
          later.
        </p>
        <div className="mt-4">
          <button
            type="button"
            disabled={purging}
            data-testid="delete-practice-data"
            className="rounded-full border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
            onClick={() => {
              setPurgeOpen(true);
              setPurgeExported(false);
              setPurgeAck(false);
              setErr(null);
              setMsg(null);
            }}
          >
            Delete Practice data…
          </button>
        </div>

        {purgeOpen && (
          <div
            className="mt-4 rounded-[var(--radius-md)] border border-red-200 bg-red-50/80 p-4 text-sm"
            data-testid="purge-confirm"
            role="alertdialog"
            aria-labelledby="purge-title"
          >
            <p id="purge-title" className="font-medium text-red-900">
              Before you delete Practice data
            </p>
            <p className="mt-2 text-red-900/90">
              This permanently removes Trade Log, Journal notes, Retrospectives,
              habit plans, Playbook, and live check-ins from this account. It
              cannot be undone unless you have a backup file.{" "}
              <strong>Membership, courses, and progress are not removed.</strong>
            </p>
            <p className="mt-2 font-medium text-red-900">
              We strongly recommend downloading a copy first.
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={exporting}
                data-testid="purge-export-first"
                className="rounded-full bg-[var(--color-tint)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
                onClick={async () => {
                  setMsg(null);
                  const ok = await downloadPracticeData();
                  if (ok) setPurgeExported(true);
                }}
              >
                {exporting ? "Preparing…" : "Download backup first"}
              </button>
              {purgeExported && (
                <span
                  className="self-center text-xs font-medium text-green-800"
                  data-testid="purge-export-done"
                >
                  Backup download started
                </span>
              )}
            </div>

            <label className="mt-4 flex cursor-pointer items-start gap-2 text-red-900/95">
              <input
                type="checkbox"
                className="mt-1"
                data-testid="purge-ack"
                checked={purgeAck}
                onChange={(e) => setPurgeAck(e.target.checked)}
              />
              <span>
                I understand this deletes Practice data permanently, and I have
                downloaded a backup (or I choose not to keep one).
              </span>
            </label>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={purging || !purgeAck}
                data-testid="purge-confirm-yes"
                className="rounded-full bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-60"
                onClick={async () => {
                  if (!purgeAck) return;
                  setPurging(true);
                  setErr(null);
                  try {
                    const r = await fetch("/api/me/practice-data/purge", {
                      method: "POST",
                      credentials: "same-origin",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        confirm: "DELETE_PRACTICE_DATA",
                      }),
                    });
                    const data = await r.json().catch(() => ({}));
                    if (!r.ok) {
                      setErr(
                        (data as { detail?: { message?: string } })?.detail
                          ?.message || "Could not delete Practice data.",
                      );
                      return;
                    }
                    setMsg(
                      "Practice data deleted. Membership kept. You can Load a backup now.",
                    );
                    setPurgeOpen(false);
                    setPurgeExported(false);
                    setPurgeAck(false);
                  } catch {
                    setErr("Could not delete Practice data.");
                  } finally {
                    setPurging(false);
                  }
                }}
              >
                {purging ? "Deleting…" : "Yes, delete Practice data"}
              </button>
              <button
                type="button"
                className="rounded-full border border-[var(--color-separator)] bg-white px-4 py-2 text-sm"
                onClick={() => {
                  setPurgeOpen(false);
                  setPurgeExported(false);
                  setPurgeAck(false);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Avatar */}
      <section className="surface-card border border-[var(--color-separator)] p-6">
        <h2 className="text-lg font-semibold">Profile photo</h2>
        <p className="mt-1 text-sm text-[var(--color-label-secondary)]">
          Shown in the header and on the Journey presence roster when you opt in.
          PNG, JPEG, or WebP · max 2&nbsp;MB.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-5">
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt=""
              width={80}
              height={80}
              unoptimized
              className="h-20 w-20 rounded-full object-cover ring-2 ring-[var(--color-separator)]"
            />
          ) : (
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-tint)] text-xl font-semibold text-white">
              {initials(profile)}
            </span>
          )}
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => onAvatarChange(e.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              className="rounded-full bg-[var(--color-tint)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              onClick={() => fileRef.current?.click()}
            >
              Upload photo
            </button>
            {profile.avatar_url && (
              <button
                type="button"
                className="rounded-full border border-[var(--color-separator)] px-4 py-2 text-sm hover:bg-[var(--color-fill)]"
                onClick={clearAvatar}
              >
                Remove
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Prefs form */}
      <form
        onSubmit={savePrefs}
        className="surface-card space-y-6 border border-[var(--color-separator)] p-6"
      >
        <div>
          <h2 className="text-lg font-semibold">Preferences</h2>
          <p className="mt-1 text-sm text-[var(--color-label-secondary)]">
            How you appear to yourself and, if you opt in, to other members on
            Journey.
          </p>
        </div>

        <label className="block">
          <span className="text-sm font-medium">Display name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={64}
            className="mt-1.5 w-full max-w-md rounded-[var(--radius-md)] border border-[var(--color-separator)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-tint)]"
            autoComplete="name"
          />
        </label>

        {profile.role !== "administrator" && (
          <label className="block">
            <span className="text-sm font-medium">Session idle timeout</span>
            <p className="mt-0.5 text-xs text-[var(--color-label-secondary)]">
              After this much inactivity you are signed out and returned to the
              login page. Administrators are exempt. Default 30 minutes.
            </p>
            <select
              value={idleMinutes}
              onChange={(e) => setIdleMinutes(Number(e.target.value))}
              className="mt-1.5 w-full max-w-md rounded-[var(--radius-md)] border border-[var(--color-separator)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-tint)]"
            >
              {IDLE_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {m} minutes{m === 30 ? " (default)" : ""}
                </option>
              ))}
            </select>
          </label>
        )}

        <div
          className="space-y-3 rounded-[var(--radius-md)] border border-[var(--color-separator)] bg-[var(--color-fill)]/40 p-4"
          data-testid="profile-home-quick-nav"
        >
          <div>
            <p className="text-sm font-medium text-[var(--color-label)]">
              Home quick nav
            </p>
            <p className="mt-0.5 text-xs text-[var(--color-label-secondary)]">
              Shortcuts on your home page. Journal is always included and opens
              today&apos;s day view. Add other destinations you use often.
            </p>
          </div>
          <ul className="space-y-2">
            {HOME_QUICK_NAV_OPTIONS.map((opt) => {
              const checked = quickNav.includes(opt.id);
              return (
                <li key={opt.id}>
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={opt.required}
                      onChange={(e) => toggleQuickNav(opt.id, e.target.checked)}
                      className="mt-1 h-4 w-4 accent-[var(--color-tint)]"
                      data-testid={`profile-quick-nav-${opt.id}`}
                    />
                    <span className="text-sm">
                      <span className="font-medium text-[var(--color-label)]">
                        {opt.label}
                        {opt.required ? (
                          <span className="ml-1 text-xs font-normal text-[var(--color-label-tertiary)]">
                            (always on)
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-0.5 block text-[var(--color-label-secondary)]">
                        {opt.description}
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
          <p className="text-xs text-[var(--color-label-tertiary)]">
            Preview:{" "}
            {quickNav
              .map(
                (id) =>
                  HOME_QUICK_NAV_OPTIONS.find((o) => o.id === id)?.label ?? id,
              )
              .join(" · ")}
          </p>
        </div>

        <div className="space-y-3 rounded-[var(--radius-md)] border border-[var(--color-separator)] bg-[var(--color-fill)]/40 p-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={visible}
              onChange={(e) => setVisible(e.target.checked)}
              className="mt-1 h-4 w-4 accent-[var(--color-tint)]"
            />
            <span>
              <span className="block text-sm font-medium">
                Show me on the Journey community board
              </span>
              <span className="mt-1 block text-sm text-[var(--color-label-secondary)]">
                Appear with your name and photo. Choose below what process
                scores to share. Trade Log, Journal, Playbook, and email stay
                private. Off by default.
              </span>
            </span>
          </label>

          <div
            className={`ml-7 space-y-3 border-l-2 border-[var(--color-separator)] pl-4 ${
              visible ? "" : "opacity-50"
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
              What others can see
            </p>
            <p className="text-xs text-[var(--color-label-secondary)]">
              You can build community presence while keeping trader growth
              private. Public contribution only counts pillars you share.
            </p>
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={shareRep}
                disabled={!visible}
                onChange={(e) => setShareRep(e.target.checked)}
                className="mt-1 h-4 w-4 accent-[var(--color-tint)]"
              />
              <span className="text-sm">
                <span className="font-medium">Reputation</span>
                <span className="mt-0.5 block text-[var(--color-label-secondary)]">
                  Community contribution — courses completed, discussions,
                  reviews.
                </span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={shareGrowth}
                disabled={!visible}
                onChange={(e) => setShareGrowth(e.target.checked)}
                className="mt-1 h-4 w-4 accent-[var(--color-tint)]"
              />
              <span className="text-sm">
                <span className="font-medium">Personal growth</span>
                <span className="mt-0.5 block text-[var(--color-label-secondary)]">
                  Lessons and quizzes — your private growth path as a trader.
                  Off by default.
                </span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={shareAtt}
                disabled={!visible}
                onChange={(e) => setShareAtt(e.target.checked)}
                className="mt-1 h-4 w-4 accent-[var(--color-tint)]"
              />
              <span className="text-sm">
                <span className="font-medium">Attendance streak</span>
                <span className="mt-0.5 block text-[var(--color-label-secondary)]">
                  Live session check-ins — showing up with the community.
                </span>
              </span>
            </label>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-[var(--color-tint)] px-5 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save preferences"}
          </button>
          <Link
            href="/app/journey"
            className="text-sm font-medium text-[var(--color-tint)] hover:underline"
          >
            Open Journey →
          </Link>
        </div>
      </form>
    </div>
  );
}
