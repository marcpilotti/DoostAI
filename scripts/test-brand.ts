import { config } from "dotenv";
config({ path: ".env.local" });

import { scrapeBrand } from "../packages/brand/src/firecrawl";
import { buildBrandProfile } from "../packages/brand/src/profile-builder";

async function main() {
  const url = process.argv[2] ?? "planacy.com";

  console.log(`\n--- Scraping ${url} ---\n`);
  const scrape = await scrapeBrand(url);
  console.log("Title:", scrape.title);
  console.log("Description:", scrape.description?.slice(0, 120));
  console.log("Colors:", scrape.colors);
  console.log("Fonts:", scrape.fonts);
  console.log("Logos:", scrape.logoUrls);
  console.log("Markdown length:", scrape.markdown?.length ?? 0);

  console.log(`\n--- Building brand profile with Claude Haiku ---\n`);
  const profile = await buildBrandProfile(scrape);

  const { rawScrapeData: _s, rawEnrichmentData: _e, ...clean } = profile;
  console.log(JSON.stringify(clean, null, 2));
}

main().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
