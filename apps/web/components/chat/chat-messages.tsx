"use client";

import { useEffect, useRef } from "react";
import type { UIMessage } from "ai";

import {
  BrandProfileCard,
  BrandProfileLoading,
} from "@/components/brand/brand-profile-card";

import { TypingIndicator } from "./typing-indicator";

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

function ToolInvocation({ part }: { part: ToolPart }) {
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
}: {
  messages: UIMessage[];
  isLoading: boolean;
}) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div className="h-full overflow-y-auto px-6 py-6">
      <div className="mx-auto max-w-2xl space-y-6">
        {messages.map((message) => {
          if (message.role === "user") {
            const text = getMessageText(message);
            if (!text) return null;
            return (
              <div key={message.id} className="flex justify-end">
                <div className="max-w-[80%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm leading-relaxed text-primary-foreground">
                  {text}
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
            <div key={message.id} className="flex items-start gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
                <span className="text-[10px] font-bold text-white">D</span>
              </div>
              <div className="min-w-0 max-w-[85%] space-y-2">
                {textParts.map((part, i) =>
                  part.text.trim() ? (
                    <div
                      key={i}
                      className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90"
                    >
                      {part.text}
                    </div>
                  ) : null,
                )}
                {toolParts.map((part, i) => (
                  <ToolInvocation key={part.toolCallId ?? `tool-${i}`} part={part} />
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
