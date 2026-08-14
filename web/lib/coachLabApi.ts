export type LabEffort = "low" | "medium" | "high" | "xhigh";

export type LabMessage = {
  id: number;
  role: "coach" | "trader";
  body_md: string;
  at: string | null;
  model: string | null;
  effort: string | null;
};

export type LabConversation = {
  id: number;
  started_by: number;
  started_at: string | null;
  ended_at: string | null;
  instruction_version: number;
  model: string;
  effort: LabEffort;
  messages?: LabMessage[];
  first_line?: string;
};

export type LabConfig = {
  instruction_text: string;
  instruction_version: number;
  model: string;
  effort: LabEffort;
  voice_enabled: boolean;
  coach_bubble_bg: string;
  coach_bubble_text: string;
  trader_bubble_bg: string;
  trader_bubble_text: string;
  updated_by: number | null;
  updated_at: string | null;
  models: string[];
  efforts: LabEffort[];
};

async function parse<T>(r: Response): Promise<T> {
  const text = await r.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { detail: text };
  }
  if (!r.ok) {
    const detail =
      data && typeof data === "object" && "detail" in data
        ? String((data as { detail: unknown }).detail)
        : r.statusText;
    throw new Error(detail || `HTTP ${r.status}`);
  }
  return data as T;
}

const opts: RequestInit = { credentials: "same-origin" };

export async function getLabConfig(): Promise<LabConfig> {
  const r = await fetch("/api/admin/coach-lab/config", opts);
  const data = await parse<{ config: LabConfig }>(r);
  return data.config;
}

export async function putLabConfig(body: Partial<LabConfig>): Promise<LabConfig> {
  const r = await fetch("/api/admin/coach-lab/config", {
    ...opts,
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await parse<{ config: LabConfig }>(r);
  return data.config;
}

export async function greetLab(): Promise<{
  conversation: LabConversation;
  unavailable?: boolean;
}> {
  const r = await fetch("/api/admin/coach-lab/greet", { ...opts, method: "POST" });
  return parse(r);
}

export async function chatLab(text: string): Promise<{
  conversation: LabConversation;
  unavailable?: boolean;
}> {
  const r = await fetch("/api/admin/coach-lab/chat", {
    ...opts,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  return parse(r);
}

export async function resetLab(): Promise<{
  conversation: LabConversation;
  unavailable?: boolean;
}> {
  const r = await fetch("/api/admin/coach-lab/reset", { ...opts, method: "POST" });
  return parse(r);
}

export async function listLabConversations(): Promise<LabConversation[]> {
  const r = await fetch("/api/admin/coach-lab/conversations", opts);
  const data = await parse<{ conversations: LabConversation[] }>(r);
  return data.conversations;
}

export async function getLabConversation(id: number): Promise<LabConversation> {
  const r = await fetch(`/api/admin/coach-lab/conversations/${id}`, opts);
  const data = await parse<{ conversation: LabConversation }>(r);
  return data.conversation;
}

export function exportMdHref(id: number): string {
  return `/api/admin/coach-lab/conversations/${id}/export.md`;
}

export function exportAllHref(): string {
  return "/api/admin/coach-lab/export.json";
}
