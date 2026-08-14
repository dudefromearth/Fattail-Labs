/** Client for /api/me/journal-sessions (Spec v0.2 · JS1-2 / JS2-1 / JS2-2). */

export type JournalSessionTag =
  | "pre_market"
  | "post_session"
  | "clean_day"
  | "reflection";

export type JournalSessionStatus = "open" | "closed" | "partial" | "sealed";

export type JournalMessage = {
  id: number;
  session_id: number;
  identity_id: number;
  author: "member" | "agent" | string;
  agent_service: string | null;
  body_md: string;
  phase: string;
  created_at: string | null;
};

export type ChecklistField = {
  key: string;
  label: string;
  present: boolean;
  required_for_complete: boolean;
  satisfied: boolean;
};

export type ChecklistStatus = {
  tag: string;
  complete: boolean;
  missing_required: string[];
  fields: ChecklistField[];
};

export type SchemaField = {
  key: string;
  label: string;
  hint: string;
  required_for_complete: boolean;
  prefillable: boolean;
  allows_uncertainty?: boolean;
};

export type TagSchema = {
  tag: string;
  known: boolean;
  fields: SchemaField[];
  complete_rule?: string;
  hotel_note?: string | null;
  note?: string;
};

export type JournalSession = {
  id: number;
  identity_id: number;
  tag: JournalSessionTag | string | null;
  tags?: string[];
  journal_date: string;
  session_started_at: string | null;
  status: JournalSessionStatus | string;
  structured: Record<string, unknown> | null;
  checklist?: ChecklistStatus;
  export_key: string | null;
  /** OD-1.4 — optional practice campaign stamp (default-suggested on create). */
  practice_campaign_id?: number | null;
  spawned_retrospective_id: number | null;
  closed_by_retrospective_id?: number | null;
  closed_at?: string | null;
  created_at: string | null;
  updated_at: string | null;
  messages?: JournalMessage[];
};

/** Day-view chips → Spec tag vocabulary (D1). */
export const PROMPT_TO_TAG: Record<
  string,
  JournalSessionTag | "retrospective" | ""
> = {
  "Start conversation": "", // v0.4a: no tag required
  "Pre-Market": "pre_market",
  "End of Day": "post_session",
  "Trade Reflection": "reflection",
  "Deep Dive": "reflection",
  Lessons: "reflection",
  Manual: "reflection",
  Retrospective: "retrospective",
};

export const TAG_LABELS: Record<string, string> = {
  pre_market: "Pre-market",
  post_session: "End of day",
  clean_day: "Clean day",
  reflection: "Reflection",
};

async function parse<T>(r: Response): Promise<T> {
  if (!r.ok) {
    const body = await r.json().catch(() => ({}));
    const d = (body as { detail?: unknown }).detail;
    let detail = `HTTP ${r.status}`;
    if (typeof d === "string") detail = d;
    else if (d && typeof d === "object" && "detail" in d) {
      const inner = (d as { detail?: unknown }).detail;
      if (typeof inner === "string") detail = inner;
    }
    throw new Error(detail);
  }
  return r.json() as Promise<T>;
}

export async function listJournalSessions(opts?: {
  journal_date?: string;
  status?: string;
  limit?: number;
}): Promise<JournalSession[]> {
  const q = new URLSearchParams();
  if (opts?.journal_date) q.set("journal_date", opts.journal_date);
  if (opts?.status) q.set("status", opts.status);
  if (opts?.limit != null) q.set("limit", String(opts.limit));
  const qs = q.toString();
  const r = await fetch(`/api/me/journal-sessions${qs ? `?${qs}` : ""}`, {
    credentials: "same-origin",
  });
  const d = await parse<{ sessions: JournalSession[] }>(r);
  return d.sessions || [];
}

export async function createJournalSession(body: {
  tag?: JournalSessionTag | string | null;
  tags?: string[];
  journal_date: string;
  structured?: Record<string, unknown>;
  prefill?: boolean;
  /** Omit to default-suggest active campaign; null clears stamp. */
  practice_campaign_id?: number | null;
}): Promise<JournalSession> {
  const r = await fetch("/api/me/journal-sessions", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const d = await parse<{ session: JournalSession }>(r);
  return d.session;
}

export async function getJournalSession(id: number): Promise<JournalSession> {
  const r = await fetch(`/api/me/journal-sessions/${id}`, {
    credentials: "same-origin",
  });
  const d = await parse<{ session: JournalSession }>(r);
  return d.session;
}

export async function patchJournalSession(
  id: number,
  body: {
    structured?: Record<string, unknown> | null;
    practice_campaign_id?: number | null;
  },
): Promise<JournalSession> {
  const r = await fetch(`/api/me/journal-sessions/${id}`, {
    method: "PATCH",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const d = await parse<{ session: JournalSession }>(r);
  return d.session;
}

export async function getJournalDraft(journalDate: string): Promise<{
  draft: {
    journal_date: string;
    body_md: string;
    updated_at: string | null;
    read_only: boolean;
  } | null;
}> {
  const q = new URLSearchParams({ journal_date: journalDate });
  const r = await fetch(`/api/me/journal/drafts?${q}`, {
    credentials: "same-origin",
  });
  return parse(r);
}

export async function putJournalDraft(
  journalDate: string,
  body_md: string,
): Promise<void> {
  const r = await fetch("/api/me/journal/drafts", {
    method: "PUT",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ journal_date: journalDate, body_md }),
  });
  await parse(r);
}

export async function deleteJournalDraft(journalDate: string): Promise<void> {
  const q = new URLSearchParams({ journal_date: journalDate });
  const r = await fetch(`/api/me/journal/drafts?${q}`, {
    method: "DELETE",
    credentials: "same-origin",
  });
  await parse(r);
}

export async function postJournalConfirmation(
  sessionId: number,
  body: {
    field_key: string;
    value?: unknown;
    present: boolean;
    source_message_ids: number[];
    method?: "extraction" | "interview";
  },
): Promise<JournalSession> {
  const r = await fetch(
    `/api/me/journal-sessions/${sessionId}/confirmations`,
    {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method: "extraction", ...body }),
    },
  );
  const d = await parse<{ session: JournalSession }>(r);
  return d.session;
}

export async function tickJournalCoach(opts: {
  journal_date: string;
  journal_focused: boolean;
}): Promise<{ heat: boolean; phase: string; actions: string[] }> {
  const r = await fetch("/api/me/journal/coach/tick", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(opts),
  });
  return parse(r);
}

export async function postJournalMessage(
  id: number,
  body_md: string,
): Promise<JournalMessage> {
  const r = await fetch(`/api/me/journal-sessions/${id}/messages`, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body_md }),
  });
  const d = await parse<{ message: JournalMessage }>(r);
  return d.message;
}

export async function sealJournalSession(
  id: number,
  opts?: { require_complete?: boolean },
): Promise<JournalSession> {
  const r = await fetch(`/api/me/journal-sessions/${id}/seal`, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      require_complete: Boolean(opts?.require_complete),
    }),
  });
  const d = await parse<{ session: JournalSession }>(r);
  return d.session;
}

export async function partialJournalSession(
  id: number,
): Promise<JournalSession> {
  const r = await fetch(`/api/me/journal-sessions/${id}/partial`, {
    method: "POST",
    credentials: "same-origin",
  });
  const d = await parse<{ session: JournalSession }>(r);
  return d.session;
}

export async function fetchTagSchema(tag: string): Promise<TagSchema> {
  const q = new URLSearchParams({ tag });
  const r = await fetch(`/api/me/journal-sessions/schema?${q}`, {
    credentials: "same-origin",
  });
  return parse(r);
}

export async function fetchPrefill(
  tag: string,
  journal_date: string,
): Promise<{ prefill: Record<string, unknown>; note?: string }> {
  const q = new URLSearchParams({ tag, journal_date });
  const r = await fetch(`/api/me/journal-sessions/prefill?${q}`, {
    credentials: "same-origin",
  });
  return parse(r);
}

export type AgentDepth = {
  mode: string;
  configured: boolean;
  entitled: boolean;
  agent_service: string;
  tag: string;
  depth_used: number;
  depth_cap: number;
  depth_remaining: number;
  form_fallback_available?: boolean;
};

export type AgentStatusResponse = {
  agent: AgentDepth;
  prompt_constant: string;
};

export type AgentTurnResult = {
  message: JournalMessage | null;
  kind: string;
  phase?: string;
  depth?: AgentDepth;
  form_fallback?: boolean;
  form_fallback_reason?: string;
  detail?: string;
  validator?: {
    ok?: boolean;
    attempts?: number;
    retried?: boolean;
    violations?: unknown[];
  };
  prompt_version?: string;
  agent_service?: string;
};

export type JournalDateClosure = {
  journal_date: string;
  closed_by_retrospective_id: number | null;
  closed_at: string | null;
  link: string | null;
};

export async function listJournalClosures(opts?: {
  date_from?: string;
  date_to?: string;
}): Promise<JournalDateClosure[]> {
  const q = new URLSearchParams();
  if (opts?.date_from) q.set("date_from", opts.date_from);
  if (opts?.date_to) q.set("date_to", opts.date_to);
  const qs = q.toString();
  const r = await fetch(
    `/api/me/journal-sessions/closures${qs ? `?${qs}` : ""}`,
    { credentials: "same-origin" },
  );
  const d = await parse<{ closures: JournalDateClosure[] }>(r);
  return d.closures || [];
}

export async function fetchAgentStatus(
  sessionId: number,
): Promise<AgentStatusResponse> {
  const r = await fetch(`/api/me/journal-sessions/${sessionId}/agent`, {
    credentials: "same-origin",
  });
  return parse(r);
}

export async function postAgentTurn(
  sessionId: number,
  body?: { body_md?: string },
): Promise<{ turn: AgentTurnResult; session: JournalSession }> {
  const r = await fetch(`/api/me/journal-sessions/${sessionId}/agent/turn`, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
  });
  return parse(r);
}

/** Display agent body without internal control prefixes. */
export function displayMessageBody(body: string, author: string): string {
  let t = body || "";
  if (author === "agent") {
    if (t.startsWith("[silent]")) {
      return t.slice("[silent]".length).trim() || "Noted.";
    }
    if (t.startsWith("[confirm]")) {
      return t.slice("[confirm]".length).trim();
    }
  }
  return t;
}

/** Spec v0.6 — interim agent speaker name (until §17-5 persona lock). */
export const JOURNAL_AGENT_DISPLAY_NAME = "Journal";

export type JournalAttachment = {
  id: number;
  session_id: number;
  identity_id: number;
  content_type: string;
  byte_size: number;
  caption_md: string | null;
  created_at: string | null;
  download_path: string;
};

export const MAX_JOURNAL_ATTACHMENTS = 5;

export async function listJournalAttachments(
  sessionId: number,
): Promise<JournalAttachment[]> {
  const r = await fetch(
    `/api/me/journal-sessions/${sessionId}/attachments`,
    { credentials: "same-origin" },
  );
  const d = await parse<{ attachments: JournalAttachment[] }>(r);
  return d.attachments || [];
}

export async function uploadJournalAttachment(
  sessionId: number,
  file: File,
  caption?: string,
): Promise<JournalAttachment> {
  const fd = new FormData();
  fd.append("file", file);
  if (caption) fd.append("caption", caption);
  const r = await fetch(
    `/api/me/journal-sessions/${sessionId}/attachments`,
    { method: "POST", credentials: "same-origin", body: fd },
  );
  const d = await parse<{ attachment: JournalAttachment }>(r);
  return d.attachment;
}

export async function patchJournalAttachmentCaption(
  sessionId: number,
  attachmentId: number,
  caption_md: string,
): Promise<JournalAttachment> {
  const r = await fetch(
    `/api/me/journal-sessions/${sessionId}/attachments/${attachmentId}`,
    {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caption_md }),
    },
  );
  const d = await parse<{ attachment: JournalAttachment }>(r);
  return d.attachment;
}

export async function deleteJournalAttachment(
  sessionId: number,
  attachmentId: number,
): Promise<void> {
  const r = await fetch(
    `/api/me/journal-sessions/${sessionId}/attachments/${attachmentId}`,
    { method: "DELETE", credentials: "same-origin" },
  );
  if (!r.ok) {
    const body = await r.json().catch(() => ({}));
    const detail =
      typeof body.detail === "string" ? body.detail : `HTTP ${r.status}`;
    throw new Error(detail);
  }
}

export type WeekBandId = "gx" | "am" | "pm" | "cl";

export type WeekDayActivity = {
  session_id: number;
  bands: Record<WeekBandId, boolean>;
  first_message_id_by_band: Partial<Record<WeekBandId, number>>;
};

export async function fetchWeekActivity(
  dateFrom: string,
  dateTo: string,
): Promise<Record<string, WeekDayActivity>> {
  const q = new URLSearchParams({ date_from: dateFrom, date_to: dateTo });
  const r = await fetch(
    `/api/me/journal-sessions/week-activity?${q}`,
    { credentials: "same-origin" },
  );
  if (!r.ok) return {};
  const d = await parse<{ days: Record<string, WeekDayActivity> }>(r);
  return d.days || {};
}

/** Format message timestamp for thread (America/New_York, always visible). */
export function formatMessageTimestamp(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(d);
  } catch {
    return "";
  }
}
