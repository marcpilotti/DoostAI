"use client";

import Image from "next/image";
import { LogIn, MessageSquare, BarChart3, LineChart, User } from "lucide-react";

export function ChatHeader({ authenticated = false }: { authenticated?: boolean }) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border/20 bg-background/80 px-4 py-3 backdrop-blur-md sm:px-6 sm:py-4">
      <div className="flex items-center gap-2.5">
        <Image src="/logo.svg" alt="Doost AI" width={120} height={28} className="h-7 w-auto" />
        <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-indigo-600">
          Beta
        </span>
      </div>

      {authenticated ? (
        <nav className="flex items-center gap-1">
          <button className="flex items-center gap-1.5 rounded-lg bg-indigo-50/80 px-3 py-1.5 text-xs font-medium text-indigo-600">
            <MessageSquare className="h-3 w-3" />
            Chatt
          </button>
          <button className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground">
            <BarChart3 className="h-3 w-3" />
            Kampanjer
          </button>
          <button className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground">
            <LineChart className="h-3 w-3" />
            Analys
          </button>
          <button className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground">
            <User className="h-3 w-3" />
            Profil
          </button>
        </nav>
      ) : (
        <button className="rounded-full border border-border/40 px-4 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:border-foreground/20 hover:text-foreground">
          Logga in
        </button>
      )}
    </header>
  );
}
