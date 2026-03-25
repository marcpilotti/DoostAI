"use client";

import { useState } from "react";
import { Check, ArrowRight, Megaphone } from "lucide-react";

type Channel = {
  id: string;
  label: string;
  description: string;
};

type ChannelPickerData = {
  channels: Channel[];
};

const PLATFORM_CONFIG: Record<
  string,
  { color: string; bg: string; borderActive: string; icon: React.ReactNode; features: string[] }
> = {
  meta: {
    color: "#1877F2",
    bg: "from-[#1877F2]/5 to-[#1877F2]/10",
    borderActive: "border-[#1877F2]/60 ring-[#1877F2]/20",
    features: ["Feed & Stories", "Reels", "Instagram"],
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.563V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" />
      </svg>
    ),
  },
  google: {
    color: "#ffffff",
    bg: "from-[#4285F4]/5 to-[#34A853]/5",
    borderActive: "border-[#4285F4]/60 ring-[#4285F4]/20",
    features: ["Sök", "Display", "YouTube"],
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.1a6.5 6.5 0 0 1 0-4.2V7.06H2.18A10.96 10.96 0 0 0 1 12c0 1.77.43 3.45 1.18 4.94l3.66-2.84z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
      </svg>
    ),
  },
  linkedin: {
    color: "#0077B5",
    bg: "from-[#0077B5]/5 to-[#0077B5]/10",
    borderActive: "border-[#0077B5]/60 ring-[#0077B5]/20",
    features: ["Sponsored", "InMail", "B2B"],
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  tiktok: {
    color: "#000000",
    bg: "from-[#000000]/5 to-[#69C9D0]/10",
    borderActive: "border-[#000000]/60 ring-[#69C9D0]/20",
    features: ["In-Feed", "TopView", "Spark Ads"],
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15.2a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.73a8.19 8.19 0 0 0 4.76 1.52v-3.4a4.85 4.85 0 0 1-1-.16z" />
      </svg>
    ),
  },
  snapchat: {
    color: "#FFFC00",
    bg: "from-[#FFFC00]/5 to-[#FFFC00]/10",
    borderActive: "border-[#FFFC00]/60 ring-[#FFFC00]/20",
    features: ["Snap Ads", "Story Ads", "AR Lens"],
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12.922-.238.38-.168.735-.145.984.068.275.236.39.6.293.93-.106.38-.446.71-.84.94-.23.13-.492.23-.758.31-.082.024-.164.04-.245.066a.83.83 0 0 0-.06.018c-.108.045-.18.12-.18.21 0 .04.012.08.03.12l.07.13c.47.89.955 1.42 1.518 1.86.328.256.674.45 1.05.615.395.18.59.455.59.72 0 .18-.074.36-.219.51-.324.33-.947.5-1.5.585-.19.03-.36.06-.51.12-.15.06-.24.15-.3.27-.075.15-.15.39-.21.555-.06.17-.18.36-.39.45a1.44 1.44 0 0 1-.57.12c-.21 0-.48-.06-.78-.18a4.87 4.87 0 0 0-.72-.21c-.15-.03-.3-.045-.45-.045-.27 0-.54.045-.81.12-.42.12-.69.225-1.17.45-1.005.465-1.53.705-2.34.705h-.03c-.81 0-1.335-.24-2.34-.705-.48-.225-.75-.33-1.17-.45-.27-.075-.54-.12-.81-.12-.15 0-.3.015-.45.045-.27.045-.51.12-.72.21-.3.12-.57.18-.78.18-.21 0-.42-.04-.57-.12-.21-.09-.33-.28-.39-.45-.06-.165-.135-.405-.21-.555-.06-.12-.15-.21-.3-.27-.15-.06-.32-.09-.51-.12-.555-.09-1.176-.255-1.5-.585A.68.68 0 0 1 1 16.56c0-.27.18-.54.59-.72.39-.18.72-.36 1.05-.615.555-.435 1.035-.96 1.5-1.845l.06-.12c.03-.06.045-.12.045-.18 0-.09-.075-.165-.18-.21a2.86 2.86 0 0 0-.06-.018 3.85 3.85 0 0 1-.243-.066c-.27-.084-.528-.18-.758-.31-.396-.225-.735-.555-.84-.94-.097-.33.018-.694.293-.93.249-.21.594-.24.984-.068.263.12.623.222.922.238.195 0 .33-.045.4-.09a9.87 9.87 0 0 1-.03-.51l-.002-.06c-.105-1.63-.23-3.655.299-4.847C7.85 1.069 11.216.793 12.206.793z" />
      </svg>
    ),
  },
  pinterest: {
    color: "#E60023",
    bg: "from-[#E60023]/5 to-[#E60023]/10",
    borderActive: "border-[#E60023]/60 ring-[#E60023]/20",
    features: ["Pins", "Shopping", "Idea Ads"],
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z" />
      </svg>
    ),
  },
};

export function ChannelPicker({
  data,
  onSelect,
}: {
  data: ChannelPickerData;
  onSelect?: (channels: string[]) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="animate-message-in mt-3 overflow-hidden rounded-2xl border border-border/40 bg-white/70 backdrop-blur-sm">
      <div className="flex items-center gap-2 border-b border-border/30 px-5 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
          <Megaphone className="h-4 w-4 text-indigo-500" />
        </div>
        <div>
          <div className="text-sm font-semibold">Välj annonskanal</div>
          <div className="text-[11px] text-muted-foreground">
            Välj en plattform att skapa annons för
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3">
        {data.channels.map((ch) => {
          const isSelected = selected === ch.id;
          const config = PLATFORM_CONFIG[ch.id];
          return (
            <button
              key={ch.id}
              onClick={() => setSelected(ch.id)}
              className={`group relative flex flex-col items-center gap-3 rounded-xl border-2 px-3 py-4 text-center transition-all duration-200 ${
                isSelected
                  ? `bg-gradient-to-b ${config?.bg} ${config?.borderActive} shadow-md ring-2`
                  : "border-border/50 bg-white hover:border-border hover:shadow-sm"
              }`}
            >
              {isSelected && (
                <div
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full text-white shadow-sm"
                  style={{ backgroundColor: config?.color === "#ffffff" || config?.color === "#FFFC00" ? "#4285F4" : config?.color }}
                >
                  <Check className="h-3 w-3" strokeWidth={3} />
                </div>
              )}

              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl shadow-sm transition-transform duration-200 group-hover:scale-105 ${
                  isSelected ? "shadow-md" : ""
                } ${config?.color === "#ffffff" ? "border border-border/40 text-inherit" : config?.color === "#FFFC00" ? "border border-border/40 text-black" : "text-white"}`}
                style={{ backgroundColor: config?.color ?? "#6366f1" }}
              >
                {config?.icon}
              </div>

              <div>
                <div className="text-xs font-semibold">{ch.label}</div>
                <div className="text-[10px] text-muted-foreground">
                  {ch.description}
                </div>
              </div>

              {config?.features && (
                <div className="flex flex-wrap justify-center gap-1">
                  {config.features.map((f) => (
                    <span
                      key={f}
                      className="rounded-full bg-muted/50 px-1.5 py-0.5 text-[8px] font-medium text-muted-foreground"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="border-t border-border/30 px-5 py-3">
          <button
            onClick={() => onSelect?.([selected])}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-indigo-600 hover:to-indigo-700 hover:shadow-md"
          >
            Skapa annons
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
