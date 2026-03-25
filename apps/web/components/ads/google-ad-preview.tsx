"use client";

import { EditableText } from "./editable-text";

type GoogleAdData = {
  brandName: string;
  brandUrl: string;
  headline: string;
  bodyCopy: string;
  headlines?: string[];
  descriptions?: string[];
  onEdit?: (field: string, value: string) => void;
};

export function GoogleAdPreview({ data }: { data: GoogleAdData }) {
  const domain = data.brandUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const displayHeadline =
    data.headlines?.join(" | ") ?? data.headline;
  const displayDesc =
    data.descriptions?.join(" ") ?? data.bodyCopy;

  return (
    <div className="w-full max-w-[480px] rounded-lg border border-gray-200 bg-white p-4 font-sans shadow-sm">
      {/* URL line */}
      <div className="flex items-center gap-2">
        <div className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-gray-100">
          <svg className="h-3.5 w-3.5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-normal text-gray-900">
              {data.brandName}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[12px] text-gray-600">
            <span>{domain}</span>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-1 rounded bg-[#e8f0fe] px-1.5 py-0.5">
          <span className="text-[11px] font-bold text-[#1a73e8]">Annons</span>
        </div>
      </div>

      {/* Headline */}
      <div className="mt-2">
        <a
          href="#"
          className="text-xl font-normal leading-tight text-[#1a0dab] hover:underline"
          onClick={(e) => e.preventDefault()}
        >
          <EditableText
            value={displayHeadline}
            maxLength={30}
            onSave={(v) => data.onEdit?.("headline", v)}
          />
        </a>
      </div>

      {/* Description */}
      <div className="mt-1">
        <p className="text-sm leading-relaxed text-[#4d5156]">
          <EditableText
            value={displayDesc}
            maxLength={90}
            onSave={(v) => data.onEdit?.("bodyCopy", v)}
          />
        </p>
      </div>

      {/* Sitelink pills */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {["Priser", "Kundcase", "Om oss", "Kontakt"].map((link) => (
          <span
            key={link}
            className="rounded-full border border-gray-200 px-3 py-1 text-[12px] text-[#1a0dab]"
          >
            {link}
          </span>
        ))}
      </div>
    </div>
  );
}

export default GoogleAdPreview;
