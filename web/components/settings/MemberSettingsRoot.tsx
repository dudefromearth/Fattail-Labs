"use client";

import { useEffect } from "react";
import {
  applyMemberSettings,
  loadMemberSettings,
  MEMBER_SETTINGS_EVENT,
} from "@/lib/memberSettings";

/** Applies stored member appearance after mount; keeps multi-tab in sync. */
export default function MemberSettingsRoot() {
  useEffect(() => {
    applyMemberSettings(loadMemberSettings());
    const onChange = () => applyMemberSettings(loadMemberSettings());
    window.addEventListener(MEMBER_SETTINGS_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(MEMBER_SETTINGS_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);
  return null;
}
