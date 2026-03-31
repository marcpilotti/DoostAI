import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auth check removed — Clerk middleware handles protection.
  // This layout just wraps content in the shell.
  return <DashboardShell>{children}</DashboardShell>;
}
