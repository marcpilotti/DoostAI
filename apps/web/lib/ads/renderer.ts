/**
 * Satori → SVG → PNG rendering pipeline
 * Renders JSX ad templates to 1080x1080 PNG images
 *
 * Uses bundled Inter TTF fonts (packages/templates/fonts/) for reliable
 * rendering of Swedish characters (å, ä, ö) without CDN dependency.
 */

import { readFile } from "fs/promises";
import path from "path";

import { Resvg } from "@resvg/resvg-js";
import { type ReactElement } from "react";
import satori from "satori";

// Font loading — bundled Inter TTF files with full Latin-1 support
let fontData: ArrayBuffer | null = null;
let fontBoldData: ArrayBuffer | null = null;

// Google Fonts CDN as fallback if bundled files aren't available
const CDN_REGULAR = "https://fonts.gstatic.com/s/inter/v18/UcC73FwrK3iLTeHuS_fjbvMwCp50KnMa2JL7SUc.woff2";
const CDN_BOLD = "https://fonts.gstatic.com/s/inter/v18/UcC73FwrK3iLTeHuS_fjbvMwCp50KnMa0ZT7SUc.woff2";

async function loadBundledFont(weight: number): Promise<ArrayBuffer> {
  const fileName = weight >= 700 ? "inter-700.ttf" : "inter-400.ttf";
  // Try multiple paths — monorepo root differs between dev and Vercel
  const candidates = [
    path.join(process.cwd(), "../../packages/templates/fonts", fileName),
    path.join(process.cwd(), "packages/templates/fonts", fileName),
  ];
  for (const p of candidates) {
    try {
      const buf = await readFile(p);
      return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    } catch {
      // try next path
    }
  }
  // Fallback to CDN
  const res = await fetch(weight >= 700 ? CDN_BOLD : CDN_REGULAR);
  return await res.arrayBuffer();
}

async function getFonts() {
  if (!fontData) fontData = await loadBundledFont(400);
  if (!fontBoldData) fontBoldData = await loadBundledFont(800);

  return [
    { name: "Inter", data: fontData, weight: 400 as const, style: "normal" as const },
    { name: "Inter", data: fontBoldData, weight: 800 as const, style: "normal" as const },
  ];
}

export async function renderAdTemplate(
  element: ReactElement,
  options: { width?: number; height?: number } = {}
): Promise<Buffer> {
  const width = options.width || 1080;
  const height = options.height || 1080;

  const fonts = await getFonts();

  const svg = await satori(element, {
    width,
    height,
    fonts,
  });

  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: width },
  });

  const pngData = resvg.render();
  return Buffer.from(pngData.asPng());
}

export async function renderToDataUrl(element: ReactElement): Promise<string> {
  const png = await renderAdTemplate(element);
  return `data:image/png;base64,${png.toString("base64")}`;
}
