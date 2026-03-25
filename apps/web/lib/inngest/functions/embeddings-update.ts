import { anthropic } from "@ai-sdk/anthropic";
import { embed } from "ai";

import { adCreatives, db, and, gt, isNull, eq } from "@doost/db";

import { inngest } from "../client";

export const embeddingsUpdate = inngest.createFunction(
  {
    id: "embeddings-update",
    triggers: [{ cron: "0 2 * * *" }], // Nightly 2am
  },
  async ({ step }) => {
    // Find high-performing creatives without embeddings
    const creatives = await step.run("find-unembedded", async () => {
      return db
        .select()
        .from(adCreatives)
        .where(
          gt(adCreatives.performanceScore, "50"),
        )
        .limit(100);
    });

    let embedded = 0;

    for (const creative of creatives) {
      await step.run(`embed-${creative.id}`, async () => {
        const text = [
          creative.platform,
          creative.headline,
          creative.bodyCopy,
          creative.cta,
          creative.templateId,
        ]
          .filter(Boolean)
          .join(" | ");

        // Generate embedding (using Anthropic or OpenAI)
        // Store in a vector column when pgvector is available
        // For now, log that we would embed this
        console.log(`Would embed creative ${creative.id}: ${text.slice(0, 80)}...`);
        embedded++;
      });
    }

    return { checked: creatives.length, embedded };
  },
);
