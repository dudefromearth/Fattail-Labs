"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  DEFAULT_ALERT_SETTINGS,
  loadMemberSettings,
  normalizeAlertSettings,
  saveMemberSettings,
  type AlertSettings,
  type ColorScheme,
  type FontSize,
} from "@/lib/memberSettings";
import AppearancePane from "./AppearancePane";
import AlertsPane from "./AlertsPane";

const SECTIONS = [
  { id: "appearance", label: "Appearance" },
  { id: "alerts", label: "Alerts" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

function parseSection(raw: string | null): SectionId {
  if (raw === "alerts") return "alerts";
  return "appearance";
}

export default function MemberSettingsApp() {
  const search = useSearchParams();
  const router = useRouter();
  const pathname = usePathname() || "/settings";
  const section = parseSection(search.get("section"));

  const [auth, setAuth] = useState<"loading" | "anon" | "ok">("loading");
  const [colorScheme, setColorScheme] = useState<ColorScheme>("system");
  const [fontSize, setFontSize] = useState<FontSize>("medium");
  const [alerts, setAlerts] = useState<AlertSettings>(DEFAULT_ALERT_SETTINGS);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me", { credentials: "same-origin" })
      .then((r) => {
        if (cancelled) return;
        setAuth(r.ok ? "ok" : "anon");
      })
      .catch(() => {
        if (!cancelled) setAuth("anon");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const stored = loadMemberSettings();
    if (stored.colorScheme) setColorScheme(stored.colorScheme);
    if (stored.fontSize) setFontSize(stored.fontSize);
    setAlerts(normalizeAlertSettings(stored.alerts ?? DEFAULT_ALERT_SETTINGS));
  }, []);

  const go = useCallback(
    (id: SectionId) => {
      const qs = id === "appearance" ? "" : `?section=${id}`;
      router.replace(`${pathname}${qs}`, { scroll: false });
    },
    [pathname, router],
  );

  const onColorScheme = useCallback((next: ColorScheme) => {
    setColorScheme(next);
    saveMemberSettings({ colorScheme: next });
  }, []);

  const onFontSize = useCallback((next: FontSize) => {
    setFontSize(next);
    saveMemberSettings({ fontSize: next });
  }, []);

  const onAlerts = useCallback((next: AlertSettings) => {
    setAlerts(next);
    saveMemberSettings({ alerts: next });
  }, []);

  const nav = useMemo(
    () =>
      SECTIONS.map((item) => {
        const active = item.id === section;
        return (
          <button
            key={item.id}
            type="button"
            data-testid={`settings-nav-${item.id}`}
            aria-current={active ? "page" : undefined}
            onClick={() => go(item.id)}
            className={[
              "w-full rounded-[var(--radius-md)] px-3 py-2.5 text-left text-sm",
              active
                ? "bg-[var(--color-tint-soft)] font-medium text-[var(--color-tint)]"
                : "text-[var(--color-label-secondary)] hover:bg-[var(--color-fill)] hover:text-[var(--color-label)]",
            ].join(" ")}
          >
            {item.label}
          </button>
        );
      }),
    [go, section],
  );

  if (auth === "loading") {
    return (
      <p className="text-sm text-[var(--color-label-tertiary)]">Loading…</p>
    );
  }

  if (auth === "anon") {
    return (
      <div className="surface-card border border-[var(--color-separator)] p-8 text-center">
        <p className="font-medium">Sign in to manage settings</p>
        <Link
          href="/login"
          className="mt-4 inline-block font-medium text-[var(--color-tint)]"
        >
          Log In
        </Link>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col gap-6 md:flex-row md:gap-10"
      data-testid="member-settings"
    >
      <nav
        className="flex shrink-0 gap-1 overflow-x-auto md:w-44 md:flex-col md:overflow-visible"
        aria-label="Settings sections"
      >
        {nav}
      </nav>
      <div className="min-w-0 flex-1">
        {section === "alerts" ? (
          <AlertsPane value={alerts} onChange={onAlerts} />
        ) : (
          <AppearancePane
            colorScheme={colorScheme}
            fontSize={fontSize}
            onColorScheme={onColorScheme}
            onFontSize={onFontSize}
          />
        )}
      </div>
    </div>
  );
}
