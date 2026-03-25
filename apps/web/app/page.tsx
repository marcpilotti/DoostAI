"use client";

import { useEffect, useState } from "react";
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
  const [toast, setToast] = useState<string | null>(null);
  const { messages, sendMessage, status } = useChat({
    onError: (err) => {
      setError(err.message ?? "Något gick fel. Försök igen.");
    },
  });

  // Handle OAuth callback query params
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("linkedin_connected") === "true") {
      setToast("LinkedIn anslutet! Ditt konto är redo att användas.");
      window.history.replaceState({}, "", "/");
    }
    if (params.get("meta_connected") === "true") {
      setToast("Meta anslutet!");
      window.history.replaceState({}, "", "/");
    }
    if (params.get("google_connected") === "true") {
      setToast("Google Ads anslutet!");
      window.history.replaceState({}, "", "/");
    }
  }, []);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(t);
    }
  }, [toast]);

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
      <div className="shrink-0">
        <ChatHeader />
        {!isEmpty && <ProgressBreadcrumb currentStep={flowStep} />}
      </div>

      {isEmpty ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 pb-6">
          <h1 className="text-center font-sketch text-[32px] leading-tight text-foreground/80 sm:text-[42px]">
            Skippa byrån.
          </h1>
          <div className="mt-6 w-full max-w-xl">
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
          <div className="mx-auto w-full max-w-xl px-4 sm:px-6">
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
        <div className="mx-auto mb-4 flex max-w-xl items-center gap-2 rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="text-xs font-medium underline">Stäng</button>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 mx-4 max-w-[calc(100vw-2rem)] -translate-x-1/2 animate-message-in rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-medium text-emerald-700 shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
