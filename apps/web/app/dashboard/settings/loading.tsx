export default function Loading() {
  return (
    <div className="p-6">
      <div className="mb-6 h-5 w-32 animate-pulse rounded bg-[var(--doost-border)]" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-[var(--doost-radius-card)] bg-[var(--doost-bg)]" style={{ border: "1px solid var(--doost-border)" }} />
        ))}
      </div>
    </div>
  );
}
