"use client";

import { useState, useCallback } from "react";
import {
  ArrowLeft,
  ChevronDown,
  Image as ImageIcon,
  Sparkles,
  Upload,
  Wand2,
} from "lucide-react";
import Link from "next/link";

import { getAvailableModels, getCreditCost } from "@/lib/providers/model-router";

// ── Style presets ────────────────────────────────────────────────

const STYLE_PRESETS = [
  { id: "product", label: "Product photo" },
  { id: "lifestyle", label: "Lifestyle" },
  { id: "flatlay", label: "Flat lay" },
  { id: "studio", label: "Studio" },
  { id: "outdoor", label: "Outdoor" },
  { id: "abstract", label: "Abstract" },
];

const SIZES = [
  { id: "1:1", label: "1:1", desc: "Square" },
  { id: "4:5", label: "4:5", desc: "Portrait" },
  { id: "16:9", label: "16:9", desc: "Landscape" },
  { id: "9:16", label: "9:16", desc: "Story" },
];

type GeneratedImage = {
  id: string;
  url: string;
  model: string;
  prompt: string;
};

// ── Component ────────────────────────────────────────────────────

export default function CreativeStudioPage() {
  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState("flux_schnell");
  const [selectedStyle, setSelectedStyle] = useState("product");
  const [selectedSize, setSelectedSize] = useState("1:1");
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<GeneratedImage[]>([]);
  const [balance, setBalance] = useState(2500);
  const [error, setError] = useState<string | null>(null);

  const models = getAvailableModels("growth"); // TODO: get from user's plan
  const currentModel = models.find((m) => m.id === selectedModel);
  const cost = getCreditCost(selectedModel);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    setError(null);

    const fullPrompt = `${STYLE_PRESETS.find((s) => s.id === selectedStyle)?.label ?? ""} style: ${prompt}`;

    try {
      const res = await fetch("/api/ai/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: selectedModel,
          prompt: fullPrompt,
          size: selectedSize,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Generation failed");
      }

      const data = await res.json();
      setResults((prev) => [
        { id: Date.now().toString(), url: data.imageUrl, model: selectedModel, prompt: fullPrompt },
        ...prev,
      ]);
      setBalance(data.creditsRemaining);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, selectedModel, selectedStyle, selectedSize, isGenerating]);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b px-6 py-4" style={{ borderColor: "var(--doost-border)" }}>
        <Link href="/dashboard/creatives" className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--doost-text-secondary)] hover:bg-[var(--doost-bg)]">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-[15px] font-semibold text-[var(--doost-text)]">Creative Studio</h1>
          <p className="text-[12px] text-[var(--doost-text-muted)]">Generate ad images with AI</p>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium" style={{ border: `1px solid var(--doost-border)` }}>
          <Sparkles className="h-3 w-3 text-[var(--doost-text-muted)]" />
          <span className="text-[var(--doost-text)]">{balance.toLocaleString()}</span>
          <span className="text-[var(--doost-text-muted)]">credits</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left — prompt + controls */}
        <div className="flex w-96 shrink-0 flex-col border-r p-6" style={{ borderColor: "var(--doost-border)" }}>
          {/* Prompt */}
          <div className="mb-4">
            <label className="mb-1.5 block text-[12px] font-medium text-[var(--doost-text-secondary)]">Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the image you want to generate..."
              rows={4}
              className="w-full rounded-lg bg-[var(--doost-bg)] px-3 py-2.5 text-[13px] text-[var(--doost-text)] outline-none placeholder:text-[var(--doost-text-muted)] focus:ring-2 focus:ring-[var(--doost-bg-active)]/20"
              style={{ border: `1px solid var(--doost-border)` }}
            />
          </div>

          {/* Style presets */}
          <div className="mb-4">
            <label className="mb-1.5 block text-[12px] font-medium text-[var(--doost-text-secondary)]">Style</label>
            <div className="flex flex-wrap gap-1.5">
              {STYLE_PRESETS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedStyle(s.id)}
                  className={`rounded-lg px-3 py-1.5 text-[12px] font-medium transition-all ${
                    selectedStyle === s.id
                      ? "bg-[var(--doost-bg-active)] text-white"
                      : "bg-[var(--doost-bg)] text-[var(--doost-text-secondary)] hover:text-[var(--doost-text)]"
                  }`}
                  style={selectedStyle !== s.id ? { border: `1px solid var(--doost-border)` } : undefined}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Size */}
          <div className="mb-4">
            <label className="mb-1.5 block text-[12px] font-medium text-[var(--doost-text-secondary)]">Size</label>
            <div className="flex gap-1.5">
              {SIZES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSize(s.id)}
                  className={`flex-1 rounded-lg py-2 text-center transition-all ${
                    selectedSize === s.id
                      ? "bg-[var(--doost-bg-active)] text-white"
                      : "bg-[var(--doost-bg)] text-[var(--doost-text-secondary)] hover:text-[var(--doost-text)]"
                  }`}
                  style={selectedSize !== s.id ? { border: `1px solid var(--doost-border)` } : undefined}
                >
                  <div className="text-[12px] font-semibold">{s.label}</div>
                  <div className={`text-[10px] ${selectedSize === s.id ? "text-white/60" : "text-[var(--doost-text-muted)]"}`}>{s.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Model */}
          <div className="mb-4">
            <label className="mb-1.5 block text-[12px] font-medium text-[var(--doost-text-secondary)]">Model</label>
            <div className="space-y-1">
              {models.map((m) => (
                <button
                  key={m.id}
                  onClick={() => m.available && setSelectedModel(m.id)}
                  disabled={!m.available}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition-all ${
                    selectedModel === m.id
                      ? "bg-[var(--doost-bg-active)] text-white"
                      : m.available
                        ? "bg-[var(--doost-bg)] text-[var(--doost-text)] hover:bg-[var(--doost-bg-secondary)]"
                        : "bg-[var(--doost-bg)] text-[var(--doost-text-muted)] opacity-50"
                  }`}
                  style={selectedModel !== m.id ? { border: `1px solid var(--doost-border)` } : undefined}
                >
                  <span className="text-[12px] font-medium">{m.label}</span>
                  <span className={`text-[11px] ${selectedModel === m.id ? "text-white/60" : "text-[var(--doost-text-muted)]"}`}>
                    {m.available ? `${m.cost} credits` : "Upgrade"}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating || balance < cost}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--doost-bg-active)] py-3 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {isGenerating ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4" />
                Generate — {cost} credits
              </>
            )}
          </button>

          {error && (
            <p className="mt-2 text-[12px] text-[var(--doost-text-negative)]">{error}</p>
          )}
        </div>

        {/* Right — results grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {results.length === 0 && !isGenerating && (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <ImageIcon className="mb-3 h-10 w-10 text-[var(--doost-text-muted)] opacity-30" />
              <p className="text-[14px] font-medium text-[var(--doost-text-secondary)]">No images yet</p>
              <p className="mt-1 text-[12px] text-[var(--doost-text-muted)]">Write a prompt and generate your first ad image</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {isGenerating && (
              <div className="aspect-square animate-pulse rounded-xl bg-[var(--doost-bg)] flex items-center justify-center" style={{ border: `1px solid var(--doost-border)` }}>
                <div className="flex flex-col items-center gap-2">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--doost-text-muted)] border-t-[var(--doost-text)]" />
                  <p className="text-[11px] text-[var(--doost-text-muted)]">Generating...</p>
                </div>
              </div>
            )}
            {results.map((img) => (
              <div key={img.id} className="group relative overflow-hidden rounded-xl" style={{ border: `1px solid var(--doost-border)` }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt={img.prompt} className="aspect-square w-full object-cover" />
                {/* Hover actions */}
                <div className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-black/80 to-transparent p-3 transition-transform group-hover:translate-y-0">
                  <div className="flex gap-1.5">
                    <button className="flex-1 rounded-md bg-white px-2 py-1.5 text-[11px] font-medium text-[var(--doost-text)] hover:bg-white/90">
                      Use as creative
                    </button>
                    <button className="flex-1 rounded-md bg-white/20 px-2 py-1.5 text-[11px] font-medium text-white hover:bg-white/30">
                      Generate similar
                    </button>
                  </div>
                </div>
                {/* Model badge */}
                <div className="absolute left-2 top-2 rounded-md bg-black/50 px-1.5 py-0.5 text-[9px] font-medium text-white/80">
                  {models.find((m) => m.id === img.model)?.label ?? img.model}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
