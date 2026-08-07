"use client";

/**
 * Trader Development Phase 0 — progressive story chrome (OD-0.1).
 * Full spine after Playbook + Campaign ship (Phase 1 exit).
 */

import Link from "next/link";

/** Progressive copy until Phase 1 Playbook + Campaign are clickable. */
export const PRACTICE_STORY_PROGRESSIVE =
  "You are building a trader, not a trade. Log & Tags → Journal → Retrospective → Journey · Toughness — Playbook and Campaigns arrive next.";

/** Full spine — use after Phase 1 exit. */
export const PRACTICE_STORY_FULL =
  "You are building a trader, not a trade. Playbook → Campaign → Log & Tags → Journal → Retrospective → Journey · Toughness";

type Props = {
  /** Override progressive default when Phase 1 is live. */
  variant?: "progressive" | "full";
  className?: string;
  showLexiconLink?: boolean;
};

export default function PracticeStoryStrip({
  variant = "progressive",
  className = "",
  showLexiconLink = false,
}: Props) {
  const line =
    variant === "full" ? PRACTICE_STORY_FULL : PRACTICE_STORY_PROGRESSIVE;
  return (
    <div
      className={[
        "rounded-[var(--radius-md)] border border-[var(--color-separator)] bg-[var(--color-fill)]/60 px-3 py-2",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      data-testid="practice-story-strip"
      role="note"
    >
      <p
        className="text-[var(--color-label-secondary)]"
        style={{ fontSize: "var(--text-footnote)", lineHeight: 1.4 }}
      >
        <span className="font-medium text-[var(--color-label)]">Practice</span>
        {" — "}
        {line}
        {showLexiconLink && (
          <>
            {" "}
            <Link
              href="/resource"
              className="font-medium text-[var(--color-tint)] hover:underline"
            >
              Browse Lexicon
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
