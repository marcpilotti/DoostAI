import { serve } from "inngest/next";

import { inngest } from "@/lib/inngest/client";
import {
  analyzeBrand,
  googleCreateAccount,
  googleDeployCampaign,
  googlePollMetrics,
  linkedinDeployCampaign,
  linkedinPollAnalytics,
  linkedinRefreshTokens,
  metaDeployCampaign,
  metaPollInsights,
  metaRefreshTokens,
} from "@/lib/inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    analyzeBrand,
    metaDeployCampaign,
    metaPollInsights,
    metaRefreshTokens,
    googleCreateAccount,
    googleDeployCampaign,
    googlePollMetrics,
    linkedinDeployCampaign,
    linkedinRefreshTokens,
    linkedinPollAnalytics,
  ],
});
