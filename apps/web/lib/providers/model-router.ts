import { generateWithFal, isFalModel } from "./fal";
import { generateWithOpenAI } from "./openai-image";

export type ImageGenParams = {
  model: string;
  prompt: string;
  size?: string;
  referenceImages?: string[];
};

export type ImageGenResult = {
  imageUrl: string;
  model: string;
  prompt: string;
  creditCost: number;
};

const CREDIT_COSTS: Record<string, number> = {
  flux_schnell: 2,
  flux_pro: 4,
  seedream_4_5: 4,
  gpt_image_1_5: 5,
  nano_banana_pro: 8,
};

const PLAN_MODELS: Record<string, string[]> = {
  starter: ["flux_schnell"],
  growth: ["flux_schnell", "flux_pro", "gpt_image_1_5", "seedream_4_5"],
  scale: ["flux_schnell", "flux_pro", "gpt_image_1_5", "seedream_4_5", "nano_banana_pro"],
};

export function getAvailableModels(planId: string): Array<{ id: string; label: string; cost: number; available: boolean }> {
  const allowed = PLAN_MODELS[planId] ?? PLAN_MODELS.starter!;
  const allModels = [
    { id: "flux_schnell", label: "FLUX Schnell", cost: 2 },
    { id: "flux_pro", label: "FLUX Pro", cost: 4 },
    { id: "seedream_4_5", label: "Seedream 4.5", cost: 4 },
    { id: "gpt_image_1_5", label: "GPT Image 1.5", cost: 5 },
    { id: "nano_banana_pro", label: "Nano Banana Pro 4K", cost: 8 },
  ];
  return allModels.map((m) => ({ ...m, available: allowed.includes(m.id) }));
}

export function getCreditCost(model: string): number {
  return CREDIT_COSTS[model] ?? 2;
}

export async function generateImage(params: ImageGenParams): Promise<ImageGenResult> {
  const cost = getCreditCost(params.model);

  let imageUrl: string;

  if (params.model === "gpt_image_1_5") {
    const result = await generateWithOpenAI({
      prompt: params.prompt,
      size: params.size,
    });
    imageUrl = result.imageUrl;
  } else if (isFalModel(params.model)) {
    const result = await generateWithFal({
      model: params.model,
      prompt: params.prompt,
      size: params.size,
      referenceImages: params.referenceImages,
    });
    imageUrl = result.imageUrl;
  } else {
    throw new Error(`Unknown model: ${params.model}`);
  }

  return {
    imageUrl,
    model: params.model,
    prompt: params.prompt,
    creditCost: cost,
  };
}
