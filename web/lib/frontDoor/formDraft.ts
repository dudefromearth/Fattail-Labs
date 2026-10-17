/**
 * Order-form draft. sessionStorage only, one key.
 * Callers pass the tab's sessionStorage. This module never touches localStorage.
 * Payment fields are not part of the draft.
 */

export const FORM_DRAFT_KEY = "fd_form";

export type FormDraft = {
  email: string;
  firstName: string;
  lastName: string;
  productId: string;
  terms: boolean;
};

const STORED_KEYS = ["email", "firstName", "lastName", "productId", "terms", "termsVersion"] as const;

export function readFormDraft(storage: Storage, termsVersion: string): FormDraft | null {
  let raw: string | null = null;
  try {
    raw = storage.getItem(FORM_DRAFT_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!data || typeof data !== "object") return null;
  const row = data as Record<string, unknown>;
  const email = typeof row.email === "string" ? row.email : "";
  const firstName = typeof row.firstName === "string" ? row.firstName : "";
  const lastName = typeof row.lastName === "string" ? row.lastName : "";
  const productId = typeof row.productId === "string" ? row.productId : "";
  const terms = row.terms === true && row.termsVersion === termsVersion;
  if (!email && !firstName && !lastName && !productId && !terms) return null;
  return { email, firstName, lastName, productId, terms };
}

export function writeFormDraft(storage: Storage, draft: FormDraft, termsVersion: string): void {
  const body: Record<(typeof STORED_KEYS)[number], string | boolean> = {
    email: draft.email,
    firstName: draft.firstName,
    lastName: draft.lastName,
    productId: draft.productId,
    terms: draft.terms === true,
    termsVersion,
  };
  storage.setItem(FORM_DRAFT_KEY, JSON.stringify(body));
}

export function clearFormDraft(storage: Storage): void {
  storage.removeItem(FORM_DRAFT_KEY);
}
