import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { HeroSection } from "@/components/hero-section";
import { prisma } from "@/lib/db";

async function getLatestArticle() {
  const article = await prisma.article.findFirst({
    where: { isDraft: false },
    include: {
      author: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return article;
}

async function getLatestClips() {
  const clips = await prisma.clip.findMany({
    where: { isApproved: true },
    include: {
      author: { select: { name: true } },
      tags: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 4,
  });

  return clips;
}

async function getTags() {
  const tags = await prisma.tag.findMany({
    orderBy: { name: "asc" },
  });

  return tags;
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

function formatDate(date: Date) {
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function Home() {
  const [latestArticle, latestClips, tags] = await Promise.all([
    getLatestArticle(),
    getLatestClips(),
    getTags(),
  ]);

  const tagDescriptions: Record<string, string> = {
    lol: "echo 'os melhores momentos pra rir'",
    legend: "cat clipes/lendarios/*",
    mp3: "play beats, covers e freestyles",
    cringe: "rm -rf —no-preserve-root",
    chaos: "sudo unleash --everything",
    gif: "loop < 15s",
  };

  return (
    <PageShell>
      <HeroSection />

      <section className="mx-auto max-w-6xl px-4 py-16">
        <SectionHeader cmd="cat ~/wiki/@latest.txt" />
        {latestArticle ? (
          <Link
            href={`/wiki/${latestArticle.slug}`}
            className="group mt-8 grid overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-primary md:grid-cols-[1.2fr_2fr]"
          >
            <div className="relative aspect-video bg-card md:aspect-auto">
              <div aria-hidden className="absolute inset-0 glow-soft opacity-60" />
              <div aria-hidden className="absolute inset-0 grain opacity-50" />
              <div className="font-mono absolute bottom-4 left-4 inline-flex items-center gap-2 rounded bg-background/80 px-3 py-1 text-[11px] text-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {latestArticle.slug}.md
              </div>
            </div>
            <div className="p-6 sm:p-8">
              <p className="font-mono text-xs text-muted-foreground">
                {formatDate(latestArticle.createdAt)} · @{latestArticle.author.name}
              </p>
              <h3 className="font-display mt-3 text-3xl text-foreground transition-colors group-hover:text-primary sm:text-4xl">
                {latestArticle.title}
              </h3>
              {latestArticle.excerpt && (
                <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                  {latestArticle.excerpt}
                </p>
              )}
              <span className="font-mono mt-6 inline-flex items-center gap-2 text-sm text-primary">
                <span className="opacity-70">$</span> open ./{latestArticle.slug}.md →
              </span>
            </div>
          </Link>
        ) : (
          <div className="mt-8 rounded-lg border border-dashed border-border p-8 text-center">
            <p className="font-mono text-sm text-muted-foreground">
              Nenhum artigo encontrado. Seja o primeiro a criar!
            </p>
            <Link
              href="/wiki/new"
              className="font-mono mt-4 inline-block rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
            >
              $ touch ~/wiki/novo-artigo.md
            </Link>
          </div>
        )}
      </section>

      <section className="border-t border-border bg-card/30">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <SectionHeader cmd="ls -lt ~/clips/@latest | head -4" />
          {latestClips.length > 0 ? (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {latestClips.map((clip) => (
                <article
                  key={clip.id}
                  className="group overflow-hidden rounded-lg border border-border bg-background transition-all hover:-translate-y-0.5 hover:border-primary"
                >
                  <div className="relative aspect-video overflow-hidden bg-secondary">
                    <div aria-hidden className="absolute inset-0 grain" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/90 text-primary-foreground transition-transform group-hover:scale-110">
                        <PlayIcon className="h-5 w-5" />
                      </div>
                    </div>
                    {clip.tags[0] && (
                      <span className="font-mono absolute left-3 top-3 rounded bg-background/80 px-2 py-0.5 text-[10px] text-foreground">
                        .{clip.tags[0].name.toLowerCase()}
                      </span>
                    )}
                    <button
                      aria-label="Favoritar"
                      className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-md bg-background/80 text-foreground transition-colors hover:text-primary"
                    >
                      <BookmarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="p-4">
                    <h4 className="font-mono truncate text-sm text-foreground transition-colors group-hover:text-primary">
                      {clip.title || `clip-${clip.id}`}.mp4
                    </h4>
                    <p className="font-mono mt-1 text-xs text-muted-foreground">
                      @{clip.author?.name || clip.discordUserName}
                    </p>
                    <div className="font-mono mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><HeartIcon className="h-3.5 w-3.5" /> {clip.likeCount}</span>
                      <span className="inline-flex items-center gap-1"><MessageCircleIcon className="h-3.5 w-3.5" /> {clip.commentCount}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-8 text-center">
              <p className="font-mono text-sm text-muted-foreground">
                Nenhum clip encontrado.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
      <SectionHeader cmd="find ~/clips -type f | grep '\\.(vhs|tape|dat|log|dump)$'" />
        {tags.length > 0 ? (
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tags.map((tag) => (
              <Link
                key={tag.id}
                href="/clips"
                className="group flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary"
              >
                <div className="font-mono flex h-14 w-16 shrink-0 items-center justify-center rounded-md bg-primary/15 text-sm text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  .{tag.name.toLowerCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-display text-xl text-foreground">{tag.name}</h4>
                  <p className="font-mono truncate text-xs text-muted-foreground">
                    {tagDescriptions[tag.name.toLowerCase()] || tag.slug}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-8 text-center">
            <p className="font-mono text-sm text-muted-foreground">
              Nenhuma tag encontrada.
            </p>
          </div>
        )}
      </section>
    </PageShell>
  );
}

function SectionHeader({ cmd }: { cmd: string }) {
  return (
    <div className="flex items-center gap-3 border-b border-border pb-3">
      <span className="font-mono text-sm text-primary">$</span>
      <code className="font-mono text-sm text-foreground sm:text-base">{cmd}</code>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}
