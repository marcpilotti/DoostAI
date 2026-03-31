"use client";

import { useEffect } from "react";
import { ReactFlowProvider } from "@xyflow/react";

import { CampaignCanvas } from "@/components/campaign-builder/CampaignCanvas";
import { useCampaignBuilderStore } from "@/lib/stores/campaign-builder";

export default function CampaignBuilderPage() {
  const { nodes, loadTemplate } = useCampaignBuilderStore();

  // Load quick-ad template if canvas is empty
  useEffect(() => {
    if (nodes.length === 0) {
      loadTemplate("quick-ad");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ReactFlowProvider>
      <CampaignCanvas />
    </ReactFlowProvider>
  );
}
