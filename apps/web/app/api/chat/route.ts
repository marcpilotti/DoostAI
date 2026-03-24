import { anthropic } from "@ai-sdk/anthropic";
import { auth } from "@clerk/nextjs/server";
import { stepCountIs, streamText, tool } from "ai";
import { z } from "zod";

import {
  buildBrandProfile,
  enrichCompany,
  scrapeBrand,
} from "@doost/brand";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { messages } = await req.json();

  const result = streamText({
    model: anthropic("claude-sonnet-4-20250514"),
    stopWhen: stepCountIs(3),
    system: `You are Doost AI, a friendly and knowledgeable marketing assistant. You help companies create and manage ad campaigns across Meta, Google, and LinkedIn.

You speak naturally and concisely. You can communicate in both Swedish and English — match the language the user writes in.

IMPORTANT RULES:
- When the user provides a URL or domain name, IMMEDIATELY call the analyze_brand tool. Do not ask for confirmation first.
- After the tool returns brand data, summarize the key findings: company name, industry, brand colors, target audience, and value propositions.
- Ask the user if the brand profile looks correct before proceeding to campaign creation.
- If the user hasn't provided a URL yet, ask them for their company URL to get started.

Keep responses focused and actionable. When discussing campaigns, be specific about platforms, targeting, and creative approaches.`,
    tools: {
      analyze_brand: tool({
        description:
          "Analyze a company's brand identity by scraping their website and enriching with company data. Call this when the user provides a URL or domain name.",
        inputSchema: z.object({
          url: z.string().describe("The company website URL or domain name"),
        }),
        execute: async ({ url }: { url: string }) => {
          const [scrapeResult, enrichment] = await Promise.all([
            scrapeBrand(url),
            enrichCompany(url),
          ]);

          const profile = await buildBrandProfile(
            scrapeResult,
            enrichment ?? undefined,
          );

          const {
            rawScrapeData: _s,
            rawEnrichmentData: _e,
            ...cleanProfile
          } = profile;
          return cleanProfile;
        },
      }),
    },
    messages,
  });

  return result.toUIMessageStreamResponse();
}
