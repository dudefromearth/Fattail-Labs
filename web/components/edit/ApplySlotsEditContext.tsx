"use client";

// Apply conversation slots — same in-place field API as course EditContext.
// The element IS the editor. Blur / Enter commits. URL `?edit=1`.

import { fetchMe } from "@/lib/useIsAdmin";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { FieldEditApi } from "./fieldEdit";

export type ApplySlot = {
  id: number;
  starts_et: string;
  sort_order?: number;
  live?: boolean;
};

type Ctx = FieldEditApi & {
  setEditMode: (v: boolean) => void;
  slots: ApplySlot[];
  liveSlots: ApplySlot[];
  liveError: string | null;
  reload: () => Promise<void>;
  addSlot: () => Promise<void>;
  removeSlot: (id: number) => Promise<void>;
  saving: boolean;
  lastSavedAt: string | null;
  error: string | null;
};

const ApplySlotsEditContext = createContext<Ctx | null>(null);

export function useApplySlotsEdit(): Ctx | null {
  return useContext(ApplySlotsEditContext);
}

function readEditFromUrl(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("edit") === "1";
}

export function ApplySlotsEditProvider({
  children,
  startInEdit = false,
}: {
  children: ReactNode;
  startInEdit?: boolean;
}) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [editMode, setEditModeState] = useState(false);
  const [pendingOpenField, setPendingOpenField] = useState<string | null>(null);
  const [slots, setSlots] = useState<ApplySlot[]>([]);
  const [liveSlots, setLiveSlots] = useState<ApplySlot[]>([]);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchMe().then((me) => {
      if (!cancelled && me?.role === "administrator") setIsAdmin(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setEditModeState(startInEdit || readEditFromUrl());
    const syncFromHistory = () =>
      setEditModeState(startInEdit || readEditFromUrl());
    window.addEventListener("popstate", syncFromHistory);
    window.addEventListener("pageshow", syncFromHistory);
    return () => {
      window.removeEventListener("popstate", syncFromHistory);
      window.removeEventListener("pageshow", syncFromHistory);
    };
  }, [startInEdit]);

  const setEditMode = useCallback((v: boolean) => {
    if (!v) setPendingOpenField(null);
    setEditModeState(v);
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (v) url.searchParams.set("edit", "1");
    else url.searchParams.delete("edit");
    const next = `${url.pathname}${url.search}${url.hash}`;
    if (v) window.history.pushState({ labsEdit: true }, "", next);
    else window.history.replaceState({ labsEdit: false }, "", next);
  }, []);

  const enterEditAtField = useCallback(
    (field: string) => {
      setPendingOpenField(field);
      setEditMode(true);
    },
    [setEditMode],
  );

  useEffect(() => {
    if (!pendingOpenField || !editMode) return;
    const t = window.setTimeout(() => setPendingOpenField(null), 150);
    return () => window.clearTimeout(t);
  }, [pendingOpenField, editMode]);

  const clearFieldError = useCallback((key: string) => {
    setFieldErrors((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const loadPublic = useCallback(async () => {
    try {
      const r = await fetch("/api/apply/slots", { credentials: "same-origin" });
      const body = await r.json().catch(() => null);
      if (!r.ok || body?.ok !== true || !Array.isArray(body?.slots)) {
        const detail =
          typeof body?.detail === "string"
            ? body.detail
            : "Conversation times did not load.";
        setLiveSlots([]);
        setLiveError(detail);
        return;
      }
      setLiveSlots(body.slots as ApplySlot[]);
      setLiveError(null);
    } catch {
      setLiveSlots([]);
      setLiveError("Conversation times did not load. Network error.");
    }
  }, []);

  const loadAdmin = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const r = await fetch("/api/admin/apply/slots", {
        credentials: "same-origin",
      });
      const body = await r.json().catch(() => null);
      if (!r.ok || body?.ok !== true || !Array.isArray(body?.slots)) {
        setError(
          typeof body?.detail === "string"
            ? body.detail
            : "Apply slots did not load.",
        );
        return;
      }
      setSlots(body.slots as ApplySlot[]);
      setError(null);
    } catch {
      setError("Apply slots did not load. Network error.");
    }
  }, [isAdmin]);

  const reload = useCallback(async () => {
    await Promise.all([loadPublic(), loadAdmin()]);
  }, [loadPublic, loadAdmin]);

  useEffect(() => {
    void loadPublic();
  }, [loadPublic]);

  useEffect(() => {
    if (isAdmin) void loadAdmin();
  }, [isAdmin, loadAdmin]);

  const value = useCallback((key: string, fallback: string) => {
    const m = /^slot\.(\d+)\.starts_et$/.exec(key);
    if (!m) return fallback;
    const slot = slots.find((s) => s.id === Number(m[1]));
    return slot ? slot.starts_et : fallback;
  }, [slots]);

  const commitField = useCallback(
    async (key: string, nextValue: string | boolean) => {
      const m = /^slot\.(\d+)\.starts_et$/.exec(key);
      if (!m) {
        setFieldErrors((e) => ({ ...e, [key]: "Unknown apply slot field" }));
        return false;
      }
      const id = Number(m[1]);
      const starts_et = String(nextValue);
      setSaving(true);
      setError(null);
      try {
        const r = await fetch(`/api/admin/apply/slots/${id}`, {
          method: "PATCH",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ starts_et }),
        });
        const body = await r.json().catch(() => null);
        if (!r.ok || body?.ok !== true) {
          const detail =
            typeof body?.detail === "string"
              ? body.detail
              : "That time did not save.";
          setFieldErrors((e) => ({ ...e, [key]: detail }));
          return false;
        }
        const saved = body.slot as ApplySlot;
        setSlots((prev) =>
          prev.map((s) => (s.id === saved.id ? saved : s)),
        );
        setLastSavedAt(new Date().toISOString());
        await loadPublic();
        return true;
      } catch {
        setFieldErrors((e) => ({
          ...e,
          [key]: "That time did not save. Network error.",
        }));
        return false;
      } finally {
        setSaving(false);
      }
    },
    [loadPublic],
  );

  const addSlot = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const r = await fetch("/api/admin/apply/slots", {
        method: "POST",
        credentials: "same-origin",
      });
      const body = await r.json().catch(() => null);
      if (!r.ok || body?.ok !== true) {
        setError(
          typeof body?.detail === "string"
            ? body.detail
            : "Could not add a time.",
        );
        return;
      }
      setSlots((prev) => [...prev, body.slot as ApplySlot]);
      setLastSavedAt(new Date().toISOString());
    } catch {
      setError("Could not add a time. Network error.");
    } finally {
      setSaving(false);
    }
  }, []);

  const removeSlot = useCallback(
    async (id: number) => {
      setSaving(true);
      setError(null);
      try {
        const r = await fetch(`/api/admin/apply/slots/${id}`, {
          method: "DELETE",
          credentials: "same-origin",
        });
        const body = await r.json().catch(() => null);
        if (!r.ok || body?.ok !== true) {
          setError(
            typeof body?.detail === "string"
              ? body.detail
              : "Could not remove that time.",
          );
          return;
        }
        setSlots((prev) => prev.filter((s) => s.id !== id));
        setLastSavedAt(new Date().toISOString());
        await loadPublic();
      } catch {
        setError("Could not remove that time. Network error.");
      } finally {
        setSaving(false);
      }
    },
    [loadPublic],
  );

  const ctx = useMemo<Ctx>(
    () => ({
      isAdmin,
      editMode,
      setEditMode,
      enterEditAtField,
      pendingOpenField,
      value,
      commitField,
      fieldErrors,
      clearFieldError,
      slots,
      liveSlots,
      liveError,
      reload,
      addSlot,
      removeSlot,
      saving,
      lastSavedAt,
      error,
    }),
    [
      isAdmin,
      editMode,
      setEditMode,
      enterEditAtField,
      pendingOpenField,
      value,
      commitField,
      fieldErrors,
      clearFieldError,
      slots,
      liveSlots,
      liveError,
      reload,
      addSlot,
      removeSlot,
      saving,
      lastSavedAt,
      error,
    ],
  );

  return (
    <ApplySlotsEditContext.Provider value={ctx}>
      {children}
    </ApplySlotsEditContext.Provider>
  );
}
