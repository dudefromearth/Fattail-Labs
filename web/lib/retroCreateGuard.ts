/**
 * Pre-create warning for a new retrospective.
 * Shows the period since the last completed retro (or maiden journey)
 * and that completing the retro closes those journal dates.
 */

import { appConfirm } from "@/lib/dialogs";
import {
  previewRetroScope,
  type RetroScopePreview,
} from "@/lib/retrospectiveApi";

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" });
  } catch {
    return String(iso).slice(0, 10);
  }
}

export function buildRetroCreateWarningMessage(
  scope: RetroScopePreview | null,
): string {
  if (!scope) {
    return [
      "This retrospective will gather your journal and trades since your last completed retrospective (or your full practice history if this is the first).",
      "",
      "Once you complete the retrospective, journal dates in that window close — you will not be able to modify those journal entries or attachments. The trade sample used in the review is fixed when the retro is gathered.",
      "",
      "Start only if you are ready to lock that period.",
    ].join("\n");
  }

  const start = fmtDate(scope.scope_start);
  const end = fmtDate(scope.scope_end);
  const period = scope.is_maiden
    ? "your maiden journey (first full look-back)"
    : "the period since your last completed retrospective";

  return [
    `This retrospective will include your journal and trades from ${start} through ${end} — ${period}.`,
    "",
    "Once you complete the retrospective, those journal dates close. You will not be able to modify those journal entries or attachments. The trade sample for this review is fixed at gather.",
    "",
    "Start only if this date range is correct.",
  ].join("\n");
}

/**
 * Confirm before create. Returns false if the member cancels.
 * Fetches live scope so the dialog always shows current dates.
 */
export async function confirmStartRetrospective(): Promise<{
  ok: boolean;
  scope: RetroScopePreview | null;
}> {
  let scope: RetroScopePreview | null = null;
  try {
    scope = await previewRetroScope();
  } catch {
    scope = null;
  }

  const ok = await appConfirm({
    title: "Start this retrospective?",
    message: buildRetroCreateWarningMessage(scope),
    confirmLabel: "Start retrospective",
    cancelLabel: "Not yet",
    destructive: true,
  });

  return { ok, scope };
}
