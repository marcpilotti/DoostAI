import { readFileSync } from "fs";
import { join } from "path";

import { Resvg } from "@resvg/resvg-js";
import satori from "satori";

import type { AdContent, BrandInput, Template } from "./types";

export function renderTemplate(
  template: Template,
  brand: BrandInput,
  content: AdContent,
) {
  return template.render(brand, content);
}

// Load bundled Inter TTF fonts
const fontsDir = join(__dirname, "..", "fonts");

let regularFont: Buffer | null = null;
let boldFont: Buffer | null = null;

function getRegularFont(): Buffer {
  if (!regularFont) regularFont = readFileSync(join(fontsDir, "inter-400.ttf"));
  return regularFont;
}

function getBoldFont(): Buffer {
  if (!boldFont) boldFont = readFileSync(join(fontsDir, "inter-700.ttf"));
  return boldFont;
}

export async function renderToSvg(
  template: Template,
  brand: BrandInput,
  content: AdContent,
): Promise<string> {
  const element = template.render(brand, content);

  return satori(element as React.ReactElement, {
    width: template.width,
    height: template.height,
    fonts: [
      {
        name: brand.fonts.heading,
        data: getBoldFont(),
        weight: 700,
        style: "normal",
      },
      {
        name: brand.fonts.body,
        data: getRegularFont(),
        weight: 400,
        style: "normal",
      },
      // Fallback font names so Satori always finds a match
      {
        name: "Inter",
        data: getRegularFont(),
        weight: 400,
        style: "normal",
      },
      {
        name: "Inter",
        data: getBoldFont(),
        weight: 700,
        style: "normal",
      },
    ],
  });
}

export async function renderToImage(
  template: Template,
  brand: BrandInput,
  content: AdContent,
): Promise<Buffer> {
  const svg = await renderToSvg(template, brand, content);
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: template.width },
  });
  const pngData = resvg.render();
  return Buffer.from(pngData.asPng());
}
