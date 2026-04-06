"use client";

import { ReactFlowProvider } from "@xyflow/react";
import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";

import { useCampaignBuilderStore } from "@/lib/stores/campaign-builder";

const CampaignCanvas = dynamic(
  () =>
    import("@/components/campaign-builder/CampaignCanvas").then(
      (mod) => mod.CampaignCanvas,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--doost-text-muted)] border-t-[var(--doost-text)]" />
          <p className="text-[13px] text-[var(--doost-text-muted)]">
            Laddar kampanjbyggaren...
          </p>
        </div>
      </div>
    ),
  },
);

export default function CampaignBuilderPage() {
  const { nodes, loadTemplate } = useCampaignBuilderStore();
  const initialized = useRef(false);

  // Load quick-ad template if canvas is empty (once on mount)
  useEffect(() => {
    if (!initialized.current && nodes.length === 0) {
      initialized.current = true;
      loadTemplate("quick-ad");
    }
  }, [nodes.length, loadTemplate]);

  return (
    <ReactFlowProvider>
      <CampaignCanvas />
    </ReactFlowProvider>
  );
}
