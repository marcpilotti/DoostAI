import {
  buildBrandProfile,
  enrichCompany,
  scrapeBrand,
} from "@doost/brand";
import { brandProfiles, db } from "@doost/db";

import { inngest } from "../client";

export const analyzeBrand = inngest.createFunction(
  {
    id: "analyze-brand",
    retries: 2,
    triggers: [{ event: "brand/analyze" }],
  },
  async ({ event, step }) => {
    const { url, orgId } = event.data as { url: string; orgId: string };

    // Step 1: Scrape + enrich in parallel
    const [scrapeResult, enrichment] = await step.run(
      "scrape-and-enrich",
      async () => {
        const [scrape, enrich] = await Promise.all([
          scrapeBrand(url),
          enrichCompany(url),
        ]);
        return [scrape, enrich] as const;
      },
    );

    // Step 2: Build brand profile with AI analysis
    const profile = await step.run("build-profile", async () => {
      return buildBrandProfile(
        scrapeResult,
        enrichment ?? undefined,
      );
    });

    // Step 3: Save to database
    const [saved] = await step.run("save-to-db", async () => {
      return db
        .insert(brandProfiles)
        .values({
          orgId,
          url: profile.url,
          name: profile.name,
          description: profile.description,
          industry: profile.industry,
          industryCodes: profile.industryCodes,
          employeeCount: profile.employeeCount,
          revenue: profile.revenue,
          location: profile.location,
          ceo: profile.ceo,
          orgNumber: profile.orgNumber,
          colors: profile.colors,
          fonts: profile.fonts,
          logos: profile.logos,
          brandVoice: profile.brandVoice,
          targetAudience: profile.targetAudience,
          valuePropositions: profile.valuePropositions,
          competitors: profile.competitors,
          rawScrapeData: profile.rawScrapeData,
          rawEnrichmentData: profile.rawEnrichmentData,
        })
        .returning({ id: brandProfiles.id });
    });

    // Step 4: Emit completion event
    await step.sendEvent("brand-complete", {
      name: "brand/complete",
      data: {
        profileId: saved!.id,
        orgId,
        url: profile.url,
        name: profile.name,
      },
    });

    return { profileId: saved!.id, name: profile.name };
  },
);
