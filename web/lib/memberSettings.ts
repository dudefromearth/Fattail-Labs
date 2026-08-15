/**
 * Member Settings document (this device).
 * Spec: FatTail-Labs-Member-Settings-Spec-v1.0 · DL-338
 */

export const MEMBER_SETTINGS_KEY = "ftl.memberSettings.v1";
export const MEMBER_SETTINGS_EVENT = "ftl-member-settings";

export const COLOR_SCHEMES = ["system", "light", "dark"] as const;
export type ColorScheme = (typeof COLOR_SCHEMES)[number];

export const FONT_SIZES = ["small", "medium", "large", "larger"] as const;
export type FontSize = (typeof FONT_SIZES)[number];

export const ALERT_SEVERITIES = [
  "info",
  "low",
  "medium",
  "high",
  "critical",
] as const;
export type AlertSeverity = (typeof ALERT_SEVERITIES)[number];

export const ALERT_DESTINATIONS = [
  "in_app",
  "process_surface",
  "os",
  "sms",
  "email_digest",
  "journal",
] as const;
export type AlertDestinationId = (typeof ALERT_DESTINATIONS)[number];

export const ALERT_DESTINATION_LABELS: Record<AlertDestinationId, string> = {
  in_app: "In-app",
  process_surface: "Process surface",
  os: "OS notifications",
  sms: "SMS",
  email_digest: "Email digest",
  journal: "Journal",
};

export const ALERT_CLASSES = ["threshold", "algo", "prompt", "system"] as const;
export type AlertClassId = (typeof ALERT_CLASSES)[number];

export const ALERT_CLASS_LABELS: Record<AlertClassId, string> = {
  threshold: "Threshold",
  algo: "Algo",
  prompt: "Prompt",
  system: "System",
};

export const COMING_SOON_DESTINATIONS: ReadonlySet<AlertDestinationId> = new Set([
  "sms",
  "email_digest",
]);

export type ThresholdRule = {
  id: string;
  title: string;
};

export type AlertSettings = {
  delivery: {
    in_app: boolean;
    process_surface: boolean;
    os: boolean;
    sms: boolean;
    email_digest: boolean;
  };
  severityMin: Record<AlertDestinationId, AlertSeverity>;
  classes: Record<AlertClassId, boolean>;
  quietHours: {
    start: string | null;
    end: string | null;
    minSeverity: AlertSeverity;
    timezone: string;
  };
  digest: boolean;
  rules: ThresholdRule[];
};

export type MemberSettings = {
  colorScheme?: ColorScheme;
  fontSize?: FontSize;
  alerts?: AlertSettings;
};

export const DEFAULT_ALERT_SETTINGS: AlertSettings = {
  delivery: {
    in_app: true,
    process_surface: true,
    os: false,
    sms: false,
    email_digest: false,
  },
  severityMin: {
    in_app: "info",
    process_surface: "info",
    os: "info",
    sms: "info",
    email_digest: "info",
    journal: "info",
  },
  classes: {
    threshold: true,
    algo: true,
    prompt: true,
    system: true,
  },
  quietHours: {
    start: null,
    end: null,
    minSeverity: "high",
    timezone: "UTC",
  },
  digest: false,
  rules: [],
};

function isColorScheme(v: unknown): v is ColorScheme {
  return COLOR_SCHEMES.includes(v as ColorScheme);
}

function isFontSize(v: unknown): v is FontSize {
  return FONT_SIZES.includes(v as FontSize);
}

function isSeverity(v: unknown): v is AlertSeverity {
  return ALERT_SEVERITIES.includes(v as AlertSeverity);
}

function asBool(v: unknown, fallback: boolean): boolean {
  return typeof v === "boolean" ? v : fallback;
}

function normalizeTime(v: unknown): string | null {
  if (typeof v !== "string" || !/^\d{2}:\d{2}$/.test(v)) return null;
  return v;
}

export function normalizeAlertSettings(raw: unknown): AlertSettings {
  const src = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const deliveryIn = (src.delivery || {}) as Record<string, unknown>;
  const sevIn = (src.severityMin || {}) as Record<string, unknown>;
  const classIn = (src.classes || {}) as Record<string, unknown>;
  const quietIn = (src.quietHours || {}) as Record<string, unknown>;
  const rulesIn = Array.isArray(src.rules) ? src.rules : [];

  const delivery = {
    in_app: asBool(deliveryIn.in_app, DEFAULT_ALERT_SETTINGS.delivery.in_app),
    process_surface: asBool(
      deliveryIn.process_surface,
      DEFAULT_ALERT_SETTINGS.delivery.process_surface,
    ),
    os: asBool(deliveryIn.os, DEFAULT_ALERT_SETTINGS.delivery.os),
    sms: false,
    email_digest: false,
  };

  const severityMin = { ...DEFAULT_ALERT_SETTINGS.severityMin };
  for (const id of ALERT_DESTINATIONS) {
    if (isSeverity(sevIn[id])) severityMin[id] = sevIn[id];
  }

  const classes = { ...DEFAULT_ALERT_SETTINGS.classes };
  for (const id of ALERT_CLASSES) {
    if (typeof classIn[id] === "boolean") classes[id] = classIn[id];
  }

  const rules: ThresholdRule[] = [];
  for (const item of rulesIn) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const id = typeof row.id === "string" && row.id ? row.id : null;
    const title = typeof row.title === "string" ? row.title.trim() : "";
    if (!id) continue;
    rules.push({ id, title: title || "Untitled rule" });
  }

  return {
    delivery,
    severityMin,
    classes,
    quietHours: {
      start: normalizeTime(quietIn.start),
      end: normalizeTime(quietIn.end),
      minSeverity: isSeverity(quietIn.minSeverity)
        ? quietIn.minSeverity
        : DEFAULT_ALERT_SETTINGS.quietHours.minSeverity,
      timezone:
        typeof quietIn.timezone === "string" && quietIn.timezone
          ? quietIn.timezone
          : DEFAULT_ALERT_SETTINGS.quietHours.timezone,
    },
    digest: asBool(src.digest, DEFAULT_ALERT_SETTINGS.digest),
    rules,
  };
}

export function parseMemberSettings(raw: unknown): MemberSettings {
  if (!raw || typeof raw !== "object") return {};
  const src = raw as Record<string, unknown>;
  const out: MemberSettings = {};
  if (isColorScheme(src.colorScheme)) out.colorScheme = src.colorScheme;
  if (isFontSize(src.fontSize)) out.fontSize = src.fontSize;
  if (src.alerts !== undefined) out.alerts = normalizeAlertSettings(src.alerts);
  return out;
}

export function loadMemberSettings(): MemberSettings {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(MEMBER_SETTINGS_KEY);
    if (!raw) return {};
    return parseMemberSettings(JSON.parse(raw));
  } catch {
    return {};
  }
}

export function saveMemberSettings(patch: MemberSettings): MemberSettings {
  const next: MemberSettings = { ...loadMemberSettings(), ...patch };
  if (patch.alerts) next.alerts = normalizeAlertSettings(patch.alerts);
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(MEMBER_SETTINGS_KEY, JSON.stringify(next));
    } catch {
      // quota
    }
    applyMemberSettings(next);
    window.dispatchEvent(new CustomEvent(MEMBER_SETTINGS_EVENT));
  }
  return next;
}

export function applyColorScheme(scheme: ColorScheme): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (scheme === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", scheme);
}

export function applyFontSize(size: FontSize): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (size === "medium") root.removeAttribute("data-font-size");
  else root.setAttribute("data-font-size", size);
}

export function applyMemberSettings(doc: MemberSettings): void {
  if (doc.colorScheme) applyColorScheme(doc.colorScheme);
  if (doc.fontSize) applyFontSize(doc.fontSize);
}

export function memberColorSchemeOverride(): ColorScheme | null {
  return loadMemberSettings().colorScheme ?? null;
}

/** Inline boot — keep in sync with applyMemberSettings. Key must stay literal. */
export const MEMBER_SETTINGS_BOOT_SCRIPT = `(function(){try{var raw=localStorage.getItem("${MEMBER_SETTINGS_KEY}");if(!raw)return;var s=JSON.parse(raw);var root=document.documentElement;if(s.colorScheme==="light"||s.colorScheme==="dark"){root.setAttribute("data-theme",s.colorScheme)}else if(s.colorScheme==="system"){root.removeAttribute("data-theme")}if(s.fontSize==="small"||s.fontSize==="large"||s.fontSize==="larger"){root.setAttribute("data-font-size",s.fontSize)}else if(s.fontSize==="medium"){root.removeAttribute("data-font-size")}}catch(e){}})();`;
