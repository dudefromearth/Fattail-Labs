/** Client for Tag Manager APIs — platform lexicon + personal vocabulary. */

export type TagCategory = {
  id: number;
  system_key: string | null;
  label: string;
  sort_order: number;
};

export type Tag = {
  id: number;
  slug?: string;
  label: string;
  description: string | null;
  category_id: number | null;
  category?: TagCategory | null;
  color: string | null;
  lexicon_key?: string | null;
  source?: string;
  status: string;
  usage_count?: number | null;
  member_tag?: boolean;
  merged_into_tag_id?: number | null;
};

export type TagAssignment = {
  id: number;
  tag_id: number | null;
  member_tag_id?: number | null;
  object_type: string;
  object_id: number;
  identity_id: number | null;
  tag?: Tag | null;
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
    } else if (d && typeof d === "object" && "message" in d) {
      detail = String((d as { message?: unknown }).message);
    }
    throw new Error(detail);
  }
  return r.json() as Promise<T>;
}

/** Platform lexicon (admin-curated). */
export async function fetchTags(): Promise<{
  categories: TagCategory[];
  tags: Tag[];
}> {
  const r = await fetch("/api/tags", { credentials: "same-origin" });
  return parse(r);
}

/** Personal vocabulary (seeded from lexicon; Family B). */
export async function fetchMyTags(opts?: {
  withUsage?: boolean;
  includeRetired?: boolean;
}): Promise<{ categories: TagCategory[]; tags: Tag[] }> {
  const q = new URLSearchParams();
  if (opts?.withUsage) q.set("with_usage", "1");
  if (opts?.includeRetired) q.set("include_retired", "1");
  const qs = q.toString();
  const r = await fetch(`/api/me/tags${qs ? `?${qs}` : ""}`, {
    credentials: "same-origin",
  });
  return parse(r);
}

export async function resolveMyTag(
  label: string,
  allowCreate = true,
): Promise<{
  tag: Tag;
  created: boolean;
  near_duplicates: { tag: Tag; score: number }[];
}> {
  const r = await fetch("/api/me/tags/resolve", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ label, allow_create: allowCreate }),
  });
  return parse(r);
}

export async function adoptLexiconKey(lexiconKey: string): Promise<Tag> {
  const r = await fetch("/api/me/tags/adopt", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lexicon_key: lexiconKey }),
  });
  const d = await parse<{ tag: Tag }>(r);
  return d.tag;
}

export async function fetchObjectAssignments(
  objectType: string,
  objectId: number,
): Promise<TagAssignment[]> {
  const q = new URLSearchParams({
    object_type: objectType,
    object_id: String(objectId),
  });
  const r = await fetch(`/api/tags/assignments?${q}`, {
    credentials: "same-origin",
  });
  const d = await parse<{ assignments: TagAssignment[] }>(r);
  return d.assignments || [];
}

export async function setObjectTags(
  objectType: string,
  objectId: number,
  tagIds: number[],
  opts?: { personal?: boolean },
): Promise<TagAssignment[]> {
  const body: Record<string, unknown> = {
    object_type: objectType,
    object_id: objectId,
  };
  if (opts?.personal) body.member_tag_ids = tagIds;
  else body.tag_ids = tagIds;
  const r = await fetch("/api/tags/assignments", {
    method: "PUT",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const d = await parse<{ assignments: TagAssignment[] }>(r);
  return d.assignments || [];
}

export async function adminListTags(): Promise<{
  categories: TagCategory[];
  tags: Tag[];
  usage: {
    tag_id: number;
    slug: string;
    label: string;
    status: string;
    assignment_count: number;
  }[];
}> {
  const r = await fetch("/api/admin/tags", { credentials: "same-origin" });
  return parse(r);
}

export async function adminCreateTag(body: {
  label: string;
  description?: string;
  category_id?: number | null;
  color?: string;
  slug?: string;
}): Promise<Tag> {
  const r = await fetch("/api/admin/tags", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const d = await parse<{ tag: Tag }>(r);
  return d.tag;
}

export async function adminUpdateTag(
  tagId: number,
  body: Record<string, unknown>,
): Promise<Tag> {
  const r = await fetch(`/api/admin/tags/${tagId}`, {
    method: "PATCH",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const d = await parse<{ tag: Tag }>(r);
  return d.tag;
}

export async function adminRetireTag(tagId: number): Promise<Tag> {
  const r = await fetch(`/api/admin/tags/${tagId}/retire`, {
    method: "POST",
    credentials: "same-origin",
  });
  const d = await parse<{ tag: Tag }>(r);
  return d.tag;
}

export async function adminDeleteTag(tagId: number): Promise<void> {
  const r = await fetch(`/api/admin/tags/${tagId}`, {
    method: "DELETE",
    credentials: "same-origin",
  });
  await parse(r);
}

export async function adminMergeTags(
  sourceTagId: number,
  targetTagId: number,
): Promise<void> {
  const r = await fetch("/api/admin/tags/merge", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      source_tag_id: sourceTagId,
      target_tag_id: targetTagId,
    }),
  });
  await parse(r);
}
