"use client";

import type { FactoryViewId } from "@/lib/risk-graph/surfaceScene";
import { FACTORY_VIEW_IDS } from "@/lib/risk-graph/surfaceScene";

const btn =
  "min-h-11 rounded-full border border-white/15 bg-black/55 px-2.5 text-[12px] text-white/90";

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
    <div
      className="pointer-events-auto absolute left-3 top-24 z-20 max-h-[40%] max-w-[11rem] overflow-auto rounded-2xl border border-white/12 bg-black/55 p-3 text-[11px] text-white/80"
      data-testid="surface-views-hud"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="mb-2 font-medium">Views</div>
      <div className="flex flex-wrap gap-1">
        {FACTORY_VIEW_IDS.map((id) => (
          <button
            key={id}
            type="button"
            className={btn}
            data-testid={`surface-view-${id}`}
            onClick={() => onFactory(id)}
          >
            {id === "iso" ? "ISO" : id === "fit" ? "Fit" : id[0].toUpperCase() + id.slice(1)}
          </button>
        ))}
      </div>
      <button
        type="button"
        className={`${btn} mt-2 w-full`}
        data-testid="surface-view-save"
        onClick={onSave}
      >
        Save view
      </button>
      <ul className="mt-2 space-y-1" data-testid="surface-saved-views">
        {views.map((v) => (
          <li key={v.id} className="flex items-center gap-1">
            <button type="button" className={`${btn} flex-1`} onClick={() => onRecall(v.id)}>
              {v.name}
            </button>
            <button type="button" className={btn} onClick={() => onDelete(v.id)}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
