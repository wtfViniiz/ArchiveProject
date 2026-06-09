import { PageShell } from "@/components/page-shell";
import { prisma } from "@/lib/db";

export const metadata = {
  title: "~/memories — Favela Archive",
  description: "Momentos históricos da Favela Archive.",
};

async function getMemories() {
  const memories = await prisma.memory.findMany({
    include: {
      featuredByUser: { select: { name: true } },
      article: { select: { title: true, slug: true } },
      clip: { select: { title: true } },
    },
    orderBy: { eventDate: "desc" },
  });

  return memories;
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" />
    </svg>
  );
}

function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}

const typeIcons = {
  EVENT: CalendarIcon,
  MILESTONE: TrophyIcon,
  HIGHLIGHT: StarIcon,
  ANNIVERSARY: HeartIcon,
  OTHER: StarIcon,
};

const typeLabels = {
  EVENT: "Evento",
  MILESTONE: "Marco",
  HIGHLIGHT: "Destaque",
  ANNIVERSARY: "Aniversário",
  OTHER: "Outro",
};

export default async function MemoriesPage() {
  const memories = await getMemories();

  return (
    <PageShell>
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <p className="font-mono text-xs text-primary">$ cd ~/memories</p>
          <h1 className="font-display mt-2 text-5xl sm:text-6xl">Memórias</h1>
          <p className="font-mono mt-3 max-w-2xl text-sm text-muted-foreground">
            <span className="text-primary">&gt;</span> os momentos que marcaram a comunidade.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        {memories.length === 0 ? (
          <div className="text-center py-12">
            <p className="font-mono text-muted-foreground">
              Nenhuma memória registrada ainda.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {memories.map((memory) => {
              const Icon = typeIcons[memory.type];
              return (
                <article
                  key={memory.id}
                  className="rounded-lg border border-border bg-card p-6 transition-colors hover:border-primary"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-mono rounded bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
                          {typeLabels[memory.type]}
                        </span>
                        <span className="font-mono text-xs text-muted-foreground">
                          {new Date(memory.eventDate).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <h3 className="font-display text-xl text-foreground mb-2">
                        {memory.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {memory.content}
                      </p>
                      <div className="font-mono mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                        <span>por @{memory.featuredByUser.name}</span>
                        {memory.article && (
                          <a
                            href={`/wiki/${memory.article.slug}`}
                            className="text-primary hover:underline"
                          >
                            ver artigo →
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </PageShell>
  );
}
