"use client";

/**
 * Campaign library cover — top-level cards only. Hover-only controls.
 */

import CoverFrame from "@/components/practice/CoverFrame";
import {
  clearCampaignCover,
  campaignCoverUrl,
  uploadCampaignCover,
  type PracticeCampaign,
} from "@/lib/practiceSpineApi";

type Props = {
  campaignId: number;
  hasCover?: boolean;
  coverUrl?: string | null;
  onChange?: (campaign: PracticeCampaign) => void;
  className?: string;
  disabled?: boolean;
};

export default function CampaignCover({
  campaignId,
  hasCover,
  coverUrl,
  onChange,
  className = "",
  disabled = false,
}: Props) {
  const url =
    coverUrl ||
    (hasCover ? campaignCoverUrl(campaignId) : null);

  return (
    <CoverFrame
      testId={`campaign-cover-${campaignId}`}
      imageUrl={url}
      disabled={disabled}
      className={className}
      onUpload={async (file) => {
        const out = await uploadCampaignCover(campaignId, file);
        onChange?.(out.campaign);
      }}
      onClear={async () => {
        const out = await clearCampaignCover(campaignId);
        onChange?.(out.campaign);
      }}
    />
  );
}
