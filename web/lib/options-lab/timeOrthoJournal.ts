/**
 * Optional journal attach for a T Ortho capture.
 * The view is not a journal SoR — this is a picture the member chose to keep.
 */

import {
  createJournalSession,
  listJournalSessions,
  uploadJournalAttachment,
} from "@/lib/journalSessionApi";
import { journalDateYmd } from "./timeOrthoEgg";

export class JournalCaptureClosedError extends Error {
  constructor() {
    super("Today’s journal is closed.");
    this.name = "JournalCaptureClosedError";
  }
}

export async function attachCaptureToTodayJournal(
  file: File,
  caption: string,
  nowMs = Date.now(),
): Promise<{ sessionId: number; attachmentId: number; journalDate: string }> {
  const journalDate = journalDateYmd(nowMs);
  const rows = await listJournalSessions({
    journal_date: journalDate,
    limit: 8,
  });
  let session = rows.find((s) => s.status === "open") ?? null;
  if (!session && rows.length === 0) {
    session = await createJournalSession({ journal_date: journalDate });
  }
  if (!session || session.status !== "open") {
    throw new JournalCaptureClosedError();
  }
  const att = await uploadJournalAttachment(session.id, file, caption);
  return {
    sessionId: session.id,
    attachmentId: att.id,
    journalDate,
  };
}
