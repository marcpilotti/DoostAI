export function TypingIndicator() {
  return (
    <div className="flex items-start gap-3">
      <img src="/symbol.svg" alt="" width={28} height={28} className="h-7 w-7 shrink-0" />
      <div className="flex items-center gap-1 pt-2">
        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-muted-foreground/50 [animation-delay:150ms]" />
        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-muted-foreground/50 [animation-delay:300ms]" />
      </div>
    </div>
  );
}
