/**
 * Satori → SVG → PNG rendering pipeline
 * Renders JSX ad templates to 1080x1080 PNG images
 */

import { Resvg } from "@resvg/resvg-js";
import { type ReactElement } from "react";
import satori from "satori";

// Font loading — use Inter from Google Fonts CDN
let fontData: ArrayBuffer | null = null;
let fontBoldData: ArrayBuffer | null = null;

async function loadFont(weight: number): Promise<ArrayBuffer> {
  const url = `https://fonts.gstatic.com/s/inter/v18/UcC73FwrK3iLTeHuS_fjbvMwCp50KnMa2JL7SUc.woff2`;
  const boldUrl = `https://fonts.gstatic.com/s/inter/v18/UcC73FwrK3iLTeHuS_fjbvMwCp50KnMa0ZT7SUc.woff2`;
  const res = await fetch(weight >= 700 ? boldUrl : url);
  return await res.arrayBuffer();
}

async function getFonts() {
  if (!fontData) fontData = await loadFont(400);
  if (!fontBoldData) fontBoldData = await loadFont(800);

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
