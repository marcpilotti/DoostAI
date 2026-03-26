"use client";

import { lazy, Suspense, useEffect, useRef } from "react";
import type { UIMessage } from "ai";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import {
  BrandProfileLoading,
} from "@/components/brand/brand-profile-card";

import { TypingIndicator } from "./typing-indicator";

// Lazy-load heavy components — only loaded when their tool results render
const CampaignConfigCard = lazy(() => import("@/components/ads/campaign-config-card").then(m => ({ default: m.CampaignConfigCard })));
const CopyPreviewCard = lazy(() => import("@/components/ads/copy-preview-card").then(m => ({ default: m.CopyPreviewCard })));
const CampaignDeploymentStatus = lazy(() => import("@/components/ads/campaign-deployment-status").then(m => ({ default: m.CampaignDeploymentStatus })));
const LinkedInConnect = lazy(() => import("@/components/ads/linkedin-connect").then(m => ({ default: m.LinkedInConnect })));
const UpgradePrompt = lazy(() => import("@/components/ads/upgrade-prompt").then(m => ({ default: m.UpgradePrompt })));
const BrandProfileCard = lazy(() => import("@/components/brand/brand-profile-card").then(m => ({ default: m.BrandProfileCard })));
const ChannelPicker = lazy(() => import("./channel-picker").then(m => ({ default: m.ChannelPicker })));
const OnboardingCards = lazy(() => import("./onboarding-cards").then(m => ({ default: m.OnboardingCards })));

function getMessageText(message: UIMessage): string {
  return message.parts
    .filter(
      (part): part is { type: "text"; text: string } => part.type === "text",
    )
    .map((part) => part.text)
    .join("");
}

type ToolPart = {
  type: string;
  toolName: string;
  toolCallId: string;
  state: string;
  input?: unknown;
  output?: unknown;
};

function isToolPart(part: { type: string }): part is ToolPart {
  return part.type === "dynamic-tool" || part.type.startsWith("tool-");
}

function ToolInvocation({
  part,
  onSendMessage,
}: {
  part: ToolPart;
  onSendMessage?: (text: string) => void;
}) {
  const name = part.toolName ?? part.type.replace("tool-", "");

  if (name === "analyze_brand") {
    if (part.state === "output-available" && part.output) {
      return (
        <BrandProfileCard
          data={part.output as Parameters<typeof BrandProfileCard>[0]["data"]}
        />
      );
    }
    return <BrandProfileLoading />;
  }

  if (name === "show_onboarding") {
    if (part.state === "output-available" && part.output) {
      const output = part.output as { hasLogo: boolean; companyName: string; logos: { primary?: string; icon?: string; dark?: string } };
      return (
        <OnboardingCards
          data={output}
          onAllComplete={() => {
            onSendMessage?.("Onboarding klar");
          }}
        />
      );
    }
    return (
      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
        <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-500" />
        Förbereder onboarding...
      </div>
    );
  }

  if (name === "show_channel_picker") {
    if (part.state === "output-available" && part.output) {
      return (
        <ChannelPicker
          data={part.output as Parameters<typeof ChannelPicker>[0]["data"]}
          onSelect={(channels) => {
            const labels: Record<string, string> = {
              meta: "Meta",
              google: "Google",
              linkedin: "LinkedIn",
            };
            const text = channels.map((c) => labels[c] ?? c).join(", ");
            onSendMessage?.(`Skapa annonser för ${text}`);
          }}
        />
      );
    }
    return null;
  }

  if (name === "generate_ad_copy" || name === "generate_ads") {
    if (part.state === "output-available" && part.output) {
      return (
        <CopyPreviewCard
          data={part.output as Parameters<typeof CopyPreviewCard>[0]["data"]}
          onSendMessage={onSendMessage}
        />
      );
    }
    return (
      <div className="mt-3 animate-pulse rounded-2xl border border-border/40 bg-white/70 p-5 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-pink-200 to-purple-200" />
          <div className="space-y-1">
            <div className="h-3 w-28 rounded bg-muted/60" />
            <div className="h-2 w-40 rounded bg-muted/40" />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="aspect-[4/5] rounded-xl bg-muted/30" />
          <div className="aspect-[4/5] rounded-xl bg-muted/30" />
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-purple-500" />
          Skapar annonsförslag...
        </div>
      </div>
    );
  }

  if (name === "show_campaign_config") {
    if (part.state === "output-available" && part.output) {
      return (
        <CampaignConfigCard
          data={part.output as Parameters<typeof CampaignConfigCard>[0]["data"]}
          onSubmit={(config) => {
            onSendMessage?.(
              `Publicera: ${config.dailyBudget} ${config.currency}/dag, ${config.duration} dagar, ${config.regions.join(", ")}`,
            );
          }}
        />
      );
    }
    return (
      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
        <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
        Förbereder kampanjinställningar...
      </div>
    );
  }

  if (name === "connect_linkedin") {
    if (part.state === "output-available" && part.output) {
      return (
        <LinkedInConnect
          data={part.output as Parameters<typeof LinkedInConnect>[0]["data"]}
        />
      );
    }
    return (
      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
        <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#0077b5]" />
        Förbereder LinkedIn-anslutning...
      </div>
    );
  }

  if (name === "deploy_campaign") {
    if (part.state === "output-available" && part.output) {
      return (
        <CampaignDeploymentStatus
          data={
            part.output as Parameters<
              typeof CampaignDeploymentStatus
            >[0]["data"]
          }
        />
      );
    }
    return (
      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
        <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
        Publicerar kampanj...
      </div>
    );
  }

  if (name === "check_plan") {
    if (part.state === "output-available" && part.output) {
      const result = part.output as { type: string; allowed: boolean; reason?: string; suggestedPlan?: string; currentPlan?: string };
      if (result.type === "upgrade_required") {
        return (
          <UpgradePrompt
            data={{
              reason: result.reason ?? "Plangräns nådd.",
              suggestedPlan: result.suggestedPlan ?? "pro",
              currentPlan: result.currentPlan ?? "free",
            }}
          />
        );
      }
      return null; // OK — AI will proceed
    }
    return (
      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
        <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-500" />
        Kontrollerar plangränser...
      </div>
    );
  }

  if (name === "check_platform_status") {
    if (part.state === "output-available") {
      // AI will summarize — no special UI needed
      return null;
    }
    return (
      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
        <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-500" />
        Kontrollerar plattformsanslutningar...
      </div>
    );
  }

  // Fallback for unknown tools
  if (part.state === "output-available") {
    return (
      <div className="mt-1 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
        Tool result: {name}
      </div>
    );
  }
  return (
    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
      <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
      Running {name}...
    </div>
  );
}

export function ChatMessages({
  messages,
  isLoading,
  onSendMessage,
}: {
  messages: UIMessage[];
  isLoading: boolean;
  onSendMessage?: (text: string) => void;
}) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div className="h-full overflow-y-auto px-4 pt-8 pb-24 sm:px-6">
      <div className="mx-auto max-w-2xl space-y-5">
        {messages.map((message) => {
          if (message.role === "user") {
            const text = getMessageText(message);
            if (!text) return null;
            // Hide system-triggered messages from display
            const hidden = ["Onboarding klar", "Gå vidare till kampanjinställningar"];
            if (hidden.some((h) => text.trim() === h)) return null;
            return (
              <div key={message.id} className="animate-message-in flex items-start justify-end gap-2">
                <div className="max-w-[72%] rounded-2xl rounded-br-md border border-indigo-100 bg-indigo-50/80 px-4 py-2.5 text-sm leading-relaxed text-foreground sm:max-w-[60%]">
                  {text}
                </div>
                <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-semibold text-indigo-600">
                  Du
                </div>
              </div>
            );
          }

          // Assistant message — render all parts
          const textParts = message.parts.filter((p) => p.type === "text") as {
            type: "text";
            text: string;
          }[];
          const toolParts = message.parts.filter(isToolPart) as ToolPart[];
          const hasContent = textParts.some((p) => p.text.trim()) || toolParts.length > 0;

          if (!hasContent) return null;

          return (
            <div key={message.id} className="animate-message-in flex items-start gap-2.5">
              <img src="/symbol.svg" alt="" width={28} height={28} className="mt-0.5 h-7 w-7 shrink-0" aria-hidden />
              <div className="relative min-w-0 max-w-full space-y-1.5 pl-3 before:absolute before:left-0 before:top-1 before:bottom-1 before:w-0.5 before:rounded-full before:bg-gradient-to-b before:from-indigo-400/30 before:to-transparent">
                {textParts.map((part, i) =>
                  part.text.trim() ? (
                    <div
                      key={i}
                      className="prose prose-sm prose-neutral max-w-none text-foreground/90 [&_p]:leading-relaxed [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_strong]:font-semibold [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1"
                    >
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {part.text}
                      </ReactMarkdown>
                    </div>
                  ) : null,
                )}
                {toolParts.map((part, i) => (
                  <Suspense key={part.toolCallId ?? `tool-${i}`} fallback={<div className="h-8" />}>
                    <ToolInvocation part={part} onSendMessage={onSendMessage} />
                  </Suspense>
                ))}
              </div>
            </div>
          );
        })}
        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <TypingIndicator />
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}
