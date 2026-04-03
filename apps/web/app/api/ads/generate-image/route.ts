import { NextRequest, NextResponse } from "next/server";

import { generateAdImage } from "@/lib/ads/image-generator";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { industry, description, brandName } = await req.json();

    const result = await generateAdImage({
      industry: industry || "",
      description: description || "",
      brandName: brandName || "",
    });

    if (result.url) {
      return NextResponse.json({ success: true, imageUrl: result.url });
    }

    return NextResponse.json(
      { success: false, error: result.error || "No image generated" },
      { status: 200 } // 200 so client doesn't treat as fatal error
    );
  } catch (error) {
    console.error("Image generation error:", error);
    return NextResponse.json(
      { success: false, error: "Image generation failed" },
      { status: 200 }
    );
  }
}
