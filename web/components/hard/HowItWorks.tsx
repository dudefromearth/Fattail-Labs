"use client";

/**
 * How Toughness programs work — Coach copy + optional intro video.
 * Video: HARD_INTRO_VIDEO_ID / snapshot how_it_works.intro_video_id.
 */

import { youtubeEmbedUrl, parseYoutubeVideoId } from "@/lib/hub";

export type LadderRung = {
  days: number;
  title: string;
  blurb: string;
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
    rungs?: LadderRung[];
  } | null;
  rules: string[];
  intro_video_id: string | null;
  intro_video_title: string | null;
};

const FALLBACK: HowItWorksBlock = {
  title: "How these programs work",
  headline: "These programs develop Mental Toughness.",
  body: [
    "You work by following the program for the prescribed number of days and doing all the required activities each day, without fail.",
    "If you fail any activity, you must start the program from day one. No partial credit. No sliding scale.",
    "This is not easy — but it is the most effective way to cause real change in your physiology and mindset.",
    "You will become mentally tough if you progress through the entire set of programs.",
    "Many people are not prepared for how the program will change their lives and their priorities — particularly no drinking and no cheating on the diet. Plan for that before you start.",
    "Life still happens: vacations, weddings, holidays, work travel, family obligations. Those moments will challenge your resolve. The rules do not pause for them. That is part of the training.",
  ],
  life_and_priorities: {
    title: "What will actually change",
    body: [
      "This program reorders your day. Sleep, food, movement, and what you say yes to on a Saturday night stop being optional background noise — they become the work.",
      "No drinking and no cheating on the diet surprise people the most. Social habits, celebrations, and “just this once” pressure will push hard. Expect it. Decide in advance that those lines do not move.",
      "Vacations, weddings, holidays, and other real-life events will test you. Completing the program means holding the rules through those days — or accepting a restart from day one if you break them.",
    ],
  },
  ladder: {
    title: "The 20 → 40 → 75 path",
    intro:
      "FatTail Hard is a ladder of breakthrough periods. You choose the next rung when you are ready — never a membership requirement.",
    rungs: [
      {
        days: 20,
        title: "20 days",
        blurb:
          "Finish 20 and you might want to stop. That is normal. You may also choose to go on to 40. Some people need to complete 20 twice before 40 feels possible — that is not failure; it is building capacity.",
      },
      {
        days: 40,
        title: "40 days",
        blurb:
          "At 40, most people hit a major period of despair. Expect it. If you get through that stretch without quitting the rules, you can make it to the end.",
      },
      {
        days: 75,
        title: "75 days",
        blurb:
          "The far end of the ladder. Reach it by stacking completed rungs — not by skipping the hard middle.",
      },
    ],
  },
  rules: [
    "All required daily activities must be completed every day.",
    "Miss or fail any required activity → restart from day one.",
    "No alcohol and no diet cheating — social events do not pause the rules.",
    "Vacations, weddings, and “life happens” still count as program days.",
    "FatTail Hard ladder: 20 → 40 → 75 (breakthrough periods).",
    "Repeating 20 before attempting 40 is allowed and often wise.",
    "True 75 Hard is offered as-is with full credit to Andy Frisella.",
    "Voluntary — never a membership requirement; never P&L theater.",
  ],
  intro_video_id: null,
  intro_video_title: "How Toughness programs work",
};

export default function HowItWorks({
  block,
}: {
  block?: HowItWorksBlock | null;
}) {
  const h = block ?? FALLBACK;
  const videoId = parseYoutubeVideoId(h.intro_video_id);
  const ladder = h.ladder;
  const rungs = ladder?.rungs?.length ? ladder.rungs : FALLBACK.ladder?.rungs;
  const life = h.life_and_priorities?.body?.length
    ? h.life_and_priorities
    : FALLBACK.life_and_priorities;

  return (
    <section
      className="rounded-2xl border border-[var(--color-separator)] bg-[var(--color-surface)] p-5 shadow-[var(--elevation-1)] sm:p-6"
      aria-labelledby="how-it-works-heading"
      data-testid="toughness-how-it-works"
    >
      <h2
        id="how-it-works-heading"
        className="text-base font-semibold text-[var(--color-label)]"
      >
        {h.title}
      </h2>

      {videoId ? (
        <div className="mt-4 aspect-video overflow-hidden rounded-xl border border-[var(--color-separator)] bg-black">
          <iframe
            title={h.intro_video_title || h.title}
            src={youtubeEmbedUrl(videoId)}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <div
          className="mt-4 flex aspect-video flex-col items-center justify-center rounded-xl border border-dashed border-[var(--color-separator)] bg-[var(--color-fill)]/50 px-6 text-center"
          data-testid="toughness-intro-video-placeholder"
        >
          <p className="text-sm font-medium text-[var(--color-label)]">
            Intro video — coming soon
          </p>
          <p className="mt-1 max-w-sm text-xs text-[var(--color-label-secondary)]">
            Coach will record a short walkthrough of these rules. The written
            rules below are the full program contract now.
          </p>
        </div>
      )}

      <p className="mt-5 text-lg font-semibold leading-snug text-[var(--color-label)]">
        {h.headline}
      </p>
      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-[var(--color-label)]">
        {h.body.map((para) => (
          <p key={para.slice(0, 48)}>{para}</p>
        ))}
      </div>

      {life?.body && life.body.length > 0 ? (
        <div
          className="mt-6 rounded-xl border border-[var(--color-separator)] bg-[var(--color-fill)]/40 px-4 py-4"
          data-testid="toughness-life-priorities"
        >
          <h3 className="text-sm font-semibold text-[var(--color-label)]">
            {life.title || "What will actually change"}
          </h3>
          <div className="mt-2 space-y-2 text-sm leading-relaxed text-[var(--color-label-secondary)]">
            {life.body.map((para) => (
              <p key={para.slice(0, 48)}>{para}</p>
            ))}
          </div>
        </div>
      ) : null}

      {rungs && rungs.length > 0 ? (
        <div className="mt-6" data-testid="toughness-ladder">
          <h3 className="text-sm font-semibold text-[var(--color-label)]">
            {ladder?.title || "The 20 → 40 → 75 path"}
          </h3>
          {ladder?.intro ? (
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-label-secondary)]">
              {ladder.intro}
            </p>
          ) : null}
          <ol className="mt-4 space-y-3">
            {rungs.map((rung) => (
              <li
                key={rung.days}
                className="rounded-xl border border-[var(--color-separator)] bg-[var(--color-fill)]/40 px-4 py-3"
              >
                <p className="text-sm font-semibold text-[var(--color-label)]">
                  {rung.title}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-[var(--color-label-secondary)]">
                  {rung.blurb}
                </p>
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      <h3 className="mt-5 text-xs font-semibold uppercase tracking-wide text-[var(--color-label-secondary)]">
        Rules
      </h3>
      <ul className="mt-2 list-inside list-disc space-y-1.5 text-sm text-[var(--color-label-secondary)]">
        {h.rules.map((rule) => (
          <li key={rule.slice(0, 48)}>{rule}</li>
        ))}
      </ul>
    </section>
  );
}
