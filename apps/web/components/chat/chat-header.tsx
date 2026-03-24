"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { LayoutDashboard } from "lucide-react";

export function ChatHeader() {
  return (
    <header className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-sm">
          <span className="text-sm font-bold text-white">D</span>
        </div>
        <span className="font-heading text-lg font-semibold tracking-tight">
          Doost AI
        </span>
        <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-600">
          Beta
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard"
          className="flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LayoutDashboard className="h-4 w-4" />
          <span className="hidden sm:inline">Dashboard</span>
        </Link>
        <UserButton
          appearance={{
            elements: { avatarBox: "h-8 w-8" },
          }}
        />
      </div>
    </header>
  );
}
