"use client";

import { useState, useRef } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  ThumbsUp,
  MessageCircle,
  Share2,
  Sparkles,
  Heart,
  Send,
  Bookmark,
  ImagePlus,
  Wand2,
  Pencil,
  Type,
  Palette,
  Zap,
  RotateCcw,
} from "lucide-react";

type CopyData = {
  id?: string;
  platform: string;
  variant?: string;
  label?: string;
  headline: string;
  bodyCopy: string;
  cta: string;
  headlines?: string[];
  descriptions?: string[];
};

type BrandData = {
  name: string;
  url: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  fonts?: { heading: string; body: string };
  industry?: string;
};

type CopyPreviewData = {
  copies: CopyData[];
  platforms: string[];
  brand?: BrandData;
  renderingImages?: boolean;
};

type AdFormat = "instagram" | "facebook";
type EditMode = null | "ai" | "manual";

function getGradient(primary?: string, accent?: string): string {
  if (primary && accent) {
    return `linear-gradient(135deg, ${primary} 0%, ${accent} 100%)`;
  }
  return "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)";
}

// ── Instagram Post Preview ──────────────────────────────────────
function InstagramPreview({
  copy,
  brand,
  bgImage,
  isSelected,
  isLoser,
  onPick,
}: {
  copy: CopyData;
  brand: BrandData;
  bgImage?: string;
  isSelected: boolean;
  isLoser: boolean;
  onPick: () => void;
}) {
  const gradient = getGradient(brand.colors.primary, brand.colors.accent);

  return (
    <button
      onClick={onPick}
      disabled={isSelected}
      className={`group relative w-full overflow-hidden rounded-2xl border-2 text-left transition-all duration-300 ${
        isSelected
          ? "border-emerald-400 shadow-lg ring-2 ring-emerald-200"
          : isLoser
            ? "border-border/20 opacity-40 hover:opacity-60"
            : "border-border/40 hover:border-indigo-300 hover:shadow-md"
      }`}
    >
      {isSelected && (
        <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2">
          <span className="flex items-center gap-1 rounded-b-lg bg-emerald-500 px-3 py-1 text-[10px] font-semibold text-white shadow-sm">
            <Check className="h-3 w-3" strokeWidth={3} /> Vald
          </span>
        </div>
      )}

      <div className="flex items-center justify-between bg-muted/30 px-3 py-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
          {copy.label ?? "Variant"}
        </span>
        {!isSelected && !isLoser && (
          <span className="text-[10px] font-medium text-indigo-400 opacity-0 transition-opacity group-hover:opacity-100">
            Välj denna
          </span>
        )}
      </div>

      <div className="bg-white">
        {/* IG Header */}
        <div className="flex items-center gap-2 px-3 py-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold text-white ring-2 ring-pink-400 ring-offset-1"
            style={{ backgroundColor: brand.colors.primary }}
          >
            {brand.name[0]}
          </div>
          <div className="flex-1">
            <div className="text-xs font-semibold">{brand.name.toLowerCase().replace(/\s+/g, "")}</div>
            <div className="text-[10px] text-gray-400">Sponsrad</div>
          </div>
          <MoreHorizontal className="h-4 w-4 text-gray-300" />
        </div>

        {/* Square image */}
        <div
          className="flex aspect-square items-center justify-center p-6 text-center"
          style={{
            background: bgImage ? `url(${bgImage}) center/cover` : gradient,
          }}
        >
          <div className="space-y-3">
            <div className="text-lg font-bold leading-tight text-white drop-shadow-md sm:text-xl">
              {copy.headline}
            </div>
            <div
              className="mx-auto inline-flex rounded-lg px-4 py-1.5 text-xs font-semibold shadow-sm"
              style={{ backgroundColor: "#ffffff", color: brand.colors.primary }}
            >
              {copy.cta}
            </div>
          </div>
        </div>

        {/* IG Actions */}
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-4">
            <Heart className="h-5 w-5 text-gray-700" />
            <MessageCircle className="h-5 w-5 text-gray-700" />
            <Send className="h-5 w-5 text-gray-700" />
          </div>
          <Bookmark className="h-5 w-5 text-gray-700" />
        </div>

        {/* Caption */}
        <div className="px-3 pb-3">
          <span className="text-xs">
            <span className="font-semibold">{brand.name.toLowerCase().replace(/\s+/g, "")}</span>{" "}
            <span className="text-gray-600">{copy.bodyCopy.slice(0, 80)}{copy.bodyCopy.length > 80 ? "..." : ""}</span>
          </span>
        </div>
      </div>
    </button>
  );
}

// ── Facebook Ad Preview ─────────────────────────────────────────
function FacebookPreview({
  copy,
  brand,
  bgImage,
  isSelected,
  isLoser,
  onPick,
}: {
  copy: CopyData;
  brand: BrandData;
  bgImage?: string;
  isSelected: boolean;
  isLoser: boolean;
  onPick: () => void;
}) {
  const gradient = getGradient(brand.colors.primary, brand.colors.accent);

  return (
    <button
      onClick={onPick}
      disabled={isSelected}
      className={`group relative w-full overflow-hidden rounded-2xl border-2 text-left transition-all duration-300 ${
        isSelected
          ? "border-emerald-400 shadow-lg ring-2 ring-emerald-200"
          : isLoser
            ? "border-border/20 opacity-40 hover:opacity-60"
            : "border-border/40 hover:border-indigo-300 hover:shadow-md"
      }`}
    >
      {isSelected && (
        <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2">
          <span className="flex items-center gap-1 rounded-b-lg bg-emerald-500 px-3 py-1 text-[10px] font-semibold text-white shadow-sm">
            <Check className="h-3 w-3" strokeWidth={3} /> Vald
          </span>
        </div>
      )}

      <div className="flex items-center justify-between bg-muted/30 px-3 py-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
          {copy.label ?? "Variant"}
        </span>
        {!isSelected && !isLoser && (
          <span className="text-[10px] font-medium text-indigo-400 opacity-0 transition-opacity group-hover:opacity-100">
            Välj denna
          </span>
        )}
      </div>

      <div className="bg-white">
        {/* FB Header */}
        <div className="flex items-center gap-2 px-3 py-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold text-white"
            style={{ backgroundColor: brand.colors.primary }}
          >
            {brand.name[0]}
          </div>
          <div className="flex-1">
            <div className="text-xs font-semibold">{brand.name}</div>
            <div className="text-[10px] text-gray-400">Sponsrad · <span className="inline-block h-2.5 w-2.5 rounded-full border border-gray-300 text-center text-[7px] leading-[10px]">🌐</span></div>
          </div>
          <MoreHorizontal className="h-4 w-4 text-gray-300" />
        </div>

        {/* Body text */}
        <div className="px-3 pb-2 text-xs leading-snug text-gray-800">{copy.bodyCopy}</div>

        {/* Creative — wider aspect for FB */}
        <div
          className="flex aspect-[1.91/1] items-center justify-center p-6 text-center"
          style={{
            background: bgImage ? `url(${bgImage}) center/cover` : gradient,
          }}
        >
          <div className="space-y-3">
            <div className="text-lg font-bold leading-tight text-white drop-shadow-md sm:text-xl">
              {copy.headline}
            </div>
            <div
              className="mx-auto inline-flex rounded-lg px-4 py-1.5 text-xs font-semibold shadow-sm"
              style={{ backgroundColor: "#ffffff", color: brand.colors.primary }}
            >
              {copy.cta}
            </div>
          </div>
        </div>

        {/* Link bar */}
        <div className="flex items-center justify-between bg-gray-50 px-3 py-2">
          <div>
            <div className="text-[10px] uppercase text-gray-400">
              {brand.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
            </div>
            <div className="text-xs font-semibold text-gray-800">{copy.headline.slice(0, 40)}</div>
          </div>
          <div
            className="rounded px-3 py-1.5 text-[10px] font-semibold"
            style={{ backgroundColor: brand.colors.primary, color: "#fff" }}
          >
            {copy.cta}
          </div>
        </div>

        {/* Engagement */}
        <div className="flex justify-around border-t px-2 py-1.5 text-[10px] text-gray-400">
          <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" /> Gilla</span>
          <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" /> Kommentera</span>
          <span className="flex items-center gap-1"><Share2 className="h-3 w-3" /> Dela</span>
        </div>
      </div>
    </button>
  );
}

// ── AI Prompt Suggestions ───────────────────────────────────────
const AI_PROMPTS = [
  { icon: Zap, label: "Kortare & punchigare", prompt: "Gör rubriken kortare och mer slagkraftig" },
  { icon: Palette, label: "Annan stil", prompt: "Prova en helt annan kreativ vinkel" },
  { icon: Type, label: "Mer professionell", prompt: "Gör texten mer professionell och affärsmässig" },
  { icon: RotateCcw, label: "Generera nya", prompt: "Generera helt nya annonsförslag" },
];

// ── Main Component ──────────────────────────────────────────────
export function CopyPreviewCard({
  data,
  onSendMessage,
}: {
  data: CopyPreviewData;
  onSendMessage?: (text: string) => void;
}) {
  const [format, setFormat] = useState<AdFormat>("instagram");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<EditMode>(null);
  const [bgImages, setBgImages] = useState<Record<string, string>>({});
  const [mobileIndex, setMobileIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTarget, setUploadTarget] = useState<string | null>(null);

  const variants = data.copies.slice(0, 2);
  if (!data.brand || variants.length === 0) return null;

  const Preview = format === "instagram" ? InstagramPreview : FacebookPreview;

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !uploadTarget) return;
    const url = URL.createObjectURL(file);
    setBgImages((prev) => ({ ...prev, [uploadTarget]: url }));
    setUploadTarget(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="animate-message-in mt-3 overflow-hidden rounded-2xl border border-border/40 bg-white/70 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/30 px-5 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500 to-purple-500">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold">Annonsförslag</div>
            <div className="text-[11px] text-muted-foreground">
              Välj format och variant
            </div>
          </div>
        </div>
      </div>

      {/* Format toggle */}
      <div className="flex gap-1 border-b border-border/30 bg-muted/20 px-4 py-2">
        <button
          onClick={() => { setFormat("instagram"); setSelectedId(null); setMobileIndex(0); }}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
            format === "instagram"
              ? "bg-white text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
            <circle cx="12" cy="12" r="5" />
            <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
          </svg>
          Instagram Post
        </button>
        <button
          onClick={() => { setFormat("facebook"); setSelectedId(null); setMobileIndex(0); }}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
            format === "facebook"
              ? "bg-white text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.563V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" />
          </svg>
          Facebook Annons
        </button>
      </div>

      {/* Desktop: side by side */}
      <div className="hidden gap-4 p-4 sm:grid sm:grid-cols-2">
        {variants.map((copy) => {
          const copyId = copy.id ?? `${copy.platform}-${copy.variant}`;
          return (
            <Preview
              key={`${format}-${copyId}`}
              copy={copy}
              brand={data.brand!}
              bgImage={bgImages[copyId]}
              isSelected={selectedId === copyId}
              isLoser={selectedId !== null && selectedId !== copyId}
              onPick={() => setSelectedId(copyId)}
            />
          );
        })}
      </div>

      {/* Mobile: swipeable */}
      <div className="p-4 sm:hidden">
        {variants[mobileIndex] && (() => {
          const copy = variants[mobileIndex]!;
          const copyId = copy.id ?? `${copy.platform}-${copy.variant}`;
          return (
            <div className="relative">
              <Preview
                copy={copy}
                brand={data.brand!}
                bgImage={bgImages[copyId]}
                isSelected={selectedId === copyId}
                isLoser={selectedId !== null && selectedId !== copyId}
                onPick={() => setSelectedId(copyId)}
              />
              {mobileIndex > 0 && (
                <button onClick={() => setMobileIndex((i) => i - 1)} className="absolute -left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md">
                  <ChevronLeft className="h-4 w-4" />
                </button>
              )}
              {mobileIndex < variants.length - 1 && (
                <button onClick={() => setMobileIndex((i) => i + 1)} className="absolute -right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md">
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          );
        })()}
        <div className="mt-3 flex justify-center gap-1.5">
          {variants.map((_, i) => (
            <button key={i} onClick={() => setMobileIndex(i)} className={`h-2 rounded-full transition-all ${i === mobileIndex ? "w-5 bg-indigo-500" : "w-2 bg-border/60"}`} />
          ))}
        </div>
      </div>

      {/* Editing toolbar */}
      <div className="border-t border-border/30 px-4 py-3">
        <div className="flex gap-2">
          <button
            onClick={() => setEditMode(editMode === "ai" ? null : "ai")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
              editMode === "ai"
                ? "bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200"
                : "bg-muted/40 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            }`}
          >
            <Wand2 className="h-3.5 w-3.5" />
            Redigera med AI
          </button>
          <button
            onClick={() => setEditMode(editMode === "manual" ? null : "manual")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
              editMode === "manual"
                ? "bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200"
                : "bg-muted/40 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            }`}
          >
            <Pencil className="h-3.5 w-3.5" />
            Redigera själv
          </button>
        </div>

        {/* AI prompt suggestions */}
        {editMode === "ai" && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            {AI_PROMPTS.map((p) => (
              <button
                key={p.label}
                onClick={() => onSendMessage?.(p.prompt)}
                className="flex items-center gap-2 rounded-xl border border-border/50 bg-white px-3 py-2.5 text-left text-xs font-medium text-muted-foreground transition-all hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600"
              >
                <p.icon className="h-3.5 w-3.5 shrink-0" />
                {p.label}
              </button>
            ))}
          </div>
        )}

        {/* Manual editing options */}
        {editMode === "manual" && (
          <div className="mt-3 space-y-2">
            {variants.map((copy) => {
              const copyId = copy.id ?? `${copy.platform}-${copy.variant}`;
              return (
                <div key={copyId} className="rounded-xl border border-border/50 bg-white p-3">
                  <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                    {copy.label}
                  </div>
                  <button
                    onClick={() => {
                      setUploadTarget(copyId);
                      fileInputRef.current?.click();
                    }}
                    className="mb-2 flex w-full items-center gap-2 rounded-lg border border-dashed border-border/60 bg-muted/10 px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-indigo-300 hover:bg-indigo-50/30 hover:text-indigo-600"
                  >
                    <ImagePlus className="h-3.5 w-3.5" />
                    {bgImages[copyId] ? "Byt bakgrundsbild" : "Ladda upp bakgrundsbild"}
                  </button>
                  {bgImages[copyId] && (
                    <div className="mb-2 flex items-center gap-2">
                      <div
                        className="h-8 w-8 rounded border bg-cover bg-center"
                        style={{ backgroundImage: `url(${bgImages[copyId]})` }}
                      />
                      <span className="text-[10px] text-emerald-600">Bild uppladdad</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />
      </div>

      {/* Footer */}
      {!selectedId && !editMode && (
        <div className="border-t border-border/30 px-5 py-2.5 text-center text-[11px] text-muted-foreground/50">
          Klicka på den variant du vill använda, eller redigera nedan
        </div>
      )}

      {selectedId && (
        <div className="border-t border-border/30 bg-emerald-50/50 px-5 py-2.5 text-center text-[11px] font-medium text-emerald-600">
          <Check className="mr-1 inline h-3 w-3" />
          Variant vald — skriv din budget för att gå vidare
        </div>
      )}
    </div>
  );
}
