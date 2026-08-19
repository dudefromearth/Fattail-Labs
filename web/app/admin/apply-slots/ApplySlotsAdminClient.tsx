"use client";

import ApplyFormEditor from "@/components/edit/ApplyFormEditor";
import ApplySlotsEditBar from "@/components/edit/ApplySlotsEditBar";
import { ApplySlotsEditProvider } from "@/components/edit/ApplySlotsEditContext";

export default function ApplySlotsAdminClient() {
  return (
    <ApplySlotsEditProvider startInEdit>
      <ApplySlotsEditBar />
      <ApplyFormEditor variant="admin" />
    </ApplySlotsEditProvider>
  );
}
