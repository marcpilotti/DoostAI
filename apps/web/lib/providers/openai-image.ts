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
