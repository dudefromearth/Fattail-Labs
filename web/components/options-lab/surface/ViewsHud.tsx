"use client";

import type { FactoryViewId } from "@/lib/risk-graph/surfaceScene";
import { FACTORY_VIEW_IDS } from "@/lib/risk-graph/surfaceScene";
import { HUD_PANEL } from "./hudChrome";
import HudCollapse from "./HudCollapse";

const detent =
  "inline-flex h-[66px] min-h-[66px] w-full items-center justify-center rounded-full " +
  "border border-white/40 bg-black/55 px-2 text-[18px] font-medium text-white/90 " +
  "shadow-[0_0_10px_2px_rgba(255,255,255,0.55)]";

const mini =
  "inline-flex min-h-11 flex-1 items-center justify-center rounded-full " +
  "border border-white/15 bg-black/55 px-3 text-[13px] font-medium text-white/90";

export default function ViewsHud({
  onFactory,
  views,
  onSave,
  onRecall,
  onDelete,
}: {
  onFactory: (id: FactoryViewId) => void;
  views: { id: string; name: string }[];
  onSave: () => void;
  onRecall: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex w-full flex-col gap-2" data-testid="surface-views-hud">
      <div
        className={`${HUD_PANEL} p-3`}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="mb-2 font-medium">Views</div>
        <div className="grid grid-cols-4 gap-2">
          {FACTORY_VIEW_IDS.map((id) => (
            <button
              key={id}
              type="button"
              className={detent}
              data-testid={`surface-view-${id}`}
              onClick={() => onFactory(id)}
            >
              {id === "iso"
                ? "ISO"
                : id === "fit"
                  ? "Fit"
                  : id === "timeOrtho"
                    ? "T Ortho"
                    : id[0].toUpperCase() + id.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <HudCollapse title="Saved views" testId="surface-saved-hud">
        <button
          type="button"
          className={`${mini} w-full`}
          data-testid="surface-view-save"
          onClick={onSave}
        >
          Save view
        </button>
        <ul className="mt-2 space-y-1" data-testid="surface-saved-views">
          {views.map((v) => (
            <li key={v.id} className="flex items-center gap-1">
              <button
                type="button"
                className={mini}
                onClick={() => onRecall(v.id)}
              >
                {v.name}
              </button>
              <button type="button" className={mini} onClick={() => onDelete(v.id)}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      </HudCollapse>
    </div>
  );
}
