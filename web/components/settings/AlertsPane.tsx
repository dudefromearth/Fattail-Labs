"use client";

import type { ReactNode } from "react";
import Banner from "@/components/ui/Banner";
import {
  ALERT_CLASSES,
  ALERT_CLASS_LABELS,
  ALERT_DESTINATION_LABELS,
  ALERT_DESTINATIONS,
  ALERT_SEVERITIES,
  COMING_SOON_DESTINATIONS,
  type AlertClassId,
  type AlertDestinationId,
  type AlertSettings,
  type AlertSeverity,
} from "@/lib/memberSettings";

const SEVERITY_LABEL: Record<AlertSeverity, string> = {
  info: "Info",
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
];

const TIME_OPTIONS: string[] = (() => {
  const out: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      out.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return out;
})();

function formatTime(hhmm: string): string {
  const [hs, ms] = hhmm.split(":");
  const h = Number(hs);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${ms} ${suffix}`;
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section className="surface-card border border-[var(--color-separator)] p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      {hint ? (
        <p className="mt-1 text-sm text-[var(--color-label-secondary)]">{hint}</p>
      ) : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Row({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[var(--hit-min)] items-center justify-between gap-4 border-t border-[var(--color-separator)] py-2 first:border-t-0 first:pt-0">
      {children}
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
  disabled,
  testId,
  ariaLabel,
}: {
  value: string;
  onChange: (next: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
  testId?: string;
  ariaLabel: string;
}) {
  return (
    <select
      aria-label={ariaLabel}
      data-testid={testId}
      disabled={disabled}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-[var(--radius-md)] border border-[var(--color-separator)] bg-[var(--color-surface)] px-3 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-tint)] disabled:opacity-50"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export default function AlertsPane({
  value,
  onChange,
}: {
  value: AlertSettings;
  onChange: (next: AlertSettings) => void;
}) {
  function patch(next: AlertSettings) {
    onChange(next);
  }

  const severityOptions = ALERT_SEVERITIES.map((s) => ({
    value: s,
    label: SEVERITY_LABEL[s],
  }));

  return (
    <div className="space-y-8" data-testid="settings-alerts">
      <div data-testid="settings-alerts-not-live">
        <Banner tone="info">
          Destinations are saved. Delivery is not live yet. Author rules in the
          originating app — Settings is configuration only.
        </Banner>
      </div>

      <Section title="Alert Delivery">
        <p className="mb-2 text-sm font-medium">Destinations</p>
        {(
          [
            "in_app",
            "process_surface",
            "os",
            "sms",
            "email_digest",
          ] as const
        ).map((id) => {
          const soon = COMING_SOON_DESTINATIONS.has(id);
          return (
            <Row key={id}>
              <label className="flex cursor-pointer items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-[var(--color-tint)]"
                  data-testid={`settings-dest-${id}`}
                  checked={soon ? false : value.delivery[id]}
                  disabled={soon}
                  onChange={(e) =>
                    patch({
                      ...value,
                      delivery: { ...value.delivery, [id]: e.target.checked },
                    })
                  }
                />
                <span>
                  {ALERT_DESTINATION_LABELS[id]}
                  {soon ? (
                    <span className="ml-2 text-xs text-[var(--color-label-tertiary)]">
                      Coming soon
                    </span>
                  ) : null}
                </span>
              </label>
            </Row>
          );
        })}
      </Section>

      <Section
        title="Severity Minimums"
        hint="Minimum severity level required per destination."
      >
        {ALERT_DESTINATIONS.map((id: AlertDestinationId) => (
          <Row key={id}>
            <span className="text-sm">{ALERT_DESTINATION_LABELS[id]}</span>
            <Select
              ariaLabel={`${ALERT_DESTINATION_LABELS[id]} minimum severity`}
              testId={`settings-sev-${id}`}
              value={value.severityMin[id]}
              options={severityOptions}
              onChange={(next) =>
                patch({
                  ...value,
                  severityMin: {
                    ...value.severityMin,
                    [id]: next as AlertSeverity,
                  },
                })
              }
            />
          </Row>
        ))}
      </Section>

      <Section
        title="Alert Classes"
        hint="Choose which alert classes are delivered."
      >
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {ALERT_CLASSES.map((id: AlertClassId) => (
            <label key={id} className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[var(--color-tint)]"
                data-testid={`settings-class-${id}`}
                checked={value.classes[id]}
                onChange={(e) =>
                  patch({
                    ...value,
                    classes: { ...value.classes, [id]: e.target.checked },
                  })
                }
              />
              {ALERT_CLASS_LABELS[id]}
            </label>
          ))}
        </div>
      </Section>

      <Section
        title="Quiet Hours"
        hint="During quiet hours, only alerts at or above the minimum severity are delivered."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-[var(--color-label-secondary)]">Start</span>
            <div className="mt-1">
              <Select
                ariaLabel="Quiet hours start"
                testId="settings-quiet-start"
                value={value.quietHours.start ?? ""}
                options={[
                  { value: "", label: "— : — —" },
                  ...TIME_OPTIONS.map((t) => ({
                    value: t,
                    label: formatTime(t),
                  })),
                ]}
                onChange={(next) =>
                  patch({
                    ...value,
                    quietHours: {
                      ...value.quietHours,
                      start: next || null,
                    },
                  })
                }
              />
            </div>
          </label>
          <label className="block text-sm sm:text-right">
            <span className="text-[var(--color-label-secondary)]">End</span>
            <div className="mt-1 sm:flex sm:justify-end">
              <Select
                ariaLabel="Quiet hours end"
                testId="settings-quiet-end"
                value={value.quietHours.end ?? ""}
                options={[
                  { value: "", label: "— : — —" },
                  ...TIME_OPTIONS.map((t) => ({
                    value: t,
                    label: formatTime(t),
                  })),
                ]}
                onChange={(next) =>
                  patch({
                    ...value,
                    quietHours: { ...value.quietHours, end: next || null },
                  })
                }
              />
            </div>
          </label>
          <label className="block text-sm">
            <span className="text-[var(--color-label-secondary)]">Min severity</span>
            <div className="mt-1">
              <Select
                ariaLabel="Quiet hours minimum severity"
                testId="settings-quiet-sev"
                value={value.quietHours.minSeverity}
                options={severityOptions}
                onChange={(next) =>
                  patch({
                    ...value,
                    quietHours: {
                      ...value.quietHours,
                      minSeverity: next as AlertSeverity,
                    },
                  })
                }
              />
            </div>
          </label>
          <label className="block text-sm sm:text-right">
            <span className="text-[var(--color-label-secondary)]">Timezone</span>
            <div className="mt-1 sm:flex sm:justify-end">
              <Select
                ariaLabel="Quiet hours timezone"
                testId="settings-quiet-tz"
                value={
                  TIMEZONES.includes(value.quietHours.timezone)
                    ? value.quietHours.timezone
                    : "UTC"
                }
                options={TIMEZONES.map((z) => ({ value: z, label: z }))}
                onChange={(next) =>
                  patch({
                    ...value,
                    quietHours: { ...value.quietHours, timezone: next },
                  })
                }
              />
            </div>
          </label>
        </div>
      </Section>

      <Section title="Digest Mode">
        <label className="flex cursor-pointer items-start gap-3 text-sm">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 accent-[var(--color-tint)]"
            data-testid="settings-digest"
            checked={value.digest}
            onChange={(e) => patch({ ...value, digest: e.target.checked })}
          />
          <span>Batch non-critical alerts into periodic summaries</span>
        </label>
      </Section>
    </div>
  );
}
