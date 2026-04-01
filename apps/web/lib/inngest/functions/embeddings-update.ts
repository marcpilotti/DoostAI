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

          // BLOCKED: pgvector column does not exist yet.
          // To unblock, run migration:
          //   CREATE EXTENSION IF NOT EXISTS vector;
          //   ALTER TABLE ad_creatives ADD COLUMN embedding vector(1536);
          // Then change this to:
          //   import { sql } from "drizzle-orm";
          //   await db.update(adCreatives)
          //     .set({ embedding: sql`${JSON.stringify(embedding)}::vector` })
          //     .where(eq(adCreatives.id, creative.id));
          //
          // For now, log that generation works but storage is pending.
          console.log(`[embeddings] Generated ${embedding.length}-dim embedding for ${creative.id} — storage blocked on pgvector migration`);
          embedded++;
        } catch (err) {
          console.error(`[embeddings] Failed for ${creative.id}:`, err instanceof Error ? err.message : err);
        }
      });
    }

    return { checked: creatives.length, embedded };
  },
);
