"use client";

import { ExternalLink, Linkedin } from "lucide-react";

type LinkedInConnectData = {
  oauthUrl: string;
  message: string;
};

export function LinkedInConnect({ data }: { data: LinkedInConnectData }) {
  return (
    <div className="mt-1 rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0077b5]">
          <Linkedin className="h-5 w-5 text-white" />
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

