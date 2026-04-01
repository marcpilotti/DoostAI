"use client";

import { CheckCircle2, ExternalLink, RefreshCw } from "lucide-react";
import { useEffect } from "react";

import { useToast } from "@/components/ui/toast";
import { MOCK_INTEGRATIONS } from "@/lib/mock-data";

const OAUTH_URLS: Record<string, string> = {
  meta: "/api/platforms/meta/callback",
  google: "/api/platforms/google/callback",
  linkedin: "/api/platforms/linkedin/callback",
};

export default function IntegrationsPage() {
  useEffect(() => { document.title = "Integrations — Doost AI"; }, []);
  const toast = useToast();

  function handleConnect(platform: string, label: string) {
    const url = OAUTH_URLS[platform];
    if (!url) return;

    if (platform === "linkedin") {
      window.open(url, "_blank", "noopener,noreferrer");
      toast.info("LinkedIn auth opened", "Complete the connection in the new tab");
    } else {
      window.location.href = url;
      toast.info("Redirecting...", `Connecting to ${label}`);
    }
  }

  return (
    <div className="p-6">
      <h2 className="mb-6 text-[18px] font-semibold text-[var(--doost-text)]">Integrations</h2>

      <div className="space-y-3">
        {MOCK_INTEGRATIONS.map((i) => (
          <div key={i.id} className="flex items-center gap-4 rounded-[var(--doost-radius-card)] bg-[var(--doost-bg)] p-4" style={{ border: `1px solid var(--doost-border)` }}>
            {/* Platform icon */}
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white ${
              i.platform === "meta" ? "bg-[#0081FB]" : i.platform === "google" ? "bg-[#4285F4]" : "bg-[#0A66C2]"
            }`}>
              <span className="text-[12px] font-bold">{i.platform === "meta" ? "M" : i.platform === "google" ? "G" : "in"}</span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-semibold text-[var(--doost-text)]">{i.label}</div>
              {i.accountName && (
                <div className="text-[12px] text-[var(--doost-text-secondary)]">{i.accountName}</div>
              )}
            </div>

            {/* Status */}
            <div className="flex items-center gap-3">
              {i.lastSync && (
                <span className="flex items-center gap-1 text-[11px] text-[var(--doost-text-muted)]">
                  <RefreshCw className="h-3 w-3" /> {i.lastSync}
                </span>
              )}
              {i.status === "connected" ? (
                <span className="flex items-center gap-1 text-[12px] font-medium text-[var(--doost-text-positive)]">
                  <CheckCircle2 className="h-4 w-4" /> Connected
                </span>
              ) : (
                <button
                  onClick={() => handleConnect(i.platform, i.label)}
                  className="flex items-center gap-1.5 rounded-lg bg-[var(--doost-bg-active)] px-3 py-1.5 text-[12px] font-medium text-white hover:opacity-90"
                >
                  Connect <ExternalLink className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
