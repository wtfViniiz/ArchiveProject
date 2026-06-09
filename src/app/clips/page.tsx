import { PageShell } from "@/components/page-shell";
import { prisma } from "@/lib/db";

export const metadata = {
  title: "~/clips — Favela Archive",
  description: "Todos os clipes da Favela Archive.",
};

async function getClips() {
  const clips = await prisma.clip.findMany({
    where: { isApproved: true },
    include: {
      author: { select: { name: true } },
      tags: { select: { name: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return clips;
}

async function getCategories() {
  const categories = await prisma.tag.findMany({
    orderBy: { name: "asc" },
  });

  return categories;
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
    </svg>
  );
}

function BookmarkIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
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

function MessageCircleIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    </svg>
  );
}

export default async function ClipsPage() {
  const clips = await getClips();
  const categories = await getCategories();

  return (
    <PageShell>
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <p className="font-mono text-xs text-primary">$ cd ~/clips</p>
          <h1 className="font-display mt-2 text-5xl sm:text-6xl">Clipes</h1>
          <p className="font-mono mt-3 max-w-2xl text-sm text-muted-foreground">
            <span className="text-primary">&gt;</span> tudo gravado pela crew. curte, comenta, favorita.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <button className="font-mono rounded border border-primary bg-primary px-3 py-1.5 text-xs text-primary-foreground">
              .all
            </button>
            {categories.map((cat) => (
              <button
                key={cat.slug}
                className="font-mono rounded border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                .{cat.name.toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        {clips.length === 0 ? (
          <div className="text-center py-12">
            <p className="font-mono text-muted-foreground">
              Nenhum clip encontrado. Envie clips no Discord!
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {clips.map((clip) => (
              <article
                key={clip.id}
                className="group overflow-hidden rounded-lg border border-border bg-card transition-all hover:-translate-y-0.5 hover:border-primary"
              >
                <div className="relative aspect-video overflow-hidden bg-secondary">
                  <div aria-hidden className="absolute inset-0 grain" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/90 text-primary-foreground transition-transform group-hover:scale-110">
                      <PlayIcon className="h-6 w-6" />
                    </div>
                  </div>
                  {clip.tags[0] && (
                    <span className="font-mono absolute left-3 top-3 rounded bg-background/80 px-2 py-0.5 text-[10px]">
                      .{clip.tags[0].name.toLowerCase()}
                    </span>
                  )}
                  <button
                    aria-label="Favoritar"
                    className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-md bg-background/80 transition-colors hover:text-primary"
                  >
                    <BookmarkIcon className="h-4 w-4" />
                  </button>
                </div>
                <div className="p-4">
                  <h4 className="font-mono truncate text-sm text-foreground transition-colors group-hover:text-primary">
                    {clip.title || "clip-" + clip.id}.mp4
                  </h4>
                  <p className="font-mono mt-1 text-xs text-muted-foreground">
                    @{clip.author?.name || clip.discordUserName}
                  </p>
                  <div className="font-mono mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <HeartIcon className="h-3.5 w-3.5" /> {clip.likeCount}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MessageCircleIcon className="h-3.5 w-3.5" /> {clip.commentCount}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}
