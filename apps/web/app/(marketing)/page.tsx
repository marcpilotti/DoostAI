import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-sm font-bold text-primary-foreground">D</span>
          </div>
          <span className="font-heading text-lg font-bold">Doost AI</span>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/sign-in">Sign In</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/sign-up">Get Started</Link>
          </Button>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="font-heading text-5xl font-bold tracking-tight sm:text-6xl">
            Doost AI
          </h1>
          <p className="mt-4 text-xl text-muted-foreground">
            AI-powered marketing campaigns for Nordic businesses.
            <br />
            From brand analysis to live ads — all through chat.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="bg-[hsl(var(--brand-teal))] text-white hover:bg-[hsl(var(--brand-teal))]/90"
            >
              <Link href="/sign-up">
                Get Started Free
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/sign-in">Sign In</Link>
            </Button>
          </div>
        </div>
      </main>

      <footer className="border-t px-6 py-6 text-center text-sm text-muted-foreground">
        Doost AI
      </footer>
    </div>
  );
}
