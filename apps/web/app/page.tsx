"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";

import { ChatHeader } from "@/components/chat/chat-header";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatMessages } from "@/components/chat/chat-messages";
import { ProgressBreadcrumb } from "@/components/chat/progress-breadcrumb";
import { SuggestionChips, getSuggestionsForStep } from "@/components/chat/suggestion-chips";
import { useFlowProgress } from "@/hooks/use-flow-progress";

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
            <span className="block font-sketch text-[44px] text-foreground/80 sm:text-[60px]">
              Skippa byrån.
            </span>
            <span className="mt-1 block font-grotesk text-[26px] font-medium tracking-tight text-[#6366f1] sm:text-[36px]">
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
          <div className="mx-auto w-full max-w-2xl px-4 sm:px-6">
            {!isLoading && messages.length > 0 && !input && (
              <SuggestionChips
                suggestions={getSuggestionsForStep(flowStep)}
                onSelect={(msg) => sendMessage({ text: msg })}
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
