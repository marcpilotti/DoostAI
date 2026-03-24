export function TypingIndicator() {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
        <span className="text-[10px] font-bold text-white">D</span>
      </div>
      <div className="flex items-center gap-1 pt-2">
        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-muted-foreground/50 [animation-delay:150ms]" />
        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-muted-foreground/50 [animation-delay:300ms]" />
      </div>
    </div>
  );
}
