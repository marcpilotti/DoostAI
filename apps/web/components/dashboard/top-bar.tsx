"use client";

import { useUser } from "@clerk/nextjs";
import { Bell, Sparkles } from "lucide-react";

export function TopBar({ onToggleAI }: { onToggleAI?: () => void }) {
  const { user } = useUser();
  const firstName = user?.firstName ?? user?.fullName?.split(" ")[0] ?? "";

  return (
    <div className="flex h-14 shrink-0 items-center justify-between border-b px-6" style={{ borderColor: "var(--doost-border)" }}>
      <p className="text-[15px] font-medium text-[var(--doost-text-secondary)]">
        {firstName ? `Välkommen tillbaka, ${firstName}` : "Doost AI"}
      </p>

      <div className="flex items-center gap-2">
        <button
          className="relative flex h-8 w-8 items-center justify-center rounded-lg text-[var(--doost-text-secondary)] hover:bg-[var(--doost-bg-secondary)]"
          aria-label="Notiser (3 olästa)"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[var(--doost-bg-active)]" />
        </button>

        {onToggleAI && (
          <button
            onClick={onToggleAI}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--doost-bg-active)] text-white transition-opacity hover:opacity-80"
            aria-label="Öppna AI-assistent"
            title="AI-assistent"
          >
            <Sparkles className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
