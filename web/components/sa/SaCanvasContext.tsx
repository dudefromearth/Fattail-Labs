"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  applyMode,
  defaultPrefs,
  loadPrefs,
  MODE_SLICE_KEYS,
  recordOverride,
  resetMode as resetModeFn,
  resetPartToHouse as resetPartToHouseFn,
  resetToObjectDefault as resetToObjectDefaultFn,
  saveObjectDefault as saveObjectDefaultFn,
  savePrefs,
  prefsFromServerDoc,
  surfaceDoc,
  type DialogPart,
  type LayerId,
  type ModeSlice,
  type SaPrefs,
  type WorkflowMode,
} from "@/lib/saLayerStore";
import { sectionForPart } from "@/lib/saSettingsSections";

type Ctx = {
  prefs: SaPrefs;
  patch: (p: Partial<SaPrefs>) => void;
  setVisible: (id: LayerId, on: boolean) => void;
  setMode: (m: WorkflowMode) => void;
  resetMode: () => void;
  resetView: () => void;
  registerViewReset: (fn: () => void) => void;
  dismissFirstRun: () => void;
  openPart: DialogPart | null;
  open: (part: DialogPart) => void;
  close: () => void;
  ok: () => void;
  cancel: () => void;
  liveFlag: "LIVE" | "STALE" | "OFF";
  setLiveFlag: (f: "LIVE" | "STALE" | "OFF") => void;
  saveObjectDefault: (part: DialogPart) => void;
  resetToObjectDefault: (part: DialogPart) => void;
  resetPartToHouse: (part: DialogPart) => void;
};

const C = createContext<Ctx | null>(null);

export function SaCanvasProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<SaPrefs>(defaultPrefs);
  const [openPart, setOpenPart] = useState<DialogPart | null>(null);
  const snapshotRef = useRef<SaPrefs | null>(null);
  const [liveFlag, setLiveFlag] = useState<"LIVE" | "STALE" | "OFF">("OFF");
  const [hydrated, setHydrated] = useState(false);
  const serverReady = useRef(false);
  const viewResetFn = useRef<() => void>(() => {});
  const prefsRef = useRef(prefs);
  prefsRef.current = prefs;

  useEffect(() => {
    let cancel = false;
    const local = loadPrefs();
    setPrefs(local);
    setHydrated(true);
    void fetch("/api/me/sa-surface", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((doc) => {
        if (cancel) return;
        const server = prefsFromServerDoc(doc);
        if (server) {
          setPrefs(server);
          savePrefs(server);
        } else {
          void fetch("/api/me/sa-surface", {
            method: "PUT",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(surfaceDoc(prefsRef.current)),
          });
        }
        serverReady.current = true;
      })
      .catch(() => {
        serverReady.current = true;
      });
    return () => {
      cancel = true;
    };
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    savePrefs(prefs);
    if (!serverReady.current) return;
    if (openPart) return;
    const t = window.setTimeout(() => {
      void fetch("/api/me/sa-surface", {
        method: "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(surfaceDoc(prefs)),
      });
    }, 450);
    return () => window.clearTimeout(t);
  }, [prefs, hydrated, openPart]);

  const patch = useCallback((p: Partial<SaPrefs>) => {
    setPrefs((prev) => {
      const slice: Partial<ModeSlice> = {};
      for (const k of MODE_SLICE_KEYS) {
        if (k === "visible") {
          if (p.visible) slice.visible = { ...prev.visible, ...p.visible };
          continue;
        }
        if (p[k] !== undefined) {
          (slice as Record<string, unknown>)[k] = p[k];
        }
      }
      if (p.gridOpacity != null) {
        slice.gridIntensity = Math.round(p.gridOpacity * 100);
      }
      const next = Object.keys(slice).length
        ? recordOverride(prev, slice)
        : prev;
      return { ...next, ...p, visible: next.visible, overrides: next.overrides };
    });
  }, []);
  const setVisible = useCallback((id: LayerId, on: boolean) => {
    setPrefs((prev) =>
      recordOverride(prev, {
        visible: { ...prev.visible, [id]: on },
      }),
    );
  }, []);
  const setMode = useCallback((m: WorkflowMode) => {
    setPrefs((prev) => applyMode(prev, m));
  }, []);
  const resetMode = useCallback(() => {
    setPrefs((prev) => resetModeFn(prev));
  }, []);
  const registerViewReset = useCallback((fn: () => void) => {
    viewResetFn.current = fn;
  }, []);
  const resetView = useCallback(() => {
    viewResetFn.current();
  }, []);
  const saveObjectDefault = useCallback((part: DialogPart) => {
    setPrefs((prev) => saveObjectDefaultFn(prev, part));
  }, []);
  const resetToObjectDefault = useCallback((part: DialogPart) => {
    setPrefs((prev) => resetToObjectDefaultFn(prev, part));
  }, []);
  const resetPartToHouse = useCallback((part: DialogPart) => {
    setPrefs((prev) => resetPartToHouseFn(prev, part));
  }, []);
  const dismissFirstRun = useCallback(() => {
    setPrefs((prev) => ({ ...prev, firstRunSeen: true }));
  }, []);
  const open = useCallback((part: DialogPart) => {
    setOpenPart((cur) => {
      if (cur == null) snapshotRef.current = structuredClone(prefsRef.current);
      return sectionForPart(part);
    });
  }, []);
  const cancel = useCallback(() => {
    const snap = snapshotRef.current;
    snapshotRef.current = null;
    setOpenPart(null);
    if (snap) setPrefs(snap);
  }, []);
  const ok = useCallback(() => {
    snapshotRef.current = null;
    setOpenPart(null);
  }, []);
  const close = cancel;

  const value = useMemo(
    () => ({
      prefs,
      patch,
      setVisible,
      setMode,
      resetMode,
      resetView,
      registerViewReset,
      dismissFirstRun,
      openPart,
      open,
      close,
      ok,
      cancel,
      liveFlag,
      setLiveFlag,
      saveObjectDefault,
      resetToObjectDefault,
      resetPartToHouse,
    }),
    [
      prefs,
      patch,
      setVisible,
      setMode,
      resetMode,
      resetView,
      registerViewReset,
      dismissFirstRun,
      openPart,
      open,
      close,
      ok,
      cancel,
      liveFlag,
      setLiveFlag,
      saveObjectDefault,
      resetToObjectDefault,
      resetPartToHouse,
    ],
  );
  return <C.Provider value={value}>{children}</C.Provider>;
}

export function useSaCanvas(): Ctx {
  const v = useContext(C);
  if (!v) throw new Error("useSaCanvas outside provider");
  return v;
}
