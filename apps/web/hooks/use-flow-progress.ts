"use client";

import { useMemo } from "react";
import type { UIMessage } from "ai";

import type { FlowStep } from "@/components/chat/progress-breadcrumb";

function hasToolInMessages(
  messages: UIMessage[],
  toolName: string,
  state: string = "output-available",
): boolean {
  return messages.some((m) =>
    m.parts.some((p) => {
      if (p.type === "dynamic-tool" || (typeof p.type === "string" && p.type.startsWith("tool-"))) {
        const tp = p as unknown as { toolName?: string; state?: string };
        return tp.toolName === toolName && tp.state === state;
      }
      return false;
    }),
  );
}

export function useFlowProgress(messages: UIMessage[]): FlowStep {
  return useMemo(() => {
    if (messages.length === 0) return "url";

    const hasBrand = hasToolInMessages(messages, "analyze_brand");
    const hasChannels = hasToolInMessages(messages, "show_channel_picker");
    const hasCopy =
      hasToolInMessages(messages, "generate_ad_copy") ||
      hasToolInMessages(messages, "generate_ads");
    const hasDeploy = hasToolInMessages(messages, "deploy_campaign");

    // Check if any deploy result has status "live"
    const isLive = messages.some((m) =>
      m.parts.some((p) => {
        if (p.type === "dynamic-tool" || (typeof p.type === "string" && p.type.startsWith("tool-"))) {
          const tp = p as unknown as { toolName?: string; state?: string; output?: { platforms?: Array<{ status: string }> } };
          if (tp.toolName === "deploy_campaign" && tp.state === "output-available") {
            return tp.output?.platforms?.some((pl) => pl.status === "live" || pl.status === "deploying");
          }
        }
        return false;
      }),
    );

    if (isLive) return "live";
    if (hasDeploy) return "publicera";
    if (hasCopy) return "granska";
    if (hasChannels || hasBrand) return "annonser";
    if (hasBrand) return "profil";
    return "url";
  }, [messages]);
}
