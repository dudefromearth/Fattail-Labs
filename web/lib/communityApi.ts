/**
 * Community app API — second window + shelves.
 * Same-origin `/api/...` only (Next rewrite).
 */

export type CommunityChannel = {
  id: string;
  slug: string;
  title: string;
  description: string;
  kind: string;
  app_key: string | null;
  discord_guild_id: string | null;
  discord_channel_id: string | null;
  sort_order: number;
  archived_at: string | null;
  mapped: boolean;
};

export type HouseShelfItem = {
  key: string;
  version: string;
  name: string;
  summary: string;
  dte_label?: string;
  family_label?: string;
  course_refs?: Array<{
    course_title?: string;
    lesson_title?: string;
    href?: string;
  }>;
  member_may_remove?: boolean;
  member_may_apply?: boolean;
  member_may_copy_rebuild?: boolean;
};

export type MemberShare = {
  id: string;
  bot_name: string;
  bot_version: string;
  pack_id: string;
  phase_at_share: string;
  summary_md: string;
  status: string;
  provenance: {
    house_design_key: string;
    house_design_version: string;
    label: string;
  } | null;
};

export type DiscordStatus = {
  linked: boolean;
  discord_user_id: string | null;
  display_name: string | null;
  avatar_url?: string | null;
  connect_url: string | null;
  note: string;
};

export type CommunityMessage = {
  id: string;
  body: string;
  status: string;
  source: string;
  author_display_name: string;
  author_avatar_url: string | null;
  via_labs?: boolean;
  created_at: string | null;
};

export type CommunityBoard = {
  channels: CommunityChannel[];
  fattail_shelf: {
    catalog_version: string;
    note: string;
    house: HouseShelfItem[];
  };
  member_shares: MemberShare[];
  discord: DiscordStatus;
  message_sync: {
    enabled: boolean;
    phase: string;
    note: string;
  };
};

export type CommunityBoardResult =
  | { ok: true; board: CommunityBoard }
  | { ok: false; status: number; message: string };

export type MessagesResult =
  | {
      ok: true;
      messages: CommunityMessage[];
      can_post: boolean;
      sync_enabled: boolean;
      discord: DiscordStatus;
      channel: CommunityChannel;
    }
  | { ok: false; status: number; message: string; connect_url?: string };

export async function fetchCommunityBoard(): Promise<CommunityBoardResult> {
  try {
    const r = await fetch("/api/me/community/board", {
      credentials: "same-origin",
    });
    if (r.status === 401) {
      return {
        ok: false,
        status: 401,
        message: "Sign in required to open Community.",
      };
    }
    if (r.status === 403) {
      return {
        ok: false,
        status: 403,
        message: "Your membership does not include Community access yet.",
      };
    }
    if (!r.ok) {
      return {
        ok: false,
        status: r.status,
        message: `Community API error (${r.status}).`,
      };
    }
    return { ok: true, board: (await r.json()) as CommunityBoard };
  } catch {
    return {
      ok: false,
      status: 0,
      message:
        "Could not reach the API. Use the same host you signed in on (localhost vs 127.0.0.1).",
    };
  }
}

export async function fetchChannelMessages(
  slug: string,
): Promise<MessagesResult> {
  try {
    const r = await fetch(
      `/api/me/community/channels/${encodeURIComponent(slug)}/messages?limit=50`,
      { credentials: "same-origin" },
    );
    if (!r.ok) {
      return {
        ok: false,
        status: r.status,
        message: `Could not load messages (${r.status}).`,
      };
    }
    const d = await r.json();
    return {
      ok: true,
      messages: (d.messages || []) as CommunityMessage[],
      can_post: !!d.can_post,
      sync_enabled: !!d.sync_enabled,
      discord: d.discord as DiscordStatus,
      channel: d.channel as CommunityChannel,
    };
  } catch {
    return {
      ok: false,
      status: 0,
      message: "Network error loading messages.",
    };
  }
}

export async function postChannelMessage(
  slug: string,
  body: string,
): Promise<
  | { ok: true; message: CommunityMessage }
  | { ok: false; status: number; message: string; connect_url?: string }
> {
  try {
    const r = await fetch(
      `/api/me/community/channels/${encodeURIComponent(slug)}/messages`,
      {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      },
    );
    if (r.status === 403) {
      let connect_url: string | undefined;
      let message = "Cannot post.";
      try {
        const d = await r.json();
        const detail = d.detail;
        if (typeof detail === "object" && detail) {
          message = detail.message || message;
          connect_url = detail.connect_url;
        } else if (typeof detail === "string") {
          message = detail;
        }
      } catch {
        /* ignore */
      }
      return { ok: false, status: 403, message, connect_url };
    }
    if (!r.ok) {
      const t = await r.text().catch(() => "");
      return {
        ok: false,
        status: r.status,
        message: t || `Send failed (${r.status}).`,
      };
    }
    const d = await r.json();
    return { ok: true, message: d.message as CommunityMessage };
  } catch {
    return { ok: false, status: 0, message: "Network error sending message." };
  }
}
