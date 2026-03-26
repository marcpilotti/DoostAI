"use client";

import { MessageCircle, MoreHorizontal, Share2, ThumbsUp } from "lucide-react";

import { EditableText } from "./editable-text";

type MetaAdData = {
  brandName: string;
  brandUrl: string;
  primaryColor: string;
  accentColor?: string;
  headline: string;
  bodyCopy: string;
  cta: string;
  onEdit?: (field: string, value: string) => void;
};

export function MetaAdPreview({ data }: { data: MetaAdData }) {
  const domain = data.brandUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");

  return (
    <div className="w-full max-w-[400px] overflow-hidden rounded-lg border border-gray-200 bg-white font-sans text-[13px] text-gray-900 shadow-sm">
      {/* Post header */}
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
          style={{ backgroundColor: data.primaryColor }}
        >
          {data.brandName[0]}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-1">
            <span className="font-semibold">{data.brandName}</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-gray-500">
            <span>Sponsrad</span>
            <span>·</span>
            <svg className="h-3 w-3" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm3.7 6.7-4 4a1 1 0 0 1-1.4 0l-2-2a1 1 0 1 1 1.4-1.4L7 8.6l3.3-3.3a1 1 0 1 1 1.4 1.4z" />
            </svg>
          </div>
        </div>
        <MoreHorizontal className="h-5 w-5 text-gray-400" />
      </div>

      {/* Post text */}
      <div className="px-3 pb-2.5">
        <p className="text-sm leading-snug">
          <EditableText
            value={data.bodyCopy}
            maxLength={125}
            onSave={(v) => data.onEdit?.("bodyCopy", v)}
          />
        </p>
      </div>

      {/* Creative image */}
      <div
        className="flex aspect-square w-full items-center justify-center p-8 text-center"
        style={{
          background: `linear-gradient(135deg, ${data.primaryColor} 0%, ${data.accentColor ?? data.primaryColor}cc 100%)`,
        }}
      >
        <span className="text-2xl font-bold leading-tight text-white">
          <EditableText
            value={data.headline}
            maxLength={40}
            onSave={(v) => data.onEdit?.("headline", v)}
          />
        </span>
      </div>

      {/* Link preview bar */}
      <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-3 py-2.5">
        <div className="min-w-0 flex-1">
          <div className="truncate text-[11px] uppercase text-gray-500">
            {domain}
          </div>
          <div className="truncate text-sm font-semibold">{data.headline}</div>
        </div>
        <div
          className="ml-3 shrink-0 rounded-md px-4 py-2 text-sm font-semibold text-white"
          style={{ backgroundColor: data.primaryColor }}
        >
          <EditableText
            value={data.cta}
            maxLength={20}
            onSave={(v) => data.onEdit?.("cta", v)}
          />
        </div>
      </div>

      {/* Engagement bar */}
      <div className="flex items-center justify-around border-t border-gray-100 px-2 py-1.5">
        <button className="flex items-center gap-1.5 rounded px-3 py-1.5 text-gray-500 hover:bg-gray-50">
          <ThumbsUp className="h-4 w-4" />
          <span className="text-[12px] font-medium">Gilla</span>
        </button>
        <button className="flex items-center gap-1.5 rounded px-3 py-1.5 text-gray-500 hover:bg-gray-50">
          <MessageCircle className="h-4 w-4" />
          <span className="text-[12px] font-medium">Kommentera</span>
        </button>
        <button className="flex items-center gap-1.5 rounded px-3 py-1.5 text-gray-500 hover:bg-gray-50">
          <Share2 className="h-4 w-4" />
          <span className="text-[12px] font-medium">Dela</span>
        </button>
      </div>
    </div>
  );
}

export default MetaAdPreview;
