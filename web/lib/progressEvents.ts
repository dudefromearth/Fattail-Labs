/** Cross-component lesson progress signals (player → course nav sidebar). */

export type ProgressDetail = {
  courseSlug: string;
  lessonSlug: string;
  completed?: boolean;
};

export const PROGRESS_EVENT = "labs:progress";

export function emitProgress(detail: ProgressDetail): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(PROGRESS_EVENT, { detail }));
}
