"use client";

import Image from "next/image";

export function ChatHeader() {
  return (
    <header className="flex items-center justify-between px-4 py-1.5 sm:px-6 sm:py-2">
      <div className="flex items-center gap-2">
        <Image src="/logo.svg" alt="Doost AI" width={100} height={22} className="h-5 w-auto" />
        <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-wider text-indigo-600">
          Beta
        </span>
      </div>
    </header>
  );
}
