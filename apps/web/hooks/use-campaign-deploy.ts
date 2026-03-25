"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

type PlatformStatus = {
  platform: string;
  status: "deploying" | "live" | "failed" | "connect_required" | "queued";
  message: string;
  startedAt?: string;
  error?: string;
};

type DeployParams = {
  platforms: string[];
  budget: { daily: number; currency: string };
  campaignName: string;
  orgId?: string;
  targeting?: Record<string, unknown>;
};

type CampaignState = {
  platforms: PlatformStatus[];
  budget?: { daily: number; currency: string };
  campaignName?: string;
};

export function useCampaignDeploy(campaignId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: DeployParams) => {
      const res = await fetch("/api/campaigns/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId, ...params }),
      });
      if (!res.ok) throw new Error("Deployment failed");
      return res.json() as Promise<CampaignState>;
    },

    onMutate: async (params) => {
      await queryClient.cancelQueries({
        queryKey: ["campaign", campaignId],
      });

      const previous = queryClient.getQueryData<CampaignState>([
        "campaign",
        campaignId,
      ]);

      // Optimistic: all platforms show "deploying" immediately
      queryClient.setQueryData<CampaignState>(
        ["campaign", campaignId],
        {
          platforms: params.platforms.map((p) => ({
            platform: p,
            status: "deploying" as const,
            message: `Publicerar till ${p === "meta" ? "Meta" : p === "google" ? "Google" : "LinkedIn"}...`,
            startedAt: new Date().toISOString(),
          })),
          budget: params.budget,
          campaignName: params.campaignName,
        },
      );

      return { previous };
    },

    onError: (_err, _params, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          ["campaign", campaignId],
          context.previous,
        );
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["campaign", campaignId],
      });
    },
  });
}
