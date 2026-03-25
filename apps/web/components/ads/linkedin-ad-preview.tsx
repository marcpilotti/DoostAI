"use client";

import { MoreHorizontal, ThumbsUp, MessageCircle, Repeat2, Send } from "lucide-react";

import { EditableText } from "./editable-text";

type LinkedInAdData = {
  brandName: string;
  brandUrl: string;
  primaryColor: string;
  headline: string;
  bodyCopy: string;
  cta: string;
  employeeCount?: number;
  onEdit?: (field: string, value: string) => void;
};

export function LinkedInAdPreview({ data }: { data: LinkedInAdData }) {
  const followers = data.employeeCount
    ? `${data.employeeCount.toLocaleString("sv-SE")} anställda`
    : "1 000+ följare";

  return (
    <div className="w-full max-w-[480px] overflow-hidden rounded-lg border border-gray-200 bg-white font-sans text-[13px] text-gray-900 shadow-sm">
      {/* Post header */}
      <div className="flex items-start gap-2.5 px-4 pt-3 pb-2">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded text-base font-bold text-white"
          style={{ backgroundColor: data.primaryColor }}
        >
          {data.brandName[0]}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold leading-tight">{data.brandName}</div>
          <div className="mt-0.5 text-[11px] leading-tight text-gray-500">
            {followers}
          </div>
          <div className="mt-0.5 flex items-center gap-1 text-[11px] text-gray-500">
            <span>Sponsrad</span>
            <span>·</span>
            <svg className="h-3 w-3" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm3.7 6.7-4 4a1 1 0 0 1-1.4 0l-2-2a1 1 0 1 1 1.4-1.4L7 8.6l3.3-3.3a1 1 0 1 1 1.4 1.4z" />
            </svg>
          </div>
        </div>
        <MoreHorizontal className="h-5 w-5 shrink-0 text-gray-400" />
      </div>

      {/* Post text */}
      <div className="px-4 pb-3">
        <p className="text-sm leading-snug">
          <EditableText
            value={data.bodyCopy}
            maxLength={150}
            onSave={(v) => data.onEdit?.("bodyCopy", v)}
          />
        </p>
      </div>

      {/* Creative image */}
      <div
        className="flex aspect-[1200/627] w-full items-center justify-center p-10 text-center"
        style={{
          background: `linear-gradient(135deg, ${data.primaryColor} 0%, ${data.primaryColor}99 100%)`,
        }}
      >
        <span className="text-xl font-bold leading-tight text-white">
          <EditableText
            value={data.headline}
            maxLength={70}
            onSave={(v) => data.onEdit?.("headline", v)}
          />
        </span>
      </div>

      {/* Link bar with CTA */}
      <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-4 py-2.5">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{data.headline}</div>
          <div className="truncate text-[11px] text-gray-500">
            {data.brandUrl.replace(/^https?:\/\//, "")}
          </div>
        </div>
        <button
          className="ml-3 shrink-0 rounded-full px-5 py-1.5 text-sm font-semibold text-white"
          style={{
            backgroundColor: data.primaryColor,
          }}
        >
          <EditableText
            value={data.cta}
            maxLength={20}
            onSave={(v) => data.onEdit?.("cta", v)}
          />
        </button>
      </div>

      {/* Engagement bar */}
      <div className="flex items-center justify-around border-t border-gray-100 px-2 py-1">
        <button className="flex items-center gap-1.5 rounded px-3 py-2 text-gray-500 hover:bg-gray-50">
          <ThumbsUp className="h-4 w-4" />
          <span className="text-[12px]">Gilla</span>
        </button>
        <button className="flex items-center gap-1.5 rounded px-3 py-2 text-gray-500 hover:bg-gray-50">
          <MessageCircle className="h-4 w-4" />
          <span className="text-[12px]">Kommentera</span>
        </button>
        <button className="flex items-center gap-1.5 rounded px-3 py-2 text-gray-500 hover:bg-gray-50">
          <Repeat2 className="h-4 w-4" />
          <span className="text-[12px]">Reposta</span>
        </button>
        <button className="flex items-center gap-1.5 rounded px-3 py-2 text-gray-500 hover:bg-gray-50">
          <Send className="h-4 w-4" />
          <span className="text-[12px]">Skicka</span>
        </button>
      </div>
    </div>
  );
}

export default LinkedInAdPreview;
