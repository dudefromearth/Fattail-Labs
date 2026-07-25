"use client";

/**
 * Presentational FAQ accordion — same interaction/visual language as the hub FAQ
 * (one open at a time, elevated surface rows, +/− control). For static FAQ lists
 * (e.g. membership). Hub CMS editing stays in HubFaqAccordion.
 */

import { useState } from "react";
import Markdown from "@/components/Markdown";

export type FaqAccordionItem = {
  id: string;
  question: string;
  /** Plain text or markdown */
  answer: string;
};

export default function FaqAccordion({
  items,
  heading = "FAQ",
  headingId = "faq-heading",
  description,
}: {
  items: FaqAccordionItem[];
  heading?: string;
  headingId?: string;
  description?: string;
}) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <section id="faq" className="mt-14" aria-labelledby={headingId}>
      <h2
        id={headingId}
        className="text-xl font-semibold tracking-tight text-[var(--color-label)] sm:text-2xl"
      >
        {heading}
      </h2>
      {description ? (
        <p className="mt-2 max-w-3xl text-sm text-[var(--color-label-secondary)]">
          {description}
        </p>
      ) : null}

      <div className="mt-6 space-y-3">
        {items.map((item) => {
          const open = openId === item.id;
          return (
            <div
              key={item.id}
              className="surface-card border border-[var(--color-separator)]"
            >
              <h3 className="m-0">
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() =>
                    setOpenId((cur) => (cur === item.id ? null : item.id))
                  }
                  className="flex w-full items-start gap-3 px-5 py-4 text-left"
                >
                  <span
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs transition-colors ${
                      open
                        ? "border-[var(--color-tint)] bg-[var(--color-tint)] text-[var(--color-on-tint)]"
                        : "border-[var(--color-separator)] bg-[var(--color-surface)] text-[var(--color-label-secondary)]"
                    }`}
                    aria-hidden
                  >
                    {open ? "−" : "+"}
                  </span>
                  <span className="min-w-0 flex-1 text-base font-medium leading-snug text-[var(--color-label)]">
                    {item.question}
                  </span>
                </button>
              </h3>

              <div
                className={`overflow-hidden px-5 transition-[max-height,opacity,padding] duration-200 ${
                  open
                    ? "max-h-[2000px] opacity-100 pb-5"
                    : "max-h-0 opacity-0 pb-0"
                }`}
                hidden={!open ? true : undefined}
              >
                <div className="pl-9 text-sm leading-relaxed text-[var(--color-label-secondary)] [&_p]:my-0">
                  <Markdown>{item.answer}</Markdown>
                </div>
              </div>

              {/* SEO/AEO: full answer always in DOM for non-visual agents */}
              <div className="sr-only">
                <Markdown>{item.answer}</Markdown>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
