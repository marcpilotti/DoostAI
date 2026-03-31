/**
 * Builder layout — full screen, no sidebar/topbar.
 * Overrides the dashboard layout for the builder route.
 */
export default function BuilderLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen bg-[var(--doost-bg-secondary)]">
      {children}
    </div>
  );
}
