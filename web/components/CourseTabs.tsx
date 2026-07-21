"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { CourseDetail } from "@/lib/types";
import Markdown from "@/components/Markdown";
import {
  EditableMarkdown,
  EditableSelect,
  EditableText,
} from "@/components/edit/Editable";
import { useEdit } from "@/components/edit/EditContext";

const TABS = ["About", "Modules", "Resources", "Discussion", "Students"] as const;
const ENABLED: ReadonlySet<string> = new Set(["About", "Modules", "Resources"]);

function fmtDuration(seconds: number): string {
  if (!seconds) return "";
  const m = Math.round(seconds / 60);
  return `${m} min`;
}

function LessonIcon({ kind }: { kind: string }) {
  const glyph = kind === "video" ? "▶" : kind === "download" ? "⤓" : "↗";
  return (
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
      {glyph}
    </span>
  );
}

type ProgressMap = Record<string, { completed: boolean }>;

export default function CourseTabs({ course }: { course: CourseDetail }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("About");
  const [progress, setProgress] = useState<ProgressMap>({});
  const edit = useEdit();

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/me/progress?course=${encodeURIComponent(course.slug)}`, {
      credentials: "same-origin",
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d?.lessons) setProgress(d.lessons);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [course.slug]);

  return (
    <div>
      <div
        role="tablist"
        className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-full bg-zinc-100 p-1 text-sm dark:bg-zinc-900"
      >
        {TABS.map((t) => {
          const enabled = ENABLED.has(t);
          return (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              disabled={!enabled}
              onClick={() => enabled && setTab(t)}
              className={`rounded-full px-4 py-1.5 transition-colors ${
                tab === t
                  ? "bg-white shadow dark:bg-zinc-700"
                  : enabled
                    ? "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                    : "cursor-not-allowed text-zinc-400 dark:text-zinc-600"
              }`}
              title={enabled ? undefined : "Coming soon"}
            >
              {t}
            </button>
          );
        })}
      </div>

      {/* All panels stay in the DOM so public pages carry full content in raw HTML. */}
      <section hidden={tab !== "About"} className="mt-6 space-y-4 leading-relaxed">
        <EditableMarkdown
          field="course.description_md"
          value={course.description_md}
        />
        <div className="mt-8 rounded-2xl border border-zinc-200 p-6 dark:border-zinc-800">
          {course.instructors.map((i) => (
            <div key={i.name} className="space-y-1">
              <p className="font-semibold">{i.name}</p>
              <p className="text-sm text-zinc-500">Instructor</p>
              {i.bio_md && (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">{i.bio_md}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      <section hidden={tab !== "Modules"} className="mt-6 space-y-4">
        <h2 className="font-semibold">Modules ({course.modules.length})</h2>
        {course.modules.map((m, mi) => {
          const adminModule = edit?.editMode ? edit.modules[mi] : undefined;
          return (
          <div
            key={m.title}
            className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800"
          >
            <div className="flex items-center gap-3 bg-zinc-50 px-5 py-3 font-medium dark:bg-zinc-900">
              {adminModule ? (
                <>
                  <EditableText
                    field={`module.${adminModule.module_id}.title`}
                    value={adminModule.title}
                    className="flex-1"
                  />
                  <EditableSelect
                    field={`module.${adminModule.module_id}.kind`}
                    value={adminModule.kind}
                    options={["standard", "worksheets", "resources", "bonus"]}
                    className="text-xs text-zinc-500"
                  />
                  <button
                    onClick={() => edit!.deleteModule(adminModule.module_id)}
                    title="Delete module"
                    className="text-zinc-400 hover:text-red-500"
                  >
                    🗑
                  </button>
                </>
              ) : (
                m.title
              )}
            </div>
            <ul>
              {m.lessons.map((l) => {
                const adminLesson = edit?.editMode ? edit.lessons[l.slug] : undefined;
                if (adminLesson) {
                  const k = (f: string) => `lesson.${adminLesson.id}.${f}`;
                  return (
                    <li
                      key={l.slug}
                      className="space-y-2 border-t border-zinc-100 px-5 py-3 text-sm dark:border-zinc-800"
                    >
                      <div className="flex items-center gap-3">
                        <LessonIcon kind={l.kind} />
                        <EditableText
                          field={k("title")}
                          value={adminLesson.title}
                          className="flex-1 font-medium"
                        />
                        <button
                          onClick={() => edit!.deleteLesson(adminLesson.id)}
                          title="Delete lesson"
                          className="text-zinc-400 hover:text-red-500"
                        >
                          🗑
                        </button>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 pl-9 text-xs">
                        <input
                          placeholder="YouTube URL or ID"
                          defaultValue={adminLesson.video_id ?? ""}
                          onBlur={(e) =>
                            edit!.setField(k("video_id"), e.target.value)
                          }
                          className="w-56 rounded-lg border border-zinc-300 bg-white px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
                        />
                        <input
                          placeholder="start s"
                          defaultValue={adminLesson.video_params.start ?? ""}
                          onBlur={(e) =>
                            edit!.setField(k("video_start"), e.target.value)
                          }
                          className="w-20 rounded-lg border border-zinc-300 bg-white px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
                        />
                        <input
                          placeholder="end s"
                          defaultValue={adminLesson.video_params.end ?? ""}
                          onBlur={(e) =>
                            edit!.setField(k("video_end"), e.target.value)
                          }
                          className="w-20 rounded-lg border border-zinc-300 bg-white px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
                        />
                        <label className="flex items-center gap-1.5">
                          <input
                            type="checkbox"
                            defaultChecked={adminLesson.free_preview}
                            onChange={(e) =>
                              edit!.setField(k("free_preview"), e.target.checked)
                            }
                          />
                          Free preview
                        </label>
                      </div>
                    </li>
                  );
                }
                const row = (
                  <>
                    <LessonIcon kind={l.kind} />
                    <span>{l.title}</span>
                    {progress[l.slug]?.completed && (
                      <span
                        className="text-emerald-500"
                        aria-label="Completed"
                        title="Completed"
                      >
                        ✓
                      </span>
                    )}
                    <span className="ml-auto flex items-center gap-3 text-xs text-zinc-500">
                      {fmtDuration(l.duration_seconds)}
                      {l.free_preview ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                          Free preview
                        </span>
                      ) : (
                        <span aria-label="Members only" title="Members only">
                          🔒
                        </span>
                      )}
                    </span>
                  </>
                );
                const rowClass =
                  "flex items-center gap-3 border-t border-zinc-100 px-5 py-3 text-sm dark:border-zinc-800";
                // Every row links to the player; the lesson endpoint is the
                // access authority and the player renders sign-up/upgrade
                // prompts (Enrollment & Access spec §4).
                return (
                  <li key={l.slug}>
                    <Link
                      href={`/courses/${course.slug}/lessons/${l.slug}`}
                      className={`${rowClass} transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900`}
                    >
                      {row}
                    </Link>
                  </li>
                );
              })}
              {adminModule && (
                <li className="border-t border-zinc-100 dark:border-zinc-800">
                  <button
                    onClick={() => edit!.createLesson(adminModule.module_id)}
                    className="w-full px-5 py-2.5 text-left text-sm text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                  >
                    + Add lesson
                  </button>
                </li>
              )}
            </ul>
          </div>
          );
        })}
        {edit?.editMode && (
          <button
            onClick={() => edit.createModule()}
            className="w-full rounded-2xl border-2 border-dashed border-emerald-300 py-4 font-medium text-emerald-600 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-950/30"
          >
            + Add module
          </button>
        )}
      </section>

      <section hidden={tab !== "Resources"} className="mt-6">
        <h2 className="font-semibold">Resources</h2>
        {course.attachments.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">No course-level resources.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {course.attachments.map((a) => (
              <li
                key={a.title}
                className="flex items-center gap-3 rounded-xl border border-zinc-200 px-4 py-3 text-sm dark:border-zinc-800"
              >
                <LessonIcon kind={a.kind === "file" ? "download" : "external"} />
                {a.title}
                <span className="ml-auto text-xs text-zinc-400">Members</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
