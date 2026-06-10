import { Suspense } from "react";
import { PageShell } from "@/components/page-shell";
import { ClipsPageClient } from "@/components/clips-page-client";

export const metadata = {
  title: "~/clips — Favela Archive",
  description: "Todos os clipes da Favela Archive.",
};

export default function ClipsPage() {
  return (
    <PageShell>
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <p className="font-mono text-xs text-primary">$ cd ~/clips</p>
          <h1 className="font-display mt-2 text-5xl sm:text-6xl">Clipes</h1>
          <p className="font-mono mt-3 max-w-2xl text-sm text-muted-foreground">
            <span className="text-primary">&gt;</span> tudo gravado pela crew. curte, comenta, favorita.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <Suspense fallback={
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-border bg-card overflow-hidden animate-pulse">
                <div className="aspect-video bg-secondary" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-secondary rounded w-3/4" />
                  <div className="h-3 bg-secondary rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        }>
          <ClipsPageClient />
        </Suspense>
      </section>
    </PageShell>
  );
}
