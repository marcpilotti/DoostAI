import * as fal from "@fal-ai/serverless-client";

fal.config({ credentials: process.env.FAL_KEY ?? "" });

const MODEL_ENDPOINTS: Record<string, string> = {
  flux_schnell: "fal-ai/flux/schnell",
  flux_pro: "fal-ai/flux-2-pro",
  seedream_4_5: "fal-ai/seedream-v4.5",
  nano_banana_pro: "fal-ai/nano-banana-pro",
};

const SIZE_MAP: Record<string, { width: number; height: number }> = {
  "1:1": { width: 1024, height: 1024 },
  "4:5": { width: 1024, height: 1280 },
  "16:9": { width: 1536, height: 864 },
  "9:16": { width: 864, height: 1536 },
};

export type FalResult = {
  imageUrl: string;
  model: string;
  prompt: string;
  width: number;
  height: number;
};

export async function generateWithFal(params: {
  model: string;
  prompt: string;
  size?: string;
  referenceImages?: string[];
}): Promise<FalResult> {
  const endpoint = MODEL_ENDPOINTS[params.model];
  if (!endpoint) throw new Error(`Unknown fal model: ${params.model}`);

  const dims = SIZE_MAP[params.size ?? "1:1"] ?? SIZE_MAP["1:1"]!;

  const input: Record<string, unknown> = {
    prompt: params.prompt,
    image_size: { width: dims.width, height: dims.height },
    num_images: 1,
  };

  // Nano Banana Pro supports reference images
  if (params.model === "nano_banana_pro" && params.referenceImages?.length) {
    input.reference_images = params.referenceImages.map((url) => ({ url }));
  }

  const result = await fal.subscribe(endpoint, { input }) as {
    images?: Array<{ url: string }>;
    data?: Array<{ url: string }>;
  };

  const imageUrl = result.images?.[0]?.url ?? result.data?.[0]?.url;
  if (!imageUrl) throw new Error("No image returned from fal.ai");

  return {
    imageUrl,
    model: params.model,
    prompt: params.prompt,
    width: dims.width,
    height: dims.height,
  };
}

export function isFalModel(model: string): boolean {
  return model in MODEL_ENDPOINTS;
}
