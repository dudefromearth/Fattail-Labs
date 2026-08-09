/** Playbook scrapbook + Practice Campaign client (TD Phase 1 + DL-255). */

export type PlaybookSticky = {
  id: number;
  page_id: number;
  body_md: string;
  sort_order: number;
  export_key?: string | null;
};

export type PlaybookPage = {
  id: number;
  chapter_id: number;
  title?: string | null;
  body_md: string;
  sort_order: number;
  export_key?: string | null;
  stickies?: PlaybookSticky[];
  updated_at?: string | null;
};

export type PlaybookChapter = {
  id: number;
  title: string;
  blurb?: string | null;
  sort_order: number;
  chapter_type?: string;
  export_key?: string | null;
  pages: PlaybookPage[];
};

export type PlaybookEntry = {
  id: number;
  title: string;
  subtitle?: string | null;
  /** List snippet / derived — not a parallel write path */
  body_md: string;
  structured: Record<string, unknown>;
  status: "active" | "archived" | string;
  cover_attachment_id?: number | null;
  export_key?: string | null;
  version_count?: number;
  is_draft?: boolean;
  latest_version_n?: number | null;
  chapters?: PlaybookChapter[];
  created_at?: string | null;
  updated_at?: string | null;
};

export type PlaybookEvidence = {
  id: number;
  object_type: string;
  object_id: number;
  note_md?: string | null;
  export_key?: string | null;
  created_at?: string | null;
  target?: {
    status?: string;
    journal_date?: string;
    tag?: string | null;
    export_key?: string | null;
  };
};

export type PlaybookAttachment = {
  id: number;
  content_type?: string;
  byte_size: number;
  original_name?: string | null;
  caption_md?: string;
  export_key?: string | null;
  purged?: boolean;
  download_path: string;
  created_at?: string | null;
};

export type PracticeCampaign = {
  id: number;
  title: string;
  status: "planned" | "active" | "completed" | "abandoned" | string;
  /** Optional Trade Log account scope; null = any/all accounts. */
  account_id?: number | null;
  starts_at?: string | null;
  ends_at?: string | null;
  starting_capital?: number | null;
  goals_md?: string;
  /** Account default (import + stamp prefill). */
  is_default?: boolean;
  /** Ledger furniture for an account (not a signed charter). */
  is_ledger?: boolean;
  has_cover?: boolean;
  cover_url?: string | null;
  /** Set when status enters active; used for §4.7 prefill ordering. */
  activated_at?: string | null;
  /** First real activation — immutable terms clock (§4.5). */
  signed_at?: string | null;
  /** Immutable charter snapshot at signature (or backfilled terms). */
  signed_terms?: Record<string, unknown> | null;
  /** True when signed_terms came from migration, not a live sign. */
  signed_terms_backfilled?: boolean;
  predecessor_campaign_id?: number | null;
  /** Derived cycle depth (1 = root). */
  cycle_number?: number | null;
  predecessor?: {
    id: number;
    title: string;
    status: string;
  } | null;
  playbook_entry_ids: number[];
  export_key?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type CampaignAmendment = {
  id: number;
  campaign_id: number;
  amended_at?: string | null;
  field: string;
  old_value?: string | null;
  new_value?: string | null;
  note_md?: string;
  export_key?: string | null;
};

async function parse<T>(r: Response): Promise<T> {
  if (!r.ok) {
    const body = await r.json().catch(() => ({}));
    const d = (body as { detail?: unknown }).detail;
    let msg = `HTTP ${r.status}`;
    if (typeof d === "string") msg = d;
    else if (d && typeof d === "object" && "message" in d) {
      msg = String((d as { message?: unknown }).message);
    }
    throw new Error(msg);
  }
  return r.json() as Promise<T>;
}

export async function fetchPlaybookEntries(includeArchived = false): Promise<{
  entries: PlaybookEntry[];
}> {
  const q = includeArchived ? "?include_archived=1" : "";
  const r = await fetch(`/api/me/playbook/entries${q}`, {
    credentials: "same-origin",
  });
  return parse(r);
}

export async function fetchPlaybookBook(
  id: number,
  full = true,
): Promise<PlaybookEntry> {
  const q = full ? "?full=1" : "";
  const r = await fetch(`/api/me/playbook/entries/${id}${q}`, {
    credentials: "same-origin",
  });
  const d = await parse<{ entry: PlaybookEntry }>(r);
  return d.entry;
}

export async function createPlaybookEntry(body: {
  title: string;
  subtitle?: string;
  body_md?: string;
  structured?: Record<string, unknown>;
}): Promise<PlaybookEntry> {
  const r = await fetch("/api/me/playbook/entries", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const d = await parse<{ entry: PlaybookEntry }>(r);
  return d.entry;
}

export async function patchPlaybookEntry(
  id: number,
  body: Partial<{
    title: string;
    subtitle: string | null;
    status: string;
    structured: Record<string, unknown>;
    cover_attachment_id: number | null;
  }>,
): Promise<PlaybookEntry> {
  const r = await fetch(`/api/me/playbook/entries/${id}`, {
    method: "PATCH",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const d = await parse<{ entry: PlaybookEntry }>(r);
  return d.entry;
}

export async function savePlaybookBook(id: number): Promise<{
  version_n: number;
  book: PlaybookEntry;
}> {
  const r = await fetch(`/api/me/playbook/entries/${id}/save`, {
    method: "POST",
    credentials: "same-origin",
  });
  return parse(r);
}

export async function discardPlaybookBook(id: number): Promise<{
  deleted?: boolean;
  book?: PlaybookEntry;
  book_id?: number;
}> {
  const r = await fetch(`/api/me/playbook/entries/${id}/discard`, {
    method: "POST",
    credentials: "same-origin",
  });
  return parse(r);
}

export async function createPlaybookChapter(
  bookId: number,
  body: { title: string; blurb?: string },
): Promise<PlaybookEntry> {
  const r = await fetch(`/api/me/playbook/entries/${bookId}/chapters`, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const d = await parse<{ entry: PlaybookEntry }>(r);
  return d.entry;
}

export async function patchPlaybookChapter(
  chapterId: number,
  body: Partial<{ title: string; blurb: string | null; sort_order: number }>,
): Promise<PlaybookEntry> {
  const r = await fetch(`/api/me/playbook/chapters/${chapterId}`, {
    method: "PATCH",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const d = await parse<{ entry: PlaybookEntry }>(r);
  return d.entry;
}

export async function deletePlaybookChapter(
  chapterId: number,
): Promise<PlaybookEntry> {
  const r = await fetch(`/api/me/playbook/chapters/${chapterId}`, {
    method: "DELETE",
    credentials: "same-origin",
  });
  const d = await parse<{ entry: PlaybookEntry }>(r);
  return d.entry;
}

export async function createPlaybookPage(
  chapterId: number,
  body: { title?: string; body_md?: string },
): Promise<PlaybookEntry> {
  const r = await fetch(`/api/me/playbook/chapters/${chapterId}/pages`, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const d = await parse<{ entry: PlaybookEntry }>(r);
  return d.entry;
}

export async function patchPlaybookPage(
  pageId: number,
  body: Partial<{ title: string | null; body_md: string; sort_order: number }>,
): Promise<PlaybookEntry> {
  const r = await fetch(`/api/me/playbook/pages/${pageId}`, {
    method: "PATCH",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const d = await parse<{ entry: PlaybookEntry }>(r);
  return d.entry;
}

export async function deletePlaybookPage(pageId: number): Promise<PlaybookEntry> {
  const r = await fetch(`/api/me/playbook/pages/${pageId}`, {
    method: "DELETE",
    credentials: "same-origin",
  });
  const d = await parse<{ entry: PlaybookEntry }>(r);
  return d.entry;
}

export async function fetchPlaybookEvidence(
  bookId: number,
): Promise<PlaybookEvidence[]> {
  const r = await fetch(`/api/me/playbook/entries/${bookId}/evidence`, {
    credentials: "same-origin",
  });
  const d = await parse<{ evidence: PlaybookEvidence[] }>(r);
  return d.evidence || [];
}

export async function addPlaybookEvidence(
  bookId: number,
  body: {
    object_type: "journal_session" | "trade";
    object_id: number;
    note_md?: string;
  },
): Promise<PlaybookEvidence[]> {
  const r = await fetch(`/api/me/playbook/entries/${bookId}/evidence`, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const d = await parse<{ evidence: PlaybookEvidence[] }>(r);
  return d.evidence || [];
}

export async function removePlaybookEvidence(
  bookId: number,
  evidenceId: number,
): Promise<PlaybookEvidence[]> {
  const r = await fetch(
    `/api/me/playbook/entries/${bookId}/evidence/${evidenceId}`,
    { method: "DELETE", credentials: "same-origin" },
  );
  const d = await parse<{ evidence: PlaybookEvidence[] }>(r);
  return d.evidence || [];
}

export type JournalPlaybookLink = {
  evidence_id: number;
  playbook_entry_id: number;
  title: string;
  status: string;
};

export type JournalPlaybookBookOption = {
  id: number;
  title: string;
  status: string;
};

/** Journal-side: which playbooks this session is linked to + catalog. */
export async function fetchJournalSessionPlaybooks(sessionId: number): Promise<{
  linked: JournalPlaybookLink[];
  books: JournalPlaybookBookOption[];
}> {
  const r = await fetch(`/api/me/journal-sessions/${sessionId}/playbooks`, {
    credentials: "same-origin",
  });
  return parse(r);
}

export async function linkJournalToPlaybook(
  sessionId: number,
  bookId: number,
): Promise<JournalPlaybookLink[]> {
  const r = await fetch(
    `/api/me/journal-sessions/${sessionId}/playbooks/${bookId}`,
    { method: "PUT", credentials: "same-origin" },
  );
  const d = await parse<{ linked: JournalPlaybookLink[] }>(r);
  return d.linked || [];
}

export async function unlinkJournalFromPlaybook(
  sessionId: number,
  bookId: number,
): Promise<JournalPlaybookLink[]> {
  const r = await fetch(
    `/api/me/journal-sessions/${sessionId}/playbooks/${bookId}`,
    { method: "DELETE", credentials: "same-origin" },
  );
  const d = await parse<{ linked: JournalPlaybookLink[] }>(r);
  return d.linked || [];
}

export async function fetchPlaybookArchive(
  bookId: number,
): Promise<PlaybookAttachment[]> {
  const r = await fetch(`/api/me/playbook/entries/${bookId}/archive`, {
    credentials: "same-origin",
  });
  const d = await parse<{ archive: PlaybookAttachment[] }>(r);
  return d.archive || [];
}

export async function uploadPlaybookArchive(
  bookId: number,
  file: File,
): Promise<PlaybookAttachment> {
  const fd = new FormData();
  fd.append("file", file);
  const r = await fetch(`/api/me/playbook/entries/${bookId}/archive`, {
    method: "POST",
    credentials: "same-origin",
    body: fd,
  });
  const d = await parse<{ attachment: PlaybookAttachment }>(r);
  return d.attachment;
}

/** Public URL for a book’s cover bytes (session cookie required). */
export function playbookCoverUrl(
  bookId: number,
  coverAttachmentId: number | null | undefined,
): string | null {
  if (!coverAttachmentId) return null;
  return `/api/me/playbook/entries/${bookId}/archive/${coverAttachmentId}/bytes`;
}

/** One-step cover set: upload image → becomes cover. */
export async function uploadPlaybookCover(
  bookId: number,
  file: File,
): Promise<{
  entry: PlaybookEntry;
  attachment: PlaybookAttachment;
  cover_url: string;
}> {
  const fd = new FormData();
  fd.append("file", file);
  const r = await fetch(`/api/me/playbook/entries/${bookId}/cover`, {
    method: "POST",
    credentials: "same-origin",
    body: fd,
  });
  return parse(r);
}

export async function clearPlaybookCover(
  bookId: number,
): Promise<PlaybookEntry> {
  const r = await fetch(`/api/me/playbook/entries/${bookId}/cover`, {
    method: "DELETE",
    credentials: "same-origin",
  });
  const d = await parse<{ entry: PlaybookEntry }>(r);
  return d.entry;
}

/** PB3 single-book pack (ZIP with media, or JSON tree). */
export async function downloadPlaybookBook(
  bookId: number,
  format: "zip" | "json" = "zip",
): Promise<void> {
  const r = await fetch(
    `/api/me/playbook/entries/${bookId}/export?format=${format}`,
    { credentials: "same-origin" },
  );
  if (!r.ok) {
    const body = await r.json().catch(() => ({}));
    const d = (body as { detail?: unknown }).detail;
    throw new Error(
      typeof d === "string" ? d : `Export failed (HTTP ${r.status})`,
    );
  }
  const blob = await r.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download =
    format === "json" ? `playbook-${bookId}.json` : `playbook-${bookId}.zip`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function removePlaybookArchive(
  bookId: number,
  attId: number,
): Promise<PlaybookAttachment[]> {
  const r = await fetch(
    `/api/me/playbook/entries/${bookId}/archive/${attId}`,
    { method: "DELETE", credentials: "same-origin" },
  );
  const d = await parse<{ archive: PlaybookAttachment[] }>(r);
  return d.archive || [];
}

export async function fetchCampaigns(opts?: {
  accountId?: number | null;
}): Promise<{
  campaigns: PracticeCampaign[];
  active: PracticeCampaign | null;
  actives?: PracticeCampaign[];
}> {
  const q = new URLSearchParams();
  if (opts?.accountId != null && opts.accountId > 0) {
    q.set("account_id", String(opts.accountId));
  }
  const qs = q.toString();
  const r = await fetch(
    `/api/me/practice/campaigns${qs ? `?${qs}` : ""}`,
    { credentials: "same-origin" },
  );
  return parse(r);
}

/** L4 picker — ledger + window-covering charters for this fill time. */
export async function fetchEligibleCampaigns(opts: {
  accountId: number;
  execAt?: string | null;
}): Promise<{ campaigns: PracticeCampaign[]; exec_at?: string | null }> {
  const q = new URLSearchParams();
  q.set("account_id", String(opts.accountId));
  if (opts.execAt) q.set("exec_at", opts.execAt);
  const r = await fetch(
    `/api/me/practice/campaigns/eligible?${q.toString()}`,
    { credentials: "same-origin" },
  );
  return parse(r);
}

export async function fetchCampaign(id: number): Promise<PracticeCampaign> {
  const r = await fetch(`/api/me/practice/campaigns/${id}`, {
    credentials: "same-origin",
  });
  const d = await parse<{ campaign: PracticeCampaign }>(r);
  return d.campaign;
}

export async function createCampaign(body: {
  title: string;
  starts_at?: string | null;
  ends_at?: string | null;
  playbook_entry_ids?: number[];
  activate?: boolean;
  account_id?: number | null;
  starting_capital?: number | null;
  goals_md?: string | null;
  /** Silent book home for account (requires account_id). */
  is_default?: boolean;
}): Promise<PracticeCampaign> {
  const r = await fetch("/api/me/practice/campaigns", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const d = await parse<{ campaign: PracticeCampaign }>(r);
  return d.campaign;
}

export async function patchCampaign(
  id: number,
  body: Partial<{
    title: string;
    status: string;
    starts_at: string | null;
    ends_at: string | null;
    playbook_entry_ids: number[];
    account_id: number | null;
    starting_capital: number | null;
    goals_md: string | null;
    is_default: boolean;
  }>,
): Promise<PracticeCampaign> {
  const r = await fetch(`/api/me/practice/campaigns/${id}`, {
    method: "PATCH",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const d = await parse<{ campaign: PracticeCampaign }>(r);
  return d.campaign;
}

export function campaignCoverUrl(campaignId: number): string {
  return `/api/me/practice/campaigns/${campaignId}/cover/bytes`;
}

export async function uploadCampaignCover(
  campaignId: number,
  file: File,
): Promise<{ campaign: PracticeCampaign; cover_url?: string | null }> {
  const fd = new FormData();
  fd.append("file", file);
  const r = await fetch(`/api/me/practice/campaigns/${campaignId}/cover`, {
    method: "POST",
    credentials: "same-origin",
    body: fd,
  });
  return parse(r);
}

export async function clearCampaignCover(
  campaignId: number,
): Promise<{ campaign: PracticeCampaign }> {
  const r = await fetch(`/api/me/practice/campaigns/${campaignId}/cover`, {
    method: "DELETE",
    credentials: "same-origin",
  });
  return parse(r);
}

export async function fetchCampaignAmendments(
  campaignId: number,
): Promise<CampaignAmendment[]> {
  const r = await fetch(
    `/api/me/practice/campaigns/${campaignId}/amendments`,
    { credentials: "same-origin" },
  );
  const d = await parse<{ amendments: CampaignAmendment[] }>(r);
  return d.amendments || [];
}

export async function renewCampaign(
  campaignId: number,
): Promise<PracticeCampaign> {
  const r = await fetch(`/api/me/practice/campaigns/${campaignId}/renew`, {
    method: "POST",
    credentials: "same-origin",
  });
  const d = await parse<{ campaign: PracticeCampaign }>(r);
  return d.campaign;
}

/** Campaign Panel v1 — Six Controls (docs/Campaign-Panel-v1-The-Six-Controls.md) */
export type PanelControl = {
  bound_id: number;
  attribute: string;
  label: string;
  role: string;
  range_low?: number | null;
  range_high?: number | null;
  display_low?: number | null;
  display_high?: number | null;
  n_floor?: number | null;
  n?: number;
  reading?: number | null;
  extension?: number | null;
  state: string;
  unit?: string | null;
};

export type PanelResponse = {
  campaign_id: number;
  as_of?: string | null;
  /** Inclusive trade-day floor from campaign starts_at (null = no floor). */
  window_from?: string | null;
  /** Inclusive trade-day ceiling: min(as_of, ends_at). */
  window_to?: string | null;
  sample_n?: number;
  can_edit?: boolean;
  controls: PanelControl[];
};

export async function fetchCampaignPanel(
  campaignId: number,
  asOf?: string | null,
): Promise<PanelResponse> {
  const qs = asOf ? `?as_of=${encodeURIComponent(asOf.slice(0, 10))}` : "";
  const r = await fetch(
    `/api/me/practice/campaigns/${campaignId}/panel${qs}`,
    { credentials: "same-origin" },
  );
  const d = await parse<{ panel: PanelResponse }>(r);
  return d.panel;
}

export async function patchCampaignPanelControl(
  campaignId: number,
  attribute: string,
  body: {
    range_low?: number | null;
    range_high?: number | null;
    display_low?: number | null;
    display_high?: number | null;
    n_floor?: number | null;
  },
): Promise<PanelResponse> {
  const r = await fetch(
    `/api/me/practice/campaigns/${campaignId}/panel/${encodeURIComponent(attribute)}`,
    {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  const d = await parse<{ panel: PanelResponse }>(r);
  return d.panel;
}

/** Campaign Journey shape-at-T — six house axes; not Journey process scores */
export type JourneyShapeAxis = {
  bound_id: number;
  role: string;
  attribute: string;
  label?: string;
  range_low?: number | null;
  range_high?: number | null;
  reading?: number | null;
  extension?: number | null;
  state: string;
  n_floor?: number | null;
  n?: number;
};

export type JourneyShape = {
  campaign_id: number;
  kind: "invitation" | "shape" | string;
  t0?: string | null;
  present?: string | null;
  as_of?: string | null;
  axes: JourneyShapeAxis[];
  amendment_markers?: { at?: string | null; field?: string | null }[];
  sample_n?: number;
  message?: string | null;
};

export async function fetchCampaignJourneyShape(
  campaignId: number,
  asOf?: string | null,
): Promise<JourneyShape> {
  const qs = asOf ? `?as_of=${encodeURIComponent(asOf.slice(0, 10))}` : "";
  const r = await fetch(
    `/api/me/practice/campaigns/${campaignId}/journey-shape${qs}`,
    { credentials: "same-origin" },
  );
  const d = await parse<{ shape: JourneyShape }>(r);
  return d.shape;
}

/** One-shot scrub series — client derives shape/panel in memory (no per-tick fetch). */
export async function fetchCampaignJourneySeries(
  campaignId: number,
): Promise<import("@/lib/campaignJourneySeries").JourneySeries> {
  const r = await fetch(
    `/api/me/practice/campaigns/${campaignId}/journey-series`,
    { credentials: "same-origin" },
  );
  const d = await parse<{
    series: import("@/lib/campaignJourneySeries").JourneySeries;
  }>(r);
  return d.series;
}
