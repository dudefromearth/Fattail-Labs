"use client";

import type { AlgoFeedPost } from "@/lib/options-lab/algoReasonFeed";
import { ALGO_FEED_QUIET, ALGO_REASON_HOST } from "@/lib/options-lab/algoReasonFeed";

export default function AlgoReasonFeed({
  posts,
  phase,
}: {
  posts: readonly AlgoFeedPost[];
  phase?: string;
}) {
  const empty = posts.length === 0;
  return (
    <aside
      className="pointer-events-auto absolute right-3 top-16 z-30 max-h-[min(22rem,50%)] w-[min(22rem,calc(100%-1.5rem))] overflow-y-auto rounded-[var(--radius-lg)] border border-[var(--color-separator)] bg-[var(--color-surface)]/90 p-3 text-[length:var(--text-subheadline)] leading-snug text-[var(--color-label)] shadow-[var(--elevation-3)]"
      data-testid="analyzer-algo-narrative"
      data-trader-feed={ALGO_REASON_HOST}
      data-algo-phase={phase}
    >
      <div className="mb-1 text-[length:var(--text-caption)] font-semibold uppercase tracking-wide text-[var(--color-label-secondary)]">
        Trader Feed
      </div>
      {empty ? (
        <p data-testid="algo-feed-quiet">{ALGO_FEED_QUIET}</p>
      ) : (
        posts.map((p, i) => (
          <p
            key={`${p.t}-${i}`}
            className="mt-1.5"
            data-feed-source={p.source}
            data-feed-quiet={p.quiet ? "1" : undefined}
          >
            <time className="mr-2 text-[length:var(--text-caption)] text-[var(--color-label-secondary)]">
              {p.t}
            </time>
            {p.body}
          </p>
        ))
      )}
    </aside>
  );
}
