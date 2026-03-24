import { TrendingUp } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
        <TrendingUp className="h-8 w-8 text-muted-foreground" />
      </div>
      <div className="text-center">
        <h1 className="font-heading text-2xl font-bold">Analys</h1>
        <p className="mt-1 text-muted-foreground">
          Prestandaöversikt kommer snart.
        </p>
      </div>
    </div>
  );
}
