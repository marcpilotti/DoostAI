import { enrichCompany } from "@doost/brand";
import { brandProfiles, db, eq } from "@doost/db";

import { inngest } from "../client";

export const brandRetryEnrichment = inngest.createFunction(
  {
    id: "brand-retry-enrichment",
    retries: 3,
    triggers: [{ event: "brand/retry-enrichment" }],
  },
  async ({ event, step }) => {
    const { brandProfileId, domain } = event.data as {
      brandProfileId: string;
      domain: string;
    };

    const enrichment = await step.run("enrich", async () => {
      return enrichCompany(domain);
    });

    if (!enrichment) {
      throw new Error(`Enrichment still failed for ${domain}`);
    }

    await step.run("merge-into-profile", async () => {
      await db
        .update(brandProfiles)
        .set({
          name: enrichment.name,
          industry: enrichment.industry ?? undefined,
          industryCodes: enrichment.industryCodes ?? undefined,
          employeeCount: enrichment.employeeCount ?? undefined,
          revenue: enrichment.revenue ?? undefined,
          location: enrichment.location ?? undefined,
          ceo: enrichment.ceo ?? undefined,
          orgNumber: enrichment.orgNumber ?? undefined,
          rawEnrichmentData: enrichment,
          updatedAt: new Date(),
        })
        .where(eq(brandProfiles.id, brandProfileId));
    });

    return { enriched: true, domain };
  },
);
