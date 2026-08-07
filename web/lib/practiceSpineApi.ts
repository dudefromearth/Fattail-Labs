/** Playbook + Practice Campaign client (Trader Development Phase 1). */

export type PlaybookEntry = {
  id: number;
  title: string;
  body_md: string;
  structured: Record<string, unknown>;
  status: "active" | "archived" | string;
  export_key?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type PracticeCampaign = {
  id: number;
  title: string;
  status: "planned" | "active" | "completed" | "abandoned" | string;
  starts_at?: string | null;
  ends_at?: string | null;
  playbook_entry_ids: number[];
  export_key?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
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

export async function createPlaybookEntry(body: {
  title: string;
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
    body_md: string;
    status: string;
    structured: Record<string, unknown>;
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

export async function fetchCampaigns(): Promise<{
  campaigns: PracticeCampaign[];
  active: PracticeCampaign | null;
}> {
  const r = await fetch("/api/me/practice/campaigns", {
    credentials: "same-origin",
  });
  return parse(r);
}

export async function createCampaign(body: {
  title: string;
  starts_at?: string | null;
  ends_at?: string | null;
  playbook_entry_ids?: number[];
  activate?: boolean;
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
