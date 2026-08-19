/** Shared field-edit surface — course EditContext or apply-slots context. */
export type FieldEditApi = {
  isAdmin: boolean;
  editMode: boolean;
  value: (field: string, fallback: string) => string;
  fieldErrors: Record<string, string>;
  pendingOpenField: string | null;
  clearFieldError: (field: string) => void;
  enterEditAtField: (field: string) => void;
  commitField: (field: string, value: string | boolean) => Promise<boolean>;
};
