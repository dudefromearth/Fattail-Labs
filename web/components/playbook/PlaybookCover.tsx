"use client";

/**
 * Playbook library cover — edit only on the library card (not inside the book editor).
 * Hover-only controls (shared CoverFrame).
 */

import CoverFrame from "@/components/practice/CoverFrame";
import {
  clearPlaybookCover,
  playbookCoverUrl,
  uploadPlaybookCover,
  type PlaybookEntry,
} from "@/lib/practiceSpineApi";

type Props = {
  bookId: number;
  coverAttachmentId?: number | null;
  onChange?: (entry: PlaybookEntry) => void;
  className?: string;
  disabled?: boolean;
};

export default function PlaybookCover({
  bookId,
  coverAttachmentId,
  onChange,
  className = "",
  disabled = false,
}: Props) {
  const url = playbookCoverUrl(bookId, coverAttachmentId);

  return (
    <CoverFrame
      testId={`playbook-cover-${bookId}`}
      imageUrl={url}
      disabled={disabled}
      className={className}
      onUpload={async (file) => {
        const out = await uploadPlaybookCover(bookId, file);
        onChange?.(out.entry);
      }}
      onClear={async () => {
        const entry = await clearPlaybookCover(bookId);
        onChange?.(entry);
      }}
    />
  );
}
