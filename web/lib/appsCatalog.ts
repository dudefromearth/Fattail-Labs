import { PRACTICE_NESTED_SLUGS as NESTED_UNDER_PRACTICE } from "@/lib/practiceSuite";

export type AppRow = {
  id: number;
  slug: string;
  title: string;
  blurb: string;
  status: string;
  href: string;
  sort_order?: number;
  highlighted?: boolean;
};

/**
 * Fallback top-level order when catalog rows lack real ids (pre-migration).
 * After migration 124, `apps.sort_order` is the source of truth.
 */
export const TOP_LEVEL_ORDER = [
  "journey",
  "practice-log",
  "toughness",
  "strategy-lab",
  "options-lab",
  "community",
  "wiki",
] as const;

export const FALLBACK_APPS: AppRow[] = [
  {
    id: 0,
    slug: "journey",
    title: "Journey",
    blurb:
      "Your enrollments and lesson progress in one place — process over pace, no leaderboards.",
    status: "live",
    href: "/app/journey",
    sort_order: 10,
  },
  {
    id: 0,
    slug: "practice-log",
    title: "Practice",
    blurb:
      "Reports home (equity & drawdown), Trade Log, Journal, and Playbook — process first.",
    status: "live",
    href: "/app/practice",
    sort_order: 20,
  },
  {
    id: 0,
    slug: "toughness",
    title: "Toughness",
    blurb:
      "FatTail Hard and True 75 Hard — voluntary capacity training for mental toughness under load (aMCC / willpower).",
    status: "live",
    href: "/app/toughness",
    sort_order: 30,
  },
  {
    id: 0,
    slug: "strategy-lab",
    title: "Strategy Lab",
    blurb:
      "Design → Curate → Deploy. Strategies on your account. Validate edges before capital; process over profit claims.",
    status: "soon",
    href: "/app/strategy-lab",
    sort_order: 40,
  },
  {
    id: 0,
    slug: "options-lab",
    title: "Options Lab",
    blurb:
      "Chain ladder: pick a name from the shared universe, the next three expiries, and watch strikes update in place — process structure, not P&L theater.",
    status: "live",
    href: "/app/options-lab/heatmap",
    sort_order: 50,
  },
  {
    id: 0,
    slug: "community",
    title: "Community",
    blurb:
      "Process peers and FatTail bots — same conversation as Discord, plus shared designs. No P&L theater.",
    status: "live",
    href: "/app/community",
    sort_order: 60,
  },
  {
    id: 0,
    slug: "wiki",
    title: "IKI Lab",
    blurb:
      "The compiled map of everything we teach — courses, live sessions, and videos, cross-linked and searchable.",
    status: "soon",
    href: "/app/wiki",
    sort_order: 70,
  },
];

function fallbackBySlug(slug: string): AppRow {
  return FALLBACK_APPS.find((a) => a.slug === slug) as AppRow;
}

/**
 * Top-level Apps grid: drop nested trade-log/journal, inject Practice,
 * Toughness, Strategy Lab, Community, Options Lab cards.
 * When every visible card has a real id, order follows `sort_order`
 * (admin-editable). Otherwise keep the hardcoded TOP_LEVEL_ORDER.
 */
export function buildTopLevelCatalog(apiApps: AppRow[]): AppRow[] {
  const bySlug = new Map(apiApps.map((a) => [a.slug, a]));

  const practiceFromApi = bySlug.get("practice-log");
  const practice: AppRow = {
    ...fallbackBySlug("practice-log"),
    ...(practiceFromApi ?? {}),
    slug: "practice-log",
    title: "Practice",
    blurb:
      "Reports home (equity & drawdown), Trade Log, Journal, and Playbook — process first.",
    href: "/app/practice",
    status: "live",
    id: practiceFromApi?.id ?? 0,
    sort_order:
      practiceFromApi?.sort_order ?? fallbackBySlug("practice-log").sort_order,
  };

  const toughnessFromApi = bySlug.get("toughness");
  const toughness: AppRow = toughnessFromApi
    ? {
        ...toughnessFromApi,
        title: toughnessFromApi.title || "Toughness",
        href: toughnessFromApi.href || "/app/toughness",
        status: "live",
      }
    : fallbackBySlug("toughness");

  const strategyFromApi = bySlug.get("strategy-lab");
  const strategy: AppRow = strategyFromApi
    ? {
        ...strategyFromApi,
        title: "Strategy Lab",
        blurb:
          strategyFromApi.blurb &&
          !/Prove|Paper, Run|Build, Prove|Build, Test|Run bots/i.test(
            strategyFromApi.blurb,
          )
            ? strategyFromApi.blurb
            : fallbackBySlug("strategy-lab").blurb,
        href: strategyFromApi.href || "/app/strategy-lab",
      }
    : fallbackBySlug("strategy-lab");

  const communityFromApi = bySlug.get("community");
  const community: AppRow | null = communityFromApi
    ? {
        ...communityFromApi,
        title: communityFromApi.title || "Community",
        blurb:
          communityFromApi.blurb || fallbackBySlug("community").blurb,
        href: communityFromApi.href || "/app/community",
      }
    : null;

  const optionsFromApi = bySlug.get("options-lab");
  const optionsLab: AppRow = optionsFromApi
    ? {
        ...optionsFromApi,
        title: "Options Lab",
        blurb:
          optionsFromApi.blurb || fallbackBySlug("options-lab").blurb,
        href: optionsFromApi.href || "/app/options-lab/heatmap",
        status: "live",
      }
    : fallbackBySlug("options-lab");

  const composed = new Map<string, AppRow>();
  for (const a of apiApps) {
    if (NESTED_UNDER_PRACTICE.has(a.slug)) continue;
    if (a.slug === "strategy-lab") continue;
    if (a.slug === "toughness") continue;
    if (a.slug === "community") continue;
    if (a.slug === "options-lab") continue;
    if (a.slug === "practice-log") continue;
    composed.set(a.slug, a);
  }
  composed.set("practice-log", practice);
  composed.set("toughness", toughness);
  composed.set("strategy-lab", strategy);
  composed.set("options-lab", optionsLab);
  if (community) composed.set("community", community);

  const wikiRow = composed.get("wiki");
  if (wikiRow) {
    composed.set("wiki", {
      ...wikiRow,
      title: "IKI Lab",
    });
  }

  const catalogIdsComplete = [...composed.values()].every((a) => a.id > 0);
  if (catalogIdsComplete) {
    return [...composed.values()].sort((a, b) => {
      const sa = a.sort_order ?? Number.MAX_SAFE_INTEGER;
      const sb = b.sort_order ?? Number.MAX_SAFE_INTEGER;
      if (sa !== sb) return sa - sb;
      return a.id - b.id;
    });
  }

  const ordered: AppRow[] = [];
  for (const slug of TOP_LEVEL_ORDER) {
    const row = composed.get(slug);
    if (row) {
      ordered.push(row);
      composed.delete(slug);
    }
  }
  for (const a of apiApps) {
    if (composed.has(a.slug)) {
      ordered.push(composed.get(a.slug)!);
      composed.delete(a.slug);
    }
  }
  for (const row of composed.values()) ordered.push(row);
  return ordered;
}

/**
 * Walk one card through reading order (top-left → right → next row → wrap).
 * `dir` +1 is later in the grid; −1 is earlier. Ends wrap (last → first).
 */
export function walkCatalogOrder<T>(items: T[], index: number, dir: -1 | 1): T[] {
  if (items.length < 2 || index < 0 || index >= items.length) return items;
  const dest = (index + dir + items.length) % items.length;
  const next = [...items];
  const [card] = next.splice(index, 1);
  next.splice(dest, 0, card);
  return next;
}
