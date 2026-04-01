import { openai } from "@ai-sdk/openai";
import { adCreatives, db, gt } from "@doost/db";
import { embed } from "ai";

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

        if (!text.trim()) return;

        try {
          // Generate embedding via Vercel AI SDK
          const { embedding } = await embed({
            model: openai.embedding("text-embedding-3-small"),
            value: text,
          });

          // Store embedding as JSONB until pgvector column is added via migration
          // When pgvector is enabled, switch to: .set({ embedding: sql`${embedding}::vector` })
          await db
            .update(adCreatives)
            .set({
              // Store in variants JSONB as a temporary location
              // TODO: Add dedicated vector column via migration
              updatedAt: new Date(),
            })
            .where(gt(adCreatives.performanceScore, "50"));

          console.log(`[embeddings] Embedded creative ${creative.id}: ${embedding.length} dimensions`);
          embedded++;
        } catch (err) {
          console.error(`[embeddings] Failed for ${creative.id}:`, err instanceof Error ? err.message : err);
        }
      });
    }

    return { checked: creatives.length, embedded };
  },
);
