"use client";

// FAQ accordion: one panel open at a time; all answers stay in the DOM for
// crawlers/agents. Edit mode expands controls for reorder/add/delete.

import { useState } from "react";
import Markdown from "@/components/Markdown";
import { HubEditableMarkdown, HubEditableText } from "./HubEditable";
import { useHubEdit, type FaqDraft } from "./HubEditContext";

// FaqDraft re-exported for callers typing initial items

function FaqItemView({
  item,
  open,
  onToggle,
}: {
  item: FaqDraft;
  open: boolean;
  onToggle: () => void;
}) {
  const edit = useHubEdit();
  const editing = !!edit?.editMode;

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800">
      <h3 className="m-0">
        <button
          type="button"
          aria-expanded={open}
          onClick={onToggle}
          className="flex w-full items-start gap-3 px-5 py-4 text-left"
        >
          <span
            className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs transition-transform ${
              open
                ? "border-emerald-500 bg-emerald-500 text-white"
                : "border-zinc-300 text-zinc-500 dark:border-zinc-600"
            }`}
            aria-hidden
          >
            {open ? "−" : "+"}
          </span>
          <span className="min-w-0 flex-1 text-base font-medium leading-snug">
            {editing ? (
              <span
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              >
                <input
                  value={item.question}
                  onChange={(e) =>
                    edit!.setFaqField(item.id, "question", e.target.value)
                  }
                  className="w-full rounded border border-emerald-400/60 bg-transparent px-2 py-1 outline-none ring-emerald-500 focus:ring-2"
                  placeholder="Question"
                />
              </span>
            ) : (
              item.question
            )}
          </span>
        </button>
      </h3>

      {/* Answers always in DOM (AEO); visually collapsed when closed */}
      <div
        className={`overflow-hidden px-5 transition-[max-height,opacity,padding] duration-200 ${
          open || editing
            ? "max-h-[2000px] opacity-100 pb-5"
            : "max-h-0 opacity-0 pb-0"
        }`}
        // Keep collapsed content readable to non-visual agents via aria
        hidden={!open && !editing ? true : undefined}
      >
        {editing ? (
          <div onClick={(e) => e.stopPropagation()}>
            <HubEditableMarkdown
              value={item.answer_md}
              onChange={(md) => edit!.setFaqField(item.id, "answer_md", md)}
            />
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <button
                type="button"
                onClick={() => edit!.moveFaq(item.id, -1)}
                className="rounded-full border border-zinc-300 px-3 py-1 dark:border-zinc-700"
              >
                ↑ Move up
              </button>
              <button
                type="button"
                onClick={() => edit!.moveFaq(item.id, 1)}
                className="rounded-full border border-zinc-300 px-3 py-1 dark:border-zinc-700"
              >
                ↓ Move down
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm("Remove this FAQ item?")) edit!.removeFaq(item.id);
                }}
                className="rounded-full border border-red-300 px-3 py-1 text-red-600 dark:border-red-900"
              >
                Delete
              </button>
            </div>
          </div>
        ) : (
          <div className="pl-9 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            <Markdown>{item.answer_md}</Markdown>
          </div>
        )}
      </div>

      {/* SEO/AEO fallback: full answer always present for crawlers that ignore CSS */}
      {!editing && (
        <div className="sr-only">
          <Markdown>{item.answer_md}</Markdown>
        </div>
      )}
    </div>
  );
}

export default function HubFaqAccordion({
  initialItems,
}: {
  initialItems: FaqDraft[];
}) {
  const edit = useHubEdit();
  const list = edit ? edit.faqs : initialItems;
  const [openId, setOpenId] = useState<number | null>(null);

  return (
    <section id="faq" className="mt-16" aria-labelledby="faq-heading">
      <h2
        id="faq-heading"
        className="text-xl font-semibold tracking-tight sm:text-2xl"
      >
        <HubEditableText
          field="faq_title"
          value={edit?.value("faq_title", "FAQ") ?? "FAQ"}
          as="span"
        />
      </h2>
      <div className="mt-2 max-w-3xl text-sm text-zinc-600 dark:text-zinc-400">
        <HubEditableMarkdown
          field="faq_description_md"
          value={
            edit?.value(
              "faq_description_md",
              "",
            ) ?? ""
          }
        />
      </div>

      <div className="mt-6 space-y-3">
        {list.map((item) => (
          <FaqItemView
            key={item.id}
            item={item}
            open={openId === item.id}
            onToggle={() =>
              setOpenId((cur) => (cur === item.id ? null : item.id))
            }
          />
        ))}
      </div>

      {edit?.editMode && (
        <button
          type="button"
          onClick={() => {
            edit.addFaq();
          }}
          className="mt-4 rounded-full border border-dashed border-emerald-400 px-4 py-2 text-sm font-medium text-emerald-700 dark:text-emerald-400"
        >
          + Add FAQ item
        </button>
      )}
    </section>
  );
}
