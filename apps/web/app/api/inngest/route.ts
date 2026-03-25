import { serve } from "inngest/next";

import { inngest } from "@/lib/inngest/client";
import {
  analyzeBrand,
  brandRetryEnrichment,
  campaignDeploy,
  creativesPreRender,
  embeddingsUpdate,
  googleCreateAccount,
  googleDeployCampaign,
  googlePollMetrics,
  linkedinDeployCampaign,
  linkedinPollAnalytics,
  linkedinRefreshTokens,
  metaDeployCampaign,
  metaPollInsights,
  metaRefreshTokens,
  optimizerAnalyze,
  weeklyDigest,
} from "@/lib/inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    analyzeBrand,
    brandRetryEnrichment,
    campaignDeploy,
    creativesPreRender,
    metaDeployCampaign,
    metaPollInsights,
    metaRefreshTokens,
    googleCreateAccount,
    googleDeployCampaign,
    googlePollMetrics,
    linkedinDeployCampaign,
    linkedinRefreshTokens,
    linkedinPollAnalytics,
    optimizerAnalyze,
    weeklyDigest,
    embeddingsUpdate,
  ],
});
