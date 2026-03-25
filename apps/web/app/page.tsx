"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";

import { ChatHeader } from "@/components/chat/chat-header";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatMessages } from "@/components/chat/chat-messages";
import { ProgressBreadcrumb } from "@/components/chat/progress-breadcrumb";
import { SuggestionChips } from "@/components/chat/suggestion-chips";
import { useFlowProgress } from "@/hooks/use-flow-progress";

function getSuggestions(messages: Array<{ role: string; parts: Array<{ type: string; [key: string]: unknown }> }>): string[] {
  if (messages.length === 0) return [];
  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  if (!lastAssistant) return [];

  const hasToolPart = (name: string) =>
    lastAssistant.parts.some(
      (p) => (p.type === "dynamic-tool" || p.type.startsWith("tool-")) && (p as unknown as { toolName?: string }).toolName === name,
    );

  if (hasToolPart("analyze_brand")) {
    return [];
  }
  if (hasToolPart("show_channel_picker")) {
    return [];
  }
  if (hasToolPart("generate_ad_copy") || hasToolPart("generate_ads")) {
    return ["Ser bra ut — publicera!", "Gör rubriken kortare", "Prova en annan mall", "Mer professionell ton", "Ändra CTA"];
  }
  if (hasToolPart("deploy_campaign")) {
    return ["Hur går mina annonser?", "Skapa ny kampanj", "Pausa alla kampanjer"];
  }

  const text = lastAssistant.parts
    .filter((p) => p.type === "text")
    .map((p) => (p as unknown as { text: string }).text)
    .join("");

  if (text.includes("kanal") || text.includes("plattform")) {
    return ["Meta + Google + LinkedIn", "Bara Meta", "Meta + Google", "Bara Google"];
  }
  if (text.includes("budget")) {
    return ["500 kr/dag", "1000 kr/dag", "2000 kr/dag"];
  }

  return [];
}

export default function Home() {
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { messages, sendMessage, status } = useChat({
    onError: (err) => {
      setError(err.message ?? "Något gick fel. Försök igen.");
    },
  });

  const isLoading = status === "submitted" || status === "streaming";
  const flowStep = useFlowProgress(messages);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    sendMessage({ text: trimmed });
    setInput("");
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex h-screen flex-col bg-background">
      <ChatHeader />

      {!isEmpty && <ProgressBreadcrumb currentStep={flowStep} />}

      {isEmpty ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 pb-8">
          <h1 className="text-center leading-tight">
            <span className="block font-sketch text-[38px] text-foreground sm:text-[52px]">
              Skippa byrån.
            </span>
            <span className="block font-display text-[26px] font-bold tracking-tight text-[#6366f1] sm:text-[38px]">
              Bygg din kampanj!
            </span>
          </h1>
          <div className="mt-8 w-full max-w-2xl">
            <ChatInput
              input={input}
              onInputChange={setInput}
              onSubmit={handleSubmit}
              isLoading={isLoading}
            />
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-hidden">
            <ChatMessages
              messages={messages}
              isLoading={isLoading}
              onSendMessage={(text) => {
                sendMessage({ text });
              }}
            />
          </div>
          <div className="mx-auto w-full max-w-2xl">
            {!isLoading && messages.length > 0 && (
              <SuggestionChips
                suggestions={getSuggestions(messages)}
                onSelect={(text) => sendMessage({ text })}
              />
            )}
          </div>
          <ChatInput
            input={input}
            onInputChange={setInput}
            onSubmit={handleSubmit}
            isLoading={isLoading}
          />
        </>
      )}

      {error && (
        <div className="mx-auto mb-4 flex max-w-2xl items-center gap-2 rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">
          <span className="flex-1">{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-xs font-medium underline"
          >
            Stäng
          </button>
        </div>
      )}
    </div>
  );
}
