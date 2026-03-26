"use client";

import { ExternalLink, Linkedin } from "lucide-react";

type LinkedInConnectData = {
  oauthUrl: string;
  message: string;
};

export function LinkedInConnect({ data }: { data: LinkedInConnectData }) {
  return (
    <div className="mt-2 rounded-2xl border border-border/30 bg-white/80 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.03)] backdrop-blur-xl p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#0077b5]">
          <Linkedin className="h-3.5 w-3.5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold text-foreground">
            Anslut LinkedIn
          </h4>
          <p className="mt-1 text-sm text-muted-foreground">
            {data.message}
          </p>
          <a
            href={data.oauthUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#0077b5] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#006097]"
          >
            <Linkedin className="h-4 w-4" />
            Anslut LinkedIn-konto
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}

