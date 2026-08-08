/**
 * Practice suite data portability — full pack or single-surface JSON.
 * Spec: Member Practice Export/Import v1.1 (two-way, additive import).
 */

export type PracticeExportSurface =
  | "pack"
  | "playbook"
  | "practice_campaign"
  | "trade_log"
  | "journal"
  | "journal_session"
  | "retrospective"
  | "journey";

export type PracticeExportOption = {
  id: PracticeExportSurface;
  label: string;
  /** GET path relative to origin */
  path: string;
  filename: string;
  /** Suite apps this surface is primary for */
  suiteIds?: string[];
  note?: string;
};

/** Individual JSONs + full pack. Order matches pack surfaces where possible. */
export const PRACTICE_EXPORT_OPTIONS: PracticeExportOption[] = [
  {
    id: "pack",
    label: "Complete set (ZIP)",
    path: "/api/me/export?format=zip",
    filename: "fattail-member-export.zip",
    note: "All Practice surfaces in one archive",
  },
  {
    id: "pack",
    label: "Complete set (JSON)",
    path: "/api/me/export?format=json",
    filename: "fattail-member-export.json",
    note: "Same pack as a single JSON file",
  },
  {
    id: "trade_log",
    label: "Trade Log",
    path: "/api/me/export/trade-log",
    filename: "trade_log.tradlog.json",
    suiteIds: ["trade-log", "reports"],
    note: "Reports are derived from Trade Log — export Trade Log for that data",
  },
  {
    id: "journal",
    label: "Journal (notes)",
    path: "/api/me/export/journal",
    filename: "journal.json",
    suiteIds: ["journal"],
  },
  {
    id: "journal_session",
    label: "Journal sessions",
    path: "/api/me/export/journal-session",
    filename: "journal_session.json",
    suiteIds: ["journal"],
  },
  {
    id: "retrospective",
    label: "Retrospectives",
    path: "/api/me/export/retrospectives",
    filename: "retrospective.json",
    suiteIds: ["retrospective"],
  },
  {
    id: "playbook",
    label: "Playbook",
    path: "/api/me/export/playbook",
    filename: "playbook.json",
    suiteIds: ["playbook"],
    note: "Book roots + notes (scrapbook chapters/pages v2 export still deepening)",
  },
  {
    id: "practice_campaign",
    label: "Practice campaigns",
    path: "/api/me/export/practice-campaign",
    filename: "practice_campaign.json",
  },
  {
    id: "journey",
    label: "Journey snapshot",
    path: "/api/me/export/journey",
    filename: "journey.json",
    note: "Derived snapshot — import does not restore grades as source of truth",
  },
];

export function exportOptionsForSuite(suiteId: string): PracticeExportOption[] {
  const forApp = PRACTICE_EXPORT_OPTIONS.filter(
    (o) => o.id !== "pack" && o.suiteIds?.includes(suiteId),
  );
  // Always offer full pack too
  return [
    ...PRACTICE_EXPORT_OPTIONS.filter((o) => o.path.includes("format=zip")),
    ...PRACTICE_EXPORT_OPTIONS.filter((o) => o.path.includes("format=json")),
    ...forApp,
  ];
}

export async function downloadPracticeExport(
  path: string,
  filename: string,
): Promise<void> {
  const r = await fetch(path, { credentials: "same-origin" });
  if (!r.ok) {
    throw new Error("Could not prepare download. Try again.");
  }
  const blob = await r.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function fileToBase64(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

export type ImportPreview = {
  ok: boolean;
  surfaces: Record<string, { counts?: Record<string, number>; note?: string }>;
  errors?: string[];
};

export async function previewPracticeImport(
  b64: string,
): Promise<ImportPreview> {
  const r = await fetch("/api/me/import/preview", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ base64: b64, policy: "additive" }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    throw new Error(
      (data as { detail?: { message?: string } })?.detail?.message ||
        "Could not read that file.",
    );
  }
  return data as ImportPreview;
}

export async function commitPracticeImport(b64: string): Promise<unknown> {
  const r = await fetch("/api/me/import/commit", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ base64: b64, policy: "additive" }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    throw new Error(
      (data as { detail?: { message?: string } })?.detail?.message ||
        "Import failed.",
    );
  }
  return data;
}
