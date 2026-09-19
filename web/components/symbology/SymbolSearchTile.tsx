"use client";

import { useState } from "react";
import SymbolSearchDialog from "./SymbolSearchDialog";
import { SYM_ROLES_VP, type SymbolBind } from "@/lib/symbology/types";

export default function SymbolSearchTile({
  label,
  caption,
  roles = SYM_ROLES_VP,
  onBind,
}: {
  label: string;
  caption?: string;
  roles?: readonly string[];
  onBind: (bind: SymbolBind) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        data-testid="symbol-search-tile"
        title={caption || "Symbol search"}
        onClick={() => setOpen(true)}
        className="flex h-8 max-w-[16rem] shrink-0 items-center gap-2 rounded border border-zinc-700 bg-[#1e222d] px-2 text-left text-zinc-100"
      >
        <span className="truncate text-[13px] font-semibold">{label}</span>
        {caption ? (
          <span className="hidden truncate text-[10px] font-normal text-zinc-500 sm:inline">
            {caption}
          </span>
        ) : null}
      </button>
      <SymbolSearchDialog
        open={open}
        onClose={() => setOpen(false)}
        roles={roles}
        onBind={(bind) => {
          onBind(bind);
          setOpen(false);
        }}
      />
    </>
  );
}
