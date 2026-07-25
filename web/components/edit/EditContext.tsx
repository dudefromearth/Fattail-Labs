"use client";

// Edit-mode engine (In-Place Admin spec v1.1). Holds admin state, the dirty set,
// lesson slug->id mapping, and the save pipeline. Editable components consume this;
// all authority stays server-side at the admin API.

import { fetchMe } from "@/lib/useIsAdmin";
import { revalidate as revalidatePages } from "@/lib/client";
import { appAlert, appConfirm } from "@/lib/dialogs";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

/** Course page tab capsule — owned by EditProvider so structure ops cannot reset it. */
export const COURSE_TABS = [
  "About",
  "Modules",
  "Resources",
  "Discussion",
  "Students",
] as const;
export type CourseTab = (typeof COURSE_TABS)[number];

export function isCourseTab(v: string): v is CourseTab {
  return (COURSE_TABS as readonly string[]).includes(v);
}

type Dirty = Record<string, string | boolean>;

export type LessonAdmin = {
  id: number;
  slug: string;
  title: string;
  kind: string;
  duration_seconds: number;
  video_id: string | null;
  video_params: Record<string, string>;
  free_preview: boolean;
};

export type ModuleAdmin = {
  module_id: number;
  title: string;
  kind: string;
  lessons: LessonAdmin[];
};

/** Normalize GET /api/admin/courses/:slug into edit-engine state shapes. */
function mapAdminPayload(d: {
  modules?: Array<{
    module_id: number;
    title: string;
    kind: string;
    lessons?: Array<{
      id: number;
      slug: string;
      title: string;
      kind?: string;
      duration_seconds?: number;
      video_id?: string | null;
      video_params?: Record<string, string>;
      free_preview?: boolean;
    }>;
  }>;
  trailer_video_id?: string | null;
  hero_image_url?: string | null;
  categories?: { slug: string; name: string }[];
  instructors?: { id: number; name: string }[];
  attachments?: {
    id: number;
    title: string;
    kind: string;
    url: string;
    free_preview?: boolean;
  }[];
  status?: string;
}): {
  lessons: Record<string, LessonAdmin>;
  modules: ModuleAdmin[];
  trailerVideoId: string | null;
  heroImageUrl: string | null;
  categories: { slug: string; name: string }[];
  instructors: { id: number; name: string }[];
  attachments: {
    id: number;
    title: string;
    kind: string;
    url: string;
    free_preview?: boolean;
  }[];
  status: string | null;
} {
  const lessons: Record<string, LessonAdmin> = {};
  const modules: ModuleAdmin[] = [];
  for (const m of d.modules ?? []) {
    const ls: LessonAdmin[] = [];
    for (const l of m.lessons ?? []) {
      const la: LessonAdmin = {
        id: l.id,
        slug: l.slug,
        title: l.title,
        kind: l.kind ?? "video",
        duration_seconds: l.duration_seconds ?? 0,
        video_id: l.video_id ?? null,
        video_params: l.video_params ?? {},
        free_preview: !!l.free_preview,
      };
      lessons[l.slug] = la;
      ls.push(la);
    }
    modules.push({
      module_id: m.module_id,
      title: m.title,
      kind: m.kind,
      lessons: ls,
    });
  }
  return {
    lessons,
    modules,
    trailerVideoId: d.trailer_video_id ?? null,
    heroImageUrl: d.hero_image_url ?? null,
    categories: d.categories ?? [],
    instructors: d.instructors ?? [],
    attachments: d.attachments ?? [],
    status: d.status ?? null,
  };
}

type EditState = {
  isAdmin: boolean;
  editMode: boolean;
  setEditMode: (v: boolean) => void;
  /** Active course tab — lives here so CRUD never remounts the tab capsule. */
  courseTab: CourseTab;
  setCourseTab: (t: CourseTab) => void;
  dirty: Dirty;
  setField: (key: string, value: string | boolean) => void;
  value: (key: string, fallback: string) => string;
  lessons: Record<string, LessonAdmin>;
  modules: ModuleAdmin[];
  trailerVideoId: string | null | undefined;
  heroImageUrl: string | null | undefined;
  categories: { slug: string; name: string }[];
  instructors: { id: number; name: string }[];
  attachments: { id: number; title: string; kind: string; url: string; free_preview?: boolean }[];
  reorderModules: (ids: number[]) => void;
  reorderLessons: (moduleId: number, ids: number[]) => void;
  setCategories: (slugs: string[]) => void;
  setInstructors: (ids: number[]) => void;
  addAttachment: (a: { title: string; kind: string; url: string; free_preview?: boolean }) => void;
  updateAttachment: (id: number, patch: Record<string, string>) => void;
  removeAttachment: (id: number) => void;
  uploadHero: (file: File) => void;
  createModule: () => void;
  createLesson: (moduleId: number) => void;
  deleteModule: (moduleId: number, title?: string) => void;
  deleteLesson: (lessonId: number, title?: string) => void;
  status: string | null;
  setStatus: (s: string) => void;
  saving: boolean;
  error: string | null;
  save: () => Promise<void>;
  discard: () => void;
};

const Ctx = createContext<EditState | null>(null);

export function useEdit(): EditState | null {
  return useContext(Ctx);
}

export function EditProvider({
  courseSlug,
  children,
}: {
  courseSlug: string;
  children: React.ReactNode;
}) {
  // Use imperative dialogs (not useConfirm hook) so EditProvider never throws
  // when ConfirmProvider context is briefly unavailable — a throw here would
  // kill hydration for CourseTabs and make the tab capsule dead.
  const [isAdmin, setIsAdmin] = useState(false);
  const [editMode, setEditModeState] = useState(false);
  const editKey = `labs-edit-mode:${courseSlug}`;
  const tabKey = `labs-course-tab:${courseSlug}`;
  const [courseTab, setCourseTabState] = useState<CourseTab>("About");

  // Persist edit mode + active tab. Structure ops and field saves NEVER reload;
  // tab state lives on this provider so child remounts cannot kick the admin
  // back to About (In-Place Editing System Spec).
  useEffect(() => {
    try {
      if (sessionStorage.getItem(editKey) === "1") setEditModeState(true);
      const savedTab = sessionStorage.getItem(tabKey);
      if (savedTab && isCourseTab(savedTab)) setCourseTabState(savedTab);
    } catch {
      /* private mode */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setEditMode = useCallback(
    (v: boolean) => {
      setEditModeState(v);
      try {
        if (v) sessionStorage.setItem(editKey, "1");
        else sessionStorage.removeItem(editKey);
      } catch {
        /* ignore */
      }
    },
    [editKey],
  );

  const setCourseTab = useCallback(
    (t: CourseTab) => {
      setCourseTabState(t);
      try {
        sessionStorage.setItem(tabKey, t);
      } catch {
        /* ignore */
      }
    },
    [tabKey],
  );

  const scrollLockRef = useRef<number | null>(null);
  const lockScroll = useCallback(() => {
    if (typeof window === "undefined") return;
    scrollLockRef.current = window.scrollY;
  }, []);
  const unlockScroll = useCallback(() => {
    const y = scrollLockRef.current;
    scrollLockRef.current = null;
    if (y == null || typeof window === "undefined") return;
    // Restore after paint so DOM updates from structure refresh do not jump.
    requestAnimationFrame(() => {
      window.scrollTo(0, y);
    });
  }, []);
  const [dirty, setDirty] = useState<Dirty>({});
  const [lessons, setLessons] = useState<Record<string, LessonAdmin>>({});
  const [modules, setModules] = useState<ModuleAdmin[]>([]);
  const [trailerVideoId, setTrailerVideoId] = useState<string | null | undefined>(undefined);
  const [heroImageUrl, setHeroImageUrl] = useState<string | null | undefined>(undefined);
  const [categories, setCategoriesState] = useState<{ slug: string; name: string }[]>([]);
  const [instructors, setInstructorsState] = useState<{ id: number; name: string }[]>([]);
  const [attachments, setAttachments] = useState<
    { id: number; title: string; kind: string; url: string; free_preview?: boolean }[]
  >([]);
  const [status, setStatusState] = useState<string | null>(null);
  const [serverStatus, setServerStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Survives after save without reload — dirty clears but display keeps new values. */
  const [savedBaseline, setSavedBaseline] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    fetchMe().then((me) => {
      if (!cancelled && me?.role === "administrator") setIsAdmin(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const applyAdmin = useCallback((d: Parameters<typeof mapAdminPayload>[0]) => {
    const mapped = mapAdminPayload(d);
    setLessons(mapped.lessons);
    setModules(mapped.modules);
    setTrailerVideoId(mapped.trailerVideoId);
    setHeroImageUrl(mapped.heroImageUrl);
    setCategoriesState(mapped.categories);
    setInstructorsState(mapped.instructors);
    setAttachments(mapped.attachments);
    if (mapped.status != null) {
      setServerStatus(mapped.status);
      setStatusState(mapped.status);
    }
  }, []);

  const refreshAdmin = useCallback(async () => {
    const r = await fetch(`/api/admin/courses/${courseSlug}`, {
      credentials: "same-origin",
    });
    if (!r.ok) return;
    const d = await r.json();
    applyAdmin(d);
  }, [courseSlug, applyAdmin]);

  // Entering edit mode: fetch the admin payload for lesson metadata + status.
  useEffect(() => {
    if (!editMode || Object.keys(lessons).length > 0) return;
    let cancelled = false;
    fetch(`/api/admin/courses/${courseSlug}`, { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d) applyAdmin(d);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [editMode, courseSlug, lessons, applyAdmin]);

  // Warn before navigating away with unsaved edits (spec v1.1 §7.3).
  useEffect(() => {
    const dirtyCount = Object.keys(dirty).length;
    if (!dirtyCount) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const setField = useCallback((key: string, val: string | boolean) => {
    setDirty((d) => ({ ...d, [key]: val }));
  }, []);

  const value = useCallback(
    (key: string, fallback: string) =>
      key in dirty
        ? String(dirty[key])
        : key in savedBaseline
          ? savedBaseline[key]
          : fallback,
    [dirty, savedBaseline],
  );

  const discard = useCallback(() => {
    setDirty({});
    setStatusState(serverStatus);
  }, [serverStatus]);

  const save = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const courseBody: Record<string, string> = {};
      const lessonBodies: Record<number, Record<string, unknown>> = {};
      const moduleBodies: Record<number, Record<string, string>> = {};
      const touchedVideo = new Set<number>();

      for (const [key, val] of Object.entries(dirty)) {
        const [scope, ...rest] = key.split(".");
        if (scope === "course") {
          courseBody[rest[0]] = String(val);
        } else if (scope === "module") {
          const id = Number(rest[0]);
          moduleBodies[id] = moduleBodies[id] ?? {};
          moduleBodies[id][rest[1]] = String(val);
        } else if (scope === "lesson") {
          const id = Number(rest[0]);
          const field = rest[1];
          lessonBodies[id] = lessonBodies[id] ?? {};
          if (field.startsWith("video_")) {
            touchedVideo.add(id);
          } else {
            lessonBodies[id][field] = val;
          }
        }
      }
      // Compose full video state for lessons with any video_* edit: dirty value
      // wins, admin baseline fills the rest (server replaces params wholesale).
      for (const id of touchedVideo) {
        const base = Object.values(lessons).find((l) => l.id === id);
        const get = (f: string, fb: string) =>
          `lesson.${id}.${f}` in dirty ? String(dirty[`lesson.${id}.${f}`]) : fb;
        const videoId = get("video_id", base?.video_id ?? "");
        const params: Record<string, string> = { ...(base?.video_params ?? {}) };
        const start = get("video_start", params.start ?? "");
        const end = get("video_end", params.end ?? "");
        if (start) params.start = start; else delete params.start;
        if (end) params.end = end; else delete params.end;
        lessonBodies[id] = lessonBodies[id] ?? {};
        lessonBodies[id].video_id = videoId || null;
        lessonBodies[id].video_params = params;
      }
      if (status && status !== serverStatus) courseBody.status = status;

      if (Object.keys(courseBody).length) {
        const r = await fetch(`/api/admin/courses/${courseSlug}`, {
          method: "PUT",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(courseBody),
        });
        if (!r.ok) throw new Error(`course save ${r.status}: ${await r.text()}`);
      }
      for (const [id, body] of Object.entries(moduleBodies)) {
        const r = await fetch(`/api/admin/modules/${id}`, {
          method: "PUT",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!r.ok) throw new Error(`module ${id} save ${r.status}: ${await r.text()}`);
      }
      for (const [id, body] of Object.entries(lessonBodies)) {
        const r = await fetch(`/api/admin/lessons/${id}`, {
          method: "PUT",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!r.ok) throw new Error(`lesson ${id} save ${r.status}: ${await r.text()}`);
      }
      // Revalidate public HTML for other visitors — do not leave this page.
      await fetch("/api/revalidate", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: `/courses/${courseSlug}` }),
      }).catch(() => null);

      // Fold dirty values into baseline + local admin models so the UI stays put
      // (true in-place: no tab reset, no scroll jump from reload).
      const snapshot = { ...dirty };
      setSavedBaseline((b) => {
        const next = { ...b };
        for (const [k, v] of Object.entries(snapshot)) {
          next[k] = String(v);
        }
        return next;
      });
      const asBool = (v: string | boolean) =>
        v === true || v === "true" || v === "1";

      setModules((mods) =>
        mods.map((m) => {
          const titleK = `module.${m.module_id}.title`;
          const kindK = `module.${m.module_id}.kind`;
          return {
            ...m,
            title:
              titleK in snapshot ? String(snapshot[titleK]) : m.title,
            kind: kindK in snapshot ? String(snapshot[kindK]) : m.kind,
            lessons: m.lessons.map((l) => {
              const tK = `lesson.${l.id}.title`;
              const kindK = `lesson.${l.id}.kind`;
              const freeK = `lesson.${l.id}.free_preview`;
              const vidK = `lesson.${l.id}.video_id`;
              const startK = `lesson.${l.id}.video_start`;
              const endK = `lesson.${l.id}.video_end`;
              const params = { ...l.video_params };
              if (startK in snapshot) {
                const s = String(snapshot[startK]);
                if (s) params.start = s;
                else delete params.start;
              }
              if (endK in snapshot) {
                const s = String(snapshot[endK]);
                if (s) params.end = s;
                else delete params.end;
              }
              return {
                ...l,
                title: tK in snapshot ? String(snapshot[tK]) : l.title,
                kind: kindK in snapshot ? String(snapshot[kindK]) : l.kind,
                free_preview:
                  freeK in snapshot
                    ? asBool(snapshot[freeK])
                    : l.free_preview,
                video_id:
                  vidK in snapshot
                    ? String(snapshot[vidK]) || null
                    : l.video_id,
                video_params: params,
              };
            }),
          };
        }),
      );
      setLessons((map) => {
        const next = { ...map };
        for (const l of Object.values(next)) {
          const tK = `lesson.${l.id}.title`;
          const kindK = `lesson.${l.id}.kind`;
          const freeK = `lesson.${l.id}.free_preview`;
          const vidK = `lesson.${l.id}.video_id`;
          const startK = `lesson.${l.id}.video_start`;
          const endK = `lesson.${l.id}.video_end`;
          const params = { ...l.video_params };
          if (startK in snapshot) {
            const s = String(snapshot[startK]);
            if (s) params.start = s;
            else delete params.start;
          }
          if (endK in snapshot) {
            const s = String(snapshot[endK]);
            if (s) params.end = s;
            else delete params.end;
          }
          next[l.slug] = {
            ...l,
            title: tK in snapshot ? String(snapshot[tK]) : l.title,
            kind: kindK in snapshot ? String(snapshot[kindK]) : l.kind,
            free_preview:
              freeK in snapshot ? asBool(snapshot[freeK]) : l.free_preview,
            video_id:
              vidK in snapshot ? String(snapshot[vidK]) || null : l.video_id,
            video_params: params,
          };
        }
        return next;
      });
      if ("course.trailer_video_id" in snapshot) {
        setTrailerVideoId(String(snapshot["course.trailer_video_id"]) || null);
      }
      if ("course.hero_image_url" in snapshot) {
        setHeroImageUrl(String(snapshot["course.hero_image_url"]) || null);
      }
      if (status) {
        setServerStatus(status);
        setStatusState(status);
      }
      setDirty({});
      setSaving(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setSaving(false);
    }
  }, [dirty, status, serverStatus, courseSlug, lessons]);

  /**
   * Structure mutations (create/delete/reorder/attach) — never reload, never
   * change tab, never jump scroll. Server is authoritative; after success we
   * re-fetch the admin graph into local state and revalidate public HTML for
   * *other* visitors only (no navigation of this session).
   */
  const structureOp = useCallback(
    async (run: () => Promise<Response>): Promise<Response | null> => {
      if (Object.keys(dirty).length > 0) {
        await appAlert({
          title: "Unsaved edits",
          message: "Save or discard your pending edits first.",
        });
        return null;
      }
      setError(null);
      lockScroll();
      // Pin the Modules (or current) tab for the whole op — defensive against
      // any child remount during the subsequent setState cascade.
      const pinnedTab = courseTab;
      try {
        const r = await run();
        if (!r.ok) {
          setError(`Structure change failed (${r.status}): ${await r.text()}`);
          await refreshAdmin().catch(() => null);
          return null;
        }
        // Public cache only — do not navigate or reload the admin session.
        void revalidatePages([`/courses/${courseSlug}`]);
        await refreshAdmin();
        // Re-assert tab after any setState cascade (non-negotiable: stay put).
        setCourseTab(pinnedTab);
        return r;
      } finally {
        unlockScroll();
      }
    },
    [dirty, courseSlug, refreshAdmin, lockScroll, unlockScroll, courseTab, setCourseTab],
  );

  const createModule = useCallback(() => {
    void structureOp(async () => {
      const r = await fetch(`/api/admin/courses/${courseSlug}/modules`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (r.ok) {
        const body = (await r.clone().json().catch(() => null)) as {
          module_id?: number;
        } | null;
        if (body?.module_id != null) {
          // Optimistic row so the Modules list grows without waiting on refresh.
          setModules((prev) => [
            ...prev,
            {
              module_id: body.module_id!,
              title: "New Module",
              kind: "standard",
              lessons: [],
            },
          ]);
        }
      }
      return r;
    });
  }, [structureOp, courseSlug]);

  const createLesson = useCallback(
    (moduleId: number) => {
      void structureOp(async () => {
        const r = await fetch(`/api/admin/modules/${moduleId}/lessons`, {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        if (r.ok) {
          const body = (await r.clone().json().catch(() => null)) as {
            id?: number;
            slug?: string;
          } | null;
          if (body?.id != null && body.slug) {
            const la: LessonAdmin = {
              id: body.id,
              slug: body.slug,
              title: "New Lesson",
              kind: "video",
              duration_seconds: 0,
              video_id: null,
              video_params: {},
              free_preview: false,
            };
            setLessons((map) => ({ ...map, [body.slug!]: la }));
            setModules((prev) =>
              prev.map((m) =>
                m.module_id === moduleId
                  ? { ...m, lessons: [...m.lessons, la] }
                  : m,
              ),
            );
          }
        }
        return r;
      });
    },
    [structureOp],
  );

  const deleteModule = useCallback(
    async (moduleId: number, title?: string) => {
      const label = (title || "this module").trim() || "this module";
      const ok = await appConfirm({
        title: `Delete module “${label}”?`,
        message:
          "All lessons in this module will be permanently deleted.\nThis cannot be undone.",
        confirmLabel: "Delete",
        destructive: true,
      });
      if (!ok) return;
      structureOp(() =>
        fetch(`/api/admin/modules/${moduleId}`, {
          method: "DELETE",
          credentials: "same-origin",
        }),
      );
    },
    [structureOp],
  );

  const deleteLesson = useCallback(
    async (lessonId: number, title?: string) => {
      const label = (title || "this lesson").trim() || "this lesson";
      const ok = await appConfirm({
        title: `Delete lesson “${label}”?`,
        message: "This cannot be undone.",
        confirmLabel: "Delete",
        destructive: true,
      });
      if (!ok) return;
      structureOp(() =>
        fetch(`/api/admin/lessons/${lessonId}`, {
          method: "DELETE",
          credentials: "same-origin",
        }),
      );
    },
    [structureOp],
  );

  const jsonOp = useCallback(
    (url: string, method: string, body?: unknown) => {
      structureOp(() =>
        fetch(url, {
          method,
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
        }),
      );
    },
    [structureOp],
  );

  const reorderModules = useCallback(
    (ids: number[]) => {
      // Optimistic local order so the list moves without a flash of stale SSR props.
      setModules((prev) => {
        const byId = new Map(prev.map((m) => [m.module_id, m]));
        return ids
          .map((id) => byId.get(id))
          .filter((m): m is ModuleAdmin => m != null);
      });
      jsonOp(`/api/admin/courses/${courseSlug}/reorder-modules`, "POST", {
        module_ids: ids,
      });
    },
    [jsonOp, courseSlug],
  );
  const reorderLessons = useCallback(
    (moduleId: number, ids: number[]) => {
      setModules((prev) =>
        prev.map((m) => {
          if (m.module_id !== moduleId) return m;
          const byId = new Map(m.lessons.map((l) => [l.id, l]));
          return {
            ...m,
            lessons: ids
              .map((id) => byId.get(id))
              .filter((l): l is LessonAdmin => l != null),
          };
        }),
      );
      jsonOp(`/api/admin/modules/${moduleId}/reorder-lessons`, "POST", {
        lesson_ids: ids,
      });
    },
    [jsonOp],
  );
  const setCategories = useCallback(
    (slugs: string[]) =>
      jsonOp(`/api/admin/courses/${courseSlug}/categories`, "PUT", {
        category_slugs: slugs,
      }),
    [jsonOp, courseSlug],
  );
  const setInstructors = useCallback(
    (ids: number[]) =>
      jsonOp(`/api/admin/courses/${courseSlug}/instructors`, "PUT", {
        instructor_ids: ids,
      }),
    [jsonOp, courseSlug],
  );
  const addAttachment = useCallback(
    (a: { title: string; kind: string; url: string; free_preview?: boolean }) =>
      jsonOp(`/api/admin/courses/${courseSlug}/attachments`, "POST", a),
    [jsonOp, courseSlug],
  );
  const updateAttachment = useCallback(
    (id: number, patch: Record<string, string>) =>
      jsonOp(`/api/admin/attachments/${id}`, "PUT", patch),
    [jsonOp],
  );
  const removeAttachment = useCallback(
    async (id: number) => {
      const ok = await appConfirm({
        title: "Delete this attachment?",
        message: "This cannot be undone.",
        confirmLabel: "Delete",
        destructive: true,
      });
      if (!ok) return;
      jsonOp(`/api/admin/attachments/${id}`, "DELETE");
    },
    [jsonOp],
  );
  const uploadHero = useCallback(
    (file: File) => {
      structureOp(async () => {
        const form = new FormData();
        form.append("file", file);
        const up = await fetch("/api/admin/media", {
          method: "POST",
          credentials: "same-origin",
          body: form,
        });
        if (!up.ok) return up;
        const { url } = await up.json();
        return fetch(`/api/admin/courses/${courseSlug}`, {
          method: "PUT",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hero_image_url: url }),
        });
      });
    },
    [structureOp, courseSlug],
  );

  return (
    <Ctx.Provider
      value={{
        isAdmin,
        editMode,
        setEditMode,
        courseTab,
        setCourseTab,
        dirty,
        setField,
        value,
        lessons,
        modules,
        trailerVideoId,
        heroImageUrl,
        categories,
        instructors,
        attachments,
        reorderModules,
        reorderLessons,
        setCategories,
        setInstructors,
        addAttachment,
        updateAttachment,
        removeAttachment,
        uploadHero,
        createModule,
        createLesson,
        deleteModule,
        deleteLesson,
        status,
        setStatus: setStatusState,
        saving,
        error,
        save,
        discard,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
