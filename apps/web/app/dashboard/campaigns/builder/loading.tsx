export default function BuilderLoading() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--doost-text-muted)] border-t-[var(--doost-text)]" />
        <p className="text-[13px] text-[var(--doost-text-muted)]">
          Laddar kampanjbyggaren...
        </p>
      </div>
    </div>
  );
}
