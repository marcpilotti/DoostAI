import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY ?? "" });

const SIZE_MAP: Record<string, "1024x1024" | "1024x1536" | "1536x1024"> = {
  "1:1": "1024x1024",
  "4:5": "1024x1536",
  "16:9": "1536x1024",
  "9:16": "1024x1536",
};

export type OpenAIImageResult = {
  imageUrl: string;
  model: string;
  prompt: string;
};

export async function generateWithOpenAI(params: {
  prompt: string;
  size?: string;
}): Promise<OpenAIImageResult> {
  const size = SIZE_MAP[params.size ?? "1:1"] ?? "1024x1024";

  const response = await openai.images.generate({
    model: "gpt-image-1",
    prompt: params.prompt,
    n: 1,
    size,
    output_format: "png",
  });

  const imageUrl = response.data?.[0]?.url;
  if (!imageUrl) throw new Error("No image returned from OpenAI");

  return {
    imageUrl,
    model: "gpt_image_1_5",
    prompt: params.prompt,
  };
}

// ── Embedded text ad image generation ────────────────────────────

export type EmbeddedImageResult = {
  b64: string;
  prompt: string;
};

/**
 * Generate an ad image with text embedded directly by GPT-4o.
 * Returns base64 PNG so we can pass it to vision verification without
 * an extra network fetch.
 */
export async function generateEmbeddedAdImage(params: {
  prompt: string;
  size?: "1024x1024" | "1024x1536" | "1536x1024";
  quality?: "low" | "medium" | "high";
}): Promise<EmbeddedImageResult> {
  const response = await openai.images.generate({
    model: "gpt-image-1",
    prompt: params.prompt,
    n: 1,
    size: params.size ?? "1024x1024",
    quality: params.quality ?? "low",
    output_format: "jpeg",
  });

  const b64 = response.data?.[0]?.b64_json;
  if (!b64) throw new Error("No image returned from OpenAI");

  return { b64, prompt: params.prompt };
}

// ── Vision verification ─────────────────────────────────────────

/**
 * Send an image to GPT-4o and verify that the specified text appears
 * correctly rendered (including Swedish å, ä, ö).
 */
export async function verifyImageText(
  imageBase64: string,
  expectedText: string,
): Promise<{ correct: boolean; foundText?: string; issues?: string }> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 100,
    temperature: 0,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: { url: `data:image/png;base64,${imageBase64}`, detail: "low" },
          },
          {
            type: "text",
            text: `Does this image contain the exact text "${expectedText}" rendered correctly, including any Swedish characters (å, ä, ö)? Reply ONLY with JSON: {"correct": true/false, "found_text": "...", "issues": "..."}`,
          },
        ],
      },
    ],
  });

  const text = response.choices[0]?.message?.content ?? "";
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { correct: false, issues: "No JSON in response" };
    const parsed = JSON.parse(jsonMatch[0]) as { correct?: boolean; found_text?: string; issues?: string };
    return {
      correct: parsed.correct === true,
      foundText: parsed.found_text,
      issues: parsed.issues,
    };
  } catch {
    return { correct: false, issues: "Failed to parse vision response" };
  }
}
