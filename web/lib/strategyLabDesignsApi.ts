/** FatTail house design library + member copies. */

import { getJSON, postJSON } from "@/lib/client";
import type { StrategyConfig } from "@/lib/strategyPacks";

export type CourseRef = {
  course_slug: string;
  course_title: string;
  module_slug?: string;
  lesson_slug?: string;
  lesson_title?: string;
  href: string;
};

export type HouseDesign = {
  key: string;
  version: string;
  name: string;
  summary: string;
  pack_id: string;
  dte_label: string;
  family_label: string;
  immutable: boolean;
  source: string;
  maintainer: string;
  member_may_remove: boolean;
  member_may_edit_house: boolean;
  member_may_apply: boolean;
  member_may_copy_rebuild: boolean;
  course_refs: CourseRef[];
  variants?: string[];
  config: StrategyConfig;
};

export type DesignLibrary = {
  pack_id: string;
  catalog_version: string;
  maintainer: string;
  member_may_edit_house: boolean;
  member_may_remove_house: boolean;
  house: HouseDesign[];
  member?: Array<Record<string, unknown>>;
  note?: string;
};

export async function fetchDesignLibrary(
  packId = "butterfly",
): Promise<DesignLibrary | null> {
  return getJSON(
    `/api/me/strategy-lab/designs?pack_id=${encodeURIComponent(packId)}`,
  );
}

export async function applyHouseDesign(opts: {
  strategyId: string;
  houseKey: string;
  houseVersion?: string;
  mode?: "apply" | "copy_rebuild";
  bumpVersion?: boolean;
}): Promise<{ strategy?: unknown; error?: string }> {
  const r = await postJSON("/api/me/strategy-lab/designs/house/apply", {
    strategy_id: opts.strategyId,
    house_key: opts.houseKey,
    house_version: opts.houseVersion,
    mode: opts.mode || "apply",
    bump_version: opts.bumpVersion ?? true,
  });
  const j = (await r.json().catch(() => ({}))) as {
    strategy?: unknown;
    detail?: string;
  };
  if (!r.ok) {
    return {
      error: typeof j.detail === "string" ? j.detail : "Apply house design failed",
    };
  }
  return { strategy: j.strategy };
}
