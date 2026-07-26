"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { CourseDetail } from "@/lib/types";
import DiscussionSection from "@/components/DiscussionSection";
import ReviewsSection from "@/components/ReviewsSection";
import StudentsSection from "@/components/StudentsSection";
import {
  EditableMarkdown,
  EditableSelect,
  EditableText,
} from "@/components/edit/Editable";
import {
  CourseCanonicalMeta,
  InstructorsEditor,
} from "@/components/edit/EditorExtras";
import { CourseResourcesEditor } from "@/components/edit/CourseResourcesEditor";
import {
  COURSE_TABS,
  useEdit,
  type CourseTab,
} from "@/components/edit/EditContext";
import {
  IconButton,
  IconChevronDown,
  IconChevronRight,
  IconChevronUp,
  IconTrash,
} from "@/components/ui";

const TABS = COURSE_TABS;
const ENABLED: ReadonlySet<string> = new Set(COURSE_TABS);

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
  const collapsedKey = `labs-module-collapsed:${course.slug}`;
  const edit = useEdit();

  // Tab is owned by EditProvider so structure CRUD cannot reset it to About.
  // Fallback only if CourseTabs is ever mounted outside the provider.
  const tab: CourseTab = edit?.courseTab ?? "About";
  const setTab = (t: CourseTab) => {
    if (edit) edit.setCourseTab(t);
  };

  const [progress, setProgress] = useState<ProgressMap>({});
  /** module_id → collapsed (edit mode). Default expanded. */
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const raw = sessionStorage.getItem(collapsedKey);
      if (raw) return JSON.parse(raw) as Record<number, boolean>;
    } catch {
      /* ignore */
    }
    return {};
  });

  function persistCollapsed(next: Record<number, boolean>) {
    setCollapsed(next);
    try {
      sessionStorage.setItem(collapsedKey, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }

  /** HIG list reordering: step controls (up/down), not freeform drag. */
  function moveModule(moduleId: number, dir: -1 | 1) {
    if (!edit) return;
    const ids = edit.modules.map((m) => m.module_id);
    const i = ids.indexOf(moduleId);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    edit.reorderModules(ids);
  }

  function moveLesson(moduleId: number, lessonId: number, dir: -1 | 1) {
    if (!edit) return;
    const mod = edit.modules.find((m) => m.module_id === moduleId);
    if (!mod) return;
    const ids = mod.lessons.map((l) => l.id);
    const i = ids.indexOf(lessonId);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    edit.reorderLessons(moduleId, ids);
  }

  function toggleModuleCollapsed(moduleId: number) {
    persistCollapsed({ ...collapsed, [moduleId]: !collapsed[moduleId] });
  }

  function setAllModulesCollapsed(value: boolean) {
    if (!edit?.modules.length) return;
    const next: Record<number, boolean> = {};
    for (const m of edit.modules) next[m.module_id] = value;
    persistCollapsed(next);
  }

  const allCollapsed =
    !!edit?.editMode &&
    edit.modules.length > 0 &&
    edit.modules.every((m) => collapsed[m.module_id]);

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
        aria-label="Course sections"
        className="relative z-10 flex w-fit max-w-full gap-1 overflow-x-auto rounded-full bg-[var(--color-fill)] p-1 text-sm"
      >
        {TABS.map((t) => {
          const enabled = ENABLED.has(t);
          const selected = tab === t;
          return (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`course-tab-${t.toLowerCase()}`}
              id={`course-tab-btn-${t.toLowerCase()}`}
              disabled={!enabled}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (enabled) setTab(t);
              }}
              className={`relative z-10 min-h-[var(--hit-min)] shrink-0 rounded-full px-4 py-1.5 transition-colors ${
                selected
                  ? "bg-[var(--color-surface)] font-medium text-[var(--color-label)] shadow-[var(--elevation-1)]"
                  : enabled
                    ? "cursor-pointer text-[var(--color-label-secondary)] hover:text-[var(--color-label)]"
                    : "cursor-not-allowed text-[var(--color-label-tertiary)]"
              }`}
              title={enabled ? undefined : "Coming soon"}
            >
              {t}
            </button>
          );
        })}
      </div>

      {/* All panels stay in the DOM so public pages carry full content in raw HTML.
          Toggle with both `hidden` and display class for reliable show/hide. */}
      <section
        id="course-tab-about"
        role="tabpanel"
        aria-labelledby="course-tab-btn-about"
        hidden={tab !== "About"}
        style={{ display: tab === "About" ? undefined : "none" }}
        className="mt-6 space-y-4 leading-relaxed"
      >
        <EditableMarkdown
          field="course.description_md"
          value={course.description_md}
        />
        {/* Canonical Course Model fields — edit mode only (C6) */}
        <CourseCanonicalMeta />
        <div className="surface-card mt-8 border border-[var(--color-separator)] p-6">
          {course.instructors.map((i) => (
            <div key={i.name} className="space-y-1">
              <p className="font-semibold text-[var(--color-label)]">{i.name}</p>
              <p className="text-sm text-[var(--color-label-secondary)]">Instructor</p>
              {i.bio_md && (
                <p className="text-sm text-[var(--color-label-secondary)]">{i.bio_md}</p>
              )}
            </div>
          ))}
        </div>
        <InstructorsEditor />
        <ReviewsSection slug={course.slug} />
      </section>

      <section
        id="course-tab-modules"
        role="tabpanel"
        aria-labelledby="course-tab-btn-modules"
        hidden={tab !== "Modules"}
        style={{ display: tab === "Modules" ? undefined : "none" }}
        className="mt-6 space-y-4"
      >
        {(() => {
          // Edit mode: drive exclusively from edit.modules (admin graph) so
          // create/reorder/delete/save update in place without SSR props.
          // Member view: public course.modules from the page payload.
          const useAdminGraph = !!edit?.editMode && edit.modules.length > 0;
          const moduleCount = useAdminGraph
            ? edit!.modules.length
            : course.modules.length;

          return (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="font-semibold text-[var(--color-label)]">
                  Modules ({moduleCount})
                </h2>
                {edit?.editMode && edit.modules.length > 0 && (
                  <div className="ml-auto flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      className="chip text-xs font-medium"
                      onClick={() => setAllModulesCollapsed(true)}
                      disabled={allCollapsed}
                    >
                      Collapse all
                    </button>
                    <button
                      type="button"
                      className="chip text-xs font-medium"
                      onClick={() => setAllModulesCollapsed(false)}
                      disabled={
                        !edit.modules.some((m) => collapsed[m.module_id])
                      }
                    >
                      Expand all
                    </button>
                  </div>
                )}
              </div>

              {useAdminGraph
                ? edit!.modules.map((adminModule, mi) => {
                    const isCollapsed = !!collapsed[adminModule.module_id];
                    const canMoveModuleUp = mi > 0;
                    const canMoveModuleDown = mi < moduleCount - 1;
                    return (
                      <div
                        key={adminModule.module_id}
                        className="surface-card overflow-hidden border border-[var(--color-separator)]"
                      >
                        <div className="flex items-center gap-1 bg-[var(--color-surface-secondary)] px-2 py-2 font-medium sm:gap-2 sm:px-4 sm:py-2.5">
                          <button
                            type="button"
                            onClick={() =>
                              toggleModuleCollapsed(adminModule.module_id)
                            }
                            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-label-secondary)] hover:bg-[var(--color-fill)]"
                            aria-expanded={!isCollapsed}
                            aria-label={
                              isCollapsed
                                ? `Expand module ${adminModule.title}`
                                : `Collapse module ${adminModule.title}`
                            }
                            title={isCollapsed ? "Expand" : "Collapse"}
                          >
                            {isCollapsed ? (
                              <IconChevronRight size={18} />
                            ) : (
                              <IconChevronDown size={18} />
                            )}
                          </button>
                          <div className="flex shrink-0 flex-col">
                            <IconButton
                              label={`Move module ${adminModule.title} up`}
                              disabled={!canMoveModuleUp}
                              onClick={() =>
                                moveModule(adminModule.module_id, -1)
                              }
                              className="!min-h-8 !min-w-8 !h-8 !w-8"
                            >
                              <IconChevronUp size={16} />
                            </IconButton>
                            <IconButton
                              label={`Move module ${adminModule.title} down`}
                              disabled={!canMoveModuleDown}
                              onClick={() =>
                                moveModule(adminModule.module_id, 1)
                              }
                              className="!min-h-8 !min-w-8 !h-8 !w-8"
                            >
                              <IconChevronDown size={16} />
                            </IconButton>
                          </div>
                          <EditableText
                            field={`module.${adminModule.module_id}.title`}
                            value={adminModule.title}
                            className="min-w-0 flex-1"
                          />
                          {!isCollapsed && (
                            <EditableSelect
                              field={`module.${adminModule.module_id}.kind`}
                              value={adminModule.kind}
                              options={[
                                "standard",
                                "worksheets",
                                "resources",
                                "bonus",
                              ]}
                              className="text-xs text-zinc-500"
                            />
                          )}
                          {isCollapsed && (
                            <span className="shrink-0 text-xs font-normal text-[var(--color-label-tertiary)]">
                              {adminModule.lessons.length} lesson
                              {adminModule.lessons.length === 1 ? "" : "s"}
                            </span>
                          )}
                          <IconButton
                            label={`Delete module ${adminModule.title}`}
                            tone="destructive"
                            onClick={() => {
                              void edit!.deleteModule(
                                adminModule.module_id,
                                adminModule.title,
                              );
                            }}
                          >
                            <IconTrash size={18} />
                          </IconButton>
                        </div>

                        {!isCollapsed && (
                          <ul>
                            {adminModule.lessons.map((adminLesson, li) => {
                              const k = (f: string) =>
                                `lesson.${adminLesson.id}.${f}`;
                              const lessonCount = adminModule.lessons.length;
                              const canMoveLessonUp = li > 0;
                              const canMoveLessonDown = li < lessonCount - 1;
                              return (
                                <li
                                  key={adminLesson.id}
                                  className="space-y-2 border-t border-[var(--color-separator)] px-5 py-3 text-sm"
                                >
                                  <div className="flex items-center gap-2 sm:gap-3">
                                    <div className="flex shrink-0 flex-col">
                                      <IconButton
                                        label={`Move lesson ${adminLesson.title} up`}
                                        disabled={!canMoveLessonUp}
                                        onClick={() =>
                                          moveLesson(
                                            adminModule.module_id,
                                            adminLesson.id,
                                            -1,
                                          )
                                        }
                                        className="!min-h-8 !min-w-8 !h-8 !w-8"
                                      >
                                        <IconChevronUp size={16} />
                                      </IconButton>
                                      <IconButton
                                        label={`Move lesson ${adminLesson.title} down`}
                                        disabled={!canMoveLessonDown}
                                        onClick={() =>
                                          moveLesson(
                                            adminModule.module_id,
                                            adminLesson.id,
                                            1,
                                          )
                                        }
                                        className="!min-h-8 !min-w-8 !h-8 !w-8"
                                      >
                                        <IconChevronDown size={16} />
                                      </IconButton>
                                    </div>
                                    <LessonIcon kind={adminLesson.kind} />
                                    <EditableText
                                      field={k("title")}
                                      value={adminLesson.title}
                                      className="flex-1 font-medium"
                                    />
                                    <EditableSelect
                                      field={k("kind")}
                                      value={adminLesson.kind}
                                      options={[
                                        "video",
                                        "text",
                                        "download",
                                        "external",
                                        "replay",
                                        "quiz",
                                      ]}
                                      className="text-xs text-zinc-500"
                                    />
                                    <Link
                                      href={`/courses/${course.slug}/lessons/${adminLesson.slug}`}
                                      className="shrink-0 text-xs font-medium text-[var(--color-tint)] hover:underline"
                                      title="Open lesson page"
                                    >
                                      Open
                                    </Link>
                                    <IconButton
                                      label={`Delete lesson ${adminLesson.title}`}
                                      tone="destructive"
                                      onClick={() => {
                                        void edit!.deleteLesson(
                                          adminLesson.id,
                                          adminLesson.title,
                                        );
                                      }}
                                    >
                                      <IconTrash size={18} />
                                    </IconButton>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2 pl-9 text-xs">
                                    <input
                                      key={`vid-${adminLesson.id}-${adminLesson.video_id ?? ""}`}
                                      placeholder="YouTube URL or ID"
                                      defaultValue={adminLesson.video_id ?? ""}
                                      onBlur={(e) =>
                                        edit!.setField(
                                          k("video_id"),
                                          e.target.value,
                                        )
                                      }
                                      className="w-56 rounded-lg border border-zinc-300 bg-white px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
                                    />
                                    <input
                                      key={`start-${adminLesson.id}-${adminLesson.video_params.start ?? ""}`}
                                      placeholder="start s"
                                      defaultValue={
                                        adminLesson.video_params.start ?? ""
                                      }
                                      onBlur={(e) =>
                                        edit!.setField(
                                          k("video_start"),
                                          e.target.value,
                                        )
                                      }
                                      className="w-20 rounded-lg border border-zinc-300 bg-white px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
                                    />
                                    <input
                                      key={`end-${adminLesson.id}-${adminLesson.video_params.end ?? ""}`}
                                      placeholder="end s"
                                      defaultValue={
                                        adminLesson.video_params.end ?? ""
                                      }
                                      onBlur={(e) =>
                                        edit!.setField(
                                          k("video_end"),
                                          e.target.value,
                                        )
                                      }
                                      className="w-20 rounded-lg border border-zinc-300 bg-white px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
                                    />
                                    <label className="flex items-center gap-1.5">
                                      <input
                                        type="checkbox"
                                        key={`free-${adminLesson.id}-${adminLesson.free_preview}`}
                                        defaultChecked={adminLesson.free_preview}
                                        onChange={(e) =>
                                          edit!.setField(
                                            k("free_preview"),
                                            e.target.checked,
                                          )
                                        }
                                      />
                                      Free preview
                                    </label>
                                  </div>
                                </li>
                              );
                            })}
                            <li className="border-t border-[var(--color-separator)]">
                              <button
                                type="button"
                                onClick={() =>
                                  edit!.createLesson(adminModule.module_id)
                                }
                                className="w-full px-5 py-2.5 text-left text-sm text-[var(--color-tint)] hover:bg-[var(--color-tint-soft)]"
                              >
                                + Add lesson
                              </button>
                            </li>
                          </ul>
                        )}
                      </div>
                    );
                  })
                : course.modules.map((m, mi) => (
                    <div
                      key={`${m.title}-${mi}`}
                      className="surface-card overflow-hidden border border-[var(--color-separator)]"
                    >
                      <div className="flex items-center gap-1 bg-[var(--color-surface-secondary)] px-2 py-2 font-medium sm:gap-2 sm:px-4 sm:py-2.5">
                        <span className="px-2">{m.title}</span>
                      </div>
                      <ul>
                        {m.lessons.map((l) => {
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
                                  <span
                                    aria-label="Members only"
                                    title="Members only"
                                  >
                                    🔒
                                  </span>
                                )}
                              </span>
                            </>
                          );
                          const rowClass =
                            "flex items-center gap-3 border-t border-[var(--color-separator)] px-5 py-3 text-sm";
                          return (
                            <li key={l.slug}>
                              <Link
                                href={`/courses/${course.slug}/lessons/${l.slug}`}
                                className={`${rowClass} transition-colors hover:bg-[var(--color-fill)]`}
                              >
                                {row}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}

              {edit?.editMode && (
                <button
                  type="button"
                  onClick={() => edit.createModule()}
                  className="w-full rounded-2xl border-2 border-dashed border-[var(--color-tint)]/40 py-4 font-medium text-[var(--color-tint)] hover:bg-[var(--color-tint-soft)]"
                >
                  + Add module
                </button>
              )}
            </>
          );
        })()}
      </section>

      <section
        id="course-tab-discussion"
        role="tabpanel"
        aria-labelledby="course-tab-btn-discussion"
        hidden={tab !== "Discussion"}
        style={{ display: tab === "Discussion" ? undefined : "none" }}
        className="mt-6"
      >
        {/* Outer elevated surface — pure white on canvas (Apple HIG grouped content) */}
        <div className="surface-card border border-[var(--color-separator)] p-6">
          {tab === "Discussion" && <DiscussionSection slug={course.slug} />}
        </div>
      </section>

      <section
        id="course-tab-students"
        role="tabpanel"
        aria-labelledby="course-tab-btn-students"
        hidden={tab !== "Students"}
        style={{ display: tab === "Students" ? undefined : "none" }}
        className="mt-6"
      >
        <div className="surface-card border border-[var(--color-separator)] p-6">
          {tab === "Students" && <StudentsSection slug={course.slug} />}
        </div>
      </section>

      <section
        id="course-tab-resources"
        role="tabpanel"
        aria-labelledby="course-tab-btn-resources"
        hidden={tab !== "Resources"}
        style={{ display: tab === "Resources" ? undefined : "none" }}
        className="mt-6"
      >
        <div className="surface-card border border-[var(--color-separator)] p-6">
          <h2 className="font-semibold text-[var(--color-label)]">Resources</h2>
          <CourseResourcesEditor />
          {(() => {
            const linked = course.resources ?? [];
            if (linked.length === 0) {
              return (
                <p className="mt-2 text-sm text-[var(--color-label-secondary)]">
                  No course-level resources.
                </p>
              );
            }
            return (
              <ul className="mt-3 space-y-2">
                {linked.map((a) => (
                  <li key={a.slug}>
                    <a
                      href={a.download_path}
                      className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-separator)] bg-[var(--color-surface-secondary)] px-4 py-3 text-sm transition-colors hover:bg-[var(--color-fill)]"
                    >
                      <LessonIcon
                        kind={a.kind === "file" ? "download" : "external"}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium">{a.title}</span>
                        <span className="text-xs text-[var(--color-label-tertiary)]">
                          v{a.pinned_version}
                          {a.type ? ` · ${a.type}` : ""}
                        </span>
                      </span>
                      <span className="ml-auto text-xs text-[var(--color-label-tertiary)]">
                        {a.free ? "Free" : "Members"}
                        {a.kind === "file" ? " · Download" : " · Open"}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            );
          })()}
        </div>
      </section>
    </div>
  );
}
