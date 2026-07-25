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
import { registerDialogs, unregisterDialogs } from "@/lib/dialogs";
import AlertDialog from "./AlertDialog";

export type ConfirmOptions = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

/**
 * Async confirm() using AlertDialog — drop-in replacement for window.confirm.
 * Also exposes alert-style OK-only via confirm with cancelLabel omitted path:
 * use `alertDialog` for simple notices.
 */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const [mode, setMode] = useState<"confirm" | "alert">("confirm");
  const resolver = useRef<((v: boolean) => void) | null>(null);

  const close = useCallback((value: boolean) => {
    setOpen(false);
    resolver.current?.(value);
    resolver.current = null;
  }, []);

  const confirm = useCallback<ConfirmFn>((options) => {
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
      setMode("confirm");
      setOpts(options);
      setOpen(true);
    });
  }, []);

  const alertDialog = useCallback((options: Omit<ConfirmOptions, "destructive">) => {
    return new Promise<void>((resolve) => {
      resolver.current = () => resolve();
      setMode("alert");
      setOpts({ ...options, confirmLabel: options.confirmLabel ?? "OK" });
      setOpen(true);
    });
  }, []);

  // Attach alert helper on the same context via dual export pattern
  const api = useMemo(() => {
    const fn = confirm as ConfirmFn & { alert: typeof alertDialog };
    fn.alert = alertDialog;
    return fn;
  }, [confirm, alertDialog]);

  // Register during render (client) so callers never race useEffect order.
  if (typeof window !== "undefined") {
    registerDialogs({ confirm, alert: alertDialog });
  }

  useEffect(() => {
    registerDialogs({ confirm, alert: alertDialog });
    return () => unregisterDialogs();
  }, [confirm, alertDialog]);

  return (
    <ConfirmContext.Provider value={api}>
      {children}
      <AlertDialog
        open={open && !!opts}
        title={opts?.title ?? ""}
        message={opts?.message ?? ""}
        confirmLabel={opts?.confirmLabel ?? (mode === "alert" ? "OK" : "Confirm")}
        cancelLabel={mode === "alert" ? "" : (opts?.cancelLabel ?? "Cancel")}
        destructive={!!opts?.destructive}
        onConfirm={() => close(true)}
        onCancel={() => close(mode === "alert" ? true : false)}
      />
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn & {
  alert: (opts: Omit<ConfirmOptions, "destructive">) => Promise<void>;
} {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm must be used within ConfirmProvider");
  }
  return ctx as ConfirmFn & {
    alert: (opts: Omit<ConfirmOptions, "destructive">) => Promise<void>;
  };
}
