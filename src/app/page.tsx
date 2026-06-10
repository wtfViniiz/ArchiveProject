"use client";

import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { HeroSection } from "@/components/hero-section";
import { SpritePreview } from "@/components/sprite-preview";
import { useEffect, useState } from "react";

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  createdAt: string;
  author: { name: string };
}

interface Clip {
  id: string;
  title: string | null;
  videoUrl: string;
  thumbnailUrl: string | null;
  duration: number | null;
  author: { name: string } | null;
  tags: { name: string }[];
  _count: { likes: number; comments: number };
}

interface Tag {
  id: string;
  name: string;
  slug: string;
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
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

function SectionHeader({ cmd }: { cmd: string }) {
  return (
    <div className="flex items-center gap-3 border-b border-border pb-3">
      <span className="font-mono text-sm text-primary">$</span>
      <code className="font-mono text-sm text-foreground sm:text-base">{cmd}</code>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

export default function Home() {
  const [latestArticle, setLatestArticle] = useState<Article | null>(null);
  const [latestClips, setLatestClips] = useState<Clip[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/articles?limit=1").then((r) => r.json()),
      fetch("/api/clips?limit=4").then((r) => r.json()),
      fetch("/api/tags").then((r) => r.json()),
    ]).then(([articlesData, clipsData, tagsData]) => {
      setLatestArticle(articlesData[0] || null);
      setLatestClips(clipsData.clips || []);
      setTags(tagsData || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <PageShell>
      <HeroSection />

      {/* LATEST ARTICLE */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <SectionHeader cmd="cat ~/wiki/latest.md" />
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
                {new Date(latestArticle.createdAt).toLocaleDateString("pt-BR")} · @{latestArticle.author.name}
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
              Nenhum artigo ainda.
            </p>
          </div>
        )}
      </section>

      {/* LATEST CLIPS */}
      <section className="border-t border-border bg-card/30">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <SectionHeader cmd="ls -lt ~/clips/ | head -4" />
          {latestClips.length > 0 ? (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {latestClips.map((clip) => (
                <Link
                  key={clip.id}
                  href={`/clips/${clip.id}`}
                  className="group overflow-hidden rounded-lg border border-border bg-background transition-all hover:-translate-y-0.5 hover:border-primary"
                >
                  <SpritePreview videoUrl={clip.videoUrl}>
                    <div className="relative aspect-video overflow-hidden bg-secondary">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/90 text-primary-foreground transition-transform group-hover:scale-110">
                          <PlayIcon className="h-5 w-5" />
                        </div>
                      </div>
                      {clip.tags[0] && (
                        <span className="font-mono absolute left-3 top-3 rounded bg-background/80 px-2 py-0.5 text-[10px]">
                          .{clip.tags[0].name.toLowerCase()}
                        </span>
                      )}
                    </div>
                  </SpritePreview>
                  <div className="p-4">
                    <h4 className="font-mono truncate text-sm text-foreground transition-colors group-hover:text-primary">
                      {clip.title || "clip"}
                    </h4>
                    <p className="font-mono mt-1 text-xs text-muted-foreground">@{clip.author?.name}</p>
                    <div className="font-mono mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><HeartIcon className="h-3.5 w-3.5" /> {clip._count.likes}</span>
                      <span className="inline-flex items-center gap-1"><MessageCircleIcon className="h-3.5 w-3.5" /> {clip._count.comments}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-8 text-center">
              <p className="font-mono text-sm text-muted-foreground">Nenhum clip ainda.</p>
            </div>
          )}
        </div>
      </section>

      {/* TAGS */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <SectionHeader cmd="find ~/clips -type f | grep '\\.(vhs|tape|dat|log|dump)$'" />
        {tags.length > 0 ? (
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tags.map((tag) => (
              <Link
                key={tag.id}
                href={`/clips?tag=${tag.slug}`}
                className="group flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary"
              >
                <div className="font-mono flex h-14 w-16 shrink-0 items-center justify-center rounded-md bg-primary/15 text-sm text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  .{tag.name.toLowerCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-display text-xl text-foreground">{tag.name}</h4>
                  <p className="font-mono truncate text-xs text-muted-foreground">
                    {tag.slug}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-8 text-center">
            <p className="font-mono text-sm text-muted-foreground">Nenhuma tag encontrada.</p>
          </div>
        )}
      </section>
    </PageShell>
  );
}
