"use client";

import Image from "next/image";

export function ChatHeader() {
  return (
    <header className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
      <div className="flex items-center gap-2.5">
        <Image src="/logo.svg" alt="Doost AI" width={120} height={28} className="h-7 w-auto" />
        <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-600">
          Beta
        </span>
      </div>
    </header>
  );
}
