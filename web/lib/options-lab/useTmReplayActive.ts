"use client";

import { useEffect, useState } from "react";
import { getTmSlots, subscribeTmSlots } from "./tmSlots";

/** True while a Time Machine playhead is up (today or archive). */
export function useTmReplayActive(): boolean {
  const [on, setOn] = useState(
    () => getTmSlots().playhead.projector !== "live",
  );
  useEffect(
    () =>
      subscribeTmSlots(() => {
        setOn(getTmSlots().playhead.projector !== "live");
      }),
    [],
  );
  return on;
}
