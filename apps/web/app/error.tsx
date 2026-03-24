"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h2 className="font-heading text-2xl font-bold">Något gick fel</h2>
      <p className="max-w-md text-muted-foreground">
        Ett oväntat fel uppstod. Vårt team har meddelats.
      </p>
      <Button onClick={reset}>Försök igen</Button>
    </div>
  );
}
