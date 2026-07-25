/**
 * Imperative HIG dialogs — registered by ConfirmProvider.
 * Prefer useConfirm() in React components; this bridge is for async helpers.
 */

import type { ConfirmOptions } from "@/components/ui/ConfirmProvider";

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>;
type AlertFn = (opts: Omit<ConfirmOptions, "destructive">) => Promise<void>;

let _confirm: ConfirmFn | null = null;
let _alert: AlertFn | null = null;

/** Wait briefly for ConfirmProvider to register (mount order). */
async function waitFor(
  get: () => ConfirmFn | AlertFn | null,
  label: string,
): Promise<ConfirmFn | AlertFn> {
  const existing = get();
  if (existing) return existing;
  for (let i = 0; i < 40; i++) {
    await new Promise((r) => setTimeout(r, 25));
    const fn = get();
    if (fn) return fn;
  }
  throw new Error(`ConfirmProvider not mounted — cannot show ${label}`);
}

export function registerDialogs(api: {
  confirm: ConfirmFn;
  alert: AlertFn;
}): void {
  _confirm = api.confirm;
  _alert = api.alert;
}

export function unregisterDialogs(): void {
  _confirm = null;
  _alert = null;
}

export async function appConfirm(opts: ConfirmOptions): Promise<boolean> {
  const fn = (await waitFor(() => _confirm, "confirm")) as ConfirmFn;
  return fn(opts);
}

export async function appAlert(
  opts: Omit<ConfirmOptions, "destructive">,
): Promise<void> {
  const fn = (await waitFor(() => _alert, "alert")) as AlertFn;
  return fn(opts);
}
