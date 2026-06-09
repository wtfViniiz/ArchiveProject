import type { ReactNode } from "react";
import { SiteHeader } from "./site-header";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main>{children}</main>
      <footer className="border-t border-border bg-background py-10">
        <div className="mx-auto max-w-6xl px-4 text-center text-xs text-muted-foreground">
          <p className="flex items-baseline justify-center gap-1">
            <span className="font-favela text-sm">Favela</span>
            <span className="font-archive text-xs text-primary">Archive</span>
          </p>
          <p className="mt-2">By vinicao sem ão.</p>
        </div>
      </footer>
    </div>
  );
}
