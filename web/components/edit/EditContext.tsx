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
  slug: string;
  title: string;
  kind: string;
  lessons: LessonAdmin[];
};

/** Normalize GET /api/admin/courses/:slug into edit-engine state shapes. */
function mapAdminPayload(d: {
  id?: number;
  modules?: Array<{
    module_id: number;
    slug?: string;
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
  courseId: number | null;
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
      slug: m.slug || `module-${m.module_id}`,
      title: m.title,
      kind: m.kind,
      lessons: ls,
    });
  }
  return {
    courseId: d.id != null ? Number(d.id) : null,
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

/**
 * After a rename, rewrite the browser path so /course/{c}/{m}/{l} still
 * addresses the same ids (content), not a stale slug.
 */
function rewriteCourseBrowserPath(opts: {
  prevCourseSlug: string;
  nextCourseSlug: string;
  prevModules: ModuleAdmin[];
  moduleSlugById: Record<number, string>;
  lessonSlugById: Record<number, string>;
}): void {
  if (typeof window === "undefined") return;
  const path = window.location.pathname;
  const lessonMatch = path.match(
    /^\/course\/([^/]+)\/([^/]+)\/([^/]+)\/?$/,
  );
  const courseMatch = path.match(/^\/course\/([^/]+)\/?$/);

  const {
    prevCourseSlug,
    nextCourseSlug,
    prevModules,
    moduleSlugById,
    lessonSlugById,
  } = opts;

  if (lessonMatch && decodeURIComponent(lessonMatch[1]) === prevCourseSlug) {
    const oldModSlug = decodeURIComponent(lessonMatch[2]);
    const oldLesSlug = decodeURIComponent(lessonMatch[3]);
    let modId: number | null = null;
    let lesId: number | null = null;
    for (const m of prevModules) {
      if (m.slug === oldModSlug) {
        modId = m.module_id;
        for (const l of m.lessons) {
          if (l.slug === oldLesSlug) {
            lesId = l.id;
            break;
          }
        }
        break;
      }
    }
    if (modId != null && lesId != null) {
      const newMod =
        moduleSlugById[modId] ??
        prevModules.find((m) => m.module_id === modId)?.slug ??
        oldModSlug;
      const newLes =
        lessonSlugById[lesId] ??
        prevModules
          .flatMap((m) => m.lessons)
          .find((l) => l.id === lesId)?.slug ??
        oldLesSlug;
      const next = `/course/${encodeURIComponent(nextCourseSlug)}/${encodeURIComponent(newMod)}/${encodeURIComponent(newLes)}`;
      // Full navigation so the lesson page re-resolves slug → same content id.
      if (next !== path) {
        window.location.replace(next);
      }
      return;
    }
  }

  if (courseMatch && decodeURIComponent(courseMatch[1]) === prevCourseSlug) {
    if (nextCourseSlug !== prevCourseSlug) {
      window.location.assign(`/course/${encodeURIComponent(nextCourseSlug)}`);
    }
  }
}

type EditState = {
  isAdmin: boolean;
  editMode: boolean;
  setEditMode: (v: boolean) => void;
  /**
   * Option/Alt+click entry: turn on edit mode and mark this field to open.
   * Editable* components open when pendingOpenField matches their field key.
   */
  enterEditAtField: (field: string) => void;
  /** Field key to open after Option+click entry; cleared shortly after enter. */
  pendingOpenField: string | null;
  /** Active course tab — lives here so CRUD never remounts the tab capsule. */
  courseTab: CourseTab;
  setCourseTab: (t: CourseTab) => void;
  /** Live public course slug (tracks renames so Open links stay correct). */
  courseSlug: string;
  /** Stable course id when known from admin payload. */
  courseId: number | null;
  dirty: Dirty;
  /** Local-only: mark dirty without network (typing mid-field). */
  setField: (key: string, value: string | boolean) => void;
  /**
   * Commit a field and autosave immediately (blur / select / checkbox).
   * Prefer this over setField + Save button.
   */
  commitField: (key: string, value: string | boolean) => Promise<boolean>;
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
  /** ISO time of last successful autosave, or null. */
  lastSavedAt: string | null;
  error: string | null;
  /** Per-field save errors (e.g. name conflicts) — key is dirty field path. */
  fieldErrors: Record<string, string>;
  clearFieldError: (key: string) => void;
  /** Flush any remaining dirty fields (status change, exit, structure prep). */
  save: () => Promise<boolean>;
  discard: () => void;
};

function parseAdminError(text: string): {
  message: string;
  code: string | null;
} {
  try {
    const j = JSON.parse(text) as {
      detail?: string | { message?: string; code?: string; field?: string };
    };
    const d = j.detail;
    if (typeof d === "string") return { message: d, code: null };
    if (d && typeof d === "object") {
      return {
        message: d.message || text,
        code: d.code || null,
      };
    }
  } catch {
    /* plain text */
  }
  return { message: text || "Save failed", code: null };
}

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
  const tabKey = `labs-course-tab:${courseSlug}`;
  const [courseTab, setCourseTabState] = useState<CourseTab>("About");

  /** Edit mode is URL-backed (`?edit=1`), not sessionStorage.
   * Enter → pushState (Back exits edit). Exit → replaceState (this history
   * entry is view-only, so Back/Forward cannot re-enter edit after Exit). */
  function readEditFromUrl(): boolean {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).get("edit") === "1";
  }

  useEffect(() => {
    setEditModeState(readEditFromUrl());
    const syncFromHistory = () => setEditModeState(readEditFromUrl());
    window.addEventListener("popstate", syncFromHistory);
    window.addEventListener("pageshow", syncFromHistory);
    try {
      // Drop legacy sessionStorage edit flag so old sessions cannot force edit.
      sessionStorage.removeItem(`labs-edit-mode:${courseSlug}`);
      const savedTab = sessionStorage.getItem(tabKey);
      if (savedTab && isCourseTab(savedTab)) setCourseTabState(savedTab);
    } catch {
      /* private mode */
    }
    return () => {
      window.removeEventListener("popstate", syncFromHistory);
      window.removeEventListener("pageshow", syncFromHistory);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Field to open after Option/Alt+click enters edit mode. */
  const [pendingOpenField, setPendingOpenField] = useState<string | null>(null);

  const setEditMode = useCallback((v: boolean) => {
    if (!v) setPendingOpenField(null);
    setEditModeState(v);
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (v) url.searchParams.set("edit", "1");
    else url.searchParams.delete("edit");
    const next = `${url.pathname}${url.search}${url.hash}`;
    if (v) {
      // Push so browser Back returns to view mode of this course.
      window.history.pushState({ labsEdit: true }, "", next);
    } else {
      // Replace so the current history entry is view mode — navigating away
      // and Back cannot resurrect edit mode after Exit.
      window.history.replaceState({ labsEdit: false }, "", next);
    }
  }, []);

  const enterEditAtField = useCallback(
    (field: string) => {
      setPendingOpenField(field);
      setEditMode(true);
    },
    [setEditMode],
  );

  // Clear after a beat so React Strict Mode remount still sees the target,
  // but Escape / re-renders later won't re-open the field.
  useEffect(() => {
    if (!pendingOpenField || !editMode) return;
    const t = window.setTimeout(() => setPendingOpenField(null), 150);
    return () => window.clearTimeout(t);
  }, [pendingOpenField, editMode]);

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
  const [courseId, setCourseId] = useState<number | null>(null);
  /** Tracks live public slug after renames (prop is the route slug at mount). */
  const [liveCourseSlug, setLiveCourseSlug] = useState(courseSlug);
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
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  /** Survives after save without reload — dirty clears but display keeps new values. */
  const [savedBaseline, setSavedBaseline] = useState<Record<string, string>>({});

  // Refs keep the autosave queue concurrent-safe (blur while a prior save runs).
  const dirtyRef = useRef<Dirty>({});
  const lessonsRef = useRef(lessons);
  const modulesRef = useRef(modules);
  const statusRef = useRef(status);
  const serverStatusRef = useRef(serverStatus);
  const liveCourseSlugRef = useRef(liveCourseSlug);
  const saveChainRef = useRef(Promise.resolve());
  useEffect(() => {
    dirtyRef.current = dirty;
  }, [dirty]);
  useEffect(() => {
    lessonsRef.current = lessons;
  }, [lessons]);
  useEffect(() => {
    modulesRef.current = modules;
  }, [modules]);
  useEffect(() => {
    statusRef.current = status;
  }, [status]);
  useEffect(() => {
    serverStatusRef.current = serverStatus;
  }, [serverStatus]);
  useEffect(() => {
    liveCourseSlugRef.current = liveCourseSlug;
  }, [liveCourseSlug]);
  useEffect(() => {
    setLiveCourseSlug(courseSlug);
  }, [courseSlug]);

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
    if (mapped.courseId != null) setCourseId(mapped.courseId);
    setLessons(mapped.lessons);
    setModules(mapped.modules);
    modulesRef.current = mapped.modules;
    lessonsRef.current = mapped.lessons;
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

  // Load admin structure when editing, or when admin so Modules tab stays
  // truthful after Exit (SSR/public course.modules is often stale).
  useEffect(() => {
    if (!isAdmin && !editMode) return;
    if (modules.length > 0 || Object.keys(lessons).length > 0) return;
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
  }, [isAdmin, editMode, courseSlug, lessons, modules.length, applyAdmin]);

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

  const clearFieldError = useCallback((key: string) => {
    setFieldErrors((fe) => {
      if (!(key in fe)) return fe;
      const next = { ...fe };
      delete next[key];
      return next;
    });
  }, []);

  const setField = useCallback((key: string, val: string | boolean) => {
    clearFieldError(key);
    setDirty((d) => {
      const next = { ...d, [key]: val };
      dirtyRef.current = next;
      return next;
    });
  }, [clearFieldError]);

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
    dirtyRef.current = {};
    setDirty({});
    setFieldErrors({});
    setStatusState(serverStatusRef.current);
    statusRef.current = serverStatusRef.current;
  }, []);

  /** One network flush of current dirty + pending status change. */
  const flushSave = useCallback(async (): Promise<boolean> => {
    const snapshot = { ...dirtyRef.current };
    const statusSnap = statusRef.current;
    const serverStatusSnap = serverStatusRef.current;
    const lessonsSnap = lessonsRef.current;
    if (
      Object.keys(snapshot).length === 0 &&
      statusSnap === serverStatusSnap
    ) {
      return true;
    }

    setSaving(true);
    setError(null);
    try {
      const prevModules = modulesRef.current;
      const prevCourseSlug = liveCourseSlugRef.current;
      const courseBody: Record<string, string> = {};
      const lessonBodies: Record<number, Record<string, unknown>> = {};
      const moduleBodies: Record<number, Record<string, string>> = {};
      const touchedVideo = new Set<number>();

      for (const [key, val] of Object.entries(snapshot)) {
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
      for (const id of touchedVideo) {
        const base = Object.values(lessonsSnap).find((l) => l.id === id);
        const get = (f: string, fb: string) =>
          `lesson.${id}.${f}` in snapshot
            ? String(snapshot[`lesson.${id}.${f}`])
            : fb;
        const videoId = get("video_id", base?.video_id ?? "");
        const params: Record<string, string> = {
          ...(base?.video_params ?? {}),
        };
        const start = get("video_start", params.start ?? "");
        const end = get("video_end", params.end ?? "");
        if (start) params.start = start;
        else delete params.start;
        if (end) params.end = end;
        else delete params.end;
        lessonBodies[id] = lessonBodies[id] ?? {};
        lessonBodies[id].video_id = videoId || null;
        lessonBodies[id].video_params = params;
      }
      if (statusSnap && statusSnap !== serverStatusSnap) {
        courseBody.status = statusSnap;
      }

      let nextCourseSlug = prevCourseSlug;
      let nextCourseId = courseId;
      if (Object.keys(courseBody).length) {
        const r = await fetch(`/api/admin/courses/${prevCourseSlug}`, {
          method: "PUT",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(courseBody),
        });
        if (!r.ok) {
          const raw = await r.text();
          const { message, code } = parseAdminError(raw);
          if (code === "NAME_CONFLICT" || r.status === 409) {
            setFieldErrors((fe) => ({
              ...fe,
              "course.title": message,
            }));
          }
          throw new Error(message);
        }
        const payload = (await r.json().catch(() => null)) as {
          id?: number;
          slug?: string;
        } | null;
        if (payload?.slug) nextCourseSlug = payload.slug;
        if (payload?.id != null) nextCourseId = payload.id;
        if ("title" in courseBody) clearFieldError("course.title");
      }
      const moduleSlugById: Record<number, string> = {};
      for (const [id, body] of Object.entries(moduleBodies)) {
        const r = await fetch(`/api/admin/modules/${id}`, {
          method: "PUT",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!r.ok) {
          const raw = await r.text();
          const { message, code } = parseAdminError(raw);
          if (code === "NAME_CONFLICT" || r.status === 409) {
            setFieldErrors((fe) => ({
              ...fe,
              [`module.${id}.title`]: message,
            }));
          }
          throw new Error(message);
        }
        const payload = (await r.json().catch(() => null)) as {
          slug?: string;
        } | null;
        if (payload?.slug) moduleSlugById[Number(id)] = payload.slug;
        if ("title" in body) clearFieldError(`module.${id}.title`);
      }
      const lessonSlugById: Record<number, string> = {};
      for (const [id, body] of Object.entries(lessonBodies)) {
        const r = await fetch(`/api/admin/lessons/${id}`, {
          method: "PUT",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!r.ok) {
          const raw = await r.text();
          const { message, code } = parseAdminError(raw);
          if (code === "NAME_CONFLICT" || r.status === 409) {
            setFieldErrors((fe) => ({
              ...fe,
              [`lesson.${id}.title`]: message,
            }));
          }
          throw new Error(message);
        }
        const payload = (await r.json().catch(() => null)) as {
          slug?: string;
          id?: number;
        } | null;
        if (payload?.slug) {
          lessonSlugById[Number(id)] = payload.slug;
        }
        if ("title" in body) clearFieldError(`lesson.${id}.title`);
      }

      const paths = new Set<string>([
        `/course/${courseSlug}`,
        `/course/${nextCourseSlug}`,
        "/course",
      ]);
      if (statusSnap && statusSnap !== serverStatusSnap) {
        paths.add("/course");
      }
      await Promise.all(
        [...paths].map((path) =>
          fetch("/api/revalidate", {
            method: "POST",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ path }),
          }).catch(() => null),
        ),
      );

      setSavedBaseline((b) => {
        const next = { ...b };
        for (const [k, v] of Object.entries(snapshot)) {
          next[k] = String(v);
        }
        return next;
      });
      const asBool = (v: string | boolean) =>
        v === true || v === "true" || v === "1";

      setModules((mods) => {
        const nextMods = mods.map((m) => {
          const titleK = `module.${m.module_id}.title`;
          const kindK = `module.${m.module_id}.kind`;
          const newModSlug = moduleSlugById[m.module_id];
          return {
            ...m,
            slug: newModSlug ?? m.slug,
            title: titleK in snapshot ? String(snapshot[titleK]) : m.title,
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
              const newSlug = lessonSlugById[l.id];
              return {
                ...l,
                slug: newSlug ?? l.slug,
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
        });
        modulesRef.current = nextMods;
        return nextMods;
      });
      setLessons((map) => {
        const next: Record<string, LessonAdmin> = {};
        for (const l of Object.values(map)) {
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
          const newSlug = lessonSlugById[l.id] ?? l.slug;
          const updated: LessonAdmin = {
            ...l,
            slug: newSlug,
            title: tK in snapshot ? String(snapshot[tK]) : l.title,
            kind: kindK in snapshot ? String(snapshot[kindK]) : l.kind,
            free_preview:
              freeK in snapshot ? asBool(snapshot[freeK]) : l.free_preview,
            video_id:
              vidK in snapshot ? String(snapshot[vidK]) || null : l.video_id,
            video_params: params,
          };
          // Re-key by slug; id is the stable identity for content.
          next[newSlug] = updated;
        }
        lessonsRef.current = next;
        return next;
      });
      if ("course.trailer_video_id" in snapshot) {
        setTrailerVideoId(String(snapshot["course.trailer_video_id"]) || null);
      }
      if ("course.hero_image_url" in snapshot) {
        setHeroImageUrl(String(snapshot["course.hero_image_url"]) || null);
      }
      if (statusSnap) {
        setServerStatus(statusSnap);
        serverStatusRef.current = statusSnap;
        setStatusState(statusSnap);
        statusRef.current = statusSnap;
      }

      // Drop only fields that still match what we just saved (keep newer edits).
      setDirty((d) => {
        const next = { ...d };
        for (const [k, v] of Object.entries(snapshot)) {
          if (next[k] === v) delete next[k];
        }
        dirtyRef.current = next;
        return next;
      });
      if (nextCourseId != null) setCourseId(nextCourseId);
      setLiveCourseSlug(nextCourseSlug);
      liveCourseSlugRef.current = nextCourseSlug;
      setLastSavedAt(new Date().toISOString());
      setSaving(false);

      // Keep the address bar on the same content ids after any slug rewrite.
      rewriteCourseBrowserPath({
        prevCourseSlug,
        nextCourseSlug,
        prevModules,
        moduleSlugById,
        lessonSlugById,
      });

      // Full navigation only when the course page itself must remount (new slug
      // on the course detail route, or first publish).
      if (
        statusSnap === "published" &&
        serverStatusSnap !== "published"
      ) {
        window.location.assign(
          `/course/${encodeURIComponent(nextCourseSlug)}`,
        );
        return true;
      }
      if (
        nextCourseSlug !== prevCourseSlug &&
        typeof window !== "undefined" &&
        !/^\/course\/[^/]+\/[^/]+\/[^/]+\/?$/.test(window.location.pathname)
      ) {
        window.location.assign(
          `/course/${encodeURIComponent(nextCourseSlug)}`,
        );
      }
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setSaving(false);
      return false;
    }
  }, [courseSlug, courseId, clearFieldError]);

  /** Serialize autosaves so blur A + blur B never race. */
  const save = useCallback((): Promise<boolean> => {
    const run = flushSave;
    const p = saveChainRef.current.then(run);
    saveChainRef.current = p.then(
      () => undefined,
      () => undefined,
    );
    return p;
  }, [flushSave]);

  const commitField = useCallback(
    async (key: string, val: string | boolean): Promise<boolean> => {
      const next = { ...dirtyRef.current, [key]: val };
      dirtyRef.current = next;
      setDirty(next);
      return save();
    },
    [save],
  );

  const setStatus = useCallback(
    (s: string) => {
      setStatusState(s);
      statusRef.current = s;
      void save();
    },
    [save],
  );

  /**
   * Structure mutations (create/delete/reorder/attach) — never reload, never
   * change tab, never jump scroll. Autosaves pending field edits first so
   * creating another module/lesson is never blocked by "save first".
   */
  const structureOp = useCallback(
    async (run: () => Promise<Response>): Promise<Response | null> => {
      if (
        Object.keys(dirtyRef.current).length > 0 ||
        statusRef.current !== serverStatusRef.current
      ) {
        const ok = await save();
        if (!ok) {
          await appAlert({
            title: "Could not save",
            message:
              "Fix the error shown in the edit bar, then try the structure change again.",
          });
          return null;
        }
      }
      setError(null);
      lockScroll();
      const pinnedTab = courseTab;
      try {
        const r = await run();
        if (!r.ok) {
          setError(`Structure change failed (${r.status}): ${await r.text()}`);
          await refreshAdmin().catch(() => null);
          return null;
        }
        void revalidatePages([`/course/${courseSlug}`]);
        await refreshAdmin();
        setCourseTab(pinnedTab);
        return r;
      } finally {
        unlockScroll();
      }
    },
    [
      save,
      courseSlug,
      refreshAdmin,
      lockScroll,
      unlockScroll,
      courseTab,
      setCourseTab,
    ],
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
          const full = body as {
            module_id: number;
            slug?: string;
          };
          // Optimistic row so the Modules list grows without waiting on refresh.
          setModules((prev) => [
            ...prev,
            {
              module_id: full.module_id,
              slug: full.slug || `new-module-${full.module_id}`,
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
        enterEditAtField,
        pendingOpenField,
        courseTab,
        setCourseTab,
        courseSlug: liveCourseSlug,
        courseId,
        dirty,
        setField,
        commitField,
        value,
        fieldErrors,
        clearFieldError,
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
        setStatus,
        saving,
        lastSavedAt,
        error,
        save,
        discard,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
