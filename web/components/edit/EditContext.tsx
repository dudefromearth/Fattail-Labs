"use client";

// Edit-mode engine (In-Place Admin spec v1.1). Holds admin state, the dirty set,
// lesson slug->id mapping, and the save pipeline. Editable components consume this;
// all authority stays server-side at the admin API.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

type Dirty = Record<string, string | boolean>;

export type LessonAdmin = {
  id: number;
  slug: string;
  title: string;
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

type EditState = {
  isAdmin: boolean;
  editMode: boolean;
  setEditMode: (v: boolean) => void;
  dirty: Dirty;
  setField: (key: string, value: string | boolean) => void;
  value: (key: string, fallback: string) => string;
  lessons: Record<string, LessonAdmin>;
  modules: ModuleAdmin[];
  createModule: () => void;
  createLesson: (moduleId: number) => void;
  deleteModule: (moduleId: number) => void;
  deleteLesson: (lessonId: number) => void;
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [editMode, setEditModeState] = useState(false);
  const editKey = `labs-edit-mode:${courseSlug}`;

  // Edit mode survives the reloads that structure changes trigger (spec v1.2 §2).
  useEffect(() => {
    if (sessionStorage.getItem(editKey) === "1") setEditModeState(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const setEditMode = useCallback(
    (v: boolean) => {
      setEditModeState(v);
      if (v) sessionStorage.setItem(editKey, "1");
      else sessionStorage.removeItem(editKey);
    },
    [editKey],
  );
  const [dirty, setDirty] = useState<Dirty>({});
  const [lessons, setLessons] = useState<Record<string, LessonAdmin>>({});
  const [modules, setModules] = useState<ModuleAdmin[]>([]);
  const [status, setStatusState] = useState<string | null>(null);
  const [serverStatus, setServerStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((me) => {
        if (!cancelled && me?.role === "administrator") setIsAdmin(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Entering edit mode: fetch the admin payload for lesson metadata + status.
  useEffect(() => {
    if (!editMode || Object.keys(lessons).length > 0) return;
    fetch(`/api/admin/courses/${courseSlug}`, { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        const map: Record<string, LessonAdmin> = {};
        for (const m of d.modules)
          for (const l of m.lessons)
            map[l.slug] = {
              id: l.id,
              slug: l.slug,
              title: l.title,
              video_id: l.video_id,
              video_params: l.video_params ?? {},
              free_preview: l.free_preview,
            };
        setLessons(map);
        setModules(d.modules);
        setServerStatus(d.status);
        setStatusState(d.status);
      })
      .catch(() => {});
  }, [editMode, courseSlug, lessons]);

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
      key in dirty ? String(dirty[key]) : fallback,
    [dirty],
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
      const r = await fetch("/api/revalidate", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: `/courses/${courseSlug}` }),
      });
      if (!r.ok) throw new Error(`revalidate ${r.status}`);
      setDirty({});
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setSaving(false);
    }
  }, [dirty, status, serverStatus, courseSlug, lessons]);

  const structureOp = useCallback(
    async (run: () => Promise<Response>) => {
      if (Object.keys(dirty).length > 0) {
        alert("Save or discard your pending edits first.");
        return;
      }
      setError(null);
      const r = await run();
      if (!r.ok) {
        setError(`Structure change failed (${r.status}): ${await r.text()}`);
        return;
      }
      await fetch("/api/revalidate", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: `/courses/${courseSlug}` }),
      });
      window.location.reload();
    },
    [dirty, courseSlug],
  );

  const createModule = useCallback(() => {
    structureOp(() =>
      fetch(`/api/admin/courses/${courseSlug}/modules`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }),
    );
  }, [structureOp, courseSlug]);

  const createLesson = useCallback(
    (moduleId: number) => {
      structureOp(() =>
        fetch(`/api/admin/modules/${moduleId}/lessons`, {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }),
      );
    },
    [structureOp],
  );

  const deleteModule = useCallback(
    (moduleId: number) => {
      if (!confirm("Delete this module and all its lessons?")) return;
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
    (lessonId: number) => {
      if (!confirm("Delete this lesson?")) return;
      structureOp(() =>
        fetch(`/api/admin/lessons/${lessonId}`, {
          method: "DELETE",
          credentials: "same-origin",
        }),
      );
    },
    [structureOp],
  );

  return (
    <Ctx.Provider
      value={{
        isAdmin,
        editMode,
        setEditMode,
        dirty,
        setField,
        value,
        lessons,
        modules,
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
