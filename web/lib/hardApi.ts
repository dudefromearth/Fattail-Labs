/** FatTail Hard / Mental Toughness API client — Hard Spec v1.0 H2 */

import { getJSON, postJSON } from "@/lib/client";

export type HardTask = {
  id: string;
  label: string;
  required?: boolean;
};

export type HardVariant = {
  variant_id: string;
  program_kind: string;
  label: string;
  credit: string | null;
  sprint_days: number;
  progressive: boolean;
  photo_required: boolean;
  miss_policy?: string;
  ladder_blurb?: string | null;
  tasks: HardTask[];
};

export type HowItWorksBlock = {
  title: string;
  headline: string;
  body: string[];
  life_and_priorities?: {
    title?: string | null;
    body?: string[];
  } | null;
  ladder?: {
    title?: string | null;
    intro?: string | null;
    rungs?: { days: number; title: string; blurb: string }[];
  } | null;
  rules: string[];
  intro_video_id: string | null;
  intro_video_title: string | null;
};

export type HardEnrollment = {
  id: number;
  program_kind: string;
  variant_id: string;
  status: string;
  sprint_days: number;
  started_at: string | null;
  ended_at: string | null;
};

export type HardCompliance = {
  streak_days: number;
  complete_days_total: number;
  complete_days_window: number;
  window_days: number;
  completion_rate: number;
  today_complete: boolean;
};

export type HardSnapshot = {
  today: string;
  variants: HardVariant[];
  how_it_works?: HowItWorksBlock;
  active_enrollment: HardEnrollment | null;
  mental_toughness: {
    empty: boolean;
    raw_percent: number | null;
    detail: Record<string, unknown>;
  };
  physiology: {
    required_cite: boolean;
    primary: { citation: string; doi: string };
    note: string;
  };
  compliance?: HardCompliance;
  restart?: {
    restarted: boolean;
    reason: string;
    attempt_day: number;
    as_of: string;
  };
  variant?: {
    variant_id: string;
    label: string;
    tasks: HardTask[];
    credit: string | null;
    miss_policy?: string;
    sprint_days?: number;
  } | null;
};

export async function fetchHard(): Promise<HardSnapshot | null> {
  return getJSON<HardSnapshot>("/api/me/hard");
}

export async function enrollHard(
  program_kind: string,
  variant_id: string,
): Promise<Response> {
  return postJSON("/api/me/hard/enroll", {
    program_kind,
    variant_id,
    consent: { hard_voluntary: true, physiology_acknowledged: true },
  });
}

export async function logHardDay(body: {
  tasks: Record<string, boolean>;
  progress_note?: string;
  log_date?: string;
}): Promise<Response> {
  return postJSON("/api/me/hard/daily", body);
}

export async function pauseHard(): Promise<Response> {
  return postJSON("/api/me/hard/pause", {});
}

export async function exitHard(): Promise<Response> {
  return postJSON("/api/me/hard/exit", {});
}

export async function resumeHard(enrollment_id?: number): Promise<Response> {
  return postJSON(
    "/api/me/hard/resume",
    enrollment_id != null ? { enrollment_id } : {},
  );
}
