"use client";

import Image from "next/image";

export function ChatHeader() {
  return (
    <header className="flex items-center justify-between px-4 py-0.5 sm:px-5 sm:py-1">
      <div className="flex items-center gap-1.5">
        <Image src="/logo.svg" alt="Doost AI" width={80} height={18} className="h-3.5 w-auto" />
        <span className="rounded-full bg-indigo-50 px-1.5 py-px text-[7px] font-semibold uppercase tracking-wider text-indigo-600">
          Beta
        </span>
      </div>
    </header>
  );
}
