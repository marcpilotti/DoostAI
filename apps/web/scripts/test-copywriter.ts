import { config } from "dotenv";
config({ path: ".env.local" });

import { generateAdCopy, CHAR_LIMITS } from "../packages/ai/src/index";
import type { BrandContext, Platform } from "../packages/ai/src/types";

const brand: BrandContext = {
  name: "Planacy",
  description:
    "A data-driven financial planning platform for Scandinavian enterprises",
  industry: "B2B SaaS / Financial Planning & Analysis",
  brandVoice:
    "Professional, analytical, and empowering with a focus on simplification",
  targetAudience:
    "CFOs and finance teams at mid-market Nordic companies",
  valuePropositions: [
    "Automated budgeting and forecasting",
    "Driver-based planning",
    "Trusted by 200+ companies",
  ],
  url: "https://planacy.com",
};

function checkLimits(platform: Platform, result: { headline: string; bodyCopy: string; cta: string; headlines?: string[]; descriptions?: string[] }) {
  const issues: string[] = [];
  if (platform === "google") {
    for (const h of result.headlines ?? []) {
      if (h.length > CHAR_LIMITS.google.headline)
        issues.push(`headline "${h}" is ${h.length}/${CHAR_LIMITS.google.headline}`);
    }
    for (const d of result.descriptions ?? []) {
      if (d.length > CHAR_LIMITS.google.description)
        issues.push(`desc "${d}" is ${d.length}/${CHAR_LIMITS.google.description}`);
    }
  } else {
    const limits = CHAR_LIMITS[platform];
    if (result.headline.length > limits.headline)
      issues.push(`headline "${result.headline}" is ${result.headline.length}/${limits.headline}`);
    if (result.bodyCopy.length > limits.bodyCopy)
      issues.push(`body "${result.bodyCopy}" is ${result.bodyCopy.length}/${limits.bodyCopy}`);
    if (result.cta.length > limits.cta)
      issues.push(`cta "${result.cta}" is ${result.cta.length}/${limits.cta}`);
  }
  return issues;
}

async function main() {
  const platforms: Platform[] = ["meta", "google", "linkedin"];

  for (const platform of platforms) {
    console.log(`\n${"=".repeat(50)}`);
    console.log(`Platform: ${platform.toUpperCase()}`);
    console.log("=".repeat(50));

    const results = await generateAdCopy(brand, platform, "lead generation", {
      language: "Swedish",
      variants: 2, // hero + 1 variant for speed
    });

    for (const r of results) {
      console.log(`\n  [${r.variant}] (${r.variant === "hero" ? "Claude" : "GPT-4o"})`);
      if (r.headlines) {
        console.log(`  Headlines: ${r.headlines.map((h) => `"${h}" (${h.length})`).join(", ")}`);
        console.log(`  Descriptions: ${r.descriptions!.map((d) => `"${d}" (${d.length})`).join(", ")}`);
      } else {
        console.log(`  Headline: "${r.headline}" (${r.headline.length})`);
        console.log(`  Body: "${r.bodyCopy}" (${r.bodyCopy.length})`);
        console.log(`  CTA: "${r.cta}" (${r.cta.length})`);
      }

      const issues = checkLimits(platform, r);
      if (issues.length > 0) {
        console.log(`  LIMIT VIOLATIONS: ${issues.join("; ")}`);
      } else {
        console.log(`  All limits OK`);
      }
    }
  }
}

main().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});
