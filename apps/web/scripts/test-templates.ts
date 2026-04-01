import { writeFileSync, mkdirSync } from "fs";
import { templates, renderToImage } from "../packages/templates/src/index";
import type { BrandInput, AdContent } from "../packages/templates/src/types";

const mockBrand: BrandInput = {
  name: "Planacy",
  colors: {
    primary: "#0095ff",
    secondary: "#64beff",
    accent: "#074572",
    background: "#f8fafc",
    text: "#0f172a",
  },
  fonts: {
    heading: "Inter",
    body: "Inter",
  },
  logos: {},
};

const mockContent: AdContent = {
  headline: "Förenkla din finansiella planering",
  bodyCopy:
    "Automatisera budgetering, prognoser och analys med en kraftfull plattform byggd för nordiska företag.",
  cta: "Boka demo",
  descriptions: [
    "Automatisera budgetering, prognoser och analys.",
    "Betrodd av 200+ nordiska företag.",
  ],
  sitelinks: [
    { text: "Priser" },
    { text: "Kundcase" },
    { text: "Om oss" },
    { text: "Kontakt" },
  ],
  callouts: ["Gratis test", "Ingen kreditkort", "Support dygnet runt"],
  badge: "NY RAPPORT",
};

async function main() {
  mkdirSync("tmp/templates", { recursive: true });

  for (const template of templates) {
    console.log(`Rendering ${template.id} (${template.width}x${template.height})...`);
    const png = await renderToImage(template, mockBrand, mockContent);
    const path = `tmp/templates/${template.id}.png`;
    writeFileSync(path, png);
    console.log(`  -> ${path} (${(png.length / 1024).toFixed(0)} KB)`);
  }

  console.log("\nAll 6 templates rendered successfully.");
}

main().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});
