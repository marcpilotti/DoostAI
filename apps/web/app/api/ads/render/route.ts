import { NextRequest, NextResponse } from "next/server";

import { generateBrandGradient } from "@/lib/ads/gradients";
import { renderAdTemplate } from "@/lib/ads/renderer";
import { BrandTemplate } from "@/lib/ads/templates/brand";
import { HeroTemplate } from "@/lib/ads/templates/hero";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      template = "hero",
      headline = "",
      bodyCopy = "",
      cta = "Läs mer",
      brandName = "",
      logoUrl,
      imageUrl,
      colors = { primary: "#6366F1" },
    } = body;

    const gradient = generateBrandGradient(colors);

    let element;
    if (template === "brand") {
      element = BrandTemplate({
        headline,
        bodyCopy,
        cta,
        brandName,
        logoUrl,
        gradient,
        primaryColor: colors.primary,
      });
    } else {
      element = HeroTemplate({
        headline,
        bodyCopy,
        cta,
        brandName,
        logoUrl,
        imageUrl,
        gradient,
        primaryColor: colors.primary,
      });
    }

    const png = await renderAdTemplate(element as React.ReactElement);

    return new NextResponse(new Uint8Array(png), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Ad render error:", error);
    return NextResponse.json(
      { error: "Rendering failed" },
      { status: 500 }
    );
  }
}
