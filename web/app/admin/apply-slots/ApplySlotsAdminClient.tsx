"use client";

import ApplySlotsEditBar from "@/components/edit/ApplySlotsEditBar";
import { ApplySlotsEditProvider } from "@/components/edit/ApplySlotsEditContext";
import ApplySlotsEditor from "@/components/edit/ApplySlotsEditor";

export default function ApplySlotsAdminClient() {
  return (
    <ApplySlotsEditProvider startInEdit>
      <ApplySlotsEditBar />
      <ApplySlotsEditor variant="admin" />
    </ApplySlotsEditProvider>
  );
}
