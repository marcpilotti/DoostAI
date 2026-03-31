/**
 * Builder layout — renders inside DashboardShell (sidebar stays).
 * Just passes children through.
 */
export default function BuilderLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
