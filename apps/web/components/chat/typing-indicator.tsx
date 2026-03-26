export function TypingIndicator() {
  return (
    <div className="flex items-start gap-2.5">
      <img src="/symbol.svg" alt="" width={28} height={28} className="mt-0.5 h-7 w-7 shrink-0" />
      <div className="flex items-center gap-2 pt-1">
        <div className="flex items-center gap-1">
          <span className="typing-dot h-1.5 w-1.5 rounded-full bg-indigo-400" />
          <span className="typing-dot h-1.5 w-1.5 rounded-full bg-indigo-400 [animation-delay:150ms]" />
          <span className="typing-dot h-1.5 w-1.5 rounded-full bg-indigo-400 [animation-delay:300ms]" />
        </div>
        <span className="text-xs text-muted-foreground/60">skriver...</span>
      </div>
      <span className="sr-only">Doost AI skriver ett svar</span>
    </div>
  );
}
