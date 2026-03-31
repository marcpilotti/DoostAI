"use client";

import { useUser } from "@clerk/nextjs";
import { Sparkles } from "lucide-react";

export function TopBar({ onToggleAI }: { onToggleAI?: () => void }) {
  const { user } = useUser();
  const firstName = user?.firstName ?? user?.fullName?.split(" ")[0] ?? "";

  return (
    <div className="flex h-14 shrink-0 items-center justify-between border-b px-6" style={{ borderColor: "var(--doost-border)" }}>
      <h1 className="text-[15px] font-semibold text-[var(--doost-text)]">
        {firstName ? `Welcome back, ${firstName}` : "Dashboard"}
      </h1>

      {onToggleAI && (
        <button
          onClick={onToggleAI}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--doost-bg-active)] text-white transition-opacity hover:opacity-80"
          title="AI-assistent"
        >
          <Sparkles className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
